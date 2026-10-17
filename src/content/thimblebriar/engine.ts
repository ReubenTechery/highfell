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
  // Tier II, made for what it recommends: level 15 in a few of the Barrow's epics (plain Epic, power 1.72, times
  // level 15's bonus, 1.35). Everything that hurts a hero hits 4 times as hard as written, ordinary mobs have 6.35
  // times their written health (the Brass Stomper 4.86), and the bosses' health is written for it. Bots there
  // clear in about 3:50 without wiping; in Rare (1.24) the healer can't keep up with the Tinker King's swings,
  // which hit 36% harder here than on Heroic's own scale (tests/thimblebriar.test.ts)
  tune: { hit: 4.05, trashHp: 6.35, bossHp: 1.62, hp: { stomper: 4.86, tinker: 1.24 }, dmg: { tinker: 1.36 } },
  // heroic: made for level 35 in Thimblebriar's own full kit (power 2.06 and its effects, times level 35's bonus,
  // 1.85): bots in it clear in about four minutes
  heroic: { hit: 6.9, trashHp: 9.75, bossHp: 3.9 },
};
