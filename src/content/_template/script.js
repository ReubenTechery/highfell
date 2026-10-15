/* Dungeon Template: script hooks built declaratively with `makeDungeonScript`. */
import { makeDungeonScript } from '../../dungeon/template.js';
import { MAP } from './map.js';

const built = makeDungeonScript({
  map: MAP,
  entranceName: 'The entrance',
  miniBoss: {
    id: 'warden',
    name: 'Mini-Boss Warden',
    room: 3,
    gateIn: 'g3b',
    gateOut: 'g3t',
    pullY: 3120,
    victoryText: 'The Warden falls. The way deeper is open.',
  },
  finalBoss: {
    id: 'sovereign',
    name: 'The Sovereign',
    room: 5,
    gateIn: 'g5',
    pullY: 1120,
    chestX: 500,
    chestY: 660,
    victoryText: 'The Sovereign is defeated!',
  },
  seal: {
    x: 500,
    y: 1920,
    col: '#F2C230',
    floatText: 'SANCTUM SURGE!',
    bannerText: 'Runes aligned! +20% damage & +25% speed!',
    surgeDur: 18,
  },
  ambush: {
    packId: 'E',
    afterPack: 'D',
    room: 4,
    triggerY: 1800,
    propClosed: 'coffin',
    propOpen: 'coffin_open',
    bannerText: 'Ambush! They are pouring out!',
  },
});

export const STARTS = built.STARTS;
export const setup = built.setup;
export const onBossPulled = built.onBossPulled;
export const onBossDead = built.onBossDead;
export const triggers = built.triggers;
export const onAmbush = built.onAmbush;
export const onRespawn = built.onRespawn;
