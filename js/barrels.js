'use strict';
/* ====================================================================
   TONNEAUX : destruction et dessin
   ==================================================================== */
function breakBarrel(b) {
  b.gone = true; SFX.brk();
  for (let i = 0; i < 5; i++) FX.push({ x: b.x + rnd(-6, 6), y: b.y, z: rnd(6, 18), t: 0, life: 14, big: false });
  const r = rng();
  if (r < 0.14) { const wt = WKEYS[Math.floor(rng() * 3) % 3]; IT.push({ x: b.x, y: b.y, type: wt, weapon: true, wd: WEAPONS[wt].uses, got: false }); }
  else if (r < 0.58) IT.push({ x: b.x, y: b.y, type: 'apple', heal: 20 });
  else IT.push({ x: b.x, y: b.y, type: 'meat', heal: 45 });
}
function drawBarrel(b) {
  const sx = Math.round(b.x - cam), sy = Math.round(b.y);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(sx, sy + 1, 9, 3, 0, 0, 7); g.fill();
  g.fillStyle = '#7a4a22'; g.fillRect(sx - 7, sy - 20, 14, 20);
  g.fillStyle = '#4a4a52'; g.fillRect(sx - 7, sy - 16, 14, 2); g.fillRect(sx - 7, sy - 6, 14, 2);
  g.fillStyle = '#8f5a2a'; g.fillRect(sx - 5, sy - 20, 3, 20);
}
