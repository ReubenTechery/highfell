/// <reference types="node" />
/**
 * Talents: every hero gets your level's points; a hero picks one of its class's two specs (free to change, each
 * keeping its points) and spends them in that tree, row by row, one of each pair on rows 2 to 5 (row 5's are the
 * two capstones). Taking points back is free, except one a row below still needs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkContent } from '../src/content';
import { ROW_NEED, SPECS, SPEC_LIST, TALENT_STATS, TREE_POINTS, buttonFor, specsFor, treePoints } from '../src/content/talents';
import { AB } from '../src/content/roles';
import { TOMES, PAGES, xpForLevel } from '../src/content/xp';
import { freshProfile, migrate, type Hero, type Profile } from '../src/meta/profile';
import { newHero } from '../src/meta/gear';
import { addPoint, addProblem, canTakeBack, pickSpec, pointsAt, pointsOf, rankOf, resetSpec, rowOpen, spentIn, takeBack, talentLoadout, unspent } from '../src/meta/talents';

const T0 = Date.UTC(2026, 9, 17, 9);
const atLevel = (lv: number, cls = 'mage'): { p: Profile; h: Hero } => {
  const p = freshProfile(T0);
  const race = cls === 'warrior' ? 'dwarf' : cls === 'mage' ? 'elf' : 'human';
  // a class nobody can make yet (the ranger, until its art lands) is a hero switched to it
  const h = newHero(p, { name: 'Test Hero', race: race as 'elf', cls: cls as 'mage' }) ?? Object.assign(newHero(p, { name: 'Test Hero', race: 'elf', cls: 'mage' })!, { cls });
  p.xp = xpForLevel(lv);
  return { p, h };
};
/** spend points down a tree in order: every rank of each talent, the first of each pair */
const fill = (p: Profile, h: Hero, spec: string): number => {
  const s = SPECS[spec];
  let n = 0;
  for (let pass = 0; pass < 6; pass++) for (const t of s.talents) while (addPoint(p, h, spec, t.id)) n++;
  return n;
};

test('talents: two specs a class, a tree of 29 points each, in five rows', () => {
  assert.deepEqual(checkContent(), []);
  for (const cls of ['warrior', 'cleric', 'mage', 'rogue', 'ranger']) assert.equal(specsFor(cls).length, 2, cls);
  for (const s of SPEC_LIST) {
    assert.equal(treePoints(s), TREE_POINTS, s.id);
    assert.equal(s.talents.filter((t) => t.capstone && t.row === 5).length, 2, `${s.id} has two capstones to pick from, at the bottom`);
    assert.equal(s.talents.filter((t) => t.choice).length, 8, `${s.id} has a pair on each of rows 2 to 5`);
    for (const row of [2, 3, 4, 5]) assert.equal(new Set(s.talents.filter((t) => t.row === row && t.choice).map((t) => t.choice)).size, 1, `${s.id} row ${row}: one pair`);
  }
  assert.equal(pointsAt(1), 0);
  assert.equal(pointsAt(2), 1);
  assert.equal(pointsAt(30), TREE_POINTS, 'a full tree at level 30');
  assert.equal(pointsAt(99), TREE_POINTS);
});

test('talents: every picture a spec, talent, button or tome needs is drawn', () => {
  const icons = JSON.parse(fs.readFileSync('art/icons.json', 'utf8')) as Record<string, unknown>;
  const need = new Set<string>([PAGES.icon, ...TOMES.map((t) => t.icon), 'xp']);
  for (const s of SPEC_LIST) {
    need.add(s.icon);
    for (const t of s.talents) need.add(t.icon);
    for (const b of Object.values(s.buttons || {})) need.add(b!.icon);
  }
  const missing = [...need].filter((id) => !icons[id]);
  assert.deepEqual(missing, []);
});

test('talents: no spec, no points spent; every point waits for you to pick one', () => {
  const { p, h } = atLevel(6);
  assert.equal(pointsOf(p), 5);
  assert.equal(h.spec, null);
  assert.equal(unspent(p, h), 5, 'all of them, until a spec is picked');
  assert.deepEqual(talentLoadout(p, h), { spec: null, tal: [], ts: {} });
  assert.equal(pickSpec(h, 'shield'), false, 'not a mage’s');
  assert.equal(pickSpec(h, 'fire'), true);
  assert.equal(pickSpec(h, 'fire'), false, 'already');
  assert.equal(talentLoadout(p, h).spec, 'fire', 'Fire changes the buttons with nothing spent');
});

test('talents: rows open as points go in above them, and a point needs points left', () => {
  const { p, h } = atLevel(12);
  pickSpec(h, 'frost');
  const s = SPECS.frost;
  const deep = s.talents.find((t) => t.id === 'fr.deep')!;
  assert.match(addProblem(p, h, s, deep) || '', /Needs 5/);
  for (let i = 0; i < 5; i++) assert.ok(addPoint(p, h, 'frost', 'fr.cold'));
  assert.equal(addPoint(p, h, 'frost', 'fr.cold'), false, 'five is full');
  assert.ok(rowOpen(h, s, 2));
  assert.ok(addPoint(p, h, 'frost', 'fr.deep'));
  assert.equal(addPoint(p, h, 'frost', 'fr.deep'), false, 'one point');
  for (let i = 0; i < 4; i++) addPoint(p, h, 'frost', 'fr.layers');
  assert.equal(spentIn(h, s), 10);
  assert.ok(rowOpen(h, s, 3));
  assert.ok(addPoint(p, h, 'frost', 'fr.bite'), 'row 3 opens at 10');
  assert.equal(spentIn(h, s), 11);
  assert.equal(unspent(p, h), 0, 'level 12 is 11 points');
  assert.match(addProblem(p, h, s, s.talents.find((t) => t.id === 'fr.swift')!) || '', /No points/);
});

