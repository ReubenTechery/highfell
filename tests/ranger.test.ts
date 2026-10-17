/// <reference types="node" />
/**
 * The ranger (the duo rework, docs/duo.md): Quick Shot marks, Longshot spends three marks (or an Exposed window) and
 * goes on through, Pin Shot stops casts and Exposes, Snare holds what walks in and, on Trapper, bursts into Arrowfall.
 * Its talents, traits, sets and bows do what their words say; it wears what the code calls healer gear; and a ranger
 * with bots clears the Barrow like the other classes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { LAST } from '../src/dungeon/entities.js';
import { useAbility } from '../src/dungeon/heroes.js';
import { projHit } from '../src/dungeon/buttons.js';
import { spawnMob } from '../src/dungeon/mobs.js';
import { COMBO, comboFor, setUp } from '../src/dungeon/duo.js';
import { ARROWFALL, LONGSHOT, MARKS, PIN, SNARE, addMarks, canLongshot, drawMarks, marksOf } from '../src/dungeon/ranger.js';
import { AB, abKey, fillerOf } from '../src/content/roles';
import { DEFAULT_KEYS } from '../src/content/keys';
import { CLERIC_TRAITS, ROLE_SLOTS, TRAITS, gearId, gearKeyOf, traitDef } from '../src/content/gear';
import { DUNGEONS, ITEMS, SETS, checkContent } from '../src/content';
import { SPECS, buttonFor, specsFor } from '../src/content/talents';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { BARROW_LOOT } from '../src/content/barrow/loot';
import { levelBonus, xpForLevel } from '../src/content/xp';
import { fitsHero, loadoutOf, newHero, plainLoadout, trialWeapon } from '../src/meta/gear';
import { lootFor, rollTable } from '../src/meta/loot';
import { freshProfile } from '../src/meta/profile';
import { addPoint, pickSpec, talentLoadout, type TalentLoadout } from '../src/meta/talents';
import { simRun } from '../src/sim/run';

/** a quiet fight: you a ranger in the first seat with this loadout (spec, talents, traits, set bonuses, bow), a
 *  warrior mate sent far off, and no foes but the ones you make */
function fight(L: Record<string, unknown> = {}) {
  newGame(BARROW_ENGINE, { seed: 11, start: 'entrance', auto: false, quiet: true, noEvents: true, party: [{ cls: 'ranger', isPlayer: true, loadout: L }, { cls: 'warrior' }] });
  const s = S as any;
  s.mobs = [];
  const [h, mate] = s.heroes;
  mate.x += 4000; mate.y += 4000;
  return { s, h, mate };
}
/** a foe that fights, with plenty of health, at (x, y) */
function foe(x: number, y: number, hp = 20000, type = 'rattler'): any {
  const m = spawnMob(type, x, y, null) as any;
  m.state = 'fight'; m.rise = 0; m.fightT = 5; m.hp = m.maxHp = hp;
  return m;
}
/** press a button now: the beat and its cooldown out of the way */
function press(h: any, slot: string, aim?: unknown): boolean {
  h.beat = 0; h.gcd = 0; h.cd[slot] = 0;
  return useAbility(h, slot, aim ?? null);
}
/** let the arrows in flight land */
function land(s: any) { for (const p of s.projs.splice(0)) if (p.team === 'hero') projHit(p); }
/** shoot `n` Quick Shots at a foe and let them land */
function quick(s: any, h: any, m: any, n: number) { for (let i = 0; i < n; i++) { press(h, 'a1', m); land(s); } }
/** Quick Shot's and Longshot's hits */
const QUICK = AB.ranger.a1.hit!, LONG = AB.ranger.a2.hit!;
const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };
/** the zone fn ticks a few times (a trap waiting, Arrowfall raining) without the rest of the fight */
const tick = (z: any, n = 1) => { for (let i = 0; i < n; i++) z.fn(z); };

/* ---------- what a ranger is ---------- */

test('ranger: four buttons (a filler, a payoff, an interrupt and a trap), its keys, and two specs, one for bosses and one for packs', () => {
  assert.deepEqual(checkContent(), []);
  assert.equal(abKey({ cls: 'ranger' }), 'ranger');
  assert.deepEqual(['a1', 'a2', 'a3', 'a4'].map((s) => AB.ranger[s as 'a1'].key), ['quickshot', 'longshot', 'pinshot', 'snare']);
  assert.equal(fillerOf('ranger').def.key, 'quickshot');
  assert.equal(AB.ranger.a2.cd, 0, 'the payoff waits on marks, not a cooldown');
  assert.equal(DEFAULT_KEYS.ranger.a1, 'KeyE', 'the filler is on E');
  assert.deepEqual(specsFor('ranger').map((s) => s.id), ['longbow', 'trapper']);
  // Trapper's Snare bursts into Arrowfall from the moment you pick it; Longbow keeps the buttons as they are
  assert.match(buttonFor(AB.ranger.a4, 'trapper', 'a4').desc, /Arrowfall/);
  assert.equal(buttonFor(AB.ranger.a4, 'trapper', 'a4').cd, AB.ranger.a4.cd, 'same cooldown');
  assert.equal(buttonFor(AB.ranger.a4, 'longbow', 'a4').desc, AB.ranger.a4.desc);
  assert.ok(SPECS.trapper.base && /Arrowfall/.test(SPECS.trapper.base));
});

