/**
 * Sets, as the player sees them: every dungeon has a set of 3 for each class (helm, shoulders, chest), and
 * wearing 2 and all 3 of one switches its two bonuses on. This is where the screens get a set's state from,
 * so the chest, the armoury, the log and the Dungeons sheet all say the same thing: which pieces you have,
 * which are on, and each bonus On, ready to put on, or how many more it needs. The boss weapon leans on the
 * set's stand in the log, but it isn't one of the 3.
 */
import { DUNGEONS, ITEMS, SETS } from '../content';
import { ACT1_DUNGEONS } from '../content/act1';
import type { ItemDef, SetDef, SlotId } from '../content/types';
import { fitsHero, worn, type Worn } from './gear';
import type { Hero, Profile } from './profile';

/** A set's bonus: On (worn), Ready (you have the pieces, but they aren't all on) or how many more to find. */
export type BonusState = 'on' | 'ready' | 'off';
export interface SetPiece { id: string; slot: SlotId; have: boolean; worn: boolean }
export interface SetState {
  set: SetDef;
  pieces: SetPiece[];
  /** pieces found (by any hero: a set piece is for every hero of its class) and pieces worn by this hero */
  have: number;
  worn: number;
  /** the 2-piece and 3-piece bonuses, in that order, and what putting on the piece being tried would do to each
   *  (`later`: a bonus still being made, which does nothing yet) */
  bonuses: { n: 2 | 3; desc: string; state: BonusState; more: number; change?: 'turnon' | 'turnoff'; later?: boolean }[];
  done: boolean;
}

/** where a dungeon comes on the ladder (dungeons not on it go last) */
const rank = (dungeon: string): number => { const i = ACT1_DUNGEONS.findIndex((m) => m.id === dungeon); return i < 0 ? 99 : i; };

/** The sets a class can wear, one per dungeon, in the order you meet the dungeons. */
export function setsFor(h: Hero): SetDef[] {
  return Object.values(SETS).filter((s) => { const d = ITEMS[s.pieces[0]]; return !!d && fitsHero(d, h); }).sort((a, b) => rank(a.dungeon) - rank(b.dungeon));
}

/** A set's state for a hero (or for nobody: then nothing is worn). `plus`: pieces to count as found that the
 *  save doesn't have yet (a chest's preview adds nothing to it). `trying`: a piece the armoury has picked, to
 *  say which bonus putting it on would turn on or off. */
export function setState(p: Profile, h: Hero | null, setId: string, o: { plus?: string[]; trying?: ItemDef } = {}): SetState | null {
  const set = SETS[setId];
  if (!set) return null;
  const w = h ? worn(p, h) : null;
  const count = (x: Record<SlotId, Worn>): number => set.pieces.filter((id) => x[ITEMS[id].slot].def.id === id).length;
  const pieces = set.pieces.map((id) => ({ id, slot: ITEMS[id].slot, have: !!p.collection[id] || !!o.plus?.includes(id), worn: !!w && w[ITEMS[id].slot].def.id === id }));
  const have = pieces.filter((x) => x.have).length, on = pieces.filter((x) => x.worn).length;
  // what this set's count would be with the tried piece on (it can join this set, or break it from another)
  const t = o.trying, next = w && t ? count({ ...w, [t.slot]: { slot: t.slot, def: t, unique: t.kind !== 'gear' } }) : on;
  const bonus = (n: 2 | 3, desc: string, later = false): SetState['bonuses'][number] => {
    const change = !later && (on < n) !== (next < n) ? (next >= n ? 'turnon' : 'turnoff') : undefined;
    return { n, desc, state: on >= n ? 'on' : have >= n ? 'ready' : 'off', more: Math.max(0, n - have), ...(change ? { change } : {}), ...(later ? { later } : {}) };
  };
  return { set, pieces, have, worn: on, bonuses: [bonus(2, set.bonus2.desc), bonus(3, set.bonus3.desc, !set.bonus3.ready)], done: have >= set.pieces.length };
}

/** The set a hero is on, for the armoury to show off: the one they wear most of, or else the one they have
 *  most of, or else the first dungeon's (a tie goes to the dungeon you meet first). */
export function chaseSet(p: Profile, h: Hero): string | null {
  const all = setsFor(h).map((s) => setState(p, h, s.id)!);
  if (!all.length) return null;
  const best = (k: 'worn' | 'have'): SetState | undefined => all.reduce<SetState | undefined>((a, s) => (s[k] > (a ? a[k] : 0) ? s : a), undefined);
  return (best('worn') || best('have') || all[0]).set.id;
}

/** The set a dungeon drops for a hero's class (its Normal pieces; a heroic dungeon's are the same set, gilded). */
export function dungeonSet(h: Hero, dungeon: string): SetDef | undefined {
  const base = DUNGEONS[dungeon]?.heroicOf || dungeon;
  return setsFor(h).find((s) => s.dungeon === base);
}