test('talents: of each row’s pair you can have one; taking one back is free, unless a row below needs it', () => {
  const { p, h } = atLevel(30, 'rogue');
  pickSpec(h, 'venom');
  const s = SPECS.venom;
  for (let i = 0; i < 5; i++) addPoint(p, h, 'venom', 've.edge');
  for (let i = 0; i < 5; i++) addPoint(p, h, 'venom', 've.eye');
  assert.ok(addPoint(p, h, 'venom', 've.deadly'));
  assert.match(addProblem(p, h, s, s.talents.find((t) => t.id === 've.bitter')!) || '', /other one/, 'row 2 is a pick too');
  assert.ok(addPoint(p, h, 'venom', 've.burst'), 'row 3 at 10 above: there are 11');
  assert.match(addProblem(p, h, s, s.talents.find((t) => t.id === 've.mark')!) || '', /other one/);
  assert.equal(addPoint(p, h, 'venom', 've.mark'), false);
  // swap the pick: take one back, put the other in
  assert.ok(takeBack(h, 'venom', 've.burst'));
  assert.ok(addPoint(p, h, 'venom', 've.mark'));
  // the rows above row 3 hold 11 and it needs 10: one can come out, a second can't while row 3 has a point
  assert.ok(takeBack(h, 'venom', 've.eye'));
  assert.equal(canTakeBack(h, s, 've.edge'), false);
  assert.equal(takeBack(h, 'venom', 've.deadly'), false);
  assert.ok(canTakeBack(h, s, 've.mark'), 'the lowest one can');
  assert.ok(takeBack(h, 'venom', 've.mark'));
  assert.ok(canTakeBack(h, s, 've.edge'), 'now it can');
  assert.equal(takeBack(h, 'venom', 've.lethal'), false, 'nothing in it');
});

test('talents: a full tree takes every point at level 30, a capstone too, and adds up for the run', () => {
  for (const spec of SPEC_LIST) {
    const { p, h } = atLevel(30, spec.cls);
    pickSpec(h, spec.id);
    assert.equal(fill(p, h, spec.id), TREE_POINTS, spec.id);
    assert.equal(unspent(p, h), 0);
    const cap = spec.talents.find((t) => t.capstone)!;
    assert.equal(rankOf(h, spec, cap.id), 1, `${spec.id} capstone`);
    const L = talentLoadout(p, h);
    assert.equal(L.spec, spec.id);
    assert.ok(L.tal.includes(cap.id));
    assert.equal(L.tal.length, 4, 'the talents that change a button: one of each pair on rows 2 to 5');
    const statPoints = spec.talents.filter((t) => t.stat).reduce((a, t) => a + t.ranks, 0);
    assert.equal(statPoints, TREE_POINTS - 4);
    assert.ok(Object.values(L.ts).every((v) => v! > 0 && v! < 0.5), `${spec.id} stats ${JSON.stringify(L.ts)}`);
  }
});

test('talents: each spec keeps its own points; switching back costs nothing; reset is free', () => {
  const { p, h } = atLevel(10, 'rogue');
  pickSpec(h, 'venom');
  for (let i = 0; i < 5; i++) addPoint(p, h, 'venom', 've.edge');
  pickSpec(h, 'blades');
  assert.equal(unspent(p, h), 9, 'Blades has its own, all unspent');
  for (let i = 0; i < 5; i++) addPoint(p, h, 'blades', 'bl.eye');
  pickSpec(h, 'venom');
  assert.equal(rankOf(h, SPECS.venom, 've.edge'), 5, 'Venom’s are as they were');
  assert.equal(unspent(p, h), 4);
  assert.ok(resetSpec(h, 'venom'));
  assert.equal(unspent(p, h), 9);
  assert.equal(resetSpec(h, 'venom'), false, 'nothing to reset');
  // the save keeps it all, and an unknown spec or talent from a newer build survives
  h.talents.future = { 'x.y': 2 };
  const q = migrate(JSON.parse(JSON.stringify(p)), T0);
  assert.deepEqual(q.roster[0].talents.blades, { 'bl.eye': 5 });
  assert.deepEqual(q.roster[0].talents.future, { 'x.y': 2 });
  assert.equal(q.roster[0].spec, 'venom');
});

test('talents: a hero with more points in than your level gives keeps its first ones, in tree order', () => {
  const { p, h } = atLevel(30, 'warrior');
  pickSpec(h, 'axe');
  fill(p, h, 'axe');
  p.xp = xpForLevel(8);
  const L = talentLoadout(p, h);
  const total = Math.round(((L.ts.dmg || 0) / TALENT_STATS.dmg.per) + ((L.ts.crit || 0) / TALENT_STATS.crit.per));
  assert.equal(total, 7, 'level 8: seven points, the top row first');
  assert.deepEqual(L.tal, []);
});

test('talents: Fire’s buttons have their own names and pictures; the rest keep theirs', () => {
  assert.equal(buttonFor(AB.dps.a4, 'fire', 'a4').name, 'Firebolt');
  assert.equal(buttonFor(AB.dps.a4, 'fire', 'a4').icon, 'firebolt');
  assert.equal(buttonFor(AB.dps.a4, 'fire', 'a4').cd, AB.dps.a4.cd, 'same cooldown');
  assert.equal(buttonFor(AB.dps.a2, 'fire', 'a2').name, 'Ember burst');
  assert.equal(buttonFor(AB.dps.a4, 'frost', 'a4').name, 'Icicle');
  assert.equal(buttonFor(AB.dps.a4, null, 'a4').icon, 'icicle');
  assert.ok(ROW_NEED[5] <= TREE_POINTS - 4);
});
