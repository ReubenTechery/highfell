/* ---------- heroes: moving, auto attacks, abilities, dodge, block ---------- */
import { angDiff, angTo, dist, distXY, norm } from '../core/math';
import { rng } from '../core/rng';
import { AB, MEND, abKey } from '../content/roles';
import { HOOKS, S, emit } from './state.js';
import { CHILL, SHATTERLANCE_CHILL, STAGGER, addThreat, aggro, banner, bits, brewFx, chillBoss, dots, fx, fxText, healHero, hitstop, hurtMob, say, sfx, shake, shatterable, staggerBoss, stunned, taunt } from './entities.js';
import { interruptCast, liftCurse } from './mobs.js';
import { canStand, moveEnt } from './world.js';
import { ambushGadgets, blockGadgets, chargeGadgets, cleaveGadgets, cometGadgets, critSpark, gearMul, icicleGadgets, mendGadgets, stepGadgets, sunburstGadgets, viperGadgets, wardGadgets } from './gadgets.js';

export const heroBy = (role) => S.heroes.find((h) => h.role === role) || null;
export const aliveHeroes = () => S.heroes.filter((h) => h.alive);
export function later(t, fn) { S.timers.push({ t, fn }); }

export function spawnThrall(h, kind, x, y, dur) {
  if (!S.thralls) S.thralls = [];
  const cap = kind === 'frost' ? 3 : 2;
  const same = S.thralls.filter((tr) => tr.alive && tr.owner === h && tr.kind === kind);
  if (same.length >= cap) same[0].alive = false;
  const sp = kind === 'shade' ? h.sprite : 'rattler';
  const tr = {
    id: 'tr' + S.seq++,
    kind,
    owner: h,
    sp,
    x: canStand(x, y, 15) ? x : h.x,
    y: canStand(x, y, 15) ? y : h.y,
    r: 15,
    life: dur,
    maxLife: dur,
    atkT: 0.2,
    face: h.face || 0,
    flip: !!h.flip,
    walkT: 0,
    moving: 0,
    lunge: 0,
    lungeA: 0,
    rise: kind === 'shade' ? 0 : 0.3,
    alive: true,
  };
  S.thralls.push(tr);
  bits(tr.x, tr.y - 24, kind === 'shade' ? 'shard_glass' : kind === 'frost' ? 'shard_ice' : 'shard_bone', 5, 140);
  return tr;
}

