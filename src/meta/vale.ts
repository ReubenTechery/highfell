/**
 * Riding out: the rules for gathering, errands and brewing. Nothing here touches a dungeon except a
 * brew you choose to drink, and nothing here makes gear: what you get is ingredients, brews, story
 * pages and collectibles. Places regrow overnight and bank up to three days, so a missed day is
 * never a loss.
 *
 * A harvest is rolled the moment you start its close-up (like a boss kill), so closing the page
 * mid-way never loses a drop and backing out can never be used to reroll one. Perfects add on top
 * when the close-up ends.
 */
import { COLLECTIBLES } from '../content';
import { ERRAND_BANK, INGREDIENTS, NODE_BANK, NODE_PER_DAY, PLACES, RANK_XP, RECIPES, SHIMMER } from '../content/vale';
import type { DropDef, ErrandDef, LorePage, NodeDef, PlaceDef } from '../content/types';
import type { Rng } from '../core/rng';
import { autoPlace } from './hearth';
import { count, type PlaceState, type Profile } from './profile';

/** A day number in the player's own time zone: nodes regrow at their midnight. */
export const dayOf = (now: number): number => Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000);

/** Testing switches from the settings sheet: never saved, never on for anyone else. */
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

/* ---------------------------------------------------------------- places */
/** A place's state, created on first visit and topped up for the days since you were last there. */
export function placeState(p: Profile, placeId: string, now = Date.now(), rng: Rng = Math.random): PlaceState {
  const pl = PLACES[placeId];
  const today = dayOf(now);
  let st = p.vale.places[placeId];
  if (!st) st = p.vale.places[placeId] = { nodes: {}, errands: { n: 1, day: today, next: 0 } };
  for (const n of pl?.nodes || []) {
    let ns = st.nodes[n.id];
    // a first visit starts with a few harvests ready, so the first trip is a proper one
    if (!ns) ns = st.nodes[n.id] = { n: 3, day: today, shimmer: rng() < SHIMMER };
    if (today > ns.day) { ns.n = Math.min(NODE_BANK, ns.n + (today - ns.day) * NODE_PER_DAY); ns.day = today; }
  }
  if (today > st.errands.day) { st.errands.n = Math.min(ERRAND_BANK, st.errands.n + (today - st.errands.day)); st.errands.day = today; }
  return st;
}

/** Your first ride out: everyone gets a hill goat, and it moves into an empty stall. */
export function ensureStarter(p: Profile, now = Date.now()): boolean {
  if (p.collection['mount.goat']) return false;
  p.collection['mount.goat'] = { n: 1, kc: 0, at: now };
  autoPlace(p, 'mount.goat');
  return true;
}
/** The mount you ride: whatever is in your stall, else the goat. */
export const rideMount = (p: Profile): string => {
  const m = p.hearth.spots['mount.stall'];
  return m && COLLECTIBLES[m]?.kind === 'mount' && p.collection[m] ? m : 'mount.goat';
};

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

/* ---------------------------------------------------------------- gathering */
/** A harvest in progress: rolled at the start, Perfects added at the end. */
export interface Harvest {
  place: string;
  node: NodeDef;
  shimmer: boolean;
  /** ingredients already in your satchel from the roll */
  base: number;
  dew: number;
  drops: ValeDrop[];
  /** harvests of this spot so far, this one included: its kill count */
  kc: number;
}

export function readyAt(p: Profile, placeId: string, nodeId: string, now = Date.now()): number {
  return placeState(p, placeId, now).nodes[nodeId]?.n ?? 0;
}

/** Start a harvest: spends one, rolls the yield, the dew and the rare table. Null if none are ready. */
export function beginHarvest(p: Profile, placeId: string, nodeId: string, rng: Rng, now = Date.now(), dev: ValeDev = {}): Harvest | null {
  const pl = PLACES[placeId], node = pl?.nodes.find((n) => n.id === nodeId);
  if (!pl || !node) return null;
  const ns = placeState(p, placeId, now, rng).nodes[nodeId];
  if (ns.n <= 0 && !dev.free) return null;
  if (!dev.free) ns.n--;
  const shimmer = ns.shimmer;
  ns.shimmer = rng() < SHIMMER;
  const [lo, hi] = node.yield;
  const base = lo + Math.floor(rng() * (hi - lo + 1)) + yieldBonus(skillRank(p, 'gather'));
  const dew = shimmer ? 1 + (rng() < 0.35 ? 1 : 0) : 0;
  add(p, node.gives, base);
  add(p, 'dew', dew);
  const kc = count(p, `vale.${placeId}.${nodeId}`);
  count(p, 'vale.harvests');
  const drops = rollDrops(p, node.table, kc, rng, now, dev.luck || 1);
  return { place: placeId, node, shimmer, base, dew, drops, kc };
}

