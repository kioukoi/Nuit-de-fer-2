/* ---------- personnages : rendu vectoriel lissé (haute définition) ----------
   Chaque personnage est dessiné en vectoriel (courbes, dégradés, contours fins) dans un canvas
   suréchantillonné (SS fois), puis réduit en douceur sur le jeu, qui tourne lui-même en 3x. */
/* zone utile du sprite (le reste du canvas n'est ni effacé ni recopié : gain important par personnage) */
const RX = 16, RY = 26, RW = 96, RH = 92;
const SS = 3, OL = '#1a1426', LW = 0.75;
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; gg *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; }
  return '#' + [r, gg, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}
const BASEMAP = { ombre: 'cogneur', boxeur: 'costaud', medic: 'cogneur', fauteuil: 'cogneur', dalto: 'cogneur', aveugle: 'cogneur', gitan: 'costaud', magicien: 'cogneur', electricien: 'cogneur', livreur: 'cogneur', crs: 'thug', crsc: 'thug', crsgaz: 'thug', marin: 'thug', soudeur: 'brute', garde: 'thug' };
function palT(e, d) {
  const t = LV && LV.tint && LV.tint[e.type];
  if (!t) return pal(d);
  d._pt = d._pt || {};
  if (!d._pt[LV.id]) d._pt[LV.id] = pal({ col: Object.assign({}, d.col, t) });
  return d._pt[LV.id];
}
function pal(d) {
  if (d._p) return d._p;
  const c = d.col;
  d._p = {
    skin: c.skin, skinD: shade(c.skin, -0.22), skinL: shade(c.skin, 0.15),
    hair: c.hair, hairL: shade(c.hair, 0.3), hairD: shade(c.hair, -0.35),
    shirt: c.shirt, shirtD: shade(c.shirt, -0.3), shirtL: shade(c.shirt, 0.22),
    pants: c.pants, pantsD: shade(c.pants, -0.3), pantsL: shade(c.pants, 0.18),
    shoe: c.shoe || '#222', acc: c.acc || '#e03030', acc2: c.acc2 || '#f2f2f2'
  };
  return d._p;
}
const sprC = document.createElement('canvas'); sprC.width = 128 * SS; sprC.height = 128 * SS;
const sg = sprC.getContext('2d'); sg.imageSmoothingEnabled = true;
function lg(x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}
function poly(pts, fill, stroke) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath(); g.fillStyle = fill; g.fill();
  if (stroke !== false) { g.lineWidth = LW; g.strokeStyle = stroke || OL; g.lineJoin = 'round'; g.stroke(); }
}
function ell(x, y, rx, ry, fill, stroke, rot) {
  g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.fillStyle = fill; g.fill();
  if (stroke !== false) { g.lineWidth = LW; g.strokeStyle = stroke || OL; g.stroke(); }
}
function rrect(x, y, w, h, r, fill, stroke) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  g.fillStyle = fill; g.fill();
  if (stroke !== false) { g.lineWidth = LW; g.strokeStyle = stroke || OL; g.stroke(); }
}
/* membre articulé : contour, couleurs par segment, reflet */
function limb(pts, w, cols) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = OL; g.lineWidth = w + LW * 1.7;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke();
  for (let i = 0; i < pts.length - 1; i++) {
    g.strokeStyle = cols[i]; g.lineWidth = w;
    g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke();
  }
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = Math.max(0.6, w * 0.32);
  g.beginPath(); g.moveTo(pts[0][0] + 0.3, pts[0][1] - w * 0.18); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + 0.3, pts[i][1] - w * 0.18); g.stroke();
  g.lineCap = 'butt';
}
let HAND_RING = null;
/* main : poing fermé orienté dans le prolongement de l'avant-bras (paume, phalanges, pouce) */
function drawHand(ex, ey, hx, hy, w, skin, glove) {
  const a = Math.atan2(hy - ey, hx - ex), r = w * 0.7 + 0.4, col = glove || skin;
  g.save(); g.translate(hx, hy); g.rotate(a);
  g.lineJoin = 'round'; g.lineWidth = LW; g.strokeStyle = OL;
  if (glove) {                                           // gant : poing arrondi + poignet
    rrect(-r * 0.9, -r * 1.05, r * 2.4, r * 2.1, r * 0.8, col);
    g.fillStyle = shade(col, -0.25); g.fillRect(-r * 0.9, -r * 0.95, r * 0.55, r * 1.9);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(r * 0.5, -r * 0.45, r * 0.7, r * 0.28, 0, 0, 7); g.fill();
  } else {
    rrect(-r * 0.7, -r * 0.95, r * 1.9, r * 1.9, r * 0.55, col);                // paume
    g.strokeStyle = shade(col, -0.38); g.lineWidth = 0.45;                         // 4 phalanges
    for (let k = 0; k < 3; k++) { const yy = -r * 0.5 + k * r * 0.5; g.beginPath(); g.moveTo(r * 0.15, yy); g.lineTo(r * 1.1, yy); g.stroke(); }
    g.beginPath(); g.moveTo(r * 0.15, -r * 0.95); g.lineTo(r * 0.15, r * 0.95); g.stroke();
    ell(-r * 0.05, r * 0.55, r * 0.62, r * 0.36, shade(col, 0.1), OL, -0.35);   // pouce replié
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(r * 0.3, -r * 0.85, r * 0.7, 0.5);
  }
  if (HAND_RING) { g.fillStyle = HAND_RING; g.fillRect(r * 0.05, -r * 1.0, r * 0.5, r * 2); g.fillRect(r * 0.75, -r * 0.9, r * 0.35, r * 0.9); g.strokeStyle = OL; g.lineWidth = 0.3; g.strokeRect(r * 0.05, -r * 1.0, r * 0.5, r * 2); }
  g.restore();
}
function drawArm(sx, sy, hx, hy, sleeve, skin, w, glove) {
  const dist = Math.hypot(hx - sx, hy - sy), bend = Math.max(0, 11 - dist) * 0.5;
  const ex = (sx + hx) / 2 - bend * 0.4, ey = (sy + hy) / 2 + bend;
  limb([[sx, sy], [ex, ey], [hx, hy]], w, [sleeve, skin]);
  drawHand(ex, ey, hx, hy, w, skin, glove);
}
function drawLeg(hx, hy, fx, fy, pants, shoe, toe, calf) {
  const kx = (hx + fx) / 2 + 2, ky = (hy + fy - 3) / 2;
  limb([[hx, hy], [kx, ky], [fx, fy - 3]], 4.4, [pants, calf || pants]);
  // chaussure : forme arrondie avec semelle et bout de couleur
  g.beginPath(); g.moveTo(fx - 3.2, fy - 4.2); g.quadraticCurveTo(fx - 3.6, fy + 0.8, fx - 2.4, fy + 0.8);
  g.lineTo(fx + 4.4, fy + 0.8); g.quadraticCurveTo(fx + 6.2, fy + 0.6, fx + 5.2, fy - 1.8); g.quadraticCurveTo(fx + 3, fy - 3, fx + 1.5, fy - 4.2); g.closePath();
  g.fillStyle = lg(0, fy - 4, 0, fy + 1, [[0, shade(shoe, 0.12)], [1, shade(shoe, -0.25)]]); g.fill();
  g.lineWidth = LW; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
  g.fillStyle = toe; g.beginPath(); g.ellipse(fx + 4, fy - 1, 1.2, 1.1, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(fx - 2.6, fy + 0.2, 7, 0.6);
}


/* armes tenues en main : dessinées dans le repère du personnage, orientées par un angle (0 = vers l'avant) */
function drawWeapon(name, hx, hy, ang) {
  g.save(); g.translate(hx, hy); g.rotate(ang);
  if (name === 'tuyau') {
    rrect(-4, -1.3, 25, 2.6, 1.2, lg(0, -1.3, 0, 1.3, [[0, '#c9ced6'], [0.5, '#8a9099'], [1, '#5c626b']]));
    g.fillStyle = '#4a4f57'; g.fillRect(18.2, -1.3, 1.1, 2.6); g.fillRect(-1, -1.3, 1, 2.6);
  } else if (name === 'batte') {
    g.beginPath(); g.moveTo(-4, -1); g.lineTo(9, -1.3); g.quadraticCurveTo(19, -3.1, 22.5, -2); g.quadraticCurveTo(24, 0, 22.5, 2); g.quadraticCurveTo(19, 3.1, 9, 1.3); g.lineTo(-4, 1); g.closePath();
    g.fillStyle = lg(0, -3, 0, 3, [[0, '#d9a25c'], [1, '#8a5a28']]); g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = '#222'; g.fillRect(-3.6, -1, 5, 2);
  } else if (name === 'pancarte') {
    g.strokeStyle = OL; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-4, 0); g.lineTo(20, 0); g.stroke();
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-4, 0); g.lineTo(20, 0); g.stroke();
    rrect(12, -11, 12, 10, 0.8, '#f4f0e0'); g.fillStyle = '#d03030'; g.fillRect(14, -8, 8, 1.8); g.fillRect(14, -5, 6, 1.4);
  } else if (name === 'pave') {
    poly([[-2, -3.4], [5, -4.2], [8, 0], [5, 3.6], [-1.6, 3.4], [-4, 0]], '#8c8f98'); g.fillStyle = '#b4b7c0'; g.fillRect(-1, -2.4, 5, 1.3);
  } else if (name === 'pistolet') {
    rrect(0, -2.2, 9, 3.4, 0.8, '#3c404a'); g.fillStyle = '#1e2026'; g.fillRect(7, -1.6, 3.6, 1.7); g.fillStyle = '#7a7f8a'; g.fillRect(1, -2.2, 6, 0.9);
    poly([[0.2, 1], [3.6, 1], [2.6, 5.6], [-1, 5.6]], '#2a2018');
  } else if (name === 'mitraillette') {
    rrect(0, -2.6, 13, 4.2, 0.8, '#2e3138'); g.fillStyle = '#16181c'; g.fillRect(13, -1.4, 6, 1.8); g.fillRect(-4.5, -1.8, 4.5, 2.6);
    rrect(4, 1.3, 3, 6.5, 0.6, '#1f2126'); poly([[0.2, 1.2], [3.2, 1.2], [2.2, 5.2], [-1, 5.2]], '#2a2018'); g.fillStyle = '#7a7f8a'; g.fillRect(1, -2.6, 9, 0.8);
  } else if (name === 'grenade') {
    ell(2, 0.5, 3.8, 4.4, '#4d7038', OL); g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = -1; k <= 1; k++) g.fillRect(-1.5, 0.5 + k * 2, 7, 0.6);
    g.fillStyle = '#9aa0a8'; g.fillRect(0.6, -5.4, 2.8, 1.8); g.strokeStyle = '#c9ced6'; g.lineWidth = 0.8; g.beginPath(); g.arc(5.2, -4.4, 1.6, 0, 7); g.stroke();
  } else if (name === 'canne') {
    g.strokeStyle = OL; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-3, 0); g.lineTo(21, 0); g.stroke();
    g.strokeStyle = '#a06a30'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-3, 0); g.lineTo(21, 0); g.stroke();
    g.strokeStyle = '#a06a30'; g.lineWidth = 1.3; g.beginPath(); g.arc(-4.2, -1.8, 1.9, 0.6, Math.PI * 1.55); g.stroke();
  } else {
    rrect(-3.5, -1.1, 6, 2.2, 0.9, '#3a2a20');
    g.beginPath(); g.moveTo(2.2, -1.3); g.lineTo(11, -0.8); g.quadraticCurveTo(13.6, 0.1, 12.2, 0.9); g.lineTo(2.2, 1.3); g.closePath();
    g.fillStyle = lg(0, -1.3, 0, 1.3, [[0, '#f2f6fa'], [1, '#aab4be']]); g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
  }
  g.restore();
}

