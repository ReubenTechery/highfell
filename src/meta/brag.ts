/**
 * Brags: what a run gave that's worth showing off, for the Share card. A run can have several, best first:
 * the pet, a whole collection log, a finished set, a new unique (the rarest first), a new best time, then an
 * achievement. A pet or a mount counts every time it drops (the chest gives each its own moment); anything
 * else in the log counts when it's new. Nothing is saved: it reads the run's loot, the achievements it
 * unlocked and the collection.
 */
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS } from '../content';
import type { RunLoot } from './loot';
import { standsOf } from './logs';
import type { Profile } from './profile';

export type BragKind = 'pet' | 'log' | 'set' | 'unique' | 'pb' | 'ach';
/** best first */
export const BRAG_ORDER: BragKind[] = ['pet', 'log', 'set', 'unique', 'pb', 'ach'];

export interface Brag {
  kind: BragKind;
  /** where it happened: the run's dungeon (a heroic one is its own), or an achievement's */
  dungeon: string;
  /** a drop (pet, unique), a set (set), an achievement (log, ach); empty for a best time */
  id: string;
  /** a drop's rate */
  rate?: number;
  /** the kill count it came at (a set: the piece that finished it) */
  kc?: number;
  boss?: string;
  /** a set finished in gilding kits, Heroic's log */
  gilded?: boolean;
  /** a best time, in seconds, and the clears so far */
  time?: number;
  clears?: number;
}

/** What one run had to show off, best first. `unlocked` is the achievements it earned. */
export function bragsOf(p: Profile, loot: RunLoot, unlocked: string[]): Brag[] {
  const out: Brag[] = [], where = loot.dungeon;
  const table = loot.drops.filter((d) => d.source === 'table');
  const fresh = new Set(table.filter((d) => d.isNew).map((d) => d.id));
  // a new drop is in the collection already, except in a preview, which adds nothing
  const has = (id: string): boolean => fresh.has(id) || !!p.collection[id];
  for (const d of table) {
    const kind = COLLECTIBLES[d.id]?.kind;
    if (d.isNew || kind === 'pet' || kind === 'mount') out.push({ kind: kind === 'pet' ? 'pet' : 'unique', dungeon: where, id: d.id, rate: d.rate, kc: d.kc, boss: d.boss });
  }
  // a set the run finished: its last piece came this run (on Heroic, the normal log's sets and the kits')
  const dg = DUNGEONS[where], logs = dg?.heroicOf ? [where, dg.heroicOf] : [where];
  for (const log of logs) for (const s of standsOf(log)) {
    const last = table.filter((d) => d.isNew && s.pieces.includes(d.id)).pop();
    if (last && s.pieces.every(has)) out.push({ kind: 'set', dungeon: where, id: s.set.id, gilded: !!DUNGEONS[log]?.heroicOf, kc: last.kc, boss: last.boss });
  }
  if (loot.newPb) out.push({ kind: 'pb', dungeon: where, id: '', time: loot.time, clears: loot.clears });
  for (const id of unlocked) if (ACHIEVEMENTS[id]) out.push(achBrag(id, where));
  return out.sort((a, b) => BRAG_ORDER.indexOf(a.kind) - BRAG_ORDER.indexOf(b.kind) || (a.rate ?? 1) - (b.rate ?? 1));
}

/** An achievement as a brag: filling a whole collection log is its own moment. */
export function achBrag(id: string, where = ACHIEVEMENTS[id]?.dungeon || ''): Brag {
  return { kind: ACHIEVEMENTS[id]?.log ? 'log' : 'ach', dungeon: where, id };
}
