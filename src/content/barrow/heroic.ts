/**
 * Heroic Barrow Crypt: the same crypt, harder (its tune is in engine.ts), open once you've cleared the
 * Barrow ten times. A Heroic kill rolls the Barrow's own tables first, so what drops is the Barrow's own
 * pieces, for the Barrow's log and kill counts, and for your heroes to wear. Then the Gravekeeper rolls a
 * gilding kit for each of the sixteen uniques (any seat, 1 in 20 each): that piece's gilded look, never more
 * power. Its log is the kits; the gilded pet, mount and plume are a bonus. It pays Barrow Marks and counts
 * for the Barrow's achievements. Finishing its log gives the gilded rewards.
 */
import type { AchievementDef, CollectibleDef, DungeonInfo, KitDef, TitleDef } from '../types';
import { gilded, kitLog, kitTables, kitsOf } from '../kits';
import { BARROW } from './index';
import { BARROW_ITEMS } from './items';
import { BARROW_LOOT } from './loot';

/** the twelve set pieces and four boss weapons, as gilding kits */
export const HEROIC_KITS: KitDef[] = kitsOf(BARROW_ITEMS);

/** Heroic's own twins of the Barrow's pet, mount and plume: bonus slots in its log */
const TWINS: CollectibleDef[] = [
  { id: gilded('pet.pint_gravekeeper'), kind: 'pet', name: 'Pint-sized Gilded Gravekeeper', desc: 'Gold shovel, gold lantern, same attitude.', icon: 'c_pet_keeper_gilded', sprite: 'pet_keeper_gilded', source: 'Heroic: the Gravekeeper, 1 in 2,500' },
  { id: gilded('mount.gravehound'), kind: 'mount', name: 'Gilded Gravehound', desc: 'A bone dog the size of a pony, in solid gold. Still a good boy.', icon: 'c_mount_hound_gilded', sprite: 'mount_hound_gilded', source: 'Heroic: the Gravekeeper, 1 in 1,000', saddle: { x: -4, y: -94, k: 0.9 } },
  { id: gilded('trophy.rattlebones_plume'), kind: 'trophy', name: 'Sir Rattlebones’ Gilded Plume', desc: 'He polished it every night. Now you can.', icon: 'c_plume_gilded', sprite: 'tr_plume_gilded', source: 'Heroic: Sir Rattlebones, 1 in 50' },
];

export const HEROIC_COLLECTIBLES: CollectibleDef[] = [
  ...TWINS,
  // dropped in Heroic before the kits gilded your pieces; whoever has it keeps it, and it still works
  { id: gilded('dye.ghostly'), kind: 'cosmetic', name: 'Gravegold Dye', desc: 'Turns your Barrow set to gold.', icon: 'c_dye_gilded', sprite: 'tr_dye_gilded', source: 'Heroic, before gilding kits', retired: true },
  // the reward for the whole heroic log, not a drop
  { id: 'cosmetic.gilded_bones', kind: 'cosmetic', name: 'Gilded Bones', desc: 'Your Risen heroes’ bones turn to gold.', icon: 'c_gilded_bones', source: 'Achievement: Gilded to the Bone' },
];

export const HEROIC_TITLES: TitleDef[] = [{ id: 'title.undying', text: 'the Undying' }];

export const HEROIC_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'barrow-heroic.log', dungeon: 'barrow-heroic', tier: 'log', points: 500, name: 'Gilded to the Bone', how: 'Fill every slot of Heroic Barrow Crypt’s collection log: a gilding kit for every piece (the pet, mount and plume are a bonus).',
    reward: { look: 'barrow-gilded', title: 'title.undying', collectible: 'cosmetic.gilded_bones', text: 'Gilded Barrow Hall for your house, the title the Undying, and gilded bones for your Risen' },
    log: 'barrow-heroic' },
];

const LOG = kitLog(BARROW.collection, HEROIC_KITS, TWINS);

export const BARROW_HEROIC: DungeonInfo = {
  id: 'barrow-heroic',
  name: 'Heroic Barrow Crypt',
  blurb: 'The same crypt with the gloves off: everything hits harder and lasts longer. Made for full Epic.',
  // the Gravekeeper fights all three phases here
  bosses: BARROW.bosses.map((b) => (b.id === 'keeper' ? { ...b, phases: 3 } : b)),
  finalBoss: BARROW.finalBoss,
  // rolled after the Barrow's own tables: the kits and the twins
  loot: kitTables(BARROW_LOOT, HEROIC_KITS, TWINS),
  // the same seed as the normal crypt, more often
  seeds: [{ boss: 'keeper', seed: 'glowcap', rate: 1 / 3 }],
  marksName: BARROW.marksName,
  collection: LOG.collection,
  bonus: LOG.bonus,
  achievements: HEROIC_ACHIEVEMENTS.map((a) => a.id),
  heroicOf: BARROW.id,
};
