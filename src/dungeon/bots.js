import { angDiff, dist, distXY, lerp, norm, TAU } from '../core/math';
import { rand, rng } from '../core/rng';
import { MEND } from '../content/roles';
import { S, emit } from './state.js';
import { fx, killMob } from './entities.js';
import { bestCluster, doDodge, heroBy, isFoe, mend, useAbility } from './heroes.js';
import { chainEnds, cutChain, liftCurse, mashCage } from './mobs.js';
import { canStand, freeSpot, navPoint } from './world.js';

function ringCenter() {
  if (!S.ring) return S.dg.map.arena;
  return {
    x: S.ring.x !== undefined ? S.ring.x : S.dg.map.arena.x,
    y: S.ring.y !== undefined ? S.ring.y : S.dg.map.arena.y,
  };
}

/* ---------- bots: the two seats you are not in (in the real game, your mates) ---------- */
export function inHaz(z, x, y, pad) {
  const ox = z.x, oy = z.y;
  if (z.shape === 'circle') return distXY(x, y, ox, oy) <= z.r + pad;
  if (z.shape === 'cone') {
    const d = distXY(x, y, ox, oy);
    if (d > z.r + pad) return false;
    if (d < pad + 12) return true;
    return Math.abs(angDiff(z.a, Math.atan2(y - oy, x - ox))) <= z.arc / 2 + Math.asin(Math.min(1, pad / Math.max(d, 1)));
  }
  const dx = x - ox, dy = y - oy, ca = Math.cos(z.a), sa = Math.sin(z.a);
  const along = dx * ca + dy * sa, across = -dx * sa + dy * ca;
  return along >= -pad && along <= z.len + pad && Math.abs(across) <= z.w / 2 + pad;
}
export function dangerAt(h, x, y, horizon, forSpot) {
  let best = null;
  for (const z of S.hazards) {
    if (z.src === h || (z.noDmg && !z.arrow && z.shape !== 'rect')) continue;
    if (!forSpot) { if (z.t < h.bot.react) continue; if (h.bot.ignore && h.bot.ignore.has(z)) continue; }
    if (h.role === 'tank' && z.tankBuster && (z.followT === h || z.shape === 'cone')) continue;
    if (z.followT === h && z.followFor && z.t < z.followFor - 0.05 && !forSpot) continue;
    let tti = z.live && z.t >= z.warn ? 0 : z.warn - z.t;
    if (z.arrow) tti += distXY(z.x, z.y, x, y) / z.speed;
    if (tti > horizon || tti < -0.05) continue;
    if (z.live && z.t >= z.warn + z.live - 0.2) continue;
    if (inHaz(z, x, y, h.r + 6)) { if (!best || tti < best.tti) best = { tti, z }; }
  }
  if (S.ring) {
    const rc = ringCenter();
    if (distXY(x, y, rc.x, rc.y) > S.ring.r - h.r - 14) best = { tti: 0, fire: true };
  }
  return best;
}
export function okHere(h) {
  if (dangerAt(h, h.x, h.y, 1.6)) return false;
  const boss = S.boss && S.boss.alive && !S.boss.hidden ? S.boss : null;
  if (boss && inFrontOf(boss, h.x, h.y)) return false;
  if (S.ring) {
    const rc = ringCenter();
    if (distXY(h.x, h.y, rc.x, rc.y) > S.ring.r - h.r - 40) return false;
  }
  if (smashBubble(h.x, h.y, h)) return false;
  if (h.cls === 'rogue') {
    const t = h.picked || h.target;
    if (!t || !t.alive) return false;
    const d = dist(h, t);
    return d <= 90 + t.r && (!boss || !inFrontOf(boss, h.x, h.y));
  }
  if (boss && dist(boss, h) < boss.r + h.r + 110) return false;
  if (h.role === 'dps') {
    const t = h.picked || h.target;
    if (!t || !t.alive) return false;
    const d = dist(h, t);
    return d > 120 + t.r && d < 440;
  }
  if (S.heroes.some((a) => a.alive && a !== h && dist(a, h) > MEND.range - 70)) return false;
  return !S.mobs.some((m) => m.alive && m.state === 'fight' && !m.isBoss && !m.cage && !m.M.wisp && dist(m, h) < 110);
}
export function smashBubble(x, y, who) {
  for (const z of S.hazards) if (z.smash && z.followT && z.followT !== who && distXY(x, y, z.x, z.y) < z.r + 60) return true;
  return false;
}
export function inFrontOf(b, x, y) {
  if (!b || !b.alive || b.hidden) return false;
  const d = distXY(x, y, b.x, b.y);
  if (d > 260) return false;
  return Math.abs(angDiff(b.face, Math.atan2(y - b.y, x - b.x))) < 1.2;
}
export function escapePlan(h, goal) {
  const B = h.bot;
  const danger = dangerAt(h, h.x, h.y, 2.2);
  if (!danger) return null;
  if (!B.ignore) B.ignore = new Set();
  if (danger.z && !B.seen) B.seen = new Set();
  if (danger.z && !B.seen.has(danger.z)) { B.seen.add(danger.z); if (rng() > B.skill) { B.ignore.add(danger.z); return null; } }
  let best = null, bs = 1e9;
  const boss = S.boss && S.boss.alive ? S.boss : null;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + B.side * 0.17;
    for (const r of [45, 90, 140, 195, 255]) {
      const x = h.x + Math.cos(a) * r, y = h.y + Math.sin(a) * r;
      if (!freeSpot(x, y, h.r)) continue;
      if (dangerAt(h, x, y, 3, true)) continue;
      let s = r;
      if (goal) s += distXY(x, y, goal.x, goal.y) * 0.3;
      if (h.role !== 'tank' && inFrontOf(boss, x, y)) s += 140;
      if (h.role !== 'tank' && smashBubble(x, y, h)) s += 300;
      if (s < bs) { bs = s; best = { x, y, r }; }
    }
  }
  if (!best) return null;
  const need = best.r / h.speed;
  if (danger.tti < need + 0.05 && danger.tti < 0.55 && h.cd.dodge <= 0) doDodge(h, best.x - h.x, best.y - h.y);
  return { x: best.x, y: best.y, tol: 8, escape: true };
}

