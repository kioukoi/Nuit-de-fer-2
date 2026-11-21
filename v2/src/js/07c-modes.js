/* ---------- MODES DE JEU : histoire, boss rush, défi du jour, chaos + mutations de boss ---------- */
/* GMODE est envoyé avec la difficulté (df = DIFF + 4 * GMODE) : tout le monde joue le même mode. Tout ce qui est aléatoire passe par rng(). */
let GMODE = 0, DAYM = -1, CHK = -1, CHT = 0, CHU = 0, TRS = -1, TRP = false;
try { GMODE = clamp(parseInt(lsGet('nfer_md', '0'), 10) || 0, 0, 4); } catch (e) { GMODE = 0; }
const MODEN = ['HISTOIRE', 'BOSS RUSH', 'DÉFI DU JOUR', 'CHAOS', 'TRAÎTRE'];
const MODEH = ['Les 10 niveaux, dans l\'ordre', 'Les 10 boss à la suite, sans leurs vagues. Boss mutants.', 'Même partie pour tous aujourd\'hui, avec une règle du jour. Boss mutants.', 'Un événement délirant toutes les 25 s. Boss mutants.', 'À 3 joueurs ou plus : l\'un de vous, tiré au sort en secret, doit faire perdre l\'équipe sans se faire repérer.'];
const DAYMN = ['ENNEMIS TURBO', 'ENNEMIS FRAGILES MAIS BRUTAUX', 'PAS DE SPÉCIAL', 'TOUS LES ENNEMIS ONT UN PISTOLET', 'UNE SEULE VIE'];
const CHAN = ['GRAVITÉ LUNAIRE', 'ENNEMIS TURBO', 'PLUIE DE BOMBES', 'TOUS ARMÉS', 'COMMANDES INVERSÉES'];
const MUTN = ['ENRAGÉ', 'BLINDÉ', 'ESSAIM', 'FISSION'];
function setDf(v) { v = v === undefined ? 1 : v | 0; DIFF = clamp(v & 3, 0, 2); GMODE = (v >> 2) & 7; if (GMODE >= MODEN.length) GMODE = 0; }
const dfWire = () => DIFF + 4 * GMODE;
function dailySeed() { const d = new Date(); return (((d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) * 2654435761) >>> 0) || 1; }
function modeSeed(s) { return GMODE === 2 ? dailySeed() : s; }
function modeStart(seed) { CHK = -1; CHT = 0; CHU = 0; TRS = -1; TRP = false;
  if (GMODE === 4) { const a = PS.filter(p => !p.out && !p.absent).map(p => p.slot); if (a.length >= 3) TRS = a[Math.floor(rng() * a.length)]; }
  DAYM = GMODE === 2 ? ((seed >>> 7) % DAYMN.length) : -1; if (DAYM === 4) for (const p of PS) p.lives = 1; }
