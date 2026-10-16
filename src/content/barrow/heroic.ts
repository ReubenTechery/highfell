/**
 * Heroic Barrow Crypt: the same crypt, harder (its tune is in engine.ts), open once you've cleared the
 * Barrow ten times. Its drops are the Barrow's own, gilded: the same pieces at the same power and the
 * same rates, so heroic is a collection of its own and never more power. It pays Barrow Marks and
 * counts for the Barrow's achievements. Finishing its collection log gives the gilded rewards.
 */
import type { AchievementDef, BossLootDef, CollectibleDef, DungeonInfo, ItemDef, TitleDef } from '../types';
import { BARROW } from './index';
import { BARROW_ITEMS } from './items';
import { BARROW_LOOT } from './loot';

/** a drop's heroic twin */
export const gilded = (id: string): string => `${id}.gilded`;

/** the twelve uniques, gilded: the same role, slot, set and effect, so they wear exactly like the plain ones */
export const HEROIC_ITEMS: ItemDef[] = BARROW_ITEMS.map((d) => ({
  ...d, id: gilded(d.id), icon: `${d.icon}_gilded`,
  name: d.name.startsWith('The ') ? `The Gilded ${d.name.slice(4)}` : `Gilded ${d.name}`,
}));

export const HEROIC_COLLECTIBLES: CollectibleDef[] = [
  { id: gilded('pet.pint_gravekeeper'), kind: 'pet', name: 'Pint-sized Gilded Gravekeeper', desc: 'Gold shovel, gold lantern, same attitude.', icon: 'c_pet_keeper_gilded', sprite: 'pet_keeper_gilded', source: 'Heroic: the Gravekeeper, 1 in 2,500' },
  { id: gilded('mount.gravehound'), kind: 'mount', name: 'Gilded Gravehound', desc: 'A bone dog the size of a pony, in solid gold. Still a good boy.', icon: 'c_mount_hound_gilded', sprite: 'mount_hound_gilded', source: 'Heroic: the Gravekeeper, 1 in 1,000', saddle: { x: -4, y: -94, k: 0.9 } },
  { id: gilded('dye.ghostly'), kind: 'cosmetic', name: 'Gravegold Dye', desc: 'Turns your Barrow set to gold.', icon: 'c_dye_gilded', source: 'Heroic: the Gravekeeper, 1 in 1,000' },
  { id: gilded('trophy.rattlebones_plume'), kind: 'trophy', name: 'Sir Rattlebones’ Gilded Plume', desc: 'He polished it every night. Now you can.', icon: 'c_plume_gilded', sprite: 'tr_plume_gilded', source: 'Heroic: Sir Rattlebones, 1 in 50' },
  // the reward for the whole heroic log, not a drop
  { id: 'cosmetic.gilded_bones', kind: 'cosmetic', name: 'Gilded Bones', desc: 'Your Risen heroes’ bones turn to gold.', icon: 'c_gilded_bones', source: 'Achievement: Gilded to the Bone' },
];

/** the Barrow's tables line for line, gilded: same rates, same role locks */
const HEROIC_LOOT: BossLootDef[] = BARROW_LOOT.map((t) => ({ boss: t.boss, drops: t.drops.map((d) => ({ ...d, id: gilded(d.id) })) }));

export const HEROIC_TITLES: TitleDef[] = [{ id: 'title.undying', text: 'the Undying' }];

export const HEROIC_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'barrow-heroic.log', dungeon: 'barrow-heroic', tier: 'log', points: 500, name: 'Gilded to the Bone', how: 'Fill every slot of Heroic Barrow Crypt’s collection log (the pet is a bonus).',
    reward: { look: 'barrow-gilded', title: 'title.undying', collectible: 'cosmetic.gilded_bones', text: 'Gilded Barrow Hall for your house, the title the Undying, and gilded bones for your Risen' },
    log: 'barrow-heroic' },
];

export const BARROW_HEROIC: DungeonInfo = {
  id: 'barrow-heroic',
  name: 'Heroic Barrow Crypt',
  blurb: 'The same crypt with the gloves off: everything hits harder and lasts longer. Made for full Epic.',
  bosses: BARROW.bosses,
  finalBoss: BARROW.finalBoss,
  loot: HEROIC_LOOT,
  // the same seed as the normal crypt, more often
  seeds: [{ boss: 'keeper', seed: 'glowcap', rate: 1 / 3 }],
  marksName: BARROW.marksName,
  collection: BARROW.collection.map(gilded),
  bonus: (BARROW.bonus || []).map(gilded),
  achievements: HEROIC_ACHIEVEMENTS.map((a) => a.id),
  heroicOf: BARROW.id,
};
