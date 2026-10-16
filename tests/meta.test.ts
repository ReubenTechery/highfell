/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng';
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, ITEMS, SETS, checkContent, heroicVersion } from '../src/content';
import { BARROW } from '../src/content/barrow';
import { activeHero, createHero, dungeonRecord, finishHearthTour, finishIntroRun, freshProfile, migrate, nameProblem, needsHearthTour, needsIntroRun, PROFILE_VERSION, removeHero, renameHero, roleOf, setActive, startHearthTour, WARBAND_CAP, type Hero, type Profile } from '../src/meta/profile';
import { DUPE_MARKS, heroicOpen, heroicProgress, resolveRun, rollTable } from '../src/meta/loot';
import { bestRegular, buyTrait, compareFor, compareOn, effectsOf, equip, floorWorn, itemScore, loadoutFor, newHero, plainLoadout, putOn, seenSlot, waiting, waitingFor, wearerOf, worn } from '../src/meta/gear';
import { CLASSES, FOUNDERS, HERO_ART, MAX_HEROES, RACES, allHeroArt, canMake, cleanName, defaultSex, heroArt } from '../src/content/folk';
import { SLOT_IDS, gearId } from '../src/content/gear';
import { INGREDIENTS, RECIPES } from '../src/content/vale';
import { Achiever, progress } from '../src/meta/achievements';
import { logProgress, opened } from '../src/meta/logs';
import { HEARTH_SPOTS, lookOf, lookOpen, lookProgress, place, setLook } from '../src/meta/hearth';
import { HOUSE_SPOTS, LOOK_ROOMS, ROOMS, THINGS } from '../src/content/house';
import { heroesFor, pickRole, seats } from '../src/meta/party';
import { lootFor } from '../src/meta/loot';
import type { GameEvent, RunSummary } from '../src/content/types';

