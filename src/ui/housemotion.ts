/**
 * How the house's bits move (art.ts: Bit), worked out for one moment, for the house's canvas (housecanvas.ts)
 * to draw. A bit's `cls` names its motion, the way a class names a CSS animation: the fire's two frames and the
 * smoke's four take turns, a new frame every 0.45s; the flock crosses the sky once every 66s, flapping; the
 * fireflies blink and drift through 16 beats; a lit door's glow breathes; pets bob, banners sway, your hero
 * breathes; a mount in the paddock wanders a little each way, stops and turns round; something new pops in
 * once. Keyframes are listed as CSS would list them, and eased the same way, one interval at a time. With
 * reduced motion everything holds still, on its first frame (the birds stay out of sight).
 */
type Rect = [number, number, number, number];
/** a pose: move x, y (world units), turn (degrees), stretch x, y, and how opaque */
type Pose = [number, number, number, number, number, number];
type Ease = (u: number) => number;
interface Anim {
  /** seconds a go, and when it began (negative: it was already that far in when the house came on screen) */
  dur: number;
  delay?: number;
  dir?: 'reverse' | 'alternate';
  /** one go, then it holds its last pose (otherwise it repeats for ever) */
  once?: boolean;
  /** how each interval between keyframes is eased; 'step' holds each keyframe until the next */
  ease: Ease | 'step';
  keys: [number, Pose][];
  /** where it turns and stretches from, as a share of the bit's box */
  at?: [number, number];
}
/** where a bit is drawn this moment: how opaque, and the matrix (a, b, c, d, e, f) from its box to the house */
export interface Motion { a: number; m: [number, number, number, number, number, number] }

/** a CSS cubic-bezier timing function */
function bezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const fy = (t: number): number => ((ay * t + by) * t + cy) * t;
  return (u) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let lo = 0, hi = 1, t = u;
    for (let i = 0; i < 24; i++) {
      const v = fx(t);
      if (Math.abs(v - u) < 1e-5) break;
      if (v < u) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return fy(t);
  };
}
const EASE_IN_OUT = bezier(0.42, 0, 0.58, 1);
const POP_EASE = bezier(0.2, 1.6, 0.4, 1);

const pose = (o: { x?: number; y?: number; r?: number; sx?: number; sy?: number; s?: number; a?: number }): Pose =>
  [o.x ?? 0, o.y ?? 0, o.r ?? 0, o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.a ?? 1];

const FIRE_A: Anim = { dur: 0.9, ease: 'step', keys: [[0, pose({})], [0.5, pose({ a: 0 })], [1, pose({ a: 0 })]] };
const FIRE_B: Anim = { dur: 0.9, ease: 'step', keys: [[0, pose({ a: 0 })], [0.5, pose({})], [1, pose({})]] };
const FRAME4: Anim = { dur: 1.8, ease: 'step', keys: [[0, pose({})], [0.25, pose({ a: 0 })], [1, pose({ a: 0 })]] };
/** the flock's arc, from past the left edge (where houseart.ts draws it) over the roof to past the right edge;
 *  then it waits out of sight */
const ARC: [number, number][] = [[0, 0], [350, -19], [700, -76], [1050, -167], [1400, -285], [1750, -422], [2100, -570], [2450, -718],
  [2800, -855], [3150, -973], [3500, -1064], [3850, -1121], [4200, -1140], [4550, -1121], [4900, -1064], [5250, -973], [5600, -855],
  [5950, -718], [6300, -570], [6650, -422], [7000, -285], [7350, -167], [7700, -76], [8050, -19], [8400, 0]];
const FLIGHT: Anim = {
  dur: 66, delay: -8, ease: (u) => u,
  keys: [...ARC.map(([x, y], i): [number, Pose] => [i * 0.025, pose({ x, y })]), [0.601, pose({ x: 8400, a: 0 })], [1, pose({ x: 8400, a: 0 })]],
};
/** a firefly's 16 beats: dark, glowing up, drifting, dimming, dark again, and once more */
const GLIMMER: Anim = {
  dur: 7.2, ease: 'step',
  keys: ([[0, 0, 0, 0], [0.125, 0.45, 6, -6], [0.1875, 1, 14, -14], [0.25, 1, 22, -18], [0.3125, 0.45, 28, -26], [0.375, 0, 26, -30],
    [0.5625, 0.45, 16, -36], [0.625, 1, 6, -34], [0.6875, 0.45, -4, -28], [0.75, 0, 0, 0], [1, 0, 0, 0]] as const).map(([k, a, x, y]): [number, Pose] => [k, pose({ x, y, a })]),
};
const GLOW: Anim = { dur: 2.6, dir: 'alternate', ease: EASE_IN_OUT, keys: [[0, pose({ a: 0.75 })], [1, pose({})]] };
const bob = (dur: number): Anim => ({ dur, ease: EASE_IN_OUT, at: [0.5, 1], keys: [[0, pose({})], [0.5, pose({ y: -3, sy: 1.02 })], [1, pose({})]] });
const BREATHE: Anim = { dur: 3.2, ease: EASE_IN_OUT, at: [0.5, 1], keys: [[0, pose({})], [0.5, pose({ sy: 1.025 })], [1, pose({})]] };
const SWAY: Anim = { dur: 4, ease: EASE_IN_OUT, at: [0.5, 0], keys: [[0, pose({ r: -1.2 })], [0.5, pose({ r: 1.2 })], [1, pose({ r: -1.2 })]] };
const NEW_POP: Anim = { dur: 0.7, once: true, ease: POP_EASE, at: [0.5, 1], keys: [[0, pose({ s: 0.2, a: 0 })], [1, pose({})]] };
/** a mount wanders 34 world units each way (PADDOCK.wander), stops, turns round */
const wander = (dur: number, delay = 0, dir?: 'reverse'): Anim => ({
  dur, delay, dir, ease: EASE_IN_OUT, at: [0.5, 1],
  keys: [[0, pose({})], [0.28, pose({ x: 34 })], [0.44, pose({ x: 34 })], [0.47, pose({ x: 34, sx: -1 })], [0.52, pose({ x: 34, sx: -1 })],
    [0.8, pose({ x: -34, sx: -1 })], [0.92, pose({ x: -34, sx: -1 })], [0.95, pose({ x: -34 })], [1, pose({})]],
});
const WANDER = [wander(17), wander(21, -7), wander(19, -12, 'reverse'), wander(23, -4)];

