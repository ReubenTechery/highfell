/* ---------- the rogue's buttons: Viper Blades, Shadowstrike, Fan of Blades, Shadowstep ----------
   Points (h.points, five at most): Viper Blades adds one (two on a crit), Fan of Blades one, Shadowstep two;
   Shadowstrike spends them all, POINT a point. A rogue's crits hit ROGUE_CRIT times as hard (entities.js): its
   crits are its big numbers. Venom's and Blades' talents are in here, from specs.js. buttons.js lists these
   with the other classes' buttons. */
import { angTo, dist } from '../core/math';
import { AB, fillerMul } from '../content/roles';
import { RARITY } from '../content/gear';
import { S } from './state.js';
import { LAST, dots, fx, fxText, healHero, hurtMob, sfx } from './entities.js';
import { interruptCast } from './mobs.js';
import { canStand } from './world.js';
import { ambushGadgets, critSpark, gearMul, stepGadgets, viperGadgets } from './gadgets.js';
import { applyBleed, autoTarget, isFoe, later, loud, nearestFoe, spawnThrall } from './heroes.js';
import { deathMark, fanVenom, has, scatter, sweepFoes, toxicBurst } from './specs.js';

/** Shadowstrike's damage a point, and the most points a rogue holds */
export const POINT = 28, MAX_POINTS = 5;
/** a payoff of yours lands: its word and its sound (the hit itself feels like one: entities.js FEEL) */
function payoff(h, word, x, y, col) {
  if (!h.isPlayer) return;
  fxText(x, y, word, col || '#FFE08A', 30, { dur: 0.95 });
  sfx('finish', 0.9);
}
/** the filler's swing trail takes the weapon's rarity colour (Common keeps the class's own) */
const trail = (h, base) => (h.weaponRar >= 1 ? RARITY[h.weaponRar].color : base);

function addPoints(h, n) { h.points = Math.min(MAX_POINTS, (h.points || 0) + n); }
/** is this foe Exposed, with your one five-point Shadowstrike of the window still to come? */
export const burnable = (h, t) => t.exposed > 0 && !(t.burned && t.burned.has(h.id));
function rogueMeleeTarget(h, aim, maxRange) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (!t || dist(h, t) > h.r + t.r + maxRange) t = nearestFoe(h, maxRange, false);
  return t && dist(h, t) <= h.r + t.r + maxRange ? t : null;
}
/* Viper Blades: the filler, a twin-dagger slash that poisons and adds a point (two on a crit). With Sweeping
   Blades it slashes every foe in front of you; only its target gives points. */
function abViper(h, aim) {
  const t = rogueMeleeTarget(h, aim, 78);
  if (!t) { if (loud(h)) fxText(h.x, h.y - 100, 'Too far', '#7CF06A', 16); return false; }
  h.face = angTo(h, t); h.lunge = 0.18; h.lungeA = h.face; h.swingT = 0.2;
  const hit = AB.rogue.a1.hit * fillerMul(h.bonuses);
  hurtMob(t, hit, h, { crit: 0.22, col: '#7CF06A', tier: 'filler', key: 'viper' });
  const crit = LAST.crit;
  if (t.alive) applyBleed(h, t);
  if (!t.cage) addPoints(h, crit ? 2 : 1);
  for (const o of sweepFoes(h, t)) { hurtMob(o, hit, h, { crit: 0.22, col: '#7CF06A', tier: 'filler', key: 'sweep' }); if (o.alive) applyBleed(h, o); }
  // the set's crit sparks, scaled for a filler (it crits far more often than Shadowstrike)
  if (crit && h.bonuses.has('shadeveil2') && t.alive) hurtMob(t, 24, h, { col: '#B79CFF', size: 19, noCrit: true });
  if (crit) critSpark(h, t, 24);
  viperGadgets(h, t);
  fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: has(h, 'bl.sweep') ? 92 : 68, dur: 0.2, col: trail(h, '#7CF06A'), dir: (h.swingDir = -(h.swingDir || 1)), ...(has(h, 'bl.sweep') ? { wide: true } : {}) });
  dots(t.x, t.y - 40, '#7CF06A', 6, 130);
  sfx('sweep', 0.6); sfx('bladehit', 0.7);
  return true;
}
/* Shadowstrike: spends every point on one strike (POINT a point); on a poisoned foe it always crits and hits
   35% harder; on an Exposed one it hits as if you had five. Venom: Toxic Burst, Ruthless, Twin Fangs; Blades:
   Scatter. */
