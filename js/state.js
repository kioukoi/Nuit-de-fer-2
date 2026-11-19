'use strict';
/* ====================================================================
   ÉTAT DU JEU : variables globales, générateur aléatoire
   ==================================================================== */
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
