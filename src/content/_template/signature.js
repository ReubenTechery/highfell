/* The signature: the one idea this dungeon is about. Its trash uses it and both its bosses use it, so the
   packs teach it and the fights test it. One per dungeon, named in the engine def (`signature` in engine.ts).

   The template's example, to swap for your own: beacons. A beacon is a little thing with no attack that
   pulses the whole party every 3 seconds until it's broken. A boss is shielded (half damage) while a beacon of
   his stands, and Exposed when his last one breaks.
     tank    keep the boss and the packs off the DPS while they break beacons
     healer  heal through the pulses
     DPS     break the beacons (bots go for them first: `priority`)
   A Beaconkeeper (this template's new enemy type) plants one a moment into its fight, and another if it
   breaks; the Warden plants one, the Sovereign two at a time. */
import { TAU } from '../../core/math';
import { rand } from '../../core/rng';
import { S } from '../../dungeon/state.js';
import { exposeMob, fxText, sfx } from '../../dungeon/entities.js';
import { partyPulse, spawnMob } from '../../dungeon/mobs.js';
import { canStand } from '../../dungeon/world.js';

/** plant `n` beacons round `owner`: a boss's go when he does, a mob's belong to its pack */
function plant(owner, n) {
  const base = rand(0, TAU), d = owner.isBoss ? 250 : 110;
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = base + (i / n) * TAU;
    let x = owner.x + Math.cos(a) * d, y = owner.y + Math.sin(a) * d * 0.8;
    if (!canStand(x, y, 24)) { x = owner.x + Math.cos(a) * 70; y = owner.y + Math.sin(a) * 56; }
    if (!canStand(x, y, 24)) { x = owner.x; y = owner.y + 50; }
    const b = spawnMob('beacon', x, y, owner.isBoss ? null : owner.pack, true);
    b.owner = owner;
    if (owner.isBoss) b.add = owner;
    list.push(b);
  }
  // counted, so a test can see the trash and both bosses use it
  const k = 'beacons.' + (owner.isBoss ? owner.type : 'trash');
  S.stats[k] = (S.stats[k] || 0) + n;
  fxText(owner.x, owner.y - (owner.isBoss ? 220 : 120), n > 1 ? 'Beacons!' : 'Beacon!', '#FFE08A', 24, { dur: 1.2 });
  sfx('rise');
  return list;
}

/* the beacon never moves, never swings and never goes for anyone (so the tank leaves it to the DPS) */
function beaconAi(m, dt) {
  m.x = m.home.x; m.y = m.home.y; m.st.kx = m.st.ky = 0;
  m.target = null; m.loose = 0;
  m.ab.pulse = (m.ab.pulse ?? 2) - dt;
  if (m.ab.pulse <= 0) { m.ab.pulse = 3; partyPulse(m, 30, 'Beacon', '#FFE08A'); }
  return true;
}

/** for trash that carry it: plant a beacon a moment into the fight, and another if it breaks */
function trashAi(m, dt) {
  if (m.fightT < 1.5 || (m.ab.beacon && m.ab.beacon.alive)) return false;
  m.ab.replant = (m.ab.replant ?? 0) - dt;
  if (m.ab.replant > 0) return false;
  m.ab.replant = 12;
  m.ab.beacon = plant(m, 1)[0];
  return true;
}

/** every frame for a boss that plants them: shielded while one stands, Exposed when the last one breaks */
function shield(m) {
  const up = S.mobs.some((b) => b.alive && b.owner === m);
  m.armorUp = up ? 0.5 : 0;
  if (m.ab.beaconsUp && !up) exposeMob(m, 3.5, 'Beacons out! Exposed!');
  m.ab.beaconsUp = up;
}

export const SIGNATURE = {
  id: 'beacons',
  name: 'Beacons',
  how: 'A beacon pulses the whole party until it breaks, and shields the boss who planted it.',
  jobs: { tank: 'keep the boss and the packs off the DPS', healer: 'heal through the pulses', dps: 'break the beacons' },
  /** the signature's own mobs, part of the dungeon's MOBS */
  mobs: {
    beacon: { name: 'Beacon', kind: 'melee', hp: 700, r: 18, speed: 0, dmg: 0, every: 99, wind: 0, reach: 0, aggro: 0, sp: 'candles', priority: true, ai: beaconAi },
  },
  plant,
  trashAi,
  shield,
};
