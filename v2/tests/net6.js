'use strict';
// Deux instances du jeu reliées par un faux réseau (latence simulée) : vérifie la synchro lockstep.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync((process.env.GAME || require('path').join(__dirname, '.build', 'index.html')), 'utf8');
const code = html.split('<script>').pop().split('</script>')[0];
const LAT = +process.argv[2] || 3;      // latence en images (aller simple)
const FRAMES = +process.argv[3] || 3000;
const JITTER = +process.argv[4] || 0;
const mkCtx = () => new Proxy({}, { get(t, k) { if (k === 'createLinearGradient') return () => ({ addColorStop() {} }); if (k in t) return t[k]; return () => {}; }, set(t, k, v) { t[k] = v; return true; } });

const registry = {};      // id -> Peer
let clock = 0;            // images globales
const pending = [];       // messages en transit {at, fn}
const deliver = fn => pending.push({ at: clock + LAT + Math.floor(Math.random() * (JITTER + 1)), fn });


const LOSS = +process.argv[5] || 0, FAIL1 = process.env.FAIL1 === '1';
const subs = [];   // {ws, topic}
class WS {
  constructor(url) {
    this.url = url; this.readyState = 0; this.binaryType = 'arraybuffer';
    if (FAIL1 && url.includes('8084')) { deliver(() => this.onerror && this.onerror()); return; }
    deliver(() => { this.readyState = 1; this.onopen && this.onopen(); });
  }
  recv(arr) { deliver(() => { if (this.readyState === 1 && this.onmessage) this.onmessage({ data: Uint8Array.from(arr).buffer }); }); }
  send(data) {
    const b = Array.from(data);
    deliver(() => {
      const type = b[0] >> 4;
      let i = 1, rl = 0, mul = 1; for (;;) { const d = b[i++]; rl += (d & 127) * mul; mul *= 128; if (!(d & 128)) break; }
      const body = b.slice(i, i + rl);
      if (type === 1) this.recv([0x20, 2, 0, 0]);
      else if (type === 8) { const tl = (body[2] << 8) | body[3]; const topic = Buffer.from(body.slice(4, 4 + tl)).toString(); subs.push({ ws: this, topic }); this.recv([0x90, 3, body[0], body[1], 0]); }
      else if (type === 3) {
        const tl = (body[0] << 8) | body[1]; const topic = Buffer.from(body.slice(2, 2 + tl)).toString();
        if (LOSS && Math.random() < LOSS) return;
        for (const sb of subs) if (sb.topic === topic && sb.ws.url === this.url && sb.ws.readyState === 1) sb.ws.recv(b);
      }
    });
  }
  close() { this.readyState = 3; }
}

