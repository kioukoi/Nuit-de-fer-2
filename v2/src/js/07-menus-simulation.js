/* ---------- menus ---------- */
function toTitle() { repRestore(); if ((state === 'play' || state === 'spec') && !recorded) recordScores(); if (rel) relClose(); state = 'title'; nPlayers = 1; cam = 0; selT = 0; online = false; roomPending = false; room = false; roomJoin = false; act = [true, false, false, false]; netPaused = 0; LV = LEVELS[0]; levelIdx = 0; NAMES[0] = myName; }
function initSelect() {
  SEL = [{ c: 0, lock: false }, { c: 1, lock: false }, { c: 2, lock: false }, { c: 3, lock: false }]; selT = 0; cam = 0;
}
const SELPER = 10;                    // héros par ligne sur l'écran de choix
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
      const nh = HERO_KEYS.length, per = SELPER;
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
        startMsg = { t: 'start', seed, heroes: SEL.slice(0, nPlayers).map(o => HERO_KEYS[o.c]), lvl: startLevel, ff: FRIENDLY ? 1 : 0, df: dfWire(), cl: GMODE === 7 ? CUSTOM : '', act: act.map(a => a ? 1 : 0) };
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
    if (endT === 0) { if (GMODE === 7) endGame('win'); else if (levelIdx < LEVELS.length - 1) startSpec(); else startStory('Épilogue', ENDING, true); }
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
const setMd = d => { GMODE = (GMODE + d + MODEN.length) % MODEN.length; lsSet('nfer_md', String(GMODE)); SFX.move(); };
const setDf2 = d => { DIFF = (DIFF + d + 3) % 3; lsSet('nfer_df', String(DIFF)); SFX.move(); };
const toggleShake = () => { SHAKEON = !SHAKEON; lsSet('nfer_shake', SHAKEON ? '1' : '0'); SFX.pick(); };
const toggleMus = () => { musicOn = !musicOn; if (MUS) MUS.gain.value = musicOn ? 0.5 : 0; SFX.pick(); };
const toggleSfx = () => { sfxOn = !sfxOn; if (sfxOn) SFX.pick(); };
const OB = v => v ? 'OUI' : 'NON';
/* cat : onglet des options (0 JEU, 1 SON ET ÉCRAN, 2 CRÉATION) ; n : nom ; v : valeur affichée à droite ; adj : gauche/droite ; act : Entrée */
const OPT_TABS = ['JEU', 'SON ET ÉCRAN', 'CRÉATION', 'COMMANDES'];
const KLAB = { left: 'ALLER À GAUCHE', right: 'ALLER À DROITE', up: 'ALLER EN HAUT', down: 'ALLER EN BAS', punch: 'FRAPPER', jump: 'SAUTER', special: 'ATTAQUE SPÉCIALE', throw: 'LANCER L\'ARME' };
let kSlot = 0, kResetT = 0;
const kRows = ACT.map(a => ({
  cat: 3, title: true, n: KLAB[a],
  v: () => KCAP && KCAP.a === a ? 'APPUYEZ SUR UNE TOUCHE…' : KEYS_SOLO[a].map((k, i) => (kSlot === i ? '[' + kname(k) + ']' : kname(k))).join('  '),
  adj: () => { kSlot = 1 - kSlot; SFX.move(); },
  act: () => { KCAP = { a, slot: kSlot }; },
  clk: mid => { kSlot = mid ? 1 : 0; KCAP = { a, slot: kSlot }; SFX.pick(); },
  hint: () => 'Entrée : changer la touche entre crochets · Gauche / Droite : touche 1 ou 2 · Fixes : Entrée, Échap, P (pause)'
}));
const OPTS = [
  { cat: 0, title: true, n: 'NOM DU JOUEUR', v: () => myName, act: () => { SFX.pick(); if (window.IS_TOUCH) { const v = window.prompt('Votre nom (10 caractères max) :', myName); if (v) setMyName(v); } else { nameBuf = ''; state = 'name'; } }, hint: () => 'Le nom affiché en jeu et dans le classement mondial' },
  { cat: 0, title: true, n: 'NIVEAU DE DÉPART', v: () => (startLevel + 1) + ' · ' + LEVELS[startLevel].name, adj: d => { const n = unlocked + 1; startLevel = (startLevel + d + n) % n; SFX.move(); }, hint: () => unlocked > 0 ? 'Gauche / Droite : choisir parmi les niveaux débloqués' : 'Terminez un niveau pour débloquer le suivant' },
  { cat: 0, title: true, id: 'md', n: 'MODE DE JEU', v: () => MODEN[GMODE], adj: setMd, act: () => setMd(1), hint: () => MODEH[GMODE] },
  { cat: 0, title: true, id: 'df', n: 'DIFFICULTÉ', v: () => DIFFN[DIFF], adj: setDf2, act: () => setDf2(1), hint: () => 'Facile : ennemis plus faibles · Difficile : ennemis plus costauds (choix de l\'hôte en ligne)' },
  { cat: 0, id: 'ff', n: 'DÉGÂTS ENTRE ALLIÉS', v: () => OB(FRIENDLY), act: toggleFF, adj: toggleFF, hint: () => 'Coups entre joueurs : oui = les alliés se blessent (moitié des dégâts)' },
  { cat: 1, n: 'MUSIQUE', v: () => OB(musicOn), act: toggleMus, adj: toggleMus },
  { cat: 1, n: 'BRUITAGES', v: () => OB(sfxOn), act: toggleSfx, adj: toggleSfx },
  { cat: 1, n: 'SECOUSSES D\'ÉCRAN', v: () => OB(SHAKEON), act: toggleShake, adj: toggleShake, hint: () => 'Tremblements de l\'image lors des gros coups' },
  { cat: 1, n: 'PLEIN ÉCRAN', v: () => OB(!!document.fullscreenElement), act: () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* ignoré */ }
  } },
  { cat: 2, title: true, n: 'ÉDITEUR DE NIVEAU', act: () => { SFX.pick(); edOpen(); }, hint: () => 'Compose tes vagues, puis joue-les en mode NIVEAU PERSO' },
  { cat: 2, title: true, n: 'CODE DE NIVEAU', v: () => CUSTOM.slice(0, 14) + (CUSTOM.length > 14 ? '…' : ''), act: () => { SFX.pick(); try { const v = window.prompt('Code du niveau (celui d\'un ami, ou le tien pour le copier) :', CUSTOM); if (v) { CUSTOM = String(v).trim().slice(0, 400); lsSet('nfer_cl', CUSTOM); GMODE = MODEN.indexOf('NIVEAU PERSO'); lsSet('nfer_md', String(GMODE)); } } catch (e) { /* ignoré */ } }, hint: () => 'Colle le code d\'un ami pour jouer son niveau' },
  { cat: 2, title: true, n: 'REVOIR MA MEILLEURE PARTIE', act: () => { if (!repPlay('nfer_rep_best')) SFX.move(); }, v: () => repInfo('nfer_rep_best').replace(/[()]/g, '').trim(), hint: () => 'Rejoue ta meilleure partie solo, touches comprises (Échap pour quitter)' },
  { cat: 2, title: true, n: 'REVOIR MA DERNIÈRE PARTIE', act: () => { if (!repPlay('nfer_rep_last')) SFX.move(); }, v: () => repInfo('nfer_rep_last').replace(/[()]/g, '').trim(), hint: () => 'Rejoue ta dernière partie solo (Échap pour quitter)' },
  { cat: 3, title: true, n: 'RÉINITIALISER LES TOUCHES', v: () => tick < kResetT ? 'FAIT ✔' : '', act: () => { kResetT = tick + 120; Object.assign(KEYS_SOLO, JSON.parse(KEYS_DEF)); keysSave(); SFX.pick(); }, hint: () => 'Remet les touches par défaut : flèches ou ZQSD, J, K, L, Espace' },
  ...kRows
];
OPTS.forEach(o => { o.label = () => o.n + (o.v ? ' : ' + o.v() : ''); });          // texte simple pour le menu en jeu
let menuSub = false, optIdx = 0, optTab = 0;
const optRows = t => OPTS.filter(o => o.cat === t);
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

