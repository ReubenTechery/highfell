/// <reference types="node" />
/**
 * The house's bits move on its canvas the way their CSS animations used to move them (housemotion.ts): the fire's
 * two frames and the smoke's four take turns, a new frame every 0.45s; the flock is out of sight once it has
 * crossed; a mount wanders 34 units each way and turns round; something new pops in once; held still (reduced
 * motion) each shows its first frame.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motion } from '../src/ui/housemotion';

type Box = [number, number, number, number];
const BOX: Box = [100, -200, 60, 80];
/** how opaque a bit is at t seconds (0 when out of sight) */
const op = (cls: string, t: number, born = 0, still = false): number => motion(cls, BOX, t, born, still)?.a ?? 0;
/** where a point of the box goes at t seconds */
const at = (cls: string, t: number, x: number, y: number): [number, number] => {
  const m = motion(cls, BOX, t, 0, false)!.m;
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
};

test('housemotion: the fire’s frames take turns every 0.45s, the smoke’s four one after another', () => {
  for (const t of [0.1, 0.5, 1.0, 1.4, 2.0]) {
    assert.equal(op('fire-a', t) + op('fire-b', t), 1, `one fire frame at ${t}s`);
    const shown = [0, 1, 2, 3].filter((i) => op(`smoke s${i}`, t) > 0);
    assert.equal(shown.length, 1, `one smoke frame at ${t}s`);
  }
  assert.ok(op('fire-a', 0.2) > 0 && op('fire-b', 0.6) > 0);
  assert.deepEqual([0.1, 0.5, 1.0, 1.5].map((t) => [0, 1, 2, 3].find((i) => op(`smoke s${i}`, t) > 0)), [0, 1, 2, 3], 'the puffs climb');
});

test('housemotion: the flock crosses the sky and is out of sight until it comes round again', () => {
  // coming home it is 8s into its 66s: on its way
  assert.ok(op('flock', 0.1) > 0);
  const [x0] = at('flock', 0.1, 100, -200), [x1] = at('flock', 20, 100, -200);
  assert.ok(x1 - x0 > 2000, 'it flies a long way right');
  assert.equal(op('flock', 40) + op('flock b', 40), 0, 'past the right edge it waits out of sight');
  assert.equal(op('flock', 0.2) + op('flock b', 0.2), 1, 'flapping: one frame of the wings at a time');
});

test('housemotion: a mount wanders 34 units each way and turns round, standing on its feet', () => {
  const xs = Array.from({ length: 171 }, (_, i) => at('wander w0', i / 10, 130, -120)[0] - 130);
  assert.ok(Math.max(...xs) > 33 && Math.min(...xs) < -33, 'out to 34 units either side');
  assert.ok(Math.max(...xs) < 35 && Math.min(...xs) > -35);
  const [, feet] = at('wander w0', 5, 130, -120);
  assert.equal(Math.round(feet), -120, 'its feet stay on the ground');
  const turned = motion('wander w0', BOX, 0.5 * 17, 0, false)!.m[0];
  assert.ok(turned < 0, 'half way through it faces the other way');
});

test('housemotion: something new pops in once; a breath and a bob stay small; held still, the first frame shows', () => {
  assert.ok(op('new-pop', 0.05, 0) < 0.5 && op('new-pop', 1, 0) === 1, 'it pops in, then stays');
  assert.equal(op('new-pop', 10.05, 10) < 0.5, true, 'from when it was first drawn');
  for (const t of [0.3, 0.8, 1.6, 2.9]) {
    const [, y] = at('breathe', t, 130, -150);
    assert.ok(Math.abs(y + 150) < 3, 'a breath is a small stretch');
    const [, top] = at('bob', t, 130, -200);
    assert.ok(top <= -200 + 0.01 && top > -205, 'a bob lifts a few units');
  }
  assert.equal(op('fire-b', 1, 0, true), 0, 'held still: the second frame is hidden');
  assert.equal(op('smoke s2', 1, 0, true), 0);
  assert.equal(op('fire-a', 1, 0, true), 1);
  assert.deepEqual(motion('wander w1', BOX, 7, 0, true)!.m, [1, 0, 0, 1, 0, 0], 'and nothing moves');
});
