/* ---------- mobs: the behaviour library (melee, ranged, casters, brutes, wisps), cages and chains ---------- */
import { angTo, dist, distXY, TAU } from '../core/math';
import { pick, rand, rng } from '../core/rng';
import { HOOKS, S, emit } from './state.js';
import { addThreat, aggro, banner, bits, call, dots, fx, fxText, hurtHero, killMob, makeMob, pickTarget, sfx, shake } from './entities.js';
import { canStand, moveEnt, roomIndexOf, walkTo } from './world.js';

export function nearestHeroTo(x, y, preferNonTank) {
  let best = null, bd = 1e9;
  for (const h of S.heroes) { if (!h.alive) continue; let d = distXY(x, y, h.x, h.y); if (preferNonTank && h.role === 'tank') d += 400; if (d < bd) { bd = d; best = h; } }
  return best;
}
export function randomHero(nonTank, except) {
  let pool = S.heroes.filter((h) => h.alive && h !== except && !h.st.caged && (!nonTank || h.role !== 'tank'));
  if (!pool.length) pool = S.heroes.filter((h) => h.alive && h !== except);
  return pool.length ? pick(pool) : null;
}

export function mobTick(m, dt) {
  m.flash -= dt; m.lunge -= dt; m.moving -= dt;
  if (!m.alive) { m.deadT += dt; return; }
  const st = m.st;
  st.stun = Math.max(0, st.stun - dt); st.freeze = Math.max(0, st.freeze - dt);
  if (st.slowT > 0) { st.slowT -= dt; if (st.slowT <= 0) st.slow = 0; }
  if (m.forcedT > 0) m.forcedT -= dt;
  if (st.kx || st.ky) { moveEnt(m, st.kx * dt, st.ky * dt); const k = Math.pow(0.01, dt); st.kx *= k; st.ky *= k; if (Math.abs(st.kx) + Math.abs(st.ky) < 6) st.kx = st.ky = 0; }
  if (m.rise > 0) { m.rise -= dt; return; }
  if (m.cage) { cageTick(m, dt); return; }
  if (m.M.wisp) { wispTick(m, dt); return; }
  if (m.state === 'idle') { idleTick(m, dt); return; }
  m.fightT += dt;
  if (st.freeze > 0 || st.stun > 0) { m.wind = 0; if (m.cast) interruptCast(m); if (m.act && m.act.k !== 'rally') { m.act = null; m.pose = null; } return; }
  const prev = m.target;
  m.target = pickTarget(m);
  if (prev && m.target && m.target !== prev) {
    if (m.isBoss) bossTurned(m, prev, m.target);
    // you out-did the tank and it came for you: once a run, say why
    if (m.target.isPlayer && m.target.role !== 'tank' && prev.role === 'tank' && !S.hints.pulled) { S.hints.pulled = 1; HOOKS.hint('pulled'); }
  }
  if (!m.target) {
    const n = nearestHeroTo(m.x, m.y);
    if (n && dist(m, n) < 700) { addThreat(m, n, 1); m.target = n; } else return;
  }
  if (!m.isBoss) {
    if (m.target.role === 'tank' || m.forcedT > 0) m.loose = 0; else m.loose = (m.loose || 0) + dt;
    const was = m.wild;
    m.wild = m.loose > 3;
    if (m.wild && !was) { fxText(m.x, m.y - (m.M.big ? 150 : 100), 'Wild!', '#FF6B5E', 20, { dur: 1 }); if (!S.hints.wild) { S.hints.wild = 1; HOOKS.hint('wild'); } }
  }
  if (m.M.ai && m.M.ai(m, dt)) return;
  // a boss's own move (a party-wide hit) can knock its target down mid-frame
  if (!m.target || !m.target.alive) return;
  if (m.cast) { castTick(m, dt); return; }
  if (m.M.kind === 'caller' && callerTick(m, dt)) return;
  if (m.M.kind === 'brute' && bruteTick(m, dt)) return;
  if (m.M.ranged && archerTick(m, dt)) return;
  meleeTick(m, dt);
}

/* the boss just turned to someone new: tell the player if it's about them */
function bossTurned(m, from, to) {
  if (to.isPlayer && to.role !== 'tank') call('He’s after you! Keep moving', 'alarm', 1.6);
  else if (from.isPlayer && from.role === 'tank' && from.alive && !from.st.caged) call('He’s off you! Slam him back', 'alarm', 1.6);
}

function idleTick(m, dt) {
  if (S.t < (m.calmUntil || 0)) return;
  for (const h of S.heroes) {
    if (!h.alive) continue;
    if (dist(m, h) <= m.M.aggro && roomIndexOf(h.x, h.y) === m.pack.def.room) { aggro(m, h, 1); return; }
  }
}

