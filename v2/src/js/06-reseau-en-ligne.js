/* ---------- jeu en ligne : relais MQTT + synchronisation par échange des touches ----------
   Les deux navigateurs exécutent exactement la même simulation (graine commune, pas fixe) et
   s'envoient uniquement les touches pressées, avec un petit décalage (DELAY images). */
const DELAY = 12;            // délai de départ ; ensuite adapté à la qualité de la ligne (curDelay)
let curDelay = DELAY, stallEv = 0, lastDelayAdj = 0, rttMax = 0;
const rttBy = [[], [], [], []];
const BITS = { left: 1, right: 2, up: 4, down: 8, punch: 16, jump: 32, special: 64, throw: 128, pause: 256 };
const MAXP = 4;
const nowMs = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
let online = false, localSlot = 0, olStage = 'menu', olIdx = 0, codeBuf = '', hostCode = '', netMsg = '', netSeed = 0;
let frameNo = 0, sentF = 0, localBuf = {}, rbuf = [{}, {}, {}, {}], prevM = [0, 0, 0, 0], myHash = {}, theirHash = [{}, {}, {}, {}], desync = false, stallT = 0;
let lastRelays = '', rel = null, rxT = 0, startMsg = null, lastSentM = -1;
/* Salle en ligne jusqu'à 4 joueurs. L'hôte (emplacement 0) joue tout de suite ; les amis rejoignent à tout moment, même en cours de partie.
   Tout le monde fait tourner la même simulation (déterministe) et n'échange que les touches (« lockstep »).
   Un nouvel arrivant rejoue en accéléré les touches de tous depuis le début, puis entre en jeu à une image convenue (F) pour tout le monde. */
let act = [true, false, false, false], lastRx = [0, 0, 0, 0], peerR = [0, 0, 0, 0], joins = [], dropAt = [], allLog = [], netPaused = 0, pauseBy = '';
let room = false, roomJoin = false, roomPending = false, joinBusy = false, joinT = 0, joinMsgs = [], joinBuilt = false, pend = null, waitMsg = '';
const pongQ = [];
let jselSent = false, catchParts = null, catchReady = null, pendingJoin = '', toastT = 0, toastMsg = '';
const myUid = Math.random().toString(36).slice(2, 10);
try { const mj = /[?&]join=([A-Za-z0-9]{4,6})/.exec(location.search); if (mj) pendingJoin = mj[1].toUpperCase(); } catch (e) { /* ignoré */ }
addEventListener('paste', e => {
  if (state === 'online' && olStage === 'joining') {
    const t = (e.clipboardData && e.clipboardData.getData('text')) || '', m = /join=([A-Za-z0-9]{4,6})/.exec(t);
    codeBuf = (m ? m[1] : t).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  }
});
const maskOf = h => ACT.reduce((m, n) => m | (h[n] ? BITS[n] : 0), 0);
const others = () => { let n = 0; for (let s = 0; s < MAXP; s++) if (act[s] && s !== localSlot) n++; return n; };
const packM = ms => ms[0] + ms[1] * 512 + ms[2] * 262144 + ms[3] * 134217728;
const unpackM = v => [v % 512, Math.floor(v / 512) % 512, Math.floor(v / 262144) % 512, Math.floor(v / 134217728) % 512];

/* Transport : relais MQTT publics par WebSocket (wss). Aucun serveur à installer, passe les réseaux mobiles et la plupart des pare-feux.
   Chaque message part en double sur plusieurs relais et le premier arrivé gagne : moins de latence, et un relais lent ou coupé ne gêne plus. */
const BROKERS = ['wss://public:public@public.cloud.shiftr.io', 'wss://broker.emqx.io:8084/mqtt', 'wss://mqtt.eclipseprojects.io:443/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/'];
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
  rel = null; rtcCloseAll();
}
function netReset() {
  online = false; startMsg = null; room = false; roomJoin = false; joinBusy = false; jselSent = false; catchParts = null; catchReady = null;
  lobbyU = {}; pend = null; joins = []; dropAt = []; allLog = []; act = [true, false, false, false]; netPaused = 0; waitMsg = ''; joinBuilt = false;
}
function netClose() {
  if (rel && online) netSend({ t: 'bye', p: localSlot });
  relClose(); netReset();
}
function netFail(msg) { netClose(); netMsg = msg; olStage = 'error'; state = 'online'; }
function netLost(msg) { netClose(); netMsg = msg; state = 'title'; nPlayers = 1; menuOpen = false; }
function newCode() {
  const al = 'ABCDEFGHJKLMNQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += al[Math.floor(Math.random() * al.length)];
  return s;
}
/* ---- liaison directe WebRTC entre les joueurs : sur le même wifi la latence tombe à quelques ms.
   Les relais MQTT ne servent plus qu'à se trouver (signalisation) et de secours si la liaison directe échoue. ---- */