test('ranger: it wears what the code calls healer gear: its bows, the Barrow’s and Thimblebriar’s sets, its traits in place of the cleric’s', () => {
  assert.equal(gearKeyOf('ranger'), 'healer');
  assert.equal(ROLE_SLOTS.healer.weapon.name, 'Bow');
  assert.match(ITEMS[gearId('healer', 'weapon', 2)].name, /bow/i);
  assert.deepEqual(TRAITS.healer.map((t) => t.id), ['cleanthrough', 'keenfletch', 'steadyaim']);
  // a cleric's old weapon still says what its trait does until the class retires
  assert.deepEqual(CLERIC_TRAITS.map((t) => t.id), ['sunflare', 'quickhands', 'kindle']);
  assert.equal(traitDef('healer', 'sunflare')?.name, 'Sunflare');
  // the sets keep their ids and log slots, with new names and bonuses
  assert.equal(SETS.candlewake.name, 'Gravewood');
  assert.equal(SETS.sporebloom.name, 'Thistledown');
  assert.deepEqual([SETS.candlewake.bonus2.id, SETS.candlewake.bonus3.id, SETS.sporebloom.bonus2.id, SETS.sporebloom.bonus3.id], ['gravewood2', 'gravewood3', 'thistledown2', 'thistledown3']);
  assert.match(ITEMS['gravekeeper.healer'].name, /Bow/);
  assert.match(ITEMS['tinker.healer'].name, /Bow/);
  assert.equal(ITEMS['tinker.healer'].effect, 'cogspring');
  for (const id of ['candlewake.helm', 'candlewake.shoulders', 'candlewake.chest', 'sporebloom.helm', 'sporebloom.shoulders', 'sporebloom.chest']) assert.match(ITEMS[id].effectDesc || '', /Quick Shot|Pin Shot|Snare/, id);
  // the words are plain: no Power as a fraction, no "stroke"
  for (const id of ['candlewake.helm', 'candlewake.shoulders', 'candlewake.chest', 'gravekeeper.healer', 'sporebloom.helm', 'sporebloom.shoulders', 'sporebloom.chest', 'tinker.healer']) assert.ok(!/stroke|item level|ilvl/i.test(`${ITEMS[id].name} ${ITEMS[id].effectDesc}`), id);
});

test('ranger: its gear fits it and nobody else’s does; it rolls the healer’s lines; the Crypt Trial lends it its bow', () => {
  const ranger = { role: 'dps' as const, cls: 'ranger' };
  assert.ok(fitsHero(ITEMS['candlewake.helm'], ranger));
  assert.ok(fitsHero(ITEMS['gravekeeper.healer'], ranger));
  assert.ok(fitsHero(ITEMS['tinker.healer'], ranger));
  assert.ok(!fitsHero(ITEMS['rimebone.helm'], ranger), 'not the mage’s');
  assert.ok(!fitsHero(ITEMS['shadeveil.helm'], ranger), 'not the rogue’s');
  // everyone else's fit as before
  assert.ok(fitsHero(ITEMS['rimebone.helm'], { role: 'dps', cls: 'mage' }));
  assert.ok(!fitsHero(ITEMS['shadeveil.helm'], { role: 'dps', cls: 'mage' }));
  assert.ok(fitsHero(ITEMS['shadeveil.helm'], { role: 'dps', cls: 'rogue' }));
  assert.ok(fitsHero(ITEMS['candlewake.helm'], { role: 'healer', cls: 'cleric' }));
  // a boss table's lines: the ranger rolls the Gravewood and the bow, never the mage's or the rogue's
  const lucky = () => 0;
  const got = BARROW_LOOT.flatMap((t) => rollTable(t, 'dps', lucky, 'ranger')).map((d) => d.id);
  assert.ok(got.includes('candlewake.helm') && got.includes('gravekeeper.healer'), got.join(' '));
  assert.ok(!got.some((id) => /rimebone|gravefrost|shadeveil|gravekeeper\.(dps|rogue)/.test(id)), got.join(' '));
  const mage = BARROW_LOOT.flatMap((t) => rollTable(t, 'dps', lucky, 'mage')).map((d) => d.id);
  assert.ok(mage.includes('rimebone.helm') && !mage.includes('candlewake.helm'));
  const mine = lootFor(DUNGEONS.barrow, 'dps', 'ranger').mine.map((d) => d.id);
  assert.ok(mine.includes('gravekeeper.healer') && !mine.includes('gravekeeper.dps'), mine.join(' '));
  assert.equal(trialWeapon('dps', 'ranger'), 'longnight');
  assert.equal(trialWeapon('dps', 'mage'), 'gravefrost');
  assert.equal(trialWeapon('dps', 'rogue'), 'cryptfangs');
  assert.equal(trialWeapon('healer', 'cleric'), 'longnight');
});

