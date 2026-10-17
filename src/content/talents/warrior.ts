/** The warrior's two specs. Shield: hold the line; foes that hit you get hurt, big pulls feed your Cleave, and a
 *  perfect block sets up your biggest hit. Axe: Crush everything, and your Crushes keep you standing. Both tank:
 *  neither changes the buttons until points go in. Rows 2 to 5 are each a pick of one from two. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

export const SHIELD: SpecDef = {
  id: 'shield', cls: 'warrior', name: 'Shield', icon: 'spec_shield', color: '#4F6FA8',
  pitch: 'Hold the line. Foes that hit you get hurt, big pulls feed your Cleave, and a perfect block sets up your biggest hit.',
  talents: [
    stat('sh.grit', 'Grit', 1, 5, 'hp'),
    stat('sh.skin', 'Iron Skin', 1, 5, 'armor'),
    change('sh.spikes', 'Spiked Shield', 2, 'a4', 'shield', 'Foes that hit you take 50 back, 150 if you blocked it.', { choice: 'sh2' }),
    change('sh.rim', 'Rim Strike', 2, 'a1', 'cleave', 'Every third Cleave bashes with the rim: it stuns what it hits for a second.', { choice: 'sh2' }),
    stat('sh.presence', 'Presence', 2, 4, 'threat'),
    change('sh.brace', 'Breach', 3, 'a2', 'charge', 'Charge Exposes the foes it hits for 2 seconds.', { choice: 'sh3' }),
    change('sh.cover', 'Cover', 3, 'a3', 'slam', 'Slam shields your two mates for 120.', { choice: 'sh3' }),
    stat('sh.stout', 'Heft', 3, 4, 'dmg'),
    change('sh.bulwark', 'Bulwark', 4, 'a3', 'slam', 'Slam reaches half as far again, and your next Cleave hits 8% harder for each foe it pulled.', { choice: 'sh4' }),
    change('sh.wall', 'Iron Wall', 4, 'a4', 'ward', 'While your shield is up, mates near you take 20% less damage.', { choice: 'sh4' }),
    stat('sh.plate', 'Plating', 4, 4, 'armor'),
    change('sh.payback', 'Payback', 5, 'a1', 'cap_payback', 'After a perfect block, your next Cleave hits three times as hard and stuns.', { capstone: true, choice: 'sh5' }),
    change('sh.unbowed', 'Unbowed', 5, 'a3', 'cap_unbowed', 'With three or more foes on you, Slam comes back twice as fast and hits twice as hard, whirlwind and all.', { capstone: true, choice: 'sh5' }),
    stat('sh.stubborn', 'Stubborn', 5, 3, 'hp'),
  ],
};

export const AXE: SpecDef = {
  id: 'axe', cls: 'warrior', name: 'Axe', icon: 'spec_axe', color: '#E07A2E',
  pitch: 'Crush everything. Your Crushes keep you standing.',
  talents: [
    stat('ax.edge', 'Sharp Edge', 1, 5, 'dmg'),
    stat('ax.eye', 'Keen Eye', 1, 5, 'crit'),
    change('ax.hungry', 'Hungry Axe', 2, 'a1', 'cleave', 'A Crush heals you for a fifth of what it deals.', { choice: 'ax2' }),
    change('ax.savage', 'Savage Swing', 2, 'a1', 'cleave', 'Cleave hits 15% harder on a foe under half its health.', { choice: 'ax2' }),
    stat('ax.brawn', 'Brawn', 2, 4, 'hp'),
    change('ax.quick', 'Quick Charge', 3, 'a2', 'charge', 'Charge comes back in 6 seconds, not 8.', { choice: 'ax3' }),
    change('ax.spin', 'Spinning Axe', 3, 'a3', 'slam', 'Slam’s whirlwind hits twice as hard.', { choice: 'ax3' }),
    stat('ax.tempo', 'Battle Tempo', 3, 4, 'haste'),
    change('ax.fury', 'Rising Fury', 4, 'a1', 'cleave', 'Each Crush makes your hits 3% harder for 8 seconds, up to five times.', { choice: 'ax4' }),
    change('ax.headlong', 'Headlong', 4, 'a2', 'charge', 'Charge primes two Crushes, not one.', { choice: 'ax4' }),
    stat('ax.heavy', 'Heavy Hands', 4, 4, 'dmg'),
    change('ax.storm', 'Axe Storm', 5, 'a1', 'cap_axestorm', 'A Crush sweeps all the way round you and hits 15% harder.', { capstone: true, choice: 'ax5' }),
    change('ax.final', 'Final Word', 5, 'a1', 'cap_finalword', 'A Crush finishes a foe under a fifth of its health; a boss that low takes it twice as hard.', { capstone: true, choice: 'ax5' }),
    stat('ax.killer', 'Killer Instinct', 5, 3, 'crit'),
  ],
};