export interface HarvestEnd { gained: number; perfects: number; xp: number; rankUp: RankUp | null }
/** Finish a harvest: each Perfect adds one more to the satchel. */
export function endHarvest(p: Profile, h: Harvest, perfects: number): HarvestEnd {
  const pf = Math.max(0, Math.min(3, Math.floor(perfects)));
  add(p, h.node.gives, pf);
  if (pf) count(p, 'vale.perfects', pf);
  const xp = 10 + pf * 4 + (h.shimmer ? 6 : 0);
  return { gained: h.base + pf, perfects: pf, xp, rankUp: addXp(p, 'gather', xp) };
}

/* ---------------------------------------------------------------- errands */
/** Today's errand at a place, or null when it's done for now. The order is fixed per place, so it's the same on every device. */
export function errandAt(p: Profile, placeId: string, now = Date.now()): ErrandDef | null {
  const pl = PLACES[placeId];
  if (!pl) return null;
  const st = placeState(p, placeId, now);
  if (st.errands.n <= 0) return null;
  return pl.errands[(st.errands.next * 3) % pl.errands.length];
}
/** What a deliver errand still needs from your satchel, or null if you can hand it over now. */
export function errandShort(p: Profile, e: ErrandDef): Record<string, number> | null {
  if (e.kind !== 'deliver' || !e.needs) return null;
  const short: Record<string, number> = {};
  for (const [k, n] of Object.entries(e.needs)) { const have = p.vale.satchel[k] || 0; if (have < n) short[k] = n - have; }
  return Object.keys(short).length ? short : null;
}

export interface ErrandDone { errand: ErrandDef; page: LorePage | null; drops: ValeDrop[]; xp: number; rankUp: RankUp | null }
export function completeErrand(p: Profile, placeId: string, rng: Rng, now = Date.now(), dev: ValeDev = {}): ErrandDone | null {
  const pl: PlaceDef | undefined = PLACES[placeId];
  const e = errandAt(p, placeId, now);
  if (!pl || !e || errandShort(p, e)) return null;
  for (const [k, n] of Object.entries(e.needs || {})) p.vale.satchel[k] -= n;
  const st = placeState(p, placeId, now);
  st.errands.n--; st.errands.next++;
  const page = pl.lore.find((l) => !p.vale.lore.includes(l.id)) || null;
  if (page) p.vale.lore.push(page.id);
  const kc = count(p, `vale.${placeId}.errands`);
  count(p, 'vale.errands');
  const drops = rollDrops(p, pl.errandTable, kc, rng, now, dev.luck || 1);
  const xp = 15;
  return { errand: e, page, drops, xp, rankUp: addXp(p, 'gather', xp) };
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
/** Brew once: uses the ingredients, fills bottles. A Perfect stir fills one more. */
export function brew(p: Profile, id: string, quality: BrewQuality): BrewDone | null {
  const r = RECIPES[id];
  if (!r || canBrew(p, id) < 1) return null;
  for (const [k, n] of Object.entries(r.needs)) p.vale.satchel[k] -= n;
  const bottles = r.makes + (quality === 'perfect' ? 1 : 0);
  p.vale.shelf[id] = (p.vale.shelf[id] || 0) + bottles;
  count(p, 'vale.brews');
  const xp = 20 + (quality === 'perfect' ? 10 : quality === 'good' ? 4 : 0);
  return { recipe: id, bottles, quality, xp, rankUp: addXp(p, 'brew', xp) };
}

/** The brew for a run from the entrance: one bottle of your chosen brew, if you have one. */
export function drinkForRun(p: Profile, spend: boolean): string | null {
  const d = p.vale.drink;
  if (!d || !RECIPES[d] || (p.vale.shelf[d] || 0) <= 0) return null;
  if (spend) p.vale.shelf[d]--;
  return d;
}

/** Every ingredient name, for anything that lists them. */
export const ingredientName = (id: string): string => INGREDIENTS[id]?.name || RECIPES[id]?.name || id;