function meleeTick(m, dt) {
  const t = m.target, M = m.M;
  const reach = m.r + t.r + M.reach;
  const d = dist(m, t);
  if (m.wind > 0) {
    m.wind -= dt; m.face = angTo(m, t); m.flip = Math.cos(m.face) < 0;
    if (m.wind <= 0) {
      if (d <= reach + 20) {
        hurtHero(t, M.dmg * m.dmgMul * (m.wild ? 1.4 : 1), m, { heavy: M.heavy, block: true, perfectable: false });
        fx({ type: 'slash', x: t.x, y: t.y - 36, a: angTo(m, t), r: M.big ? 58 : 38, dur: 0.16, col: '#F0E8D2' });
        sfx(M.big ? 'thud' : 'hit', 0.7);
      }
      m.lunge = 0.18; m.lungeA = angTo(m, t);
      m.atkT = M.every * (m.wild ? 0.75 : 1);
    }
    return;
  }
  if (d > reach) { walkTo(m, t.x, t.y, m.speed * (1 - (m.st.slow || 0)) * (m.wild ? 1.35 : 1), dt, reach - 6); m.atkT = Math.max(m.atkT, 0.2); }
  else { m.face = angTo(m, t); m.flip = Math.cos(m.face) < 0; m.atkT -= dt; if (m.atkT <= 0) { m.wind = M.wind; m.atkSeq = (m.atkSeq || 0) + 1; } }
}

export function startCast(m, c) { m.cast = Object.assign({ t: 0, taken: 0 }, c); sfx('castup', 0.7); }
function castTick(m, dt) {
  const c = m.cast; c.t += dt;
  if (m.target) { m.face = angTo(m, m.target); m.flip = Math.cos(m.face) < 0; }
  if (c.t >= c.dur) { m.cast = null; c.done(); }
}
export function interruptCast(m) {
  if (!m.cast) return;
  const kickable = !!m.cast.kick;
  m.cast = null;
  if (kickable) { fxText(m.x, m.y - 110, 'Interrupted!', '#F2C230', 24, { dur: 1.2 }); sfx('kick'); S.stats.kicks++; }
}

function archerTick(m, dt) {
  const R = m.M.ranged, t = m.target, d = dist(m, t);
  if (m.ab.shot === undefined) m.ab.shot = rand(0.6, 1.4);
  if (m.ab.aim) {
    const a = m.ab.aim; a.t -= dt; m.face = a.a; m.flip = Math.cos(a.a) < 0;
    if (a.t <= 0) {
      m.ab.aim = null; m.ab.shot = R.every * rand(0.9, 1.15);
      S.projs.push({ team: 'mob', x: m.x + Math.cos(a.a) * 22, y: m.y + Math.sin(a.a) * 22, vx: Math.cos(a.a) * R.speed, vy: Math.sin(a.a) * R.speed, z: 40, sp: 'arrow', src: m, dmg: R.dmg, r: 9, life: 480 / R.speed });
      m.lunge = 0.14; m.lungeA = a.a + Math.PI;
      sfx('arrow', 0.7);
    }
    return true;
  }
  m.ab.shot -= dt;
  if (d > R.max) walkTo(m, t.x, t.y, m.speed, dt);
  else if (d < R.min) { const a = angTo(t, m); walkTo(m, m.x + Math.cos(a) * 80, m.y + Math.sin(a) * 80, m.speed * 0.85, dt); }
  else { m.face = angTo(m, t); m.flip = Math.cos(m.face) < 0; }
  if (m.ab.shot <= 0 && d < R.max + 100) {
    const v = rng() < 0.5 ? t : randomHero(false) || t;
    const a = angTo(m, v);
    m.ab.aim = { t: R.warn, a };
    S.hazards.push({ shape: 'line', x: m.x, y: m.y, a, len: 470, w: 22, warn: R.warn, t: 0, noDmg: true, arrow: true, src: m, speed: R.speed });
  }
  return true;
}

