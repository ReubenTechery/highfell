/// <reference types="node" />
/**
 * Thimblebriar Hollow, dungeon 2: its winding burrow, the bombs you knock back (from its trash and both bosses),
 * the Sticky Bomb only the healer lifts, its two bosses, Heroic by the kit rule, the cuckoo clock, the gadgets,
 * and its balance: tuned for the Barrow's epics (power 1.72), where Rare gear wipes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtMob } from '../src/dungeon/entities.js';
import { onPerfectBlock } from '../src/dungeon/heroes.js';
import { stepGadgets } from '../src/dungeon/gadgets.js';
import { BLAST, FUSE, knockBomb, stickBomb, throwBomb } from '../src/dungeon/bombs.js';
import { curseTick, liftCurse, spawnMob } from '../src/dungeon/mobs.js';
import { startWalkout, tickWalkout } from '../src/dungeon/walkout.js';
import { areaOf, canStand, walkTo } from '../src/dungeon/world.js';
import { THIMBLEBRIAR_ENGINE } from '../src/content/thimblebriar/engine';
import { THIMBLEBRIAR } from '../src/content/thimblebriar';
import { THIMBLEBRIAR_HEROIC, THIMBLEBRIAR_KITS } from '../src/content/thimblebriar/heroic';
import { THIMBLEBRIAR_ITEMS } from '../src/content/thimblebriar/items';
import { TINKER, TOADSTOOL } from '../src/content/thimblebriar/bosses.js';
import { SIGNATURE } from '../src/content/thimblebriar/signature.js';
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, ITEMS, checkContent } from '../src/content';
import { KIT_RATE, gilded } from '../src/content/kits';
import { Achiever } from '../src/meta/achievements';
import { freshProfile, setActive } from '../src/meta/profile';
import { loadoutOf, newHero, plainLoadout } from '../src/meta/gear';
import { ART, heroSprite } from '../src/ui/art';
import { simRun } from '../src/sim/run';
import type { RoleId } from '../src/content/types';
import { WARBAND_KEY } from '../src/meta/warband';
/** a save whose Warband is open: these tests are about other rules and make more than one hero (warband.ts) */
const openProfile = (...a: Parameters<typeof freshProfile>) => { const p = freshProfile(...a); p.counters[WARBAND_KEY] = 1; return p; };

const gear = (rar: 0 | 1 | 2 | 3) => Object.fromEntries((['tank', 'healer', 'dps'] as RoleId[]).map((r) => [r, plainLoadout(r, rar)]));
const start = (role: RoleId, seed: number, o: Record<string, unknown> = {}) => { newGame(THIMBLEBRIAR_ENGINE, { role, seed, start: 'entrance', quiet: true, noEvents: true, loadouts: gear(3), ...o }); return S as any; };
const hero = (s: any, role: RoleId) => s.heroes.find((h: any) => h.role === role);
const run = (s: any, secs: number, until?: () => boolean) => { for (let t = 0; t < secs; t += 1 / 60) { update(1 / 60); if (until && until()) return true; } return false; };

test('thimblebriar: registered, its content holds together, and its log gives the Gnomes', () => {
  assert.deepEqual(checkContent(), []);
  assert.equal(DUNGEONS.thimblebriar, THIMBLEBRIAR);
  assert.equal(THIMBLEBRIAR.tier, 2);
  assert.equal(THIMBLEBRIAR.collection.length, 20);
  assert.deepEqual(THIMBLEBRIAR.bonus, ['dye.sporeglow', 'mount.clockwork_beetle', 'pet.pint_tinker']);
  // every set piece and boss weapon is Tier 2 (item level 34)
  for (const it of THIMBLEBRIAR_ITEMS) assert.equal(it.tier, 2, it.id);
  const log = ACHIEVEMENTS['thimblebriar.log'];
  assert.equal(log.reward.race, 'gnome');
  assert.equal(log.reward.look, 'workshop');
  assert.equal(log.reward.title, 'title.clockwork_knight');
  assert.deepEqual(THIMBLEBRIAR.seeds, [{ boss: 'tinker', seed: 'bramble', rate: 1 / 5 }]);
});

