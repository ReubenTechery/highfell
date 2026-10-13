/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng';
import { COLLECTIBLES, checkContent } from '../src/content';
import { NODE_BANK, PLACES, RECIPES, SHIMMER } from '../src/content/vale';
import { freshProfile, migrate, PROFILE_VERSION } from '../src/meta/profile';
import { Achiever } from '../src/meta/achievements';
import { BOTTLE_XP, CUT_XP, HARVEST_XP, LAP_XP, SHIMMER_XP, beginHarvest, brew, canBrew, completeErrand, cutXp, dayOf, drinkForRun, endHarvest, errandAt, errandShort, finishBrew, lapXp, placeState, rankOf, rideMount, rideSecs, skillRank, startBrew } from '../src/meta/vale';
import { FOOT_SECS } from '../src/content/vale';
import { simRun } from '../src/sim/run';
import { newGame } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtHero, hurtMob } from '../src/dungeon/entities.js';
import { doDodge } from '../src/dungeon/heroes.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { plainLoadout } from '../src/meta/gear';
import { ROLES } from '../src/content/roles';

const DAY = 86400000;
const T0 = Date.UTC(2026, 9, 14, 2);

test('vale: content ids all exist and the save carries the Vale', () => {
  assert.deepEqual(checkContent(), []);
  assert.ok(PLACES.bramblewick.nodes.length === 3);
  const p = migrate({ v: 3, rev: 2, roster: [], warband: {} });
  assert.equal(p.v, PROFILE_VERSION);
  assert.deepEqual(p.vale.satchel, {});
  assert.equal(p.vale.drink, null);
  const back = migrate(JSON.parse(JSON.stringify({ ...p, vale: { ...p.vale, satchel: { moonpetal: 3, bad: -2 }, lore: ['bw.under', 'bw.under'] } })));
  assert.deepEqual(back.vale.satchel, { moonpetal: 3 }, 'negative counts are dropped');
  assert.deepEqual(back.vale.lore, ['bw.under']);
});

test('vale: places regrow overnight and bank up to three days, never more', () => {
  const p = freshProfile(T0);
  const st = placeState(p, 'bramblewick', T0);
  assert.equal(st.nodes.moonpetal.n, 3, 'a first visit starts with three ready');
  assert.equal(st.errands.n, 1);
  for (let i = 0; i < 3; i++) assert.ok(beginHarvest(p, 'bramblewick', 'moonpetal', makeRng(i + 1), T0));
  assert.equal(beginHarvest(p, 'bramblewick', 'moonpetal', makeRng(9), T0), null, 'nothing left today');
  assert.equal(placeState(p, 'bramblewick', T0 + DAY).nodes.moonpetal.n, 2, 'two regrow overnight');
  assert.equal(placeState(p, 'bramblewick', T0 + DAY * 30).nodes.moonpetal.n, NODE_BANK, 'a long break banks up to the cap');
  assert.equal(placeState(p, 'bramblewick', T0 + DAY * 30).errands.n, 3);
  assert.equal(dayOf(T0 + DAY) - dayOf(T0), 1);
});

test('vale: a harvest rolls at the start, Perfects add at the end, shimmer drops dew', () => {
  const p = freshProfile(T0);
  const h = beginHarvest(p, 'bramblewick', 'moonpetal', makeRng(5), T0)!;
  assert.ok(h.base >= 1 && h.base <= 2);
  assert.equal(p.vale.satchel.moonpetal, h.base, 'the roll is in the satchel already');
  // every cut pays XP the moment it lands, and finishing pays a little more
  const before = p.vale.xp.gather || 0;
  for (let i = 0; i < 3; i++) { const x = cutXp(p, h, 'perfect'); assert.equal(x.xp, CUT_XP.perfect + (h.shimmer ? SHIMMER_XP : 0)); assert.equal(x.total, p.vale.xp.gather); }
  const end = endHarvest(p, h, 3);
  assert.equal(end.gained, h.base + 3);
  assert.equal(end.xp, 3 * (CUT_XP.perfect + (h.shimmer ? SHIMMER_XP : 0)) + HARVEST_XP);
  assert.equal(p.vale.xp.gather - before, end.xp);
  assert.equal(p.vale.satchel.moonpetal, h.base + 3);
  assert.equal(p.counters['vale.bramblewick.moonpetal'], 1);
  assert.equal(p.counters['vale.perfects'], 3);
  // shimmer: about one in seven, and a shimmering harvest always gives dew
  let shim = 0, dew = 0;
  const q = freshProfile(T0);
  for (let i = 0; i < 7000; i++) { const x = beginHarvest(q, 'bramblewick', 'glowcap', makeRng(i + 11), T0, { free: true })!; if (x.shimmer) { shim++; assert.ok(x.dew >= 1); } dew += x.dew; }
  assert.ok(Math.abs(shim / 7000 - SHIMMER) < 0.02, `shimmer rate ${shim / 7000}`);
  assert.ok(dew > shim);
});

