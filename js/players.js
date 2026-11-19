'use strict';
/* ---------- joueurs ---------- */
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

