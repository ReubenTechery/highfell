/** Barrow Crypt as the dungeon engine sees it: theme, layout, mobs, packs and the run script. */
import { DUNGEON_THEMES } from '../../dungeon/template.js';
import { CHECKPOINTS, DECALS, GATES, MAP, PROPS, WALLDECOR, floorArt } from './map.js';
import { MOBS, PACKS } from './mobs.js';
import * as script from './script.js';

export const BARROW_ENGINE = {
  id: 'barrow', name: 'Barrow Crypt',
  theme: DUNGEON_THEMES.barrow,
  map: MAP, gates: GATES, props: PROPS, decals: DECALS, walldecor: WALLDECOR, checkpoints: CHECKPOINTS, floorArt,
  mobs: MOBS, packs: PACKS, script, starts: script.STARTS,
  // how hard it is: everything that hurts a hero hits 1.5 times as hard as written, and ordinary mobs have
  // 30% more health, so tanking and healing matter and a run lands near four minutes.
  tune: { hit: 1.5, trashHp: 1.3, bossHp: 1 },
  // heroic: made for full Epic (1.72 base power). Bots in full Epic clear it in about four minutes
  // without wiping; in Common they get buried (tests/balance.test.ts).
  heroic: { hit: 3.2, trashHp: 1.95, bossHp: 1.63 },
};
