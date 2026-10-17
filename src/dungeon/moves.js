/* ---------- moves: the shared parts a boss is built from ----------
   A boss has two or three moves, and between them it gives each role one clear job. Build each move from a
   part, with its own numbers:
     cone(m, o)    a wedge from the boss at its target. Heavy and blockable unless `block: false`: the tank
                   holds Shield, and a perfect block stuns the boss and opens an Exposed window.
     line(m, o)    a lane from the boss toward someone (a mate of the tank's, unless `at`): step out of it.
                   With `charge`, the boss runs the lane itself, and if it hits nobody it crashes, Exposed.
     circle(m, o)  a circle on the boss's target, on `at`, or under every hero (`all`). With `block`, it is
                   the tank's to block: it follows its target for a moment and only a perfect block opens him up.
                   With `count`, each one counts as a smash for the achievements (perfect-block every one).
     adds(m, o)    mobs join the fight. They go when the boss does; with `expose`, the last one down opens
                   the boss up for that many seconds.
     pulse(m, o)   a hit on the whole party that nobody can dodge: the healer heals through it.
     cast(m, o)    a cast with the green bar: the tank or a DPS stops it with an interrupt (Charge, Rime burst,
                   Fan of Blades, Shadowstep), which Exposes the boss; missed, `done` goes off (a pulse, say).
   Exposed windows (+35% damage taken, and every class's payoff setup) come from a perfect block, a crash, the
   last add down, an interrupt, or exposeMob().
   brain(def) turns the moves into the boss's `ai`: phases at a share of its health, one move at a time on its
   own clock, its ordinary swings in between, and an enrage. Example: src/content/_template/bosses.js. */
import { TAU, angTo, dist } from '../core/math';
import { rand } from '../core/rng';
import { S } from './state.js';
import { aggro, banner, call, dots, exposeMob, fx, hurtHero, sfx, shake } from './entities.js';
import { partyPulse, randomHero, spawnMob, startCast } from './mobs.js';
import { canStand, moveEnt } from './world.js';

const faceTo = (m, a) => { m.face = a; m.flip = Math.cos(a) < 0; };
/* the boss stands and winds up while its telegraph fills */
const hold = (m, dur, pose) => { m.act = { k: 'hold', t: 0, dur }; m.pose = pose === undefined ? 'wind' : pose; };

/** a wedge at the boss's target (or `at`) */
export function cone(m, o = {}) {
  const t = o.at || m.target;
  if (!t || !t.alive) return false;
  const a = angTo(m, t), warn = o.warn ?? 1.3, r = o.r ?? 210, block = o.block !== false;
  faceTo(m, a);
  S.hazards.push({ shape: 'cone', x: m.x, y: m.y, a, r, arc: o.arc ?? 2.1, warn, t: 0, dmg: o.dmg ?? 280, heavy: block, block, tankBuster: block, src: m,
    onFire: () => { m.pose = null; m.lunge = 0.2; m.lungeA = a; sfx('sweep'); shake(5); fx({ type: 'slash', x: m.x, y: m.y - 60, a, r: r * 0.7, dur: 0.22, col: '#FFFFFF', wide: true }); } });
  hold(m, warn + 0.15);
  if (o.call) call(o.call, 'alarm', 1.2);
  return true;
}

