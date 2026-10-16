/// <reference types="node" />
/**
 * Heroic = Normal loot + gilding kits. A Heroic kill rolls its dungeon's normal tables (the pieces are the
 * normal ones, for the normal log, the normal kill count and your heroes), then its own: a gilding kit for
 * each unique, for any seat. A kit is the gilded look of one piece, for good, across the Warband, and never
 * power. The Heroic log is the kits; the gilded pet, mount and plume are a bonus.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng';
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, ITEMS, KITS, checkContent, itemOf } from '../src/content';
import { BARROW } from '../src/content/barrow';
import { KIT_RATE, gilded } from '../src/content/kits';
import { TEMPLATE_DUNGEON } from '../src/content/_template';
import { TEMPLATE_HEROIC_BUNDLE } from '../src/content/_template/heroic';
import { TEMPLATE_ITEMS } from '../src/content/_template/items';
import { PROFILE_VERSION, freshProfile, migrate, setActive, type Hero, type Profile } from '../src/meta/profile';
import { HEROIC_AFTER, gildOf, heroicOpen, lootFor, resolveKill, resolveRun, rollTable, runLoot, tellOf, type Drop } from '../src/meta/loot';
import { equip, gildedOn, loadoutFor, lookId, newHero, ownedFor, setGilded, worn } from '../src/meta/gear';
import { logDone, logProgress, logSlots, shelfOf, standPieces, standsOf } from '../src/meta/logs';
import { Achiever } from '../src/meta/achievements';
import { lookOpen } from '../src/meta/hearth';
import { newGame } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { WALKOUT_LEN, startWalkout, tickWalkout } from '../src/dungeon/walkout.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import WARDROBE from '../art/wardrobe.json';

const H = DUNGEONS['barrow-heroic'];
/** the Barrow's sixteen uniques (twelve set pieces and four boss weapons), in its log's order */
const UNIQUES = BARROW.collection.filter((id) => ITEMS[id] && ITEMS[id].kind !== 'gear');
/** every line hits */
const always = () => 0;
/** no line hits */
const never = () => 0.999999;

const HERO = { tank: { race: 'dwarf', cls: 'warrior' }, healer: { race: 'human', cls: 'cleric' }, dps: { race: 'elf', cls: 'mage' } } as const;
function withHero(role: 'tank' | 'healer' | 'dps' = 'tank', p: Profile = freshProfile()): { p: Profile; h: Hero } {
  const h = newHero(p, { name: 'Test ' + role, ...HERO[role] })!;
  setActive(p, h.id);
  return { p, h };
}
const clear = (hero: Hero) => ({ hero, bosses: ['knight', 'keeper'], bossTimes: { knight: 70, keeper: 140 }, cleared: true, practice: false, time: 290 });
const own = (p: Profile, id: string, kc = 1, at = 1) => { p.collection[id] = { n: 1, kc, at }; };