function callerTick(m, dt) {
  const ab = m.ab;
  if (ab.raise === undefined) { ab.raise = 3.5; ab.rot = 5.5; }
  ab.raise -= dt; ab.rot -= dt;
  if (ab.raise <= 0) {
    ab.raise = 11;
    startCast(m, { key: 'raise', name: 'Raise Dead', dur: 2.6, kick: 110, done: () => {
      if (!m.alive) return;
      for (let i = 0; i < 2; i++) {
        const a = rand(0, TAU), x = m.x + Math.cos(a) * 60, y = m.y + Math.sin(a) * 40;
        const r = spawnMob(i ? 'rattler2' : 'rattler', canStand(x, y, 16) ? x : m.x, canStand(x, y, 16) ? y : m.y + 30, m.pack, true);
        aggro(r, m.target || nearestHeroTo(m.x, m.y), 5);
      }
      banner('He raised more skeletons. Hit or freeze him while he casts!', 'warn', 2.4);
    } });
    if (!S.hints.raise) { S.hints.raise = 1; HOOKS.hint('kick'); }
    return true;
  }
  if (ab.rot <= 0) {
    ab.rot = 7.5;
    const v = randomHero(false);
    if (v) { S.hazards.push({ shape: 'circle', x: v.x, y: v.y, r: 85, warn: 1.0, live: 6, tick: 0.5, dmg: 20, magic: true, pool: 'rot', t: 0, src: m }); sfx('rot', 0.6); }
  }
  const t = m.target, d = dist(m, t);
  if (d < m.r + t.r + 26) return false;
  if (d > 300) walkTo(m, t.x, t.y, m.speed, dt);
  else if (d < 170) { const a = angTo(t, m); walkTo(m, m.x + Math.cos(a) * 80, m.y + Math.sin(a) * 80, m.speed * 0.8, dt); }
  else { m.face = angTo(m, t); m.flip = Math.cos(m.face) < 0; }
  return true;
}

function bruteTick(m, dt) {
  const ab = m.ab;
  if (ab.slam === undefined) ab.slam = 4;
  if (m.busy > 0) { m.busy -= dt; if (m.busy <= 0) m.pose = null; return true; }
  ab.slam -= dt;
  if (ab.slam <= 0) {
    ab.slam = 9; m.busy = 1.7; m.pose = 'wind'; m.wind = 0;
    S.hazards.push({ shape: 'circle', x: m.x, y: m.y, r: 150, warn: 1.5, t: 0, src: m, dmg: 110, knock: 300, follow: m,
      onFire: (z) => { shake(8); sfx('slam'); fx({ type: 'ring', x: z.x, y: z.y, r0: 30, r1: 160, col: '#C9B79A', dur: 0.35, w: 10, ground: true }); dots(z.x, z.y, '#C9B79A', 14, 260); m.lunge = 0.2; m.lungeA = Math.PI / 2; } });
    return true;
  }
  return false;
}

function wispTick(m, dt) {
  m.life = (m.life === undefined ? 14 : m.life) - dt;
  if (m.life <= 0) { m.alive = false; m.deadT = 0; m.state = 'dead'; return; }
  let t = m.target;
  if (!t || !t.alive) t = m.target = nearestHeroTo(m.x, m.y, true);
  if (!t) return;
  const a = angTo(m, t) + Math.sin(S.t * 3 + m.seed) * 0.45;
  m.x += Math.cos(a) * m.speed * dt; m.y += Math.sin(a) * m.speed * dt;
  m.flip = Math.cos(a) < 0; m.moving = 0.1; m.walkT += dt * 4;
  if (dist(m, t) < m.r + t.r + 6) {
    const got = hurtHero(t, 85, m, { magic: true, block: false });
    if (got > 0) { t.st.haunt = 3; if (t.isPlayer) fxText(t.x, t.y - 110, 'Haunted', '#C8F5E8', 16); }
    killMob(m, null);
  }
}

/* ---------- cages, chains: the swipe and tap mechanics ---------- */
/* Only the tank is ever caged. Inside, nothing can target him and every mob forgets half of what he did,
   so the boss turns on someone else until he mashes out (or a mate breaks him out) and Slams it back. */
