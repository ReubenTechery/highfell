/**
 * A hero whose class has retired (the cleric, in the duo rework: docs/duo.md) picks a new class once, before its next
 * run. It keeps its race, name, look, title and clears, and your level is everyone's anyway. Its ladder gear comes
 * along at the same rarity, as the new class's pieces (a Rare weapon's trait becomes one of the new class's; they
 * swap free at Rare), and the new class's shared floor lands in its bag if that's higher. A unique it wore that the
 * new class can't wear comes off and stays yours in the collection; the uniques you own for the new class glow for
 * it, as for a new hero. A cleric who picks the ranger keeps the lot: the ranger wears the cleric's old gear.
 */
import { CLASSES, CLASS_ORDER, canMake, type ClassId } from '../content/folk';
import { ITEMS } from '../content';
import { SLOT_IDS, TRAITS, gearKeyOf } from '../content/gear';
import { bagIt, fitsHero, ownedFor } from './gear';
import { gearRole, type Hero, type Profile } from './profile';

/** this hero's class has retired: it picks a new one before its next run */
export const mustPickClass = (h: Pick<Hero, 'cls'>): boolean => !!CLASSES[h.cls as ClassId]?.retired;

/** the classes it can pick: the ones the hero maker offers that its race can be */
export const classChoices = (h: Pick<Hero, 'race' | 'cls'>): ClassId[] =>
  CLASS_ORDER.filter((c) => c !== h.cls && !CLASSES[c].retired && canMake(String(h.race), c));

/** Pick the new class, once: false if this hero needn't, or can't be that class. */
export function pickClass(p: Profile, h: Hero, cls: ClassId): boolean {
  if (!mustPickClass(h) || !classChoices(h).includes(cls)) return false;
  h.cls = cls;
  h.spec = null;
  const traits = TRAITS[gearKeyOf(cls)];
  for (const slot of SLOT_IDS) {
    for (const piece of [h.regular[slot], h.bag[slot]]) if (piece?.trait && !traits.some((t) => t.id === piece.trait)) piece.trait = traits[0].id;
    bagIt(h, slot, { ...p.warband[gearRole(h)][slot] });
    const u = h.equip[slot];
    if (u && !(ITEMS[u] && fitsHero(ITEMS[u], h))) h.equip[slot] = null;
  }
  h.fresh = h.fresh.filter((id) => !!ITEMS[id] && fitsHero(ITEMS[id], h));
  for (const slot of SLOT_IDS) for (const u of ownedFor(p, h, slot)) if (h.equip[slot] !== u.id && !h.fresh.includes(u.id)) h.fresh.push(u.id);
  return true;
}