/* niveau en boss rush : seulement la vague du boss, déclenchée tout de suite */
function rushLevel(L) { const bw = L.waves[L.waves.length - 1]; return Object.assign({}, L, { waves: [Object.assign({}, bw, { cam: 0 })], events: [], story: null }); }
function modEnemy(e) {                                  /* appelé à chaque apparition d'ennemi */
  if (e.type === 'boss') {
    if (GMODE === 0) return;
    const k = Math.floor(rng() * 4); e.mut = k;
    if (k === 0) { e.spm = (e.spm || 1) * 1.28; e.dm *= 1.2; } else if (k === 1) { e.hp = e.maxhp = Math.round(e.hp * 1.5); }
    return;
  }
  if (DAYM === 0) e.spm = (e.spm || 1) * 1.35;
  if (DAYM === 1) { e.hp = e.maxhp = Math.max(1, Math.round(e.hp * 0.55)); e.dm *= 1.8; }
  if (DAYM === 3 && !e.weapon) { e.weapon = 'pistolet'; e.wd = 6; }
}
function updModes() {
  if (GMODE === 0 || !LV) return;
  if (GMODE === 4 && TRS < 0) { const a = PS.filter(p => !p.out && !p.absent).map(p => p.slot); if (a.length >= 3) TRS = a[Math.floor(rng() * a.length)]; }      // le traître est tiré dès que 3 joueurs sont là (même image chez tout le monde)
  if (DAYM === 2) for (const p of PS) p.sp = 0;
  for (const e of E) {                                  /* mutations de boss */
    if (e.type !== 'boss' || e.gone || e.dying || e.mut === undefined) continue;
    if (e.mut === 2) { e.swT = (e.swT | 0) + 1; if (e.swT % 540 === 300 && E.length < 9) { spawn('thug', rng() < 0.5 ? 1 : -1); FX.push({ x: e.x, y: e.y, z: 50, t: 0, life: 40, txt: 'ESSAIM !', col: '#ff8a5a' }); } }
    if (e.mut === 3 && !e.fis && e.hp <= e.maxhp * 0.5) {
      e.fis = true; const c = mkEnemy('boss', clamp(e.x - e.face * 60, cam + 20, cam + W - 20), e.y);
      c.hp = Math.max(1, Math.round(c.maxhp * 0.35)); c.split = true; c.mut = -1; c.face = e.face; E.push(c); ring(e.x, e.y, 60, '#ff6a4a', 26); ultBanner('FISSION !', '#ff6a4a'); SFX.roar();
    }
  }
  if (GMODE !== 3) return;
  CHT++;
  if (CHT % 1500 === 500) {                              /* nouvel événement chaos */
    CHK = Math.floor(rng() * CHAN.length); CHU = CHT + 720; ultBanner(CHAN[CHK], '#ff5fd0'); SFX.roar();
    if (CHK === 3) for (const e of E) if (!e.gone && e.type !== 'boss' && !e.weapon) { e.weapon = rng() < 0.3 ? 'grenade' : 'pistolet'; e.wd = e.weapon === 'grenade' ? 1 : 4; }
  }
  if (CHK >= 0 && CHT > CHU) { CHK = -1; }
  if (CHK === 2 && CHT % 36 === 0) {
    const L = livePlayers(), q = L.length ? L[Math.floor(rng() * L.length)] : null, dm = Math.min(1.6, LV.dmgM) * DIFFM[DIFF];
    HZ.push({ k: 'lift', x: clamp((q ? q.x : cam + W / 2) + (rng() - 0.5) * 120, cam + 20, cam + W - 20), y: clamp((q ? q.y : 200) + (rng() - 0.5) * 50, Y0 + 6, Y1 - 6), t: 0, warn: 40, r: 26, dmg: 16, dm, rock: true, bomb: true });
  }
  if (CHK === 4) for (const p of PS) { let t = HLD[p.slot].left; HLD[p.slot].left = HLD[p.slot].right; HLD[p.slot].right = t; t = PRS[p.slot].left; PRS[p.slot].left = PRS[p.slot].right; PRS[p.slot].right = t; }
}
function drawModeHud() {
  if (GMODE === 0) return;
  if (GMODE === 4) {
    const me = online ? localSlot : 0;
    if (TRP && TRS >= 0 && PS[TRS]) txt('LE TRAÎTRE : ' + (PS[TRS].name || '?'), W / 2, 240, 8, '#ff5a5a', 'center');
    else if (me === TRS) { txt(simF < 900 ? 'TU ES LE TRAÎTRE : fais perdre l\'équipe sans te faire repérer (3 coups sur un allié te démasquent)' : 'TRAÎTRE', W / 2, 240, 7, '#ff5a5a', 'center'); }
    else if (TRS < 0) txt('TRAÎTRE : il faut au moins 3 joueurs (partie normale)', W / 2, 240, 7, '#9a9ac0', 'center');
  }
  let s = MODEN[GMODE]; if (GMODE === 2 && DAYM >= 0) s += ' · ' + DAYMN[DAYM]; if (GMODE === 3 && CHK >= 0) s += ' · ' + CHAN[CHK] + ' ' + Math.max(0, Math.ceil((CHU - CHT) / 60)) + 's';
  txt(s, W / 2, 252, 7, GMODE === 3 && CHK >= 0 ? '#ff7ad8' : '#ffcf6a', 'center');
}
