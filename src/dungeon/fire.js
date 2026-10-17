/* ---------- Fire: the mage's other spec ----------
   Picking Fire turns the mage's four buttons to fire (content/talents/mage.ts names them): Firebolt for Icicle,
   a burning Comet, Firestorm for Blizzard and Ember burst for Rime burst. The engine still knows them by their
   keys, so gear that makes a button better makes its fire one better too (gearMul, the set pieces, the traits).
   Foes burn instead of freezing: each stack of Burn hurts every half second (BURN), a new one starts it again,
   and a Comet on a foe with 3 or more Combusts like a Shatter (twice as hard, half again on a boss) and spreads
   its Burn to the foes round it. Its talents (Kindling, Wildfire, Searing, Afterburn, Comet Shower) are here. */
import { angTo, dist } from '../core/math';
import { rng } from '../core/rng';
import { AB, fillerMul } from '../content/roles';
import { BURN } from '../content/talents';
import { S } from './state.js';
import { LAST, aggro, bits, chillBoss, dots, fx, fxText, hurtMob, sfx, shake } from './entities.js';
import { interruptCast } from './mobs.js';
import { autoTarget, bestCluster, clampRange, engaged, foesNear, isFoe, later, loud, spawnThrall } from './heroes.js';
import { cometGadgets, gearMul, icicleGadgets } from './gadgets.js';
import { icicleShatter, payoff, trail } from './buttons.js';

const has = (h, id) => !!(h && h.tal && h.tal.has(id));
export const FIRE_COL = '#FF8A3D';
/** how hard a Combust hits (and with Shatterlance): a boss burns all fight, so his is less than a Chill's half
 *  again, and a pack burns from one Firestorm, so its is less than a Shatter's double */
export const COMBUST = 1.75, COMBUST_LANCE = 2.5, BOSS_COMBUST = 1.2, BOSS_COMBUST_LANCE = 1.5;

/* ---------- Burn ---------- */
/** a foe's Burn stacks now (0 when it isn't burning) */
export const burnOf = (m) => (m.burn && m.burn.left > 0 ? m.burn.n : 0);
/** Add Burn to a foe: `k` stacks, up to five (seven with Kindling), and it starts again from full */
export function addBurn(h, m, k) {
  if (!m.alive || m.cage || m.M.wisp || m.M.thing) return;
  const max = has(h, 'fi.kindling') ? BURN.kindling : BURN.max;
  const n = Math.min(max, burnOf(m) + k);
  m.burn = { src: h, n, left: BURN.dur, next: m.burn && m.burn.left > 0 ? m.burn.next : BURN.every };
}
/** Ticks a foe's Burn. True if it died. */
export function burnTick(m, dt) {
  const b = m.burn;
  if (!b || b.left <= 0) return false;
  b.left -= dt; b.next -= dt;
  if (b.next <= 0) {
    b.next += BURN.every;
    hurtMob(m, BURN.per * b.n, b.src, { col: '#FFB347', size: 15, noCrit: true, tier: 'tick', key: 'burn' });
    if (rng() < 0.6) bits(m.x + (rng() - 0.5) * m.r, m.y - 30 - rng() * 30, 'ember', 1, 60);
    if (!m.alive) return true;
  }
  return false;
}
/** Wildfire: a foe that dies burning gives its Burn to every foe near it */
export function onBurnDeath(m) {
  const b = m.burn;
  if (!b || b.left <= 0 || !has(b.src, 'fi.wildfire')) return;
  let n = 0;
  for (const o of foesNear(m.x, m.y, 130, false)) if (o !== m && !o.cage) { addBurn(b.src, o, b.n); n++; }
  if (n) { fx({ type: 'ring', x: m.x, y: m.y, r0: 16, r1: 130, col: FIRE_COL, dur: 0.3, w: 6, ground: true }); bits(m.x, m.y - 30, 'ember', 6, 200); }
}

