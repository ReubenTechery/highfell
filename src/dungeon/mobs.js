/* ---------- mobs: the behaviour library (melee, ranged, casters, brutes, wisps), cages and chains ---------- */
import { angTo, dist, distXY, TAU } from '../core/math';
import { pick, rand, rng } from '../core/rng';
import { S, emit } from './state.js';
import { addThreat, aggro, banner, bits, call, dots, exposeMob, fx, fxText, hold, hurtHero, hurtMob, killMob, makeMob, pickTarget, sfx, shake, tunedDmg } from './entities.js';
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
  m.exposed = Math.max(0, (m.exposed || 0) - dt);
  if (m.burned && m.exposed <= 0) m.burned = null;
  if (!m.alive) { m.deadT += dt; return; }
  // something that isn't a fighter (a bomb) runs itself
  if (m.M.tick) { m.M.tick(m, dt); return; }
  if (m.bleed && m.bleed.left > 0) {
    m.bleed.left -= dt;
    m.bleed.next -= dt;
    if (m.bleed.next <= 0) {
      m.bleed.next += 0.5;
      hurtMob(m, m.bleed.per, m.bleed.src, { col: '#7CF06A', size: 16, noCrit: true, tier: 'tick', key: 'venom' });
      dots(m.x, m.y - 38, '#7CF06A', 2, 70, { size: 4 });
      if (!m.alive) return;
    }
  }
  const st = m.st;
  st.stun = Math.max(0, st.stun - dt); st.freeze = Math.max(0, st.freeze - dt);
  st.chill = Math.max(0, (st.chill || 0) - dt); st.stagger = Math.max(0, (st.stagger || 0) - dt);
  if (st.slowT > 0) { st.slowT -= dt; if (st.slowT <= 0) st.slow = 0; }
  if (m.forcedT > 0) m.forcedT -= dt;
  if (st.kx || st.ky) { moveEnt(m, st.kx * dt, st.ky * dt); const k = Math.pow(0.01, dt); st.kx *= k; st.ky *= k; if (Math.abs(st.kx) + Math.abs(st.ky) < 6) st.kx = st.ky = 0; }
  if (m.rise > 0) { m.rise -= dt; return; }
  if (m.cage) { cageTick(m, dt); return; }
  if (m.M.wisp) { wispTick(m, dt); return; }
  if (m.state === 'idle') { idleTick(m, dt); return; }
  m.fightT += dt;
  if (S.opts && S.opts.start === 'intro' && m.isBoss && m.act && (m.act.k === 'charge' || m.act.k === 'sweep')) { st.freeze = 0; st.stun = 0; }
  if (st.freeze > 0 || st.stun > 0) {
    m.wind = 0;
    if (m.cast) interruptCast(m);
    if (m.act && m.act.k !== 'rally') {
      S.hazards = S.hazards.filter((z) => z.src !== m || z.live);
      m.act = null; m.pose = null;
    }
    return;
  }
  const prev = m.target;
  m.target = pickTarget(m);
  if (prev && m.target && m.target !== prev && m.isBoss) bossTurned(m, prev, m.target);
  if (!m.target) {
    const n = nearestHeroTo(m.x, m.y);
    if (n && dist(m, n) < 700) { addThreat(m, n, 1); m.target = n; } else return;
  }
  if (!m.isBoss) {
    if (m.target.role === 'tank' || m.forcedT > 0) m.loose = 0; else m.loose = (m.loose || 0) + dt;
    const was = m.wild;
    m.wild = m.loose > 3;
    if (m.wild && !was) fxText(m.x, m.y - (m.M.big ? 150 : 100), 'Wild!', '#FF6B5E', 20, { dur: 1 });
  }
  if (m.M.ai && m.M.ai(m, dt)) return;
  // a boss's own move (a party-wide hit) can knock its target down mid-frame
  if (!m.target || !m.target.alive) return;
  if (m.cast) { castTick(m, dt); return; }
  if (m.M.kind === 'caller' && callerTick(m, dt)) return;
  if (m.M.kind === 'mender' && menderTick(m, dt)) return;
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
        const crush = !!(M.boss || M.big) && t.role !== 'tank';
        const mult = (m.wild ? 1.4 : 1) * (crush ? 1.85 : 1);
        hurtHero(t, M.dmg * m.dmgMul * tunedDmg(m.type) * mult, m, { heavy: M.heavy || crush, block: true, perfectable: false, crush });
        if (crush && t.isPlayer) call('Crushing blow! Let the tank hold him!', 'alarm', 1.6);
        fx({ type: 'slash', x: t.x, y: t.y - 36, a: angTo(m, t), r: M.big ? 58 : 38, dur: 0.16, col: crush ? '#FF6B5E' : '#F0E8D2' });
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