export function isFoe(m) { return m && m.alive && !m.untargetable && !m.hidden && m.rise <= 0; }
export function engaged(m) { return m.state === 'fight' || m.cage || m.M.wisp; }
export function foesNear(x, y, r, fightOnly) {
  const out = [];
  // the party's brew can make area hits reach wider (Glowcap Draught, Starlight Elixir)
  r *= S.brewArea || 1;
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

/* how near a red bomb has to be for a hero's own swings and shots to go for it (bombs.js) */
const BOMB_REACH = { tank: 64, rogue: 64, healer: 240, dps: 240 };
function bombInReach(h) {
  const reach = BOMB_REACH[h.cls === 'rogue' ? 'rogue' : h.role];
  let best = null, bd = 1e9;
  for (const m of S.mobs) {
    if (!m.M.bomb || m.gold || !isFoe(m)) continue;
    const d = dist(h, m) - m.r;
    if (d <= reach && d < bd) { bd = d; best = m; }
  }
  return best;
}

/* what a hero swings at when nobody told it otherwise (a red bomb in reach comes first: hit it back) */
export function autoTarget(h, noBomb) {
  const bomb = noBomb ? null : bombInReach(h);
  if (bomb) return bomb;
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
  const st = h.st;
  // Bramble Fizz and Lantern Zeal: every cooldown, the dodge's too, comes back sooner
  const cdRate = (st && st.zeal > 0 ? 1.15 : 1) * (brewFx(h.brew).cd || 1);
  for (const k in h.cd) if (h.cd[k] > 0) h.cd[k] = Math.max(0, h.cd[k] - dt * cdRate);
  h.gcd -= dt; h.iframe -= dt; h.flash -= dt; h.hurtT -= dt; h.lunge -= dt; h.sayT -= dt; h.moving -= dt;
  if (h.frenzyT > 0) h.frenzyT = Math.max(0, h.frenzyT - dt);
  if (h.nightstalkerT > 0) h.nightstalkerT = Math.max(0, h.nightstalkerT - dt);
  if (h.swingT > 0) h.swingT = Math.max(0, h.swingT - dt);
  if (h.whirlT > 0) h.whirlT = Math.max(0, h.whirlT - dt);
  if (!h.alive) { h.deadT += dt; return; }
  st.stun = Math.max(0, st.stun - dt); st.root = Math.max(0, st.root - dt); st.haunt = Math.max(0, st.haunt - dt); st.air = Math.max(0, st.air - dt);
  st.ghost = Math.max(0, (st.ghost || 0) - dt); st.surge = Math.max(0, (st.surge || 0) - dt); st.zeal = Math.max(0, (st.zeal || 0) - dt);
  if (h.absorbT > 0) { h.absorbT -= dt; if (h.absorbT <= 0) h.absorb = 0; }
  if (h.hots.length) tickHots(h, dt);
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
    const sp = h.speed * k * (h.blocking ? 0.45 : 1) * (st.haunt > 0 ? 0.6 : 1) * (st.surge > 0 ? 1.25 : 1);
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

/* heals over time (Candlewake's candles) */
function tickHots(h, dt) {
  for (let i = h.hots.length - 1; i >= 0; i--) {
    const o = h.hots[i];
    o.left -= dt; o.next -= dt;
    if (o.next <= 0) { o.next += 1; healHero(o.src, h, o.per, { size: 14, raw: true }); }
    if (o.left <= 0) h.hots.splice(i, 1);
  }
}

export function applyBleed(h, m, durOverride) {
  if (!m || !m.alive || m.cage || m.M.wisp || m.M.thing) return;
  const chestMul = (h.bonuses && h.bonuses.has('sv_chest') ? 1.3 : 1) * gearMul(h, 'venom');
  const per = Math.round(30 * chestMul);
  const fullDur = 5.5 + (h.bonuses && h.bonuses.has('sv_chest') ? 1.0 : 0);
  const dur = durOverride ? Math.max(m.bleed ? m.bleed.left : 0, durOverride) : fullDur;
  m.bleed = { src: h, per, left: dur, next: m.bleed && m.bleed.left > 0 ? m.bleed.next : 0.5 };
}

function heroAuto(h, dt) {
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
      const wide = h.traits.has('wide') ? 1 : 0.5;
      hurtMob(t, 45, h, { knock: 70 });
      for (const o of foesNear(h.x, h.y, 80, false)) if (o !== t && Math.abs(angDiff(h.face, angTo(h, o))) < 0.95) hurtMob(o, 45 * wide, h, { knock: 60, size: 18 });
      fx({ type: 'slash', x: h.x, y: h.y - 30, a: h.face, r: 54, dur: 0.18, col: '#FFFFFF' });
      sfx('swing');
      if (h.unique === 'gravedigger' && ++h.swings % 5 === 0) gravedig(h);
    }
  } else if (h.role === 'healer') {
    if (d <= 440 && h.atkT <= 0 && h.gcd <= 0) { h.atkT = 1.4; h.face = angTo(h, t); h.lunge = 0.1; h.lungeA = h.face; shoot(h, t, 'holy'); }
  } else if (h.cls === 'rogue') {
    if (d <= h.r + t.r + 34 && h.atkT <= 0) {
      h.atkT = h.frenzyT > 0 ? 0.37 : 0.5;
      h.face = angTo(h, t); h.lunge = 0.13; h.lungeA = h.face;
      h.swings = (h.swings || 0) + 1;
      const bleedHit = t.bleed && t.bleed.left > 0 ? 33 : 27;
      hurtMob(t, bleedHit, h, { crit: 0.2, col: '#D7DEE6' });
      if (t.alive && h.traits.has('twinvenom') && t.bleed && t.bleed.left > 0) t.bleed.left = Math.min(7.5, t.bleed.left + 1.5);
      if (h.unique === 'cryptfangs' && h.swings % 4 === 0 && t.alive) {
        hurtMob(t, 32, h, { crit: 0.25, col: '#7CF06A', size: 19 });
        if (t.alive) applyBleed(h, t);
      }
      fx({ type: 'slash', x: h.x, y: h.y - 30, a: h.face + (h.swings % 2 ? 0.28 : -0.28), r: 46, dur: 0.14, col: '#7CF06A' });
      sfx('swing', 0.65);
    }
  } else {
    if (h.stillT >= 0.12 && d <= 480 && h.atkT <= 0) { h.atkT = 0.72; h.face = angTo(h, t); h.lunge = 0.1; h.lungeA = h.face; shoot(h, t, 'frost'); }
  }
}
/* The Gravedigger: every fifth swing digs in */
function gravedig(h) {
  for (const m of foesNear(h.x, h.y, 120, false)) { if (m.cage) continue; hurtMob(m, 30, h, { size: 17 }); if (m.isBoss) staggerBoss(m, STAGGER); else { m.st.stun = Math.max(m.st.stun, 1); m.wind = 0; } }
  fx({ type: 'ring', x: h.x, y: h.y, r0: 20, r1: 130, col: '#C9B79A', dur: 0.3, w: 8, ground: true });
  bits(h.x, h.y, 'shard_dirt', 8, 220); sfx('thud'); shake(3);
}

function shoot(h, t, kind) {
  const frost = kind === 'frost';
  S.projs.push({ team: 'hero', kind, x: h.x + Math.cos(h.face) * 18, y: h.y + Math.sin(h.face) * 8, z: 52, sp: frost ? 'bolt_frost' : 'orb_holy', src: h, tgt: t, speed: frost ? 780 : 640, life: 2 });
  sfx(frost ? 'bolt' : 'holy', 0.6);
}
export function abCd(h, slot) {
  const def = AB[abKey(h)][slot];
  return def && def.cd ? def.cd : 0;
}
export function abMana(h, slot) {
  const def = AB[abKey(h)][slot];
  if (!def || !def.mana) return 0;
  let m = def.mana;
  if (def.key === 'circle' && h.bonuses && h.bonuses.has('cw_chest')) m -= 3;
  return Math.max(0, m);
}