test('heroic: its own tables are a kit for every unique, for any seat at one rate, and the gilded pet, mount and plume', () => {
  assert.deepEqual(checkContent(), []);
  assert.equal(KIT_RATE, 1 / 20);
  assert.equal(UNIQUES.length, 16);
  assert.deepEqual(Object.keys(KITS).sort(), UNIQUES.map(gilded).sort(), 'one kit per unique, named for the piece it gilds');
  for (const id of UNIQUES) {
    const k = KITS[gilded(id)];
    assert.equal(k.item, id);
    assert.equal(ITEMS[k.id], undefined, 'a kit is not gear');
    assert.equal(itemOf(k.id), ITEMS[id], 'it gilds its piece');
  }
  const keeper = H.loot.find((t) => t.boss === 'keeper')!, knight = H.loot.find((t) => t.boss === 'knight')!;
  const kits = keeper.drops.filter((d) => KITS[d.id]);
  assert.deepEqual(kits.map((d) => d.id), UNIQUES.map(gilded), 'the Gravekeeper drops the pieces, so he drops their kits');
  assert.ok(kits.every((d) => d.rate === KIT_RATE && !d.role && !d.cls), 'any seat, one rate');
  const rest = keeper.drops.filter((d) => !KITS[d.id]).map((d) => [d.id, d.rate]);
  assert.deepEqual(rest, [['mount.gravehound.gilded', 1 / 1000], ['pet.pint_gravekeeper.gilded', 1 / 2500]], 'the gilded mount and pet at their normal rates');
  assert.deepEqual(knight.drops, [{ id: 'trophy.rattlebones_plume.gilded', rate: 1 / 50 }]);
  assert.ok(!H.loot.some((t) => t.drops.some((d) => d.id === 'dye.ghostly.gilded')), 'the Gravegold Dye no longer drops');
  assert.equal(COLLECTIBLES['dye.ghostly.gilded'].retired, true, 'but whoever has it keeps it');
  // the dungeon sheet lists each kit with the role whose piece it gilds, and what anyone can get after
  assert.deepEqual(lootFor(H, 'tank').mine.map((d) => d.id), ['barrowguard.helm', 'barrowguard.shoulders', 'barrowguard.chest', 'gravekeeper.tank'].map(gilded));
  assert.deepEqual(lootFor(H, 'dps', 'rogue').mine.map((d) => d.id), ['shadeveil.helm', 'shadeveil.shoulders', 'shadeveil.chest', 'gravekeeper.rogue'].map(gilded));
  assert.deepEqual(lootFor(H, 'healer').shared.map((d) => d.id), ['trophy.rattlebones_plume.gilded', 'mount.gravehound.gilded', 'pet.pint_gravekeeper.gilded']);
});

test('heroic: a kill rolls the Barrow’s own table first, line for line with its role locks, then every kit for any seat', () => {
  const { p, h } = withHero('healer');
  const ids = resolveKill(p, H, 'keeper', h, 140, always).drops.map((d) => d.id);
  const mine = BARROW.loot.find((t) => t.boss === 'keeper')!.drops.filter((d) => !d.role || (d.role === 'healer' && !d.cls)).map((d) => d.id);
  assert.deepEqual(ids.filter((id) => !id.endsWith('.gilded')), mine, 'the normal pieces, by their normal ids');
  assert.ok(!ids.includes('barrowguard.helm'), 'the normal table keeps its role locks');
  for (const id of UNIQUES) assert.ok(ids.includes(gilded(id)), `a healer can get ${id}'s kit`);
  // each line rolls at its own rate: the kits too
  const keeper = H.loot.find((t) => t.boss === 'keeper')!, rng = makeRng(11), N = 100000, hits: Record<string, number> = {};
  for (let i = 0; i < N; i++) for (const d of rollTable(keeper, 'tank', rng)) hits[d.id] = (hits[d.id] || 0) + 1;
  for (const id of ['candlewake.helm.gilded', 'gravekeeper.rogue.gilded']) {
    const exp = N * KIT_RATE, sd = Math.sqrt(N * KIT_RATE * (1 - KIT_RATE));
    assert.ok(Math.abs((hits[id] || 0) - exp) < 4 * sd, `${id}: got ${hits[id] || 0}, expected about ${exp}`);
  }
});

