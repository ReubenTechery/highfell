/* Thimblebriar Hollow's run script, from `makeDungeonScript` (src/dungeon/template.js): its two bosses, their
   gates and the chest. No ambush, and no seal: no Heroic-only puzzle in this version. */
import { makeDungeonScript } from '../../dungeon/template.js';
import { MAP } from './map.js';

const built = makeDungeonScript({
  map: MAP,
  entranceName: 'The round door',
  miniBoss: {
    id: 'toadstool',
    name: 'Old Toadstool',
    room: 4,
    gateIn: 'miniIn',
    gateOut: 'miniOut',
    victoryText: 'Old Toadstool topples over. The way on is open.',
  },
  finalBoss: {
    id: 'tinker',
    name: 'The Tinker King',
    room: 6,
    gateIn: 'finalIn',
    chestX: 860,
    chestY: 2320,
    // he wakes when someone is well inside his workshop, not in its doorway
    wakeIn: 330,
    victoryText: 'The Tinker King is beaten!',
  },
});

export const STARTS = built.STARTS;
export const setup = built.setup;
export const onBossPulled = built.onBossPulled;
export const onBossDead = built.onBossDead;
export const triggers = built.triggers;
export const onAmbush = built.onAmbush;
export const onRespawn = built.onRespawn;
