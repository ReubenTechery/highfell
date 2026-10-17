/** The cleric's two specs. Mercy: big heals, saves, and mates who hit harder for being looked after. Wrath:
 *  fight to heal, your Smites mend the party. Both heal: neither changes the buttons until points go in. Rows 2 to
 *  5 are each a pick of one from two. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

export const MERCY: SpecDef = {
  id: 'mercy', cls: 'cleric', name: 'Mercy', icon: 'spec_mercy', color: '#8A6BD0',
  pitch: 'Big heals when they count. Mates you look after hit harder, and a Miracle once a run.',
  talents: [
    stat('me.hands', 'Gentle Hands', 1, 5, 'heal'),
    stat('me.focus', 'Focus', 1, 5, 'crit'),
    change('me.saving', 'Saving Grace', 2, 'mend', 'mend', 'Mend heals half again as much on a mate under 35% health.', { choice: 'me2' }),
    change('me.heart', 'Heartening', 2, 'mend', 'mend', 'A mate you Mend hits 10% harder for 6 seconds.', { choice: 'me2' }),
    stat('me.hardy', 'Hardy', 2, 4, 'hp'),
    change('me.walk', 'Walking Prayer', 3, 'a1', 'circle', 'Your Prayer circle follows the mate it lands on.', { choice: 'me3' }),
    change('me.twin', 'Twin Ward', 3, 'a2', 'ward', 'Ward also shields your next most hurt mate, for half.', { choice: 'me3' }),
    stat('me.flow', 'Flow', 3, 4, 'haste'),
    change('me.overflow', 'Overflow', 4, 'mend', 'ward', 'Mend’s overhealing becomes a Ward on the same mate, up to 150.', { choice: 'me4' }),
    change('me.rally', 'Rally', 4, 'a2', 'ward', 'A mate under your Ward hits 15% harder while it holds.', { choice: 'me4' }),
    stat('me.warmth', 'Warmth', 4, 4, 'heal'),
    change('me.miracle', 'Miracle', 5, 'a3', 'cap_miracle', 'Once a run, Sunburst brings a fallen mate back with 40% health.', { capstone: true, choice: 'me5' }),
    change('me.dawn', 'Dawn', 5, 'a3', 'cap_dawn', 'Sunburst makes your whole party hit 25% harder for 8 seconds.', { capstone: true, choice: 'me5' }),
    stat('me.devotion', 'Devotion', 5, 3, 'heal'),
  ],
};

export const WRATH: SpecDef = {
  id: 'wrath', cls: 'cleric', name: 'Wrath', icon: 'spec_wrath', color: '#C8403F',
  pitch: 'Fight to heal. Your Smites mend the party.',
  talents: [
    stat('wr.fervour', 'Fervour', 1, 5, 'dmg'),
    stat('wr.light', 'Bright Light', 1, 5, 'heal'),
    change('wr.twin', 'Twin Light', 2, 'a4', 'smite', 'Smite heals your two most hurt mates, not one.', { choice: 'wr2' }),
    change('wr.twice', 'Twice Struck', 2, 'a4', 'smite', 'Every third Smite strikes twice.', { choice: 'wr2' }),
    stat('wr.eye', 'Sharp Eye', 2, 4, 'crit'),
    change('wr.burn', 'Burning Light', 3, 'a4', 'smite', 'Smite sets its target burning for 40 over 4 seconds.', { choice: 'wr3' }),
    change('wr.lance', 'Sunlance', 3, 'a4', 'smite', 'Smite goes on through its target into one more foe.', { choice: 'wr3' }),
    stat('wr.might', 'Holy Might', 3, 4, 'dmg'),
    change('wr.ground', 'Holy Ground', 4, 'a1', 'circle', 'Your Prayer circle burns foes in it for 18 every pulse.', { choice: 'wr4' }),
    change('wr.pillar', 'Sunpillar', 4, 'a3', 'sunburst', 'Sunburst calls a pillar of light on your target: 300 to it and 100 to the foes round it.', { choice: 'wr4' }),
    stat('wr.swift', 'Swift Prayers', 4, 4, 'haste'),
    change('wr.sunstrike', 'Sunstrike', 5, 'a4', 'cap_sunstrike', 'A Smite crit heals your whole party for what it dealt.', { capstone: true, choice: 'wr5' }),
    change('wr.flash', 'Flashpoint', 5, 'a4', 'cap_flashpoint', 'A Smite crit bursts, hitting every foe near its target for half as much.', { capstone: true, choice: 'wr5' }),
    stat('wr.eagle', 'Eagle Eye', 5, 3, 'crit'),
  ],
};