export function projHit(p) {
  const h = p.src, t = p.tgt;
  if (p.kind === 'frost') {
    hurtMob(t, 42, h, { col: '#DDF3FF' });
    if (t.alive && !t.isBoss) { t.st.slow = Math.max(t.st.slow, 0.25); t.st.slowT = 2; }
    if (h.traits.has('splinter')) { const o = S.mobs.find((m) => m !== t && isFoe(m) && engaged(m) && !m.cage && dist(m, t) < 220); if (o) hurtMob(o, 21, h, { col: '#DDF3FF', size: 17 }); }
    bits(t.x, t.y - 40, 'shard_ice', 2, 110);
  } else if (p.kind === 'icicle') {
    const shatters = shatterable(t);
    const helmMul = (h.bonuses.has('rb_helm') ? 1.25 : 1) * gearMul(h, 'icicle');
    hurtMob(t, 72 * helmMul, h, { shatter: 3, crit: 0.25, col: shatters ? '#8FD6FF' : '#DDF3FF' });
    icicleGadgets(h, t, shatters);
    if (h.bonuses.has('rb_helm')) {
      const o = S.mobs.find((m) => m !== t && isFoe(m) && engaged(m) && !m.cage && dist(m, t) < 160);
      if (o) hurtMob(o, 40, h, { col: '#DDF3FF', size: 17, noCrit: true });
    }
    if (shatters && h.isPlayer) fxText(t.x, t.y - (t.isBoss ? 210 : 130), 'Shatter', '#8FD6FF', 22, { dur: 0.9 });
    if (shatters) sfx('shatter', 0.7);
    bits(t.x, t.y - 40, 'shard_ice', shatters ? 7 : 3, 180);
  } else if (p.kind === 'smite') {
    const helmMul = h.bonuses.has('cw_helm') ? 1.3 : 1;
    const got = hurtMob(t, 74 * helmMul, h, { col: '#FFE08A', size: 20 });
    const low = mostHurt(h, null);
    if (got > 0 && low && low.hp < low.maxHp) { healHero(h, low, got, { size: 17, raw: true }); fx({ type: 'beam', x: t.x, y: t.y - 50, x2: low.x, y2: low.y - 40, col: '#FFE08A', dur: 0.22 }); }
    for (const z of S.zones) if (z.kind === 'heal') {
      fx({ type: 'ring', x: z.x, y: z.y, r0: 24, r1: z.r, col: '#FFE08A', dur: 0.28, w: 6, ground: true });
      for (const a of S.heroes) if (a.alive && dist(a, z) <= z.r + a.r && a.hp < a.maxHp) healHero(h, a, 35, { size: 15 });
    }
    h.mana = Math.min(h.maxMana, h.mana + 3 + (h.bonuses.has('cw_helm') ? 3 : 0));
    dots(t.x, t.y - 50, '#FFE08A', 6, 120);
  } else {
    hurtMob(t, 18, h, { col: '#FFE08A', size: 17 });
  }
}

export function mostHurt(h, except) {
  let best = null, bv = 2;
  for (const a of S.heroes) { if (!a.alive || a === except) continue; if (h && dist(a, h) > MEND.range) continue; const v = a.hp / a.maxHp - (a.role === 'tank' ? 0.04 : 0); if (v < bv) { bv = v; best = a; } }
  return best;
}

/* ---------- abilities ---------- */
export function useAbility(h, slot, aim) {
  const def = AB[abKey(h)][slot];
  if (!def || !h.alive || S.over || def.hold) return false;
  if (h.st.stun > 0 || h.st.caged || h.st.air > 0 || h.dodgeT > 0 || h.dash) return false;
  if (h.cd[slot] > 0) { if (h.isPlayer) HOOKS.nope(slot); return false; }
  const mCost = abMana(h, slot);
  if (mCost && h.mana < mCost) { if (h.isPlayer) { HOOKS.nope(slot); banner('Not enough mana', 'warn', 0.9); } return false; }
  if (h.cast) return false;
  let ok = false;
  switch (def.key) {
    case 'slam': ok = abSlam(h); break;
    case 'charge': ok = abCharge(h, aim); break;
    case 'cleave': ok = abCleave(h, aim); break;
    case 'circle': ok = abCircle(h, aim); break;
    case 'ward': ok = abWard(h, aim); break;
    case 'sunburst': ok = abSunburst(h); break;
    case 'smite': ok = abShot(h, aim, 'smite'); break;
    case 'blizzard': ok = abBlizzard(h, aim); break;
    case 'nova': ok = abNova(h); break;
    case 'icicle': ok = abShot(h, aim, 'icicle'); break;
    case 'comet': ok = abComet(h, aim); return ok;
    case 'viper': ok = abViper(h, aim); break;
    case 'ambush': ok = abAmbush(h, aim); break;
    case 'flurry': ok = abFlurry(h); break;
    case 'shadowstep': ok = abShadowstep(h, aim); break;
  }
  if (ok) {
    h.cd[slot] = abCd(h, slot);
    if (mCost) h.mana -= mCost;
    if (h.isPlayer) HOOKS.fired(slot);
  } else if (h.isPlayer) HOOKS.nope(slot);
  return ok;
}

/* Slam: drag everything around you in, make it turn on you, and spin a 360° whirlwind through the pack */
function abSlam(h) {
  let n = 0;
  const R = 210, wR = 118;
  const chestMul = (h.bonuses.has('bg_chest') ? 1.35 : 1) * gearMul(h, 'slam');
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || m.M.wisp || dist(m, h) > R + m.r || Math.abs(m.y - h.y) > 600) continue;
    taunt(m, h, 4);
    hurtMob(m, 50 * chestMul, h, { threat: 2 });
    if (m.alive && !m.isBoss) yank(m, h, m.M.big ? 0.5 : 1.05);
    n++;
  }
  if (n > 0 && h.bonuses.has('bg_chest')) healHero(h, h, 18 * n, { size: 17 });
  if (n > 0 && h.bonuses.has('cg_chest')) healHero(h, h, 20 * n, { size: 17 });
  if (h.bonuses.has('barrowguard3')) {
    spawnThrall(h, 'bg', h.x - 42, h.y + 18, 8);
    spawnThrall(h, 'bg', h.x + 42, h.y + 18, 8);
    if (h.isPlayer) fxText(h.x, h.y - 125, 'Barrow Thralls!', '#FFE08A', 20);
  }
  say(h, n ? (rng() < 0.5 ? 'Oi!' : 'Over here!') : 'Oi?', 0.9);
  // Inward vacuum ring + ground shockwave
  fx({ type: 'ring', x: h.x, y: h.y, r0: R + 12, r1: 24, col: '#F2C230', dur: 0.25, w: 9, ground: true });
  dots(h.x, h.y, '#C9B79A', 10, 200);
  if (n) shake(4.5);
  sfx('slam', 0.7); sfx('taunt');
  // Stage 2: 360° Whirlwind cyclone spin
  h.whirlDur = 0.42;
  h.whirlT = h.whirlDur;
  fx({ type: 'whirl', h, x: h.x, y: h.y, r: wR, dur: h.whirlDur, col: '#F2C230' });
  const spinSlice = (finalSpin) => {
    if (!h.alive || S.over) return;
    sfx('sweep', 0.65);
    let hitAny = false;
    for (const m of S.mobs) {
      if (!isFoe(m) || m.cage || m.M.wisp || dist(m, h) > wR + m.r) continue;
      hurtMob(m, 14 * chestMul, h, { noCrit: true, threat: 2, knock: finalSpin ? 55 : 25, size: 17 });
      hitAny = true;
    }
    if (hitAny) {
      bits(h.x, h.y - 28, 'shard_bone', 4, 170);
      if (finalSpin) shake(3.5);
    }
  };
  later(0.18, () => spinSlice(false));
  later(0.35, () => spinSlice(true));
  return true;
}
/* pull a mob in towards the hero, to just outside arm's reach (knockback decays at 0.01 a second, so the
   push it needs is about 4.6 times the distance) */