function abAmbush(h, aim) {
  const t = rogueMeleeTarget(h, aim, 84);
  if (!t) { if (loud(h)) fxText(h.x, h.y - 100, 'Too far', '#FF6B6B', 16); return false; }
  // an Exposed foe takes one Shadowstrike of yours as if you had five points (one a window: it's a burn, not a loop)
  const free = burnable(h, t);
  const pts = free ? MAX_POINTS : h.points || 0;
  if (pts < 1) { if (loud(h)) fxText(h.x, h.y - 100, 'No points', '#FF6B6B', 16); return false; }
  const bleeding = !!(t.bleed && t.bleed.left > 0);
  const full = pts >= MAX_POINTS;
  h.face = angTo(h, t); h.lunge = 0.22; h.lungeA = h.face; h.swingT = 0.24;
  const helmMul = (h.bonuses.has('sv_helm') ? 1.25 : 1) * gearMul(h, 'ambush');
  const nsMul = h.nightstalkerT > 0 ? 1.3 : 1;
  h.nightstalkerT = 0;
  const dmg = POINT * pts * helmMul * nsMul * (bleeding ? 1.35 : 1);
  const strike = () => hurtMob(t, dmg, h, { crit: bleeding ? 1 : 0.35, col: bleeding ? '#FF6B6B' : '#FFE08A', tier: full ? 'payoff' : 'hit', key: free ? 'strike_free' : 'strike' });
  strike();
  const crit = LAST.crit;
  h.points = 0;
  if (free) (t.burned ||= new Set()).add(h.id);
  // Venomrush: a poisoned Shadowstrike gives a point back; Ruthless: a five-point one gives one
  if (bleeding && h.traits.has('arterial')) addPoints(h, 1);
  if (full && has(h, 've.ruthless')) addPoints(h, 1);
  if (crit && h.bonuses.has('sv_helm')) healHero(h, h, 25, { size: 16 });
  if (crit && h.bonuses.has('shadeveil2') && t.alive) hurtMob(t, 55, h, { col: '#B79CFF', size: 19, noCrit: true });
  if (crit) critSpark(h, t, 55);
  if (bleeding) toxicBurst(h, t);
  scatter(h, t, dmg);
  ambushGadgets(h, t);
  // Twin Fangs: every other five-point Shadowstrike strikes again a moment later
  if (full && has(h, 've.fangs') && (h.fangs = !h.fangs)) later(0.16, () => { if (t.alive && h.alive) { strike(); fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: 84, dur: 0.22, col: '#FF6B6B', crush: true, dir: -1 }); sfx('bladehit', 0.8); } });
  if (full) payoff(h, 'Shadowstrike!', t.x, t.y - 140, '#FF6B6B');
  fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: 78, dur: 0.22, col: '#FF6B6B', crush: full });
  dots(t.x, t.y - 44, '#FF6B6B', 8, 160);
  sfx('thud', 0.8); sfx('bladehit', 0.8);
  return true;
}
/* Fan of Blades: a spin round you that stops casts, refreshes venom (poisons all with Venom Spray) and adds a
   point if it hits */
function abFlurry(h) {
  const R = 140 * (h.bonuses.has('gs_shoulders') ? 1.25 : 1), fanMul = gearMul(h, 'flurry');
  h.whirlDur = 0.28; h.whirlT = 0.28;
  let hit = false;
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || dist(m, h) > R + m.r) continue;
    if (m.cast) interruptCast(m, h);
    hurtMob(m, 50 * fanMul, h, { col: '#D7DEE6', size: 18, key: 'fan' });
    if (!m.M.thing) hit = true;
    fanVenom(h, m);
  }
  if (hit) addPoints(h, 1);
  fx({ type: 'whirl', h, x: h.x, y: h.y, r: R, dur: 0.28, col: '#B79CFF' });
  fx({ type: 'ring', x: h.x, y: h.y - 26, r0: 18, r1: R, col: '#D7DEE6', dur: 0.24, w: 5 });
  sfx('sweep', 0.8);
  return true;
}
/* Shadowstep: blink behind your target, strike it, stop its cast, swing faster for a while, and gain two points
   (three with the Cryptfangs, and one more with the Shadeveil Spaulders). Death Mark marks it; Knife Storm makes
   your swings hit everything round you for 4 seconds. */
function abShadowstep(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (!t || dist(h, t) > 380) t = nearestFoe(h, 380, false);
  if (!t || dist(h, t) > 380) { if (loud(h)) fxText(h.x, h.y - 100, 'No target', '#B79CFF', 16); return false; }
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
  if (t.cast) interruptCast(t, h);
  const shMul = h.bonuses.has('sv_shoulders') ? 1.35 : 1;
  hurtMob(t, 70 * shMul, h, { crit: 0.25, col: '#B79CFF', key: 'step' });
  stepGadgets(h, ox, oy);
  if (h.bonuses.has('shadeveil3')) {
    spawnThrall(h, 'shade', h.x - Math.cos(h.face) * 28, h.y - Math.sin(h.face) * 18, 6);
    if (h.isPlayer) fxText(h.x, h.y - 125, 'Shadow Twin!', '#B79CFF', 20);
  }
  h.frenzyT = 3.8;
  if (h.traits.has('nightstalker')) h.nightstalkerT = 3.5;
  deathMark(h, t);
  if (has(h, 'bl.storm')) { h.stormT = 4; if (h.isPlayer) fxText(h.x, h.y - 125, 'Knife Storm!', '#B79CFF', 20); }
  addPoints(h, 2 + (h.unique === 'cryptfangs' ? 1 : 0) + (h.bonuses.has('sv_shoulders') ? 1 : 0));
  h.picked = t.alive ? t : null;
  sfx('dodge', 0.8); sfx('swing', 0.7);
  return true;
}

export const ROGUE_BUTTONS = { viper: abViper, ambush: abAmbush, flurry: abFlurry, shadowstep: abShadowstep };
