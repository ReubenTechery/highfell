/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng';
import { COLLECTIBLES, DUNGEONS, checkContent } from '../src/content';
import { BEDS, FIRST_HARVEST_GIFT, GARDEN_TABLE, GROW_CLEARS, PLANTS, RECIPES, SHIMMER } from '../src/content/vale';
import { finishSeedTour, freshProfile, migrate, needsSeedTour, PROFILE_VERSION } from '../src/meta/profile';
import { newHero } from '../src/meta/gear';
import { Achiever } from '../src/meta/achievements';
import { resolveRun } from '../src/meta/loot';
import { pourFor } from '../src/meta/party';
import {
  BOTTLE_XP, CUT_XP, HARVEST_XP, LAP_XP, SHIMMER_XP, bedPhase, bedToOpen, beginHarvest, brew, broughtBrew, canBrew, clearsLeft, cutXp, endHarvest,
  finishBrew, growBeds, lapXp, plant, rankOf, readyBeds, rollSeeds, skillRank, spendBottle, startBrew,
} from '../src/meta/vale';
import { simRun } from '../src/sim/run';
import { newGame } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtHero, hurtMob } from '../src/dungeon/entities.js';
import { doDodge } from '../src/dungeon/heroes.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { ROLES } from '../src/content/roles';
import type { Profile } from '../src/meta/profile';

const T0 = Date.UTC(2026, 9, 14, 2);
const BARROW = DUNGEONS.barrow, HEROIC = DUNGEONS['barrow-heroic'];
/** a bed that has finished growing */
const readyBed = (p: Profile, bed = 0, seed = 'glowcap', shimmer = false) => { p.vale.beds[bed] = { seed, grown: GROW_CLEARS, shimmer }; };

test('garden: content ids exist, a fresh save has empty beds and no seed yet, the save keeps its shape', () => {
  assert.deepEqual(checkContent(), []);
  const p = freshProfile(T0);
  assert.equal(p.vale.beds.length, BEDS);
  assert.ok(p.vale.beds.every((b) => b.seed === null));
  assert.deepEqual(p.vale.seeds, {}, 'the first seed comes from the Gravekeeper');
  const back = migrate(JSON.parse(JSON.stringify({ ...p, vale: { ...p.vale, satchel: { moonpetal: 3, bad: -2 }, lore: ['bw.under', 'bw.under'], beds: [{ seed: 'glowcap', grown: 2, shimmer: true }, 'junk'] } })));
  assert.deepEqual(back.vale.satchel, { moonpetal: 3 }, 'negative counts are dropped');
  assert.deepEqual(back.vale.lore, ['bw.under']);
  assert.deepEqual(back.vale.beds[0], { seed: 'glowcap', grown: 2, shimmer: true });
  assert.equal(back.vale.beds.length, BEDS, 'always every bed');
  assert.equal(back.vale.beds[1].seed, null);
});

test('garden: a v7 save keeps everything from the Vale and gets empty beds and a seed', () => {
  const v7 = {
    v: 7, rev: 4, roster: [], warband: {}, counters: { 'vale.harvests': 12, 'vale.errands': 4 },
    vale: { satchel: { glowcap: 7, dew: 1 }, shelf: { tonic: 2 }, xp: { gather: 300, brew: 90 }, places: { bramblewick: { nodes: { glowcap: { n: 2, day: 5, shimmer: true } }, errands: { n: 1, day: 5, next: 3 } } }, lore: ['bw.under', 'bw.half'], drink: 'tonic', rides: 9 },
  };
  const p = migrate(v7);
  assert.equal(p.v, PROFILE_VERSION);
  assert.deepEqual(p.vale.satchel, { glowcap: 7, dew: 1 });
  assert.deepEqual(p.vale.shelf, { tonic: 2 });
  assert.deepEqual(p.vale.xp, { gather: 300, brew: 90 });
  assert.equal(p.vale.places.bramblewick.errands.next, 3, 'where you rode out to is kept');
  assert.deepEqual(p.vale.lore, ['bw.under', 'bw.half']);
  assert.equal(p.vale.drink, 'tonic');
  assert.equal(p.vale.rides, 9);
  assert.equal(p.counters['vale.harvests'], 12, 'harvest counts carry on');
  assert.deepEqual(p.vale.seeds, { glowcap: 1 });
  assert.equal(p.vale.beds.length, BEDS);
  assert.ok(p.vale.beds.every((b) => b.seed === null));
});

