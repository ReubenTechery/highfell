import { MAP, TAU, angTo, clamp, dist, distXY, lerp, pick, rand, rng, vrand } from './core.js';
import { S, addThreat, aggro, banner, bits, call, dots, fx, fxText, hitstop, hurtHero, killMob, makeMob, pickTarget, sfx, shake } from './entities.js';
import { isFoe, later } from './heroes.js';
import { UI } from './ui.js';
import { canStand, moveEnt, roomIndexOf, walkTo } from './world.js';

/* ---------- mobs: trash AI, casters, the two bosses ---------- */
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
  m.target = pickTarget(m);
  if (!m.target) {
    const n = nearestHeroTo(m.x, m.y);
    if (n && dist(m, n) < 700) { addThreat(m, n, 1); m.target = n; } else return;
  }
  if (!m.isBoss) {
    if (m.target.role === 'tank' || m.forcedT > 0) m.loose = 0; else m.loose = (m.loose || 0) + dt;
    const was = m.wild;
    m.wild = m.loose > 3;
    if (m.wild && !was) { fxText(m.x, m.y - (m.M.big ? 150 : 100), 'Wild!', '#FF6B5E', 20, { dur: 1 }); if (!S.hints.wild) { S.hints.wild = 1; UI.hint('wild'); } }
  }
  if (m.isBoss) { if (m.type === 'knight' ? knightTick(m, dt) : keeperTick(m, dt)) return; }
  if (m.cast) { castTick(m, dt); return; }
  if (m.type === 'caller' && callerTick(m, dt)) return;
  if (m.type === 'brute' && bruteTick(m, dt)) return;
  if (m.M.ranged && archerTick(m, dt)) return;
  meleeTick(m, dt);
}

export function idleTick(m, dt) {
  if (S.t < (m.calmUntil || 0)) return;
  for (const h of S.heroes) {
    if (!h.alive) continue;
    if (dist(m, h) <= m.M.aggro && roomIndexOf(h.x, h.y) === m.pack.def.room) { aggro(m, h, 1); return; }
  }
}

export function meleeTick(m, dt) {
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
  if (d > reach) { walkTo(m, t.x, t.y, m.speed * (1 - st0(m)) * (m.wild ? 1.35 : 1), dt, reach - 6); m.atkT = Math.max(m.atkT, 0.2); }
  else { m.face = angTo(m, t); m.flip = Math.cos(m.face) < 0; m.atkT -= dt; if (m.atkT <= 0) { m.wind = M.wind; m.atkSeq = (m.atkSeq || 0) + 1; } }
}
export const st0 = (m) => m.st.slow || 0;

