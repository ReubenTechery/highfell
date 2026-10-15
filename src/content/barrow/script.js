/* Barrow Crypt: the parts of a run that only make sense here. Gates, ambushes, practice starts,
   what happens when each boss falls. The engine calls these at fixed moments. */
import { HOOKS, S } from '../../dungeon/state.js';
import { aggro, banner, dots, fx, fxText, killMob, sfx } from '../../dungeon/entities.js';
import { breakCage, cutChain } from '../../dungeon/mobs.js';
import { pullIn, spawnChest, triggerAmbush } from '../../dungeon/game.js';
import { startWalkout } from '../../dungeon/walkout.js';
import { clamp, dist, distXY } from '../../core/math';
import { pick } from '../../core/rng';
import { roomIndexOf } from '../../dungeon/world.js';
import { MAP } from './map.js';

export const STARTS = [
  { id: 'entrance', name: 'The entrance' },
  { id: 'knight', name: 'Sir Rattlebones' },
  { id: 'keeper', name: 'The Gravekeeper' },
];

/* 10 simple 3-seat rune formations centered in the Catacombs (500, 1920) before the Coffin Ambush */
export const SEAL_PATTERNS = [
  { id: 'spearhead', name: 'Spearhead', pads: [['tank', 0, -55], ['healer', -75, 45], ['dps', 75, 45]] },
  { id: 'wedge', name: 'Inverted Wedge', pads: [['tank', 0, 55], ['healer', -80, -45], ['dps', 80, -45]] },
  { id: 'line', name: 'Honor Line', pads: [['healer', -95, 0], ['tank', 0, 0], ['dps', 95, 0]] },
  { id: 'column', name: 'Vanguard Column', pads: [['tank', 0, -58], ['dps', 0, 0], ['healer', 0, 58]] },
  { id: 'left_flank', name: 'Left Flank', pads: [['tank', -72, -42], ['dps', 0, 0], ['healer', 72, 42]] },
  { id: 'right_flank', name: 'Right Flank', pads: [['tank', 72, -42], ['dps', 0, 0], ['healer', -72, 42]] },
  { id: 'crescent', name: 'Crescent Arc', pads: [['healer', -88, 32], ['tank', 0, -46], ['dps', 88, 32]] },
  { id: 'pincer', name: 'Pincer', pads: [['dps', -84, -40], ['healer', 84, -40], ['tank', 0, 50]] },
  { id: 'triad', name: 'Lantern Triad', pads: [['tank', -66, 40], ['dps', 66, 40], ['healer', 0, -52]] },
  { id: 'cross', name: 'Cross Steps', pads: [['healer', -75, -22], ['tank', 75, -22], ['dps', 0, 52]] },
];

export function makeSeal() {
  const pat = pick(SEAL_PATTERNS) || SEAL_PATTERNS[0];
  const cx = 500, cy = 1920;
  return {
    id: pat.id,
    name: pat.name,
    x: cx,
    y: cy,
    pads: pat.pads.map(([role, dx, dy]) => ({ role, x: cx + dx, y: cy + dy, r: 34, lit: false })),
    active: false,
    done: false,
    cleared: false,
    hold: 0,
    t: 0,
  };
}

/* practice starts skip the packs before a boss; the intro run plays Room 2 into Sir Rattlebones */
export function setup(start) {
  S.seal = makeSeal();
  if (!start || start === 'entrance') return;
  const upto = start === 'intro' ? ['A', 'D', 'E', 'G'] : start === 'knight' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'K', 'D', 'E'];
  for (const p of S.packs) if (upto.includes(p.def.id)) { p.cleared = true; p.pulled = true; p.triggered = true; p.mobs.forEach((m) => { m.alive = false; m.state = 'dead'; m.deadT = 99; }); S.cleared++; }
  if (start === 'keeper') { S.gates.g3b.closed = false; S.gates.g3t.closed = false; S.props.forEach((p) => { if (p.room === 4 && p.sp === 'coffin') p.sp = 'coffin_open'; }); S.seal.done = true; }
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
  if (S.seal && !S.seal.done && D && D.cleared) {
    if (E && E.triggered) {
      S.seal.done = true; S.seal.active = false;
    } else if (!S.inCombat) {
      if (!S.seal.active) S.seal.active = true;
      S.seal.t = (S.seal.t || 0) + 1 / 60;
      if (S.seal.t > 6.5) {
        S.seal.done = true; S.seal.active = false;
      } else {
        let allLit = true;
        for (const pad of S.seal.pads) {
          const h = S.heroes.find((x) => x.alive && x.role === pad.role);
          if (!h) continue;
          pad.lit = distXY(h.x, h.y, pad.x, pad.y) <= pad.r + h.r;
          if (!pad.lit) allLit = false;
        }
        if (allLit) {
          S.seal.hold = (S.seal.hold || 0) + 1 / 60;
          if (S.seal.hold >= 0.2) {
            S.seal.done = true; S.seal.active = false; S.seal.cleared = true;
            for (const h of S.heroes) if (h.alive) h.st.surge = 18;
            fx({ type: 'ring', x: S.seal.x, y: S.seal.y, r0: 24, r1: 220, col: '#F2C230', dur: 0.45, w: 9, ground: true });
            dots(S.seal.x, S.seal.y, '#FFE08A', 18, 240);
            if (S.player) fxText(S.player.x, S.player.y - 135, 'CRYPT SURGE!', '#F2C230', 26, { dur: 1.5 });
            banner('Crypt Seal shattered! +20% damage & +25% speed!', 'good', 2.4);
            sfx('perfect');
          }
        } else {
          S.seal.hold = 0;
        }
      }
    }
  }
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
  if (S.seal && !S.seal.done) { S.seal.done = true; S.seal.active = false; }
  S.props.forEach((pr) => { if (pr.room === 4 && pr.sp === 'coffin') pr.sp = 'coffin_open'; });
  banner('Ambush! The coffins are opening!', 'warn', 2.4);
}

/* after a wipe: put the room back the way it was */
export function onRespawn(resetAmbush) {
  if (resetAmbush) {
    S.props.forEach((pr) => { if (pr.room === 4 && pr.sp === 'coffin_open') pr.sp = 'coffin'; });
    if (S.seal && !S.seal.cleared) { S.seal.done = false; S.seal.active = true; S.seal.hold = 0; S.seal.t = 0; }
  }
  const K = S.packs.find((p) => p.def.id === 'K'), G = S.packs.find((p) => p.def.id === 'G');
  S.props.forEach((pr) => { if (pr.room === 3 && pr.sp === 'coffin_open' && pr.sc === 1 && !K.cleared) pr.sp = 'coffin'; });
  if (!K.cleared) S.gates.g3b.closed = false;
  if (!G.cleared) S.gates.g5.closed = false;
}
