function drawBarrel(b) {
  const sx = Math.round(b.x - cam), sy = Math.round(b.y);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(sx, sy + 1, 9, 3, 0, 0, 7); g.fill();
  g.fillStyle = '#7a4a22'; g.fillRect(sx - 7, sy - 20, 14, 20);
  g.fillStyle = '#4a4a52'; g.fillRect(sx - 7, sy - 16, 14, 2); g.fillRect(sx - 7, sy - 6, 14, 2);
  g.fillStyle = '#8f5a2a'; g.fillRect(sx - 5, sy - 20, 3, 20);
}
function drawItem(it) {
  const sx = Math.round(it.x - cam), sy = Math.round(it.y);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + 1, 6, 2, 0, 0, 7); g.fill();
  if (it.type === 'apple') {
    g.fillStyle = '#d83030'; g.beginPath(); g.arc(sx, sy - 6, 5, 0, 7); g.fill();
    g.fillStyle = '#3a9a3a'; g.fillRect(sx, sy - 12, 3, 3);
  } else {
    g.fillStyle = '#b86a3a'; g.fillRect(sx - 7, sy - 10, 14, 8);
    g.fillStyle = '#f0e8d0'; g.fillRect(sx + 5, sy - 11, 5, 4);
  }
}
function drawProj(b) {
  const sx = Math.round(b.x - cam), sy = Math.round(b.y - b.z);
  g.save(); g.translate(sx, sy); g.rotate(b.rot);
  g.fillStyle = '#6c6'; g.fillRect(-2, -5, 4, 10); g.fillStyle = '#cfc'; g.fillRect(-1, -7, 2, 3);
  g.restore();
}
function drawFX(f) {
  const sx = Math.round(f.x - cam), sy = Math.round(f.y - f.z), k = f.t / f.life;
  g.globalAlpha = 1 - k;
  g.fillStyle = f.big ? '#ffd34d' : '#ffffff';
  const r = (f.big ? 5 : 3) + f.t * 0.8;
  g.fillRect(sx - r, sy - 1, r * 2, 2); g.fillRect(sx - 1, sy - r, 2, r * 2);
  g.fillRect(sx - r * 0.6, sy - r * 0.6, 2, 2); g.fillRect(sx + r * 0.6, sy + r * 0.6, 2, 2);
  g.globalAlpha = 1;
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
  const cost = HEROES[p.hero].cost, ready = p.sp >= cost;
  const flash = ready && ((tick >> 3) & 1);
  bar(x, y, w, 6, p.sp / 100, ready ? (flash ? '#fff7b0' : '#ffd34d') : '#4aa8ff');
  if (ready) { g.strokeStyle = flash ? '#fff' : '#ffd34d'; g.lineWidth = 1; g.strokeRect(x - 1.5, y - 1.5, w + 3, 9); }
  if (cost < 100) { g.fillStyle = '#000'; g.fillRect(x + Math.round(w * cost / 100), y, 1, 6); }
}
const PCOL = ['#8cf', '#fb7', '#8f8', '#f9d'];
const pname = (p, n) => String(p.name || ('J' + (p.slot + 1))).slice(0, n || 10);
/* bloc d'infos d'un joueur (haut de l'écran) : nom, vies, score, niveau, petite barre d'XP, arme.
   La vie et l'ultime sont affichées au-dessus de la tête des personnages (voir drawChar). */