function yank(m, h, k) {
  const gap = dist(m, h) - (m.r + h.r + 14);
  if (gap < 10) return;
  const a = angTo(m, h), v = gap * 4.6 * k;
  m.st.kx += Math.cos(a) * v; m.st.ky += Math.sin(a) * v;
  m.wind = 0;
  fx({ type: 'beam', x: m.x, y: m.y - 30, x2: h.x, y2: h.y - 30, col: '#F2C230', dur: 0.16 });
  dots(m.x, m.y, '#C9B79A', 4, 90, { size: 5 });
}
/* Cleave: fast, wide crescent slash through everything in front of you; crushes stunned, clumped, or heavy foes */
function abCleave(h, aim) {
  const t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (t && dist(h, t) < 220) h.face = angTo(h, t);
  const wide = h.traits.has('wide');
  const hits = foesNear(h.x, h.y, 126, false).filter((m) => !m.cage && Math.abs(angDiff(h.face, angTo(h, m))) < (wide ? 1.42 : 1.25));
  const crush = hits.length >= 2 || hits.some((m) => m.M.big || stunned(m));
  const helmMul = (h.bonuses.has('bg_helm') ? 1.25 : 1) * gearMul(h, 'cleave');
  const base = 70 * helmMul, crushDmg = 92 * helmMul;
  for (const m of hits) hurtMob(m, (crush || m.M.big || stunned(m)) ? crushDmg : base, h, { knock: crush ? 105 : 85, crit: crush ? 0.28 : 0.2 });
  cleaveGadgets(h, hits, crush ? crushDmg : base);
  if (hits.length > 0 && h.bonuses.has('bg_helm')) healHero(h, h, 24, { size: 17 });
  if (crush && h.isPlayer) {
    fxText(h.x + Math.cos(h.face) * 58, h.y + Math.sin(h.face) * 35 - 112, 'Crush!', '#FFE08A', 24, { dur: 0.85 });
    hitstop(0.038);
  }
  h.lunge = 0.22; h.lungeA = h.face; h.swingT = 0.24; h.swingDir = ((h.swings || 0) % 2 === 0 ? 1 : -1); h.atkT = Math.max(h.atkT, 0.42); h.blocking = false;
  fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: crush ? 114 : 100, dur: 0.25, col: crush ? '#F2C230' : '#FFE08A', wide: true, crush });
  sfx('sweep', 0.85);
  if (hits.length) {
    shake(crush || hits.length > 2 ? 5.5 : 3.5);
    sfx('thud', 0.65);
    bits(h.x + Math.cos(h.face) * 56, h.y + Math.sin(h.face) * 34 - 24, 'shard_bone', crush ? 6 : 3, 210);
  }
  if (h.unique === 'gravedigger' && ++h.swings % 5 === 0) gravedig(h);
  return true;
}
function abCharge(h, aim) {
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
  if (!t) t = nearestFoe(h, 420, false);
  if (t) h.dash = { mob: t, t: 0.55 };
  else h.dash = { tx: h.x + Math.cos(h.face) * 200, ty: h.y + Math.sin(h.face) * 200, t: 0.3 };
  h.blocking = false;
  fx({ type: 'ring', x: h.x, y: h.y, r0: 14, r1: 58, col: '#FFE08A', dur: 0.22, w: 6, ground: true });
  sfx('charge');
  return true;
}
function dashTick(h, dt) {
  const d = h.dash;
  d.t -= dt;
  let tx, ty;
  if (d.mob) { if (!isFoe(d.mob)) { h.dash = null; return; } tx = d.mob.x; ty = d.mob.y; } else { tx = d.tx; ty = d.ty; }
  const dx = tx - h.x, dy = ty - h.y, dd = Math.hypot(dx, dy);
  const stop = d.mob ? h.r + d.mob.r + 4 : 4;
  h.face = Math.atan2(dy, dx); h.moving = 0.1; h.walkT += dt * 24;
  if (S.frame % 2 === 0) {
    dots(h.x, h.y, '#C9B79A', 1, 50, { size: 5, dur: 0.38 });
    if (dd > 20) fx({ type: 'swipe', x: h.x, y: h.y - 34, x2: h.x - (dx / dd) * 46, y2: h.y - 34 - (dy / dd) * 28, col: '#FFE08A', dur: 0.16 });
  }
  if (dd <= stop || d.t <= 0) { chargeImpact(h, d); h.dash = null; return; }
  const step = Math.min(1220 * dt, dd - stop);
  if (!moveEnt(h, (dx / dd) * step, (dy / dd) * step)) { chargeImpact(h, d); h.dash = null; }
}
function chargeImpact(h, d) {
  const ring = h.traits.has('ringing');
  const shMul = (h.bonuses.has('bg_shoulders') ? 1.35 : 1) * gearMul(h, 'charge');
  const dmg = 92 * shMul, stunDur = 1.0;
  const hits = foesNear(h.x, h.y, 92, false).filter((m) => !m.cage);
  for (const m of hits) {
    aggro(m, h, 0);
    const hitDmg = m.M.big ? dmg * 1.15 : dmg;
    hurtMob(m, hitDmg, h, { knock: 160 });
    // the mob you charged turns on you; Ringing Charge makes everything you hit turn
    if (ring) hurtMob(m, hitDmg, h, { knock: 60 });
    if (ring || m === d.mob) taunt(m, h, 2.5);
    addThreat(m, h, 260);
    if (m.isBoss) staggerBoss(m, STAGGER);
    else { m.st.stun = Math.max(m.st.stun, stunDur); m.wind = 0; if (m.cast) interruptCast(m); }
  }
  if (h.bonuses.has('bg_shoulders')) {
    h.absorb = Math.max(h.absorb, Math.round(80 * h.power));
    h.absorbT = Math.max(h.absorbT, 5);
    if (h.isPlayer) fxText(h.x, h.y - 116, 'Skull Guard', '#FFE08A', 18);
  }
  chargeGadgets(h);
  if (h.unique === 'gravedigger') h.cd.a1 = 0;
  else h.cd.a1 = Math.max(0, h.cd.a1 - 1.2);
  if (d.mob) h.picked = d.mob.alive ? d.mob : null;
  fx({ type: 'ring', x: h.x, y: h.y, r0: 16, r1: 108, col: '#F2C230', dur: 0.28, w: 9, ground: true });
  dots(h.x, h.y, '#C9B79A', 10, 180);
  bits(h.x, h.y - 20, 'shard_dirt', 6, 200);
  if (hits.length) { shake(5.5); sfx('thud'); if (h.isPlayer) hitstop(0.045); }
}
/* a perfect block hits back, readies Cleave, and Barrowguard 2pc grants Bone shield */
export function onPerfectBlock(h, src) {
  if (src && src.kind === 'mob' && src.alive) {
    hurtMob(src, 185, h, { col: '#F2C230', size: 26, noCrit: true });
    fx({ type: 'cleave', x: h.x + Math.cos(h.face) * 16, y: h.y - 34, a: h.face, r: 78, dur: 0.22, col: '#F2C230', crush: true });
  }
  h.cd.a1 = 0;
  if (h.bonuses.has('barrowguard2')) {
    h.absorb = Math.max(h.absorb, Math.round(150 * h.power));
    h.absorbT = 6;
    if (h.isPlayer) fxText(h.x, h.y - 120, 'Bone shield', '#FFE08A', 18);
  }
  blockGadgets(h, src);
}

