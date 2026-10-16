/* Dungeon Template: Mobs & Packs.
   Every dungeon uses the 4 core trash archetypes (melee, ranged, brute, caller) + optional wisp/add,
   plus 2 bosses (Pack K in Room 3, Pack G in Room 5) across 7 standard packs (A, B, C, K, D, E, G). */
import { sovereignTick, wardenTick } from './bosses.js';

export const MOBS = {
  skirmisher: { name: 'Skirmisher', kind: 'melee', hp: 565, r: 15, speed: 152, dmg: 50, every: 1.4, wind: 0.3, reach: 22, aggro: 230, sp: 'rattler', skeleton: true },
  stalker: { name: 'Stalker', kind: 'melee', hp: 600, r: 15, speed: 148, dmg: 52, every: 1.45, wind: 0.3, reach: 22, aggro: 230, sp: 'rattler2', skeleton: true },
  slinger: { name: 'Slinger', kind: 'ranged', hp: 395, r: 14, speed: 125, dmg: 30, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'archer', skeleton: true, ranged: { min: 220, max: 360, dmg: 62, every: 2.4, warn: 0.55, speed: 560 } },
  crusher: { name: 'Heavy Crusher', kind: 'brute', hp: 2460, r: 30, speed: 100, dmg: 140, every: 2.2, wind: 0.5, reach: 30, aggro: 240, sp: 'brute', heavy: true, big: true, skeleton: true },
  channeler: { name: 'Channeler', kind: 'caller', hp: 770, r: 15, speed: 110, dmg: 32, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'caller', keep: 240, skeleton: true },
  spark: { name: 'Volatile Spark', kind: 'wisp', hp: 1, r: 12, speed: 98, dmg: 145, every: 99, wind: 0, reach: 6, aggro: 0, sp: 'wisp', wisp: true },
  warden: {
    name: 'Mini-Boss Warden', kind: 'melee', hp: 12200, r: 36, speed: 100, dmg: 150, every: 2.0, wind: 0.45, reach: 34, aggro: 260, sp: 'knight', heavy: true, big: true, boss: true, skeleton: true,
    ai: wardenTick, phases: 2, enrage: 180, acts: { sweep: 'Cleaving Sweep', charge: 'Bull Rush', rally: 'Call Guards' },
  },
  sovereign: {
    name: 'The Sovereign', kind: 'melee', hp: 43800, r: 50, speed: 92, dmg: 180, every: 2.0, wind: 0.5, reach: 40, aggro: 0, sp: 'keeper', heavy: true, big: true, boss: true,
    ai: sovereignTick, phases: 3, enrage: 300, light: { dx: 104, dy: -90, r: 170 }, poseSprites: { smash: 'keeper_smash' },
    acts: { smash: 'Crushing Blow', burrow: 'Submerge', leap: 'Bounding Crush', bury: 'Sanctum Storm', stride: 'Sanctum Stride' },
  },
};

export const PACKS = [
  { id: 'A', room: 1, label: 'warm-up pack', mobs: [['skirmisher', 455, 4850], ['stalker', 548, 4846], ['skirmisher', 470, 4935], ['stalker', 545, 4925]] },
  { id: 'B', room: 2, label: 'crusher pack', mobs: [['crusher', 380, 4030], ['skirmisher', 320, 4100], ['stalker', 440, 4100], ['skirmisher', 380, 4150]] },
  { id: 'C', room: 2, label: 'slinger pack', mobs: [['slinger', 580, 3600], ['slinger', 720, 3620], ['skirmisher', 620, 3700], ['stalker', 690, 3712]] },
  { id: 'K', room: 3, label: 'Mini-Boss Warden', boss: 'warden', mobs: [['warden', 500, 2720]] },
  { id: 'D', room: 4, label: 'channeler pack', mobs: [['channeler', 500, 1960], ['skirmisher', 440, 2030], ['stalker', 560, 2030], ['slinger', 650, 1880]] },
  { id: 'E', room: 4, label: 'ambush pack', ambush: true, goTo: { x: 500, y: 1730 }, mobs: [['skirmisher', 205, 1600], ['stalker', 205, 1760], ['skirmisher', 205, 1920], ['stalker', 795, 1600], ['skirmisher', 795, 1760], ['stalker', 795, 1920], ['crusher', 500, 1600]] },
  { id: 'G', room: 5, label: 'The Sovereign', boss: 'sovereign', approach: 'arena', mobs: [['sovereign', 500, 520]] },
];
