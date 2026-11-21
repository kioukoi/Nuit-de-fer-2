/* ---------- audio (Web Audio, bruitages synthétiques) ---------- */
let AC = null;
function unlockAudio() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
/* Sons : synthèse en couches (impact grave + craquement filtré + souffle), sans aucun fichier audio.
   IMPORTANT : l'audio n'utilise jamais le générateur aléatoire de la simulation (sinon désynchro en ligne). */
let MASTER = null, NBUF = null, MUS = null, musicOn = true, oldM = false, mNext = 0, mStep = 0;
let BUSOVR = null;
function out() {
  if (BUSOVR) return BUSOVR;
  if (!MASTER) {
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.12;
    MASTER = AC.createGain(); MASTER.gain.value = 0.9;
    MASTER.connect(comp); comp.connect(AC.destination);
  }
  return MASTER;
}
function nbuf() {
  if (!NBUF) {
    NBUF = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = NBUF.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return NBUF;
}
const jit = (v, p) => v * (1 + (Math.random() * 2 - 1) * p);
/* tone : oscillateur avec attaque courte et chute exponentielle, glissando facultatif */
function tone(f, d, type, v, slide, delay) {
  if (REPLAY || !AC || (!sfxOn && !BUSOVR)) return;
  try {
    const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(v || 0.05, t + 0.004);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(gn); gn.connect(out());
    o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* ignoré */ }
}
/* nz : bruit filtré (type, fréquence de départ -> fin), enveloppe percussive */
function nz(d, v, ftype, f0, f1, q, delay) {
  if (REPLAY || !AC || (!sfxOn && !BUSOVR)) return;
  try {
    const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
    s.buffer = nbuf(); s.loop = true;
    fl.type = ftype; fl.Q.value = q || 0.8;
    fl.frequency.setValueAtTime(f0, t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + d);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(v, t + 0.003);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(gn); gn.connect(out());
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  } catch (e) { /* ignoré */ }
}
/* thump : impact grave (sinus qui chute de f0 à f1) */
function thump(f0, f1, d, v, delay) { tone(f0, d, 'sine', v, f1 - f0, delay); }
const SFX = {
  hit() { const k = jit(1, 0.12); thump(170 * k, 55, 0.11, 0.5); nz(0.07, 0.35, 'lowpass', 2600 * k, 500, 0.7); nz(0.025, 0.2, 'bandpass', 3200, 2000, 1.2); },
  big() { const k = jit(1, 0.08); thump(130 * k, 32, 0.28, 0.8); nz(0.22, 0.45, 'lowpass', 1500, 180, 0.7); nz(0.04, 0.3, 'bandpass', 2600, 1400, 1.1); tone(70, 0.2, 'triangle', 0.12, -25); },
  whoosh() { nz(0.16, 0.12, 'bandpass', jit(500, 0.15), jit(2600, 0.15), 1.4); },
  jump() { nz(0.12, 0.07, 'bandpass', 300, 900, 1.0); thump(120, 200, 0.08, 0.12); },
  pick() { tone(880, 0.22, 'triangle', 0.1, 0); tone(1320, 0.3, 'sine', 0.09, 0, 0.07); tone(1760, 0.35, 'sine', 0.04, 0, 0.07); },
  brk() { thump(110, 50, 0.16, 0.5); nz(0.1, 0.35, 'bandpass', 1400, 600, 1.0); for (let i = 0; i < 4; i++) nz(0.03, 0.25, 'bandpass', jit(2400, 0.4), 1200, 2.0, 0.03 + i * 0.045); },
  special() { nz(0.45, 0.22, 'bandpass', 250, 3200, 1.6); thump(90, 40, 0.4, 0.6); tone(220, 0.4, 'sawtooth', 0.05, 300); tone(330, 0.4, 'triangle', 0.05, 440, 0.03); },
  ko() { thump(150, 38, 0.45, 0.8); nz(0.3, 0.3, 'lowpass', 1200, 150, 0.7); tone(240, 0.5, 'triangle', 0.08, -170); },
  zap() { nz(0.35, 0.3, 'highpass', 2200, 6500, 0.7); tone(95, 0.3, 'sawtooth', 0.12, -30); tone(1400, 0.12, 'square', 0.03, -900); },
  steam() { nz(0.4, 0.18, 'highpass', 3000, 1500, 0.6); },
  move() { tone(700, 0.05, 'triangle', 0.05, 0); },
  shot() { const k = jit(1, 0.06); nz(0.09, 0.55, 'bandpass', 3800 * k, 900, 0.8); thump(260 * k, 60, 0.1, 0.5); nz(0.22, 0.12, 'lowpass', 1400, 300, 0.6, 0.02); },
  smg() { const k = jit(1, 0.1); nz(0.05, 0.4, 'bandpass', 3400 * k, 1200, 0.9); thump(220 * k, 80, 0.05, 0.35); },
  boom() { thump(95, 24, 0.55, 0.95); nz(0.6, 0.6, 'lowpass', 1800, 120, 0.6); nz(0.12, 0.35, 'bandpass', 2400, 600, 1.0); tone(48, 0.5, 'sawtooth', 0.1, -20, 0.02); },
  thunder() { nz(0.9, 0.5, 'lowpass', 700, 90, 0.5, 0.12); thump(60, 28, 0.7, 0.6, 0.12); nz(0.18, 0.35, 'highpass', 3000, 7000, 0.7); },
  lvl() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.1, 0, i * 0.07)); tone(1568, 0.5, 'sine', 0.05, 0, 0.3); },
  tick() { tone(1200 + Math.random() * 200, 0.025, 'square', 0.015, 0); },
  vox(sc, ko) { const f = Math.max(70, 190 / (sc || 1)) * jit(1, 0.12); tone(f, ko ? 0.3 : 0.13, 'sawtooth', ko ? 0.05 : 0.04, -f * 0.4); nz(ko ? 0.2 : 0.09, 0.07, 'bandpass', f * 4, f * 2, 1.2); },
  go() { tone(660, 0.12, 'square', 0.04, 0); tone(880, 0.16, 'square', 0.04, 0, 0.1); tone(1320, 0.22, 'triangle', 0.05, 0, 0.2); },
  roar() { thump(70, 30, 0.9, 0.7); tone(90, 0.8, 'sawtooth', 0.09, -40); tone(135, 0.8, 'sawtooth', 0.05, -60, 0.03); nz(0.8, 0.28, 'bandpass', 500, 160, 1.0); },
  bell() { tone(1760, 0.5, 'sine', 0.08, 0); tone(2349, 0.45, 'sine', 0.05, 0, 0.01); tone(1760, 0.4, 'sine', 0.06, 0, 0.16); }
};


