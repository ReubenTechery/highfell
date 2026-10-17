/**
 * Who sits where in a run: three seats, one per role, and who may go in. Normal is fully playable on
 * your own: you take your hero's seat and bots take the others, in plain gear as good as yours; one of
 * your own Warband heroes takes a seat instead only when its gear is at least as good as the bot's, to make
 * the run stronger and nothing else (it never gets loot: the run is your hero's). You can group up too.
 * Heroic is the group run: it needs at least two real players, a bot takes the seat nobody fills, and your
 * Warband heroes never sit in. A hero short of what a dungeon recommends (level and Power together) is warned
 * first, never stopped.
 */
import { RARITY, powerFromScore } from '../content/gear';
import { ORDER, ROLES } from '../content/roles';
import type { DungeonInfo, RoleId } from '../content/types';
import { CLASSES, CLASS_ORDER, type ClassId } from '../content/folk';
import { levelBonus } from '../content/xp';
import { loadoutFor, partyRar, wholeIlvl } from './gear';
import { activeHero, roleOf, setActive, type Hero, type Profile } from './profile';
import { warbandOpen } from './warband';
import { level } from './xp';

export interface Seat { role: RoleId; hero: Hero | null; bot: string | null }

/** Heroic needs at least this many real players. */
export const HEROIC_MIN_PLAYERS = 2;

/** The duo rework (docs/duo.md): every run is two heroes. Until the companion picker lands, the bot who takes the
 *  other seat is one that fills the gap: in close with someone at range, at range with someone in close. */
export const COMPANION_FOR: Record<ClassId, ClassId> = { warrior: 'mage', cleric: 'warrior', mage: 'warrior', rogue: 'mage', ranger: 'warrior' };
export const companionFor = (cls: string): ClassId => COMPANION_FOR[cls as ClassId] || 'warrior';
/** who takes the other seat on Normal: one of your own heroes, once your Warband is open, or a bot of a class */
export interface Companion { cls: ClassId; hero: Hero | null }
/** Your companion for this hero: the one you picked (p.companion: 'cls:<class>' for a bot of a class the hero
 *  maker offers, or one of your other heroes' ids once your Warband is open), else the bot that fills the gap. */
export function companionOf(p: Profile, h: Hero): Companion {
  const c = p.companion;
  if (c && c.startsWith('cls:')) {
    const cls = c.slice(4) as ClassId;
    if (CLASSES[cls] && CLASS_ORDER.includes(cls)) return { cls, hero: null };
  } else if (c && warbandOpen(p)) {
    const mate = p.roster.find((x) => x.id === c && x.id !== h.id);
    if (mate) return { cls: mate.cls as ClassId, hero: mate };
  }
  return { cls: companionFor(h.cls), hero: null };
}
/** pick who takes the other seat: 'cls:<class>' for a bot, a hero's id, or null for the bot that fills the gap */
export function setCompanion(p: Profile, choice: string | null): void { p.companion = choice; }

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

/** How the hero you play measures up to a dungeon: your level and Power, and the ones it recommends. You're short
 *  when the two together are: your strength is your gear's power times your level's bonus, so a higher level makes
 *  up for weaker gear and the other way round. `likely`: short by LIKELY_SHORT of it or more, where a wipe is very
 *  likely (Rare at level 15 against Thimblebriar's level 15 and Power 22). */
export interface PowerGap { level: number; power: number; wantLevel: number; wantPower: number; likely: boolean }
/** short by this share of the strength a dungeon wants makes a wipe very likely */
const LIKELY_SHORT = 0.2;

/** a hero's strength in a run: the gear's power times the level's bonus (what every hit and heal is multiplied by) */
export const strengthOf = (p: Profile, h: Hero): number => loadoutFor(p, h).power * levelBonus(level(p));
/** the strength a dungeon recommends: its Power at its level (1 when it names none) */
export const wantStrength = (dg: Pick<DungeonInfo, 'recIlvl' | 'recLevel'>): number => powerFromScore(dg.recIlvl || RARITY[0].score) * levelBonus(dg.recLevel || 1);

/** The hero against a dungeon's recommendation, or null when they meet it or it recommends nothing (a Heroic
 *  doesn't yet). A warning, never a lock: the Barrow wants level 1 and Power 10, so a fresh hero is never warned. */
export function underPowered(p: Profile, h: Hero, dg: DungeonInfo): PowerGap | null {
  if (!dg.recIlvl && !dg.recLevel) return null;
  const have = strengthOf(p, h), want = wantStrength(dg);
  if (have >= want - 1e-9) return null;
  return { level: level(p), power: wholeIlvl(loadoutFor(p, h).score), wantLevel: dg.recLevel || 1, wantPower: dg.recIlvl || RARITY[0].score, likely: have < want * (1 - LIKELY_SHORT) };
}

/** The three seats, tank first, for a group of real players: each sits in their own role's seat. On Normal, once your Warband is open (warband.ts),
 *  an empty seat takes your best-geared Warband hero of its role if that hero's gear is at least as good as the
 *  bot's (`helps`), or else the bot. On Heroic the empty seats always take bots, never your Warband. */
export function seatsFor(p: Profile, players: Hero[], heroic: boolean): Seat[] {
  const lead = players[0];
  return ORDER.map((role) => {
    const player = players.find((h) => roleOf(h) === role);
    if (player) return { role, hero: player, bot: null };
    const mate = heroic || !warbandOpen(p) || !lead ? null : heroesFor(p, role).filter((h) => helps(p, h, lead)).sort((a, b) => loadoutFor(p, b).score - loadoutFor(p, a).score)[0] || null;
    return mate ? { role, hero: mate, bot: null } : { role, hero: null, bot: ROLES[role].name };
  });
}
/** Would this Warband hero make your run stronger than the bot in its seat? Bots wear plain gear as good as
 *  yours on average (partyRar), so: is its Power at least the bot's. */
export const helps = (p: Profile, mate: Hero, lead: Hero): boolean => loadoutFor(p, mate).score >= RARITY[partyRar(p, lead)].score;

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
