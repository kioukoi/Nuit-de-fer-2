'use strict';
/* ====================================================================
   EFFETS visuels (étincelles, textes flottants)
   ==================================================================== */
function drawFX(f) {
  const sx = Math.round(f.x - cam), sy = Math.round(f.y - f.z), k = f.t / f.life;
  if (f.txt) { g.globalAlpha = 1 - k * k; txt(f.txt, sx, sy - f.t * 0.6, 9, '#ff9a5a', 'center'); g.globalAlpha = 1; return; }
  g.globalAlpha = 1 - k;
  g.fillStyle = f.big ? '#ffd34d' : '#ffffff';
  const r = (f.big ? 5 : 3) + f.t * 0.8;
  g.fillRect(sx - r, sy - 1, r * 2, 2); g.fillRect(sx - 1, sy - r, 2, r * 2);
  g.fillRect(sx - r * 0.6, sy - r * 0.6, 2, 2); g.fillRect(sx + r * 0.6, sy + r * 0.6, 2, 2);
  g.globalAlpha = 1;
}
