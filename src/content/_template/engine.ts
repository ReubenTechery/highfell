/** Dungeon Template: Engine definition (`DungeonEngineDef`). */
import { DUNGEON_THEMES } from '../../dungeon/template.js';
import { CHECKPOINTS, DECALS, GATES, MAP, PROPS, WALLDECOR, floorArt } from './map.js';
import { MOBS, PACKS } from './mobs.js';
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
  tune: { hit: 1.5, trashHp: 1.3, bossHp: 1 },
  heroic: { hit: 3.2, trashHp: 1.95, bossHp: 1.63 },
};
