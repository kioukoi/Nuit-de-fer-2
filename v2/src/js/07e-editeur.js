/* ---------- ÉDITEUR DE NIVEAU : on compose des vagues, le jeu en tire un code à partager (mode NIVEAU PERSO) ---------- */
let EDT = null;
const edTypes = () => Object.keys(T).filter(k => k !== 'boss');
function edOpen() {
  const c = parseCustom(CUSTOM);
  EDT = { lv: c.lv, boss: c.boss, ws: c.ws.map(sp => { const m = {}; for (const s of sp) m[s[0]] = (m[s[0]] || 0) + 1; return m; }), row: 0, ty: 0, msg: '' };
  state = 'edit';
}
function edCode() { const e = EDT; return e.lv + (e.boss ? 'B' : '') + ':' + e.ws.map(w => Object.keys(w).filter(k => w[k] > 0).map(k => k + '*' + w[k]).join(',')).filter(Boolean).join(';'); }
const edTot = w => Object.keys(w).reduce((a, k) => a + w[k], 0);
function updEdit() {
  const e = EDT, nW = e.ws.length, last = nW + 3, tys = edTypes();
  if (MENUK) { state = 'options'; return; }
  if (PRS[0].up) { e.row = (e.row + last) % (last + 1); SFX.move(); }
  if (PRS[0].down) { e.row = (e.row + 1) % (last + 1); SFX.move(); }
  const d = (PRS[0].right ? 1 : 0) - (PRS[0].left ? 1 : 0), ok = START || PRS[0].punch;
  if (e.row === 0 && d) { e.lv = (e.lv - 1 + d + LEVELS.length) % LEVELS.length + 1; SFX.move(); }
  else if (e.row === 1 && (d || ok)) { e.boss = !e.boss; SFX.move(); }
  else if (e.row >= 2 && e.row < 2 + nW) {
    const w = e.ws[e.row - 2];
    if (d) { e.ty = (e.ty + d + tys.length) % tys.length; SFX.move(); }
    if (PRS[0].punch && edTot(w) < 12) { w[tys[e.ty]] = (w[tys[e.ty]] || 0) + 1; SFX.pick(); }
    if (PRS[0].special) { if (w[tys[e.ty]] > 0) w[tys[e.ty]]--; else { const k = Object.keys(w).filter(z => w[z] > 0).pop(); if (k) w[k]--; else { e.ws.splice(e.row - 2, 1); e.row = Math.min(e.row, e.ws.length + 1); } } SFX.move(); }
  } else if (e.row === 2 + nW && ok && nW < 8) { e.ws.push({}); e.row = 2 + nW; SFX.pick(); }
  else if (e.row === 3 + nW && ok) {
    const code = edCode(); CUSTOM = code; lsSet('nfer_cl', code); GMODE = MODEN.indexOf('NIVEAU PERSO'); lsSet('nfer_md', String(GMODE)); SFX.pick(); state = 'options';
  }
}
function drawEdit() {
  const e = EDT, nW = e.ws.length, tys = edTypes();
  g.fillStyle = 'rgba(5,3,15,.88)'; g.fillRect(0, 0, W, H);
  txt('ÉDITEUR DE NIVEAU', W / 2, 20, 16, '#ffcf4a', 'center');
  const rows = [['DÉCOR : ' + e.lv + ' · ' + LEVELS[e.lv - 1].name + '   (← →)', 0], ['BOSS FINAL : ' + (e.boss ? 'OUI' : 'NON') + '   (← → ou J)', 1]];
  e.ws.forEach((w, i) => rows.push(['VAGUE ' + (i + 1) + ' : ' + (Object.keys(w).filter(k => w[k] > 0).map(k => T[k].name + ' x' + w[k]).join(', ') || '(vide)'), 2 + i]));
  rows.push([nW < 8 ? '+ NOUVELLE VAGUE (J)' : '(8 vagues maximum)', 2 + nW]); rows.push(['TERMINER ET JOUER CE NIVEAU (J)', 3 + nW]);
  const vis = 10, st = clamp(e.row - 4, 0, Math.max(0, rows.length - vis));
  rows.slice(st, st + vis).forEach((r, i) => { const on = r[1] === e.row; txt((on ? '> ' : '  ') + r[0], W / 2, 42 + i * 16, 9, on ? '#fff' : '#9a9ac0', 'center'); });
  txt('Ennemi : ◄ ' + T[tys[e.ty]].name + ' ►   (sur une vague : ← → choisir, J ajouter, K retirer)', W / 2, 218, 8, '#8fe0a8', 'center');
  txt('Code : ' + edCode().slice(0, 70), W / 2, 232, 7, '#cbd', 'center');
  txt('Haut / Bas · Échap : retour sans valider', W / 2, 258, 8, '#8a8ab0', 'center');
}