test('content: every id a table, log, set or reward points at exists', () => {
  assert.deepEqual(checkContent(), []);
  assert.ok(Object.keys(ITEMS).length >= 64 + 16);
  for (const s of Object.values(SETS)) assert.equal(s.pieces.length, 3);
  assert.equal(BARROW.collection.length, 20);
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
  assert.equal(h.race, 'human'); assert.equal(h.cls, 'cleric'); assert.equal(h.sex, 'f');
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

test('heroes: race and class are fixed, male or female look is saved, names are yours, up to six, the last one stays', () => {
  assert.ok(canMake('dwarf', 'warrior') && canMake('human', 'cleric') && canMake('elf', 'mage') && canMake('human', 'rogue') && canMake('elf', 'rogue'));
  for (const r of ['gnome', 'goblin', 'risen'] as const) {
    for (const c of ['warrior', 'cleric', 'mage', 'rogue'] as const) {
      assert.ok(canMake(r, c), `${r}.${c} is drawn and ready`);
    }
  }
  assert.ok(!canMake('orc', 'warrior'), 'not drawn yet');
  assert.equal(defaultSex('dwarf', 'warrior'), 'm');
  assert.equal(defaultSex('human', 'cleric'), 'f');
  assert.equal(defaultSex('elf', 'mage'), 'f');
  assert.equal(defaultSex('human', 'rogue'), 'f');
  assert.equal(heroArt('dwarf', 'warrior', 'm'), 'tank');
  assert.equal(heroArt('dwarf', 'warrior', 'f'), 'tank_w');
  assert.equal(heroArt('human', 'cleric', 'f'), 'healer');
  assert.equal(heroArt('human', 'cleric', 'm'), 'healer_m');
  assert.equal(heroArt('elf', 'mage', 'f'), 'dps');
  assert.equal(heroArt('elf', 'mage', 'm'), 'dps_m');
  assert.equal(heroArt('human', 'rogue', 'f'), 'rogue');
  assert.equal(heroArt('human', 'rogue', 'm'), 'rogue_m');
  for (const r of ['gnome', 'goblin', 'risen'] as const) {
    assert.equal(heroArt(r, 'warrior', 'm'), `${r}_tank`);
    assert.equal(heroArt(r, 'warrior', 'f'), `${r}_tank_w`);
    assert.equal(heroArt(r, 'cleric', 'f'), `${r}_healer`);
    assert.equal(heroArt(r, 'cleric', 'm'), `${r}_healer_m`);
    assert.equal(heroArt(r, 'mage', 'f'), `${r}_dps`);
    assert.equal(heroArt(r, 'mage', 'm'), `${r}_dps_m`);
    assert.equal(heroArt(r, 'rogue', 'f'), `${r}_rogue`);
    assert.equal(heroArt(r, 'rogue', 'm'), `${r}_rogue_m`);
  }
  assert.equal(cleanName('  Wren   Copperkettle '), 'Wren Copperkettle');
  assert.equal(cleanName('x'), null);
  assert.equal(cleanName('<b>Bob</b>'), null);
  const p = freshProfile();
  const a = newHero(p, { name: 'Gruna Coalbeard', race: 'dwarf', cls: 'warrior', sex: 'f' }, 10)!;
  assert.ok(a);
  assert.equal(a.sex, 'f');
  assert.equal(p.active, a.id, 'your first hero is the one you play');
  assert.equal(newHero(p, { name: 'gruna coalbeard', race: 'elf', cls: 'mage' }), null, 'names are unique');
  assert.ok(nameProblem(p, 'Gruna Coalbeard'));
  assert.equal(newHero(p, { name: 'Grokka', race: 'orc', cls: 'warrior', free: true }), null, 'only combos that are drawn');
  assert.equal(newHero(p, { name: 'Pip', race: 'gnome', cls: 'warrior' }), null, 'earned races wait until unlocked or free');
  const gn = newHero(p, { name: 'Pip Brassbuckle', race: 'gnome', cls: 'rogue', sex: 'f', free: true })!;
  const gb = newHero(p, { name: 'Skrix Fusewrench', race: 'goblin', cls: 'warrior', sex: 'm', free: true })!;
  assert.ok(gn && gb, 'gnomes and goblins can be made once unlocked');
  assert.ok(removeHero(p, gn.id) && removeHero(p, gb.id));
  const b = newHero(p, { name: 'Sorrel Stillwater', race: 'elf', cls: 'mage', sex: 'm' }, 20)!;
  assert.equal(b.sex, 'm');
  assert.equal(p.active, a.id, 'making an alt does not switch to it');
  assert.ok(setActive(p, b.id, 30));
  assert.equal(activeHero(p)!.id, b.id);
  for (let i = p.roster.length; i < MAX_HEROES; i++) assert.ok(newHero(p, { name: 'Edda ' + 'abcdef'[i], race: 'human', cls: 'cleric' }));
  assert.equal(newHero(p, { name: 'One More', race: 'human', cls: 'cleric' }), null, 'six is the most');
  assert.equal(renameHero(p, a.id, 'Gruna'), false, 'a hero you named keeps its name');
  for (const h of p.roster.slice(1)) assert.ok(removeHero(p, h.id));
  assert.equal(p.active, a.id, 'removing the active hero hands over to the oldest');
  assert.equal(removeHero(p, a.id), false, 'the last hero stays');
  // a v6 save with existing heroes migrates to v7 and gives each hero its default sex
  const v6 = { v: 6, rev: 12, roster: [{ id: 'h1', name: 'Brannoc', race: 'dwarf', cls: 'warrior' }, { id: 'h2', name: 'Maren', race: 'human', cls: 'cleric' }], active: 'h1' };
  const m7 = migrate(v6);
  assert.equal(m7.v, PROFILE_VERSION);
  assert.equal(m7.roster[0].sex, 'm');
  assert.equal(m7.roster[1].sex, 'f');
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
  near('barrowguard.helm', 1 / 35);
  near('gravekeeper.tank', 1 / 50);
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
  assert.ok(reg && reg.rar! === 1);
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

test('loot: the regular ladder reaches full Rare in eight clears, then offers traits while Epic comes from sets and weapons', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const { p, h } = withHero('tank');
    const rng = makeRng(seed);
    let n = 0;
    while (SLOT_IDS.some((s) => bestRegular(h, s).rar < 2)) { resolveRun(p, BARROW, clear(h), rng); n++; if (seed % 2) for (const s of SLOT_IDS) putOn(p, h, s); }
    assert.equal(n, 8, 'four slots stepping Common -> Uncommon -> Rare takes 8 clears');
    assert.ok(bestRegular(h, 'weapon').trait, 'reaching Rare on the weapon rolls a trait');
    const r = resolveRun(p, BARROW, clear(h), rng);
    assert.ok(r.drops.find((d) => d.source === 'regular')!.offerTrait);
  }
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
    assert.equal(bestRegular(h, s).rar, WARBAND_CAP, 'regular gear caps at Rare; Epic is earned from sets and boss weapons');
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

test('gear: power runs 1.00 at Common to 1.72 at Epic, sets add bonuses', () => {
  assert.equal(plainLoadout('tank', 0).power, 1);
  assert.ok(Math.abs(plainLoadout('tank', 3).power - 1.72) < 1e-9);
  const { p, h } = withHero('tank');
  for (const id of ['barrowguard.helm', 'barrowguard.shoulders']) { p.collection[id] = { n: 1, kc: 1, at: 0 }; equip(p, h, ITEMS[id].slot, id); }
  const l = loadoutFor(p, h);
  assert.ok(l.bonuses.includes('barrowguard2'));
  assert.ok(!l.bonuses.includes('barrowguard3'));
  assert.equal(equip(p, h, 'chest', 'barrowguard.chest'), false, 'cannot wear what you do not own');
  p.collection['barrowguard.chest'] = { n: 1, kc: 1, at: 0 };
  assert.equal(equip(p, h, 'chest', 'barrowguard.chest'), true);
  assert.ok(loadoutFor(p, h).bonuses.includes('barrowguard3'), '3-piece set bonus is live');
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

test('house: the hearth’s first eight spots keep their ids, and every id is unique', () => {
  const ids = HEARTH_SPOTS.map((s) => s.id);
  for (const id of ['pet.fire', 'pet.rug', 'mount.stall', 'mantel.1', 'mantel.2', 'mantel.3', 'mantel.4', 'banner.wall']) assert.ok(ids.includes(id), id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(HEARTH_SPOTS.length >= 30, 'room for trophies everywhere');
  for (const k of ['pet', 'mount', 'trophy', 'banner']) assert.ok(HEARTH_SPOTS.some((s) => s.kind === k), k);
});

test('house: every thing does something, everything is in a room, and the Barrow door is there', () => {
  const actions = ['dungeons', 'garden', 'gear', 'logs', 'brew', 'satchel'];
  for (const t of THINGS) {
    assert.ok(actions.includes(t.action), t.id);
    assert.ok(ROOMS.some((r) => r.id === t.room), t.id);
  }
  for (const s of HOUSE_SPOTS) assert.ok(ROOMS.some((r) => r.id === s.room), s.id);
  assert.equal(new Set(THINGS.map((t) => t.id)).size, THINGS.length);
  for (const a of actions) assert.ok(THINGS.some((t) => t.action === a), `something in the house does ${a}`);
});

test('house: spots a save has never had fill with what is not on show, once; emptied spots stay empty', () => {
  const p = freshProfile();
  const trophies = Object.values(COLLECTIBLES).filter((c) => c.kind === 'trophy').map((c) => c.id);
  for (const id of trophies) p.collection[id] = { n: 1, kc: 0, at: 1 };
  // an older save: only the mantel was ever used, and its far right was emptied on purpose
  p.hearth.spots = { 'mantel.1': trophies[0], 'mantel.2': trophies[1], 'mantel.3': trophies[2], 'mantel.4': null };
  const q = migrate(JSON.parse(JSON.stringify(p)));
  assert.equal(q.hearth.spots['mantel.4'], null, 'a spot you emptied stays empty');
  assert.equal(q.hearth.spots['mantel.1'], trophies[0], 'nothing you placed moves');
  const shown = Object.values(q.hearth.spots).filter(Boolean);
  assert.equal(shown.length, trophies.length, 'every trophy you own is on show');
  assert.equal(new Set(shown).size, shown.length, 'nothing is in two places');
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(q))).hearth.spots, q.hearth.spots, 'loading again changes nothing');
  const fresh = migrate(JSON.parse(JSON.stringify(freshProfile())));
  assert.ok(Object.values(fresh.hearth.spots).every((v) => v === null), 'a new save has an empty house');
});

test('house looks: a room shows the look you put on it once you have earned it, and the tavern is always yours', () => {
  const { p } = withHero('tank');
  assert.equal(lookOf(p, 'hall'), 'tavern');
  assert.deepEqual(lookProgress(p, 'barrow'), { have: 0, need: 20 });
  assert.equal(setLook(p, 'hall', 'barrow'), false, 'not earned yet');
  assert.equal(setLook(p, 'hall', 'nope'), false);
  p.achievements['barrow.log'] = { at: 1 };
  assert.ok(setLook(p, 'hall', 'barrow'));
  assert.equal(lookOf(p, 'hall'), 'barrow');
  assert.equal(lookOf(p, 'loft'), 'tavern', 'one room at a time');
  assert.equal(setLook(p, 'yard', 'barrow'), false, 'the yard is outside');
  assert.ok(setLook(p, 'house', 'barrow'));
  assert.ok(LOOK_ROOMS.every((r) => lookOf(p, r) === 'barrow'), 'or the whole house');
  assert.ok(setLook(p, 'loft', 'tavern'));
  assert.equal(lookOf(p, 'loft'), 'tavern');
  // the testing switch opens every look, but a look you haven't earned shows as the tavern without it
  const q = withHero('healer').p;
  assert.ok(setLook(q, 'hall', 'barrow', true));
  assert.equal(lookOf(q, 'hall'), 'tavern');
  assert.equal(lookOf(q, 'hall', true), 'barrow');
  // a look from a newer build stays in the save and is drawn as the tavern
  q.hearth.looks.cellar = 'frosthold';
  assert.equal(lookOf(q, 'cellar', true), 'tavern');
  assert.equal(migrate(JSON.parse(JSON.stringify(q))).hearth.looks.cellar, 'frosthold');
});

test('profile: a v5 save gets the tavern in every room, and what is in the house stays', () => {
  const v5: any = JSON.parse(JSON.stringify(freshProfile(1000)));
  v5.v = 5; v5.hearth = { spots: { 'mantel.1': 'trophy.barrow_key', 'pet.rug': null } };
  const p = migrate(v5);
  assert.equal(p.v, PROFILE_VERSION);
  assert.deepEqual(p.hearth.looks, {});
  assert.equal(p.hearth.spots['mantel.1'], 'trophy.barrow_key');
  assert.equal(p.hearth.spots['pet.rug'], null);
  assert.ok(LOOK_ROOMS.every((r) => lookOf(p, r) === 'tavern'));
});

test('collection log: filling the Barrow’s whole log opens Barrow Hall, a title and the Risen, for keeps', () => {
  const { p } = withHero('tank');
  const ach = new Achiever(p, { dungeon: 'barrow', role: 'tank', practice: false, testGear: false });
  assert.deepEqual(logProgress(p, 'barrow'), { have: 0, need: 20 });
  assert.equal(lookOpen(p, 'barrow'), false);
  assert.equal(opened(p, 'race', 'risen'), false);
  assert.ok(['dwarf', 'elf', 'human'].every((r) => opened(p, 'race', r)), 'dwarves, elves and humans are open from the start');
  assert.ok(['gnome', 'goblin', 'orc'].every((r) => !opened(p, 'race', r)), 'the rest wait for dungeons of their own');
  assert.equal(createHero(p, { name: 'Morrow Gravesend', race: 'risen', cls: 'warrior' }), null, 'the Risen are locked');
  // every slot but the last: the log isn't done
  const last = 'barrowguard.helm';
  for (const id of BARROW.collection.filter((x) => x !== last)) { p.collection[id] = { n: 1, kc: 1, at: 1 }; assert.ok(!ach.collected(id).includes('barrow.log')); }
  assert.deepEqual(progress(p, ACHIEVEMENTS['barrow.log']), { have: 19, need: 20 });
  assert.deepEqual(lookProgress(p, 'barrow'), { have: 19, need: 20 });
  p.collection[last] = { n: 1, kc: 1, at: 1 };
  assert.deepEqual(ach.collected(last), ['barrow.log']);
  assert.ok(p.titles.includes('title.gravewarden'));
  assert.ok(lookOpen(p, 'barrow'));
  assert.ok(opened(p, 'race', 'risen'));
  assert.ok(createHero(p, { name: 'Morrow Gravesend', race: 'risen', cls: 'cleric' }), 'now you can make one, any of the four classes');
  // the heroic log is its own: its rewards stay locked
  assert.equal(lookOpen(p, 'barrow-gilded'), false);
  assert.equal(p.collection['cosmetic.gilded_bones'], undefined);
  // earned is for keeps, even if the log had a slot it doesn't have now
  delete p.collection[last];
  assert.ok(opened(p, 'race', 'risen') && lookOpen(p, 'barrow'));
  // a log already full when the save loads counts too
  const q = withHero('dps').p;
  for (const id of DUNGEONS['barrow-heroic'].collection) q.collection[id] = { n: 1, kc: 1, at: 1 };
  assert.ok(new Achiever(q, { dungeon: 'barrow', role: 'dps', practice: false, testGear: false }).check().includes('barrow-heroic.log'));
  assert.ok(q.titles.includes('title.undying'));
  assert.ok(q.collection['cosmetic.gilded_bones'], 'gilded bones for your Risen');
  assert.ok(lookOpen(q, 'barrow-gilded'));
  assert.equal(lookOpen(q, 'barrow'), false, 'and the Barrow’s own log is still its own');
});

test('heroic: opens after ten clears, drops the Barrow’s pieces gilded at the same rates, pays Barrow Marks, keeps its own kill counts', () => {
  const { p, h } = withHero('tank');
  assert.equal(heroicOpen(p, 'barrow'), false);
  dungeonRecord(p, 'barrow').clears = 9;
  assert.deepEqual(heroicProgress(p, 'barrow'), { have: 9, need: 10 });
  dungeonRecord(p, 'barrow').clears = 10;
  assert.ok(heroicOpen(p, 'barrow'));
  const H = heroicVersion('barrow')!;
  assert.equal(H.id, 'barrow-heroic');
  // every line of the Barrow's tables, gilded, at the same rate and for the same role
  const plain = BARROW.loot.flatMap((t) => t.drops), gold = H.loot.flatMap((t) => t.drops);
  assert.deepEqual(gold.map((d) => [d.id, d.rate, d.role]), plain.map((d) => [`${d.id}.gilded`, d.rate, d.role]));
  assert.deepEqual(H.collection, BARROW.collection.map((id) => `${id}.gilded`));
  // a heroic clear counts its own kills and clears, and pays Barrow Marks
  const marks0 = p.dungeons.barrow.marks;
  resolveRun(p, H, clear(h), makeRng(3));
  assert.equal(p.bosses['barrow-heroic.keeper'].kc, 1);
  assert.equal(p.bosses['barrow.keeper'], undefined);
  assert.equal(p.dungeons['barrow-heroic'].clears, 1);
  assert.ok(p.dungeons.barrow.marks > marks0, 'the clear paid a Barrow Mark');
  assert.equal(p.dungeons['barrow-heroic'].marks, 0, 'there are no heroic Marks');
  // a gilded piece wears exactly like the plain one: the same set, the same power
  for (const id of ['barrowguard.helm.gilded', 'barrowguard.chest']) { p.collection[id] = { n: 1, kc: 1, at: 1 }; assert.ok(equip(p, h, ITEMS[id].slot, id)); }
  assert.ok(loadoutFor(p, h).bonuses.includes('barrowguard2'), 'gilded and plain count for the same set');
  assert.equal(compareFor(p, h, 'barrowguard.helm')!.verdict, 'same');
});

test('party: you take your hero’s seat, your Warband heroes take the others on Normal (disabled on Heroic), and bots stand in for empty seats', () => {
  const p = freshProfile();
  assert.deepEqual(seats(p).map((s) => s.bot), ['Brannoc', 'Maren', 'Ivy'], 'no hero yet: three bots');
  const tank = newHero(p, { name: 'Hollis Emberhand', race: 'dwarf', cls: 'warrior' })!;
  setActive(p, tank.id, 1);
  const s = seats(p);
  assert.deepEqual(s.map((x) => x.role), ['tank', 'healer', 'dps']);
  assert.equal(s[0].hero?.id, tank.id);
  assert.deepEqual(s.slice(1).map((x) => x.bot), ['Maren', 'Ivy']);
  const healer = newHero(p, { name: 'Wren Ashby', race: 'human', cls: 'cleric' })!;
  assert.deepEqual(heroesFor(p, 'healer').map((h) => h.id), [healer.id]);
  assert.deepEqual(heroesFor(p, 'dps'), []);
  setActive(p, healer.id, 2);
  assert.equal(seats(p)[1].hero?.id, healer.id, 'playing your healer puts you in the healer seat');
  assert.equal(seats(p)[0].hero?.id, tank.id, 'your tank joins the Warband in the tank seat on Normal');
  assert.equal(seats(p)[0].bot, null);
  assert.equal(seats(p)[2].bot, 'Ivy', 'and a bot stands in for the empty DPS seat');
  // Heroic is Friends & Party Finder only: Warband companions are disabled on Heroic
  const hSeats = seats(p, true);
  assert.equal(hSeats[1].hero?.id, healer.id, 'you still take your own seat on Heroic');
  assert.equal(hSeats[0].hero, null, 'Warband tank does not join Heroic');
  assert.equal(hSeats[2].hero, null, 'Warband DPS does not join Heroic');
  const tank2 = newHero(p, { name: 'Brakka Stoutmantle', race: 'dwarf', cls: 'warrior' })!;
  setActive(p, tank2.id, 3);
  assert.deepEqual(heroesFor(p, 'tank').map((h) => h.id), [tank2.id, tank.id], 'the tank you played last comes first');
});

test('party: picking a role switches to your hero of that role you played last, or changes nothing', () => {
  const p = freshProfile();
  const tank = newHero(p, { name: 'Hollis Emberhand', race: 'dwarf', cls: 'warrior' })!;
  const healer = newHero(p, { name: 'Wren Ashby', race: 'human', cls: 'cleric' })!;
  setActive(p, tank.id, 1);
  assert.equal(pickRole(p, 'tank', 2)?.id, tank.id, 'already the tank: nothing to do');
  assert.equal(pickRole(p, 'dps', 3), null, 'no DPS yet');
  assert.equal(p.active, tank.id, 'and nothing changed');
  assert.equal(pickRole(p, 'healer', 4)?.id, healer.id);
  assert.equal(p.active, healer.id, 'now playing the healer');
});

test('loot: each role sees its own set and weapon, with what anyone can get, and every rate is the real one', () => {
  for (const role of ['tank', 'healer', 'dps'] as const) {
    const l = lootFor(BARROW, role);
    assert.equal(l.mine.length, role === 'dps' ? 8 : 4, `${role}: three set pieces and a weapon per class`);
    assert.ok(l.mine.every((d) => d.role === role && ITEMS[d.id]?.role === role), role);
    assert.deepEqual(l.shared.map((d) => d.id), ['trophy.rattlebones_plume', 'dye.ghostly', 'mount.gravehound', 'pet.pint_gravekeeper']);
  }
  assert.equal(lootFor(BARROW, 'dps', 'mage').mine.length, 4);
  assert.equal(lootFor(BARROW, 'dps', 'rogue').mine.length, 4);
  const table = BARROW.loot.flatMap((t) => t.drops);
  for (const d of [...lootFor(BARROW, 'healer').mine, ...lootFor(BARROW, 'healer').shared]) assert.equal(d.rate, table.find((x) => x.id === d.id)!.rate);
});

test('gear: a drop held up against what its role wears says plainly if it is better, and what it adds or takes away', () => {
  const { p, h } = withHero('tank');
  // a new tank in Common: the set helm is 16 item levels, 19.2% damage and 9.6% health better, brings its own perk, and starts the set
  let c = compareFor(p, h, 'barrowguard.helm')!;
  assert.equal(c.verdict, 'better');
  assert.deepEqual(c.ilvl, [10, 26]);
  assert.equal(c.power, 19.2);
  assert.equal(c.health, 9.6);
  assert.deepEqual(c.set, [0, 1]);
  assert.deepEqual([c.gains.map((e) => e.id), c.loses], [['bg_helm'], []]);
  p.collection['barrowguard.helm'] = { n: 1, kc: 1, at: 0 };
  equip(p, h, 'helm', 'barrowguard.helm');
  assert.equal(compareFor(p, h, 'barrowguard.helm')!.verdict, 'wearing');
  // a second piece adds its own perk and turns the set's 2-piece bonus on
  c = compareFor(p, h, 'barrowguard.chest')!;
  assert.deepEqual(c.set, [1, 2]);
  assert.deepEqual(c.gains.map((e) => e.id), ['bg_chest', 'barrowguard2']);
  // a plain Uncommon helm in its place is worse
  assert.equal(compareOn(worn(p, h), 'tank', ITEMS[gearId('tank', 'helm', 1)]).verdict, 'worse');
  // a set chest still beats a plain Epic regular chest because of its higher item level and piece perk
  equip(p, h, 'helm', null); h.regular.chest = { rar: 3 };
  c = compareFor(p, h, 'barrowguard.chest')!;
  assert.equal(c.verdict, 'better');
  assert.equal(c.power, 4.8);
  // the unique axe keeps your unlocked weapon trait active, so it is a pure upgrade over a Rare/Epic regular axe
  h.regular.weapon = { rar: 2, trait: 'wide' };
  c = compareFor(p, h, 'gravekeeper.tank')!;
  assert.equal(c.verdict, 'better');
  assert.deepEqual(c.gains.map((e) => e.id), ['gravedigger']);
  assert.deepEqual(c.loses.map((e) => e.id), []);
  assert.equal(compareFor(p, h, 'rimebone.helm'), null, 'not for this hero');
  // another role's drop goes against your hero of that role, or what a new one would start in
  assert.equal(wearerOf(p, ITEMS['rimebone.helm']), null);
  assert.equal(compareOn(floorWorn(p, 'dps'), 'dps', ITEMS['rimebone.helm']).verdict, 'better');
  const mage = newHero(p, { name: 'Sorrel Mistvale', race: 'elf', cls: 'mage' })!;
  assert.equal(wearerOf(p, ITEMS['rimebone.helm'])?.id, mage.id);
  assert.equal(wearerOf(p, ITEMS['barrowguard.helm'])?.id, h.id);
  // rogue set pieces and twin daggers fit rogues and not mages
  const rogue = newHero(p, { name: 'Vex Duskveil', race: 'elf', cls: 'rogue' })!;
  assert.equal(wearerOf(p, ITEMS['shadeveil.helm'])?.id, rogue.id);
  assert.equal(compareFor(p, mage, 'shadeveil.helm'), null, 'rogue set does not fit mage');
  assert.equal(compareFor(p, rogue, 'rimebone.helm'), null, 'mage set does not fit rogue');
  assert.equal(compareFor(p, rogue, 'shadeveil.helm')?.verdict, 'better');
  assert.equal(compareFor(p, rogue, 'gravekeeper.rogue')?.verdict, 'better');
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
  for (const t of THINGS) if (!sprites[t.sprite]) missing.push('sprite ' + t.sprite + ' for ' + t.id);
  for (const n of ['bunk_a', 'bunk_b', 'bunk_c', 'bricked_arch', 'weapon_rack', 'table', 'stool', 'woodpile', 'torch', 'candles', 'skullpile', 'gfire_a', 'gfire_b', 'coffin', 'tomb1', 'bones', 'wisp']) if (!sprites[n]) missing.push('sprite ' + n);
  // every hero a race and class can be drawn as (male and female), front and back, and gilded for the Risen
  for (const art of allHeroArt()) for (const v of ['_f', '_b', ...(art.startsWith('risen') ? ['_gilded_f', '_gilded_b'] : [])]) if (!sprites[art + v]) missing.push('sprite ' + art + v);
  for (const r of Object.values(RACES)) if (!tiles[r.icon]) missing.push('icon ' + r.icon + ' for race ' + r.id);
  for (const c of Object.values(CLASSES)) if (!tiles[c.icon]) missing.push('icon ' + c.icon + ' for class ' + c.id);
  for (const n of ['npc_gnome', 'cauldron', 'bed', 'bed_sprout', 'bed_grow', 'node_moonpetal', 'node_moonpetal_shim', 'node_glowcap', 'node_bramble', 'pet_rootling_calm']) if (!sprites[n]) missing.push('sprite ' + n);
  for (const n of ['g_seed_glowcap', 'g_seed_moonpetal', 'g_seed_bramble']) if (!tiles[n]) missing.push('icon ' + n);
  for (const x of [...Object.values(INGREDIENTS), ...Object.values(RECIPES)]) if (!tiles[x.icon]) missing.push('icon ' + x.icon + ' for ' + x.id);
  for (const n of ['s_gather', 's_brew']) if (!tiles[n]) missing.push('icon ' + n);
  for (const c of Object.values(COLLECTIBLES)) if (c.kind === 'mount' && !c.saddle) missing.push('saddle for ' + c.id);
  for (const n of ['slam', 'cleave', 'smite', 'icicle', 'shield', 'charge', 'circle', 'ward', 'sunburst', 'blizzard', 'nova', 'comet', 'viper', 'ambush', 'flurry', 'shadowstep', 'dodge', 'mend', 'marks']) if (!tiles[n]) missing.push('icon ' + n);
  assert.deepEqual(missing, []);
});

test('onboarding: a fresh profile plays the intro run once, existing heroes skip it, and the first hero triggers the hearth tour', () => {
  const p = freshProfile();
  assert.equal(needsIntroRun(p), true, 'a fresh save starts on the intro run');
  assert.equal(needsHearthTour(p), false);
  finishIntroRun(p);
  assert.equal(needsIntroRun(p), false, 'finishing or skipping the intro marks it done');
  // an existing save that already has a hero never needs the intro run or tour unless asked
  const existing = freshProfile();
  newHero(existing, { name: 'Brannoc', race: 'dwarf', cls: 'warrior' });
  assert.equal(needsIntroRun(existing), false);
  assert.equal(needsHearthTour(existing), false);
  // making the first hero starts the hearth tour, and finishing it closes it
  newHero(p, { name: 'Hollis Coalbeard', race: 'dwarf', cls: 'warrior' });
  startHearthTour(p);
  assert.equal(needsHearthTour(p), true);
  finishHearthTour(p);
  assert.equal(needsHearthTour(p), false);
});

test('gear-driven power & boss weapons: power comes strictly from worn gear and Boss Weapons grant signature ability buffs', () => {
  const { p, h } = withHero('tank');
  assert.equal(loadoutFor(p, h).power, 1);
  // Clearing dungeons without equipping gear does not inflate power
  resolveRun(p, BARROW, clear(h), makeRng(1));
  assert.equal(loadoutFor(p, h).power, 1, 'power comes strictly from worn gear');
  // All 4 Barrow Crypt boss weapons surface their signature ability buffs in effectsOf
  const weapons = [
    { id: 'gravekeeper.tank', role: 'tank' as const, cls: 'warrior' as const, race: 'dwarf' as const, effect: 'gravedigger', match: 'Charge resets Cleave' },
    { id: 'gravekeeper.healer', role: 'healer' as const, cls: 'cleric' as const, race: 'human' as const, effect: 'longnight', match: 'Sunburst sears nearby foes' },
    { id: 'gravekeeper.dps', role: 'dps' as const, cls: 'mage' as const, race: 'elf' as const, effect: 'gravefrost', match: 'Rime burst resets Icicle' },
    { id: 'gravekeeper.rogue', role: 'dps' as const, cls: 'rogue' as const, race: 'elf' as const, effect: 'cryptfangs', match: 'Shadowstep resets Shadowstrike' },
  ];
  for (const w of weapons) {
    const hero = newHero(p, { name: `Hero ${w.cls}`, race: w.race, cls: w.cls })!;
    p.collection[w.id] = { n: 1, kc: 1, at: 1 };
    assert.ok(equip(p, hero, 'weapon', w.id));
    const effs = effectsOf(loadoutFor(p, hero), w.role);
    const found = effs.find((e) => e.id === w.effect);
    assert.ok(found && found.desc.includes(w.match), `${w.id} includes ability buff: ${w.match}`);
  }
});

test('gnomes and goblins: every class, sex, ladder armour tier, and Barrow Epic set & weapon equips cleanly', () => {
  const epicKits = {
    warrior: { set: 'barrowguard', weapon: 'gravekeeper.tank' },
    cleric: { set: 'candlewake', weapon: 'gravekeeper.healer' },
    mage: { set: 'rimebone', weapon: 'gravekeeper.dps' },
    rogue: { set: 'shadeveil', weapon: 'gravekeeper.rogue' },
  } as const;
  for (const race of ['gnome', 'goblin'] as const) {
    for (const cls of ['warrior', 'cleric', 'mage', 'rogue'] as const) {
      for (const sex of ['m', 'f'] as const) {
        const p = freshProfile();
        const h = newHero(p, { name: `${race} ${cls} ${sex}`, race, cls, sex, free: true })!;
        assert.ok(h, `created ${race} ${cls} (${sex})`);
        // Tier 0: Common rags (score 10)
        assert.equal(Math.round(loadoutFor(p, h).score), 10);
        // Tier 1: Uncommon iron/leather/linen (score 14)
        for (const slot of SLOT_IDS) { h.bag[slot] = { rar: 1 }; assert.ok(putOn(p, h, slot)); }
        assert.equal(Math.round(loadoutFor(p, h).score), 14);
        // Tier 2: Rare steel/plate/silk (score 18)
        for (const slot of SLOT_IDS) { h.bag[slot] = { rar: 2 }; assert.ok(putOn(p, h, slot)); }
        assert.equal(Math.round(loadoutFor(p, h).score), 18);
        // Tier 3: Full Epic Barrow 3-piece set + Boss Weapon (score 26)
        const kit = epicKits[cls];
        for (const slot of ['helm', 'shoulders', 'chest'] as const) {
          const id = `${kit.set}.${slot}`;
          p.collection[id] = { n: 1, kc: 1, at: 1 };
          assert.ok(equip(p, h, slot, id), `${race} ${cls} equips ${id}`);
        }
        p.collection[kit.weapon] = { n: 1, kc: 1, at: 1 };
        assert.ok(equip(p, h, 'weapon', kit.weapon), `${race} ${cls} equips ${kit.weapon}`);
        const L = loadoutFor(p, h);
        assert.equal(Math.round(L.score), 26);
        assert.equal(L.sets[kit.set], 3);
        assert.equal(L.unique, ITEMS[kit.weapon].effect);
      }
    }
  }
});

test('stepped dungeon tiers: Tier 1 is ilvl 26, Tier 2 is ilvl 34, and Tier 3 is ilvl 42', () => {
  // Tier 1 Barrow Epic set piece & boss weapon -> ilvl 26
  assert.equal(itemScore(ITEMS['barrowguard.helm']), 26);
  assert.equal(itemScore(ITEMS['gravekeeper.tank']), 26);
  // Tier 2 dungeon Epic -> ilvl 34
  const tier2Helm = { ...ITEMS['barrowguard.helm'], id: 'thimble.helm', tier: 2 as const };
  assert.equal(itemScore(tier2Helm), 34);
  // Tier 3 dungeon Epic -> ilvl 42
  const tier3Weapon = { ...ITEMS['gravekeeper.tank'], id: 'moonmere.tank', tier: 3 as const };
  assert.equal(itemScore(tier3Weapon), 42);
});