export function clampRange(h, x, y, r) { const d = distXY(h.x, h.y, x, y); if (d <= r) return { x, y }; return { x: h.x + ((x - h.x) / d) * r, y: h.y + ((y - h.y) / d) * r }; }
function abCircle(h, aim) {
  let p;
  if (aim && aim.x !== undefined && !aim.kind) p = clampRange(h, aim.x, aim.y, 520);
  else { const t = heroBy('tank'); p = t && t.alive && dist(t, h) < 520 ? { x: t.x, y: t.y } : { x: h.x, y: h.y }; }
  const chestMul = (h.bonuses.has('cw_chest') ? 1.25 : 1) * gearMul(h, 'circle');
  S.zones.push({ kind: 'heal', x: p.x, y: p.y, r: 114, t: 0, dur: 6 + (h.bonuses.has('sb_chest') ? 1 : 0), tick: 0.5, tickT: 0.2, val: Math.round(38 * chestMul), src: h });
  sfx('circle');
  return true;
}
function abWard(h, aim) {
  let t = aim && aim.kind === 'hero' && aim.alive ? aim : null;
  if (!t) {
    const tank = heroBy('tank');
    const low = mostHurt(h, null);
    t = low && low.hp / low.maxHp < 0.7 ? low : tank && tank.alive && dist(tank, h) < MEND.range ? tank : low;
  }
  if (!t || dist(t, h) > MEND.range + 40) return false;
  const shMul = (h.bonuses.has('cw_shoulders') ? 1.3 : 1) * gearMul(h, 'ward');
  t.absorb = Math.max(t.absorb, Math.round(230 * shMul * h.power)); t.absorbT = Math.max(t.absorbT, 8 + (h.bonuses.has('sb_shoulders') ? 2 : 0)); t.wardBy = h;
  wardGadgets(h, t);
  if (h.bonuses.has('cw_shoulders')) healHero(h, t, 45, { size: 17 });
  fx({ type: 'ring', x: t.x, y: t.y - 40, r0: 10, r1: 52, col: '#DDF3FF', dur: 0.3, w: 5 });
  if (h.isPlayer || t.isPlayer) fxText(t.x, t.y - 96, 'Ward', '#DDF3FF', 18);
  fx({ type: 'beam', x: h.x, y: h.y - 50, x2: t.x, y2: t.y - 40, col: '#DDF3FF', dur: 0.25 });
  sfx('ward');
  return true;
}
function abSunburst(h) {
  for (const a of S.heroes) {
    if (!a.alive || dist(a, h) > 470) continue;
    healHero(h, a, 210, { show: true });
    a.st.root = 0; a.st.haunt = 0;
    if (a.st.curse) liftCurse(a, h);
    if (h.unique === 'longnight') {
      a.absorb = Math.max(a.absorb, Math.round(75 * h.power));
      a.absorbT = Math.max(a.absorbT, 6);
      a.wardBy = h;
    }
  }
  if (h.unique === 'longnight') {
    for (const m of foesNear(h.x, h.y, 180, false)) if (!m.cage) hurtMob(m, 90, h, { col: '#FFE08A', size: 19, noCrit: true });
  }
  sunburstGadgets(h);
  fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 30, r1: 470, col: '#F2C230', dur: 0.5, w: 9 });
  dots(h.x, h.y - 60, '#FFE08A', 16, 220);
  sfx('sunburst');
  return true;
}
/* Smite and Icicle: instant shots at your target */
function abShot(h, aim, kind) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : null;
  if (!t) t = kind === 'smite' ? smiteTarget(h) : autoTarget(h);
  if (!t || t.cage || dist(h, t) > 520) { if (h.isPlayer) fxText(h.x, h.y - 100, 'No target', '#DDF3FF', 16); return false; }
  h.face = angTo(h, t); h.lunge = 0.12; h.lungeA = h.face;
  S.projs.push({ team: 'hero', kind, x: h.x + Math.cos(h.face) * 18, y: h.y + Math.sin(h.face) * 8, z: 56, sp: kind === 'smite' ? 'orb_holy' : 'bolt_frost', src: h, tgt: t, speed: kind === 'smite' ? 900 : 1100, life: 1.5, big: true });
  sfx(kind === 'smite' ? 'smite' : 'icicle');
  return true;
}
function smiteTarget(h) {
  const tank = heroBy('tank');
  if (tank && tank.alive && isFoe(tank.target) && dist(h, tank.target) < 520) return tank.target;
  return autoTarget(h);
}
export function mend(h, t) {
  if (!h || !h.alive || h.role !== 'healer' || S.over) return false;
  if (h.st.stun > 0 || h.st.caged || h.st.air > 0) return false;
  if (!t || !t.alive) return false;
  if (h.gcd > 0 || h.dodgeT > 0) { h.queued = t; return false; }
  const cost = MEND.mana - (h.bonuses.has('sb_helm') ? 2 : 0);
  if (h.mana < cost) { if (h.isPlayer) banner('Out of mana. Smite gives some back.', 'warn', 1.0); return false; }
  if (dist(h, t) > MEND.range) { if (h.isPlayer) fxText(h.x, h.y - 100, 'Too far', '#FFE08A', 18); return false; }
  h.mana -= cost; h.gcd = h.traits.has('quickhands') ? 0.3 : MEND.gcd;
  healHero(h, t, MEND.heal * gearMul(h, 'mend'));
  mendGadgets(h, t);
  if (h.traits.has('sunflare')) { const o = mostHurt(h, t); if (o && o.hp < o.maxHp) healHero(h, o, 70, { size: 16 }); }
  if (h.bonuses.has('candlewake2')) t.hots.push({ src: h, per: 10, left: 4, next: 1 });
  if (h.unique === 'longnight') { t.absorb = Math.max(t.absorb, Math.round(60 * h.power)); t.absorbT = Math.max(t.absorbT, 6); t.wardBy = h; }
  fx({ type: 'beam', x: h.x, y: h.y - 56, x2: t.x, y2: t.y - 40, col: '#FFE08A', dur: 0.22 });
  dots(t.x, t.y - 50, '#7BE05A', 5, 90, { up: true });
  if (t !== h) { h.face = angTo(h, t); }
  h.lunge = 0.1; h.lungeA = h.face;
  sfx('heal');
  if (h.isPlayer) HOOKS.pulseFrame(t.role);
  return true;
}
function abBlizzard(h, aim) {
  let p = null;
  if (aim && aim.x !== undefined && !aim.kind) p = clampRange(h, aim.x, aim.y, 520);
  else { const c = bestCluster(h, 120, 560); if (c) p = { x: c.x, y: c.y }; else { const t = autoTarget(h); if (t) p = { x: t.x, y: t.y }; } }
  if (!p) { if (h.isPlayer) fxText(h.x, h.y - 100, 'Nothing to freeze', '#DDF3FF', 16); return false; }
  p = clampRange(h, p.x, p.y, 520);
  const chestMul = h.bonuses.has('rb_chest') ? 1.25 : 1;
  const rb3Mul = h.bonuses.has('rimebone3') ? 1.3 : 1;
  S.zones.push({ kind: 'blizzard', x: p.x, y: p.y, r: 124, t: 0, dur: 5 + (h.bonuses.has('rb_chest') ? 1 : 0), tick: 0.5, tickT: 0.15, val: Math.round(20 * chestMul * rb3Mul), src: h, seed: rng() * 100 });
  if (h.bonuses.has('rimebone3')) {
    spawnThrall(h, 'frost', p.x, p.y + 24, 6);
  }
  h.face = Math.atan2(p.y - h.y, p.x - h.x); h.lunge = 0.14; h.lungeA = h.face;
  sfx('blizzard');
  return true;
}
function abNova(h) {
  const R = 155;
  const shMul = (h.bonuses.has('rb_shoulders') ? 1.4 : 1) * gearMul(h, 'nova'), longer = h.bonuses.has('as_shoulders') ? 1 : 0;
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || dist(m, h) > R + m.r) continue;
    aggro(m, h, 0);
    hurtMob(m, 50 * shMul, h, { col: '#DDF3FF' });
    if (!m.alive || m.M.thing) continue;
    if (m.isBoss) { m.st.slow = 0.4; m.st.slowT = 3; chillBoss(m, CHILL + longer); }
    else if (!m.M.wisp) { m.st.freeze = 3 + longer; m.wind = 0; if (m.cast) interruptCast(m); }
  }
  if (h.bonuses.has('rb_shoulders')) h.cd.a3 = Math.max(0, h.cd.a3 - 1.5);
  if (h.unique === 'gravefrost') {
    h.cd.a4 = 0;
    S.zones.push({ kind: 'blizzard', x: h.x, y: h.y, r: 125, t: 0, dur: 3, tick: 0.5, tickT: 0.15, val: 20, src: h, seed: rng() * 100 });
  }
  fx({ type: 'nova', x: h.x, y: h.y, r: R, dur: 0.45 });
  bits(h.x, h.y - 20, 'shard_ice', 12, 300);
  sfx('nova'); shake(3);
  return true;
}
function abComet(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) && !aim.M.thing ? aim : null;
  if (!t) t = autoTarget(h, true);
  if (!t || dist(h, t) > 540) { if (h.isPlayer) { fxText(h.x, h.y - 100, 'No target', '#DDF3FF', 16); HOOKS.nope('a3'); } return false; }
  h.cast = { key: 'comet', t: 0, dur: AB.dps.a3.cast * (h.traits.has('quickfrost') ? 0.5 : 1), target: t };
  sfx('castup');
  return true;
}
function finishCast(h) {
  const c = h.cast; h.cast = null;
  if (c.key !== 'comet') return;
  const cd = abCd(h, 'a3');
  h.cd.a3 = cd;
  if (h.isPlayer) HOOKS.fired('a3');
  const t = c.target;
  const tx = t.x, ty = t.y;
  fx({ type: 'comet', x: tx, y: ty, dur: 0.32 });
  sfx('whoosh');
  later(0.32, () => {
    const shatters = t.alive && shatterable(t);
    const lance = h.traits.has('shatterlance');
    if (t.alive) hurtMob(t, 315 * gearMul(h, 'comet'), h, { shatter: lance ? 3 : 2, chillShatter: lance ? SHATTERLANCE_CHILL : undefined, crit: 0.15, col: shatters ? '#8FD6FF' : '#DDF3FF' });
    if (shatters && h.isPlayer) fxText(tx, ty - (t.isBoss ? 230 : 150), 'Shatter!', '#8FD6FF', 32, { dur: 1.2 });
    if (shatters && h.bonuses.has('rimebone2')) h.cd.a3 = Math.min(h.cd.a3, cd / 2);
    const splash = foesNear(tx, ty, 90, false).filter((o) => o !== t && !o.cage);
    for (const o of splash) hurtMob(o, 114, h, { size: 19 });
    if (h.unique === 'gravefrost') for (const o of [t, ...splash]) { if (!o.alive) continue; if (o.isBoss) { o.st.slow = Math.max(o.st.slow, 0.4); o.st.slowT = 2; chillBoss(o, 2); } else if (!o.M.wisp) { o.st.freeze = Math.max(o.st.freeze, 2); o.wind = 0; } }
    cometGadgets(h, t, tx, ty, shatters);
    fx({ type: 'ring', x: tx, y: ty, r0: 20, r1: 110, col: '#DDF3FF', dur: 0.3, w: 8, ground: true });
    bits(tx, ty - 20, 'shard_ice', 14, 320);
    shake(shatters ? 7 : 4); sfx('comet'); if (shatters) sfx('shatter');
    if (shatters && h.isPlayer) hitstop(0.08);
  });
}

