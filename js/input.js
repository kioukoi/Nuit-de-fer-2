'use strict';
/* ---------- entrées ---------- */
const ACT = ['left', 'right', 'up', 'down', 'punch', 'jump', 'special', 'throw'];
const KEYS_SOLO = {
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  punch: ['KeyJ', 'KeyF', 'KeyZ'], jump: ['Space'], special: ['KeyL', 'KeyH', 'KeyC'], throw: ['KeyE', 'KeyV']
};
const KEYS_P1 = { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], punch: ['KeyF'], jump: ['KeyG'], special: ['KeyH'], throw: ['KeyT'] };
const KEYS_P2 = {
  left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
  punch: ['Comma', 'Numpad1'], jump: ['Period', 'Numpad2'], special: ['Slash', 'Numpad3'], throw: ['KeyM']
};
const keys = {}; window.__keys = keys;
let nPlayers = 1;
const HLD = [{}, {}], PRS = [{}, {}], OLD = [{}, {}];
let START = false, PAUSE = false, MENUK = false, oldS = false, oldP = false, oldE = false;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
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
  for (let i = 0; i < 2; i++) {
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

