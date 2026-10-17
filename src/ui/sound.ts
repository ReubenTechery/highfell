/**
 * Sound: real effects, made with ElevenLabs and embedded in the page (audio/sfx.json, made by tools/audio.py),
 * each keeping its old synthesised version as the fallback: a sound plays synthesised until its file is
 * decoded, and for good if it can't be. The engine asks for sounds by name through HOOKS.sound; the screens use
 * the same names for the hearth, the walkout and the reveal. The garden and brewing sounds are synthesised only.
 * The music (music.ts) shares this AudioContext.
 */
import CLIPS from '../../audio/sfx.json';

type Play = (t: number, v: number) => void;
export type Clip = { buf: AudioBuffer; at: number };
const FILES: Record<string, string> = CLIPS;

class Synth {
  ctx: AudioContext | null = null;
  out: GainNode | null = null;
  /** music.ts follows Sound on and off, and the unlock */
  onChange: (() => void) | null = null;
  /** music.ts plays the victory sting at the music's volume, and says false when it can't */
  sting: ((c: Clip, v: number) => boolean) | null = null;
  /** the effects decoded so far (the rest play synthesised) */
  readonly clips: Record<string, Clip> = {};
  private loud = true;
  private last: Record<string, number> = {};
  private nb: AudioBuffer | null = null;

  get on(): boolean { return this.loud; }
  set on(v: boolean) { this.loud = v; this.onChange?.(); }

