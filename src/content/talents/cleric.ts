/** The cleric's two specs. Mercy: big heals and a Miracle once a run. Wrath: fight to heal, your Smites mend the
 *  party. Both heal: neither changes the buttons until points go in. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

export const MERCY: SpecDef = {
  id: 'mercy', cls: 'cleric', name: 'Mercy', icon: 'spec_mercy', color: '#8A6BD0',
  pitch: 'Big heals when they count, and a Miracle once a run.',
  talents: [
    stat('me.hands', 'Gentle Hands', 1, 5, 'heal'),
    stat('me.focus', 'Focus', 1, 5, 'crit'),
    change('me.saving', 'Saving Grace', 2, 'mend', 'mend', 'Mend heals half again as much on a mate under 35% health.'),
    stat('me.hardy', 'Hardy', 2, 4, 'hp'),
    change('me.walk', 'Walking Prayer', 3, 'a1', 'circle', 'Your Prayer circle follows the mate it lands on.', { choice: 'me3' }),
    change('me.twin', 'Twin Ward', 3, 'a2', 'ward', 'Ward also shields your next most hurt mate, for half.', { choice: 'me3' }),
    stat('me.flow', 'Flow', 3, 4, 'haste'),
    change('me.overflow', 'Overflow', 4, 'mend', 'ward', 'Mend’s overhealing becomes a Ward on the same mate, up to 150.'),
    stat('me.warmth', 'Warmth', 4, 4, 'heal'),
    change('me.miracle', 'Miracle', 5, 'a3', 'cap_miracle', 'Once a run, Sunburst brings a fallen mate back with 40% health.', { capstone: true }),
    stat('me.devotion', 'Devotion', 5, 3, 'heal'),
  ],
};

export const WRATH: SpecDef = {
  id: 'wrath', cls: 'cleric', name: 'Wrath', icon: 'spec_wrath', color: '#C8403F',
  pitch: 'Fight to heal. Your Smites mend the party.',
  talents: [
    stat('wr.fervour', 'Fervour', 1, 5, 'dmg'),
    stat('wr.light', 'Bright Light', 1, 5, 'heal'),
    change('wr.twin', 'Twin Light', 2, 'a4', 'smite', 'Smite heals your two most hurt mates, not one.'),
    stat('wr.eye', 'Sharp Eye', 2, 4, 'crit'),
    change('wr.burn', 'Burning Light', 3, 'a4', 'smite', 'Smite sets its target burning for 40 over 4 seconds.', { choice: 'wr3' }),
    change('wr.lance', 'Sunlance', 3, 'a4', 'smite', 'Smite goes on through its target into one more foe.', { choice: 'wr3' }),
    stat('wr.might', 'Holy Might', 3, 4, 'dmg'),
    change('wr.ground', 'Holy Ground', 4, 'a1', 'circle', 'Your Prayer circle burns foes in it for 18 every pulse.'),
    stat('wr.swift', 'Swift Prayers', 4, 4, 'haste'),
    change('wr.sunstrike', 'Sunstrike', 5, 'a4', 'cap_sunstrike', 'A Smite crit heals your whole party for what it dealt.', { capstone: true }),
    stat('wr.eagle', 'Eagle Eye', 5, 3, 'crit'),
  ],
};
