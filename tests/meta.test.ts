/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng';
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, ITEMS, SETS, checkContent } from '../src/content';
import { BARROW } from '../src/content/barrow';
import { freshProfile, migrate, PROFILE_VERSION } from '../src/meta/profile';
import { DUPE_MARKS, resolveRun, rollTable } from '../src/meta/loot';
import { equip, loadoutFor, plainLoadout, worn } from '../src/meta/gear';
import { Achiever } from '../src/meta/achievements';
import { HEARTH_SPOTS, place } from '../src/meta/hearth';
import type { GameEvent, RunSummary } from '../src/content/types';

test('content: every id a table, log, set or reward points at exists', () => {
  assert.deepEqual(checkContent(), []);
  assert.ok(Object.keys(ITEMS).length >= 48 + 12);
  for (const s of Object.values(SETS)) assert.equal(s.pieces.length, 3);
  assert.equal(BARROW.collection.length, 16);
  assert.ok(DUNGEONS.barrow);
});

test('profile: garbage starts fresh, saves round-trip, missing fields are filled', () => {
  assert.equal(migrate(null).v, PROFILE_VERSION);
  assert.equal(migrate('nope').rev, 0);
  const p = freshProfile(1000);
  p.rev = 7; p.collection['pet.pint_gravekeeper'] = { n: 1, kc: 4123, at: 5 };
  const back = migrate(JSON.parse(JSON.stringify(p)));
  assert.equal(back.rev, 7);
  assert.equal(back.collection['pet.pint_gravekeeper'].kc, 4123);
  const partial = migrate({ v: PROFILE_VERSION, rev: 3, heroes: { tank: { regular: { weapon: { rar: 2 } } } } });
  assert.equal(partial.heroes.tank.regular.weapon.rar, 2);
  assert.equal(partial.heroes.healer.regular.chest.rar, 0);
  assert.equal(partial.heroes.dps.equip.helm, null);
});

test('loot: each line rolls at its own rate and role locks hold', () => {
  const keeper = BARROW.loot.find((t) => t.boss === 'keeper')!;
  const rng = makeRng(42);
  const N = 200000;
  const hits: Record<string, number> = {};
  for (let i = 0; i < N; i++) for (const d of rollTable(keeper, 'tank', rng)) hits[d.id] = (hits[d.id] || 0) + 1;
  const near = (id: string, rate: number) => {
    const exp = N * rate, sd = Math.sqrt(N * rate * (1 - rate));
    assert.ok(Math.abs((hits[id] || 0) - exp) < 4 * sd + 2, `${id}: got ${hits[id] || 0}, expected about ${exp.toFixed(0)}`);
  };
  near('barrowguard.helm', 1 / 50);
  near('gravekeeper.tank', 1 / 100);
  near('mount.gravehound', 1 / 1000);
  near('pet.pint_gravekeeper', 1 / 5000);
  assert.equal(hits['candlewake.helm'] || 0, 0);
  assert.equal(hits['gravekeeper.dps'] || 0, 0);
});

const clear = (role: 'tank' | 'healer' | 'dps' = 'tank') => ({ role, bosses: ['knight', 'keeper'], bossTimes: { knight: 70, keeper: 140 }, cleared: true, practice: false, time: 290 });

test('loot: a clear counts kills, gives marks, a ladder piece and a spare piece', () => {
  const p = freshProfile();
  const r = resolveRun(p, BARROW, clear(), makeRng(1));
  assert.equal(r.kc.keeper, 1);
  assert.equal(r.kc.knight, 1);
  assert.equal(r.clears, 1);
  assert.ok(r.firstClear);
  assert.equal(r.pb, 290);
  const reg = r.drops.find((d) => d.source === 'regular')!;
  assert.ok(reg && reg.rar! >= 1);
  assert.equal(p.heroes.tank.regular[reg.slot!].rar, reg.rar);
  assert.ok(r.drops.some((d) => d.source === 'spare' && d.role !== 'tank'));
  assert.ok(r.marks >= 1);
  assert.equal(p.dungeons.barrow.marks, r.marks);
  assert.equal(p.bosses['barrow.keeper'].pb, 140);
});

test('loot: practice runs give nothing', () => {
  const p = freshProfile();
  const r = resolveRun(p, BARROW, { ...clear(), practice: true }, makeRng(1));
  assert.equal(r.drops.length, 0);
  assert.equal(p.bosses['barrow.keeper'], undefined);
});

test('loot: the ladder reaches full Epic in about ten clears, then offers traits', () => {
  const runs: number[] = [];
  for (let seed = 1; seed <= 200; seed++) {
    const p = freshProfile();
    const rng = makeRng(seed);
    let n = 0;
    while (Object.values(p.heroes.tank.regular).some((s) => s.rar < 3)) { resolveRun(p, BARROW, clear(), rng); n++; }
    runs.push(n);
    const r = resolveRun(p, BARROW, clear(), rng);
    assert.ok(r.drops.find((d) => d.source === 'regular')!.offerTrait);
  }
  const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
  assert.ok(avg > 8 && avg < 12, `average clears to full Epic: ${avg}`);
});

test('loot: uniques are worn on arrival, duplicates turn into marks', () => {
  const p = freshProfile();
  let got = 0, dupes = 0;
  const rng = makeRng(9);
  for (let i = 0; i < 400; i++) {
    const r = resolveRun(p, BARROW, clear('healer'), rng);
    for (const d of r.drops) if (d.source === 'table' && ITEMS[d.id]) { if (d.dupe) { dupes++; assert.equal(d.marks, DUPE_MARKS); } else got++; }
  }
  assert.ok(got >= 3, 'expected some Candlewake pieces in 400 clears');
  assert.ok(dupes > 0);
  const w = worn(p, 'healer');
  if (p.collection['candlewake.chest']) assert.equal(w.chest.def.id, 'candlewake.chest');
  assert.ok(p.dungeons.barrow.marks > 400);
});