function hudBlock(p, x0) {
  const col = PCOL[p.slot & 3], need = xpNeed(p.xl);
  txt(pname(p, 10), x0, 10, 7, col); txt(p.out ? 'HORS JEU' : 'x' + p.lives, x0 + 96, 10, 7, p.out ? '#e66' : '#fff', 'right');
  txt(String(p.score).padStart(6, '0'), x0, 21, 8, '#fff'); txt('NIV ' + (p.xl + 1), x0 + 96, 21, 7, '#cbd', 'right');
  /* 1 = vie, 2 = ultime, 3 = XP (mêmes tailles) */
  const r1 = Math.max(0, Math.min(1, p.hp / p.maxhp)), rd = p.sp >= HEROES[p.hero].cost, fl = rd && ((tick >> 3) & 1);
  g.fillStyle = '#000'; g.fillRect(x0 - 1, 24, 98, 12);
  g.fillStyle = '#3a1a1a'; g.fillRect(x0, 25, 96, 2); g.fillStyle = r1 > 0.5 ? '#4ccf4c' : (r1 > 0.25 ? '#e0c030' : '#e03030'); g.fillRect(x0, 25, Math.round(96 * r1), 2);
  g.fillStyle = '#12203a'; g.fillRect(x0, 29, 96, 2); g.fillStyle = rd ? (fl ? '#fff7b0' : '#ffd34d') : '#4aa8ff'; g.fillRect(x0, 29, Math.round(96 * Math.min(1, p.sp / 100)), 2);
  g.fillStyle = '#2a2a55'; g.fillRect(x0, 33, 96, 2); g.fillStyle = '#7dff9a'; g.fillRect(x0, 33, Math.round(96 * p.xp / need), 2);
  if (p.weapon) { const w = WEAPONS[p.weapon]; txt(w.name, x0, 46, 6, '#ffd34d'); bar(x0 + 40, 41, 56, 3, p.wd / w.uses, p.wd <= 3 ? (((tick >> 3) & 1) ? '#ff6a4a' : '#c03020') : '#e8c050'); }
}
function hudPlayer(p, i) {
  if (p.absent) return;
  const me = hudMe(p);
  hudBlock(p, me === 1 ? W - 100 : (me === 0 ? 4 + hudRank(p) * 106 : (i === 0 ? 4 : W - 100)));
}
/* 1 = c'est nous (panneau vertical), 0 = un autre joueur en ligne (bloc en haut), -1 = partie locale à 2 */
function hudMe(p) { return online ? (p.slot === localSlot ? 1 : 0) : (nPlayers === 1 ? 1 : -1); }
function hudRank(p) { let k = 0; for (const q of PS) { if (q === p) break; if (!q.absent && hudMe(q) === 0) k++; } return k; }
function drawSpec() {
  g.fillStyle = 'rgba(5,3,15,.88)'; g.fillRect(0, 0, W, H);
  txt('NIVEAU TERMINÉ · CHOISISSEZ UNE SPÉCIALISATION', W / 2, 20, 11, '#ffcf4a', 'center');
  const ps = PS.filter(p => !specSkip(p)), n = ps.length, pw = n > 2 ? 116 : 220, gap = n > 2 ? 3 : 10;
  const x00 = Math.round((W - (n * pw + (n - 1) * gap)) / 2);
  ps.forEach((p, k) => {
    const s = p.slot, x0 = x00 + k * (pw + gap), col = PCOL[s & 3];
    g.fillStyle = 'rgba(30,26,60,.92)'; g.fillRect(x0, 34, pw, 206);
    g.strokeStyle = specLk[s] ? '#7dff9a' : col; g.lineWidth = 1; g.strokeRect(x0 + 0.5, 34.5, pw - 1, 205);
    txt(pname(p, 10) + ' · ' + HEROES[p.hero].name, x0 + pw / 2, 48, n > 2 ? 7 : 9, col, 'center');
    txt('niveau ' + (p.xl + 1) + (online && s === localSlot ? ' (vous)' : ''), x0 + pw / 2, 59, 7, '#9ab', 'center');
    SPECS[p.hero].forEach((sp, i) => {
      const y = 68 + i * 54, on = specCh[s] === i;
      g.fillStyle = on ? (specLk[s] ? 'rgba(60,140,80,.55)' : 'rgba(90,80,200,.55)') : 'rgba(20,18,44,.8)'; g.fillRect(x0 + 4, y, pw - 8, 48);
      g.strokeStyle = on ? '#fff' : '#3a3670'; g.strokeRect(x0 + 4.5, y + 0.5, pw - 9, 47);
      txt(sp[0] + (p.specs[i] ? ' ×' + (p.specs[i] + 1) : ''), x0 + pw / 2, y + 15, n > 2 ? 7 : 9, on ? '#fff' : '#bbd', 'center');
      txt(sp[1], x0 + pw / 2, y + 32, 6, on ? '#8fe0a8' : '#778', 'center');
    });
    txt(specLk[s] ? 'PRÊT' : '← → choisir · Frapper', x0 + pw / 2, 234, 7, specLk[s] ? '#7dff9a' : '#aab', 'center');
  });
  txt('La suite démarre quand tous sont prêts (' + Math.max(0, Math.ceil((1500 - specT) / 60)) + ' s)', W / 2, 258, 8, '#8a8ab0', 'center');
}
function drawItem(it) {
  if (it.got) return;
  if (it.ttl !== undefined && it.ttl < 180 && ((tick >> 2) & 1)) return;
  const sx = Math.round(it.x - cam), sy = Math.round(it.y);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + 1, it.weapon ? 9 : 6, 2, 0, 0, 7); g.fill();
  if (it.cane) {
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.15), by = sy - 5 - Math.round(pulse * 2);
    g.fillStyle = 'rgba(255,220,100,' + (0.2 + pulse * 0.2) + ')'; g.beginPath(); g.ellipse(sx, sy - 2, 20, 6, 0, 0, 7); g.fill();
    g.save(); g.translate(sx - 4, by); g.rotate(-0.1); g.scale(1.3, 1.3); drawWeapon('canne', -9, 0, 0); g.restore();
    txt('CANNE', sx, by - 10 - Math.round(pulse * 2), 7, '#ffd34d', 'center');
    return;
  }
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
  else if (name === 'pancarte') { g.fillStyle = '#8a6a3a'; g.strokeStyle = OL; g.lineWidth = 0.8; g.fillRect(0, -1, 20, 2); g.strokeRect(0, -1, 20, 2); g.fillStyle = '#f4f0e0'; g.fillRect(12, -9, 11, 8); g.strokeRect(12, -9, 11, 8); g.fillStyle = '#d03030'; g.fillRect(14, -6, 7, 1.6); g.fillRect(14, -3.4, 5, 1.2); }
  else if (name === 'pave') { g.fillStyle = '#8c8f98'; g.strokeStyle = OL; g.lineWidth = 0.9; g.beginPath(); g.moveTo(2, -4); g.lineTo(12, -5); g.lineTo(15, 0); g.lineTo(11, 4); g.lineTo(3, 4); g.lineTo(0, -1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#b4b7c0'; g.fillRect(4, -3, 6, 1.5); }
  else if (name === 'batte') { g.fillStyle = '#b9803f'; g.strokeStyle = OL; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -1.1); g.lineTo(10, -1.5); g.quadraticCurveTo(17, -3.2, 19, -2); g.quadraticCurveTo(20, 0, 19, 2); g.quadraticCurveTo(17, 3.2, 10, 1.5); g.lineTo(0, 1.1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#222'; g.fillRect(0.5, -1, 4, 2); }
  else { g.fillStyle = '#3a2a20'; g.fillRect(0, -1.1, 5, 2.2); g.fillStyle = '#dfe6ee'; g.strokeStyle = OL; g.lineWidth = 0.7; g.beginPath(); g.moveTo(5, -1.2); g.lineTo(13, -0.7); g.quadraticCurveTo(15.2, 0.1, 14, 0.9); g.lineTo(5, 1.2); g.closePath(); g.fill(); g.stroke(); }
}
function drawChair(p) {
  const sx = Math.round(p.chx - cam), sy = Math.round(p.chy), bl = (tick >> 3) & 1;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + 1, 11, 3, 0, 0, 7); g.fill();
  g.strokeStyle = OL; g.lineWidth = 1.9; g.beginPath(); g.arc(sx, sy - 8, 8, 0, 7); g.stroke();
  g.strokeStyle = '#8a909c'; g.lineWidth = 1.1; g.beginPath(); g.arc(sx, sy - 8, 8, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(210,215,225,.8)'; g.lineWidth = 0.5;
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + 0.4; g.beginPath(); g.moveTo(sx + Math.cos(a) * 7, sy - 8 + Math.sin(a) * 7); g.lineTo(sx - Math.cos(a) * 7, sy - 8 - Math.sin(a) * 7); g.stroke(); }
  g.fillStyle = '#44464f'; g.fillRect(sx - 6, sy - 10, 12, 2.4); g.fillStyle = '#33353d'; g.fillRect(sx - 7, sy - 18, 2.4, 9);
  if (bl) { g.fillStyle = '#ffd34d'; g.fillRect(sx - 1, sy - 28, 2, 5); g.fillRect(sx - 1, sy - 21, 2, 2); }
}
function drawProj(b) {
  const sx = Math.round(b.x - cam), sy = Math.round(b.y - b.z);
  if (b.wave) {
    const d = Math.sign(b.vx);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + 1, 9, 3, 0, 0, 7); g.fill();
    g.fillStyle = '#7fd8ff'; g.strokeStyle = '#fff'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(sx - d * 6, sy); g.quadraticCurveTo(sx - d * 4, sy - 14, sx + d * 6, sy - 12 - Math.sin(tick * 0.4) * 2); g.quadraticCurveTo(sx + d * 2, sy - 6, sx + d * 8, sy); g.closePath(); g.fill(); g.stroke();
    return;
  }
  if (b.orb) {
    g.globalAlpha = 0.35; g.fillStyle = '#ff6af0'; g.beginPath(); g.arc(sx, sy, 8, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(sx, sy, 3.2, 0, 7); g.fill(); g.fillStyle = '#ff4ad0'; g.beginPath(); g.arc(sx, sy, 5, 0, 7); g.globalAlpha = 0.7; g.fill(); g.globalAlpha = 1;
    return;
  }
  if (b.orbm) {
    g.globalAlpha = 0.35; g.fillStyle = '#7a6aff'; g.beginPath(); g.arc(sx, sy, 9, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(sx, sy, 3.4, 0, 7); g.fill(); g.fillStyle = '#9a8aff'; g.globalAlpha = 0.75; g.beginPath(); g.arc(sx, sy, 5.4, 0, 7); g.fill(); g.globalAlpha = 1;
    for (let k = 0; k < 3; k++) { g.fillStyle = '#d8d0ff'; g.fillRect(sx - Math.sign(b.vx) * (6 + k * 5) + (k & 1) * 2, sy + Math.sin(tick * 0.5 + k) * 3, 2, 2); }
    return;
  }
  g.save(); g.translate(sx, sy); g.rotate(b.rot);
  if (b.card) {
    g.fillStyle = '#fff'; g.strokeStyle = OL; g.lineWidth = 0.8; g.fillRect(-3.4, -4.6, 6.8, 9.2); g.strokeRect(-3.4, -4.6, 6.8, 9.2);
    g.fillStyle = '#d02838'; g.fillRect(-1.4, -2.2, 2.8, 2.8);
  } else if (b.star) {
    g.fillStyle = '#cfd6e4'; g.strokeStyle = OL; g.lineWidth = 0.8;
    g.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 2.2 : 6, a = k * Math.PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#d03030'; g.beginPath(); g.arc(0, 0, 1.2, 0, 7); g.fill();
  } else if (b.can) {
    g.fillStyle = '#8a9099'; g.strokeStyle = OL; g.lineWidth = 0.8; g.fillRect(-4, -2.2, 8, 4.4); g.strokeRect(-4, -2.2, 8, 4.4); g.fillStyle = '#9acd4a'; g.fillRect(-1, -2.2, 2, 4.4);
    g.rotate(-b.rot); g.globalAlpha = 0.4; g.fillStyle = '#dfeab0'; g.beginPath(); g.arc(-6 * Math.sign(b.vx), 0, 4 + (tick % 5), 0, 7); g.fill(); g.globalAlpha = 1;
  } else if (b.wtype) { g.translate(-9, 0); drawWeaponGround(b.wtype); }
  else if (b.cane) { g.scale(1.3, 1.3); drawWeapon('canne', -9, 0, 0); }
  else { g.fillStyle = '#6c6'; g.fillRect(-2, -5, 4, 10); g.fillStyle = '#cfc'; g.fillRect(-1, -7, 2, 3); }
  g.restore();
}
function drawFX(f) {
  const sx = Math.round(f.x - cam), sy = Math.round(f.y - f.z), k = f.t / f.life;
  if (f.txt) { g.globalAlpha = 1 - k * k; txt(f.txt, sx, sy - f.t * 0.6, 9, f.col || '#ff9a5a', 'center'); g.globalAlpha = 1; return; }
  g.globalAlpha = 1 - k;
  g.fillStyle = f.big ? '#ffd34d' : '#ffffff';
  const r = (f.big ? 5 : 3) + f.t * 0.8;
  g.fillRect(sx - r, sy - 1, r * 2, 2); g.fillRect(sx - 1, sy - r, 2, r * 2);
  g.fillRect(sx - r * 0.6, sy - r * 0.6, 2, 2); g.fillRect(sx + r * 0.6, sy + r * 0.6, 2, 2);
  g.globalAlpha = 1;
}
function drawMenu() {
  g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(0, 0, W, H);
  const ML = curMenu(), bw = 250, bh = 40 + ML.length * 22 + 26, bx = (W - bw) / 2, by = (H - bh) / 2;
  g.fillStyle = 'rgba(24,20,48,.96)'; g.fillRect(bx, by, bw, bh);
  g.strokeStyle = '#4a4690'; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  txt(menuSub ? 'OPTIONS' : 'MENU', W / 2, by + 20, 14, '#ffcf4a', 'center');
  ML.forEach((it, i) => {
    const on = i === menuIdx2;
    txt((on ? '> ' : '  ') + it.label() + (on ? ' <' : '  '), W / 2, by + 46 + i * 22, 11, on ? '#fff' : '#9a9ac0', 'center');
  });
  txt((online ? (others() > 0 ? 'Votre héros est protégé, les autres jouent · ' : 'Jeu en pause · ') : '') + (menuSub ? 'Gauche / Droite : modifier · Échap : retour' : 'Haut / Bas · Entrée · Échap : fermer'), W / 2, by + bh - 8, 7, '#8a8ab0', 'center');
}
function hud() {
  PS.forEach(hudPlayer);
  txt('N' + (levelIdx + 1) + ' · ' + LV.name, W / 2, 8, 7, '#99a', 'center');
  if (tgt && tgtT > 0 && !tgt.gone && tgt.kind === 'e' && tgt.type !== 'boss') {
    txt(T[tgt.type].name, W / 2, 16, 9, '#fda', 'center');
    bar(W / 2 - 40, 20, 80, 6, tgt.hp / tgt.maxhp, '#e0663a');
  }
  if (introT > 0 && state === 'play') {
    const a = Math.min(1, introT / 30, (170 - introT) / 20);
    g.globalAlpha = Math.max(0, a); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 88, W, 62); g.globalAlpha = Math.max(0, a);
    txt('NIVEAU ' + (levelIdx + 1) + ' / ' + LEVELS.length, W / 2, 112, 11, '#ffd34d', 'center');
    txt(LV.name, W / 2, 134, 22, '#fff', 'center');
    g.globalAlpha = 1;
  }
  if (goT > 0 && waveI < LV.waves.length && ((tick >> 4) & 1)) txt('GO >>', W - 14, 60, 16, '#ffd34d', 'right');
  if (online && room && localSlot === 0 && others() === 0 && !joinBusy) {
    const okR = rel && rel.bs.some(b => b.ready);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, H - 11, W, 11);
    txt(okR ? 'En attente d\'amis : ils cliquent sur EN LIGNE (jusqu\'à 4 joueurs)' : (rel && tick - rel.t0 > 600 ? 'Serveur de rencontre injoignable (réseau bloqué ?)' : 'Connexion au relais en ligne…'), W / 2, H - 3, 8, okR ? '#9fd' : '#f99', 'center');
  } else if (online && room) {
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, H - 9, W, 9);
    const rt = Math.round(rttMax);
    txt((others() + 1) + '/' + MAXP + ' joueurs' + (rt > 0 ? ' · ping ' + rt + ' ms' : '') + ' · délai ' + curDelay, W / 2, H - 2, 7, rt > 220 ? '#fb7' : '#9fd', 'center');
  }
  if (joinBusy) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 100, W, 44); txt('Un ami rejoint la partie…', W / 2, 126, 14, '#ffd34d', 'center'); }
  if (toastT > 0) { g.globalAlpha = Math.min(1, toastT / 30); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - 150, 46, 300, 16); txt(toastMsg, W / 2, 58, 9, '#fff', 'center'); g.globalAlpha = 1; }
  if (online && stallT > 20 && !joinBusy) txt('En attente des autres joueurs...', W / 2, 52, 10, '#ffd34d', 'center');
  if (online && pauseBy && !menuOpen) txt(pauseBy + ' est dans le menu (protégé)', W / 2, 40, 8, '#cbd', 'center');
  if (online && desync) txt('DÉSYNCHRONISÉ : relancez la partie', W / 2, 64, 10, '#f66', 'center');
}

