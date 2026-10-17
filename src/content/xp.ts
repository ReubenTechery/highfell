/**
 * XP: what every kill, every clear and the chest's pages and tomes pay, and the levels it adds up to. The level is
 * yours, not one hero's (like champion points): every hero of yours spends the same talent points in their own
 * class's tree (talents/). From level 2 each level is a talent point, up to a full tree (TREE_POINTS in talents/);
 * past that a level is for show, up to MAX_LEVEL, and level 50 and 99 give titles. A harder dungeon pays more
 * (its tier), and Heroic more again. The rules are src/meta/xp.ts; the engine pops each kill's XP over the mob.
 */

export const MAX_LEVEL = 99;

/** what a kill pays, by what it was (TIER_XP and HEROIC_XP multiply it). Bombs and other things pay nothing. */
export const KILL_XP = { wisp: 5, fodder: 25, ranged: 30, job: 35, big: 90, boss: 400, final: 800 } as const;
export type KillKind = keyof typeof KILL_XP;
/** finishing a dungeon pays this on top */
export const CLEAR_XP = 400;
/** a dungeon's tier pays more (Thimblebriar half again), and Heroic half again on top */
export const TIER_XP: Record<number, number> = { 1: 1, 2: 1.5, 3: 2 };
export const HEROIC_XP = 1.5;

/** The mob fields a kill's XP reads (the engine's mob definitions have these). */
export interface XpMob { kind?: string; big?: boolean; boss?: boolean; wisp?: boolean; thing?: boolean; bomb?: boolean }
/** What kind of kill a mob is for XP. `final`: it's the dungeon's last boss. Null pays nothing (a bomb). */
export function killKind(M: XpMob, final: boolean): KillKind | null {
  if (M.thing || M.bomb) return null;
  if (M.wisp) return 'wisp';
  if (M.boss) return final ? 'final' : 'boss';
  if (M.big) return 'big';
  if (M.kind === 'caller' || M.kind === 'mender') return 'job';
  if (M.kind === 'ranged') return 'ranged';
  return 'fodder';
}
/** a kill's XP before the dungeon's multiplier */
export const killXp = (M: XpMob, final: boolean): number => { const k = killKind(M, final); return k ? KILL_XP[k] : 0; };

/** the XP from one level to the next: 1,000 to reach level 2, a little more each level after */
export const levelNeed = (level: number): number => { const k = level - 1; return 1000 + 350 * k + 10 * k * k; };
const TOTALS: number[] = [0, 0];
for (let l = 2; l <= MAX_LEVEL; l++) TOTALS[l] = TOTALS[l - 1] + levelNeed(l - 1);
/** the total XP a level takes (level 1 is 0) */
export const xpForLevel = (level: number): number => TOTALS[Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)))];
/** the level a total of XP is */
export function levelOf(xp: number): number {
  let lo = 1, hi = MAX_LEVEL;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (TOTALS[mid] <= xp) lo = mid; else hi = mid - 1; }
  return lo;
}

/** Every chest has lore pages; how many is a roll on this table, at fixed chances that add up to 1. Each pays
 *  PAGE_XP (times the dungeon's multiplier). */
export const PAGE_XP = 100;
export const PAGE_ROLLS: { n: number; chance: number }[] = [
  { n: 1, chance: 0.5 }, { n: 2, chance: 0.25 }, { n: 3, chance: 0.15 }, { n: 5, chance: 0.08 }, { n: 10, chance: 0.02 },
];
/** a chest's pages, as the reveal shows them */
export const PAGES = { id: 'xp.pages', name: 'Lore Pages', icon: 'tome_pages' };

/** A tome: rolled on its own at every clear, at a fixed rate, like any drop; it pays its XP (times the dungeon's
 *  multiplier) when the chest opens. Not a collection log slot. */
export interface TomeDef { id: string; name: string; icon: string; rate: number; xp: number; desc: string }
export const TOMES: TomeDef[] = [
  { id: 'xp.tome', name: 'Scholar’s Tome', icon: 'tome_scholar', rate: 1 / 25, xp: 2500, desc: 'A crypt-keeper’s notes, read in one sitting.' },
  { id: 'xp.grand', name: 'Grand Tome', icon: 'tome_grand', rate: 1 / 500, xp: 25000, desc: 'Every secret of the place, in gold ink.' },
];
export const TOME: Record<string, TomeDef> = Object.fromEntries(TOMES.map((t) => [t.id, t]));
/** what an XP drop is called and drawn as: the pages or a tome */
export const xpThing = (id: string): { name: string; icon: string } | null => (id === PAGES.id ? PAGES : TOME[id] || null);
