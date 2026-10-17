/// <reference types="node" />
/**
 * Sets as the player sees them (src/meta/sets.ts): which sets a class wears, in the order you meet the dungeons;
 * a set's pieces found and worn; each bonus On, Put them on (found but not all on) or how many more, and what
 * putting a picked piece on would do to it; which set a dungeon's door shows (its Heroic door the same one); and
 * which set the armoury shows off.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, SETS } from '../src/content';
import { gearId } from '../src/content/gear';
import { equip, newHero } from '../src/meta/gear';
import { freshProfile, type Hero, type Profile } from '../src/meta/profile';
import { chaseSet, dungeonSet, setState, setsFor } from '../src/meta/sets';

const T0 = Date.UTC(2026, 9, 17, 2);
/** a fresh save with one hero of a class */
function withHero(race: 'dwarf' | 'human' | 'elf', cls: 'warrior' | 'cleric' | 'mage' | 'rogue'): { p: Profile; h: Hero } {
  const p = freshProfile(T0), h = newHero(p, { name: 'Brask Ironhew', race, cls })!;
  return { p, h };
}
const find = (p: Profile, ...ids: string[]): void => { for (const id of ids) p.collection[id] = { n: 1, kc: 12, at: T0 }; };
const tags = (p: Profile, h: Hero | null, set: string, o?: Parameters<typeof setState>[3]) => setState(p, h, set, o)!.bonuses.map((b) => [b.state, b.more, b.change || '']);

test('sets: each class wears one set per dungeon, in the order you meet the dungeons', () => {
  assert.deepEqual(setsFor(withHero('dwarf', 'warrior').h).map((s) => s.id), ['barrowguard', 'clockguard']);
  assert.deepEqual(setsFor(withHero('human', 'cleric').h).map((s) => s.id), ['candlewake', 'sporebloom']);
  assert.deepEqual(setsFor(withHero('elf', 'mage').h).map((s) => s.id), ['rimebone', 'arcspark']);
  assert.deepEqual(setsFor(withHero('human', 'rogue').h).map((s) => s.id), ['shadeveil', 'gearshade'], 'the rogue wears its own, never the mage\'s');
  for (const s of Object.values(SETS)) assert.equal(s.pieces.length, 3, `${s.id} is a set of 3`);
});

test('sets: a set\'s pieces found and worn, and each bonus On, Put them on or how many more', () => {
  const { p, h } = withHero('dwarf', 'warrior');
  let st = setState(p, h, 'barrowguard')!;
  assert.deepEqual([st.have, st.worn, st.done], [0, 0, false]);
  assert.deepEqual(st.pieces.map((x) => x.slot), ['helm', 'shoulders', 'chest']);
  assert.deepEqual(tags(p, h, 'barrowguard'), [['off', 2, ''], ['off', 3, '']], 'nothing yet: 2 more, 3 more');

  // two found, one on: Wear 2 is yours to put on, Wear all 3 needs one more
  find(p, 'barrowguard.helm', 'barrowguard.chest');
  assert.ok(equip(p, h, 'helm', 'barrowguard.helm'));
  st = setState(p, h, 'barrowguard')!;
  assert.deepEqual([st.have, st.worn], [2, 1]);
  assert.deepEqual(st.pieces.map((x) => [x.have, x.worn]), [[true, true], [false, false], [true, false]]);
  assert.deepEqual(tags(p, h, 'barrowguard'), [['ready', 0, ''], ['off', 1, '']]);

  // both on: Wear 2 is on
  assert.ok(equip(p, h, 'chest', 'barrowguard.chest'));
  assert.deepEqual(tags(p, h, 'barrowguard'), [['on', 0, ''], ['off', 1, '']]);

  // all three on: both on, and the set is done
  find(p, 'barrowguard.shoulders');
  assert.ok(equip(p, h, 'shoulders', 'barrowguard.shoulders'));
  st = setState(p, h, 'barrowguard')!;
  assert.deepEqual([st.have, st.worn, st.done], [3, 3, true]);
  assert.deepEqual(tags(p, h, 'barrowguard'), [['on', 0, ''], ['on', 0, '']]);

  // for nobody (a set no hero of yours wears), nothing is on
  assert.equal(setState(p, null, 'barrowguard')!.worn, 0);
  assert.equal(setState(p, h, 'nope'), null);
});

