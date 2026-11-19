'use strict';
/* ====================================================================
   PERSONNAGES : rendu vectoriel (héros et ennemis)
   ==================================================================== */
/* ---------- personnages : rendu vectoriel lissé (haute définition) ----------
   Chaque personnage est dessiné en vectoriel (courbes, dégradés, contours fins) dans un canvas
   suréchantillonné (SS fois), puis réduit en douceur sur le jeu, qui tourne lui-même en 3x. */
const SS = 4, OL = '#1a1426', LW = 0.75;
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; gg *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; }
  return '#' + [r, gg, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
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
const sprC = document.createElement('canvas');
sprC.width = 128 * SS;
sprC.height = 128 * SS;
const sg = sprC.getContext('2d');
sg.imageSmoothingEnabled = true;
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
function drawArm(sx, sy, hx, hy, sleeve, skin, w, glove) {
  const dist = Math.hypot(hx - sx, hy - sy), bend = Math.max(0, 11 - dist) * 0.5;
  const ex = (sx + hx) / 2 - bend * 0.4, ey = (sy + hy) / 2 + bend;
  limb([[sx, sy], [ex, ey], [hx, hy]], w, [sleeve, skin]);
  ell(hx, hy, w * 0.72 + 0.5, w * 0.72 + 0.5, glove || skin);
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
function drawChar(e) {
  const isP = e.kind === 'p', d = isP ? HEROES[e.hero] : T[e.type], s = d.sc || 1, S = pal(d), type = isP ? e.hero : e.type;
  const sx = Math.round(e.x - cam), sy = Math.round(e.y - e.z);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath(); g.ellipse(sx, Math.round(e.y) + 1, 12 * s * (1 - Math.min(0.5, e.z / 80)), 3 * s, 0, 0, 7); g.fill();
  if (e.dying && e.st === 'down' && e.lie > 20 && (e.lie & 4)) return;
  if (isP && e.inv > 0 && (tick & 4)) return;
  const fl = e.flash > 0 && (e.flash & 2);
  const mainG = g;
  g = sg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 128 * SS, 128 * SS);
  g.setTransform(SS, 0, 0, SS, 64 * SS, 100 * SS); g.scale(e.face, 1);
  const st = e.st, down = st === 'down';
  if (down) { g.translate(0, -6); g.transform(0, -1, 1, 0, 0, 0); }

  /* --- pose --- */
  const air = e.z > 2 && !down;
  const moving = (isP && e.mv) || (!isP && (e.mv || st === 'charge'));
  const ph = e.walk, sw = Math.sin(ph), cw = Math.cos(ph);
  const bob = ((tick + (e.x | 0)) >> 4) & 1;
  let lean = 0, hipY = -14, hdx = 0, ffx = 4, ffy = 0, bfx = -4, bfy = 0;
  let fhx = 9, fhy = -27, bhx = 5, bhy = -24, shut = false, spin = false, bottle = false, kickLeg = false, ring = 0;
  if (down) { ffx = 3; ffy = -1; bfx = -5; fhx = 6; fhy = -20; bhx = -6; bhy = -20; shut = true; }
  else if (st === 'hurt') { lean = -3; hdx = -2; ffx = 5; bfx = -6; fhx = 3; fhy = -21; bhx = -4; bhy = -20; shut = true; }
  else if (air) {
    ffx = 5; ffy = -8; bfx = -3; bfy = -5; hipY = -15; fhx = 8; fhy = -30; bhx = 4; bhy = -27;
    if (isP && e.kick) { ffx = 19; ffy = -17; bfx = -4; bfy = -7; lean = -2; kickLeg = true; fhx = -4; fhy = -22; bhx = -8; bhy = -24; }
  } else if (isP && st === 'special' && e.hero === 'costaud') {
    if (e.t < 12) { lean = -2; fhx = 4; fhy = -44; bhx = -1; bhy = -43; ffx = 4; bfx = -5; }
    else { lean = 6; hipY = -12; fhx = 14; fhy = -8; bhx = 10; bhy = -8; ffx = 7; bfx = -5; ring = (e.t - 12) * 3.2; }
  } else if (isP && st === 'special') { spin = true; ffx = 8; bfx = -8; fhx = 17; fhy = -26; bhx = -17; bhy = -26; }
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
  } else if (!isP && st === 'tele') {
    lean = -2; ffx = 3; bfx = -5;
    if (e.mode === 'charge') { lean = 3; hipY = -12; ffx = 6; bfx = -6; fhx = -6; fhy = -24; bhx = -9; bhy = -22; }
    else if (e.mode === 'throw') { fhx = 2; fhy = -40; bhx = 6; bhy = -25; bottle = !e.weapon; }
    else { fhx = -4; fhy = -39; bhx = 6; bhy = -26; if (e.type === 'brute') { bhx = -1; bhy = -40; } }
  } else if (!isP && st === 'attack') {
    const a = d.atk;
    if (e.t < a.act[0]) { fhx = -3; fhy = -36; lean = -2; ffx = 3; bfx = -5; }
    else if (e.t <= a.act[1]) { fhx = a.reach - 2; fhy = e.type === 'brute' ? -20 : -28; lean = e.type === 'brute' ? 5 : 3; ffx = 8; bfx = -5; bhx = 4; bhy = -23; }
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
    else { fhx = 3 - sw * 5; fhy = -21; bhx = 1 + sw * 5; bhy = -21; }
  } else {
    hipY = -14 - bob; fhy -= bob; bhy -= bob;
    if (!isP) { fhx = 6; fhy = -24 - bob; bhx = 3; bhy = -22 - bob; }
  }


  /* --- dimensions du tronc selon le personnage --- */
  const shY = hipY - 14;
  const tw = { cogneur: [6.2, 5.2], vive: [5.2, 4.2], costaud: [8, 6.6], thug: [5.8, 4.8], brute: [8, 6.4], thrower: [5.8, 5.2], boss: [6.4, 5.8] }[type];
  const hx = lean + hdx, hy = shY - 11 + (st === 'hurt' ? 1 : 0);
  const armW = (type === 'brute' || type === 'costaud') ? 4.4 : 3.4;
  const bare = type === 'thug' || type === 'brute' || type === 'vive' || type === 'costaud';
  const sleeveN = bare ? S.skin : S.shirt, sleeveF = bare ? S.skinD : S.shirtD;
  const armColN = type === 'vive' ? S.skin : S.skin;

  /* --- bras et jambes arrière --- */
  drawArm(lean * 0.9 - 2, shY + 3, bhx, bhy, sleeveF, S.skinD, armW);
  drawLeg(-1, hipY, bfx, bfy, S.pantsD, shade(S.shoe, -0.25), S.acc, type === 'vive' ? S.skinD : undefined);
  drawLeg(1, hipY, ffx, ffy, S.pants, S.shoe, S.acc, type === 'vive' ? S.skin : undefined);

  /* --- pans du manteau (chef) --- */
  if (type === 'boss') {
    const fl2 = lean > 2 ? 3 : 0, wv = Math.sin(tick * 0.2) * 1.2;
    poly([[-6 - fl2 - wv, hipY - 2], [7, hipY - 2], [8 + 1, hipY + 9], [2, hipY + 11.5], [-4 - wv, hipY + 10], [-9 - fl2 - wv, hipY + 11]], lg(-9, hipY, 8, hipY + 10, [[0, S.shirtD], [1, S.shirt]]));
    g.strokeStyle = S.acc; g.lineWidth = 1.2; g.beginPath(); g.moveTo(3.5, hipY - 1); g.lineTo(4.5, hipY + 10.5); g.stroke();
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
  g.restore();
  torsoPath(); g.lineWidth = LW; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
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

  /* --- bras avant (devant le corps) --- */
  drawArm(lean * 0.9 + 1, shY + 3, fhx, fhy, sleeveN, S.skin, armW);
  if (e.weapon && WEAPONS[e.weapon] && !down && !(e.wd <= 2 && (tick & 2))) {
    let ang = -0.95 + (moving ? sw * 0.12 : 0);
    const wa = st === 'attack' ? (isP ? HEROES[e.hero].atk[e.stage] : d.atk) : null;
    if (wa) {
      if (e.t < wa.act[0]) ang = -2.1; else if (e.t <= wa.act[1]) ang = -0.3 + 0.9 * (e.t - wa.act[0]) / Math.max(1, wa.act[1] - wa.act[0]); else ang = 1.05;
    } else if (st === 'tele') ang = -2.1; else if (st === 'hurt') ang = 1.2;
    drawWeapon(e.weapon, fhx, fhy, ang);
    ell(fhx, fhy, armW * 0.72 + 0.5, armW * 0.72 + 0.5, S.skin);
  }
  if (bottle) { rrect(fhx - 1.6, fhy - 10, 3.4, 9.5, 1.2, S.acc); ell(fhx, fhy - 10.4, 1, 1.4, '#ddd'); }
  if (spin) {
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 0.9;
    g.beginPath(); g.ellipse(0, -16, 25, 9, 0, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(0, -26, 21, 6, 0, 0, 7); g.stroke();
  }
  if (ring > 0) { g.strokeStyle = 'rgba(255,230,160,' + Math.max(0, 0.85 - ring / 60) + ')'; g.lineWidth = 1.8; g.beginPath(); g.ellipse(6, -2, ring, ring * 0.3, 0, 0, 7); g.stroke(); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (fl) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, 0, 128 * SS, 128 * SS); g.globalCompositeOperation = 'source-over'; }
  g = mainG;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(sprC, Math.round(sx - 64 * s), Math.round(sy - 100 * s), Math.round(128 * s), Math.round(128 * s));
  g.imageSmoothingEnabled = false;
  if (!isP && st === 'tele') {
    const my = sy - Math.round(56 * s);
    g.fillStyle = OL; g.fillRect(sx - 3, my - 1, 6, 12);
    g.fillStyle = '#ffd34d'; g.fillRect(sx - 2, my, 4, 7); g.fillRect(sx - 2, my + 8, 4, 2);
  }
}
