/* ====================================================================
   DÉCORS DES NIVEAUX 6 À 10 : catacombes, casino, train, aérodrome, château
   (même principe que les autres : plusieurs plans qui défilent à des vitesses différentes ; le sol commence à y = 150)
   ==================================================================== */
const gradCache = {};
function vgrad(key, y1, stops) {
  if (!gradCache[key]) { const gr = g.createLinearGradient(0, 0, 0, y1); for (const [o, col] of stops) gr.addColorStop(o, col); gradCache[key] = gr; }
  return gradCache[key];
}
/* répète fn(i, x) pour chaque motif visible : step = espacement, par = vitesse de défilement du plan */
function eachVis(c, par, step, fn) {
  const cp = c * par;
  for (let i = Math.floor(cp / step) - 1; i <= Math.floor((cp + W) / step) + 1; i++) fn(i, Math.round(i * step - cp));
}

/* ---------- 6 · CATACOMBES ---------- */
function drawBGCata(c) {
  g.fillStyle = vgrad('cata', 150, [[0, '#0c090f'], [1, '#2a1c26']]); g.fillRect(0, 0, W, 150);
  // voûtes lointaines
  eachVis(c, 0.22, 130, (i, x) => {
    g.fillStyle = '#05040a'; g.beginPath(); g.moveTo(x + 14, 150); g.lineTo(x + 14, 78); g.arc(x + 65, 78, 51, Math.PI, 0); g.lineTo(x + 116, 150); g.closePath(); g.fill();
    g.fillStyle = '#241b24'; g.fillRect(x - 2, 0, 16, 150); g.fillStyle = '#31242f'; g.fillRect(x, 0, 3, 150);
    g.fillStyle = '#1c151d'; g.fillRect(x - 5, 0, 22, 6);
  });
  // mur d'ossements
  eachVis(c, 0.55, 15, (i, x) => {
    for (let r = 0; r < 3; r++) {
      const h = hash(i * 7 + r * 31), yy = 112 + r * 12, ox = (r & 1) * 7;
      if (h < 0.18) { g.fillStyle = '#b8b09a'; g.fillRect(x + ox, yy + 3, 12, 2); g.fillRect(x + ox - 1, yy + 2, 3, 4); g.fillRect(x + ox + 10, yy + 2, 3, 4); continue; }
      g.fillStyle = '#cfc6aa'; g.fillRect(x + ox + 1, yy, 8, 7); g.fillRect(x + ox + 2, yy + 7, 6, 3);
      g.fillStyle = '#1a1214'; g.fillRect(x + ox + 2, yy + 2, 2, 3); g.fillRect(x + ox + 6, yy + 2, 2, 3); g.fillRect(x + ox + 4, yy + 6, 1, 2);
    }
  });
  g.fillStyle = 'rgba(8,5,10,.55)'; g.fillRect(0, 106, W, 44);
  g.fillStyle = '#17111a'; g.fillRect(0, 104, W, 3);
  // torches
  eachVis(c, 0.8, 210, (i, x) => {
    const fl = 0.8 + 0.2 * Math.sin(tick * 0.31 + i * 5) + (hash((tick >> 2) + i) > 0.9 ? 0.15 : 0);
    g.fillStyle = '#2b2128'; g.fillRect(x + 8, 58, 5, 70); g.fillStyle = '#4a3a2a'; g.fillRect(x + 4, 54, 13, 5); g.fillRect(x + 6, 59, 9, 3);
    g.globalAlpha = 0.1 * fl; g.fillStyle = '#ffb45a'; g.beginPath(); g.arc(x + 10, 50, 46, 0, 7); g.fill(); g.globalAlpha = 0.08 * fl; g.beginPath(); g.arc(x + 10, 50, 80, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#ff6a20'; g.beginPath(); g.moveTo(x + 6, 54); g.quadraticCurveTo(x + 5 + Math.sin(tick * 0.4 + i) * 2, 42 - 4 * fl, x + 10.5, 34 - 5 * fl); g.quadraticCurveTo(x + 15, 44, x + 15, 54); g.fill();
    g.fillStyle = '#ffd070'; g.beginPath(); g.moveTo(x + 8, 54); g.quadraticCurveTo(x + 8, 46, x + 10.5, 41 - 3 * fl); g.quadraticCurveTo(x + 13, 47, x + 13, 54); g.fill();
  });
  // gouttes
  for (let k = 0; k < 4; k++) { const ph = (tick * 1.6 + k * 61) % 150, x = Math.round(hash(k + 40) * W); if (ph > 40) { g.fillStyle = 'rgba(140,190,220,.7)'; g.fillRect(x, ph, 1, 3); } }
  // sol : dalles, flaques, os
  g.fillStyle = '#34292f'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#3f3339'; g.fillRect(0, 150, W, 5); g.fillStyle = '#1a1318'; g.fillRect(0, 155, W, 1);
  g.fillStyle = '#251c22';
  for (let y = 168; y < H; y += 20) g.fillRect(0, y, W, 1);
  eachVis(c, 1, 44, (i, x) => { for (let r = 0; r < 5; r++) g.fillRect(x + ((r & 1) ? 22 : 0), 156 + r * 20, 1, 20); });
  eachVis(c, 1, 190, (i, x) => {
    const yy = 190 + hash(i + 3) * 56;
    g.fillStyle = 'rgba(70,110,140,.28)'; g.beginPath(); g.ellipse(x + 40, yy, 30 + hash(i) * 14, 5, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,200,230,.18)'; g.fillRect(x + 26, yy - 2, 12, 1);
  });
  eachVis(c, 1, 150, (i, x) => { if (hash(i + 90) > 0.45) { const yy = 176 + hash(i + 5) * 70; g.fillStyle = '#b8b09a'; g.fillRect(x + 20, yy, 9, 2); g.fillRect(x + 19, yy - 1, 2, 4); g.fillRect(x + 28, yy - 1, 2, 4); } });
  // brume
  for (let k = 0; k < 4; k++) { const x = ((hash(k + 20) * (W + 200) - tick * 0.25 - c * 0.3) % (W + 200) + W + 200) % (W + 200) - 100; g.globalAlpha = 0.07; g.fillStyle = '#b8c0d0'; g.beginPath(); g.ellipse(x, 168 + hash(k) * 70, 90, 12, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
}

/* ---------- 7 · CASINO ---------- */
function drawBGCasino(c) {
  g.fillStyle = vgrad('casino', 150, [[0, '#1a0a14'], [1, '#4a1426']]); g.fillRect(0, 0, W, 150);
  // tapisserie
  eachVis(c, 0.3, 24, (i, x) => { g.fillStyle = (i & 1) ? '#3a0f1c' : '#45142a'; g.fillRect(x, 0, 24, 150); g.fillStyle = 'rgba(212,160,23,.18)'; g.fillRect(x + 11, 0, 2, 150); g.beginPath(); for (let y = 12; y < 140; y += 26) { g.moveTo(x + 12, y - 4); g.lineTo(x + 17, y); g.lineTo(x + 12, y + 4); g.lineTo(x + 7, y); g.closePath(); } g.fill(); });
  g.fillStyle = '#1a0a10'; g.fillRect(0, 0, W, 8); g.fillStyle = '#d4a017'; g.fillRect(0, 8, W, 2);
  // enseigne néon
  eachVis(c, 0.45, 520, (i, x) => {
    const on = hash((tick >> 4) + i) > 0.07;
    g.font = 'bold 20px monospace'; g.textAlign = 'center';
    g.globalAlpha = on ? 0.28 : 0.1; g.fillStyle = '#ff4aa0'; g.fillText('LE ROYAL', x + 150, 47); g.fillText('LE ROYAL', x + 151, 49); g.globalAlpha = 1;
    g.fillStyle = on ? '#ffd0ea' : '#7a3a5a'; g.fillText('LE ROYAL', x + 150, 48);
    g.strokeStyle = on ? '#ff4aa0' : '#5a2a44'; g.lineWidth = 1.5; g.strokeRect(x + 82, 24, 136, 32);
  });
  // lustres
  eachVis(c, 0.5, 200, (i, x) => {
    g.strokeStyle = '#333'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 40, 10); g.lineTo(x + 40, 62); g.stroke();
    g.strokeStyle = '#d4a017'; g.lineWidth = 2; g.beginPath(); g.ellipse(x + 40, 64, 22, 6, 0, 0, 7); g.stroke();
    for (let k = -2; k <= 2; k++) { const fl = hash((tick >> 3) + i * 5 + k) > 0.95 ? 0.6 : 1; g.fillStyle = fl > 0.9 ? '#fff4c0' : '#9a8a50'; g.fillRect(x + 40 + k * 8 - 1, 58, 2, 5); g.globalAlpha = 0.1; g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(x + 40 + k * 8, 58, 9, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(220,240,255,.7)'; for (let k = -4; k <= 4; k++) g.fillRect(x + 40 + k * 4.6, 68, 1, 5 + (k & 1) * 4);
  });
  // colonnes de marbre
  eachVis(c, 0.7, 260, (i, x) => {
    g.fillStyle = '#d8d0d8'; g.fillRect(x + 20, 12, 18, 138); g.fillStyle = '#f0e8f0'; g.fillRect(x + 22, 12, 4, 138); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 33, 12, 5, 138);
    g.fillStyle = '#d4a017'; g.fillRect(x + 16, 10, 26, 5); g.fillRect(x + 16, 144, 26, 6);
  });
  // rangée de machines à sous
  eachVis(c, 0.9, 36, (i, x) => {
    if (hash(i * 3 + 11) < 0.35) return;
    const hue = hash(i + 50), body = hue < 0.5 ? '#3a1a5a' : '#1a3a5a', blink = hash((tick >> 3) + i) > 0.5;
    g.fillStyle = body; g.fillRect(x + 3, 98, 28, 52); g.fillStyle = '#d4a017'; g.fillRect(x + 3, 98, 28, 3); g.fillRect(x + 3, 98, 2, 52); g.fillRect(x + 29, 98, 2, 52);
    g.fillStyle = '#0a0a14'; g.fillRect(x + 7, 108, 20, 14); g.fillStyle = blink ? '#ff4a4a' : '#ffd34d'; g.fillRect(x + 9, 111, 4, 8); g.fillRect(x + 15, 111, 4, 8); g.fillRect(x + 21, 111, 4, 8);
    g.fillStyle = blink ? '#ffd34d' : '#ff4aa0'; g.fillRect(x + 8, 102, 2, 2); g.fillRect(x + 16, 102, 2, 2); g.fillRect(x + 24, 102, 2, 2);
    g.fillStyle = '#2a2a34'; g.fillRect(x + 8, 128, 18, 6); g.fillStyle = '#c0c0c8'; g.fillRect(x + 12, 130, 10, 2);
  });
  // sol : moquette rouge
  g.fillStyle = '#5a0e1e'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#d4a017'; g.fillRect(0, 150, W, 3); g.fillStyle = '#2a0610'; g.fillRect(0, 153, W, 5);
  g.fillStyle = '#7a1a2c';
  eachVis(c, 1, 48, (i, x) => { for (let r = 0; r < 4; r++) { const yy = 170 + r * 24, ox = (r & 1) * 24; g.beginPath(); g.moveTo(x + ox + 24, yy - 10); g.lineTo(x + ox + 36, yy); g.lineTo(x + ox + 24, yy + 10); g.lineTo(x + ox + 12, yy); g.closePath(); g.fill(); } });
  g.fillStyle = 'rgba(212,160,23,.55)'; eachVis(c, 1, 48, (i, x) => { for (let r = 0; r < 4; r++) g.fillRect(x + ((r & 1) * 24) + 22, 170 + r * 24 - 1, 4, 2); });
  g.fillStyle = '#d4a017'; g.fillRect(0, 262, W, 2);
}

/* ---------- 8 · TRAIN ---------- */
function drawBGTrain(c) {
  g.fillStyle = vgrad('train', 150, [[0, '#050818'], [1, '#2a3a66']]); g.fillRect(0, 0, W, 150);
  g.fillStyle = '#dfe6f4'; for (let i = 0; i < 40; i++) g.fillRect(Math.floor(hash(i + 700) * W), Math.floor(hash(i + 800) * 90), 1, 1);
  g.fillStyle = '#e8eefc'; g.beginPath(); g.arc(90, 38, 15, 0, 7); g.fill(); g.fillStyle = '#c0cbe4'; g.fillRect(84, 34, 5, 4); g.fillRect(94, 42, 4, 3);
  // collines lointaines (défilent avec le temps : le train roule)
  const d = tick * 0.6 + c * 0.1;
  g.fillStyle = '#10183a'; g.beginPath(); g.moveTo(0, 150);
  for (let x = 0; x <= W; x += 16) g.lineTo(x, 118 - 22 * Math.sin((x + d) * 0.011) - 12 * Math.sin((x + d) * 0.027 + 2)); g.lineTo(W, 150); g.closePath(); g.fill();
  const d2 = tick * 1.6 + c * 0.3;
  g.fillStyle = '#0a1028'; g.beginPath(); g.moveTo(0, 150);
  for (let x = 0; x <= W; x += 12) g.lineTo(x, 134 - 10 * Math.sin((x + d2) * 0.03 + 1) - 5 * Math.sin((x + d2) * 0.09)); g.lineTo(W, 150); g.closePath(); g.fill();
  // village : fenêtres allumées qui filent
  for (let i = -1; i < 6; i++) {
    const x = Math.round(((i * 130 - d2 * 0.9) % (W + 260) + W + 260) % (W + 260) - 100);
    g.fillStyle = '#070a1c'; g.fillRect(x, 126, 22, 24); g.beginPath(); g.moveTo(x - 2, 126); g.lineTo(x + 11, 116); g.lineTo(x + 24, 126); g.fill();
    if (hash(i + 31) > 0.3) { g.fillStyle = '#ffd27a'; g.fillRect(x + 5, 133, 4, 4); g.fillRect(x + 13, 133, 4, 4); }
  }
  // poteaux et lignes aériennes
  const dp = tick * 4.2 + c * 0.9;
  for (let i = -1; i < 6; i++) {
    const x = Math.round(((i * 150 - dp) % (W + 300) + W + 300) % (W + 300) - 120);
    g.fillStyle = '#05060f'; g.fillRect(x, 54, 3, 96); g.fillRect(x - 9, 60, 21, 3); g.fillRect(x - 7, 70, 17, 2);
    g.strokeStyle = 'rgba(5,6,15,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 8, 61); g.quadraticCurveTo(x + 75, 78, x + 142, 61); g.moveTo(x + 10, 61); g.quadraticCurveTo(x + 85, 74, x + 160, 61); g.stroke();
  }
  // traînées de vitesse
  for (let k = 0; k < 8; k++) { const x = ((hash(k + 90) * (W + 120) - tick * (7 + hash(k) * 5)) % (W + 120) + W + 120) % (W + 120) - 60; g.globalAlpha = 0.16; g.fillStyle = '#cfd8f0'; g.fillRect(x, 60 + hash(k + 5) * 85, 28 + hash(k + 8) * 30, 1); g.globalAlpha = 1; }
  // toit du train
  g.fillStyle = '#323842'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#5a626e'; g.fillRect(0, 150, W, 4); g.fillStyle = '#1a1e26'; g.fillRect(0, 154, W, 3);
  g.fillStyle = '#2a2e38'; for (let y = 172; y < H; y += 16) g.fillRect(0, y, W, 1);
  eachVis(c, 1, 300, (i, x) => {                                   // jonction entre deux wagons
    g.fillStyle = '#0a0c12'; g.fillRect(x + 140, 150, 10, H - 150); g.fillStyle = '#4a505c'; g.fillRect(x + 138, 150, 2, H - 150); g.fillRect(x + 150, 150, 2, H - 150);
    g.fillStyle = '#6a707c'; g.fillRect(x + 142, 160, 6, 3); g.fillRect(x + 142, 250, 6, 3);
  });
  eachVis(c, 1, 150, (i, x) => {                                   // lucarnes et ventilateurs
    const yy = 176 + hash(i + 4) * 68;
    g.fillStyle = '#1e222b'; g.fillRect(x + 40, yy, 34, 10); g.fillStyle = '#464c58'; g.fillRect(x + 40, yy, 34, 3);
    g.fillStyle = '#12151b'; for (let k = 0; k < 5; k++) g.fillRect(x + 44 + k * 6, yy + 4, 3, 4);
  });
  eachVis(c, 1, 300, (i, x) => { g.fillStyle = '#7a808c'; for (let k = 0; k < 7; k++) { g.fillRect(x + 4, 160 + k * 14, 2, 2); } });
}

/* ---------- 9 · AÉRODROME ---------- */
function drawBGAero(c) {
  g.fillStyle = vgrad('aero', 150, [[0, '#1a1f55'], [0.5, '#a0507a'], [1, '#ffb066']]); g.fillRect(0, 0, W, 150);
  g.fillStyle = '#ffe2a0'; g.beginPath(); g.arc(320, 142, 34, Math.PI, 0); g.fill(); g.globalAlpha = 0.18; g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(320, 142, 58, Math.PI, 0); g.fill(); g.globalAlpha = 1;
  // nuages
  for (let k = 0; k < 5; k++) { const x = ((hash(k + 2) * (W + 240) - tick * 0.12 - c * 0.05) % (W + 240) + W + 240) % (W + 240) - 120; g.globalAlpha = 0.35; g.fillStyle = '#ffc8c0'; g.beginPath(); g.ellipse(x, 30 + hash(k) * 50, 70, 6, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  // lisière d'arbres
  g.fillStyle = '#2a1a3a'; eachVis(c, 0.12, 26, (i, x) => { const h = 12 + hash(i + 60) * 22; g.beginPath(); g.ellipse(x + 13, 146 - h * 0.5, 15, h, 0, 0, 7); g.fill(); });
  // tour de contrôle
  eachVis(c, 0.3, 640, (i, x) => {
    g.fillStyle = '#4a3a5a'; g.fillRect(x + 300, 70, 10, 80); g.fillStyle = '#6a5a7a'; g.fillRect(x + 288, 52, 34, 20); g.fillStyle = '#3a2a4a'; g.fillRect(x + 284, 48, 42, 5);
    g.fillStyle = '#ffd27a'; for (let k = 0; k < 4; k++) g.fillRect(x + 291 + k * 8, 58, 6, 8);
    g.fillStyle = (tick >> 4) & 1 ? '#ff4a3a' : '#5a1a1a'; g.fillRect(x + 304, 38, 2, 10); g.fillRect(x + 303, 36, 4, 3);
  });
  // hangars
  eachVis(c, 0.42, 380, (i, x) => {
    g.fillStyle = '#5a4a6a'; g.beginPath(); g.moveTo(x + 20, 150); g.lineTo(x + 20, 112); g.quadraticCurveTo(x + 110, 70, x + 200, 112); g.lineTo(x + 200, 150); g.closePath(); g.fill();
    g.fillStyle = '#463858'; for (let k = 0; k < 8; k++) g.fillRect(x + 20 + k * 22.5, 100 + Math.abs(k - 3.5) * 4, 1, 50 - Math.abs(k - 3.5) * 4);
    g.fillStyle = '#2a2038'; g.fillRect(x + 70, 118, 80, 32); g.fillStyle = '#ffe9a0'; g.globalAlpha = 0.5; g.fillRect(x + 100, 122, 20, 28); g.globalAlpha = 1;
  });
  // avions garés
  eachVis(c, 0.62, 420, (i, x) => {
    const sx = x + 120;
    g.fillStyle = '#e8e4f0'; g.beginPath(); g.ellipse(sx, 128, 46, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#b8b4c8'; g.beginPath(); g.moveTo(sx - 34, 124); g.lineTo(sx - 52, 98); g.lineTo(sx - 44, 98); g.lineTo(sx - 22, 124); g.fill();
    g.fillStyle = '#c8c4d8'; g.beginPath(); g.moveTo(sx - 4, 130); g.lineTo(sx - 28, 142); g.lineTo(sx + 10, 134); g.closePath(); g.fill();
    g.fillStyle = '#2a3a6a'; for (let k = 0; k < 9; k++) g.fillRect(sx - 28 + k * 5.6, 125, 3, 3); g.fillRect(sx + 28, 124, 10, 4);
    g.fillStyle = '#c04a3a'; g.fillRect(sx - 40, 128, 78, 1.5);
  });
  // clôture + balises de piste
  g.fillStyle = '#20182c'; g.fillRect(0, 146, W, 4);
  eachVis(c, 0.9, 40, (i, x) => { g.fillStyle = '#20182c'; g.fillRect(x, 132, 2, 18); const on = ((tick >> 4) + i) % 3 === 0; g.fillStyle = on ? '#ffe36a' : '#8a7a3a'; g.fillRect(x - 1, 130, 4, 3); });
  // sol : tarmac
  g.fillStyle = '#3a3c48'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#4a4c5a'; g.fillRect(0, 150, W, 4); g.fillStyle = '#2a2c36'; g.fillRect(0, 154, W, 2);
  g.fillStyle = '#e8c020'; eachVis(c, 1, 64, (i, x) => g.fillRect(x, 205, 36, 3));
  g.fillStyle = '#2f313c'; eachVis(c, 1, 120, (i, x) => { g.fillRect(x, 160, 1, H - 160); });
  eachVis(c, 1, 170, (i, x) => { g.fillStyle = 'rgba(20,20,30,.4)'; g.beginPath(); g.ellipse(x + 50, 180 + hash(i + 11) * 66, 20, 4, 0, 0, 7); g.fill(); });
  g.fillStyle = '#c8c8d4'; eachVis(c, 1, 300, (i, x) => { for (let k = 0; k < 4; k++) g.fillRect(x + 20 + k * 6, 236, 3, 12); });
}

/* ---------- 10 · CHÂTEAU ---------- */
function drawBGChateau(c) {
  g.fillStyle = vgrad('chateau', 150, [[0, '#07040f'], [1, '#3a1430']]); g.fillRect(0, 0, W, 150);
  // éclairs
  const fz = (tick % 360) < 5 ? 0.35 : (tick % 211) < 3 ? 0.2 : 0;
  if (fz) { g.globalAlpha = fz; g.fillStyle = '#e8e0ff'; g.fillRect(0, 0, W, 150); g.globalAlpha = 1; }
  // nuages
  for (let k = 0; k < 6; k++) { const x = ((hash(k + 4) * (W + 260) - tick * 0.3 - c * 0.08) % (W + 260) + W + 260) % (W + 260) - 130; g.globalAlpha = 0.5; g.fillStyle = '#1a0e24'; g.beginPath(); g.ellipse(x, 20 + hash(k) * 55, 90, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  g.fillStyle = '#c04a5a'; g.beginPath(); g.arc(380, 40, 14, 0, 7); g.fill(); g.globalAlpha = 0.15; g.beginPath(); g.arc(380, 40, 26, 0, 7); g.fill(); g.globalAlpha = 1;
  // silhouette du château lointain
  eachVis(c, 0.16, 300, (i, x) => {
    g.fillStyle = '#12091c'; g.fillRect(x + 20, 80, 260, 70);
    for (const [tx, th, tw] of [[10, 100, 30], [120, 64, 26], [190, 110, 34], [262, 72, 26]]) {
      g.fillRect(x + tx, 150 - th, tw, th); g.beginPath(); g.moveTo(x + tx - 3, 150 - th); g.lineTo(x + tx + tw / 2, 150 - th - 28); g.lineTo(x + tx + tw + 3, 150 - th); g.closePath(); g.fill();
      g.fillStyle = '#ffd27a'; g.fillRect(x + tx + tw / 2 - 1.5, 150 - th + 12, 3, 6); g.fillRect(x + tx + tw / 2 - 1.5, 150 - th + 34, 3, 6); g.fillStyle = '#12091c';
    }
    for (let k = 0; k < 12; k++) g.fillRect(x + 20 + k * 22, 74, 12, 7);
  });
  // rempart
  eachVis(c, 0.45, 120, (i, x) => {
    g.fillStyle = '#241a34'; g.fillRect(x, 92, 120, 58); for (let k = 0; k < 6; k++) g.fillRect(x + k * 20 + 2, 85, 12, 8);
    g.fillStyle = '#31244a'; for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) g.fillRect(x + k * 20 + (r & 1) * 10, 100 + r * 12, 18, 1);
    if (hash(i + 77) > 0.4) { g.fillStyle = '#0a0612'; g.beginPath(); g.moveTo(x + 40, 150); g.lineTo(x + 40, 118); g.arc(x + 60, 118, 20, Math.PI, 0); g.lineTo(x + 80, 150); g.fill(); g.fillStyle = '#ffb45a'; g.globalAlpha = 0.25; g.fillRect(x + 50, 124, 20, 26); g.globalAlpha = 1; }
  });
  // bannières et torches en avant-plan
  eachVis(c, 0.8, 200, (i, x) => {
    g.fillStyle = '#2a2234'; g.fillRect(x + 10, 20, 5, 130); g.fillStyle = '#d4a017'; g.fillRect(x + 4, 18, 17, 3);
    const w = Math.sin(tick * 0.08 + i * 2) * 3;
    g.fillStyle = '#7a1a8a'; g.beginPath(); g.moveTo(x + 20, 24); g.lineTo(x + 58 + w, 26); g.lineTo(x + 52 + w, 52); g.lineTo(x + 58 + w, 78); g.lineTo(x + 20, 76); g.closePath(); g.fill();
    g.fillStyle = '#d4a017'; g.fillRect(x + 32, 40, 12, 12);
    const fl = 0.8 + 0.2 * Math.sin(tick * 0.33 + i);
    g.fillStyle = '#ff6a20'; g.beginPath(); g.moveTo(x + 5, 104); g.quadraticCurveTo(x + 3, 92 - 3 * fl, x + 12, 84 - 4 * fl); g.quadraticCurveTo(x + 21, 92, x + 19, 104); g.fill();
    g.globalAlpha = 0.1 * fl; g.fillStyle = '#ffb45a'; g.beginPath(); g.arc(x + 12, 94, 40, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#4a3a2a'; g.fillRect(x + 4, 104, 16, 5);
  });
  // sol : cour pavée et tapis rouge
  g.fillStyle = '#2a2430'; g.fillRect(0, 150, W, H - 150);
  g.fillStyle = '#3a3242'; g.fillRect(0, 150, W, 4); g.fillStyle = '#16101c'; g.fillRect(0, 154, W, 2);
  g.fillStyle = '#1e1826';
  for (let y = 166; y < H; y += 14) g.fillRect(0, y, W, 1);
  eachVis(c, 1, 36, (i, x) => { for (let r = 0; r < 7; r++) g.fillRect(x + ((r & 1) ? 18 : 0), 156 + r * 14, 1, 14); });
  g.fillStyle = '#6a1230'; g.fillRect(0, 196, W, 34); g.fillStyle = '#d4a017'; g.fillRect(0, 196, W, 2); g.fillRect(0, 228, W, 2);
  g.fillStyle = 'rgba(212,160,23,.5)'; eachVis(c, 1, 40, (i, x) => { g.fillRect(x + 8, 211, 10, 2); });
  eachVis(c, 1, 210, (i, x) => { g.fillStyle = 'rgba(90,120,160,.22)'; g.beginPath(); g.ellipse(x + 60, 176 + hash(i + 8) * 76, 28, 4, 0, 0, 7); g.fill(); });
  // pluie
  g.strokeStyle = 'rgba(170,190,230,.35)'; g.lineWidth = 1; g.beginPath();
  for (let k = 0; k < 46; k++) { const x = (hash(k + 300) * W + tick * 3.4) % (W + 40) - 20, y = (hash(k + 400) * H + tick * 9) % H; g.moveTo(x, y); g.lineTo(x - 3, y + 9); }
  g.stroke();
}