test('sets: a chest\'s new piece counts before the save has it (its preview adds nothing)', () => {
  const { p, h } = withHero('dwarf', 'warrior');
  const st = setState(p, h, 'barrowguard', { plus: ['barrowguard.helm'] })!;
  assert.equal(st.have, 1);
  assert.deepEqual(st.pieces.map((x) => x.have), [true, false, false]);
  assert.equal(p.collection['barrowguard.helm'], undefined, 'the save is untouched');
});

test('sets: the armoury says what putting the picked piece on would turn on or off', () => {
  const { p, h } = withHero('dwarf', 'warrior');
  find(p, 'barrowguard.helm', 'barrowguard.chest', 'clockguard.helm');
  assert.ok(equip(p, h, 'helm', 'barrowguard.helm'));
  // the plate makes it 2 of 3: Wear 2 turns on
  assert.deepEqual(tags(p, h, 'barrowguard', { trying: ITEMS['barrowguard.chest'] }), [['ready', 0, 'turnon'], ['off', 1, '']]);
  // the one already worn changes nothing
  assert.deepEqual(tags(p, h, 'barrowguard', { trying: ITEMS['barrowguard.helm'] }), [['ready', 0, ''], ['off', 1, '']]);
  // with both on, a regular helm (or another set's) breaks it: Wear 2 turns off
  assert.ok(equip(p, h, 'chest', 'barrowguard.chest'));
  assert.deepEqual(tags(p, h, 'barrowguard', { trying: ITEMS[gearId('tank', 'helm', 2)] }), [['on', 0, 'turnoff'], ['off', 1, '']]);
  assert.deepEqual(tags(p, h, 'barrowguard', { trying: ITEMS['clockguard.helm'] }), [['on', 0, 'turnoff'], ['off', 1, '']]);
  // and a piece for another slot of another set leaves this one alone
  assert.deepEqual(tags(p, h, 'clockguard', { trying: ITEMS[gearId('tank', 'chest', 2)] }), [['off', 1, ''], ['off', 2, '']]);
});

test('sets: a 3-piece bonus still being made says Later and never turns on', () => {
  const s = SETS.barrowguard, was = s.bonus3.ready;
  s.bonus3.ready = false;
  try {
    const { p, h } = withHero('dwarf', 'warrior');
    find(p, 'barrowguard.helm', 'barrowguard.shoulders', 'barrowguard.chest');
    equip(p, h, 'helm', 'barrowguard.helm'); equip(p, h, 'shoulders', 'barrowguard.shoulders');
    const st = setState(p, h, 'barrowguard', { trying: ITEMS['barrowguard.chest'] })!;
    assert.equal(st.bonuses[1].later, true);
    assert.equal(st.bonuses[1].change, undefined);
    assert.equal(st.bonuses[0].later, undefined);
  } finally { s.bonus3.ready = was; }
});

test('sets: the door shows the set its dungeon drops for your class, and its Heroic door the same one', () => {
  const tank = withHero('dwarf', 'warrior').h, rogue = withHero('human', 'rogue').h, mage = withHero('elf', 'mage').h;
  assert.equal(dungeonSet(tank, 'barrow')?.id, 'barrowguard');
  assert.equal(dungeonSet(tank, 'barrow-heroic')?.id, 'barrowguard', 'Heroic drops the Normal loot, so the same set');
  assert.equal(dungeonSet(tank, 'thimblebriar')?.id, 'clockguard');
  assert.equal(dungeonSet(tank, 'thimblebriar-heroic')?.id, 'clockguard');
  assert.equal(dungeonSet(rogue, 'barrow')?.id, 'shadeveil');
  assert.equal(dungeonSet(mage, 'barrow')?.id, 'rimebone');
  assert.equal(dungeonSet(tank, 'moonmere'), undefined, 'a dungeon still to come has none yet');
});

test('sets: the armoury shows off the set you wear most of, or else the one you have most of, or else the first', () => {
  const { p, h } = withHero('dwarf', 'warrior');
  assert.equal(chaseSet(p, h), 'barrowguard', 'nothing yet: the first dungeon\'s');
  find(p, 'clockguard.helm', 'clockguard.chest');
  assert.equal(chaseSet(p, h), 'clockguard', 'the one you have most of');
  find(p, 'barrowguard.helm');
  assert.ok(equip(p, h, 'helm', 'barrowguard.helm'));
  assert.equal(chaseSet(p, h), 'barrowguard', 'the one you wear beats the one you have');
});
