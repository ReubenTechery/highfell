/// <reference types="node" />
/**
 * The combos on bosses. Bosses never freeze or stun, but the combos still land: frost leaves a boss Chilled
 * (Icicle and Comet shatter him for 1.5x), a knock that would stun Staggers him (a stun for Cleave and Headsman,
 * and he carries on with what he was doing), and Slam taunts and spins without dragging him.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S, setHooks } from '../src/dungeon/state.js';
import { CHILL, SHATTERLANCE_CHILL, STAGGER, hurtMob, stunned } from '../src/dungeon/entities.js';
import { abCd, useAbility } from '../src/dungeon/heroes.js';
import { momentFor } from '../src/dungeon/coach.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';

const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };
/* the Gravekeeper in a fight close to the party, too tough to finish, his own moves held back */
const yard = (role: string) => {
  newGame(BARROW_ENGINE, { role, seed: 99, start: 'keeper', auto: false, quiet: true, noEvents: true, loadouts: {} });
  const s = S as any;
  const by = (r: string) => s.heroes.find((h: any) => h.role === r);
  const boss = s.mobs.find((m: any) => m.type === 'keeper');
  const me = by(role);
  boss.state = 'fight'; boss.hp = boss.maxHp = 1e6;
  Object.assign(boss.ab, { init: true, t: 0, smash: 99, toss: 99, hands: 99 });
  boss.x = me.x; boss.y = me.y - 120;
  return { s, boss, me, tank: by('tank') };
};
/* one hit of 100 on the boss with no crit roll, and what it took off */
const hit = (boss: any, src: any, o: Record<string, unknown> = {}) => { const hp = boss.hp; hurtMob(boss, 100, src, { quiet: true, crit: 0, ...o }); return hp - boss.hp; };

test('combos: Rime burst Chills a boss for 4s instead of freezing him, and Icicle and Comet shatter him for 1.5x', () => {
  const { s, boss, me } = yard('dps');
  assert.ok(useAbility(me, 'a2', null));
  assert.equal(boss.st.freeze, 0, 'never frozen');
  assert.equal(boss.st.chill, CHILL, 'Chilled');
  assert.ok(s.texts.some((t: any) => t.str === 'Chilled'));
  const plain = hit(boss, me, { noCrit: true });
  assert.equal(hit(boss, me, { noCrit: true, shatter: 3 }), Math.round(plain * 1.5), 'Icicle: 1.5x, where frozen trash takes 3x');
  assert.equal(hit(boss, me, { noCrit: true, shatter: 2 }), Math.round(plain * 1.5), 'Comet: 1.5x, where frozen trash takes 2x');
  assert.equal(hit(boss, me, { noCrit: true, shatter: 3, chillShatter: SHATTERLANCE_CHILL }), Math.round(plain * 2), 'Comet with Shatterlance: 2x');

  // a real Icicle: the shatter text and sound, and the boss flashes
  const sounds: string[] = [];
  setHooks({ sound: (n: string) => { sounds.push(n); } });
  s.quiet = false;
  me.cd.a4 = 0;
  assert.ok(useAbility(me, 'a4', boss));
  for (let i = 0; i < 40 && !s.texts.some((t: any) => t.str === 'Shatter'); i++) update(1 / 60);
  setHooks({ sound: () => {} });
  s.quiet = true;
  assert.ok(s.texts.some((t: any) => t.str === 'Shatter'), 'the shatter text');
  assert.ok(sounds.includes('shatter'), 'the shatter sound');
  assert.ok(boss.flash > 0, 'the boss flashes');

  // it wears off (a little after 4s: the shatter's hitstop held the world still for a moment)
  step(CHILL + 0.5);
  assert.equal(boss.st.chill, 0);
  assert.equal(hit(boss, me, { noCrit: true, shatter: 3 }), plain, 'no shatter once the chill is gone');
});