test('heroic: what drops counts for the Barrow’s log, kill count and gear; Heroic keeps its own kill count, clears and best time', () => {
  const { p, h } = withHero('tank');
  resolveRun(p, BARROW, clear(h), never);
  const marks = p.dungeons.barrow.marks;
  const r = resolveRun(p, H, { ...clear(h), bossTimes: { knight: 50, keeper: 100 } }, always);
  // the Barrow's table rolled, so the Barrow's kill count counts it (but a Heroic kill time is not a Normal best)
  assert.equal(p.bosses['barrow.keeper'].kc, 2);
  assert.equal(p.bosses['barrow.keeper'].pb, 140, 'the Normal best is the Normal kill');
  assert.equal(p.bosses['barrow-heroic.keeper'].kc, 1);
  assert.equal(p.bosses['barrow-heroic.keeper'].pb, 100);
  assert.equal(p.dungeons.barrow.clears, 1, 'clears stay per mode');
  assert.equal(p.dungeons['barrow-heroic'].clears, 1);
  assert.deepEqual(r.kc, { knight: 1, keeper: 1 }, 'the chest shows Heroic’s own kill counts');
  // the normal pieces are the Barrow's own, at the Barrow's kill count, for the Barrow's log
  const helm = r.drops.find((d) => d.id === 'barrowguard.helm')!;
  assert.equal(helm.kc, 2);
  assert.ok(helm.isNew && helm.toEquip);
  assert.ok(p.collection['barrowguard.helm'] && p.collection['trophy.rattlebones_plume']);
  assert.deepEqual(logProgress(p, 'barrow'), { have: 5, need: 17 }, 'the tank’s set, weapon and the plume');
  // they wait to be put on, like any drop, and wear like any drop
  assert.ok(h.fresh.includes('barrowguard.helm') && h.fresh.includes('gravekeeper.tank'));
  for (const s of ['helm', 'shoulders', 'chest'] as const) assert.ok(equip(p, h, s, `barrowguard.${s}`));
  assert.ok(loadoutFor(p, h).bonuses.includes('barrowguard3'));
  // the kits come from Heroic's own table, on its kill count, for the Heroic log
  const kit = r.drops.find((d) => d.id === 'rimebone.chest.gilded')!;
  assert.equal(kit.kc, 1);
  assert.equal(kit.toEquip, undefined, 'a kit is never something to put on');
  assert.deepEqual(logProgress(p, 'barrow-heroic'), { have: 16, need: 16 });
  assert.ok(p.dungeons.barrow.marks > marks, 'Heroic pays Barrow Marks');
  assert.equal(p.dungeons['barrow-heroic']?.marks || 0, 0);
  // a Heroic run still never opens before ten Normal clears
  assert.equal(HEROIC_AFTER, 10);
  assert.equal(heroicOpen(p, 'barrow'), false);
});

test('heroic: a kit never changes power, and its piece switches between plain and gilded', () => {
  const { p, h } = withHero('tank');
  own(p, 'barrowguard.helm');
  assert.ok(equip(p, h, 'helm', 'barrowguard.helm'));
  const plain = loadoutFor(p, h);
  assert.equal(gildedOn(p, 'barrowguard.helm'), false, 'no kit, no gold');
  assert.equal(setGilded(p, 'barrowguard.helm', true), false);
  own(p, 'barrowguard.helm.gilded');
  assert.equal(gildedOn(p, 'barrowguard.helm'), true, 'a new kit starts gilded, like every look');
  assert.equal(lookId(p, 'barrowguard.helm'), 'barrowguard.helm.gilded', 'its picture and name are the gilded ones');
  assert.deepEqual(loadoutFor(p, h), plain, 'the same power');
  assert.equal(equip(p, h, 'helm', 'barrowguard.helm.gilded'), false, 'you can’t wear a kit');
  assert.equal(worn(p, h).helm.def.id, 'barrowguard.helm');
  assert.deepEqual(ownedFor(p, h, 'helm').map((d) => d.id), ['barrowguard.helm'], 'the armoury lists the piece once');
  assert.ok(setGilded(p, 'barrowguard.helm', false));
  assert.equal(lookId(p, 'barrowguard.helm'), 'barrowguard.helm');
  assert.deepEqual(loadoutFor(p, h), plain, 'plain or gilded, the same power');
  assert.ok(setGilded(p, 'barrowguard.helm', true));
  assert.equal(gildedOn(p, 'barrowguard.helm'), true);
  assert.deepEqual(p.settings.looksOff, [], 'switching back leaves nothing behind');
  // only a piece you own, and only with its kit
  own(p, 'candlewake.helm.gilded');
  assert.equal(setGilded(p, 'candlewake.helm', false), false, 'not without the piece');
  assert.equal(setGilded(p, 'nope', true), false);
  // the gilded look is for every hero of its role: it's the piece's, not the hero's
  const t2 = newHero(p, { name: 'Brask Ironhew', race: 'dwarf', cls: 'warrior' })!;
  assert.ok(equip(p, t2, 'helm', 'barrowguard.helm'));
  assert.equal(lookId(p, worn(p, t2).helm.def.id), 'barrowguard.helm.gilded');
});

