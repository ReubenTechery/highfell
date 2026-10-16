/**
 * What the collection log gives. Filling a dungeon's whole log (every drop for every role) earns an
 * achievement, one per dungeon and one per heroic version, and its reward can open a look for the house
 * and a new kind of hero (a race). Until it's earned they stay locked and the log's progress bar says
 * how close you are. Earned is for keeps, even if a later update adds a slot to the log.
 */
import { ACHIEVEMENT_LIST, DUNGEONS, ITEMS, SETS, itemOf } from '../content';
import { gilded } from '../content/kits';
import { RACES, type RaceId } from '../content/folk';
import type { AchievementDef, SetDef } from '../content/types';
import type { Profile } from './profile';

/** The slots that count towards finishing a dungeon's log: all of them but the bonus ones (the pet). */
export function logSlots(dungeon: string): string[] {
  const dg = DUNGEONS[dungeon];
  return dg ? dg.collection.filter((id) => !(dg.bonus || []).includes(id)) : [];
}

/** Everything in the collection counts as seen once the log has shown it, so its New flags go. Says whether
 *  anything changed, so the caller knows to save. */
export function markSeen(p: Profile, at = Date.now()): boolean {
  let changed = false;
  for (const id of Object.keys(p.collection)) if (!p.seen[id]) { p.seen[id] = at; changed = true; }
  return changed;
}

/** How full a dungeon's collection log is: slots filled, out of the ones that count. */
export function logProgress(p: Profile, dungeon: string): { have: number; need: number } {
  const slots = logSlots(dungeon);
  return { have: slots.filter((id) => p.collection[id]).length, need: slots.length };
}
export function logDone(p: Profile, dungeon: string): boolean {
  const { have, need } = logProgress(p, dungeon);
  return need > 0 && have >= need;
}

/** The achievement for filling a dungeon's whole log. */
export const logAchievement = (dungeon: string): AchievementDef | undefined => ACHIEVEMENT_LIST.find((a) => a.log === dungeon);
/** A dungeon's log is finished: its achievement is earned, which is for keeps even if a slot is added to the log
 *  later (a dungeon with no log achievement: every slot that counts is filled). */
export function logFinished(p: Profile, dungeon: string): boolean {
  const a = logAchievement(dungeon);
  return a ? !!p.achievements[a.id] : logDone(p, dungeon);
}

/** The achievement whose reward gives a look or a race, if one does (the rest are open from the start). */
export const unlockOf = (kind: 'look' | 'race', id: string): AchievementDef | undefined => ACHIEVEMENT_LIST.find((a) => a.reward[kind] === id);

/** A look or a race is open when nothing locks it, or you've earned what does. A race that's earned in
 *  its own dungeon (gnomes, goblins, orcs) stays locked until there's a dungeon that gives it. */
export function opened(p: Profile, kind: 'look' | 'race', id: string): boolean {
  const a = unlockOf(kind, id);
  if (!a) return !(kind === 'race' && RACES[id as RaceId]?.earned);
  return !!p.achievements[a.id];
}

/** How close you are to opening a look or a race: the slots of the log that opens it (0 of 0 when
 *  nothing locks it, and everything once it's earned). */
export function openProgress(p: Profile, kind: 'look' | 'race', id: string): { have: number; need: number } {
  const a = unlockOf(kind, id);
  if (!a) return { have: 0, need: 0 };
  const pr = a.log ? logProgress(p, a.log) : { have: 0, need: 1 };
  return p.achievements[a.id] ? { have: pr.need, need: pr.need } : pr;
}

/** A set on its armour stand in the log: its three pieces and the boss weapon of its role. A heroic
 *  dungeon's stands hold their gilding kits: the same pieces, gilded. */
export interface Stand { set: SetDef; pieces: string[]; weapon: string | null }

/** Every set of a dungeon on its stand, in the order the sets are listed. A heroic dungeon's stands hold the
 *  kits. */
export function standsOf(dungeon: string): Stand[] {
  const dg = DUNGEONS[dungeon];
  if (!dg) return [];
  const base = dg.heroicOf || dg.id, gild = (id: string): string => (dg.heroicOf ? gilded(id) : id);
  return Object.values(SETS).filter((s) => s.dungeon === base).map((set) => {
    const weapon = Object.values(ITEMS).find((d) => d.kind === 'unique' && d.dungeon === base && d.role === set.role && (d.cls || null) === (set.cls || null));
    return { set, pieces: set.pieces.map(gild), weapon: weapon ? gild(weapon.id) : null };
  });
}

/** The pieces of a stand, weapon last. */
export const standPieces = (s: Stand): string[] => (s.weapon ? [...s.pieces, s.weapon] : s.pieces);

/** The log's shelf: the dungeon's drops nobody wears (its trophy, and its pet, mount and dye), the slots
 *  that count first, then the bonus ones. */
export function shelfOf(dungeon: string): string[] {
  const dg = DUNGEONS[dungeon];
  if (!dg) return [];
  const bonus = dg.bonus || [], loose = dg.collection.filter((id) => !itemOf(id));
  return [...loose.filter((id) => !bonus.includes(id)), ...loose.filter((id) => bonus.includes(id))];
}