function drawChar(e) {
  const isP = e.kind === 'p' || e.kind === 'a', d = isP ? HEROES[e.hero] : T[e.type], s = d.sc || 1, S = isP ? pal(d) : palT(e, d), kind = isP ? e.hero : e.type, type = BASEMAP[kind] || kind;
  const sx = Math.round(e.x - cam), sy = Math.round(e.y - e.z);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath(); g.ellipse(sx, Math.round(e.y) + 1, 12 * s * (1 - Math.min(0.5, e.z / 80)), 3 * s, 0, 0, 7); g.fill();
  if (sx < -60 || sx > W + 60) return;                       // hors écran : rien à dessiner
  if (e.dying && e.st === 'down' && e.lie > 20 && (e.lie & 4)) return;
  if (isP && e.inv > 0 && (tick & 4)) return;
  if (e.hide) return;
  const fl = (e.flash > 0 && (e.flash & 2)) || (e.shock > 0 && ((tick >> 1) & 1));
  const mainG = g;
  g = sg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(RX * SS, RY * SS, RW * SS, RH * SS);
  g.setTransform(SS, 0, 0, SS, 64 * SS, 100 * SS); g.scale(e.face, 1);
  const st = e.st, crawl = kind === 'fauteuil' && e.nochair && st === 'free', down = st === 'down' || crawl;
  if (down) { g.translate(0, -6); g.transform(0, -1, 1, 0, 0, 0); }
  if (crawl) g.translate(e.mv ? Math.sin(e.walk * 2) * 0.9 : 0, 0);

  /* --- pose --- */
  const air = e.z > 2 && !down;
  const moving = (isP && e.mv) || (!isP && (e.mv || st === 'charge'));
  const ph = e.walk, sw = Math.sin(ph), cw = Math.cos(ph);
  const bob = ((tick + (e.x | 0)) >> 4) & 1;
  let lean = 0, hipY = -14, hdx = 0, ffx = 4, ffy = 0, bfx = -4, bfy = 0;
  let fhx = 9, fhy = -27, bhx = 5, bhy = -24, shut = false, spin = false, bottle = false, kickLeg = false, ring = 0;
  if (down) { ffx = 3; ffy = -1; bfx = -5; fhx = 6; fhy = -20; bhx = -6; bhy = -20; shut = true; }
  else if (st === 'hurt') {
    lean = -3; hdx = -2; ffx = 5; bfx = -6; fhx = 3; fhy = -21; bhx = -4; bhy = -20; shut = true;
    if (e.shock > 0) { lean = Math.random() * 4 - 2; hdx = 0; fhx = 11; fhy = -36; bhx = -8; bhy = -36; ffx = 7; bfx = -7; }
  }
  else if (air) {
    ffx = 5; ffy = -8; bfx = -3; bfy = -5; hipY = -15; fhx = 8; fhy = -30; bhx = 4; bhy = -27;
    if (isP && e.kick) { ffx = 19; ffy = -17; bfx = -4; bfy = -7; lean = -2; kickLeg = true; fhx = -4; fhy = -22; bhx = -8; bhy = -24; }
  } else if (isP && st === 'special' && e.hero === 'costaud') {
    if (e.t < 12) { lean = -2; fhx = 4; fhy = -44; bhx = -1; bhy = -43; ffx = 4; bfx = -5; }
    else { lean = 6; hipY = -12; fhx = 14; fhy = -8; bhx = 10; bhy = -8; ffx = 7; bfx = -5; ring = (e.t - 12) * 3.2; }
  } else if (isP && st === 'special' && (e.hero === 'ombre' || e.hero === 'magicien')) {
    lean = 3; ffx = 7; bfx = -5; bhx = 6; bhy = -24; fhx = e.t < 7 ? 4 : 18; fhy = e.t < 7 ? -31 : -27;
  } else if (isP && st === 'special' && e.hero === 'boxeur') {
    if (e.t < 6) { lean = 6; hipY = -12; ffx = 8; bfx = -5; fhx = 8; fhy = -22; bhx = 4; bhy = -20; }
    else { lean = -2; fhx = 11; fhy = -44; bhx = 3; bhy = -25; ffx = 5; bfx = -5; }
  } else if (isP && st === 'special' && e.hero === 'papy') {
    if (e.t < 14) { lean = -3; fhx = 5; fhy = -46; bhx = -1; bhy = -42; ffx = 3; bfx = -5; }
    else { lean = 5; fhx = 20; fhy = -16; bhx = 6; bhy = -22; ffx = 7; bfx = -4; }
  } else if (isP && st === 'special' && (e.hero === 'medic' || e.hero === 'aveugle' || e.hero === 'gitan' || e.hero === 'electricien')) {
    fhx = 6; fhy = -44; bhx = -3; bhy = -43; ffx = 4; bfx = -4; ring = e.t > 6 ? (e.t - 6) * 2.4 : 0;
  } else if (isP && st === 'special') { spin = true; ffx = 8; bfx = -8; fhx = 17; fhy = -26; bhx = -17; bhy = -26; }
  else if (isP && st === 'rush') { lean = 8; ffx = 7; ffy = -5; bfx = -2; bfy = -4; fhx = 13; fhy = -22; bhx = 9; bhy = -20; }
  else if (isP && st === 'roll') { lean = 9; hipY = -9; ffx = 7; ffy = -4; bfx = -2; bfy = -3; fhx = 12; fhy = -20; bhx = 8; bhy = -18; }
  else if (isP && st === 'attack') {
    const a = HEROES[e.hero].atk[e.stage], u = Math.min(1, e.t / a.act[0]);
    if (e.stage < 2) {
      if (e.t < a.act[0]) { fhx = 9 - 7 * u; fhy = -26; lean = -1; }
      else if (e.t <= a.act[1]) { fhx = a.ext + 9; fhy = e.stage === 0 ? -28 : -25; lean = 3; ffx = 7; bfx = -5; }
      else { fhx = 12; fhy = -27; lean = 1; }
    } else if (e.t < a.act[0]) { fhx = -3; fhy = -15; lean = -3; ffx = 2; bfx = -6; bhx = 6; bhy = -26; }
    else if (e.t <= a.act[1]) { fhx = 20; fhy = -37; lean = 4; ffx = 9; bfx = -5; bhx = 3; bhy = -22; }
    else { fhx = 14; fhy = -30; lean = 2; ffx = 8; }
  } else if (!isP && (st === 'tele' || st === 'bspec')) {
    lean = -2; ffx = 3; bfx = -5;
    if (e.mode === 'charge') { lean = 3; hipY = -12; ffx = 6; bfx = -6; fhx = -6; fhy = -24; bhx = -9; bhy = -22; }
    else if (e.mode === 'throw') { fhx = 2; fhy = -40; bhx = 6; bhy = -25; bottle = !e.weapon; }
    else { fhx = -4; fhy = -39; bhx = 6; bhy = -26; if (type === 'brute') { bhx = -1; bhy = -40; } }
  } else if (!isP && st === 'attack') {
    const a = d.atk;
    if (e.t < a.act[0]) { fhx = -3; fhy = -36; lean = -2; ffx = 3; bfx = -5; }
    else if (e.t <= a.act[1]) { fhx = a.reach - 2; fhy = type === 'brute' ? -20 : -28; lean = type === 'brute' ? 5 : 3; ffx = 8; bfx = -5; bhx = 4; bhy = -23; }
    else { fhx = 7; fhy = -22; lean = 2; }
  } else if (!isP && st === 'charge') {
    lean = 6; hipY = -13; fhx = 15; fhy = -25; bhx = 11; bhy = -23;
    ffx = 2 + sw * 8; ffy = -Math.max(0, cw) * 4; bfx = -2 - sw * 8; bfy = -Math.max(0, -cw) * 4;
  } else if (!isP && st === 'recover') {
    lean = 2; fhx = 5; fhy = -20; bhx = 0; bhy = -19; ffx = 3; bfx = -5;
  } else if (moving) {
    const lo = Math.abs(sw) > 0.6 ? 0 : 1;
    ffx = 2 + sw * 6; ffy = -Math.max(0, cw) * 3; bfx = -2 - sw * 6; bfy = -Math.max(0, -cw) * 3;
    hipY = -14 - lo;
    if (isP) { fhy = -27 - lo; bhy = -24 - lo; }
    if (isP && e.sprint) { lean = 4; hipY = -13 - lo; ffx = 3 + sw * 8; bfx = -3 - sw * 8; fhx = 2 - sw * 6; fhy = -22; bhx = -4 + sw * 6; bhy = -21; }
    else { fhx = 3 - sw * 5; fhy = -21; bhx = 1 + sw * 5; bhy = -21; }
  } else {
    hipY = -14 - bob; fhy -= bob; bhy -= bob;
    if (!isP) { fhx = 6; fhy = -24 - bob; bhx = 3; bhy = -22 - bob; }
  }
  if (kind === 'livreur' && !down && st !== 'rush') { ffx = 5; ffy = -5; bfx = -3; bfy = -9 - Math.abs(Math.sin(e.walk * 1.2)) * 2; hipY = -15; }
  if (kind === 'livreur' && st === 'rush') hipY = -15;
  if (kind === 'fauteuil' && !down) { ffx = 10; ffy = -6; bfx = 8; bfy = -5; hipY = -14; }
  if (kind === 'papy' && !down) { lean += 2.4; if (st === 'free' || moving) hdx += 1.2; }
  if (kind === 'papy' && !down && !e.cane && (st === 'free' || st === 'attack') && !air) {   // sans canne : démarche hésitante, bras écartés pour l'équilibre
    if (moving) { lean += 1.4 + sw * 1.1; ffx = 2 + sw * 3.6; bfx = -2 - sw * 3.6; ffy = -Math.max(0, cw) * 1.4; bfy = -Math.max(0, -cw) * 1.4; hipY = -14 - (Math.abs(sw) > 0.6 ? 0 : 0.6); }
    else lean += Math.sin(tick * 0.07) * 1.1;
    if (st === 'free') { fhx = 8 + (moving ? cw * 1.6 : 0); fhy = -23 + (moving ? sw * 1.2 : 0); bhx = -4 - (moving ? cw * 1.6 : 0); bhy = -23 - (moving ? sw * 1.2 : 0); }
  }

  /* --- dimensions du tronc selon le personnage --- */
  const shY = hipY - 14;
  const tw = { cogneur: [6.2, 5.2], vive: [5.2, 4.2], costaud: [8, 6.6], thug: [5.8, 4.8], brute: [8, 6.4], thrower: [5.8, 5.2], boss: [6.4, 5.8], papy: [5.2, 4.8] }[type];
  const hx = lean + hdx, hy = shY - 11 + (st === 'hurt' ? 1 : 0);
  const armW = (type === 'brute' || type === 'costaud') ? 4.4 : 3.4;
  const bare = type === 'thug' || type === 'brute' || type === 'vive' || type === 'costaud';
  const sleeveN = bare ? S.skin : S.shirt, sleeveF = bare ? S.skinD : S.shirtD;
  const armColN = type === 'vive' ? S.skin : S.skin;

  HAND_RING = kind === 'gitan' ? '#ffd84a' : null;
  /* --- bras et jambes arrière --- */
  const glvB = kind === 'boxeur' ? shade(S.shirt, -0.28) : undefined, glvF = kind === 'boxeur' ? S.shirt : undefined;
  drawArm(lean * 0.9 - 2, shY + 3, bhx, bhy, sleeveF, S.skinD, armW, glvB);
  drawLeg(-1, hipY, bfx, bfy, S.pantsD, shade(S.shoe, -0.25), S.acc, type === 'vive' ? S.skinD : undefined);
  drawLeg(1, hipY, ffx, ffy, S.pants, S.shoe, S.acc, type === 'vive' ? S.skin : undefined);

  if (kind === 'fauteuil' && !e.nochair) {
    limb([[-7.5, hipY + 1], [-8.4, shY - 2]], 1.6, ['#33353d', '#33353d']);
    rrect(-8.2, shY - 3.6, 3.2, 3, 1, '#33353d');
    rrect(-7, hipY + 1.4, 14, 2.4, 1, '#44464f');
  }
  /* --- pans du manteau (chef) --- */
  if (type === 'boss') {
    const fl2 = lean > 2 ? 3 : 0, wv = Math.sin(tick * 0.2) * 1.2;
    poly([[-6 - fl2 - wv, hipY - 2], [7, hipY - 2], [8 + 1, hipY + 9], [2, hipY + 11.5], [-4 - wv, hipY + 10], [-9 - fl2 - wv, hipY + 11]], lg(-9, hipY, 8, hipY + 10, [[0, S.shirtD], [1, S.shirt]]));
    g.strokeStyle = S.acc; g.lineWidth = 1.2; g.beginPath(); g.moveTo(3.5, hipY - 1); g.lineTo(4.5, hipY + 10.5); g.stroke();
  }

  if (kind === 'magicien') {
    const wv = Math.sin(tick * 0.15) * 1.4 + (moving ? 2 : 0);
    poly([[-4 + lean * 0.5, shY], [-11 - wv - lean, hipY + 9], [-5, hipY + 11], [4 + lean * 0.5, shY + 1]], lg(-11, shY, 3, hipY + 10, [[0, shade(S.acc, -0.35)], [1, S.acc]]));
  }
  /* --- tronc --- */
  const t0x = lean, b0x = 0, ty = shY - 1, by = shY + 13;
  const TL = t0x - tw[0], TR = t0x + tw[0], BL = b0x - tw[1], BR = b0x + tw[1];
  function torsoPath() {
    g.beginPath(); g.moveTo(TL, ty + 3.2); g.quadraticCurveTo(TL - 0.2, ty, TL + 3, ty);
    g.lineTo(TR - 3, ty); g.quadraticCurveTo(TR + 0.2, ty, TR, ty + 3.2);
    g.quadraticCurveTo(TR - 0.4, shY + 8, BR, by); g.lineTo(BL, by); g.quadraticCurveTo(TL + 0.4, shY + 8, TL, ty + 3.2); g.closePath();
  }
  const base = (type === 'brute' || type === 'vive') ? S.skin : S.shirt;
  const baseD = (type === 'brute' || type === 'vive') ? S.skinD : S.shirtD, baseL = (type === 'brute' || type === 'vive') ? S.skinL : S.shirtL;
  torsoPath(); g.fillStyle = lg(TL, 0, TR, 0, [[0, baseD], [0.45, base], [1, baseL]]); g.fill();
  g.save(); torsoPath(); g.clip();
  const band = (i0, i1, col) => { g.fillStyle = col; g.fillRect(TL - 4, shY + i0, TR - TL + 12, i1 - i0); };
  const cf = (t) => lean * (1 - t) + 1.4;  // centre de la face avant
  switch (type) {
    case 'cogneur':
      poly([[cf(0.05) - 1.8, ty], [cf(0.05) + 2.2, ty], [cf(0.95) + 1.6, by], [cf(0.95) - 2.2, by]], S.acc2, false);
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cf(0) - 1.8, ty); g.lineTo(cf(1) - 2.2, by); g.stroke();
      band(12, 14, '#2a2a3a'); band(12, 13.4, '#3a3a4e'); rrect(cf(0.9) - 1.6, shY + 12, 3.4, 1.9, 0.5, '#d9a21b', false);
      break;
    case 'papy':
      band(0, 14, S.shirt); band(11, 14, '#444450');
      poly([[cf(0.05) - 1.6, ty], [cf(0.05) + 2.4, ty], [cf(0.35) + 0.4, ty + 6], [cf(0.05) - 0.4, ty + 6]], '#f2f2f2', false);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cf(0.4) + 0.4, ty + 5); g.lineTo(cf(0.9) + 0.2, by); g.stroke();
      g.fillStyle = '#4a3a22'; for (const k of [0.5, 0.68, 0.86]) g.fillRect(cf(k) - 0.4, shY + 14 * k - 0.4, 1.4, 1.4);
      break;
    case 'vive':
      band(0, 7.2, S.shirt); band(6.4, 7.6, S.shirtD); band(12, 14, S.pants); band(12, 12.8, S.pantsL);
      g.fillStyle = S.acc; g.fillRect(cf(0.2) - 0.8, shY + 1, 1.6, 3.4);
      g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(cf(0.7) - 0.4, shY + 8.5, 0.8, 3);
      break;
    case 'thug':
      g.fillStyle = S.skin; g.fillRect(TL - 3, ty, 3.2, 6); g.fillRect(TR - 0.2, ty, 4, 6);
      g.fillStyle = S.acc; g.fillRect(cf(0.2) - 0.9, shY + 3, 1.8, 3);
      band(12, 14, '#222');
      break;
    case 'brute':
      g.strokeStyle = S.skinD; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(cf(0.35) - 0.2, shY + 4); g.quadraticCurveTo(cf(0.4) + 2, shY + 8, cf(0.5) + 4, shY + 5); g.stroke();
      g.beginPath(); g.moveTo(cf(0.1), shY + 1); g.lineTo(cf(0.55), shY + 9); g.stroke();
      g.fillStyle = S.shirt; g.fillRect(TL - 1, ty, 3, 8); g.fillRect(TR - 2, ty, 4, 8);
      band(11.5, 14, '#1a1a1a'); g.fillStyle = S.acc; g.fillRect(cf(0.9) - 1.3, shY + 11.6, 3.6, 1.8);
      break;
    case 'costaud':
      g.fillStyle = S.skin; g.fillRect(TL - 3, ty, 3.8, 5); g.fillRect(TR - 0.8, ty, 4, 5);
      g.fillStyle = S.shirtD; g.fillRect(TL, shY + 4.6, TR - TL, 0.9);
      band(11.5, 14, '#222'); g.fillStyle = S.acc; g.fillRect(cf(0.9) - 1.2, shY + 11.6, 3.2, 1.9);
      break;
    case 'thrower':
      band(8, 12, S.shirtD); g.fillStyle = S.acc2; g.fillRect(cf(0.2) + 1, shY + 2, 0.9, 5);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cf(0.65) - 3, shY + 9, 6, 0.7);
      break;
    case 'boss':
      g.fillStyle = S.acc; g.fillRect(cf(0.5) + 0.2, ty, 1.8, 15);
      band(12, 14, '#111'); g.fillStyle = '#888'; g.fillRect(cf(0.9) - 1, shY + 12, 2.6, 1.6);
      break;
  }
  g.fillStyle = lg(0, ty, 0, by, [[0, 'rgba(255,255,255,.08)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.24)']]); g.fillRect(TL - 4, ty, TR - TL + 12, by - ty);
  switch (kind) {
    case 'marin': for (let i = 0; i < 5; i++) band(i * 3 - 0.4, i * 3 + 1, S.acc); break;
    case 'soudeur': band(3, 14, '#7a5a2a'); g.fillStyle = '#563c1a'; g.fillRect(cf(0.45) - 2.2, shY + 5.5, 4.4, 3.4); g.fillStyle = '#c9c9c9'; g.fillRect(TL + 1, ty, 1.2, 4); g.fillRect(TR - 2.2, ty, 1.2, 4); break;
    case 'garde':
      poly([[cf(0.02) - 2, ty], [cf(0.02) + 2.6, ty], [cf(0.5) + 0.6, shY + 7.5]], '#e8e8f0', false);
      g.fillStyle = '#b02020'; g.fillRect(cf(0.3) - 0.2, shY + 0.5, 1.5, 7.5);
      g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cf(0.02) - 2.2, ty); g.lineTo(cf(0.6) + 0.4, shY + 9); g.stroke();
      band(12, 14, '#000'); break;
    case 'ombre': band(10.8, 13, S.acc); g.strokeStyle = 'rgba(190,195,220,.4)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(TL, ty + 1); g.lineTo(TR, by - 4); g.moveTo(TR, ty + 1); g.lineTo(TL, by - 4); g.stroke(); break;
    case 'boxeur': band(10.8, 14, S.pants); band(10.8, 12, S.acc); g.fillStyle = S.acc2; g.fillRect(TL, ty + 3, TR - TL, 0.8); break;
    case 'thrower': g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(TL - 1, ty + 1); g.lineTo(TR + 1, by - 3); g.stroke(); g.fillStyle = S.acc; for (let k = 0; k < 3; k++) g.fillRect(TL + 2 + k * 3.4, ty + 3 + k * 3.4, 1.8, 2.6); break;
  }
  if (type === 'boss' && LV.id === 4) {
    const sw = 2.2; g.lineWidth = sw;
    for (const [off, col] of [[-2.2, '#2a4bd0'], [0, '#f4f4f8'], [2.2, '#d02838']]) { g.strokeStyle = col; g.beginPath(); g.moveTo(TL - 1 + off, ty - 1); g.lineTo(BR + 1 + off, by + 1); g.stroke(); }
  }
  if (kind === 'dalto') { g.fillStyle = '#35a845'; g.fillRect(cf(0.5) - 6.4, ty, 3, 22); g.fillRect(cf(0.5) + 3.4, ty, 3, 22); g.fillStyle = '#e8a020'; g.fillRect(cf(0.5) - 2.6, ty, 1.4, 22); }
  g.restore();
  torsoPath(); g.lineWidth = LW; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
  if (kind === 'medic') { g.fillStyle = S.acc; g.fillRect(cf(0.35) + 0.6, shY + 2, 1.6, 5); g.fillRect(cf(0.35) - 1.1, shY + 3.7, 5, 1.6); }
  if (kind === 'brute' || kind === 'soudeur') for (const sx2 of [TL + 0.4, TR - 0.4]) {
    ell(sx2, ty + 1.6, 3.8, 2.8, '#4a4a54'); poly([[sx2 - 1.6, ty - 0.2], [sx2, ty - 3.8], [sx2 + 1.6, ty - 0.2]], '#d0d0d8');
  }
  if (type === 'boss') {
    const sc = lean, w2 = Math.sin(tick * 0.25) * 2.2;
    rrect(sc - 6.2, shY - 2.6, 12.4, 4.2, 1.8, S.acc);
    limb([[sc - 5, shY + 1], [sc - 9, shY + 3 + w2 * 0.6], [sc - 12, shY + 6 - w2 * 0.6]], 2, [S.acc, S.acc]);
  }

  /* --- cou et tête --- */
  rrect(hx - 2.2, shY - 4.2, 4.4, 4, 1.2, S.skinD);
  const HX = hx, HY = hy + 5.2;
  g.beginPath(); g.moveTo(HX - 5.2, HY - 0.6); g.quadraticCurveTo(HX - 5.4, HY - 5.9, HX, HY - 5.9); g.quadraticCurveTo(HX + 5.6, HY - 5.9, HX + 5.5, HY - 0.4);
  g.quadraticCurveTo(HX + 5.5, HY + 3.6, HX + 3.2, HY + 5.0); g.quadraticCurveTo(HX + 0.6, HY + 6.0, HX - 2.4, HY + 5.0); g.quadraticCurveTo(HX - 5.2, HY + 3.4, HX - 5.2, HY - 0.6); g.closePath();
  g.fillStyle = lg(HX - 5.4, 0, HX + 5.6, 0, [[0, S.skinD], [0.4, S.skin], [1, S.skinL]]); g.fill();
  g.lineWidth = LW; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
  ell(HX - 1.8, HY + 0.6, 1.2, 1.7, S.skinD);                              // oreille
  g.beginPath(); g.moveTo(HX + 5.3, HY + 0.2); g.quadraticCurveTo(HX + 6.9, HY + 1.6, HX + 5.3, HY + 2.3); g.fillStyle = S.skin; g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();  // nez
  // oeil
  if (shut) { g.strokeStyle = OL; g.lineWidth = 0.9; g.beginPath(); g.moveTo(HX + 1.2, HY + 0.2); g.lineTo(HX + 3.6, HY + 0.4); g.stroke(); }
  else { ell(HX + 2.5, HY + 0.1, 1.55, 1.3, '#fff', false); ell(HX + 3.1, HY + 0.1, 0.78, 0.9, '#1a1a2a', false); g.fillStyle = '#fff'; g.fillRect(HX + 3.15, HY - 0.5, 0.45, 0.45); }
  g.strokeStyle = (type === 'cogneur' || type === 'vive') ? S.hairD : OL; g.lineWidth = 0.9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(HX + 0.7, HY - 1.6 + (st === 'hurt' ? 0.8 : 0)); g.lineTo(HX + 4.3, HY - 1.2 - (st === 'hurt' || down ? 0 : 0.5)); g.stroke(); g.lineCap = 'butt';
  // bouche
  if (st === 'hurt' || down) ell(HX + 3, HY + 3.6, 1.3, 0.9, '#5a1a1a', false);
  else { g.strokeStyle = S.skinD; g.lineWidth = 0.7; g.beginPath(); g.moveTo(HX + 1.8, HY + 3.4); g.quadraticCurveTo(HX + 3, HY + 3.9, HX + 4.2, HY + 3.3); g.stroke(); }

  switch (type) {
    case 'cogneur':
      g.beginPath(); g.moveTo(HX - 5.6, HY + 1.8); g.quadraticCurveTo(HX - 6.4, HY - 6.6, HX - 1, HY - 7.2); g.lineTo(HX + 1.2, HY - 8.3); g.lineTo(HX + 2.6, HY - 6.6);
      g.quadraticCurveTo(HX + 6.4, HY - 5.4, HX + 5.6, HY - 2.6); g.quadraticCurveTo(HX + 3, HY - 4.6, HX - 1, HY - 3.6); g.quadraticCurveTo(HX - 3.4, HY - 2, HX - 3.6, HY + 1.8); g.closePath();
      g.fillStyle = lg(0, HY - 8, 0, HY + 2, [[0, S.hairL], [1, S.hair]]); g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
      poly([[HX - 5.7, HY - 3.1], [HX + 5.9, HY - 3.3], [HX + 5.9, HY - 1.2], [HX - 5.7, HY - 1.1]], S.acc);
      limb([[HX - 5.4, HY - 2.2], [HX - 8.4, HY - 1.2], [HX - 11.4, HY + Math.sin(tick * 0.3) * 2]], 1.8, [S.acc, S.acc]);
      break;
    case 'vive':
      g.beginPath(); g.moveTo(HX - 5.6, HY + 4.4); g.quadraticCurveTo(HX - 6.8, HY - 7, HX, HY - 7.2); g.quadraticCurveTo(HX + 6.2, HY - 7, HX + 5.8, HY - 2.2);
      g.quadraticCurveTo(HX + 3.4, HY - 4.8, HX + 0.4, HY - 3.4); g.quadraticCurveTo(HX - 2.8, HY - 2.2, HX - 3.4, HY + 4.4); g.closePath();
      g.fillStyle = lg(0, HY - 7, 0, HY + 4, [[0, S.hairL], [1, S.hair]]); g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
      poly([[HX - 5.8, HY - 3.4], [HX + 5.8, HY - 3.6], [HX + 5.8, HY - 2.3], [HX - 5.8, HY - 2.1]], S.acc2);
      ell(HX - 6.4, HY - 5.4, 2.4, 2.6, S.hair);
      limb([[HX - 6.4, HY - 4.6], [HX - 10 - Math.sin(tick * 0.25) * 1.4, HY - 1.4], [HX - 11.5 + Math.sin(tick * 0.2 + 1) * 1.6, HY + 4.4]], 2.6, [S.hair, S.hairL]);
      ell(HX - 6.4, HY - 5.4, 1.2, 1.3, S.acc, false);
      break;
    case 'costaud':
      poly([[HX - 5.7, HY - 0.2], [HX - 5.4, HY - 5.6], [HX - 1, HY - 7], [HX + 4, HY - 6.2], [HX + 5.8, HY - 2.6], [HX + 3.8, HY - 3.6], [HX - 1, HY - 3.8], [HX - 3.6, HY - 2.4], [HX - 3.8, HY + 0.6]], lg(0, HY - 7, 0, HY, [[0, S.hairD || S.hair], [1, S.hair]]));
      g.fillStyle = 'rgba(20,12,8,.55)'; g.beginPath(); g.moveTo(HX - 1.8, HY + 3.2); g.quadraticCurveTo(HX + 0.6, HY + 6.4, HX + 4.2, HY + 4.4); g.quadraticCurveTo(HX + 5, HY + 3.4, HX + 3.8, HY + 2.8); g.quadraticCurveTo(HX + 2, HY + 4.4, HX - 0.6, HY + 3.4); g.fill();
      break;
    case 'papy':
      ell(HX - 4.6, HY - 0.6, 2.2, 3.4, S.hair); ell(HX - 1.6, HY - 5.6, 3.6, 1.3, S.hair);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(HX + 1, HY - 4.6, 2.6, 0.9, 0, 0, 7); g.fill();
      ell(HX + 3.4, HY + 2.8, 2.7, 1, '#f2f2f2', OL);
      g.strokeStyle = '#33343c'; g.lineWidth = 0.7; g.beginPath(); g.arc(HX + 2.9, HY + 0.1, 2.3, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(HX + 0.6, HY); g.lineTo(HX - 4.6, HY - 0.4); g.stroke();
      break;
    case 'thug':
      g.beginPath(); g.moveTo(HX - 5.5, HY + 0.6); g.quadraticCurveTo(HX - 6, HY - 6, HX, HY - 6.4); g.quadraticCurveTo(HX + 5.4, HY - 6.2, HX + 5.6, HY - 2.6); g.quadraticCurveTo(HX + 2, HY - 4, HX - 1.6, HY - 2.8); g.quadraticCurveTo(HX - 3.4, HY - 1.6, HX - 3.6, HY + 1); g.closePath();
      g.fillStyle = S.hair; g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
      g.strokeStyle = '#c04040'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(HX + 1.4, HY - 1.8); g.lineTo(HX + 2.3, HY + 1.4); g.stroke();
      ell(HX - 2.1, HY + 2.6, 0.9, 0.9, S.acc, false);
      g.fillStyle = 'rgba(30,20,20,.35)'; g.beginPath(); g.ellipse(HX + 2.8, HY + 4, 2.6, 1.2, 0, 0, 7); g.fill();
      break;
    case 'brute':
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(HX - 0.4, HY - 4.2, 3.4, 1.2, 0, 0, 7); g.fill();
      g.fillStyle = S.hair; g.beginPath(); g.moveTo(HX - 5.2, HY + 0.4); g.quadraticCurveTo(HX - 5.6, HY + 4.6, HX - 1.4, HY + 6.4); g.quadraticCurveTo(HX + 3, HY + 6.8, HX + 5.2, HY + 3); g.quadraticCurveTo(HX + 3, HY + 3.6, HX + 1, HY + 2.4); g.quadraticCurveTo(HX - 1, HY + 3.4, HX - 3, HY + 1); g.closePath(); g.fill();
      g.strokeStyle = OL; g.lineWidth = 1.1; g.beginPath(); g.moveTo(HX + 0.6, HY - 1.8); g.lineTo(HX + 4.6, HY - 1.2); g.stroke();
      break;
    case 'thrower':
      g.beginPath(); g.moveTo(HX - 7.4, HY + 8); g.quadraticCurveTo(HX - 8.4, HY - 6, HX - 1, HY - 7.6); g.quadraticCurveTo(HX + 6.6, HY - 7.4, HX + 6.4, HY - 2); g.quadraticCurveTo(HX + 3.6, HY - 4.8, HX - 0.4, HY - 3.6); g.quadraticCurveTo(HX - 3.6, HY - 1, HX - 3.4, HY + 6); g.closePath();
      g.fillStyle = lg(HX - 8, 0, HX + 6, 0, [[0, S.shirtD], [1, S.shirt]]); g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
      g.fillStyle = S.hair; g.fillRect(HX + 2.4, HY - 3, 3.4, 1.5);
      rrect(HX + 1.2, HY + 1.6, 5, 4.4, 1.2, '#202028');
      break;
    case 'boss':
      g.beginPath(); g.moveTo(HX - 5.6, HY + 0.4); g.lineTo(HX - 6.4, HY - 5.8); g.lineTo(HX - 3.4, HY - 3.4); g.lineTo(HX - 2.6, HY - 8.6); g.lineTo(HX - 0.4, HY - 4.4); g.lineTo(HX + 2, HY - 7.4); g.lineTo(HX + 3, HY - 3.4); g.quadraticCurveTo(HX + 6, HY - 3, HX + 5.8, HY - 1);
      g.quadraticCurveTo(HX + 2, HY - 3.2, HX - 1, HY - 2.4); g.quadraticCurveTo(HX - 3.4, HY - 1.4, HX - 3.6, HY + 1); g.closePath();
      g.fillStyle = S.hair; g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
      rrect(HX + 0.2, HY - 1.6, 6.4, 3.2, 1, '#111'); g.fillStyle = '#8ac8ff'; g.fillRect(HX + 2, HY - 1, 1.6, 0.7);
      break;
  }

  switch (kind) {
    case 'crs': case 'crsc': case 'crsgaz':
      poly([[HX - 6.3, HY + 0.4], [HX - 6.6, HY - 6.2], [HX - 0.6, HY - 8.6], [HX + 6, HY - 6.4], [HX + 6.6, HY - 2.2], [HX + 1, HY - 3], [HX - 3.6, HY - 2.6], [HX - 3.8, HY + 0.6]], '#16203f');
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(HX - 3, HY - 7, 5, 1.2);
      if (kind === 'crsgaz') {
        rrect(HX + 0.4, HY - 2.4, 6.8, 6.6, 2, '#2a2f38'); ell(HX + 4.6, HY + 3.6, 2.6, 2.2, '#4a505c'); g.fillStyle = '#9acd4a'; g.fillRect(HX + 3.8, HY + 2.8, 1.6, 1.6);
        g.fillStyle = '#b8c4d0'; g.fillRect(HX + 1.6, HY - 1.2, 2, 1.2); g.fillRect(HX + 4.4, HY - 1.2, 2, 1.2);
      } else { poly([[HX + 0.2, HY - 3.8], [HX + 7, HY - 3.4], [HX + 6.8, HY - 0.4], [HX + 0.4, HY - 0.6]], 'rgba(40,60,100,.85)'); }
      break;
    case 'aveugle':
      rrect(HX + 0.2, HY - 1.9, 6.8, 3.6, 1.3, '#0a0a12'); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(HX + 1.2, HY - 1.3, 1.6, 0.6);
      g.strokeStyle = '#0a0a12'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(HX + 0.2, HY - 0.6); g.lineTo(HX - 5, HY - 0.9); g.stroke();
      break;
    case 'ombre':
      poly([[HX - 6.2, HY + 1], [HX - 6.6, HY - 6.4], [HX, HY - 8.2], [HX + 5.6, HY - 6.2], [HX + 6, HY - 3], [HX + 1, HY - 2.9], [HX - 3.4, HY - 2.7], [HX - 3.8, HY + 1]], '#1c1e2c');
      poly([[HX - 0.5, HY + 1.5], [HX + 5.8, HY + 1.3], [HX + 5.4, HY + 4.2], [HX + 2.5, HY + 6], [HX - 3, HY + 5]], '#1c1e2c');
      limb([[HX - 5.6, HY - 2], [HX - 9, HY - 1 + Math.sin(tick * 0.3) * 1.6], [HX - 13, HY + 3 + Math.sin(tick * 0.22 + 1) * 2]], 2.4, [S.acc, S.acc]);
      break;
    case 'boxeur': poly([[HX - 5.8, HY - 3.2], [HX + 5.9, HY - 3.4], [HX + 5.9, HY - 2], [HX - 5.8, HY - 1.8]], S.acc); break;
    case 'medic':
      poly([[HX - 6, HY - 2.4], [HX - 5.8, HY - 6.6], [HX, HY - 8], [HX + 5.8, HY - 6.4], [HX + 6.4, HY - 3.2], [HX + 3, HY - 3.8], [HX - 3, HY - 3.4]], '#f4f4f8');
      g.fillStyle = S.acc; g.fillRect(HX + 1.2, HY - 6.8, 1.4, 3.8); g.fillRect(HX - 0.1, HY - 5.6, 4, 1.4);
      break;
    case 'marin':
      poly([[HX - 5.6, HY - 3.2], [HX - 5.2, HY - 6.4], [HX, HY - 7.4], [HX + 5.2, HY - 6.4], [HX + 6.6, HY - 3.2], [HX + 2, HY - 4.2], [HX - 2, HY - 4]], '#f4f4f8');
      g.fillStyle = S.acc; g.fillRect(HX - 5.4, HY - 4.8, 11.8, 1.3); ell(HX, HY - 7.6, 1.2, 1, S.acc, false);
      break;
    case 'soudeur':
      rrect(HX - 5.9, HY - 5.8, 12.4, 7.8, 2.4, '#3a3a44'); rrect(HX + 0.2, HY - 3.2, 6.2, 2.8, 0.8, '#0c1210');
      g.fillStyle = (tick >> 3) & 1 ? '#5affb0' : '#38d890'; g.fillRect(HX + 1, HY - 2.5, 4.6, 1);
      break;
    case 'gitan':
      rrect(HX + 0.2, HY - 2.2, 7.2, 3.6, 1.6, '#0a0a12'); g.fillStyle = 'rgba(120,170,255,.45)'; g.fillRect(HX + 1.2, HY - 1.7, 3, 0.8);
      g.strokeStyle = '#0a0a12'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(HX + 0.2, HY - 0.6); g.lineTo(HX - 5, HY - 0.9); g.stroke();
      g.fillStyle = '#2a2018'; g.beginPath(); g.moveTo(HX + 0.8, HY + 3.6); g.quadraticCurveTo(HX + 3.6, HY + 7.8, HX + 6.4, HY + 3.8); g.quadraticCurveTo(HX + 3.6, HY + 4.6, HX + 0.8, HY + 3.6); g.fill();
      break;
    case 'magicien':
      ell(HX - 0.3, HY - 5.6, 7.6, 1.8, '#16161e', OL); rrect(HX - 4.6, HY - 16.4, 9.2, 11, 1.4, '#16161e', OL);
      g.fillStyle = S.acc; g.fillRect(HX - 4.5, HY - 8.2, 9, 1.8);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(HX - 3, HY - 15.4, 1.3, 7);
      ell(HX + 3.8, HY + 2.9, 2.4, 0.9, '#2a1a28', false);
      break;
    case 'livreur':
      g.beginPath(); g.ellipse(HX - 0.4, HY - 3.6, 7.2, 5.2, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#1fb5a3'; g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
      g.fillStyle = '#e9fffb'; g.fillRect(HX - 1.2, HY - 8.6, 2.4, 4.6); g.fillStyle = '#0f6f64'; g.fillRect(HX + 1.8, HY - 3.8, 6, 1.3);
      break;
    case 'electricien':
      g.beginPath(); g.ellipse(HX - 0.2, HY - 4.4, 6.8, 4.6, 0, Math.PI, 0); g.closePath(); g.fillStyle = S.acc; g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
      g.fillStyle = shade(S.acc, -0.2); g.fillRect(HX - 6.8, HY - 4.6, 13.6, 1.5); g.fillRect(HX + 1.6, HY - 4.6, 6.4, 2.2);
      g.fillStyle = '#6a4a10'; g.fillRect(HX - 0.8, HY - 8.6, 1.6, 4);
      break;
    case 'garde':
      rrect(HX + 0.4, HY - 1.8, 6.2, 3, 0.9, '#08080e'); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(HX + 1.2, HY - 1.3, 1.6, 0.6);
      g.strokeStyle = S.acc; g.lineWidth = 0.7; g.beginPath(); g.moveTo(HX - 1.6, HY + 1); g.quadraticCurveTo(HX - 3.4, HY + 5, HX - 2.2, HY + 9); g.stroke();
      break;
    case 'thug': {
      const v = (e.slot | 0) % 3;
      if (v === 0) { poly([[HX - 5.8, HY - 2.4], [HX - 5.6, HY - 6.4], [HX, HY - 7.6], [HX + 5.6, HY - 6.2], [HX + 6, HY - 2.8], [HX + 1, HY - 3.4]], S.shirt); g.fillStyle = shade(S.shirt, -0.32); g.fillRect(HX - 5.8, HY - 3.8, 11.8, 1.5); }
      else if (v === 1) { poly([[HX - 5.8, HY - 3.6], [HX + 5.9, HY - 3.8], [HX + 5.9, HY - 2.2], [HX - 5.8, HY - 2]], S.acc); ell(HX - 6.4, HY - 2.6, 1.8, 2, S.acc); }
      else { poly([[HX - 5.6, HY - 2.6], [HX - 5.2, HY - 6.4], [HX + 1, HY - 7.4], [HX + 5.4, HY - 5.8], [HX + 5.6, HY - 2.8]], S.pants); poly([[HX + 2, HY - 3.8], [HX + 8, HY - 3.2], [HX + 7.6, HY - 2.1], [HX + 2, HY - 2.5]], shade(S.pants, 0.18)); }
      break;
    }
    case 'brute': poly([[HX - 5.8, HY - 3.4], [HX + 5.9, HY - 3.6], [HX + 5.9, HY - 2.3], [HX - 5.8, HY - 2.1]], S.acc); break;
    case 'thrower':
      g.fillStyle = '#1c1c24'; g.fillRect(HX - 5.8, HY - 3.4, 11.8, 1.4);
      ell(HX + 3, HY - 4.8, 2.3, 1.9, '#7fe8ff'); ell(HX - 0.6, HY - 4.8, 2.3, 1.9, '#7fe8ff'); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(HX + 2.2, HY - 5.6, 1, 0.7);
      break;
    case 'boss':
      if (LV.id === 1) { poly([[HX - 6.4, HY - 3], [HX - 6, HY - 5.8], [HX - 1, HY - 8.4], [HX + 5, HY - 6.6], [HX + 7.4, HY - 3.2], [HX + 2, HY - 4.2]], '#16264a'); poly([[HX + 2, HY - 4.4], [HX + 9, HY - 3.4], [HX + 8.4, HY - 2.4], [HX + 2, HY - 3.2]], '#0c1630'); g.fillStyle = '#f0c030'; g.fillRect(HX + 1.2, HY - 6.8, 2.4, 2.2); }
      else if (LV.id === 2) { g.beginPath(); g.ellipse(HX - 0.2, HY - 4.2, 6.8, 4, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#ffcc00'; g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke(); g.fillStyle = '#e0a800'; g.fillRect(HX - 6.8, HY - 4.4, 13.6, 1.4); ell(HX + 5.2, HY - 5.6, 1.7, 1.4, (tick >> 4) & 1 ? '#fff' : '#ffe9a0'); }
      else if (LV.id === 4) {
        poly([[HX - 5.8, HY - 0.5], [HX - 6, HY - 6.8], [HX - 1, HY - 9.4], [HX + 5.8, HY - 6.8], [HX + 6, HY - 2.4], [HX + 2.4, HY - 4.2], [HX - 3, HY - 3.4], [HX - 3.8, HY + 1]], S.hair);
        rrect(HX + 0.2, HY - 1.8, 6.6, 3.6, 1, S.skin, false); ell(HX + 3.1, HY - 0.2, 0.8, 0.9, '#1a1a2a', false); g.strokeStyle = S.hairD; g.lineWidth = 0.8; g.beginPath(); g.moveTo(HX + 0.8, HY - 2); g.lineTo(HX + 4.6, HY - 1.8); g.stroke();
        poly([[HX + 0.6, HY + 6.4], [HX + 3.4, HY + 6.4], [HX + 4.4, HY + 11], [HX + 2, HY + 12.4], [HX - 0.4, HY + 11]], S.acc);
      }
      else if (LV.id === 3) { g.fillStyle = '#ddd'; g.fillRect(HX + 4.2, HY + 3.2, 5, 1); g.fillStyle = (tick >> 3) & 1 ? '#ff7a30' : '#c04010'; g.fillRect(HX + 9.2, HY + 3.1, 1.2, 1.2); }
      break;
  }

  if (kind === 'livreur' && !down) {                     /* vélo : roues, cadre, guidon, sac de livraison */
    const wr = e.walk * 1.9 + (st === 'rush' ? tick * 0.8 : 0), cy0 = -6.6;
    for (const cx0 of [-10, 10]) {
      g.strokeStyle = OL; g.lineWidth = 2.1; g.beginPath(); g.arc(cx0, cy0, 6.6, 0, 7); g.stroke();
      g.strokeStyle = '#2c2f38'; g.lineWidth = 1.3; g.beginPath(); g.arc(cx0, cy0, 6.6, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(210,215,225,.75)'; g.lineWidth = 0.4;
      for (let k = 0; k < 4; k++) { const a2 = wr + k * Math.PI / 4; g.beginPath(); g.moveTo(cx0 + Math.cos(a2) * 5.6, cy0 + Math.sin(a2) * 5.6); g.lineTo(cx0 - Math.cos(a2) * 5.6, cy0 - Math.sin(a2) * 5.6); g.stroke(); }
    }
    g.strokeStyle = OL; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-10, cy0); g.lineTo(-2, -15); g.lineTo(7, -15.5); g.lineTo(10, cy0); g.moveTo(-2, -15); g.lineTo(0, cy0); g.lineTo(-10, cy0); g.stroke();
    g.strokeStyle = '#1fb5a3'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-10, cy0); g.lineTo(-2, -15); g.lineTo(7, -15.5); g.lineTo(10, cy0); g.moveTo(-2, -15); g.lineTo(0, cy0); g.lineTo(-10, cy0); g.stroke();
    g.strokeStyle = OL; g.lineWidth = 1.6; g.beginPath(); g.moveTo(7, -15.5); g.lineTo(8.6, -21); g.lineTo(12, -21.5); g.stroke();
    rrect(-3.6, -16.6, 5.6, 1.6, 0.6, '#1d2530');
  }
  if (kind === 'fauteuil' && !e.nochair) {
    const wr = e.walk * 1.7, cx0 = -1.5, cy0 = -9.2;
    g.strokeStyle = OL; g.lineWidth = 1.9; g.beginPath(); g.arc(cx0, cy0, 8.6, 0, 7); g.stroke();
    g.strokeStyle = '#8a909c'; g.lineWidth = 1.1; g.beginPath(); g.arc(cx0, cy0, 8.6, 0, 7); g.stroke();
    g.strokeStyle = '#5a5f6a'; g.lineWidth = 0.9; g.beginPath(); g.arc(cx0, cy0, 6.4, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(210,215,225,.8)'; g.lineWidth = 0.5;
    for (let k = 0; k < 6; k++) { const a2 = wr + k * Math.PI / 3; g.beginPath(); g.moveTo(cx0 + Math.cos(a2) * 6.2, cy0 + Math.sin(a2) * 6.2); g.lineTo(cx0 - Math.cos(a2) * 6.2, cy0 - Math.sin(a2) * 6.2); g.stroke(); }
    ell(cx0, cy0, 1.4, 1.4, '#c8ccd6');
    limb([[6, hipY + 3], [10.5, -3.4]], 1.2, ['#33353d', '#33353d']); ell(10.8, -2.6, 2.1, 2.1, '#2c2e35');
    rrect(7.6, -6.8, 5.4, 1.2, 0.5, '#33353d');
  }
  if (kind === 'livreur' && !down) {                     /* sac isotherme sur le dos */
    const bx = lean - 13, by = shY - 1;
    rrect(bx, by, 10, 11.5, 1.4, '#1fb5a3', OL); g.fillStyle = '#0f6f64'; g.fillRect(bx, by + 3.4, 10, 1.4);
    g.fillStyle = '#fff'; g.fillRect(bx + 3, by + 6.4, 4, 3); g.fillStyle = '#1fb5a3'; g.fillRect(bx + 4.1, by + 7.4, 1.8, 1.1);
  }
  if (kind === 'gitan' && !down) {
    g.strokeStyle = '#a07810'; g.lineWidth = 2; g.beginPath(); g.moveTo(lean - 3.6, shY + 0.5); g.quadraticCurveTo(lean + 1, shY + 9, lean + 5, shY + 0.8); g.stroke();
    g.strokeStyle = '#ffd84a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(lean - 3.6, shY + 0.5); g.quadraticCurveTo(lean + 1, shY + 9, lean + 5, shY + 0.8); g.stroke();
    ell(lean + 0.6, shY + 7.4, 1.5, 1.5, '#ffd84a', OL);
  }
  if (kind === 'magicien' && !down && st !== 'attack' && st !== 'special') {
    const wx = fhx + 8, wy = fhy - 6;
    g.strokeStyle = OL; g.lineWidth = 2; g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(wx, wy); g.stroke();
    g.strokeStyle = '#222'; g.lineWidth = 1; g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(wx, wy); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(wx - 2, wy + 1.4); g.lineTo(wx, wy); g.stroke();
  }
  if (!down && (kind === 'aveugle' || (kind === 'papy' && e.cane)) && st !== 'attack' && st !== 'special' && st !== 'roll') {
    if (kind === 'aveugle') {
      const sw2 = Math.sin(tick * 0.18) * 3, tx = fhx + 12 + sw2, ty2 = -1;
      g.strokeStyle = OL; g.lineWidth = 2; g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(tx, ty2); g.stroke();
      g.strokeStyle = '#f4f4f4'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(tx, ty2); g.stroke();
      g.strokeStyle = '#d83030'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(fhx + (tx - fhx) * 0.55, fhy + (ty2 - fhy) * 0.55); g.lineTo(fhx + (tx - fhx) * 0.75, fhy + (ty2 - fhy) * 0.75); g.stroke();
    } else {
      const gx = bhx + 3;
      g.strokeStyle = OL; g.lineWidth = 2.2; g.beginPath(); g.moveTo(bhx - 1.5, bhy - 3); g.quadraticCurveTo(bhx - 3, bhy - 6, bhx, bhy - 5.4); g.moveTo(bhx, bhy - 5); g.lineTo(gx, -0.5); g.stroke();
      g.strokeStyle = S.acc; g.lineWidth = 1.2; g.beginPath(); g.moveTo(bhx - 1.5, bhy - 3); g.quadraticCurveTo(bhx - 3, bhy - 6, bhx, bhy - 5.4); g.moveTo(bhx, bhy - 5); g.lineTo(gx, -0.5); g.stroke();
    }
  }
  if (kind === 'papy' && e.cane && !down && (st === 'attack' || st === 'special')) {
    let ang = -0.95;
    if (st === 'special') ang = e.t < 14 ? -2.0 : 0.7;
    else { const wa = HEROES.papy.atk[e.stage]; ang = e.t < wa.act[0] ? -2.1 : (e.t <= wa.act[1] ? -0.3 + 0.9 * (e.t - wa.act[0]) / Math.max(1, wa.act[1] - wa.act[0]) : 1.05); }
    drawWeapon('canne', fhx, fhy, ang);
  }
  /* --- bras avant (devant le corps) --- */
  drawArm(lean * 0.9 + 1, shY + 3, fhx, fhy, sleeveN, S.skin, armW, glvF);
  if (kind === 'crs' || kind === 'crsc' || kind === 'crsgaz') {
    g.strokeStyle = OL; g.lineWidth = 1.5; g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(fhx + 9, fhy - (st === 'attack' ? 0 : 7)); g.stroke();
    g.strokeStyle = '#222'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(fhx, fhy); g.lineTo(fhx + 9, fhy - (st === 'attack' ? 0 : 7)); g.stroke();
  }
  if ((kind === 'crs' || kind === 'crsc') && !down) {
    const sx2 = bhx + 4, sy2 = bhy - 13;
    rrect(sx2, sy2, 7, 27, 2.4, 'rgba(150,195,255,.5)', OL); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(sx2 + 1.2, sy2 + 2, 1.4, 12);
    g.fillStyle = '#1a2a55'; g.fillRect(sx2, sy2 + 11, 7, 2.6);
  }
  if (e.weapon && WEAPONS[e.weapon] && !down && !(e.wd <= 2 && (tick & 2))) {
    let ang = -0.95 + (moving ? sw * 0.12 : 0);
    const wa = st === 'attack' ? (isP ? HEROES[e.hero].atk[e.stage] : d.atk) : null;
    if (wa) {
      if (e.t < wa.act[0]) ang = -2.1; else if (e.t <= wa.act[1]) ang = -0.3 + 0.9 * (e.t - wa.act[0]) / Math.max(1, wa.act[1] - wa.act[0]); else ang = 1.05;
    } else if (st === 'tele') ang = -2.1; else if (st === 'hurt') ang = 1.2;
    if (WEAPONS[e.weapon].gun && !wa && st !== 'hurt' && st !== 'tele') ang = -0.04;
    drawWeapon(e.weapon, fhx, fhy, ang);
    ell(fhx, fhy, armW * 0.72 + 0.5, armW * 0.72 + 0.5, S.skin);
  }
  if (bottle) { rrect(fhx - 1.6, fhy - 10, 3.4, 9.5, 1.2, S.acc); ell(fhx, fhy - 10.4, 1, 1.4, '#ddd'); }
  if (spin) {
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 0.9;
    g.beginPath(); g.ellipse(0, -16, 25, 9, 0, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(0, -26, 21, 6, 0, 0, 7); g.stroke();
  }
  if (ring > 0) { g.strokeStyle = 'rgba(' + (kind === 'medic' ? '120,255,150' : '255,230,160') + ',' + Math.max(0, 0.85 - ring / 60) + ')'; g.lineWidth = 1.8; g.beginPath(); g.ellipse(6, -2, ring, ring * 0.3, 0, 0, 7); g.stroke(); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (fl) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = e.shock > 0 ? 'rgba(140,235,255,.85)' : 'rgba(255,255,255,.8)'; g.fillRect(RX * SS, RY * SS, RW * SS, RH * SS); g.globalCompositeOperation = 'source-over'; }
  g = mainG;
  if (isP && e.kind === 'p' && !e.out && e.sp >= HEROES[e.hero].cost) {            // ultime prêt : le personnage s'illumine
    const pl = 0.5 + 0.5 * Math.sin(tick * 0.2), cy = sy - 24 * s, rr = (30 + pl * 6) * s;
    const gr = g.createRadialGradient(sx, cy, 4 * s, sx, cy, rr);
    gr.addColorStop(0, 'rgba(255,225,110,' + (0.42 + pl * 0.25) + ')'); gr.addColorStop(1, 'rgba(255,200,60,0)');
    g.fillStyle = gr; g.fillRect(sx - rr, cy - rr, rr * 2, rr * 2);
    g.fillStyle = 'rgba(255,235,150,' + (0.5 + pl * 0.4) + ')'; g.beginPath(); g.ellipse(sx, sy + 1, (13 + pl * 3) * s, 3.4 * s, 0, 0, 7); g.fill();
    for (let k = 0; k < 3; k++) { const ph = ((tick * 0.8 + k * 23) % 46), px = sx + Math.sin(k * 2.4 + tick * 0.05) * 11 * s; g.fillStyle = 'rgba(255,240,170,' + (1 - ph / 46) + ')'; g.fillRect(Math.round(px), Math.round(sy - 6 - ph), 2, 2); }
  }
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(sprC, RX * SS, RY * SS, RW * SS, RH * SS, Math.round(sx - 64 * s + RX * s), Math.round(sy - 100 * s + RY * s), Math.round(RW * s), Math.round(RH * s));
  g.imageSmoothingEnabled = false;
  if (e.shock > 0) {
    g.strokeStyle = '#c8f6ff'; g.lineWidth = 1;
    for (let k = 0; k < 4; k++) { let x = sx + (Math.random() - 0.5) * 14, y = sy - 2; g.beginPath(); g.moveTo(x, y); for (let s2 = 0; s2 < 5; s2++) { x += (Math.random() - 0.5) * 10; y -= 5 + Math.random() * 6; g.lineTo(x, y); } g.stroke(); }
  }
  if (isP && e.name) {
    const ny = sy - Math.round(47 * s), col = ['#7cc8ff', '#ffb060', '#8aef8a', '#ff8ad8'][(e.slot | 0) & 3];
    g.font = 'bold 7px monospace'; g.textAlign = 'center';
    const tw = Math.ceil(g.measureText(e.name).width) + 6;
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(sx - tw / 2, ny - 7, tw, 10);
    g.fillStyle = col; g.fillText(e.name, sx, ny + 1);
    /* petite barre de vie juste sous le pseudo */
    const r = Math.max(0, Math.min(1, e.hp / e.maxhp)), bw = 20, bx = Math.round(sx - bw / 2), by = ny + 4;
    g.fillStyle = '#000'; g.fillRect(bx - 1, by - 1, bw + 2, 4); g.fillStyle = '#3a1a1a'; g.fillRect(bx, by, bw, 2);
    g.fillStyle = r > 0.5 ? '#4ccf4c' : (r > 0.25 ? '#e0c030' : '#e03030'); g.fillRect(bx, by, Math.round(bw * r), 2);
  }
  if (!isP && e.kind === 'e' && e.type !== 'boss' && !e.dying && T[e.type]) {   /* méchants : nom puis petite barre de vie au-dessus de la tête */
    const ny = sy - Math.round(47 * s), nm = T[e.type].name;
    g.font = 'bold 6px monospace'; g.textAlign = 'center';
    const tw = Math.ceil(g.measureText(nm).width) + 5;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(sx - tw / 2, ny - 6, tw, 8);
    g.fillStyle = '#fda'; g.fillText(nm, sx, ny);
    const r = Math.max(0, Math.min(1, e.hp / e.maxhp)), bw = 18, bx = Math.round(sx - bw / 2), by = ny + 3;
    g.fillStyle = '#000'; g.fillRect(bx - 1, by - 1, bw + 2, 4); g.fillStyle = '#3a1a1a'; g.fillRect(bx, by, bw, 2);
    g.fillStyle = '#e0663a'; g.fillRect(bx, by, Math.round(bw * r), 2);
  }
  if (!isP && (st === 'tele' || st === 'bspec') && !(st === 'bspec' && e.z > 2)) {
    const my = sy - Math.round(56 * s);
    g.fillStyle = OL; g.fillRect(sx - 3, my - 1, 6, 12);
    g.fillStyle = '#ffd34d'; g.fillRect(sx - 2, my, 4, 7); g.fillRect(sx - 2, my + 8, 4, 2);
  }
}

