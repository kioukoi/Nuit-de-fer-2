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
  move() { tone(700, 0.05, 'triangle', 0.05, 0); }
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
function musicStep(dl, bar, s) {
  const sd = 60 / BPM / 4, ch = CHORDS[bar], fight = waveActive || (state === 'play' && E.length > 0);
  if (s === 0) for (const n of ch) mVoice(dl, mf(n), sd * 15, 'triangle', 0.02, 0.35, 900);
  if (s === 0 || s === 6 || s === 8 || s === 14) mVoice(dl, mf(BASSN[bar] + (s === 6 || s === 14 ? 12 : 0)), sd * 3.2, 'sawtooth', 0.07, 0.01, 420);
  if (s % 2 === 0) { const k = [0, 1, 2, 1, 2, 1, 0, 2][s >> 1]; mVoice(dl, mf(ch[k] + 12), sd * 3, 'sine', 0.035, 0.008, 0); }
  if (s % 4 === 3) mVoice(dl, mf(ch[(s >> 2) % 3] + 24), sd * 2, 'sine', 0.012, 0.005, 0);
  if (fight) {
    if (s === 0 || s === 8 || s === 10) tone(125, 0.15, 'sine', 0.3, -85, dl);
    if (s === 4 || s === 12) { nz(0.13, 0.16, 'bandpass', 1900, 1100, 0.9, dl); tone(190, 0.08, 'triangle', 0.08, -60, dl); }
    if (s % 2 === 0 && s !== 4 && s !== 12) nz(0.03, 0.05, 'highpass', 7000, 7000, 0.7, dl);
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
    if (mNext < now - 0.3) mNext = now + 0.05;
    BUSOVR = MUS;
    while (mNext < now + 0.3) {
      musicStep(mNext - now, (mStep >> 4) & 3, mStep & 15);
      mNext += 60 / BPM / 4; mStep++;
    }
  } catch (e) { /* ignoré */ } finally { BUSOVR = null; }
}

