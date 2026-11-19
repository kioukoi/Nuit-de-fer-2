'use strict';
/* ====================================================================
   ARMES : données, bonus de coup, dessin (en main et au sol), chute
   ==================================================================== */
const WEAPONS = {
  tuyau: { name: 'TUYAU', reach: 14, mul: 1.7, uses: 10 },
  batte: { name: 'BATTE', reach: 12, mul: 2.0, uses: 8 },
  couteau: { name: 'COUTEAU', reach: 5, mul: 1.5, uses: 12 }
};
const WKEYS = ['tuyau', 'batte', 'couteau'];
function withW(att, a) {
  const w = att.weapon && WEAPONS[att.weapon];
  if (!w) return a;
  const m = att.kind === 'e' ? 1 + (w.mul - 1) * 0.6 : w.mul;
  return Object.assign({}, a, { reach: a.reach + w.reach, dmg: Math.round(a.dmg * m) });
}
function dropWeapon(b, hitX) {
  if (!b.wtype || b.spent) return;
  b.spent = true;
  const wd = b.wd - (hitX !== undefined ? 3 : 0);
  if (wd > 0) IT.push({ x: clamp(hitX !== undefined ? hitX : b.x, cam + 12, cam + W - 12), y: clamp(b.y, Y0, Y1), type: b.wtype, weapon: true, wd, got: false, ttl: 720 });
  else { SFX.brk(); FX.push({ x: b.x, y: b.y, z: b.z, t: 0, life: 14, big: true }); }
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
  } else {
    rrect(-3.5, -1.1, 6, 2.2, 0.9, '#3a2a20');
    g.beginPath(); g.moveTo(2.2, -1.3); g.lineTo(11, -0.8); g.quadraticCurveTo(13.6, 0.1, 12.2, 0.9); g.lineTo(2.2, 1.3); g.closePath();
    g.fillStyle = lg(0, -1.3, 0, 1.3, [[0, '#f2f6fa'], [1, '#aab4be']]); g.fill(); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
  }
  g.restore();
}
function drawWeaponGround(name) {
  g.lineJoin = 'round';
  if (name === 'tuyau') { g.fillStyle = '#8a9099'; g.strokeStyle = OL; g.lineWidth = 0.8; g.beginPath(); g.roundRect(0, -1.6, 19, 3.2, 1.4); g.fill(); g.stroke(); g.fillStyle = '#c9ced6'; g.fillRect(1, -1, 17, 0.9); }
  else if (name === 'batte') { g.fillStyle = '#b9803f'; g.strokeStyle = OL; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -1.1); g.lineTo(10, -1.5); g.quadraticCurveTo(17, -3.2, 19, -2); g.quadraticCurveTo(20, 0, 19, 2); g.quadraticCurveTo(17, 3.2, 10, 1.5); g.lineTo(0, 1.1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#222'; g.fillRect(0.5, -1, 4, 2); }
  else { g.fillStyle = '#3a2a20'; g.fillRect(0, -1.1, 5, 2.2); g.fillStyle = '#dfe6ee'; g.strokeStyle = OL; g.lineWidth = 0.7; g.beginPath(); g.moveTo(5, -1.2); g.lineTo(13, -0.7); g.quadraticCurveTo(15.2, 0.1, 14, 0.9); g.lineTo(5, 1.2); g.closePath(); g.fill(); g.stroke(); }
}