export function leaderHero() {
  const p = S.player;
  if (p.role === 'tank') return p;
  const t = heroBy('tank');
  if (t && t.alive && !t.isPlayer) return t;
  return p;
}
/* how close the party gathers before the leader walks on */
export const KEEP_UP = 340;
/* skip: mates the leader has stopped waiting for (see stuckMates) */
export function partyReady(h, skip) {
  for (const a of S.heroes) {
    if (a === h || (skip && skip.has(a))) continue;
    if (!a.alive) return false;
    if (dist(a, h) > KEEP_UP) return false;
  }
  if (S.healerUp && S.heroes.some((a) => a.alive && a.hp < a.maxHp * 0.8)) return false;
  const hl = heroBy('healer');
  if (hl && hl.alive && hl.mana < 60) return false;
  return true;
}
/* the leader's safety net: a bot mate out of reach who hasn't closed the gap for about four seconds (caught on
   a wall, say) stops holding the party up, and the next pull brings them along. A player is always waited for. */
export const GIVE_UP = 4;
export function stuckMates(h) {
  const B = h.bot;
  if (!B.mates) B.mates = new Map();
  const out = new Set();
  for (const a of S.heroes) {
    if (a === h || !a.alive || !a.botDriven) continue;
    const d = dist(a, h);
    let w = B.mates.get(a);
    // start the clock again when they're in reach, come closer, or the leader hasn't been waiting (a fight)
    if (d <= KEEP_UP || !w || S.t - w.seen > 0.5 || d < w.d - 24) { w = { d, t: S.t, seen: S.t }; B.mates.set(a, w); }
    w.seen = S.t;
    if (S.t - w.t >= GIVE_UP) out.add(a);
  }
  return out;
}
export function nextObjective() {
  for (const p of S.packs) {
    if (p.cleared) continue;
    if (p.def.ambush) { if (!p.triggered) return { x: p.def.goTo.x, y: p.def.goTo.y }; const al = p.mobs.filter((m) => m.alive); if (!al.length) continue; return centroid(al); }
    const al = p.mobs.filter((m) => m.alive);
    if (!al.length) continue;
    const c = centroid(al);
    if (p.def.approach === 'arena') return { x: S.dg.map.arena.x, y: S.dg.map.arena.y + 200 };
    return { x: c.x, y: c.y + 40 };
  }
  if (S.walkout && !S.walkout.done) return null; // everyone stops to watch the lantern
  if (S.chest && !S.chest.open) return { x: S.chest.x, y: S.chest.y + 60 };
  return null;
}
export function centroid(list) { let x = 0, y = 0; list.forEach((m) => { x += m.x; y += m.y; }); return { x: x / list.length, y: y / list.length }; }

