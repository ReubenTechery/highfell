/* Barrow Crypt: run script built on `makeDungeonScript` from `src/dungeon/template.js`. */
import { DEFAULT_SEAL_PATTERNS, makeDungeonScript, makeSealTrial } from '../../dungeon/template.js';
import { MAP } from './map.js';

export const SEAL_PATTERNS = DEFAULT_SEAL_PATTERNS;
export const makeSeal = () => makeSealTrial({
  patterns: SEAL_PATTERNS,
  x: 500,
  y: 1920,
  col: '#F2C230',
  floatText: 'CRYPT SURGE!',
  bannerText: 'Crypt Seal shattered! +20% damage & +25% speed!',
  surgeDur: 18,
});

const built = makeDungeonScript({
  map: MAP,
  entranceName: 'The entrance',
  miniBoss: {
    id: 'knight',
    name: 'Sir Rattlebones',
    room: 3,
    gateIn: 'g3b',
    gateOut: 'g3t',
    pullY: 3120,
    victoryText: 'Sir Rattlebones falls. The way on is open.',
  },
  finalBoss: {
    id: 'keeper',
    name: 'The Gravekeeper',
    room: 5,
    gateIn: 'g5',
    pullY: 1120,
    chestX: 500,
    chestY: 660,
    victoryText: 'The Gravekeeper is buried for good!',
  },
  seal: {
    patterns: SEAL_PATTERNS,
    x: 500,
    y: 1920,
    col: '#F2C230',
    floatText: 'CRYPT SURGE!',
    bannerText: 'Crypt Seal shattered! +20% damage & +25% speed!',
    surgeDur: 18,
  },
  ambush: {
    packId: 'E',
    afterPack: 'D',
    room: 4,
    triggerY: 1800,
    propClosed: 'coffin',
    propOpen: 'coffin_open',
    bannerText: 'Ambush! The coffins are opening!',
  },
});

export const STARTS = built.STARTS;
export const setup = built.setup;
export const onBossPulled = built.onBossPulled;
export const onBossDead = built.onBossDead;
export const triggers = built.triggers;
export const onAmbush = built.onAmbush;
export const onRespawn = built.onRespawn;