/** a lane toward `at`, or toward a mate of the tank's */
export function line(m, o = {}) {
  const v = o.at || randomHero(true) || m.target;
  if (!v || !v.alive) return false;
  const a = angTo(m, v), warn = o.warn ?? 1.2, len = o.len ?? dist(m, v) + 160, w = o.w ?? 90;
  faceTo(m, a);
  if (o.charge) {
    m.act = { k: 'charge', t: 0, warn, a, len, went: 0, hit: new Set(), dmg: o.dmg ?? 300, speed: o.speed ?? 1100, expose: o.expose ?? 3 };
    m.pose = 'wind';
    S.hazards.push({ shape: 'rect', x: m.x, y: m.y, a, len, w, warn, t: 0, noDmg: true, src: m });
  } else {
    S.hazards.push({ shape: 'line', x: m.x, y: m.y, a, len, w, warn, t: 0, dmg: o.dmg ?? 240, magic: !!o.magic, src: m,
      onFire: () => { m.pose = null; sfx('sweep'); shake(4); dots(m.x + Math.cos(a) * len * 0.5, m.y + Math.sin(a) * len * 0.5, o.col || '#FFE08A', 10, 200); } });
    hold(m, warn + 0.15);
  }
  if (o.call) call(o.call, 'alarm', 1.2);
  return true;
}

/** a circle on the boss's target, on `at`, or under every hero (`all`) */
export function circle(m, o = {}) {
  const on = o.all ? S.heroes.filter((h) => h.alive && !h.st.caged) : [o.at || m.target];
  if (!on.length || !on[0] || on[0].alive === false) return false;
  const warn = o.warn ?? 1.4, block = !!o.block, col = o.col || '#C9B79A';
  for (const t of on) {
    // a blockable circle follows its target for a moment, so the tank stands and blocks rather than steps out
    const follow = t.kind === 'hero' && (block || o.follow) ? { followT: t, followFor: Math.min(o.follow ?? 0.9, warn - 0.3) } : {};
    S.hazards.push({ shape: 'circle', x: t.x, y: t.y, r: o.r ?? 90, warn, t: 0, dmg: o.dmg ?? 220, heavy: block, block, tankBuster: block, src: m, ...follow,
      ...(o.count ? { counted: true } : {}),
      onFire: (z) => {
        if (o.count && S.bossFight) S.bossFight.smashes++;
        fx({ type: 'ring', x: z.x, y: z.y, r0: 20, r1: z.r + 30, col, dur: 0.35, w: 10, ground: true });
        dots(z.x, z.y, col, 12, 220);
        if (block) { m.pose = null; m.lunge = 0.25; m.lungeA = angTo(m, z); sfx('smash'); shake(8); } else { sfx('thud'); shake(4); }
      } });
  }
  hold(m, warn + 0.15, block ? 'wind' : null);
  if (o.call) call(o.call, 'alarm', 1.2);
  return true;
}

/** mobs that join the fight: `types`, stood at `at` ([{ x, y }]) or round the boss */
export function adds(m, o) {
  const list = o.types.map((type, i) => {
    const p = o.at ? o.at[i % o.at.length] : { x: m.x + Math.cos((i / o.types.length) * TAU + 0.6) * 150, y: m.y + Math.sin((i / o.types.length) * TAU + 0.6) * 110 };
    const ok = canStand(p.x, p.y, 18);
    const a = spawnMob(type, ok ? p.x : m.x + rand(-40, 40), ok ? p.y : m.y + 60, null, true);
    a.add = m;
    aggro(a, randomHero(true) || m.target, 5);
    return a;
  });
  if (o.expose) { m.ab.adds = list; m.ab.addsExpose = o.expose; }
  hold(m, 0.9);
  shake(5); sfx('rise');
  if (o.call) banner(o.call, 'warn', 2.2);
  return list;
}

/** a hit on everyone that nobody can dodge */
export function pulse(m, o = {}) {
  partyPulse(m, o.dmg ?? 50, o.name || 'Pulse', o.col || '#F0E8D2');
  return true;
}

/** a cast to interrupt: `name` on the boss bar, `dur` seconds (2), then `done(m)` if nobody stopped it */
export function cast(m, o) {
  startCast(m, { key: o.id || 'cast', name: o.name, dur: o.dur ?? 2, kick: true, done: () => { if (m.alive) o.done(m); } });
  if (o.call) call(o.call, 'alarm', 1.4);
  return true;
}

