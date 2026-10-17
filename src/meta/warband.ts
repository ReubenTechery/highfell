/**
 * The Warband: your other heroes, made in the bunk room, who fill your party's other seats on Normal in their own
 * gear. A new player starts with one hero, and bots (in gear at that hero's level) fill the other seats, so the
 * first hero is the star. The Warband opens once you've cleared every dungeon once (each one's Normal), and
 * then it stays open: the moment is kept in `counters`, so a dungeon added later never shuts it again. Saves
 * that already had more than one hero, and anyone who has earned a new race from a log, have it open too.
 */
import { ACHIEVEMENT_LIST, DUNGEONS } from '../content';
import type { DungeonInfo } from '../content/types';
import type { Profile } from './profile';

/** the counter that remembers the Warband opened */
export const WARBAND_KEY = 'warband.open';

/** the dungeons whose Normal you clear to open it: every one built, in the order they're registered */
export const warbandDungeons = (): DungeonInfo[] => Object.values(DUNGEONS).filter((d) => !d.heroicOf);

/** The dungeons still to clear once before the Warband opens (none once it's open). */
export function warbandLeft(p: Profile): DungeonInfo[] {
  return warbandOpen(p) ? [] : warbandDungeons().filter((d) => !(p.dungeons[d.id]?.clears > 0));
}

/** a log's race prize is yours: you can make one of that race, so the Warband is open */
const earnedRace = (p: Profile): boolean => ACHIEVEMENT_LIST.some((a) => !!a.reward.race && !!p.achievements[a.id]);
const allCleared = (p: Profile): boolean => warbandDungeons().every((d) => p.dungeons[d.id]?.clears > 0);

/** Whether your Warband is open: more heroes can be made, and on Normal they take the other seats. */
export function warbandOpen(p: Profile): boolean {
  return !!p.counters[WARBAND_KEY] || p.roster.length > 1 || earnedRace(p) || allCleared(p);
}

/** After a clear: if that clear has just opened the Warband, remember it and say so, once. (A save that already
 *  had it open another way is remembered quietly.) */
export function openWarband(p: Profile): boolean {
  if (p.counters[WARBAND_KEY]) return false;
  if (p.roster.length > 1 || earnedRace(p)) { p.counters[WARBAND_KEY] = 1; return false; }
  if (!allCleared(p)) return false;
  p.counters[WARBAND_KEY] = 1;
  return true;
}

/** What opens your Warband, in a line: the dungeons still to clear once. */
export function warbandWhy(p: Profile): string {
  const left = warbandLeft(p).map((d) => d.name);
  const list = left.length > 1 ? `${left.slice(0, -1).join(', ')} and ${left[left.length - 1]}` : left[0] || 'every dungeon';
  return `Clear ${list} once to open your Warband: more heroes to fill your seats.`;
}
