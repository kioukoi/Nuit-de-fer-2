/* ---------- boucle principale (pas fixe à 60 Hz) ---------- */
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(online ? 600 : 100, now - last); last = now;
  if (acc > 600) acc = 600;
  try { while (acc >= 1000 / 60) { if (step() === 'stall') break; acc -= 1000 / 60; } } catch (e) { acc = 0; try { console.error(e); } catch (e2) { /* ignoré */ } }   // une erreur ne doit jamais figer la boucle   // en ligne : on n'avance pas sans les touches de l'autre, puis on rattrape le retard
  try { ambUpdate(); } catch (e) { /* ignoré */ }
  try { render(); } catch (e) { try { console.error(e); } catch (e2) { /* ignoré */ } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
