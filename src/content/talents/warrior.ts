/** The warrior's two specs. Shield: blocks hit back, and a perfect block sets up your biggest hit. Axe: Crush
 *  everything, and your Crushes keep you standing. Both tank: neither changes the buttons until points go in. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

export const SHIELD: SpecDef = {
  id: 'shield', cls: 'warrior', name: 'Shield', icon: 'spec_shield', color: '#4F6FA8',
  pitch: 'Hold the line. Blocks hit back, and a perfect block sets up your biggest hit.',
  talents: [
    stat('sh.grit', 'Grit', 1, 5, 'hp'),
    stat('sh.skin', 'Iron Skin', 1, 5, 'armor'),
    change('sh.spikes', 'Spiked Shield', 2, 'a4', 'shield', 'A block hits back for 60.'),
    stat('sh.presence', 'Presence', 2, 4, 'threat'),
    change('sh.brace', 'Brace', 3, 'a4', 'shield', 'A perfect block heals you for 12% of your health.', { choice: 'sh3' }),
    change('sh.cover', 'Cover', 3, 'a3', 'slam', 'Slam shields your two mates for 120.', { choice: 'sh3' }),
    stat('sh.stout', 'Stout', 3, 4, 'hp'),
    change('sh.wall', 'Iron Wall', 4, 'a4', 'ward', 'While your shield is up, mates near you take 20% less damage.'),
    stat('sh.plate', 'Plating', 4, 4, 'armor'),
    change('sh.payback', 'Payback', 5, 'a1', 'cap_payback', 'After a perfect block, your next Cleave hits three times as hard and stuns.', { capstone: true }),
    stat('sh.stubborn', 'Stubborn', 5, 3, 'hp'),
  ],
};

export const AXE: SpecDef = {
  id: 'axe', cls: 'warrior', name: 'Axe', icon: 'spec_axe', color: '#E07A2E',
  pitch: 'Crush everything. Your Crushes keep you standing.',
  talents: [
    stat('ax.edge', 'Sharp Edge', 1, 5, 'dmg'),
    stat('ax.eye', 'Keen Eye', 1, 5, 'crit'),
    change('ax.hungry', 'Hungry Axe', 2, 'a1', 'cleave', 'A Crush heals you for a fifth of what it deals.'),
    stat('ax.brawn', 'Brawn', 2, 4, 'hp'),
    change('ax.quick', 'Quick Charge', 3, 'a2', 'charge', 'Charge comes back in 6 seconds, not 8.', { choice: 'ax3' }),
    change('ax.spin', 'Spinning Axe', 3, 'a3', 'slam', 'Slam’s whirlwind hits twice as hard.', { choice: 'ax3' }),
    stat('ax.tempo', 'Battle Tempo', 3, 4, 'haste'),
    change('ax.fury', 'Rising Fury', 4, 'a1', 'cleave', 'Each Crush makes your hits 3% harder for 8 seconds, up to five times.'),
    stat('ax.heavy', 'Heavy Hands', 4, 4, 'dmg'),
    change('ax.storm', 'Axe Storm', 5, 'a1', 'cap_axestorm', 'A Crush sweeps all the way round you and hits 15% harder.', { capstone: true }),
    stat('ax.killer', 'Killer Instinct', 5, 3, 'crit'),
  ],
};
