/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng';
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, ITEMS, SETS, checkContent } from '../src/content';
import { BARROW } from '../src/content/barrow';
import { activeHero, freshProfile, migrate, nameProblem, PROFILE_VERSION, removeHero, renameHero, roleOf, setActive, WARBAND_CAP, type Hero, type Profile } from '../src/meta/profile';
import { DUPE_MARKS, resolveRun, rollTable } from '../src/meta/loot';
import { bestRegular, buyTrait, equip, loadoutFor, newHero, plainLoadout, putOn, seenSlot, waiting, waitingFor, worn } from '../src/meta/gear';
import { FOUNDERS, MAX_HEROES, canMake, cleanName } from '../src/content/folk';
import { SLOT_IDS } from '../src/content/gear';
import { INGREDIENTS, RECIPES } from '../src/content/vale';
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
  const partial = migrate({ v: PROFILE_VERSION, rev: 3, roster: [{ id: 'a', name: 'Pip', race: 'gnome', cls: 'rogue', regular: { weapon: { rar: 2 } } }, { id: 'b' }], active: 'zz' });
  assert.equal(partial.roster.length, 1, 'a hero with no name is dropped');
  const h = partial.roster[0];
  assert.equal(h.regular.weapon.rar, 2);
  assert.equal(h.regular.chest.rar, 0);
  assert.equal(h.equip.helm, null);
  assert.equal(h.named, true);
  assert.equal(partial.active, 'a', 'an unknown active hero falls back to the first');
  assert.equal(roleOf(h), 'dps', 'a class this build has no kit for still has a seat');
  assert.equal(partial.warband.healer.chest.rar, 0);
});

test('profile: a v2 save becomes one hero, named for the founder of the role you played', () => {
  const reg = (w: number, h: number, s: number, c: number) => ({ weapon: { rar: w }, helm: { rar: h }, shoulders: { rar: s }, chest: { rar: c } });
  const v2 = {
    v: 2, rev: 40, createdAt: 5, savedAt: 9, role: 'healer', title: 'title.quick', titles: ['title.quick'],
    heroes: {
      tank: { regular: reg(1, 1, 0, 0), equip: {} },
      healer: { regular: { ...reg(3, 3, 2, 3), weapon: { rar: 3, trait: 'kindle' } }, equip: { chest: 'candlewake.chest' } },
      dps: { regular: reg(0, 2, 0, 0), equip: {} },
    },
    dungeons: { barrow: { runs: 14, clears: 12, pb: 230, marks: 30 } },
    collection: { 'candlewake.chest': { n: 1, kc: 7, at: 3 } },
  };
  const p = migrate(v2);
  assert.equal(p.v, PROFILE_VERSION);
  assert.equal(p.rev, 40);
  assert.equal(p.roster.length, 1);
  const h = p.roster[0];
  assert.equal(p.active, h.id);
  assert.equal(h.name, FOUNDERS.healer.name);
  assert.equal(h.race, 'human'); assert.equal(h.cls, 'cleric');
  assert.equal(h.named, false, 'the game named it, so it can be renamed once');
  assert.equal(h.clears, 12);
  assert.equal(h.title, 'title.quick');
  assert.equal(h.regular.weapon.trait, 'kindle');
  assert.equal(h.equip.chest, 'candlewake.chest');
  assert.equal(p.warband.tank.weapon.rar, 1, 'other roles keep their gear as shared gear');
  assert.equal(p.warband.dps.helm.rar, 2);
  assert.equal(p.warband.healer.weapon.rar, WARBAND_CAP, 'the played role shares up to the cap');
  assert.equal(p.dungeons.barrow.clears, 12);
  assert.equal((p as any).heroes, undefined);
  // the same save migrated on another device makes the same hero
  assert.equal(migrate(v2).roster[0].id, h.id);
  // a save that never played starts with no heroes, so the game opens on the hero maker
  assert.equal(migrate({ v: 2, rev: 1, role: 'tank', heroes: {} }).roster.length, 0);
});

