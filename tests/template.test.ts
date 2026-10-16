/// <reference types="node" />
/**
 * The dungeon template: layouts as data (any shape you can walk through), the seal only on Heroic, the
 * signature in the trash and both bosses, and two bosses of two or three moves at about 40 and 80 seconds.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../src/core/rng';
import { buildDungeonMap } from '../src/dungeon/layout.js';
import { newGame } from '../src/dungeon/game.js';
import { S, setS } from '../src/dungeon/state.js';
import { areaOf, canStand, navPoint, walkTo } from '../src/dungeon/world.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { TEMPLATE_ENGINE } from '../src/content/_template/engine';
import { SOVEREIGN, WARDEN } from '../src/content/_template/bosses.js';
import { SIGNATURE } from '../src/content/_template/signature.js';
import { simRun } from '../src/sim/run';
import type { RoleId } from '../src/content/types';

/* walk one hero-sized body from where it is to (x, y) through the layout; false if it doesn't get there */
function walk(e: { x: number; y: number; r: number }, x: number, y: number, secs = 40): boolean {
  for (let t = 0; t < secs; t += 1 / 60) {
    if (walkTo(e, x, y, 300, 1 / 60, 8) <= 10) return true;
    assert.ok(canStand(e.x, e.y, e.r), `walked off the floor at ${e.x.toFixed(0)}, ${e.y.toFixed(0)}`);
  }
  return false;
}
const middle = (r: any) => (r.round ? { x: r.x, y: r.y } : { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });
function walkable(built: any) {
  setSeed(5);
  setS({ dg: { map: built.MAP }, gates: JSON.parse(JSON.stringify(built.GATES)), props: [] });
  return S as any;
}

test('layouts: two different shapes build, and you can walk from any room to any other', () => {
  // a hall with a side room off its east wall and a round arena to the north, behind a gate
  const branch = buildDungeonMap({
    rooms: [
      { id: 'in', name: 'In', x0: 400, y0: 2000, x1: 700, y1: 2300, wall: 100 },
      { id: 'hall', name: 'Hall', x0: 300, y0: 1300, x1: 800, y1: 1760, wall: 100 },
      { id: 'side', name: 'Side', x0: 1000, y0: 1350, x1: 1300, y1: 1700, wall: 100 },
      { id: 'ring', name: 'Ring', round: true, x: 550, y: 700, r: 340, wall: 120 },
    ],
    links: [
      { from: 'in', to: 'hall', side: 'n', at: 550 },
      { from: 'hall', to: 'side', side: 'e', at: 1530 },
      { from: 'hall', to: 'ring', side: 'n', at: 550, gate: { id: 'ringIn', end: 'to' } },
    ],
  });
  // a line running east into a round room, with a room off its south side
  const east = buildDungeonMap({
    rooms: [
      { id: 'a', name: 'A', x0: 0, y0: 400, x1: 400, y1: 800, wall: 100 },
      { id: 'b', name: 'B', x0: 640, y0: 380, x1: 1100, y1: 820, wall: 100 },
      { id: 'c', name: 'C', x0: 700, y0: 1060, x1: 1040, y1: 1400, wall: 100 },
      { id: 'd', name: 'D', round: true, x: 1640, y: 600, r: 300, wall: 120 },
    ],
    links: [
      { from: 'a', to: 'b', side: 'e', at: 600 },
      { from: 'b', to: 'c', side: 's', at: 870 },
      { from: 'b', to: 'd', side: 'e', at: 600, w: 180 },
    ],
  });
  assert.deepEqual(branch.MAP.corridors.map((c: any) => c.dir), ['v', 'h', 'v']);
  assert.deepEqual(east.MAP.corridors.map((c: any) => c.dir), ['h', 'v', 'h']);
  assert.ok(branch.GATES.ringIn && !branch.GATES.ringIn.closed, 'a gate named on a link sits in its door');
  assert.deepEqual(branch.MAP.arena, { x: 550, y: 700, r: 340 }, 'the last round room is the arena');
  for (const built of [branch, east]) {
    const s = walkable(built);
    const rooms = built.MAP.rooms;
    const body = { x: 0, y: 0, r: 16 };
    for (let a = 0; a < rooms.length; a++) {
      for (let b = 0; b < rooms.length; b++) {
        if (a === b) continue;
        Object.assign(body, middle(rooms[a]));
        const to = middle(rooms[b]);
        assert.ok(walk(body, to.x, to.y), `walked from ${rooms[a].id} to ${rooms[b].id}`);
        assert.equal(s.dg.map.chain[areaOf(body.x, body.y)].idx, b);
      }
    }
  }
  // a closed gate keeps you out
  const s = walkable(branch);
  s.gates.ringIn.closed = true;
  const body = { ...middle(branch.MAP.rooms[1]), r: 16 };
  assert.equal(walk(body, 550, 700, 8), false, 'the shut gate stops you at the arena door');
  assert.ok(body.y > 1040, 'and you never got into the arena');
});

