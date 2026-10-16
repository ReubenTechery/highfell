/** Thimblebriar Hollow's door for the Dungeons sheet: the round green door in its hill, the Tinker King in his
 *  clockwork suit in the doorway, mushrooms and a cog either side, and room for your three in front. */
import type { DungeonStage } from '../types';

export const THIMBLEBRIAR_STAGE: DungeonStage = {
  view: [96, -48, 448, 456],
  bg: '#1A110B',
  light: { color: '#FF9F43', x: 320, y: 170, r: 230 },
  floor: { y: 256, color: '#4B311E' },
  back: [
    { sprite: 'round_door', x: 320, y: 262, k: 1.12 },
    { sprite: 'tb_shroom_tall', x: 150, y: 268, k: 1.0 },
    { sprite: 'tb_cogs', x: 494, y: 266, k: 1.0 },
  ],
  boss: { sprite: 'tinker', x: 322, y: 288, k: 0.78 },
  front: [
    { sprite: 'tb_shrooms', x: 186, y: 304, k: 0.9 },
    { sprite: 'tb_lamp', x: 456, y: 304, k: 0.9 },
  ],
  heroes: { x: [188, 320, 452], y: 352, k: 0.92 },
};