/* ---------- rogue abilities: Viper Blades, Shadowstrike, Fan of Blades, Shadowstep ---------- */
function rogueMeleeTarget(h, aim, maxRange) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (!t || dist(h, t) > h.r + t.r + maxRange) t = nearestFoe(h, maxRange, false);
  return t && dist(h, t) <= h.r + t.r + maxRange ? t : null;
}

/* Viper Blades (a1): fast twin-dagger slash on a single foe that applies Viper Venom */
function abViper(h, aim) {
  const t = rogueMeleeTarget(h, aim, 78);
  if (!t) { if (h.isPlayer) fxText(h.x, h.y - 100, 'Too far', '#7CF06A', 16); return false; }
  h.face = angTo(h, t); h.lunge = 0.18; h.lungeA = h.face; h.swingT = 0.2;
  const base = 48;
  const dmg = hurtMob(t, base, h, { crit: 0.22, col: '#7CF06A' });
  if (t.alive) applyBleed(h, t);
  if (h.bonuses.has('shadeveil2') && dmg >= Math.round(base * h.power * 1.6) && t.alive) {
    hurtMob(t, 55, h, { col: '#B79CFF', size: 19, noCrit: true });
  }
  if (dmg >= Math.round(base * h.power * 1.6)) critSpark(h, t);
  viperGadgets(h, t);
  fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: 68, dur: 0.2, col: '#7CF06A' });
  dots(t.x, t.y - 40, '#7CF06A', 6, 130);
  sfx('sweep', 0.75);
  return true;
}