const RTC_OK = typeof RTCPeerConnection !== 'undefined';
const RTC_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const FAST = { in: 1, ping: 1, pong: 1, h: 1, sel: 1 };
let rtcP = {}, rtcFail = {}, seenU = {};
const rtcSig = (to, k, d) => netSend({ t: 'rtc', to, k, d }, true);
const dsc = d => ({ type: d.type, sdp: d.sdp });
function rtcDrop(u) {
  const e = rtcP[u]; if (!e) return;
  try { e.pc.close(); } catch (x) { /* ignoré */ }
  delete rtcP[u]; const f = rtcFail[u]; rtcFail[u] = { t: tick, n: (f ? f.n : 0) + 1 };
}
function rtcCloseAll() { for (const u in rtcP) { try { rtcP[u].pc.close(); } catch (x) { /* ignoré */ } } rtcP = {}; rtcFail = {}; seenU = {}; }
function rtcMake(u) {
  const e = rtcP[u] = { pc: new RTCPeerConnection(RTC_CFG), dc: null, open: false, t0: tick, ice: [], rd: false }, pc = e.pc;
  pc.onicecandidate = ev => { if (ev.candidate && rtcP[u] === e) rtcSig(u, 'ice', ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate); };
  pc.onconnectionstatechange = () => { if ((pc.connectionState === 'failed' || pc.connectionState === 'closed') && rtcP[u] === e) rtcDrop(u); };
  pc.ondatachannel = ev => rtcAttach(u, e, ev.channel);
  return e;
}
function rtcAttach(u, e, dc) {
  e.dc = dc;
  dc.onopen = () => { e.open = true; rtcFail[u] = undefined; };
  dc.onclose = () => { e.open = false; };
  dc.onmessage = ev => { try { const m = JSON.parse(ev.data); if (m && m.u !== myUid) netIn(m); } catch (x) { /* ignoré */ } };
}
function rtcEnsure(u) {
  if (!RTC_OK || !online || !u || rtcP[u]) return;
  const f = rtcFail[u]; if (f && tick - f.t < Math.min(3600, 300 * f.n)) return;
  if (myUid > u) return;                                // le plus petit identifiant lance la connexion, l'autre répond
  let e; try { e = rtcMake(u); } catch (x) { return; }
  rtcAttach(u, e, e.pc.createDataChannel('g'));
  e.pc.createOffer().then(o => e.pc.setLocalDescription(o)).then(() => rtcSig(u, 'offer', dsc(e.pc.localDescription))).catch(() => rtcDrop(u));
}
function rtcFlush(e) { e.rd = true; for (const c of e.ice) e.pc.addIceCandidate(c).catch(() => {}); e.ice = []; }
function rtcIn(m) {
  if (!RTC_OK || !online || m.to !== myUid) return;
  const u = m.u; let e = rtcP[u];
  if (m.k === 'offer') {
    if (myUid < u || (e && (e.open || tick - e.t0 < 300))) return;      // doublon (les messages arrivent par plusieurs relais)
    if (e) rtcDrop(u);
    try { e = rtcMake(u); } catch (x) { return; }
    e.pc.setRemoteDescription(m.d).then(() => { rtcFlush(e); return e.pc.createAnswer(); }).then(a => e.pc.setLocalDescription(a)).then(() => rtcSig(u, 'answer', dsc(e.pc.localDescription))).catch(() => rtcDrop(u));
  } else if (m.k === 'answer') {
    if (e && myUid < u && !e.rd) { e.rd = true; e.pc.setRemoteDescription(m.d).then(() => rtcFlush(e)).catch(() => rtcDrop(u)); }
  } else if (m.k === 'ice') {
    if (!e) return;
    if (e.rd) e.pc.addIceCandidate(m.d).catch(() => {}); else e.ice.push(m.d);
  }
}
function rtcTick() {
  for (const u in rtcP) { const e = rtcP[u]; if (!e.open && tick - e.t0 > 600) rtcDrop(u); }
}
const rtcAll = () => { let any = false; for (const u in seenU) { if (tick - seenU[u] > 300) continue; any = true; if (!(rtcP[u] && rtcP[u].open)) return false; } return any; };
function netSend(m, all) {
  if (!rel) return;
  m.u = myUid;
  if (RTC_OK && m.t !== 'rtc') {
    const s = JSON.stringify(m);
    if (typeof m.to === 'string') { const e = rtcP[m.to]; if (e && e.open) { try { e.dc.send(s); return; } catch (x) { /* secours : relais */ } } }
    else {
      for (const u in rtcP) { const e = rtcP[u]; if (e.open) { try { e.dc.send(s); } catch (x) { /* ignoré */ } } }
      if (FAST[m.t] && rtcAll()) return;                // tout le monde est joignable en direct : le relais n'est pas sollicité
    }
  }
  const pkt = mqPub(rel.topic, m);
  const L = rel.bs.filter(b => b.ready).sort((a, b) => (a.lat === undefined ? 999 : a.lat) - (b.lat === undefined ? 999 : b.lat));   // les relais les plus rapides d'abord
  for (const b of all ? L : L.slice(0, 3)) { try { b.ws.send(pkt); } catch (e) { /* ignoré */ } }
}
function startRelay(code) {
  relClose();
  rel = { code, bs: [], topic: 'nferbrawl2/' + code, t0: tick, helloT: 0, reopenT: tick };
  rel.mk = url => openBroker(url, rel.topic, (c, m) => {
    if (!rel || !m) return;
    if (m.u === myUid) { if (m.t === 'ping' && m.ts !== undefined) { const r = nowMs() - m.ts; if (r >= 0 && r < 5000) c.lat = c.lat === undefined ? r : c.lat * 0.6 + r * 0.4; } return; }   // notre propre ping revenu : mesure de ce relais
    netIn(m);
  });
  rel.bs = BROKERS.map(rel.mk);
}
/* plus de code : tous les amis arrivent dans la même salle fixe. Le premier cherche une partie ; s'il n'en trouve pas, il en ouvre une. */
const ROOM_CODE = 'NDFER';
let gotWait = false;
function goOnlineAuto() {
  netReset(); waitMsg = ''; gotWait = false; netMsg = '';
  olStage = 'connecting'; state = 'online';
  startRelay(ROOM_CODE); rel.srch = 150 + Math.floor(Math.random() * 150);      // petite attente aléatoire : évite que deux amis ouvrent chacun une salle
}
function becomeHost() {
  rel.srch = 0; roomPending = true; nPlayers = 1; online = false; NAMES[0] = myName; initSelect(); state = 'select'; olStage = 'hosting'; SFX.pick();
}
function joinGame(code) { netReset(); olStage = 'connecting'; waitMsg = ''; startRelay(code); }

