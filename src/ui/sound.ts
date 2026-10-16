/**
 * Sound: everything is synthesised, nothing to download. The engine asks for sounds by name through
 * HOOKS.sound; the screens use the same table for the hearth, the walkout and the reveal.
 */
type Play = (t: number, v: number) => void;

class Synth {
  ctx: AudioContext | null = null;
  out: GainNode | null = null;
  on = true;
  private last: Record<string, number> = {};
  private nb: AudioBuffer | null = null;

  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain(); this.out.gain.value = 0.42;
      const comp = this.ctx.createDynamicsCompressor();
      this.out.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch { this.ctx = null; }
  }
  play(name: string, vol?: number): void {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - (this.last[name] || 0) < 0.045) return;
    this.last[name] = now;
    const f = SOUNDS[name];
    if (f) try { f(now, vol === undefined ? 1 : vol); } catch { /* a missed sound is fine */ }
  }
  tone(t: number, f: number, dur: number, type?: OscillatorType, vol = 0.1, f2?: number | null, delay?: number): void {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain();
    const t0 = t + (delay || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.out!); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  noise(t: number, dur: number, vol: number, freq: number, type?: BiquadFilterType, q?: number, f2?: number | null, delay?: number): void {
    const c = this.ctx!, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    const t0 = t + (delay || 0);
    s.buffer = this.nb;
    fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(freq, t0); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur); fl.Q.value = q || 0.8;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(this.out!); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }
}

export const SFX = new Synth();
const T = (t: number, f: number, dur: number, type?: OscillatorType, vol?: number, f2?: number | null, delay?: number) => SFX.tone(t, f, dur, type, vol, f2, delay);
const N = (t: number, dur: number, vol: number, freq: number, type?: BiquadFilterType, q?: number, f2?: number | null, delay?: number) => SFX.noise(t, dur, vol, freq, type, q, f2, delay);

