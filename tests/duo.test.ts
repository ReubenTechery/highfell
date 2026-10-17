/// <reference types="node" />
/**
 * The duo rework's plumbing (docs/duo.md, docs/duo-agents.md): heroes known by seat and class, a run's party as a
 * list of seats, the ranger's keys, and the contracts every workstream codes against (src/dungeon/duo.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtHero, hurtMob } from '../src/dungeon/entities.js';
import { COMBO, DUEL_KEYS, combo, comboFor, duelAdd, heroAt, isDown, mateOf, pickUp, seatOf, setUp } from '../src/dungeon/duo.js';
import { AB, abKey, fillerOf } from '../src/content/roles';
import { gearKey, gearKeyOf } from '../src/content/gear';
import { CLASSES, CLASS_ORDER } from '../src/content/folk';
import { DEFAULT_KEYS } from '../src/content/keys';
import { COMPANION_FOR, companionFor, companionOf, heroCompanionsOpen, setCompanion } from '../src/meta/party';
import { PROFILE_VERSION, freshProfile, gearRole, migrate } from '../src/meta/profile';
import { fitsHero, floorWorn, newHero, trialWeapon, worn } from '../src/meta/gear';
import { lootFor, regularDrop, rollTable } from '../src/meta/loot';
import { classChoices, mustPickClass, pickClass } from '../src/meta/newclass';
import { WARBAND_KEY } from '../src/meta/warband';
import { ITEMS } from '../src/content';
import { SLOT_IDS, TRAITS, gearId } from '../src/content/gear';
import { BARROW } from '../src/content/barrow';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { simRun } from '../src/sim/run';

const pair = (a = 'warrior', b = 'mage') => {
  newGame(BARROW_ENGINE, { seed: 7, start: 'entrance', auto: false, quiet: true, noEvents: true, party: [{ cls: a, isPlayer: true }, { cls: b }] });
  return S as any;
};
const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };

test('duo: a run can be a party of seats: two heroes, known by seat and class', () => {
  const s = pair('rogue', 'mage');
  assert.equal(s.heroes.length, 2);
  assert.deepEqual(s.heroes.map((h: any) => [h.id, h.seat, h.cls]), [['h0', 0, 'rogue'], ['h1', 1, 'mage']]);
  assert.equal(s.player, heroAt(0), 'the player sits where the party says');
  assert.equal(heroAt(1).cls, 'mage');
  assert.equal(mateOf(heroAt(0)), heroAt(1));
  assert.equal(mateOf(heroAt(1)), heroAt(0));
  assert.equal(seatOf(heroAt(1)), 1);
  // two heroes of the old same role (both DPS) are still two heroes
  assert.notEqual(heroAt(0).id, heroAt(1).id);
  // they stand side by side at the door, a step apart
  assert.ok(Math.abs(heroAt(0).x - heroAt(1).x) >= 60 && Math.abs(heroAt(0).y - heroAt(1).y) < 1);
  step(2);
  assert.ok(s.heroes.every((h: any) => h.alive), 'a pair runs');
});

test('duo: the old three seats still come by role, now with seats and ids', () => {
  newGame(BARROW_ENGINE, { role: 'healer', seed: 7, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: {} });
  const s = S as any;
  assert.deepEqual(s.heroes.map((h: any) => [h.id, h.seat, h.role]), [['h0', 0, 'tank'], ['h1', 1, 'healer'], ['h2', 2, 'dps']]);
  assert.equal(s.player.role, 'healer');
  const tank = heroAt(0);
  assert.ok(tank.y < heroAt(1).y, 'the tank still stands in front');
});

test('duo: the duel card counts damage, the biggest crit, and what the streams add', () => {
  const s = pair();
  const h = heroAt(0), mob = s.mobs.find((m: any) => m.alive && !m.isBoss && !m.M.thing && !m.M.wisp);
  assert.deepEqual(Object.keys(s.duel[h.id]), DUEL_KEYS);
  const got = hurtMob(mob, 50, h, { crit: 1 });
  assert.equal(s.duel[h.id].dmg, got);
  assert.equal(s.duel[h.id].bigCrit, got);
  hurtMob(mob, 10, h, { noCrit: true });
  assert.equal(s.duel[h.id].bigCrit, got, 'a smaller hit is no new biggest crit');
  duelAdd(h, 'lifts');
  duelAdd(h, 'keys', 2);
  assert.equal(s.duel[h.id].lifts, 1);
  assert.equal(s.duel[h.id].keys, 2);
  assert.equal(s.duel[heroAt(1).id].dmg, 0, 'each hero has their own card');
});

test('duo: a combo is a payoff on a foe your mate set up, and it counts for both of you', () => {
  const s = pair();
  const [a, b] = [heroAt(0), heroAt(1)];
  const mob = s.mobs.find((m: any) => m.alive && !m.isBoss && !m.M.thing && !m.M.wisp);
  assert.equal(comboFor(mob, a), null, 'nothing set up');
  setUp(mob, a, 'stun');
  assert.equal(comboFor(mob, a), null, 'your own setup is never your combo');
  assert.equal(comboFor(mob, b), 'stun', 'your mate can cash it in');
  combo(b, mob, 'stun');
  assert.equal(s.duel[b.id].combosLanded, 1);
  assert.equal(s.duel[a.id].combosSet, 1);
  assert.equal(COMBO, 1.5);
  // a setup runs out
  setUp(mob, a, 'freeze', 1);
  delete mob.setups.stun;
  s.t += 1.5;
  assert.equal(comboFor(mob, b), null, 'an old setup is no combo');
});

test('duo: a hero at zero still falls as before until stream 2 makes it going down; dodges reach the hook', () => {
  const s = pair();
  const h = heroAt(1);
  assert.equal(isDown(h), false);
  assert.equal(pickUp(h, heroAt(0)), false, 'nothing to pick up yet');
  h.iframe = 0.3;
  assert.equal(hurtHero(h, 999, null, {}), 0, 'a dodge takes the hit');
  h.iframe = 0;
  hurtHero(h, 99999, null, { pierce: true, block: false });
  assert.equal(h.alive, false);
  assert.ok(s.heroes.some((o: any) => o.alive));
});

test('duo: the ranger has its own buttons and keys, wears what the code calls healer gear, and isn\'t offered yet', () => {
  assert.equal(gearKeyOf('ranger'), 'healer');
  assert.equal(gearKey({ role: 'dps', cls: 'ranger' }), 'healer');
  assert.equal(abKey({ role: 'dps', cls: 'ranger' }), 'ranger');
  assert.equal(abKey({ role: 'dps', cls: 'mage' }), 'dps');
  assert.equal(fillerOf('ranger').def.key, 'quickshot');
  assert.ok(AB.ranger.a1.filler && DEFAULT_KEYS.ranger.a1 === 'KeyE');
  assert.equal(CLASSES.ranger.ready, false);
  assert.ok(!CLASS_ORDER.includes('ranger'), 'the hero maker doesn\'t offer it until its stream lands');
  // the other classes keep their keys
  assert.equal(gearKeyOf('warrior'), 'tank');
  assert.equal(gearKeyOf('cleric'), 'healer');
  assert.equal(gearKeyOf('mage'), 'dps');
  assert.equal(gearKeyOf('rogue'), 'rogue');
});

test('duo: the bot that takes the other seat fills the gap, in close with someone at range', () => {
  for (const cls of Object.keys(CLASSES)) assert.ok(COMPANION_FOR[cls as keyof typeof COMPANION_FOR], cls);
  assert.equal(companionFor('warrior'), 'mage');
  assert.equal(companionFor('mage'), 'warrior');
  assert.equal(companionFor('rogue'), 'mage');
  assert.equal(companionFor('ranger'), 'warrior');
});

test('duo: a pair of bots runs a dungeon in the sims, each seat counted on its own', () => {
  const r = simRun({ role: 'dps', seed: 11, party: [{ cls: 'mage', isPlayer: true }, { cls: 'warrior' }], maxT: 60, maxWipes: 2 });
  assert.equal(r.heroes.length, 2);
  assert.deepEqual(r.heroes.map((h) => [h.seat, h.cls]), [[0, 'mage'], [1, 'warrior']]);
  assert.ok(r.heroes.some((h) => h.dmg > 0), 'they fight');
});

test('duo: your companion is the one you picked (a bot of a class, or one of your other heroes once the hero you play has a full set of Rare), else the bot that fills the gap', () => {
  const p = freshProfile(1);
  const me = newHero(p, { name: 'Orvik Anvilsong', race: 'dwarf', cls: 'warrior' })!;
  assert.deepEqual(companionOf(p, me), { cls: 'mage', hero: null }, 'nobody picked: the bot that fills the gap');
  setCompanion(p, 'cls:rogue');
  assert.deepEqual(companionOf(p, me), { cls: 'rogue', hero: null });
  setCompanion(p, 'cls:ranger');
  assert.deepEqual(companionOf(p, me), { cls: 'mage', hero: null }, 'a class nobody can play yet falls back');
  setCompanion(p, 'h_gone');
  assert.deepEqual(companionOf(p, me), { cls: 'mage', hero: null }, 'a hero you no longer have falls back');
  // your other heroes come once your Warband is open (meta/warband.ts) and the hero you play wears Rare everywhere
  p.counters[WARBAND_KEY] = 1;
  const alt = newHero(p, { name: 'Lisel Brightwater', race: 'elf', cls: 'mage' })!;
  setCompanion(p, alt.id);
  assert.equal(heroCompanionsOpen(p, me), false, 'a hero in Common climbs to Rare on its own');
  assert.deepEqual(companionOf(p, me), { cls: 'mage', hero: null }, 'until then a bot of the class you picked');
  for (const s of ['weapon', 'helm', 'shoulders'] as const) me.regular[s] = { rar: 2 };
  assert.equal(heroCompanionsOpen(p, me), false, 'three Rare pieces isn\'t a full set');
  me.regular.chest = { rar: 2 };
  assert.equal(heroCompanionsOpen(p, me), true);
  assert.equal(companionOf(p, me).hero, alt);
  assert.equal(companionOf(p, me).cls, 'mage');
  assert.equal(companionOf(p, alt).hero, null, 'never yourself');
});

test('duo: saves from before the duo (v11) keep everything and have no companion picked yet', () => {
  assert.equal(PROFILE_VERSION, 12);
  const old = { ...freshProfile(1), v: 11 } as Record<string, unknown>;
  delete old.companion;
  const p = migrate(old, 2);
  assert.equal(p.v, 12);
  assert.equal(p.companion, null);
  const kept = migrate({ ...freshProfile(1), companion: 'cls:rogue' }, 2);
  assert.equal(kept.companion, 'cls:rogue', 'a v12 save keeps its pick');
});

const owned = { n: 1, kc: 1, at: 0 };
const ids = (ds: { id: string }[]) => ds.map((d) => d.id).sort();

test('duo: the ranger wears, rolls and raises what the cleric did, and the other classes keep theirs', () => {
  const p = freshProfile(1);
  p.counters[WARBAND_KEY] = 1;
  const cleric = newHero(p, { name: 'Anwen Lightfoot', race: 'human', cls: 'cleric' })!;
  const ranger = newHero(p, { name: 'Tamsin Reedwater', race: 'human', cls: 'cleric' })!;
  ranger.cls = 'ranger';
  assert.deepEqual(['warrior', 'cleric', 'mage', 'rogue', 'ranger'].map((cls) => gearRole({ cls })), ['tank', 'healer', 'dps', 'dps', 'healer']);
  // its pieces: the cleric's old sets and weapons, nobody else's
  assert.ok(fitsHero(ITEMS['candlewake.helm'], ranger) && fitsHero(ITEMS['gravekeeper.healer'], ranger));
  for (const id of ['rimebone.helm', 'shadeveil.helm', 'barrowguard.helm']) assert.ok(!fitsHero(ITEMS[id], ranger), id);
  for (const [cls, yes, no] of [['mage', 'rimebone.helm', 'shadeveil.helm'], ['rogue', 'shadeveil.helm', 'rimebone.helm'], ['warrior', 'barrowguard.helm', 'candlewake.helm']]) {
    assert.ok(fitsHero(ITEMS[yes], { cls }) && !fitsHero(ITEMS[no], { cls }), cls);
  }
  p.collection['candlewake.helm'] = owned;
  ranger.equip.helm = 'candlewake.helm';
  assert.equal(worn(p, ranger).helm.def.id, 'candlewake.helm');
  // the tables: every line that would roll for the cleric rolls for the ranger (a roll of 0 hits every line it can)
  for (const t of BARROW.loot) assert.deepEqual(ids(rollTable(t, gearRole(ranger), () => 0, 'ranger')), ids(rollTable(t, 'healer', () => 0, 'cleric')), t.boss);
  assert.deepEqual(ids(lootFor(BARROW, 'dps', 'ranger').mine), ids(lootFor(BARROW, 'healer', 'cleric').mine));
  assert.equal(trialWeapon('dps', 'ranger'), trialWeapon('healer', 'cleric'));
  // the ladder: a ranger's piece is the healer's and raises the floor the cleric shares
  const d = regularDrop(p, ranger, () => 0);
  assert.equal(d.role, 'healer');
  assert.equal(d.id, gearId('healer', d.slot!, 1));
  assert.equal(p.warband.healer[d.slot!].rar, 1);
  assert.equal(cleric.bag[d.slot!]?.rar, 1, 'the cleric gets it in the bag too');
  assert.equal(floorWorn(p, 'dps', 'ranger')[d.slot!].def.id, gearId('healer', d.slot!, 1));
});

test('duo: a hero whose class retired picks a new one once, keeping its race, name, ladder and title', () => {
  const p = freshProfile(1);
  p.counters[WARBAND_KEY] = 1;
  const h = newHero(p, { name: 'Anwen Lightfoot', race: 'human', cls: 'cleric' })!;
  const gnome = newHero(p, { name: 'Pip Cogsworth', race: 'gnome', cls: 'cleric', free: true })!;
  assert.equal(mustPickClass(h), false, 'nothing has retired yet');
  assert.equal(pickClass(p, h, 'rogue'), false);
  const cleric = CLASSES.cleric as { retired?: boolean };
  cleric.retired = true;
  try {
    assert.equal(mustPickClass(h), true);
    assert.deepEqual(classChoices(h), ['rogue'], 'a human can be a rogue (and a ranger once it lands)');
    assert.deepEqual(classChoices(gnome), ['warrior', 'mage', 'rogue']);
    for (const s of SLOT_IDS) h.regular[s] = { rar: 2 };
    h.regular.weapon.trait = TRAITS.healer[0].id;
    for (const id of ['candlewake.helm', 'candlewake.chest', 'shadeveil.chest']) p.collection[id] = owned;
    h.equip.helm = 'candlewake.helm';
    h.fresh = ['candlewake.chest'];
    h.spec = 'light';
    h.talents = { light: { t1: 1 } };
    Object.assign(h, { title: 'title.bonebreaker', clears: 7 });
    assert.equal(pickClass(p, h, 'warrior'), false, 'a human can\'t be a warrior');
    assert.ok(pickClass(p, h, 'rogue'));
    assert.deepEqual([h.cls, h.name, h.race, h.sex, h.title, h.clears, h.spec], ['rogue', 'Anwen Lightfoot', 'human', 'f', 'title.bonebreaker', 7, null]);
    assert.deepEqual(h.talents, { light: { t1: 1 } }, 'the old spec\'s points stay in the save');
    assert.ok(SLOT_IDS.every((s) => h.regular[s].rar === 2), 'its ladder comes along');
    assert.ok(TRAITS.rogue.some((t) => t.id === h.regular.weapon.trait), 'its Rare weapon has a rogue trait');
    assert.equal(h.equip.helm, null, 'the cleric piece comes off');
    assert.ok(p.collection['candlewake.helm'], 'and stays yours');
    assert.deepEqual(h.fresh, ['shadeveil.chest'], 'the rogue pieces you own glow for it');
    assert.equal(worn(p, h).weapon.def.id, gearId('rogue', 'weapon', 2));
    assert.equal(mustPickClass(h), false);
    assert.equal(pickClass(p, h, 'rogue'), false, 'once');
  } finally {
    delete cleric.retired;
  }
});
