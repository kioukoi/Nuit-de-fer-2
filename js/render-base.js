'use strict';
/* ====================================================================
   RENDU
   ==================================================================== */
function hash(n) {
  n = Math.imul(n ^ 61, 0x45d9f3b); n ^= n >>> 16; n = Math.imul(n, 0x45d9f3b); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
const skyG = g.createLinearGradient(0, 0, 0, 150);
skyG.addColorStop(0, '#0e0b24'); skyG.addColorStop(1, '#43275a');

function drawBG(c) {
  g.fillStyle = skyG; g.fillRect(0, 0, W, 150);
  g.fillStyle = '#e8e0c0';
  for (let i = 0; i < 36; i++) g.fillRect(Math.floor(hash(i + 900) * W), Math.floor(hash(i + 1300) * 100), 1, 1);
  g.fillStyle = '#f2e9c8'; g.beginPath(); g.arc(390, 42, 17, 0, 7); g.fill();
  g.fillStyle = '#d8cfa8'; g.fillRect(384, 38, 5, 4); g.fillRect(395, 48, 4, 3);
  // fond lointain
  const cf = c * 0.15;
  g.fillStyle = '#1d1a3a';
  for (let i = Math.floor(cf / 40) - 1; i <= Math.floor((cf + W) / 40) + 1; i++) {
    const h = 50 + hash(i) * 60;
    g.fillRect(Math.round(i * 40 - cf), 150 - h, 38, h);
  }
  // immeubles
  const cm = c * 0.4;
  for (let i = Math.floor(cm / 64) - 1; i <= Math.floor((cm + W) / 64) + 1; i++) {
    const bh = 70 + hash(i + 500) * 60, bx = Math.round(i * 64 - cm);
    g.fillStyle = '#2a2548'; g.fillRect(bx, 150 - bh, 62, bh);
    for (let j = 0, wy = 150 - bh + 8; wy < 140; j++, wy += 12) {
      for (let k = 0; k < 4; k++) {
        g.fillStyle = hash(i * 97 + j * 13 + k) > 0.62 ? '#f4d27a' : '#1d1936';
        g.fillRect(bx + 6 + k * 14, wy, 7, 7);
      }
    }
  }
  // trottoir et route
  g.fillStyle = '#4a4658'; g.fillRect(0, 150, W, 28);
  g.fillStyle = '#3c394a';
  for (let k = Math.floor(c / 48) - 1; k <= Math.floor((c + W) / 48) + 1; k++) g.fillRect(Math.round(k * 48 - c), 150, 1, 28);
  g.fillStyle = '#6a6678'; g.fillRect(0, 177, W, 2);
  g.fillStyle = '#2a2a36'; g.fillRect(0, 179, W, H - 179);
  g.fillStyle = '#7d7a58';
  for (let k = Math.floor(c / 48) - 1; k <= Math.floor((c + W) / 48) + 1; k++) g.fillRect(Math.round(k * 48 - c), 222, 24, 2);
  // lampadaires
  for (let k = Math.floor(c / 320) - 1; k <= Math.floor((c + W) / 320) + 1; k++) {
    const lx = Math.round(k * 320 + 200 - c);
    g.fillStyle = '#555'; g.fillRect(lx, 100, 3, 52);
    g.fillStyle = '#ffd27a'; g.fillRect(lx - 4, 98, 11, 4);
    g.globalAlpha = 0.13; g.beginPath(); g.arc(lx + 1, 106, 36, 0, 7); g.fill(); g.globalAlpha = 1;
  }
}

function txt(s, x, y, size, col, al) {
  g.font = 'bold ' + size + 'px monospace'; g.textAlign = al || 'left';
  g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1);
  g.fillStyle = col; g.fillText(s, x, y);
}

