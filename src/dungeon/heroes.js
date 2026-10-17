/* ---------- heroes: moving, auto attacks, targets, firing a button, the dodge ----------
   What each class's four buttons do is buttons.js; when a press of yours fires is press.js. */
import { angTo, dist, distXY, norm } from '../core/math';
import { AB, BEAT, MEND, abKey } from '../content/roles';
import { HOOKS, S, emit } from './state.js';
import { banner, bits, brewFx, dots, fx, fxText, healHero, hurtMob, sfx } from './entities.js';
import { canStand, moveEnt } from './world.js';
import { gearMul } from './gadgets.js';
import { BUTTONS, dashTick, finishCast } from './buttons.js';
import { FIRE_BUTTONS } from './fire.js';
import { has, knifeStorm, unbowed, venomStacks } from './specs.js';

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
export function bombInReach(h) {
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
  // Bramble Fizz and Lantern Zeal: every cooldown (the dodge's and the beat too) comes back sooner; a talent's
  // haste speeds the buttons' cooldowns, never the beat
  const cdRate = (st && st.zeal > 0 ? 1.15 : 1) * (brewFx(h.brew).cd || 1);
  const haste = h.ts ? h.ts.haste : 1;
  for (const k in h.cd) if (h.cd[k] > 0) h.cd[k] = Math.max(0, h.cd[k] - dt * cdRate * (k === 'dodge' ? 1 : haste));
  if (h.beat > 0) h.beat = Math.max(0, h.beat - dt * cdRate);
  if (h.furyT > 0) h.furyT = Math.max(0, h.furyT - dt);
  if (h.stormT > 0) h.stormT = Math.max(0, h.stormT - dt);
  if (h.heartT > 0) h.heartT = Math.max(0, h.heartT - dt);
  if (h.dawnT > 0) h.dawnT = Math.max(0, h.dawnT - dt);
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

/* heals over time (Candlewake's candle, Sporebloom's spore): they grow with their healer's Power, like a Mend */
function tickHots(h, dt) {
  for (let i = h.hots.length - 1; i >= 0; i--) {
    const o = h.hots[i];
    o.left -= dt; o.next -= dt;
    if (o.next <= 0) { o.next += 1; healHero(o.src, h, o.per, { size: 14 }); }
    if (o.left <= 0) h.hots.splice(i, 1);
  }
}

/** Viper Venom: this much every half second while it lasts (each stack, with Deadly Venom: up to three) */
export const VENOM = 14;
export function applyBleed(h, m, durOverride) {
  if (!m || !m.alive || m.cage || m.M.wisp || m.M.thing) return;
  const chestMul = (h.bonuses && h.bonuses.has('sv_chest') ? 1.3 : 1) * gearMul(h, 'venom');
  const per = Math.round(VENOM * chestMul);
  const fullDur = 5.5 + (h.bonuses && h.bonuses.has('sv_chest') ? 1.0 : 0);
  const dur = durOverride ? Math.max(m.bleed ? m.bleed.left : 0, durOverride) : fullDur;
  const on = m.bleed && m.bleed.left > 0;
  const n = durOverride ? (on ? m.bleed.n || 1 : 1) : Math.min(venomStacks(h), on ? (m.bleed.n || 1) + 1 : 1);
  m.bleed = { src: h, per, n, left: dur, next: on ? m.bleed.next : 0.5 };
}

/* Automatic attacks: the melee keep small ones between presses (the axe and the daggers keep moving); the healer
   and the mage have none, their filler is their damage. */
export const AUTO = { tank: { dmg: 25, every: 1.5 }, rogue: { dmg: 14, every: 0.7 } };
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
      h.atkT = AUTO.tank.every; h.face = angTo(h, t); h.lunge = 0.16; h.lungeA = h.face;
      hurtMob(t, AUTO.tank.dmg, h, { knock: 50, tier: 'tick', auto: true, key: 'auto' });
      fx({ type: 'slash', x: h.x, y: h.y - 30, a: h.face, r: 54, dur: 0.18, col: '#FFFFFF' });
      sfx('swing', 0.7);
    }
  } else if (h.cls === 'rogue') {
    if (d <= h.r + t.r + 34 && h.atkT <= 0) {
      h.atkT = AUTO.rogue.every / (h.frenzyT > 0 ? 1.35 : 1);
      h.face = angTo(h, t); h.lunge = 0.13; h.lungeA = h.face;
      h.swings = (h.swings || 0) + 1;
      hurtMob(t, AUTO.rogue.dmg, h, { crit: 0.2, col: '#D7DEE6', tier: 'tick', auto: true, key: 'auto' });
      // Knife Storm: for a while after Shadowstep, every swing hits every foe round you
      if (knifeStorm(h)) {
        for (const o of foesNear(h.x, h.y, 120, false)) if (o !== t && !o.cage) hurtMob(o, AUTO.rogue.dmg, h, { crit: 0.2, col: '#B79CFF', tier: 'tick', auto: true, key: 'storm' });
        fx({ type: 'whirl', h, x: h.x, y: h.y, r: 120, dur: 0.2, col: '#B79CFF' });
      }
      if (t.alive && h.traits.has('twinvenom') && t.bleed && t.bleed.left > 0) t.bleed.left = Math.min(7.5, t.bleed.left + 1.5);
      if (h.unique === 'cryptfangs' && h.swings % 4 === 0 && t.alive) {
        hurtMob(t, 32, h, { crit: 0.25, col: '#7CF06A', size: 19, tier: 'tick' });
        if (t.alive) applyBleed(h, t);
      }
      fx({ type: 'slash', x: h.x, y: h.y - 30, a: h.face + (h.swings % 2 ? 0.28 : -0.28), r: 46, dur: 0.14, col: '#7CF06A' });
      sfx('swing', 0.55);
    }
  }
}