/* ----- arrivée d'un joueur ----- */
/* salle d'attente : tant que l'hôte est sur l'écran de choix, les amis arrivent sur ce même écran et choisissent ensemble */
let lobbyU = {};
function lobbyWelcome(u, slot) {
  netSend({ t: 'welcome', to: u, lobby: 1, slot, names: NAMES.slice(0, nPlayers), acts: act.map(a => a ? 1 : 0), sel: SEL.slice(0, nPlayers).map(o => [o.c, o.lock ? 1 : 0]), ff: FRIENDLY ? 1 : 0 });
}
function lobbyHello(m) {
  if (lobbyU[m.u] !== undefined && act[lobbyU[m.u]]) { lobbyWelcome(m.u, lobbyU[m.u]); return; }     // bonjour répété : même place
  if (nPlayers >= MAXP) { netSend({ t: 'welcome', to: m.u, full: 1 }); return; }
  if (roomPending && !online) {                         // le premier ami arrive : l'hôte passe en mode « en ligne » sans quitter l'écran de choix
    roomPending = false; hostCode = ROOM_CODE; room = true; online = true; localSlot = 0; act = [true, false, false, false]; lobbyU = {};
    lastRx = [tick, tick, tick, tick]; rxT = tick; startMsg = null; pend = null; joins = []; allLog = [];
  }
  const slot = nPlayers, nm = cleanName(m.n) || 'JOUEUR ' + (slot + 1);
  lobbyU[m.u] = slot; act[slot] = true; nPlayers = slot + 1; NAMES[slot] = nm; lastRx[slot] = tick; selT = 0;
  let c = 0; while (SEL.slice(0, slot).some(o => o.c === c)) c = (c + 1) % HERO_KEYS.length;
  SEL[slot].c = c; SEL[slot].lock = false;
  lobbyWelcome(m.u, slot); netSend({ t: 'lob', p: 0, slot, n: nm }); sendSel(); toast(nm + ' a rejoint !');
}
function hostHello(m) {
  if ((roomPending && !online) || (online && room && localSlot === 0 && state === 'select')) { lobbyHello(m); return; }
  if (!(online && room && localSlot === 0)) return;
  const nm = cleanName(m.n) || 'JOUEUR';
  if (nPlayers >= MAXP) { netSend({ t: 'welcome', to: m.u, full: 1 }); return; }
  if (state !== 'play' || (pend && pend.u !== m.u && tick - pend.t < 600) || (joinBusy && (!pend || pend.u !== m.u))) { netSend({ t: 'welcome', to: m.u, wait: 1 }); return; }
  if (!pend || pend.u !== m.u) pend = { u: m.u, slot: nPlayers, n: nm, t: tick };
  pend.t = tick;
  netSend({ t: 'welcome', to: m.u, slot: pend.slot, names: NAMES.slice(0, nPlayers), heroes: PS.map(p => p.hero), ff: FRIENDLY ? 1 : 0 });
}
function guestWelcome(m) {
  if (m.to !== myUid || online || olStage !== 'connecting') return;
  if (m.full) { netFail('La partie est complète (4 joueurs maximum).'); return; }
  if (m.wait) { gotWait = true; waitMsg = 'La partie est occupée (un ami arrive ou manche en cours)… patientez'; if (rel) rel.t0 = Math.max(rel.t0, tick - 600); return; }
  if (m.lobby) {                                        // l'hôte est encore sur l'écran de choix : on choisit tous ensemble
    online = true; room = true; roomJoin = false; jselSent = false; localSlot = m.slot | 0; nPlayers = localSlot + 1; rxT = tick; FRIENDLY = !!m.ff;
    initSelect(); act = [false, false, false, false]; hostCode = ROOM_CODE;
    for (let i = 0; i < localSlot; i++) { act[i] = !!(m.acts && m.acts[i]); NAMES[i] = cleanName(m.names && m.names[i]) || 'JOUEUR ' + (i + 1); if (m.sel && m.sel[i]) { SEL[i].c = m.sel[i][0] | 0; SEL[i].lock = !!m.sel[i][1]; } }
    act[localSlot] = true; NAMES[localSlot] = myName;
    let c = 0; while (SEL.slice(0, localSlot).some(o => o.c === c)) c = (c + 1) % HERO_KEYS.length;
    SEL[localSlot].c = c; SEL[localSlot].lock = false;
    lastRx = [tick, tick, tick, tick]; state = 'select'; selT = 0; SFX.pick(); waitMsg = ''; sendSel();
    return;
  }
  online = true; room = true; roomJoin = true; jselSent = false; localSlot = m.slot | 0; nPlayers = localSlot + 1; rxT = tick; FRIENDLY = !!m.ff;
  initSelect();
  for (let i = 0; i < localSlot; i++) { NAMES[i] = cleanName(m.names && m.names[i]) || 'JOUEUR ' + (i + 1); SEL[i].c = Math.max(0, HERO_KEYS.indexOf(m.heroes && m.heroes[i])); SEL[i].lock = true; }
  NAMES[localSlot] = myName; for (let i = 0; i < localSlot; i++) act[i] = true;
  let c = 0; while (SEL.slice(0, localSlot).some(o => o.c === c)) c = (c + 1) % HERO_KEYS.length;
  SEL[localSlot].c = c; SEL[localSlot].lock = false;
  lastRx = [tick, tick, tick, tick]; state = 'select'; selT = 0; SFX.pick(); waitMsg = '';
}
const joinsPayload = () => joins.filter(j => !j.done || j.F > frameNo - 400).map(j => [j.slot, j.F, j.c, j.n, j.x ? 1 : 0]);
function mergeJoins(list) {
  if (state !== 'play' || roomJoin) return;
  for (const [slot, F, c, n, x] of list) {
    const j = joins.find(q => q.slot === slot && q.F === F);
    if (j) { if (x) j.x = true; continue; }
    joins.push({ slot, F, c, n, x: !!x, done: F < frameNo });
  }
}
function mergeDrops(list) {
  for (const [s, L] of list) {
    if (dropAt[s] === undefined) dropAt[s] = L;
    if (s === localSlot) netLost('Vous avez été retiré de la partie (connexion trop lente).');
  }
}
function startJoin(c1) {
  const n = HERO_KEYS.length;
  c1 = ((c1 | 0) % n + n) % n;
  const used = PS.filter(p => act[p.slot]).map(p => p.hero);
  while (used.indexOf(HERO_KEYS[c1]) >= 0) c1 = (c1 + 1) % n;
  const j = { slot: pend.slot, F: sentF + 60, c: c1, n: pend.n, x: false, done: false };
  joins.push(j); joinBusy = true; joinT = tick; joinBuilt = false; pend.t = tick;
  netSend({ t: 'join', j: joinsPayload() });
}
function curJoin() { return joins.find(j => !j.done && !j.x); }
function buildCatch(j) {
  const K = j.F, rle = []; let pm = -1, c = 0;
  for (let f = 0; f < K; f++) { const m = allLog[f] || 0; if (m === pm) c++; else { if (c) rle.push(pm, c); pm = m; c = 1; } }
  if (c) rle.push(pm, c);
  const CH = 400, n = Math.max(1, Math.ceil(rle.length / CH)), id = (Math.random() * 65535) | 0;
  const meta = { seed: netSeed, lvl: startLevel, ff: FRIENDLY ? 1 : 0, h0: PS[0].hero, n0: NAMES[0], K,
    joins: joins.filter(q => !q.x && q.F <= K).map(q => [q.slot, q.F, q.c, q.n]), drops: dropAt.map((L, s) => [s, L]).filter(q => q[1] !== undefined) };
  joinMsgs = [];
  for (let i = 0; i < n; i++) joinMsgs.push({ t: 'cu', to: pend.u, id, i, n, d: rle.slice(i * CH, (i + 1) * CH), meta: i === 0 ? meta : undefined });
  joinMsgs.forEach(netSend); joinBuilt = true;
}
function addPlayerAt(j) {
  while (PS.length < j.slot) { const q = mkPlayer(HERO_KEYS[0], PS.length); q.out = true; q.absent = true; q.lives = 0; PS.push(q); }
  const ref = PS.find(q => !q.out) || PS[0], p = mkPlayer(HERO_KEYS[j.c], j.slot);
  p.name = j.n; p.x = clamp(ref.x - 22 - 8 * j.slot, cam + 16, cam + W - 16); p.y = clamp(ref.y + 10 * (j.slot - 1), Y0, Y1); p.inv = 90;
  PS[j.slot] = p; nPlayers = PS.length; act[j.slot] = true; prevM[j.slot] = 0; NAMES[j.slot] = j.n; SEL[j.slot].c = j.c; SEL[j.slot].lock = true;
  rttBy[j.slot] = []; lastRx[j.slot] = tick; peerR[j.slot] = j.F;
}
function dropPlayer(s) {
  act[s] = false;
  const p = PS[s]; if (!p) return;
  p.out = true; p.dying = false; p.lives = 0; p.hp = 0;
  if (!REPLAY) toast((p.name || 'Un joueur') + ' a quitté la partie');
}
/* événements communs à tous, au début de l'image f : arrivée / départ d'un joueur */
function frameEvents(f) {
  for (const j of joins) if (!j.done && !j.x && j.F === f) {
    j.done = true; addPlayerAt(j);
    if (localSlot === 0 && !REPLAY) { joinBusy = false; pend = null; toast(j.n + ' a rejoint la partie !'); }
  }
  for (let s = 1; s < MAXP; s++) if (dropAt[s] !== undefined && f === dropAt[s] + 1 && act[s]) dropPlayer(s);
}
function runCatchUp() {
  const c = catchReady, meta = c.meta; catchReady = null;
  FRIENDLY = !!meta.ff; startLevel = Math.max(0, Math.min(LEVELS.length - 1, meta.lvl | 0));
  SEL[0].c = Math.max(0, HERO_KEYS.indexOf(meta.h0)); NAMES[0] = cleanName(meta.n0) || 'JOUEUR 1';
  const keep = rbuf, K = meta.K, slot = localSlot;
  nPlayers = 1; online = true; room = true; act = [true, false, false, false];
  beginOnline(meta.seed);
  joins = meta.joins.map(([s, F, cc, n]) => ({ slot: s, F, c: cc, n, x: false, done: false }));
  dropAt = []; for (const [s, L] of meta.drops) dropAt[s] = L;
  const log = []; for (let i = 0; i < c.rle.length; i += 2) for (let k = 0; k < c.rle[i + 1]; k++) log.push(c.rle[i]);
  REPLAY = true;
  try {
    for (let f = 0; f < K; f++) {
      frameEvents(f);
      const ms = unpackM(log[f] | 0);
      applyMasks(ms);
      if (!ms.some(m => m & 256)) simStep();
    }
  } finally { REPLAY = false; }
  frameNo = K; localBuf = {}; rbuf = [{}, {}, {}, {}];
  for (let s = 0; s < MAXP; s++) for (const k in keep[s]) if (+k >= K) rbuf[s][k] = keep[s][k];
  for (let f = K; f < K + curDelay; f++) localBuf[f] = 0;
  sentF = K + curDelay - 1; myHash = {}; theirHash = [{}, {}, {}, {}]; desync = false; stallT = 0;
  roomJoin = false; localSlot = slot; rxT = tick; lastRx = [tick, tick, tick, tick]; state = 'play'; menuOpen = false;
  sendIn(); toast('Vous avez rejoint la partie !');
}

