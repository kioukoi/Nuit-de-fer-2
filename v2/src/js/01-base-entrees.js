
'use strict';
/* ====================================================================
   COMPAS NOIR (ex-Nuit de fer) — prototype d'un beat'em up à défilement horizontal
   3 héros, 1 niveau, 3 types d'ennemis, 1 boss, 1 ou 2 joueurs en local.
   ==================================================================== */
const W = 480, H = 270, LEN = 2400, Y0 = 158, Y1 = 254;
const RS = 3;
const cv = document.getElementById('c');
let g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
/* souris et tactile dans les menus : chaque écran de menu déclare ses zones cliquables (HIT) à chaque image ; les clics sont traités dans step() */
let HIT = [], PTRQ = [];
function ptrHit(e) {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  for (let i = HIT.length - 1; i >= 0; i--) { const h = HIT[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return { h, x, y }; }
  return null;
}
cv.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const r = ptrHit(e); cv.style.cursor = r ? 'pointer' : 'default'; if (r && r.h.hov) r.h.hov(); });
cv.addEventListener('pointerdown', e => { cv.focus(); unlockAudio(); const r = ptrHit(e); if (r && r.h.fn) PTRQ.push(() => r.h.fn(r.x)); });

/* ---------- entrées ---------- */
const SP_COST_VIVE = 50;
let REPLAY = false;          // vrai pendant le rattrapage d'une partie en cours (aucun son)
const ACT = ['left', 'right', 'up', 'down', 'punch', 'jump', 'special', 'throw'];
const KEYS_SOLO = {
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  punch: ['KeyJ', 'KeyF'], jump: ['Space', ''], special: ['KeyK', 'KeyG'], throw: ['KeyL', 'KeyH']
};
/* touches modifiables (options > COMMANDES) : deux touches par action, enregistrées dans le navigateur */
const KEYS_DEF = JSON.stringify(KEYS_SOLO);
try { const sv = JSON.parse(localStorage.getItem('nfer_keys') || 'null'); if (sv) for (const a in KEYS_SOLO) if (Array.isArray(sv[a]) && sv[a].length === 2) KEYS_SOLO[a] = sv[a].map(String); } catch (e) { /* ignoré */ }
const keysSave = () => { try { localStorage.setItem('nfer_keys', JSON.stringify(KEYS_SOLO)); } catch (e) { /* ignoré */ } };
let KCAP = null, KLM = null;                                   // KCAP : { a, slot } pendant la capture d'une touche
try { if (navigator.keyboard && navigator.keyboard.getLayoutMap) navigator.keyboard.getLayoutMap().then(m => { KLM = m; }).catch(() => {}); } catch (e) { /* ignoré */ }
function kname(c) {
  if (!c) return '—';
  const m = KLM && KLM.get(c); if (m && m.length === 1) return m.toUpperCase();
  const F = { Space: 'ESPACE', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Enter: 'ENTRÉE', ShiftLeft: 'MAJ G', ShiftRight: 'MAJ D', ControlLeft: 'CTRL G', ControlRight: 'CTRL D', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Backquote: '²' };
  if (F[c]) return F[c];
  return c.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'PAV ');
}
const KEYS_P1 = { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], punch: ['KeyF'], jump: ['KeyG'], special: ['KeyH'], throw: ['KeyT'] };
const KEYS_P2 = {
  left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
  punch: ['Comma', 'Numpad1'], jump: ['Period', 'Numpad2'], special: ['Slash', 'Numpad3'], throw: ['KeyM']
};
const keys = {}; window.__keys = keys;
let nPlayers = 1;
const HLD = [{}, {}, {}, {}], PRS = [{}, {}, {}, {}], OLD = [{}, {}, {}, {}];
let START = false, PAUSE = false, MENUK = false, oldS = false, oldP = false, oldE = false;
addEventListener('keydown', e => {
  if (KCAP) {                                                  // capture d'une touche pour les commandes
    e.preventDefault(); const c = KCAP; KCAP = null;
    if (e.code !== 'Escape') {
      const row = KEYS_SOLO[c.a], old = row[c.slot];
      for (const a in KEYS_SOLO) KEYS_SOLO[a].forEach((k, i) => { if (k === e.code && !(a === c.a && i === c.slot)) KEYS_SOLO[a][i] = old; });   // échange si la touche servait déjà
      row[c.slot] = e.code; keysSave();
    }
    return;
  }
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (state === 'name') {
    if (e.key.length === 1 && nameBuf.length < 10 && /[A-Za-z0-9 _.!?\-éèêàùçï]/.test(e.key)) nameBuf += e.key.toUpperCase();
    else if (e.key === 'Backspace') nameBuf = nameBuf.slice(0, -1);
  }
  if (state === 'online' && olStage === 'joining') {
    if (/^[a-zA-Z0-9]$/.test(e.key) && codeBuf.length < 5) codeBuf += e.key.toUpperCase();
    else if (e.key === 'Backspace') codeBuf = codeBuf.slice(0, -1);
  }
  unlockAudio();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function gpFor(i) {
  const pads = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).filter(Boolean);
  if (online) return i === localSlot ? pads[0] : undefined;
  return nPlayers === 1 ? pads[0] : pads[i];
}
function padHeld(gp, n) {
  const b = i => gp.buttons[i] && gp.buttons[i].pressed;
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  switch (n) {
    case 'left': return ax < -0.4 || b(14);
    case 'right': return ax > 0.4 || b(15);
    case 'up': return ay < -0.4 || b(12);
    case 'down': return ay > 0.4 || b(13);
    case 'punch': return b(2);
    case 'jump': return b(0);
    case 'special': return b(1) || b(3);
    case 'throw': return b(5);
  }
  return false;
}
function poll() {
  for (let i = 0; i < 4; i++) {
    const sc = online ? (i === localSlot ? KEYS_SOLO : null) : (nPlayers === 1 ? (i === 0 ? KEYS_SOLO : null) : (i === 0 ? KEYS_P1 : KEYS_P2));
    const gp = gpFor(i);
    for (const n of ACT) {
      const h = (sc ? sc[n].some(k => keys[k]) : false) || (gp ? padHeld(gp, n) : false);
      PRS[i][n] = h && !OLD[i][n]; OLD[i][n] = h; HLD[i][n] = h;
    }
  }
  const gp0 = gpFor(online ? localSlot : 0);
  const s = !!(keys.Enter || (gp0 && gp0.buttons[9] && gp0.buttons[9].pressed));
  START = s && !oldS; oldS = s;
  const p = !!keys.KeyP;
  PAUSE = p && !oldP; oldP = p;
  const m = !!(keys.Escape || (gp0 && gp0.buttons[8] && gp0.buttons[8].pressed));
  MENUK = m && !oldE; oldE = m;
}

