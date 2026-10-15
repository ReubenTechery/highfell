/* Dungeon Template: Boss AI ticks for Mini-Boss (2 phases) and Final Boss (3 phases).
   Demonstrates the core Highfell boss building blocks:
   - Avoidable telegraphs (`hazard: true`, cone/line/circle)
   - Perfect-Block & Wall-Crash `exposeMob(m, seconds, reason)` (+35% damage taken windows)
   - Phase 3 boss-anchored safe ring (`S.ring` + `followBoss: true`) and periodic arena Strides */
import { TAU, angDiff, angTo, clamp, dist, distXY } from '../../core/math';
import { pick } from '../../core/rng';
import { S } from '../../dungeon/state.js';
import { banner, call, dots, exposeMob, fx, hurtHero, sfx, shake } from '../../dungeon/entities.js';
import { randomHero } from '../../dungeon/mobs.js';
import { canStand, moveEnt, walkTo } from '../../dungeon/world.js';
import { MAP } from './map.js';

/* ---------- Boss 1: Mini-Boss Warden (2 Phases: Cleaving Sweep + Bull Rush) ---------- */
export function wardenTick(m, dt) {
  if (m.phase === 1 && m.hp / m.maxHp <= 0.5) {
    m.phase = 2;
    banner(`${m.name} enters Phase 2!`, 'warn', 2.2);
    sfx('roar');
  }
  if (m.act) {
    const a = m.act; a.t += dt;
    if (a.k === 'sweep') {
      if (a.t >= a.dur) {
        m.act = null;
        for (const h of S.heroes) {
          if (!h.alive) continue;
          if (dist(m, h) <= 170 && Math.abs(angDiff(a.ang, angTo(m, h))) <= 0.95) {
            const res = hurtHero(h, 340 * m.dmgMul, m, { heavy: true, block: true, perfectable: true, hazard: true });
            if (res === 'perfect') exposeMob(m, 3.0, 'Perfect Block');
          }
        }
        fx({ type: 'cone', x: m.x, y: m.y, a: a.ang, span: 1.9, r: 170, col: '#F2C230', dur: 0.25 });
        sfx('smash'); shake(6);
      }
      return true;
    }
    if (a.k === 'charge') {
      if (!a.go && a.t >= a.warn) { a.go = true; sfx('charge'); }
      if (a.go) {
        const step = 760 * dt;
        const nx = m.x + Math.cos(a.ang) * step, ny = m.y + Math.sin(a.ang) * step;
        if (!canStand(nx, ny, m.r)) {
          m.act = null;
          exposeMob(m, 3.5, 'Wall Crash');
          shake(8); sfx('smash');
          return true;
        }
        moveEnt(m, Math.cos(a.ang) * step, Math.sin(a.ang) * step);
        for (const h of S.heroes) {
          if (h.alive && !a.hit.has(h) && dist(m, h) <= m.r + h.r + 18) {
            a.hit.add(h);
            hurtHero(h, 330 * m.dmgMul, m, { heavy: true, block: true, hazard: true });
          }
        }
      }
      if (a.t >= a.warn + 0.55) m.act = null;
      return true;
    }
  }
  m.cd.sweep = (m.cd.sweep ?? 4.5) - dt;
  m.cd.charge = (m.cd.charge ?? 8.5) - dt;
  if (m.cd.sweep <= 0 && m.target && dist(m, m.target) <= 165) {
    m.cd.sweep = 7.5;
    const ang = angTo(m, m.target);
    m.act = { k: 'sweep', t: 0, dur: 1.05, ang };
    S.hazards.push({ kind: 'cone', x: m.x, y: m.y, a: ang, span: 1.9, r: 170, t: 0, dur: 1.05, blockable: true, src: m });
    return true;
  }
  if (m.cd.charge <= 0) {
    m.cd.charge = 10.5;
    const tgt = randomHero(true) || m.target;
    if (tgt) {
      const ang = angTo(m, tgt);
      m.act = { k: 'charge', t: 0, warn: 1.0, ang, hit: new Set() };
      S.hazards.push({ kind: 'line', x: m.x, y: m.y, a: ang, len: 420, w: 76, t: 0, dur: 1.0, src: m });
      call(`${m.name} charges—dodge out of the lane!`, 'warn', 1.5);
      return true;
    }
  }
  return false;
}

