/**
 * Gear. Power climbs Common to Epic and stops there. The weapon carries 40% of it, so a new weapon
 * is the upgrade you feel. After Epic, gear goes sideways: weapon traits, set bonuses and looks.
 */
import type { GearKey, RarityDef, RoleId, RoleSlotDef, SlotDef, SlotId, TraitDef, ItemDef, Rar } from './types';
import { CLASSES, type ClassId } from './folk';

export const gearKey = (h: RoleId | GearKey | { role?: RoleId; cls?: string }): GearKey =>
  typeof h === 'string' ? h : h.cls === 'rogue' ? 'rogue' : (h.role ?? CLASSES[(h.cls as ClassId) || 'warrior']?.role ?? 'dps');

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

export const ROLE_SLOTS: Record<GearKey, Record<SlotId, RoleSlotDef>> = {
  tank: { weapon: { name: 'Axe', icon: 'i_axe' }, helm: { name: 'Helm', icon: 'i_helm' }, shoulders: { name: 'Pauldrons', icon: 'i_pauldrons' }, chest: { name: 'Plate', icon: 'i_plate' } },
  healer: { weapon: { name: 'Staff', icon: 'i_sunstaff' }, helm: { name: 'Hood', icon: 'i_hood' }, shoulders: { name: 'Mantle', icon: 'i_mantle' }, chest: { name: 'Robe', icon: 'i_robe' } },
  dps: { weapon: { name: 'Staff', icon: 'i_icestaff' }, helm: { name: 'Hat', icon: 'i_hat' }, shoulders: { name: 'Mantle', icon: 'i_mantle' }, chest: { name: 'Robe', icon: 'i_robe' } },
  rogue: { weapon: { name: 'Twin Daggers', icon: 'i_dagger' }, helm: { name: 'Mask', icon: 'i_mask' }, shoulders: { name: 'Spaulders', icon: 'i_spaulders' }, chest: { name: 'Jerkin', icon: 'i_jerkin' } },
};

const NAMES: Record<GearKey, Record<SlotId, [string, string, string, string]>> = {
  tank: {
    weapon: ['Chipped Bronze Hatchet', 'Iron War Axe', 'Barrow Cleaver', 'Gravebreaker'],
    helm: ['Tattered Rag Cap', 'Iron Pot Helm', 'Crypt Warden Helm', 'Helm of the Long Watch'],
    shoulders: ['Burlap Shoulder Wraps', 'Iron Pauldrons', 'Crypt Warden Pauldrons', 'Pauldrons of the Long Watch'],
    chest: ['Patched Rag Tunic', 'Iron Chainmail', 'Crypt Warden Plate', 'Plate of the Long Watch'],
  },
  healer: {
    weapon: ['Gnarled Branch', 'Sunwood Staff', 'Dawnbringer', 'Staff of First Light'],
    helm: ['Frayed Rag Hood', 'Pilgrim Hood', 'Hood of Quiet Mercy', 'Circlet of the Sun'],
    shoulders: ['Patchwork Shawl', 'Pilgrim Mantle', 'Mantle of Quiet Mercy', 'Mantle of the Sun'],
    chest: ['Tattered Sackcloth', 'Pilgrim Robe', 'Robe of Quiet Mercy', 'Vestments of the Sun'],
  },
  dps: {
    weapon: ['Splintered Wand', 'Frostwood Staff', 'Rimecaller', 'Winter’s Edge'],
    helm: ['Moth-Eaten Cap', 'Snowweave Hat', 'Hat of the Long Night', 'Crown of the Glacier'],
    shoulders: ['Frayed Cloth Wrap', 'Snowweave Mantle', 'Frostfur Mantle', 'Mantle of the Glacier'],
    chest: ['Patched Apprentice Rags', 'Snowweave Robe', 'Robe of the Long Night', 'Robe of the Glacier'],
  },
  rogue: {
    weapon: ['Chipped Bronze Shivs', 'Iron Twin Daggers', 'Shadowsteel Stilettos', 'Nightfang Blades'],
    helm: ['Tattered Rag Mask', 'Cutthroat Leather Mask', 'Mask of the Silent Step', 'Nightstalker Visage'],
    shoulders: ['Stitched Leather Pads', 'Cutthroat Spaulders', 'Spaulders of the Silent Step', 'Nightstalker Spaulders'],
    chest: ['Scuffed Leather Vest', 'Cutthroat Brigandine', 'Jerkin of the Silent Step', 'Nightstalker Cuirass'],
  },
};

/** Epic weapons roll one of these. They change how a button works, not how hard you hit. */
export const TRAITS: Record<GearKey, TraitDef[]> = {
  tank: [
    { id: 'wide', name: 'Wide Swings', desc: 'Your swings hit everything in front of you at full damage.' },
    { id: 'ringing', name: 'Ringing Blow', desc: 'Charge hits twice, and everything it hits turns on you.' },
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
  rogue: [
    { id: 'twinvenom', name: 'Twin Venom', desc: 'Your twin-dagger swings extend Viper Venom by 1.5s.' },
    { id: 'arterial', name: 'Venomrush', desc: 'Shadowstrike on a poisoned foe refunds 1.2s of its cooldown.' },
    { id: 'nightstalker', name: 'Nightstalker', desc: 'Shadowstep makes your next Shadowstrike deal 30% bonus damage.' },
  ],
};
export const traitDef = (role: GearKey, id: string | undefined): TraitDef | undefined =>
  TRAITS[role]?.find((t) => t.id === id) || Object.values(TRAITS).flat().find((t) => t.id === id);

/** Regular gear: the Common to Epic ladder. Ids look like gear.tank.helm.2 or gear.rogue.weapon.2 */
export const gearId = (role: GearKey, slot: SlotId, rar: Rar): string => `gear.${role}.${slot}.${rar}`;
export function regularItems(): ItemDef[] {
  const out: ItemDef[] = [];
  for (const key of Object.keys(NAMES) as GearKey[]) {
    const role: RoleId = key === 'rogue' ? 'dps' : key;
    const cls = key === 'rogue' ? 'rogue' : undefined;
    for (const slot of SLOT_IDS) {
      NAMES[key][slot].forEach((name, rar) => out.push({
        id: gearId(key, slot, rar as Rar), name, role, ...(cls ? { cls } : {}),
        slot, kind: 'gear', rar: rar as Rar, icon: `${ROLE_SLOTS[key][slot].icon}_${rar}`,
      }));
    }
  }
  return out;
}

/** Weighted item score, 10 (all Common) to 22 (all Epic). */
export function weightedScore(scores: Record<SlotId, number>): number {
  return SLOTS.reduce((a, s) => a + s.weight * scores[s.id], 0);
}
/** Damage and healing multiplier: 1.00 at all Common (10), 1.48 at Rare (18), 1.72 at plain Epic (22), and 1.96 at full Dungeon BiS (26). */
export const powerFromScore = (w: number): number => 1 + (0.72 * (w - 10)) / 12;
/** Health grows a little slower than power. */
export const hpMultiplier = (power: number): number => 1 + (power - 1) * 0.5;