/* ----- messages reçus ----- */
function netIn(m) {
  const t = m.t;
  if (t === 'rtc') { rtcIn(m); return; }
  if (online && m.u && t !== 'host' && t !== 'welcome') { seenU[m.u] = tick; rtcEnsure(m.u); }
  if (t === 'hello') { hostHello(m); return; }
  if (t === 'welcome') { guestWelcome(m); return; }
  if (t === 'host') {                                   // deux amis ont ouvert une salle en même temps : celui dont l'identifiant est le plus grand rejoint l'autre
    if (roomPending && !online && m.u < myUid) { roomPending = false; if (rel) { rel.srch = 0; rel.helloT = -99; rel.t0 = tick; } gotWait = false; state = 'online'; olStage = 'connecting'; waitMsg = ''; }
    return;
  }
  if (!online) return;
  const p = m.p;
  if (p !== undefined && p >= 0 && p < MAXP && p !== localSlot) { lastRx[p] = tick; rxT = tick; }
  if (t === 'in') {
    if (roomJoin || m.g !== netSeed || p === undefined || p === localSlot) return;
    peerR[p] = m.r;
    for (let i = 0; i < m.a.length; i++) { const f = m.s + i; if (f >= frameNo - 1 && rbuf[p][f] === undefined) rbuf[p][f] = m.a[i]; }
    if (p === 0) { if (m.j) mergeJoins(m.j); if (m.dr) mergeDrops(m.dr); }
  } else if (t === 'sel') {
    if (state === 'select' && p !== undefined && p !== localSlot && SEL[p]) {
      SEL[p].c = m.c; SEL[p].lock = m.lock;
      if (m.lock && SEL[localSlot].lock && SEL[localSlot].c === m.c && p < localSlot) { SEL[localSlot].lock = false; sendSel(); }     // même héros validé en même temps : le plus petit numéro le garde
    }
  } else if (t === 'lob') {
    if (state === 'select' && m.slot > 0 && m.slot < MAXP && m.slot !== localSlot) { act[m.slot] = true; nPlayers = Math.max(nPlayers, m.slot + 1); NAMES[m.slot] = cleanName(m.n) || 'JOUEUR ' + (m.slot + 1); lastRx[m.slot] = tick; SEL[m.slot].lock = false; selT = 0; toast(NAMES[m.slot] + ' a rejoint !'); }
  } else if (t === 'start') {
    if (state !== 'select' || roomJoin) return;
    for (let i = 0; i < nPlayers; i++) SEL[i].c = Math.max(0, HERO_KEYS.indexOf(m.heroes[i]));
    startLevel = Math.max(0, Math.min(LEVELS.length - 1, m.lvl | 0)); FRIENDLY = !!m.ff;
    for (let i = 0; i < MAXP; i++) act[i] = !!(m.act && m.act[i]);
    beginOnline(m.seed);
  } else if (t === 'jsel') {
    if (room && localSlot === 0 && state === 'play' && pend && pend.u === m.u && !joinBusy) startJoin(m.c | 0);
    else if (pend && pend.u === m.u) pend.t = tick;
  } else if (t === 'join') {
    if (m.j) mergeJoins(m.j);
  } else if (t === 'cu') {
    if (m.to !== myUid || !roomJoin || catchReady) return;
    if (!catchParts || catchParts.id !== m.id) catchParts = { id: m.id, n: m.n, d: {}, meta: null };
    catchParts.d[m.i] = m.d; if (m.meta) catchParts.meta = m.meta;
    if (catchParts.meta && Object.keys(catchParts.d).length === catchParts.n) {
      let rle = []; for (let i = 0; i < catchParts.n; i++) rle = rle.concat(catchParts.d[i]);
      catchReady = { id: catchParts.id, meta: catchParts.meta, rle };
    }
  } else if (t === 'ping') {
    if (p !== undefined && pongQ.length < 8) pongQ.push([p, m.ts]);      // la réponse part depuis la boucle de jeu : un onglet figé ne répond plus
  } else if (t === 'pong') {
    if (m.to !== localSlot || p === undefined) return;
    const r = nowMs() - m.ts; if (r >= 0 && r < 5000) { const a = rttBy[p]; a.push(r); if (a.length > 8) a.shift(); }
  } else if (t === 'h') {
    if (m.g !== netSeed || p === undefined || p === localSlot) return;
    theirHash[p][m.f] = m.v;
    if (myHash[m.f] !== undefined && myHash[m.f] !== m.v) desync = true;
  } else if (t === 'bye') {
    if (p === 0 && localSlot !== 0) netLost('L\'hôte a quitté la partie.');
    else if (p > 0 && localSlot === 0) hostDrop(p);
  } else if (t === 'gone') {
    if (m.s === localSlot) netLost('Vous avez été retiré de la partie.'); else act[m.s] = false;
  }
}
function hostDrop(s) {
  if (!act[s] || localSlot !== 0) return;
  if (state === 'play') {
    if (dropAt[s] !== undefined) return;
    let L = frameNo - 1; while (rbuf[s][L + 1] !== undefined) L++;
    dropAt[s] = L; netSend({ t: 'in', p: 0, g: netSeed, s: sentF, a: [localBuf[sentF] | 0], r: frameNo, dr: dropAt.map((q, i) => [i, q]).filter(q => q[1] !== undefined) });
  } else { act[s] = false; netSend({ t: 'gone', s }); }
}

