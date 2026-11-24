/* ---------- nom du joueur, niveaux débloqués, classement (stockés dans le navigateur) ---------- */
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } };
let myName = (lsGet('nfer_name', 'JOUEUR') || 'JOUEUR').slice(0, 10);
let FRIENDLY = true, DIFF = 1, SHAKEON = true;
const DIFFN = ['FACILE', 'NORMAL', 'DIFFICILE'], DIFFM = [0.78, 1, 1.28];
try { FRIENDLY = lsGet('nfer_ff', '1') !== '0'; DIFF = Math.max(0, Math.min(2, parseInt(lsGet('nfer_df', '1'), 10))); if (isNaN(DIFF)) DIFF = 1; SHAKEON = lsGet('nfer_shake', '1') !== '0'; } catch (e) { /* ignoré */ }
let NAMES = [myName, 'JOUEUR 2', 'JOUEUR 3', 'JOUEUR 4'], nameBuf = '', lastRank = -1, recorded = false;
let unlocked = Math.min(LEVELS.length - 1, parseInt(lsGet('nfer_unlocked', '0'), 10) || 0);
try { if (/[?&]debug/.test(location.search)) unlocked = LEVELS.length - 1; } catch (e) { /* ignoré */ }
function cleanName(s) { return String(s || '').replace(/[^A-Za-z0-9 _.!?\-éèêàùçïÉÈ]/g, '').trim().toUpperCase().slice(0, 10); }
function setMyName(s) { const n = cleanName(s); if (n) { myName = n; lsSet('nfer_name', n); NAMES[online ? localSlot : 0] = n; } }
/* classement mondial (Supabase) : renseigner SB_URL et SB_KEY (clé « anon public », sans danger dans une page web) ; vide = classement local seulement */
const SB_URL = 'https://rhlsoclrjaujrvlxgsxx.supabase.co', SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobHNvY2xyamF1anJ2bHhnc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNjY0NjQsImV4cCI6MjExMDc0MjQ2NH0.SJHSrMGDHjFNdoQFVtnHxuDZiViZfFptLD5CsRFjLaY';
let gScores = null, gAll = [], gRaw = [], gRec = [], gView = 0, gStatus = 'idle', gRankMsg = '';
const sbOn = () => !!(SB_URL && SB_KEY && typeof fetch === 'function');
const sbHead = () => ({ apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' });
let gErr = '';
function sbFetch(url, opt) {
  let ctl = null, to = 0;
  try { ctl = new AbortController(); to = setTimeout(() => ctl.abort(), 9000); } catch (e) { /* ignoré */ }
  return fetch(url, Object.assign({ cache: 'no-store', mode: 'cors', signal: ctl ? ctl.signal : undefined }, opt)).then(r => { if (to) clearTimeout(to); return r; }, e => { if (to) clearTimeout(to); throw e; });
}
function sbPost(ent, tries) {
  if (!sbOn()) return;
  tries = tries || 0;
  const body = JSON.stringify({ name: String(ent.n).slice(0, 10), score: ent.s, level: ent.lv, win: !!ent.win, hero: ent.h || '' });
  try {
    sbFetch(SB_URL + '/rest/v1/scores', { method: 'POST', keepalive: true, headers: Object.assign(sbHead(), { Prefer: 'return=minimal' }), body })
      .then(r => { if (r.ok) { gScores = null; sbRank(ent.s, 0); } else if (tries < 3) setTimeout(() => sbPost(ent, tries + 1), 4000); }, () => { if (tries < 3) setTimeout(() => sbPost(ent, tries + 1), 4000); });
  } catch (e) { /* ignoré */ }
}
/* rang mondial du score qu'on vient d'enregistrer : nombre de scores strictement meilleurs + 1 (affiché sur l'écran de fin) */
function sbRank(s, tries) {
  try {
    sbFetch(SB_URL + '/rest/v1/scores?select=score&score=gt.' + (s | 0) + '&limit=1', { method: 'GET', headers: Object.assign(sbHead(), { Prefer: 'count=exact' }) })
      .then(r => { const m = /\/(\d+)$/.exec(r.headers.get('content-range') || ''); if (r.ok && m) { lastRank = +m[1]; gRankMsg = ''; } else if (!r.ok && tries < 2) setTimeout(() => sbRank(s, tries + 1), 3000); }, () => { if (tries < 2) setTimeout(() => sbRank(s, tries + 1), 3000); });
  } catch (e) { /* ignoré */ }
}
function sbLoad(tries) {
  if (!sbOn()) return;
  tries = tries || 0; gStatus = 'load';
  try { sbFetch(SB_URL + '/rest/v1/scores?select=name,score,level,win,hero,created_at&order=created_at.desc&limit=10', { headers: sbHead() }).then(r => r.ok ? r.json() : [], () => []).then(rows => { gRec = (rows || []).map(r => ({ n: r.name, s: r.score, lv: r.level, win: r.win, h: r.hero, t: Date.parse(r.created_at) || 0 })); }); } catch (e) { /* ignoré */ }
  const fail = why => { if (tries < 2) setTimeout(() => sbLoad(tries + 1), 1500); else { gStatus = 'err'; gErr = why; } };
  try {
    sbFetch(SB_URL + '/rest/v1/scores?select=name,score,level,win,hero&order=score.desc&limit=300', { headers: sbHead() })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(rows => { { const seen = {}; gRaw = rows.map(r => ({ n: r.name, s: r.score, lv: r.level, win: r.win, h: r.hero })); gScores = gRaw.slice()
.filter(r => { const k = String(r.n).toUpperCase(); if (seen[k]) return false; seen[k] = 1; return true; }); gAll = gScores; gScores = gAll.slice(0, 10); } gStatus = 'ok'; gErr = ''; },
        e => fail(e && e.name === 'AbortError' ? 'délai dépassé (réseau lent ou bloqué)' : (e && /^HTTP/.test(e.message) ? e.message : 'connexion impossible (pare-feu, VPN, bloqueur de pubs ?)')));
  } catch (e) { gStatus = 'err'; gErr = 'navigateur non compatible'; }
}
function recordScores() {
  if (recorded) return;
  recorded = true; lastRank = -1;
  const p = PS[online ? localSlot : 0];
  if (!p || p.score <= 0 || GMODE === 6 || GMODE === 7) return;
  sbPost({ n: p.name || myName, s: p.score, lv: levelIdx + 1, win: state === 'win', h: p.hero });
}

try { window.addEventListener('pagehide', () => { if (state === 'play' && !recorded) recordScores(); }); } catch (e) { /* ignoré */ }
/* ---------- état du jeu ---------- */
let state = 'title', PS = [], E = [], B = [], IT = [], PJ = [], FX = [], AL = [];
let cam = 0, camLimit = LEN - W, waveI = 0, waveActive = false;
let menuOpen = false, menuIdx2 = 0, RAW = {}, sfxOn = true;
let hitstop = 0, shake = 0, tgt = null, tgtT = 0, goT = 0, tick = 0, endT = 0, paused = false, attackers = 0;
let menuIdx = 0, SEL = [{ c: 0, lock: false }, { c: 1, lock: false }, { c: 2, lock: false }, { c: 3, lock: false }], selT = 0;

let rngS = 1;
function seedRng(s) { rngS = (s >>> 0) || 1; }
function rng() {
  rngS = (rngS + 0x6D2B79F5) | 0;
  let t = Math.imul(rngS ^ (rngS >>> 15), 1 | rngS);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rnd = (a, b) => a + rng() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function mkPlayer(hero, slot) {
  const hr = HEROES[hero];
  return { kind: 'p', hero, slot, name: '', x: 70 + slot * 26, y: 198 + slot * 26, z: 0, vx: 0, vy: 0, vz: 0, face: 1, hp: hr.hp, maxhp: hr.hp,
    st: 'free', t: 0, stage: 0, buf: false, kick: false, kt: 0, hit: new Set(), inv: 0, flash: 0, walk: 0, mv: false,
    dying: false, lie: 0, lives: 3, nextUp: 20000, score: 0, cd: 0, out: false, refund: false, sp: 50, weapon: null, wd: 0, ping: 0, cane: hero === 'papy', nochair: false, chx: 0, chy: 0, xp: 0, xl: 0, mods: { dmg: 0, spd: 0, sp: 0, ls: 0, dr: 0 }, specs: {} };
}
function mkEnemy(type, x, y) {
  const d = T[type], hp = Math.round((type === 'boss' ? LV.bossHp : d.hp) * (1 + 0.5 * Math.min(3, nPlayers - 1)) * (type === 'boss' ? 1 : LV.hpM) * DIFFM[DIFF]);
  return { kind: 'e', type, x, y, z: 0, vx: 0, vy: 0, vz: 0, face: -1, hp, maxhp: hp, st: 'move', t: 0,
    cool: rnd(20, 70), side: rng() < 0.5 ? -1 : 1, slot: rnd(0, 30), hit: new Set(), inv: 0, flash: 0, walk: 0,
    mode: 'punch', tele: 24, combo: 0, phase: 1, dying: false, gone: false, lie: 0, mv: false, weapon: null, wd: 0, likesW: rng() < 0.7, dm: LV.dmgM * DIFFM[DIFF], spm: LV.spdM, spc: 150, ultQ: false, ultCd: 1100, rush: 0, hide: false, mk: false };
}
function loadLevel(i) {
  levelIdx = i; LV = GMODE === 1 ? rushLevel(LEVELS[i]) : GMODE === 6 ? arenaLevel(LEVELS[i]) : GMODE === 7 ? customLevel() : LEVELS[i];
  E = []; PJ = []; FX = []; AL = [];
  for (const p of PS) p.nochair = false;
  HZ = []; ultT = 0; uT = 0; TR = LV.traps.map(t => Object.assign({}, t)); MTR = 0; BPM = LV.bpm || 96; mNext = 0;
  IT = LV.weapons.map(([x, y, type]) => ({ x, y, type, weapon: true, wd: WEAPONS[type].uses, got: false }));
  B = LV.barrels.map(([x, y]) => ({ kind: 'b', x, y, z: 0, hp: 1, gone: false, flash: 0 }));
  cam = 0; camLimit = GMODE === 6 ? 0 : LEN - W; waveI = 0; waveActive = false; goT = 0; endT = 0; introT = 170; EV = null; evDone = {};
  if (LV.story) startStory(LV.chap, LV.story, false); else storyOn = false;
}
const MAXLIVES = 5;
/* vies bonus : à 20 000 points, à 50 000, puis tous les 50 000 ; et une vie pour toute l'équipe à chaque boss vaincu (5 vies maximum) */
function giveLife(p, txt) {
  if (p.lives >= MAXLIVES) { p.score += 500; FX.push({ x: p.x, y: p.y, z: 58, t: 0, life: 70, txt: '+500', col: '#ffd34d' }); return; }
  p.lives++; SFX.lvl(); FX.push({ x: p.x, y: p.y, z: 58, t: 0, life: 90, txt: txt || '1UP', col: '#7aff8a' });
}
function chkUp() { for (const p of PS) if (!p.out && !p.dying) while (p.score >= p.nextUp) { const th = p.nextUp; p.nextUp += th < 50000 ? 30000 : 50000; giveLife(p, '1UP  ' + th + ' PTS'); } }
function startStory(chap, lines, last) { storyD = { chap, lines }; storyTot = lines.join('').length; storyC = 0; storyA = 0; storyH = 0; storyOn = true; storyEnd = !!last; }
function updStory() {
  storyA++;
  if (storyC < storyTot) { storyC = Math.min(storyTot, storyC + 1.1); if (storyA % 3 === 0) SFX.tick(); } else storyH++;
  let press = false;
  for (const p of PS) if (!p.out && (PRS[p.slot].punch || PRS[p.slot].jump)) press = true;
  if (storyA > 45 && press) { if (storyC < storyTot) storyC = storyTot; else storyH = 9999; }     /* 1er appui : tout le texte ; 2e : on continue */
  if (storyH > 420) { storyOn = false; if (storyEnd) { storyEnd = false; endGame('win'); } }
}
function startGame() {
  PS = SEL.slice(0, nPlayers).map((s, i) => { const p = mkPlayer(HERO_KEYS[s.c], i); p.name = NAMES[i] || ('JOUEUR ' + (i + 1)); if (online && !act[i]) { p.out = true; p.absent = true; p.lives = 0; } return p; });
  loadLevel(Math.min(startLevel, LEVELS.length - 1));
  hitstop = 0; shake = 0; tgt = null; tgtT = 0; paused = false; recorded = false; lastRank = -1; specOn = false;
  simF = 0; gameStats = null; newAch = []; tutoStep = -1;
  const sd = online ? netSeed : (REP ? REP.seed : modeSeed(Date.now() >>> 0));
  seedRng(sd); modeStart(sd);
  if (REP) recorded = true; else { RECL = []; REPSD = sd; REPCFG = online ? null : { seed: sd, hero: HERO_KEYS[SEL[0].c], lvl0: startLevel, df: dfWire(), ff: FRIENDLY ? 1 : 0, name: myName }; }
  state = 'play';
}
function nextLevel() {
  for (const p of PS) {
    p.score += 1000 * (levelIdx + 1);
    if (GMODE === 5 && !p.out) rogueBonus(p);
    gainXp(p, 60 + 25 * levelIdx);
    if (p.out) { p.out = false; p.lives = 1; p.hp = Math.round(p.maxhp * 0.5); }
    else p.hp = Math.min(p.maxhp, p.hp + Math.round(p.maxhp * 0.45));
    p.dying = false; p.st = 'free'; p.t = 0; p.z = 0; p.vx = p.vy = p.vz = 0; p.inv = 90; p.kick = false;
    p.x = 70 + p.slot * 26; p.y = 198 + p.slot * 26; p.sp = Math.min(100, p.sp + 25);
    if (p.hero === 'papy') { p.cane = true; p.ping = 0; if (p.weapon) p.weapon = null; }
  }
  if (GMODE === 0 && levelIdx + 1 > unlocked) { unlocked = levelIdx + 1; lsSet('nfer_unlocked', String(unlocked)); }
  loadLevel(levelIdx + 1);
}
/* succès : sauvegardés en local, évalués à la fin de chaque partie pour le joueur de cet écran */
const ACHS = [['lv6', 'Sous la ville', 'Atteindre le niveau 6'], ['lv10', 'Chez l\'Architecte', 'Atteindre le niveau 10'], ['fin', 'Aller au bout', 'Finir les 10 niveaux'],
  ['flaw', 'Intouchable', 'Finir sans perdre une seule vie'], ['hard', 'Dur à cuire', 'Finir en difficile'], ['slay', 'Boucher', 'Mettre 150 ennemis K.O. dans une partie'], ['duo', 'Entre amis', 'Finir à plusieurs']];
let newAch = [], gameStats = null;
function doneAch() { let a = []; try { a = lsGet('nfer_ach', '').split(',').filter(Boolean); } catch (e) { /* ignoré */ } return a; }
function checkAch(kind) {
  const p = PS[online ? localSlot : 0]; newAch = [];
  if (!p) return;
  const win = kind === 'win', have = doneAch(), got = [];
  gameStats = { kills: p.kills | 0, lost: Math.max(0, 3 - p.lives) + (p.out ? 0 : 0), time: simF, level: levelIdx + 1, diff: DIFF, win };
  if (levelIdx >= 5) got.push('lv6');
  if (levelIdx >= 9) got.push('lv10');
  if (win) { got.push('fin'); if (p.lives >= 3 && !p.out) got.push('flaw'); if (DIFF === 2) got.push('hard'); if (nPlayers >= 2) got.push('duo'); }
  if ((p.kills | 0) >= 150) got.push('slay');
  for (const k of got) if (have.indexOf(k) < 0) { have.push(k); newAch.push(k); }
  if (newAch.length) lsSet('nfer_ach', have.join(','));
}
function endGame(kind) { state = kind; endT = 0; recordScores(); repSave(kind); if (GMODE === 4) TRP = true; try { if (!REP) checkAch(kind); } catch (e) { /* ignoré */ } }
function spawn(type, side) {
  const x = side > 0 ? cam + W + 16 : cam - 16;
  const e = mkEnemy(type, x, rnd(Y0 + 6, Y1 - 6));
  e.face = side > 0 ? -1 : 1;
  modEnemy(e);
  E.push(e);
  return e;
}
const livePlayers = () => PS.filter(p => !p.out && !p.dying);

/* ---------- combat ---------- */
function strike(att, a) {
  const x0 = att.x, x1 = att.x + att.face * a.reach;
  const lo = Math.min(x0, x1) - 5, hi = Math.max(x0, x1) + 5;
  const list = att.kind === 'p' ? E.concat(B, livePlayers().filter(q => q !== att)) : livePlayers();
  for (const t of list) {
    if (t.gone || t.dying || att.hit.has(t)) continue;
    if (t.kind !== 'b' && (t.st === 'down' || t.inv > 0)) continue;
    if (t.x < lo || t.x > hi || Math.abs(t.y - att.y) > 13 || Math.abs(t.z - att.z) > (a.zr || 26)) continue;
    att.hit.add(t);
    hurt(t, att, a, att.face);
  }
}
function strikeArea(att, a) {
  for (const t of E.concat(B, livePlayers().filter(q => q !== att))) {
    if (t.gone || t.dying || att.hit.has(t)) continue;
    if (t.kind !== 'b' && (t.st === 'down' || t.inv > 0)) continue;
    if (Math.abs(t.x - att.x) > a.r || Math.abs(t.y - att.y) > 22 || Math.abs(t.z - att.z) > 30) continue;
    att.hit.add(t);
    hurt(t, att, a, t.x >= att.x ? 1 : -1);
  }
}
function knock(t, dir) {
  if (t.weapon) { IT.push({ x: t.x, y: t.y, type: t.weapon, weapon: true, wd: t.wd, got: false, ttl: 720 }); t.weapon = null; t.wd = 0; }
  t.st = 'down'; t.t = 0; t.vz = 3.4; t.vx = dir * 2.1; t.z = Math.max(t.z, 1); t.kick = false; t.lie = 0;
  if (t.kind === 'p' && t.hero === 'fauteuil' && !t.nochair && !t.dying && rng() < 0.4) fallChair(t, dir);
}
/* le Rouleur chute de son fauteuil : il doit ramper jusqu'à lui pour remonter */
function fallChair(p, dir) {
  p.nochair = true; p.sprint = false; p.chx = p.x + dir * 24; p.chy = p.y;
  FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 40, txt: 'AÏE ! FAUTEUIL !', col: '#ffb060' });
}
/* particularités des héros : modifient les dégâts infligés (déterministe, uniquement des compteurs de simulation) */
function heroBonus(att, t, a) {
  let m = 1, txt = '', col = '#ffd34d';
  if (att.hero === 'vive' && att.z > 2) m = 1.8;
  else if (att.hero === 'ombre' && t.kind === 'e' && t.face === att.face) { m = 1.6; txt = 'DOS !'; }
  else if (att.hero === 'boxeur') {
    att.cn = (simF - (att.cT | 0) <= 45) ? Math.min(5, (att.cn | 0) + 1) : 0; att.cT = simF;
    if (att.cn > 0) { m = 1 + 0.1 * att.cn; if (att.cn >= 2) txt = 'x' + (att.cn + 1); }
  } else if (att.hero === 'dalto') {
    att.hc = (att.hc | 0) + 1;
    if (att.hc % 5 === 0) { m = 2; txt = 'CRITIQUE !'; col = '#ff8a4a'; }
  }
  if (txt) FX.push({ x: t.x, y: t.y, z: t.z + 50, t: 0, life: 26, txt, col });
  return m === 1 ? a : Object.assign({}, a, { dmg: Math.max(1, Math.round(a.dmg * m)) });
}
/* ---------- expérience et spécialisations ---------- */
const xpNeed = l => 80 + 120 * l;
function gainXp(p, n) {
  if (p.out || n <= 0) return;
  p.xp += n;
  while (p.xp >= xpNeed(p.xl)) {
    p.xp -= xpNeed(p.xl); p.xl++;
    p.maxhp += 4; p.hp = Math.min(p.maxhp, p.hp + Math.round(p.maxhp * 0.25));
    FX.push({ x: p.x, y: p.y, z: p.z + 58, t: 0, life: 46, txt: 'NIVEAU ' + (p.xl + 1) + ' !', col: '#7dff9a' });
    SFX.lvl();
  }
}
/* trois spécialisations par héros, proposées à la fin de chaque niveau ; effets : dgt = dégâts, vit = vitesse, spe = jauge spéciale, vol = vie volée, def = dégâts reçus en moins, pv = vie max */
const SPECS = {
  cogneur: [['Régénérateur', '+15 PV max', { pv: 15 }], ['Cogneur d\'élite', '+10% de dégâts', { dmg: 0.10 }], ['Endurci', '-8% de dégâts reçus', { dr: 0.08 }]],
  vive: [['Foudroyante', '+10% de vitesse', { spd: 0.10 }], ['Coups volants', '+12% de dégâts', { dmg: 0.12 }], ['Esquiveuse', '-8% de dégâts reçus', { dr: 0.08 }]],
  costaud: [['Mur de béton', '-10% de dégâts reçus', { dr: 0.10 }], ['Marteau', '+12% de dégâts', { dmg: 0.12 }], ['Colosse', '+20 PV max', { pv: 20 }]],
  ombre: [['Assassin', '+14% de dégâts', { dmg: 0.14 }], ['Furtif', '+12% de vitesse', { spd: 0.12 }], ['Vampire', 'vole 8% des dégâts', { ls: 0.08 }]],
  boxeur: [['Poings d\'acier', '+12% de dégâts', { dmg: 0.12 }], ['Garde haute', '-8% de dégâts reçus', { dr: 0.08 }], ['Second souffle', 'spécial +25% plus vite', { sp: 0.25 }]],
  medic: [['Soins de guerre', 'vole 10% des dégâts', { ls: 0.10 }], ['Réserve', '+18 PV max', { pv: 18 }], ['Charge rapide', 'spécial +30% plus vite', { sp: 0.30 }]],
  fauteuil: [['Turbo', '+14% de vitesse', { spd: 0.14 }], ['Blindage', '-12% de dégâts reçus', { dr: 0.12 }], ['Roues d\'acier', '+12% de dégâts', { dmg: 0.12 }]],
  papy: [['Canne ferrée', '+15% de dégâts', { dmg: 0.15 }], ['Vieux de la vieille', '+15 PV max, -6% reçus', { pv: 15, dr: 0.06 }], ['Sagesse', 'spécial +30% plus vite', { sp: 0.30 }]],
  dalto: [['Œil de lynx', '+10% de dégâts', { dmg: 0.10 }], ['Chanceux', '+8% de vitesse', { spd: 0.08 }], ['Résistant', '-8% de dégâts reçus', { dr: 0.08 }]],
  aveugle: [['Ouïe fine', '+12% de vitesse', { spd: 0.12 }], ['Écholocation', 'spécial +30% plus vite', { sp: 0.30 }], ['Instinct', '+12% de dégâts', { dmg: 0.12 }]],
  gitan: [['Grande famille', 'spécial +35% plus vite', { sp: 0.35 }], ['Sang chaud', '+12% de dégâts', { dmg: 0.12 }], ['Débrouillard', '+10% de vitesse, +10 PV', { spd: 0.10, pv: 10 }]],
  magicien: [['Illusionniste', '+14% de dégâts', { dmg: 0.14 }], ['Tour de passe-passe', 'spécial +30% plus vite', { sp: 0.30 }], ['Cape enchantée', '-10% de dégâts reçus', { dr: 0.10 }]],
  electricien: [['Haute tension', '+12% de dégâts', { dmg: 0.12 }], ['Gants isolants', '-10% de dégâts reçus', { dr: 0.10 }], ['Batterie', 'spécial +30% plus vite', { sp: 0.30 }]],
  livreur: [['Mollets d\'acier', '+10% de vitesse', { spd: 0.10 }], ['Casque renforcé', '-10% de dégâts reçus', { dr: 0.10 }], ['Pourboire', 'spécial +30% plus vite', { sp: 0.30 }]],
  enedis: [['Casque isolant', '-10% de dégâts reçus', { dr: 0.10 }], ['Nacelle', '+12% de vitesse', { spd: 0.12 }], ['Groupe électrogène', 'spécial +30% plus vite', { sp: 0.30 }]],
  pompier: [['Lance renforcée', '+12% de dégâts', { dmg: 0.12 }], ['Tenue d\'intervention', '-12% de dégâts reçus', { dr: 0.12 }], ['Endurance', '+20 PV max', { pv: 20 }]],
  policier: [['Entraînement', '+12% de dégâts', { dmg: 0.12 }], ['Gilet pare-balles', '-10% de dégâts reçus', { dr: 0.10 }], ['Renfort radio', 'spécial +30% plus vite', { sp: 0.30 }]],
  plombier: [['Grosse clé', '+14% de dégâts', { dmg: 0.14 }], ['Salopette épaisse', '-8% de dégâts reçus, +10 PV', { dr: 0.08, pv: 10 }], ['Pression maximale', 'spécial +30% plus vite', { sp: 0.30 }]],
  cuistot: [['Coup de main', 'vole 8% des dégâts', { ls: 0.08 }], ['Grand chef', '+12% de dégâts', { dmg: 0.12 }], ['Mise en place', 'spécial +30% plus vite', { sp: 0.30 }]]
};
let specOn = false, specT = 0, specCh = [0, 0, 0, 0], specLk = [false, false, false, false];
const specSkip = p => p.absent || (online && !act[p.slot]);
function startSpec() { specOn = true; specT = 0; specCh = [0, 0, 0, 0]; specLk = [false, false, false, false]; }
function pickSpec(p, i) {
  const sp = SPECS[p.hero][i], e = sp[2];
  p.specs[i] = (p.specs[i] | 0) + 1;
  if (e.pv) { p.maxhp += e.pv; p.hp = Math.min(p.maxhp, p.hp + e.pv); }
  for (const k of ['dmg', 'spd', 'sp', 'ls', 'dr']) if (e[k]) p.mods[k] += e[k];
}
function updSpec() {
  specT++;
  let all = true;
  for (const p of PS) {
    if (specSkip(p)) continue;
    const s = p.slot;
    if (specLk[s]) continue;
    all = false;
    const P = PRS[s];
    if (P.left) specCh[s] = (specCh[s] + 2) % 3;
    if (P.right) specCh[s] = (specCh[s] + 1) % 3;
    if (P.punch || P.jump) { specLk[s] = true; SFX.pick(); }
  }
  if (all || specT > 1500) {
    for (const p of PS) if (!specSkip(p)) pickSpec(p, specCh[p.slot]);
    specOn = false; nextLevel();
  }
}

function hurt(t, att, a, dir) {
  if (t.kind === 'b') { breakBarrel(t); return; }
  const ff = att.kind === 'p' && t.kind === 'p', vsF = ff && GMODE === 6, trF = ff && GMODE === 4 && att.slot === TRS;
  if (ff && !FRIENDLY && !vsF && !trF) return;
  if (att.kind === 'p' && !ff) {
    a = heroBonus(att, t, a);
    const dm = att.mods.dmg + Math.min(0.3, att.xl * 0.02);
    if (dm > 0) a = Object.assign({}, a, { dmg: Math.max(1, Math.round(a.dmg * (1 + dm))) });
  }
  if (t.kind === 'p') { t.hurtT = simF; t.cn = 0; }
  if (att.weapon && att.st === 'attack' && !a.ally && !WEAPONS[att.weapon].gun && !WEAPONS[att.weapon].nade) {
    att.wd--;
    if (att.wd <= 0) {
      att.weapon = null; SFX.brk();
      FX.push({ x: att.x + att.face * 12, y: att.y, z: 22, t: 0, life: 14, big: true });
      FX.push({ x: att.x, y: att.y, z: 46, t: 0, life: 40, txt: 'CASSÉ !' });
    }
  }
  const hp0 = t.hp;
  let dmgIn = ff ? (vsF ? a.dmg : Math.max(1, Math.round(a.dmg * (trF ? 0.8 : 0.5)))) : a.dmg;
  if (t.kind === 'p' && t.mods.dr > 0) dmgIn = Math.max(1, Math.round(dmgIn * (1 - t.mods.dr)));
  t.hp -= dmgIn; t.flash = 8;
  if (!ff && att.kind === 'p' && t.kind === 'e' && att.mods.ls > 0 && att.hp > 0) att.hp = Math.min(att.maxhp, att.hp + Math.max(1, Math.round(Math.min(dmgIn, hp0) * att.mods.ls)));
  if (ff && t.hp < 1 && !vsF && !trF) t.hp = 1;
  if (trF) { att.tc = (att.tc | 0) + 1; if (att.tc === 3 && !TRP) { TRP = true; ultBanner('LE TRAITRE EST ' + (att.name || '?') + ' !', '#ff4040'); } }
  if ((!ff || vsF) && att.kind === 'p' && att.st !== 'special' && !a.nosp) att.sp = Math.min(100, att.sp + a.dmg * 2.2 * (1 + att.mods.sp));
  if (!ff && t.kind === 'p') t.sp = Math.min(100, t.sp + a.dmg * 1.6 * (1 + t.mods.sp));
  hitstop = Math.max(hitstop, a.kd ? 6 : 3);
  FX.push({ x: t.x, y: t.y, z: t.z + 20, t: 0, life: a.kd ? 12 : 8, big: !!a.kd });
  if (a.kd) { shake = Math.max(shake, 6); SFX.big(); } else SFX.hit();
  if (t.kind === 'e' && (a.kd || (simF + (t.slot | 0)) % 3 === 0)) SFX.vox(t.type === 'boss' ? 2.2 : (T[t.type].sc || 1), false);
  if (att.kind === 'p' && !ff && t.kind === 'e') { att.score += Math.round(Math.min(a.dmg, hp0) * 5 * (a.ally ? 0.35 : 1));  /* kopins : 35 % des points */ tgt = t; tgtT = 150; }
  if (t.hp <= 0) {
    t.hp = 0; t.dying = true; knock(t, dir);
    if (t.kind === 'e' && att.kind === 'p') att.kills = (att.kills | 0) + 1;
    if (t.kind === 'e' && att.kind === 'p') gainXp(att, Math.round(T[t.type].score / 4 * (a.ally ? 0.35 : 1)));
    if (t.kind === 'e' && t.type === 'boss' && !t.split && att.kind === 'p') for (const q of PS) if (!q.out) giveLife(q, 'BOSS VAINCU : +1 VIE');
    SFX.ko(); if (t.kind === 'e') SFX.vox(t.type === 'boss' ? 2.2 : (T[t.type].sc || 1), true);
    return;
  }
  const armored = (t.kind === 'e' && T[t.type].armor && !a.kd && (t.st === 'tele' || t.st === 'attack' || t.st === 'charge')) ||
    (t.kind === 'e' && t.type === 'boss' && t.st === 'bspec') ||
    (t.kind === 'p' && t.hero === 'costaud' && !a.kd && (t.st === 'attack' || t.st === 'free'));
  if (armored) return;
  if (a.kd || t.z > 0) knock(t, dir);
  else { t.st = 'hurt'; t.t = 0; t.vx = dir * 1.4; t.hit = new Set(); }
}
function breakBarrel(b) {
  b.gone = true; SFX.brk();
  for (let i = 0; i < 5; i++) FX.push({ x: b.x + rnd(-6, 6), y: b.y, z: rnd(6, 18), t: 0, life: 14, big: false });
  const r = rng();
  if (r < 0.14) { const wt = rng() < 0.12 ? GKEYS[Math.floor(rng() * 4) % 4] : WKEYS[Math.floor(rng() * 3) % 3]; IT.push({ x: b.x, y: b.y, type: wt, weapon: true, wd: WEAPONS[wt].uses, got: false }); }
  else if (r < 0.48) IT.push({ x: b.x, y: b.y, type: 'apple', heal: 20 });
  else if (r < 0.54) IT.push({ x: b.x, y: b.y, type: 'energy', heal: 0 });
  else if (r < 0.59) IT.push({ x: b.x, y: b.y, type: 'shield', heal: 0 });
  else IT.push({ x: b.x, y: b.y, type: 'meat', heal: 45 });
}

