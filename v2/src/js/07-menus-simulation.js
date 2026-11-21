/* ---------- menus ---------- */
function toTitle() { if ((state === 'play' || state === 'spec') && !recorded) recordScores(); if (rel) relClose(); state = 'title'; nPlayers = 1; cam = 0; selT = 0; online = false; roomPending = false; room = false; roomJoin = false; act = [true, false, false, false]; netPaused = 0; LV = LEVELS[0]; levelIdx = 0; NAMES[0] = myName; }
function initSelect() {
  SEL = [{ c: 0, lock: false }, { c: 1, lock: false }, { c: 2, lock: false }, { c: 3, lock: false }]; selT = 0; cam = 0;
}
function tryLock(i) {
  const s = SEL[i];
  const taken = SEL.slice(0, nPlayers).some((o, j) => j !== i && o.lock && o.c === s.c && (!online || act[j]));
  if (!taken) { s.lock = true; SFX.pick(); return true; }
  return false;
}
function updSelect() {
  if (PAUSE || MENUK) { if (online) { netClose(); netMsg = ''; } toTitle(); return; }
  const slots = online ? [localSlot] : (nPlayers === 2 ? [0, 1] : [0]);
  if (online && !act[localSlot] && !roomJoin) { /* éjecté : géré par le réseau */ }
  let changed = false;
  for (const i of slots) {
    const s = SEL[i];
    if (!s.lock) {
      const nh = HERO_KEYS.length, per = 7;
      if (PRS[i].left) { s.c = (s.c + nh - 1) % nh; SFX.move(); changed = true; }
      if (PRS[i].right) { s.c = (s.c + 1) % nh; SFX.move(); changed = true; }
      if (PRS[i].up || PRS[i].down) { s.c = s.c < per ? Math.min(s.c + per, nh - 1) : s.c - per; SFX.move(); changed = true; }
      if ((PRS[i].punch || PRS[i].jump) && tryLock(i)) changed = true;
    } else if (PRS[i].special && !jselSent) { s.lock = false; changed = true; }
  }
  if (START) { const f = slots.find(i => !SEL[i].lock); if (f !== undefined && tryLock(f)) changed = true; }
  if (changed && online && !roomJoin) sendSel();
  if (roomJoin) { if (SEL[localSlot].lock && !jselSent) { jselSent = true; rxT = tick; netSend({ t: 'jsel', c: SEL[localSlot].c }); } return; }
  if (SEL.slice(0, nPlayers).every((o, i) => o.lock || (online && !act[i]))) {
    selT++;
    if (selT > 14) {
      if (roomPending) startRoom();
      else if (!online) startGame();
      else if (roomJoin) { /* l'invité attend la synchronisation */ }
      else if (localSlot === 0) {
        const seed = modeSeed((Math.random() * 4294967296) >>> 0);
        startMsg = { t: 'start', seed, heroes: SEL.slice(0, nPlayers).map(o => HERO_KEYS[o.c]), lvl: startLevel, ff: FRIENDLY ? 1 : 0, df: dfWire(), act: act.map(a => a ? 1 : 0) };
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
    if (START || PRS[0].punch || PRS[0].jump) {
      unlockAudio();
      if (olIdx === 0) { roomPending = true; nPlayers = 1; online = false; NAMES[0] = myName; initSelect(); state = 'select'; SFX.pick(); }
      else { olStage = 'joining'; codeBuf = ''; }
    }
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

/* ---------- simulation d'une image de jeu (identique chez les deux joueurs en ligne) ---------- */
function simStep() {
  if (storyOn) { updStory(); return; }
  if (specOn) { updSpec(); return; }
  if (shake > 0) shake -= 0.5;
  if (tgtT > 0) tgtT--;
  if (goT > 0) goT--;
  if (hitstop > 0) { hitstop--; return; }

  attackers = 0;
  for (const e of E) if (!e.gone && (e.st === 'tele' || e.st === 'attack' || e.st === 'charge')) attackers++;

  for (const p of PS) if (!p.out) updPlayer(p);
  for (const e of E.slice()) if (!e.gone) { updEnemy(e); e.x = clamp(e.x, cam - 30, cam + W + 30); }
  updAllies();
  separate();
  updProj();
  updTraps();
  updHz();
  updItems();
  updModes();
  for (const f of FX) f.t++;
  if (uT > 0) uT--;
  FX = FX.filter(f => f.t < f.life);
  E = E.filter(e => !e.gone);
  B = B.filter(b => !b.gone);
  chkUp();
  updEvents();
  updWaves();

  const act = PS.filter(p => !p.out);
  if (!act.length) { endGame('over'); return; }
  if (introT > 0) introT--;
  const lead = Math.max(...act.map(p => p.x));
  cam = Math.min(camLimit, Math.max(cam, lead - W * 0.42));
  if (waveI >= LV.waves.length && !waveActive && endT > 0) {
    endT--;
    if (endT === 0) { if (levelIdx < LEVELS.length - 1) startSpec(); else startStory('Épilogue', ENDING, true); }
  }
}


/* ---------- menu en jeu (touche Échap) : ajouter une option = ajouter une ligne dans MENU_ITEMS ---------- */
const MENU_ALL = [
  { label: () => 'REPRENDRE', act: () => { menuOpen = false; } },
  { label: () => 'OPTIONS  >', act: () => { menuSub = true; menuIdx2 = 0; } },
  { label: () => 'RETOUR À L\'ACCUEIL', act: () => { if (online) { netClose(); netMsg = ''; } menuOpen = false; toTitle(); } }
];
/* options : une seule liste, utilisée par l'accueil (tout) et par le menu en jeu (sans niveau ni nom) */
const toggleFF = () => { FRIENDLY = !FRIENDLY; lsSet('nfer_ff', FRIENDLY ? '1' : '0'); SFX.pick(); };
const OPTS = [
  { title: true, label: () => 'NIVEAU DE DÉPART : ' + (startLevel + 1) + ' · ' + LEVELS[startLevel].name, adj: d => { const n = unlocked + 1; startLevel = (startLevel + d + n) % n; SFX.move(); }, hint: () => unlocked > 0 ? 'Gauche / Droite : changer de niveau' : 'Terminez un niveau pour débloquer le suivant' },
  { title: true, id: 'md', label: () => 'MODE : ' + MODEN[GMODE], adj: d => { GMODE = (GMODE + d + 4) % 4; lsSet('nfer_md', String(GMODE)); SFX.move(); }, act: () => { GMODE = (GMODE + 1) % 4; lsSet('nfer_md', String(GMODE)); SFX.move(); }, hint: () => MODEH[GMODE] },
  { title: true, label: () => 'NOM : ' + myName, act: () => { SFX.pick(); if (window.IS_TOUCH) { const v = window.prompt('Votre nom (10 caractères max) :', myName); if (v) setMyName(v); } else { nameBuf = ''; state = 'name'; } } },
  { title: true, id: 'df', label: () => 'DIFFICULTÉ : ' + DIFFN[DIFF], adj: d => { DIFF = (DIFF + d + 3) % 3; lsSet('nfer_df', String(DIFF)); SFX.move(); }, act: () => { DIFF = (DIFF + 1) % 3; lsSet('nfer_df', String(DIFF)); SFX.pick(); }, hint: () => 'Facile : ennemis plus faibles · Difficile : ennemis plus costauds (choix de l\'hôte en ligne)' },
  { label: () => 'SECOUSSES D\'ÉCRAN : ' + (SHAKEON ? 'OUI' : 'NON'), act: () => { SHAKEON = !SHAKEON; lsSet('nfer_shake', SHAKEON ? '1' : '0'); SFX.pick(); }, adj: () => { SHAKEON = !SHAKEON; lsSet('nfer_shake', SHAKEON ? '1' : '0'); } },
  { id: 'ff', label: () => 'DÉGÂTS ENTRE ALLIÉS : ' + (FRIENDLY ? 'OUI' : 'NON'), act: toggleFF, adj: toggleFF, hint: () => 'Coups entre joueurs : oui = les alliés se blessent (moitié des dégâts)' },
  { label: () => 'MUSIQUE : ' + (musicOn ? 'OUI' : 'NON'), act: () => { musicOn = !musicOn; if (MUS) MUS.gain.value = musicOn ? 0.5 : 0; }, adj: () => { musicOn = !musicOn; if (MUS) MUS.gain.value = musicOn ? 0.5 : 0; } },
  { label: () => 'BRUITAGES : ' + (sfxOn ? 'OUI' : 'NON'), act: () => { sfxOn = !sfxOn; }, adj: () => { sfxOn = !sfxOn; } },
  { label: () => 'PLEIN ÉCRAN : ' + (document.fullscreenElement ? 'OUI' : 'NON'), act: () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* ignoré */ }
  } }
];
let menuSub = false, optIdx = 0;
const optList = ctx => OPTS.filter(o => ctx === 'title' ? true : (!o.title && (o.id !== 'ff' || !online)));
const subList = () => optList('game').concat([{ label: () => 'RETOUR', act: () => { menuSub = false; menuIdx2 = 0; } }]);
const menuList = () => MENU_ALL.filter(m => !m.show || m.show());
const curMenu = () => menuSub ? subList() : menuList();
function navList(L, idx, adjOk) {
  if (RAW.up) { idx = (idx + L.length - 1) % L.length; SFX.move(); }
  if (RAW.down) { idx = (idx + 1) % L.length; SFX.move(); }
  const it = L[idx % L.length];
  if (adjOk && it.adj && (RAW.left || RAW.right)) it.adj(RAW.right ? 1 : -1);
  else if (START || RAW.punch || RAW.jump) { if (it.act) { SFX.pick(); it.act(); } else if (it.adj) it.adj(1); }
  return idx;
}
function updMenu() { menuIdx2 = navList(curMenu(), menuIdx2, true); }

/* ---------- boucle de mise à jour ---------- */
function step() {
  tick++;
  poll();
  RAW = Object.assign({}, PRS[online ? localSlot : 0]);
  musicTick();
  relTick();
  if (toastT > 0) toastT--;
  if (catchReady) runCatchUp();
  if (pendingJoin && state === 'title') { const pc = pendingJoin; pendingJoin = ''; NAMES[0] = myName; state = 'online'; olStage = 'connecting'; joinGame(pc); return; }
  if (state === 'play' && MENUK) { if (menuOpen && menuSub) { menuSub = false; menuIdx2 = 0; } else { menuOpen = !menuOpen; menuIdx2 = 0; menuSub = false; } }
  if (state !== 'play') { menuOpen = false; menuSub = false; }
  if (state === 'title') {
    cam = 0;
    if (PRS[0].up) { menuIdx = (menuIdx + 3) % 4; SFX.move(); }
    if (PRS[0].down) { menuIdx = (menuIdx + 1) % 4; SFX.move(); }
    if (START || PRS[0].punch || PRS[0].jump) {
      unlockAudio(); netMsg = '';
      NAMES[0] = myName;
      if (menuIdx === 0) { nPlayers = 1; initSelect(); state = 'select'; SFX.pick(); }
      else if (menuIdx === 1) { goOnlineAuto(); SFX.pick(); }
      else if (menuIdx === 2) { state = 'scores'; sbLoad(); SFX.pick(); }
      else if (menuIdx === 3) { state = 'options'; optIdx = 0; SFX.pick(); }
    }
    return;
  }
  if (state === 'options') {
    const L = optList('title').concat([{ label: () => 'RETOUR', act: () => { state = 'title'; } }]);
    if (MENUK) { state = 'title'; SFX.move(); return; }
    optIdx = navList(L, optIdx, true);
    return;
  }
  if (state === 'name') {
    if (MENUK) { state = 'options'; return; }
    if (START && nameBuf.trim()) { setMyName(nameBuf); state = 'options'; SFX.pick(); }
    return;
  }
  if (state === 'scores') {
    if (RAW.special) { gScores = null; sbLoad(); SFX.move(); }
    if (START || MENUK || PRS[0].punch || PRS[0].jump) { state = 'title'; SFX.move(); }
    return;
  }
  if (state === 'online') { updOnline(); return; }
  if (state === 'select') { updSelect(); return; }
  if (state === 'over' || state === 'win') {
    if (endT === 0 && online) SEL.forEach(s => { s.lock = false; });
    endT++;
    const ls = online ? localSlot : 0;
    if (endT > 60 && (START || PRS[ls].punch)) {
      if (online && others() > 0) { state = 'select'; selT = 0; sendSel(); } else { netClose(); toTitle(); }
    }
    return;
  }
  if (menuOpen) updMenu();
  if (state !== 'play') return;
  if (online) {
    if (menuOpen && room && others() === 0 && !joinBusy) return;     // seul dans la salle : le menu fige vraiment la partie
    if (!netFrameReady()) return 'stall';
    if (applyNetInputs()) { netAfterFrame(); return; }               // pause (menu ouvert chez un joueur) : tout le monde s'arrête ensemble
  } else {
    if (menuOpen) return;
    if (PAUSE) paused = !paused;
    if (paused) return;
  }
  simStep();
  if (online) netAfterFrame();
}

