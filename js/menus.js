'use strict';
/* ---------- menus ---------- */
function toTitle() { state = 'title'; nPlayers = 1; cam = 0; selT = 0; online = false; }
function initSelect() {
  SEL = [{ c: 0, lock: false }, { c: 1, lock: false }]; selT = 0; cam = 0;
}
function tryLock(i) {
  const s = SEL[i];
  const taken = SEL.slice(0, nPlayers).some((o, j) => j !== i && o.lock && o.c === s.c);
  if (!taken) { s.lock = true; SFX.pick(); return true; }
  return false;
}
function updSelect() {
  if (PAUSE || MENUK) { if (online) { netClose(); netMsg = ''; } toTitle(); return; }
  const slots = online ? [localSlot] : (nPlayers === 2 ? [0, 1] : [0]);
  let changed = false;
  for (const i of slots) {
    const s = SEL[i];
    if (!s.lock) {
      if (PRS[i].left) { s.c = (s.c + 2) % 3; SFX.move(); changed = true; }
      if (PRS[i].right) { s.c = (s.c + 1) % 3; SFX.move(); changed = true; }
      if ((PRS[i].punch || PRS[i].jump) && tryLock(i)) changed = true;
    } else if (PRS[i].special) { s.lock = false; changed = true; }
  }
  if (START) { const f = slots.find(i => !SEL[i].lock); if (f !== undefined && tryLock(f)) changed = true; }
  if (changed && online) sendSel();
  if (SEL.slice(0, nPlayers).every(o => o.lock)) {
    selT++;
    if (selT > 14) {
      if (!online) startGame();
      else if (localSlot === 0) {
        const seed = (Math.random() * 4294967296) >>> 0;
        startMsg = { t: 'start', seed, heroes: [HERO_KEYS[SEL[0].c], HERO_KEYS[SEL[1].c]] };
        netSend(startMsg);
        beginOnline(seed);
      }
    }
  } else selT = 0;
}
function updOnline() {
  if (PAUSE || MENUK) { netClose(); toTitle(); return; }
  if (olStage === 'menu') {
    if (PRS[0].up || PRS[0].down) { olIdx = 1 - olIdx; SFX.move(); }
    if (START || PRS[0].punch || PRS[0].jump) { unlockAudio(); if (olIdx === 0) hostGame(); else { olStage = 'joining'; codeBuf = ''; } }
  } else if (olStage === 'joining') {
    if (START && codeBuf.length < 4 && window.IS_TOUCH) {
      const v = window.prompt('Code de la partie (5 caractères) :', '');
      if (v) codeBuf = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    }
    if (START && codeBuf.length >= 4) joinGame(codeBuf);
  } else if (olStage === 'error') {
    if (START) { olStage = 'menu'; netMsg = ''; }
  }
}

