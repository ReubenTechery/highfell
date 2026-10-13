/** What a hero is wearing, what it adds up to, and changing it. */
import type { ItemDef, Rar, RoleId, SlotId } from '../content/types';
import { ITEMS, SETS } from '../content';
import { EPIC, RARITY, SLOT_IDS, TRAITS, gearId, hpMultiplier, powerFromScore, weightedScore } from '../content/gear';
import type { Profile } from './profile';

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
export function worn(p: Profile, role: RoleId): Record<SlotId, Worn> {
  const h = p.heroes[role];
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

export const loadoutFor = (p: Profile, role: RoleId): Loadout => loadoutOf(Object.values(worn(p, role)));

/** Plain regular gear at one rarity: what the bots in your party wear, and test gear. */
export function plainLoadout(role: RoleId, rar: Rar, trait?: string): Loadout {
  return loadoutOf(SLOT_IDS.map((slot) => ({ slot, def: ITEMS[gearId(role, slot, rar)], trait: rar === EPIC && slot === 'weapon' ? trait || TRAITS[role][0].id : undefined, unique: false })));
}

/** The rarity the rest of your party should wear so the run feels like your gear. */
export function partyRar(p: Profile, role: RoleId): Rar {
  const w = worn(p, role);
  return Math.round(SLOT_IDS.reduce((a, s) => a + w[s].def.rar, 0) / SLOT_IDS.length) as Rar;
}

/** Score as a percentage over all-Common, for the gear screen. */
export const powerPct = (l: Loadout): number => Math.round((l.power - 1) * 100);
export const healthPct = (l: Loadout): number => Math.round((hpMultiplier(l.power) - 1) * 100);

/** Wear a unique you own in its slot, or pass null to go back to the regular piece. */
export function equip(p: Profile, role: RoleId, slot: SlotId, uniqueId: string | null): boolean {
  if (uniqueId) {
    const d = ITEMS[uniqueId];
    if (!d || !p.collection[uniqueId] || d.role !== role || d.slot !== slot) return false;
  }
  p.heroes[role].equip[slot] = uniqueId;
  return true;
}

/** Uniques this role owns for a slot. */
export function ownedFor(p: Profile, role: RoleId, slot: SlotId): ItemDef[] {
  return Object.keys(p.collection).map((id) => ITEMS[id]).filter((d): d is ItemDef => !!d && d.kind !== 'gear' && d.role === role && d.slot === slot);
}

export const REROLL_COST = 5;
/** Spend marks for a different trait on an Epic regular weapon. */
export function rerollTrait(p: Profile, role: RoleId, dungeon: string, pick: () => number): string | null {
  const reg = p.heroes[role].regular.weapon;
  const rec = p.dungeons[dungeon];
  if (reg.rar !== EPIC || !rec || rec.marks < REROLL_COST) return null;
  const others = TRAITS[role].filter((t) => t.id !== reg.trait);
  const t = others[Math.floor(pick() * others.length)];
  rec.marks -= REROLL_COST;
  reg.trait = t.id;
  return t.id;
}

/** Spend marks to set the trait on an Epic regular weapon to the one you pick. */
export function buyTrait(p: Profile, role: RoleId, dungeon: string, trait: string): boolean {
  const reg = p.heroes[role].regular.weapon;
  const rec = p.dungeons[dungeon];
  if (reg.rar !== EPIC || !rec || rec.marks < REROLL_COST || reg.trait === trait || !TRAITS[role].some((t) => t.id === trait)) return false;
  rec.marks -= REROLL_COST;
  reg.trait = trait;
  return true;
}
