/// <reference types="node" />
/**
 * Staying alive without a healer (docs/duo.md): at zero you go down, not out, and your mate stands beside you to
 * pick you up; both down is a wipe; out of a fight you're full again in about 2 seconds; every payoff heals a
 * little; and a dodge rolled just as a big hit lands is perfect: it misses you and opens the boss up.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, respawn, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtHero } from '../src/dungeon/entities.js';
import { doDodge, useAbility } from '../src/dungeon/heroes.js';
import { spawnMob } from '../src/dungeon/mobs.js';
import { PAYOFF_HEAL, PERFECT_DODGE, PICK_UP, REFILL, comboFor, heroAt, isDown, pickUp, pickUpOf, rescuer } from '../src/dungeon/duo.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';

/** a pair at the door, you in the first seat, nothing fighting */
const pair = (a = 'warrior', b = 'mage') => {
  newGame(BARROW_ENGINE, { seed: 5, start: 'entrance', auto: false, quiet: true, noEvents: true, party: [{ cls: a, isPlayer: true }, { cls: b }] });
  const s = S as any;
  s.mobs = s.mobs.filter((m: any) => m.isBoss);
  for (const m of s.mobs) { m.x += 5000; }
  return s;
};
const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };
/** knock a hero down: a hit too big to live through */
const fell = (h: any) => hurtHero(h, 1e7, null, { pierce: true, block: false, dodge: false });
/** a foe that fights, with plenty of health, at (x, y) */
function foe(x: number, y: number, hp = 20000, type = 'rattler'): any {
  const m = spawnMob(type, x, y, null) as any;
  m.state = 'fight'; m.rise = 0; m.fightT = 5; m.hp = m.maxHp = hp; m.atkT = 99;
  return m;
}

test('survival: at zero you go down, not out; your mate standing beside you picks you up at 40% in about 1.5 seconds', () => {
  const s = pair();
  const [me, mate] = [heroAt(0), heroAt(1)];
  const m = foe(me.x, me.y - 400);
  s.inCombat = true;
  fell(me);
  assert.equal(me.alive, false, 'down is not alive: nothing targets you');
  assert.ok(isDown(me));
  assert.equal(me.stats.deaths, 1, 'it counts as going down');
  assert.equal(s.over, false, 'your mate is still up: no wipe');
  // too far: nothing happens
  mate.x = me.x + PICK_UP.reach + 60; mate.y = me.y;
  step(2);
  assert.ok(isDown(me));
  assert.equal(rescuer(me), null);
  // beside you
  mate.x = me.x + 50;
  step(0.7);
  assert.ok(isDown(me) && pickUpOf(me) > 0.3 && pickUpOf(me) < 0.7, `half-way: ${pickUpOf(me).toFixed(2)}`);
  step(0.9);
  assert.ok(!isDown(me) && me.alive, 'picked up');
  assert.equal(me.hp, Math.round(me.maxHp * PICK_UP.hp));
  assert.equal(s.duel[mate.id].pickups, 1, 'it counts for your mate');
  assert.ok(m.alive);
});

test('survival: walking off loses the pick-up; a caged or stunned mate can’t do it; you can’t pick yourself up', () => {
  const s = pair('rogue', 'warrior');
  const [me, mate] = [heroAt(0), heroAt(1)];
  s.inCombat = true;
  foe(me.x, me.y - 400);
  fell(mate);
  me.x = mate.x + 40; me.y = mate.y;
  step(1);
  const half = pickUpOf(mate);
  assert.ok(half > 0.5);
  me.x += 400;
  step(0.3);
  assert.ok(pickUpOf(mate) < half - 0.2, 'it drains when you walk off');
  me.x = mate.x + 40; me.st.stun = 5;
  step(0.5);
  assert.equal(rescuer(mate), null, 'a stunned mate can’t');
  assert.equal(pickUp(mate, mate), false, 'nobody picks themselves up');
  assert.equal(pickUp(me, mate), false, 'only someone down can be picked up');
  me.st.stun = 0;
  assert.ok(pickUp(mate, me), 'a mate who is up can');
  assert.equal(mate.hp, Math.round(mate.maxHp * PICK_UP.hp));
});

