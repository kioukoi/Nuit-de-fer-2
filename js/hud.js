'use strict';
/* ====================================================================
   INTERFACE : texte, HUD, menus et écrans, boucle de rendu
   ==================================================================== */
function txt(s, x, y, size, col, al) {
  g.font = 'bold ' + size + 'px monospace'; g.textAlign = al || 'left';
  g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1);
  g.fillStyle = col; g.fillText(s, x, y);
}
function bar(x, y, w, h, r, col) {
  g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = '#3a1a1a'; g.fillRect(x, y, w, h);
  g.fillStyle = col || (r > 0.5 ? '#4ccf4c' : (r > 0.25 ? '#e0c030' : '#e03030'));
  g.fillRect(x, y, Math.max(0, Math.round(w * r)), h);
}
function drawMenu() {
  g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(0, 0, W, H);
  const bw = 230, bh = 40 + MENU_ITEMS.length * 22 + 26, bx = (W - bw) / 2, by = (H - bh) / 2;
  g.fillStyle = 'rgba(24,20,48,.96)'; g.fillRect(bx, by, bw, bh);
  g.strokeStyle = '#4a4690'; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  txt('MENU', W / 2, by + 20, 14, '#ffcf4a', 'center');
  MENU_ITEMS.forEach((it, i) => {
    const on = i === menuIdx2;
    txt((on ? '> ' : '  ') + it.label() + (on ? ' <' : '  '), W / 2, by + 46 + i * 22, 11, on ? '#fff' : '#9a9ac0', 'center');
  });
  txt(online ? 'La partie continue pendant le menu' : 'Haut / Bas · Entrée · Échap : fermer', W / 2, by + bh - 8, 7, '#8a8ab0', 'center');
}
function hud() {
  PS.forEach(hudPlayer);
  if (tgt && tgtT > 0 && !tgt.gone && tgt.kind === 'e' && tgt.type !== 'boss') {
    txt(T[tgt.type].name, W / 2, 16, 9, '#fda', 'center');
    bar(W / 2 - 40, 20, 80, 6, tgt.hp / tgt.maxhp, '#e0663a');
  }
  const boss = E.find(e => e.type === 'boss' && !e.gone);
  if (boss) {
    txt('LE CHEF', W / 2, H - 20, 10, '#f88', 'center');
    bar(W / 2 - 100, H - 14, 200, 8, boss.hp / boss.maxhp, '#d03030');
  }
  if (goT > 0 && waveI < LV.waves.length && ((tick >> 4) & 1)) txt('GO >>', W - 14, 60, 16, '#ffd34d', 'right');
  if (online && stallT > 20) txt('En attente de l\'autre joueur...', W / 2, 52, 10, '#ffd34d', 'center');
  if (online && desync) txt('DÉSYNCHRONISÉ : relancez la partie', W / 2, 64, 10, '#f66', 'center');
}
let PREV = null;
function drawTitle() {
  g.fillStyle = 'rgba(5,3,15,.55)'; g.fillRect(0, 0, W, H);
  txt('NUIT DE FER', W / 2, 82, 38, '#ffcf4a', 'center');
  txt('prototype · beat\'em up', W / 2, 102, 11, '#cbd', 'center');
  ['1 JOUEUR', 'EN LIGNE (2 ORDINATEURS)'].forEach((o, i) => {
    const on = i === menuIdx;
    txt((on ? '> ' : '  ') + o + (on ? ' <' : '  '), W / 2, 150 + i * 22, 13, on ? '#fff' : '#889', 'center');
  });
  if (netMsg) txt(netMsg, W / 2, 214, 10, '#f66', 'center');
  else if ((tick >> 5) & 1) txt('ENTRÉE pour valider', W / 2, 214, 10, '#cbd', 'center');
  txt('Haut / Bas : choisir · M : musique · Échap en jeu : menu', W / 2, 236, 9, '#aab', 'center');
}
function drawRelays(y) {
  if (!rel) return;
  const t = rel.bs.map(b => b.name + ' ' + (b.st === 'ok' ? 'OK' : b.st)).join('  ·  ');
  txt(t, W / 2, y, 7, '#889', 'center');
}
function drawOnline() {
  g.fillStyle = 'rgba(5,3,15,.7)'; g.fillRect(0, 0, W, H);
  txt('JEU EN LIGNE', W / 2, 44, 22, '#ffcf4a', 'center');
  if (olStage === 'menu') {
    ['CRÉER UNE PARTIE', 'REJOINDRE UNE PARTIE'].forEach((o, i) => {
      const on = i === olIdx;
      txt((on ? '> ' : '  ') + o + (on ? ' <' : '  '), W / 2, 110 + i * 26, 15, on ? '#fff' : '#889', 'center');
    });
    txt('Chacun joue sur son ordinateur. Un joueur crée la partie', W / 2, 190, 9, '#aab', 'center');
    txt('et donne le code à l\'autre.', W / 2, 202, 9, '#aab', 'center');
    txt('P : retour', W / 2, 250, 9, '#889', 'center');
  } else if (olStage === 'hosting') {
    txt('Code de la partie', W / 2, 96, 12, '#cbd', 'center');
    txt(hostCode, W / 2, 140, 38, '#fff', 'center');
    txt('Donnez ce code à l\'autre joueur.', W / 2, 176, 10, '#aab', 'center');
    if ((tick >> 5) & 1) txt('En attente de l\'autre joueur...', W / 2, 210, 11, '#ffd34d', 'center');
    drawRelays(236);
    txt('P : annuler', W / 2, 250, 9, '#889', 'center');
  } else if (olStage === 'joining') {
    txt('Entrez le code de la partie', W / 2, 96, 12, '#cbd', 'center');
    txt((codeBuf + '_____').slice(0, 5).split('').join(' '), W / 2, 140, 34, '#fff', 'center');
    txt('ENTRÉE pour se connecter', W / 2, 190, 10, '#aab', 'center');
    txt('P : retour', W / 2, 250, 9, '#889', 'center');
  } else if (olStage === 'connecting') {
    if ((tick >> 5) & 1) txt('Connexion...', W / 2, 140, 14, '#ffd34d', 'center');
    drawRelays(236);
  } else if (olStage === 'error') {
    txt(netMsg, W / 2, 130, 11, '#f66', 'center');
    txt('ENTRÉE pour revenir', W / 2, 180, 10, '#aab', 'center');
    if (lastRelays) txt(lastRelays, W / 2, 210, 7, '#889', 'center');
  }
}
function drawSelect() {
  g.fillStyle = 'rgba(5,3,15,.78)'; g.fillRect(0, 0, W, H);
  txt(nPlayers === 2 ? 'CHOISISSEZ VOS HÉROS' : 'CHOISISSEZ VOTRE HÉROS', W / 2, 26, 15, '#ffcf4a', 'center');
  if (!PREV) PREV = HERO_KEYS.map((k, i) => Object.assign(mkPlayer(k, 0), { x: 80 + i * 160, y: 156 }));
  const c0 = cam; cam = 0;
  HERO_KEYS.forEach((k, i) => {
    const hr = HEROES[k], cx = 80 + i * 160, e = PREV[i];
    g.fillStyle = 'rgba(30,26,60,.92)'; g.fillRect(cx - 66, 40, 132, 176);
    g.strokeStyle = '#3a3670'; g.lineWidth = 1; g.strokeRect(cx - 65.5, 40.5, 131, 175);
    txt(hr.name, cx, 58, 11, '#fff', 'center');
    txt(hr.role, cx, 70, 9, '#9ab', 'center');
    const locked = SEL.slice(0, nPlayers).some(s => s.lock && s.c === i);
    if (locked) { e.st = 'attack'; e.stage = (tick >> 5) % 3; e.t = (tick >> 1) % hr.atk[e.stage].dur; } else { e.st = 'free'; e.t = 0; }
    drawChar(e);
    txt('PV', cx - 60, 177, 8, '#9ab'); bar(cx - 40, 171, 96, 5, hr.hp / 130, '#4ccf4c');
    txt('VIT', cx - 60, 188, 8, '#9ab'); bar(cx - 40, 182, 96, 5, hr.spd / 1.95, '#4aa8ff');
    txt('FOR', cx - 60, 199, 8, '#9ab'); bar(cx - 40, 193, 96, 5, hr.dmg / 1.45, '#e0663a');
    txt(hr.special, cx, 211, 8, '#fda', 'center');
  });
  cam = c0;
  for (let i = 0; i < nPlayers; i++) {
    const s = SEL[i], cx = 80 + s.c * 160, col = i ? '#ff9a3a' : '#4aa8ff';
    g.strokeStyle = col; g.lineWidth = 2;
    g.strokeRect(cx - 68 + i * 3, 38 + i * 3, 136 - i * 6, 180 - i * 6);
    txt('J' + (i + 1) + (online && i === localSlot ? ' (vous)' : ''), cx - 62 + i * 46, 36, 9, col);
    if (s.lock) txt('J' + (i + 1) + ' PRÊT', cx, 230 + i * 10, 9, col, 'center');
  }
  txt(online ? 'En ligne : la partie démarre quand les deux joueurs sont prêts' : 'Gauche / Droite : choisir · Frapper : valider · Spécial : annuler', W / 2, 262, 8, '#aab', 'center');
}
function endScores() {
  PS.forEach((p, i) => txt('J' + (i + 1) + (online && i === localSlot ? ' (vous)' : '') + '  ' + String(p.score).padStart(6, '0'), W / 2, 148 + i * 14, 12, i ? '#fb7' : '#8cf', 'center'));
}
function render() {
  g.setTransform(RS, 0, 0, RS, 0, 0);
  g.save();
  if (shake > 0) g.translate(Math.round((Math.random() * 2 - 1) * shake * 0.5), Math.round((Math.random() * 2 - 1) * shake * 0.5));
  const menu = state === 'title' || state === 'select' || state === 'online';
  drawBG(menu ? tick * 0.5 : cam);
  if (!menu) {
    const list = [];
    for (const b of B) list.push([b.y, () => drawBarrel(b)]);
    for (const it of IT) list.push([it.y - 1, () => drawItem(it)]);
    for (const e of E) list.push([e.y, () => drawChar(e)]);
    for (const p of PS) if (!p.out) list.push([p.y, () => drawChar(p)]);
    for (const b of PJ) list.push([b.y, () => drawProj(b)]);
    list.sort((a, b) => a[0] - b[0]);
    for (const l of list) l[1]();
    for (const f of FX) drawFX(f);
  }
  g.restore();
  if (state === 'title') drawTitle();
  else if (state === 'select') drawSelect();
  else if (state === 'online') drawOnline();
  else {
    hud();
    if (menuOpen) drawMenu();
    if (paused) {
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, H);
      txt('PAUSE', W / 2, H / 2, 24, '#fff', 'center');
    }
    if (state === 'over') {
      g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(0, 0, W, H);
      txt('GAME OVER', W / 2, 112, 30, '#e04040', 'center');
      endScores();
      if (endT > 60) txt(online ? 'ENTRÉE pour rejouer (choix des héros)' : 'ENTRÉE pour revenir au titre', W / 2, 200, 11, '#cbd', 'center');
    }
    if (state === 'win') {
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H);
      txt('NIVEAU TERMINÉ', W / 2, 112, 26, '#ffd34d', 'center');
      endScores();
      if (endT > 60) txt(online ? 'ENTRÉE pour rejouer (choix des héros)' : 'ENTRÉE pour revenir au titre', W / 2, 200, 11, '#cbd', 'center');
    }
  }
}
