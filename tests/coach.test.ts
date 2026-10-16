/// <reference types="node" />
/**
 * The coach: for a class's first runs the HUD glows the one button whose moment has come. These set up a
 * moment by hand and check the coach names the right button (or, for a healer, the frame to tap).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { momentFor } from '../src/dungeon/coach.js';
import { curseHero } from '../src/dungeon/mobs.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { plainLoadout } from '../src/meta/gear';

/** a fight in the first room with the party standing together; `cls` picks a rogue for the DPS seat */
function fight(role: 'tank' | 'healer' | 'dps', cls?: string) {
  const loadouts: Record<string, unknown> = cls === 'rogue' ? { dps: { ...plainLoadout('dps', 0, 'rogue'), cls: 'rogue' } } : {};
  newGame(BARROW_ENGINE, { role, seed: 7, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts });
  const s = S as any;
  const by = (r: string) => s.heroes.find((h: any) => h.role === r);
  const tank = by('tank'), healer = by('healer'), dps = by('dps');
  tank.x = 500; tank.y = 4700; healer.x = 440; healer.y = 4800; dps.x = 560; dps.y = 4800;
  const mobs = s.packs[0].mobs;
  for (const m of mobs) { m.state = 'fight'; m.x = 500; m.y = 4300; }
  s.inCombat = true;
  return { s, tank, healer, dps, mobs, me: s.player };
}
const tankBuster = (s: any, on: any, t = 0.8) => s.hazards.push({ shape: 'cone', x: on.x, y: on.y - 120, a: Math.PI / 2, r: 150, arc: 2.27, warn: 1.4, t, dmg: 295, heavy: true, block: true, src: s.packs[0].mobs[0], tankBuster: true });

test('coach: a healer is told to Ward before a big hit lands on the tank, and not while Ward is cooling down', () => {
  const { s, tank, me } = fight('healer');
  tankBuster(s, tank);
  assert.deepEqual(momentFor(me), { slot: 'a2', tag: 'WARD!' });
  me.cd.a2 = 2;
  assert.notEqual(momentFor(me)?.slot, 'a2');
});

test('coach: a healer is told to Sunburst when two mates are under half or anyone is cursed', () => {
  const { tank, dps, me, mobs } = fight('healer');
  tank.hp = tank.maxHp * 0.4; dps.hp = dps.maxHp * 0.45;
  assert.deepEqual(momentFor(me), { slot: 'a3', tag: 'HEAL ALL!' });
  tank.hp = tank.maxHp; dps.hp = dps.maxHp;
  curseHero(mobs[3], dps);
  assert.deepEqual(momentFor(me), { slot: 'a3', tag: 'LIFT!' });
});

test('coach: a healer is shown the frame to tap for one hurt mate, a Prayer circle when the party is bunched, Smite when all are topped up', () => {
  const { tank, dps, me, mobs } = fight('healer');
  dps.hp = dps.maxHp * 0.5;
  assert.deepEqual(momentFor(me), { frame: 'dps', tag: 'TAP' });
  dps.hp = dps.maxHp * 0.85;
  assert.deepEqual(momentFor(me), { slot: 'a1', tag: 'CIRCLE!' });
  dps.x = tank.x + 600;
  assert.notEqual(momentFor(me)?.slot, 'a1', 'not bunched: no circle');
  dps.hp = dps.maxHp;
  tank.target = mobs[0];
  assert.deepEqual(momentFor(me), { slot: 'a4', tag: 'SMITE!' });
});

test('coach: nothing out of a fight, and a hit about to land on you is a roll first', () => {
  const { s, me } = fight('healer');
  s.hazards.push({ shape: 'circle', x: me.x, y: me.y, r: 80, warn: 1.2, t: 0.6, dmg: 200, src: s.packs[0].mobs[0] });
  assert.deepEqual(momentFor(me), { slot: 'dodge', tag: 'ROLL!' });
  s.inCombat = false;
  assert.equal(momentFor(me), null);
});

test('coach: the tank blocks a big hit, taunts what is on a mate, pulls a pack, charges what got away, cleaves what is in reach', () => {
  const { s, tank, dps, mobs, me } = fight('tank');
  for (const m of mobs) { m.x = tank.x + 700; m.y = tank.y; m.target = tank; }
  mobs[1].x = tank.x; mobs[1].y = tank.y - 60;
  assert.deepEqual(momentFor(me), { slot: 'a1', tag: 'CLEAVE!' });
  for (const m of mobs) { m.x = tank.x; m.y = tank.y - 60; }
  assert.deepEqual(momentFor(me), { slot: 'a3', tag: 'PULL!' });
  mobs[0].x = dps.x; mobs[0].y = dps.y + 40; mobs[0].target = dps;
  assert.deepEqual(momentFor(me), { slot: 'a3', tag: 'TAUNT!' });
  me.cd.a3 = 4;
  mobs[0].x = tank.x + 320; mobs[0].y = tank.y;
  assert.deepEqual(momentFor(me), { slot: 'a2', tag: 'PEEL!' });
  tankBuster(s, tank, 0.9);
  assert.deepEqual(momentFor(me), { slot: 'a4', tag: 'BLOCK!' });
});

test('coach: the mage freezes what is on top of it, shatters what is frozen, storms a pack, comets a big one', () => {
  const { tank, mobs, me, s } = fight('dps');
  for (const m of mobs) { m.x = me.x + 60; m.y = me.y; }
  assert.deepEqual(momentFor(me), { slot: 'a2', tag: 'FREEZE!' });
  me.cd.a2 = 9;
  mobs[0].st.freeze = 2;
  assert.deepEqual(momentFor(me), { slot: 'a4', tag: 'SHATTER!' });
  mobs[0].st.freeze = 0;
  for (const m of mobs) { m.x = tank.x; m.y = tank.y - 80; }
  assert.deepEqual(momentFor(me), { slot: 'a1', tag: 'STORM!' });
  me.cd.a1 = 5;
  const brute = s.packs[1].mobs.find((m: any) => m.type === 'brute');
  brute.state = 'fight'; brute.x = tank.x; brute.y = tank.y - 90;
  me.target = brute;
  assert.deepEqual(momentFor(me), { slot: 'a3', tag: 'COMET!' });
});

test('coach: the rogue fans a pack, blinks to a far target, poisons a fresh one and crits a poisoned one', () => {
  const { mobs, me } = fight('dps', 'rogue');
  assert.equal(me.cls, 'rogue');
  const t = mobs[0];
  for (const m of mobs.slice(1)) { m.x = me.x + 600; m.y = me.y; }
  t.x = me.x + 220; t.y = me.y;
  me.target = t;
  assert.deepEqual(momentFor(me), { slot: 'a4', tag: 'BLINK!' });
  t.x = me.x + 40;
  assert.deepEqual(momentFor(me), { slot: 'a1', tag: 'VENOM!' });
  t.bleed = { left: 4, per: 30, next: 0.5, src: me };
  assert.deepEqual(momentFor(me), { slot: 'a2', tag: 'CRIT!' });
  mobs[1].x = me.x + 50; mobs[1].y = me.y + 20;
  assert.deepEqual(momentFor(me), { slot: 'a3', tag: 'FAN!' });
});