export function startCast(m, c) { m.cast = Object.assign({ t: 0, taken: 0 }, c); sfx('castup', 0.7); }
export function castTick(m, dt) {
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

export function archerTick(m, dt) {
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

export function callerTick(m, dt) {
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
    if (!S.hints.raise) { S.hints.raise = 1; UI.hint('kick'); }
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

export function bruteTick(m, dt) {
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

export function wispTick(m, dt) {
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
    if (got > 0) { t.st.haunt = 3; fxText(t.x, t.y - 110, 'Haunted', '#C8F5E8', 16); }
    killMob(m, null);
  }
}

/* ---------- cages, chains: the swipe and tap mechanics ---------- */
export function makeCage(h, boss) {
  const c = makeMob('rattler', h.x, h.y, null);
  Object.assign(c, { cage: true, hp: 10, maxHp: 10, name: 'Bone cage', r: 30, hero: h, life: 6, state: 'fight', ghostProps: true });
  h.st.caged = c; h.cast = null; h.blocking = false; h.dodgeT = 0;
  S.mobs.push(c);
  bits(h.x, h.y - 30, 'shard_bone', 6, 160);
  sfx('cage');
  if (h.isPlayer) { call('Tap to break free!', 'alarm', 1.6); UI.hint('cageSelf'); } else if (!S.hints.cage) { S.hints.cage = 1; UI.hint('cage'); }
  return c;
}
export function cageTick(c, dt) {
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
export function breakCage(c, freed) {
  if (!c.alive) return;
  c.alive = false; c.state = 'dead'; c.deadT = 0;
  if (c.hero) c.hero.st.caged = null;
  bits(c.x, c.y - 50, 'shard_bone', 10, 240);
  if (freed) { fxText(c.x, c.y - 130, 'Free!', '#9BE15D', 24); sfx('cagebreak'); S.stats.cages++; }
}
export function makeChain(boss, h) {
  const ch = { boss, hero: h, t: 0, max: 8, tick: 0.5, id: 'ch' + S.seq++ };
  h.st.chained = ch;
  S.chains.push(ch);
  sfx('chain');
  if (!S.hints.chain) { S.hints.chain = 1; UI.hint('chain'); }
  if (h.isPlayer) call('Cut the chain!', 'alarm', 1.4);
  return ch;
}
export function chainEnds(ch) { const b = ch.boss, h = ch.hero; return { ax: b.x + 70, ay: b.y - 120, bx: h.x, by: h.y - 44 }; }
export function chainTick(ch, dt) {
  const h = ch.hero;
  ch.t += dt; ch.tick -= dt;
  if (!h.alive || !ch.boss.alive || ch.t >= ch.max) { cutChain(ch, false); return; }
  if (ch.tick <= 0) { ch.tick = 0.5; hurtHero(h, 18, ch.boss, { magic: true, pierce: true, block: false, dodge: false, quiet: true }); fxText(h.x, h.y - 64, '-18', '#C8F5E8', 15, { dur: 0.6 }); }
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
  }
}

/* a hit on the whole party that nobody can dodge: the healer's job */
export function partyPulse(m, dmg, name, col) {
  for (const h of S.heroes) if (h.alive) hurtHero(h, dmg * m.dmgMul, m, { magic: true, pierce: true, block: false, dodge: false });
  fx({ type: 'ring', x: m.x, y: m.y - 60, r0: 40, r1: 700, col, dur: 0.6, w: 8 });
  fxText(m.x, m.y - (m.type === 'keeper' ? 260 : 200), name, col, 22, { dur: 1.2 });
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

/* ---------- Sir Rattlebones ---------- */
export function knightTick(m, dt) {
  const ab = m.ab;
  if (!ab.init) { ab.init = true; ab.t = 0; ab.sweep = 3.5; ab.charge = 7; }
  ab.t += dt;
  if (!ab.enraged && ab.t > 180) { ab.enraged = true; m.dmgMul = 2.5; m.speed *= 1.3; banner('Sir Rattlebones has had enough of you!', 'warn', 2.4); sfx('roar'); }
  if (m.phase === 1 && m.hp < m.maxHp * 0.5) {
    m.phase = 2; m.act = { k: 'rally', t: 0 }; m.wind = 0;
    banner('Phase 2: he calls up his guard. Grab them, then hit him!', 'warn', 2.6); sfx('roar'); shake(6);
    return true;
  }
  m.armorUp = m.phase === 2 && S.mobs.some((o) => o.alive && o.rally) ? 0.6 : 0;
  if (m.phase === 2) { ab.pulse = (ab.pulse === undefined ? 4 : ab.pulse) - dt; if (ab.pulse <= 0) { ab.pulse = 12; partyPulse(m, 45, 'Bone rattle', '#F0E8D2'); } }
  if (m.act) return knightAct(m, dt);
  if (m.wind > 0) return false;
  ab.sweep -= dt; ab.charge -= dt;
  if (ab.charge <= 0) {
    ab.charge = m.phase === 2 ? 9 : 11;
    const v = randomHero(true) || m.target;
    if (v) {
      const a = angTo(m, v), len = dist(m, v) + 150;
      m.act = { k: 'charge', t: 0, phase: 'wind', a, len, hit: new Set(), went: 0 };
      m.face = a; m.flip = Math.cos(a) < 0;
      S.hazards.push({ shape: 'rect', x: m.x, y: m.y, a, len, w: 86, warn: 1.6, t: 0, noDmg: true, src: m });
      call('Charge! Get out of the line', 'alarm', 1.2);
      return true;
    }
  }
  if (ab.sweep <= 0) {
    ab.sweep = m.phase === 2 ? 7 : 8.5;
    const a = angTo(m, m.target);
    m.act = { k: 'sweep', t: 0, dur: 1.55 };
    m.face = a; m.flip = Math.cos(a) < 0; m.pose = 'wind';
    S.hazards.push({ shape: 'cone', x: m.x, y: m.y, a, r: 210, arc: 2.27, warn: 1.4, t: 0, dmg: 190, heavy: true, block: true, src: m, tankBuster: true,
      onFire: () => { sfx('sweep'); shake(5); m.pose = null; m.lunge = 0.2; m.lungeA = a; fx({ type: 'slash', x: m.x, y: m.y - 60, a, r: 150, dur: 0.22, col: '#FFFFFF', wide: true }); } });
    return true;
  }
  return false;
}
export function knightAct(m, dt) {
  const a = m.act; a.t += dt;
  if (a.k === 'rally') {
    m.pose = 'wind';
    if (!a.done && a.t > 1.0) {
      a.done = true; m.pose = null;
      S.props.filter((p) => p.sp === 'coffin' && p.room === 3 && p.sc === 1).forEach((p, i) => {
        p.sp = 'coffin_open';
        const r = spawnMob(i % 2 ? 'rattler2' : 'rattler', p.x + (p.x < 500 ? 46 : -46), p.y - 40, null, true);
        r.rally = true;
        const v = randomHero(true) || m.target;
        aggro(r, v, 60);
      });
      shake(6); sfx('rise');
    }
    if (a.t > 1.9) m.act = null;
    return true;
  }
  if (a.k === 'sweep') { if (a.t >= a.dur) { m.act = null; m.pose = null; m.atkT = 0.8; } return true; }
  if (a.k === 'charge') {
    if (a.phase === 'wind') { m.pose = 'wind'; if (a.t >= 1.6) { a.phase = 'go'; m.pose = null; sfx('charge'); } return true; }
    const step = 1150 * dt;
    const ok = moveEnt(m, Math.cos(a.a) * step, Math.sin(a.a) * step);
    a.went += step; m.moving = 0.1; m.walkT += dt * 20;
    if (S.frame % 2 === 0) dots(m.x, m.y, '#C9B79A', 2, 60, { size: 6 });
    for (const h of S.heroes) {
      if (!h.alive || a.hit.has(h.id)) continue;
      if (dist(h, m) <= h.r + m.r + 8) {
        a.hit.add(h.id);
        const got = hurtHero(h, 190, m, { heavy: true, block: true });
        if (got > 40) { h.st.stun = Math.max(h.st.stun, 0.7); h.st.kx += Math.cos(a.a + 1.57 * (rng() < 0.5 ? 1 : -1)) * 320; h.st.ky += Math.sin(a.a) * 200; }
        shake(5); sfx('thud');
      }
    }
    if (!ok || a.went >= a.len) { m.act = null; m.atkT = 1.0; shake(3); }
    return true;
  }
  m.act = null;
  return false;
}

/* ---------- the Gravekeeper ---------- */
export function keeperTick(m, dt) {
  const ab = m.ab;
  if (!ab.init) { ab.init = true; ab.t = 0; ab.smash = 6; ab.toss = 4; ab.hands = 9.5; }
  ab.t += dt;
  if (!ab.enraged && ab.t > 300) { ab.enraged = true; m.dmgMul = 3; banner('He’s done digging. This is the end.', 'warn', 2.6); sfx('roar'); }
  if (m.phase === 1 && m.hp < m.maxHp * 0.66 && !m.act) {
    m.phase = 2; m.act = { k: 'leap', t: 0 }; m.wind = 0; m.pose = null;
    ab.wisps = 3.5; ab.chain = 7; ab.smash = 11; ab.toss = 9;
    banner('Phase 2: lights out. Watch for wisps and chains.', 'warn', 2.6); sfx('roar');
    S.hazards.push({ shape: 'circle', x: MAP.arena.x, y: MAP.arena.y, r: 150, warn: 1.2, t: 0, dmg: 120, src: m, onFire: () => { shake(9); sfx('slam'); } });
    return true;
  }
  if (m.phase === 2 && m.hp < m.maxHp * 0.33 && !m.act) {
    m.phase = 3; m.act = { k: 'bury', t: 0 }; m.wind = 0; m.pose = 'smash';
    ab.burrow = 6; ab.cage = 11; ab.smash = 9;
    banner('Phase 3: he’s burying the yard. Stay inside the ring!', 'warn', 2.8); sfx('roar');
    return true;
  }
  if (m.phase >= 2) { ab.pulse = (ab.pulse === undefined ? 5 : ab.pulse) - dt; if (ab.pulse <= 0) { ab.pulse = m.phase === 2 ? 9 : 11; partyPulse(m, m.phase === 2 ? 55 : 65, m.phase === 2 ? 'Grave cold' : 'Grave dust', m.phase === 2 ? '#C8F5E8' : '#C9B79A'); } }
  if (m.act) return keeperAct(m, dt);
  if (m.wind > 0) return false;
  for (const k of ['smash', 'toss', 'hands', 'wisps', 'chain', 'burrow', 'cage']) if (ab[k] !== undefined) ab[k] -= dt;
  const P = m.phase;
  if (ab.smash <= 0) { ab.smash = P === 3 ? 12 : P === 2 ? 15 : 13; return startSmash(m); }
  if (P === 3 && ab.burrow <= 0) { ab.burrow = 16; return startBurrow(m); }
  if (P === 3 && ab.cage <= 0) {
    ab.cage = 18;
    const v = randomHero(true);
    if (v && v.role !== 'tank') { makeCage(v, m); m.act = { k: 'gesture', t: 0, dur: 0.7 }; m.pose = 'smash'; return true; }
  }
  if (P === 2 && ab.wisps <= 0) {
    ab.wisps = 7;
    const targets = S.heroes.filter((h) => h.alive).sort((a, b) => (a.role === 'tank') - (b.role === 'tank'));
    for (let i = 0; i < 3; i++) {
      const w = spawnMob('wisp', m.x + 104 + rand(-20, 20), m.y - 60 + rand(-20, 20), null, false);
      w.state = 'fight'; w.seed = rand(0, 9); w.target = targets[i % targets.length] || null; w.life = 14;
    }
    sfx('wail');
    if (!S.hints.wisp) { S.hints.wisp = 1; UI.hint('wisp'); }
    m.act = { k: 'gesture', t: 0, dur: 0.6 };
    return true;
  }
  if (P === 2 && ab.chain <= 0) {
    ab.chain = 14;
    const v = S.heroes.filter((h) => h.alive && h.role !== 'tank' && !h.st.chained && !h.st.caged);
    if (v.length) { makeChain(m, pick(v)); m.act = { k: 'gesture', t: 0, dur: 0.6 }; return true; }
  }
  if (P === 1 && ab.hands <= 0) {
    ab.hands = 12;
    for (const h of S.heroes) if (h.alive) S.hazards.push({ shape: 'circle', x: h.x, y: h.y, r: 60, warn: 1.25, t: 0, dmg: 95, root: 1.5, src: m, onFire: (z) => { S.fx.push({ type: 'hand', x: z.x, y: z.y + 4, t: 0, dur: 1.1 }); bits(z.x, z.y, 'shard_dirt', 5, 120); } });
    sfx('rumble');
    m.act = { k: 'gesture', t: 0, dur: 0.6 };
    return true;
  }
  if (P <= 2 && ab.toss <= 0) {
    ab.toss = P === 2 ? 11 : 9;
    const v = randomHero(true);
    if (v) {
      const a = angTo(m, v);
      m.face = a; m.flip = Math.cos(a) < 0;
      S.hazards.push({ shape: 'cone', x: m.x, y: m.y, a, r: 380, arc: 0.9, warn: 1.1, t: 0, dmg: 120, block: true, src: m, follow: m, onFire: (z) => { sfx('toss'); for (let i = 0; i < 8; i++) { const r = vrand(80, 360), aa = a + vrand(-0.4, 0.4); dots(m.x + Math.cos(aa) * r, m.y + Math.sin(aa) * r, '#6B4A3A', 2, 80, { size: 7 }); } } });
      m.act = { k: 'gesture', t: 0, dur: 1.15 };
      return true;
    }
  }
  return false;
}
export function startSmash(m) {
  const t = m.target;
  if (!t) return false;
  m.act = { k: 'smash', t: 0, dur: 2.3, tgt: t };
  m.pose = 'smash';
  const z = { shape: 'circle', x: t.x, y: t.y, r: 72, warn: 1.85, t: 0, src: m, followT: t, followFor: 1.4, tankBuster: true, smash: true,
    onFire: (zz) => {
      m.pose = null; m.lunge = 0.25; m.lungeA = angTo(m, zz);
      shake(11); sfx('smash'); hitstop(0.06);
      fx({ type: 'ring', x: zz.x, y: zz.y, r0: 20, r1: 120, col: '#C9B79A', dur: 0.35, w: 12, ground: true });
      dots(zz.x, zz.y, '#6B4A3A', 16, 280, { size: 7 });
      for (const h of S.heroes) {
        if (!h.alive) continue;
        if (h === t && distXY(h.x, h.y, zz.x, zz.y) <= zz.r + h.r) hurtHero(h, 520 * m.dmgMul, m, { heavy: true, block: true, pierce: true });
        else if (distXY(h.x, h.y, zz.x, zz.y) <= zz.r + h.r) hurtHero(h, 180 * m.dmgMul, m, { block: false });
      }
    } };
  S.hazards.push(z);
  if (t.isPlayer && t.role === 'tank') { later(0.7, () => { if (m.act && m.act.k === 'smash') call('BLOCK!', 'alarm', 1.0); }); if (!S.hints.block) { S.hints.block = 1; UI.hint('block'); } }
  sfx('windup');
  return true;
}
export function startBurrow(m) {
  const v = randomHero(false);
  if (!v) return false;
  m.act = { k: 'burrow', t: 0, dur: 3.9 };
  m.hidden = true; m.untargetable = true; m.pose = null;
  bits(m.x, m.y, 'shard_dirt', 14, 260); shake(5); sfx('dig');
  S.hazards.push({ shape: 'circle', x: v.x, y: v.y, r: 112, warn: 3.4, t: 0, src: m, followT: v, followFor: 2.6, followSpeed: 175, burrow: true,
    onFire: (z) => {
      m.x = z.x; m.y = z.y; m.hidden = false; m.untargetable = false; m.home = { x: z.x, y: z.y };
      shake(10); sfx('erupt'); hitstop(0.05);
      bits(z.x, z.y, 'shard_dirt', 22, 340);
      for (const h of S.heroes) if (h.alive && distXY(h.x, h.y, z.x, z.y) <= z.r + h.r) { const got = hurtHero(h, 220 * m.dmgMul, m, { block: false }); if (got > 0) h.st.air = 0.6; }
      S.rings.push({ x: z.x, y: z.y, r: 40, speed: 270, w: 26, max: 620, hit: new Set(), dmg: 90, src: m });
      later(0.75, () => { if (m.alive) S.rings.push({ x: z.x, y: z.y, r: 40, speed: 270, w: 26, max: 620, hit: new Set(), dmg: 90, src: m }); });
      if (!S.hints.rings) { S.hints.rings = 1; UI.hint('rings'); }
    } });
  return true;
}
export function keeperAct(m, dt) {
  const a = m.act; a.t += dt;
  if (a.k === 'leap') {
    const A = MAP.arena;
    if (!a.from) a.from = { x: m.x, y: m.y };
    const k = clamp(a.t / 1.2, 0, 1);
    m.x = lerp(a.from.x, A.x, k); m.y = lerp(a.from.y, A.y - 40, k);
    m.jumpZ = Math.sin(k * Math.PI) * 160;
    if (k >= 1 && !a.landed) { a.landed = true; m.jumpZ = 0; S.darkTarget = 1; bits(m.x, m.y, 'shard_dirt', 18, 300); }
    if (a.t > 2.0) { m.act = null; m.home = { x: m.x, y: m.y }; }
    return true;
  }
  if (a.k === 'bury') {
    if (a.t > 0.8 && !a.done) {
      a.done = true; m.pose = null; S.darkTarget = 0;
      S.ring = { r: MAP.arena.r, target: 300, tick: 0.5 };
      shake(10); sfx('slam'); sfx('fire');
      fx({ type: 'ring', x: m.x, y: m.y, r0: 40, r1: 460, col: '#9BE15D', dur: 0.6, w: 10, ground: true });
    }
    if (a.t > 2.0) m.act = null;
    return true;
  }
  if (a.k === 'smash') {
    if (!isFoe(m) || a.t >= a.dur) { m.act = null; m.pose = null; m.atkT = 1.0; }
    else if (a.tgt && a.tgt.alive) { m.face = angTo(m, a.tgt); m.flip = Math.cos(m.face) < 0; }
    return true;
  }
  if (a.k === 'burrow') { if (a.t >= a.dur) { m.act = null; m.atkT = 1.2; } return true; }
  if (a.k === 'gesture') { if (a.t >= a.dur) { m.act = null; if (m.pose === 'smash') m.pose = null; } return true; }
  m.act = null;
  return false;
}
