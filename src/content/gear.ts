/**
 * Gear. Power climbs Common to Epic and stops there. The weapon carries 40% of it, so a new weapon
 * is the upgrade you feel. The regular ladder is a short climb (Common 10 to Rare 14 in eight clears); the
 * long chase is where the power is: a set piece is 12 more than Rare, a boss weapon 16 (the owner's call, 17
 * Oct: forty-odd runs for a set has to feel like it). After that, gear goes sideways: traits, set bonuses, looks.
 */
import type { GearKey, RarityDef, RoleId, RoleSlotDef, SlotDef, SlotId, TraitDef, ItemDef, Rar } from './types';
import { CLASSES, type ClassId } from './folk';

export const gearKey = (h: RoleId | GearKey | { role?: RoleId; cls?: string }): GearKey =>
  typeof h === 'string' ? h : h.cls === 'rogue' ? 'rogue' : (h.role ?? CLASSES[(h.cls as ClassId) || 'warrior']?.role ?? 'dps');

export const RARITY: RarityDef[] = [
  { key: 'common', name: 'Common', score: 10, color: '#8E8A84', ink: '#5E5A55' },
  { key: 'uncommon', name: 'Uncommon', score: 12, color: '#4E9A4A', ink: '#2E6B2A' },
  { key: 'rare', name: 'Rare', score: 14, color: '#3D7FC1', ink: '#2F5F99' },
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
    { id: 'wide', name: 'Wide Swings', desc: 'Cleave sweeps a wider arc in front of you.' },
    { id: 'ringing', name: 'Ringing Blow', desc: 'Charge hits twice, and everything it hits turns on you.' },
    { id: 'headsman', name: 'Headsman', desc: 'Hits on stunned mobs, or a Staggered boss, always crit.' },
  ],
  healer: [
    { id: 'sunflare', name: 'Sunflare', desc: 'Mend also heals the next most hurt ally for half.' },
    { id: 'quickhands', name: 'Quick Hands', desc: 'Mend never starts the beat, so your next button can follow it straight away.' },
    { id: 'kindle', name: 'Kindle', desc: 'A Ward that breaks heals its target for 80.' },
  ],
  dps: [
    { id: 'shatterlance', name: 'Shatterlance', desc: 'Comet on a frozen target hits three times as hard, and on a Chilled boss twice as hard.' },
    { id: 'splinter', name: 'Splinter', desc: 'Icicle splinters: 30% of its hit strikes a second foe.' },
    { id: 'quickfrost', name: 'Quickfrost', desc: 'Comet casts twice as fast.' },
  ],
  rogue: [
    { id: 'twinvenom', name: 'Twin Venom', desc: 'Your twin-dagger swings extend Viper Venom by 1.5s.' },
    { id: 'arterial', name: 'Venomrush', desc: 'Shadowstrike on a poisoned foe gives you a point back.' },
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

/** Weighted item score: 10 all Common, 14 all Rare, 22 all plain Epic (only bots and test gear wear that). */
export function weightedScore(scores: Record<SlotId, number>): number {
  return SLOTS.reduce((a, s) => a + s.weight * scores[s.id], 0);
}
/** Damage and healing multiplier: 1.00 at all Common (10), 1.24 at Rare (14), 1.72 at plain Epic (22), and 2.06 in
 *  the Barrow's full kit (27.6: three set pieces at 26 and its boss weapon at 30). */
export const powerFromScore = (w: number): number => 1 + (0.72 * (w - 10)) / 12;
/** Health grows a little slower than power. */
export const hpMultiplier = (power: number): number => 1 + (power - 1) * 0.5;

