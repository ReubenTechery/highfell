/**
 * The garden and the cauldron: the rules. Bosses drop seeds (every seed line rolls on its own, per
 * player, like any drop). A seed goes in one of the planter beds in the yard and grows one step for
 * every dungeon clear; after GROW_CLEARS it's ready, and it waits for you as long as you like. It never
 * wilts, nothing runs on a clock, and seeds bank with no limit.
 *
 * A harvest is rolled the moment you start its close-up (like a boss kill), so closing the page
 * mid-way never loses a drop and backing out can never be used to reroll one. Perfects add on top
 * when the close-up ends. XP comes a little at a time: every cut and every lap of the stir pays
 * straight away, and finishing pays a little more.
 *
 * Herbs go in the cauldron. One bottle is poured at the door for the whole party (see party.ts) and
 * makes that run quicker; nothing needs one.
 */
import { COLLECTIBLES } from '../content';
import { FIRST_HARVEST_GIFT, GARDEN_TABLE, GROW_CLEARS, INGREDIENTS, PLANTS, RANK_XP, RECIPES, SHIMMER } from '../content/vale';
import type { DropDef, DungeonInfo, NodeDef } from '../content/types';
import type { Rng } from '../core/rng';
import { autoPlace } from './hearth';
import { count, emptyBed, type BedState, type Profile } from './profile';

/** Testing switches from the settings sheet: never saved, never on for anyone else. free: beds are ready at once. */
export interface ValeDev { free?: boolean; luck?: number }

/* ---------------------------------------------------------------- ranks */
export const rankOf = (xp: number): number => { let r = 1; for (let i = 1; i < RANK_XP.length; i++) if (xp >= RANK_XP[i]) r = i + 1; return r; };
/** progress inside the current rank, 0 to 1 (1 at the cap) */
export function rankProgress(xp: number): { rank: number; into: number; need: number; k: number } {
  const rank = rankOf(xp);
  if (rank >= RANK_XP.length) return { rank, into: 0, need: 0, k: 1 };
  const lo = RANK_XP[rank - 1], hi = RANK_XP[rank];
  return { rank, into: xp - lo, need: hi - lo, k: (xp - lo) / (hi - lo) };
}
export const skillRank = (p: Profile, skill: string): number => rankOf(p.vale.xp[skill] || 0);
/** Gathering ranks 4, 7 and 10 each add one to every harvest. */
export const yieldBonus = (rank: number): number => (rank >= 4 ? 1 : 0) + (rank >= 7 ? 1 : 0) + (rank >= 10 ? 1 : 0);

export interface RankUp { skill: string; rank: number }
function addXp(p: Profile, skill: string, amt: number): RankUp | null {
  const before = rankOf(p.vale.xp[skill] || 0);
  p.vale.xp[skill] = (p.vale.xp[skill] || 0) + amt;
  const after = rankOf(p.vale.xp[skill]);
  p.counters[`vale.rank.${skill}`] = after;
  return after > before ? { skill, rank: after } : null;
}

/* ---------------------------------------------------------------- XP, a little at a time */
/** how a cut, a pluck or a lap of the stir went */
export type Grade = 'perfect' | 'good' | 'rough' | 'ouch';
/** gathering XP for one cut or pluck (a shimmering bed adds SHIMMER_XP), and for finishing a harvest */
export const CUT_XP: Record<Grade, number> = { perfect: 6, good: 4, rough: 2, ouch: 1 };
export const SHIMMER_XP = 2;
export const HARVEST_XP = 4;
/** brewing XP for one lap of the stir, and for bottling */
export const LAP_XP: Record<BrewQuality, number> = { perfect: 6, good: 4, rough: 2 };
export const BOTTLE_XP = 12;
/** XP just earned: how much, any rank it took you to, and where the skill stands now */
export interface XpGain { skill: string; xp: number; rankUp: RankUp | null; total: number }
function gain(p: Profile, skill: string, amt: number): XpGain {
  const rankUp = addXp(p, skill, amt);
  return { skill, xp: amt, rankUp, total: p.vale.xp[skill] };
}

/* ---------------------------------------------------------------- seeds */
/** A boss kill rolls its seed lines, each on its own, for this player. Practice runs never call this. */
export function rollSeeds(p: Profile, dg: DungeonInfo, boss: string, rng: Rng, luck = 1): Record<string, number> {
  const got: Record<string, number> = {};
  for (const sd of dg.seeds || []) {
    if (sd.boss !== boss || rng() >= sd.rate * luck) continue;
    got[sd.seed] = (got[sd.seed] || 0) + 1;
    p.vale.seeds[sd.seed] = (p.vale.seeds[sd.seed] || 0) + 1;
    count(p, 'vale.seeds');
  }
  return got;
}
export const seedTotal = (p: Profile): number => Object.values(p.vale.seeds).reduce((a, n) => a + n, 0);

