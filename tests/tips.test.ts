/// <reference types="node" />
/**
 * First-time tips: which one the house shows (the welcome tour, then the garden's as each first comes) and which
 * the Dungeons door shows (your Warband, then your first bottle), each once.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUNGEONS } from '../src/content';
import { GROW_CLEARS } from '../src/content/vale';
import { freshProfile, migrate, startHearthTour, type Profile } from '../src/meta/profile';
import { newHero } from '../src/meta/gear';
import { beginHarvest, brew, endHarvest, growBeds, plant, rollSeeds } from '../src/meta/vale';
import { doorTip, finishTip, houseTip } from '../src/meta/tips';

const T0 = Date.UTC(2026, 9, 16, 2);
const BARROW = DUNGEONS.barrow;
const withHero = (): Profile => { const p = freshProfile(T0); newHero(p, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' }); return p; };
const readyBed = (p: Profile, bed: number) => { p.vale.beds[bed] = { seed: 'glowcap', grown: GROW_CLEARS, shimmer: false }; };

test('tips: the house shows the welcome tour, then the garden’s as each first comes: seed, ready bed, herbs, one at a time', () => {
  const p = freshProfile(T0);
  assert.equal(houseTip(p), null, 'no hero yet, no tip');
  newHero(p, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' });
  startHearthTour(p);
  assert.equal(houseTip(p), 'tour');
  finishTip(p, 'tour');
  assert.equal(houseTip(p), null, 'nothing more until the garden has something');
  // your first seed: plant it
  rollSeeds(p, BARROW, 'keeper', () => 0);
  assert.equal(houseTip(p), 'seed');
  finishTip(p, 'seed');
  assert.equal(houseTip(p), null);
  assert.ok(plant(p, 0, 'glowcap', () => 0.5));
  for (let i = 1; i < GROW_CLEARS; i++) { growBeds(p); assert.equal(houseTip(p), null, 'still growing'); }
  growBeds(p);
  // your first ready bed: pick it
  assert.equal(houseTip(p), 'ready');
  finishTip(p, 'ready');
  assert.equal(houseTip(p), null, 'once');
  // your first herbs: once they make a brew, to the cauldron
  const h = beginHarvest(p, 0, () => 0, T0)!;
  endHarvest(p, h, 0);
  assert.equal(p.vale.satchel.glowcap, 8);
  assert.equal(houseTip(p), null, '8 glowcaps brew nothing yet');
  p.vale.satchel.glowcap = 10;
  assert.equal(houseTip(p), 'herbs');
  finishTip(p, 'herbs');
  assert.equal(houseTip(p), null, 'once');
});

test('tips: doing the thing is the tip done, and a save that already did it never gets the tip', () => {
  // picking the crop ends the ready tip, seen or not
  const p = withHero();
  readyBed(p, 2);
  assert.equal(houseTip(p), 'ready');
  beginHarvest(p, 2, () => 0.5, T0);
  assert.notEqual(houseTip(p), 'ready');
  // brewing ends the herbs tip
  p.vale.satchel.glowcap = 20;
  assert.equal(houseTip(p), 'herbs');
  assert.ok(brew(p, 'glow', 'good'));
  assert.equal(houseTip(p), null);
  // a save that has picked and brewed before: no garden tips
  const q = withHero();
  q.counters['vale.harvests'] = 4;
  q.counters['vale.brews'] = 2;
  readyBed(q, 0);
  q.vale.satchel.glowcap = 30;
  assert.equal(houseTip(q), null);
  // the welcome tour comes before anything the garden has
  const r = withHero();
  startHearthTour(r);
  readyBed(r, 1);
  assert.equal(houseTip(r), 'tour');
});

test('tips: the Dungeons door shows your Warband first (on Normal only), then your first bottle, each once', () => {
  const p = freshProfile(T0);
  assert.equal(doorTip(p, false), null, 'no hero yet');
  newHero(p, { name: 'Edda Brightwater', race: 'human', cls: 'cleric' });
  assert.equal(doorTip(p, false), 'warband');
  assert.equal(doorTip(p, true), null, 'Heroic seats friends, never your Warband');
  finishTip(p, 'warband');
  assert.equal(doorTip(p, false), null, 'once');
  p.vale.shelf.glow = 1;
  assert.equal(doorTip(p, false), 'brew', 'your first bottle: it is poured at the door');
  assert.equal(doorTip(p, true), 'brew', 'on Heroic too');
  finishTip(p, 'brew');
  assert.equal(doorTip(p, false), null, 'once');
  // the tips live in the counters: the save keeps its shape, and a round trip keeps them done
  const back = migrate(JSON.parse(JSON.stringify(p)));
  assert.equal(back.v, p.v);
  assert.equal(doorTip(back, false), null);
  assert.equal(houseTip(back), null);
});
