'use strict';
function drawBarrel(b) {
  const sx = Math.round(b.x - cam), sy = Math.round(b.y);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(sx, sy + 1, 9, 3, 0, 0, 7); g.fill();
  g.fillStyle = '#7a4a22'; g.fillRect(sx - 7, sy - 20, 14, 20);
  g.fillStyle = '#4a4a52'; g.fillRect(sx - 7, sy - 16, 14, 2); g.fillRect(sx - 7, sy - 6, 14, 2);
  g.fillStyle = '#8f5a2a'; g.fillRect(sx - 5, sy - 20, 3, 20);
}
function bar(x, y, w, h, r, col) {
  g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = '#3a1a1a'; g.fillRect(x, y, w, h);
  g.fillStyle = col || (r > 0.5 ? '#4ccf4c' : (r > 0.25 ? '#e0c030' : '#e03030'));
  g.fillRect(x, y, Math.max(0, Math.round(w * r)), h);
}
function durBar(p, x, y) {
  const r = p.wd / WEAPONS[p.weapon].uses, low = p.wd <= 3;
  bar(x, y, 50, 4, r, low ? (((tick >> 3) & 1) ? '#ff6a4a' : '#c03020') : '#e8c050');
}
function spBar(p, x, y, w) {
  const cost = p.hero === 'vive' ? SP_COST_VIVE : 100, ready = p.sp >= cost;
  const flash = ready && ((tick >> 3) & 1);
  bar(x, y, w, 6, p.sp / 100, ready ? (flash ? '#fff7b0' : '#ffd34d') : '#4aa8ff');
  if (ready) { g.strokeStyle = flash ? '#fff' : '#ffd34d'; g.lineWidth = 1; g.strokeRect(x - 1.5, y - 1.5, w + 3, 9); }
  if (cost < 100) { g.fillStyle = '#000'; g.fillRect(x + Math.round(w * cost / 100), y, 1, 6); }
}
function hudPlayer(p, i) {
  const left = i === 0, col = left ? '#8cf' : '#fb7', r = p.hp / p.maxhp;
  const life = p.out ? 'HORS JEU' : 'x' + p.lives;
  const cost = p.hero === 'vive' ? SP_COST_VIVE : 100, ready = p.sp >= cost;
  const lab = ready ? 'SPÉCIAL PRÊT !' : 'SPÉCIAL', lc = ready ? '#ffd34d' : '#cfe0ff';
  if (left) {
    txt('J1', 8, 16, 10, col); bar(26, 8, 90, 8, r); txt(life, 122, 16, 10, p.out ? '#e66' : '#fff');
    spBar(p, 26, 20, 90); txt(lab, 122, 27, 8, lc);
    txt(String(p.score).padStart(6, '0'), 8, 42, 9, '#fff');
    if (p.weapon) { txt(WEAPONS[p.weapon].name + '  [E] lancer', 8, 54, 8, '#ffd34d'); durBar(p, 8, 58); }
  } else {
    txt('J2', W - 8, 16, 10, col, 'right'); bar(W - 116, 8, 90, 8, r); txt(life, W - 122, 16, 10, p.out ? '#e66' : '#fff', 'right');
    spBar(p, W - 116, 20, 90); txt(lab, W - 122, 27, 8, lc, 'right');
    txt(String(p.score).padStart(6, '0'), W - 8, 42, 9, '#fff', 'right');
    if (p.weapon) { txt(WEAPONS[p.weapon].name + '  [T] lancer', W - 8, 54, 8, '#ffd34d', 'right'); durBar(p, W - 58, 58); }
  }
}
function drawItem(it) {
  if (it.got) return;
  if (it.ttl !== undefined && it.ttl < 180 && ((tick >> 2) & 1)) return;
  const sx = Math.round(it.x - cam), sy = Math.round(it.y);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + 1, it.weapon ? 9 : 6, 2, 0, 0, 7); g.fill();
  if (it.weapon) {
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.12), by = sy - 4 - Math.round(pulse * 2);
    g.fillStyle = 'rgba(255,220,100,' + (0.18 + pulse * 0.16) + ')'; g.beginPath(); g.ellipse(sx, sy - 2, 18, 6, 0, 0, 7); g.fill();
    g.save(); g.translate(sx - 14, by); g.rotate(-0.12); g.scale(1.5, 1.5);
    drawWeaponGround(it.type);
    g.restore();
    txt(WEAPONS[it.type].name, sx, by - 12 - Math.round(pulse * 2), 7, '#ffd34d', 'center');
    return;
  }
  if (it.type === 'apple') {
    g.fillStyle = '#d83030'; g.beginPath(); g.arc(sx, sy - 6, 5, 0, 7); g.fill();
    g.fillStyle = '#3a9a3a'; g.fillRect(sx, sy - 12, 3, 3);
  } else {
    g.fillStyle = '#b86a3a'; g.fillRect(sx - 7, sy - 10, 14, 8);
    g.fillStyle = '#f0e8d0'; g.fillRect(sx + 5, sy - 11, 5, 4);
  }
}
function drawWeaponGround(name) {
  g.lineJoin = 'round';
  if (name === 'tuyau') { g.fillStyle = '#8a9099'; g.strokeStyle = OL; g.lineWidth = 0.8; g.beginPath(); g.roundRect(0, -1.6, 19, 3.2, 1.4); g.fill(); g.stroke(); g.fillStyle = '#c9ced6'; g.fillRect(1, -1, 17, 0.9); }
  else if (name === 'batte') { g.fillStyle = '#b9803f'; g.strokeStyle = OL; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -1.1); g.lineTo(10, -1.5); g.quadraticCurveTo(17, -3.2, 19, -2); g.quadraticCurveTo(20, 0, 19, 2); g.quadraticCurveTo(17, 3.2, 10, 1.5); g.lineTo(0, 1.1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#222'; g.fillRect(0.5, -1, 4, 2); }
  else { g.fillStyle = '#3a2a20'; g.fillRect(0, -1.1, 5, 2.2); g.fillStyle = '#dfe6ee'; g.strokeStyle = OL; g.lineWidth = 0.7; g.beginPath(); g.moveTo(5, -1.2); g.lineTo(13, -0.7); g.quadraticCurveTo(15.2, 0.1, 14, 0.9); g.lineTo(5, 1.2); g.closePath(); g.fill(); g.stroke(); }
}
function drawProj(b) {
  const sx = Math.round(b.x - cam), sy = Math.round(b.y - b.z);
  g.save(); g.translate(sx, sy); g.rotate(b.rot);
  if (b.wtype) { g.translate(-9, 0); drawWeaponGround(b.wtype); }
  else { g.fillStyle = '#6c6'; g.fillRect(-2, -5, 4, 10); g.fillStyle = '#cfc'; g.fillRect(-1, -7, 2, 3); }
  g.restore();
}
function drawFX(f) {
  const sx = Math.round(f.x - cam), sy = Math.round(f.y - f.z), k = f.t / f.life;
  if (f.txt) { g.globalAlpha = 1 - k * k; txt(f.txt, sx, sy - f.t * 0.6, 9, '#ff9a5a', 'center'); g.globalAlpha = 1; return; }
  g.globalAlpha = 1 - k;
  g.fillStyle = f.big ? '#ffd34d' : '#ffffff';
  const r = (f.big ? 5 : 3) + f.t * 0.8;
  g.fillRect(sx - r, sy - 1, r * 2, 2); g.fillRect(sx - 1, sy - r, 2, r * 2);
  g.fillRect(sx - r * 0.6, sy - r * 0.6, 2, 2); g.fillRect(sx + r * 0.6, sy + r * 0.6, 2, 2);
  g.globalAlpha = 1;
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