/* ---------------------------------------------------------------- beds */
export type BedPhase = 'empty' | 'growing' | 'ready';
export const bedPhase = (b: BedState): BedPhase => (!b.seed ? 'empty' : b.grown >= GROW_CLEARS ? 'ready' : 'growing');
/** clears still to go before a bed is ready */
export const clearsLeft = (b: BedState): number => Math.max(0, GROW_CLEARS - b.grown);
export const readyBeds = (p: Profile): number => p.vale.beds.filter((b) => bedPhase(b) === 'ready').length;

/** Plant a seed in an empty bed. Whether it shimmers is rolled now, so you see it while it grows. */
export function plant(p: Profile, bed: number, seed: string, rng: Rng): boolean {
  const b = p.vale.beds[bed];
  if (!b || b.seed || !PLANTS[seed] || (p.vale.seeds[seed] || 0) <= 0) return false;
  p.vale.seeds[seed]--;
  if (!p.vale.seeds[seed]) delete p.vale.seeds[seed];
  p.vale.beds[bed] = { seed, grown: 0, shimmer: rng() < SHIMMER };
  count(p, 'vale.planted');
  return true;
}

/** A dungeon clear (Normal or Heroic, never practice): every planted bed grows a step. Returns how many just became ready. */
export function growBeds(p: Profile): number {
  let ready = 0;
  for (const b of p.vale.beds) {
    if (!b.seed || b.grown >= GROW_CLEARS) continue;
    b.grown++;
    if (b.grown >= GROW_CLEARS) ready++;
  }
  return ready;
}

/* ---------------------------------------------------------------- drops */
export interface ValeDrop { id: string; isNew: boolean; dupe: boolean; placed?: string | null; rate: number }
/** Every line rolls on its own, OSRS style. A duplicate turns into Starlight Dew. */
function rollDrops(p: Profile, table: DropDef[], kc: number, rng: Rng, now: number, luck = 1): ValeDrop[] {
  const out: ValeDrop[] = [];
  for (const d of table) {
    if (rng() >= d.rate * luck) continue;
    const ent = p.collection[d.id];
    if (ent) { ent.n++; out.push({ id: d.id, isNew: false, dupe: true, rate: d.rate }); add(p, 'dew', 2); continue; }
    p.collection[d.id] = { n: 1, kc, at: now };
    out.push({ id: d.id, isNew: true, dupe: false, rate: d.rate, placed: COLLECTIBLES[d.id] ? autoPlace(p, d.id) : null });
  }
  return out;
}
const add = (p: Profile, id: string, n: number): void => { if (n > 0) p.vale.satchel[id] = (p.vale.satchel[id] || 0) + n; };

/* ---------------------------------------------------------------- harvesting */
/** A harvest in progress: rolled at the start, Perfects added at the end. */
export interface Harvest {
  bed: number;
  node: NodeDef;
  shimmer: boolean;
  /** herbs already in your satchel from the roll */
  base: number;
  dew: number;
  drops: ValeDrop[];
  /** the goat your first harvest brings, if this was it */
  gift: string | null;
  /** harvests so far, this one included: the garden's kill count */
  kc: number;
  /** gathering XP its cuts have paid so far */
  xp: number;
}

/** Start a harvest: empties the bed, rolls the yield, the dew and the rare table. Null if the bed isn't ready. */
export function beginHarvest(p: Profile, bed: number, rng: Rng, now = Date.now(), dev: ValeDev = {}): Harvest | null {
  const b = p.vale.beds[bed];
  const node = b?.seed ? PLANTS[b.seed] : undefined;
  if (!b || !node || (bedPhase(b) !== 'ready' && !dev.free)) return null;
  const shimmer = b.shimmer;
  p.vale.beds[bed] = emptyBed();
  const [lo, hi] = node.yield;
  const base = lo + Math.floor(rng() * (hi - lo + 1)) + yieldBonus(skillRank(p, 'gather'));
  const dew = shimmer ? 2 + (rng() < 0.5 ? 1 : 0) : 0;
  add(p, node.gives, base);
  add(p, 'dew', dew);
  const kc = count(p, 'vale.harvests');
  // your first harvest brings a goat into the garden: not a roll, she's just yours
  let gift: string | null = null;
  if (!p.collection[FIRST_HARVEST_GIFT]) {
    gift = FIRST_HARVEST_GIFT;
    p.collection[gift] = { n: 1, kc, at: now };
    autoPlace(p, gift);
  }
  const drops = rollDrops(p, GARDEN_TABLE, kc, rng, now, dev.luck || 1);
  return { bed, node, shimmer, base, dew, drops, gift, kc, xp: 0 };
}

