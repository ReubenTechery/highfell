/* Thimblebriar Hollow's two bosses, built from the shared moves (src/dungeon/moves.js): three moves each, a job
   for every role, and the bombs (signature.js) in both fights.

   Old Toadstool, the mini boss: a giant old mushroom, about 40 seconds. From half health everything comes faster.
     Cap Slam         a heavy circle on the tank: block it, and a perfect block knocks him dizzy (Exposed)    tank
     Puffball Volley  a puffball at everyone's feet: knock them back into him (each one opens him up)          DPS, everyone
     Spore Burst      a 2 s cast: the tank or a DPS stops it (and he's Exposed); missed, it hits the whole party
                      and the healer heals through it                                                           tank, dps, healer

   The Tinker King, the final boss: a gnome inventor in a giant clockwork suit, about 80 seconds, two phases.
     Wrench Smash     a heavy circle that follows the tank for a moment: block it, a perfect block opens him up tank
     Bomb Barrage     four bombs round the workshop: knock them back at him                                    DPS, everyone
     Sticky Bomb      stuck on a mate of the tank's: only the healer swipes it off, and it flies back at him  healer
   Phase 2 at half health: the suit cracks open, the Barrage comes every 11 seconds instead of 16, and two
   Sticky Bombs at once. */
import { brain, cast, circle, pulse } from '../../dungeon/moves.js';
import { SIGNATURE } from './signature.js';

/* the boss stands a moment while a move with no telegraph goes off, so the boss bar can name it */
const stand = (m, dur) => { m.act = { k: 'hold', t: 0, dur }; m.pose = 'wind'; return true; };

export const TOADSTOOL = {
  enrage: 120,
  phases: [{ at: 0.5, text: 'Phase 2: Old Toadstool is all puffed up!' }],
  moves: [
    { id: 'slam', job: 'tank', first: 4, every: [8, 6.5], use: (m) => circle(m, { block: true, r: 92, dmg: 230, warn: 1.5, follow: 0.9, col: '#C8F5A8', call: 'Cap Slam! Tank, block it' }) },
    { id: 'volley', job: 'dps, everyone', signature: true, first: 7, every: [12, 9], use: (m) => SIGNATURE.volley(m, 3) && stand(m, 0.7) },
    { id: 'burst', job: 'tank or dps to stop it, healer if it lands', first: 10.5, every: [11, 8.5], use: (m) => cast(m, { id: 'burst', name: 'Spore Burst', done: (b) => pulse(b, { dmg: 75, name: 'Spore Burst', col: '#C8F5A8' }) }) },
  ],
};

export const TINKER = {
  enrage: 210,
  phases: [{ at: 0.5, text: 'Phase 2: his suit cracks open! Faster bombs!' }],
  moves: [
    { id: 'smash', job: 'tank', first: 5, every: [8.5, 7], use: (m) => circle(m, { block: true, r: 86, dmg: 240, warn: 1.7, follow: 1.1, count: true, call: 'Wrench Smash! Tank, block it' }) },
    { id: 'barrage', job: 'dps, everyone', signature: true, first: 8, every: [16, 11], use: (m) => SIGNATURE.barrage(m, 4) && stand(m, 0.8) },
    { id: 'sticky', job: 'healer', first: 12, every: [14, 13], use: (m) => SIGNATURE.stick(m, m.phase >= 2 ? 2 : 1) && stand(m, 0.5) },
  ],
};

export const toadstoolAi = brain(TOADSTOOL);
export const tinkerAi = brain(TINKER);