/* ---------- the buttons ---------- */

test('ranger: Quick Shot marks its foe, up to three for 8 seconds; three are a setup for your mate, never your own combo', () => {
  const { s, h, mate } = fight();
  const m = foe(h.x, h.y - 300);
  assert.ok(press(h, 'a1', m));
  assert.equal(marksOf(m), 0, 'the arrow is still in the air');
  land(s);
  assert.ok(m.hp < m.maxHp);
  assert.equal(marksOf(m), 1);
  quick(s, h, m, 4);
  assert.equal(marksOf(m), MARKS.max, 'three at most');
  assert.equal(comboFor(m, mate), 'mark', 'your mate’s payoff on it is a COMBO');
  assert.equal(comboFor(m, h), null, 'your own marks are your Longshot, not a combo');
  // they show over the foe, an arrowhead each, gold once a Longshot can go
  const drawn: string[] = [];
  const ctx = { beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() { drawn.push(ctx.fillStyle); }, fillStyle: '', strokeStyle: '', lineWidth: 0, lineJoin: '' };
  drawMarks(ctx, m, m.x);
  assert.deepEqual(drawn, ['#F2C230', '#F2C230', '#F2C230']);
  s.t += MARKS.life + 0.1;
  assert.equal(marksOf(m), 0, 'they run out');
  assert.equal(press(h, 'a1', foe(h.x + 2000, h.y)), false, 'out of reach');
});

test('ranger: Longshot needs three marks; it spends them, hits hard, goes on through the foe behind, and heals you a little', () => {
  const { s, h } = fight();
  const m = foe(h.x, h.y - 250), behind = foe(h.x, h.y - 380), aside = foe(h.x + 260, h.y - 250);
  assert.equal(press(h, 'a2', m), false, 'no marks, no Longshot');
  quick(s, h, m, 3);
  assert.ok(canLongshot(h, m));
  h.hp = h.maxHp - 200;
  const hp0 = m.hp, b0 = behind.hp, a0 = aside.hp, me0 = h.hp;
  assert.ok(press(h, 'a2'), 'it finds the marked foe on its own');
  assert.equal(marksOf(m), 0, 'the marks are spent');
  land(s);
  const got = hp0 - m.hp;
  assert.ok(got >= LONG, `a big hit: ${got}`);
  assert.ok(b0 - behind.hp >= Math.round(LONG * LONGSHOT.through * 0.99), `on through the one behind: ${b0 - behind.hp}`);
  assert.equal(aside.hp, a0, 'not the one off to the side');
  assert.ok(h.hp > me0, 'it heals you');
  assert.equal(press(h, 'a2', m), false, 'and needs three more');
});

test('ranger: an Exposed foe takes one Longshot of yours a window without marks', () => {
  const { s, h } = fight();
  const m = foe(h.x, h.y - 250);
  m.exposed = 3;
  assert.ok(canLongshot(h, m));
  assert.ok(press(h, 'a2', m));
  land(s);
  assert.equal(canLongshot(h, m), false, 'one a window: a burn, not a loop');
  quick(s, h, m, 3);
  assert.ok(canLongshot(h, m), 'three marks still make one');
});

test('ranger: a Longshot on a foe your mate set up is a COMBO, half again as hard, and counts for you both', () => {
  const { s, h, mate } = fight();
  const m = foe(h.x, h.y - 250);
  quick(s, h, m, 3);
  setUp(m, mate, 'stun');
  const hp0 = m.hp;
  press(h, 'a2', m); land(s);
  // nothing behind it, so the last hit was the Longshot's own
  assert.equal(hp0 - m.hp, Math.round(LONG * COMBO * (LAST.crit ? 2 : 1)));
  assert.equal(s.duel[h.id].combosLanded, 1);
  assert.equal(s.duel[mate.id].combosSet, 1);
  // a foe your mate marked (two rangers): your Longshot on it lands as a crit
  const o = foe(h.x + 120, h.y - 250);
  addMarks(mate, o, 3);
  const o0 = o.hp;
  press(h, 'a2', o); land(s);
  assert.equal(o0 - o.hp, Math.round(LONG * COMBO * 2), 'a COMBO, and a crit');
});

