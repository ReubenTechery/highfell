/**
 * Gear. Power climbs Common to Epic and stops there. The weapon carries 40% of it, so a new weapon
 * is the upgrade you feel. After Epic, gear goes sideways: weapon traits, set bonuses and looks.
 */
import type { RarityDef, RoleId, RoleSlotDef, SlotDef, SlotId, TraitDef, ItemDef, Rar } from './types';

export const RARITY: RarityDef[] = [
  { key: 'common', name: 'Common', score: 10, color: '#8E8A84', ink: '#5E5A55' },
  { key: 'uncommon', name: 'Uncommon', score: 14, color: '#4E9A4A', ink: '#2E6B2A' },
  { key: 'rare', name: 'Rare', score: 18, color: '#3D7FC1', ink: '#2F5F99' },
  { key: 'epic', name: 'Epic', score: 22, color: '#8A63D2', ink: '#5E3FA3' },
];
export const EPIC: Rar = 3;

export const SLOTS: SlotDef[] = [
  { id: 'weapon', weight: 0.4 },
  { id: 'helm', weight: 0.2 },
  { id: 'shoulders', weight: 0.2 },
  { id: 'chest', weight: 0.2 },
];
export const SLOT_IDS: SlotId[] = SLOTS.map((s) => s.id);

export const ROLE_SLOTS: Record<RoleId, Record<SlotId, RoleSlotDef>> = {
  tank: { weapon: { name: 'Axe', icon: 'i_axe' }, helm: { name: 'Helm', icon: 'i_helm' }, shoulders: { name: 'Pauldrons', icon: 'i_pauldrons' }, chest: { name: 'Plate', icon: 'i_plate' } },
  healer: { weapon: { name: 'Staff', icon: 'i_sunstaff' }, helm: { name: 'Hood', icon: 'i_hood' }, shoulders: { name: 'Mantle', icon: 'i_mantle' }, chest: { name: 'Robe', icon: 'i_robe' } },
  dps: { weapon: { name: 'Staff', icon: 'i_icestaff' }, helm: { name: 'Hat', icon: 'i_hat' }, shoulders: { name: 'Mantle', icon: 'i_mantle' }, chest: { name: 'Robe', icon: 'i_robe' } },
};

const NAMES: Record<RoleId, Record<SlotId, [string, string, string, string]>> = {
  tank: {
    weapon: ['Rusty Hand Axe', 'Iron War Axe', 'Barrow Cleaver', 'Gravebreaker'],
    helm: ['Dented Cap', 'Iron Helm', 'Crypt Warden Helm', 'Helm of the Long Watch'],
    shoulders: ['Leather Pads', 'Iron Pauldrons', 'Crypt Warden Pauldrons', 'Pauldrons of the Long Watch'],
    chest: ['Patched Mail', 'Iron Plate', 'Crypt Warden Plate', 'Plate of the Long Watch'],
  },
  healer: {
    weapon: ['Ash Staff', 'Sunwood Staff', 'Dawnbringer', 'Staff of First Light'],
    helm: ['Linen Hood', 'Pilgrim Hood', 'Hood of Quiet Mercy', 'Circlet of the Sun'],
    shoulders: ['Linen Shawl', 'Pilgrim Mantle', 'Mantle of Quiet Mercy', 'Mantle of the Sun'],
    chest: ['Linen Robe', 'Pilgrim Robe', 'Robe of Quiet Mercy', 'Vestments of the Sun'],
  },
  dps: {
    weapon: ['Birch Staff', 'Frostwood Staff', 'Rimecaller', 'Winter’s Edge'],
    helm: ['Wool Hat', 'Snowweave Hat', 'Hat of the Long Night', 'Crown of the Glacier'],
    shoulders: ['Wool Wrap', 'Snowweave Mantle', 'Frostfur Mantle', 'Mantle of the Glacier'],
    chest: ['Wool Robe', 'Snowweave Robe', 'Robe of the Long Night', 'Robe of the Glacier'],
  },
};

/** Epic weapons roll one of these. They change how a button works, not how hard you hit. */
export const TRAITS: Record<RoleId, TraitDef[]> = {
  tank: [
    { id: 'wide', name: 'Wide Swings', desc: 'Your swings hit everything in front of you at full damage.' },
    { id: 'ringing', name: 'Ringing Blow', desc: 'Charge hits twice and taunts what it hits.' },
    { id: 'headsman', name: 'Headsman', desc: 'Hits on stunned mobs always crit.' },
  ],
  healer: [
    { id: 'sunflare', name: 'Sunflare', desc: 'Mend also heals the next most hurt ally for half.' },
    { id: 'quickhands', name: 'Quick Hands', desc: 'Mend is faster to cast again.' },
    { id: 'kindle', name: 'Kindle', desc: 'A Ward that breaks heals its target for 80.' },
  ],
  dps: [
    { id: 'shatterlance', name: 'Shatterlance', desc: 'Comet on a frozen target hits three times as hard.' },
    { id: 'splinter', name: 'Splinter', desc: 'Frostbolts split to a second enemy.' },
    { id: 'quickfrost', name: 'Quickfrost', desc: 'Comet casts twice as fast.' },
  ],
};
export const traitDef = (role: RoleId, id: string | undefined): TraitDef | undefined => TRAITS[role].find((t) => t.id === id);

/** Regular gear: the Common to Epic ladder. Ids look like gear.tank.helm.2 */
export const gearId = (role: RoleId, slot: SlotId, rar: Rar): string => `gear.${role}.${slot}.${rar}`;
export function regularItems(): ItemDef[] {
  const out: ItemDef[] = [];
  for (const role of Object.keys(NAMES) as RoleId[]) {
    for (const slot of SLOT_IDS) {
      NAMES[role][slot].forEach((name, rar) => out.push({ id: gearId(role, slot, rar as Rar), name, role, slot, kind: 'gear', rar: rar as Rar, icon: ROLE_SLOTS[role][slot].icon }));
    }
  }
  return out;
}

/** Weighted item score, 10 (all Common) to 22 (all Epic). */
export function weightedScore(scores: Record<SlotId, number>): number {
  return SLOTS.reduce((a, s) => a + s.weight * scores[s.id], 0);
}
/** Damage and healing multiplier: 1.00 at all Common up to 1.45 at all Epic. */
export const powerFromScore = (w: number): number => 1 + (0.45 * (w - 10)) / 12;
/** Health grows a little slower than power. */
export const hpMultiplier = (power: number): number => 1 + (power - 1) * 0.6;
