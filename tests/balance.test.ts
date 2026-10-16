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

test('balance: the bots never stall on the way to the yard (two seeds that once left the DPS stuck at its gate)', () => {
  for (const [role, seed] of [['healer', 39597], ['dps', 47517]] as [RoleId, number][]) {
    const r = simRun({ role, seed });
    assert.equal(r.over, 'victory', `${role} seed ${seed} did not clear`);
  }
});

test('balance: full Epic is clearly faster than Common, and full BiS melts the dungeon in about half the time', () => {
  const common = simRun({ role: 'dps', seed: 404 });
  const epic = simRun({ role: 'dps', seed: 404, loadouts: gear(3) });
  assert.equal(epic.over, 'victory');
  assert.ok(epic.clear! < common.clear! * 0.85, `Common ${common.clear}s, Epic ${epic.clear}s`);

  const bis = simRun({
    role: 'dps',
    seed: 404,
    loadouts: {
      tank: { power: 1.96, traits: ['wide', 'ringing', 'headsman'], bonuses: ['barrowguard2', 'barrowguard3', 'bg_helm', 'bg_shoulders', 'bg_chest'], unique: 'gravedigger', weaponRar: 3 },
      healer: { power: 1.96, traits: ['sunflare', 'quickhands', 'kindle'], bonuses: ['candlewake2', 'candlewake3', 'cw_helm', 'cw_shoulders', 'cw_chest'], unique: 'longnight', weaponRar: 3 },
      dps: { power: 1.96, traits: ['shatterlance', 'splinter', 'quickfrost'], bonuses: ['rimebone2', 'rimebone3', 'rb_helm', 'rb_shoulders', 'rb_chest'], unique: 'gravefrost', weaponRar: 3 },
    },
  });
  assert.equal(bis.over, 'victory');
  assert.ok(bis.clear! < common.clear! * 0.62, `BiS (${bis.clear}s) should melt Barrow Crypt much faster than Common (${common.clear}s)`);
});

test('balance: the DPS alone does not get past Sir Rattlebones', () => {
  const r = simRun({ role: 'dps', seed: 505, solo: true });
  assert.equal(r.over, 'lost');
  assert.ok(!r.packs.some((p) => p.id === 'K' && p.cleared != null));
});

test('balance: a Glowcap Draught for the party makes a run clearly quicker, Normal and Heroic', () => {
  // brews make a run quicker; nothing needs one (the bands above are all without a brew)
  const plain = simRun({ role: 'healer', seed: 1111 });
  const brewed = simRun({ role: 'healer', seed: 1111, brew: 'glow' });
  assert.equal(brewed.over, 'victory');
  assert.equal(brewed.wipes, 0);
  assert.ok(brewed.clear! < plain.clear! * 0.85, `Common ${plain.clear}s, with the Draught ${brewed.clear}s`);
  // one heroic seed swings a few seconds either way on its own, so take three. (About one heroic run in ten still
  // wipes, mostly a bot tank missing its block on the Shovel Smash, so these are three that don't.)
  let hPlain = 0, hBrewed = 0;
  for (const [role, seed] of [['tank', 707], ['healer', 828], ['dps', 909]] as [RoleId, number][]) {
    const a = simRun({ role, seed, heroic: true, loadouts: gear(3) });
    const b = simRun({ role, seed, heroic: true, loadouts: gear(3), brew: 'glow' });
    assert.equal(b.over, 'victory', `${role} seed ${seed} did not clear with the Draught`);
    assert.equal(b.wipes, 0, `${role} seed ${seed} wiped with the Draught`);
    hPlain += a.clear!; hBrewed += b.clear!;
  }
  assert.ok(hBrewed < hPlain * 0.85, `Heroic ${hPlain}s, with the Draught ${hBrewed}s`);
});

