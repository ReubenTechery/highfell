/** Thimblebriar Hollow as the progression systems see it: dungeon 2, Tier II. Its bosses, loot, collection log
 *  and achievements. Tuned for the Barrow's epics: Rare gear wipes there. */
import type { DungeonInfo } from '../types';
import { THIMBLEBRIAR_ACHIEVEMENTS } from './achievements';
import { THIMBLEBRIAR_LOOT } from './loot';
import { THIMBLEBRIAR_STAGE } from './stage';

export const THIMBLEBRIAR: DungeonInfo = {
  id: 'thimblebriar',
  name: 'Thimblebriar Hollow',
  blurb: 'A gnome burrow of mushrooms and brass, where the inventions went wrong. Knock their bombs back at them. About three and a half minutes in Barrow epics.',
  season: 0,
  tier: 2,
  recIlvl: 22,
  dropsIlvl: 38,
  bosses: [
    { id: 'toadstool', name: 'Old Toadstool', phases: 2, enrage: 120, room: 4 },
    { id: 'tinker', name: 'The Tinker King', phases: 2, enrage: 210, room: 6 },
  ],
  finalBoss: 'tinker',
  loot: THIMBLEBRIAR_LOOT,
  // the Hollow's seed for the garden: Bramble, for the Bramble Fizz
  seeds: [{ boss: 'tinker', seed: 'bramble', rate: 1 / 5 }],
  marksName: 'Thimblebriar Marks',
  collection: [
    'clockguard.helm', 'clockguard.shoulders', 'clockguard.chest',
    'sporebloom.helm', 'sporebloom.shoulders', 'sporebloom.chest',
    'arcspark.helm', 'arcspark.shoulders', 'arcspark.chest',
    'gearshade.helm', 'gearshade.shoulders', 'gearshade.chest',
    'tinker.tank', 'tinker.healer', 'tinker.dps', 'tinker.rogue',
    'trophy.toadstool_cap', 'dye.sporeglow', 'mount.clockwork_beetle', 'pet.pint_tinker',
  ],
  bonus: ['dye.sporeglow', 'mount.clockwork_beetle', 'pet.pint_tinker'],
  achievements: THIMBLEBRIAR_ACHIEVEMENTS.map((a) => a.id),
  stage: THIMBLEBRIAR_STAGE,
  houseDoor: 'door_thimble',
  clearTitle: 'The Tinker King is beaten',
};
