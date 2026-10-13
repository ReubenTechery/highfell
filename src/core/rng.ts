/**
 * Randomness. The combat engine uses one seeded stream (rng) so a run replays exactly from its seed,
 * which is what makes the bot sims trustworthy. Visual noise uses vrand so drawing never disturbs it.
 * Loot and other meta rolls use their own stream from makeRng, kept apart from combat.
 */
let SEED = 1;

export function setSeed(v: number): void { SEED = v; }

function step(s: number): [number, number] {
  s |= 0;
  s = (s + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [s, ((t ^ (t >>> 14)) >>> 0) / 4294967296];
}

/** The combat stream. */
export function rng(): number {
  const [s, v] = step(SEED);
  SEED = s;
  return v;
}
export const rand = (a: number, b: number): number => a + (b - a) * rng();
export const irand = (a: number, b: number): number => Math.floor(rand(a, b + 1));
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
/** Visual only: keeps the game rolls repeatable. */
export const vrand = (a: number, b: number): number => a + (b - a) * Math.random();

export type Rng = () => number;
/** An independent stream, for loot and anything else that must not touch combat. */
export function makeRng(seed?: number): Rng {
  let s = seed === undefined ? (Math.floor(Math.random() * 0x7fffffff) | 1) : seed;
  return () => {
    const [ns, v] = step(s);
    s = ns;
    return v;
  };
}
