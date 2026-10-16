/**
 * Who sits where in a run: three seats, one per role, and who may go in. Normal is fully playable on
 * your own: you take your hero's seat and your own Warband heroes from your bunk room fill the others
 * (bots stand in for roles you have no hero for), or you can group up. Heroic is the group run: it needs
 * at least two real players, a bot takes the seat nobody fills, and your Warband heroes never sit in.
 * A hero short of a dungeon's recommended Power is warned first, never stopped.
 */
import { RARITY } from '../content/gear';
import { ORDER, ROLES } from '../content/roles';
import type { DungeonInfo, RoleId } from '../content/types';
import { loadoutFor, wholeIlvl } from './gear';
import { activeHero, roleOf, setActive, type Hero, type Profile } from './profile';
import { warbandOpen } from './warband';

export interface Seat { role: RoleId; hero: Hero | null; bot: string | null }

/** Heroic needs at least this many real players. */
export const HEROIC_MIN_PLAYERS = 2;

/** The real players in your group, you first. Until online play arrives, that is only you. */
export function groupOf(p: Profile): Hero[] {
  const h = activeHero(p);
  return h ? [h] : [];
}

/** Why a group can't go in, in plain words, or null when it can. Normal is fine on your own; Heroic
 *  needs at least two real players, each in their own seat. */
export function partyProblem(players: Hero[], o: { heroic: boolean }): string | null {
  if (!players.length) return 'Make a hero first.';
  if (new Set(players.map(roleOf)).size < players.length) return 'Two players can’t take the same seat.';
  if (o.heroic && players.length < HEROIC_MIN_PLAYERS) return 'Heroic needs at least two players. Bring a friend.';
  return null;
}

/** How far a hero falls short of the Power a dungeon recommends: their Power, the dungeon's, and the gap.
 *  `likely` is a whole rarity short or more (Rare against Thimblebriar's 22), where a wipe is very likely. */
export interface PowerGap { have: number; want: number; short: number; likely: boolean }
/** a whole rarity: Common 10, Uncommon 14, Rare 18, Epic 22 */
const RARITY_STEP = RARITY[1].score - RARITY[0].score;

/** The hero against a dungeon's recommended Power (the item level the game shows, as a whole number), or null
 *  when they meet it or it recommends none (a Heroic doesn't yet). A warning, never a lock: the Barrow wants 10,
 *  so a fresh hero is never warned there. */
export function underPowered(p: Profile, h: Hero, dg: DungeonInfo): PowerGap | null {
  const want = dg.recIlvl;
  if (!want) return null;
  const have = wholeIlvl(loadoutFor(p, h).score);
  return have < want ? { have, want, short: want - have, likely: want - have >= RARITY_STEP } : null;
}

/** The three seats, tank first, for a group of real players: each sits in their own role's seat. On Normal, once your Warband is open (warband.ts),
 *  the empty seats take your own Warband heroes of those roles (the one you played last), or a stand-in
 *  bot where you have none. On Heroic the empty seats always take bots, never your Warband. */
export function seatsFor(p: Profile, players: Hero[], heroic: boolean): Seat[] {
  return ORDER.map((role) => {
    const player = players.find((h) => roleOf(h) === role);
    if (player) return { role, hero: player, bot: null };
    const mate = heroic || !warbandOpen(p) ? null : heroesFor(p, role)[0] || null;
    return mate ? { role, hero: mate, bot: null } : { role, hero: null, bot: ROLES[role].name };
  });
}

/** Your seats as things are: you, then your Warband on Normal or bots on Heroic. */
export const seats = (p: Profile, heroic = false): Seat[] => seatsFor(p, groupOf(p), heroic);

/** Your heroes who could take a seat, the one you played last first. */
export function heroesFor(p: Profile, role: RoleId): Hero[] {
  return p.roster.filter((h) => roleOf(h) === role).sort((a, b) => b.playedAt - a.playedAt);
}

/** Pick a role and you play it: you switch to the hero of that role you played last. With no hero of
 *  that role nothing changes and you get null (make one first). */
export function pickRole(p: Profile, role: RoleId, now = Date.now()): Hero | null {
  const h = activeHero(p);
  if (h && roleOf(h) === role) return h;
  const next = heroesFor(p, role)[0];
  if (!next) return null;
  setActive(p, next.id, now);
  return next;
}

/** What one seat brings to the door: its player's chosen brew, if they have a bottle of it. Bots bring none. */
export interface SeatBrew { role: RoleId; leader: boolean; brew: string | null }
/** One bottle a run serves the whole party, so nobody wastes one: the run's leader's brew is poured if
 *  they brought one, else the first seat's in order (tank, healer, DPS). Only that bottle is spent; the
 *  others stay on their shelves. Brews never stack. Null when nobody brought one. */
export function pourFor(brought: SeatBrew[]): SeatBrew | null {
  const withBrew = brought.filter((s) => s.brew);
  return withBrew.find((s) => s.leader) || [...withBrew].sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role))[0] || null;
}
