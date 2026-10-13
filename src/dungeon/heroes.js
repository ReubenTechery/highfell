import { AB, MEND, angDiff, angTo, dist, distXY, norm, rng } from './core.js';
import { S, addThreat, aggro, banner, bits, dots, fx, fxText, healHero, hitstop, hurtMob, say, sfx, shake, taunt } from './entities.js';
import { interruptCast } from './mobs.js';
import { UI } from './ui.js';
import { moveEnt } from './world.js';

/* ---------- heroes: moving, auto attacks, abilities, dodge, block ---------- */
export const heroBy = (role) => S.heroes.find((h) => h.role === role) || null;
export const aliveHeroes = () => S.heroes.filter((h) => h.alive);
export function later(t, fn) { S.timers.push({ t, fn }); }

export function isFoe(m) { return m && m.alive && !m.untargetable && !m.hidden && m.rise <= 0; }
export function engaged(m) { return m.state === 'fight' || m.cage || m.M.wisp; }
export function foesNear(x, y, r, fightOnly) {
  const out = [];
  for (const m of S.mobs) { if (!isFoe(m) || m.cage) continue; if (fightOnly && !engaged(m)) continue; if (distXY(x, y, m.x, m.y) <= r + m.r) out.push(m); }
  return out;
}
export function nearestFoe(h, r, fightOnly) {
  let best = null, bd = r;
  for (const m of S.mobs) { if (!isFoe(m) || m.cage) continue; if (fightOnly && !engaged(m)) continue; const d = dist(h, m) - m.r; if (d < bd) { bd = d; best = m; } }
  return best;
}
export function bestCluster(h, R, range) {
  let best = null, bs = 0;
  const pool = S.mobs.filter((m) => isFoe(m) && !m.cage && engaged(m) && dist(h, m) <= (range || 560));
  for (const c of pool) {
    let n = 0, sx = 0, sy = 0, sc = 0;
    for (const o of pool) if (dist(c, o) <= R * 0.95) { n++; sx += o.x; sy += o.y; sc += o.M.big ? 1.6 : o.M.wisp ? 0.2 : 1; }
    if (sc > bs) { bs = sc; best = { x: sx / n, y: sy / n, n, score: sc }; }
  }
  return best;
}

/* what a hero swings at when nobody told it otherwise */
export function autoTarget(h) {
  const tank = heroBy('tank');
  const ok = (m) => isFoe(m) && (engaged(m) || m === h.picked);
  if (h.picked && (!isFoe(h.picked) || dist(h, h.picked) > 700)) h.picked = null;
  if (h.picked) return h.picked;
  if (ok(h.target) && dist(h, h.target) < 600) return h.target;
  if (h.role === 'tank') {
    const f = nearestFoe(h, 600, true);
    if (f) return f;
    return nearestFoe(h, 120, false);
  }
  if (tank && tank.alive && ok(tank.target) && dist(h, tank.target) < 600) return tank.target;
  return nearestFoe(h, 540, true);
}

