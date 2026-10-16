/// <reference types="node" />
/**
 * The Warband opens later: one hero to start, bots in the other seats, and more heroes once every dungeon has
 * been cleared once. It stays open after that, and saves that already had more heroes keep them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENT_LIST } from '../src/content';
import { freshProfile, type Profile } from '../src/meta/profile';
import { newHero } from '../src/meta/gear';
import { seats } from '../src/meta/party';
import { doorTip } from '../src/meta/tips';
import { WARBAND_KEY, openWarband, warbandDungeons, warbandLeft, warbandOpen } from '../src/meta/warband';

const T0 = Date.UTC(2026, 9, 17, 2);
const withHero = (): Profile => { const p = freshProfile(T0); newHero(p, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' }); return p; };
const clear = (p: Profile, id: string) => { const r = p.dungeons[id] || { runs: 0, clears: 0, pb: null, marks: 0 }; p.dungeons[id] = { ...r, runs: r.runs + 1, clears: r.clears + 1 }; };

test('warband: a new player has one hero, the Warband shut, bots in the other seats and no Warband tip', () => {
  const p = withHero();
  assert.equal(warbandOpen(p), false);
  assert.deepEqual(warbandLeft(p).map((d) => d.id), warbandDungeons().map((d) => d.id), 'every dungeon still to clear');
  assert.ok(warbandDungeons().every((d) => !d.heroicOf), 'only the Normal dungeons count');
  assert.equal(newHero(p, { name: 'Brannoc Ashvale', race: 'dwarf', cls: 'warrior' }), null, 'no second hero yet');
  assert.equal(p.roster.length, 1);
  assert.ok(seats(p, false).filter((s) => s.role !== 'healer').every((s) => !s.hero && s.bot), 'bots take the other seats');
  assert.equal(doorTip(p, false), null, 'the Warband tip waits for the Warband');
});

test('warband: clearing every dungeon once opens it, says so once, and it stays open', () => {
  const p = withHero();
  const [first, ...rest] = warbandDungeons();
  clear(p, first.id);
  assert.equal(openWarband(p), rest.length === 0, 'one dungeon is not all of them');
  if (rest.length) {
    assert.equal(warbandOpen(p), false);
    assert.deepEqual(warbandLeft(p).map((d) => d.id), rest.map((d) => d.id));
    for (const d of rest) clear(p, d.id);
    assert.equal(openWarband(p), true, 'the last first clear opens it');
  }
  assert.equal(openWarband(p), false, 'said once');
  assert.equal(warbandOpen(p), true);
  assert.deepEqual(warbandLeft(p), []);
  assert.equal(doorTip(p, false), 'warband', 'now the door explains it');
  assert.ok(newHero(p, { name: 'Brannoc Ashvale', race: 'dwarf', cls: 'warrior' }), 'a second hero can be made');
  assert.equal(seats(p, false).find((s) => s.role === 'tank')?.hero?.name, 'Brannoc Ashvale', 'and takes the tank seat');
  // a dungeon added later doesn't shut it: the moment is remembered
  p.dungeons = {};
  assert.equal(warbandOpen(p), true);
  assert.equal(p.counters[WARBAND_KEY], 1);
});

test('warband: a save that already has more heroes, or has earned a new race, has it open (quietly)', () => {
  const p = withHero();
  p.counters[WARBAND_KEY] = 1;
  newHero(p, { name: 'Brannoc Ashvale', race: 'dwarf', cls: 'warrior' });
  delete p.counters[WARBAND_KEY];
  assert.equal(p.roster.length, 2);
  assert.equal(warbandOpen(p), true, 'two heroes: open');
  assert.equal(openWarband(p), false, 'no announcement for what they already had');
  assert.equal(p.counters[WARBAND_KEY], 1, 'but remembered');

  const q = withHero();
  const race = ACHIEVEMENT_LIST.find((a) => a.reward.race);
  if (race) {
    q.achievements[race.id] = { at: T0 };
    assert.equal(warbandOpen(q), true, 'a log’s new race can be made');
  }
});
