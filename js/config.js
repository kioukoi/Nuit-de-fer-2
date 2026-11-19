'use strict';
/* ====================================================================
   NUIT DE FER — prototype d'un beat'em up à défilement horizontal
   3 héros, 1 niveau, 3 types d'ennemis, 1 boss, 1 ou 2 joueurs en local.
   ==================================================================== */
const W = 480, H = 270, LEN = 2400, Y0 = 158, Y1 = 254;
const RS = 3;
const cv = document.getElementById('c');
let g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
cv.addEventListener('pointerdown', () => { cv.focus(); unlockAudio(); });

