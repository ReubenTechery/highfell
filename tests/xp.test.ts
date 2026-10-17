/// <reference types="node" />
/**
 * XP and your level: every kill pays, the clear and the chest's pages and tomes pay more, a harder dungeon and
 * Heroic pay more again, and old saves are paid for the runs they had, once. Levels climb to 99.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUNGEONS } from '../src/content';
import { BARROW } from '../src/content/barrow';
import { CLEAR_XP, KILL_XP, MAX_LEVEL, PAGE_ROLLS, PAGE_XP, TOMES, killXp, levelNeed, levelOf, xpForLevel } from '../src/content/xp';
import { makeRng } from '../src/core/rng';
import { chestXp, gainXp, levelProgress, rollPages, xpMul } from '../src/meta/xp';
import { freshProfile, migrate, retroXp, PROFILE_VERSION } from '../src/meta/profile';
import { newHero } from '../src/meta/gear';
import { resolveRun } from '../src/meta/loot';
import { levelAchiever } from '../src/meta/achievements';

const T0 = Date.UTC(2026, 9, 17, 9);

test('xp: levels climb from 1 to 99, each a little more than the last', () => {
  assert.equal(levelOf(0), 1);
  assert.equal(levelOf(999), 1);
  assert.equal(levelOf(1000), 2, 'level 2 at 1,000');
  for (let l = 2; l < MAX_LEVEL; l++) {
    assert.equal(xpForLevel(l + 1) - xpForLevel(l), levelNeed(l));
    assert.ok(levelNeed(l) > levelNeed(l - 1), 'each level needs more than the last');
    assert.equal(levelOf(xpForLevel(l)), l);
    assert.equal(levelOf(xpForLevel(l + 1) - 1), l);
  }
  assert.equal(levelOf(1e12), MAX_LEVEL, 'and stops at 99');
  // the pace: about one level a run at first, the full tree (level 30) in about 90 Barrow runs
  const run = 2850;
  assert.ok(levelOf(run) >= 3, 'a first Barrow run is two levels');
  assert.ok(levelOf(10 * run) >= 9 && levelOf(10 * run) <= 12, `ten runs: level ${levelOf(10 * run)}`);
  assert.ok(xpForLevel(30) / run > 75 && xpForLevel(30) / run < 100, `level 30 in ${Math.round(xpForLevel(30) / run)} runs`);
  assert.ok(xpForLevel(99) / run > 1200, 'level 99 is the long climb');
  const pr = levelProgress(xpForLevel(5) + levelNeed(5) / 2);
  assert.deepEqual([pr.level, pr.into, pr.need], [5, levelNeed(5) / 2, levelNeed(5)]);
  assert.equal(levelProgress(1e12).k, 1);
});

test('xp: a kill pays by what it was; bombs pay nothing; the final boss most', () => {
  assert.equal(killXp({ kind: 'melee' }, false), KILL_XP.fodder);
  assert.equal(killXp({ kind: 'ranged' }, false), KILL_XP.ranged);
  assert.equal(killXp({ kind: 'caller' }, false), KILL_XP.job);
  assert.equal(killXp({ kind: 'mender' }, false), KILL_XP.job);
  assert.equal(killXp({ kind: 'brute', big: true }, false), KILL_XP.big);
  assert.equal(killXp({ kind: 'wisp', wisp: true }, false), KILL_XP.wisp);
  assert.equal(killXp({ kind: 'melee', thing: true }, false), 0);
  assert.equal(killXp({ boss: true, big: true }, false), KILL_XP.boss);
  assert.equal(killXp({ boss: true, big: true }, true), KILL_XP.final);
});

test('xp: Thimblebriar pays half again, and Heroic half again on top of its dungeon', () => {
  assert.equal(xpMul(BARROW), 1);
  assert.equal(xpMul(DUNGEONS.thimblebriar), 1.5);
  const hb = Object.values(DUNGEONS).find((d) => d.heroicOf === 'barrow')!;
  const ht = Object.values(DUNGEONS).find((d) => d.heroicOf === 'thimblebriar')!;
  assert.equal(xpMul(hb), 1.5);
  assert.equal(xpMul(ht), 2.25);
});

test('xp: gaining says the levels it took you through, and keeps your best level for the achievements', () => {
  const p = freshProfile(T0);
  const g = gainXp(p, xpForLevel(4) + 10);
  assert.deepEqual([g.from, g.to], [1, 4]);
  assert.equal(p.counters.level, 4);
  assert.deepEqual([gainXp(p, 5).from, gainXp(p, 0).to], [4, 4]);
  assert.equal(gainXp(p, -50).xp, 0, 'never takes any away');
  // level 30 earns Full Tree
  const h = newHero(p, { name: 'Ivy Larkspur', race: 'elf', cls: 'mage' })!;
  gainXp(p, xpForLevel(30));
  assert.deepEqual(levelAchiever(p, 'dps').check(), ['level.30']);
  assert.ok(h);
});

test('xp: every chest has 1 to 10 lore pages, at fixed chances that add up; tomes roll on their own', () => {
  assert.ok(Math.abs(PAGE_ROLLS.reduce((a, o) => a + o.chance, 0) - 1) < 1e-9);
  const rng = makeRng(7), seen: Record<number, number> = {};
  for (let i = 0; i < 20000; i++) { const n = rollPages(rng); seen[n] = (seen[n] || 0) + 1; }
  for (const o of PAGE_ROLLS) assert.ok(Math.abs(seen[o.n] / 20000 - o.chance) < 0.012, `${o.n} pages: ${seen[o.n] / 20000} vs ${o.chance}`);
  assert.ok(TOMES.every((t) => t.rate > 0 && t.rate < 1 && t.xp > 0));
  // a chest: the clear, the pages and any tomes, all added to your XP
  const p = freshProfile(T0);
  const c = chestXp(p, BARROW, makeRng(3));
  assert.equal(c.clear, CLEAR_XP);
  assert.equal(c.pagesXp, c.pages * PAGE_XP);
  assert.equal(c.total, c.clear + c.pagesXp + c.tomes.reduce((a, t) => a + t.xp, 0));
  assert.equal(p.xp, c.total);
  // tomes come at about their rates
  const q = freshProfile(T0), r = makeRng(11), got: Record<string, number> = {};
  for (let i = 0; i < 25000; i++) for (const t of chestXp(q, BARROW, r).tomes) got[t.id] = (got[t.id] || 0) + 1;
  for (const t of TOMES) assert.ok(Math.abs((got[t.id] || 0) / 25000 - t.rate) < t.rate * 0.35 + 0.0005, `${t.id}: ${got[t.id]} in 25,000`);
});

test('xp: a clear puts the chest’s XP in the loot as cards, the pages first', () => {
  const p = freshProfile(T0);
  const h = newHero(p, { name: 'Brannoc Ashvale', race: 'dwarf', cls: 'warrior' })!;
  const r = resolveRun(p, BARROW, { hero: h, bosses: ['knight', 'keeper'], bossTimes: { knight: 60, keeper: 90 }, cleared: true, practice: false, time: 230 }, makeRng(5));
  const xp = r.drops.filter((d) => d.source === 'xp');
  assert.equal(xp[0].id, 'xp.pages');
  assert.ok(xp.every((d) => (d.xp || 0) > 0));
  assert.ok(p.xp >= CLEAR_XP + (xp[0].xp || 0));
});

test('xp: an old save is paid for the clears and boss kills it had, once, and says how much', () => {
  const old = { v: 10, roster: [{ id: 'h1', name: 'Edda', race: 'human', cls: 'cleric', regular: {}, equip: {}, bag: {}, fresh: [] }],
    dungeons: { barrow: { runs: 40, clears: 30, pb: 200, marks: 30 }, thimblebriar: { runs: 5, clears: 4, pb: 300, marks: 4 } },
    bosses: { 'barrow.knight': { kc: 33, pb: 50, wipes: 0 }, 'barrow.keeper': { kc: 30, pb: 80, wipes: 0 }, 'thimblebriar.tinker': { kc: 4, pb: 90, wipes: 0 } } };
  const want = 30 * 1500 + 4 * 1500 * 1.5 + 33 * KILL_XP.boss + 30 * KILL_XP.final + 4 * KILL_XP.final * 1.5;
  assert.equal(retroXp(old), want);
  const p = migrate(JSON.parse(JSON.stringify(old)), T0);
  assert.equal(p.v, PROFILE_VERSION);
  assert.equal(p.xp, want);
  assert.equal(p.counters['xp.retro'], want, 'remembered for the welcome back');
  assert.ok(levelOf(p.xp) >= 15, `level ${levelOf(p.xp)} from 34 clears`);
  assert.deepEqual([p.roster[0].spec, p.roster[0].talents], [null, {}], 'no spec yet, nothing spent');
  // a save already on v11 keeps its XP; a fresh one starts at nothing
  assert.equal(migrate(JSON.parse(JSON.stringify(p)), T0).xp, want);
  assert.equal(freshProfile(T0).xp, 0);
  assert.equal(retroXp({}), 0);
});
