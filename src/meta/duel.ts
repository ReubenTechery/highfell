/**
 * The duel card (docs/duo.md): at the chest, a card for each of you, side by side. What each of you did in the run
 * (its counts, dungeon/duo.js S.duel), your share of the damage, one MVP line each from what you did most, who won
 * the duel, and your bests on this dungeon beside today's numbers. Whoever did the most damage wins: a combo, a
 * relayed bomb and an Exposed window all count as your damage, so the one doing the mechanics tops it. With a bot
 * it's you against the bot and your own best. Nothing drops because of it: loot stays as it was. Your bests are
 * kept in `p.counters`, so the save's shape never changes.
 */
import type { Profile } from './profile';

/** what a run counts for each hero (dungeon/duo.js DUEL_KEYS) */
export interface DuelCounts { dmg: number; bigCrit: number; combosSet: number; combosLanded: number; lifts: number; breaks: number; keys: number; pickups: number; bombs: number }
export const DUEL_COUNTS: (keyof DuelCounts)[] = ['dmg', 'bigCrit', 'combosSet', 'combosLanded', 'lifts', 'breaks', 'keys', 'pickups', 'bombs'];

/** one of you, as the run saw them: `hero` is one of your heroes' ids (you, or one of yours in the other seat), null
 *  for a bot; `bot` is anyone not played by a person */
export interface DuelSide { name: string; cls: string; you: boolean; bot: boolean; hero: string | null; counts: DuelCounts }

/** the MVP lines, a hero's best thing (names marked * in docs/duo.md are drafts, kept here so they can change) */
export type MvpKey = 'damage' | 'combos' | 'saves' | 'bombs';
export const MVP_ORDER: MvpKey[] = ['damage', 'combos', 'saves', 'bombs'];
/** the line's words when you did the most of it, and when your mate did more */
export const MVP_WORDS: Record<MvpKey, { lead: string; plain: string }> = {
  damage: { lead: 'Top damage', plain: 'Damage' },
  combos: { lead: 'Combo maker', plain: 'Combos' },
  saves: { lead: 'Lifesaver', plain: 'Saves' },
  bombs: { lead: 'Bomb thrower', plain: 'Bombs' },
};
/** how much of each a hero did: damage, combos (set up and landed), saves (curses lifted, chains broken, mates picked
 *  up) and bombs knocked */
const amountOf = (c: DuelCounts, k: MvpKey): number =>
  k === 'damage' ? c.dmg : k === 'combos' ? c.combosSet + c.combosLanded : k === 'saves' ? c.lifts + c.breaks + c.pickups : c.bombs;

/** an MVP line: what it's for, its words, and the number that goes with it (a share of the damage as a percent, or a
 *  count) */
export interface MvpLine { key: MvpKey; lead: boolean; words: string; n: number }
/** a side on the card: its counts, its share of the pair's damage (0 to 1) and its MVP line */
export interface DuelCard extends DuelSide { share: number; mvp: MvpLine }

/** your bests on a dungeon: damage in a run, the biggest crit, and combos (set up and landed) */
export interface DuelBests { dmg: number; bigCrit: number; combos: number }
export const BEST_KEYS: (keyof DuelBests)[] = ['dmg', 'bigCrit', 'combos'];

export interface DuelResult {
  dungeon: string;
  /** the cards, in seat order */
  cards: DuelCard[];
  /** you did the most damage */
  won: boolean;
  /** your bests on this dungeon before this run (none for a run that doesn't count), and what this run beat */
  best: DuelBests | null;
  newBest: (keyof DuelBests)[];
}

/** One MVP line for each side, from what they did most: the thing they did the biggest share of (ties go in
 *  MVP_ORDER). It's a lead line when nobody did more of it. A side that did nothing gets its damage. */
function mvpOf(sides: DuelSide[], i: number): MvpLine {
  const mine = sides[i].counts;
  let best: { key: MvpKey; k: number } | null = null;
  for (const key of MVP_ORDER) {
    const n = amountOf(mine, key), all = sides.reduce((a, s) => a + amountOf(s.counts, key), 0);
    if (n <= 0 || all <= 0) continue;
    const k = n / all;
    if (!best || k > best.k + 1e-9) best = { key, k };
  }
  const key = best ? best.key : 'damage';
  const lead = !!best && sides.every((s, j) => j === i || amountOf(s.counts, key) < amountOf(mine, key));
  const total = sides.reduce((a, s) => a + s.counts.dmg, 0);
  const n = key === 'damage' ? Math.round(total > 0 ? (mine.dmg / total) * 100 : 0) : amountOf(mine, key);
  return { key, lead, words: MVP_WORDS[key][lead ? 'lead' : 'plain'], n };
}

/** The duel from what the run counted: a card each, in seat order, and whether you won (the most damage, and more
 *  than anyone else). Bests are left for recordDuel. */
export function duelOf(dungeon: string, sides: DuelSide[]): DuelResult {
  const total = sides.reduce((a, s) => a + s.counts.dmg, 0);
  const cards = sides.map((s, i) => ({ ...s, share: total > 0 ? s.counts.dmg / total : 0, mvp: mvpOf(sides, i) }));
  const me = cards.find((c) => c.you);
  const won = !!me && me.counts.dmg > 0 && cards.every((c) => c === me || c.counts.dmg < me.counts.dmg);
  return { dungeon, cards, won, best: null, newBest: [] };
}

const bestKey = (dungeon: string, k: keyof DuelBests): string => `duel.${dungeon}.${k}`;
const todayOf = (c: DuelCounts): DuelBests => ({ dmg: Math.round(c.dmg), bigCrit: Math.round(c.bigCrit), combos: c.combosSet + c.combosLanded });

/** your bests on a dungeon (a Heroic is its own), zero before your first duel there */
export function duelBests(p: Profile, dungeon: string): DuelBests {
  return { dmg: p.counters[bestKey(dungeon, 'dmg')] || 0, bigCrit: p.counters[bestKey(dungeon, 'bigCrit')] || 0, combos: p.counters[bestKey(dungeon, 'combos')] || 0 };
}

/** duels you've won, anywhere (for the achievements to come) */
export const DUEL_WINS = 'duel.wins';

/** A run that counts: your bests before it go on the card, and anything you beat is kept as your new best. A first
 *  duel on a dungeon sets your bests without calling them new. A win is counted. */
export function recordDuel(p: Profile, r: DuelResult): DuelResult {
  const me = r.cards.find((c) => c.you);
  if (!me) return r;
  const runs = `duel.${r.dungeon}.runs`, first = !p.counters[runs];
  const best = duelBests(p, r.dungeon), today = todayOf(me.counts);
  const beat = BEST_KEYS.filter((k) => today[k] > best[k]);
  for (const k of beat) p.counters[bestKey(r.dungeon, k)] = today[k];
  p.counters[runs] = (p.counters[runs] || 0) + 1;
  if (r.won) p.counters[DUEL_WINS] = (p.counters[DUEL_WINS] || 0) + 1;
  return { ...r, best, newBest: first ? [] : beat };
}
