/** Barrow Crypt as the progression systems see it: bosses, loot, collection log and achievements. */
import type { DungeonInfo } from '../types';
import { BARROW_ACHIEVEMENTS } from './achievements';
import { BARROW_LOOT } from './loot';

export const BARROW: DungeonInfo = {
  id: 'barrow',
  name: 'Barrow Crypt',
  blurb: 'Five packs, a knight who will not stay down, and the Gravekeeper in his yard. About four minutes, all three seats needed.',
  bosses: [
    { id: 'knight', name: 'Sir Rattlebones', phases: 2, enrage: 180, room: 3 },
    { id: 'keeper', name: 'The Gravekeeper', phases: 3, enrage: 300, room: 5 },
  ],
  finalBoss: 'keeper',
  loot: BARROW_LOOT,
  marksName: 'Barrow Marks',
  collection: [
    'barrowguard.helm', 'barrowguard.shoulders', 'barrowguard.chest',
    'candlewake.helm', 'candlewake.shoulders', 'candlewake.chest',
    'rimebone.helm', 'rimebone.shoulders', 'rimebone.chest',
    'gravekeeper.tank', 'gravekeeper.healer', 'gravekeeper.dps',
    'trophy.rattlebones_plume', 'dye.ghostly', 'mount.gravehound', 'pet.pint_gravekeeper',
  ],
  achievements: BARROW_ACHIEVEMENTS.map((a) => a.id),
};
