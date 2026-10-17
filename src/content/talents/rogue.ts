/** The rogue's two specs. Venom: one foe at a time, stacked poison and huge Shadowstrikes. Blades: every foe at
 *  once, your knives spin through the whole pack. Neither changes the buttons until points go in. Rows 2 to 5 are
 *  each a pick of one from two. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

export const VENOM: SpecDef = {
  id: 'venom', cls: 'rogue', name: 'Venom', icon: 'spec_venom', color: '#4E9A4A',
  pitch: 'One foe at a time: stacked poison and huge Shadowstrikes.',
  talents: [
    stat('ve.edge', 'Honed Edge', 1, 5, 'dmg'),
    stat('ve.eye', 'Cold Eye', 1, 5, 'crit'),
    change('ve.deadly', 'Deadly Venom', 2, 'a1', 'viper', 'Viper Venom stacks twice.', { choice: 've2' }),
    change('ve.bitter', 'Bitter Edge', 2, 'a1', 'viper', 'Viper Blades hits 25% harder on a poisoned foe.', { choice: 've2' }),
    stat('ve.wiry', 'Wiry', 2, 4, 'hp'),
    change('ve.burst', 'Toxic Burst', 3, 'a2', 'ambush', 'Shadowstrike on a poisoned foe also deals all of its venom at once.', { choice: 've3' }),
    change('ve.mark', 'Grave Mark', 3, 'a4', 'shadowstep', 'Shadowstep marks its target: it takes 10% more from you for 8 seconds.', { choice: 've3' }),
    stat('ve.quick', 'Quickness', 3, 4, 'haste'),
    change('ve.ruthless', 'Encore', 4, 'a2', 'ambush', 'A five-point Shadowstrike gives you a point back.', { choice: 've4' }),
    change('ve.cut', 'Lingering Cut', 4, 'a2', 'ambush', 'Shadowstrike on a poisoned foe leaves it bleeding for half the hit again over 4 seconds.', { choice: 've4' }),
    stat('ve.lethal', 'Lethal', 4, 4, 'dmg'),
    change('ve.fangs', 'Twin Fangs', 5, 'a2', 'cap_fangs', 'Every other five-point Shadowstrike strikes twice.', { capstone: true, choice: 've5' }),
    change('ve.last', 'Last Breath', 5, 'a2', 'cap_lastbreath', 'Shadowstrike finishes a foe under a third of its health and keeps your points; a boss that low takes double.', { capstone: true, choice: 've5' }),
    stat('ve.killer', 'Killer’s Eye', 5, 3, 'crit'),
  ],
};

export const BLADES: SpecDef = {
  id: 'blades', cls: 'rogue', name: 'Blades', icon: 'spec_blades', color: '#3E8F7E',
  pitch: 'Every foe at once: your knives spin through the whole pack.',
  talents: [
    stat('bl.steel', 'Sharp Steel', 1, 5, 'dmg'),
    stat('bl.eye', 'Quick Eye', 1, 5, 'crit'),
    change('bl.sweep', 'Sweeping Blades', 2, 'a1', 'viper', 'Viper Blades slashes every foe in front of you.', { choice: 'bl2' }),
    change('bl.twin', 'Twin Edge', 2, 'a1', 'viper', 'Viper Blades strikes twice, each 60% as hard.', { choice: 'bl2' }),
    stat('bl.nimble', 'Nimble', 2, 4, 'hp'),
    change('bl.whirl', 'Whirling Edges', 3, 'a3', 'flurry', 'Fan of Blades comes back in 4 seconds, not 6.', { choice: 'bl3' }),
    change('bl.spray', 'Venom Spray', 3, 'a3', 'flurry', 'Fan of Blades poisons everything it hits.', { choice: 'bl3' }),
    stat('bl.feet', 'Light Feet', 3, 4, 'haste'),
    change('bl.scatter', 'Scatter', 4, 'a2', 'ambush', 'Shadowstrike also hits every foe near its target, for half.', { choice: 'bl4' }),
    change('bl.ring', 'Second Ring', 4, 'a3', 'flurry', 'Fan of Blades throws a second ring a moment later.', { choice: 'bl4' }),
    stat('bl.keen', 'Keen Steel', 4, 4, 'dmg'),
    change('bl.storm', 'Knife Storm', 5, 'a4', 'cap_knifestorm', 'For 6 seconds after Shadowstep, Viper Blades and your swings hit every foe round you.', { capstone: true, choice: 'bl5' }),
    change('bl.wind', 'Cutting Wind', 5, 'a3', 'cap_cuttingwind', 'Foes your Fan of Blades hits take 15% more from you for 6 seconds.', { capstone: true, choice: 'bl5' }),
    stat('bl.steady', 'Steady Eye', 5, 3, 'crit'),
  ],
};
