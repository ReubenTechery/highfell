/** The warrior's two specs, both damage (the duo rework, docs/duo.md; the names are drafts). Sword is the boss spec:
 *  one-handed with the shield, every Cleave that lands speeds his swings up, and a perfect block sets up his
 *  biggest hit. Greataxe is the pack spec: the shield goes on his back, Cleave sweeps wide, a Crush sweeps all the
 *  way round, and the shield button is a Parry. Picking either changes how he swings before any points go in (its
 *  `base`, src/dungeon/buttons.js). The code still calls them 'shield' and 'axe', so a warrior keeps the spec it
 *  picked; every talent is new, so the points spent in the old trees come back (RETIRED_TALENTS in ./index).
 *  Rows 2 to 5 are each a pick of one from two. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

export const SWORD: SpecDef = {
  id: 'shield', cls: 'warrior', name: 'Sword', icon: 'spec_shield', color: '#4F6FA8',
  pitch: 'One big foe at a time. Every Cleave speeds your swings up, and a perfect block sets up your biggest hit.',
  base: 'Sword and shield. Cleave hits the foe it’s aimed at half again as hard, your swings hit harder, and every Cleave that lands makes them 15% faster for 4 seconds, up to five times.',
  buttons: {
    a1: { name: 'Cleave', icon: 'cleave', desc: 'A sword cut at the foe in front of you, every beat: it hits that one half again as hard, and the ones beside it for less. Primed, it Crushes for 1.6×.', combo: 'Every Cleave that lands makes your swings faster, up to five times' },
  },
  talents: [
    stat('sw.blade', 'Keen Blade', 1, 5, 'dmg'),
    stat('sw.eye', 'Duelist’s Eye', 1, 5, 'crit'),
    change('sw.rim', 'Rim Strike', 2, 'a1', 'cleave', 'Every third Cleave bashes with the rim: it stuns what it hits for a second.', { choice: 'sw2' }),
    change('sw.spikes', 'Spiked Shield', 2, 'a4', 'shield', 'Foes that hit you take 50 back, 150 if you blocked it.', { choice: 'sw2' }),
    stat('sw.hardy', 'Hardy', 2, 4, 'hp'),
    change('sw.breach', 'Breach', 3, 'a2', 'charge', 'Charge Exposes the foes it hits for 2 seconds.', { choice: 'sw3' }),
    change('sw.swift', 'Swift Steel', 3, 'a1', 'cleave', 'Your swings speed up to eight times, not five.', { choice: 'sw3' }),
    stat('sw.heft', 'Heft', 3, 4, 'dmg'),
    change('sw.fury', 'Rising Fury', 4, 'a1', 'cleave', 'Each Crush makes your hits 3% harder for 8 seconds, up to five times.', { choice: 'sw4' }),
    change('sw.wall', 'Iron Wall', 4, 'a4', 'shield', 'While your shield is up, your mate near you takes 20% less damage.', { choice: 'sw4' }),
    stat('sw.tempo', 'Battle Tempo', 4, 4, 'haste'),
    change('sw.payback', 'Payback', 5, 'a1', 'cap_payback', 'After a perfect block, your next Cleave hits three times as hard and stuns.', { capstone: true, choice: 'sw5' }),
    change('sw.final', 'Final Word', 5, 'a1', 'cap_finalword', 'A Crush finishes a foe under a fifth of its health; a boss that low takes it twice as hard.', { capstone: true, choice: 'sw5' }),
    stat('sw.killer', 'Killer Instinct', 5, 3, 'crit'),
  ],
};

export const GREATAXE: SpecDef = {
  id: 'axe', cls: 'warrior', name: 'Greataxe', icon: 'spec_axe', color: '#E07A2E',
  pitch: 'Every foe at once. Wide sweeps, whirlwinds and Crushes all round you.',
  base: 'A two-handed axe, the shield on your back. Cleave sweeps wider and further, a Crush sweeps all the way round you, Slam’s whirlwind is bigger, and your shield button is a Parry.',
  buttons: {
    a1: { name: 'Cleave', icon: 'cleave', desc: 'A wide two-handed sweep through everything in front of you, every beat. Primed, it Crushes for 1.6× all the way round you.', combo: 'The Cleave after a Charge, a Slam, a perfect parry or a Cleave crit Crushes' },
    a4: { name: 'Parry', icon: 'shield', desc: 'Hold to parry from the front for up to a second; let go to raise it again. Parry right before a big hit and you hit back at every foe round you.', combo: 'A perfect parry primes Crush and opens a boss up for you both' },
  },
  talents: [
    stat('ga.edge', 'Sharp Edge', 1, 5, 'dmg'),
    stat('ga.eye', 'Keen Eye', 1, 5, 'crit'),
    change('ga.savage', 'Savage Swing', 2, 'a1', 'cleave', 'Cleave hits 15% harder on a foe under half its health.', { choice: 'ga2' }),
    change('ga.hungry', 'Hungry Axe', 2, 'a1', 'cleave', 'A Crush heals you for a fifth of what it deals.', { choice: 'ga2' }),
    stat('ga.brawn', 'Brawn', 2, 4, 'hp'),
    change('ga.spin', 'Spinning Axe', 3, 'a3', 'slam', 'Slam’s whirlwind hits twice as hard.', { choice: 'ga3' }),
    change('ga.quick', 'Quick Charge', 3, 'a2', 'charge', 'Charge comes back in 6 seconds, not 8.', { choice: 'ga3' }),
    stat('ga.rhythm', 'Battle Rhythm', 3, 4, 'haste'),
    change('ga.headlong', 'Headlong', 4, 'a2', 'charge', 'Charge primes two Crushes, not one.', { choice: 'ga4' }),
    change('ga.bulwark', 'Wide Pull', 4, 'a3', 'slam', 'Slam reaches half as far again, and your next Cleave hits 8% harder for each foe it pulled.', { choice: 'ga4' }),
    stat('ga.heavy', 'Heavy Hands', 4, 4, 'dmg'),
    change('ga.storm', 'Axe Storm', 5, 'a1', 'cap_axestorm', 'Every Cleave sweeps all the way round you, and a Crush hits 15% harder.', { capstone: true, choice: 'ga5' }),
    change('ga.unbowed', 'Unbowed', 5, 'a3', 'cap_unbowed', 'With three or more foes on you, Slam comes back twice as fast and hits twice as hard, whirlwind and all.', { capstone: true, choice: 'ga5' }),
    stat('ga.killer', 'Killer Instinct', 5, 3, 'crit'),
  ],
};