export function idleGoal(h) {
  if (S.seal && S.seal.active && !S.seal.done && !S.inCombat) {
    const pad = S.seal.pads.find((p) => p.role === h.role);
    if (pad && distXY(h.x, h.y, pad.x, pad.y) < 440) return { x: pad.x, y: pad.y, tol: 10 };
  }
  const L = leaderHero();
  if (h === L) {
    if (!partyReady(h, stuckMates(h))) { h.bot.waiting = true; return null; }
    h.bot.waiting = false;
    const o = nextObjective();
    return o ? { x: o.x, y: o.y, tol: 18 } : null;
  }
  if (!L || !L.alive) return null;
  const ox = h.role === 'healer' ? -62 : h.role === 'dps' ? 62 : 0;
  const gx = L.x + ox, gy = L.y + 110;
  return { x: freeSpot(gx, gy, h.r) ? gx : L.x, y: freeSpot(gx, gy, h.r) ? gy : L.y + 60, tol: 46 };
}

export const fightingFoes = () => S.mobs.filter((m) => isFoe(m) && m.state === 'fight' && !m.cage && !m.M.wisp);
export const engagedByTank = (m) => m.target && m.target.role === 'tank' && m.fightT > 1.1;

export function tankPick(h) {
  const foes = fightingFoes();
  let best = null, bs = 1e9;
  for (const m of foes) {
    let s = dist(h, m);
    if (m.target && m.target !== h && m.forcedT <= 0) s -= 380;
    if (m.isBoss) s -= 120;
    if (m.M.big) s -= 60;
    if (m.M.ranged || m.type === 'caller') s += 80;
    if (s < bs) { bs = s; best = m; }
  }
  return best;
}
export function standNear(h, t, extra) {
  const a = Math.atan2(h.y - t.y, h.x - t.x);
  const d = t.r + h.r + (extra || 8);
  let x = t.x + Math.cos(a) * d, y = t.y + Math.sin(a) * d;
  if (!canStand(x, y, h.r)) { x = t.x; y = t.y + d; }
  return { x, y, tol: 10 };
}
export function backSpot(h, b, dd, side) {
  const a = b.face + Math.PI + side * 0.8;
  let x = b.x + Math.cos(a) * dd, y = b.y + Math.sin(a) * dd;
  for (let k = 0; k < 10 && !freeSpot(x, y, h.r); k++) { const aa = a + (k + 1) * 0.3 * side; const d2 = dd * (k % 2 ? 0.8 : 1); x = b.x + Math.cos(aa) * d2; y = b.y + Math.sin(aa) * d2; }
  return { x, y };
}
export function ringClamp(p, h) {
  if (!S.ring) return p;
  const rc = ringCenter(), d = distXY(p.x, p.y, rc.x, rc.y), lim = S.ring.r - h.r - 45;
  if (d > lim && d > 0.1) { p.x = rc.x + ((p.x - rc.x) / d) * lim; p.y = rc.y + ((p.y - rc.y) / d) * lim; }
  return p;
}
export function combatGoal(h) {
  const tank = heroBy('tank');
  const boss = S.boss && S.boss.alive && !S.boss.hidden ? S.boss : null;
  if (h.role === 'tank') {
    const t = tankPick(h);
    h.picked = t;
    if (!t) return null;
    return ringClamp(standNear(h, t, 6), h);
  }
  const cage = S.mobs.find((m) => m.alive && m.cage && m.hero !== h);
  if (h.cls === 'rogue') {
    if (cage) return ringClamp(standNear(h, cage, 6), h);
    const foes = fightingFoes();
    if (!foes.length) return idleGoal(h);
    const tankReady = !tank || !tank.alive || foes.some((m) => engagedByTank(m) || (m.isBoss && m.fightT > 0.8));
    if (!tankReady && tank && tank.alive) return ringClamp({ x: tank.x + 42, y: tank.y + 48, tol: 28 }, h);
    const t = (h.picked && isFoe(h.picked) ? h.picked : null) || (tank && tank.alive && tank.target && isFoe(tank.target) ? tank.target : foes[0]);
    if (!t) return idleGoal(h);
    if (t.isBoss) {
      const p = backSpot(h, t, t.r + h.r + 10, -1);
      return ringClamp({ x: p.x, y: p.y, tol: 18 }, h);
    }
    return ringClamp(standNear(h, t, 8), h);
  }
  const want = h.role === 'dps' ? 255 : 225;
  if (boss && boss.state === 'fight') {
    const p = backSpot(h, boss, want, h.role === 'dps' ? -1 : 1);
    if (h.role === 'healer' && tank && tank.alive && distXY(p.x, p.y, tank.x, tank.y) > 470) { p.x = lerp(p.x, tank.x, 0.4); p.y = lerp(p.y, tank.y, 0.4); }
    if (cage && h.role === 'dps' && distXY(p.x, p.y, cage.x, cage.y) > 420) { p.x = lerp(p.x, cage.x, 0.5); p.y = lerp(p.y, cage.y, 0.5); }
    return ringClamp({ x: p.x, y: p.y, tol: 34 }, h);
  }
  const foes = fightingFoes();
  if (!foes.length) return idleGoal(h);
  const anchor = tank && tank.alive ? tank : centroid(foes);
  const c = centroid(foes);
  let v = norm(h.x - c.x, h.y - c.y);
  if (tank && tank.alive) { const tv = norm(tank.x - c.x, tank.y - c.y); v = norm(v.x * 0.5 + tv.x, v.y * 0.5 + tv.y + 0.6); }
  const x = c.x + v.x * want, y = c.y + v.y * want;
  const p = freeSpot(x, y, h.r) ? { x, y } : { x: anchor.x, y: anchor.y + 80 };
  if (h.role === 'healer' && tank && tank.alive && distXY(p.x, p.y, tank.x, tank.y) > 460) { p.x = lerp(p.x, tank.x, 0.5); p.y = lerp(p.y, tank.y, 0.5); }
  return ringClamp({ x: p.x, y: p.y, tol: 36 }, h);
}

