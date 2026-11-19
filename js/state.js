'use strict';
/* ---------- état du jeu ---------- */
let state = 'title', PS = [], E = [], B = [], IT = [], PJ = [], FX = [];
let cam = 0, camLimit = LEN - W, waveI = 0, waveActive = false;
let menuOpen = false, menuIdx2 = 0, RAW = {}, sfxOn = true;
let hitstop = 0, shake = 0, tgt = null, tgtT = 0, goT = 0, tick = 0, endT = 0, paused = false, attackers = 0;
let menuIdx = 0, SEL = [{ c: 0, lock: false }, { c: 1, lock: false }], selT = 0;

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
  return { kind: 'p', hero, slot, x: 70 + slot * 26, y: 198 + slot * 26, z: 0, vx: 0, vy: 0, vz: 0, face: 1, hp: hr.hp, maxhp: hr.hp,
    st: 'free', t: 0, stage: 0, buf: false, kick: false, kt: 0, hit: new Set(), inv: 0, flash: 0, walk: 0, mv: false,
    dying: false, lie: 0, lives: 3, score: 0, cd: 0, out: false, refund: false, sp: 50, weapon: null, wd: 0 };
}
function mkEnemy(type, x, y) {
  const d = T[type], hp = Math.round(d.hp * (nPlayers === 2 ? 1.5 : 1));
  return { kind: 'e', type, x, y, z: 0, vx: 0, vy: 0, vz: 0, face: -1, hp, maxhp: hp, st: 'move', t: 0,
    cool: rnd(20, 70), side: rng() < 0.5 ? -1 : 1, slot: rnd(0, 30), hit: new Set(), inv: 0, flash: 0, walk: 0,
    mode: 'punch', tele: 24, combo: 0, phase: 1, dying: false, gone: false, lie: 0, mv: false, weapon: null, wd: 0, likesW: rng() < 0.7 };
}
function startGame() {
  PS = SEL.slice(0, nPlayers).map((s, i) => mkPlayer(HERO_KEYS[s.c], i));
  E = []; PJ = []; FX = []; IT = LV.weapons.map(([x, y, type]) => ({ x, y, type, weapon: true, wd: WEAPONS[type].uses, got: false }));
  B = LV.barrels.map(([x, y]) => ({ kind: 'b', x, y, z: 0, hp: 1, gone: false, flash: 0 }));
  cam = 0; camLimit = LEN - W; waveI = 0; waveActive = false;
  hitstop = 0; shake = 0; tgt = null; tgtT = 0; goT = 0; endT = 0; paused = false;
  seedRng(online ? netSeed : (Date.now() >>> 0));
  state = 'play';
}
function spawn(type, side) {
  const x = side > 0 ? cam + W + 16 : cam - 16;
  const e = mkEnemy(type, x, rnd(Y0 + 6, Y1 - 6));
  e.face = side > 0 ? -1 : 1;
  E.push(e);
  return e;
}
const livePlayers = () => PS.filter(p => !p.out && !p.dying);

