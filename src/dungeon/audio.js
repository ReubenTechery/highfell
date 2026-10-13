/* ---------- sound: everything is synthesised, nothing to download ---------- */
export const SFX = {
  ctx: null, out: null, on: true, last: {}, nb: null,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain(); this.out.gain.value = 0.42;
      const comp = this.ctx.createDynamicsCompressor();
      this.out.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  play(name, vol) {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - (this.last[name] || 0) < 0.045) return;
    this.last[name] = now;
    const f = SOUNDS[name];
    if (f) try { f(now, vol === undefined ? 1 : vol); } catch (e) { /* a missed sound is fine */ }
  },
  tone(t, f, dur, type, vol, f2, delay) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    const t0 = t + (delay || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.out); o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(t, dur, vol, freq, type, q, f2, delay) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    const t0 = t + (delay || 0);
    s.buffer = this.nb; s.playbackRate.value = 1;
    fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(freq, t0); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur); fl.Q.value = q || 0.8;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(this.out); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  },
};
export const T = (...a) => SFX.tone(...a), N = (...a) => SFX.noise(...a);
export const SOUNDS = {
  swing: (t, v) => N(t, 0.12, 0.25 * v, 2600, 'bandpass', 1.2, 700),
  hit: (t, v) => { N(t, 0.08, 0.3 * v, 1400, 'lowpass'); T(t, 160, 0.09, 'triangle', 0.18 * v, 90); },
  thud: (t, v) => { T(t, 110, 0.18, 'sine', 0.45 * v, 50); N(t, 0.12, 0.3 * v, 600); },
  die: (t, v) => { for (let i = 0; i < 4; i++) N(t, 0.05, 0.22 * v, 2400 - i * 300, 'bandpass', 3, null, i * 0.045); },
  bigdie: (t, v) => { for (let i = 0; i < 7; i++) N(t, 0.07, 0.28 * v, 1800 - i * 150, 'bandpass', 3, null, i * 0.05); T(t, 90, 0.4, 'sine', 0.3 * v, 40); },
  perfect: (t, v) => { T(t, 1320, 0.25, 'triangle', 0.3 * v); T(t, 1980, 0.35, 'sine', 0.22 * v, null, 0.05); N(t, 0.1, 0.3 * v, 5000, 'highpass'); },
  block: (t, v) => { T(t, 880, 0.12, 'square', 0.12 * v, 700); N(t, 0.08, 0.25 * v, 4000, 'highpass'); },
  shieldup: (t, v) => T(t, 420, 0.06, 'triangle', 0.12 * v, 520),
  taunt: (t, v) => { T(t, 150, 0.35, 'sawtooth', 0.16 * v, 120); T(t, 225, 0.35, 'sawtooth', 0.1 * v, 180); },
  charge: (t, v) => N(t, 0.35, 0.3 * v, 300, 'lowpass', 1, 1600),
  heal: (t, v) => { T(t, 660, 0.18, 'sine', 0.16 * v); T(t, 990, 0.22, 'sine', 0.12 * v, null, 0.06); },
  circle: (t, v) => { for (let i = 0; i < 4; i++) T(t, 520 + i * 130, 0.3, 'sine', 0.1 * v, null, i * 0.05); },
  ward: (t, v) => { T(t, 880, 0.3, 'sine', 0.14 * v, 1320); N(t, 0.2, 0.08 * v, 6000, 'highpass'); },
  sunburst: (t, v) => { for (let i = 0; i < 6; i++) T(t, 440 * Math.pow(1.26, i), 0.4, 'triangle', 0.09 * v, null, i * 0.04); },
  bolt: (t, v) => T(t, 1500, 0.08, 'sine', 0.07 * v, 2400),
  holy: (t, v) => T(t, 990, 0.08, 'triangle', 0.06 * v, 1320),
  blizzard: (t, v) => N(t, 1.2, 0.22 * v, 3000, 'bandpass', 0.6, 900),
  nova: (t, v) => { N(t, 0.4, 0.4 * v, 5000, 'highpass'); T(t, 2200, 0.3, 'triangle', 0.1 * v, 600); },
  castup: (t, v) => T(t, 300, 0.5, 'sine', 0.1 * v, 900),
  whoosh: (t, v) => N(t, 0.3, 0.25 * v, 400, 'bandpass', 1, 3000),
  comet: (t, v) => { T(t, 90, 0.5, 'sine', 0.5 * v, 30); N(t, 0.5, 0.45 * v, 2500, 'lowpass', 1, 300); },
  dodge: (t, v) => N(t, 0.18, 0.22 * v, 900, 'bandpass', 1.5, 2500),
  arrow: (t, v) => { T(t, 300, 0.05, 'triangle', 0.1 * v); N(t, 0.2, 0.15 * v, 3000, 'bandpass', 2, 1200); },
  arrowhit: (t, v) => N(t, 0.06, 0.25 * v, 1500),
  slam: (t, v) => { T(t, 70, 0.6, 'sine', 0.6 * v, 35); N(t, 0.4, 0.4 * v, 500); },
  smash: (t, v) => { T(t, 55, 0.8, 'sine', 0.7 * v, 28); N(t, 0.5, 0.5 * v, 700); T(t, 140, 0.15, 'square', 0.12 * v, 60); },
  windup: (t, v) => N(t, 1.2, 0.18 * v, 200, 'lowpass', 1, 1400),
  roar: (t, v) => { T(t, 95, 0.9, 'sawtooth', 0.22 * v, 60); T(t, 142, 0.9, 'sawtooth', 0.14 * v, 80); N(t, 0.8, 0.15 * v, 600); },
  wail: (t, v) => { T(t, 520, 0.9, 'sine', 0.12 * v, 780); T(t, 530, 0.9, 'sine', 0.08 * v, 400, 0.1); },
  pop: (t, v) => T(t, 900, 0.1, 'sine', 0.18 * v, 300),
  chain: (t, v) => { for (let i = 0; i < 5; i++) T(t, 1800 + Math.random() * 600, 0.05, 'square', 0.05 * v, null, i * 0.05); },
  cut: (t, v) => { N(t, 0.15, 0.3 * v, 6000, 'highpass'); T(t, 2400, 0.15, 'triangle', 0.12 * v, 1200); },
  cage: (t, v) => { for (let i = 0; i < 6; i++) N(t, 0.06, 0.25 * v, 2000, 'bandpass', 3, null, i * 0.04); },
  cagehit: (t, v) => N(t, 0.05, 0.25 * v, 2600, 'bandpass', 3),
  cagebreak: (t, v) => { for (let i = 0; i < 6; i++) N(t, 0.07, 0.3 * v, 2200 - i * 200, 'bandpass', 3, null, i * 0.03); T(t, 660, 0.2, 'triangle', 0.15 * v, 990); },
  rumble: (t, v) => N(t, 0.9, 0.3 * v, 160, 'lowpass', 1, 90),
  toss: (t, v) => N(t, 0.35, 0.3 * v, 900, 'lowpass', 0.8, 300),
  dig: (t, v) => { N(t, 0.5, 0.35 * v, 300, 'lowpass', 1, 120); T(t, 80, 0.4, 'sine', 0.3 * v, 40); },
  erupt: (t, v) => { T(t, 60, 0.7, 'sine', 0.6 * v, 30); N(t, 0.6, 0.5 * v, 1200, 'lowpass', 0.7, 200); },
  rise: (t, v) => { N(t, 0.6, 0.25 * v, 400, 'lowpass', 1, 150); for (let i = 0; i < 4; i++) N(t, 0.05, 0.15 * v, 2200, 'bandpass', 3, null, 0.3 + i * 0.05); },
  fire: (t, v) => N(t, 1.4, 0.2 * v, 900, 'bandpass', 0.7, 400),
  kick: (t, v) => { T(t, 1200, 0.12, 'square', 0.1 * v, 600); T(t, 1800, 0.18, 'sine', 0.12 * v, null, 0.05); },
  rot: (t, v) => N(t, 0.6, 0.2 * v, 500, 'bandpass', 2, 200),
  gate: (t, v) => { for (let i = 0; i < 8; i++) T(t, 200 + i * 15, 0.06, 'square', 0.06 * v, null, i * 0.06); T(t, 80, 0.4, 'sine', 0.4 * v, 40, 0.5); },
  down: (t, v) => T(t, 440, 0.6, 'triangle', 0.16 * v, 110),
  revive: (t, v) => { for (let i = 0; i < 4; i++) T(t, 392 * Math.pow(1.26, i), 0.3, 'sine', 0.1 * v, null, i * 0.08); },
  wipe: (t, v) => { T(t, 330, 0.9, 'sawtooth', 0.12 * v, 110); T(t, 247, 1.0, 'sawtooth', 0.1 * v, 82, 0.1); },
  victory: (t, v) => { [523, 659, 784, 1046].forEach((f, i) => T(t, f, 0.5, 'triangle', 0.14 * v, null, i * 0.12)); },
  chest: (t, v) => { N(t, 0.3, 0.2 * v, 400, 'lowpass'); [784, 988, 1175, 1568].forEach((f, i) => T(t, f, 0.4, 'sine', 0.12 * v, null, 0.2 + i * 0.07)); },
  tick: (t, v) => T(t, 1400 + Math.random() * 400, 0.03, 'square', 0.04 * v),
  win: (t, v) => { [659, 784, 988].forEach((f, i) => T(t, f, 0.35, 'triangle', 0.13 * v, null, i * 0.09)); },
  epic: (t, v) => { [523, 659, 784, 1046, 1318].forEach((f, i) => T(t, f, 0.6, 'triangle', 0.13 * v, null, i * 0.09)); N(t, 0.8, 0.08 * v, 7000, 'highpass', 0.7, null, 0.3); },
  nope: (t, v) => T(t, 160, 0.1, 'square', 0.06 * v, 120),
  pulse: (t, v) => { T(t, 70, 0.5, 'sine', 0.35 * v, 40); N(t, 0.5, 0.25 * v, 900, 'bandpass', 0.6, 300); },
  sweep: (t, v) => N(t, 0.3, 0.4 * v, 1800, 'bandpass', 1, 400),
};