test('thimblebriar: Heroic follows the kit rule (Normal loot, then a gilding kit for each unique, and the gilded twins)', () => {
  assert.equal(THIMBLEBRIAR_HEROIC.heroicOf, 'thimblebriar');
  assert.equal(THIMBLEBRIAR_KITS.length, 16);
  const tinker = THIMBLEBRIAR_HEROIC.loot.find((t) => t.boss === 'tinker')!;
  for (const k of THIMBLEBRIAR_KITS) assert.ok(tinker.drops.some((d) => d.id === k.id && d.rate === KIT_RATE), k.id);
  assert.ok(tinker.drops.some((d) => d.id === gilded('pet.pint_tinker') && d.rate === 1 / 2500));
  assert.ok(THIMBLEBRIAR_HEROIC.loot.find((t) => t.boss === 'toadstool')!.drops.some((d) => d.id === gilded('trophy.toadstool_cap') && d.rate === 1 / 50));
  assert.equal(THIMBLEBRIAR_HEROIC.collection.length, 19);
  assert.equal(THIMBLEBRIAR_HEROIC.bonus!.length, 3);
  assert.deepEqual(THIMBLEBRIAR_HEROIC.seeds, [{ boss: 'tinker', seed: 'bramble', rate: 1 / 3 }]);
  assert.equal(ACHIEVEMENTS['thimblebriar-heroic.log'].reward.look, 'workshop-gilded');
});

test('thimblebriar: Heroic’s log gives Gilded Gnomes as its big prize, and it draws your Gnomes, only them, in gold', () => {
  const p = openProfile();
  const gnome = newHero(p, { name: 'Wren Gearpatch', race: 'gnome', cls: 'warrior', free: true })!;
  const dwarf = newHero(p, { name: 'Brask Ironhew', race: 'dwarf', cls: 'warrior' })!;
  setActive(p, gnome.id);
  // a gnome in gold: its skin turns (GNOME_GILD in tools/art_heroes.py), its cheeks too; a dwarf's stays
  const svg = (h: typeof gnome) => ART[`${heroSprite(h!, 'tank', p)}_f`].svg;
  const isGold = (h: typeof gnome) => !svg(h).includes('#F5C4A2') && svg(h).includes('#E8A33A');
  assert.equal(COLLECTIBLES['cosmetic.gilded_gnomes'].gilds, 'gnome');
  assert.equal(ACHIEVEMENTS['thimblebriar-heroic.log'].reward.collectible, 'cosmetic.gilded_gnomes');
  const ach = new Achiever(p, { dungeon: 'thimblebriar', role: 'tank', practice: false, testGear: false });
  const kits = THIMBLEBRIAR_KITS.map((k) => k.id);
  for (const id of kits.slice(1)) p.collection[id] = { n: 1, kc: 1, at: 1 };
  assert.ok(!isGold(gnome), 'not before the log is full');
  p.collection[kits[0]] = { n: 1, kc: 1, at: 1 };
  assert.deepEqual(ach.collected(kits[0]), ['thimblebriar-heroic.log'], 'done without the bonus slots');
  assert.ok(p.collection['cosmetic.gilded_gnomes'] && p.titles.includes('title.archtinker'));
  assert.ok(isGold(gnome));
  assert.ok(svg(dwarf).includes('#F2B48C'), 'a dwarf stays a dwarf');
  // a look like any other: switched off, your Gnomes are back in their gear
  p.settings.looksOff.push('cosmetic.gilded_gnomes');
  assert.ok(!isGold(gnome));
});

test('thimblebriar: a winding burrow of seven round chambers, every one reachable on foot', () => {
  const M = THIMBLEBRIAR_ENGINE.map as any;
  assert.equal(M.rooms.length, 7);
  assert.ok(M.rooms.every((r: any) => r.round), 'all round');
  // the tunnels zig-zag: west, north, east, north, west, north
  assert.deepEqual(M.corridors.map((c: any) => c.dir), ['h', 'v', 'h', 'v', 'h', 'v']);
  const s = start('tank', 3);
  s.gates = JSON.parse(JSON.stringify(THIMBLEBRIAR_ENGINE.gates));
  for (const g of Object.values(s.gates) as any[]) g.closed = false;
  const body = { x: M.rooms[0].x, y: M.rooms[0].y, r: 16 };
  for (let i = 1; i < 7; i++) {
    const to = M.rooms[i];
    let ok = false;
    for (let t = 0; t < 40 && !ok; t += 1 / 60) {
      ok = walkTo(body, to.x, to.y, 300, 1 / 60, 8) <= 10;
      assert.ok(canStand(body.x, body.y, body.r), `walked off the floor going to room ${i}`);
    }
    assert.ok(ok, `walked into room ${i}`);
    assert.equal(M.chain[areaOf(body.x, body.y)].idx, i);
  }
});