let PREV = null;
function drawTitle() {
  g.fillStyle = 'rgba(5,3,15,.55)'; g.fillRect(0, 0, W, H);
  txt('NUIT DE FER', W / 2, 70, 38, '#ffcf4a', 'center');
  txt('prototype · beat\'em up', W / 2, 88, 11, '#cbd', 'center');
  const items = ['1 JOUEUR', 'EN LIGNE (JUSQU\'À 4 JOUEURS)', 'CLASSEMENT MONDIAL', 'OPTIONS'];
  items.forEach((o, i) => {
    const on = i === menuIdx;
    txt((on ? '> ' : '  ') + o + (on ? ' <' : '  '), W / 2, 130 + i * 24, 13, on ? '#fff' : '#889', 'center');
  });
  txt('Niveau ' + (startLevel + 1) + ' · ' + LEVELS[startLevel].name + ' · ' + myName + ' · alliés ' + (FRIENDLY ? 'se blessent' : 'protégés'), W / 2, 234, 8, '#8a8ab0', 'center');
  if (netMsg) txt(netMsg, W / 2, 222, 10, '#f66', 'center');
  txt('J frapper · K spécial · L lancer · Espace sauter · Échap menu', W / 2, 249, 8, '#aab', 'center');
  txt('version 20h30 · vie, ultime, XP', W / 2, 264, 7, '#667', 'center');
}
function drawOptions() {
  g.fillStyle = 'rgba(5,3,15,.82)'; g.fillRect(0, 0, W, H);
  txt('OPTIONS', W / 2, 40, 22, '#ffcf4a', 'center');
  const L = optList('title').concat([{ label: () => 'RETOUR' }]);
  L.forEach((it, i) => {
    const on = i === optIdx;
    txt((on ? '> ' : '  ') + it.label() + (on ? ' <' : '  '), W / 2, 84 + i * 22, 11, on ? '#fff' : '#9a9ac0', 'center');
  });
  const cur = L[optIdx];
  if (cur && cur.hint) txt(cur.hint(), W / 2, 238, 8, '#cbd', 'center');
  txt('Haut / Bas · Gauche / Droite : modifier · Entrée · Échap : retour', W / 2, 258, 8, '#8a8ab0', 'center');
}
function drawNameEntry() {
  g.fillStyle = 'rgba(5,3,15,.8)'; g.fillRect(0, 0, W, H);
  txt('VOTRE NOM DE JOUEUR', W / 2, 90, 16, '#ffcf4a', 'center');
  g.fillStyle = '#1a1840'; g.fillRect(W / 2 - 100, 118, 200, 26);
  g.strokeStyle = '#7a76c0'; g.lineWidth = 1; g.strokeRect(W / 2 - 99.5, 118.5, 199, 25);
  txt(nameBuf + (((tick >> 4) & 1) ? '_' : ' '), W / 2, 137, 15, '#fff', 'center');
  txt('Tapez votre nom (10 caractères max)', W / 2, 170, 9, '#cbd', 'center');
  txt('ENTRÉE : valider · Échap : annuler', W / 2, 186, 9, '#aab', 'center');
}
function drawScores() {
  g.fillStyle = 'rgba(5,3,15,.85)'; g.fillRect(0, 0, W, H);
  txt('CLASSEMENT MONDIAL', W / 2, 26, 18, '#ffcf4a', 'center');
  const on = sbOn(), l = gScores || [];
  txt('#  NOM         SCORE  NIV  PERSONNAGE', W / 2, 50, 9, '#8a8ab0', 'center');
  if (!on) txt('Classement indisponible', W / 2, 130, 11, '#f88', 'center');
  else if (gStatus === 'load' && !gScores) txt('Chargement…', W / 2, 130, 11, '#cbd', 'center');
  else if (gStatus === 'err' && !gScores) { txt('Classement mondial injoignable', W / 2, 120, 11, '#f88', 'center'); txt(gErr, W / 2, 138, 8, '#fb9', 'center'); txt('K : réessayer', W / 2, 154, 9, '#cbd', 'center'); }
  else if (!l.length) txt('Aucun score pour le moment', W / 2, 130, 11, '#cbd', 'center');
  l.slice(0, 10).forEach((s, i) => {
    const y = 68 + i * 17, col = i === 0 ? '#ffd34d' : (i < 3 ? '#e8e8f0' : '#9aa');
    const hn = (HEROES[s.h] ? HEROES[s.h].name : '?').replace(/^L[EA']\s*/, '').replace(/^'/, '');
    txt(String(i + 1).padStart(2, ' ') + ' ' + String(s.n).padEnd(10, ' ') + ' ' + String(s.s).padStart(6, '0') + '  ' + (s.win ? 'FIN' : 'N' + s.lv).padEnd(3, ' ') + '  ' + hn.padEnd(10, ' '), W / 2, y, 11, col, 'center');
  });
  txt('ENTRÉE : retour', W / 2, 258, 8, '#8a8ab0', 'center');
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
      txt((on ? '> ' : '  ') + o + (on ? ' <' : '  '), W / 2, 100 + i * 26, 15, on ? '#fff' : '#889', 'center');
    });
    txt('Cliquez sur EN LIGNE : vous rejoignez la partie de vos amis,', W / 2, 172, 9, '#aab', 'center');
    txt('à tout moment, même en cours de partie (lien ou code).', W / 2, 184, 9, '#aab', 'center');
    txt('Rejoindre : ouvrez le lien reçu, ou tapez le code.', W / 2, 202, 9, '#aab', 'center');
    txt('P : retour', W / 2, 250, 9, '#889', 'center');
  } else if (olStage === 'joining') {
    txt('Entrez le code de la partie (ou collez le lien)', W / 2, 96, 12, '#cbd', 'center');
    txt((codeBuf + '_____').slice(0, 5).split('').join(' '), W / 2, 140, 34, '#fff', 'center');
    txt('ENTRÉE pour se connecter', W / 2, 190, 10, '#aab', 'center');
    txt('P : retour', W / 2, 250, 9, '#889', 'center');
  } else if (olStage === 'connecting') {
    if ((tick >> 5) & 1) txt(waitMsg ? 'Patientez...' : (rel && rel.srch ? 'Recherche d\'une partie...' : 'Connexion...'), W / 2, 140, 14, '#ffd34d', 'center');
    if (waitMsg) txt(waitMsg, W / 2, 170, 8, '#cbd', 'center');
    drawRelays(236);
  } else if (olStage === 'error') {
    txt(netMsg, W / 2, 130, 11, '#f66', 'center');
    txt('ENTRÉE pour revenir', W / 2, 180, 10, '#aab', 'center');
    if (lastRelays) txt(lastRelays, W / 2, 210, 7, '#889', 'center');
  }
}
function drawSelect() {
  g.fillStyle = 'rgba(5,3,15,.78)'; g.fillRect(0, 0, W, H);
  txt(nPlayers >= 2 ? 'CHOISISSEZ VOS HÉROS' : 'CHOISISSEZ VOTRE HÉROS', W / 2, 18, 12, '#ffcf4a', 'center');
  const CW = 66, X0 = 45, CH = 100, n = HERO_KEYS.length, per = 7;
  const pos = i => ({ cx: X0 + (i % per) * CW, y0: 22 + Math.floor(i / per) * 104 });
  if (!PREV || PREV.length !== n) PREV = HERO_KEYS.map((k, i) => Object.assign(mkPlayer(k, 0), { x: pos(i).cx, y: pos(i).y0 + 76 }));
  const c0 = cam; cam = 0;
  HERO_KEYS.forEach((k, i) => {
    const hr = HEROES[k], { cx, y0 } = pos(i), e = PREV[i];
    g.fillStyle = 'rgba(30,26,60,.92)'; g.fillRect(cx - 32, y0, 64, CH);
    g.strokeStyle = '#3a3670'; g.lineWidth = 1; g.strokeRect(cx - 31.5, y0 + 0.5, 63, CH - 1);
    txt(hr.name.replace('LE ', '').replace('LA ', ''), cx, y0 + 10, 7, '#fff', 'center');
    const locked = SEL.slice(0, nPlayers).some((s, j) => s.lock && s.c === i && (!online || act[j]));
    if (locked) { e.st = 'attack'; e.stage = (tick >> 5) % 3; e.t = (tick >> 1) % hr.atk[e.stage].dur; } else { e.st = 'free'; e.t = 0; }
    e.name = '';
    drawChar(e);
    txt('PV', cx - 29, y0 + 83, 6, '#9ab'); bar(cx - 17, y0 + 79, 46, 3, hr.hp / 130, '#4ccf4c');
    txt('VIT', cx - 29, y0 + 89, 6, '#9ab'); bar(cx - 17, y0 + 85, 46, 3, hr.spd / 1.95, '#4aa8ff');
    txt('FOR', cx - 29, y0 + 95, 6, '#9ab'); bar(cx - 17, y0 + 91, 46, 3, hr.dmg / 1.45, '#e0663a');
  });
  cam = c0;
  for (let i = 0; i < nPlayers; i++) {
    if (online && !act[i] && !(roomJoin && i === localSlot)) continue;
    const s = SEL[i], { cx, y0 } = pos(s.c), col = ['#4aa8ff', '#ff9a3a', '#6ae06a', '#ff7ad0'][i & 3];
    g.strokeStyle = col; g.lineWidth = 2;
    g.strokeRect(cx - 34 + i * 3, y0 - 2 + i * 3, 68 - i * 6, CH + 4 - i * 6);
    txt(String(NAMES[i] || 'J' + (i + 1)).slice(0, 8) + (s.lock ? ' ✔' : ''), i < 2 ? cx - 30 : cx + 30, y0 + 19, 6, col, i < 2 ? 'left' : 'right');
  }
  { const hk = HERO_KEYS[(SEL[online ? localSlot : 0] || SEL[0]).c], hh = HEROES[hk]; txt(hh.name + ' — ' + hh.role, W / 2, 242, 8, '#ffd34d', 'center'); txt('Spécial : ' + hh.special + '  ·  ' + hh.trait, W / 2, 254, 7, '#8fe0a8', 'center'); }
  txt(roomJoin ? (jselSent ? 'Synchronisation avec la partie en cours…' : 'Vous rejoignez la partie de ' + (NAMES[0] || 'l\'hôte') + ' : choisissez un héros (Frapper)') : roomPending ? 'Partie en ligne : vos amis (jusqu\'à 3) cliquent sur EN LIGNE pour vous rejoindre' : online ? 'En ligne : la partie démarre quand tous les joueurs sont prêts' : '← → ↑ ↓ : choisir · Frapper : valider · Spécial : annuler', W / 2, 266, 8, roomJoin && jselSent ? '#ffd34d' : '#aab', 'center');
}
/* ---------- pièges ---------- */
const trapC = t => (simF + (t.ph || 0)) % (t.per || 1);

