/** The template as the dungeon engine sees it: theme, layout, mobs, packs, the run script and its signature. */
import { DUNGEON_THEMES } from '../../dungeon/template.js';
import { CHECKPOINTS, DECALS, GATES, MAP, PROPS, WALLDECOR, floorArt } from './map.js';
import { MOBS, PACKS } from './mobs.js';
import { SIGNATURE } from './signature.js';
import * as script from './script.js';

export const TEMPLATE_ENGINE = {
  id: 'template',
  name: 'Template Sanctum',
  theme: DUNGEON_THEMES.thimblebriar,
  map: MAP,
  gates: GATES,
  props: PROPS,
  decals: DECALS,
  walldecor: WALLDECOR,
  checkpoints: CHECKPOINTS,
  floorArt,
  mobs: MOBS,
  packs: PACKS,
  script,
  starts: script.STARTS,
  // the one idea this dungeon is about (signature.js): its trash and both bosses use it
  signature: SIGNATURE,
  // how hard it is, as Barrow: everything that hurts a hero hits 1.5 times as hard as written, ordinary mobs
  // have 30% more health. Heroic is made for full Epic.
  tune: { hit: 1.5, trashHp: 1.3, bossHp: 1 },
  heroic: { hit: 2.8, trashHp: 1.95, bossHp: 1.63 },
};
