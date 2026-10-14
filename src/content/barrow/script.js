/* Barrow Crypt: the parts of a run that only make sense here. Gates, ambushes, practice starts,
   what happens when each boss falls. The engine calls these at fixed moments. */
import { HOOKS, S } from '../../dungeon/state.js';
import { aggro, banner, killMob, sfx } from '../../dungeon/entities.js';
import { breakCage, cutChain } from '../../dungeon/mobs.js';
import { pullIn, spawnChest, triggerAmbush } from '../../dungeon/game.js';
import { startWalkout } from '../../dungeon/walkout.js';
import { clamp, dist } from '../../core/math';
import { roomIndexOf } from '../../dungeon/world.js';
import { MAP } from './map.js';

export const STARTS = [
  { id: 'entrance', name: 'The entrance' },
  { id: 'knight', name: 'Sir Rattlebones' },
  { id: 'keeper', name: 'The Gravekeeper' },
];

/* practice starts skip the packs before a boss; the intro run plays Room 2 into Sir Rattlebones */
export function setup(start) {
  if (!start || start === 'entrance') return;
  const upto = start === 'intro' ? ['A', 'D', 'E', 'G'] : start === 'knight' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'K', 'D', 'E'];
  for (const p of S.packs) if (upto.includes(p.def.id)) { p.cleared = true; p.pulled = true; p.triggered = true; p.mobs.forEach((m) => { m.alive = false; m.state = 'dead'; m.deadT = 99; }); S.cleared++; }
  if (start === 'keeper') { S.gates.g3b.closed = false; S.gates.g3t.closed = false; S.props.forEach((p) => { if (p.room === 4 && p.sp === 'coffin') p.sp = 'coffin_open'; }); }
  S.cp = start === 'intro' ? 2 : start === 'knight' ? 3 : 5;
}

export function onBossPulled(pack) {
  if (pack.def.boss === 'knight') { S.gates.g3b.closed = true; pullIn(3, 3120); }
  else { S.gates.g5.closed = true; pullIn(5, 1120); }
}

export function onBossDead(m) {
  if (m.type === 'knight') {
    S.gates.g3b.closed = false;
    S.mobs.forEach((o) => { if (o.alive && o.rally) { o.hp = 1; killMob(o, null); } });
    if (S.opts && S.opts.start === 'intro') {
      S.hazards = [];
      const cx = clamp(m.x, 260, 740), cy = clamp(m.y, 2620, 3060);
      spawnChest(cx, cy, m);
      startWalkout('unique', clamp(cx - 84, 210, 790), cy);
      banner('Watch the lantern: gold flare and two knocks means a unique drop!', 'good', 3.4);
      HOOKS.hint('introChest');
      sfx('victory');
      return;
    }
    S.gates.g3t.closed = false;
    banner('Sir Rattlebones falls. The way on is open.', 'good', 2.8);
    sfx('victory');
  } else {
    S.gates.g5.closed = false; S.darkTarget = 0; S.ring = null; S.rings = []; S.hazards = [];
    S.chains.slice().forEach((c) => cutChain(c, null));
    S.mobs.forEach((o) => { if (o.alive && (o.M.wisp || o.cage)) { if (o.cage) breakCage(o, false); else { o.alive = false; o.state = 'dead'; } } });
    spawnChest(500, 660, m);
    banner('The Gravekeeper is buried for good!', 'good', 3.2);
    sfx('victory');
  }
}

/* checked every frame */
export function triggers() {
  const E = S.packs.find((p) => p.def.id === 'E'), D = S.packs.find((p) => p.def.id === 'D');
  if (E && !E.triggered && D.cleared) {
    for (const h of S.heroes) if (h.alive && roomIndexOf(h.x, h.y) === 4 && h.y < 1800) { triggerAmbush(E); break; }
  }
  const G = S.packs.find((p) => p.def.id === 'G');
  if (G && !G.cleared && !G.pulled) {
    const k = G.mobs[0];
    if (k && k.alive) for (const h of S.heroes) if (h.alive && roomIndexOf(h.x, h.y) === 5 && dist(h, MAP.arena) < MAP.arena.r - 30) { aggro(k, h, 1); break; }
  }
}

export function onAmbush() {
  S.props.forEach((pr) => { if (pr.room === 4 && pr.sp === 'coffin') pr.sp = 'coffin_open'; });
  banner('Ambush! The coffins are opening!', 'warn', 2.4);
}

/* after a wipe: put the room back the way it was */
export function onRespawn(resetAmbush) {
  if (resetAmbush) S.props.forEach((pr) => { if (pr.room === 4 && pr.sp === 'coffin_open') pr.sp = 'coffin'; });
  const K = S.packs.find((p) => p.def.id === 'K'), G = S.packs.find((p) => p.def.id === 'G');
  S.props.forEach((pr) => { if (pr.room === 3 && pr.sp === 'coffin_open' && pr.sc === 1 && !K.cleared) pr.sp = 'coffin'; });
  if (!K.cleared) S.gates.g3b.closed = false;
  if (!G.cleared) S.gates.g5.closed = false;
}