/* ---------- Firebolt (Icicle's button) ---------- */
/** Firebolt: an instant bolt at your target, every beat */
function firebolt(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (!t || dist(h, t) > 520) { if (loud(h)) fxText(h.x, h.y - 100, 'No target', '#FFD2A0', 16); return false; }
  h.face = angTo(h, t); h.lunge = 0.12; h.lungeA = h.face;
  S.projs.push({ team: 'hero', kind: 'firebolt', x: h.x + Math.cos(h.face) * 18, y: h.y + Math.sin(h.face) * 8, z: 56, sp: 'bolt_fire', src: h, tgt: t, speed: 1100, life: 1.5, big: true, col: trail(h, '#FFB347') });
  sfx('firebolt', 0.7);
  return true;
}
/** a Firebolt arrives: it Flares (three times as hard, half again on a boss) when a crit has primed it, or on a
 *  frozen, Chilled or Exposed foe, as Icicle Shatters; it adds a Burn, two on a crit */
export function fireboltHit(h, t) {
  const { k, primed } = icicleShatter(h, t), flares = k > 1;
  if (primed) h.shatter--;
  const searing = has(h, 'fi.searing') && burnOf(t) >= BURN.max ? 1.2 : 1;
  const got = hurtMob(t, AB.dps.a4.hit * fillerMul(h.bonuses) * k * searing, h, { crit: 0.25, col: flares ? '#FFB347' : '#FFD2A0', tier: flares ? 'payoff' : 'filler', shard: 'ember', key: 'firebolt' });
  const crit = LAST.crit;
  if (crit && !flares) { h.shatter = Math.max(h.shatter, 1); if (h.isPlayer) fxText(h.x, h.y - 130, 'Flare ready', '#FFB347', 18, { dur: 0.9 }); }
  if (t.alive) addBurn(h, t, crit ? 2 : 1);
  icicleGadgets(h, t, flares);
  // Splinter (30% of the hit) and the Rimebone Crown (15) splash a second foe, as they do for Icicle
  const o = S.mobs.find((m) => m !== t && isFoe(m) && engaged(m) && !m.cage && !m.M.thing && dist(m, t) < 200);
  if (o && got > 0 && h.traits.has('splinter')) hurtMob(o, got * 0.3, h, { raw: true, col: '#FFD2A0', size: 17, noCrit: true, tier: 'tick' });
  if (o && h.bonuses.has('rb_helm')) hurtMob(o, 15, h, { col: '#FFD2A0', size: 17, noCrit: true, tier: 'tick' });
  if (flares) payoff(h, 'Flare!', t.x, t.y - (t.isBoss ? 210 : 130), '#FFB347');
  if (!flares) sfx('firehit', 0.5);
  sfx('thud', 0.35);
  bits(t.x, t.y - 40, 'ember', flares ? 7 : 3, 180);
}

/* ---------- Comet, burning ---------- */
/** a burning Comet lands: on a foe with 3 or more Burn (or frozen, Chilled or Exposed) it Combusts, and its Burn
 *  spreads to the foes round it */