export function heroTick(h, dt) {
  for (const k in h.cd) if (h.cd[k] > 0) h.cd[k] = Math.max(0, h.cd[k] - dt);
  h.gcd -= dt; h.iframe -= dt; h.flash -= dt; h.hurtT -= dt; h.lunge -= dt; h.sayT -= dt; h.moving -= dt;
  if (!h.alive) { h.deadT += dt; return; }
  const st = h.st;
  st.stun = Math.max(0, st.stun - dt); st.root = Math.max(0, st.root - dt); st.haunt = Math.max(0, st.haunt - dt); st.air = Math.max(0, st.air - dt);
  if (h.absorbT > 0) { h.absorbT -= dt; if (h.absorbT <= 0) h.absorb = 0; }
  const ooc = !S.inCombat && S.t - S.lastCombat > 2.2;
  if (h.role === 'healer') h.mana = Math.min(h.maxMana, h.mana + dt * (ooc ? 16 : 1.6));
  if (ooc && h.hp < h.maxHp && S.healerUp) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.09 * dt);

  const want = h.role === 'tank' && h.intent.block && !st.stun && !st.caged && h.dodgeT <= 0 && !h.dash && !st.air;
  if (want && !h.blocking) { h.blocking = true; h.blockT = 0; sfx('shieldup'); }
  if (!want) h.blocking = false;
  if (h.blocking) h.blockT += dt;

  if (st.kx || st.ky) { moveEnt(h, st.kx * dt, st.ky * dt); const k = Math.pow(0.015, dt); st.kx *= k; st.ky *= k; if (Math.abs(st.kx) + Math.abs(st.ky) < 8) st.kx = st.ky = 0; }
  if (h.dash) { dashTick(h, dt); return; }
  if (h.dodgeT > 0) { h.dodgeT -= dt; moveEnt(h, h.dodgeX * 490 * dt, h.dodgeY * 490 * dt); h.moving = 0.1; return; }
  if (st.chained) { const b = st.chained.boss; if (dist(h, b) > b.r + h.r + 40) { const a = angTo(h, b); moveEnt(h, Math.cos(a) * 58 * dt, Math.sin(a) * 58 * dt); } }
  if (st.stun > 0 || st.caged || st.air > 0) { h.stillT = 0; return; }

  let mx = h.intent.mx, my = h.intent.my;
  let mag = Math.hypot(mx, my);
  if (st.root > 0) mag = 0;
  if (h.cast && mag > 0.3) { h.cast = null; if (h.isPlayer) fxText(h.x, h.y - 100, 'Cancelled', '#DDF3FF', 16); }
  if (mag > 0.08 && !h.cast) {
    const k = Math.min(1, mag);
    const sp = h.speed * k * (h.blocking ? 0.45 : 1) * (st.haunt > 0 ? 0.6 : 1);
    moveEnt(h, (mx / mag) * sp * dt, (my / mag) * sp * dt);
    h.walkT += dt * 10 * k; h.moving = 0.1; h.stillT = 0;
    if (!h.blocking) h.face = Math.atan2(my, mx);
  } else h.stillT += dt;

  if (h.cast) {
    const c = h.cast;
    c.t += dt;
    if (!isFoe(c.target)) h.cast = null;
    else { h.face = angTo(h, c.target); if (c.t >= c.dur) finishCast(h); }
  }
  heroAuto(h, dt);
  if (h.blocking) { const t = h.target || h.picked || (S.boss && S.boss.alive ? S.boss : null); if (t) h.face = angTo(h, t); }
  const sn = Math.sin(h.face), cs = Math.cos(h.face);
  if (sn < -0.25) h.back = true; else if (sn > 0.25) h.back = false;
  if (cs < -0.3) h.flip = true; else if (cs > 0.3) h.flip = false;
}

export function heroAuto(h, dt) {
  h.atkT -= dt;
  if (h.dodgeT > 0 || h.cast || h.dash) return;
  if (h.holdFire && h.botDriven) { h.target = null; return; }
  const t = autoTarget(h);
  h.target = t;
  if (!t) return;
  const d = dist(h, t);
  if (h.role === 'tank') {
    if (h.blocking) return;
    if (d <= h.r + t.r + 30 && h.atkT <= 0) {
      h.atkT = 1.0; h.face = angTo(h, t); h.lunge = 0.16; h.lungeA = h.face;
      const cleave = h.traits.has('cleave') ? 1 : 0.5;
      hurtMob(t, 34, h, { knock: 70 });
      for (const o of foesNear(h.x, h.y, 80, false)) if (o !== t && Math.abs(angDiff(h.face, angTo(h, o))) < 0.95) hurtMob(o, 34 * cleave, h, { knock: 60, size: 18 });
      fx({ type: 'slash', x: h.x, y: h.y - 30, a: h.face, r: 54, dur: 0.18, col: '#FFFFFF' });
      sfx('swing');
    }
  } else if (h.role === 'healer') {
    if (d <= 440 && h.atkT <= 0 && h.gcd <= 0) { h.atkT = 1.4; h.face = angTo(h, t); h.lunge = 0.1; h.lungeA = h.face; shoot(h, t, 'holy'); }
  } else {
    if (h.stillT >= 0.12 && d <= 480 && h.atkT <= 0) { h.atkT = 0.72; h.face = angTo(h, t); h.lunge = 0.1; h.lungeA = h.face; shoot(h, t, 'frost'); }
  }
}

