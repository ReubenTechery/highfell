/** The mage's two specs. Frost is the mage as it was: freeze them, then shatter them. Fire turns the four buttons
 *  to fire the moment you pick it: foes burn instead of freezing, and a Comet on a burning foe Combusts. The engine
 *  still knows each button by its slot, so mage gear that makes a button better makes its fire one better too.
 *  Rows 2 to 5 are each a pick of one from two. */
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
    change('fr.deep', 'Hard Rime', 2, 'a4', 'icicle', 'Icicle hits a frozen or Chilled foe 15% harder.', { choice: 'fr2' }),
    change('fr.wide', 'Wide Winter', 2, 'a1', 'blizzard', 'Blizzard is a third wider and lasts a second longer.', { choice: 'fr2' }),
    stat('fr.layers', 'Layers', 2, 4, 'hp'),
    change('fr.bite', 'Numbing Cold', 3, 'a1', 'blizzard', 'A foe that stays in Blizzard for 2 seconds freezes for a second (a boss is Chilled).', { choice: 'fr3' }),
    change('fr.brittle', 'Brittle', 3, 'a2', 'nova', 'Frozen and Chilled foes take 10% more from your whole party.', { choice: 'fr3' }),
    stat('fr.swift', 'Swift Casting', 3, 4, 'haste'),
    change('fr.shards', 'Shardburst', 4, 'a4', 'icicle', 'A Shatter bursts, hitting every foe near it for a quarter as much.', { choice: 'fr4' }),
    change('fr.long', 'Long Winter', 4, 'a3', 'comet', 'A Comet into your Blizzard Shatters as if its foe were frozen (a boss as if Chilled).', { choice: 'fr4' }),
    stat('fr.deep2', 'Deep Cold', 4, 4, 'dmg'),
    change('fr.hail', 'Hailstorm', 5, 'a4', 'cap_hailstorm', 'Icicle throws a second shard, a third as strong, at another foe.', { capstone: true, choice: 'fr5' }),
    change('fr.icefall', 'Icefall', 5, 'a1', 'cap_icefall', 'Blizzard ends in a crash of ice: three of its hits at once, and everything in it freezes.', { capstone: true, choice: 'fr5' }),
    stat('fr.clarity', 'Clarity', 5, 3, 'crit'),
  ],
};

export const FIRE: SpecDef = {
  id: 'fire', cls: 'mage', name: 'Fire', icon: 'spec_fire', color: '#FF8A3D',
  pitch: 'Set them burning, then blow them up. No freezing: fire hits harder.',
  base: 'Your four buttons turn to fire. Your mage gear works on them the same, and its Comet bonuses on frozen or Chilled foes work on a foe with 3 or more Burn.',
  buttons: {
    a4: { name: 'Firebolt', icon: 'firebolt', desc: 'A bolt of fire, every beat. It adds a Burn to its foe (two on a crit), up to four.', combo: 'A crit makes the next Firebolt Flare: three times as hard, half again on a boss' },
    a3: { name: 'Comet', icon: 'comet_fire', desc: 'A 0.9s cast that drops a burning comet. On a foe with 3 or more Burn it Combusts: 1.8 times as hard (1.3 times on a boss), and its Burn spreads to the foes round it.', combo: 'Stack Burn first, then Combust it' },
    a1: { name: 'Firestorm', icon: 'firestorm', desc: 'Burning ground. It hits everything in it and adds a Burn every second.', combo: 'Light up a pack, then Comet the middle' },
    a2: { name: 'Ember burst', icon: 'emberburst', desc: 'Blast the foes close to you: it stops their casts, knocks them back and adds two Burn.', combo: 'Your interrupt. On a boss it adds Burn but doesn’t Chill' },
  },
  talents: [
    stat('fi.heat', 'Heat', 1, 5, 'dmg'),
    stat('fi.spark', 'Spark', 1, 5, 'crit'),
    change('fi.kindling', 'Stoked', 2, 'a4', 'firebolt', 'Burn stacks up to 6, not 4.', { choice: 'fi2' }),
    change('fi.flash', 'Flash Fire', 2, 'a4', 'firebolt', 'A Firebolt crit sets every foe near its target burning too.', { choice: 'fi2' }),
    stat('fi.warm', 'Warm Blood', 2, 4, 'hp'),
    change('fi.wildfire', 'Brushfire', 3, 'a1', 'firestorm', 'Firestorm adds a Burn every half second, not every second.', { choice: 'fi3' }),
    change('fi.searing', 'Searing', 3, 'a4', 'firebolt', 'Firebolt hits 20% harder on a foe with 4 or more Burn.', { choice: 'fi3' }),
    stat('fi.quick', 'Quick Flame', 3, 4, 'haste'),
    change('fi.afterburn', 'Afterburn', 4, 'a3', 'comet_fire', 'A Combust leaves the ground burning for 4 seconds.', { choice: 'fi4' }),
    change('fi.flashover', 'Flashover', 4, 'a2', 'emberburst', 'A Combust makes Ember burst ready again.', { choice: 'fi4' }),
    stat('fi.blaze', 'Blaze', 4, 4, 'dmg'),
    change('fi.shower', 'Comet Shower', 5, 'a3', 'cap_shower', 'Comet brings two small comets, each a quarter as strong, down on foes near it.', { capstone: true, choice: 'fi5' }),
    change('fi.pyre', 'Pyre', 5, 'a1', 'cap_pyre', 'Firestorm follows your target and burns 10% hotter every second, up to twice as hot.', { capstone: true, choice: 'fi5' }),
    stat('fi.wild', 'Wildspark', 5, 3, 'crit'),
  ],
};