export function fireCometLand(h, t, cd) {
  const tx = t.x, ty = t.y;
  fx({ type: 'comet', x: tx, y: ty, dur: 0.32, sp: 'comet_fire' });
  sfx('whoosh');
  later(0.32, () => {
    const n = t.alive ? burnOf(t) : 0;
    const combust = t.alive && (n >= BURN.combust || t.exposed > 0 || t.st.freeze > 0 || t.st.chill > 0);
    const lance = h.traits.has('shatterlance');
    // a boss burns all fight, so his Combust is a quarter, not the half a Chill gives for a while
    const k = !combust ? 1 : t.isBoss ? (lance ? BOSS_COMBUST_LANCE : BOSS_COMBUST) : (lance ? COMBUST_LANCE : COMBUST);
    if (t.alive) hurtMob(t, AB.dps.a3.hit * gearMul(h, 'comet') * k, h, { crit: 0.15, col: combust ? '#FFB347' : '#FFD2A0', tier: combust ? 'payoff' : 'hit', shard: 'ember', key: 'comet' });
    const splash = foesNear(tx, ty, 90, false).filter((o) => o !== t && !o.cage);
    for (const o of splash) hurtMob(o, 114, h, { size: 19, key: 'comet' });
    if (combust) {
      payoff(h, 'Combust!', tx, ty - (t.isBoss ? 230 : 150), '#FFB347');
      // its Burn spreads to the foes round it (at least the 3 it took)
      for (const o of foesNear(tx, ty, 130, false)) if (o !== t && !o.cage && burnOf(o) < Math.max(n, BURN.combust)) addBurn(h, o, Math.max(n, BURN.combust) - burnOf(o));
      if (h.bonuses.has('rimebone2')) h.cd.a3 = Math.min(h.cd.a3, cd / 2);
      // Afterburn: the ground where it Combusted burns for 4 seconds
      if (has(h, 'fi.afterburn')) S.zones.push({ kind: 'firestorm', x: tx, y: ty, r: 95, t: 0, dur: 4, tick: 0.5, tickT: 0.25, val: 12, src: h, seed: rng() * 100 });
    } else if (t.alive) addBurn(h, t, 1);
    // the Gravefrost Staff is frost whatever you cast: its Comet freezes (a boss is Chilled)
    if (h.unique === 'gravefrost') for (const o of [t, ...splash]) { if (!o.alive) continue; if (o.isBoss) { o.st.slow = Math.max(o.st.slow, 0.4); o.st.slowT = 2; chillBoss(o, 2); } else if (!o.M.wisp) { o.st.freeze = Math.max(o.st.freeze, 2); o.wind = 0; } }
    cometGadgets(h, t, tx, ty, combust);
    if (has(h, 'fi.shower')) shower(h, t, tx, ty);
    fx({ type: 'ring', x: tx, y: ty, r0: 20, r1: 110, col: FIRE_COL, dur: 0.3, w: 8, ground: true });
    bits(tx, ty - 20, 'ember', 14, 320);
    dots(tx, ty - 30, '#FFB347', 10, 220);
    if (h.isPlayer) shake(combust ? 4 : 2);
    sfx('comet'); if (combust) sfx('combust', h.isPlayer ? 0.85 : 0.5);
  });
}
/** Comet Shower: two small comets, each a quarter as strong, on foes near the first (or the same one) */
function shower(h, t, tx, ty) {
  const near = foesNear(tx, ty, 260, false).filter((o) => !o.cage && !o.M.thing);
  for (let i = 0; i < 2; i++) {
    const o = near.length ? near[(i + 1) % near.length] : t;
    if (!o) continue;
    later(0.18 + i * 0.14, () => {
      const x = o.alive ? o.x : tx, y = o.alive ? o.y : ty;
      fx({ type: 'comet', x, y, dur: 0.24, sp: 'comet_fire', small: true });
      later(0.24, () => {
        if (o.alive) { hurtMob(o, AB.dps.a3.hit * gearMul(h, 'comet') * 0.25 * (burnOf(o) >= BURN.combust ? (o.isBoss ? BOSS_COMBUST : COMBUST) : 1), h, { crit: 0.15, col: '#FFD2A0', size: 22, key: 'shower' }); addBurn(h, o, 1); }
        fx({ type: 'ring', x, y, r0: 12, r1: 70, col: FIRE_COL, dur: 0.25, w: 6, ground: true });
        bits(x, y - 20, 'ember', 6, 200);
        sfx('thud', 0.4);
      });
    });
  }
}

