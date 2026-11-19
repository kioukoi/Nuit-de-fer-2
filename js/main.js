'use strict';
/* ---------- boucle principale (pas fixe à 60 Hz) ---------- */
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