/* ---------- Boss 2: Final Boss Sovereign (3 Phases + Phase 3 Moving Safe-Zone Ring) ---------- */
const STRIDE_PTS = [[330, 440], [670, 440], [500, 790], [340, 740], [660, 740]];

export function sovereignTick(m, dt) {
  const hpPct = m.hp / m.maxHp;
  if (m.phase === 1 && hpPct <= 0.68) {
    m.phase = 2;
    banner(`${m.name} unleashes Phase 2!`, 'warn', 2.4);
    sfx('roar');
  } else if (m.phase < 3 && hpPct <= 0.35) {
    m.phase = 3;
    S.darkTarget = 0.65;
    S.ring = { x: m.x, y: m.y, r: MAP.arena.r, target: 265, followBoss: true };
    banner(`Phase 3: Stay inside ${m.name}'s lantern ring!`, 'alarm', 2.8);
    sfx('roar');
  }
  if (S.ring && S.ring.followBoss) {
    S.ring.x = m.x; S.ring.y = m.y;
    S.ring.r = Math.max(S.ring.target, S.ring.r - 28 * dt);
    for (const h of S.heroes) if (h.alive && dist(h, S.ring) <= S.ring.r - 8) h.st.zeal = 0.25;
  }
  if (m.act) {
    const a = m.act; a.t += dt;
    if (a.k === 'smash') {
      if (a.t >= a.dur) {
        m.act = null; m.pose = null;
        if (m.target && m.target.alive && dist(m, m.target) <= 165) {
          if (S.bossFight) S.bossFight.smashes++;
          const res = hurtHero(m.target, 390 * m.dmgMul, m, { heavy: true, block: true, perfectable: true, hazard: true });
          if (res === 'perfect') {
            if (S.bossFight) S.bossFight.smashPerfect++;
            exposeMob(m, 3.5, 'Perfect Block');
          }
        }
        dots(m.x, m.y, '#F2C230', 14, 180);
        sfx('smash'); shake(7);
      }
      return true;
    }
    if (a.k === 'stride') {
      walkTo(m, a.tx, a.ty, m.speed * 1.65, dt, 10);
      if (a.t >= a.dur || distXY(m.x, m.y, a.tx, a.ty) <= 18) m.act = null;
      return true;
    }
  }
  m.cd.smash = (m.cd.smash ?? 5.0) - dt;
  m.cd.aoe = (m.cd.aoe ?? 7.0) - dt;
  m.cd.stride = (m.cd.stride ?? 8.5) - dt;

  if (m.phase === 3 && m.cd.stride <= 0) {
    m.cd.stride = 8.5;
    const [tx, ty] = pick(STRIDE_PTS.filter(([x, y]) => distXY(m.x, m.y, x, y) > 160)) || [500, 640];
    m.act = { k: 'stride', tx: clamp(tx, 200, 800), ty: clamp(ty, 300, 960), t: 0, dur: 2.6 };
    call(`${m.name} strides across the arena—move with the ring!`, 'warn', 1.8);
    return true;
  }
  if (m.cd.smash <= 0 && m.target && dist(m, m.target) <= 130) {
    m.cd.smash = 8.0;
    m.pose = 'smash';
    m.act = { k: 'smash', t: 0, dur: 1.1 };
    S.hazards.push({ kind: 'circle', x: m.target.x, y: m.target.y, r: 95, t: 0, dur: 1.1, blockable: true, src: m });
    call('Heavy Smash—Hold Shield to Perfect Block!', 'warn', 1.4);
    return true;
  }
  if (m.cd.aoe <= 0) {
    m.cd.aoe = 6.5;
    const tgt = randomHero(true) || m.target;
    if (tgt) {
      const tx = tgt.x, ty = tgt.y;
      S.hazards.push({
        kind: 'circle', x: tx, y: ty, r: 105, t: 0, dur: 1.25, src: m,
        onPop() {
          for (const h of S.heroes) if (h.alive && distXY(h.x, h.y, tx, ty) <= 105 + h.r) hurtHero(h, 270 * m.dmgMul, m, { hazard: true });
          dots(tx, ty, '#7CF06A', 12, 140); sfx('thud');
        },
      });
    }
  }
  return false;
}
