/* ---------- données ---------- */
const T = {
  thug: { hp: 30, sp: 0.8, sc: 1, col: { shirt: '#b3412f', pants: '#3a3a52', skin: '#e0b090', hair: '#2a1a1a', acc: '#d4a017', shoe: '#1a1a1a' },
    atk: { reach: 22, dmg: 8, tele: 24, dur: 14, act: [5, 8] }, score: 100, name: 'VOYOU' },
  brute: { hp: 70, sp: 0.45, sc: 1.3, armor: true, col: { shirt: '#5a3a1a', pants: '#2f2f2f', skin: '#c99a74', hair: '#2a1a0a', acc: '#c9c9c9', shoe: '#111' },
    atk: { reach: 28, dmg: 16, tele: 38, dur: 22, act: [8, 12], kd: true }, score: 250, name: 'COSTAUD' },
  thrower: { hp: 24, sp: 0.7, sc: 1, ranged: true, col: { shirt: '#6a3fa0', pants: '#2a2a40', skin: '#e0b090', hair: '#4a9a3a', acc: '#66cc66', acc2: '#e8e8f0', shoe: '#dddddd' },
    atk: { reach: 22, dmg: 7, tele: 30, dur: 14, act: [5, 8] }, score: 150, name: 'LANCEUR' },
  marin: { hp: 34, sp: 1.1, sc: 1, col: { shirt: '#e8e8f0', pants: '#1f2a4a', skin: '#c99a74', hair: '#2a1a10', acc: '#2f6fd0', shoe: '#222' },
    atk: { reach: 22, dmg: 8, tele: 17, dur: 13, act: [4, 7] }, score: 130, name: 'MARIN' },
  soudeur: { hp: 64, sp: 0.5, sc: 1.15, armor: true, col: { shirt: '#c87a1a', pants: '#3a3a3a', skin: '#d9a07a', hair: '#222', acc: '#ffcc00', shoe: '#222' },
    atk: { reach: 34, dmg: 13, tele: 34, dur: 20, act: [8, 12], kd: true }, score: 260, name: 'SOUDEUR' },
  garde: { hp: 92, sp: 0.62, sc: 1.1, armor: true, col: { shirt: '#14141c', pants: '#101018', skin: '#e0b090', hair: '#111', acc: '#c0c0d0', shoe: '#0a0a0a' },
    atk: { reach: 26, dmg: 14, tele: 26, dur: 16, act: [6, 9], kd: true }, score: 320, name: 'GARDE' },
  crs: { hp: 58, sp: 0.62, sc: 1.1, armor: true, col: { shirt: '#1a2a55', pants: '#10183a', skin: '#e0b090', hair: '#222', acc: '#3a6ad0', shoe: '#0a0a0a' },
    atk: { reach: 26, dmg: 12, tele: 24, dur: 16, act: [6, 9] }, score: 300, name: 'CRS' },
  crsc: { hp: 46, sp: 0.8, sc: 1.05, charger: true, col: { shirt: '#1a2a55', pants: '#10183a', skin: '#d8a888', hair: '#222', acc: '#e04040', shoe: '#0a0a0a' },
    atk: { reach: 22, dmg: 10, tele: 20, dur: 14, act: [5, 8] }, score: 280, name: 'CRS CHARGE' },
  crsgaz: { hp: 38, sp: 0.66, sc: 1.05, ranged: true, gas: true, col: { shirt: '#1a2a55', pants: '#10183a', skin: '#d8a888', hair: '#222', acc: '#9acd4a', shoe: '#0a0a0a' },
    atk: { reach: 22, dmg: 7, tele: 30, dur: 14, act: [5, 8] }, score: 260, name: 'CRS LACRYMO' },
  boss: { hp: 220, sp: 1.0, sc: 1.4, armor: true, col: { shirt: '#26262e', pants: '#1a1a22', skin: '#d9a07a', hair: '#d02828', acc: '#d02828', shoe: '#111' },
    atk: { reach: 30, dmg: 10, tele: 22, dur: 16, act: [5, 8] }, score: 2000, name: 'LE CHEF' }
};
const ATK = [
  { dur: 15, act: [4, 7], reach: 24, dmg: 6, kd: false, ext: 10 },
  { dur: 15, act: [4, 7], reach: 26, dmg: 7, kd: false, ext: 12 },
  { dur: 24, act: [7, 10], reach: 30, dmg: 11, kd: true, ext: 15 }
];
const KICK = { reach: 24, dmg: 8, kd: false, zr: 52 };
const WEAPONS = {
  tuyau: { name: 'TUYAU', reach: 14, mul: 1.7, uses: 10 },
  batte: { name: 'BATTE', reach: 12, mul: 2.0, uses: 8 },
  couteau: { name: 'COUTEAU', reach: 5, mul: 1.5, uses: 12 },
  pancarte: { name: 'PANCARTE', reach: 16, mul: 1.7, uses: 10 },
  pave: { name: 'PAVÉ', reach: 3, mul: 2.4, uses: 4 },
  /* armes à feu : rares. Tirer = touche de lancer (L) ; uses = munitions. En mêlée : coup de crosse. */
  pistolet: { name: 'PISTOLET', reach: 2, mul: 1.2, uses: 8, gun: 'pistol' },
  mitraillette: { name: 'MITRAILLETTE', reach: 2, mul: 1.2, uses: 24, gun: 'smg' },
  grenade: { name: 'GRENADE', reach: 0, mul: 1, uses: 2, nade: true }
};
const GKEYS = ['pistolet', 'grenade', 'pistolet', 'mitraillette'];
const WKEYS = ['tuyau', 'batte', 'couteau'];
function withW(att, a) {
  const w = att.weapon && WEAPONS[att.weapon];
  if (att.kind === 'e' && att.dm && att.dm !== 1) a = Object.assign({}, a, { dmg: Math.round(a.dmg * att.dm) });
  if (!w) return a;
  const m = att.kind === 'e' ? 1 + (w.mul - 1) * 0.6 : w.mul;
  return Object.assign({}, a, { reach: a.reach + w.reach, dmg: Math.round(a.dmg * m) });
}
const HERO_KEYS = ['cogneur', 'vive', 'costaud', 'ombre', 'boxeur', 'medic', 'fauteuil', 'papy', 'dalto', 'aveugle', 'gitan', 'magicien', 'electricien', 'livreur'];
const HEROES = {
  cogneur: { trait: 'Régénère hors combat', name: 'LE COGNEUR', role: 'Équilibré', special: 'Tourbillon', sc: 1, hp: 100, spd: 1.5, jump: 4.4, dmg: 1, reach: 0, rate: 1, slam: 0, cost: 100,
    col: { shirt: '#2f6fd0', pants: '#3b4f8a', skin: '#e6b48c', hair: '#3a2418', acc: '#e03030', acc2: '#f2f2f2', shoe: '#f2f2f2' } },
  vive: { trait: 'Coup volant x1,8', name: 'LA VIVE', role: 'Rapide', special: 'Roulade', sc: 1, hp: 80, spd: 1.95, jump: 4.9, dmg: 0.8, reach: 0, rate: 0.8, slam: 0, cost: 50,
    col: { shirt: '#2fb59a', pants: '#22222e', skin: '#e8b894', hair: '#e0a030', acc: '#f5d442', acc2: '#ffffff', shoe: '#f5f5f5' } },
  costaud: { trait: 'Armure, sprint lent', name: 'LE COSTAUD', role: 'Lourd', special: 'Coup de masse', sc: 1.15, hp: 130, spd: 1.1, jump: 3.9, dmg: 1.45, reach: 4, rate: 1.25, slam: 14, cost: 100,
    col: { shirt: '#d9622b', pants: '#3b4036', skin: '#b07850', hair: '#1a1210', acc: '#d9a21b', shoe: '#2a2a2a' } },
  ombre: { trait: 'Dos des ennemis x1,6', name: 'L\'OMBRE', role: 'Ninja', special: 'Shurikens', sc: 1, hp: 85, spd: 1.8, jump: 5.0, dmg: 0.9, reach: 0, rate: 0.85, slam: 0, cost: 50,
    col: { shirt: '#2a2c3e', pants: '#171822', skin: '#e0b48c', hair: '#111118', acc: '#d03030', acc2: '#8a8fa8', shoe: '#1a1a24' } },
  boxeur: { trait: 'Série de coups +50%', name: 'LE BOXEUR', role: 'Combos', special: 'Uppercut', sc: 1.05, hp: 105, spd: 1.4, jump: 4.2, dmg: 1.05, reach: 0, rate: 0.68, slam: 0, cost: 100,
    col: { shirt: '#c82828', pants: '#f0f0f4', skin: '#8f5e3c', hair: '#15100c', acc: '#f0c030', acc2: '#ffffff', shoe: '#c82828' } },
  medic: { trait: 'Nourriture x2, points en soignant', name: 'LA MÉDIC', role: 'Soutien', special: 'Soins', sc: 1, hp: 90, spd: 1.5, jump: 4.4, dmg: 0.85, reach: 0, rate: 0.9, slam: 0, cost: 100,
    col: { shirt: '#f4f4f8', pants: '#2a7a5a', skin: '#d8a07a', hair: '#6a3a20', acc: '#d82828', acc2: '#ffffff', shoe: '#f4f4f8' } },
  /* héros « handicap » : statistiques faibles ou contrainte de jeu (voir les effets d'écran dans le rendu) */
  fauteuil: { trait: 'Anti-choc, sprint +', name: 'LE ROULEUR', role: 'Fauteuil roulant', special: 'Charge-roues', sc: 1, hp: 70, spd: 0.95, jump: 1.7, dmg: 0.7, reach: 0, rate: 1.15, slam: 0, cost: 100,
    col: { shirt: '#8a3fb0', pants: '#2a2f3a', skin: '#e0ac84', hair: '#2a1c12', acc: '#ffd23a', acc2: '#ffffff', shoe: '#f0f0f0' } },
  papy: { trait: 'Canne lancée, titube', name: 'LE PAPY', role: 'Canne et rhumatismes', special: 'Coup de canne', sc: 1, hp: 60, spd: 0.8, jump: 2.4, dmg: 0.6, reach: 2, rate: 1.3, slam: 0, cost: 100,
    col: { shirt: '#a8925a', pants: '#5a5a66', skin: '#ecc6a6', hair: '#e8e8ee', acc: '#8a5a28', acc2: '#ffffff', shoe: '#4a3a2a' } },
  dalto: { trait: '1 coup sur 5 critique', name: 'LE DALTONIEN', role: 'Couleurs en vrac', special: 'Tourbillon', sc: 1, hp: 95, spd: 1.45, jump: 4.4, dmg: 0.95, reach: 0, rate: 0.95, slam: 0, cost: 100,
    col: { shirt: '#d04a3a', pants: '#3a8a3a', skin: '#e2b08a', hair: '#6a4a2a', acc: '#3fb04a', acc2: '#f2f2f2', shoe: '#e8e8e8' } },
  aveugle: { trait: 'Spécial : voit 4 s', name: 'L\'AVEUGLE', role: 'Vue : presque nulle', special: 'Écholocation', sc: 1, hp: 80, spd: 1.35, jump: 4.0, dmg: 1.0, reach: 0, rate: 0.95, slam: 0, cost: 70,
    col: { shirt: '#d8d8e0', pants: '#22222a', skin: '#dfae8a', hair: '#2a2a32', acc: '#e8e8f0', acc2: '#ffffff', shoe: '#222228' } },
  gitan: { trait: 'Appelle 3 copains', name: 'LE GITAN', role: 'Famille nombreuse', special: 'Appel du kopin', sc: 1.08, hp: 85, spd: 1.45, jump: 4.4, dmg: 0.9, reach: 0, rate: 0.95, slam: 0, cost: 100,
    col: { shirt: '#17171c', pants: '#1c1e26', skin: '#d2a07a', hair: '#2a2420', acc: '#f0c030', acc2: '#e8b020', shoe: '#e8e8ee' } },
  magicien: { trait: 'Coup 3 : boule magique', name: 'LE MAGICIEN', role: 'Tours de magie', special: 'Pluie de cartes', sc: 1, hp: 75, spd: 1.4, jump: 4.4, dmg: 0.8, reach: 0, rate: 0.9, slam: 0, cost: 100,
    col: { shirt: '#26264a', pants: '#1c1c2c', skin: '#e2b48e', hair: '#2a1a28', acc: '#c02848', acc2: '#ffffff', shoe: '#14141e' } },
  electricien: { trait: 'Insensible aux chocs', name: 'L\'ÉLECTRICIEN', role: 'Courant fort', special: 'Court-circuit', sc: 1, hp: 95, spd: 1.4, jump: 4.4, dmg: 1.05, reach: 0, rate: 0.95, slam: 0, cost: 100,
    col: { shirt: '#f08a1c', pants: '#2a4a8a', skin: '#d9a37a', hair: '#3a2a1a', acc: '#f5d020', acc2: '#ffffff', shoe: '#4a3a2a' } },
  livreur: { trait: 'Vélo : très rapide', name: 'LE LIVREUR', role: 'Livraison express', special: 'Tournée express', sc: 1, hp: 80, spd: 1.75, jump: 4.4, dmg: 0.85, reach: 0, rate: 0.85, slam: 0, cost: 100,
    col: { shirt: '#1fb5a3', pants: '#1d2530', skin: '#6b4430', hair: '#14100e', acc: '#1fb5a3', acc2: '#ffffff', shoe: '#e8e8ee' } }
};
for (const k of HERO_KEYS) {
  const h = HEROES[k];
  h.atk = ATK.map(a => ({
    dur: Math.round(a.dur * h.rate), act: a.act.map(x => Math.round(x * h.rate)), reach: a.reach + h.reach,
    dmg: Math.max(1, Math.round(a.dmg * h.dmg)), kd: a.kd, ext: a.ext + h.reach
  }));
  h.kick = { reach: KICK.reach + h.reach, dmg: Math.round(KICK.dmg * h.dmg), kd: false, zr: 52 };
}
/* ---------- niveaux : 4 lieux, difficulté croissante ----------
   hpM / dmgM / spdM : multiplicateurs de vie, dégâts et vitesse des ennemis ; coolM : pause entre deux attaques. */