/* ---------- Firestorm (Blizzard's button) ---------- */
function firestorm(h, aim) {
  let p = null;
  if (aim && aim.x !== undefined && !aim.kind) p = clampRange(h, aim.x, aim.y, 520);
  else { const c = bestCluster(h, 120, 560); if (c) p = { x: c.x, y: c.y }; else { const t = autoTarget(h); if (t) p = { x: t.x, y: t.y }; } }
  if (!p) { if (loud(h)) fxText(h.x, h.y - 100, 'Nothing to burn', '#FFD2A0', 16); return false; }
  p = clampRange(h, p.x, p.y, 520);
  // the Rimebone Robe and the set's three pieces make it hit harder (and the three raise a frost skeleton in it)
  const chestMul = h.bonuses.has('rb_chest') ? 1.25 : 1, rb3Mul = h.bonuses.has('rimebone3') ? 1.3 : 1;
  S.zones.push({ kind: 'firestorm', x: p.x, y: p.y, r: 124, t: 0, dur: 5 + (h.bonuses.has('rb_chest') ? 1 : 0), tick: 0.5, tickT: 0.15, val: Math.round(16 * chestMul * rb3Mul), src: h, seed: rng() * 100 });
  if (h.bonuses.has('rimebone3')) spawnThrall(h, 'frost', p.x, p.y + 24, 6);
  h.face = Math.atan2(p.y - h.y, p.x - h.x); h.lunge = 0.14; h.lungeA = h.face;
  sfx('firestorm', 0.6); sfx('whoosh', 0.4);
  return true;
}
/** a Firestorm's tick: it hits everything in it, and every other tick adds a Burn (one a second) */
export function firestormTick(z) {
  z.n = (z.n || 0) + 1;
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || Math.hypot(m.x - z.x, m.y - z.y) > z.r + m.r * 0.5) continue;
    hurtMob(m, z.val || 16, z.src, { crit: 0.06, size: 17, col: '#FFD2A0', tier: 'tick', key: 'firestorm' });
    if (m.alive && z.n % 2 === 1) addBurn(z.src, m, 1);
  }
}

/* ---------- Ember burst (Rime burst's button) ---------- */
function emberBurst(h) {
  const R = AB.dps.a2.range;
  const shMul = (h.bonuses.has('rb_shoulders') ? 1.4 : 1) * gearMul(h, 'nova');
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || dist(m, h) > R + m.r) continue;
    aggro(m, h, 0);
    hurtMob(m, 50 * shMul, h, { col: '#FFD2A0', key: 'nova' });
    if (!m.alive || m.M.thing) continue;
    // it stops casts, a boss's too
    if (m.cast) interruptCast(m, h);
    // and knocks the small ones back, away from you
    if (!m.isBoss && !m.M.big && !m.M.wisp) { const a = angTo(h, m); m.st.kx += Math.cos(a) * 260; m.st.ky += Math.sin(a) * 260; m.wind = 0; }
    addBurn(h, m, 2);
  }
  if (h.bonuses.has('rb_shoulders')) h.cd.a3 = Math.max(0, h.cd.a3 - 1.5);
  if (h.unique === 'gravefrost') {
    // the Gravefrost Staff: your next two Firebolts Flare, and a frost storm swirls round you
    h.shatter = Math.max(h.shatter, 2);
    S.zones.push({ kind: 'blizzard', x: h.x, y: h.y, r: 125, t: 0, dur: 3, tick: 0.5, tickT: 0.15, val: 20, src: h, seed: rng() * 100 });
  }
  fx({ type: 'nova', x: h.x, y: h.y, r: R, dur: 0.45, fire: true });
  bits(h.x, h.y - 20, 'ember', 12, 300);
  sfx('emberburst', 0.7); sfx('thud', 0.5);
  if (h.isPlayer) shake(2);
  return true;
}

/** Fire's buttons by the key of the button each one is: heroes.js fires these for a Fire mage */
export const FIRE_BUTTONS = { icicle: firebolt, blizzard: firestorm, nova: emberBurst };
