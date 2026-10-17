/// <reference types="node" />
/**
 * Your setup, my payoff (docs/duo.md, Combos): every class leaves something on a foe, and any payoff on a foe your
 * mate set up is a COMBO: half again as hard, a gold pop, the setup's own extra, counted for both of you. A combo
 * uses its setup up, except Exposed (the window you hit together); your own setups never make one.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtHero } from '../src/dungeon/entities.js';
import { useAbility } from '../src/dungeon/heroes.js';
import { projHit } from '../src/dungeon/buttons.js';
import { spawnMob } from '../src/dungeon/mobs.js';
import { addBurn, burnOf } from '../src/dungeon/fire.js';
import { COMBO, comboFor, heroAt, kick, setUp } from '../src/dungeon/duo.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';

/** a pair alone in a quiet room: `a` (you) and `b`, no foes but the ones you make */
function duo(a: string, b: string, specs: [string | null, string | null] = [null, null]) {
  newGame(BARROW_ENGINE, { seed: 3, start: 'entrance', auto: false, quiet: true, noEvents: true, party: [{ cls: a, isPlayer: true, loadout: { spec: specs[0] } }, { cls: b, loadout: { spec: specs[1] } }] });
  const s = S as any;
  s.mobs = [];
  const [me, mate] = [heroAt(0), heroAt(1)];
  mate.x = me.x + 60; mate.y = me.y;
  return { s, me, mate };
}
function foe(x: number, y: number, hp = 1e6, type = 'rattler'): any {
  const m = spawnMob(type, x, y, null) as any;
  m.state = 'fight'; m.rise = 0; m.fightT = 5; m.hp = m.maxHp = hp; m.atkT = 99;
  return m;
}
/** press now, the beat and cooldown out of the way */
function press(h: any, slot: string, aim?: unknown): boolean {
  h.beat = 0; h.gcd = 0; h.cd[slot] = 0; h.mana = 100;
  return useAbility(h, slot, aim ?? null);
}
const land = (s: any) => { for (const p of s.projs.splice(0)) if (p.team === 'hero') projHit(p); };
const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };
/** a Crush of the warrior's on one foe, with no crit: what it took off */
function crush(w: any, m: any): number {
  w.face = Math.atan2(m.y - w.y, m.x - w.x); w.crush = 1;
  const hp = m.hp;
  press(w, 'a1', m);
  return hp - m.hp;
}

test('combos: the warrior’s Crush on a foe his mate stunned is a COMBO: half again as hard, counted for both, and the stun lasts a beat longer', () => {
  const { s, me, mate } = duo('warrior', 'warrior');
  const m = foe(me.x, me.y - 70);
  m.st.stun = 0.5;
  setUp(m, mate, 'stun', 0.5);
  assert.equal(comboFor(m, me), 'stun');
  assert.equal(comboFor(m, mate), null, 'never your own');
  // the same Crush, with and without the combo (crits rolled out of it: Headsman-free, 20% chance, so try a few)
  let plain = Infinity, comboed = 0;
  for (let i = 0; i < 12; i++) { m.setups = {}; m.st.stun = 0.5; plain = Math.min(plain, crush(me, m)); }
  for (let i = 0; i < 12; i++) { m.st.stun = 0.5; setUp(m, mate, 'stun', 0.5); const d = crush(me, m); comboed = comboed ? Math.min(comboed, d) : d; }
  assert.ok(Math.abs(comboed / plain - COMBO) < 0.05, `${comboed} against ${plain}`);
  assert.equal(s.duel[me.id].combosLanded, 12);
  assert.equal(s.duel[mate.id].combosSet, 12);
  assert.ok(m.st.stun > 1, 'knocked down: the stun lasts a beat longer');
  assert.equal(comboFor(m, me), null, 'the combo used the setup');
  assert.ok(s.texts.some((t: any) => t.str === 'COMBO!'));
});