/* Shadowstrike (a2): single-target execution thrust; guaranteed crit + bonus damage on poisoned targets */
function abAmbush(h, aim) {
  const t = rogueMeleeTarget(h, aim, 84);
  if (!t) { if (h.isPlayer) fxText(h.x, h.y - 100, 'Too far', '#FF6B6B', 16); return false; }
  const bleeding = !!(t.bleed && t.bleed.left > 0);
  h.face = angTo(h, t); h.lunge = 0.22; h.lungeA = h.face; h.swingT = 0.24;
  const helmMul = (h.bonuses.has('sv_helm') ? 1.25 : 1) * gearMul(h, 'ambush');
  const nsMul = h.nightstalkerT > 0 ? 1.3 : 1;
  h.nightstalkerT = 0;
  const bleedMul = bleeding ? 1.35 : 1;
  const base = 76 * helmMul * nsMul * bleedMul;
  const critChance = bleeding ? 1.0 : 0.35;
  const dmg = hurtMob(t, base, h, { crit: critChance, col: bleeding ? '#FF6B6B' : '#FFE08A' });
  const didCrit = bleeding || dmg >= Math.round(base * h.power * 1.6);
  if (bleeding && h.isPlayer) fxText(t.x, t.y - 135, 'Shadowstrike!', '#FF6B6B', 24, { dur: 0.9 });
  if (bleeding && h.traits.has('arterial')) later(0, () => { h.cd.a2 = Math.max(0, h.cd.a2 - 1.2); });
  if (didCrit && h.bonuses.has('sv_helm')) healHero(h, h, 25, { size: 16 });
  if (didCrit && h.bonuses.has('shadeveil2') && t.alive) hurtMob(t, 55, h, { col: '#B79CFF', size: 19, noCrit: true });
  if (didCrit) critSpark(h, t);
  ambushGadgets(h, t);
  fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: 78, dur: 0.22, col: '#FF6B6B', crush: bleeding });
  dots(t.x, t.y - 44, '#FF6B6B', 8, 160);
  sfx('thud', 0.8);
  if (bleeding) shake(4);
  return true;
}