test('heroic: its log is the sixteen kits; the gilded pet, mount and plume are a bonus; filling it gives the gilded rewards', () => {
  assert.deepEqual(logSlots('barrow-heroic'), UNIQUES.map(gilded));
  assert.deepEqual(H.bonus, ['trophy.rattlebones_plume.gilded', 'mount.gravehound.gilded', 'pet.pint_gravekeeper.gilded']);
  assert.deepEqual(H.collection, [...UNIQUES.map(gilded), ...H.bonus!]);
  assert.ok(standsOf('barrow-heroic').flatMap(standPieces).every((id) => KITS[id]), 'its stands hold the kits');
  assert.deepEqual(shelfOf('barrow-heroic'), H.bonus);
  for (const id of Object.keys(KITS)) assert.ok((WARDROBE.pieces as Record<string, string>)[id], `${id} has its gilded piece for the stand`);
  const { p } = withHero('dps');
  const ach = new Achiever(p, { dungeon: 'barrow', role: 'dps', practice: false, testGear: false });
  for (const id of UNIQUES.slice(1)) own(p, gilded(id));
  assert.equal(logDone(p, 'barrow-heroic'), false);
  own(p, gilded(UNIQUES[0]));
  assert.deepEqual(ach.collected(gilded(UNIQUES[0])), ['barrow-heroic.log'], 'done without the bonus slots');
  assert.ok(p.titles.includes('title.undying') && p.collection['cosmetic.gilded_bones'] && lookOpen(p, 'barrow-gilded'));
  assert.match(ACHIEVEMENTS['barrow-heroic.log'].how, /pet, mount and plume are a bonus/);
  assert.equal(logDone(p, 'barrow'), false, 'kits never fill the Barrow’s own log');
});

test('heroic: the lantern has a tell for a kit; a unique or the pet beats it, and the gold dust still says a kit is inside', () => {
  const t = (id: string): Drop => ({ id, source: 'table', isNew: true, dupe: false, marks: 0 });
  const reg: Drop = { id: 'tank.helm.1', source: 'regular', isNew: true, dupe: false, marks: 0 };
  assert.equal(tellOf([reg]), 'normal');
  assert.equal(gildOf([reg]), false);
  assert.equal(tellOf([reg, t('barrowguard.helm.gilded')]), 'kit');
  assert.equal(tellOf([t('barrowguard.helm.gilded'), t('gravekeeper.tank')]), 'unique');
  assert.equal(gildOf([t('barrowguard.helm.gilded'), t('gravekeeper.tank')]), true);
  assert.equal(gildOf([t('gravekeeper.tank')]), false);
  assert.equal(tellOf([t('barrowguard.helm.gilded'), t('pet.pint_gravekeeper.gilded')]), 'pet');
  assert.equal(tellOf([t('mount.gravehound.gilded')]), 'unique', 'a gilded mount is a unique, not a kit');
  // the run's loot carries both: the tell and whether gold dust falls
  const { p, h } = withHero('tank');
  const kill = { boss: 'keeper', kc: 1, time: 1, newPb: false, drops: [t('gravekeeper.tank'), t('candlewake.chest.gilded')], marks: 0 };
  const loot = runLoot(p, H, h, [kill], null);
  assert.equal(loot.tell, 'unique');
  assert.equal(loot.gild, true);
  // in the dungeon: a kit's walkout plays its bell; with a unique the knocks come first, then the bell
  for (const [tell, gild, beats] of [['kit', false, ['bell']], ['unique', true, ['knock1', 'knock2', 'bell']], ['unique', false, ['knock1', 'knock2']], ['normal', false, []]] as const) {
    newGame(BARROW_ENGINE, { role: 'tank', seed: 5, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: {} });
    const s = S as any;
    startWalkout(tell, s.player.x, s.player.y, gild);
    for (let i = 0; i < Math.ceil(WALKOUT_LEN[tell] * 60) + 2; i++) tickWalkout(1 / 60);
    const w = s.walkout;
    assert.ok(w.done, `${tell} finishes`);
    assert.deepEqual(['knock1', 'knock2', 'bell'].filter((b) => w.beats.has(b)), beats, `${tell}${gild ? ' with a kit' : ''}`);
  }
});

