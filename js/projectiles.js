'use strict';
/* ====================================================================
   PROJECTILES lancés : mise à jour et dessin
   ==================================================================== */
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
function drawProj(b) {
  const sx = Math.round(b.x - cam), sy = Math.round(b.y - b.z);
  g.save(); g.translate(sx, sy); g.rotate(b.rot);
  if (b.wtype) { g.translate(-9, 0); drawWeaponGround(b.wtype); }
  else { g.fillStyle = '#6c6'; g.fillRect(-2, -5, 4, 10); g.fillStyle = '#cfc'; g.fillRect(-1, -7, 2, 3); }
  g.restore();
}