export function shoot(h, t, kind) {
  const frost = kind === 'frost';
  S.projs.push({ team: 'hero', kind, x: h.x + Math.cos(h.face) * 18, y: h.y + Math.sin(h.face) * 8, z: 52, sp: frost ? 'bolt_frost' : 'orb_holy', src: h, tgt: t, speed: frost ? 780 : 640, life: 2 });
  sfx(frost ? 'bolt' : 'holy', 0.6);
}
export function projHit(p) {
  const h = p.src, t = p.tgt;
  if (p.kind === 'frost') {
    hurtMob(t, 42, h, { col: '#DDF3FF' });
    if (t.alive && !t.isBoss) { t.st.slow = Math.max(t.st.slow, 0.25); t.st.slowT = 2; }
    if (h.traits.has('splinter')) { const o = S.mobs.find((m) => m !== t && isFoe(m) && engaged(m) && !m.cage && dist(m, t) < 220); if (o) hurtMob(o, 21, h, { col: '#DDF3FF', size: 17 }); }
    bits(t.x, t.y - 40, 'shard_ice', 2, 110);
  } else {
    hurtMob(t, 18, h, { col: '#FFE08A', size: 17 });
    if (h.traits.has('lightbolt')) { const low = mostHurt(h, null); if (low) healHero(h, low, 30, { size: 15 }); }
  }
}

export function mostHurt(h, except) {
  let best = null, bv = 2;
  for (const a of S.heroes) { if (!a.alive || a === except) continue; if (h && dist(a, h) > MEND.range) continue; const v = a.hp / a.maxHp - (a.role === 'tank' ? 0.04 : 0); if (v < bv) { bv = v; best = a; } }
  return best;
}

/* ---------- abilities ---------- */
export function useAbility(h, slot, aim) {
  const def = AB[h.role][slot];
  if (!h.alive || S.over || def.hold) return false;
  if (h.st.stun > 0 || h.st.caged || h.st.air > 0 || h.dodgeT > 0 || h.dash) return false;
  if (h.cd[slot] > 0) { if (h.isPlayer) UI.nope(slot); return false; }
  if (def.mana && h.mana < def.mana) { if (h.isPlayer) { UI.nope(slot); banner('Not enough mana', 'warn', 0.9); } return false; }
  if (h.cast) return false;
  let ok = false;
  switch (def.key) {
    case 'taunt': ok = abTaunt(h); break;
    case 'charge': ok = abCharge(h, aim); break;
    case 'circle': ok = abCircle(h, aim); break;
    case 'ward': ok = abWard(h, aim); break;
    case 'sunburst': ok = abSunburst(h); break;
    case 'blizzard': ok = abBlizzard(h, aim); break;
    case 'nova': ok = abNova(h); break;
    case 'comet': ok = abComet(h, aim); return ok;
  }
  if (ok) {
    h.cd[slot] = def.cd - (def.key === 'sunburst' && h.traits.has('dawn') ? 6 : 0);
    if (def.mana) h.mana -= def.mana;
    if (h.isPlayer) UI.fired(slot);
  } else if (h.isPlayer) UI.nope(slot);
  return ok;
}