test('heroes: race and class are fixed, names are yours, up to six, the last one stays', () => {
  assert.ok(canMake('dwarf', 'warrior') && canMake('human', 'cleric') && canMake('elf', 'mage'));
  assert.ok(!canMake('gnome', 'warrior'), 'not drawn yet');
  assert.ok(!canMake('elf', 'rogue'), 'no kit yet');
  assert.equal(cleanName('  Wren   Copperkettle '), 'Wren Copperkettle');
  assert.equal(cleanName('x'), null);
  assert.equal(cleanName('<b>Bob</b>'), null);
  const p = freshProfile();
  const a = newHero(p, { name: 'Hollis Coalbeard', race: 'dwarf', cls: 'warrior' }, 10)!;
  assert.ok(a);
  assert.equal(p.active, a.id, 'your first hero is the one you play');
  assert.equal(newHero(p, { name: 'hollis coalbeard', race: 'elf', cls: 'mage' }), null, 'names are unique');
  assert.ok(nameProblem(p, 'Hollis Coalbeard'));
  assert.equal(newHero(p, { name: 'Pip', race: 'gnome', cls: 'warrior' }), null, 'only combos that are drawn');
  const b = newHero(p, { name: 'Ivy Stillwater', race: 'elf', cls: 'mage' }, 20)!;
  assert.equal(p.active, a.id, 'making an alt does not switch to it');
  assert.ok(setActive(p, b.id, 30));
  assert.equal(activeHero(p)!.id, b.id);
  for (let i = p.roster.length; i < MAX_HEROES; i++) assert.ok(newHero(p, { name: 'Edda ' + 'abcdef'[i], race: 'human', cls: 'cleric' }));
  assert.equal(newHero(p, { name: 'One More', race: 'human', cls: 'cleric' }), null, 'six is the most');
  assert.equal(renameHero(p, a.id, 'Gruna'), false, 'a hero you named keeps its name');
  for (const h of p.roster.slice(1)) assert.ok(removeHero(p, h.id));
  assert.equal(p.active, a.id, 'removing the active hero hands over to the oldest');
  assert.equal(removeHero(p, a.id), false, 'the last hero stays');
});

