/** Barrow Crypt's door for the Dungeons sheet: the crypt's arch between two pillars, the Gravekeeper in the
 *  doorway in his lantern's green light, and your party in front of him. */
import type { DungeonStage } from '../types';

export const BARROW_STAGE: DungeonStage = {
  view: [96, -48, 448, 456],
  bg: '#241C33',
  light: { color: '#9BE15D', x: 320, y: 168, r: 230 },
  floor: { y: 256, color: '#3A3150' },
  back: [
    { sprite: 'arch', x: 320, y: 262, k: 1.32 },
    { sprite: 'pillar', x: 142, y: 266, k: 1.06 },
    { sprite: 'pillar', x: 498, y: 266, k: 1.06 },
  ],
  boss: { sprite: 'keeper', x: 324, y: 290, k: 0.8 },
  front: [
    { sprite: 'candles', x: 190, y: 302, k: 0.95 },
    { sprite: 'candles', x: 452, y: 304, k: 0.95 },
  ],
  heroes: { x: [188, 320, 452], y: 352, k: 0.92 },
};