export function abTaunt(h) {
  let n = 0;
  for (const m of S.mobs) if (isFoe(m) && !m.cage && !m.M.wisp && dist(m, h) <= 250 + m.r && Math.abs(m.y - h.y) < 600) { taunt(m, h, 4); n++; }
  say(h, n ? (rng() < 0.5 ? 'Oi!' : 'Over here!') : 'Oi?', 0.9);
  fx({ type: 'ring', x: h.x, y: h.y - 20, r0: 24, r1: 250, col: '#F2C230', dur: 0.4, w: 7 });
  if (h.traits.has('boneward')) { h.absorb = Math.max(h.absorb, 200); h.absorbT = 6; }
  sfx('taunt');
  return true;
}
export function abCharge(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : null;
  if (!t) {
    let bd = 1e9;
    for (const m of S.mobs) {
      if (!isFoe(m) || m.cage || !engaged(m) || m.M.wisp) continue;
      const d = dist(h, m); if (d > 420) continue;
      const score = d - (m.target && m.target !== h ? 300 : 0);
      if (score < bd) { bd = score; t = m; }
    }
  }
  if (!t && h.target && isFoe(h.target) && dist(h, h.target) < 420) t = h.target;
  if (t) h.dash = { mob: t, t: 0.55 };
  else h.dash = { tx: h.x + Math.cos(h.face) * 200, ty: h.y + Math.sin(h.face) * 200, t: 0.3 };
  h.blocking = false;
  sfx('charge');
  return true;
}
export function dashTick(h, dt) {
  const d = h.dash;
  d.t -= dt;
  let tx, ty;
  if (d.mob) { if (!isFoe(d.mob)) { h.dash = null; return; } tx = d.mob.x; ty = d.mob.y; } else { tx = d.tx; ty = d.ty; }
  const dx = tx - h.x, dy = ty - h.y, dd = Math.hypot(dx, dy);
  const stop = d.mob ? h.r + d.mob.r + 4 : 4;
  h.face = Math.atan2(dy, dx); h.moving = 0.1; h.walkT += dt * 22;
  if (S.frame % 3 === 0) dots(h.x, h.y, '#C9B79A', 1, 40, { size: 5, dur: 0.4 });
  if (dd <= stop || d.t <= 0) { chargeImpact(h, d); h.dash = null; return; }
  const step = Math.min(980 * dt, dd - stop);
  if (!moveEnt(h, (dx / dd) * step, (dy / dd) * step)) { chargeImpact(h, d); h.dash = null; }
}
export function chargeImpact(h, d) {
  const ring = h.traits.has('ringing');
  const hits = foesNear(h.x, h.y, 86, false).filter((m) => !m.cage);
  for (const m of hits) {
    aggro(m, h, 0);
    hurtMob(m, 45, h, { knock: 140 });
    if (ring) { hurtMob(m, 45, h, { knock: 60 }); taunt(m, h, 2.5); }
    addThreat(m, h, 260);
    if (!m.isBoss) { m.st.stun = Math.max(m.st.stun, 1.0); m.wind = 0; if (m.cast) interruptCast(m); }
  }
  if (d.mob) h.picked = d.mob.alive ? d.mob : null;
  fx({ type: 'ring', x: h.x, y: h.y, r0: 20, r1: 96, col: '#C9B79A', dur: 0.3, w: 8, ground: true });
  dots(h.x, h.y, '#C9B79A', 8, 160);
  if (hits.length) { shake(4); sfx('thud'); }
}