test('layouts: a layout that does not hold together is refused when it is built', () => {
  const rooms = [
    { id: 'a', name: 'A', x0: 0, y0: 600, x1: 400, y1: 1000, wall: 100 },
    { id: 'b', name: 'B', x0: 0, y0: 0, x1: 400, y1: 400, wall: 100 },
  ];
  assert.throws(() => buildDungeonMap({ rooms, links: [{ from: 'a', to: 'b', side: 'n', at: 380 }] }), /walls/, 'a door off the end of a wall');
  assert.throws(() => buildDungeonMap({ rooms, links: [{ from: 'a', to: 'b', side: 's', at: 200 }] }), /isn't to the s/, 'a room on the wrong side');
  assert.throws(() => buildDungeonMap({ rooms: [...rooms, { id: 'c', name: 'C', x0: 900, y0: 0, x1: 1200, y1: 400, wall: 100 }], links: [{ from: 'a', to: 'b', side: 'n', at: 200 }] }), /can't be reached/);
});

test('layouts: with no links the rooms make a line from the bottom up, as Barrow Crypt is built', () => {
  const M = BARROW_ENGINE.map as any;
  assert.equal(M.rooms.length, 6);
  M.corridors.forEach((c: any, i: number) => {
    assert.deepEqual([c.x0, c.x1, c.y0, c.y1, c.dir], [420, 580, M.rooms[i + 1].y1, M.rooms[i].y0, 'v']);
  });
  newGame(BARROW_ENGINE, { role: 'tank', seed: 3, start: 'entrance', quiet: true, noEvents: true, loadouts: {} });
  const tank = (S as any).heroes.find((h: any) => h.role === 'tank');
  assert.deepEqual(navPoint(tank, 500, 640), { x: 500, y: M.rooms[0].y0 - 24 }, 'up through the north door');
});

test('the template: no seal on Normal; the seal is a Heroic-only hook', () => {
  newGame(TEMPLATE_ENGINE, { role: 'tank', seed: 4, start: 'entrance', quiet: true, noEvents: true, loadouts: {} });
  assert.equal((S as any).seal, null);
  newGame(TEMPLATE_ENGINE, { role: 'tank', seed: 4, start: 'entrance', heroic: true, quiet: true, noEvents: true, loadouts: {} });
  assert.equal((S as any).seal.pads.length, 3);
});

test('the template: its signature is one idea, used by its trash and both bosses', () => {
  const sig = (TEMPLATE_ENGINE as any).signature;
  assert.equal(sig, SIGNATURE);
  assert.ok(sig.id && sig.name && sig.how && sig.jobs.tank && sig.jobs.healer && sig.jobs.dps);
  const trash = Object.entries(TEMPLATE_ENGINE.mobs as Record<string, any>).filter(([, m]) => !m.boss && m.ai === sig.trashAi);
  assert.ok(trash.length >= 1 && trash.length <= 2, 'one or two new enemy types carry it');
  for (const boss of [WARDEN, SOVEREIGN]) assert.ok(boss.moves.some((mv: any) => mv.signature), 'each boss has a signature move');
  const r = simRun({ dungeon: 'template', role: 'tank', seed: 11 });
  assert.equal(r.over, 'victory');
  for (const by of ['trash', 'warden', 'sovereign']) assert.ok(r.stats['beacons.' + by] > 0, `beacons planted by the ${by}`);
});

test('the template: two bosses of two or three moves with a job for every role, about 40 and 80 seconds', () => {
  for (const boss of [WARDEN, SOVEREIGN]) {
    assert.ok(boss.moves.length >= 2 && boss.moves.length <= 3, 'two or three moves');
    const jobs = boss.moves.map((mv: any) => mv.job).join(' ');
    for (const role of ['tank', 'healer', 'dps']) assert.ok(jobs.includes(role), `a job for the ${role}`);
  }
  assert.equal(SOVEREIGN.phases.length + 1, 2, 'the final boss fights in two phases');
  for (const [role, seed] of [['tank', 21], ['healer', 22], ['dps', 23]] as [RoleId, number][]) {
    const r = simRun({ dungeon: 'template', role, seed });
    assert.equal(r.over, 'victory', `${role} seed ${seed} did not clear`);
    assert.equal(r.wipes, 0, `${role} seed ${seed} wiped`);
    assert.ok(r.clear! > 170 && r.clear! < 240, `${role} seed ${seed} cleared in ${r.clear}s`);
    const fight = (id: string) => { const p = r.packs.find((x) => x.id === id)!; return p.cleared! - p.pulled; };
    assert.ok(fight('K') > 30 && fight('K') < 50, `the Warden took ${fight('K').toFixed(1)}s`);
    assert.ok(fight('G') > 65 && fight('G') < 95, `the Sovereign took ${fight('G').toFixed(1)}s`);
  }
});

test('the template: a run started at either boss (tests and sims) begins at his door with the packs before him down', () => {
  newGame(TEMPLATE_ENGINE, { role: 'tank', seed: 6, start: 'warden', quiet: true, noEvents: true, loadouts: {} });
  let s = S as any;
  assert.deepEqual(s.packs.filter((p: any) => p.cleared).map((p: any) => p.def.id), ['A', 'B', 'C', 'D']);
  assert.equal(s.cp, 5);
  assert.ok(s.player.y > 2460, 'outside the mini boss hall');
  newGame(TEMPLATE_ENGINE, { role: 'tank', seed: 6, start: 'sovereign', quiet: true, noEvents: true, loadouts: {} });
  s = S as any;
  assert.deepEqual(s.packs.filter((p: any) => !p.cleared).map((p: any) => p.def.id), ['G']);
  assert.equal(s.gates.miniOut.closed, false);
  const r = simRun({ dungeon: 'template', role: 'dps', seed: 7, start: 'sovereign' });
  assert.equal(r.over, 'victory', 'and the bots finish him from there');
});
