/** What a hero is wearing, what it adds up to, and changing it. */
import type { ItemDef, Rar, RoleId, SlotId } from '../content/types';
import { ITEMS, SETS } from '../content';
import { EPIC, RARITY, SLOTS, SLOT_IDS, TRAITS, gearId, hpMultiplier, powerFromScore, weightedScore } from '../content/gear';
import type { ClassId, RaceId } from '../content/folk';
import { createHero, roleOf, type Hero, type Profile } from './profile';

export interface Worn { slot: SlotId; def: ItemDef; trait?: string; unique: boolean }
export interface Loadout {
  power: number;
  traits: string[];
  bonuses: string[];
  weaponRar: Rar;
  unique: string | null;
  sets: Record<string, number>;
  score: number;
}

/** The four things a hero has on right now. */
export function worn(p: Profile, h: Hero): Record<SlotId, Worn> {
  const role = roleOf(h);
  const out = {} as Record<SlotId, Worn>;
  for (const slot of SLOT_IDS) {
    const uid = h.equip[slot];
    const u = uid && ITEMS[uid] && p.collection[uid] && ITEMS[uid].role === role && ITEMS[uid].slot === slot ? ITEMS[uid] : null;
    if (u) out[slot] = { slot, def: u, unique: true };
    else { const reg = h.regular[slot]; out[slot] = { slot, def: ITEMS[gearId(role, slot, reg.rar)], trait: reg.rar === EPIC ? reg.trait : undefined, unique: false }; }
  }
  return out;
}

export function loadoutOf(items: Worn[]): Loadout {
  const scores = {} as Record<SlotId, number>;
  const traits: string[] = [];
  const sets: Record<string, number> = {};
  let unique: string | null = null, weaponRar: Rar = 0;
  for (const w of items) {
    scores[w.slot] = RARITY[w.def.rar].score;
    if (w.trait) traits.push(w.trait);
    if (w.def.setId) sets[w.def.setId] = (sets[w.def.setId] || 0) + 1;
    if (w.def.effect) unique = w.def.effect;
    if (w.slot === 'weapon') weaponRar = w.def.rar;
  }
  const bonuses: string[] = [];
  for (const [id, n] of Object.entries(sets)) { const s = SETS[id]; if (!s) continue; if (n >= 2) bonuses.push(s.bonus2.id); if (n >= 3) bonuses.push(s.bonus3.id); }
  const score = weightedScore(scores);
  return { power: powerFromScore(score), traits, bonuses, weaponRar, unique, sets, score };
}

export const loadoutFor = (p: Profile, h: Hero): Loadout => loadoutOf(Object.values(worn(p, h)));

/** Plain regular gear at one rarity: what the bots in your party wear, and test gear. */
export function plainLoadout(role: RoleId, rar: Rar, trait?: string): Loadout {
  return loadoutOf(SLOT_IDS.map((slot) => ({ slot, def: ITEMS[gearId(role, slot, rar)], trait: rar === EPIC && slot === 'weapon' ? trait || TRAITS[role][0].id : undefined, unique: false })));
}

/** The rarity the rest of your party should wear so the run feels like your gear. */
export function partyRar(p: Profile, h: Hero): Rar {
  const w = worn(p, h);
  return Math.round(SLOT_IDS.reduce((a, s) => a + w[s].def.rar, 0) / SLOT_IDS.length) as Rar;
}

/** Score as a percentage over all-Common, for the gear screen. */
export const powerPct = (l: Loadout): number => Math.round((l.power - 1) * 100);
export const healthPct = (l: Loadout): number => Math.round((hpMultiplier(l.power) - 1) * 100);
/** What one item adds on its own: its share of power and of health, in percent. */
export function itemShare(def: ItemDef): { power: number; health: number; ilvl: number } {
  const w = SLOTS.find((s) => s.id === def.slot)?.weight ?? 0;
  const power = (w * 0.45 * (RARITY[def.rar].score - 10)) / 12;
  return { power: Math.round(power * 1000) / 10, health: Math.round(power * 0.6 * 1000) / 10, ilvl: RARITY[def.rar].score };
}

/** Wear a unique you own in its slot, or pass null to go back to the regular piece. */
export function equip(p: Profile, h: Hero, slot: SlotId, uniqueId: string | null): boolean {
  if (uniqueId) {
    const d = ITEMS[uniqueId];
    if (!d || !p.collection[uniqueId] || d.role !== roleOf(h) || d.slot !== slot) return false;
  }
  h.equip[slot] = uniqueId;
  return true;
}

/** Uniques the roster owns that this hero could wear in a slot. */
export function ownedFor(p: Profile, h: Hero, slot: SlotId): ItemDef[] {
  const role = roleOf(h);
  return Object.keys(p.collection).map((id) => ITEMS[id]).filter((d): d is ItemDef => !!d && d.kind !== 'gear' && d.role === role && d.slot === slot);
}

/** Put on any owned uniques for empty slots: set pieces and the dungeon's weapons. */
export function wearOwned(p: Profile, h: Hero): void {
  for (const slot of SLOT_IDS) if (!h.equip[slot]) { const u = ownedFor(p, h, slot)[0]; if (u) h.equip[slot] = u.id; }
}

/** Make a hero and dress it: warband gear for its role plus any uniques the roster owns. */
export function newHero(p: Profile, o: { name: string; race: RaceId; cls: ClassId }, now = Date.now()): Hero | null {
  const h = createHero(p, o, now);
  if (h) wearOwned(p, h);
  return h;
}

export const REROLL_COST = 5;
/** Spend marks to set the trait on an Epic regular weapon to the one you pick. */
export function buyTrait(p: Profile, h: Hero, dungeon: string, trait: string): boolean {
  const role = roleOf(h);
  const reg = h.regular.weapon;
  const rec = p.dungeons[dungeon];
  if (reg.rar !== EPIC || !rec || rec.marks < REROLL_COST || reg.trait === trait || !TRAITS[role].some((t) => t.id === trait)) return false;
  rec.marks -= REROLL_COST;
  reg.trait = trait;
  return true;
}
