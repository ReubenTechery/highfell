/**
 * Who sits where in a run: three seats, one per role. On Normal, you take your hero's seat and your
 * own Warband heroes from your bunk room fill the others (or bots stand in for empty seats), or you can
 * group up. Heroic dungeons are Friends & Party Finder ONLY (Warband companions are disabled on Heroic).
 */
import { ORDER, ROLES } from '../content/roles';
import type { RoleId } from '../content/types';
import { activeHero, roleOf, setActive, type Hero, type Profile } from './profile';

export interface Seat { role: RoleId; hero: Hero | null; bot: string | null }

/** The three seats, tank first: yours holds your active hero. On Normal (`!heroic`), the other two seats
 *  hold your own Warband heroes of those roles from your bunk room (falling back to a stand-in bot only
 *  when you have none). On Heroic (`heroic = true`), Warband companions are disabled (Friends & Party Finder only). */
export function seats(p: Profile, heroic = false): Seat[] {
  const h = activeHero(p), mine = h ? roleOf(h) : null;
  return ORDER.map((role) => {
    if (role === mine && h) return { role, hero: h, bot: null };
    const mate = !heroic ? heroesFor(p, role)[0] || null : null;
    return mate ? { role, hero: mate, bot: null } : { role, hero: null, bot: ROLES[role].name };
  });
}

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
