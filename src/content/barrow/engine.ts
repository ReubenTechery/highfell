/** Barrow Crypt as the dungeon engine sees it: layout, mobs, packs and the run script. */
import { CHECKPOINTS, DECALS, GATES, MAP, PROPS, WALLDECOR, floorArt } from './map.js';
import { MOBS, PACKS } from './mobs.js';
import * as script from './script.js';

export const BARROW_ENGINE = {
  id: 'barrow', name: 'Barrow Crypt',
  map: MAP, gates: GATES, props: PROPS, decals: DECALS, walldecor: WALLDECOR, checkpoints: CHECKPOINTS, floorArt,
  mobs: MOBS, packs: PACKS, script, starts: script.STARTS,
  // how hard it is: everything that hurts a hero hits 1.5 times as hard as written, and the ordinary
  // mobs have a third more health (the bosses keep theirs). Raised from 1 and 1 so tanking and healing matter.
  tune: { hit: 1.5, trashHp: 1.3 },
  // heroic: made for full Epic. Everything hits twice as hard as here, ordinary mobs have 60% more health
  // and the bosses 40% more. Bots in full Epic clear it in about four minutes without wiping; in Rare they
  // wipe once or twice; in Common they get buried (tests/balance.test.ts).
  heroic: { hit: 3, trashHp: 1.6, bossHp: 1.4 },
};
