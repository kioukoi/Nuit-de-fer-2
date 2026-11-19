'use strict';
/* ---------- jeu en ligne : relais MQTT + synchronisation par échange des touches ----------
   Les deux navigateurs exécutent exactement la même simulation (graine commune, pas fixe) et
   s'envoient uniquement les touches pressées, avec un petit décalage (DELAY images). */
const DELAY = 10;
const BITS = { left: 1, right: 2, up: 4, down: 8, punch: 16, jump: 32, special: 64, throw: 128 };
let online = false, localSlot = 0, olStage = 'menu', olIdx = 0, codeBuf = '', hostCode = '', netMsg = '', netSeed = 0;
let frameNo = 0, sentF = 0, localBuf = {}, remoteBuf = {}, prevM = [0, 0], myHash = {}, theirHash = {}, desync = false, stallT = 0;
let lastRelays = '', rel = null, rxT = 0, startMsg = null, peerNeeds = 0;
const maskOf = h => ACT.reduce((m, n) => m | (h[n] ? BITS[n] : 0), 0);

/* Transport : relais MQTT public par WebSocket (wss). Aucun serveur à installer, passe les réseaux mobiles
   et la plupart des pare-feux (pas de connexion directe entre les deux ordinateurs). */
const BROKERS = ['wss://public:public@public.cloud.shiftr.io', 'wss://mqtt.eclipseprojects.io:443/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/'];
const U8 = a => new Uint8Array(a);
function mqStr(s) { const b = Array.from(new TextEncoder().encode(s)); return [b.length >> 8, b.length & 255, ...b]; }
function mqLen(n) { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; }
function mqPkt(h, body) { return U8([h, ...mqLen(body.length), ...body]); }
function mqConnect(id, user, pass) {
  const auth = user ? [...mqStr(user), ...mqStr(pass)] : [];
  return mqPkt(0x10, [0, 4, 77, 81, 84, 84, 4, user ? 0xC2 : 2, 0, 30, ...mqStr(id), ...auth]);
}
function mqSub(topic, pid) { return mqPkt(0x82, [pid >> 8, pid & 255, ...mqStr(topic), 0]); }
function mqPub(topic, obj) { return mqPkt(0x30, [...mqStr(topic), ...Array.from(new TextEncoder().encode(JSON.stringify(obj)))]); }
function openBroker(url, subTopic, onMsg) {
  let user = '', pass = '', wsUrl = url;
  const m = /^wss:\/\/([^:@\/]+):([^@\/]+)@(.*)$/.exec(url);
  if (m) { user = m[1]; pass = m[2]; wsUrl = 'wss://' + m[3]; }
  const c = { url: wsUrl, name: wsUrl.replace(/^wss:\/\//, '').replace(/[:\/].*$/, '').replace(/^(broker|public\.cloud|mqtt|test)\./, '').replace(/\..*$/, ''), ws: null, ready: false, buf: [], dead: false, st: 'connexion' };
  try { c.ws = new WebSocket(wsUrl, 'mqtt'); } catch (e) { c.dead = true; c.st = 'refusé'; return c; }
  c.ws.binaryType = 'arraybuffer';
  c.ws.onopen = () => { try { c.ws.send(mqConnect('nf' + Math.random().toString(36).slice(2, 10), user, pass)); c.st = 'handshake'; } catch (e) { c.dead = true; } };
  c.ws.onerror = () => { c.dead = true; c.ready = false; if (c.st !== 'ok') c.st = 'bloqué'; };
  c.ws.onclose = () => { c.dead = true; c.ready = false; if (c.st !== 'ok') c.st = c.st === 'connexion' ? 'bloqué' : 'fermé'; };
  c.ws.onmessage = ev => {
    c.buf.push(...new Uint8Array(ev.data));
    for (;;) {
      if (c.buf.length < 2) return;
      let rl = 0, mul = 1, i = 1, ok = false;
      while (i < c.buf.length && i < 5) { const d = c.buf[i++]; rl += (d & 127) * mul; mul *= 128; if (!(d & 128)) { ok = true; break; } }
      if (!ok || c.buf.length < i + rl) return;
      const h = c.buf[0], body = c.buf.slice(i, i + rl); c.buf = c.buf.slice(i + rl);
      const type = h >> 4;
      if (type === 2) { if (body[1] === 0) c.ws.send(mqSub(subTopic, 1)); else { c.dead = true; c.st = 'refusé'; } }
      else if (type === 9) { c.ready = true; c.st = 'ok'; }
      else if (type === 3) {
        const tl = (body[0] << 8) | body[1]; let idx = 2 + tl; if (((h >> 1) & 3) > 0) idx += 2;
        try { onMsg(c, JSON.parse(new TextDecoder().decode(U8(body.slice(idx))))); } catch (e) { /* ignoré */ }
      }
    }
  };
  return c;
}
function relClose() {
  if (rel) lastRelays = rel.bs.map(b => b.name + ' ' + (b.st === 'ok' ? 'OK' : b.st)).join(' · ');
  if (rel) for (const c of rel.bs) { try { c.ws && c.ws.close(); } catch (e) { /* ignoré */ } }
  rel = null;
}
function netClose() { relClose(); online = false; startMsg = null; }
function netFail(msg) { netClose(); netMsg = msg; olStage = 'error'; state = 'online'; }
function netLost(msg) { netClose(); netMsg = msg; state = 'title'; nPlayers = 1; }
function newCode() {
  const al = 'ABCDEFGHJKLMNQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += al[Math.floor(Math.random() * al.length)];
  return s;
}
function netSend(m) {
  if (!rel || !rel.active || !rel.active.ready) return;
  try { rel.active.ws.send(mqPub(rel.outT, m)); } catch (e) { /* ignoré */ }
}
function startRelay(role, code) {
  netClose();
  const inT = 'nferbrawl/' + code + (role === 0 ? '/j' : '/h');
  rel = { role, code, bs: [], active: null, outT: 'nferbrawl/' + code + (role === 0 ? '/h' : '/j'), t0: tick, helloT: 0, rot: 0 };
  const onMsg = (c, m) => {
    if (!rel) return;
    if (role === 0 && m.t === 'hello') {
      if (!online || rel.active === c) { rel.active = c; netSend({ t: 'welcome' }); if (!online) goOnline(0); }
      return;
    }
    if (role === 1 && m.t === 'welcome') { if (!online) goOnline(1); return; }
    if (online && c === rel.active) { rxT = tick; onNet(m); }
  };
  rel.bs = BROKERS.map(u => openBroker(u, inT, onMsg));
}
function goOnline(slot) { online = true; localSlot = slot; nPlayers = 2; rxT = tick; initSelect(); state = 'select'; SFX.pick(); }
function hostGame() { olStage = 'hosting'; hostCode = newCode(); startRelay(0, hostCode); }
function joinGame(code) { olStage = 'connecting'; startRelay(1, code); }
function relTick() {
  if (!rel) return;
  const age = tick - rel.t0;
  const anyReady = rel.bs.some(b => b.ready);
  if (!online) {
    if (olStage === 'hosting' && age > 600 && !anyReady) netFail('Impossible de joindre le serveur de mise en relation (réseau bloqué ?). Essayez un autre réseau.');
    if (olStage === 'connecting') {
      if (age > 1500) { netFail('Partie introuvable ou serveur injoignable. Vérifiez le code et que l\'autre joueur attend bien à l\'écran « Code de la partie ».'); return; }
      if (age - rel.helloT >= 45) {
        rel.helloT = age;
        const ready = rel.bs.filter(b => b.ready);
        if (ready.length) { rel.rot++; rel.active = ready[rel.rot % ready.length]; netSend({ t: 'hello' }); }
      }
    }
    return;
  }
  if (tick % 60 === 0) netSend({ t: 'ping' });
  if (tick % 1200 === 0) for (const b of rel.bs) { try { if (b.ready) b.ws.send(U8([0xC0, 0])); } catch (e) { /* ignoré */ } }
  if (state === 'select' && tick % 30 === 0) sendSel();
  if (startMsg && state === 'play' && frameNo < DELAY + 4 && tick % 15 === 0) netSend(startMsg);
  if (rel.active && rel.active.dead) netLost('Connexion perdue.');
  else if (tick - rxT > 600) netLost('Connexion perdue (plus de nouvelles de l\'autre joueur).');
}
function onNet(m) {
  if (!m) return;
  if (m.t === 'in') {
    peerNeeds = Math.max(peerNeeds, m.r);
    for (let i = 0; i < m.a.length; i++) { const f = m.s + i; if (f >= frameNo - 1 && remoteBuf[f] === undefined) remoteBuf[f] = m.a[i]; }
  } else if (m.t === 'sel') { if (state === 'select') { const r = 1 - localSlot; SEL[r].c = m.c; SEL[r].lock = m.lock; } }
  else if (m.t === 'start') {
    if (state !== 'select') return;
    SEL[0].c = Math.max(0, HERO_KEYS.indexOf(m.heroes[0])); SEL[1].c = Math.max(0, HERO_KEYS.indexOf(m.heroes[1]));
    beginOnline(m.seed);
  } else if (m.t === 'h') {
    theirHash[m.f] = m.v;
    if (myHash[m.f] !== undefined && myHash[m.f] !== m.v) desync = true;
  }
}
function sendSel() { netSend({ t: 'sel', c: SEL[localSlot].c, lock: SEL[localSlot].lock }); }
function beginOnline(seed) {
  netSeed = seed; frameNo = 0; sentF = DELAY - 1; localBuf = {}; remoteBuf = {}; prevM = [0, 0];
  for (let f = 0; f < DELAY; f++) { localBuf[f] = 0; remoteBuf[f] = 0; }
  myHash = {}; theirHash = {}; desync = false; stallT = 0; peerNeeds = 0;
  startGame();
}
function sendIn() {
  const s = Math.max(sentF - 80, Math.min(sentF - 9, peerNeeds)), a = [];
  for (let f = s; f <= sentF; f++) a.push(localBuf[f] === undefined ? 0 : localBuf[f]);
  netSend({ t: 'in', s, a, r: frameNo });
}
function netFrameReady() {
  const target = frameNo + DELAY;
  while (sentF < target) {
    sentF++;
    localBuf[sentF] = menuOpen ? 0 : maskOf(HLD[localSlot]);
    if (sentF % 2 === 0) sendIn();
  }
  if (remoteBuf[frameNo] === undefined || localBuf[frameNo] === undefined) { stallT++; if (stallT % 6 === 0) sendIn(); return false; }
  stallT = 0;
  return true;
}
function applyNetInputs() {
  for (let s = 0; s < 2; s++) {
    const m = (s === localSlot ? localBuf : remoteBuf)[frameNo], prev = prevM[s];
    for (const n of ACT) {
      const held = !!(m & BITS[n]);
      HLD[s][n] = held; PRS[s][n] = held && !(prev & BITS[n]);
    }
    prevM[s] = m;
  }
}
function stateHash() {
  let h = rngS | 0;
  const mix = v => { h = (Math.imul(h, 31) + (Math.round(v * 16) | 0)) | 0; };
  for (const p of PS) { mix(p.x); mix(p.y); mix(p.hp); mix(p.score); }
  for (const e of E) { mix(e.x); mix(e.y); mix(e.hp); }
  mix(cam);
  return h;
}
function netAfterFrame() {
  frameNo++;
  delete localBuf[frameNo - 90]; delete remoteBuf[frameNo - 12];
  if (frameNo % 120 === 0) {
    const h = stateHash();
    myHash[frameNo] = h;
    netSend({ t: 'h', f: frameNo, v: h });
    if (theirHash[frameNo] !== undefined && theirHash[frameNo] !== h) desync = true;
  }
}