test('combos: what each class leaves on a foe: the warrior’s Charge and Slam stun, Frost freezes, Fire’s Burn at 3, the rogue’s poison, and an interrupt Exposes', () => {
  const { me, mate } = duo('warrior', 'mage');
  const a = foe(me.x, me.y - 150), b = foe(me.x + 40, me.y - 150);
  press(me, 'a2', a);
  step(0.6);
  assert.equal(comboFor(a, mate), 'stun', 'Charge');
  a.setups = {}; a.st.stun = 0;
  a.x = me.x; a.y = me.y - 100;
  press(me, 'a3');
  assert.equal(comboFor(a, mate), 'stun', 'the pile Slam makes');
  assert.equal(a.st.stun, 0, 'but Slam never stuns: it stops no cast');
  // Frost: Rime burst freezes, Blizzard chills what stands in it
  const c = foe(mate.x + 60, mate.y);
  press(mate, 'a2');
  assert.equal(comboFor(c, me), 'freeze', 'Rime burst');
  const d = foe(mate.x, mate.y - 400);
  press(mate, 'a1', { x: d.x, y: d.y });
  step(0.6);
  assert.equal(comboFor(d, me), 'freeze', 'Blizzard');
  // Fire: three Burn
  addBurn(mate, b, 2);
  assert.equal(comboFor(b, me), null, 'two Burn is no setup');
  addBurn(mate, b, 1);
  assert.equal(comboFor(b, me), 'burn');
  // an interrupt Exposes, and that's the mate's setup
  const e = foe(me.x, me.y + 300);
  e.cast = { t: 0, dur: 3, kick: true, done: () => {} };
  kick(e, mate);
  assert.ok(e.exposed > 0);
  assert.equal(comboFor(e, me), 'expose');

  const r = duo('rogue', 'warrior');
  const f = foe(r.me.x, r.me.y - 70);
  press(r.me, 'a1', f);
  assert.equal(comboFor(f, r.mate), 'poison', 'Viper Blades');
  assert.equal(comboFor(f, r.me), null);
});

test('combos: a perfect block, or a perfect dodge, Exposes the boss for your mate, and Exposed stays for every payoff in the window', () => {
  newGame(BARROW_ENGINE, { seed: 9, start: 'keeper', auto: false, quiet: true, noEvents: true, party: [{ cls: 'warrior', isPlayer: true }, { cls: 'rogue' }] });
  const s = S as any;
  const [me, mate] = [heroAt(0), heroAt(1)];
  const boss = s.mobs.find((m: any) => m.type === 'keeper');
  boss.state = 'fight'; boss.x = me.x; boss.y = me.y - 150; boss.hp = boss.maxHp = 1e7;
  me.face = Math.atan2(boss.y - me.y, boss.x - me.x); me.blocking = true; me.blockT = 0.1;
  hurtHero(me, 200, boss, { heavy: true });
  assert.ok(boss.exposed > 0, 'a perfect block');
  assert.equal(comboFor(boss, mate), 'expose');
  mate.x = boss.x; mate.y = boss.y + boss.r + mate.r + 4;
  mate.points = 5;
  press(mate, 'a2', boss);
  assert.equal(s.duel[mate.id].combosLanded, 1, 'Shadowstrike in the window');
  assert.equal(comboFor(boss, mate), 'expose', 'Exposed stays for the next payoff');
});

test('combos: a Crush on a foe the mage froze bursts ice on the foes round it; a Shatter on a foe the rogue poisoned cashes the venom in', () => {
  const { me, mate } = duo('warrior', 'mage');
  const m = foe(me.x, me.y - 70), side = foe(me.x + 200, me.y - 70);
  side.x = m.x + 80; side.y = m.y - 40;
  m.st.freeze = 3;
  setUp(m, mate, 'freeze', 3);
  const s0 = side.hp;
  me.face = -Math.PI / 2;
  me.crush = 1;
  // a narrow Cleave so only m is in it: the side one is behind it
  side.x = m.x; side.y = m.y - 90;
  press(me, 'a1', m);
  assert.ok(side.hp < s0, 'the ice burst on the foe beside it');

  const r = duo('mage', 'rogue');
  const t = foe(r.me.x, r.me.y - 300);
  t.st.freeze = 3;
  r.mate.x = t.x; r.mate.y = t.y + 50;
  press(r.mate, 'a1', t);
  assert.ok(t.bleed && t.bleed.left > 0, 'poisoned');
  press(r.me, 'a4', t);
  land(r.s);
  assert.equal(r.s.duel[r.me.id].combosLanded, 1, 'the Shatter was a COMBO');
  assert.equal(t.bleed, null, 'and it cashed the venom in at once');
});

test('combos: a Shadowstrike on a foe the Fire mage set burning spreads the Burn to the foes round it; a payoff on a marked foe always crits', () => {
  const { s, me, mate } = duo('rogue', 'mage', [null, 'fire']);
  const t = foe(me.x, me.y - 60), near = foe(me.x + 70, me.y - 80);
  addBurn(mate, t, 4);
  assert.equal(burnOf(near), 0);
  me.points = 3;
  press(me, 'a2', t);
  assert.ok(burnOf(near) >= 3, `the Burn spread: ${burnOf(near)}`);
  assert.equal(s.duel[mate.id].combosSet, 1);
  // a mark (the ranger's, when it lands) makes the payoff a crit
  let crits = 0;
  for (let i = 0; i < 8; i++) {
    t.setups = {}; t.bleed = null;
    setUp(t, mate, 'mark', 4);
    me.points = 1;
    const hp = t.hp;
    press(me, 'a2', t);
    if (hp - t.hp > 28 * me.power * 1.5 * 1.5) crits++;
  }
  assert.equal(crits, 8, 'every one a crit');
});
