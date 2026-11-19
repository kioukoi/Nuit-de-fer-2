'use strict';
/* ---------- ennemis ---------- */
function targetOf(e) {
  let best = null, bd = 1e9;
  for (const p of PS) {
    if (p.out || p.dying) continue;
    const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 1.5;
    if (d < bd) { bd = d; best = p; }
  }
  return best || PS.find(p => !p.out) || PS[0];
}
function startTele(e, mode) {
  const d = T[e.type];
  e.st = 'tele'; e.t = 0; e.mode = mode; e.hit = new Set();
  e.tele = mode === 'charge' ? 36 : d.atk.tele;
  e.combo = (e.type === 'boss' && e.phase >= 2 && mode === 'punch') ? 1 : 0;
}
function bossPhase(e) {
  const r = e.hp / e.maxhp, ph = r > 0.66 ? 1 : (r > 0.33 ? 2 : 3);
  if (ph > e.phase) {
    e.phase = ph;
    if (ph === 3) { spawn('thug', 1); spawn('thug', -1); }
  }
}
function updEnemy(e) {
  const d = T[e.type], p = targetOf(e);
  if (e.flash > 0) e.flash--;
  if (e.inv > 0) e.inv--;
  if (e.cool > 0) e.cool--;
  if (e.st !== 'move') e.mv = false;
  switch (e.st) {
    case 'move': {
      if (e.type === 'boss') bossPhase(e);
      e.face = p.x >= e.x ? 1 : -1;
      e.walk += 0.18;
      const sp = d.sp * (e.type === 'boss' ? 1 + 0.15 * (e.phase - 1) : 1);
      const maxAtt = nPlayers === 2 ? 3 : 2;
      const busy = attackers >= maxAtt || e.cool > 0;
      const rr = d.atk.reach + (e.weapon ? WEAPONS[e.weapon].reach * 0.8 : 0);
      let tx, ty = p.y, goW = null;
      if (!e.weapon && e.likesW && e.type !== 'boss') {
        let bd = 110;
        for (const it of IT) {
          if (!it.weapon || it.got || it.x < cam + 12 || it.x > cam + W - 12) continue;
          const dd = Math.abs(it.x - e.x) + Math.abs(it.y - e.y);
          if (dd < bd) { bd = dd; goW = it; }
        }
      }
      if (goW) { tx = goW.x; ty = goW.y; }
      else if (d.ranged && !e.weapon) tx = clamp(p.x + e.side * 150, cam + 24, cam + W - 24);
      else tx = p.x + e.side * (busy ? 60 + e.slot : rr - 8);
      const dx = tx - e.x, dy = ty - e.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (goW && Math.abs(dx) < 9 && Math.abs(dy) < 8) { goW.got = true; e.weapon = goW.type; e.wd = goW.wd; SFX.pick(); }
      e.mv = dist > 2;
      if (dist > 2) { e.x += dx / dist * sp; e.y += dy / dist * sp * 0.75; }
      e.y = clamp(e.y, Y0, Y1);
      if (!busy && p.st !== 'down' && !p.dying && !p.out) {
        if (d.ranged && !e.weapon) {
          if (Math.abs(p.x - e.x) < rr + 6 && Math.abs(p.y - e.y) < 9) startTele(e, 'punch');
          else if (Math.abs(p.y - e.y) < 8 && Math.abs(p.x - e.x) > 80 && e.x > cam + 10 && e.x < cam + W - 10) startTele(e, 'throw');
        } else if (Math.abs(p.x - e.x) < rr + 6 && Math.abs(p.y - e.y) < 9) startTele(e, 'punch');
        else if (e.type === 'boss' && Math.abs(p.x - e.x) > 70 && rng() < 0.02) startTele(e, 'charge');
        else if (e.weapon && e.type !== 'boss' && Math.abs(p.y - e.y) < 8 && Math.abs(p.x - e.x) > 70 && Math.abs(p.x - e.x) < 150 && rng() < 0.01) startTele(e, 'throw');
      }
      break;
    }
    case 'tele': {
      e.t++;
      if (e.t < e.tele - 6) e.face = p.x >= e.x ? 1 : -1;
      if (e.t >= e.tele) {
        e.t = 0; e.hit = new Set();
        if (e.mode === 'throw') {
          PJ.push({ x: e.x + e.face * 10, y: e.y, z: 22, vx: e.face * (e.weapon ? 3.6 : 2.8), life: 140, rot: 0, wtype: e.weapon || undefined, wd: e.wd });
          e.weapon = null; e.wd = 0;
          e.st = 'recover'; SFX.whoosh();
        } else if (e.mode === 'charge') { e.st = 'charge'; e.vx = e.face * 3.8; SFX.whoosh(); }
        else { e.st = 'attack'; SFX.whoosh(); }
      }
      break;
    }
    case 'attack': {
      e.t++;
      const a = d.atk;
      if (e.t >= a.act[0] && e.t <= a.act[1]) strike(e, withW(e, a));
      if (e.t >= a.dur) {
        if (e.combo > 0) { e.combo--; e.st = 'tele'; e.mode = 'punch'; e.tele = 8; e.t = 0; e.hit = new Set(); }
        else { e.st = 'recover'; e.t = 0; }
      }
      break;
    }
    case 'charge': {
      e.t++; e.x += e.vx; e.walk += 0.5;
      strike(e, { reach: 22, dmg: 14, kd: true });
      if (e.t >= 26 || e.x < cam + 8 || e.x > cam + W - 8) { e.st = 'recover'; e.t = 0; }
      break;
    }
    case 'recover': {
      e.t++;
      if (e.t >= (e.type === 'boss' ? 36 : 28)) {
        e.st = 'move'; e.cool = rnd(40, 90) * (e.type === 'boss' ? 0.6 : 1); e.side = rng() < 0.5 ? -1 : 1;
      }
      break;
    }
    case 'hurt': {
      e.t++; e.x += e.vx; e.vx *= 0.8;
      if (e.t >= 18) e.st = 'move';
      break;
    }
    case 'down': {
      e.t++; e.x += e.vx; e.vz -= 0.25; e.z += e.vz;
      if (e.z <= 0) { e.z = 0; e.vz = 0; e.vx *= 0.8; e.lie++; }
      if (e.z === 0 && e.lie > 40) {
        if (e.dying) e.gone = true;
        else { e.st = 'move'; e.inv = 40; e.lie = 0; e.t = 0; e.cool = 30; }
      }
      break;
    }
  }
}
function separate() {
  for (let i = 0; i < E.length; i++) {
    const a = E[i];
    if (a.gone || a.st === 'down') continue;
    for (let j = i + 1; j < E.length; j++) {
      const b = E[j];
      if (b.gone || b.st === 'down') continue;
      if (Math.abs(a.x - b.x) < 12 && Math.abs(a.y - b.y) < 6) {
        const s = a.x < b.x ? -1 : 1;
        a.x += s * 0.5; b.x -= s * 0.5;
        a.y += a.y < b.y ? -0.3 : 0.3; b.y += a.y < b.y ? 0.3 : -0.3;
      }
    }
  }
}
function updItems() {
  for (const it of IT) if (it.ttl !== undefined && !it.got && --it.ttl <= 0) it.got = true;
  IT = IT.filter(i => !i.got);
}
function dropWeapon(b, hitX) {
  if (!b.wtype || b.spent) return;
  b.spent = true;
  const wd = b.wd - (hitX !== undefined ? 3 : 0);
  if (wd > 0) IT.push({ x: clamp(hitX !== undefined ? hitX : b.x, cam + 12, cam + W - 12), y: clamp(b.y, Y0, Y1), type: b.wtype, weapon: true, wd, got: false, ttl: 720 });
  else { SFX.brk(); FX.push({ x: b.x, y: b.y, z: b.z, t: 0, life: 14, big: true }); }
}
function updProj() {
  for (const b of PJ) {
    b.x += b.vx; b.life--; b.rot += b.wtype ? 0.55 : 0.4;
    if (b.own) {                       // arme lancée par un joueur : touche ennemis et barils
      for (const t of E.concat(B)) {
        if (t.gone || t.dying) continue;
        if (t.kind !== 'b' && t.st === 'down') continue;
        if (Math.abs(b.x - t.x) < 11 && Math.abs(b.y - t.y) < 10 && Math.abs(b.z - (t.z + 14)) < 28) {
          hurt(t, b.own, { dmg: Math.round(9 * WEAPONS[b.wtype].mul), kd: true }, Math.sign(b.vx));
          dropWeapon(b, t.x); b.life = 0; break;
        }
      }
    } else {
      for (const p of livePlayers()) {
        if (p.inv <= 0 && p.st !== 'down' && Math.abs(b.x - p.x) < 8 && Math.abs(b.y - p.y) < 10 && Math.abs(b.z - (p.z + 16)) < 22) {
          hurt(p, { kind: 'e' }, { dmg: b.wtype ? 10 : 7, kd: !!b.wtype }, Math.sign(b.vx));
          dropWeapon(b, p.x); b.life = 0; break;
        }
      }
    }
    if (b.x < cam - 20 || b.x > cam + W + 20) b.life = 0;
    if (b.life <= 0) dropWeapon(b);
  }
  PJ = PJ.filter(b => b.life > 0);
}

/* ---------- vagues et caméra ---------- */
function updWaves() {
  const w = LV.waves[waveI];
  if (waveActive) {
    if (E.every(e => e.gone || e.dying)) {
      waveActive = false; camLimit = LEN - W; goT = 240;
      if (w && w.boss) endT = 150;
      waveI++;
    }
  } else if (w && cam >= w.cam - 0.01) {
    waveActive = true; camLimit = cam; goT = 0;
    for (const [k, s] of w.spawn) spawn(k, s);
    if (nPlayers === 2 && !w.boss) spawn('thug', rng() < 0.5 ? 1 : -1);
  }
}