/** Turn a boss's moves into its `ai`.
 *  def: { moves: [{ id, use(m) -> truthy when it went, every (seconds, or one per phase), first, phases }],
 *         phases: [{ at, text, enter(m) }] (the first starts phase 2 below `at` of its health),
 *         enrage (seconds), enrageText, tick(m, dt) (every frame, for what the dungeon's signature needs) } */
export function brain(def) {
  const inPhase = (mv, p) => !mv.phases || mv.phases.includes(p);
  const every = (mv, p) => (Array.isArray(mv.every) ? mv.every[Math.min(p, mv.every.length) - 1] : mv.every);
  return function ai(m, dt) {
    const ab = m.ab;
    if (!ab.clock) { ab.clock = {}; ab.t = 0; for (const mv of def.moves) if (inPhase(mv, 1)) ab.clock[mv.id] = mv.first ?? every(mv, 1); }
    ab.t += dt;
    if (!ab.enraged && def.enrage && ab.t > def.enrage) { ab.enraged = true; m.dmgMul = 2.5; banner(def.enrageText || `${m.name} has had enough of you!`, 'warn', 2.4); sfx('roar'); }
    if (def.tick) def.tick(m, dt);
    // the last of its adds down opens it up
    if (ab.adds && !ab.adds.some((a) => a.alive)) { ab.adds = null; exposeMob(m, ab.addsExpose, 'Guards down! Exposed!'); }
    // mid-cast he stands and casts (mobs.js runs it): nothing else until it lands or someone stops it
    if (m.cast) return false;
    const next = def.phases && def.phases[m.phase - 1];
    if (next && !m.act && m.hp < m.maxHp * next.at) {
      m.phase++; m.wind = 0; m.pose = null;
      if (next.text) banner(next.text, 'warn', 2.6);
      sfx('roar'); shake(6);
      for (const mv of def.moves) if (inPhase(mv, m.phase) && !inPhase(mv, m.phase - 1)) ab.clock[mv.id] = mv.first ?? every(mv, m.phase);
      if (next.enter) next.enter(m);
      return true;
    }
    if (m.act) return act(m, dt);
    if (m.wind > 0) return false;
    for (const mv of def.moves) if (inPhase(mv, m.phase)) ab.clock[mv.id] -= dt;
    for (const mv of def.moves) {
      if (!inPhase(mv, m.phase) || ab.clock[mv.id] > 0) continue;
      if (mv.use(m)) {
        ab.clock[mv.id] = every(mv, m.phase);
        // the boss bar names the move it's doing (the mob's `acts`, by move id)
        if (m.act && m.act.k === 'hold') m.act.k = mv.id;
        return true;
      }
    }
    return false;
  };
}

/* what the boss does while a move plays out: runs its charge, or stands until its telegraph has gone off */
function act(m, dt) {
  const a = m.act;
  a.t += dt;
  if (a.k === 'charge') {
    if (a.t < a.warn) return true;
    if (!a.go) { a.go = true; m.pose = null; sfx('charge'); }
    const step = a.speed * dt;
    const ok = moveEnt(m, Math.cos(a.a) * step, Math.sin(a.a) * step);
    a.went += step; m.moving = 0.1; m.walkT += dt * 20;
    for (const h of S.heroes) {
      if (!h.alive || a.hit.has(h.id) || dist(h, m) > h.r + m.r + 8) continue;
      a.hit.add(h.id);
      hurtHero(h, a.dmg * m.dmgMul, m, { heavy: true, block: false, hazard: true });
      shake(5); sfx('thud');
    }
    if (!ok || a.went >= a.len) {
      m.act = null; m.atkT = 1.0;
      if (a.hit.size === 0 && a.expose) { m.st.stun = Math.max(m.st.stun, 1.2); exposeMob(m, a.expose, 'Crashed! Exposed!'); }
      shake(3);
    }
    return true;
  }
  if (a.t >= a.dur) { m.act = null; m.pose = null; m.atkT = Math.max(m.atkT, 0.6); }
  return true;
}
