/**
 * Your companion as the screens show them: who takes the other seat (meta/party.ts companionOf), with a name and a
 * picture. One of your own heroes comes in their own gear; a bot of a class comes in plain gear as good as yours, and
 * goes by its class's founder (Brannoc, Maren, Ivy) when the class has one, or by its class.
 */
import { CLASSES, FOUNDERS, RACES, RACE_ORDER, canMake, defaultSex, type ClassId } from '../content/folk';
import { ROLES } from '../content/roles';
import type { Rar } from '../content/types';
import { companionOf } from '../meta/party';
import { roleOf, type Hero, type Profile } from '../meta/profile';
import { heroSprite, plainSprite } from './art';

/** who takes the other seat, as drawn: `hero` is one of yours, or null for a bot */
export interface MateLook { cls: ClassId; hero: Hero | null; name: string; sprite: string }

/** a class's founder, if one of the founding three is of it */
const founderOf = (cls: ClassId) => (Object.entries(FOUNDERS) as [keyof typeof FOUNDERS, (typeof FOUNDERS)[keyof typeof FOUNDERS]][]).find(([, f]) => f.cls === cls);

/** A bot of a class: its name and its picture in plain gear of one rarity. Its body is its founder's, or the first
 *  race from the start drawn as that class. */
export function botLook(cls: ClassId, rar: Rar): { name: string; sprite: string } {
  const f = founderOf(cls);
  const race = f ? f[1].race : RACE_ORDER.find((r) => !RACES[r].earned && canMake(r, cls)) || 'human';
  const body = { race, cls, sex: f ? f[1].sex : defaultSex(race, cls) };
  return { name: f ? ROLES[f[0]].name : CLASSES[cls]?.name || 'Bot', sprite: plainSprite(body, CLASSES[cls]?.role || 'dps', rar) };
}

/** Who comes with the hero you play: one of your heroes in its own gear, or a bot at `rar`. */
export function companionLook(p: Profile, h: Hero, rar: Rar): MateLook {
  const c = companionOf(p, h);
  if (c.hero) return { cls: c.cls, hero: c.hero, name: c.hero.name, sprite: heroSprite(c.hero, roleOf(c.hero), p) };
  return { cls: c.cls, hero: null, ...botLook(c.cls, rar) };
}
