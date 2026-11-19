'use strict';
/* ---------- données ---------- */
const T = {
  thug: { hp: 30, sp: 0.8, sc: 1, col: { shirt: '#b3412f', pants: '#3a3a52', skin: '#e0b090', hair: '#2a1a1a', acc: '#d4a017', shoe: '#1a1a1a' },
    atk: { reach: 22, dmg: 8, tele: 24, dur: 14, act: [5, 8] }, score: 100, name: 'VOYOU' },
  brute: { hp: 70, sp: 0.45, sc: 1.3, armor: true, col: { shirt: '#5a3a1a', pants: '#2f2f2f', skin: '#c99a74', hair: '#2a1a0a', acc: '#c9c9c9', shoe: '#111' },
    atk: { reach: 28, dmg: 16, tele: 38, dur: 22, act: [8, 12], kd: true }, score: 250, name: 'COSTAUD' },
  thrower: { hp: 24, sp: 0.7, sc: 1, ranged: true, col: { shirt: '#6a3fa0', pants: '#2a2a40', skin: '#e0b090', hair: '#4a9a3a', acc: '#66cc66', acc2: '#e8e8f0', shoe: '#dddddd' },
    atk: { reach: 22, dmg: 7, tele: 30, dur: 14, act: [5, 8] }, score: 150, name: 'LANCEUR' },
  boss: { hp: 220, sp: 1.0, sc: 1.4, armor: true, col: { shirt: '#26262e', pants: '#1a1a22', skin: '#d9a07a', hair: '#d02828', acc: '#d02828', shoe: '#111' },
    atk: { reach: 30, dmg: 10, tele: 22, dur: 16, act: [5, 8] }, score: 2000, name: 'LE CHEF' }
};
const ATK = [
  { dur: 15, act: [4, 7], reach: 24, dmg: 6, kd: false, ext: 10 },
  { dur: 15, act: [4, 7], reach: 26, dmg: 7, kd: false, ext: 12 },
  { dur: 24, act: [7, 10], reach: 30, dmg: 11, kd: true, ext: 15 }
];
const SP_COST_VIVE = 50; // coût de la jauge SP du spécial de « vive » (les autres héros : 100)
const KICK = { reach: 24, dmg: 8, kd: false, zr: 52 };
const WEAPONS = {
  tuyau: { name: 'TUYAU', reach: 14, mul: 1.7, uses: 10 },
  batte: { name: 'BATTE', reach: 12, mul: 2.0, uses: 8 },
  couteau: { name: 'COUTEAU', reach: 5, mul: 1.5, uses: 12 }
};
const WKEYS = ['tuyau', 'batte', 'couteau'];
function withW(att, a) {
  const w = att.weapon && WEAPONS[att.weapon];
  if (!w) return a;
  const m = att.kind === 'e' ? 1 + (w.mul - 1) * 0.6 : w.mul;
  return Object.assign({}, a, { reach: a.reach + w.reach, dmg: Math.round(a.dmg * m) });
}
const HERO_KEYS = ['cogneur', 'vive', 'costaud'];
const HEROES = {
  cogneur: { name: 'LE COGNEUR', role: 'Équilibré', special: 'Tourbillon', sc: 1, hp: 100, spd: 1.5, jump: 4.4, dmg: 1, reach: 0, rate: 1, slam: 0,
    col: { shirt: '#2f6fd0', pants: '#3b4f8a', skin: '#e6b48c', hair: '#3a2418', acc: '#e03030', acc2: '#f2f2f2', shoe: '#f2f2f2' } },
  vive: { name: 'LA VIVE', role: 'Rapide', special: 'Roulade', sc: 1, hp: 80, spd: 1.95, jump: 4.9, dmg: 0.8, reach: 0, rate: 0.8, slam: 0,
    col: { shirt: '#2fb59a', pants: '#22222e', skin: '#e8b894', hair: '#e0a030', acc: '#f5d442', acc2: '#ffffff', shoe: '#f5f5f5' } },
  costaud: { name: 'LE COSTAUD', role: 'Lourd', special: 'Coup de masse', sc: 1.15, hp: 130, spd: 1.1, jump: 3.9, dmg: 1.45, reach: 4, rate: 1.25, slam: 14,
    col: { shirt: '#d9622b', pants: '#3b4036', skin: '#b07850', hair: '#1a1210', acc: '#d9a21b', shoe: '#2a2a2a' } }
};
for (const k of HERO_KEYS) {
  const h = HEROES[k];
  h.atk = ATK.map(a => ({
    dur: Math.round(a.dur * h.rate), act: a.act.map(x => Math.round(x * h.rate)), reach: a.reach + h.reach,
    dmg: Math.max(1, Math.round(a.dmg * h.dmg)), kd: a.kd, ext: a.ext + h.reach
  }));
  h.kick = { reach: KICK.reach + h.reach, dmg: Math.round(KICK.dmg * h.dmg), kd: false, zr: 52 };
}
const LV = {
  weapons: [[170, 232, 'tuyau'], [330, 205, 'batte'], [640, 228, 'couteau'], [900, 205, 'batte'], [1180, 235, 'tuyau'], [1450, 215, 'couteau'], [1700, 200, 'batte'], [2000, 228, 'tuyau']],
  barrels: [[300, 190], [520, 220], [760, 175], [1000, 205], [1300, 222], [1500, 182], [1650, 185], [1880, 212]],
  waves: [
    { cam: 120, spawn: [['thug', 1], ['thug', -1]] },
    { cam: 560, spawn: [['thug', 1], ['thug', -1], ['thug', 1]] },
    { cam: 980, spawn: [['brute', 1], ['thug', -1]] },
    { cam: 1380, spawn: [['thrower', 1], ['thug', -1], ['thug', 1], ['thrower', -1]] },
    { cam: 1700, spawn: [['brute', 1], ['thrower', -1], ['thug', 1]] },
    { cam: 1920, boss: true, spawn: [['boss', 1]] }
  ]
};

