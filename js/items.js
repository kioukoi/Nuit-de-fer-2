'use strict';
/* ====================================================================
   OBJETS (pommes, viande, armes au sol) : mise à jour et dessin
   ==================================================================== */
function updItems() {
  for (const it of IT) if (it.ttl !== undefined && !it.got && --it.ttl <= 0) it.got = true;
  IT = IT.filter(i => !i.got);
}
function drawItem(it) {
  if (it.got) return;
  if (it.ttl !== undefined && it.ttl < 180 && ((tick >> 2) & 1)) return;
  const sx = Math.round(it.x - cam), sy = Math.round(it.y);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + 1, it.weapon ? 9 : 6, 2, 0, 0, 7); g.fill();
  if (it.weapon) {
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.12), by = sy - 4 - Math.round(pulse * 2);
    g.fillStyle = 'rgba(255,220,100,' + (0.18 + pulse * 0.16) + ')'; g.beginPath(); g.ellipse(sx, sy - 2, 18, 6, 0, 0, 7); g.fill();
    g.save(); g.translate(sx - 14, by); g.rotate(-0.12); g.scale(1.5, 1.5);
    drawWeaponGround(it.type);
    g.restore();
    txt(WEAPONS[it.type].name, sx, by - 12 - Math.round(pulse * 2), 7, '#ffd34d', 'center');
    return;
  }
  if (it.type === 'apple') {
    g.fillStyle = '#d83030'; g.beginPath(); g.arc(sx, sy - 6, 5, 0, 7); g.fill();
    g.fillStyle = '#3a9a3a'; g.fillRect(sx, sy - 12, 3, 3);
  } else {
    g.fillStyle = '#b86a3a'; g.fillRect(sx - 7, sy - 10, 14, 8);
    g.fillStyle = '#f0e8d0'; g.fillRect(sx + 5, sy - 11, 5, 4);
  }
}