test('thimblebriar: a bomb lands and ticks, then blows on the heroes near it', () => {
  const s = start('dps', 5);
  const dps = hero(s, 'dps');
  const thrower: any = spawnMob('bombwright', dps.x + 300, dps.y, null, false);
  // nobody hits it: everyone stands still (stunned) and the DPS stands where it lands
  for (const h of s.heroes) { h.st.stun = 99; if (h !== dps) h.x = dps.x - 300; }
  const hp = dps.hp;
  const b: any = throwBomb(thrower, dps.x, dps.y, {});
  thrower.alive = false;
  assert.ok(s.hazards.some((z: any) => z.src === b && z.kind === 'bomb' && z.r === BLAST), 'its blast is a hazard');
  run(s, 0.85 + FUSE + 0.3, () => !b.alive);
  assert.equal(b.alive, false, 'it went off');
  assert.ok(dps.hp < hp, 'and hurt the hero standing on it');
  assert.ok(s.stats.bombHits >= 1);
});

test('thimblebriar: any hit knocks a bomb back at its thrower: it turns gold and hurts mobs, not heroes', () => {
  const s = start('dps', 6);
  const dps = hero(s, 'dps');
  const thrower: any = spawnMob('bombwright', dps.x + 240, dps.y - 40, null, false);
  thrower.state = 'fight'; thrower.st.stun = 99;
  const b: any = throwBomb(thrower, dps.x + 30, dps.y, {});
  run(s, 1.0, () => !b.fly);
  const heroHp = s.heroes.map((h: any) => h.hp), mobHp = thrower.hp;
  hurtMob(b, 10, dps);
  assert.ok(b.gold, 'gold: it is the DPS’s now');
  assert.ok(!s.hazards.some((z: any) => z.src === b), 'no blast on the heroes any more');
  run(s, 1.0, () => !b.alive);
  assert.equal(b.alive, false, 'it blew where it landed');
  assert.ok(thrower.hp < mobHp, 'on its thrower');
  s.heroes.forEach((h: any, i: number) => assert.ok(h.hp >= heroHp[i] - 1, `${h.role} took nothing from it`));
});

test('thimblebriar: a gold bomb beside a boss opens him up, and one shield-up perfect block bats a bomb straight back', () => {
  const s = start('tank', 7, { start: 'tinker' });
  const tank = hero(s, 'tank');
  const king = s.mobs.find((m: any) => m.type === 'tinker');
  // the King stands still (stunned) in his workshop with the tank in front of him
  king.state = 'fight'; king.st.stun = 99;
  tank.x = king.x; tank.y = king.y + 200;
  // knocked into him: Exposed
  const b1: any = throwBomb(king, tank.x + 20, tank.y + 20, {});
  run(s, 1.2, () => !b1.fly);
  knockBomb(b1, tank, tank.x, tank.y);
  run(s, 1.0, () => !b1.alive);
  assert.ok(king.exposed > 0, 'Exposed by a bomb beside him');
  king.exposed = 0;
  // thrown at the tank, and the tank raises the shield just as it lands: back at him before it ever ticks
  const b2: any = throwBomb(king, tank.x, tank.y, { at: tank });
  assert.ok(s.hazards.some((z: any) => z.tankBuster && z.src === b2), 'a gold circle under the tank: block it');
  const batted = s.stats.batted || 0;
  for (let t = 0; t < 1.2 && b2.fly; t += 1 / 60) {
    tank.face = Math.atan2(king.y - tank.y, king.x - tank.x);
    tank.intent.block = b2.fly.dur - b2.fly.t < 0.3;
    update(1 / 60);
  }
  assert.equal(s.stats.batted, batted + 1, 'batted back');
  assert.ok(b2.gold);
  run(s, 1.0, () => !b2.alive);
  assert.ok(king.exposed > 0, 'and it blew on him');
});

test('thimblebriar: only the healer lifts a Sticky Bomb; missed, it drops its hero to a tenth and hits mates beside, but never kills', () => {
  let s = start('healer', 8, { start: 'tinker' });
  let king = s.mobs.find((m: any) => m.type === 'tinker');
  const dps = hero(s, 'dps'), tank = hero(s, 'tank'), healer = hero(s, 'healer');
  assert.ok(stickBomb(king, dps));
  assert.equal(dps.st.curse.kind, 'sticky');
  assert.equal(liftCurse(dps, tank), false, 'the tank can’t');
  assert.ok(dps.st.curse, 'still stuck');
  const kingHp = king.hp;
  assert.equal(liftCurse(dps, healer), true, 'the healer can');
  run(s, 1.0, () => s.mobs.every((m: any) => !m.M.bomb || !m.alive));
  assert.ok(king.hp < kingHp, 'it flew back and blew on him');
  assert.ok(king.exposed > 0, 'and opened him up');
  // missed
  s = start('healer', 9, { start: 'tinker' });
  king = s.mobs.find((m: any) => m.type === 'tinker');
  const d2 = hero(s, 'dps'), t2 = hero(s, 'tank');
  t2.x = d2.x + 40; t2.y = d2.y;
  t2.hp = 50; d2.hp = d2.maxHp;
  stickBomb(king, d2);
  d2.st.curse.t = 3.99;
  curseTick(d2, 0.05);
  assert.equal(d2.hp, Math.round(d2.maxHp * 0.1), 'down to a tenth');
  assert.ok(d2.alive && t2.alive && t2.hp >= 1, 'nobody killed');
  assert.ok(t2.hp < 50, 'the mate beside took a hit');
});