/* ---------- accueil : une seule liste, utilisée par la mise à jour, le dessin et la souris ---------- */
const TITLE = [
  { n: 'JOUER', big: true, sub: () => 'Niveau ' + (startLevel + 1) + ' · ' + MODEN[GMODE] + ' · ' + DIFFN[DIFF], adj: d => { const n = unlocked + 1; startLevel = (startLevel + d + n) % n; SFX.move(); }, act: () => { nPlayers = 1; initSelect(); state = 'select'; SFX.pick(); } },
  { n: 'EN LIGNE', sub: () => 'jusqu\'à 4 joueurs', act: () => { goOnlineAuto(); SFX.pick(); } },
  { n: 'CLASSEMENT MONDIAL', act: () => { state = 'scores'; sbLoad(); SFX.pick(); } },
  { n: 'OPTIONS', sub: () => myName, act: () => { state = 'options'; optIdx = 0; SFX.pick(); } }
];
function titleGo(i) { unlockAudio(); netMsg = ''; NAMES[0] = myName; menuIdx = i; TITLE[i].act(); }
function optTabGo(t) { optTab = (t + OPT_TABS.length) % OPT_TABS.length; optIdx = Math.min(optIdx, optRows(optTab).length); SFX.move(); }
/* ---------- boucle de mise à jour ---------- */
function step() {
  tick++;
  poll();
  RAW = Object.assign({}, PRS[online ? localSlot : 0]);
  while (PTRQ.length) PTRQ.shift()();
  musicTick();
  relTick();
  if (toastT > 0) toastT--;
  if (catchReady) runCatchUp();
  if (pendingJoin && state === 'title') { const pc = pendingJoin; pendingJoin = ''; NAMES[0] = myName; state = 'online'; olStage = 'connecting'; joinGame(pc); return; }
  if (REP && state === 'play' && MENUK) { toTitle(); return; }
  if (state === 'play' && MENUK) { if (menuOpen && menuSub) { menuSub = false; menuIdx2 = 0; } else { menuOpen = !menuOpen; menuIdx2 = 0; menuSub = false; } }
  if (state !== 'play') { menuOpen = false; menuSub = false; }
  if (state === 'title') {
    cam = 0;
    const n = TITLE.length, P = PRS[0];
    if (P.up) { menuIdx = (menuIdx + n - 1) % n; SFX.move(); }
    if (P.down) { menuIdx = (menuIdx + 1) % n; SFX.move(); }
    const it = TITLE[menuIdx];
    if (it.adj && (P.left || P.right)) it.adj(P.right ? 1 : -1);
    else if (START || P.punch || P.jump) titleGo(menuIdx);
    return;
  }
  if (state === 'options') {
    const rows = optRows(optTab), n = rows.length, lr = RAW.left || RAW.right, d = RAW.right ? 1 : -1;
    if (KCAP) return;
    if (MENUK) { state = 'title'; SFX.move(); return; }
    if (RAW.up) { optIdx = optIdx <= -1 ? n : optIdx - 1; SFX.move(); }
    if (RAW.down) { optIdx = optIdx >= n ? -1 : optIdx + 1; SFX.move(); }
    const it = rows[optIdx], go = START || RAW.punch || RAW.jump;
    if (optIdx === -1) { if (lr) optTabGo(optTab + d); }
    else if (optIdx === n) { if (go) { state = 'title'; SFX.pick(); } }
    else if (lr) { if (it.adj) it.adj(d); else optTabGo(optTab + d); }
    else if (go) { SFX.pick(); if (it.act) it.act(); else if (it.adj) it.adj(1); }
    return;
  }
  if (state === 'edit') { updEdit(); return; }
  if (state === 'name') {
    if (MENUK) { state = 'options'; return; }
    if (START && nameBuf.trim()) { setMyName(nameBuf); state = 'options'; SFX.pick(); }
    return;
  }
  if (state === 'scores') {
    if (RAW.special) { gScores = null; sbLoad(); SFX.move(); }
    if (RAW.left || RAW.right) { gView = (gView + (RAW.right ? 1 : 2)) % 3; SFX.move(); }
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
    if (repFrame()) return;
  }
  simStep();
  if (online) netAfterFrame();
}