export function clampRange(h, x, y, r) { const d = distXY(h.x, h.y, x, y); if (d <= r) return { x, y }; return { x: h.x + ((x - h.x) / d) * r, y: h.y + ((y - h.y) / d) * r }; }
export function abCircle(h, aim) {
  let p;
  if (aim && aim.x !== undefined && !aim.kind) p = clampRange(h, aim.x, aim.y, 520);
  else { const t = heroBy('tank'); p = t && t.alive && dist(t, h) < 520 ? { x: t.x, y: t.y } : { x: h.x, y: h.y }; }
  const r = 110 * (h.traits.has('widecircle') ? 1.4 : 1);
  S.zones.push({ kind: 'heal', x: p.x, y: p.y, r, t: 0, dur: 6, tick: 0.5, tickT: 0.2, src: h });
  sfx('circle');
  return true;
}
export function abWard(h, aim) {
  let t = aim && aim.kind === 'hero' && aim.alive ? aim : null;
  if (!t) {
    const tank = heroBy('tank');
    const low = mostHurt(h, null);
    t = low && low.hp / low.maxHp < 0.7 ? low : tank && tank.alive && dist(tank, h) < MEND.range ? tank : low;
  }
  if (!t || dist(t, h) > MEND.range + 40) return false;
  t.absorb = Math.round(220 * h.power); t.absorbT = 8;
  fx({ type: 'ring', x: t.x, y: t.y - 40, r0: 10, r1: 52, col: '#DDF3FF', dur: 0.3, w: 5 });
  fxText(t.x, t.y - 96, 'Ward', '#DDF3FF', 18);
  fx({ type: 'beam', x: h.x, y: h.y - 50, x2: t.x, y2: t.y - 40, col: '#DDF3FF', dur: 0.25 });
  sfx('ward');
  return true;
}
export function abSunburst(h) {
  for (const a of S.heroes) {
    if (!a.alive || dist(a, h) > 470) continue;
    healHero(h, a, 200, { show: true });
    a.st.root = 0; a.st.haunt = 0;
  }
  fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 30, r1: 470, col: '#F2C230', dur: 0.5, w: 9 });
  dots(h.x, h.y - 60, '#FFE08A', 16, 220);
  sfx('sunburst');
  return true;
}
export function mend(h, t) {
  if (!h || !h.alive || h.role !== 'healer' || S.over) return false;
  if (h.st.stun > 0 || h.st.caged || h.st.air > 0) return false;
  if (!t || !t.alive) return false;
  if (h.gcd > 0 || h.dodgeT > 0) { h.queued = t; return false; }
  if (h.mana < MEND.mana) { if (h.isPlayer) banner('Out of mana. Let it come back.', 'warn', 1.0); return false; }
  if (dist(h, t) > MEND.range) { if (h.isPlayer) fxText(h.x, h.y - 100, 'Too far', '#FFE08A', 18); return false; }
  h.mana -= MEND.mana; h.gcd = h.traits.has('quickhands') ? 0.3 : MEND.gcd;
  healHero(h, t, MEND.heal);
  if (h.traits.has('sunflare')) { const o = mostHurt(h, t); if (o && o.hp < o.maxHp) healHero(h, o, 70, { size: 16 }); }
  fx({ type: 'beam', x: h.x, y: h.y - 56, x2: t.x, y2: t.y - 40, col: '#FFE08A', dur: 0.22 });
  dots(t.x, t.y - 50, '#7BE05A', 5, 90, { up: true });
  if (t !== h) { h.face = angTo(h, t); }
  h.lunge = 0.1; h.lungeA = h.face;
  sfx('heal');
  if (h.isPlayer) UI.pulseFrame(t.role);
  return true;
}
export function abBlizzard(h, aim) {
  let p = null;
  if (aim && aim.x !== undefined && !aim.kind) p = clampRange(h, aim.x, aim.y, 520);
  else { const c = bestCluster(h, 120, 560); if (c) p = { x: c.x, y: c.y }; else { const t = autoTarget(h); if (t) p = { x: t.x, y: t.y }; } }
  if (!p) { if (h.isPlayer) fxText(h.x, h.y - 100, 'Nothing to freeze', '#DDF3FF', 16); return false; }
  p = clampRange(h, p.x, p.y, 520);
  S.zones.push({ kind: 'blizzard', x: p.x, y: p.y, r: 120 * (h.traits.has('glacier') ? 1.5 : 1), t: 0, dur: 5, tick: 0.5, tickT: 0.15, src: h, seed: Math.random() * 100 });
  h.face = Math.atan2(p.y - h.y, p.x - h.x); h.lunge = 0.14; h.lungeA = h.face;
  sfx('blizzard');
  return true;
}
export function abNova(h) {
  const R = 155;
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || dist(m, h) > R + m.r) continue;
    aggro(m, h, 0);
    hurtMob(m, 50, h, { col: '#DDF3FF' });
    if (!m.alive) continue;
    if (m.isBoss) { m.st.slow = 0.4; m.st.slowT = 3; }
    else if (!m.M.wisp) { m.st.freeze = h.traits.has('deepfreeze') ? 5 : 3; m.wind = 0; if (m.cast) interruptCast(m); }
  }
  fx({ type: 'nova', x: h.x, y: h.y, r: R, dur: 0.45 });
  bits(h.x, h.y - 20, 'shard_ice', 12, 300);
  sfx('nova'); shake(3);
  return true;
}
export function abComet(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : null;
  if (!t) t = autoTarget(h);
  if (!t || dist(h, t) > 540) { if (h.isPlayer) { fxText(h.x, h.y - 100, 'No target', '#DDF3FF', 16); UI.nope('a3'); } return false; }
  h.cast = { key: 'comet', t: 0, dur: AB.dps.a3.cast * (h.traits.has('icyveins') ? 0.5 : 1), target: t };
  sfx('castup');
  return true;
}
export function finishCast(h) {
  const c = h.cast; h.cast = null;
  if (c.key !== 'comet') return;
  h.cd.a3 = AB.dps.a3.cd;
  if (h.isPlayer) UI.fired('a3');
  const t = c.target;
  const tx = t.x, ty = t.y;
  fx({ type: 'comet', x: tx, y: ty, dur: 0.32 });
  sfx('whoosh');
  later(0.32, () => {
    const frozen = t.alive && t.st.freeze > 0;
    if (t.alive) hurtMob(t, 320, h, { shatter: h.traits.has('shatterlance') ? 3 : 2, crit: 0.15, col: frozen ? '#8FD6FF' : '#DDF3FF' });
    if (frozen) fxText(tx, ty - 150, 'Shatter!', '#8FD6FF', 32, { dur: 1.2 });
    for (const o of foesNear(tx, ty, 90, false)) if (o !== t && !o.cage) hurtMob(o, 110, h, { size: 19 });
    fx({ type: 'ring', x: tx, y: ty, r0: 20, r1: 110, col: '#DDF3FF', dur: 0.3, w: 8, ground: true });
    bits(tx, ty - 20, 'shard_ice', 14, 320);
    shake(frozen ? 7 : 4); sfx('comet');
    if (frozen && h.isPlayer) hitstop(0.08);
  });
}

export function doDodge(h, dx, dy) {
  if (!h.alive || S.over || h.cd.dodge > 0 || h.st.stun > 0 || h.st.caged || h.st.root > 0 || h.st.air > 0 || h.dash) return false;
  let v = norm(dx, dy);
  if (!dx && !dy) v = { x: Math.cos(h.face), y: Math.sin(h.face) };
  h.dodgeT = 0.3; h.iframe = 0.38; h.dodgeX = v.x; h.dodgeY = v.y; h.cd.dodge = 1.6; h.cast = null; h.blocking = false;
  if (Math.abs(v.x) > 0.2) h.flip = v.x < 0;
  if (h.traits.has('coldsnap')) S.zones.push({ kind: 'ice', x: h.x, y: h.y, r: 70, t: 0, dur: 3, tick: 0.25, tickT: 0, src: h, hit: new Set() });
  dots(h.x, h.y, '#C9B79A', 6, 90, { size: 6 });
  sfx('dodge');
  return true;
}
