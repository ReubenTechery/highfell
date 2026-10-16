/* Barrow Crypt: who lives here and where they stand. */
import { keeperTick, knightTick } from './bosses.js';

/* kind picks the behaviour: melee, ranged, caller, brute, wisp. Bosses bring their own ai. */
export const MOBS = {
  rattler: { name: 'Rattler', kind: 'melee', hp: 565, r: 15, speed: 152, dmg: 50, every: 1.4, wind: 0.3, reach: 22, aggro: 230, sp: 'rattler', skeleton: true },
  rattler2: { name: 'Rattler', kind: 'melee', hp: 600, r: 15, speed: 148, dmg: 52, every: 1.45, wind: 0.3, reach: 22, aggro: 230, sp: 'rattler2', skeleton: true },
  archer: { name: 'Bone Archer', kind: 'ranged', hp: 395, r: 14, speed: 125, dmg: 30, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'archer', skeleton: true, ranged: { min: 220, max: 360, dmg: 62, every: 2.4, warn: 0.55, speed: 560 } },
  brute: { name: 'Bonebrute', kind: 'brute', hp: 2460, r: 30, speed: 100, dmg: 140, every: 2.2, wind: 0.5, reach: 30, aggro: 240, sp: 'brute', heavy: true, big: true, skeleton: true },
  caller: { name: 'Gravecaller', kind: 'caller', hp: 770, r: 15, speed: 110, dmg: 32, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'caller', keep: 240, skeleton: true },
  wisp: { name: 'Wisp', kind: 'wisp', hp: 1, r: 12, speed: 98, dmg: 95, every: 99, wind: 0, reach: 6, aggro: 0, sp: 'wisp', wisp: true },
  knight: { name: 'Sir Rattlebones', kind: 'melee', hp: 11400, r: 36, speed: 100, dmg: 150, every: 2.0, wind: 0.45, reach: 34, aggro: 260, sp: 'knight', heavy: true, big: true, boss: true, skeleton: true,
    ai: knightTick, phases: 2, enrage: 180, acts: { sweep: 'Cleaving Sweep', charge: 'Shield Charge', rally: 'Rally the Dead' } },
  keeper: { name: 'The Gravekeeper', kind: 'melee', hp: 41600, r: 50, speed: 92, dmg: 180, every: 2.0, wind: 0.5, reach: 40, aggro: 0, sp: 'keeper', heavy: true, big: true, boss: true,
    ai: keeperTick, phases: 3, enrage: 300, light: { dx: 104, dy: -90, r: 170 }, poseSprites: { smash: 'keeper_smash' },
    acts: { smash: 'Shovel Smash', burrow: 'Burrowing', leap: 'Leap', bury: 'Bury the Yard', stride: 'Grave Stride' } },
};

/* packs: mobs and where they stand. Bots walk to `goTo` when the pack has no live mobs to aim at. */
export const PACKS = [
  { id: 'A', room: 1, label: 'skeletons', mobs: [['rattler', 455, 4850], ['rattler2', 548, 4846], ['rattler', 470, 4935], ['caller', 545, 4935]] },
  { id: 'B', room: 2, label: 'bonebrute', mobs: [['brute', 380, 4030], ['rattler', 320, 4100], ['rattler2', 440, 4100], ['rattler', 380, 4150]] },
  { id: 'C', room: 2, label: 'archers', mobs: [['archer', 580, 3600], ['archer', 720, 3620], ['rattler', 620, 3700], ['caller', 690, 3712]] },
  { id: 'K', room: 3, label: 'Sir Rattlebones', boss: 'knight', mobs: [['knight', 500, 2720]] },
  { id: 'D', room: 4, label: 'gravecaller', mobs: [['caller', 500, 1960], ['rattler', 440, 2030], ['rattler2', 560, 2030], ['archer', 650, 1880]] },
  { id: 'E', room: 4, label: 'ambush', ambush: true, goTo: { x: 500, y: 1730 }, mobs: [['rattler', 205, 1600], ['rattler2', 205, 1760], ['rattler', 205, 1920], ['rattler2', 795, 1600], ['rattler', 795, 1760], ['rattler2', 795, 1920], ['brute', 500, 1600]] },
  { id: 'G', room: 5, label: 'The Gravekeeper', boss: 'keeper', approach: 'arena', mobs: [['keeper', 500, 520]] },
];