/** the motions a bit's classes name */
function animsOf(cls: string[]): Anim[] {
  const has = (c: string): boolean => cls.includes(c);
  const n = (pre: string): number => +(cls.find((c) => new RegExp(`^${pre}\\d$`).test(c))?.slice(pre.length) ?? 0);
  if (has('fire-a')) return [FIRE_A];
  if (has('fire-b')) return [FIRE_B];
  // the smoke's four frames take turns, so its puffs climb
  if (has('smoke')) return [{ ...FRAME4, delay: -0.45 * ((4 - n('s')) % 4) }];
  if (has('flock')) return [FLIGHT, has('b') ? FIRE_B : FIRE_A];
  if (has('firefly')) { const f = n('f'); return [{ ...GLIMMER, delay: [0, -2.7, -4.95][f] ?? 0, dir: f === 1 ? 'reverse' : undefined }]; }
  if (has('doorglow')) return [GLOW];
  if (has('new-pop')) return [NEW_POP];
  if (has('pip')) return [bob(1.2)];
  if (has('bob')) return [bob(2.4)];
  if (has('breathe')) return [BREATHE];
  if (has('sway')) return [SWAY];
  if (has('wander')) return [WANDER[n('w')] || WANDER[0]];
  return [];
}

/** a motion's pose `t` seconds in (`t` from when the bit was first drawn, for one that plays once) */
function poseAt(an: Anim, t: number): Pose {
  const lt = t - (an.delay ?? 0);
  let p: number;
  if (an.once) p = Math.max(0, Math.min(1, lt / an.dur));
  else {
    const go = Math.floor(lt / an.dur);
    p = lt / an.dur - go;
    if (an.dir === 'reverse' || (an.dir === 'alternate' && go % 2 !== 0)) p = 1 - p;
  }
  const ks = an.keys;
  let i = 0;
  while (i < ks.length - 2 && p >= ks[i + 1][0]) i++;
  const [k0, a] = ks[i], [k1, b] = ks[i + 1];
  if (an.ease === 'step') return p >= k1 ? b : a;
  const u = an.ease(k1 > k0 ? (p - k0) / (k1 - k0) : 1);
  return a.map((v, j) => v + (b[j] - v) * u) as Pose;
}

/** what's hidden while everything holds still: the second frames, and the birds */
const stillHidden = (cls: string[]): boolean =>
  (cls.includes('fire-b')) || (cls.includes('smoke') && !cls.includes('s0')) || (cls.includes('flock') && cls.includes('b'));

/** Where a bit is drawn `t` seconds after the house came on screen (`born`: when this bit was first drawn), or
 *  null while it's out of sight. `still`: reduced motion. */
export function motion(cls: string, box: Rect, t: number, born: number, still: boolean): Motion | null {
  const cs = cls.split(' ');
  const [bx, by, bw, bh] = box;
  if (still) return stillHidden(cs) ? null : { a: 1, m: [1, 0, 0, 1, 0, 0] };
  const anims = animsOf(cs);
  if (!anims.length) return { a: 1, m: [1, 0, 0, 1, 0, 0] };
  // two motions together (the flock flies and flaps): moves add up, stretches and opacity multiply
  let x = 0, y = 0, r = 0, sx = 1, sy = 1, a = 1, at: [number, number] = [0.5, 0.5];
  for (const an of anims) {
    const q = poseAt(an, an.once ? t - born : t);
    x += q[0]; y += q[1]; r += q[2]; sx *= q[3]; sy *= q[4]; a *= q[5];
    if (an.at) at = an.at;
  }
  if (a <= 0.002) return null;
  const rad = (r * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
  const ma = cos * sx, mb = sin * sx, mc = -sin * sy, md = cos * sy;
  const ox = bx + at[0] * bw, oy = by + at[1] * bh;
  return { a: Math.min(1, a), m: [ma, mb, mc, md, ox + x - (ma * ox + mc * oy), oy + y - (mb * ox + md * oy)] };
}