export function botMechanics(h) {
  const B = h.bot;
  // Cooperative role responsibility: only the healer can swipe chains and wisps
  if (h.role === 'healer' && !S.opts.noHeal) {
    if (!B.chainAt) B.chainAt = new Map();
    for (const ch of S.chains) {
      if (!B.chainAt.has(ch.id)) B.chainAt.set(ch.id, ch.t + rand(0.9, 1.8) + (ch.hero === h ? 0.25 : 0));
      if (ch.t >= B.chainAt.get(ch.id) && !h.st.caged && !h.st.stun) {
        if (rng() < 0.95) { const e = chainEnds(ch); fx({ type: 'swipe', x: lerp(e.ax, e.bx, 0.4) - 40, y: lerp(e.ay, e.by, 0.4) - 30, x2: lerp(e.ax, e.bx, 0.6) + 40, y2: lerp(e.ay, e.by, 0.6) + 30, col: '#FFE08A', dur: 0.25 }); cutChain(ch, h); }
        else B.chainAt.set(ch.id, ch.t + 1.0);
      }
    }
    if (!B.curseAt) B.curseAt = new Map();
    for (const a of S.heroes) {
      const c = a.st.curse;
      if (!c || !a.alive) continue;
      if (!B.curseAt.has(c.id)) B.curseAt.set(c.id, rng() < 0.95 ? c.t + rand(0.7, 1.4) : Infinity);
      if (c.t >= B.curseAt.get(c.id) && !h.st.caged && !h.st.stun && dist(h, a) <= MEND.range) {
        fx({ type: 'swipe', x: a.x - 34, y: a.y - 140, x2: a.x + 34, y2: a.y - 92, col: '#FFE08A', dur: 0.25 });
        liftCurse(a, h);
      }
    }
    if (!B.wispAt) B.wispAt = new Map();
    for (const m of S.mobs) {
      if (!m.alive || !m.M.wisp) continue;
      if (!B.wispAt.has(m.id)) B.wispAt.set(m.id, S.t + rand(0.8, 1.7));
      if (S.t >= B.wispAt.get(m.id) && !h.st.caged && !h.st.stun) {
        fx({ type: 'swipe', x: m.x - 32, y: m.y - 58, x2: m.x + 32, y2: m.y - 22, col: '#FFE08A', dur: 0.25 });
        killMob(m, h);
        S.stats.slices = (S.stats.slices || 0) + 1;
        emit({ type: 'wisp.sliced', player: !!h.isPlayer });
      }
    }
  }
  if (!B.ringDone) B.ringDone = new Set();
  for (const g of S.rings) {
    if (g.hit.has(h.id) || B.ringDone.has(g)) continue;
    const d = dist(h, g), gap = d - g.r - g.w / 2 - h.r;
    const tti = gap / g.speed;
    if (tti > 0 && tti < 0.1) {
      B.ringDone.add(g);
      if (h.cd.dodge <= 0 && rng() < B.skill) doDodge(h, g.x - h.x, g.y - h.y);
    }
  }
}