/* ---------- casts ----------
   A cast with `kick` (the green bar) is stopped only by an interrupt: Charge, Rime burst, Fan of Blades or
   Shadowstep, a stun, a freeze or a perfect block. Damage alone never stops it. An interrupt Exposes the caster
   (+35% damage taken, and every class's payoff setup) for 3 seconds. Miss it, and `done` goes off. */
export function startCast(m, c) {
  m.cast = Object.assign({ t: 0 }, c);
  sfx('castup', 0.7);
  if (c.kick && c.name && !m.isBoss) fxText(m.x, m.y - (m.M.big ? 196 : 150), c.name, '#9BE15D', 17, { dur: 0.9 });
}
function castTick(m, dt) {
  const c = m.cast; c.t += dt;
  const look = c.at && c.at.alive ? c.at : m.target;
  if (look) { m.face = angTo(m, look); m.flip = Math.cos(m.face) < 0; }
  if (c.t >= c.dur) { m.cast = null; c.done(); }
}
/** stop a cast; `by` is the hero whose button did it, if any */
export function interruptCast(m, by) {
  if (!m.cast) return;
  const kickable = !!m.cast.kick;
  m.cast = null;
  if (!kickable) return;
  S.stats.kicks++;
  exposeMob(m, 3.0, 'Interrupted!');
  sfx('kick');
  // an interrupt of yours lands like a payoff
  if (by && by.isPlayer) { shake(3.5); hold(0.07, by, m); }
}

