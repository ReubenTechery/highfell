/** Barrow Crypt as the progression systems see it: bosses, loot, collection log and achievements. */
import type { DungeonInfo } from '../types';
import { BARROW_ACHIEVEMENTS } from './achievements';
import { BARROW_LOOT } from './loot';

export const BARROW: DungeonInfo = {
  id: 'barrow',
  name: 'Barrow Crypt',
  blurb: 'Five packs, a knight who will not stay down, and the Gravekeeper in his yard. About four minutes, all three seats needed.',
  tier: 1,
  recIlvl: 10,
  dropsIlvl: 26,
  bosses: [
    { id: 'knight', name: 'Sir Rattlebones', phases: 2, enrage: 180, room: 3 },
    { id: 'keeper', name: 'The Gravekeeper', phases: 3, enrage: 300, room: 5 },
  ],
  finalBoss: 'keeper',
  loot: BARROW_LOOT,
  // the Barrow's seed for the garden: Glowcap, for the Glowcap Draught
  seeds: [{ boss: 'keeper', seed: 'glowcap', rate: 1 / 5 }],
  marksName: 'Barrow Marks',
  collection: [
    'barrowguard.helm', 'barrowguard.shoulders', 'barrowguard.chest',
    'candlewake.helm', 'candlewake.shoulders', 'candlewake.chest',
    'rimebone.helm', 'rimebone.shoulders', 'rimebone.chest',
    'shadeveil.helm', 'shadeveil.shoulders', 'shadeveil.chest',
    'gravekeeper.tank', 'gravekeeper.healer', 'gravekeeper.dps', 'gravekeeper.rogue',
    'trophy.rattlebones_plume', 'dye.ghostly', 'mount.gravehound', 'pet.pint_gravekeeper',
  ],
  bonus: ['dye.ghostly', 'mount.gravehound', 'pet.pint_gravekeeper'],
  achievements: BARROW_ACHIEVEMENTS.map((a) => a.id),
};