test('heroic: about half of runs bring a kit, and a whole Heroic log takes tens of runs, not hundreds', () => {
  const keeper = H.loot.find((t) => t.boss === 'keeper')!, rng = makeRng(2026);
  const perRun = 1 - Math.pow(1 - KIT_RATE, 16);
  assert.ok(perRun > 0.5 && perRun < 0.6, `a kit in ${(perRun * 100).toFixed(0)}% of runs`);
  const runs: number[] = [];
  for (let player = 0; player < 2000; player++) {
    const have = new Set<string>();
    let n = 0;
    while (have.size < 16) { n++; for (const d of rollTable(keeper, 'tank', rng)) if (KITS[d.id]) have.add(d.id); }
    runs.push(n);
  }
  runs.sort((a, b) => a - b);
  const mean = runs.reduce((a, b) => a + b, 0) / runs.length, p90 = runs[Math.floor(runs.length * 0.9)];
  assert.ok(mean > 55 && mean < 80, `about 65 runs on average (got ${mean.toFixed(0)})`);
  assert.ok(p90 > 80 && p90 < 120, `1 player in 10 needs about 100 (got ${p90})`);
});

test('saves: a v8 gilded piece becomes the plain piece plus its kit, both logs keep what you found, and nothing is dropped', () => {
  const v8: any = JSON.parse(JSON.stringify(freshProfile(1000)));
  v8.v = 8; v8.rev = 77;
  v8.roster = [
    { id: 'a', name: 'Hollis Emberhand', race: 'dwarf', cls: 'warrior', sex: 'm', regular: {}, bag: {}, fresh: ['gravekeeper.tank.gilded', 'gravekeeper.tank'], title: null, named: true, clears: 30,
      equip: { weapon: null, helm: 'barrowguard.helm.gilded', shoulders: null, chest: 'barrowguard.chest' } },
    { id: 'b', name: 'Wren Ashby', race: 'human', cls: 'cleric', sex: 'f', regular: {}, bag: {}, fresh: [], title: null, named: true, clears: 4, equip: { weapon: null, helm: null, shoulders: null, chest: null } },
  ];
  v8.active = 'a';
  v8.collection = {
    'barrowguard.helm.gilded': { n: 2, kc: 7, at: 100 },
    'barrowguard.chest': { n: 1, kc: 30, at: 50 },
    'barrowguard.chest.gilded': { n: 1, kc: 3, at: 200 },
    'candlewake.helm': { n: 1, kc: 40, at: 300 },
    'candlewake.helm.gilded': { n: 1, kc: 2, at: 90 },
    'gravekeeper.tank.gilded': { n: 1, kc: 9, at: 150 },
    'trophy.rattlebones_plume.gilded': { n: 1, kc: 4, at: 120 },
    'dye.ghostly.gilded': { n: 1, kc: 8, at: 130 },
  };
  v8.seen = { 'barrowguard.helm.gilded': 101 };
  v8.settings = { sound: true, looksOff: ['dye.ghostly'] };
  v8.bosses = { 'barrow.keeper': { kc: 40, pb: 80, wipes: 2 }, 'barrow-heroic.keeper': { kc: 12, pb: 150, wipes: 5 }, 'barrow-heroic.knight': { kc: 13, pb: 60, wipes: 0 } };
  v8.dungeons = { barrow: { runs: 45, clears: 40, pb: 200, marks: 90 }, 'barrow-heroic': { runs: 14, clears: 12, pb: 230, marks: 0 } };
  v8.achievements = { 'barrow.log': { at: 400 } };
  const p = migrate(v8);
  assert.equal(p.v, PROFILE_VERSION);
  assert.equal(PROFILE_VERSION, 9);
  // a gilded piece is the plain piece plus its kit
  assert.deepEqual(p.collection['barrowguard.helm'], { n: 2, kc: 7, at: 100 }, 'a piece you only had gilded is yours plain now');
  assert.deepEqual(p.collection['barrowguard.helm.gilded'], { n: 2, kc: 7, at: 100 }, 'and its kit');
  assert.deepEqual(p.collection['barrowguard.chest'], { n: 2, kc: 30, at: 50 }, 'one you had plain too counts both drops, from the first');
  assert.deepEqual(p.collection['candlewake.helm'], { n: 2, kc: 2, at: 90 }, 'the gilded one came first');
  assert.ok(p.collection['gravekeeper.tank'] && p.collection['gravekeeper.tank.gilded']);
  // the rest stays as it was: the gilded plume, the old dye, what you've seen
  assert.deepEqual(p.collection['trophy.rattlebones_plume.gilded'], { n: 1, kc: 4, at: 120 });
  assert.deepEqual(p.collection['dye.ghostly.gilded'], { n: 1, kc: 8, at: 130 });
  assert.equal(p.seen['barrowguard.helm.gilded'], 101);
  // a hero who wore a gilded piece wears the plain one, gilded; a piece worn plain stays plain
  const a = p.roster.find((x) => x.id === 'a')!;
  assert.equal(a.equip.helm, 'barrowguard.helm');
  assert.equal(a.equip.chest, 'barrowguard.chest');
  assert.equal(lookId(p, 'barrowguard.helm'), 'barrowguard.helm.gilded');
  assert.equal(lookId(p, 'barrowguard.chest'), 'barrowguard.chest');
  assert.equal(lookId(p, 'gravekeeper.tank'), 'gravekeeper.tank.gilded', 'nobody wore it: its kit starts gilded');
  assert.deepEqual(p.settings.looksOff, ['dye.ghostly', 'barrowguard.chest.gilded']);
  assert.deepEqual(a.fresh, ['gravekeeper.tank'], 'what was waiting still waits, once');
  assert.deepEqual(worn(p, a).helm.def.id, 'barrowguard.helm');
  // both logs keep what you found
  assert.deepEqual(logProgress(p, 'barrow-heroic'), { have: 4, need: 16 }, 'the four kits (the plume is a bonus now)');
  assert.equal(logProgress(p, 'barrow').have, 4, 'the plain pieces from the gilded ones fill the Barrow’s log');
  assert.ok(p.achievements['barrow.log'], 'earned stays earned');
  // Heroic kills rolled the Barrow's table, so they count on its kill count, once; Heroic keeps its own
  assert.deepEqual(p.bosses['barrow.keeper'], { kc: 52, pb: 80, wipes: 2 });
  assert.deepEqual(p.bosses['barrow.knight'], { kc: 13, pb: null, wipes: 0 });
  assert.deepEqual(p.bosses['barrow-heroic.keeper'], { kc: 12, pb: 150, wipes: 5 });
  assert.deepEqual(p.dungeons, v8.dungeons, 'clears, runs, bests and marks as they were');
  assert.equal(p.rev, 77);
  // loading again changes nothing
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(p))), p);
});