function archerTick(m, dt) {
  const R = m.M.ranged, t = m.target, d = dist(m, t);
  if (m.ab.shot === undefined) m.ab.shot = rand(0.6, 1.4);
  if (m.ab.aim) {
    const a = m.ab.aim; a.t -= dt; m.face = a.a; m.flip = Math.cos(a.a) < 0;
    if (a.t <= 0) {
      m.ab.aim = null; m.ab.shot = R.every * rand(0.9, 1.15);
      S.projs.push({ team: 'mob', x: m.x + Math.cos(a.a) * 22, y: m.y + Math.sin(a.a) * 22, vx: Math.cos(a.a) * R.speed, vy: Math.sin(a.a) * R.speed, z: 40, sp: R.sp || 'arrow', spin: !!R.spin, src: m, dmg: R.dmg, r: 9, life: 480 / R.speed });
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

/* the Gravecaller: curses a hero (the healer's), rots the ground, and casts Raise Dead and Grave Bolt (the tank's
   and the DPS's to stop) */
export const GRAVE_BOLT = 200;
function callerTick(m, dt) {
  const ab = m.ab;
  if (ab.raise === undefined) { ab.raise = 3.5; ab.rot = 5.5; ab.curse = 1.8; ab.bolt = 7; }
  ab.raise -= dt; ab.rot -= dt; ab.curse -= dt; ab.bolt -= dt;
  if (ab.curse <= 0) {
    ab.curse = 8.5;
    const pool = S.heroes.filter((h) => h.alive && !h.st.caged && !h.st.curse);
    if (pool.length) curseHero(m, pick(pool));
  }
  // one raised by Sir Rattlebones' rally only curses and rots: his fight has adds enough
  if (ab.raise <= 0 && !m.rally) {
    ab.raise = 12;
    startCast(m, { key: 'raise', name: 'Raise Dead', dur: 2, kick: true, done: () => {
      if (!m.alive) return;
      for (let i = 0; i < 2; i++) {
        const a = rand(0, TAU), x = m.x + Math.cos(a) * 60, y = m.y + Math.sin(a) * 40;
        const r = spawnMob(i ? 'rattler2' : 'rattler', canStand(x, y, 16) ? x : m.x, canStand(x, y, 16) ? y : m.y + 30, m.pack, true);
        aggro(r, m.target || nearestHeroTo(m.x, m.y), 5);
      }
      banner('He raised more skeletons. Interrupt him while he casts!', 'warn', 2.4);
    } });
    return true;
  }
  if (ab.bolt <= 0 && !m.rally) {
    ab.bolt = 9;
    const v = randomHero(false);
    if (v) { startCast(m, { key: 'bolt', name: 'Grave Bolt', dur: 2, kick: true, at: v, done: () => graveBolt(m, v) }); return true; }
  }
  if (ab.rot <= 0) {
    ab.rot = 7.0;
    const v = randomHero(false);
    if (v) { S.hazards.push({ shape: 'circle', x: v.x, y: v.y, r: 88, warn: 1.0, live: 6, tick: 0.5, dmg: 46, magic: true, pool: 'rot', t: 0, src: m }); sfx('rot', 0.6); }
  }
  const t = m.target, d = dist(m, t);
  if (d < m.r + t.r + 26) return false;
  if (d > 300) walkTo(m, t.x, t.y, m.speed, dt);
  else if (d < 170) { const a = angTo(t, m); walkTo(m, m.x + Math.cos(a) * 80, m.y + Math.sin(a) * 80, m.speed * 0.8, dt); }
  else { m.face = angTo(m, t); m.flip = Math.cos(m.face) < 0; }
  return true;
}

/* Grave Bolt lands: a hard hit on the hero it was cast at (a dodge rolls out of it; the tank can block it) */
function graveBolt(m, v) {
  if (!m.alive || !v.alive) return;
  fx({ type: 'beam', x: m.x, y: m.y - 70, x2: v.x, y2: v.y - 50, col: '#9BE15D', dur: 0.25 });
  dots(v.x, v.y - 50, '#9BE15D', 8, 140);
  hurtHero(v, GRAVE_BOLT * m.dmgMul, m, { magic: true, block: true });
  sfx('rot', 0.8);
}

/* the mender: hangs back and casts a heal on the most hurt of its pack (kill it first, or interrupt it) */
export const MENDER = { every: 6, cast: 2, heal: 0.3 };
function menderTick(m, dt) {
  const ab = m.ab;
  if (ab.heal === undefined) ab.heal = 2.5;
  ab.heal -= dt;
  if (ab.heal <= 0) {
    const hurt = S.mobs.filter((o) => o.alive && o.state === 'fight' && !o.isBoss && !o.cage && !o.M.thing && !o.M.wisp && dist(o, m) < 460 && o.hp < o.maxHp * 0.85)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    const t = hurt[0];
    if (t) {
      ab.heal = MENDER.every;
      startCast(m, { key: 'mend', name: 'Mending', dur: MENDER.cast, kick: true, at: t, done: () => mobHeal(m, t, Math.round(t.maxHp * MENDER.heal)) });
      return true;
    }
    ab.heal = 1;
  }
  const t = m.target, d = dist(m, t);
  if (d < m.r + t.r + 26) return false;
  if (d > 300) walkTo(m, t.x, t.y, m.speed, dt);
  else if (d < 180) { const a = angTo(t, m); walkTo(m, m.x + Math.cos(a) * 80, m.y + Math.sin(a) * 80, m.speed * 0.8, dt); }
  else { m.face = angTo(m, t); m.flip = Math.cos(m.face) < 0; }
  return true;
}
function mobHeal(m, t, amt) {
  if (!m.alive || !t.alive) return;
  t.hp = Math.min(t.maxHp, t.hp + amt);
  fx({ type: 'beam', x: m.x, y: m.y - 70, x2: t.x, y2: t.y - 50, col: '#9BE15D', dur: 0.3 });
  fx({ type: 'ring', x: t.x, y: t.y - 40, r0: 10, r1: t.r + 50, col: '#9BE15D', dur: 0.35, w: 5 });
  dots(t.x, t.y - 50, '#D8FFB8', 10, 120, { up: true });
  fxText(t.x, t.y - (t.M.big ? 160 : 112), 'Mended!', '#9BE15D', 20, { dur: 1.0 });
  sfx('heal', 0.6);
  S.stats.menderHeals = (S.stats.menderHeals || 0) + 1;
}

function bruteTick(m, dt) {
  const ab = m.ab;
  if (ab.slam === undefined) ab.slam = 2.8;
  if (m.busy > 0) { m.busy -= dt; if (m.busy <= 0) m.pose = null; return true; }
  ab.slam -= dt;
  if (ab.slam <= 0) {
    ab.slam = 7.5; m.busy = 1.6; m.pose = 'wind'; m.wind = 0;
    S.hazards.push({ shape: 'circle', x: m.x, y: m.y, r: 150, warn: 1.45, t: 0, src: m, dmg: 230, knock: 300, stun: 0.6, follow: m,
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
    const got = hurtHero(t, 145, m, { magic: true, block: false, hazard: true });
    if (got > 0) { t.st.haunt = 3; if (t.isPlayer) fxText(t.x, t.y - 110, 'Haunted', '#C8F5E8', 16); }
    killMob(m, null);
  }
}

/* ---------- curses: only the healer lifts them ---------- */
/* A Gravecaller curses one hero. In CURSE_TIME seconds it bursts and drops them to a tenth of their health; on
   its own it never kills. Only the healer lifts it: a swipe across them, or Sunburst. It goes when the fight
   ends or the hero goes down, and never comes in the Crypt Trial.
   Another dungeon's curse is the same thing in its own look (`o`: { kind, sp (the mark over the hero), col,
   word, onBurst(h, c), onLift(h, c, by) }), like Thimblebriar's Sticky Bomb (bombs.js). */
export const CURSE_TIME = 4;
export const CURSE_COL = '#B79CFF';
export function curseHero(m, h, o) {
  if (!h || !h.alive || h.st.caged || h.st.curse || (S.opts && S.opts.start === 'intro')) return null;
  h.st.curse = Object.assign({ id: 'cu' + S.seq++, t: 0, by: m }, o || {});
  const col = (o && o.col) || CURSE_COL;
  fx({ type: 'beam', x: m.x, y: m.y - 70, x2: h.x, y2: h.y - 120, col, dur: 0.3 });
  dots(h.x, h.y - 120, col, 8, 90);
  sfx('curse', h.isPlayer || S.player.role === 'healer' ? 1 : 0.55);
  if (h.isPlayer || S.player.role === 'healer') fxText(h.x, h.y - 205, (o && o.word) || 'Cursed!', col, 22, { dur: 1.1 });
  emit({ type: 'curse.cast', player: !!h.isPlayer, name: h.isPlayer ? 'you' : h.name, ...(o && o.kind ? { kind: o.kind } : {}) });
  return h.st.curse;
}
export function curseTick(h, dt) {
  const c = h.st.curse;
  if (!h.alive) { h.st.curse = null; return; }
  c.t += dt;
  if (c.t >= CURSE_TIME) burstCurse(h);
}
function burstCurse(h) {
  const c = h.st.curse, col = c.col || CURSE_COL;
  h.st.curse = null;
  const lost = Math.max(0, h.hp - Math.round(h.maxHp * 0.1));
  if (lost > 0) { h.hp -= lost; h.stats.taken += lost; h.flash = 0.12; h.hurtT = 0.25; }
  fx({ type: 'ring', x: h.x, y: h.y - 60, r0: 14, r1: 100, col, dur: 0.4, w: 7 });
  dots(h.x, h.y - 70, col, 14, 190);
  sfx('burst');
  if (h.isPlayer) { shake(7); S.hurtFlash = Math.min(1, S.hurtFlash + 0.6); if (lost) fxText(h.x, h.y - 60, '-' + lost, '#FF6B5E', 26); }
  S.stats.bursts = (S.stats.bursts || 0) + 1;
  if (c.onBurst) c.onBurst(h, c);
  emit({ type: 'curse.burst', player: !!h.isPlayer, ...(c.kind ? { kind: c.kind } : {}) });
}
export function liftCurse(h, by) {
  const c = h.st.curse;
  if (!c) return false;
  if (by && by.kind === 'hero' && by.role !== 'healer') return false;
  h.st.curse = null;
  if (by) {
    by.mana = Math.min(by.maxMana, by.mana + 5);
    fxText(h.x, h.y - 150, c.kind === 'sticky' ? 'Swiped off!' : 'Lifted!', '#F2C230', 24, { dur: 1.1 });
    fx({ type: 'ring', x: h.x, y: h.y - 120, r0: 8, r1: 64, col: '#FFE08A', dur: 0.3, w: 5 });
    dots(h.x, h.y - 120, '#FFE08A', 10, 150);
    sfx('lift');
    S.stats.lifts = (S.stats.lifts || 0) + 1;
    if (c.onLift) c.onLift(h, c, by);
    emit({ type: 'curse.lifted', player: !!by.isPlayer, ...(c.kind ? { kind: c.kind } : {}) });
  }
  return true;
}

/* ---------- cages, chains: the swipe and tap mechanics ---------- */
/* Only the tank is ever caged. Inside, nothing can target him and every mob forgets half of what he did,
   so the boss turns on someone else until he mashes out (or a mate breaks him out) and Slams it back. */
export function makeCage(h, boss) {
  const c = makeMob('rattler', h.x, h.y, null);
  Object.assign(c, { cage: true, hp: 10, maxHp: 10, name: 'Bone cage', r: 30, hero: h, boss, life: 6, state: 'fight', ghostProps: true, born: S.t });
  h.st.caged = c; h.cast = null; h.blocking = false; h.dodgeT = 0; h.dash = null;
  for (const m of S.mobs) {
    if (m.threat.has(h.id)) m.threat.set(h.id, m.threat.get(h.id) * 0.5);
    if (m.forced === h) { m.forced = null; m.forcedT = 0; }
  }
  S.mobs.push(c);
  bits(h.x, h.y - 30, 'shard_bone', 6, 160);
  sfx('cage');
  if (h.isPlayer) call('Tap to break free!', 'alarm', 1.6);
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
    const secs = S.t - (c.born || S.t);
    emit({ type: 'cage.broken', player: !!(by && by.isPlayer), self, secs });
    const h = c.hero;
    const boss = c.boss || S.boss;
    if (secs < 2.0 && boss && boss.alive) {
      exposeMob(boss, 2.5, 'Shattered! Exposed!');
      if (h && h.cd) h.cd.a2 = 0;
    }
    if (h && h.isPlayer && h.alive && S.boss && S.boss.alive && S.boss.target !== h) call('Out! Now Slam him back', 'alarm', 1.6);
  }
}
export function makeChain(boss, h) {
  const ch = { boss, hero: h, t: 0, max: 8, tick: 0.5, id: 'ch' + S.seq++ };
  h.st.chained = ch;
  S.chains.push(ch);
  sfx('chain');
  call(S.player && S.player.role === 'healer' ? 'Swipe the chain!' : 'Chained! Healer, cut it!', 'alarm', 1.6);
  return ch;
}
export function chainEnds(ch) { const b = ch.boss, h = ch.hero; return { ax: b.x + 70, ay: b.y - 120, bx: h.x, by: h.y - 44 }; }
export function chainTick(ch, dt) {
  const h = ch.hero;
  ch.t += dt; ch.tick -= dt;
  if (!h.alive || !ch.boss.alive || ch.t >= ch.max) { cutChain(ch, false); return; }
  if (ch.tick <= 0) { ch.tick = 0.5; hurtHero(h, 24, ch.boss, { magic: true, pierce: true, block: false, dodge: false, numCol: '#C8F5E8', numSize: 15, numDur: 0.6 }); }
}
export function cutChain(ch, byWho) {
  if (ch.dead) return;
  if (byWho && byWho.kind === 'hero' && byWho.role !== 'healer') return;
  ch.dead = true;
  if (ch.hero.st.chained === ch) ch.hero.st.chained = null;
  S.chains = S.chains.filter((c) => c !== ch);
  if (byWho) {
    const e = chainEnds(ch);
    const mx = (e.ax + e.bx) / 2, my = (e.ay + e.by) / 2;
    fxText(mx, my - 20, 'Cut!', '#F2C230', 26);
    dots(mx, my, '#C9D2DC', 10, 200);
    sfx('cut'); S.stats.cuts++;
    if (ch.boss && ch.boss.alive) {
      hurtMob(ch.boss, 160, byWho.kind === 'hero' ? byWho : null, { raw: true, col: '#FFE08A' });
      exposeMob(ch.boss, 3.0, 'Chain Snapped! Exposed!');
    }
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