test('vale: rares roll on their own lines, duplicates become dew, pets move in', () => {
  const p = freshProfile(T0);
  const rng = makeRng(77);
  let pets = 0, trophies = 0;
  for (let i = 0; i < 6000; i++) {
    const h = beginHarvest(p, 'bramblewick', 'bramble', rng, T0, { free: true })!;
    for (const d of h.drops) if (d.isNew) { if (COLLECTIBLES[d.id].kind === 'pet') pets++; else trophies++; }
  }
  assert.ok(p.collection['trophy.bramble_crown'], 'a 1 in 80 in 6,000 tries');
  assert.ok(p.collection['trophy.bramble_crown'].n > 30, 'and plenty of duplicates');
  assert.ok(pets <= 1 && trophies === 1);
  if (p.collection['pet.thimble']) assert.ok(Object.values(p.hearth.spots).includes('pet.thimble'), 'a new pet goes to the fire');
  assert.ok((p.vale.satchel.dew || 0) > 60, 'duplicates turned into dew');
});

test('vale: errands go in a fixed order, deliveries need the goods, each one pays a story page', () => {
  const p = freshProfile(T0);
  const rng = makeRng(3);
  const seen = new Set<string>();
  for (let d = 0; d < 7; d++) {
    const now = T0 + d * DAY;
    const e = errandAt(p, 'bramblewick', now)!;
    assert.ok(e, `day ${d} has an errand`);
    if (d === 0) assert.equal(e.kind, 'herd', 'the first errand is always the goats');
    seen.add(e.id);
    if (e.kind === 'deliver') {
      assert.ok(errandShort(p, e));
      assert.equal(completeErrand(p, 'bramblewick', rng, now), null, 'cannot hand over what you lack');
      for (const [k, n] of Object.entries(e.needs!)) p.vale.satchel[k] = n;
    }
    const done = completeErrand(p, 'bramblewick', rng, now)!;
    assert.ok(done.page, 'a new story page');
    assert.equal(errandAt(p, 'bramblewick', now), null, 'one a day');
  }
  assert.equal(seen.size, 7, 'a week of errands, no repeats');
  assert.equal(p.vale.lore.length, 7);
});

test('vale: brewing uses the recipe, a Perfect stir adds a bottle, ranks unlock recipes', () => {
  const p = freshProfile(T0);
  p.vale.satchel = { moonpetal: 9, glowcap: 8, brambleberry: 2, dew: 2 };
  assert.equal(canBrew(p, 'tonic'), 2);
  assert.equal(canBrew(p, 'glow'), 0, 'Glowcap Draught needs Brewing rank 2');
  // the ingredients go in when the stir starts; each lap pays; leaving mid-stir still bottles it
  const run = startBrew(p, 'tonic')!;
  assert.equal(p.vale.satchel.moonpetal, 5, 'in the pot');
  assert.equal(lapXp(p, run, 'perfect').xp, LAP_XP.perfect);
  const left = finishBrew(p, run, 'rough');
  assert.equal(left.bottles, RECIPES.tonic.makes);
  assert.equal(left.xp, LAP_XP.perfect + BOTTLE_XP);
  assert.equal(p.vale.xp.brew, left.xp);
  p.vale.satchel.moonpetal = 9;
  const a = brew(p, 'tonic', 'perfect')!;
  assert.equal(a.bottles, RECIPES.tonic.makes + 1);
  assert.equal(a.xp, 3 * LAP_XP.perfect + BOTTLE_XP);
  assert.equal(p.vale.satchel.moonpetal, 5);
  assert.equal(brew(p, 'tonic', 'rough')!.bottles, RECIPES.tonic.makes);
  assert.equal(brew(p, 'tonic', 'good'), null, 'out of moonpetals');
  p.vale.xp.brew = 150;
  assert.equal(skillRank(p, 'brew'), 3);
  assert.ok(canBrew(p, 'glow') >= 1 && canBrew(p, 'elixir') === 0);
  p.vale.drink = 'tonic';
  const before = p.vale.shelf.tonic;
  assert.equal(drinkForRun(p, false), 'tonic', 'practice does not spend a bottle');
  assert.equal(p.vale.shelf.tonic, before);
  assert.equal(drinkForRun(p, true), 'tonic');
  assert.equal(p.vale.shelf.tonic, before - 1);
  p.vale.shelf.tonic = 0;
  assert.equal(drinkForRun(p, true), null);
  assert.equal(rankOf(0), 1); assert.equal(rankOf(2220), 10); assert.equal(rankOf(99999), 10);
});

