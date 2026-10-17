/** The ranger's two specs (the duo rework, docs/duo.md; the names are drafts). Longbow, for one big foe: marks that
 *  stack higher and bigger Longshots. Trapper, for packs: Snare bursts into Arrowfall, more traps, and Longshots
 *  through the pack. Rows 2 to 5 are each a pick of one from two. What each talent does in a fight is
 *  src/dungeon/ranger.js. */
import type { SpecDef } from '../types';
import { change, stat } from './make';

/** The ranger's pictures, by the names the art stream draws them under (docs/duo-agents.md). Until a tile is drawn
 *  its talents show one that is (nobody can make a ranger before its art lands); each line goes once it's drawn. */
const DRAWN: Record<string, string> = {
  spec_longbow: 'spec_frost', spec_trapper: 'spec_blades',
  quickshot: 'icicle', longshot: 'comet', pinshot: 'shadowstep', snare: 'nova', arrowfall: 'blizzard',
  cap_secondarrow: 'cap_hailstorm', cap_sittingduck: 'cap_finalword', cap_cloudburst: 'cap_icefall', cap_tripwire: 'cap_cuttingwind',
};
const pic = (id: string): string => DRAWN[id] ?? id;

export const LONGBOW: SpecDef = {
  id: 'longbow', cls: 'ranger', name: 'Longbow', icon: pic('spec_longbow'), color: '#5E8C3A',
  pitch: 'One big foe at a time: marks that stack higher and bigger Longshots.',
  talents: [
    stat('lb.string', 'Taut String', 1, 5, 'dmg'),
    stat('lb.sight', 'Keen Sight', 1, 5, 'crit'),
    change('lb.deep', 'Deep Marks', 2, 'a1', pic('quickshot'), 'Marks stack up to five, and each past three makes Longshot 25% harder.', { choice: 'lb2' }),
    change('lb.bodkin', 'Bodkin Points', 2, 'a2', pic('longshot'), 'Longshot hits 25% harder on a boss or a big foe.', { choice: 'lb2' }),
    stat('lb.hardy', 'Weathered', 2, 4, 'hp'),
    change('lb.pinned', 'Pinned Down', 3, 'a3', pic('pinshot'), 'Pin Shot leaves three marks on whatever it hits.', { choice: 'lb3' }),
    change('lb.nock', 'Quick Nock', 3, 'a1', pic('quickshot'), 'Every third Quick Shot leaves two marks.', { choice: 'lb3' }),
    stat('lb.calm', 'Calm Breath', 3, 4, 'haste'),
    change('lb.follow', 'Follow Through', 4, 'a2', pic('longshot'), 'A Longshot crit leaves its foe with three marks.', { choice: 'lb4' }),
    change('lb.quarry', 'Quarry', 4, 'a2', pic('longshot'), 'Longshot hits 30% harder on a foe under half its health.', { choice: 'lb4' }),
    stat('lb.draw', 'Heavy Draw', 4, 4, 'dmg'),
    change('lb.second', 'Second Arrow', 5, 'a2', pic('cap_secondarrow'), 'Every Longshot looses a second arrow a moment later, half as hard.', { capstone: true, choice: 'lb5' }),
    change('lb.duck', 'Sitting Duck', 5, 'a2', pic('cap_sittingduck'), 'Longshot always crits on a foe your mate set up.', { capstone: true, choice: 'lb5' }),
    stat('lb.clear', 'Clear Sight', 5, 3, 'crit'),
  ],
};

export const TRAPPER: SpecDef = {
  id: 'trapper', cls: 'ranger', name: 'Trapper', icon: pic('spec_trapper'), color: '#A0703A',
  pitch: 'Every foe at once: traps that burst into Arrowfall, and Longshots through the pack.',
  base: 'Snare bursts into Arrowfall when it springs: arrows rain on the spot for 3 seconds.',
  buttons: {
    a4: { name: 'Snare', icon: pic('arrowfall'), desc: 'Throw a trap that holds whatever walks in, then bursts into Arrowfall: arrows rain on the spot for 3 seconds.', combo: 'Lay it where your mate drags the pack' },
  },
  talents: [
    stat('tr.barbs', 'Barbed Heads', 1, 5, 'dmg'),
    stat('tr.eye', 'Wide Eye', 1, 5, 'crit'),
    change('tr.twin', 'Twin Traps', 2, 'a4', pic('snare'), 'Snare throws two traps, side by side.', { choice: 'tr2' }),
    change('tr.jaws', 'Wide Jaws', 2, 'a4', pic('snare'), 'Snare and its Arrowfall are half as wide again.', { choice: 'tr2' }),
    stat('tr.hide', 'Thick Hide', 2, 4, 'hp'),
    change('tr.fork', 'Forked Arrow', 3, 'a2', pic('longshot'), 'Longshot splits into three arrows that fan out through the pack.', { choice: 'tr3' }),
    change('tr.spread', 'Spreading Marks', 3, 'a1', pic('quickshot'), 'Quick Shot also marks the foe nearest its target.', { choice: 'tr3' }),
    stat('tr.nimble', 'Nimble Fingers', 3, 4, 'haste'),
    change('tr.downpour', 'Downpour', 4, 'a4', pic('arrowfall'), 'Arrowfall rains half as long again.', { choice: 'tr4' }),
    change('tr.bite', 'Biting Jaws', 4, 'a4', pic('snare'), 'Snare bites for 80 more when it springs and marks what it holds twice.', { choice: 'tr4' }),
    stat('tr.quiver', 'Heavy Quiver', 4, 4, 'dmg'),
    change('tr.cloud', 'Cloudburst', 5, 'a4', pic('cap_cloudburst'), 'Arrowfall’s arrows land a third more often, and every foe it rains on takes a mark.', { capstone: true, choice: 'tr5' }),
    change('tr.trip', 'Tripwire', 5, 'a2', pic('cap_tripwire'), 'A Longshot through three or more foes makes Snare ready again.', { capstone: true, choice: 'tr5' }),
    stat('tr.hands', 'Steady Hands', 5, 3, 'crit'),
  ],
};
