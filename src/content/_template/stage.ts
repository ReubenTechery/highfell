/**
 * Dungeon Template: the door for the Dungeons sheet (`DungeonStage`). Every dungeon needs one: it is the
 * picture your party stands in front of before every run.
 *
 * - `view` frames the picture in the banner's world (640 wide, y going down, the floor near 256). Keep its
 *   shape (448 by 456) so the name plates sit under the heroes on every screen.
 * - `back` is the door and what frames it (the arch first), `boss` is the final boss in the doorway drawn
 *   with its mob's sprite (`sp` in mobs.js), `front` is anything standing between the boss and the heroes.
 * - `heroes` keeps the three spots clear: don't put props where they stand (x 188, 320, 452 on y 352).
 * - Colours: `bg` and `floor` from the dungeon's palette, `light` in its signature colour (Heroic turns it
 *   gold by itself).
 */
import type { DungeonStage } from '../types';

export const TEMPLATE_STAGE: DungeonStage = {
  view: [96, -48, 448, 456],
  bg: '#271E2C',
  light: { color: '#F4B942', x: 320, y: 168, r: 230 },
  floor: { y: 256, color: '#5A3E2B' },
  back: [
    { sprite: 'arch', x: 320, y: 262, k: 1.32 },
    { sprite: 'pillar', x: 142, y: 266, k: 1.06 },
    { sprite: 'pillar', x: 498, y: 266, k: 1.06 },
  ],
  // The Sovereign is drawn with the Gravekeeper's sprite until it has its own
  boss: { sprite: 'keeper', x: 324, y: 290, k: 0.8 },
  front: [
    { sprite: 'candles', x: 190, y: 302, k: 0.95 },
    { sprite: 'candles', x: 452, y: 304, k: 0.95 },
  ],
  heroes: { x: [188, 320, 452], y: 352, k: 0.92 },
};