test('vale: you start on foot, the goats errand gives you a goat, a mount rides quicker, achievements count', () => {
  const p = freshProfile(T0);
  assert.equal(rideMount(p), null, 'nobody is given a mount for nothing');
  assert.equal(rideSecs(null), FOOT_SECS);
  const e = errandAt(p, 'bramblewick', T0)!;
  assert.equal(e.gives, 'mount.goat');
  const done = completeErrand(p, 'bramblewick', makeRng(1), T0)!;
  assert.equal(done.gift, 'mount.goat');
  assert.equal(p.hearth.spots['mount.stall'], 'mount.goat', 'she moves into the stall');
  assert.equal(rideMount(p), 'mount.goat');
  assert.ok(rideSecs('mount.goat') < FOOT_SECS, 'and gets you there quicker');
  // the goats come round again later, but the goat is only given once
  p.vale.places.bramblewick.errands.next = 8; p.vale.places.bramblewick.errands.n = 1;
  assert.equal(errandAt(p, 'bramblewick', T0)!.id, 'goats');
  assert.equal(completeErrand(p, 'bramblewick', makeRng(2), T0)!.gift, null);
  p.collection['mount.gravehound'] = { n: 1, kc: 1, at: T0 };
  p.hearth.spots['mount.stall'] = 'mount.gravehound';
  assert.equal(rideMount(p), 'mount.gravehound');
  const a = new Achiever(p, { dungeon: 'bramblewick', role: 'tank', practice: false, testGear: false });
  const h = beginHarvest(p, 'bramblewick', 'moonpetal', makeRng(1), T0)!;
  endHarvest(p, h, 2);
  assert.ok(a.check().includes('vale.first'));
  assert.deepEqual(a.check(), []);
});

/* ---------------------------------------------------------------- brews in the engine */

const brewGame = (brew: string) => {
  newGame(BARROW_ENGINE, { role: 'tank', seed: 77, start: 'entrance', auto: true, quiet: true, noEvents: true, loadouts: { tank: { ...plainLoadout('tank', 0), brew, brewCol: RECIPES[brew].color } } });
  const s = S as any;
  return { s, me: s.heroes.find((h: any) => h.isPlayer) };
};

test('brews: each one does what its card says', () => {
  // Bramble Fizz: faster, and the dodge comes back sooner
  let { s, me } = brewGame('fizz');
  assert.ok(Math.abs(me.speed - ROLES.tank.speed * 1.12) < 1e-6);
  assert.ok(doDodge(me, 1, 0));
  assert.ok(me.cd.dodge < 1.2, `dodge cooldown ${me.cd.dodge}`);
  // Moonpetal Tonic: a dodge heals 5%
  ({ s, me } = brewGame('tonic'));
  me.hp = Math.round(me.maxHp * 0.5);
  const before = me.hp;
  doDodge(me, 0, 1);
  assert.equal(me.hp - before, Math.round(me.maxHp * 0.05));
  // Glowcap Draught: the first hit on each enemy crits, the next one rolls as usual
  ({ s, me } = brewGame('glow'));
  const mob = s.mobs.find((m: any) => m.alive && !m.isBoss && !m.cage);
  assert.ok(mob, 'a mob to hit');
  mob.hp = 1e6; mob.maxHp = 1e6;
  const first = hurtMob(mob, 100, me, { quiet: true });
  assert.equal(first, Math.round(100 * me.power * 2));
  const second = hurtMob(mob, 100, me, { quiet: true, noCrit: true });
  assert.equal(second, Math.round(100 * me.power));
  // Starlight Elixir: once a run, a knockout hit leaves you on half health
  ({ s, me } = brewGame('elixir'));
  hurtHero(me, 1e6, mob || null, { pierce: true, dodge: false, block: false });
  assert.ok(me.alive);
  assert.equal(me.hp, Math.round(me.maxHp * 0.5));
  hurtHero(me, 1e6, null, { pierce: true, dodge: false, block: false });
  assert.ok(!me.alive, 'only once a run');
});

test('brews: a full bot clear runs with every brew', () => {
  for (const brew of Object.keys(RECIPES)) {
    const r = simRun({ role: 'tank', seed: 101, loadouts: { tank: { ...plainLoadout('tank', 0), brew, brewCol: RECIPES[brew].color } } });
    assert.equal(r.over, 'victory', `${brew}: ${r.over}`);
  }
});