/* ---------- musique d'ambiance : boucle synthétique (La mineur, 96 bpm), batterie quand un combat est en cours ---------- */
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], BASSN = [45, 41, 36, 43];
let MTR = 0, BPM = 96;
const mf = n => 440 * Math.pow(2, (n + MTR - 69) / 12);
function mVoice(dl, f, d, type, v, att, lp) {
  try {
    const t = AC.currentTime + dl, o = AC.createOscillator(), gn = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(v, t + att);
    gn.gain.setValueAtTime(v, t + Math.max(att, d * 0.55));
    gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let last = o;
    if (lp) { const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); last = fl; }
    last.connect(gn); gn.connect(out());
    o.start(t); o.stop(t + d + 0.05);
  } catch (e) { /* ignoré */ }
}
/* un style musical par niveau : accords, basse, motif de la mélodie (indices dans l'accord, -1 = silence), timbres et batterie ; plus intense et plus rapide pendant un boss */
const MSTY = {
  0: { ch: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bass: [45, 41, 36, 43], lead: [0, 1, 2, 1, 2, 1, 0, 2], dr: 'rock' },
  1: { ch: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], bass: [38, 34, 41, 36], lead: [0, 2, 1, 2, 0, 2, 1, -1], dr: 'half', lt: 'triangle' },
  2: { ch: [[52, 55, 59], [52, 55, 59], [48, 52, 55], [50, 54, 57]], bass: [40, 40, 36, 38], lead: [0, -1, 0, -1, 2, -1, 1, -1], dr: 'indus', lt: 'square', lv: 0.02, llp: 1400, pad: 'sawtooth' },
  3: { ch: [[48, 51, 55], [44, 48, 51], [51, 55, 58], [46, 50, 53]], bass: [36, 32, 39, 34], lead: [0, 1, 2, 1, 0, 1, 2, 1], dr: 'rock', lt: 'triangle' },
  4: { ch: [[55, 58, 62], [51, 55, 58], [46, 50, 53], [53, 57, 60]], bass: [43, 39, 34, 41], lead: [2, -1, 2, 2, -1, 1, -1, 0], dr: 'march', lt: 'square', lv: 0.022, llp: 1800 },
  5: { ch: [[57, 60, 64], [46, 50, 53], [57, 60, 64], [52, 56, 59]], bass: [33, 34, 33, 40], lead: [0, -1, -1, 1, -1, -1, 2, -1], dr: 'half', lv: 0.04 },
  6: { ch: [[50, 53, 57], [55, 59, 62], [48, 52, 55], [57, 61, 64]], bass: [38, 43, 36, 45], lead: [0, 2, 1, 2, 0, 1, 2, 1], dr: 'swing', lt: 'triangle' },
  7: { ch: [[57, 60, 64], [57, 60, 64], [55, 59, 62], [53, 57, 60]], bass: [33, 33, 31, 29], lead: [0, 0, 1, 0, 2, 0, 1, 0], dr: 'train', lt: 'square', lv: 0.02, llp: 1600 },
  8: { ch: [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]], bass: [36, 43, 45, 41], lead: [0, 2, 1, 2, 2, 1, 0, 1], dr: 'rock', lt: 'square', lv: 0.022, llp: 2200 },
  9: { ch: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [57, 61, 64]], bass: [38, 34, 31, 33], lead: [2, 1, 0, 1, 2, 1, 0, 2], dr: 'epic', lt: 'sawtooth', lv: 0.022, llp: 1800, pad: 'sawtooth' }
};
let MBOSS = false;
function musicStep(dl, bar, s) {
  const st = (state === 'play' && LV && MSTY[LV.id]) || MSTY[0], sd = 60 / BPM / 4 / (MBOSS ? 1.12 : 1), ch = st.ch[bar], fight = waveActive || (state === 'play' && E.length > 0);
  if (s === 0) for (const n of ch) mVoice(dl, mf(n), sd * 15, st.pad || 'triangle', st.pad ? 0.014 : 0.02, 0.35, 900);
  const bn = st.bass[bar];
  if (s === 0 || s === 6 || s === 8 || s === 14) mVoice(dl, mf(bn + (s === 6 || s === 14 ? 12 : 0)), sd * 3.2, 'sawtooth', 0.07, 0.01, 420);
  else if (MBOSS && s % 2 === 0) mVoice(dl, mf(bn), sd * 1.6, 'sawtooth', 0.055, 0.005, 380);
  if (s % 2 === 0) { const k = st.lead[s >> 1]; if (k >= 0) mVoice(dl, mf(ch[k] + (MBOSS ? 12 : 12)), sd * 3, MBOSS ? 'sawtooth' : (st.lt || 'sine'), MBOSS ? 0.026 : (st.lv || 0.035), 0.008, MBOSS ? 2400 : (st.llp || 0)); }
  if (s % 4 === 3) mVoice(dl, mf(ch[(s >> 2) % 3] + 24), sd * 2, 'sine', 0.012, 0.005, 0);
  if (MBOSS && s % 2 === 1) mVoice(dl, mf(ch[(s >> 1) % 3] + 24), sd * 1.4, 'square', 0.01, 0.004, 3000);
  if (fight || MBOSS) {
    const dr = MBOSS ? 'train' : st.dr;
    const kick = (v) => tone(125, 0.15, 'sine', v || 0.3, -85, dl), snare = (v) => { nz(0.13, v || 0.16, 'bandpass', 1900, 1100, 0.9, dl); tone(190, 0.08, 'triangle', 0.08, -60, dl); }, hat = (v) => nz(0.03, v || 0.05, 'highpass', 7000, 7000, 0.7, dl);
    if (dr === 'rock') { if (s === 0 || s === 8 || s === 10) kick(); if (s === 4 || s === 12) snare(); if (s % 2 === 0 && s !== 4 && s !== 12) hat(); }
    else if (dr === 'half') { if (s === 0 || s === 10) kick(); if (s === 8) snare(0.2); if (s % 4 === 2) hat(0.04); }
    else if (dr === 'indus') { if (s % 4 === 0) kick(0.34); if (s === 6 || s === 14) nz(0.09, 0.18, 'bandpass', 900, 500, 2.2, dl); if (s % 4 === 2) hat(0.04); }
    else if (dr === 'march') { if (s === 0 || s === 8) kick(); if (s === 4 || s === 12) snare(0.18); if (s === 6 || s === 14) snare(0.07); }
    else if (dr === 'swing') { if (s === 0 || s === 8) kick(0.22); if (s === 4 || s === 12) nz(0.1, 0.09, 'bandpass', 2600, 1800, 0.8, dl); if (s % 4 === 0) hat(0.06); if (s % 4 === 3) hat(0.04); }
    else if (dr === 'train') { if (s % 4 === 0) kick(0.32); if (s === 4 || s === 12) snare(0.17); hat(0.032); }
    else if (dr === 'epic') { if (s === 0 || s === 8 || s === 10) kick(0.34); if (s === 4 || s === 12) snare(0.2); if (s === 14 || s === 15) tone(90, 0.12, 'sine', 0.22, -40, dl); if (s % 2 === 0 && s !== 4 && s !== 12) hat(); }
  } else if (s === 0 || s === 8) tone(110, 0.12, 'sine', 0.1, -60, dl);
}
function musicTick() {
  const m = !!keys.KeyM;
  if (m && !oldM) { musicOn = !musicOn; if (MUS) MUS.gain.value = musicOn ? 0.5 : 0; }
  oldM = m;
  if (!AC || !musicOn) return;
  try {
    if (!MUS) { MUS = AC.createGain(); MUS.gain.value = 0.5; MUS.connect(out()); }
    const now = AC.currentTime;
    MBOSS = state === 'play' && !storyOn && E.some(e => e.type === 'boss' && !e.gone && !e.dying);
    if (mNext < now - 0.3) mNext = now + 0.05;
    BUSOVR = MUS;
    while (mNext < now + 0.3) {
      musicStep(mNext - now, (mStep >> 4) & 3, mStep & 15);
      mNext += 60 / (BPM * (MBOSS ? 1.12 : 1)) / 4; mStep++;
    }
  } catch (e) { /* ignoré */ } finally { BUSOVR = null; }
}