test('thimblebriar: bombs come from its trash and both bosses, and the bots knock them back', () => {
  const r = simRun({ dungeon: 'thimblebriar', role: 'tank', seed: 31, loadouts: gear(3) });
  assert.equal(r.over, 'victory');
  for (const by of ['trash', 'toadstool', 'tinker']) assert.ok(r.stats['bombs.' + by] > 0, `bombs from the ${by}`);
  assert.ok(r.stats.knocked > 10, `knocked back ${r.stats.knocked}`);
  assert.ok((r.stats['sticky.trash'] || 0) + (r.stats['sticky.tinker'] || 0) > 0, 'Sticky Bombs');
  assert.ok(r.stats.lifts > 0, 'and the healer swiped them off');
});

test('thimblebriar: two bosses of three moves, a job for each role and the bombs in both; the Tinker King fights two phases', () => {
  for (const b of [TOADSTOOL, TINKER]) {
    assert.equal(b.moves.length, 3);
    const jobs = b.moves.map((m: any) => m.job).join(' ');
    for (const role of ['tank', 'healer', 'dps']) assert.ok(jobs.includes(role), `a job for the ${role}`);
    assert.ok(b.moves.some((m: any) => m.signature), 'the bombs');
  }
  assert.equal(TINKER.phases.length + 1, 2);
  // phase 2: the Barrage every 11 seconds instead of 16, and two Sticky Bombs at once
  assert.deepEqual(TINKER.moves.find((m: any) => m.id === 'barrage')!.every, [16, 11]);
  const s = start('tank', 10, { start: 'tinker' });
  const king = s.mobs.find((m: any) => m.type === 'tinker');
  king.phase = 2;
  assert.ok(SIGNATURE.stick(king, 2));
  assert.equal(s.heroes.filter((h: any) => h.st.curse).length, 2);
  assert.ok(s.heroes.every((h: any) => h.role !== 'tank' || !h.st.curse), 'never the tank');
});

test('thimblebriar: in the Barrow’s epics (power 1.72) the bots clear in 3:30 to 4:00 without wiping; Old Toadstool takes about 40 seconds and the Tinker King about 80', () => {
  for (const [role, seed] of [['tank', 101], ['healer', 202], ['dps', 303]] as [RoleId, number][]) {
    const r = simRun({ dungeon: 'thimblebriar', role, seed, loadouts: gear(3) });
    assert.equal(r.over, 'victory', `${role} seed ${seed} did not clear`);
    assert.equal(r.wipes, 0, `${role} seed ${seed} wiped`);
    assert.ok(r.clear! > 200 && r.clear! < 250, `${role} seed ${seed} cleared in ${r.clear}s`);
    const fight = (id: string) => { const p = r.packs.find((x) => x.id === id)!; return p.cleared! - p.pulled; };
    assert.ok(fight('K') > 30 && fight('K') < 50, `Old Toadstool took ${fight('K').toFixed(1)}s`);
    assert.ok(fight('G') > 65 && fight('G') < 95, `the Tinker King took ${fight('G').toFixed(1)}s`);
  }
});

test('thimblebriar: in Rare gear (power 1.48) the bots wipe at least once in most runs, mostly at the Tinker King', () => {
  let wiped = 0, atKing = 0;
  // the balance table's own seeds (npm run sim: s * 7919, plus 1 to 3 for the seat)
  const seeds: [RoleId, number][] = [1, 2, 3].flatMap((s) => (['tank', 'healer', 'dps'] as RoleId[]).map((r, i): [RoleId, number] => [r, s * 7919 + i + 1]));
  for (const [role, seed] of seeds) {
    const r = simRun({ dungeon: 'thimblebriar', role, seed, loadouts: gear(2), maxWipes: 1 });
    if (r.wipes) { wiped++; if (r.packs.some((p) => p.id === 'G')) atKing++; }
  }
  assert.ok(wiped >= 5, `only ${wiped} of ${seeds.length} Rare runs wiped`);
  assert.ok(atKing >= wiped - 1, `${atKing} of the ${wiped} wipes were at the Tinker King`);
});