test('combos: Comet shatters a Chilled boss and Rimebone gives back half its cooldown; the Gravefrost Staff Chills a boss for 2s', () => {
  const { s, boss, me } = yard('dps');
  me.bonuses.add('rimebone2');
  boss.st.chill = CHILL;
  assert.ok(useAbility(me, 'a3', boss));
  step(1.4);
  assert.ok(s.texts.some((t: any) => t.str === 'Shatter!'), 'the shatter text');
  assert.ok(me.cd.a3 <= abCd(me, 'a3') / 2 + 0.01, `half its cooldown back (${me.cd.a3.toFixed(2)}s left)`);

  boss.st.chill = 0;
  me.unique = 'gravefrost'; me.cd.a3 = 0;
  assert.ok(useAbility(me, 'a3', boss));
  step(1.4);
  assert.ok(boss.st.chill > 1.5 && boss.st.chill <= 2, `Chilled by the Gravefrost Staff (${boss.st.chill.toFixed(2)}s)`);
  assert.equal(boss.st.freeze, 0, 'never frozen');
});

test('combos: Charge Staggers a boss without stunning him or stopping his swing, and it counts as a stun for Headsman', () => {
  const { s, boss, me } = yard('tank');
  // he is mid-swing: a Shovel Smash on its way to the tank
  boss.act = { k: 'smash', t: 0, dur: 2.3, tgt: me };
  const smash = { shape: 'circle', x: me.x, y: me.y, r: 72, warn: 1.85, t: 0, src: boss, followT: me, followFor: 1.4, tankBuster: true, smash: true };
  s.hazards.push(smash);
  assert.ok(useAbility(me, 'a2', boss));
  for (let i = 0; i < 40 && !(boss.st.stagger > 0); i++) update(1 / 60);
  assert.ok(boss.st.stagger > 0 && boss.st.stagger <= STAGGER, 'Staggered');
  assert.equal(boss.st.stun, 0, 'not stunned');
  assert.ok(stunned(boss), 'a stun as far as the combos go');
  assert.ok(s.texts.some((t: any) => t.str === 'Staggered'));
  step(0.2);
  assert.ok(boss.act && boss.act.k === 'smash', 'his swing carries on');
  assert.ok(s.hazards.includes(smash), 'and so does its telegraph');

  // Headsman: hits on a Staggered boss always crit
  me.traits.add('headsman');
  boss.st.stagger = STAGGER;
  const staggered = hit(boss, me);
  boss.st.stagger = 0;
  assert.equal(staggered, hit(boss, me) * 2);
});

test('combos: the Gravedigger’s tremor Staggers a boss; Slam taunts him and spins but never drags him', () => {
  const { boss, me } = yard('tank');
  boss.y = me.y - 100;
  me.unique = 'gravedigger'; me.swings = 4;
  assert.ok(useAbility(me, 'a1', boss));
  assert.ok(boss.st.stagger > 0, 'the fifth swing Staggers him');
  assert.equal(boss.st.stun, 0, 'not stunned');

  boss.y = me.y - 150;
  boss.st.kx = boss.st.ky = 0;
  assert.ok(useAbility(me, 'a3', null));
  assert.equal(boss.forced, me, 'taunted');
  assert.ok(me.whirlT > 0, 'the whirlwind spins');
  assert.equal(boss.st.kx, 0, 'no drag');
  assert.equal(boss.st.ky, 0, 'no drag');
});

test('combos: the coach points a new mage at the boss combo: CHILL! beside him, then SHATTER!', () => {
  const { s, me } = yard('dps');
  s.inCombat = true;
  assert.deepEqual(momentFor(me), { slot: 'a2', tag: 'CHILL!' });
  assert.ok(useAbility(me, 'a2', null));
  assert.deepEqual(momentFor(me), { slot: 'a4', tag: 'SHATTER!' });
});

test('combos: a bot mage steps in to Chill the boss at a calm moment, then shatters him', () => {
  newGame(BARROW_ENGINE, { role: 'tank', seed: 99, start: 'keeper', auto: true, quiet: true, noEvents: true, loadouts: {} });
  const s = S as any;
  for (const h of s.heroes) h.hp = h.maxHp = 1e6;
  for (let i = 0; i < 60 * 30 && !s.boss; i++) update(1 / 60);
  assert.ok(s.boss, 'pulled');
  let chilled = false, shattered = false;
  for (let i = 0; i < 60 * 30 && !(chilled && shattered); i++) {
    update(1 / 60);
    if (s.boss && s.boss.st.chill > 0) chilled = true;
    if (chilled && s.boss && s.boss.st.chill > 0 && s.boss.flash > 0) shattered = true;
  }
  assert.ok(chilled, 'the bot mage Chilled him');
  assert.ok(shattered, 'and hit him while he was Chilled');
});