export function tankBlockLogic(h) {
  const B = h.bot;
  let soon = null, src = null;
  for (const z of S.hazards) {
    if (z.fired) continue;
    const heavyZ = z.tankBuster;
    if (!heavyZ) continue;
    if (!(z.followT === h || inHaz(z, h.x, h.y, h.r))) continue;
    const tti = z.warn - z.t;
    if (tti >= -0.05 && (soon === null || tti < soon)) { soon = tti; src = z.src; }
  }
  if (soon !== null) {
    if (!B.plan) B.plan = { lead: rand(0.2, 0.72), ok: rng() < 0.93 };
    if (soon <= B.plan.lead && B.plan.ok) { h.intent.block = true; B.blockHold = 0.22; if (src) h.picked = h.picked || (src.kind === 'mob' ? src : null); }
  } else {
    B.plan = null;
    if (B.blockHold > 0) B.blockHold -= 1 / 60; else h.intent.block = false;
  }
}

export function tankActions(h) {
  if (h.blocking) return;
  const foes = fightingFoes();
  const loose = foes.filter((m) => m.target && m.target !== h && m.forcedT <= 0 && !m.cage);
  const near = loose.filter((m) => dist(m, h) <= 240 + m.r);
  const fresh = foes.filter((m) => m.fightT < 1.6 && dist(m, h) <= 240 + m.r);
  const around = foes.filter((m) => !m.cage && dist(m, h) <= 190 + m.r);
  if (h.cd.a3 <= 0 && (near.length >= 1 || fresh.length >= 3 || around.length >= 2 || (S.boss && around.includes(S.boss)))) { useAbility(h, 'a3'); return; }
  if (h.cd.a2 <= 0) {
    const far = loose.find((m) => { const d = dist(m, h); return d > 200 && d < 420; });
    if (far) { useAbility(h, 'a2', far); return; }
  }
  // Cleave whenever something is in reach in front of you
  if (h.cd.a1 <= 0) {
    const t = h.picked && isFoe(h.picked) ? h.picked : h.target;
    if (t && isFoe(t) && !t.cage && dist(h, t) <= 105 + t.r) { useAbility(h, 'a1', t); return; }
  }
}
export function healerActions(h) {
  if (S.opts.noHeal) return;
  if (h.gcd > 0 || h.st.stun > 0 || h.st.caged || h.st.air > 0) return;
  const pct = (a) => (a.hp + a.absorb * 0.6) / a.maxHp;
  const allies = S.heroes.filter((a) => a.alive && dist(a, h) <= MEND.range);
  if (!allies.length) return;
  const low = allies.slice().sort((a, b) => pct(a) - pct(b));
  const tank = heroBy('tank');
  const mana = h.mana;
  if (pct(low[0]) < 0.36) {
    if (h.cd.a2 <= 0 && low[0].absorb <= 0 && mana >= 10 && useAbility(h, 'a2', low[0])) return;
    if (mend(h, low[0])) return;
  }
  const hurt = allies.filter((a) => pct(a) < 0.62).length;
  const bad = allies.some((a) => a.st.root > 0 || a.st.haunt > 0);
  if (h.cd.a3 <= 0 && mana >= 22 && (hurt >= 2 || (bad && hurt >= 1))) { useAbility(h, 'a3'); return; }
  if (tank && tank.alive && h.cd.a2 <= 0 && mana >= 10 && tank.absorb <= 0 && S.hazards.some((z) => z.tankBuster && !z.fired && (z.followT === tank || inHaz(z, tank.x, tank.y, tank.r)))) { useAbility(h, 'a2', tank); return; }
  if (tank && tank.alive && h.cd.a1 <= 0 && mana >= 34 && pct(tank) < 0.86 && dist(tank, h) < 500 && tank.moving <= 0) { useAbility(h, 'a1', { x: tank.x, y: tank.y }); return; }
  if (tank && tank.alive && pct(tank) < 0.76 && mana >= 7 && mend(h, tank)) return;
  if (pct(low[0]) < (mana > 45 ? 0.84 : mana > 20 ? 0.62 : 0.45) && mend(h, low[0])) return;
  // nobody needs anything: Smite the tank's target (it heals and gives mana back)
  if (h.cd.a4 <= 0 && pct(low[0]) > 0.5) { const t = tank_or_target(h); if (t && !t.cage && useAbility(h, 'a4', t)) return; }
}
export function rogueActions(h) {
  const tank = heroBy('tank');
  let tgt = null;
  const cage = S.mobs.find((m) => m.alive && m.cage && m.hero !== h && dist(m, h) < 540);
  if (cage) tgt = cage;
  const foes = fightingFoes();
  if (!tgt) { const caster = foes.find((m) => m.cast && m.cast.kick && dist(m, h) < 340); if (caster) tgt = caster; }
  // what the dungeon marks as first to kill (its signature's targets), then Gravecallers: they curse and
  // raise, and they hang back where the tank can't grab them
  if (!tgt) { const first = foes.find((m) => m.M.priority && dist(m, h) < 540); if (first) tgt = first; }
  if (!tgt) { const caller = foes.find((m) => m.M.kind === 'caller' && dist(m, h) < 540); if (caller) tgt = caller; }
  if (!tgt) {
    const onUs = foes.filter((m) => m.target && m.target.role !== 'tank' && dist(m, h) < 380);
    if (onUs.length) tgt = onUs.sort((a, b) => dist(a, h) - dist(b, h))[0];
  }
  if (!tgt && tank && tank.alive && tank.target && isFoe(tank.target) && (engagedByTank(tank.target) || (tank.target.isBoss && tank.target.fightT > 0.8))) tgt = tank.target;
  if (!tgt && (!tank || !tank.alive)) tgt = foes.sort((a, b) => dist(a, h) - dist(b, h))[0] || null;
  h.picked = tgt;
  h.holdFire = !tgt;
  if (h.st.stun > 0 || h.st.caged || !tgt) return;
  const d = dist(h, tgt);
  const close = foes.filter((m) => !m.cage && dist(m, h) <= 135 + m.r);
  const caster = foes.find((m) => m.cast && m.cast.kick && dist(m, h) <= 135 + m.r);
  if (h.cd.a3 <= 0 && (caster || close.length >= 2)) { useAbility(h, 'a3'); return; }
  if (h.cd.a4 <= 0 && !dangerAt(h, tgt.x, tgt.y, 1.0)) {
    const needGap = d > 95 + tgt.r && d <= 340 + tgt.r;
    const wantSteroid = d <= 95 + tgt.r && !tgt.cage && tgt.bleed && tgt.bleed.left > 0 && h.frenzyT <= 0;
    if (needGap || wantSteroid) { useAbility(h, 'a4', tgt); return; }
  }
  if (d <= 95 + tgt.r) {
    if (!tgt.cage && h.cd.a1 <= 0 && (!tgt.bleed || tgt.bleed.left < 1.8)) { useAbility(h, 'a1', tgt); return; }
    if (h.cd.a2 <= 0 && (tgt.cage || (tgt.bleed && tgt.bleed.left > 0) || tgt.hp < 220)) { useAbility(h, 'a2', tgt); return; }
    if (h.cd.a1 <= 0) { useAbility(h, 'a1', tgt); return; }
  }
}
export function dpsActions(h) {
  if (h.cls === 'rogue') { rogueActions(h); return; }
  const tank = heroBy('tank');
  let tgt = null;
  const cage = S.mobs.find((m) => m.alive && m.cage && m.hero !== h && dist(m, h) < 540);
  if (cage) tgt = cage;
  const foes = fightingFoes();
  if (!tgt) { const caster = foes.find((m) => m.cast && m.cast.kick && dist(m, h) < 520); if (caster) tgt = caster; }
  if (!tgt) { const first = foes.find((m) => m.M.priority && dist(m, h) < 560); if (first) tgt = first; }
  if (!tgt) { const caller = foes.find((m) => m.M.kind === 'caller' && dist(m, h) < 560); if (caller) tgt = caller; }
  if (!tgt) {
    const onUs = foes.filter((m) => m.target && m.target.role !== 'tank' && dist(m, h) < 560);
    if (onUs.length) tgt = onUs.sort((a, b) => dist(a, h) - dist(b, h))[0];
  }
  if (!tgt && tank && tank.alive && tank.target && isFoe(tank.target) && (engagedByTank(tank.target) || tank.target.isBoss && tank.target.fightT > 1.5)) tgt = tank.target;
  if (!tgt && (!tank || !tank.alive)) tgt = foes.sort((a, b) => dist(a, h) - dist(b, h))[0] || null;
  h.picked = tgt;
  h.holdFire = !tgt;
  if (h.cast || h.st.stun > 0 || h.st.caged) return;
  const close = foes.filter((m) => !m.isBoss && dist(m, h) <= 140 + m.r);
  const caster = foes.find((m) => m.cast && m.cast.kick && dist(m, h) <= 150 + m.r);
  if (h.cd.a2 <= 0 && (close.length >= 2 || caster || close.some((m) => m.target === h))) { useAbility(h, 'a2'); return; }
  if (h.cd.a1 <= 0) {
    const c = bestCluster(h, 120, 520);
    if (c && (c.score >= 3 || (c.score >= 2.6 && S.boss)) && (tank && tank.alive ? foes.filter((m) => engagedByTank(m)).length >= 2 || !foes.some((m) => m.fightT < 1.0) : true)) { useAbility(h, 'a1', { x: c.x, y: c.y }); return; }
  }
  if (h.cd.a3 <= 0 && tgt && !tgt.cage && !tgt.M.wisp && h.stillT > 0.2 && (tgt.isBoss || tgt.M.big || tgt.st.freeze > 0.9 || tgt.hp > 300) && !dangerAt(h, h.x, h.y, 1.3)) { useAbility(h, 'a3', tgt); return; }
  // Icicle on cooldown, into something frozen when there is one
  if (h.cd.a4 <= 0) {
    const frozen = foes.filter((m) => m.st.freeze > 0.25 && dist(m, h) < 500).sort((a, b) => b.hp - a.hp)[0];
    const t = frozen || (tgt && !tgt.cage ? tgt : null);
    if (t) useAbility(h, 'a4', t);
  }
}

