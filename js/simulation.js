'use strict';
/* ---------- simulation d'une image de jeu (identique chez les deux joueurs en ligne) ---------- */
function simStep() {
  if (shake > 0) shake -= 0.5;
  if (tgtT > 0) tgtT--;
  if (goT > 0) goT--;
  if (hitstop > 0) { hitstop--; return; }

  attackers = 0;
  for (const e of E) if (!e.gone && (e.st === 'tele' || e.st === 'attack' || e.st === 'charge')) attackers++;

  for (const p of PS) if (!p.out) updPlayer(p);
  for (const e of E.slice()) if (!e.gone) { updEnemy(e); e.x = clamp(e.x, cam - 30, cam + W + 30); }
  separate();
  updProj();
  updItems();
  for (const f of FX) f.t++;
  FX = FX.filter(f => f.t < f.life);
  E = E.filter(e => !e.gone);
  B = B.filter(b => !b.gone);
  updWaves();

  const act = PS.filter(p => !p.out);
  if (!act.length) { state = 'over'; endT = 0; return; }
  const lead = Math.max(...act.map(p => p.x));
  cam = Math.min(camLimit, Math.max(cam, lead - W * 0.42));
  if (waveI >= LV.waves.length && !waveActive && endT > 0) {
    endT--;
    if (endT === 0) { state = 'win'; endT = 0; }
  }
}


/* ---------- menu en jeu (touche Échap) : ajouter une option = ajouter une ligne dans MENU_ITEMS ---------- */
const MENU_ITEMS = [
  { label: () => 'REPRENDRE', act: () => { menuOpen = false; } },
  { label: () => 'MUSIQUE : ' + (musicOn ? 'OUI' : 'NON'), act: () => { musicOn = !musicOn; if (MUS) MUS.gain.value = musicOn ? 0.5 : 0; } },
  { label: () => 'BRUITAGES : ' + (sfxOn ? 'OUI' : 'NON'), act: () => { sfxOn = !sfxOn; } },
  { label: () => 'PLEIN ÉCRAN : ' + (document.fullscreenElement ? 'OUI' : 'NON'), act: () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* ignoré */ }
  } },
  { label: () => 'RETOUR À L\'ACCUEIL', act: () => { if (online) { netClose(); netMsg = ''; } menuOpen = false; toTitle(); } }
];
function updMenu() {
  if (RAW.up) { menuIdx2 = (menuIdx2 + MENU_ITEMS.length - 1) % MENU_ITEMS.length; SFX.move(); }
  if (RAW.down) { menuIdx2 = (menuIdx2 + 1) % MENU_ITEMS.length; SFX.move(); }
  if (START || RAW.punch || RAW.jump) { SFX.pick(); MENU_ITEMS[menuIdx2].act(); }
}

/* ---------- boucle de mise à jour ---------- */
function step() {
  tick++;
  poll();
  RAW = Object.assign({}, PRS[online ? localSlot : 0]);
  musicTick();
  relTick();
  if (state === 'play' && MENUK) { menuOpen = !menuOpen; menuIdx2 = 0; }
  if (state !== 'play') menuOpen = false;
  if (state === 'title') {
    cam = 0;
    if (PRS[0].up) { menuIdx = (menuIdx + 1) % 2; SFX.move(); }
    if (PRS[0].down) { menuIdx = (menuIdx + 1) % 2; SFX.move(); }
    if (START || PRS[0].punch || PRS[0].jump) {
      unlockAudio(); netMsg = '';
      if (menuIdx === 1) { state = 'online'; olStage = 'menu'; olIdx = 0; SFX.pick(); }
      else { nPlayers = menuIdx + 1; initSelect(); state = 'select'; SFX.pick(); }
    }
    return;
  }
  if (state === 'online') { updOnline(); return; }
  if (state === 'select') { updSelect(); return; }
  if (state === 'over' || state === 'win') {
    if (endT === 0 && online) SEL.forEach(s => { s.lock = false; });
    endT++;
    const ls = online ? localSlot : 0;
    if (endT > 60 && (START || PRS[ls].punch)) {
      if (online) { state = 'select'; selT = 0; sendSel(); } else toTitle();
    }
    return;
  }
  if (menuOpen) updMenu();
  if (state !== 'play') return;
  if (online) {
    if (!netFrameReady()) return;
    applyNetInputs();
  } else {
    if (menuOpen) return;
    if (PAUSE) paused = !paused;
    if (paused) return;
  }
  simStep();
  if (online) netAfterFrame();
}