/** One cut or pluck lands: its XP is yours straight away, so leaving mid-harvest keeps it. Three a harvest. */
export function cutXp(p: Profile, h: Harvest, g: Grade): XpGain {
  const amt = CUT_XP[g] + (h.shimmer ? SHIMMER_XP : 0);
  h.xp += amt;
  return gain(p, 'gather', amt);
}

export interface HarvestEnd { gained: number; perfects: number; xp: number; rankUp: RankUp | null }
/** Finish a harvest: each Perfect adds one more to the satchel, and finishing pays a little XP. */
export function endHarvest(p: Profile, h: Harvest, perfects: number): HarvestEnd {
  const pf = Math.max(0, Math.min(3, Math.floor(perfects)));
  add(p, h.node.gives, pf);
  if (pf) count(p, 'vale.perfects', pf);
  const rankUp = addXp(p, 'gather', HARVEST_XP);
  h.xp += HARVEST_XP;
  return { gained: h.base + pf, perfects: pf, xp: h.xp, rankUp };
}

/* ---------------------------------------------------------------- brewing */
export const recipeUnlocked = (p: Profile, id: string): boolean => !!RECIPES[id] && skillRank(p, 'brew') >= RECIPES[id].rank;
/** How many times you could brew this right now. */
export function canBrew(p: Profile, id: string): number {
  const r = RECIPES[id];
  if (!r || !recipeUnlocked(p, id)) return 0;
  return Math.min(...Object.entries(r.needs).map(([k, n]) => Math.floor((p.vale.satchel[k] || 0) / n)));
}
export type BrewQuality = 'perfect' | 'good' | 'rough';
export interface BrewDone { recipe: string; bottles: number; quality: BrewQuality; xp: number; rankUp: RankUp | null }
/** A brew on the fire: the ingredients went in when the stir started, so leaving now still bottles it. */
export interface BrewRun { recipe: string; xp: number; laps: number }
/** The last ingredient goes in: they leave your satchel and the stir begins. Null if you can't brew it. */
export function startBrew(p: Profile, id: string): BrewRun | null {
  const r = RECIPES[id];
  if (!r || canBrew(p, id) < 1) return null;
  for (const [k, n] of Object.entries(r.needs)) p.vale.satchel[k] -= n;
  count(p, 'vale.brews');
  return { recipe: id, xp: 0, laps: 0 };
}
/** One lap of the stir: its XP straight away. */
export function lapXp(p: Profile, b: BrewRun, q: BrewQuality): XpGain {
  b.laps++;
  b.xp += LAP_XP[q];
  return gain(p, 'brew', LAP_XP[q]);
}
/** Bottle it: a Perfect stir fills one more bottle, and bottling pays a little XP. */
export function finishBrew(p: Profile, b: BrewRun, quality: BrewQuality): BrewDone {
  const r = RECIPES[b.recipe];
  const bottles = r.makes + (quality === 'perfect' ? 1 : 0);
  p.vale.shelf[b.recipe] = (p.vale.shelf[b.recipe] || 0) + bottles;
  const rankUp = addXp(p, 'brew', BOTTLE_XP);
  b.xp += BOTTLE_XP;
  return { recipe: b.recipe, bottles, quality, xp: b.xp, rankUp };
}
/** Brew once in one go: three laps at one quality (the tests use this). */
export function brew(p: Profile, id: string, quality: BrewQuality): BrewDone | null {
  const b = startBrew(p, id);
  if (!b) return null;
  let up: RankUp | null = null;
  for (let i = 0; i < 3; i++) up = lapXp(p, b, quality).rankUp || up;
  const done = finishBrew(p, b, quality);
  return { ...done, rankUp: done.rankUp || up };
}

/** The brew you bring to the door: your chosen one, if you have a bottle of it. */
export function broughtBrew(p: Profile): string | null {
  const d = p.vale.drink;
  return d && RECIPES[d] && (p.vale.shelf[d] || 0) > 0 ? d : null;
}
/** Your bottle was the one poured for the party: one off the shelf (practice keeps it). */
export function spendBottle(p: Profile, id: string): void {
  if ((p.vale.shelf[id] || 0) > 0) p.vale.shelf[id]--;
}

/** Every ingredient name, for anything that lists them. */
export const ingredientName = (id: string): string => INGREDIENTS[id]?.name || RECIPES[id]?.name || id;