test('survival: both down is a wipe; back at the checkpoint nobody is down', () => {
  const s = pair('mage', 'rogue');
  s.inCombat = true;
  foe(heroAt(0).x, heroAt(0).y - 400);
  fell(heroAt(1));
  step(0.1);
  assert.equal(s.over, false);
  fell(heroAt(0));
  step(0.1);
  assert.equal(s.over, 'wipe');
  assert.equal(pickUp(heroAt(0), heroAt(1)), false, 'no picking up after a wipe');
  step(2);
  respawn();
  step(0.1);
  assert.ok(s.heroes.every((h: any) => h.alive && !isDown(h) && h.hp === h.maxHp));
});

test('survival: a fight that ends with you down gets you up again, and out of a fight you’re full in about 2 seconds, no healer needed', () => {
  const s = pair('warrior', 'rogue');
  const [me, mate] = [heroAt(0), heroAt(1)];
  const m = foe(me.x, me.y - 70, 1e6);
  step(0.2);
  assert.ok(s.inCombat);
  fell(mate);
  mate.x += 600;
  me.hp = Math.round(me.maxHp * 0.1);
  m.hp = 1; m.alive = false; m.state = 'dead';
  step(0.1);
  assert.equal(s.inCombat, false);
  assert.ok(!s.heroes.some((h: any) => h.role === 'healer'), 'no healer in the pair');
  step(REFILL.after + 1.6);
  assert.equal(me.hp, me.maxHp, 'full again about 2 seconds after the fight');
  step(1.5);
  assert.ok(mate.alive && !isDown(mate), 'up again once the fight is over');
  step(2.5);
  assert.equal(mate.hp, mate.maxHp);
});

test('survival: in a fight there is no refill, but every payoff heals you a little', () => {
  const s = pair('warrior', 'mage');
  const me = heroAt(0);
  heroAt(1).x += 3000;
  const m = foe(me.x, me.y - 70);
  me.face = -Math.PI / 2;
  step(0.2);
  me.hp = Math.round(me.maxHp * 0.5);
  step(1);
  assert.equal(me.hp, Math.round(me.maxHp * 0.5), 'no refill while something fights');
  me.crush = 1; me.beat = 0;
  assert.ok(useAbility(me, 'a1', m));
  assert.ok(me.hp > me.maxHp * 0.5, 'a Crush heals');
  assert.ok(me.hp - me.maxHp * 0.5 <= me.maxHp * PAYOFF_HEAL + 1, 'a little: once a press, however many it hit');
  const before = me.hp;
  me.beat = 0;
  assert.ok(useAbility(me, 'a1', m));
  assert.equal(me.hp, before, 'a Cleave that isn’t a payoff doesn’t');
  assert.ok(s.inCombat);
});

test('survival: a dodge rolled just as a big hit lands is perfect: no damage, PERFECT!, and the boss is opened up for your mate', () => {
  newGame(BARROW_ENGINE, { seed: 9, start: 'keeper', auto: false, quiet: true, noEvents: true, party: [{ cls: 'mage', isPlayer: true }, { cls: 'rogue' }] });
  const s = S as any;
  const me = heroAt(0), mate = heroAt(1);
  const boss = s.mobs.find((m: any) => m.type === 'keeper');
  boss.state = 'fight'; boss.x = me.x; boss.y = me.y - 200;
  doDodge(me, 1, 0);
  const hp = me.hp;
  assert.equal(hurtHero(me, 300, boss, { heavy: true, hazard: true }), 0);
  assert.equal(me.hp, hp);
  assert.ok(boss.exposed > 3, 'Exposed');
  assert.equal(me.stats.perfectDodges, 1);
  assert.ok(s.texts.some((t: any) => t.str === 'PERFECT!'));
  assert.equal(comboFor(boss, mate), 'expose', 'a setup for your mate');
  assert.equal(comboFor(boss, me), null, 'not for you');
  // once a dodge
  boss.exposed = 0;
  hurtHero(me, 300, boss, { heavy: true, hazard: true });
  assert.equal(boss.exposed, 0, 'one perfect dodge a roll');
  // too late in the roll, or a small hit: only a dodge
  step(1.7);
  me.cd.dodge = 0;
  doDodge(me, 1, 0);
  s.t += PERFECT_DODGE + 0.05;
  assert.equal(hurtHero(me, 300, boss, { heavy: true, hazard: true }), 0, 'still dodged');
  assert.equal(boss.exposed, 0, 'but not perfect');
  me.cd.dodge = 0; me.dodgeT = 0; me.iframe = 0;
  doDodge(me, 1, 0);
  const r = foe(me.x + 40, me.y, 100);
  hurtHero(me, 20, r, {});
  assert.equal(r.exposed || 0, 0, 'a skeleton’s swing isn’t a big hit');
});