test('template: every new dungeon’s Heroic gets the kit shape for free', () => {
  const B = TEMPLATE_HEROIC_BUNDLE, T = B.dungeon;
  const uniques = TEMPLATE_ITEMS.filter((d) => d.kind !== 'gear').map((d) => d.id);
  assert.equal(uniques.length, 16);
  assert.deepEqual(B.kits.map((k) => k.item), uniques, 'a kit for every unique');
  assert.ok(B.kits.every((k) => k.id === gilded(k.item) && k.name.includes('Gilded') && k.icon.endsWith('_gilded')));
  assert.equal(T.heroicOf, TEMPLATE_DUNGEON.id);
  const fin = T.loot.find((t) => t.boss === TEMPLATE_DUNGEON.finalBoss)!;
  assert.deepEqual(fin.drops.filter((d) => d.rate === KIT_RATE).map((d) => d.id), uniques.map(gilded), 'its final boss rolls the kits');
  assert.ok(fin.drops.every((d) => !d.role), 'for any seat');
  assert.deepEqual(T.bonus, ['trophy.warden_crest.gilded', 'mount.clockwork_beetle.gilded', 'pet.pint_sovereign.gilded']);
  assert.deepEqual(T.collection, [...uniques.map(gilded), ...T.bonus!], 'its log is the kits, then the gilded bonus slots');
  const kitIds = new Set(B.kits.map((k) => k.id));
  assert.equal(T.loot.flatMap((t) => t.drops).filter((d) => kitIds.has(d.id)).length, 16, 'each kit on one table, once');
  assert.ok(B.collectibles.every((c) => !c.id.startsWith('dye.')), 'no gilded dye: kits gild the set');
  assert.equal(B.achievements[0].log, T.id);
});
