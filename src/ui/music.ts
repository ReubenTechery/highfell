/**
 * Music: three loops made with Eleven Music, the house (a cosy tavern), the dungeon (low and tense) and a boss
 * (driving). They are too big to embed, so each streams from the live page's own files (published next to it
 * from audio/music) the first time it's wanted, and loops without a gap. The victory sting is the embedded effect
 * 'fanfare', played here so it follows the music's volume. Sound off silences it all; the volume slider in
 * Settings is kept on this device. A track that can't load leaves the game quiet, never broken.
 */
import TRACKS from '../../audio/music.json';
import { SPLIT } from '../dungeon/walkout.js';
import { SFX, type Clip } from './sound';

export type Track = 'house' | 'dungeon' | 'boss';
type Meta = { file: string; loopStart: number; loopEnd: number; lufs: number };
const META: Record<Track, Meta> = TRACKS;
const KEY = 'highfell.music';
/** every loop plays at this loudness (LUFS) at full volume, under the effects */
const LEVEL = -21;
/** the sting's gain at full volume */
const STING = 0.8;

/** what a run wants, from the engine's state: the boss loop in a boss fight and the dungeon loop otherwise,
 *  quiet once the last boss is down (the sting has the moment) or the whole party is down; and how far the
 *  music ducks: under the lantern's tells, and all the way out when the pet's walkout hushes everything */
export interface RunView { boss: unknown; chest: unknown; heroes: { alive: boolean }[]; hush?: boolean; walkout?: { t: number; done: boolean } | null }
export function runMusic(s: RunView): { track: Track | null; duck: number } {
  const track: Track | null = s.chest || !s.heroes.some((h) => h.alive) ? null : s.boss ? 'boss' : 'dungeon';
  const duck = s.hush ? 0 : s.walkout && !s.walkout.done && s.walkout.t > SPLIT ? 0.3 : 1;
  return { track, duck };
}

/** the slider's 0 to 1 as a gain: squared, so the middle of the slider sounds like the middle */
export const volumeGain = (v: number): number => Math.max(0, Math.min(1, v)) ** 2;

class Music {
  volume = 0.7;
  private wanted: Track | null = null;
  private ducked = 1;
  private bus: GainNode | null = null;
  private playing: { track: Track; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private bytes = new Map<Track, Promise<ArrayBuffer | null>>();
  private decoded = new Map<Track, Promise<AudioBuffer | null>>();

  constructor() {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== null && +v >= 0 && +v <= 1) this.volume = +v;
    } catch { /* the default */ }
    SFX.onChange = () => this.sync();
    SFX.sting = (c, v) => this.sting(c, v);
  }

  /** the loop this screen wants, or null for quiet; it fades over when it changes */
  want(t: Track | null): void {
    if (t === this.wanted) return;
    this.wanted = t;
    this.sync();
  }
  /** 1 as normal, lower to let something through, 0 to cut */
  duck(k: number): void {
    if (k === this.ducked) return;
    this.ducked = k;
    this.level(k === 0 ? 0.15 : 0.5);
  }
  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    try { localStorage.setItem(KEY, String(this.volume)); } catch { /* this device won't remember it */ }
    this.level(0.05);
    this.sync();
  }

  /** what's playing, for testing in the page: highfell.music.now() */
  now(): { track: Track | null; duck: number; volume: number } { return { track: this.playing?.track ?? null, duck: this.ducked, volume: this.volume }; }

  private get live(): boolean { return SFX.on && this.volume > 0 && !!SFX.ctx; }

  /** start, swap or stop the loop to match what's wanted and whether music may play */
  private sync(): void {
    if (!SFX.ctx) return;
    const t = this.live ? this.wanted : null;
    if (this.playing?.track === t) return;
    this.stop(!this.live ? 0.2 : t === 'boss' ? 0.4 : 1.2);
    if (!t) return;
    void this.load(t).then((buf) => {
      if (buf && this.live && this.wanted === t && this.playing?.track !== t) this.start(t, buf);
    });
    // the boss's loop gets ready during the dungeon; the house's is let go until you're home
    if (t === 'dungeon') void this.load('boss');
    for (const o of t === 'house' ? ['dungeon', 'boss'] as const : ['house'] as const) this.decoded.delete(o);
  }
  private start(t: Track, buf: AudioBuffer): void {
    const c = SFX.ctx!, m = META[t], now = c.currentTime;
    const src = c.createBufferSource(), gain = c.createGain();
    src.buffer = buf; src.loop = true; src.loopStart = m.loopStart; src.loopEnd = m.loopEnd;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(10 ** ((LEVEL - m.lufs) / 20), now + (t === 'boss' ? 0.3 : 1.5));
    src.connect(gain); gain.connect(this.out());
    src.start(now, m.loopStart);
    this.playing = { track: t, src, gain };
  }
  private stop(sec: number): void {
    const p = this.playing;
    if (!p || !SFX.ctx) return;
    this.playing = null;
    const now = SFX.ctx.currentTime, g = p.gain.gain;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + sec);
    try { p.src.stop(now + sec + 0.05); } catch { /* already stopped */ }
  }
  private sting(c: Clip, v: number): boolean {
    if (!this.live) return false;
    const ctx = SFX.ctx!, s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = c.buf; g.gain.value = STING * v;
    s.connect(g); g.connect(this.out()); s.start(ctx.currentTime, c.at);
    return true;
  }

  /** the music's own volume, straight to the speakers (the effects' limiter would pump it) */
  private out(): GainNode {
    if (!this.bus) {
      const c = SFX.ctx!;
      this.bus = c.createGain(); this.bus.gain.value = volumeGain(this.volume) * this.ducked;
      this.bus.connect(c.destination);
    }
    return this.bus;
  }
  private level(sec: number): void {
    if (!this.bus || !SFX.ctx) return;
    const g = this.bus.gain, now = SFX.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(volumeGain(this.volume) * this.ducked, now + sec);
  }
  /** fetched once and kept; decoded when wanted (a failed one is tried again next time it's wanted) */
  private load(t: Track): Promise<AudioBuffer | null> {
    let d = this.decoded.get(t);
    if (!d) {
      d = this.fetch(t).then((ab) => (ab ? new Promise<AudioBuffer | null>((res) => {
        void SFX.ctx!.decodeAudioData(ab.slice(0), res, () => res(null))?.catch?.(() => res(null));
      }) : null));
      this.decoded.set(t, d);
      void d.then((b) => { if (!b && this.decoded.get(t) === d) this.decoded.delete(t); });
    }
    return d;
  }
  private fetch(t: Track): Promise<ArrayBuffer | null> {
    let b = this.bytes.get(t);
    if (!b) {
      // a page opened from a file can't fetch its neighbours, so it goes without music
      b = location.protocol === 'file:' ? Promise.resolve(null) : fetch(META[t].file).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
      this.bytes.set(t, b);
      void b.then((ab) => { if (!ab && this.bytes.get(t) === b) this.bytes.delete(t); });
    }
    return b;
  }
}

export const MUSIC = new Music();
