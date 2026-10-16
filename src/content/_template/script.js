/* The template's run script, from `makeDungeonScript` (src/dungeon/template.js): its two bosses, their gates
   and the chest. No ambush; the seal is Heroic only. */
import { makeDungeonScript } from '../../dungeon/template.js';
import { MAP } from './map.js';

const built = makeDungeonScript({
  map: MAP,
  entranceName: 'The entrance',
  miniBoss: {
    id: 'warden',
    name: 'Mini-Boss Warden',
    room: 5,
    gateIn: 'miniIn',
    gateOut: 'miniOut',
    victoryText: 'The Warden falls. The way on is open.',
  },
  finalBoss: {
    id: 'sovereign',
    name: 'The Sovereign',
    room: 6,
    gateIn: 'finalIn',
    chestX: 940,
    chestY: 1120,
    victoryText: 'The Sovereign is defeated!',
  },
  // optional, and only ever on Heroic (Normal never gets a puzzle): the three-seat seal, here in the
  // crossroads once its pack is down
  seal: {
    afterPack: 'B',
    x: 940,
    y: 3900,
    col: '#F2C230',
    floatText: 'SURGE!',
    bannerText: 'Seal broken! +20% damage & +25% speed!',
    surgeDur: 18,
  },
});

export const STARTS = built.STARTS;
export const setup = built.setup;
export const onBossPulled = built.onBossPulled;
export const onBossDead = built.onBossDead;
export const triggers = built.triggers;
export const onAmbush = built.onAmbush;
export const onRespawn = built.onRespawn;
