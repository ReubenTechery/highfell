/** Dungeon Template: Achievements & Collection Log completion prize (e.g. unlocking Gnome in Thimblebriar!). */
import type { AchievementDef } from '../types';

export const TEMPLATE_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'template.clear', dungeon: 'template', tier: 'bronze', points: 10,
    name: 'Into the Sanctum', how: 'Clear Template Sanctum.',
    reward: { collectible: 'trophy.sanctum_key', text: 'Trophy: Sanctum Key' },
  },
  {
    id: 'template.log', dungeon: 'template', tier: 'log', points: 500,
    name: 'Heart of the Burrow', how: 'Fill every slot of Template Sanctum’s collection log.',
    reward: {
      race: 'gnome',
      look: 'barrow',
      title: 'title.tinker',
      text: 'Gnomes as a playable race, a new look for your house, and the title the Clockwork Knight',
    },
    log: 'template',
  },
];
