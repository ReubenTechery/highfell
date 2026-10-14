/**
 * Who sits where in a run: three seats, one per role. You take your hero's seat and bots fill the
 * others, fighting at your gear level. When there is online play, friends will take seats the same way.
 */
import { ORDER, ROLES } from '../content/roles';
import type { RoleId } from '../content/types';
import { activeHero, roleOf, type Hero, type Profile } from './profile';

export interface Seat { role: RoleId; hero: Hero | null; bot: string | null }

/** The three seats, tank first: yours holds your hero, the others hold a bot. */
export function seats(p: Profile): Seat[] {
  const h = activeHero(p), mine = h ? roleOf(h) : null;
  return ORDER.map((role) => (role === mine ? { role, hero: h, bot: null } : { role, hero: null, bot: ROLES[role].name }));
}

/** Your heroes who could take a seat, the one you played last first. */
export function heroesFor(p: Profile, role: RoleId): Hero[] {
  return p.roster.filter((h) => roleOf(h) === role).sort((a, b) => b.playedAt - a.playedAt);
}