test('ranger: Pin Shot stops a cast and Exposes the caster, a setup for your mate; a foe that isn’t casting is pinned', () => {
  const { s, h, mate } = fight();
  const c = foe(h.x, h.y - 300, 20000, 'caller');
  let done = false;
  c.cast = { key: 'bolt', name: 'Grave Bolt', t: 0, dur: 2, kick: true, done: () => { done = true; } };
  assert.ok(press(h, 'a3'), 'it finds the caster on its own');
  assert.equal(c.cast, null, 'stopped at once');
  assert.ok(c.exposed > 0, 'Exposed');
  assert.equal(comboFor(c, mate), 'expose');
  assert.equal(done, false);
  assert.ok(c.hp <= c.maxHp - PIN.hit);
  land(s);
  const m = foe(h.x + 100, h.y - 300);
  press(h, 'a3', m);
  assert.ok(m.st.slow >= PIN.slow && m.st.slowT >= PIN.dur - 0.01, 'pinned');
  assert.equal(m.exposed, 0, 'nothing to stop, so not Exposed');
});

test('ranger: Snare waits for a foe to walk in, then holds it (a boss Staggers) and bites: a setup for your mate', () => {
  const { s, h, mate } = fight();
  const m = foe(h.x + 2000, h.y);
  assert.ok(press(h, 'a4', { x: h.x, y: h.y - 300 }));
  const z = s.zones.find((q: any) => q.kind === 'snare');
  assert.ok(z && Math.abs(z.y - (h.y - 300)) < 1);
  tick(z, 3);
  assert.equal(z.sprung, false, 'it waits');
  m.x = z.x; m.y = z.y;
  tick(z);
  assert.ok(z.sprung, 'it springs');
  assert.ok(m.st.stun >= SNARE.hold - 0.01, 'held');
  assert.ok(m.hp <= m.maxHp - SNARE.bite);
  assert.equal(comboFor(m, mate), 'stun');
  step(0.6);
  assert.ok(!s.zones.includes(z), 'one bite and it’s gone');
  // a boss isn't held, he Staggers
  const b = foe(h.x, h.y - 420, 20000, 'knight');
  press(h, 'a4', { x: b.x, y: b.y });
  const zb = s.zones.find((q: any) => q.kind === 'snare' && !q.sprung);
  tick(zb);
  assert.ok(b.st.stagger > 0 && !(b.st.stun > 0));
  // thrown far, it lands at the edge of its reach
  press(h, 'a4', { x: h.x + 5000, y: h.y });
  const zf = s.zones.filter((q: any) => q.kind === 'snare').pop();
  assert.ok(Math.hypot(zf.x - h.x, zf.y - h.y) <= AB.ranger.a4.range! + 1);
});

test('ranger, Trapper: Snare bursts into Arrowfall, a rain of arrows that hits every foe in it', () => {
  const { s, h } = fight({ spec: 'trapper' });
  const a = foe(h.x, h.y - 300), b = foe(h.x + 60, h.y - 320), far = foe(h.x + 600, h.y - 300);
  press(h, 'a4', { x: a.x, y: a.y });
  const z = s.zones.find((q: any) => q.kind === 'snare');
  tick(z);
  const rain = s.zones.find((q: any) => q.kind === 'arrowfall');
  assert.ok(rain, 'Arrowfall');
  assert.equal(rain.dur, ARROWFALL.dur);
  const a0 = a.hp, b0 = b.hp, f0 = far.hp;
  tick(rain, 4);
  assert.ok(a0 - a.hp >= ARROWFALL.hit * 4 && b0 - b.hp >= ARROWFALL.hit * 4, 'everything in it');
  assert.equal(far.hp, f0);
  // without Trapper it doesn't
  const r = fight();
  const c = foe(r.h.x, r.h.y - 300);
  press(r.h, 'a4', { x: c.x, y: c.y });
  tick(r.s.zones.find((q: any) => q.kind === 'snare'));
  assert.ok(!r.s.zones.some((q: any) => q.kind === 'arrowfall'));
});

/* ---------- the talents ---------- */

test('ranger, Longbow: Deep Marks stacks five and Longshot grows with them; Bodkin Points on a big foe; Pinned Down; Quick Nock', () => {
  const d = fight({ spec: 'longbow', tal: ['lb.deep'] });
  const m = foe(d.h.x, d.h.y - 250);
  quick(d.s, d.h, m, 6);
  assert.equal(marksOf(m), MARKS.deep);
  const hp0 = m.hp;
  press(d.h, 'a2', m); land(d.s);
  assert.equal(hp0 - m.hp, Math.round(LONG * 1.5 * (LAST.crit ? 2 : 1)), 'two past three: half again');

  const b = fight({ spec: 'longbow', tal: ['lb.bodkin'] });
  const big = foe(b.h.x, b.h.y - 250, 20000, 'brute');
  addMarks(b.h, big, 3);
  const g0 = big.hp;
  press(b.h, 'a2', big); land(b.s);
  assert.equal(g0 - big.hp, Math.round(LONG * 1.25 * (LAST.crit ? 2 : 1)));

  const p = fight({ spec: 'longbow', tal: ['lb.pinned'] });
  const q = foe(p.h.x, p.h.y - 250);
  press(p.h, 'a3', q);
  assert.equal(marksOf(q), 3, 'Pinned Down: three marks, a Longshot at once');

  const n = fight({ spec: 'longbow', tal: ['lb.nock'] });
  const k = foe(n.h.x, n.h.y - 250);
  quick(n.s, n.h, k, 2);
  assert.equal(marksOf(k), 2);
  k.marks = null;
  quick(n.s, n.h, k, 1);
  assert.equal(marksOf(k), 2, 'the third Quick Shot leaves two');
});