/* Fan of Blades (a3): modest AoE spin that interrupts enemy casts and refreshes active venom */
function abFlurry(h) {
  const R = 140 * (h.bonuses.has('gs_shoulders') ? 1.25 : 1), fanMul = gearMul(h, 'flurry');
  h.whirlDur = 0.28; h.whirlT = 0.28;
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || dist(m, h) > R + m.r) continue;
    aggro(m, h, 0);
    if (m.cast) interruptCast(m);
    hurtMob(m, 50 * fanMul, h, { col: '#D7DEE6', size: 18 });
    if (m.alive && m.bleed && m.bleed.left > 0) applyBleed(h, m);
  }
  fx({ type: 'whirl', h, x: h.x, y: h.y, r: R, dur: 0.28, col: '#B79CFF' });
  fx({ type: 'ring', x: h.x, y: h.y - 26, r0: 18, r1: R, col: '#D7DEE6', dur: 0.24, w: 5 });
  sfx('sweep', 0.8);
  return true;
}

/* Shadowstep (a4): blink through shadow behind target, interrupt casts, and gain +35% attack speed */
function abShadowstep(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (!t || dist(h, t) > 380) t = nearestFoe(h, 380, false);
  if (!t || dist(h, t) > 380) { if (h.isPlayer) fxText(h.x, h.y - 100, 'No target', '#B79CFF', 16); return false; }
  const ox = h.x, oy = h.y;
  const backA = (t.face || 0) + Math.PI;
  const reach = t.r + h.r + 8;
  let nx = t.x + Math.cos(backA) * reach, ny = t.y + Math.sin(backA) * reach;
  if (!canStand(nx, ny, h.r)) {
    const a2 = angTo(t, h);
    nx = t.x + Math.cos(a2) * reach; ny = t.y + Math.sin(a2) * reach;
  }
  if (canStand(nx, ny, h.r)) { h.x = nx; h.y = ny; }
  h.face = angTo(h, t); h.lunge = 0.16; h.lungeA = h.face;
  dots(ox, oy - 30, '#B79CFF', 8, 120);
  fx({ type: 'swipe', x: ox, y: oy - 30, x2: h.x, y2: h.y - 30, col: '#B79CFF', dur: 0.22 });
  dots(h.x, h.y - 30, '#7CF06A', 8, 140);
  if (t.cast) interruptCast(t);
  const shMul = h.bonuses.has('sv_shoulders') ? 1.35 : 1;
  hurtMob(t, 70 * shMul, h, { crit: 0.25, col: '#B79CFF' });
  stepGadgets(h, ox, oy);
  if (h.bonuses.has('shadeveil3')) {
    spawnThrall(h, 'shade', h.x - Math.cos(h.face) * 28, h.y - Math.sin(h.face) * 18, 6);
    if (h.isPlayer) fxText(h.x, h.y - 125, 'Shadow Twin!', '#B79CFF', 20);
  }
  h.frenzyT = 3.8;
  if (h.traits.has('nightstalker')) h.nightstalkerT = 3.5;
  if (h.unique === 'cryptfangs') h.cd.a2 = 0;
  else h.cd.a2 = Math.max(0, h.cd.a2 - 2.0 - (h.bonuses.has('sv_shoulders') ? 1.5 : 0));
  h.picked = t.alive ? t : null;
  sfx('dodge', 0.8); sfx('swing', 0.7);
  return true;
}

export function doDodge(h, dx, dy) {
  if (!h.alive || S.over || h.cd.dodge > 0 || h.st.stun > 0 || h.st.caged || h.st.root > 0 || h.st.air > 0 || h.dash) return false;
  let v = norm(dx, dy);
  if (!dx && !dy) v = { x: Math.cos(h.face), y: Math.sin(h.face) };
  // Moonpetal Tonic: every dodge heals (Bramble Fizz brings it back sooner, see heroTick)
  h.dodgeT = 0.3; h.iframe = 0.38; h.dodgeX = v.x; h.dodgeY = v.y; h.cd.dodge = 1.6; h.cast = null; h.blocking = false;
  if (Math.abs(v.x) > 0.2) h.flip = v.x < 0;
  dots(h.x, h.y, '#C9B79A', 6, 90, { size: 6 });
  const heal = brewFx(h.brew).dodgeHeal;
  if (heal) { healHero(null, h, h.maxHp * heal, { raw: true, size: 16 }); dots(h.x, h.y - 40, '#8FD6FF', 5, 70, { size: 5 }); }
  sfx('dodge');
  emit({ type: 'dodge', player: !!h.isPlayer });
  return true;
}
