/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng';
import { BARROW } from '../src/content/barrow';
import { gilded } from '../src/content/kits';
import { BRAG_ORDER, achBrag, bragsOf } from '../src/meta/brag';
import type { Drop, RunLoot } from '../src/meta/loot';
import { resolveRun } from '../src/meta/loot';
import { createHero, freshProfile, type Profile } from '../src/meta/profile';

const run = (o: Partial<RunLoot> = {}): RunLoot => ({ dungeon: 'barrow', role: 'tank', hero: 'h', drops: [], tell: 'normal', kc: { knight: 41, keeper: 42 }, marks: 1, clears: 42, time: 200, pb: 200, newPb: false, firstClear: false, ...o });
const drop = (id: string, o: Partial<Drop> = {}): Drop => ({ id, source: 'table', boss: 'keeper', rate: 1 / 35, kc: 42, isNew: true, dupe: false, marks: 0, ...o });
/** what the game does with a new drop: it's in the collection before the chest opens */
const owned = (p: Profile, ...ids: string[]): void => { for (const id of ids) p.collection[id] = { n: 1, kc: 1, at: 1 }; };
const kinds = (p: Profile, l: RunLoot, unlocked: string[] = []): string[] => bragsOf(p, l, unlocked).map((b) => b.kind);

test('brags: a plain clear has nothing to show off; a first clear is not a best time', () => {
  const p = freshProfile(1);
  const regular: Drop = { id: 'tank.helm.1', source: 'regular', role: 'tank', slot: 'helm', rar: 1, prevRar: 0, isNew: true, dupe: false, marks: 0 };
  const spare: Drop = { id: 'healer.chest.1', source: 'spare', role: 'healer', slot: 'chest', rar: 1, prevRar: 0, isNew: true, dupe: false, marks: 0 };
  assert.deepEqual(bragsOf(p, run({ drops: [regular, spare], firstClear: true }), []), []);
  owned(p, 'rimebone.helm');
  assert.deepEqual(bragsOf(p, run({ drops: [drop('rimebone.helm', { isNew: false, dupe: true, marks: 3 })] }), []), [], 'a duplicate set piece is not news');
});

test('brags: a new best time, with the clear it came on', () => {
  const [b] = bragsOf(freshProfile(1), run({ newPb: true, time: 167, clears: 42 }), []);
  assert.deepEqual(b, { kind: 'pb', dungeon: 'barrow', id: '', time: 167, clears: 42 });
});

test('brags: a new unique keeps its rate and kill count; a pet or a mount counts even as a duplicate', () => {
  const p = freshProfile(1);
  owned(p, 'rimebone.helm', 'pet.pint_gravekeeper', 'mount.gravehound');
  const [helm] = bragsOf(p, run({ drops: [drop('rimebone.helm', { kc: 42 })] }), []);
  assert.deepEqual(helm, { kind: 'unique', dungeon: 'barrow', id: 'rimebone.helm', rate: 1 / 35, kc: 42, boss: 'keeper' });
  const pet = drop('pet.pint_gravekeeper', { rate: 1 / 2500, kc: 412, isNew: false, dupe: true, marks: 3 });
  const hound = drop('mount.gravehound', { rate: 1 / 1000, kc: 412, isNew: false, dupe: true, marks: 3 });
  assert.deepEqual(kinds(p, run({ drops: [pet, hound] })), ['pet', 'unique']);
  // the mini boss's trophy and a boss weapon are uniques too
  assert.deepEqual(bragsOf(p, run({ drops: [drop('trophy.rattlebones_plume', { boss: 'knight', rate: 1 / 50, kc: 41 }), drop('gravekeeper.tank', { rate: 1 / 50 })] }), []).map((b) => b.id), ['trophy.rattlebones_plume', 'gravekeeper.tank']);
});