  unlock(): void {
    if (this.ctx) { if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain(); this.out.gain.value = 0.5;
      // only catches the pile-ups: one effect on its own goes through untouched
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.15;
      this.out.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      void this.decode(this.ctx);
      this.onChange?.();
    } catch { this.ctx = null; }
  }
  /** every embedded effect, decoded once the page may make sound */
  private async decode(c: AudioContext): Promise<void> {
    await Promise.all(Object.entries(FILES).map(async ([name, b64]) => {
      try {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const buf = await new Promise<AudioBuffer>((res, rej) => { void c.decodeAudioData(bytes.buffer, res, rej)?.catch?.(rej); });
        this.clips[name] = { buf, at: leadIn(buf) };
      } catch { /* this one stays synthesised */ }
    }));
  }
  play(name: string, vol?: number): void {
    if (!this.loud || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - (this.last[name] || 0) < 0.045) return;
    this.last[name] = now;
    const v = vol === undefined ? 1 : vol;
    // the victory sting is music: it plays at music volume, or as the victory jingle with the music off
    if (name === 'fanfare') { const f = this.clips.fanfare; if (f && this.sting?.(f, v)) return; name = 'victory'; }
    const clip = this.clips[name], layers = LAYERS[name];
    try {
      if (clip) this.sample(clip, now, v);
      // a sound made of the recorded ones, until it has a take of its own
      else if (layers && layers.every(([n]) => this.clips[n])) for (const [n, k, rate, delay] of layers) this.sample(this.clips[n], now + (delay || 0), v * k, rate || 1);
      else SOUNDS[name]?.(now, v);
    } catch { /* a missed sound is fine */ }
  }
  private sample(c: Clip, t: number, v: number, rate = 1): void {
    const ctx = this.ctx!, s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = c.buf; g.gain.value = v; s.playbackRate.value = rate;
    s.connect(g); g.connect(this.out!); s.start(t, c.at);
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

/** where a decoded effect's sound starts: some decoders leave a few milliseconds of silence in front of an MP3 */
function leadIn(b: AudioBuffer): number {
  const d = b.getChannelData(0), n = Math.min(d.length, Math.floor(b.sampleRate * 0.1));
  for (let i = 0; i < n; i++) if (Math.abs(d[i]) > 0.001) return Math.max(0, (i - b.sampleRate * 0.001) / b.sampleRate);
  return 0;
}

/* The combat plan's sounds (hit feel): each class's impact on its filler, each class's payoff layer, a soft tap for
   automatic swings and ticks, the heal crit's chime, the burn window and the pack-down chord. Until they have real
   takes (tools/audio_list.py), each is made of the recorded effects: [clip, volume, playback rate, delay]. */
export const LAYERS: Record<string, [string, number, number?, number?][]> = {
  axehit: [['thud', 0.85, 1.12], ['block', 0.2, 1.4]],
  bladehit: [['hit', 0.8, 1.3], ['cut', 0.25, 1.25]],
  icehit: [['bolt', 0.85, 0.9], ['shatter', 0.22, 1.45]],
  holyhit: [['holy', 0.9, 0.95], ['smite', 0.25, 1.2]],
  crush: [['crit', 0.8, 0.85], ['smash', 0.45, 1.35]],
  finish: [['crit', 0.85, 1.1], ['cut', 0.5, 0.9], ['kick', 0.35, 0.8, 0.03]],
  bless: [['lift', 0.8, 1.1], ['heal', 0.55, 1.3, 0.04]],
  healcrit: [['heal', 0.7, 1.35], ['coin', 0.3, 1.2, 0.03]],
  tap: [['hit', 0.45, 1.5]],
  exposed: [['flare', 0.55, 1.3]],
};

export const SFX = new Synth();
const T = (t: number, f: number, dur: number, type?: OscillatorType, vol?: number, f2?: number | null, delay?: number) => SFX.tone(t, f, dur, type, vol, f2, delay);
const N = (t: number, dur: number, vol: number, freq: number, type?: BiquadFilterType, q?: number, f2?: number | null, delay?: number) => SFX.noise(t, dur, vol, freq, type, q, f2, delay);

export const SOUNDS: Record<string, Play> = {
  swing: (t, v) => N(t, 0.12, 0.25 * v, 2600, 'bandpass', 1.2, 700),
  hit: (t, v) => { N(t, 0.08, 0.3 * v, 1400, 'lowpass'); T(t, 160, 0.09, 'triangle', 0.18 * v, 90); },
  // your own critical hit: a fat smack with a bright ting on top
  crit: (t, v) => { N(t, 0.1, 0.35 * v, 1800, 'lowpass'); T(t, 150, 0.12, 'triangle', 0.22 * v, 70); T(t, 1760, 0.2, 'triangle', 0.1 * v, null, 0.02); },
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
  // ice cracking: three bright ticks falling, over a hiss
  shatter: (t, v) => { for (let i = 0; i < 3; i++) T(t, 3400 - i * 600, 0.09, 'triangle', 0.1 * v, 1500 - i * 250, i * 0.035); N(t, 0.22, 0.3 * v, 5200, 'highpass', 0.8, 2200); },
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
  // the last boss down: the victory sting (music.ts plays it at music volume)
  fanfare: (t, v) => SOUNDS.victory(t, v),
  chest: (t, v) => { N(t, 0.3, 0.2 * v, 400, 'lowpass'); [784, 988, 1175, 1568].forEach((f, i) => T(t, f, 0.4, 'sine', 0.12 * v, null, 0.2 + i * 0.07)); },
  tick: (t, v) => T(t, 1400 + Math.random() * 400, 0.03, 'square', 0.04 * v),
  // hit feel (the layers above, synthesised): the class impacts, the payoffs, the soft tap, the heal crit, the
  // burn window, and the short low chord when the last of a pack goes down
  axehit: (t, v) => { SOUNDS.thud(t, 0.85 * v); SOUNDS.block(t, 0.2 * v); },
  bladehit: (t, v) => { SOUNDS.hit(t, 0.8 * v); N(t, 0.06, 0.15 * v, 5000, 'highpass'); },
  icehit: (t, v) => { SOUNDS.bolt(t, 0.9 * v); T(t, 3200, 0.06, 'triangle', 0.06 * v, 2000); },
  holyhit: (t, v) => { SOUNDS.holy(t, v); T(t, 1760, 0.12, 'sine', 0.05 * v); },
  crush: (t, v) => { SOUNDS.crit(t, 0.8 * v); T(t, 70, 0.3, 'sine', 0.4 * v, 35); },
  finish: (t, v) => { SOUNDS.crit(t, 0.85 * v); SOUNDS.cut(t, 0.5 * v); },
  bless: (t, v) => { SOUNDS.lift(t, 0.8 * v); SOUNDS.heal(t, 0.5 * v); },
  healcrit: (t, v) => { SOUNDS.heal(t, 0.7 * v); T(t, 2093, 0.25, 'sine', 0.06 * v, null, 0.04); },
  tap: (t, v) => { N(t, 0.04, 0.14 * v, 1600, 'lowpass'); T(t, 220, 0.04, 'triangle', 0.06 * v, 140); },
  exposed: (t, v) => SOUNDS.flare(t, 0.6 * v),
  packdown: (t, v) => { [196, 247, 294].forEach((f, i) => T(t, f, 0.55, 'triangle', 0.1 * v, null, i * 0.015)); T(t, 98, 0.45, 'sine', 0.18 * v); },
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
  // Thimblebriar's walkout: the Tinker King's cuckoo clock ticks, the cuckoo calls, and at midnight it strikes
  clocktick: (t, v) => { T(t, 1900, 0.025, 'triangle', 0.08 * v, 1500); N(t, 0.03, 0.12 * v, 3200, 'bandpass', 4); },
  cuckoo: (t, v) => { T(t, 784, 0.22, 'sine', 0.2 * v, 760); T(t, 622, 0.32, 'sine', 0.2 * v, 600, 0.26); T(t, 1568, 0.18, 'sine', 0.03 * v, null, 0.02); },
  midnight: (t, v) => { [0, 0.55, 1.1].forEach((d) => { T(t, 196, 1.2, 'sine', 0.22 * v, 190, d); T(t, 392, 0.9, 'triangle', 0.06 * v, null, d); }); },
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
  // a piece dropping onto its stand in the collection log
  slot: (t, v) => SOUNDS.place(t, v),
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
