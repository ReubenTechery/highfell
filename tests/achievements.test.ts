/// <reference types="node" />
/**
 * Achievements and titles say plainly what you did, what you got and where it went: every achievement has
 * one exact sentence of how and a place, every title comes from one achievement, every reward is named with
 * where it went, and an achievement keeps the kill count it came at (from save v10).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, ACHIEVEMENT_LIST, HOW_MAX, TITLES, checkContent, placeName, titleSource } from '../src/content';
import { Achiever, bestClear, homeAchiever, killCount, placeOf, rewardsOf, titleRows, wearTitle } from '../src/meta/achievements';
import { newHero } from '../src/meta/gear';
import { freshProfile, migrate, PROFILE_VERSION } from '../src/meta/profile';
import type { RunSummary } from '../src/content/types';

const SUM: RunSummary = { dungeon: 'barrow', role: 'tank', practice: false, testGear: false, time: 200, deaths: 1, wipes: 0, handHits: 0, ringHits: 0, saves: 0, bombHits: 0, lifts: 0, bursts: 0, playerDeaths: 0, kicks: 0, perfectBlocks: 0 };

test('achievements: every one says what to do in one plain sentence, and where it is earned', () => {
  assert.deepEqual(checkContent(), []);
  for (const a of ACHIEVEMENT_LIST) {
    assert.ok(a.how.trim().length > 0 && a.how !== a.name, `${a.id} has a how of its own`);
    assert.ok(a.how.length <= HOW_MAX, `${a.id}'s how fits a toast`);
    assert.ok(!/[.!?]\s/.test(a.how.trim()) && /[.!?]$/.test(a.how.trim()), `${a.id}'s how is one sentence`);
    assert.ok(!/stroke/i.test(a.how + a.name), `${a.id} never says the word`);
    assert.ok(placeName(a.dungeon), `${a.id} is earned somewhere: ${a.dungeon}`);
  }
  // what only one seat can do says so, and is marked for that seat
  for (const id of ['barrow.wisps', 'barrow.chains', 'barrow.watch', 'thimblebriar.stickies', 'thimblebriar.watch']) {
    assert.equal(ACHIEVEMENTS[id].role, 'healer', id);
    assert.match(ACHIEVEMENTS[id].how, /^As the healer/, id);
  }
  for (const id of ['barrow.wall', 'barrow.jailbreak', 'thimblebriar.wall', 'thimblebriar.batback']) assert.match(ACHIEVEMENTS[id].how, /^As the tank/, id);
});

test('titles: every title comes from exactly one achievement, which says how to earn it', () => {
  for (const t of Object.values(TITLES)) {
    const from = ACHIEVEMENT_LIST.filter((a) => a.reward.title === t.id);
    assert.equal(from.length, 1, `${t.id} comes from one achievement`);
    assert.equal(titleSource(t.id), from[0]);
  }
});

test('titles: the list has every title, yours first, and a hidden one keeps its secret until it is yours', () => {
  const p = freshProfile();
  const rows = titleRows(p);
  // all of them but the retired one nobody can earn any more
  assert.equal(rows.length, Object.values(TITLES).filter((t) => !titleSource(t.id)!.retired).length);
  assert.ok(rows.every((r) => !r.have));
  assert.ok(rows.find((r) => r.id === 'title.braveish')!.secret, 'a hidden achievement’s title is a secret');
  assert.ok(!rows.find((r) => r.id === 'title.bonebreaker')!.secret);
  new Achiever(p, { dungeon: 'barrow', role: 'tank', practice: false, testGear: false }).event({ type: 'boss.killed', boss: 'keeper', time: 60, armorUp: false, onlyPlayerAlive: true, smashes: 0, smashPerfect: 0, playerIsTank: true });
  const after = titleRows(p);
  assert.equal(after[0].id, 'title.stubborn', 'what you have comes first');
  assert.ok(after[0].have && !after[0].secret, 'and a hidden one explains itself once it’s yours');
  // a retired achievement's title shows only for whoever has it
  p.titles.push('title.friend_bw');
  assert.ok(titleRows(p).some((r) => r.id === 'title.friend_bw' && r.have));
});

test('rewards: each one is named with where it went, the points last', () => {
  const p = freshProfile();
  for (const a of ACHIEVEMENT_LIST) {
    const rw = rewardsOf(p, a);
    assert.equal(rw[rw.length - 1].kind, 'points', `${a.id} ends with its points`);
    assert.equal(rw[rw.length - 1].name, `${a.points} points`);
    for (const r of rw.slice(0, -1)) assert.ok(r.name && r.where, `${a.id}: ${r.kind} has a name and a where`);
    if (a.reward.title) assert.ok(rw.some((r) => r.kind === 'title' && r.name === TITLES[a.reward.title!].text), `${a.id} names its title`);
  }
  // a trophy says where it is in the house once it's there
  const a = new Achiever(p, { dungeon: 'barrow', role: 'tank', practice: false, testGear: false });
  a.cleared(SUM);
  const key = rewardsOf(p, ACHIEVEMENTS['barrow.into']).find((r) => r.id === 'trophy.barrow_key')!;
  assert.match(key.where, /^In your house: mantel/);
  const log = rewardsOf(p, ACHIEVEMENTS['barrow.log']).map((r) => r.kind);
  assert.deepEqual(log, ['race', 'look', 'title', 'points'], 'the big one first');
});

test('kill count: an achievement keeps the kill count it came at; the garden’s have none', () => {
  const p = freshProfile();
  p.bosses['barrow.keeper'] = { kc: 12, pb: null, wipes: 0 };
  assert.equal(killCount(p, ACHIEVEMENTS['barrow.into']), 12);
  new Achiever(p, { dungeon: 'barrow', role: 'tank', practice: false, testGear: false }, () => 5).cleared(SUM);
  assert.deepEqual(p.achievements['barrow.into'], { at: 5, kc: 12 });
  p.counters['vale.harvests'] = 1;
  assert.deepEqual(homeAchiever(p, 'tank').check(), ['vale.first']);
  assert.equal(p.achievements['vale.first'].kc, undefined);
  const back = migrate(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(back.achievements['barrow.into'], { at: 5, kc: 12 }, 'it survives a save and load');
});

test('profile: a v9 save keeps every achievement and the day it came, with no kill count', () => {
  const v9 = { ...JSON.parse(JSON.stringify(freshProfile(1))), v: 9, achievements: { 'barrow.into': { at: 7 }, 'barrow.rattle': { at: 9 } }, titles: ['title.bonebreaker'] };
  const p = migrate(v9);
  assert.equal(p.v, PROFILE_VERSION);
  assert.equal(PROFILE_VERSION, 10);
  assert.deepEqual(p.achievements, { 'barrow.into': { at: 7 }, 'barrow.rattle': { at: 9 } });
  assert.deepEqual(p.titles, ['title.bonebreaker']);
});

test('sprints: a clear under the mark earns it, and the page shows your best clear against it', () => {
  const p = freshProfile();
  const a = new Achiever(p, { dungeon: 'barrow', role: 'tank', practice: false, testGear: false });
  assert.ok(!a.cleared({ ...SUM, time: 175 }).includes('barrow.sprint'));
  assert.deepEqual(bestClear(p, ACHIEVEMENTS['barrow.sprint']), { best: null, need: 170 });
  p.dungeons.barrow = { runs: 2, clears: 2, pb: 205, marks: 0 };
  p.dungeons['barrow-heroic'] = { runs: 1, clears: 1, pb: 188, marks: 0 };
  assert.deepEqual(bestClear(p, ACHIEVEMENTS['barrow.sprint']), { best: 188, need: 170 }, 'a Heroic clear counts too');
  assert.equal(bestClear(p, ACHIEVEMENTS['barrow.into']), null);
  assert.ok(new Achiever(p, { dungeon: 'barrow', role: 'tank', practice: false, testGear: false }).cleared({ ...SUM, time: 165 }).includes('barrow.sprint'));
});

test('the cauldron: brewing ten times earns Something Brewing right there, not at the next harvest', () => {
  const p = freshProfile();
  p.counters['vale.brews'] = 10;
  assert.ok(homeAchiever(p, 'healer').check().includes('vale.brewer'));
});

test('titles: only one you have earned goes on, and taking it off is always fine', () => {
  const p = freshProfile();
  const h = newHero(p, { name: 'Sorrel Mistvale', race: 'elf', cls: 'mage' })!;
  assert.equal(wearTitle(p, h, 'title.quick'), false);
  assert.equal(h.title, null);
  p.titles.push('title.quick');
  assert.equal(wearTitle(p, h, 'title.quick'), true);
  assert.equal(h.title, 'title.quick');
  assert.equal(wearTitle(p, h, null), true);
  assert.equal(h.title, null);
});

test('the page: a Heroic’s achievements go with its dungeon, and the garden’s are their own place', () => {
  assert.equal(placeOf(ACHIEVEMENTS['barrow-heroic.log']), 'barrow');
  assert.equal(placeOf(ACHIEVEMENTS['thimblebriar-heroic.log']), 'thimblebriar');
  assert.equal(placeOf(ACHIEVEMENTS['vale.brewer']), 'garden');
  assert.deepEqual([...new Set(ACHIEVEMENT_LIST.map(placeOf))], ['barrow', 'thimblebriar', 'garden']);
});