function mkInst() {
  const ctx = mkCtx(); const L = {};
  const sb = {
    document: { createElement: () => ({ getContext: () => mkCtx(), width: 0, height: 0 }), getElementById: () => ({ getContext: () => ctx, addEventListener() {}, focus() {} }) },
    navigator: { getGamepads: () => [] }, performance: { now: () => clock * 1000 / 60 }, requestAnimationFrame: () => {},
    addEventListener: (t, f) => { L[t] = f; }, setTimeout: () => {}, Math, console, Set, Object, Array, Number, String, JSON, WebSocket: WS, TextEncoder, TextDecoder, Uint8Array, Buffer
  };
  sb.window = sb; vm.createContext(sb); vm.runInContext(code, sb);
  const D = sb.__dbg;
  return {
    D, key(c, v) { D.keys[c] = v; },
    tap(c) { D.keys[c] = true; D.step(); D.keys[c] = false; D.step(); },
    type(k) { L.keydown && L.keydown({ code: 'Key' + k.toUpperCase(), key: k, preventDefault() {} }); D.keys['Key' + k.toUpperCase()] = false; }
  };
}
const N = +process.env.PEERS || 3;
const I = []; for (let i = 0; i < N; i++) I.push(mkInst());
const A = I[0];
if (process.env.HK) I.forEach(x => x.D.ev('(function(f){var r=HERO_KEYS.filter(function(k){return f.indexOf(k)<0});HERO_KEYS.splice.apply(HERO_KEYS,[0,HERO_KEYS.length].concat(f,r))})(' + JSON.stringify(process.env.HK.split(',')) + ')'));
if (process.env.SHORTLV) I.forEach(x => x.D.ev('LEVELS[0].waves=[Object.assign({},LEVELS[0].waves[0],{boss:true})]'));
const flush = () => { for (let i = 0; i < pending.length;) { if (pending[i].at <= clock) { const p = pending.splice(i, 1)[0]; p.fn(); } else i++; } };
const SOLO = { l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown', p: 'KeyJ', j: 'Space', s: 'KeyK' };
function drive(In, slot) {
  const s = In.D.snap(); const p = s.ps[slot]; const live = s.list.filter(e => !e[5]);
  Object.values(SOLO).forEach(k => In.key(k, false));
  if (!p || p.out || p.dying) return;
  if (!live.length) { In.key(SOLO.r, true); return; }
  live.sort((a, b) => Math.abs(a[2] - p.x) + Math.abs(a[3] - p.y) - (Math.abs(b[2] - p.x) + Math.abs(b[3] - p.y)));
  const e = live[0], tx = e[2] + (p.x < e[2] ? -24 : 24), ty = e[3];
  if (tx > p.x + 3) In.key(SOLO.r, true); else if (tx < p.x - 3) In.key(SOLO.l, true);
  if (ty > p.y + 3) In.key(SOLO.d, true); else if (ty < p.y - 3) In.key(SOLO.u, true);
  if (Math.abs(e[2] - p.x) < 34 && Math.abs(e[3] - p.y) < 9) In.key(SOLO.p, Math.random() < .6);
  if (Math.random() < .01) In.key(SOLO.s, true);
  if (Math.random() < .004) In.key(SOLO.j, true);
}
const slotOf = new Map(); slotOf.set(0, 0);
const live = [A];
const tickAll = () => { clock++; flush(); for (const x of live) x.D.step(); flush(); };
const playFor = n => { for (let f = 0; f < n; f++) { live.forEach((x, k) => drive(x, x.D.ev('localSlot'))); tickAll(); } };
A.tap('ArrowDown'); A.tap('Enter');
for (let i = 0; i < 500; i++) tickAll();
console.log('A état', A.D.net().state);
A.tap('KeyJ');
for (let i = 0; i < 60; i++) tickAll();
const code5 = A.D.net().hostCode;
console.log('hôte :', JSON.stringify(A.D.net()).slice(0, 150));
playFor(+(process.env.SOLOF || 600));
for (let k = 1; k < N; k++) {
  const B = I[k];
  B.tap('ArrowDown'); B.tap('Enter');
  live.push(B);
  for (let i = 0; i < 300 + LAT * 40; i++) tickAll();
  console.log('joueur', k, 'état', B.D.net().state, 'slot', B.D.ev('localSlot'), 'roomJoin', B.D.ev('roomJoin'), 'msg', B.D.ev('netMsg'), B.D.ev('waitMsg'));
  for (let t = 0; t < k; t++) B.tap('ArrowRight');
  B.tap('KeyJ');
  for (let i = 0; i < 1500 + LAT * 80; i++) tickAll();
  console.log('après arrivée', k, live.map(x => { const n = x.D.net(); return n.state + '/' + n.frameNo + '/' + n.nPlayers + '/' + n.act.join(''); }).join('  '));
  playFor(+(process.env.MIDF || 400));
}
let mism = 0, stalls = 0;
const FR = FRAMES;
for (let f = 0; f < FR; f++) {
  live.forEach(x => drive(x, x.D.ev('localSlot')));
  tickAll();
  let any = false;
  for (const x of live) { const n = x.D.net(); if (n.stallT > 0) any = true; }
  if (any) stalls++;
  if (live.some(x => x.D.net().state !== 'play')) { console.log('fin de partie à', f, live.map(x => x.D.net().state).join(',')); break; }
}
// comparaison des empreintes à images communes
const H = live.map(x => x.D.ev('myHash'));
let common = 0, diff = 0;
for (const k of Object.keys(H[0])) { if (H.every(h => h[k] !== undefined)) { common++; if (!H.every(h => h[k] === H[0][k])) diff++; } }
console.log('frames :', live.map(x => x.D.net().frameNo).join('/'), '| desync :', live.map(x => x.D.net().desync).join(','), '| empreintes communes', common, 'différentes', diff, '| attente', stalls, '| ping/délai', live.map(x => Math.round(x.D.net().rttMax) + '/' + x.D.net().curDelay).join(' '));
console.log('scores :', JSON.stringify(live[0].D.snap().ps.map(p => p.score)), 'niveau/state', live[0].D.snap().state);

if (process.env.REJOIN) {
  const v = live[live.length - 1]; const vs = v.D.ev('localSlot'), vn = v.D.ev('myName'), vh = v.D.ev('PS[' + vs + '].hero'), vsc = v.D.ev('PS[' + vs + '].score');
  live.pop(); console.log('coupure du slot', vs, 'nom', vn, 'héros', vh, 'score', vsc);
  for (let f = 0; f < 1200; f++) { live.forEach(x => drive(x, x.D.ev('localSlot'))); tickAll(); }
  console.log('après coupure :', live.map(x => { const n = x.D.net(); return n.state + '/' + n.frameNo + '/' + n.act.join('') + '/' + n.desync; }).join('  '), 'out', live[0].D.ev('PS[' + vs + '].out'));
  const R = mkInst(); R.D.ev("myName='" + vn + "'");
  R.tap('ArrowDown'); R.tap('Enter'); live.push(R);
  for (let i = 0; i < 600 + LAT * 40; i++) tickAll();
  console.log('rejoint ? état', R.D.net().state, 'slot', R.D.ev('localSlot'), 'roomJoin', R.D.ev('roomJoin'), 'sel', R.D.ev('SEL[localSlot].c+"/"+SEL[localSlot].lock'), R.D.ev('waitMsg'), R.D.ev('netMsg'));
  for (let i = 0; i < 1500 + LAT * 80; i++) tickAll();
  console.log('après retour :', live.map(x => { const n = x.D.net(); return n.state + '/' + n.frameNo + '/' + n.act.join('') + '/' + n.desync; }).join('  '));
  console.log('slot', vs, 'héros', live[0].D.ev('PS[' + vs + '].hero'), 'out', live[0].D.ev('PS[' + vs + '].out'), 'score', live[0].D.ev('PS[' + vs + '].score'), 'hp', live[0].D.ev('PS[' + vs + '].hp'), 'lives', live[0].D.ev('PS[' + vs + '].lives'));
  for (let f = 0; f < +(process.env.FIGHT||1800); f++) { live.forEach(x => drive(x, x.D.ev('localSlot'))); tickAll(); }
  const H3 = live.map(x => x.D.ev('myHash')); let c3 = 0, d3 = 0;
  for (const k of Object.keys(H3[0])) { if (H3.every(h => h[k] !== undefined)) { c3++; if (!H3.every(h => h[k] === H3[0][k])) d3++; } }
  if (process.env.REJOIN2) {
    const Q = mkInst(); Q.D.ev("myName='ZED'"); Q.tap('ArrowDown'); Q.tap('Enter'); live.push(Q);
    for (let i = 0; i < 400 + LAT * 40; i++) tickAll();
    for (let t2 = 0; t2 < 5; t2++) Q.tap('ArrowRight'); Q.tap('KeyJ');
    for (let i = 0; i < 1500 + LAT * 80; i++) tickAll();
    console.log('4e joueur après retour :', live.map(x => { const n = x.D.net(); return n.state + '/' + n.frameNo + '/' + n.act.join('') + '/' + n.desync; }).join('  '));
    for (let f = 0; f < 1500; f++) { live.forEach(x => drive(x, x.D.ev('localSlot'))); tickAll(); }
    const H4 = live.map(x => x.D.ev('myHash')); let c4 = 0, d4 = 0;
    for (const k of Object.keys(H4[0])) { if (H4.every(h => h[k] !== undefined)) { c4++; if (!H4.every(h => h[k] === H4[0][k])) d4++; } }
    console.log('REJOIN2 :', live.map(x => x.D.net().frameNo + '/' + x.D.net().desync).join(' '), 'communes', c4, 'diff', d4, 'scores', JSON.stringify(live[0].D.snap().ps.map(p => p.score)));
  }
  console.log('REJOIN fin :', live.map(x => { const n = x.D.net(); return n.state + '/' + n.frameNo + '/' + n.desync; }).join('  '), 'communes', c3, 'diff', d3, 'out', live[0].D.ev('PS[' + vs + '].out'));
}
if (process.env.DROP) {
  const v = live[live.length - 1]; live.pop(); console.log('popped slot', v.D.ev('localSlot'), 'tick', v.D.ev('tick'));
  live[0].D.ev(`globalThis.LOG=[]; (function(){const o=netIn; netIn=function(m){ if(m.p===2) LOG.push(m.t+"/"+tick); return o(m)} })()`);
  for (let f = 0; f < 1500; f++) { live.forEach(x => drive(x, x.D.ev('localSlot'))); tickAll(); if (f % 300 === 0) console.log(f, 'A msgs p2:', live[0].D.ev('LOG.length'), 'dead tick', v.D.ev('tick'), 'pend', pending.length); }
  console.log('après départ :', live.map(x => { const n = x.D.net(); return n.state + '/' + n.frameNo + '/' + n.act.join('') + '/' + n.desync; }).join('  '));
  console.log('LOG', live[0].D.ev('JSON.stringify(LOG.slice(-4))'));
  for (const x of live) console.log('dbg', x.D.ev('JSON.stringify({dropAt, act, lr: lastRx.map(v=>tick-v), tick, frameNo, stallT})'));
}
if (process.env.PAUSET) {
  const B = live[1];
  const fr = () => live.map(x => x.D.net().frameNo).join('/');
  console.log('avant pause', fr());
  B.key('Escape', true); tickAll(); B.key('Escape', false); tickAll();
  for (let i = 0; i < 120; i++) tickAll();
  const f1 = fr(); for (let i = 0; i < 120; i++) tickAll(); const f2 = fr();
  console.log('menu ouvert chez B :', f1, '->', f2, 'paused flags', live.map(x => x.D.net().paused).join(','), 'menuOpen B', B.D.ev('menuOpen'));
  B.key('Escape', true); tickAll(); B.key('Escape', false);
  for (let i = 0; i < 120; i++) tickAll();
  console.log('après reprise', fr(), live.map(x => x.D.net().paused).join(','));
}
if (process.env.REMATCH) {
  live.forEach(x => x.D.ev("endGame('over')"));
  for (let i = 0; i < 100; i++) tickAll();
  live.forEach(x => x.tap('Enter'));
  for (let i = 0; i < 60; i++) tickAll();
  console.log('select ?', live.map(x => x.D.net().state).join(','));
  live.forEach((x, k) => { for (let t = 0; t < k * 2; t++) x.tap('ArrowRight'); x.tap('KeyJ'); });
  for (let i = 0; i < 400; i++) tickAll();
  console.log('après rematch', live.map(x => { const n = x.D.net(); return n.state + '/' + n.frameNo + '/' + n.act.join('') + '/' + n.desync; }).join('  '));
  for (let f = 0; f < 600; f++) { live.forEach(x => drive(x, x.D.ev('localSlot'))); tickAll(); }
  const H2 = live.map(x => x.D.ev('myHash')); let c2 = 0, d2 = 0;
  for (const k of Object.keys(H2[0])) { if (H2.every(h => h[k] !== undefined)) { c2++; if (!H2.every(h => h[k] === H2[0][k])) d2++; } }
  console.log('rematch jeu :', live.map(x => x.D.net().frameNo).join('/'), 'communes', c2, 'diff', d2, 'desync', live.map(x => x.D.net().desync).join(','), live.map(x=>x.D.snap().ps.map(p=>p.hero).join('+'))[0]);
}
console.log('niveau', live[0].D.ev('levelIdx'), live[0].D.ev('PS.map(p=>p.xl+"/"+JSON.stringify(p.specs)).join(" | ")'), 'specOn', live.map(x=>x.D.ev('specOn')).join(','));