test('balance: every trait, set bonus and unique effect runs in a real clear', () => {
  const all = {
    tank: { power: 1.2, traits: ['wide', 'ringing', 'headsman'], bonuses: ['barrowguard2', 'barrowguard3'], unique: 'gravedigger', weaponRar: 3 },
    healer: { power: 1.2, traits: ['sunflare', 'quickhands', 'kindle'], bonuses: ['candlewake2', 'candlewake3'], unique: 'longnight', weaponRar: 3 },
    dps: { power: 1.2, traits: ['shatterlance', 'splinter', 'quickfrost'], bonuses: ['rimebone2', 'rimebone3'], unique: 'gravefrost', weaponRar: 3 },
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

test('balance: rogue melts single-target bosses faster than mage and tank, clears cleanly with a party, and dies solo before Sir Rattlebones', () => {
  const rogueLoadout = (rar: Rar) => ({
    ...gear(rar),
    dps: { ...plainLoadout('dps', rar, 'rogue'), cls: 'rogue', sprite: rar === 0 ? 'rogue_rags' : rar === 1 ? 'rogue_iron' : 'rogue' },
  });

  // 1. Single-target boss fight (Gravekeeper): Rogue melts the boss faster than Mage, and DPS deals more boss damage than Tank
  const bossMage = simRun({ role: 'dps', seed: 303, start: 'keeper', loadouts: gear(2) });
  const bossRogue = simRun({ role: 'dps', seed: 303, start: 'keeper', loadouts: rogueLoadout(2) });
  assert.equal(bossRogue.over, 'victory');
  const keeperMage = bossMage.packs.find((p) => p.id === 'G')!;
  const keeperRogue = bossRogue.packs.find((p) => p.id === 'G')!;
  const mageBossTime = keeperMage.cleared! - keeperMage.pulled;
  const rogueBossTime = keeperRogue.cleared! - keeperRogue.pulled;
  assert.ok(rogueBossTime < mageBossTime, `Rogue boss kill (${rogueBossTime.toFixed(1)}s) should be faster than Mage (${mageBossTime.toFixed(1)}s)`);
  const rogueHero = bossRogue.heroes.find((h) => h.role === 'dps')!;
  const tankHero = bossRogue.heroes.find((h) => h.role === 'tank')!;
  assert.ok(rogueHero.dmg > tankHero.dmg * 1.25, `Rogue single-target boss damage (${rogueHero.dmg}) clearly beats Tank (${tankHero.dmg})`);

  // 2. Full Barrow Crypt clear with a Common Rogue party: 0 wipes, ~4 minutes
  const fullRogue = simRun({ role: 'dps', seed: 303, loadouts: rogueLoadout(0) });
  assert.equal(fullRogue.over, 'victory');
  assert.equal(fullRogue.wipes, 0);
  assert.ok(fullRogue.clear! > 200 && fullRogue.clear! < 280, `Rogue Common clear in ${fullRogue.clear}s`);

  // 3. Glass cannon: solo Rogue dies before Sir Rattlebones
  const soloRogue = simRun({ role: 'dps', seed: 505, solo: true, loadouts: rogueLoadout(0) });
  assert.equal(soloRogue.over, 'lost');
  assert.ok(!soloRogue.packs.some((p) => p.id === 'K' && p.cleared != null));

  // 4. All Rogue traits, Shadeveil 2pc/3pc, and The Cryptfangs unique run in a real clear
  const rogueKit = {
    ...gear(2),
    dps: { cls: 'rogue', sprite: 'rogue', power: 1.2, traits: ['twinvenom', 'arterial', 'nightstalker'], bonuses: ['shadeveil2', 'shadeveil3', 'sv_helm', 'sv_shoulders', 'sv_chest'], unique: 'cryptfangs', weaponRar: 3 },
  };
  const kitRun = simRun({ role: 'dps', seed: 606, loadouts: rogueKit });
  assert.equal(kitRun.over, 'victory');
  assert.equal(kitRun.wipes, 0);
});
