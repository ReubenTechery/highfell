/** The mage's two specs. Frost is the mage as it was: freeze them, then shatter them. Fire turns the four buttons
 *  to fire the moment you pick it: foes burn instead of freezing, and a Comet on a burning foe Combusts. The engine
 *  still knows each button by its slot, so mage gear that makes a button better makes its fire one better too. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

/** Burn, Fire's damage over time: each stack hurts this much every half second for `dur` seconds (a new stack
 *  starts it again), up to `max` stacks (`kindling`'s with Kindling). Comet Combusts a foe with `combust` or more. */
export const BURN = { per: 2, every: 0.5, dur: 6, max: 4, kindling: 6, combust: 3 };

export const FROST: SpecDef = {
  id: 'frost', cls: 'mage', name: 'Frost', icon: 'spec_frost', color: '#3D7FC1',
  pitch: 'Freeze them, then shatter them. Frozen foes can’t hit back.',
  talents: [
    stat('fr.cold', 'Bitter Cold', 1, 5, 'dmg'),
    stat('fr.mind', 'Clear Mind', 1, 5, 'crit'),
    change('fr.deep', 'Deep Freeze', 2, 'a2', 'nova', 'Rime burst freezes a second longer and Chills a boss two seconds longer.'),
    stat('fr.layers', 'Layers', 2, 4, 'hp'),
    change('fr.bite', 'Frostbite', 3, 'a1', 'blizzard', 'A foe that stays in Blizzard for 2 seconds freezes for a second (a boss is Chilled).', { choice: 'fr3' }),
    change('fr.brittle', 'Brittle', 3, 'a2', 'nova', 'Frozen and Chilled foes take 10% more from your whole party.', { choice: 'fr3' }),
    stat('fr.swift', 'Swift Casting', 3, 4, 'haste'),
    change('fr.shards', 'Shardburst', 4, 'a4', 'icicle', 'A Shatter bursts, hitting every foe near it for a quarter as much.'),
    stat('fr.deep2', 'Deep Cold', 4, 4, 'dmg'),
    change('fr.hail', 'Hailstorm', 5, 'a4', 'cap_hailstorm', 'Icicle throws a second shard, a third as strong, at another foe.', { capstone: true }),
    stat('fr.clarity', 'Clarity', 5, 3, 'crit'),
  ],
};

export const FIRE: SpecDef = {
  id: 'fire', cls: 'mage', name: 'Fire', icon: 'spec_fire', color: '#FF8A3D',
  pitch: 'Set them burning, then blow them up. No freezing: fire hits harder.',
  base: 'Your four buttons turn to fire. Your mage gear works on them the same, and its Comet bonuses on frozen or Chilled foes work on a foe with 3 or more Burn.',
  buttons: {
    a4: { name: 'Firebolt', icon: 'firebolt', desc: 'A bolt of fire, every beat. It adds a Burn to its foe (two on a crit), up to four.', combo: 'A crit makes the next Firebolt Flare: three times as hard, half again on a boss' },
    a3: { name: 'Comet', icon: 'comet_fire', desc: 'A 0.9s cast that drops a burning comet. On a foe with 3 or more Burn it Combusts: 1.75 times as hard (a fifth more on a boss), and its Burn spreads to the foes round it.', combo: 'Stack Burn first, then Combust it' },
    a1: { name: 'Firestorm', icon: 'firestorm', desc: 'Burning ground. It hits everything in it and adds a Burn every second.', combo: 'Light up a pack, then Comet the middle' },
    a2: { name: 'Ember burst', icon: 'emberburst', desc: 'Blast the foes close to you: it stops their casts, knocks them back and adds two Burn.', combo: 'Your interrupt. On a boss it adds Burn but doesn’t Chill' },
  },
  talents: [
    stat('fi.heat', 'Heat', 1, 5, 'dmg'),
    stat('fi.spark', 'Spark', 1, 5, 'crit'),
    change('fi.kindling', 'Kindling', 2, 'a4', 'firebolt', 'Burn stacks up to 6, not 4.'),
    stat('fi.warm', 'Warm Blood', 2, 4, 'hp'),
    change('fi.wildfire', 'Wildfire', 3, 'a1', 'firestorm', 'A foe that dies burning gives its Burn to every foe near it.', { choice: 'fi3' }),
    change('fi.searing', 'Searing', 3, 'a4', 'firebolt', 'Firebolt hits 20% harder on a foe with 4 or more Burn.', { choice: 'fi3' }),
    stat('fi.quick', 'Quick Flame', 3, 4, 'haste'),
    change('fi.afterburn', 'Afterburn', 4, 'a3', 'comet_fire', 'A Combust leaves the ground burning for 4 seconds.'),
    stat('fi.blaze', 'Blaze', 4, 4, 'dmg'),
    change('fi.shower', 'Comet Shower', 5, 'a3', 'cap_shower', 'Comet brings two small comets, each a quarter as strong, down on foes near it.', { capstone: true }),
    stat('fi.wild', 'Wildspark', 5, 3, 'crit'),
  ],
};