test('ranger, Longbow: Follow Through re-marks on a crit, Quarry on a hurt foe, Second Arrow strikes again, Sitting Duck always crits a mate’s setup', () => {
  const f = fight({ spec: 'longbow', tal: ['lb.follow'] });
  f.h.ts.crit = 1;
  const m = foe(f.h.x, f.h.y - 250);
  addMarks(f.h, m, 3);
  press(f.h, 'a2', m); land(f.s);
  assert.equal(marksOf(m), 3, 'a crit leaves three marks');

  const q = fight({ spec: 'longbow', tal: ['lb.quarry'] });
  const low = foe(q.h.x, q.h.y - 250);
  low.hp = low.maxHp * 0.4;
  addMarks(q.h, low, 3);
  const l0 = low.hp;
  press(q.h, 'a2', low); land(q.s);
  assert.equal(l0 - low.hp, Math.round(LONG * 1.3 * (LAST.crit ? 2 : 1)));

  const sa = fight({ spec: 'longbow', tal: ['lb.second'] });
  const t = foe(sa.h.x, sa.h.y - 250);
  addMarks(sa.h, t, 3);
  press(sa.h, 'a2', t); land(sa.s);
  const after = t.hp;
  step(0.3);
  assert.ok(after - t.hp >= LONG * 0.5 * 0.99, `a second arrow: ${after - t.hp}`);

  const sd = fight({ spec: 'longbow', tal: ['lb.duck'] });
  const u = foe(sd.h.x, sd.h.y - 250);
  addMarks(sd.h, u, 3);
  setUp(u, sd.mate, 'freeze');
  const u0 = u.hp;
  press(sd.h, 'a2', u); land(sd.s);
  assert.equal(u0 - u.hp, Math.round(LONG * COMBO * 2), 'a COMBO and a crit');
});

test('ranger, Trapper: Twin Traps, Wide Jaws, Downpour, Biting Jaws and Cloudburst change the traps; Forked Arrow and Spreading Marks the arrows; Tripwire', () => {
  const tw = fight({ spec: 'trapper', tal: ['tr.twin'] });
  press(tw.h, 'a4', { x: tw.h.x, y: tw.h.y - 300 });
  assert.equal(tw.s.zones.filter((z: any) => z.kind === 'snare').length, 2, 'two traps');

  const wj = fight({ spec: 'trapper', tal: ['tr.jaws'] });
  press(wj.h, 'a4', { x: wj.h.x, y: wj.h.y - 300 });
  assert.equal(wj.s.zones.find((z: any) => z.kind === 'snare').r, Math.round(SNARE.r * 1.5));

  const dp = fight({ spec: 'trapper', tal: ['tr.downpour'] });
  const a = foe(dp.h.x, dp.h.y - 300);
  press(dp.h, 'a4', { x: a.x, y: a.y }); tick(dp.s.zones.find((z: any) => z.kind === 'snare'));
  assert.ok(dp.s.zones.find((z: any) => z.kind === 'arrowfall').dur > ARROWFALL.dur);

  const bj = fight({ spec: 'trapper', tal: ['tr.bite'] });
  const b = foe(bj.h.x, bj.h.y - 300);
  press(bj.h, 'a4', { x: b.x, y: b.y }); tick(bj.s.zones.find((z: any) => z.kind === 'snare'));
  assert.ok(b.maxHp - b.hp >= SNARE.bite + 80);
  assert.equal(marksOf(b), 2);

  const cb = fight({ spec: 'trapper', tal: ['tr.cloud'] });
  const c = foe(cb.h.x, cb.h.y - 300);
  press(cb.h, 'a4', { x: c.x, y: c.y }); tick(cb.s.zones.find((z: any) => z.kind === 'snare'));
  const rain = cb.s.zones.find((z: any) => z.kind === 'arrowfall');
  assert.ok(rain.tick < ARROWFALL.every, 'more often');
  tick(rain, 3);
  assert.equal(marksOf(c), 1, 'a mark from the rain, once');

  const fk = fight({ spec: 'trapper', tal: ['tr.fork'] });
  const t = foe(fk.h.x, fk.h.y - 300), l = foe(fk.h.x - 140, fk.h.y - 300), r = foe(fk.h.x + 140, fk.h.y - 300);
  addMarks(fk.h, t, 3);
  const l0 = l.hp, r0 = r.hp;
  press(fk.h, 'a2', t); land(fk.s);
  assert.ok(l.hp < l0 && r.hp < r0, 'an arrow either side');

  const sm = fight({ spec: 'trapper', tal: ['tr.spread'] });
  const x = foe(sm.h.x, sm.h.y - 300), y = foe(sm.h.x + 80, sm.h.y - 300);
  quick(sm.s, sm.h, x, 1);
  assert.equal(marksOf(y), 1, 'the nearest foe takes one too');

  const tr = fight({ spec: 'trapper', tal: ['tr.trip'] });
  const lead = foe(tr.h.x, tr.h.y - 200), m2 = foe(tr.h.x, tr.h.y - 300), m3 = foe(tr.h.x, tr.h.y - 400);
  addMarks(tr.h, lead, 3);
  tr.h.cd.a4 = 7;
  press(tr.h, 'a2', lead); land(tr.s);
  assert.ok(m2.hp < m2.maxHp && m3.hp < m3.maxHp, 'through two more');
  assert.equal(tr.h.cd.a4, 0, 'Snare is ready again');
});