export const SOUNDS: Record<string, Play> = {
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
  smite: (t, v) => { T(t, 1180, 0.16, 'triangle', 0.13 * v, 1760); N(t, 0.12, 0.12 * v, 5200, 'highpass'); },
  bolt: (t, v) => T(t, 1500, 0.08, 'sine', 0.07 * v, 2400),
  icicle: (t, v) => { T(t, 2600, 0.1, 'triangle', 0.1 * v, 1700); N(t, 0.1, 0.18 * v, 6500, 'highpass'); },
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
  // curses: a low toll with a falling wail when one lands (nothing else sounds like it), a dark thump when one
  // bursts, a bright chime when the healer lifts it
  curse: (t, v) => { T(t, 196, 1.1, 'triangle', 0.26 * v, 175); T(t, 392, 0.8, 'sine', 0.13 * v, 350, 0.01); T(t, 1180, 0.45, 'square', 0.05 * v, 560, 0.06); N(t, 0.6, 0.12 * v, 1400, 'bandpass', 5, 300); },
  burst: (t, v) => { T(t, 90, 0.45, 'sine', 0.4 * v, 45); N(t, 0.35, 0.3 * v, 700, 'bandpass', 1, 200); T(t, 300, 0.3, 'sawtooth', 0.06 * v, 120); },
  lift: (t, v) => { N(t, 0.12, 0.2 * v, 5000, 'highpass'); [1046, 1568].forEach((f, i) => T(t, f, 0.25, 'triangle', 0.1 * v, null, 0.03 + i * 0.05)); },
  // a save: the healer caught someone at the last moment
  saved: (t, v) => { [659, 880, 1318].forEach((f, i) => T(t, f, 0.4, 'triangle', 0.14 * v, null, i * 0.06)); N(t, 0.5, 0.07 * v, 7000, 'highpass', 0.7, null, 0.12); },
  heartbeat: (t, v) => { T(t, 62, 0.14, 'sine', 0.45 * v, 45); T(t, 58, 0.16, 'sine', 0.35 * v, 42, 0.2); },
  gate: (t, v) => { for (let i = 0; i < 8; i++) T(t, 200 + i * 15, 0.06, 'square', 0.06 * v, null, i * 0.06); T(t, 80, 0.4, 'sine', 0.4 * v, 40, 0.5); },
  down: (t, v) => T(t, 440, 0.6, 'triangle', 0.16 * v, 110),
  revive: (t, v) => { for (let i = 0; i < 4; i++) T(t, 392 * Math.pow(1.26, i), 0.3, 'sine', 0.1 * v, null, i * 0.08); },
  wipe: (t, v) => { T(t, 330, 0.9, 'sawtooth', 0.12 * v, 110); T(t, 247, 1.0, 'sawtooth', 0.1 * v, 82, 0.1); },
  victory: (t, v) => { [523, 659, 784, 1046].forEach((f, i) => T(t, f, 0.5, 'triangle', 0.14 * v, null, i * 0.12)); },
  chest: (t, v) => { N(t, 0.3, 0.2 * v, 400, 'lowpass'); [784, 988, 1175, 1568].forEach((f, i) => T(t, f, 0.4, 'sine', 0.12 * v, null, 0.2 + i * 0.07)); },
  tick: (t, v) => T(t, 1400 + Math.random() * 400, 0.03, 'square', 0.04 * v),
  nope: (t, v) => T(t, 160, 0.1, 'square', 0.06 * v, 120),
  pulse: (t, v) => { T(t, 70, 0.5, 'sine', 0.35 * v, 40); N(t, 0.5, 0.25 * v, 900, 'bandpass', 0.6, 300); },
  sweep: (t, v) => N(t, 0.3, 0.4 * v, 1800, 'bandpass', 1, 400),
  // the walkout
  gutter: (t, v) => { N(t, 0.5, 0.18 * v, 1200, 'bandpass', 2, 200); T(t, 220, 0.4, 'sine', 0.06 * v, 110); },
  flare: (t, v) => { N(t, 0.4, 0.2 * v, 900, 'lowpass', 1, 4000); [784, 1175, 1568].forEach((f, i) => T(t, f, 0.5, 'triangle', 0.09 * v, null, 0.05 + i * 0.06)); },
  knock: (t, v) => { T(t, 120, 0.12, 'sine', 0.5 * v, 70); N(t, 0.08, 0.35 * v, 800); },
  // a gilding kit: the chest's lid rings once, like a little bell
  gild: (t, v) => { [2093, 2637, 3136].forEach((f, i) => T(t, f, 1.1 - i * 0.25, 'sine', (0.1 - i * 0.025) * v, null, i * 0.004)); T(t, 1046, 0.5, 'triangle', 0.05 * v); N(t, 0.08, 0.05 * v, 8000, 'highpass'); },
  lightsout: (t, v) => { T(t, 160, 0.9, 'sine', 0.3 * v, 40); N(t, 0.7, 0.2 * v, 600, 'lowpass', 1, 80); },
  petchime: (t, v) => { [1046, 1318, 1568, 2093, 1568, 2637].forEach((f, i) => T(t, f, 0.6, 'sine', 0.08 * v, null, i * 0.22)); },
  petfound: (t, v) => { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => T(t, f, 0.7, 'triangle', 0.12 * v, null, i * 0.08)); N(t, 1, 0.08 * v, 7000, 'highpass', 0.7, null, 0.3); },
  // the reveal
  flip: (t, v) => { N(t, 0.08, 0.2 * v, 3000, 'bandpass', 1.5, 1200); T(t, 600, 0.06, 'triangle', 0.05 * v, 900); },
  deal: (t, v) => N(t, 0.07, 0.15 * v, 2200, 'bandpass', 1.4, 900),
  stamp: (t, v) => { T(t, 140, 0.1, 'square', 0.12 * v, 90); N(t, 0.06, 0.25 * v, 1600); },
  rare: (t, v) => { [659, 831, 988, 1318].forEach((f, i) => T(t, f, 0.6, 'triangle', 0.13 * v, null, i * 0.07)); N(t, 0.6, 0.06 * v, 6000, 'highpass', 0.7, null, 0.2); },
  epic: (t, v) => { [523, 659, 784, 1046, 1318].forEach((f, i) => T(t, f, 0.6, 'triangle', 0.13 * v, null, i * 0.09)); N(t, 0.8, 0.08 * v, 7000, 'highpass', 0.7, null, 0.3); },
  coin: (t, v) => { T(t, 1568, 0.08, 'square', 0.05 * v); T(t, 2093, 0.18, 'square', 0.05 * v, null, 0.06); },
  ach: (t, v) => { [784, 988, 1175].forEach((f, i) => T(t, f, 0.35, 'triangle', 0.11 * v, null, i * 0.08)); },
  ui: (t, v) => T(t, 700, 0.05, 'triangle', 0.05 * v, 900),
  place: (t, v) => { T(t, 300, 0.1, 'sine', 0.2 * v, 180); N(t, 0.06, 0.15 * v, 900); },
  // the Vale: footsteps, a combo, a bucket of water, XP landing, a new rank
  step: (t, v) => { N(t, 0.05, 0.16 * v, 700, 'lowpass', 1); T(t, 110, 0.05, 'sine', 0.1 * v, 80); },
  combo: (t, v) => { T(t, 880 + v * 400, 0.12, 'triangle', 0.09, 1320 + v * 500); },
  splash: (t, v) => { N(t, 0.5, 0.3 * v, 1800, 'lowpass', 0.8, 400); for (let i = 0; i < 4; i++) T(t, 900 + i * 230, 0.08, 'sine', 0.05 * v, 500, 0.05 + i * 0.05); },
  xp: (t, v) => { T(t, 1320, 0.09, 'sine', 0.07 * v, 1760); T(t, 1976, 0.12, 'sine', 0.05 * v, null, 0.05); },
  rankup: (t, v) => { [523, 659, 784, 1046, 1318].forEach((f, i) => T(t, f, 0.45, 'triangle', 0.12 * v, null, i * 0.07)); N(t, 0.7, 0.07 * v, 7000, 'highpass', 0.7, null, 0.25); },
  // putting on a new piece: a clank of metal, then a bright climb
  equip: (t, v) => { T(t, 180, 0.14, 'square', 0.12 * v, 110); N(t, 0.12, 0.3 * v, 3200, 'bandpass', 2.2); [784, 988, 1175, 1568].forEach((f, i) => T(t, f, 0.32, 'triangle', 0.1 * v, null, 0.08 + i * 0.06)); N(t, 0.5, 0.06 * v, 7000, 'highpass', 0.7, null, 0.2); },
  // the Vale: close-up gathering and brewing. Small, crisp and soft: these are the ASMR ones.
  snip: (t, v) => { N(t, 0.03, 0.34 * v, 7200, 'highpass', 0.8); N(t, 0.05, 0.22 * v, 3200, 'bandpass', 2.5, null, 0.012); T(t, 3400, 0.03, 'triangle', 0.05 * v, 2600, 0.01); },
  crunch: (t, v) => { for (let i = 0; i < 3; i++) N(t, 0.03, 0.2 * v, 2400 - i * 500, 'bandpass', 3, null, i * 0.018); },
  ouch: (t, v) => { T(t, 520, 0.12, 'square', 0.08 * v, 260); N(t, 0.05, 0.2 * v, 5000, 'highpass'); },
  basket: (t, v) => { N(t, 0.09, 0.22 * v, 900, 'bandpass', 1.2, 400); T(t, 180, 0.08, 'sine', 0.12 * v, 120); },
  pluck: (t, v) => { T(t, 260, 0.09, 'sine', 0.28 * v, 900); N(t, 0.05, 0.15 * v, 1800, 'bandpass', 2); },
  twinkle: (t, v) => { T(t, 2093, 0.18, 'sine', 0.05 * v); T(t, 2637, 0.22, 'sine', 0.04 * v, null, 0.05); },
  squeak: (t, v) => { T(t, 1400, 0.12, 'square', 0.06 * v, 2400); T(t, 2400, 0.25, 'square', 0.05 * v, 1600, 0.12); },
  dew: (t, v) => { [1568, 2093, 2637, 3136].forEach((f, i) => T(t, f, 0.3, 'sine', 0.05 * v, null, i * 0.05)); },
  plop: (t, v) => { T(t, 420, 0.16, 'sine', 0.3 * v, 120); N(t, 0.12, 0.12 * v, 700, 'lowpass', 1, 200, 0.02); },
  bubble: (t, v) => T(t, 300 + Math.random() * 500, 0.06, 'sine', 0.06 * v, 900 + Math.random() * 600),
  stir: (t, v) => N(t, 0.12, 0.08 * v, 500 + Math.random() * 300, 'bandpass', 1.2),
  clink: (t, v) => { T(t, 2637, 0.25, 'triangle', 0.08 * v); T(t, 3520, 0.2, 'sine', 0.05 * v, null, 0.03); },
  hoof: (t, v) => { T(t, 160, 0.06, 'sine', 0.25 * v, 90); N(t, 0.04, 0.15 * v, 1200, 'bandpass', 2); },
  bleat: (t, v) => { T(t, 420, 0.45, 'sawtooth', 0.05 * v, 380); T(t, 430, 0.45, 'sawtooth', 0.04 * v, 400, 0.02); },
  caw: (t, v) => { T(t, 700, 0.18, 'sawtooth', 0.07 * v, 420); N(t, 0.18, 0.12 * v, 1400, 'bandpass', 3); },
  flap: (t, v) => { for (let i = 0; i < 3; i++) N(t, 0.05, 0.15 * v, 800, 'bandpass', 1, null, i * 0.07); },
  sizzle: (t, v) => N(t, 0.25, 0.15 * v, 6000, 'highpass', 0.7, 3000),
  page: (t, v) => N(t, 0.18, 0.14 * v, 3000, 'bandpass', 0.8, 1200),
};
