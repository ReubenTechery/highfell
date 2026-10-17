/* The template's mobs and where they stand. The shared kinds (melee, ranged, brute, mender) dressed as this
   dungeon's own, one new enemy type that carries the signature (the Beaconkeeper), the signature's beacon, and the
   two bosses. `kind` picks the engine's behaviour and `ai` adds to it. Every mob has one job (fodder, a shooter, a
   brute, a mender, the signature), and each pack is fodder plus one or two of the others. The sprites are Barrow's,
   standing in until the dungeon's own art is drawn. */
import { sovereignAi, wardenAi } from './bosses.js';
import { SIGNATURE } from './signature.js';

export const MOBS = {
  skirmisher: { name: 'Skirmisher', kind: 'melee', hp: 565, r: 15, speed: 152, dmg: 50, every: 1.4, wind: 0.3, reach: 22, aggro: 230, sp: 'rattler' },
  slinger: { name: 'Slinger', kind: 'ranged', hp: 395, r: 14, speed: 125, dmg: 30, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'archer', ranged: { min: 220, max: 360, dmg: 62, every: 2.4, warn: 0.55, speed: 560 } },
  crusher: { name: 'Crusher', kind: 'brute', hp: 2460, r: 30, speed: 100, dmg: 140, every: 2.2, wind: 0.5, reach: 30, aggro: 240, sp: 'brute', heavy: true, big: true },
  // the mender: a 2 s heal on its most hurt packmate every 6 s, a cast the tank or a DPS can stop (kill it first)
  mender: { name: 'Mender', kind: 'mender', hp: 770, r: 15, speed: 110, dmg: 28, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'mender', priority: true },
  // the new enemy type: hangs back, shoots, and plants beacons
  beaconkeeper: { name: 'Beaconkeeper', kind: 'ranged', hp: 770, r: 15, speed: 110, dmg: 32, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'caller', ai: SIGNATURE.trashAi, ranged: { min: 200, max: 340, dmg: 48, every: 2.8, warn: 0.6, speed: 520 } },
  ...SIGNATURE.mobs,
  warden: {
    name: 'Mini-Boss Warden', kind: 'melee', hp: 12000, r: 36, speed: 100, dmg: 150, every: 2.0, wind: 0.45, reach: 34, aggro: 260, sp: 'knight', heavy: true, big: true, boss: true,
    ai: wardenAi, phases: 2, enrage: 120, acts: { hammer: 'Hammer', bolt: 'Bolt', beacon: 'Beacon' },
  },
  sovereign: {
    name: 'The Sovereign', kind: 'melee', hp: 17600, r: 50, speed: 92, dmg: 180, every: 2.0, wind: 0.5, reach: 40, aggro: 0, sp: 'keeper', heavy: true, big: true, boss: true,
    ai: sovereignAi, phases: 2, enrage: 210, light: { dx: 104, dy: -90, r: 170 }, acts: { crush: 'Crush', beacons: 'Beacons', guards: 'Guards' },
  },
};

/* packs: mobs and where they stand. Bots walk to `goTo` when the pack has no live mobs to aim at, and to the
   arena for the final boss (`approach: 'arena'`). */
export const PACKS = [
  { id: 'A', room: 1, label: 'long hall', mobs: [['skirmisher', 900, 4650], ['skirmisher', 980, 4650], ['slinger', 1100, 4580], ['skirmisher', 940, 4720]] },
  { id: 'B', room: 2, label: 'crossroads', mobs: [['crusher', 1000, 3700], ['skirmisher', 940, 3780], ['skirmisher', 1080, 3780], ['beaconkeeper', 1140, 3600]] },
  { id: 'C', room: 3, label: 'side room', mobs: [['beaconkeeper', 230, 3660], ['slinger', 330, 3600], ['slinger', 200, 3800], ['skirmisher', 300, 3750]] },
  { id: 'D', room: 4, label: 'gallery', mobs: [['skirmisher', 880, 2800], ['skirmisher', 1000, 2800], ['mender', 1100, 2760], ['beaconkeeper', 790, 2760]] },
  { id: 'K', room: 5, label: 'Mini-Boss Warden', boss: 'warden', mobs: [['warden', 940, 2140]] },
  { id: 'G', room: 6, label: 'The Sovereign', boss: 'sovereign', approach: 'arena', mobs: [['sovereign', 940, 1060]] },
];