function drawHzGround() {
  for (const h of HZ) {
    const sx = Math.round(h.x - cam);
    if (h.k === 'ring') {
      const k = 1 - h.r / h.max;
      g.strokeStyle = h.fire ? 'rgba(255,150,40,' + (0.5 + 0.4 * k) + ')' : 'rgba(255,230,160,' + (0.5 + 0.4 * k) + ')'; g.lineWidth = h.fire ? 5 : 3;
      g.beginPath(); g.ellipse(sx, h.y, h.r, h.r / 2.2, 0, 0, 7); g.stroke();
      g.strokeStyle = h.fire ? 'rgba(255,240,160,.9)' : '#fff'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(sx, h.y, h.r, h.r / 2.2, 0, 0, 7); g.stroke();
    } else if (h.k === 'gas') {
      const k = h.t / h.life, al = Math.min(1, h.t / 20, (1 - k) * 4);
      for (let i = 0; i < 9; i++) {
        const ph = tick * 0.03 + i * 1.7, px = sx + Math.cos(ph) * h.r * 0.7 * (0.4 + (i % 3) * 0.3), py = h.y - 4 - (i % 4) * 5 + Math.sin(ph * 1.3) * 3;
        g.globalAlpha = al * 0.32; g.fillStyle = i % 2 ? '#c6e08a' : '#e4f0b8'; g.beginPath(); g.ellipse(px, py, 14, 8, 0, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
    } else if (h.k === 'jet') {
      const x0 = h.dir > 0 ? 0 : 0;
      if (h.t < h.warn) {
        if ((tick >> 2) & 1) { g.fillStyle = 'rgba(255,50,50,' + (0.1 + 0.2 * h.t / h.warn) + ')'; g.fillRect(0, h.y - 12, W, 24); }
        g.strokeStyle = 'rgba(255,90,90,.7)'; g.lineWidth = 1; g.strokeRect(0.5, h.y - 12, W - 1, 24);
      } else if (h.t < h.warn + h.dur) {
        g.fillStyle = 'rgba(170,215,255,.7)'; g.fillRect(0, h.y - 12, W, 24);
        g.fillStyle = 'rgba(255,255,255,.85)';
        for (let k = 0; k < 40; k++) { const px = ((tick * 11 * h.dir + k * 53) % W + W) % W; g.fillRect(px, h.y - 12 + ((k * 7 + tick) % 22), 9, 2); }
      }
    } else if (h.k === 'strike' && h.t >= 0 && h.t < h.warn) {
      const f = h.t / h.warn;
      g.fillStyle = 'rgba(255,40,40,' + (0.12 + f * 0.3) + ')'; g.beginPath(); g.ellipse(sx, h.y, h.r, h.r * 0.5, 0, 0, 7); g.fill();
      g.strokeStyle = ((tick >> 2) & 1) ? '#ff4040' : '#ffd0d0'; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, h.y, h.r * (1 - f * 0.25), h.r * 0.5 * (1 - f * 0.25), 0, 0, 7); g.stroke();
    }
  }
  for (const e of E) if (e.mk && e.tx !== undefined) {
    const sx = Math.round(e.tx - cam);
    g.strokeStyle = ((tick >> 2) & 1) ? '#ff4040' : '#fff'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(sx, e.ty, 16, 6, 0, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(sx - 20, e.ty); g.lineTo(sx + 20, e.ty); g.moveTo(sx, e.ty - 8); g.lineTo(sx, e.ty + 8); g.stroke();
  }
}
function drawHzTop() {
  for (const h of HZ) {
    if (h.k !== 'strike' || h.t < h.warn - 14) continue;
    const sx = Math.round(h.x - cam);
    if (h.fx === 'bolt') {
      if (h.t >= h.warn) {
        g.fillStyle = 'rgba(200,230,255,' + (0.35 * (1 - (h.t - h.warn) / 16)) + ')'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#eef6ff'; g.lineWidth = 2.4; g.beginPath(); let x = sx; g.moveTo(x, 0);
        for (let y = 14; y < h.y; y += 14) { x = sx + (Math.random() - 0.5) * 18; g.lineTo(x, y); } g.lineTo(sx, h.y); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(sx, h.y, 20, 7, 0, 0, 7); g.fill();
      }
    } else {
      const fall = h.t < h.warn ? (h.warn - h.t) * 9 : 0;
      if (h.t < h.warn + 6) {
        g.strokeStyle = '#2a2a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, h.y - fall - 44); g.lineTo(sx, h.y - fall - 20); g.stroke();
        g.fillStyle = '#4a5260'; g.strokeStyle = OL; g.lineWidth = 1.2;
        g.beginPath(); g.arc(sx, h.y - fall - 14, 4, 0, 7); g.stroke();
        g.beginPath(); g.moveTo(sx - 1.5, h.y - fall - 18); g.lineTo(sx + 1.5, h.y - fall - 18); g.lineTo(sx + 1.5, h.y - fall - 2); g.lineTo(sx - 1.5, h.y - fall - 2); g.fill();
        g.beginPath(); g.arc(sx, h.y - fall - 4, 11, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 3; g.strokeStyle = '#6a7484'; g.stroke();
      } else { g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(sx, h.y, 20, 7, 0, 0, 7); g.fill(); }
    }
  }
  if (ultT > 0) {
    const a = Math.min(1, ultT / 20, (120 - ultT) / 12);
    g.globalAlpha = a; g.fillStyle = 'rgba(120,0,0,' + (0.18 + 0.1 * ((tick >> 3) & 1)) + ')'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 70, W, 44);
    txt('⚠ ATTAQUE ULTIME ⚠', W / 2, 92, 16, ((tick >> 2) & 1) ? '#ff5050' : '#ffd34d', 'center');
    txt(ULT_TXT[ultK] || '', W / 2, 108, 9, '#fff', 'center');
    g.globalAlpha = 1;
  }
}
function drawTrapGround(t) {
  const sx = Math.round(t.x - cam), c = trapC(t);
  if (t.t === 'belt') {
    const x0 = Math.round(t.x - cam), w = t.w;
    if (x0 > W || x0 + w < 0) return;
    g.fillStyle = '#26262c'; g.fillRect(x0, 160, w, 98);
    g.fillStyle = '#e0b020'; g.fillRect(x0, 160, w, 2); g.fillRect(x0, 256, w, 2);
    g.fillStyle = '#3a3a44';
    for (let x = -((simF * 0.9 * -t.dir) % 18 + 18) % 18; x < w; x += 18) {
      const xx = x0 + x; if (xx < x0 || xx > x0 + w - 8) continue;
      for (let y = 168; y < 252; y += 14) { g.beginPath(); if (t.dir > 0) { g.moveTo(xx, y); g.lineTo(xx + 6, y + 3); g.lineTo(xx, y + 6); } else { g.moveTo(xx + 6, y); g.lineTo(xx, y + 3); g.lineTo(xx + 6, y + 6); } g.fill(); }
    }
    g.fillStyle = '#555'; g.fillRect(x0 - 3, 158, 3, 100); g.fillRect(x0 + w, 158, 3, 100);
    return;
  }
  if (sx < -40 || sx > W + 40) return;
  if (t.t === 'water') {
    const warn = c >= t.per - 90 && c < t.per - 44, on = c >= t.per - 44 && c < t.per - 6;
    const x0 = t.dir > 0 ? sx + 26 : sx - 26 - t.len;
    if (warn && ((tick >> 2) & 1)) { g.fillStyle = 'rgba(255,60,60,.22)'; g.fillRect(x0, t.y - 12, t.len, 24); }
    if (on) { g.fillStyle = 'rgba(120,180,255,.25)'; g.fillRect(x0, t.y - 12, t.len, 24); }
    return;
  }
  if (t.t === 'steam') {
    g.fillStyle = '#15151a'; g.beginPath(); g.ellipse(sx, t.y, 12, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#3a3a44'; for (let k = -8; k <= 8; k += 4) g.fillRect(sx + k - 0.5, t.y - 2, 1, 4);
    if (c >= t.per - 70 && c < t.per - 34 && ((tick >> 2) & 1)) { g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(sx, t.y, 6, 2, 0, 0, 7); g.fill(); }
  } else if (t.t === 'crate') {
    if (c >= t.per - 50) { const k = (c - (t.per - 50)) / 50; g.fillStyle = 'rgba(0,0,0,' + (0.25 + k * 0.3) + ')'; g.beginPath(); g.ellipse(sx, t.y, 6 + k * 14, 2 + k * 5, 0, 0, 7); g.fill();
      if ((tick >> 3) & 1) { g.strokeStyle = '#ff4040'; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, t.y, 19, 7, 0, 0, 7); g.stroke(); } }
    else if (c < 50) { g.globalAlpha = 1 - c / 50; g.fillStyle = '#8a5a30'; g.strokeStyle = OL; g.lineWidth = 0.7;
      for (const [dx, dy, w, r] of [[-12, 2, 10, 0.3], [4, 3, 9, -0.4], [-3, -2, 7, 1.2], [10, -1, 8, 0.1]]) { g.save(); g.translate(sx + dx, t.y + dy); g.rotate(r); g.fillRect(-w / 2, -1.5, w, 3); g.strokeRect(-w / 2, -1.5, w, 3); g.restore(); }
      g.globalAlpha = 1; }
  } else if (t.t === 'press') {
    g.fillStyle = '#1c1c22'; g.fillRect(sx - 24, t.y - 8, 48, 16);
    g.fillStyle = '#e0b020'; for (let k = -24; k < 24; k += 8) { g.beginPath(); g.moveTo(sx + k, t.y + 8); g.lineTo(sx + k + 4, t.y + 8); g.lineTo(sx + k + 8, t.y - 8); g.lineTo(sx + k + 4, t.y - 8); g.closePath(); g.fill(); }
    if (c >= t.per - 60 && c < t.per - 14 && ((tick >> 2) & 1)) { g.fillStyle = 'rgba(255,40,40,.35)'; g.fillRect(sx - 22, t.y - 8, 44, 16); }
  } else if (t.t === 'cable') {
    const live = c >= t.per - 70;
    if (live) { g.globalAlpha = 0.25 + 0.15 * ((tick >> 1) & 1); g.fillStyle = '#7fe8ff'; g.beginPath(); g.ellipse(sx, t.y, 17, 6, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  }
}
function drawTrap(t) {
  const sx = Math.round(t.x - cam), c = trapC(t);
  if (t.t === 'bolt') {
    if (t.tx === undefined) return;
    const bx = Math.round(t.tx - cam);
    if (c >= t.per - 46) { const k = (c - (t.per - 46)) / 46;
      g.strokeStyle = ((tick >> 2) & 1) ? '#ff4040' : '#ffd0d0'; g.lineWidth = 1; g.beginPath(); g.ellipse(bx, t.ty, 8 + (1 - k) * 12, 3 + (1 - k) * 5, 0, 0, 7); g.stroke();
      g.globalAlpha = 0.25 + k * 0.4; g.fillStyle = '#ff4040'; g.beginPath(); g.ellipse(bx, t.ty, 17 * k, 6 * k, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    if (t.hitT > 0) {
      g.fillStyle = 'rgba(200,230,255,' + (t.hitT / 28) + ')'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#eef6ff'; g.lineWidth = 2.2; g.beginPath(); let x = bx; g.moveTo(x, 0);
      for (let y = 14; y < t.ty; y += 14) { x = bx + (Math.random() - 0.5) * 22; g.lineTo(x, y); } g.lineTo(bx, t.ty); g.stroke();
      g.strokeStyle = '#7fe8ff'; g.lineWidth = 5; g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1;
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(bx, t.ty, 20, 7, 0, 0, 7); g.fill();
    }
    return;
  }
  if (t.t === 'water') {
    if (sx < -200 || sx > W + 200) return;
    const d = t.dir, on = c >= t.per - 44 && c < t.per - 6, warn = c >= t.per - 90 && c < t.per - 44, y = t.y;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, y + 1, 22, 4, 0, 0, 7); g.fill();
    g.save(); g.translate(sx, y); g.scale(d, 1);
    g.fillStyle = '#1b2f6a'; g.strokeStyle = OL; g.lineWidth = 1; g.fillRect(-20, -22, 40, 17); g.strokeRect(-20, -22, 40, 17);
    g.fillStyle = '#eef2fa'; g.fillRect(-20, -14, 40, 3); g.fillStyle = '#d03030'; g.fillRect(-20, -11, 40, 1.5);
    g.fillStyle = '#243c80'; g.fillRect(-20, -30, 17, 9); g.strokeRect(-20, -30, 17, 9); g.fillStyle = '#9fd0ff'; g.fillRect(-18, -28, 12, 5);
    g.fillStyle = '#c8cfdc'; g.fillRect(2, -29, 12, 7); g.strokeRect(2, -29, 12, 7);
    g.fillStyle = '#7a8498'; g.fillRect(12, -27 + (on ? -1 : 1), 14, 3);
    g.fillStyle = '#111'; for (const wx of [-14, 12]) { g.beginPath(); g.arc(wx, -4, 5, 0, 7); g.fill(); g.fillStyle = '#888'; g.beginPath(); g.arc(wx, -4, 2, 0, 7); g.fill(); g.fillStyle = '#111'; }
    if (warn || on) { g.fillStyle = ((tick >> 2) & 1) ? '#4aa8ff' : '#ff4040'; g.fillRect(-14, -33, 5, 3); }
    if (on) {
      g.fillStyle = 'rgba(190,225,255,.75)'; g.fillRect(26, -29, t.len, 6);
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (let k = 0; k < 14; k++) { const px = 26 + ((tick * 7 + k * 31) % t.len); g.fillRect(px, -30 + ((k * 7 + tick) % 8), 4, 2); }
    }
    g.restore();
    return;
  }
  if (t.t === 'fire') {
    if (sx < -40 || sx > W + 40) return;
    const act = c >= t.per - 60, fh = act ? 22 : 8;
    g.fillStyle = '#4a4e58'; g.strokeStyle = OL; g.lineWidth = 1; g.fillRect(sx - 8, t.y - 16, 16, 16); g.strokeRect(sx - 8, t.y - 16, 16, 16);
    g.fillStyle = '#2e3138'; g.fillRect(sx - 9, t.y - 18, 18, 3);
    for (let k = 0; k < 5; k++) {
      const fl = ((tick * 0.6 + k * 7) % 14), hh = fh * (1 - fl / 18);
      g.globalAlpha = 0.9 - fl / 20; g.fillStyle = k % 2 ? '#ffb030' : '#ff6a20';
      g.beginPath(); g.moveTo(sx - 7 + k * 3.5, t.y - 18); g.quadraticCurveTo(sx - 9 + k * 3.5 + Math.sin(tick * 0.3 + k) * 2, t.y - 18 - hh * 0.6, sx - 5 + k * 3.5, t.y - 18 - hh); g.quadraticCurveTo(sx - 3 + k * 3.5, t.y - 18 - hh * 0.5, sx - 1 + k * 3.5, t.y - 18); g.fill();
    }
    g.globalAlpha = 1;
    return;
  }
  if (t.t === 'belt' || sx < -40 || sx > W + 40) return;
  if (t.t === 'cable') {
    const live = c >= t.per - 70, warn = c >= t.per - 100 && !live;
    g.strokeStyle = '#111'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(sx + 12, t.y - 120); g.quadraticCurveTo(sx + 18, t.y - 50, sx + 3, t.y - 6); g.lineTo(sx, t.y - 2); g.stroke();
    g.strokeStyle = '#444'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx + 12, t.y - 120); g.quadraticCurveTo(sx + 18, t.y - 50, sx + 3, t.y - 6); g.stroke();
    g.fillStyle = '#c0a020'; g.fillRect(sx - 2, t.y - 4, 5, 3);
    if (live) {
      g.strokeStyle = '#bff6ff'; g.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) { g.beginPath(); let x = sx, y = t.y - 3; g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (Math.random() - 0.5) * 14; y -= 2 + Math.random() * 9; g.lineTo(x, y); } g.stroke(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(sx, t.y - 3, 2.5, 0, 7); g.fill();
    } else if (warn && ((tick >> 2) & 1)) { g.fillStyle = '#ffd34d'; g.fillRect(sx + (Math.random() * 6 - 3), t.y - 5 - Math.random() * 4, 1.5, 1.5); }
  } else if (t.t === 'steam') {
    if (c >= t.per - 70 && c < t.per - 34) { g.fillStyle = 'rgba(235,235,245,.45)'; for (let k = 0; k < 3; k++) g.fillRect(sx - 4 + k * 4 + (tick % 5), t.y - 6 - ((tick * 0.5 + k * 5) % 14), 3, 3); }
    else if (c >= t.per - 34) {
      for (let k = 0; k < 9; k++) { const ph = ((tick * 1.4 + k * 8) % 52), r = 5 + ph * 0.13;
        g.globalAlpha = Math.max(0, 0.65 - ph / 90); g.fillStyle = k % 2 ? '#f4f4fa' : '#d6d6e2'; g.beginPath(); g.arc(sx + Math.sin(ph * 0.2 + k) * 4, t.y - 4 - ph, r, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    }
  } else if (t.t === 'crate') {
    if (c >= t.per - 15) {
      const zz = (t.per - c) * 8;
      g.fillStyle = '#9a6a38'; g.strokeStyle = OL; g.lineWidth = 1; g.fillRect(sx - 11, t.y - zz - 20, 22, 20); g.strokeRect(sx - 11, t.y - zz - 20, 22, 20);
      g.strokeStyle = '#5a3a1c'; g.beginPath(); g.moveTo(sx - 11, t.y - zz - 20); g.lineTo(sx + 11, t.y - zz); g.moveTo(sx + 11, t.y - zz - 20); g.lineTo(sx - 11, t.y - zz); g.stroke();
      g.strokeStyle = '#333'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx, t.y - zz - 20 - 40); g.lineTo(sx, t.y - zz - 20); g.stroke();
    }
  } else if (t.t === 'press') {
    let hy = -74;
    if (c >= t.per - 60 && c < t.per - 14) hy = -54; else if (c >= t.per - 14 && c < t.per - 2) hy = c < t.per - 10 ? -30 : -4; else if (c >= t.per - 2) hy = -30;
    g.fillStyle = '#5a5a66'; g.fillRect(sx - 4, t.y - 140, 8, 140 + hy);
    g.fillStyle = '#3a3a44'; g.strokeStyle = OL; g.lineWidth = 1; g.fillRect(sx - 22, t.y + hy - 14, 44, 14); g.strokeRect(sx - 22, t.y + hy - 14, 44, 14);
    g.fillStyle = '#e0b020'; for (let k = -20; k < 20; k += 8) g.fillRect(sx + k, t.y + hy - 4, 4, 3);
  }
}
function endScores() {
  if (lastRank >= 0) txt(lastRank === 0 ? 'NOUVEAU RECORD !' : 'Classement : n°' + (lastRank + 1), W / 2, 130, 10, '#ffd34d', 'center');
  PS.forEach((p, i) => p.absent || txt(String(p.name || 'J' + (i + 1)) + (online && i === localSlot ? ' (vous)' : '') + '  ' + String(p.score).padStart(6, '0'), W / 2, 148 + i * 14, 12, PCOL[i & 3], 'center'));
}

/* effets de handicap (affichage seulement, la simulation n'est pas touchée) : daltonisme = filtre de couleurs, cécité = champ de vision réduit */
let fxLast = '';
function localHeroes() {
  if (state === 'select') return [HERO_KEYS[(SEL[online ? localSlot : 0] || SEL[0]).c]];
  if (state === 'play' || state === 'over' || state === 'win') return online ? (PS[localSlot] ? [PS[localSlot].hero] : []) : PS.map(q => q.hero);
  return [];
}
function applyFx() {
  const want = localHeroes().indexOf('dalto') >= 0 ? 'dalto' : '';
  if (want === fxLast) return; fxLast = want;
  try {
    if (want && !document.getElementById('nf-fx')) {
      const d = document.createElement('div'); d.id = 'nf-fx'; d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><filter id="nf-dalto" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.30 0.70 0 0 0  0.26 0.58 0.16 0 0  0 0.03 0.80 0 0  0 0 0 1 0"/></filter></svg>';
      document.body.appendChild(d);
    }
    cv.style.filter = want ? 'url(#nf-dalto) saturate(0.75)' : '';
  } catch (e) { /* ignoré */ }
}
function blindFx() {
  const q = online ? PS[localSlot] : PS.find(z => z.hero === 'aveugle');
  if (!q || q.hero !== 'aveugle' || q.out) return;
  const sx = q.x - cam, sy = q.y - q.z - 20, r = q.ping > 50 ? 700 : q.ping > 0 ? 30 + 670 * (q.ping / 50) * (q.ping / 50) : 30;
  if (r > 520) return;
  const gr = g.createRadialGradient(sx, sy, r * 0.35, sx, sy, r);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(2,2,8,0.55)'); gr.addColorStop(1, 'rgba(2,2,8,0.97)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function render() {
  applyFx();
  g.setTransform(RS, 0, 0, RS, 0, 0);
  g.save();
  if (shake > 0) g.translate(Math.round((Math.random() * 2 - 1) * shake * 0.5), Math.round((Math.random() * 2 - 1) * shake * 0.5));
  const menu = state === 'title' || state === 'select' || state === 'online' || state === 'options' || state === 'name' || state === 'scores';
  drawBG(menu ? tick * 0.5 : cam);
  if (!menu) {
    const list = [];
    for (const t of TR) drawTrapGround(t);
    drawHzGround();
    for (const t of TR) if (t.t !== 'belt') list.push([t.t === 'bolt' ? 999 : t.y - 1, () => drawTrap(t)]);
    for (const b of B) list.push([b.y, () => drawBarrel(b)]);
    for (const it of IT) list.push([it.y - 1, () => drawItem(it)]);
    for (const e of E) list.push([e.y, () => drawChar(e)]);
    for (const p of PS) if (!p.out) { list.push([p.y, () => drawChar(p)]); if (p.nochair) list.push([p.chy, () => drawChair(p)]); }
    for (const a of AL) list.push([a.y, () => drawChar(a)]);
    for (const b of PJ) list.push([b.y, () => drawProj(b)]);
    list.sort((a, b) => a[0] - b[0]);
    for (const l of list) l[1]();
    for (const f of FX) drawFX(f);
    drawHzTop();
  }
  g.restore();
  if (state === 'title') drawTitle();
  else if (state === 'select') drawSelect();
  else if (state === 'online') drawOnline();
  else if (state === 'name') drawNameEntry();
  else if (state === 'options') drawOptions();
  else if (state === 'scores') drawScores();
  else {
    blindFx();
    hud();
    if (specOn) drawSpec();
    if (menuOpen) drawMenu();
    if (paused) {
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, H);
      txt('PAUSE', W / 2, H / 2, 24, '#fff', 'center');
    }
    if (state === 'over') {
      g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(0, 0, W, H);
      txt('GAME OVER', W / 2, 96, 30, '#e04040', 'center');
      txt('Niveau ' + (levelIdx + 1) + ' · ' + LV.name, W / 2, 114, 10, '#cbd', 'center');
      endScores();
      if (endT > 60) txt(online ? 'ENTRÉE pour rejouer (choix des héros)' : 'ENTRÉE pour revenir au titre', W / 2, 200, 11, '#cbd', 'center');
    }
    if (state === 'win') {
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H);
      txt('VICTOIRE !', W / 2, 96, 28, '#ffd34d', 'center');
      txt('Les 4 niveaux sont terminés', W / 2, 114, 10, '#cbd', 'center');
      endScores();
      if (endT > 60) txt(online ? 'ENTRÉE pour rejouer (choix des héros)' : 'ENTRÉE pour revenir au titre', W / 2, 200, 11, '#cbd', 'center');
    }
  }
}

