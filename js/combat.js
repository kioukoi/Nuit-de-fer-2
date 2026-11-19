'use strict';
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
}
function hurt(t, att, a, dir) {
  if (t.kind === 'b') { breakBarrel(t); return; }
  const ff = att.kind === 'p' && t.kind === 'p';
  if (att.weapon && att.st === 'attack') {
    att.wd--;
    if (att.wd <= 0) {
      att.weapon = null; SFX.brk();
      FX.push({ x: att.x + att.face * 12, y: att.y, z: 22, t: 0, life: 14, big: true });
      FX.push({ x: att.x, y: att.y, z: 46, t: 0, life: 40, txt: 'CASSÉ !' });
    }
  }
  t.hp -= ff ? Math.max(1, Math.round(a.dmg * 0.5)) : a.dmg; t.flash = 8;
  if (ff && t.hp < 1) t.hp = 1;
  if (!ff && att.kind === 'p' && att.st !== 'special') att.sp = Math.min(100, att.sp + a.dmg * 2.2);
  if (!ff && t.kind === 'p') t.sp = Math.min(100, t.sp + a.dmg * 1.6);
  hitstop = Math.max(hitstop, a.kd ? 6 : 3);
  FX.push({ x: t.x, y: t.y, z: t.z + 20, t: 0, life: a.kd ? 12 : 8, big: !!a.kd });
  if (a.kd) { shake = Math.max(shake, 6); SFX.big(); } else SFX.hit();
  if (att.kind === 'p' && !ff) { att.score += 10; if (t.kind === 'e') { tgt = t; tgtT = 150; } }
  if (t.hp <= 0) {
    t.hp = 0; t.dying = true; knock(t, dir);
    if (t.kind === 'e' && att.kind === 'p') att.score += T[t.type].score;
    SFX.ko();
    return;
  }
  const armored = (t.kind === 'e' && T[t.type].armor && !a.kd && (t.st === 'tele' || t.st === 'attack' || t.st === 'charge')) ||
    (t.kind === 'p' && t.hero === 'costaud' && !a.kd && t.st === 'attack');
  if (armored) return;
  if (a.kd || t.z > 0) knock(t, dir);
  else { t.st = 'hurt'; t.t = 0; t.vx = dir * 1.4; t.hit = new Set(); }
}
function breakBarrel(b) {
  b.gone = true; SFX.brk();
  for (let i = 0; i < 5; i++) FX.push({ x: b.x + rnd(-6, 6), y: b.y, z: rnd(6, 18), t: 0, life: 14, big: false });
  const r = rng();
  if (r < 0.14) { const wt = WKEYS[Math.floor(rng() * 3) % 3]; IT.push({ x: b.x, y: b.y, type: wt, weapon: true, wd: WEAPONS[wt].uses, got: false }); }
  else if (r < 0.58) IT.push({ x: b.x, y: b.y, type: 'apple', heal: 20 });
  else IT.push({ x: b.x, y: b.y, type: 'meat', heal: 45 });
}

