/* Barrow Crypt: how Sir Rattlebones and the Gravekeeper fight. Each returns true when it used the frame. */
import { angTo, dist, distXY, lerp } from '../../core/math';
import { pick, rand, rng, vrand } from '../../core/rng';
import { HOOKS, S } from '../../dungeon/state.js';
import { aggro, banner, bits, call, dots, fx, hitstop, hurtHero, sfx, shake } from '../../dungeon/entities.js';
import { makeCage, makeChain, partyPulse, randomHero, spawnMob } from '../../dungeon/mobs.js';
import { moveEnt } from '../../dungeon/world.js';
import { MAP } from './map.js';

/* ---------- Sir Rattlebones ---------- */
export function knightTick(m, dt) {
  const ab = m.ab;
  const intro = S.opts && S.opts.start === 'intro';
  if (!ab.init) { ab.init = true; ab.t = 0; ab.sweep = intro ? 5.2 : 3.5; ab.charge = intro ? 1.8 : 7; }
  ab.t += dt;
  if (!ab.enraged && ab.t > m.M.enrage) { ab.enraged = true; m.dmgMul = 2.5; m.speed *= 1.3; banner('Sir Rattlebones has had enough of you!', 'warn', 2.4); sfx('roar'); }
  if (m.phase === 1 && m.hp < m.maxHp * 0.5) {
    m.phase = 2; m.act = { k: 'rally', t: 0 }; m.wind = 0;
    banner('Phase 2: he calls up his guard. Grab them, then hit him!', 'warn', 2.6); sfx('roar'); shake(6);
    if (intro) HOOKS.hint('slam');
    return true;
  }
  m.armorUp = m.phase === 2 && S.mobs.some((o) => o.alive && o.rally) ? 0.6 : 0;
  if (m.phase === 2) { ab.pulse = (ab.pulse === undefined ? 4 : ab.pulse) - dt; if (ab.pulse <= 0) { ab.pulse = 12; partyPulse(m, 45, 'Bone rattle', '#F0E8D2'); } }
  if (m.act) return knightAct(m, dt);
  if (m.wind > 0) return false;
  ab.sweep -= dt; ab.charge -= dt;
  if (ab.charge <= 0) {
    ab.charge = m.phase === 2 ? 9 : 11;
    const v = (intro && S.player && S.player.alive ? S.player : null) || randomHero(true) || m.target;
    if (v) {
      const a = angTo(m, v), len = dist(m, v) + 150;
      m.act = { k: 'charge', t: 0, phase: 'wind', a, len, hit: new Set(), went: 0 };
      m.face = a; m.flip = Math.cos(a) < 0;
      S.hazards.push({ shape: 'rect', x: m.x, y: m.y, a, len, w: 86, warn: 1.6, t: 0, noDmg: true, src: m });
      call('Charge! Get out of the line', 'alarm', 1.2);
      if (intro && !S.hints.dodge) { S.hints.dodge = 1; HOOKS.hint('dodge'); }
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
    if (intro) { call('BLOCK!', 'alarm', 1.0); if (!S.hints.block) { S.hints.block = 1; HOOKS.hint('block'); } }
    return true;
  }
  return false;
}
function knightAct(m, dt) {
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
  if (!ab.enraged && ab.t > m.M.enrage) { ab.enraged = true; m.dmgMul = 3; banner('He’s done digging. This is the end.', 'warn', 2.6); sfx('roar'); }
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
  // only the tank is ever caged: the boss turns on someone else until he's out and Slams it back
  if (P === 3 && ab.cage <= 0) {
    ab.cage = 18;
    const v = S.heroes.find((h) => h.role === 'tank' && h.alive && !h.st.caged && !h.st.air);
    if (v) { makeCage(v, m); m.act = { k: 'gesture', t: 0, dur: 0.7 }; m.pose = 'smash'; return true; }
  }
  if (P === 2 && ab.wisps <= 0) {
    ab.wisps = 7;
    const targets = S.heroes.filter((h) => h.alive).sort((a, b) => (a.role === 'tank') - (b.role === 'tank'));
    for (let i = 0; i < 3; i++) {
      const w = spawnMob('wisp', m.x + 104 + rand(-20, 20), m.y - 60 + rand(-20, 20), null, false);
      w.state = 'fight'; w.seed = rand(0, 9); w.target = targets[i % targets.length] || null; w.life = 14;
    }
    sfx('wail');
    if (!S.hints.wisp) { S.hints.wisp = 1; HOOKS.hint('wisp'); }
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
    for (const h of S.heroes) if (h.alive) S.hazards.push({ shape: 'circle', kind: 'hand', x: h.x, y: h.y, r: 60, warn: 1.25, t: 0, dmg: 95, root: 1.5, src: m, onFire: (z) => { S.fx.push({ type: 'hand', x: z.x, y: z.y + 4, t: 0, dur: 1.1 }); bits(z.x, z.y, 'shard_dirt', 5, 120); } });
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
function startSmash(m) {
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
        if (h === t && distXY(h.x, h.y, zz.x, zz.y) <= zz.r + h.r) hurtHero(h, 520 * m.dmgMul, m, { heavy: true, block: true, pierce: true, smash: true });
        else if (distXY(h.x, h.y, zz.x, zz.y) <= zz.r + h.r) hurtHero(h, 180 * m.dmgMul, m, { block: false });
      }
    } };
  S.hazards.push(z);
  if (t.isPlayer && t.role === 'tank') { S.timers.push({ t: 0.7, fn: () => { if (m.act && m.act.k === 'smash') call('BLOCK!', 'alarm', 1.0); } }); if (!S.hints.block) { S.hints.block = 1; HOOKS.hint('block'); } }
  sfx('windup');
  return true;
}
function startBurrow(m) {
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
      S.timers.push({ t: 0.75, fn: () => { if (m.alive) S.rings.push({ x: z.x, y: z.y, r: 40, speed: 270, w: 26, max: 620, hit: new Set(), dmg: 90, src: m }); } });
      if (!S.hints.rings) { S.hints.rings = 1; HOOKS.hint('rings'); }
    } });
  return true;
}
function keeperAct(m, dt) {
  const a = m.act; a.t += dt;
  if (a.k === 'leap') {
    const A = MAP.arena;
    if (!a.from) a.from = { x: m.x, y: m.y };
    const k = Math.min(1, Math.max(0, a.t / 1.2));
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
    if (!(m && m.alive && !m.untargetable && !m.hidden && m.rise <= 0) || a.t >= a.dur) { m.act = null; m.pose = null; m.atkT = 1.0; }
    else if (a.tgt && a.tgt.alive) { m.face = angTo(m, a.tgt); m.flip = Math.cos(m.face) < 0; }
    return true;
  }
  if (a.k === 'burrow') { if (a.t >= a.dur) { m.act = null; m.atkT = 1.2; } return true; }
  if (a.k === 'gesture') { if (a.t >= a.dur) { m.act = null; if (m.pose === 'smash') m.pose = null; } return true; }
  m.act = null;
  return false;
}