export function abCd(h, slot) {
  const def = AB[abKey(h)][slot];
  // Quick Charge and Whirling Edges bring their button back sooner, and Unbowed brings Slam back in half the time
  // with three or more foes on you
  if (slot === 'a2' && has(h, 'ax.quick')) return 6;
  if (slot === 'a3' && has(h, 'bl.whirl')) return 4;
  if (slot === 'a3' && def && def.key === 'slam' && unbowed(h)) return def.cd / 2;
  return def && def.cd ? def.cd : 0;
}
export function abMana(h, slot) {
  const def = AB[abKey(h)][slot];
  if (!def || !def.mana) return 0;
  let m = def.mana;
  if (def.key === 'circle' && h.bonuses && h.bonuses.has('cw_chest')) m -= 3;
  return Math.max(0, m);
}

/** the mate in Mend's reach most in need (the tank a touch first), or null */
export function mostHurt(h, except) {
  let best = null, bv = 2;
  for (const a of S.heroes) { if (!a.alive || a === except) continue; if (h && dist(a, h) > MEND.range) continue; const v = a.hp / a.maxHp - (a.role === 'tank' ? 0.04 : 0); if (v < bv) { bv = v; best = a; } }
  return best;
}

/* ---------- firing a button ---------- */
/** a held button pressing again stays quiet when it can't fire (see press.js), so nothing repeats "No target" */
let quietPress = false;
/** should a failed press say so? only the player's, and never a held button's repeat */
export const loud = (h) => h.isPlayer && !quietPress;
/** Fire a button now, or return false. Players press through press.js, which waits out the beat, the cooldown,
 *  a dodge or the shield, so a press is never thrown away; bots check ready() first. `quiet` hushes a failure. */
export function useAbility(h, slot, aim, quiet = false) {
  const def = AB[abKey(h)][slot];
  if (!def || !h.alive || S.over || def.hold) return false;
  if (h.st.stun > 0 || h.st.caged || h.st.air > 0 || h.dodgeT > 0 || h.dash) return false;
  const beat = !def.offBeat;
  // the beat, or the shield is up: buttons on the beat wait (press.js keeps the press)
  if (beat && (h.beat > 0 || h.blocking)) return false;
  if (h.cd[slot] > 0) { if (h.isPlayer && !quiet) HOOKS.nope(slot); return false; }
  const mCost = abMana(h, slot);
  if (mCost && h.mana < mCost) { if (h.isPlayer && !quiet) { HOOKS.nope(slot); banner('Not enough mana', 'warn', 0.9); } return false; }
  if (h.cast) return false;
  quietPress = quiet;
  try { return fire(h, slot, aim, def, beat, mCost, quiet); } finally { quietPress = false; }
}
function fire(h, slot, aim, def, beat, mCost, quiet) {
  // a Fire mage's buttons are fire's own (fire.js); Comet's cast is the same, and lands burning
  const ok = ((h.spec === 'fire' && FIRE_BUTTONS[def.key]) || BUTTONS[def.key])(h, aim);
  // Comet's cast takes the beat now; its cooldown starts when it lands (buttons.js finishCast)
  if (ok && def.key === 'comet') { h.beat = BEAT.len; return true; }
  if (ok) {
    h.cd[slot] = abCd(h, slot);
    if (beat) h.beat = BEAT.len;
    if (mCost) h.mana -= mCost;
    if (h.isPlayer) HOOKS.fired(slot);
  } else if (h.isPlayer && !quiet) HOOKS.nope(slot);
  return ok;
}

export function clampRange(h, x, y, r) { const d = distXY(h.x, h.y, x, y); if (d <= r) return { x, y }; return { x: h.x + ((x - h.x) / d) * r, y: h.y + ((y - h.y) / d) * r }; }

export function doDodge(h, dx, dy) {
  if (!h.alive || S.over || h.cd.dodge > 0 || h.st.stun > 0 || h.st.caged || h.st.root > 0 || h.st.air > 0 || h.dash) return false;
  let v = norm(dx, dy);
  if (!dx && !dy) v = { x: Math.cos(h.face), y: Math.sin(h.face) };
  // Moonpetal Tonic: every dodge heals (Bramble Fizz brings it back sooner, see heroTick)
  h.dodgeT = 0.3; h.iframe = 0.38; h.dodgeX = v.x; h.dodgeY = v.y; h.cd.dodge = 1.6; h.cast = null; h.blocking = false; h.next = null;
  if (Math.abs(v.x) > 0.2) h.flip = v.x < 0;
  dots(h.x, h.y, '#C9B79A', 6, 90, { size: 6 });
  const heal = brewFx(h.brew).dodgeHeal;
  if (heal) { healHero(null, h, h.maxHp * heal, { raw: true, size: 16 }); dots(h.x, h.y - 40, '#8FD6FF', 5, 70, { size: 5 }); }
  sfx('dodge');
  emit({ type: 'dodge', player: !!h.isPlayer });
  return true;
}
