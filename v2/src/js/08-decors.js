/* ====================================================================
   RENDU
   ==================================================================== */
function hash(n) {
  n = Math.imul(n ^ 61, 0x45d9f3b); n ^= n >>> 16; n = Math.imul(n, 0x45d9f3b); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
const skyG = g.createLinearGradient(0, 0, 0, 150);
skyG.addColorStop(0, '#0e0b24'); skyG.addColorStop(1, '#43275a');

function drawBGStreet(c) {
  g.fillStyle = skyG; g.fillRect(0, 0, W, 150);
  g.fillStyle = '#e8e0c0';
  for (let i = 0; i < 40; i++) { const tw = (hash(i + 40) > 0.8) && ((tick >> 4) + i) % 5 === 0; if (!tw) g.fillRect(Math.floor(hash(i + 900) * W), Math.floor(hash(i + 1300) * 100), 1, 1); }
  // lune avec halo et fins nuages
  g.globalAlpha = 0.1; g.fillStyle = '#f2e9c8'; g.beginPath(); g.arc(390, 42, 34, 0, 7); g.fill(); g.globalAlpha = 0.08; g.beginPath(); g.arc(390, 42, 52, 0, 7); g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#f2e9c8'; g.beginPath(); g.arc(390, 42, 17, 0, 7); g.fill();
  g.fillStyle = '#d8cfa8'; g.fillRect(384, 38, 5, 4); g.fillRect(395, 48, 4, 3);
  for (let k = 0; k < 4; k++) { const x = ((hash(k + 61) * (W + 220) - tick * 0.1 - c * 0.03) % (W + 220) + W + 220) % (W + 220) - 110; g.globalAlpha = 0.14; g.fillStyle = '#9a90c0'; g.beginPath(); g.ellipse(x, 30 + hash(k) * 40, 80, 5, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  // skyline lointaine avec antennes
  const cf = c * 0.15;
  for (let i = Math.floor(cf / 40) - 1; i <= Math.floor((cf + W) / 40) + 1; i++) {
    const h = 50 + hash(i) * 60, bx = Math.round(i * 40 - cf);
    g.fillStyle = '#1d1a3a'; g.fillRect(bx, 150 - h, 38, h);
    if (hash(i + 70) > 0.7) { g.fillRect(bx + 18, 150 - h - 12, 1, 12); if ((tick >> 5) % 2 === 0) { g.fillStyle = '#ff3a3a'; g.fillRect(bx + 17, 150 - h - 13, 3, 2); } }
    g.fillStyle = '#2c2756'; for (let y = 150 - h + 6; y < 140; y += 10) for (let k = 0; k < 3; k++) if (hash(i * 31 + y + k) > 0.8) g.fillRect(bx + 6 + k * 11, y, 4, 3);
  }
  // immeubles : trois teintes, toits équipés, fenêtres qui s'allument, rez-de-chaussée commerçant
  const cm = c * 0.4, tints = ['#2a2548', '#33264a', '#232a4a'], awn = ['#c04a5a', '#3a9a8a', '#d4a030', '#6a5ac0'], neon = ['#ff4aa0', '#4ad8ff', '#a0ff4a', '#ffd34d'];
  for (let i = Math.floor(cm / 64) - 1; i <= Math.floor((cm + W) / 64) + 1; i++) {
    const bh = 78 + hash(i + 500) * 56, bx = Math.round(i * 64 - cm), top = 150 - bh;
    g.fillStyle = tints[Math.floor(hash(i + 520) * 3)]; g.fillRect(bx, top, 62, bh);
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(bx, top, 2, bh); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(bx + 60, top, 2, bh);
    g.fillStyle = '#1a1634'; g.fillRect(bx - 1, top - 3, 64, 3);
    const rt = hash(i + 530);
    if (rt < 0.3) { g.fillStyle = '#1a1634'; g.fillRect(bx + 10, top - 14, 14, 11); g.fillRect(bx + 8, top - 16, 18, 2); g.fillRect(bx + 14, top - 18, 2, 2); g.fillRect(bx + 20, top - 18, 2, 2); }
    else if (rt < 0.55) { g.fillStyle = '#1a1634'; g.fillRect(bx + 36, top - 8, 10, 5); g.fillStyle = '#3a3660'; g.fillRect(bx + 38, top - 7, 6, 1); }
    else if (rt < 0.75) { g.fillStyle = '#1a1634'; g.fillRect(bx + 28, top - 16, 1, 13); g.fillRect(bx + 22, top - 12, 13, 1); g.fillRect(bx + 24, top - 8, 9, 1); }
    for (let j = 0, wy = top + 8; wy < 110; j++, wy += 12) {
      for (let k = 0; k < 4; k++) {
        const on = hash(i * 97 + j * 13 + k) > 0.62, fl = on && hash(i * 7 + j * 3 + k + 200) > 0.97 && ((tick >> 3) & 1);
        g.fillStyle = fl ? '#1d1936' : on ? (hash(i + j + k) > 0.8 ? '#8ad0f0' : '#f4d27a') : '#1d1936';
        g.fillRect(bx + 6 + k * 14, wy, 7, 7);
        if (on && hash(i * 5 + j + k * 11) > 0.85) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(bx + 6 + k * 14, wy, 7, 3); }
      }
    }
    // rez-de-chaussée : vitrine, store ou rideau métallique (avec le compas du Syndicat)
    const sh = hash(i + 560);
    g.fillStyle = '#171330'; g.fillRect(bx, 112, 62, 38);
    if (sh < 0.62) {
      const ac = awn[Math.floor(hash(i + 570) * 4)], nc = neon[Math.floor(hash(i + 580) * 4)];
      g.fillStyle = '#ffd98a'; g.globalAlpha = 0.55; g.fillRect(bx + 6, 124, 30, 24); g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(bx + 6, 124, 30, 3); g.fillRect(bx + 20, 124, 1, 24);
      g.fillStyle = '#3a2a1a'; g.fillRect(bx + 42, 124, 14, 26); g.fillStyle = '#ffd98a'; g.globalAlpha = 0.5; g.fillRect(bx + 44, 127, 10, 12); g.globalAlpha = 1;
      for (let k = 0; k < 8; k++) { g.fillStyle = (k & 1) ? '#f2eadc' : ac; g.fillRect(bx + 3 + k * 7, 114, 7, 8); }
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(bx + 3, 122, 56, 2);
      const on = hash((tick >> 4) + i * 3) > 0.06;
      g.globalAlpha = on ? 0.3 : 0.1; g.fillStyle = nc; g.fillRect(bx + 8, 104, 22, 7); g.globalAlpha = 1;
      g.fillStyle = on ? nc : '#444'; g.fillRect(bx + 10, 106, 18, 1); g.fillRect(bx + 10, 108, 11, 1);
    } else {
      g.fillStyle = '#4a4a58'; g.fillRect(bx + 4, 120, 54, 30);
      g.fillStyle = '#3a3a48'; for (let y = 122; y < 150; y += 3) g.fillRect(bx + 4, y, 54, 1);
      g.fillStyle = '#2a2a36'; g.fillRect(bx + 4, 116, 54, 4);
      if (hash(i + 590) > 0.55) {                                                      // compas peint à la bombe
        g.strokeStyle = '#d83a3a'; g.lineWidth = 1.5; const gx = bx + 31, gy = 126;
        g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx - 7, gy + 18); g.moveTo(gx, gy); g.lineTo(gx + 7, gy + 18); g.moveTo(gx - 4, gy + 11); g.lineTo(gx + 4, gy + 11); g.stroke();
        g.beginPath(); g.arc(gx, gy, 2, 0, 7); g.stroke();
      }
    }
  }
  // câbles et poteaux
  const cp = c * 0.7;
  for (let k = Math.floor(cp / 260) - 1; k <= Math.floor((cp + W) / 260) + 1; k++) {
    const px = Math.round(k * 260 + 90 - cp);
    g.fillStyle = '#14122a'; g.fillRect(px, 62, 3, 90); g.fillRect(px - 9, 68, 21, 2); g.fillRect(px - 7, 76, 17, 2);
    g.strokeStyle = 'rgba(20,18,42,.85)'; g.lineWidth = 1; g.beginPath();
    g.moveTo(px - 8, 69); g.quadraticCurveTo(px + 130, 88, px + 252, 69); g.moveTo(px + 10, 69); g.quadraticCurveTo(px + 140, 84, px + 270, 69); g.stroke();
  }
  // trottoir, bordure et route mouillée
  g.fillStyle = '#4a4658'; g.fillRect(0, 150, W, 28);
  g.fillStyle = '#3c394a';
  for (let k = Math.floor(c / 48) - 1; k <= Math.floor((c + W) / 48) + 1; k++) g.fillRect(Math.round(k * 48 - c), 150, 1, 28);
  g.fillStyle = '#56526a'; g.fillRect(0, 150, W, 2);
  g.fillStyle = '#6a6678'; g.fillRect(0, 177, W, 2);
  g.fillStyle = '#2a2a36'; g.fillRect(0, 179, W, H - 179);
  g.fillStyle = '#323240';
  for (let k = Math.floor(c / 130) - 1; k <= Math.floor((c + W) / 130) + 1; k++) { const yy = 190 + hash(k + 11) * 60; g.fillRect(Math.round(k * 130 - c) + 20, yy, 26 + hash(k + 3) * 20, 1); g.fillRect(Math.round(k * 130 - c) + 40, yy + 1, 1, 6); }
  g.fillStyle = '#7d7a58';
  for (let k = Math.floor(c / 48) - 1; k <= Math.floor((c + W) / 48) + 1; k++) g.fillRect(Math.round(k * 48 - c), 222, 24, 2);
  // mobilier urbain sur le trottoir : poubelles, bouche d'incendie, bancs
  for (let k = Math.floor(c / 150) - 1; k <= Math.floor((c + W) / 150) + 1; k++) {
    const ox = Math.round(k * 150 + 40 - c), r = hash(k + 640);
    if (r < 0.3) { g.fillStyle = '#3a4a4a'; g.fillRect(ox, 160, 9, 11); g.fillStyle = '#4a5c5c'; g.fillRect(ox - 1, 158, 11, 3); g.fillStyle = '#2a3636'; g.fillRect(ox + 2, 163, 1, 6); g.fillRect(ox + 6, 163, 1, 6); }
    else if (r < 0.55) { g.fillStyle = '#b03a3a'; g.fillRect(ox + 1, 162, 6, 9); g.fillRect(ox, 160, 8, 3); g.fillRect(ox - 2, 165, 12, 2); g.fillStyle = '#d86a6a'; g.fillRect(ox + 1, 162, 2, 9); }
    else if (r < 0.7) { g.fillStyle = '#5a4a3a'; g.fillRect(ox, 162, 24, 2); g.fillRect(ox, 166, 24, 2); g.fillStyle = '#2a2a2a'; g.fillRect(ox + 2, 168, 2, 4); g.fillRect(ox + 20, 168, 2, 4); }
  }
  // lampadaires, halo et cône de lumière au sol, flaques qui les reflètent
  for (let k = Math.floor(c / 320) - 1; k <= Math.floor((c + W) / 320) + 1; k++) {
    const lx = Math.round(k * 320 + 200 - c), fl = (hash(k + 90) > 0.8 && ((tick >> 2) % 23 === 0)) ? 0.4 : 1;
    g.fillStyle = '#555'; g.fillRect(lx, 100, 3, 52); g.fillRect(lx - 4, 99, 8, 2);
    g.fillStyle = fl < 1 ? '#8a7a5a' : '#ffd27a'; g.fillRect(lx - 4, 98, 11, 4);
    g.globalAlpha = 0.13 * fl; g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(lx + 1, 106, 36, 0, 7); g.fill();
    g.globalAlpha = 0.05 * fl; g.beginPath(); g.moveTo(lx - 3, 102); g.lineTo(lx + 5, 102); g.lineTo(lx + 46, 190); g.lineTo(lx - 44, 190); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(lx + 1, 200, 52, 11, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    g.globalAlpha = 0.28; g.fillStyle = '#6a8ac0'; g.beginPath(); g.ellipse(lx + 60, 214, 26, 4, 0, 0, 7); g.fill(); g.globalAlpha = 0.5; g.fillStyle = '#ffd27a'; g.fillRect(lx + 52, 213, 16, 1); g.globalAlpha = 1;
  }
  // bouche d'égout qui fume
  for (let k = Math.floor(c / 410) - 1; k <= Math.floor((c + W) / 410) + 1; k++) {
    const mx = Math.round(k * 410 + 120 - c);
    g.fillStyle = '#1c1c26'; g.beginPath(); g.ellipse(mx, 236, 9, 3, 0, 0, 7); g.fill(); g.fillStyle = '#34344a'; g.fillRect(mx - 6, 235, 12, 1);
    for (let q = 0; q < 4; q++) { const ph = ((tick * 0.5 + q * 17) % 68) / 68; g.globalAlpha = 0.22 * (1 - ph); g.fillStyle = '#b8bcd0'; g.beginPath(); g.ellipse(mx + Math.sin(tick * 0.03 + q) * 6 * ph, 234 - ph * 44, 5 + ph * 9, 3 + ph * 5, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  // brume basse et papiers portés par le vent
  for (let k = 0; k < 3; k++) { const x = ((hash(k + 20) * (W + 260) - tick * 0.35 - c * 0.2) % (W + 260) + W + 260) % (W + 260) - 130; g.globalAlpha = 0.05; g.fillStyle = '#b8c0e0'; g.beginPath(); g.ellipse(x, 182 + hash(k) * 60, 110, 9, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  g.fillStyle = '#d8d4c0';
  for (let k = 0; k < 4; k++) { const x = ((hash(k + 300) * (W + 80) - tick * (1.2 + hash(k + 1)) - c * 0.5) % (W + 80) + W + 80) % (W + 80) - 40, y = 190 + hash(k + 310) * 55 + Math.sin(tick * 0.12 + k * 2) * 3; g.fillRect(x, y, 3, 2); }
}

function txt(s, x, y, size, col, al) {
  g.font = 'bold ' + size + 'px monospace'; g.textAlign = al || 'left';
  g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1);
  g.fillStyle = col; g.fillText(s, x, y);
}

/* ---------- décors des niveaux 2 à 4 ---------- */
let portG = null, roofG = null;
function drawBGPort(c) {
  if (!portG) { portG = g.createLinearGradient(0, 0, 0, 150); portG.addColorStop(0, '#2a1a52'); portG.addColorStop(0.55, '#b0485a'); portG.addColorStop(1, '#f09a4a'); }
  g.fillStyle = portG; g.fillRect(0, 0, W, 150);
  g.fillStyle = '#f2e9c8'; for (let i = 0; i < 16; i++) g.fillRect(Math.floor(hash(i + 700) * W), Math.floor(hash(i + 710) * 50), 1, 1);
  // soleil et reflet
  g.globalAlpha = 0.25; g.fillStyle = '#ffd08a'; g.beginPath(); g.arc(310, 122, 46, 0, 7); g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(310, 122, 24, 0, 7); g.fill();
  // mer
  g.fillStyle = '#3a3a72'; g.fillRect(0, 118, W, 32);
  g.fillStyle = '#2c2c5e'; g.fillRect(0, 138, W, 12);
  for (let i = 0; i < 9; i++) { const w = 30 - i * 2.6; g.fillStyle = 'rgba(255,200,120,' + (0.55 - i * 0.05) + ')'; g.fillRect(310 - w / 2 + Math.sin(tick * 0.04 + i) * 3, 120 + i * 3.4, w, 1.6); }
  g.fillStyle = 'rgba(255,255,255,.12)';
  for (let i = 0; i < 14; i++) g.fillRect(((hash(i + 30) * W + tick * 0.15 * (1 + hash(i) * 2) - c * 0.05) % W + W) % W, 124 + hash(i + 40) * 22, 6, 1);
  // grues lointaines
  const cf = c * 0.12;
  g.fillStyle = '#251a42';
  for (let i = Math.floor(cf / 240) - 1; i <= Math.floor((cf + W) / 240) + 1; i++) {
    const x = Math.round(i * 240 + 60 - cf), h = 60 + hash(i + 11) * 30;
    g.fillRect(x, 150 - h, 4, h); g.fillRect(x + 38, 150 - h, 4, h);
    g.fillRect(x - 30, 150 - h - 6, 110, 5); g.fillRect(x + 20, 150 - h - 20, 2, 16);
    g.fillRect(x + 56, 150 - h - 1, 1, 20); g.fillRect(x + 52, 150 - h + 19, 9, 6);
  }
  // piles de conteneurs
  const cm = c * 0.4, cols = ['#a03a2a', '#2a5a9a', '#3a8a5a', '#c89a2a', '#7a4a8a'];
  for (let i = Math.floor(cm / 70) - 1; i <= Math.floor((cm + W) / 70) + 1; i++) {
    const n = 1 + Math.floor(hash(i + 90) * 3), bx = Math.round(i * 70 - cm);
    if (hash(i + 120) < 0.18) continue;
    for (let k = 0; k < n; k++) {
      const col = cols[Math.floor(hash(i * 7 + k) * cols.length)], by = 150 - 24 * (k + 1);
      g.fillStyle = col; g.fillRect(bx, by, 62, 23);
      g.fillStyle = 'rgba(0,0,0,.28)'; for (let r = 4; r < 62; r += 6) g.fillRect(bx + r, by + 1, 1, 21);
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(bx, by, 62, 2);
    }
  }
  // quai : planches
  g.fillStyle = '#6a4a30'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#7e5a3a'; g.fillRect(0, 150, W, 4);
  g.fillStyle = '#4e3622';
  for (let y = 158; y < H; y += 14) g.fillRect(0, y, W, 1);
  for (let y = 158, r = 0; y < H; y += 14, r++) for (let x = -((c + r * 37) % 60); x < W; x += 60) g.fillRect(Math.round(x), y, 1, 14);
  // bollards et lampes
  for (let k = Math.floor(c / 300) - 1; k <= Math.floor((c + W) / 300) + 1; k++) {
    const lx = Math.round(k * 300 + 150 - c);
    g.fillStyle = '#2a2a34'; g.fillRect(lx, 104, 3, 48);
    g.fillStyle = '#ffd27a'; g.fillRect(lx - 4, 101, 11, 4);
    g.globalAlpha = 0.14; g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(lx + 1, 110, 34, 0, 7); g.fill(); g.globalAlpha = 1;
    const bx = Math.round(k * 300 + 40 - c);
    g.fillStyle = '#23232c'; g.fillRect(bx, 146, 8, 10); g.fillRect(bx - 1, 144, 10, 3);
  }
}
function drawBGFactory(c) {
  g.fillStyle = '#2b2226'; g.fillRect(0, 0, W, 150);
  const cb = c * 0.3;
  g.fillStyle = '#1e171a';
  for (let y = 0; y < 150; y += 8) { g.fillRect(0, y, W, 1); for (let x = -((cb + (y >> 3) * 13) % 24); x < W; x += 24) g.fillRect(Math.round(x), y, 1, 8); }
  // grandes verrières
  for (let i = Math.floor(cb / 130) - 1; i <= Math.floor((cb + W) / 130) + 1; i++) {
    const x = Math.round(i * 130 + 20 - cb), gl = g.createLinearGradient(0, 16, 0, 74);
    gl.addColorStop(0, '#ff9a3a'); gl.addColorStop(1, '#a8402a');
    g.fillStyle = gl; g.fillRect(x, 16, 78, 58);
    g.fillStyle = '#1a1316'; g.fillRect(x + 25, 16, 2, 58); g.fillRect(x + 51, 16, 2, 58); g.fillRect(x, 44, 78, 2);
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x - 2, 14, 82, 2); g.fillRect(x - 2, 74, 82, 2);
  }
  // engrenages
  const cg = c * 0.45;
  for (let i = Math.floor(cg / 260) - 1; i <= Math.floor((cg + W) / 260) + 1; i++) {
    const x = Math.round(i * 260 + 120 - cg), r = 26 + hash(i + 5) * 8, dir = i % 2 ? 1 : -1;
    g.save(); g.translate(x, 104); g.rotate(tick * 0.012 * dir);
    g.fillStyle = '#3d3540'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    for (let t = 0; t < 10; t++) { g.rotate(Math.PI / 5); g.fillRect(-4, -r - 5, 8, 8); }
    g.fillStyle = '#2b2226'; g.beginPath(); g.arc(0, 0, r * 0.45, 0, 7); g.fill();
    g.fillStyle = '#4e4650'; g.fillRect(-r * 0.9, -2, r * 1.8, 4);
    g.restore();
  }
  // tuyaux
  const cp = c * 0.55;
  for (const [py, col] of [[34, '#6a6a76'], [48, '#7a5a3a']]) {
    g.fillStyle = col; g.fillRect(0, py, W, 7); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, py + 1, W, 1); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, py + 5, W, 2);
    for (let i = Math.floor(cp / 90) - 1; i <= Math.floor((cp + W) / 90) + 1; i++) { const x = Math.round(i * 90 - cp); g.fillStyle = '#3a3a44'; g.fillRect(x, py - 2, 5, 11); }
  }
  for (let i = Math.floor(cp / 200) - 1; i <= Math.floor((cp + W) / 200) + 1; i++) {
    const x = Math.round(i * 200 + 70 - cp);
    g.fillStyle = '#5a5a66'; g.fillRect(x, 40, 8, 110); g.fillStyle = '#3a3a44'; g.fillRect(x - 2, 80, 12, 4); g.fillRect(x - 2, 120, 12, 4);
    g.fillStyle = '#c03030'; g.beginPath(); g.arc(x + 4, 100, 5, 0, 7); g.fill(); g.fillStyle = '#1a1316'; g.fillRect(x + 1, 99, 6, 2);
    for (let s = 0; s < 3; s++) { const ph = ((tick * 0.6 + s * 22 + i * 17) % 66); g.globalAlpha = Math.max(0, 0.32 - ph / 200); g.fillStyle = '#d8d8e0'; g.beginPath(); g.arc(x + 4 + Math.sin(ph * 0.12 + s) * 4, 36 - ph * 0.5, 4 + ph * 0.1, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  // lampes suspendues
  for (let i = Math.floor(c / 220) - 1; i <= Math.floor((c + W) / 220) + 1; i++) {
    const x = Math.round(i * 220 + 100 - c), fl = hash(i + (tick >> 3)) > 0.93 ? 0.5 : 1;
    g.fillStyle = '#111'; g.fillRect(x + 8, 0, 1, 20);
    g.fillStyle = '#3a3a40'; g.beginPath(); g.moveTo(x, 28); g.lineTo(x + 17, 28); g.lineTo(x + 13, 19); g.lineTo(x + 4, 19); g.closePath(); g.fill();
    g.globalAlpha = 0.1 * fl; g.fillStyle = '#ffe9a0'; g.beginPath(); g.moveTo(x + 3, 28); g.lineTo(x + 14, 28); g.lineTo(x + 46, 150); g.lineTo(x - 29, 150); g.closePath(); g.fill(); g.globalAlpha = 1;
    g.fillStyle = fl > 0.9 ? '#fff2b0' : '#8a7a50'; g.fillRect(x + 4, 27, 9, 2);
  }
  // sol : bande de danger, tapis roulant, caillebotis
  g.fillStyle = '#34343c'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#e0b020'; g.fillRect(0, 150, W, 7); g.fillStyle = '#1a1a1a';
  for (let x = -((c * 1) % 20) - 20; x < W; x += 20) { g.beginPath(); g.moveTo(x, 157); g.lineTo(x + 10, 157); g.lineTo(x + 17, 150); g.lineTo(x + 7, 150); g.closePath(); g.fill(); }
  g.fillStyle = '#1e1e24'; g.fillRect(0, 160, W, 14);
  g.fillStyle = '#4a4a54'; for (let x = -((c + tick * 0.7) % 14); x < W; x += 14) g.fillRect(Math.round(x), 161, 7, 12);
  g.fillStyle = '#2a2a30'; for (let y = 180; y < H; y += 16) g.fillRect(0, y, W, 1);
  for (let x = -((c * 1) % 24); x < W; x += 24) g.fillRect(Math.round(x), 180, 1, H - 180);
  for (let k = 0; k < 3; k++) {
    const sx = Math.round(((k * 190 + 90) - c * 0.9) % (W + 60)); const on = hash((tick >> 2) + k * 9) > 0.5;
    if (on && sx > 0) { g.fillStyle = '#ffd070'; for (let s = 0; s < 6; s++) g.fillRect(sx + Math.floor((hash(tick + s + k) - 0.5) * 14), 176 + Math.floor(hash(tick * 3 + s) * 8), 1, 1); }
  }
}
function drawBGRoof(c) {
  if (!roofG) { roofG = g.createLinearGradient(0, 0, 0, 150); roofG.addColorStop(0, '#04060e'); roofG.addColorStop(1, '#222a52'); }
  g.fillStyle = roofG; g.fillRect(0, 0, W, 150);
  // nuages
  g.fillStyle = 'rgba(10,12,28,.55)';
  for (let i = 0; i < 6; i++) { const x = ((hash(i + 3) * (W + 200) - tick * (0.1 + hash(i) * 0.15) - c * 0.04) % (W + 200) + W + 200) % (W + 200) - 100; g.fillRect(x, 18 + hash(i + 9) * 50, 120 + hash(i + 2) * 90, 14 + hash(i + 6) * 10); }
  g.fillStyle = '#6a78b8'; g.globalAlpha = 0.18; g.beginPath(); g.arc(380, 44, 20, 0, 7); g.fill(); g.globalAlpha = 1;
  // éclairs
  const ph = tick % 420;
  if (ph < 5 || (ph > 9 && ph < 12)) {
    g.fillStyle = 'rgba(190,210,255,.3)'; g.fillRect(0, 0, W, 150);
    if (ph < 5) { g.strokeStyle = '#e8f0ff'; g.lineWidth = 1.5; const bx = 120 + hash(Math.floor(tick / 420)) * 240; g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx + 14, 30); g.lineTo(bx + 2, 44); g.lineTo(bx + 20, 80); g.lineTo(bx + 8, 96); g.lineTo(bx + 18, 128); g.stroke(); }
  }
  // gratte-ciel lointains
  const cf = c * 0.1;
  for (let i = Math.floor(cf / 46) - 1; i <= Math.floor((cf + W) / 46) + 1; i++) {
    const h = 50 + hash(i + 21) * 70, bx = Math.round(i * 46 - cf);
    g.fillStyle = '#0e1228'; g.fillRect(bx, 150 - h, 44, h);
    g.fillStyle = '#2a3260'; for (let y = 150 - h + 6; y < 140; y += 9) for (let k = 0; k < 4; k++) if (hash(i * 31 + y + k) > 0.74) g.fillRect(bx + 4 + k * 10, y, 4, 4);
    if (hash(i + 77) > 0.6 && (tick >> 5) % 2 === 0) { g.fillStyle = '#ff3a3a'; g.fillRect(bx + 20, 148 - h, 2, 2); }
  }
  // immeubles proches avec néons
  const cm = c * 0.3, neon = ['#ff3a9a', '#3ad8ff', '#a0ff4a', '#ffd23a'];
  for (let i = Math.floor(cm / 78) - 1; i <= Math.floor((cm + W) / 78) + 1; i++) {
    const h = 70 + hash(i + 51) * 60, bx = Math.round(i * 78 - cm);
    g.fillStyle = '#171c36'; g.fillRect(bx, 150 - h, 74, h);
    g.fillStyle = '#e8d08a'; for (let y = 150 - h + 8; y < 142; y += 11) for (let k = 0; k < 5; k++) if (hash(i * 53 + y + k * 7) > 0.8) g.fillRect(bx + 5 + k * 13, y, 6, 6);
    if (hash(i + 8) > 0.45) {
      const nc = neon[Math.floor(hash(i + 14) * 4)];
      g.globalAlpha = 0.25 + 0.1 * Math.sin(tick * 0.1 + i); g.fillStyle = nc; g.fillRect(bx + 6, 150 - h + 12, 40, 16); g.globalAlpha = 1;
      g.fillStyle = nc; g.fillRect(bx + 9, 150 - h + 15, 34, 2); g.fillRect(bx + 9, 150 - h + 22, 22, 2);
    }
  }
  // sol du toit
  g.fillStyle = '#3a3d4a'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#5a5e72'; g.fillRect(0, 150, W, 5); g.fillStyle = '#23252f'; g.fillRect(0, 155, W, 3);
  g.fillStyle = '#2e303b'; for (let x = -(c % 60); x < W; x += 60) g.fillRect(Math.round(x), 158, 1, H - 158);
  for (let y = 176; y < H; y += 24) g.fillRect(0, y, W, 1);
  // flaques
  for (let i = Math.floor(c / 220) - 1; i <= Math.floor((c + W) / 220) + 1; i++) {
    const px = Math.round(i * 220 + 90 + hash(i) * 80 - c), py = 190 + hash(i + 4) * 50;
    g.fillStyle = 'rgba(80,110,190,.28)'; g.beginPath(); g.ellipse(px, py, 34, 6, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,100,180,.18)'; g.beginPath(); g.ellipse(px + 8, py, 14, 3, 0, 0, 7); g.fill();
  }
  // blocs de ventilation et antennes
  for (let i = Math.floor(c / 340) - 1; i <= Math.floor((c + W) / 340) + 1; i++) {
    const x = Math.round(i * 340 + 140 - c);
    g.fillStyle = '#2b2e3c'; g.fillRect(x, 126, 40, 26); g.fillStyle = '#3a3e50'; g.fillRect(x, 126, 40, 4);
    g.fillStyle = '#1a1c26'; g.beginPath(); g.arc(x + 20, 140, 8, 0, 7); g.fill();
    g.save(); g.translate(x + 20, 140); g.rotate(tick * 0.25); g.fillStyle = '#4a4e62'; g.fillRect(-7, -1, 14, 2); g.fillRect(-1, -7, 2, 14); g.restore();
    g.fillStyle = '#23252f'; g.fillRect(x + 60, 100, 2, 52); g.fillRect(x + 54, 108, 14, 1); g.fillRect(x + 56, 118, 10, 1);
    if ((tick >> 5) % 2 === 0) { g.fillStyle = '#ff3a3a'; g.fillRect(x + 60, 98, 2, 2); }
  }
  // pluie
  g.fillStyle = 'rgba(190,205,255,.34)';
  for (let i = 0; i < 70; i++) {
    const x = ((hash(i + 200) * (W + 40) - tick * 1.6) % (W + 40) + W + 40) % (W + 40), y = ((hash(i + 300) * H + tick * 9 + i * 13) % H);
    g.fillRect(Math.round(x), Math.round(y), 1, 6);
  }
}
let parisG = null;
function drawBGParis(c) {
  if (!parisG) { parisG = g.createLinearGradient(0, 0, 0, 150); parisG.addColorStop(0, '#7f93b4'); parisG.addColorStop(1, '#dccfc0'); }
  g.fillStyle = parisG; g.fillRect(0, 0, W, 150);
  // nuages
  g.fillStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i < 5; i++) { const x = ((hash(i + 3) * (W + 200) - tick * (0.06 + hash(i) * 0.08) - c * 0.03) % (W + 200) + W + 200) % (W + 200) - 100; g.fillRect(x, 14 + hash(i + 9) * 40, 90 + hash(i + 2) * 60, 8); g.fillRect(x + 14, 8 + hash(i + 9) * 40, 50, 6); }
  // tour Eiffel (très loin)
  const ex = Math.round(300 - c * 0.05);
  g.fillStyle = '#6a6478';
  g.beginPath(); g.moveTo(ex - 26, 150); g.lineTo(ex - 10, 96); g.lineTo(ex - 5, 70); g.lineTo(ex - 1, 30); g.lineTo(ex, 14); g.lineTo(ex + 1, 30); g.lineTo(ex + 5, 70); g.lineTo(ex + 10, 96); g.lineTo(ex + 26, 150);
  g.lineTo(ex + 18, 150); g.quadraticCurveTo(ex, 118, ex - 18, 150); g.closePath(); g.fill();
  g.fillRect(ex - 14, 96, 28, 3); g.fillRect(ex - 8, 68, 16, 2);
  // immeubles haussmanniens lointains
  const cf = c * 0.12;
  for (let i = Math.floor(cf / 60) - 1; i <= Math.floor((cf + W) / 60) + 1; i++) {
    const h = 64 + hash(i + 11) * 22, bx = Math.round(i * 60 - cf);
    g.fillStyle = '#b8aea0'; g.fillRect(bx, 150 - h, 58, h);
    g.fillStyle = '#5a6272'; g.beginPath(); g.moveTo(bx - 2, 150 - h); g.lineTo(bx + 6, 150 - h - 12); g.lineTo(bx + 52, 150 - h - 12); g.lineTo(bx + 60, 150 - h); g.fill();
    g.fillStyle = '#8a8274'; for (let y = 150 - h + 6; y < 140; y += 12) for (let k = 0; k < 4; k++) g.fillRect(bx + 5 + k * 13, y, 6, 8);
  }
  // façades proches
  const cm = c * 0.32;
  for (let i = Math.floor(cm / 110) - 1; i <= Math.floor((cm + W) / 110) + 1; i++) {
    const h = 98 + hash(i + 31) * 22, bx = Math.round(i * 110 - cm);
    g.fillStyle = '#d6cbb6'; g.fillRect(bx, 150 - h, 106, h);
    g.fillStyle = '#4e5668'; g.beginPath(); g.moveTo(bx - 3, 150 - h); g.lineTo(bx + 10, 150 - h - 16); g.lineTo(bx + 96, 150 - h - 16); g.lineTo(bx + 109, 150 - h); g.fill();
    g.fillStyle = '#3a4052'; g.fillRect(bx + 20, 150 - h - 26, 5, 12); g.fillRect(bx + 70, 150 - h - 24, 5, 10);
    g.fillStyle = '#b8ad96'; g.fillRect(bx, 150 - h + 28, 106, 2); g.fillRect(bx, 150 - h + 62, 106, 2);
    for (let y = 150 - h + 8; y < 130; y += 17) for (let k = 0; k < 5; k++) {
      const wx = bx + 8 + k * 20, lit = hash(i * 17 + y + k) > 0.8;
      g.fillStyle = lit ? '#f0d890' : '#5a6a86'; g.fillRect(wx, y, 9, 13);
      g.fillStyle = '#2a2e3a'; g.fillRect(wx - 1, y + 14, 11, 2);
    }
    // devanture
    g.fillStyle = ['#2f5a3a', '#7a2a2a', '#2a3f6a', '#5a4a2a'][Math.floor(hash(i + 5) * 4)]; g.fillRect(bx + 8, 124, 90, 26);
    g.fillStyle = '#e8d8a0'; g.fillRect(bx + 14, 130, 20, 20); g.fillRect(bx + 44, 130, 38, 20);
    g.fillStyle = '#c8362a'; g.fillRect(bx + 8, 120, 90, 5); g.fillStyle = '#f4f0e8'; for (let s = 0; s < 90; s += 10) g.fillRect(bx + 8 + s, 120, 5, 5);
  }
  // trottoir et chaussée
  g.fillStyle = '#8a8a92'; g.fillRect(0, 150, W, 14); g.fillStyle = '#a8a8b0'; g.fillRect(0, 150, W, 3); g.fillStyle = '#6a6a74'; g.fillRect(0, 163, W, 2);
  g.fillStyle = '#3d3f48'; g.fillRect(0, 165, W, H - 165);
  g.fillStyle = '#4a4c56'; for (let y = 190; y < H; y += 26) g.fillRect(0, y, W, 1);
  g.fillStyle = '#d8d8e0'; for (let x = -(c % 80); x < W; x += 80) g.fillRect(Math.round(x), 233, 36, 3);
  for (let i = Math.floor(c / 520) - 1; i <= Math.floor((c + W) / 520) + 1; i++) { const x = Math.round(i * 520 + 230 - c); g.fillStyle = 'rgba(235,235,240,.75)'; for (let k = 0; k < 7; k++) g.fillRect(x + k * 9, 172, 5, 72); }
  // drapeaux de manifestants
  for (let i = Math.floor(c / 260) - 1; i <= Math.floor((c + W) / 260) + 1; i++) {
    const x = Math.round(i * 260 + 100 + hash(i) * 60 - c), w = Math.sin(tick * 0.12 + i) * 3;
    g.fillStyle = '#3a3a44'; g.fillRect(x, 100, 2, 52);
    g.fillStyle = i % 3 === 0 ? '#d83030' : i % 3 === 1 ? '#e8e8f0' : '#3a6ad0'; g.beginPath(); g.moveTo(x + 2, 100); g.lineTo(x + 26, 102 + w); g.lineTo(x + 24, 114 + w); g.lineTo(x + 2, 112); g.closePath(); g.fill();
  }
  // fumée lacrymo qui dérive
  for (let i = 0; i < 7; i++) {
    const x = ((hash(i + 60) * (W + 160) - tick * (0.3 + hash(i) * 0.3) - c * 0.2) % (W + 160) + W + 160) % (W + 160) - 80, y = 150 + hash(i + 70) * 80;
    g.globalAlpha = 0.14; g.fillStyle = '#e4eebc'; g.beginPath(); g.ellipse(x, y, 60 + hash(i + 2) * 30, 14, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  }
}
function drawBG(c) { ({ street: drawBGStreet, port: drawBGPort, factory: drawBGFactory, roof: drawBGRoof, paris: drawBGParis, cata: drawBGCata, casino: drawBGCasino, train: drawBGTrain, aero: drawBGAero, chateau: drawBGChateau }[LV.bg] || drawBGStreet)(c); }