/* ---------- traits, sets and bows ---------- */

test('ranger: Clean Through, Keen Fletching and Steady Aim do what they say', () => {
  const c = fight({ traits: ['cleanthrough'] });
  const t = foe(c.h.x, c.h.y - 250), b = foe(c.h.x, c.h.y - 380);
  addMarks(c.h, t, 3);
  const b0 = b.hp;
  press(c.h, 'a2', t); land(c.s);
  assert.ok(b0 - b.hp >= LONG * 0.99, 'as hard as its target');

  const k = fight({ traits: ['keenfletch'] });
  k.h.ts.crit = 1;
  const m = foe(k.h.x, k.h.y - 250);
  quick(k.s, k.h, m, 1);
  assert.equal(marksOf(m), 2, 'a crit leaves two');

  // Steady Aim: crits half again as often standing still (over many shots, about 33% to 22%)
  const crits = (traits: string[]) => {
    const r = fight({ traits });
    const f = foe(r.h.x, r.h.y - 250, 1e9);
    let n = 0;
    for (let i = 0; i < 400; i++) { r.h.stillT = 1; press(r.h, 'a1', f); land(r.s); if (LAST.crit) n++; f.marks = null; }
    return n / 400;
  };
  const plain = crits([]), steady = crits(['steadyaim']);
  assert.ok(steady > plain * 1.25, `${plain} and ${steady}`);
});

test('ranger: the Gravewood and the Bow of the Long Night do what they say', () => {
  const hm = fight({ bonuses: ['cw_helm'] });
  const m = foe(hm.h.x, hm.h.y - 250);
  const m0 = m.hp;
  quick(hm.s, hm.h, m, 1);
  assert.equal(m0 - m.hp, Math.round(QUICK * 1.25 * (LAST.crit ? 2 : 1)), 'Quick Shot 25% harder');
  hm.s.t += MARKS.life + 1;
  assert.equal(marksOf(m), 1, 'its marks last longer');

  const sh = fight({ bonuses: ['cw_shoulders'] });
  const p = foe(sh.h.x, sh.h.y - 250);
  press(sh.h, 'a3', p);
  assert.ok(p.maxHp - p.hp >= Math.round(PIN.hit * 1.4) && marksOf(p) === 2, 'Pin Shot harder, and two marks');

  const ch = fight({ bonuses: ['cw_chest'] });
  const q = foe(ch.h.x, ch.h.y - 300);
  press(ch.h, 'a4', { x: q.x, y: q.y }); tick(ch.s.zones.find((z: any) => z.kind === 'snare'));
  assert.ok(q.st.stun >= SNARE.hold + 1 - 0.01 && q.maxHp - q.hp >= SNARE.bite + 50);

  const two = fight({ bonuses: ['gravewood2'] });
  const t = foe(two.h.x, two.h.y - 250), b = foe(two.h.x, two.h.y - 380);
  addMarks(two.h, t, 3);
  press(two.h, 'a2', t); land(two.s);
  assert.ok(marksOf(t) === 1 && marksOf(b) === 1, 'a mark on every foe it hit');

  const three = fight({ bonuses: ['gravewood3'] });
  press(three.h, 'a4', { x: three.h.x, y: three.h.y - 300 });
  assert.equal(three.s.thralls.filter((x: any) => x.alive && x.owner === three.h).length, 1, 'a skeleton beside the trap');

  const bow = fight({ unique: 'longnight' });
  const k = foe(bow.h.x, bow.h.y - 250);
  for (let i = 0; i < 3; i++) quick(bow.s, bow.h, k, 1);
  assert.ok(!bow.h.stats.by.second);
  quick(bow.s, bow.h, k, 1);
  step(0.5);
  assert.ok(bow.h.stats.by.second > 0, 'the fourth looses a second arrow');
  const j = foe(bow.h.x + 100, bow.h.y - 250);
  press(bow.h, 'a3', j);
  assert.equal(marksOf(j), 2, 'Pin Shot leaves two marks');
});