/* ---------- ambiances de fond : un souffle filtré par décor (pluie, vent, foule, roulement du train…), coupé si les bruitages le sont ---------- */
const AMBS = {
  street: [[400, 'bandpass', 0.7, 0.012]], port: [[260, 'lowpass', 0.5, 0.05], [3500, 'highpass', 0.6, 0.006]], factory: [[110, 'lowpass', 0.7, 0.07]],
  roof: [[2600, 'highpass', 0.6, 0.022], [200, 'lowpass', 0.6, 0.03]], paris: [[520, 'bandpass', 0.8, 0.035]], cata: [[90, 'lowpass', 1.2, 0.05]],
  casino: [[620, 'bandpass', 1.0, 0.03]], train: [[140, 'lowpass', 0.9, 0.075], [3000, 'highpass', 0.5, 0.006]], aero: [[300, 'lowpass', 0.5, 0.045], [2200, 'bandpass', 0.8, 0.01]],
  chateau: [[2800, 'highpass', 0.6, 0.03], [160, 'lowpass', 0.7, 0.045]]
};
let AMB = null, ambKind = null;
function ambUpdate() {
  if (!AC || REPLAY) return;
  const want = (state === 'play' && sfxOn && !paused && LV) ? LV.bg : null;
  if (want === ambKind) return;
  ambKind = want;
  const now = AC.currentTime;
  if (AMB) { for (const l of AMB) { try { l.gn.gain.cancelScheduledValues(now); l.gn.gain.setTargetAtTime(0, now, 0.15); const s = l.src; setTimeout(() => { try { s.stop(); } catch (e) { /* ignoré */ } }, 900); } catch (e) { /* ignoré */ } } AMB = null; }
  const cfg = want && AMBS[want];
  if (!cfg) return;
  try {
    AMB = cfg.map(([f, ft, q, v]) => {
      const src = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
      src.buffer = nbuf(); src.loop = true; fl.type = ft; fl.frequency.value = f; fl.Q.value = q;
      gn.gain.value = 0.0001; gn.gain.setTargetAtTime(v, now, 0.8);
      src.connect(fl); fl.connect(gn); gn.connect(out()); src.start(now, Math.random() * 0.5);
      return { src, gn };
    });
  } catch (e) { AMB = null; }
}