test('gear: power runs 1.00 at Common to 1.45 at Epic, sets add bonuses', () => {
  assert.equal(plainLoadout('tank', 0).power, 1);
  assert.ok(Math.abs(plainLoadout('tank', 3).power - 1.45) < 1e-9);
  const p = freshProfile();
  for (const id of ['barrowguard.helm', 'barrowguard.shoulders']) { p.collection[id] = { n: 1, kc: 1, at: 0 }; equip(p, 'tank', ITEMS[id].slot, id); }
  const l = loadoutFor(p, 'tank');
  assert.ok(l.bonuses.includes('barrowguard2'));
  assert.ok(!l.bonuses.includes('barrowguard3'));
  assert.equal(equip(p, 'tank', 'chest', 'barrowguard.chest'), false, 'cannot wear what you do not own');
});

test('achievements: counters, live checks, run checks, rewards and the meta', () => {
  const p = freshProfile();
  const a = new Achiever(p, { dungeon: 'barrow', role: 'dps', practice: false, testGear: false }, () => 1);
  const kill: GameEvent = { type: 'mob.killed', mob: 'rattler', boss: false, undead: true, byPlayer: false };
  for (let i = 0; i < 499; i++) a.event(kill);
  assert.ok(!p.achievements['barrow.rattle']);
  assert.deepEqual(a.event(kill), ['barrow.rattle']);
  assert.ok(p.titles.includes('title.bonebreaker'));
  assert.deepEqual(a.event({ type: 'crit', amount: 1499, player: true }), []);
  assert.deepEqual(a.event({ type: 'crit', amount: 1600, player: true }), ['barrow.bignumber']);
  const tankOnly = new Achiever(p, { dungeon: 'barrow', role: 'healer', practice: false, testGear: false });
  assert.deepEqual(tankOnly.event({ type: 'boss.killed', boss: 'keeper', time: 1, armorUp: false, onlyPlayerAlive: false, smashes: 5, smashPerfect: 5, playerIsTank: true }), []);
  const sum: RunSummary = { dungeon: 'barrow', role: 'dps', practice: false, testGear: false, time: 190, deaths: 0, wipes: 0, handHits: 0, ringHits: 0, saves: 0, playerDeaths: 0, kicks: 0, perfectBlocks: 0 };
  const got = a.cleared(sum);
  for (const id of ['barrow.into', 'barrow.nobody', 'barrow.sprint', 'barrow.flawless']) assert.ok(got.includes(id), id);
  assert.ok(p.collection['trophy.barrow_key']);
  assert.ok(Object.values(p.hearth.spots).includes('trophy.barrow_key'), 'new trophies go on the mantel');
  for (const id of ACHIEVEMENTS['barrow.master'].needs!) p.achievements[id] = { at: 1 };
  delete p.achievements['barrow.flawless'];
  const b = new Achiever(p, { dungeon: 'barrow', role: 'dps', practice: false, testGear: false });
  assert.ok(b.cleared(sum).includes('barrow.master'));
  assert.ok(p.collection['pet.lantern_ghost']);
  const c = new Achiever(p, { dungeon: 'barrow', role: 'dps', practice: true, testGear: false });
  assert.deepEqual(c.cleared({ ...sum, practice: true }), []);
});

test('hearth: spots only take their own kind, and only what you own', () => {
  const p = freshProfile();
  assert.equal(place(p, 'pet.fire', 'pet.pint_gravekeeper'), false);
  p.collection['pet.pint_gravekeeper'] = { n: 1, kc: 1, at: 1 };
  assert.equal(place(p, 'mount.stall', 'pet.pint_gravekeeper'), false);
  assert.equal(place(p, 'pet.fire', 'pet.pint_gravekeeper'), true);
  assert.equal(place(p, 'pet.rug', 'pet.pint_gravekeeper'), true);
  assert.equal(p.hearth.spots['pet.fire'], null, 'moving it frees the old spot');
  assert.ok(HEARTH_SPOTS.every((s) => ['pet', 'mount', 'trophy', 'banner'].includes(s.kind)));
  assert.ok(COLLECTIBLES['mount.gravehound']);
});

test('art: every icon and sprite the content names exists', async () => {
  const fs = await import('node:fs');
  const read = (f: string) => JSON.parse(fs.readFileSync(new URL('../../art/' + f, import.meta.url), 'utf8'));
  const tiles = { ...read('icons.json'), ...read('collect_icons.json') };
  const sprites = { ...read('sprites.json'), ...read('hearth.json') };
  const missing: string[] = [];
  for (const it of Object.values(ITEMS)) if (!tiles[it.icon]) missing.push('icon ' + it.icon + ' for ' + it.id);
  for (const c of Object.values(COLLECTIBLES)) {
    if (!tiles[c.icon]) missing.push('icon ' + c.icon + ' for ' + c.id);
    if (c.sprite && !sprites[c.sprite]) missing.push('sprite ' + c.sprite + ' for ' + c.id);
  }
  for (const n of ['lantern', 'lantern_gold', 'lantern_out', 'pet_keeper', 'pet_keeper_reach', 'fireplace', 'fire_a', 'fire_b', 'rug', 'stall']) if (!sprites[n]) missing.push('sprite ' + n);
  for (const n of ['slam', 'cleave', 'smite', 'icicle', 'shield', 'charge', 'circle', 'ward', 'sunburst', 'blizzard', 'nova', 'comet', 'dodge', 'mend', 'marks']) if (!tiles[n]) missing.push('icon ' + n);
  assert.deepEqual(missing, []);
});