test('ranger: the Thistledown and the Cogspring Bow do what they say', () => {
  const hm = fight({ bonuses: ['sb_helm'] });
  const m = foe(hm.h.x, hm.h.y - 250);
  const m0 = m.hp;
  quick(hm.s, hm.h, m, 1);
  assert.equal(m0 - m.hp, Math.round(QUICK * 1.25 * (LAST.crit ? 2 : 1)));
  assert.ok(m.st.slow > 0, 'and it slows');

  const sh = fight({ bonuses: ['sb_shoulders'] });
  const c = foe(sh.h.x, sh.h.y - 250, 20000, 'caller');
  c.cast = { key: 'bolt', name: 'Grave Bolt', t: 0, dur: 2, kick: true, done: () => {} };
  press(sh.h, 'a3', c);
  assert.ok(c.exposed > 3.5, `Exposed a second longer: ${c.exposed}`);
  assert.ok(c.maxHp - c.hp >= Math.round(PIN.hit * 1.4));

  const ch = fight({ bonuses: ['sb_chest'] });
  press(ch.h, 'a4', { x: ch.h.x, y: ch.h.y - 300 });
  const z = ch.s.zones.find((q: any) => q.kind === 'snare');
  assert.ok(z.r > SNARE.r * 1.3 && z.dur > SNARE.wait + 3);

  const bombs = (s: any) => s.mobs.filter((x: any) => x.alive && x.M.bomb && x.gadget).length;
  const two = fight({ bonuses: ['thistledown2'] });
  const a = foe(two.h.x, two.h.y - 300);
  press(two.h, 'a4', { x: a.x, y: a.y }); tick(two.s.zones.find((q: any) => q.kind === 'snare'));
  assert.equal(bombs(two.s), 1, 'a bomb in the sprung trap');

  const three = fight({ bonuses: ['thistledown3'] });
  const t = foe(three.h.x, three.h.y - 250);
  addMarks(three.h, t, 3);
  press(three.h, 'a2', t); land(three.s);
  assert.equal(bombs(three.s), 1, 'a bomb where the Longshot landed');

  const cog = fight({ unique: 'cogspring' });
  const p = foe(cog.h.x, cog.h.y - 250);
  press(cog.h, 'a3', p);
  const b = cog.s.mobs.find((x: any) => x.alive && x.M.bomb);
  assert.ok(b && b.stuck === p, 'a lit bomb stuck on its foe');
});

/* ---------- the bot, and the balance ---------- */

const gear = (rar: 0 | 1 | 2 | 3) => ({ tank: plainLoadout('tank', rar), healer: plainLoadout('healer', rar), dps: plainLoadout('dps', rar) });
const rangerSeat = (rar: 0 | 1 | 2 | 3, extra: object = {}) => ({ ...gear(rar), dps: { ...plainLoadout('healer', rar), cls: 'ranger', ...extra } });
const mageSeat = (rar: 0 | 1 | 2 | 3) => ({ ...gear(rar), dps: { ...plainLoadout('dps', rar), cls: 'mage' } });
const SEEDS: [string, number][] = [['dps', 7921], ['tank', 15842], ['healer', 303]];
const avgClear = (loadouts: Record<string, unknown>, o: Record<string, unknown> = {}): number => {
  const runs = SEEDS.map(([role, seed]) => simRun({ role: role as 'dps', seed, loadouts, ...o }));
  for (const r of runs) assert.equal(r.over, 'victory', `seed ${r.seed} did not clear`);
  return runs.reduce((a, r) => a + r.clear!, 0) / runs.length;
};

test('ranger bot: in a Common party it clears the Barrow without wiping, about as fast as a mage, stopping casts and laying traps on the way', () => {
  const ranger = avgClear(rangerSeat(0)), mage = avgClear(mageSeat(0));
  assert.ok(Math.abs(ranger / mage - 1) < 0.08, `a ranger ${ranger.toFixed(0)}s, a mage ${mage.toFixed(0)}s`);
  const r = simRun({ role: 'dps', seed: 7921, loadouts: rangerSeat(0) });
  assert.equal(r.wipes, 0);
  assert.ok(r.stats.kicks > 0, 'it stops casts');
  const me = r.heroes.find((h) => h.cls === 'ranger')!;
  assert.ok(me.dmg > 15000 && me.auto === 0, `its buttons do the damage: ${me.dmg}`);
});