test('brags: a set is finished when the run brings its last piece', () => {
  const p = freshProfile(1);
  owned(p, 'barrowguard.helm');
  assert.deepEqual(kinds(p, run({ drops: [drop('barrowguard.chest')] })), ['unique'], 'two of three is not a set');
  owned(p, 'barrowguard.shoulders');
  const brags = bragsOf(p, run({ drops: [drop('barrowguard.chest', { kc: 120 })] }), []);
  assert.deepEqual(brags[0], { kind: 'set', dungeon: 'barrow', id: 'barrowguard', gilded: false, kc: 120, boss: 'keeper' });
  owned(p, 'barrowguard.chest');
  assert.deepEqual(kinds(p, run({ drops: [drop('barrowguard.chest')] })), ['set', 'unique'], 'a new drop is in the collection already when the chest opens');
  assert.deepEqual(kinds(p, run({ drops: [drop('barrowguard.chest', { isNew: false, dupe: true })] })), [], 'a set you had already is not news');
  // the boss weapon leans on the set's stand, but a set is its three pieces
  const q = freshProfile(1);
  owned(q, 'barrowguard.helm', 'barrowguard.shoulders');
  assert.ok(!kinds(q, run({ drops: [drop('gravekeeper.tank', { rate: 1 / 50 })] })).includes('set'));
});

test('brags: Heroic finishes a gilded set with kits, and its normal pieces count for the normal sets', () => {
  const p = freshProfile(1);
  owned(p, gilded('candlewake.helm'), gilded('candlewake.shoulders'), 'rimebone.helm', 'rimebone.shoulders');
  const kit = drop(gilded('candlewake.chest'), { rate: 1 / 20, kc: 12 });
  const piece = drop('rimebone.chest', { kc: 150 });
  const brags = bragsOf(p, run({ dungeon: 'barrow-heroic', drops: [piece, kit] }), []);
  const sets = brags.filter((b) => b.kind === 'set');
  assert.deepEqual(sets.map((b) => [b.id, b.gilded, b.kc, b.dungeon]), [['candlewake', true, 12, 'barrow-heroic'], ['rimebone', false, 150, 'barrow-heroic']]);
  assert.deepEqual(brags.filter((b) => b.kind === 'unique').map((b) => b.id), ['rimebone.chest', gilded('candlewake.chest')], 'the rarest first: a set piece is 1 in 35, a kit 1 in 20');
});

test('brags: best first, the pet, a whole log, a set, uniques (rarest first), a best time, then achievements', () => {
  assert.deepEqual(BRAG_ORDER, ['pet', 'log', 'set', 'unique', 'pb', 'ach']);
  const p = freshProfile(1);
  owned(p, 'shadeveil.helm', 'shadeveil.shoulders');
  const drops = [drop('trophy.rattlebones_plume', { boss: 'knight', rate: 1 / 50 }), drop('shadeveil.chest'), drop('mount.gravehound', { rate: 1 / 1000 }), drop('pet.pint_gravekeeper', { rate: 1 / 2500 })];
  const brags = bragsOf(p, run({ drops, newPb: true }), ['barrow.sprint', 'barrow.log']);
  assert.deepEqual(brags.map((b) => b.kind), ['pet', 'log', 'set', 'unique', 'unique', 'unique', 'pb', 'ach']);
  assert.deepEqual(brags.filter((b) => b.kind === 'unique').map((b) => b.id), ['mount.gravehound', 'trophy.rattlebones_plume', 'shadeveil.chest'], '1 in 1,000, then 1 in 50, then 1 in 35');
  assert.deepEqual(brags[1], { kind: 'log', dungeon: 'barrow', id: 'barrow.log' });
  assert.deepEqual(achBrag('vale.first'), { kind: 'ach', dungeon: 'garden', id: 'vale.first' }, 'an achievement outside a run says where it is from');
});

test('brags: a real run reads the same as the chest shows it', () => {
  const p = freshProfile(1);
  const h = createHero(p, { race: 'dwarf', cls: 'warrior', name: 'Brag' })!;
  const rng = makeRng(7);
  let news = 0;
  for (let i = 0; i < 60; i++) {
    const loot = resolveRun(p, BARROW, { hero: h, bosses: ['knight', 'keeper'], bossTimes: { knight: 40, keeper: 80 }, cleared: true, practice: false, time: 220 - i }, rng);
    const ids = bragsOf(p, loot, []).map((b) => b.id);
    for (const d of loot.drops) if (d.source === 'table' && d.isNew) { news++; assert.ok(ids.includes(d.id), `${d.id} is something new`); }
    assert.equal(ids.includes(''), i > 0, 'every faster clear after the first is a best time');
  }
  assert.ok(news > 0, 'sixty clears bring something new');
});
