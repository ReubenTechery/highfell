/// <reference types="node" />
// The house's cellar, the Hall of Doors: a door for every dungeon, in the order you meet them, showing how far you've
// got with each, and every door in its place along the wall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUNGEONS, heroicVersion } from '../src/content';
import { ACT1_DUNGEONS } from '../src/content/act1';
import { HALL, ROOMS, SOON_DOOR, hallSlots } from '../src/content/house';
import { cellarDoors, doorState } from '../src/meta/hearth';
import { logAchievement } from '../src/meta/logs';
import { dungeonRecord, freshProfile } from '../src/meta/profile';

const STATES = ['', '_lit', '_gold', '_gilded'];
const doorArt = async (): Promise<Record<string, { vb: number[] }>> => {
  const fs = await import('node:fs');
  return JSON.parse(fs.readFileSync(new URL('../../art/hearth.json', import.meta.url), 'utf8'));
};

test('hall of doors: a door for every dungeon in the order you meet them, plain until cleared, bricked up until built', () => {
  const p = freshProfile();
  assert.deepEqual(cellarDoors(p).map((d) => d.id), ACT1_DUNGEONS.map((m) => m.id), 'the same order as the Dungeons sheet');
  for (const d of cellarDoors(p)) assert.equal(d.state, DUNGEONS[d.id] ? 'plain' : 'soon', d.id);
  assert.ok(cellarDoors(p).some((d) => d.state === 'soon'), 'Moonmere is still bricked up');
  assert.equal(doorState(p, 'nope'), 'soon');
});

test('hall of doors: a door lights up once cleared, gets its gold trim with its log and gilds with its Heroic log', () => {
  const p = freshProfile();
  dungeonRecord(p, 'barrow').clears = 1;
  assert.equal(doorState(p, 'barrow'), 'lit');
  assert.equal(doorState(p, 'thimblebriar'), 'plain', 'each door is its own dungeon');
  dungeonRecord(p, heroicVersion('thimblebriar')!.id).clears = 1;
  assert.equal(doorState(p, 'thimblebriar'), 'lit', 'a Heroic clear counts');
  p.achievements[logAchievement('barrow')!.id] = { at: 1 };
  assert.equal(doorState(p, 'barrow'), 'gold', 'its collection log finished');
  p.achievements[logAchievement('barrow-heroic')!.id] = { at: 2 };
  assert.equal(doorState(p, 'barrow'), 'gilded', 'its Heroic log finished');
  const q = freshProfile();
  q.achievements[logAchievement(heroicVersion('thimblebriar')!.id)!.id] = { at: 3 };
  assert.equal(doorState(q, 'thimblebriar'), 'gilded', 'the Heroic log gilds it on its own');
});

test('hall of doors: every built dungeon has its door drawn in all four states, and one still to come is bricked up', async () => {
  const art = await doorArt();
  for (const d of Object.values(DUNGEONS)) {
    if (d.heroicOf) continue;
    assert.ok(d.houseDoor, `${d.id} names its door`);
    for (const st of STATES) assert.ok(art[d.houseDoor + st], `${d.houseDoor}${st}`);
  }
  assert.ok(art[SOON_DOOR]);
});

test('hall of doors: every door stands in the cellar, apart, left of the stairs and in a phone’s view of the room', async () => {
  const art = await doorArt();
  const cellar = ROOMS.find((r) => r.id === 'cellar')!, doors = cellarDoors(freshProfile()), at = hallSlots(doors.length);
  let right = cellar.x;
  doors.forEach((d, i) => {
    const [vx, , w] = art[DUNGEONS[d.id]?.houseDoor || SOON_DOOR].vb, x0 = at[i].x + vx, x1 = x0 + w;
    assert.ok(x0 > right, `${d.id} is clear of what's left of it`);
    // the stairs come down to the floor at x 950; a phone shows 640 across a room, round its focus
    assert.ok(x1 < 950, `${d.id} is left of the stairs`);
    assert.ok(Math.max(cellar.focus[0] - x0, x1 - cellar.focus[0]) <= 320, `${d.id} is in a phone's view of the room`);
    assert.equal(at[i].y, HALL.floor, 'on the floor at the foot of the wall');
    right = x1;
  });
});