function toast(s) { toastMsg = s; toastT = 200; }
function inviteLink() { try { return location.href.split(/[?#]/)[0] + '?join=' + hostCode; } catch (e) { return hostCode; } }
function copyInvite() {
  const u = inviteLink();
  try {
    if (navigator.share && window.IS_TOUCH) { navigator.share({ title: 'Nuit de fer', text: 'Rejoins ma partie !', url: u }); toast('Invitation prête'); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(u); toast('Lien copié ! Envoyez-le à vos amis'); }
    else toast('Code : ' + hostCode);
  } catch (e) { toast('Code : ' + hostCode); }
}
function startRoom() {
  roomPending = false; hostCode = ROOM_CODE; const keepRel = rel; netReset(); rel = keepRel; if (!rel) startRelay(ROOM_CODE);
  room = true; online = true; localSlot = 0; nPlayers = 1; NAMES[0] = myName; act = [true, false, false, false];
  beginOnline((Math.random() * 4294967296) >>> 0);
  toast('Partie ouverte ! Échap → inviter des amis');
}
/* délai de saisie adapté à la latence mesurée (le pire des joueurs) : assez grand pour ne jamais attendre, assez petit pour rester réactif */
function adaptDelay() {
  let mx = -1;
  for (let s = 0; s < MAXP; s++) if (act[s] && s !== localSlot && rttBy[s].length) { const q = rttBy[s].slice().sort((a, b) => a - b); mx = Math.max(mx, q[q.length >> 1]); }     // médiane : un pic isolé (onglet en arrière-plan, relais lent) ne fait plus exploser le délai
  if (mx < 0) return;
  rttMax = mx;
  let want = Math.ceil((mx / 2 + 24) / (1000 / 60)) + 1;
  if (stallEv > 2) { want = Math.max(want, curDelay + 2); }
  stallEv = 0;
  want = Math.max(5, Math.min(40, want));
  if (want > curDelay) { curDelay = want; lastDelayAdj = tick; }
  else if (want < curDelay && tick - lastDelayAdj > 420) { curDelay--; lastDelayAdj = tick; }
}
function sendSel() { netSend({ t: 'sel', p: localSlot, c: SEL[localSlot].c, lock: SEL[localSlot].lock }); }
function beginOnline(seed) {
  netSeed = seed; frameNo = 0; sentF = DELAY - 1; curDelay = DELAY; stallEv = 0; localBuf = {}; rbuf = [{}, {}, {}, {}]; prevM = [0, 0, 0, 0];
  for (let f = 0; f < DELAY; f++) { localBuf[f] = 0; for (let s = 0; s < MAXP; s++) rbuf[s][f] = 0; }
  myHash = {}; theirHash = [{}, {}, {}, {}]; desync = false; stallT = 0; joins = []; dropAt = []; allLog = []; netPaused = 0; lastSentM = -1;
  joinBusy = false; pend = null; joinBuilt = false; peerR = [0, 0, 0, 0]; lastRx = [tick, tick, tick, tick]; rxT = tick;
  for (let s = 0; s < MAXP; s++) rttBy[s] = [];
  startGame();
}
function sendIn() {
  if (!rel || !online) return;
  if (others() === 0 && !joinBusy) return;
  let nd = Infinity;
  for (let s = 0; s < MAXP; s++) if (act[s] && s !== localSlot) nd = Math.min(nd, peerR[s]);
  if (nd === Infinity) nd = 0;
  const s0 = Math.max(0, Math.max(sentF - 80, Math.min(sentF - 9, nd))), a = [];
  for (let f = s0; f <= sentF; f++) a.push(localBuf[f] === undefined ? 0 : localBuf[f]);
  const msg = { t: 'in', p: localSlot, g: netSeed, s: s0, a, r: frameNo };
  if (localSlot === 0) {
    if (joins.length) msg.j = joinsPayload();
    const dr = dropAt.map((q, i) => [i, q]).filter(q => q[1] !== undefined); if (dr.length) msg.dr = dr;
  }
  netSend(msg);
}
const slotAvail = (s, f) => (dropAt[s] !== undefined && f > dropAt[s]) || rbuf[s][f] !== undefined;
function netFrameReady() {
  if (roomJoin) return false;
  const target = frameNo + curDelay;
  while (sentF < target) {
    sentF++;
    const m = menuOpen ? BITS.pause : maskOf(HLD[localSlot]);
    localBuf[sentF] = m;
    if (sentF % 2 === 0 || m !== lastSentM) sendIn();       // une touche qui change part tout de suite
    lastSentM = m;
  }
  const f = frameNo;
  let ok = localBuf[f] !== undefined;
  for (let s = 0; s < MAXP && ok; s++) {
    if (s === localSlot) continue;
    if ((act[s] || joins.some(j => j.slot === s && j.F === f && !j.done && !j.x)) && !slotAvail(s, f)) ok = false;
  }
  if (!ok) {
    if (stallT === 0) stallEv++;
    stallT++;
    if (stallT === 6 && curDelay < 40) { curDelay = Math.min(40, curDelay + 2); lastDelayAdj = tick; }     // à-coup : on prend tout de suite plus de marge
    if (stallT % 3 === 0) sendIn();
    return false;
  }
  stallT = 0;
  return true;
}
function slotIn(s, f) {
  if (s === localSlot) return localBuf[f] | 0;
  if (!act[s] || (dropAt[s] !== undefined && f > dropAt[s])) return 0;
  return rbuf[s][f] | 0;
}
function applyMasks(ms) {
  for (let s = 0; s < MAXP; s++) {
    const m = ms[s], prev = prevM[s];
    for (const n of ACT) { const held = !!(m & BITS[n]); HLD[s][n] = held; PRS[s][n] = held && !(prev & BITS[n]); }
    prevM[s] = m;
  }
}
function applyNetInputs() {
  frameEvents(frameNo);
  const ms = [0, 0, 0, 0];
  for (let s = 0; s < MAXP; s++) ms[s] = slotIn(s, frameNo);
  if (localSlot === 0) allLog[frameNo] = packM(ms);
  applyMasks(ms);
  netPaused = 0; pauseBy = '';
  for (let s = 0; s < MAXP; s++) if ((ms[s] & 256) && PS[s] && act[s]) { PS[s].inv = Math.max(PS[s].inv, 3); pauseBy = pauseBy || (NAMES[s] || ''); }   // menu ouvert : le héros est protégé, les autres continuent
  return 0;
}
function stateHash() {
  let h = rngS | 0;
  const mix = v => { h = (Math.imul(h, 31) + (Math.round(v * 16) | 0)) | 0; };
  for (const p of PS) { mix(p.x); mix(p.y); mix(p.hp); mix(p.score); }
  for (const e of E) { mix(e.x); mix(e.y); mix(e.hp); }
  for (const q of AL) { mix(q.x); mix(q.y); }
  for (const p of PS) mix(p.nochair ? p.chx : 0);
  mix(cam); mix(levelIdx); mix(waveI); mix(simF & 0xffff);
  return h;
}
function netAfterFrame() {
  frameNo++;
  for (let s = 0; s < MAXP; s++) delete rbuf[s][frameNo - 12];
  delete localBuf[frameNo - 90];
  if (frameNo % 120 === 0) {
    const h = stateHash();
    myHash[frameNo] = h;
    netSend({ t: 'h', p: localSlot, g: netSeed, f: frameNo, v: h });
    for (let s = 0; s < MAXP; s++) if (theirHash[s][frameNo] !== undefined && theirHash[s][frameNo] !== h) desync = true;
    delete myHash[frameNo - 1200];
  }
}
/* minuteries du réseau (appelée à chaque image) */
function relTick() {
  rtcTick();
  if (!rel) return;
  const age = tick - rel.t0;
  const anyReady = rel.bs.some(b => b.ready);
  if (tick - rel.reopenT >= 240) {                     // un relais tombé est rouvert (sans interrompre la partie)
    rel.reopenT = tick;
    rel.bs.forEach((b, i) => { if (b.dead) { try { b.ws && b.ws.close(); } catch (e) { /* ignoré */ } rel.bs[i] = rel.mk(BROKERS[i]); } });
  }
  if (anyReady && !rel.rdyAt) rel.rdyAt = tick;
  if (!online) {
    if (roomPending && tick % 40 === 0 && anyReady) netSend({ t: 'host' });
    if (olStage === 'connecting' && rel.srch && !gotWait && rel.rdyAt && tick - rel.rdyAt > rel.srch) { becomeHost(); return; }
    if (olStage === 'connecting') {
      if (age > 1500) { netFail(anyReady ? 'Partie introuvable. Vérifiez le code (ou le lien) et que l\'hôte a bien créé sa partie.' : 'Serveur de mise en relation injoignable (réseau bloqué ?). Essayez un autre réseau.'); return; }
      if (age - rel.helloT >= 30 && anyReady) { rel.helloT = age; netSend({ t: 'hello', n: myName }); }
    }
    return;
  }
  while (pongQ.length) { const [to, ts] = pongQ.shift(); netSend({ t: 'pong', p: localSlot, to, ts }); }
  if (tick % 20 === 0) netSend({ t: 'ping', p: localSlot, ts: nowMs() }, true);
  if (state === 'play' && tick % 30 === 0) adaptDelay();
  if (tick % 1200 === 0) for (const b of rel.bs) { try { if (b.ready) b.ws.send(U8([0xC0, 0])); } catch (e) { /* ignoré */ } }
  if (state === 'select' && tick % 30 === 0 && !roomJoin) sendSel();
  if (startMsg && state === 'play' && frameNo < 90 && tick % 10 === 0) netSend(startMsg);
  if (roomJoin) {                                       // invité : choix du héros puis rattrapage
    if (!jselSent) { rxT = tick; if (tick % 120 === 0) netSend({ t: 'hello', n: myName }); }
    else if (tick % 60 === 0) netSend({ t: 'jsel', c: SEL[localSlot].c });
    if (jselSent && tick - rxT > 1500) netLost('Impossible de rejoindre la partie (l\'hôte ne répond plus).');
    return;
  }
  if (localSlot === 0) {                                // hôte : arrivées et départs
    if (pend && !joinBusy && tick - pend.t > 900) pend = null;
    if (joinBusy) {
      const j = curJoin();
      if (!j) joinBusy = false;
      else {
        if (!joinBuilt && frameNo >= j.F) buildCatch(j);
        if (joinBuilt && (tick - joinT) % 90 === 0) joinMsgs.forEach(netSend);
        if (tick - joinT > 2400) { j.x = true; joinBusy = false; pend = null; netSend({ t: 'join', j: joinsPayload() }); toast('L\'ami n\'a pas pu rejoindre'); }
      }
    }
    for (let s = 1; s < MAXP; s++) if (act[s] && tick - lastRx[s] > 600) hostDrop(s);
  } else if (tick - lastRx[0] > 900) { netLost('L\'hôte a quitté la partie (plus de nouvelles).'); return; }
  if (others() > 0 && tick - rxT > 900) netLost('Connexion perdue (plus de nouvelles des autres joueurs).');
}

