/* ---------- boucle principale (pas fixe à 60 Hz) ---------- */
let last = performance.now(), acc = 0;
function advance(now) {
  acc += Math.min(online ? 600 : 100, now - last); last = now;
  if (acc > 600) acc = 600;
  try { while (acc >= 1000 / 60) { if (step() === 'stall') break; acc -= 1000 / 60; } } catch (e) { acc = 0; try { console.error(e); } catch (e2) { /* ignoré */ } }   // une erreur ne doit jamais figer la boucle   // en ligne : on n'avance pas sans les touche
}
function frame(now) {
  advance(performance.now());
  try { ambUpdate(); } catch (e) { /* ignoré */ }
  try { render(); } catch (e) { try { console.error(e); } catch (e2) { /* ignoré */ } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
/* Onglet masqué ou fenêtre recouverte : le navigateur coupe requestAnimationFrame, la partie de ce joueur se figeait et tous les autres attendaient (le délai montait). Un minuteur dans un Worker n'est pas bridé : il continue de faire avancer la simulation (sans dessin) tant que l'animation est coupée. */
try {
  const wk = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},16)'], { type: 'text/javascript' })));
  wk.onmessage = () => { if (online && state === 'play' && performance.now() - last > 50) advance(performance.now()); };
} catch (e) { /* pas de Worker : on garde la boucle d'animation seule */ }
