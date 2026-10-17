/** The rogue's two specs. Venom: one foe at a time, stacked poison and huge Shadowstrikes. Blades: every foe at
 *  once, your knives spin through the whole pack. Neither changes the buttons until points go in. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

export const VENOM: SpecDef = {
  id: 'venom', cls: 'rogue', name: 'Venom', icon: 'spec_venom', color: '#4E9A4A',
  pitch: 'One foe at a time: stacked poison and huge Shadowstrikes.',
  talents: [
    stat('ve.edge', 'Honed Edge', 1, 5, 'dmg'),
    stat('ve.eye', 'Cold Eye', 1, 5, 'crit'),
    change('ve.deadly', 'Deadly Venom', 2, 'a1', 'viper', 'Viper Venom stacks twice.'),
    stat('ve.wiry', 'Wiry', 2, 4, 'hp'),
    change('ve.burst', 'Toxic Burst', 3, 'a2', 'ambush', 'Shadowstrike on a poisoned foe also deals all of its venom at once.', { choice: 've3' }),
    change('ve.mark', 'Death Mark', 3, 'a4', 'shadowstep', 'Shadowstep marks its target: it takes 10% more from you for 8 seconds.', { choice: 've3' }),
    stat('ve.quick', 'Quickness', 3, 4, 'haste'),
    change('ve.ruthless', 'Ruthless', 4, 'a2', 'ambush', 'A five-point Shadowstrike gives you a point back.'),
    stat('ve.lethal', 'Lethal', 4, 4, 'dmg'),
    change('ve.fangs', 'Twin Fangs', 5, 'a2', 'cap_fangs', 'Every other five-point Shadowstrike strikes twice.', { capstone: true }),
    stat('ve.killer', 'Killer’s Eye', 5, 3, 'crit'),
  ],
};

export const BLADES: SpecDef = {
  id: 'blades', cls: 'rogue', name: 'Blades', icon: 'spec_blades', color: '#3E8F7E',
  pitch: 'Every foe at once: your knives spin through the whole pack.',
  talents: [
    stat('bl.steel', 'Sharp Steel', 1, 5, 'dmg'),
    stat('bl.eye', 'Quick Eye', 1, 5, 'crit'),
    change('bl.sweep', 'Sweeping Blades', 2, 'a1', 'viper', 'Viper Blades slashes every foe in front of you.'),
    stat('bl.nimble', 'Nimble', 2, 4, 'hp'),
    change('bl.whirl', 'Whirling Edges', 3, 'a3', 'flurry', 'Fan of Blades comes back in 4 seconds, not 6.', { choice: 'bl3' }),
    change('bl.spray', 'Venom Spray', 3, 'a3', 'flurry', 'Fan of Blades poisons everything it hits.', { choice: 'bl3' }),
    stat('bl.feet', 'Light Feet', 3, 4, 'haste'),
    change('bl.scatter', 'Scatter', 4, 'a2', 'ambush', 'Shadowstrike also hits every foe near its target, for half.'),
    stat('bl.keen', 'Keen Steel', 4, 4, 'dmg'),
    change('bl.storm', 'Knife Storm', 5, 'a4', 'cap_knifestorm', 'For 4 seconds after Shadowstep, your swings hit every foe around you.', { capstone: true }),
    stat('bl.steady', 'Steady Eye', 5, 3, 'crit'),
  ],
};