const LEVELS = [
  { id: 0, bpm: 96, tr: 0, name: 'LA RUE', place: 'Quartier nord, la nuit', bg: 'street', hpM: 1, dmgM: 1, spdM: 1, coolM: 1, bossName: 'LE CHEF', bossHp: 220, summon: ['thug', 'thug'], tint: {},
    weapons: [[170, 232, 'tuyau'], [330, 205, 'batte'], [640, 228, 'couteau'], [900, 205, 'batte'], [1180, 235, 'tuyau'], [1450, 215, 'couteau'], [1700, 200, 'batte'], [2000, 228, 'tuyau']],
    barrels: [[300, 190], [520, 220], [760, 175], [1000, 205], [1300, 222], [1500, 182], [1650, 185], [1880, 212]],
    waves: [
      { cam: 120, spawn: [['thug', 1], ['thug', -1]] },
      { cam: 560, spawn: [['thug', 1], ['thug', -1], ['thug', 1]] },
      { cam: 980, spawn: [['brute', 1], ['thug', -1]] },
      { cam: 1380, spawn: [['thrower', 1], ['thug', -1], ['thug', 1], ['thrower', -1]] },
      { cam: 1700, spawn: [['brute', 1], ['thrower', -1], ['thug', 1]] },
      { cam: 1920, boss: true, spawn: [['boss', 1]] }
    ] },
  { id: 1, bpm: 84, tr: -2, name: 'LE PORT', place: 'Docks au crépuscule', bg: 'port', hpM: 1.2, dmgM: 1.15, spdM: 1.08, coolM: 0.9, bossName: 'LE CAPITAINE', bossHp: 250, summon: ['marin', 'thrower'],
    tint: { thug: { shirt: '#2f6f9a', pants: '#3a3a2a', hair: '#3a2a1a', acc: '#f0c030' }, brute: { shirt: '#8a6a2a', pants: '#2a3a4a', acc: '#e0e0e0' },
      thrower: { shirt: '#2a7a6a', hair: '#e8e8e8', acc: '#f0c030' }, boss: { shirt: '#1f3a6a', pants: '#14203a', hair: '#e8e8e8', acc: '#e8c040' } },
    weapons: [[190, 220, 'batte'], [420, 235, 'tuyau'], [700, 205, 'couteau'], [980, 230, 'tuyau'], [1240, 210, 'batte'], [1520, 232, 'couteau'], [1800, 215, 'batte'], [1240, 222, 'pistolet']],
    barrels: [[260, 200], [480, 225], [720, 185], [940, 215], [1200, 200], [1460, 188], [1700, 222], [1900, 195]],
    waves: [
      { cam: 120, spawn: [['thug', 1], ['thug', -1], ['thug', 1]] },
      { cam: 480, spawn: [['thug', 1], ['thrower', -1], ['thug', -1], ['thug', 1]] },
      { cam: 820, spawn: [['brute', 1], ['thug', -1], ['thug', 1]] },
      { cam: 1160, spawn: [['thrower', 1], ['thrower', -1], ['thug', 1], ['thug', -1]] },
      { cam: 1480, spawn: [['brute', 1], ['brute', -1], ['thrower', 1]] },
      { cam: 1760, spawn: [['brute', 1], ['thug', -1], ['thug', 1], ['thrower', -1]] },
      { cam: 1920, boss: true, spawn: [['boss', 1]] }
    ] },
  { id: 2, bpm: 108, tr: 3, name: 'L\'USINE', place: 'Fonderie abandonnée', bg: 'factory', hpM: 1.45, dmgM: 1.3, spdM: 1.15, coolM: 0.8, bossName: 'LE CONTREMAÎTRE', bossHp: 290, summon: ['soudeur', 'marin'],
    tint: { thug: { shirt: '#c87a1a', pants: '#4a4a5a', hair: '#2a1a10', acc: '#ffcc00' }, brute: { shirt: '#7a2a1a', pants: '#3a3a3a', acc: '#ffcc00' },
      thrower: { shirt: '#4a5a6a', hair: '#c04a2a', acc: '#ff8a2a' }, boss: { shirt: '#8a3a10', pants: '#2a1a10', hair: '#6a3a1a', acc: '#ffcc00' } },
    weapons: [[200, 225, 'tuyau'], [460, 205, 'batte'], [740, 232, 'tuyau'], [1020, 215, 'couteau'], [1300, 200, 'batte'], [1580, 230, 'tuyau'], [1840, 210, 'couteau'], [740, 222, 'grenade'], [1580, 205, 'pistolet']],
    barrels: [[280, 195], [540, 228], [800, 182], [1060, 220], [1340, 190], [1600, 215], [1860, 200]],
    waves: [
      { cam: 120, spawn: [['thug', 1], ['thug', -1], ['thug', 1], ['thug', -1]] },
      { cam: 450, spawn: [['brute', 1], ['thrower', -1], ['thug', -1], ['thug', 1]] },
      { cam: 780, spawn: [['thrower', 1], ['thrower', -1], ['thrower', 1], ['thug', -1]] },
      { cam: 1100, spawn: [['brute', 1], ['brute', -1], ['thug', 1], ['thug', -1]] },
      { cam: 1400, spawn: [['thrower', 1], ['thrower', -1], ['brute', 1], ['thug', -1], ['thug', 1]] },
      { cam: 1650, spawn: [['brute', 1], ['brute', -1], ['thrower', 1], ['thrower', -1]] },
      { cam: 1800, spawn: [['brute', 1], ['brute', -1], ['thug', 1], ['thug', -1], ['thrower', 1]] },
      { cam: 1920, boss: true, spawn: [['boss', 1]] }
    ] },
  { id: 3, bpm: 120, tr: -5, name: 'LE TOIT', place: 'Tour du Patron, sous l\'orage', bg: 'roof', hpM: 1.75, dmgM: 1.5, spdM: 1.22, coolM: 0.7, bossName: 'LE PATRON', bossHp: 340, summon: ['garde', 'garde'],
    tint: { thug: { shirt: '#2a2a36', pants: '#15151f', hair: '#101018', acc: '#c0c0d0' }, brute: { shirt: '#40202a', pants: '#1a1a22', acc: '#c0c0d0' },
      thrower: { shirt: '#1a3a4a', hair: '#40e0ff', acc: '#40e0ff' }, boss: { shirt: '#e8e8f0', pants: '#d8d8e0', hair: '#d4a017', acc: '#d4a017' } },
    weapons: [[210, 215, 'batte'], [480, 232, 'couteau'], [760, 208, 'tuyau'], [1040, 228, 'batte'], [1330, 205, 'couteau'], [1620, 225, 'tuyau'], [1000, 222, 'grenade'], [1560, 208, 'mitraillette']],
    barrels: [[320, 190], [600, 222], [880, 195], [1180, 228], [1460, 192], [1740, 218]],
    waves: [
      { cam: 120, spawn: [['thug', 1], ['thug', -1], ['thug', 1], ['brute', -1]] },
      { cam: 440, spawn: [['brute', 1], ['brute', -1], ['thrower', 1], ['thrower', -1]] },
      { cam: 760, spawn: [['thug', 1], ['thug', -1], ['thug', 1], ['thug', -1], ['thrower', 1], ['thrower', -1]] },
      { cam: 1060, spawn: [['brute', 1], ['brute', -1], ['thug', 1], ['thug', -1], ['thug', 1]] },
      { cam: 1330, spawn: [['thrower', 1], ['thrower', -1], ['thrower', 1], ['brute', -1], ['brute', 1]] },
      { cam: 1580, spawn: [['brute', 1], ['brute', -1], ['brute', 1], ['thug', -1], ['thug', 1]] },
      { cam: 1780, spawn: [['brute', 1], ['brute', -1], ['thrower', 1], ['thrower', -1], ['thug', 1], ['thug', -1]] },
      { cam: 1920, boss: true, spawn: [['boss', 1]] }
    ] },
  { id: 4, bpm: 132, tr: 4, name: 'PARIS', place: 'Boulevard parisien, jour de manifestation', bg: 'paris', hpM: 2.0, dmgM: 1.65, spdM: 1.28, coolM: 0.62, bossName: 'LE PRÉSIDENT', bossHp: 380, summon: ['crs', 'crsc'],
    tint: { boss: { shirt: '#1c2a52', pants: '#141c38', hair: '#b8bcc8', acc: '#c02030' } },
    weapons: [[200, 218, 'pancarte'], [470, 232, 'pave'], [740, 205, 'pancarte'], [1010, 228, 'pave'], [1290, 210, 'pancarte'], [1580, 230, 'pave'], [1800, 208, 'pancarte'], [1010, 222, 'grenade'], [1620, 212, 'mitraillette']],
    barrels: [[330, 192], [610, 222], [890, 196], [1170, 226], [1450, 190], [1700, 218]],
    waves: [
      { cam: 120, spawn: [['crs', 1], ['crs', -1], ['crsc', 1]] },
      { cam: 440, spawn: [['crsgaz', 1], ['crsgaz', -1], ['crs', 1], ['crs', -1]] },
      { cam: 760, spawn: [['crsc', 1], ['crsc', -1], ['crsc', 1], ['crsc', -1]] },
      { cam: 1060, spawn: [['crs', 1], ['crs', -1], ['crsgaz', 1], ['crsgaz', -1], ['crsc', 1]] },
      { cam: 1330, spawn: [['crsc', 1], ['crsc', -1], ['crs', 1], ['crs', -1], ['crsgaz', 1]] },
      { cam: 1580, spawn: [['crs', 1], ['crs', -1], ['crs', 1], ['crsgaz', -1], ['crsgaz', 1], ['crsc', -1]] },
      { cam: 1780, spawn: [['crsc', 1], ['crsc', -1], ['crs', 1], ['crs', -1], ['crsgaz', 1], ['crsgaz', -1]] },
      { cam: 1920, boss: true, spawn: [['boss', 1]] }
    ] }
];
/* ---------- pièges : t = type ; per = durée du cycle (images) ; ph = décalage ----------
   cable : fil électrique (danger à la fin du cycle) · crate : caisse de grue · steam : jet de vapeur · press : presse · belt : tapis roulant · bolt : foudre */
