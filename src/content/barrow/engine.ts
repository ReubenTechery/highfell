/** Barrow Crypt as the dungeon engine sees it: layout, mobs, packs and the run script. */
import { CHECKPOINTS, DECALS, GATES, MAP, PROPS, WALLDECOR, floorArt } from './map.js';
import { MOBS, PACKS } from './mobs.js';
import * as script from './script.js';

export const BARROW_ENGINE = {
  id: 'barrow', name: 'Barrow Crypt',
  map: MAP, gates: GATES, props: PROPS, decals: DECALS, walldecor: WALLDECOR, checkpoints: CHECKPOINTS, floorArt,
  mobs: MOBS, packs: PACKS, script, starts: script.STARTS,
};