test('garden: the Barrow drops only Glowcap seeds, 1 in 5 (Heroic 1 in 3), each line on its own, never in practice', () => {
  assert.deepEqual(BARROW.seeds, [{ boss: 'keeper', seed: 'glowcap', rate: 1 / 5 }]);
  assert.deepEqual(HEROIC.seeds, [{ boss: 'keeper', seed: 'glowcap', rate: 1 / 3 }]);
  const p = freshProfile(T0);
  p.vale.seeds = {};
  assert.deepEqual(rollSeeds(p, BARROW, 'knight', () => 0), {}, 'Sir Rattlebones drops none');
  assert.deepEqual(rollSeeds(p, BARROW, 'keeper', () => 0), { glowcap: 1 });
  assert.deepEqual(rollSeeds(p, BARROW, 'keeper', () => 0.99), {});
  let got = 0;
  const rng = makeRng(3);
  for (let i = 0; i < 6000; i++) got += rollSeeds(p, BARROW, 'keeper', rng).glowcap || 0;
  assert.ok(Math.abs(got / 6000 - 0.2) < 0.02, `normal rate ${got / 6000}`);
  let hg = 0;
  for (let i = 0; i < 6000; i++) hg += rollSeeds(p, HEROIC, 'keeper', rng).glowcap || 0;
  assert.ok(Math.abs(hg / 6000 - 1 / 3) < 0.02, `heroic rate ${hg / 6000}`);
  assert.equal(p.vale.seeds.glowcap, got + hg + 1, 'every seed lands in the bag');
  // a practice run gives nothing and grows nothing
  const q = freshProfile(T0);
  const hero = newHero(q, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' })!;
  plant(q, 0, 'glowcap', () => 0.5);
  const loot = resolveRun(q, BARROW, { hero, practice: true, cleared: true, bosses: ['knight', 'keeper'], bossTimes: {}, time: 200 }, () => 0);
  assert.deepEqual(loot.seeds || {}, {});
  assert.equal(q.vale.beds[0].grown, 0);
});

test('garden: a save’s very first run never drops a seed, and the first seed that does brings a one-step tip, once', () => {
  const p = freshProfile(T0);
  const hero = newHero(p, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' })!;
  const run = { hero, practice: false, cleared: true, bosses: ['knight', 'keeper'], bossTimes: {}, time: 240 };
  // a roll of 0 drops every line, but not on the first run
  assert.deepEqual(resolveRun(p, BARROW, run, () => 0, T0).seeds, {});
  assert.deepEqual(p.vale.seeds, {});
  assert.equal(needsSeedTour(p), false);
  assert.deepEqual(resolveRun(p, BARROW, run, () => 0, T0).seeds, { glowcap: 1 }, 'from the second run on');
  assert.equal(needsSeedTour(p), true, 'the first seed brings the garden tip');
  finishSeedTour(p);
  resolveRun(p, BARROW, run, () => 0, T0);
  assert.equal(needsSeedTour(p), false, 'once');
  // someone who has planted before (a save from before the tip) never gets it
  const q = freshProfile(T0);
  newHero(q, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' });
  q.counters['vale.planted'] = 2;
  rollSeeds(q, BARROW, 'keeper', () => 0);
  assert.equal(needsSeedTour(q), false);
});

test('garden: a seed grows one step per clear, is ready after three, and never wilts', () => {
  const p = freshProfile(T0);
  assert.equal(plant(p, 0, 'glowcap', () => 0.5), false, 'no seed yet');
  p.vale.seeds.glowcap = 1;
  assert.equal(plant(p, 0, 'moonpetal', () => 0.5), false, 'no moonpetal seeds');
  assert.ok(plant(p, 0, 'glowcap', () => 0.5));
  assert.equal(p.vale.seeds.glowcap, undefined, 'the seed is used up');
  assert.equal(p.counters['vale.planted'], 1);
  p.vale.seeds.glowcap = 2;
  assert.equal(plant(p, 0, 'glowcap', () => 0.5), false, 'one seed a bed');
  assert.equal(bedPhase(p.vale.beds[0]), 'growing');
  assert.equal(beginHarvest(p, 0, makeRng(1), T0), null, 'not ready yet');
  for (let i = 1; i < GROW_CLEARS; i++) { assert.equal(growBeds(p), 0); assert.equal(clearsLeft(p.vale.beds[0]), GROW_CLEARS - i); }
  assert.equal(growBeds(p), 1, 'just got ready');
  assert.equal(bedPhase(p.vale.beds[0]), 'ready');
  for (let i = 0; i < 50; i++) growBeds(p);
  assert.equal(p.vale.beds[0].grown, GROW_CLEARS, 'it waits as long as you like');
  assert.equal(readyBeds(p), 1);
  // a real clear grows every planted bed
  const hero = newHero(p, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' })!;
  plant(p, 1, 'glowcap', () => 0.5);
  const loot = resolveRun(p, BARROW, { hero, practice: false, cleared: true, bosses: ['knight', 'keeper'], bossTimes: {}, time: 240 }, makeRng(9), T0);
  assert.equal(p.vale.beds[1].grown, 1);
  assert.equal(loot.bedsReady, 0);
  // shimmer is rolled at planting, about one in seven
  let shim = 0;
  for (let i = 0; i < 7000; i++) { const q = freshProfile(T0); q.vale.seeds.glowcap = 1; plant(q, 0, 'glowcap', makeRng(i + 11)); if (q.vale.beds[0].shimmer) shim++; }
  assert.ok(Math.abs(shim / 7000 - SHIMMER) < 0.02, `shimmer rate ${shim / 7000}`);
});

test('garden: tapped from across the house, it opens the bed that wants you: ready, then empty with a seed, then nearest ready', () => {
  const p = freshProfile(T0);
  assert.equal(bedToOpen(p), 0, 'nothing planted and no seed: the first bed, which says where seeds come from');
  p.vale.beds[0] = { seed: 'glowcap', grown: 1, shimmer: false };
  p.vale.beds[2] = { seed: 'glowcap', grown: 2, shimmer: false };
  assert.equal(bedToOpen(p), 2, 'no seed to plant: the bed nearest ready');
  p.vale.seeds.glowcap = 1;
  assert.equal(bedToOpen(p), 1, 'a seed to plant: the empty bed');
  readyBed(p, 0);
  assert.equal(bedToOpen(p), 0, 'a ready bed comes first');
});

test('garden: a harvest rolls at the start, gives 8 or more herbs, Perfects add at the end, shimmer gives dew', () => {
  const p = freshProfile(T0);
  readyBed(p, 0, 'glowcap', true);
  const h = beginHarvest(p, 0, makeRng(5), T0)!;
  assert.ok(h.base >= PLANTS.glowcap.yield[0] && h.base <= PLANTS.glowcap.yield[1], `yield ${h.base}`);
  assert.ok(h.base >= 8);
  assert.equal(p.vale.satchel.glowcap, h.base, 'the roll is in the satchel already');
  assert.ok(h.dew >= 2 && h.dew <= 3, 'a shimmering bed gives dew');
  assert.equal(p.vale.beds[0].seed, null, 'the bed is empty again');
  const before = p.vale.xp.gather || 0;
  for (let i = 0; i < 3; i++) { const x = cutXp(p, h, 'perfect'); assert.equal(x.xp, CUT_XP.perfect + SHIMMER_XP); }
  const end = endHarvest(p, h, 3);
  assert.equal(end.gained, h.base + 3);
  assert.equal(end.xp, 3 * (CUT_XP.perfect + SHIMMER_XP) + HARVEST_XP);
  assert.equal(p.vale.xp.gather - before, end.xp);
  assert.equal(p.counters['vale.harvests'], 1);
  assert.equal(p.counters['vale.perfects'], 3);
  // the first harvest brings the goat, once
  assert.equal(h.gift, FIRST_HARVEST_GIFT);
  assert.ok(p.collection[FIRST_HARVEST_GIFT]);
  readyBed(p, 1);
  assert.equal(beginHarvest(p, 1, makeRng(6), T0)!.gift, null);
  // the testing switch harvests a bed that is still growing
  p.vale.seeds.glowcap = 1;
  plant(p, 2, 'glowcap', () => 0.5);
  p.vale.seeds.glowcap = 0;
  assert.ok(beginHarvest(p, 2, makeRng(7), T0, { free: true }));
});

test('garden: rares roll on their own lines, duplicates become dew, the first harvest is an achievement', () => {
  const p = freshProfile(T0);
  const rng = makeRng(42);
  let rolls = 0;
  for (let i = 0; i < 400; i++) { readyBed(p); rolls += beginHarvest(p, 0, rng, T0, { luck: 50 })!.drops.length; }
  for (const d of GARDEN_TABLE) assert.ok(p.collection[d.id], `${d.id} turned up`);
  assert.ok(rolls > GARDEN_TABLE.length);
  assert.ok((p.vale.satchel.dew || 0) > 60, 'duplicates turned into dew');
  for (const d of GARDEN_TABLE) assert.ok(COLLECTIBLES[d.id]);
  const a = new Achiever(p, { dungeon: 'garden', role: 'tank', practice: false, testGear: false });
  assert.ok(a.check().includes('vale.first'));
});

test('garden: brewing uses the recipe, a Perfect stir adds a bottle, ranks unlock recipes', () => {
  const p = freshProfile(T0);
  p.vale.satchel = { glowcap: 25, moonpetal: 4, dew: 2 };
  assert.equal(RECIPES.glow.needs.glowcap, 10);
  assert.equal(canBrew(p, 'glow'), 2);
  assert.equal(canBrew(p, 'elixir'), 0, 'Starlight Elixir needs Brewing rank 3');
  const run = startBrew(p, 'glow')!;
  assert.equal(p.vale.satchel.glowcap, 15, 'in the pot');
  for (let i = 0; i < 3; i++) lapXp(p, run, 'good');
  const left = finishBrew(p, run, 'rough');
  assert.equal(left.bottles, RECIPES.glow.makes);
  assert.equal(left.xp, 3 * LAP_XP.good + BOTTLE_XP);
  assert.equal(brew(p, 'glow', 'perfect')!.bottles, RECIPES.glow.makes + 1);
  assert.equal(brew(p, 'glow', 'good'), null, 'out of glowcaps');
  p.vale.xp.brew = 150;
  assert.equal(skillRank(p, 'brew'), 3);
  p.vale.satchel.glowcap = 8;
  assert.equal(canBrew(p, 'elixir'), 1);
  assert.equal(rankOf(0), 1);
});

test('garden: one bottle a run serves the whole party, and only the poured one is spent', () => {
  assert.equal(pourFor([{ role: 'tank', leader: true, brew: null }]), null);
  assert.equal(pourFor([{ role: 'dps', leader: true, brew: 'glow' }, { role: 'tank', leader: false, brew: 'tonic' }])!.role, 'dps', 'the leader first');
  assert.equal(pourFor([{ role: 'dps', leader: true, brew: null }, { role: 'healer', leader: false, brew: 'glow' }, { role: 'tank', leader: false, brew: 'tonic' }])!.role, 'tank', 'then seat order');
  const p = freshProfile(T0);
  p.vale.shelf = { glow: 2 };
  assert.equal(broughtBrew(p), null, 'nothing chosen');
  p.vale.drink = 'glow';
  assert.equal(broughtBrew(p), 'glow');
  spendBottle(p, 'glow');
  assert.equal(p.vale.shelf.glow, 1);
  p.vale.shelf.glow = 0;
  assert.equal(broughtBrew(p), null, 'none left');
});

/* ---------------------------------------------------------------- brews in the engine */
const brewGame = (brew: string) => {
  newGame(BARROW_ENGINE, { role: 'tank', seed: 77, start: 'entrance', auto: true, quiet: true, noEvents: true, loadouts: {}, brew, brewCol: RECIPES[brew].color });
  const s = S as any;
  return { s, me: s.heroes.find((h: any) => h.isPlayer), all: s.heroes as any[] };
};

test('brews: each has a short line for the Dungeons sheet that fits a phone and only says what its card says', () => {
  for (const r of Object.values(RECIPES)) {
    assert.ok(r.short && r.short.length <= 32, `${r.id}: "${r.short}" is short enough for a phone`);
    for (const n of r.short.match(/\d+%/g) || []) assert.ok(r.desc.includes(n), `${r.id}: its short line says ${n}, and so does its card`);
  }
});

test('brews: one poured brew lands on every hero and does what its card says', () => {
  // Glowcap Draught: everyone hits harder and moves faster, area hits reach wider, the tank holds more threat
  let { s, me, all } = brewGame('glow');
  assert.equal(all.length, 3);
  for (const h of all) { assert.equal(h.brew, 'glow'); assert.ok(Math.abs(h.speed - ROLES[h.role as 'tank'].speed * 1.15) < 1e-6, `${h.role} speed`); }
  assert.ok(Math.abs(me.threatMod - ROLES.tank.threat * 1.5) < 1e-6);
  assert.equal(s.brewArea, 1.25);
  const mob = s.mobs.find((m: any) => m.alive && !m.isBoss && !m.cage);
  mob.hp = 1e6; mob.maxHp = 1e6;
  assert.equal(hurtMob(mob, 100, me, { quiet: true, noCrit: true }), Math.round(100 * me.power * 1.25));
  // Moonpetal Tonic: a dodge heals 10%
  ({ me } = brewGame('tonic'));
  me.hp = Math.round(me.maxHp * 0.5);
  const before = me.hp;
  doDodge(me, 0, 1);
  assert.equal(me.hp - before, Math.round(me.maxHp * 0.1));
  // Bramble Fizz: faster, and cooldowns come back sooner
  ({ s, me } = brewGame('fizz'));
  assert.ok(Math.abs(me.speed - ROLES.tank.speed * 1.25) < 1e-6);
  // Starlight Elixir: once a run each hero gets back up on half health
  ({ s, me, all } = brewGame('elixir'));
  for (const h of all) {
    hurtHero(h, 1e6, null, { pierce: true, dodge: false, block: false });
    assert.ok(h.alive, `${h.role} got back up`);
    assert.equal(h.hp, Math.round(h.maxHp * 0.5));
  }
  hurtHero(me, 1e6, null, { pierce: true, dodge: false, block: false });
  assert.ok(!me.alive, 'only once a run');
});

test('brews: a full bot clear runs with every brew', () => {
  for (const b of Object.keys(RECIPES)) {
    const r = simRun({ role: 'tank', seed: 101, brew: b });
    assert.equal(r.over, 'victory', `${b}: ${r.over}`);
  }
});
