/* The template's two bosses, built from the shared moves (src/dungeon/moves.js): two or three moves each, a
   clear job for every role, and the dungeon's signature in both fights. Neutral examples: swap them out.

   The Warden, the mini boss (about 40 seconds; from half health everything comes a little faster):
     Hammer   a heavy wedge at the tank: he holds Shield, and a perfect block opens the Warden up.  tank
     Bolt     a long lane at one of the others: step out of it.                                 everyone
     Beacon   the signature: one beacon. He's shielded and it pulses until a DPS breaks it.      DPS, healer

   The Sovereign, the final boss (about 80 seconds, two phases, the second from half health):
     Crush    a heavy circle that follows the tank for a moment: block it.                       tank
     Beacons  the signature: two at once, out round the ring.                                    DPS, healer
     Guards   phase 2: two guards join. The tank Slams them in, and the last one down opens
              the Sovereign up.                                                                  tank, DPS */
import { adds, brain, circle, cone, line } from '../../dungeon/moves.js';
import { SIGNATURE } from './signature.js';

/* a move: `use` it every so many seconds (one number, or one per phase), the first time after `first`, only in
   `phases` if given. `job` says whose it is; `signature` marks the move that uses the dungeon's signature. */
export const WARDEN = {
  enrage: 120,
  phases: [{ at: 0.5, text: 'Phase 2: the Warden speeds up!' }],
  moves: [
    { id: 'hammer', job: 'tank', first: 4, every: [7.5, 6], use: (m) => cone(m, { dmg: 300, r: 200, arc: 2.0, warn: 1.35 }) },
    { id: 'bolt', job: 'everyone', first: 7.5, every: [9.5, 8], use: (m) => line(m, { dmg: 230, w: 84, warn: 1.15, call: 'Bolt! Step out of the lane' }) },
    { id: 'beacon', job: 'dps, healer', signature: true, first: 10, every: 20, use: (m) => SIGNATURE.plant(m, 1).length > 0 },
  ],
  tick: (m) => SIGNATURE.shield(m),
};

export const SOVEREIGN = {
  enrage: 210,
  phases: [{ at: 0.5, text: 'Phase 2: he calls his guards. Tank, grab them!' }],
  moves: [
    { id: 'crush', job: 'tank', first: 5, every: [9, 7.5], use: (m) => circle(m, { block: true, r: 84, dmg: 400, warn: 1.7, follow: 1.1, call: 'Crush! Tank, block it' }) },
    { id: 'beacons', job: 'dps, healer', signature: true, first: 9, every: 21, use: (m) => SIGNATURE.plant(m, 2).length > 0 },
    { id: 'guards', job: 'tank, dps', phases: [2], first: 1.5, every: 24, use: (m) => adds(m, { types: ['skirmisher', 'skirmisher'], expose: 3, call: 'Guards! Tank, grab them' }).length > 0 },
  ],
  tick: (m) => SIGNATURE.shield(m),
};

export const wardenAi = brain(WARDEN);
export const sovereignAi = brain(SOVEREIGN);