LEVELS[0].traps = [
  { t: 'cable', x: 430, y: 205, per: 260, ph: 0 }, { t: 'cable', x: 1120, y: 222, per: 240, ph: 80 }, { t: 'cable', x: 1790, y: 195, per: 250, ph: 150 }
];
LEVELS[1].traps = [
  { t: 'crate', x: 380, y: 205, per: 230, ph: 0 }, { t: 'crate', x: 760, y: 232, per: 250, ph: 90 }, { t: 'crate', x: 1180, y: 195, per: 230, ph: 40 },
  { t: 'crate', x: 1560, y: 228, per: 220, ph: 150 }, { t: 'cable', x: 980, y: 210, per: 240, ph: 100 }, { t: 'cable', x: 1700, y: 200, per: 240, ph: 20 }
];
LEVELS[2].traps = [
  { t: 'steam', x: 350, y: 195, per: 210, ph: 0 }, { t: 'steam', x: 690, y: 228, per: 200, ph: 70 }, { t: 'steam', x: 1010, y: 200, per: 210, ph: 130 }, { t: 'steam', x: 1460, y: 220, per: 200, ph: 30 },
  { t: 'press', x: 880, y: 212, per: 260, ph: 40 }, { t: 'press', x: 1730, y: 200, per: 250, ph: 160 },
  { t: 'belt', x: 520, w: 210, dir: -1 }, { t: 'belt', x: 1230, w: 260, dir: 1 }
];
LEVELS[3].traps = [
  { t: 'bolt', per: 210, ph: 0 }, { t: 'bolt', per: 270, ph: 140 },
  { t: 'cable', x: 700, y: 212, per: 220, ph: 60 }, { t: 'cable', x: 1500, y: 200, per: 220, ph: 150 }, { t: 'cable', x: 1050, y: 232, per: 230, ph: 0 }
];
LEVELS[4].traps = [
  { t: 'water', x: 300, y: 196, dir: 1, len: 170, per: 300, ph: 0 }, { t: 'water', x: 1150, y: 226, dir: -1, len: 170, per: 290, ph: 120 }, { t: 'water', x: 1700, y: 200, dir: -1, len: 170, per: 300, ph: 60 },
  { t: 'fire', x: 620, y: 215, per: 220, ph: 0 }, { t: 'fire', x: 980, y: 195, per: 230, ph: 90 }, { t: 'fire', x: 1450, y: 232, per: 220, ph: 40 },
  { t: 'cable', x: 820, y: 230, per: 240, ph: 30 }
];
/* chaque lieu a ses propres ennemis : on remplace une partie des voyous / costauds */
(function () {
  const MIX = { 1: { thug: 'marin' }, 2: { brute: 'soudeur' }, 3: { brute: 'garde' } };
  LEVELS.forEach((lv, li) => { const m = MIX[li]; if (!m) return;
    lv.waves.forEach((w, wi) => w.spawn.forEach((s, si) => { if (m[s[0]] && (li === 3 || (wi + si) % 2 === 0)) s[0] = m[s[0]]; })); });
})();
/* attaques spéciales des boss par phase (cumulatives) et attaque ultime */
LEVELS[0].bspec = [['leap'], ['leap', 'wave'], ['leap', 'wave']]; LEVELS[0].ult = 'rush';
LEVELS[1].bspec = [['wave'], ['wave', 'leap'], ['wave', 'leap']]; LEVELS[1].ult = 'rain';
LEVELS[2].bspec = [['quake'], ['quake', 'leap'], ['quake', 'leap']]; LEVELS[2].ult = 'furnace';
LEVELS[3].bspec = [['shots'], ['shots', 'blink'], ['shots', 'blink']]; LEVELS[3].ult = 'storm';
LEVELS[4].bspec = [['shots'], ['shots', 'escort'], ['shots', 'blink', 'escort']]; LEVELS[4].ult = 'jets';
const ULT_TXT = { rush: 'ESQUIVEZ SES CHARGES !', rain: 'FUYEZ LES MARQUES AU SOL !', furnace: 'SAUTEZ PAR-DESSUS LES ONDES !', storm: 'FUYEZ LES MARQUES : FOUDRE !', jets: 'SORTEZ DES JETS DES CANONS À EAU !' };
let TR = [], simF = 0, HZ = [], ultT = 0, ultK = '';
let LV = LEVELS[0], levelIdx = 0, startLevel = 0, introT = 0;