test('heroes: a new hero starts in shared gear, and the uniques the roster owns wait to be put on', () => {
  const p = freshProfile();
  p.warband.healer.helm = { rar: 2 };
  p.collection['candlewake.chest'] = { n: 1, kc: 3, at: 1 };
  p.collection['barrowguard.helm'] = { n: 1, kc: 3, at: 1 };
  const h = newHero(p, { name: 'Annis Brightwell', race: 'human', cls: 'cleric' })!;
  assert.equal(h.regular.helm.rar, 2, 'starting kit: the shared gear');
  assert.equal(h.regular.weapon.rar, 0);
  assert.equal(h.equip.chest, null, 'never put on for you');
  assert.deepEqual(h.fresh, ['candlewake.chest'], 'a tank set piece does not wait for a healer');
  assert.equal(waitingFor(p, h, 'chest')?.id, 'candlewake.chest');
  assert.ok(putOn(p, h, 'chest'));
  assert.equal(worn(p, h).chest.def.id, 'candlewake.chest');
  assert.equal(waiting(p, h).length, 0);
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

const HERO = { tank: { race: 'dwarf', cls: 'warrior' }, healer: { race: 'human', cls: 'cleric' }, dps: { race: 'elf', cls: 'mage' } } as const;
/** a fresh profile with one hero of a role, which is the one you play */
function withHero(role: 'tank' | 'healer' | 'dps' = 'tank', p: Profile = freshProfile()): { p: Profile; h: Hero } {
  const h = newHero(p, { name: 'Test ' + role, ...HERO[role] })!;
  setActive(p, h.id);
  return { p, h };
}
const clear = (hero: Hero) => ({ hero, bosses: ['knight', 'keeper'], bossTimes: { knight: 70, keeper: 140 }, cleared: true, practice: false, time: 290 });

test('loot: a clear counts kills, gives marks, a ladder piece and a spare piece', () => {
  const { p, h } = withHero('tank');
  const r = resolveRun(p, BARROW, clear(h), makeRng(1));
  assert.equal(r.kc.keeper, 1);
  assert.equal(r.kc.knight, 1);
  assert.equal(r.clears, 1);
  assert.ok(r.firstClear);
  assert.equal(r.pb, 290);
  const reg = r.drops.find((d) => d.source === 'regular')!;
  assert.ok(reg && reg.rar! >= 1);
  assert.ok(reg.toEquip);
  assert.equal(h.regular[reg.slot!].rar, 0, 'the new piece is not put on for you');
  assert.equal(h.bag[reg.slot!]!.rar, reg.rar, 'it waits in the bag');
  assert.equal(h.clears, 1);
  assert.equal(r.hero, h.id);
  const spare = r.drops.find((d) => d.source === 'spare')!;
  assert.ok(spare && spare.role !== 'tank');
  assert.equal(p.warband[spare.role!][spare.slot!].rar, spare.rar, 'a spare piece raises that role\'s shared gear');
  assert.ok(r.marks >= 1);
  assert.equal(p.dungeons.barrow.marks, r.marks);
  assert.equal(p.bosses['barrow.keeper'].pb, 140);
});

test('loot: practice runs give nothing', () => {
  const { p, h } = withHero('tank');
  const r = resolveRun(p, BARROW, { ...clear(h), practice: true }, makeRng(1));
  assert.equal(r.drops.length, 0);
  assert.equal(p.bosses['barrow.keeper'], undefined);
});

test('loot: the ladder reaches full Epic in about ten clears, then offers traits', () => {
  const runs: number[] = [];
  for (let seed = 1; seed <= 200; seed++) {
    const { p, h } = withHero('tank');
    const rng = makeRng(seed);
    let n = 0;
    while (SLOT_IDS.some((s) => bestRegular(h, s).rar < 3)) { resolveRun(p, BARROW, clear(h), rng); n++; if (seed % 2) for (const s of SLOT_IDS) putOn(p, h, s); }
    runs.push(n);
    const r = resolveRun(p, BARROW, clear(h), rng);
    assert.ok(r.drops.find((d) => d.source === 'regular')!.offerTrait);
  }
  const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
  assert.ok(avg > 8 && avg < 12, `average clears to full Epic: ${avg}`);
});

test('loot: shared gear lifts every hero of a role, now and later, up to Rare', () => {
  const { p, h } = withHero('tank');
  const alt = newHero(p, { name: 'Gruna Deepforge', race: 'dwarf', cls: 'warrior' })!;
  const rng = makeRng(3);
  for (let i = 0; i < 40; i++) resolveRun(p, BARROW, clear(h), rng);
  for (const s of SLOT_IDS) {
    assert.equal(p.warband.tank[s].rar, WARBAND_CAP, 'your own ladder raises your role\'s shared gear');
    assert.equal(bestRegular(alt, s).rar, WARBAND_CAP, 'and your alts of that role can put it on');
    assert.equal(alt.regular[s].rar, 0, 'but nobody puts it on for them');
    assert.equal(bestRegular(h, s).rar, 3, 'Epic stays with the hero who earned it');
    assert.equal(p.warband.healer[s].rar, WARBAND_CAP);
  }
  const later = newHero(p, { name: 'Edda Thatcher', race: 'human', cls: 'cleric' })!;
  assert.ok(SLOT_IDS.every((s) => later.regular[s].rar === WARBAND_CAP), 'a healer made later starts in Rare');
  assert.equal(alt.clears, 0);
  assert.equal(h.clears, 40);
});

test('loot: uniques wait to be put on, duplicates turn into marks', () => {
  const { p, h } = withHero('healer');
  let got = 0, dupes = 0;
  const rng = makeRng(9);
  for (let i = 0; i < 400; i++) {
    const r = resolveRun(p, BARROW, clear(h), rng);
    for (const d of r.drops) if (d.source === 'table' && ITEMS[d.id]) { if (d.dupe) { dupes++; assert.equal(d.marks, DUPE_MARKS); } else got++; }
  }
  assert.ok(got >= 3, 'expected some Candlewake pieces in 400 clears');
  assert.ok(dupes > 0);
  const w = worn(p, h);
  assert.ok(Object.values(w).every((x) => !x.unique), 'nothing goes on by itself');
  if (p.collection['candlewake.chest']) { assert.ok(h.fresh.includes('candlewake.chest')); putOn(p, h, 'chest'); assert.equal(worn(p, h).chest.def.id, 'candlewake.chest'); }
  assert.ok(p.dungeons.barrow.marks > 400);
});

test('gear: nothing goes on by itself, and putting it on is yours to do', () => {
  const { p, h } = withHero('dps');
  const alt = newHero(p, { name: 'Wren Hollowell', race: 'elf', cls: 'mage' })!;
  resolveRun(p, BARROW, clear(h), makeRng(5));
  const up = waiting(p, h);
  assert.equal(up.length, 1, 'one ladder piece waits');
  const before = loadoutFor(p, h).score;
  const w = putOn(p, h, up[0].slot)!;
  assert.equal(w.kind, 'regular');
  assert.ok(loadoutFor(p, h).score > before, 'and it counts once it is on');
  assert.equal(h.bag[up[0].slot], null);
  assert.equal(putOn(p, h, up[0].slot), null, 'nothing left to put on');
  // the same piece raised the shared floor: the alt can put it on too
  assert.equal(waiting(p, alt).length, 1);
  // a unique arrives for every hero of its role and glows until they look
  p.collection['rimebone.helm'] = { n: 1, kc: 1, at: 1 };
  h.fresh.push('rimebone.helm');
  assert.equal(waitingFor(p, h, 'helm')?.kind, 'unique');
  assert.ok(seenSlot(h, 'helm'));
  assert.equal(waitingFor(p, h, 'helm'), null, 'looked at: no more glow');
  assert.ok(equip(p, h, 'helm', 'rimebone.helm'), 'still yours to wear');
  // a bag piece under a unique waits quietly for when you go back to regular gear
  h.bag.helm = { rar: 3 };
  assert.equal(waitingFor(p, h, 'helm'), null);
  equip(p, h, 'helm', null);
  assert.equal(waitingFor(p, h, 'helm')?.kind, 'regular');
  // an Epic weapon in the bag takes trait swaps and offers even before it is on
  h.bag.weapon = { rar: 3, trait: 'splinter' }; p.dungeons.barrow.marks = 10;
  assert.ok(buyTrait(p, h, 'barrow', 'quickfrost'));
  assert.equal(h.bag.weapon!.trait, 'quickfrost');
});

test('profile: a v4 save keeps what everyone wears, with empty bags', () => {
  const v4 = { v: 4, rev: 2, roster: [{ id: 'a', name: 'Hollis Coalbeard', race: 'dwarf', cls: 'warrior', regular: { weapon: { rar: 3, trait: 'wide' }, helm: { rar: 2 } }, equip: { chest: 'barrowguard.chest' } }], collection: { 'barrowguard.chest': { n: 1, kc: 3, at: 1 } } };
  const p = migrate(v4);
  assert.equal(p.v, PROFILE_VERSION);
  const h = p.roster[0];
  assert.equal(h.regular.weapon.trait, 'wide');
  assert.equal(h.regular.helm.rar, 2);
  assert.equal(h.equip.chest, 'barrowguard.chest');
  assert.ok(SLOT_IDS.every((s) => h.bag[s] === null));
  assert.deepEqual(h.fresh, []);
});

test('gear: power runs 1.00 at Common to 1.45 at Epic, sets add bonuses', () => {
  assert.equal(plainLoadout('tank', 0).power, 1);
  assert.ok(Math.abs(plainLoadout('tank', 3).power - 1.45) < 1e-9);
  const { p, h } = withHero('tank');
  for (const id of ['barrowguard.helm', 'barrowguard.shoulders']) { p.collection[id] = { n: 1, kc: 1, at: 0 }; equip(p, h, ITEMS[id].slot, id); }
  const l = loadoutFor(p, h);
  assert.ok(l.bonuses.includes('barrowguard2'));
  assert.ok(!l.bonuses.includes('barrowguard3'));
  assert.equal(equip(p, h, 'chest', 'barrowguard.chest'), false, 'cannot wear what you do not own');
  const mage = newHero(p, { name: 'Sorrel Mistvale', race: 'elf', cls: 'mage' })!;
  assert.equal(equip(p, mage, 'helm', 'barrowguard.helm'), false, 'a set piece only fits its role');
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
  const tiles = { ...read('icons.json'), ...read('collect_icons.json'), ...read('vale_icons.json') };
  const sprites = { ...read('sprites.json'), ...read('hearth.json'), ...read('vale.json') };
  const missing: string[] = [];
  for (const it of Object.values(ITEMS)) if (!tiles[it.icon]) missing.push('icon ' + it.icon + ' for ' + it.id);
  for (const c of Object.values(COLLECTIBLES)) {
    if (!tiles[c.icon]) missing.push('icon ' + c.icon + ' for ' + c.id);
    if (c.sprite && !sprites[c.sprite]) missing.push('sprite ' + c.sprite + ' for ' + c.id);
  }
  for (const n of ['lantern', 'lantern_gold', 'lantern_out', 'pet_keeper', 'pet_keeper_reach', 'fireplace', 'fire_a', 'fire_b', 'rug', 'stall']) if (!sprites[n]) missing.push('sprite ' + n);
  for (const n of ['npc_gnome', 'cauldron', 'burrow', 'burrow_red', 'windmill', 'windmill_sails', 'fence', 'cabbages', 'node_moonpetal', 'node_moonpetal_shim', 'node_glowcap', 'node_bramble', 'goggles', 'crow', 'spark', 'kettle_walk', 'pet_rootling_calm', 'goat']) if (!sprites[n]) missing.push('sprite ' + n);
  for (const x of [...Object.values(INGREDIENTS), ...Object.values(RECIPES)]) if (!tiles[x.icon]) missing.push('icon ' + x.icon + ' for ' + x.id);
  for (const n of ['s_gather', 's_brew']) if (!tiles[n]) missing.push('icon ' + n);
  for (const c of Object.values(COLLECTIBLES)) if (c.kind === 'mount' && !c.saddle) missing.push('saddle for ' + c.id);
  for (const n of ['slam', 'cleave', 'smite', 'icicle', 'shield', 'charge', 'circle', 'ward', 'sunburst', 'blizzard', 'nova', 'comet', 'dodge', 'mend', 'marks']) if (!tiles[n]) missing.push('icon ' + n);
  assert.deepEqual(missing, []);
});
