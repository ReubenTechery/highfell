/// <reference types="node" />
/**
 * Balance guard rails. Full bot runs of Barrow Crypt; if a change pushes the clear time or the
 * difficulty outside these bands, look at `npm run sim` before loosening them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simRun } from '../src/sim/run';
import { plainLoadout } from '../src/meta/gear';
import type { Rar, RoleId } from '../src/content/types';

const gear = (rar: Rar) => Object.fromEntries((['tank', 'healer', 'dps'] as RoleId[]).map((r) => [r, plainLoadout(r, rar)]));

test('balance: a Common party clears in about four minutes without wiping', () => {
  for (const [role, seed] of [['tank', 101], ['healer', 202], ['dps', 303]] as [RoleId, number][]) {
    const r = simRun({ role, seed });
    assert.equal(r.over, 'victory', `${role} seed ${seed} did not clear`);
    assert.equal(r.wipes, 0, `${role} seed ${seed} wiped`);
    assert.ok(r.clear! > 215 && r.clear! < 280, `${role} seed ${seed} cleared in ${r.clear}s`);
    const keeper = r.packs.find((p) => p.id === 'G')!;
    const fight = keeper.cleared! - keeper.pulled;
    assert.ok(fight > 90 && fight < 150, `the Gravekeeper took ${fight.toFixed(1)}s`);
  }
});

test('balance: full Epic is clearly faster than Common', () => {
  const common = simRun({ role: 'dps', seed: 404 });
  const epic = simRun({ role: 'dps', seed: 404, loadouts: gear(3) });
  assert.equal(epic.over, 'victory');
  assert.ok(epic.clear! < common.clear! * 0.85, `Common ${common.clear}s, Epic ${epic.clear}s`);
});

test('balance: the DPS alone does not get past Sir Rattlebones', () => {
  const r = simRun({ role: 'dps', seed: 505, solo: true });
  assert.equal(r.over, 'lost');
  assert.ok(!r.packs.some((p) => p.id === 'K' && p.cleared != null));
});

test('balance: every trait, set bonus and unique effect runs in a real clear', () => {
  const all = {
    tank: { power: 1.2, traits: ['wide', 'ringing', 'headsman'], bonuses: ['barrowguard2'], unique: 'gravedigger', weaponRar: 3 },
    healer: { power: 1.2, traits: ['sunflare', 'quickhands', 'kindle'], bonuses: ['candlewake2'], unique: 'longnight', weaponRar: 3 },
    dps: { power: 1.2, traits: ['shatterlance', 'splinter', 'quickfrost'], bonuses: ['rimebone2'], unique: 'gravefrost', weaponRar: 3 },
  };
  const r = simRun({ role: 'tank', seed: 606, loadouts: all });
  assert.equal(r.over, 'victory');
  assert.equal(r.wipes, 0);
});

test('balance: heroic in full Epic clears in about four minutes without wiping', () => {
  for (const [role, seed] of [['tank', 707], ['healer', 808], ['dps', 909]] as [RoleId, number][]) {
    const r = simRun({ role, seed, heroic: true, loadouts: gear(3) });
    assert.equal(r.over, 'victory', `${role} seed ${seed} did not clear`);
    assert.equal(r.wipes, 0, `${role} seed ${seed} wiped`);
    assert.ok(r.clear! > 205 && r.clear! < 275, `${role} seed ${seed} cleared heroic in ${r.clear}s`);
  }
});

test('balance: heroic in Common gear gets buried', () => {
  const r = simRun({ role: 'tank', seed: 1001, heroic: true, maxWipes: 3 });
  assert.notEqual(r.over, 'victory', `cleared heroic in Common in ${r.clear}s`);
  assert.ok(r.wipes >= 3);
});
