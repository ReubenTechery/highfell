/** Thimblebriar Hollow as the dungeon engine sees it: theme, layout, mobs, packs, the run script, its signature
 *  (the bombs) and its walkout (the Tinker King's cuckoo clock). */
import { DUNGEON_THEMES } from '../../dungeon/template.js';
import { CHECKPOINTS, DECALS, GATES, MAP, PROPS, WALLDECOR, floorArt } from './map.js';
import { MOBS, PACKS } from './mobs.js';
import { SIGNATURE } from './signature.js';
import * as script from './script.js';

export const THIMBLEBRIAR_ENGINE = {
  id: 'thimblebriar',
  name: 'Thimblebriar Hollow',
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
  signature: SIGNATURE,
  // what the last boss drops for the walkout: his cuckoo clock (src/dungeon/walkout.js)
  walkout: 'cuckoo',
  // Tier II, tuned for the Barrow's epics (power 1.72): everything that hurts a hero hits 3 times as hard as
  // written, ordinary mobs have 4.7 times their written health (the Brass Stomper 3.6), and the bosses' health
  // is written for it. Bots there clear in about 3:50 without wiping; in Rare (1.24) the healer can't keep up
  // with the Tinker King's swings, which hit 36% harder here than on Heroic's own scale (tests/thimblebriar.test.ts)
  tune: { hit: 3.0, trashHp: 4.7, bossHp: 1.2, hp: { stomper: 3.6, tinker: 0.92 }, dmg: { tinker: 1.36 } },
  // heroic: made for Thimblebriar's own epics (its full kit, power 2.54): bots in it clear in about four minutes
  heroic: { hit: 4.6, trashHp: 6.5, bossHp: 2.6 },
};