export function botTick(h, dt) {
  const B = h.bot;
  if (!h.alive) { h.intent.mx = h.intent.my = 0; h.intent.block = false; return; }
  if (h.role === 'tank') tankBlockLogic(h);
  if (h.queued && h.gcd <= 0) { const q = h.queued; h.queued = null; mend(h, q); }
  B.think -= dt;
  if (B.think > 0) return;
  B.think = 0.1;
  // caged: mash your way out, about five taps a second
  if (h.st.caged) { h.intent.mx = h.intent.my = 0; if (rng() < 0.5 * B.skill / 0.93) mashCage(h); return; }
  botMechanics(h);
  if (h.role === 'healer' && S.inCombat) healerActions(h);
  let goal = S.inCombat ? combatGoal(h) : idleGoal(h);
  const esc = escapePlan(h, goal);
  if (!esc && S.inCombat && h.role !== 'tank' && okHere(h)) goal = null;
  const g = esc || goal;
  if (g && !(h.cast && !esc)) {
    const d = distXY(h.x, h.y, g.x, g.y);
    if (d > (g.tol || 24)) {
      const p = navPoint(h, g.x, g.y);
      let v = norm(p.x - h.x, p.y - h.y);
      if (!B.lastPos) B.lastPos = { x: h.x, y: h.y, t: 0 };
      B.lastPos.t += 0.1;
      if (B.lastPos.t >= 0.5) { if (distXY(h.x, h.y, B.lastPos.x, B.lastPos.y) < 6 && h.st.root <= 0 && !h.st.caged) B.unstuck = 0.45; B.lastPos = { x: h.x, y: h.y, t: 0 }; }
      if (B.unstuck > 0) { B.unstuck -= 0.1; const s = B.side; v = norm(v.x * 0.3 - v.y * s, v.y * 0.3 + v.x * s); }
      const slow = !esc && d < 60 ? 0.55 : 1;
      h.intent.mx = v.x * slow; h.intent.my = v.y * slow;
    } else { h.intent.mx = 0; h.intent.my = 0; }
  } else { h.intent.mx = 0; h.intent.my = 0; }
  if (!S.inCombat) { h.picked = null; h.holdFire = false; return; }
  if (h.role === 'tank') tankActions(h);
  else if (h.role === 'dps') dpsActions(h);
  else {
    const t = tank_or_target(h);
    h.picked = t;
  }
}
export function tank_or_target(h) {
  const cage = S.mobs.find((m) => m.alive && m.cage && m.hero !== h && dist(m, h) < 460);
  if (cage && h.mana > 30) return cage;
  const w = S.mobs.find((m) => m.alive && m.M.wisp && m.target && m.target !== h && dist(m, m.target) < 160 && dist(m, h) < 460);
  if (w) return w;
  const tank = heroBy('tank');
  if (tank && tank.alive && tank.target && isFoe(tank.target) && (engagedByTank(tank.target) || tank.target.isBoss)) return tank.target;
  return null;
}