test('ranger bot: alone it dies before Sir Rattlebones; with a warrior it goes as far as a mage with one', () => {
  const solo = simRun({ role: 'dps', seed: 505, solo: true, loadouts: { dps: { ...plainLoadout('healer', 0), cls: 'ranger' } } });
  assert.equal(solo.over, 'lost');
  assert.ok(!solo.packs.some((p) => p.id === 'K' && p.cleared != null));
  // until going down and getting picked up land (stream 2), a pair with no healer gets as far as the first boss
  const pair = (cls: string) => simRun({ role: 'dps', seed: 7921, party: [{ cls, isPlayer: true }, { cls: 'warrior' }], maxWipes: 3 });
  const r = pair('ranger'), m = pair('mage');
  const cleared = (x: typeof r) => x.packs.filter((p) => p.cleared != null).length;
  assert.ok(cleared(r) >= Math.min(3, cleared(m)), `the ranger's pair cleared ${cleared(r)} packs, the mage's ${cleared(m)}`);
  assert.ok(r.heroes[0].dmg > r.heroes[1].dmg, 'and does the most damage of the pair');
});

/** a ranger's talents at a level: its spec and every point spent down the tree in order, these picks on rows 2 to 5 */
function built(spec: string, picks: number[], level: number): TalentLoadout {
  const s = SPECS[spec], p = freshProfile(1);
  // nobody can make a ranger until its art lands: a mage switched to it spends the points the same
  const h = Object.assign(newHero(p, { name: 'Sim Hero', race: 'elf', cls: 'mage' })!, { cls: 'ranger' });
  p.xp = xpForLevel(level);
  pickSpec(h, spec);
  for (let pass = 0; pass < 6; pass++) for (const t of s.talents) {
    if (t.choice && s.talents.filter((x) => x.choice === t.choice)[picks[t.row - 2] ?? 0] !== t) continue;
    while (addPoint(p, h, spec, t.id));
  }
  return talentLoadout(p, h);
}

test('ranger: a full tree (level 30) clears Common 7 to 28% faster, Longbow and Trapper both', () => {
  const base = avgClear(rangerSeat(0));
  for (const spec of ['longbow', 'trapper']) {
    const t = avgClear(rangerSeat(0, built(spec, [0, 0, 0, 0], 30)));
    const k = t / base;
    assert.ok(k > 0.72 && k < 0.93, `${spec}'s full tree: ${t.toFixed(0)}s against ${base.toFixed(0)}s (${Math.round((1 - k) * 100)}% faster)`);
  }
});

test('ranger: in the Barrow’s set at level 30 its two specs clear within 10% of each other, and at level 22 in 1:00 to 1:30', () => {
  const W = (id: string, slot: 'weapon' | 'helm' | 'shoulders' | 'chest', trait?: string) => ({ slot, def: ITEMS[id], trait, unique: true });
  const kit = loadoutOf([W('candlewake.helm', 'helm'), W('candlewake.shoulders', 'shoulders'), W('candlewake.chest', 'chest'), W('gravekeeper.healer', 'weapon', 'cleanthrough')]);
  const at = (spec: string, picks: number[], level: number, seeds: number[]) => {
    const L = { ...gear(3), dps: { ...kit, cls: 'ranger', ...built(spec, picks, level) } };
    const runs = seeds.map((seed) => simRun({ role: 'dps', seed, loadouts: L, might: levelBonus(level) }));
    for (const r of runs) assert.equal(r.over, 'victory', `${spec} at level ${level} did not clear`);
    return runs.reduce((a, r) => a + r.clear!, 0) / runs.length;
  };
  const lb = at('longbow', [1, 1, 1, 0], 30, [101, 202]), tr = at('trapper', [0, 0, 0, 0], 30, [101, 202]);
  assert.ok(Math.abs(lb / tr - 1) < 0.1, `Longbow ${lb.toFixed(0)}s against Trapper ${tr.toFixed(0)}s`);
  const t22 = at('trapper', [0, 0, 0, 0], 22, [101]);
  assert.ok(t22 > 60 && t22 < 90, `level 22 in the Gravewood: ${t22.toFixed(0)}s`);
});

test('ranger: every trait, set bonus and bow runs in a real clear', () => {
  const kit = { cls: 'ranger', power: 1.2, traits: ['cleanthrough', 'keenfletch', 'steadyaim'], weaponRar: 3, spec: 'trapper', tal: ['tr.twin', 'tr.fork', 'tr.downpour', 'tr.cloud'] };
  for (const [bonuses, unique] of [[['gravewood2', 'gravewood3', 'cw_helm', 'cw_shoulders', 'cw_chest'], 'longnight'], [['thistledown2', 'thistledown3', 'sb_helm', 'sb_shoulders', 'sb_chest'], 'cogspring']] as [string[], string][]) {
    const r = simRun({ role: 'dps', seed: 606, loadouts: { ...gear(2), dps: { ...kit, bonuses, unique } } });
    assert.equal(r.over, 'victory', unique);
    assert.equal(r.wipes, 0, unique);
  }
});