export function makeCage(h, boss) {
  const c = makeMob('rattler', h.x, h.y, null);
  Object.assign(c, { cage: true, hp: 10, maxHp: 10, name: 'Bone cage', r: 30, hero: h, life: 6, state: 'fight', ghostProps: true, born: S.t });
  h.st.caged = c; h.cast = null; h.blocking = false; h.dodgeT = 0; h.dash = null;
  for (const m of S.mobs) {
    if (m.threat.has(h.id)) m.threat.set(h.id, m.threat.get(h.id) * 0.5);
    if (m.forced === h) { m.forced = null; m.forcedT = 0; }
  }
  S.mobs.push(c);
  bits(h.x, h.y - 30, 'shard_bone', 6, 160);
  sfx('cage');
  if (h.isPlayer) { call('Tap to break free!', 'alarm', 1.6); HOOKS.hint('cageSelf'); } else if (!S.hints.cage) { S.hints.cage = 1; HOOKS.hint('cage'); }
  return c;
}
function cageTick(c, dt) {
  const h = c.hero;
  c.x = h.x; c.y = h.y + 1;
  c.life -= dt;
  if (!h.alive) { breakCage(c, false); return; }
  if (c.life <= 0) {
    breakCage(c, false);
    hurtHero(h, 180, null, { pierce: true, block: false, dodge: false });
    fxText(h.x, h.y - 120, 'Crushed', '#FF6B5E', 22);
  }
}
/* one tap on a cage: by the hero inside (mashing) or a mate outside */
export function mashCage(h) {
  const c = h && h.st.caged;
  if (!c || !c.alive) return;
  c.hp -= 1; c.flash = 0.1; sfx('cagehit');
  bits(c.x, c.y - 50, 'shard_bone', 1, 120);
  if (c.hp <= 0) breakCage(c, true, h);
}
/* freed: broken from outside or mashed open. by: who did it (a hero or undefined) */
export function breakCage(c, freed, by) {
  if (!c.alive) return;
  c.alive = false; c.state = 'dead'; c.deadT = 0;
  if (c.hero) c.hero.st.caged = null;
  bits(c.x, c.y - 50, 'shard_bone', 10, 240);
  if (freed) {
    fxText(c.x, c.y - 130, 'Free!', '#9BE15D', 24); sfx('cagebreak'); S.stats.cages++;
    const self = !!(c.hero && by === c.hero);
    emit({ type: 'cage.broken', player: !!(by && by.isPlayer), self, secs: S.t - (c.born || S.t) });
    const h = c.hero;
    if (h && h.isPlayer && h.alive && S.boss && S.boss.alive && S.boss.target !== h) call('Out! Now Slam him back', 'alarm', 1.6);
  }
}
export function makeChain(boss, h) {
  const ch = { boss, hero: h, t: 0, max: 8, tick: 0.5, id: 'ch' + S.seq++ };
  h.st.chained = ch;
  S.chains.push(ch);
  sfx('chain');
  if (!S.hints.chain) { S.hints.chain = 1; HOOKS.hint('chain'); }
  call('Cut the chain!', 'alarm', 1.6);
  return ch;
}
export function chainEnds(ch) { const b = ch.boss, h = ch.hero; return { ax: b.x + 70, ay: b.y - 120, bx: h.x, by: h.y - 44 }; }
export function chainTick(ch, dt) {
  const h = ch.hero;
  ch.t += dt; ch.tick -= dt;
  if (!h.alive || !ch.boss.alive || ch.t >= ch.max) { cutChain(ch, false); return; }
  if (ch.tick <= 0) { ch.tick = 0.5; hurtHero(h, 18, ch.boss, { magic: true, pierce: true, block: false, dodge: false, numCol: '#C8F5E8', numSize: 15, numDur: 0.6 }); }
}
export function cutChain(ch, byWho) {
  if (ch.dead) return;
  ch.dead = true;
  if (ch.hero.st.chained === ch) ch.hero.st.chained = null;
  S.chains = S.chains.filter((c) => c !== ch);
  if (byWho) {
    const e = chainEnds(ch);
    const mx = (e.ax + e.bx) / 2, my = (e.ay + e.by) / 2;
    fxText(mx, my - 20, 'Cut!', '#F2C230', 26);
    dots(mx, my, '#C9D2DC', 10, 200);
    sfx('cut'); S.stats.cuts++;
    emit({ type: 'chain.cut', player: !!byWho.isPlayer });
  }
}

/* a hit on the whole party that nobody can dodge: the healer's job */
export function partyPulse(m, dmg, name, col) {
  for (const h of S.heroes) if (h.alive) hurtHero(h, dmg * m.dmgMul, m, { magic: true, pierce: true, block: false, dodge: false });
  fx({ type: 'ring', x: m.x, y: m.y - 60, r0: 40, r1: 700, col, dur: 0.6, w: 8 });
  fxText(m.x, m.y - (m.M.big && m.r >= 50 ? 260 : 200), name, col, 22, { dur: 1.2 });
  sfx('pulse');
}

/* spawn a mob into the live game */
export function spawnMob(type, x, y, pack, rise) {
  const m = makeMob(type, x, y, pack);
  m.extra = true;
  if (rise) { m.rise = 0.75; m.riseDur = 0.75; m.state = 'fight'; m.fightT = 0; bits(x, y, 'shard_dirt', 6, 140); }
  if (pack) pack.mobs.push(m);
  S.mobs.push(m);
  return m;
}
