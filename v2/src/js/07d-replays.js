/* ---------- REPLAYS : la partie ne dépend que de la graine et des touches, on enregistre donc les touches (solo) et on rejoue ---------- */
let REP = null, RECL = [], REPI = 0, REPSD = 0, REPBAK = null, REPCFG = null;
function rleEnc(a) { const o = []; let i = 0; while (i < a.length) { let j = i; while (j < a.length && a[j] === a[i]) j++; o.push(a[i] + '*' + (j - i)); i = j; } return o.join(','); }
function rleDec(s) { const a = []; for (const t of s.split(',')) { const q = t.split('*'); for (let k = 0; k < +q[1]; k++) a.push(+q[0]); } return a; }
function repGet(key) { try { const s = lsGet(key, ''); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function repSave(kind) {
  try {
    if (REP || online || !REPCFG || RECL.length < 120 || !PS[0]) return;
    const r = Object.assign({}, REPCFG, { score: PS[0].score, lv: levelIdx + 1, win: kind === 'win', frames: RECL.length, d: rleEnc(RECL), date: Date.now() });
    const js = JSON.stringify(r);
    lsSet('nfer_rep_last', js);
    const b = repGet('nfer_rep_best'); if (!b || r.score > b.score) lsSet('nfer_rep_best', js);
  } catch (e) { /* stockage plein : on ignore */ }
}
function repInfo(key) { const r = repGet(key); return r ? ' (' + r.score + ' pts, niv. ' + r.lv + ')' : ' (aucune)'; }
function repPlay(key) {
  const r = repGet(key); if (!r) return false;
  REPBAK = { lvl: startLevel, df: dfWire(), ff: FRIENDLY, sel: SEL[0].c, name: NAMES[0] };
  SEL[0].c = Math.max(0, HERO_KEYS.indexOf(r.hero)); nPlayers = 1; startLevel = r.lvl0 | 0; setDf(r.df); FRIENDLY = !!r.ff; NAMES[0] = r.name || 'REPLAY';
  REP = { seed: r.seed }; RECL = rleDec(r.d); REPI = 0;
  startGame();
  return true;
}
function repRestore() {
  if (!REP) return;
  REP = null;
  if (REPBAK) { startLevel = REPBAK.lvl; setDf(REPBAK.df); FRIENDLY = REPBAK.ff; SEL[0].c = REPBAK.sel; NAMES[0] = REPBAK.name; REPBAK = null; }
}
/* appelée avant chaque image de simulation hors ligne : enregistre les touches, ou les impose pendant un replay (true = replay terminé) */
function repFrame() {
  if (REP) { if (REPI >= RECL.length) { toTitle(); return true; } applyMasks([RECL[REPI++], 0, 0, 0]); return false; }
  if (state === 'play') RECL.push(maskOf(HLD[0]));
  return false;
}
