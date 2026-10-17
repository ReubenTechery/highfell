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
  // how hard it is: everything that hurts a hero hits 1.5 times as hard as written, and ordinary mobs have 65%
  // more health (the Bonebrute 40%), so the packs carry about half the fighting (12 to 20 s each in Common
  // gear). The Gravekeeper fights two phases on Normal, not three, so he has 55% of his written health and Sir
  // Rattlebones 93%: about 40 and 65 seconds, and a run lands near three and a half minutes.
  tune: { hit: 1.5, trashHp: 1.65, bossHp: 1, hp: { brute: 1.4, keeper: 0.55, knight: 0.93 } },
  // heroic: made for level 20 in full Epic (1.72 base power, times level 20's bonus, 1.475), with the Crypt Seal
  // and all three of the Gravekeeper's phases. Bots there clear it in about four minutes, nearly always without
  // wiping; in Common they get buried (tests/balance.test.ts). Its hits went from 2.8 to 3.4 with the combat
  // overhaul (Smite gives the healer mana back every beat, so a Common party no longer ran dry and limped
  // through), then times 1.475 for level 20.
  heroic: { hit: 5.0, trashHp: 3.47, bossHp: 2.43 },
};
