/** What your level gives besides talent points: a full tree at level 30, and titles at 50 and the top, 99 (the
 *  long climb for whoever wants it). Earned wherever the XP came from; checked whenever XP comes in. */
import type { AchievementDef, TitleDef } from './types';

/** where the level's achievements go on the achievements page */
export const LEVEL_PLACE = { id: 'levels', name: 'Your level' } as const;
const D = LEVEL_PLACE.id;

export const LEVEL_TITLES: TitleDef[] = [
  { id: 'title.seasoned', text: 'the Seasoned' },
  { id: 'title.tireless', text: 'the Tireless' },
];

export const LEVEL_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'level.30', dungeon: D, tier: 'bronze', points: 10, name: 'Full Tree', how: 'Reach level 30, with every point a talent tree can hold.',
    reward: { text: 'Every talent point a tree holds' }, counter: { key: 'level', target: 30 } },
  { id: 'level.50', dungeon: D, tier: 'silver', points: 25, name: 'Seasoned', how: 'Reach level 50.',
    reward: { title: 'title.seasoned', text: 'Title: the Seasoned' }, counter: { key: 'level', target: 50 } },
  { id: 'level.99', dungeon: D, tier: 'gold', points: 50, name: 'Ninety-Nine', how: 'Reach level 99, the top.',
    reward: { title: 'title.tireless', text: 'Title: the Tireless' }, counter: { key: 'level', target: 99 } },
];