test('thimblebriar: its own full kit melts it in about half the time of power 1.72', () => {
  const W = (id: string, slot: 'helm' | 'shoulders' | 'chest' | 'weapon', trait?: string) => ({ slot, def: ITEMS[id], trait, unique: true });
  const kit = (set: string, weapon: string, trait: string) => loadoutOf([W(`${set}.helm`, 'helm'), W(`${set}.shoulders`, 'shoulders'), W(`${set}.chest`, 'chest'), W(weapon, 'weapon', trait)]);
  const own = { tank: kit('clockguard', 'tinker.tank', 'wide'), healer: kit('sporebloom', 'tinker.healer', 'sunflare'), dps: kit('arcspark', 'tinker.dps', 'shatterlance') };
  assert.ok(Math.abs(own.tank.power - 2.44) < 0.01, `power ${own.tank.power}`);
  const epic = simRun({ dungeon: 'thimblebriar', role: 'dps', seed: 404, loadouts: gear(3) });
  const bis = simRun({ dungeon: 'thimblebriar', role: 'dps', seed: 404, loadouts: own });
  assert.equal(bis.over, 'victory');
  assert.ok(bis.clear! < epic.clear! * 0.62, `full kit ${bis.clear}s against ${epic.clear}s`);
});

test('thimblebriar: the cuckoo clock tells the chest the same way the lantern does: two gold pops and two knocks for a unique', () => {
  const s = start('tank', 12, { start: 'tinker' });
  s.chest = { x: 900, y: 2400, open: false, t: 0, boss: 'tinker' };
  startWalkout('unique', 960, 2400, false);
  assert.equal(s.walkout.style, 'cuckoo');
  let knocks = 0;
  for (let t = 0; t < 3.6; t += 1 / 60) {
    if (s.chest.knockT > 0) s.chest.knockT -= 1 / 60;
    const k = s.chest.knockT;
    tickWalkout(1 / 60);
    if (s.chest.knockT > 0 && !(k > 0)) knocks++;
  }
  assert.equal(knocks, 2);
  assert.ok(s.walkout.beats.has('pop1') && s.walkout.beats.has('pop2'));
  assert.ok(s.walkout.done);
});

test('thimblebriar: the gadgets: a Clockguard perfect block drops a bomb of yours, and the Fusecutters leave one behind', () => {
  const s = start('tank', 13, { start: 'tinker' });
  const tank = hero(s, 'tank');
  const king = s.mobs.find((m: any) => m.type === 'tinker');
  tank.bonuses = new Set(['clockguard2', 'clockguard3']);
  onPerfectBlock(tank, king);
  assert.ok(tank.absorb > 0, 'a brass shield');
  const bomb = s.mobs.find((m: any) => m.M.bomb && m.alive);
  assert.ok(bomb && bomb.gold && bomb.by === tank, 'a lit bomb of the tank’s');
  const hp = king.hp;
  run(s, 1.0, () => !bomb.alive);
  assert.ok(king.hp < hp, 'it went off on him');
  // the Fusecutters: Shadowstep leaves a lit bomb of yours where you were
  const dps = hero(s, 'dps');
  dps.unique = 'fusecutters';
  stepGadgets(dps, dps.x, dps.y);
  assert.ok(s.mobs.some((m: any) => m.M.bomb && m.alive && m.gold && m.by === dps && m.gadget));
});

test('thimblebriar: achievements count its bombs, Sticky Bombs and Waddlecaps', () => {
  const p = openProfile();
  const a = new Achiever(p, { dungeon: 'thimblebriar', role: 'healer', practice: false, testGear: false });
  for (let i = 0; i < 100; i++) a.event({ type: 'bomb.knocked', player: true });
  assert.ok(p.achievements['thimblebriar.bombs']);
  for (let i = 0; i < 25; i++) a.event({ type: 'curse.lifted', player: true, kind: 'sticky' });
  assert.ok(p.achievements['thimblebriar.stickies']);
  a.event({ type: 'curse.lifted', player: true });
  assert.equal(p.counters['thimblebriar.stickies'], 25, 'a Barrow curse isn’t a Sticky Bomb');
  for (let i = 0; i < 200; i++) a.event({ type: 'mob.killed', mob: 'waddlecap', boss: false, undead: false, byPlayer: true, tally: 'waddlecaps' });
  assert.ok(p.achievements['thimblebriar.caps']);
});
