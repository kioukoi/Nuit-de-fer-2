'use strict';
// Deux instances du jeu reliées par un faux réseau (latence simulée) : vérifie la synchro lockstep.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('/home/claude/game/index.html', 'utf8');
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
const live = [];
const tickAll = () => { clock++; flush(); for (const x of live) x.D.step(); flush(); };
const run = n => { for (let f = 0; f < n; f++) tickAll(); };
const MODE = process.env.MODE || 'same';      // same : tous visent le même perso ; spread : persos différents
// 1) tous cliquent sur EN LIGNE exactement au même moment
for (const x of I) { live.push(x); }
for (const x of I) { x.D.keys['ArrowDown'] = true; }
tickAll(); for (const x of I) x.D.keys['ArrowDown'] = false; tickAll();
for (const x of I) x.D.keys['Enter'] = true; tickAll(); for (const x of I) x.D.keys['Enter'] = false; tickAll();
run(900);
const st = () => I.map((x, k) => k + ':' + x.D.ev('state') + '/' + x.D.ev('olStage') + '/host=' + x.D.ev('roomPending') + '/online=' + x.D.ev('online') + '/slot=' + x.D.ev('localSlot')).join('  ');
console.log('après recherche :', st());
// 2) ceux qui sont dans l'écran de sélection choisissent en même temps
const pickAll = () => {
  const sel = I.filter(x => x.D.ev('state') === 'select');
  sel.forEach((x, k) => { const n = MODE === 'same' ? 0 : k; for (let t = 0; t < n; t++) { x.D.keys['ArrowRight'] = true; } });
  tickAll(); sel.forEach(x => { x.D.keys['ArrowRight'] = false; }); tickAll();
  sel.forEach(x => { x.D.keys['KeyJ'] = true; }); tickAll(); sel.forEach(x => { x.D.keys['KeyJ'] = false; }); tickAll();
  return sel.length;
};
console.log('en sélection :', pickAll());
run(600);
// ceux qui restent bloqués sur "locked" mais pas partis (même perso visé) : on décale et on revalide, comme un humain
for (let round = 0; round < 16; round++) {
  const sel = I.filter(x => x.D.ev('state') === 'select' || (x.D.ev('state') === 'online'));
  if (!sel.length) break;
  sel.forEach(x => { if (x.D.ev('state') === 'select') { x.D.keys['ArrowRight'] = true; } });
  tickAll(); sel.forEach(x => { x.D.keys['ArrowRight'] = false; }); tickAll();
  sel.forEach(x => { x.D.keys['KeyJ'] = true; }); tickAll(); sel.forEach(x => { x.D.keys['KeyJ'] = false; }); tickAll();
  run(700);
}
console.log('après choix :', st());
for (let f = 0; f < 600; f++) { run(1); }
const heroes = I.map(x => x.D.ev('PS.map(p=>p.absent?"-":p.hero).join(",")'));
const hosts = I.filter(x => x.D.ev('localSlot') === 0 && x.D.ev('online')).length;
const slots = I.map(x => x.D.ev('localSlot'));
console.log('héros vus par chaque machine :', heroes.join(' | '));
console.log('machines en jeu :', I.filter(x => x.D.ev('state') === 'play').length + '/' + I.length, '· hôtes :', hosts, '· slots :', slots.join(','));
const H = I.map(x => x.D.ev('myHash')); let common = 0, diff = 0;
for (const k of Object.keys(H[0] || {})) { if (H.every(h => h[k] !== undefined)) { common++; if (!H.every(h => h[k] === H[0][k])) diff++; } }
const hs = heroes.map(h => h.split(',').filter(v => v !== '-')); const uniq = new Set(hs[0]).size === hs[0].length;
console.log('héros tous différents :', uniq, '· désync :', I.map(x => x.D.net().desync).join(','), '· empreintes communes', common, 'différentes', diff);
if (I.some(x => x.D.ev('state') !== 'play')) {
  I.forEach((x, k) => console.log('DIAG', k, x.D.ev('JSON.stringify({state, olStage, roomJoin, roomPending, jselSent, waitMsg, netMsg, localSlot, online, nPlayers, pend: typeof pend!=="undefined"?pend:null, joinBusy, selLock: SEL.map(s=>s.lock?s.c:-1), act, tick, rx: tick-rxT})')));
}
