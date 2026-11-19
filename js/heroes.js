'use strict';
/* ====================================================================
   HÉROS : données, création, mise à jour, attaques et HUD des joueurs
   ==================================================================== */
const ATK = [
  { dur: 15, act: [4, 7], reach: 24, dmg: 6, kd: false, ext: 10 },
  { dur: 15, act: [4, 7], reach: 26, dmg: 7, kd: false, ext: 12 },
  { dur: 24, act: [7, 10], reach: 30, dmg: 11, kd: true, ext: 15 }
];
const SP_COST_VIVE = 50; // coût de la jauge SP du spécial de « vive » (les autres héros : 100)
const KICK = { reach: 24, dmg: 8, kd: false, zr: 52 };
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
function mkPlayer(hero, slot) {
  const hr = HEROES[hero];
  return { kind: 'p', hero, slot, x: 70 + slot * 26, y: 198 + slot * 26, z: 0, vx: 0, vy: 0, vz: 0, face: 1, hp: hr.hp, maxhp: hr.hp,
    st: 'free', t: 0, stage: 0, buf: false, kick: false, kt: 0, hit: new Set(), inv: 0, flash: 0, walk: 0, mv: false,
    dying: false, lie: 0, lives: 3, score: 0, cd: 0, out: false, refund: false, sp: 50, weapon: null, wd: 0 };
}
const livePlayers = () => PS.filter(p => !p.out && !p.dying);
function startAttack(p, stage) {
  p.st = 'attack'; p.stage = stage; p.t = 0; p.buf = false; p.hit = new Set(); SFX.whoosh();
}
function updPlayer(p) {
  const I = HLD[p.slot], Pp = PRS[p.slot], hr = HEROES[p.hero];
  if (p.inv > 0) p.inv--;
  if (p.flash > 0) p.flash--;
  if (p.cd > 0) p.cd--;
  p.mv = false;
  if (Pp.throw && p.weapon && (p.st === 'free' || p.st === 'air' || p.st === 'attack')) {
    PJ.push({ x: p.x + p.face * 12, y: p.y, z: p.z + 22, vx: p.face * 5.2, life: 56, rot: 0, wtype: p.weapon, wd: p.wd, own: p });
    p.weapon = null; p.wd = 0; SFX.whoosh();
  }
  switch (p.st) {
    case 'free': {
      let dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dy = (I.down ? 1 : 0) - (I.up ? 1 : 0);
      if (dx && dy) { dx *= 0.8; dy *= 0.8; }
      p.x += dx * hr.spd; p.y += dy * hr.spd * 0.7;
      if (dx) p.face = dx > 0 ? 1 : -1;
      if (dx || dy) { p.mv = true; p.walk += 0.14 * hr.spd; }
      if (Pp.jump) { p.st = 'air'; p.vz = hr.jump; p.vx = dx * hr.spd; p.vy = dy * 0.8; p.kick = false; SFX.jump(); }
      else if (Pp.special) {
        const cost = p.hero === 'vive' ? SP_COST_VIVE : 100;
        if (p.sp >= cost) {
          p.sp -= cost;
          if (p.hero === 'vive') { p.st = 'roll'; p.t = 0; p.hit = new Set(); p.inv = 24; p.vx = p.face * 3.4; p.cd = 50; SFX.whoosh(); }
          else { p.st = 'special'; p.t = 0; p.hit = new Set(); p.inv = 26; SFX.special(); }
        }
      } else if (Pp.punch) startAttack(p, 0);
      break;
    }
    case 'attack': {
      p.t++;
      const a = hr.atk[p.stage];
      if (Pp.punch) p.buf = true;
      if (p.t >= a.act[0] && p.t <= a.act[1]) strike(p, withW(p, a));
      if (p.t >= a.dur) {
        if (p.buf && p.stage < 2) startAttack(p, p.stage + 1);
        else p.st = 'free';
      }
      break;
    }
    case 'air': {
      p.x += p.vx; p.y += p.vy; p.vz -= 0.22; p.z += p.vz;
      if (Pp.punch && !p.kick) { p.kick = true; p.kt = 0; p.hit = new Set(); SFX.whoosh(); }
      if (p.kick) { p.kt++; if (p.kt >= 1 && p.kt <= 24) strike(p, hr.kick); }
      if (p.z <= 0) { p.z = 0; p.st = 'free'; p.kick = false; p.vx = 0; p.vy = 0; }
      break;
    }
    case 'special': {
      p.t++;
      if (p.hero === 'costaud') {
        if (p.t === 12) {
          p.hit = new Set();
          strikeArea(p, { r: 56, dmg: hr.slam, kd: true });
          shake = Math.max(shake, 8); SFX.big();
          if (p.hit.size && p.refund) { p.hp = Math.min(p.maxhp, p.hp + 8); p.refund = false; }
        }
        if (p.t >= 32) p.st = 'free';
      } else {
        if (p.t === 10) p.hit = new Set();
        if ((p.t >= 4 && p.t <= 8) || (p.t >= 10 && p.t <= 16)) {
          const before = p.hit.size;
          strikeArea(p, { r: 40, dmg: 9, kd: p.t >= 10 });
          if (p.hit.size > before && p.refund) { p.hp = Math.min(p.maxhp, p.hp + 8); p.refund = false; }
        }
        if (p.t >= 26) p.st = 'free';
      }
      break;
    }
    case 'roll': {
      p.t++; p.x += p.vx; p.vx *= 0.96;
      strike(p, { reach: 16, dmg: 5, kd: false });
      if (p.t >= 24) p.st = 'free';
      break;
    }
    case 'hurt': {
      p.t++; p.x += p.vx; p.vx *= 0.8;
      if (p.t >= 16) p.st = 'free';
      break;
    }
    case 'down': {
      p.t++; p.x += p.vx; p.vx *= 0.97; p.vz -= 0.25; p.z += p.vz;
      if (p.z <= 0) { p.z = 0; p.vz = 0; p.vx *= 0.8; p.lie++; }
      if (p.z === 0 && p.lie > 40) {
        if (p.dying) {
          p.lives--;
          if (p.lives > 0) {
            p.hp = p.maxhp; p.dying = false; p.st = 'free'; p.inv = 120; p.x = cam + 40 + p.slot * 24; p.y = 205 + p.slot * 20; p.lie = 0;
          } else { p.out = true; }
        } else { p.st = 'free'; p.inv = 90; p.lie = 0; }
      }
      break;
    }
  }
  p.x = clamp(p.x, cam + 10, cam + W - 10);
  p.y = clamp(p.y, Y0, Y1);
  if (p.st !== 'down') {
    for (const it of IT) {
      if (!it.got && Math.abs(it.x - p.x) < 12 && Math.abs(it.y - p.y) < 10) {
        if (it.weapon) {
          if (!p.weapon && p.st === 'free') { p.weapon = it.type; p.wd = it.wd; it.got = true; SFX.pick(); }
        } else { p.hp = Math.min(p.maxhp, p.hp + it.heal); it.got = true; SFX.pick(); }
      }
    }
    IT = IT.filter(i => !i.got);
  }
}
function durBar(p, x, y) {
  const r = p.wd / WEAPONS[p.weapon].uses, low = p.wd <= 3;
  bar(x, y, 50, 4, r, low ? (((tick >> 3) & 1) ? '#ff6a4a' : '#c03020') : '#e8c050');
}
function spBar(p, x, y, w) {
  const cost = p.hero === 'vive' ? SP_COST_VIVE : 100, ready = p.sp >= cost;
  const flash = ready && ((tick >> 3) & 1);
  bar(x, y, w, 6, p.sp / 100, ready ? (flash ? '#fff7b0' : '#ffd34d') : '#4aa8ff');
  if (ready) { g.strokeStyle = flash ? '#fff' : '#ffd34d'; g.lineWidth = 1; g.strokeRect(x - 1.5, y - 1.5, w + 3, 9); }
  if (cost < 100) { g.fillStyle = '#000'; g.fillRect(x + Math.round(w * cost / 100), y, 1, 6); }
}
function hudPlayer(p, i) {
  const left = i === 0, col = left ? '#8cf' : '#fb7', r = p.hp / p.maxhp;
  const life = p.out ? 'HORS JEU' : 'x' + p.lives;
  const cost = p.hero === 'vive' ? SP_COST_VIVE : 100, ready = p.sp >= cost;
  const lab = ready ? 'SPÉCIAL PRÊT !' : 'SPÉCIAL', lc = ready ? '#ffd34d' : '#cfe0ff';
  if (left) {
    txt('J1', 8, 16, 10, col); bar(26, 8, 90, 8, r); txt(life, 122, 16, 10, p.out ? '#e66' : '#fff');
    spBar(p, 26, 20, 90); txt(lab, 122, 27, 8, lc);
    txt(String(p.score).padStart(6, '0'), 8, 42, 9, '#fff');
    if (p.weapon) { txt(WEAPONS[p.weapon].name + '  [E] lancer', 8, 54, 8, '#ffd34d'); durBar(p, 8, 58); }
  } else {
    txt('J2', W - 8, 16, 10, col, 'right'); bar(W - 116, 8, 90, 8, r); txt(life, W - 122, 16, 10, p.out ? '#e66' : '#fff', 'right');
    spBar(p, W - 116, 20, 90); txt(lab, W - 122, 27, 8, lc, 'right');
    txt(String(p.score).padStart(6, '0'), W - 8, 42, 9, '#fff', 'right');
    if (p.weapon) { txt(WEAPONS[p.weapon].name + '  [T] lancer', W - 8, 54, 8, '#ffd34d', 'right'); durBar(p, W - 58, 58); }
  }
}
