/* ---------- buttons: what each class's four buttons (and Mend) do ----------
   Every class has a filler (no cooldown, once a beat: Cleave, Smite, Icicle, Viper Blades), a payoff it sets
   up, and two cooldowns. The payoffs:
     tank    Crush (1.6×): the Cleave after a Charge, a Slam, a perfect block or a Cleave crit (h.crush counts the
             ones primed); a stunned, Staggered or Exposed foe is always Crushed
     healer  a Smite crit makes the next Mend free and half again as big (h.mendUp: the party frames glow)
     mage    Shatter: Icicle hits a frozen foe 3× and a Chilled boss 1.5× (Comet 2× and 1.5×); an Icicle crit makes
             the next Icicle Shatter anything (h.shatter counts the ones primed)
     rogue   points (h.points, five at most): Viper Blades adds one (two on a crit), Fan of Blades one, Shadowstep
             two; Shadowstrike spends them all, 28 a point (a rogue's crits are 2.5×)
   Exposed (+35% damage taken) is every payoff's setup: Cleave Crushes, Icicle and Comet Shatter as on a Chilled
   boss, Shadowstrike hits as if you had five points, and Smite heals double.
   heroes.js fires these (useAbility); press.js times the player's presses; bots.js picks the bots'. The rogue's
   four are rogue.js; the ranger's are ranger.js; Fire's are fire.js; what talents change in each is specs.js. */
import { angDiff, angTo, dist } from '../core/math';
import { rng } from '../core/rng';
import { AB, BEAT, MEND, fillerMul } from '../content/roles';
import { RARITY } from '../content/gear';
import { HOOKS, S } from './state.js';
import { CHILL, CHILL_SHATTER, LAST, SHATTERLANCE_CHILL, STAGGER, addThreat, aggro, banner, bits, chillBoss, dots, fx, fxText, healHero, hold, hurtMob, say, sfx, shake, staggerBoss, stunned, taunt } from './entities.js';
import { interruptCast, liftCurse } from './mobs.js';
import { moveEnt } from './world.js';
import { blockGadgets, chargeGadgets, cleaveGadgets, cometGadgets, gearMul, icicleGadgets, mendGadgets, slamGadgets, sunburstGadgets, wardGadgets } from './gadgets.js';
import { autoTarget, bestCluster, bombInReach, clampRange, engaged, foesNear, heroBy, isFoe, later, loud, mostHurt, nearestFoe, spawnThrall } from './heroes.js';
import { ROGUE_BUTTONS } from './rogue.js';
import { RANGER_BUTTONS } from './ranger.js';
import { fireboltHit, fireCometLand } from './fire.js';
import { axeStorm, breach, bulwarkMul, bulwarkPull, chargeCrushes, circleFollows, dawn, finalWord, finish, flashpoint, hailTarget, hardRime, has, hearten, longWinter, miracle, mendMul, onCrush, onPerfect, onSlam, overflow, paybackStun, rallyWard, rimStrike, savageMul, shardburst, slamReach, smiteHealTargets, smiteSear, stunHit, sunlanceTarget, sunpillar, sunstrike, takePayback, twiceStruck, twinWard, unbowed, wideWinter } from './specs.js';
export { POINT, MAX_POINTS, burnable } from './rogue.js';

/** Cleave's Crush */
export const CRUSH = 1.6;
/** each class's payoff sound, layered over the hit (sound.ts) */
const PAYOFF = { warrior: 'crush', cleric: 'bless', mage: 'shatter', rogue: 'finish' };

/** a payoff of yours lands: its word and its sound (the hit itself feels like one: entities.js FEEL) */
export function payoff(h, word, x, y, col) {
  if (!h.isPlayer) return;
  fxText(x, y, word, col || '#FFE08A', 30, { dur: 0.95 });
  sfx(PAYOFF[h.cls] || 'crush', 0.9);
}
/** the filler's swing trail takes the weapon's rarity colour (Common keeps the class's own) */
export const trail = (h, base) => (h.weaponRar >= 1 ? RARITY[h.weaponRar].color : base);

/* ---------- the tank: Cleave, Charge, Slam, the shield ---------- */
/** will this Cleave Crush this foe? (a primed Cleave Crushes everything it hits) */
export const crushes = (h, m) => h.crush > 0 || stunned(m) || m.exposed > 0;

function abCleave(h, aim) {
  const t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (t && dist(h, t) < 220) h.face = angTo(h, t);
  const wide = h.traits.has('wide');
  const primed = h.crush > 0;
  // Payback (a perfect block readied it): three times as hard, and it stuns; Axe Storm: a primed Cleave sweeps
  // all the way round and its Crushes hit 15% harder
  const back = takePayback(h), storm = axeStorm(h, primed);
  const hits = foesNear(h.x, h.y, 126, false).filter((m) => !m.cage && (storm || Math.abs(angDiff(h.face, angTo(h, m))) < (wide ? 1.42 : 1.25)));
  if (primed) h.crush--;
  // Bulwark: the foes the last Slam pulled make this Cleave harder; Rim Strike: every third Cleave stuns
  const mul = fillerMul(h.bonuses) * (hits.length ? bulwarkMul(h) : 1), hit = AB.tank.a1.hit, rim = hits.length > 0 && rimStrike(h);
  let crushed = 0, critPrime = false, dealt = 0;
  for (const m of hits) {
    const c = back || primed || stunned(m) || m.exposed > 0;
    // Final Word: a Crush on a foe under a fifth of its health finishes it (a boss takes it twice as hard)
    const last = c && !back && finalWord(h, m);
    const k = (back ? 3 : c ? CRUSH * (storm ? 1.15 : 1) : 1) * savageMul(h, m) * (last && m.isBoss ? 2 : 1);
    // Cleave is the tank's threat engine: 2× threat, a Crush 3×, so a mage's Comet on an Exposed boss can't take him
    const got = hurtMob(m, hit * mul * k, h, { knock: c ? 130 : 80, crit: 0.2, threat: c ? 3 : 2, tier: c ? 'payoff' : 'filler', key: back ? 'payback' : c ? 'crush' : 'cleave' });
    if (c) { crushed++; dealt += got; }
    else if (LAST.crit) critPrime = true;
    if (back) paybackStun(m);
    if (last) finish(h, m, 'Final Word!');
    if (rim) stunHit(m, 1);
  }
  if (rim && h.isPlayer) fxText(h.x, h.y - 130, 'Rim Strike!', '#C9D2DC', 18, { dur: 0.8 });
  // a Cleave crit primes the next Cleave's Crush (a Crush's own crit doesn't chain)
  if (critPrime) h.crush = Math.max(h.crush, 1);
  if (crushed) onCrush(h, dealt);
  cleaveGadgets(h, hits, hit * mul * (crushed ? CRUSH : 1));
  if (hits.length > 0 && h.bonuses.has('bg_helm')) healHero(h, h, 11, { size: 17 });
  // the axe swings left, then right
  h.swingDir = (h.swingDir || 1) > 0 ? -1 : 1;
  h.lunge = 0.22; h.lungeA = h.face; h.swingT = 0.24; h.atkT = Math.max(h.atkT, 0.5); h.blocking = false;
  if (storm) fx({ type: 'whirl', h, x: h.x, y: h.y, r: 126, dur: 0.3, col: '#F2C230' });
  else fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: crushed ? 114 : 100, dur: 0.25, col: crushed ? '#F2C230' : trail(h, '#FFE08A'), wide: true, crush: crushed > 0, dir: h.swingDir });
  sfx('sweep', 0.8);
  if (hits.length) {
    sfx('axehit', Math.min(1, 0.55 + hits.length * 0.12));
    bits(h.x + Math.cos(h.face) * 56, h.y + Math.sin(h.face) * 34 - 24, 'shard_bone', crushed ? 6 : 3, 210);
  }
  if (crushed) payoff(h, back ? 'Payback!' : storm ? 'Axe Storm!' : 'Crush!', h.x + Math.cos(h.face) * 58, h.y + Math.sin(h.face) * 35 - 112);
  if (h.unique === 'gravedigger' && ++h.cleaves % 8 === 0) gravedig(h);
  return true;
}
/* The Gravedigger: every eighth Cleave digs in, stunning what's round you (a boss staggers) */
function gravedig(h) {
  for (const m of foesNear(h.x, h.y, 120, false)) { if (m.cage) continue; hurtMob(m, 30, h, { size: 17 }); if (m.isBoss) staggerBoss(m, STAGGER); else { m.st.stun = Math.max(m.st.stun, 1); m.wind = 0; } }
  fx({ type: 'ring', x: h.x, y: h.y, r0: 20, r1: 130, col: '#C9B79A', dur: 0.3, w: 8, ground: true });
  bits(h.x, h.y, 'shard_dirt', 8, 220); sfx('thud');
  if (h.isPlayer) shake(3);
}

/* Slam: drag everything around you in, make it turn on you, spin a whirlwind through the pack, and prime Crush */
function abSlam(h) {
  let n = 0;
  const R = 210 * slamReach(h), wR = 118;
  const chestMul = (h.bonuses.has('bg_chest') ? 1.35 : 1) * gearMul(h, 'slam');
  // Unbowed: with three or more on you, the Slam and its whirlwind hit twice as hard
  const pull = S.mobs.filter((m) => isFoe(m) && !m.cage && !m.M.wisp && dist(m, h) <= R + m.r && Math.abs(m.y - h.y) <= 600);
  const unbow = has(h, 'sh.unbowed') && pull.length >= 3 ? 2 : 1;
  for (const m of pull) {
    taunt(m, h, 4);
    hurtMob(m, 50 * chestMul * unbow, h, { threat: 2, key: 'slam' });
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
  h.crush = Math.max(h.crush, 1);
  onSlam(h);
  bulwarkPull(h, n);
  slamGadgets(h, n);
  say(h, n ? (rng() < 0.5 ? 'Oi!' : 'Over here!') : 'Oi?', 0.9);
  // an inward ring, then the whirlwind
  fx({ type: 'ring', x: h.x, y: h.y, r0: R + 12, r1: 24, col: '#F2C230', dur: 0.25, w: 9, ground: true });
  dots(h.x, h.y, '#C9B79A', 10, 200);
  if (n && h.isPlayer) shake(2.5);
  sfx('slam', 0.7); sfx('taunt');
  h.whirlDur = 0.42;
  h.whirlT = h.whirlDur;
  fx({ type: 'whirl', h, x: h.x, y: h.y, r: wR, dur: h.whirlDur, col: '#F2C230' });
  // Spinning Axe: the whirlwind hits twice as hard; Unbowed: twice as hard again with three or more foes on you
  const spin = (has(h, 'ax.spin') ? 2 : 1) * Math.max(unbow, unbowed(h) ? 2 : 1);
  const spinSlice = (finalSpin) => {
    if (!h.alive || S.over) return;
    sfx('sweep', 0.65);
    let hitAny = false;
    for (const m of S.mobs) {
      if (!isFoe(m) || m.cage || m.M.wisp || dist(m, h) > wR + m.r) continue;
      hurtMob(m, 14 * chestMul * spin, h, { noCrit: spin === 1, threat: 2, knock: finalSpin ? 55 : 25, size: 17, tier: 'tick', key: 'slam' });
      hitAny = true;
    }
    if (hitAny) bits(h.x, h.y - 28, 'shard_bone', 4, 170);
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

function abCharge(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : null;
  if (!t) {
    let bd = 1e9;
    for (const m of S.mobs) {
      if (!isFoe(m) || m.cage || !engaged(m) || m.M.wisp) continue;
      const d = dist(h, m); if (d > 420) continue;
      const score = d - (m.target && m.target !== h ? 300 : 0) - (m.cast && m.cast.kick ? 260 : 0);
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
export function dashTick(h, dt) {
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
    hurtMob(m, hitDmg, h, { knock: 160, key: 'charge' });
    // the mob you charged turns on you; Ringing Charge makes everything you hit turn
    if (ring) hurtMob(m, hitDmg, h, { knock: 60 });
    if (ring || m === d.mob) taunt(m, h, 2.5);
    addThreat(m, h, 260);
    // it stops a cast, a boss's too (a boss only staggers)
    if (m.cast) interruptCast(m, h);
    if (m.isBoss) staggerBoss(m, STAGGER);
    else { m.st.stun = Math.max(m.st.stun, stunDur); m.wind = 0; }
    breach(h, m);
  }
  if (h.bonuses.has('bg_shoulders')) {
    h.absorb = Math.max(h.absorb, Math.round(80 * h.power));
    h.absorbT = Math.max(h.absorbT, 5);
    if (h.isPlayer) fxText(h.x, h.y - 116, 'Skull Guard', '#FFE08A', 18);
  }
  chargeGadgets(h);
  // Charge primes Crush (Headlong two); the Gravedigger one more
  h.crush = Math.max(h.crush, chargeCrushes(h) + (h.unique === 'gravedigger' ? 1 : 0));
  if (d.mob) h.picked = d.mob.alive ? d.mob : null;
  fx({ type: 'ring', x: h.x, y: h.y, r0: 16, r1: 108, col: '#F2C230', dur: 0.28, w: 9, ground: true });
  dots(h.x, h.y, '#C9B79A', 10, 180);
  bits(h.x, h.y - 20, 'shard_dirt', 6, 200);
  if (hits.length) { sfx('thud'); if (h.isPlayer) { shake(2.5); hold(0.045, h, d.mob); } }
}
/** a perfect block hits back, primes Crush and ends the beat (so Cleave fires the moment the shield comes down);
 *  Barrowguard 2pc gives a bone shield */
export function onPerfectBlock(h, src) {
  if (src && src.kind === 'mob' && src.alive) {
    hurtMob(src, 185, h, { col: '#F2C230', size: 26, noCrit: true });
    fx({ type: 'cleave', x: h.x + Math.cos(h.face) * 16, y: h.y - 34, a: h.face, r: 78, dur: 0.22, col: '#F2C230', crush: true });
  }
  h.crush = Math.max(h.crush, 1);
  h.beat = 0;
  onPerfect(h);
  if (h.bonuses.has('barrowguard2')) {
    h.absorb = Math.max(h.absorb, Math.round(150 * h.power));
    h.absorbT = 6;
    if (h.isPlayer) fxText(h.x, h.y - 120, 'Bone shield', '#FFE08A', 18);
  }
  blockGadgets(h, src);
}

/* ---------- the healer: Mend, Smite, Prayer circle, Ward, Sunburst ---------- */
/** can the healer Mend now? (the beat, or Quick Hands' own short pause, has run out) */
export const mendReady = (h) => h.beat <= 0 && h.gcd <= 0;
/** Mend a mate now, or return false. A tap of yours goes through press.js, which waits out the beat. */
export function mend(h, t) {
  if (!h || !h.alive || h.role !== 'healer' || S.over) return false;
  if (h.st.stun > 0 || h.st.caged || h.st.air > 0 || h.dodgeT > 0) return false;
  if (!t || !t.alive || !mendReady(h)) return false;
  const blessed = h.mendUp;
  const cost = blessed ? 0 : MEND.mana - (h.bonuses.has('sb_helm') ? 2 : 0);
  if (h.mana < cost) { if (loud(h)) banner('Out of mana. Smite gives some back.', 'warn', 1.0); return false; }
  if (dist(h, t) > MEND.range) { if (loud(h)) fxText(h.x, h.y - 100, 'Too far', '#FFE08A', 18); return false; }
  h.mana -= cost;
  // Quick Hands: Mend waits for the beat but never starts it, only its own short pause
  if (h.traits.has('quickhands')) h.gcd = MEND.quick; else h.beat = BEAT.len;
  h.mendUp = false;
  const amt = MEND.heal * gearMul(h, 'mend') * (blessed ? 1.5 : 1) * mendMul(h, t);
  const real = healHero(h, t, amt);
  overflow(h, t, (LAST.healAmt || 0) - real);
  hearten(h, t);
  if (blessed) payoff(h, 'Blessed!', t.x, t.y - 120, '#F2C230');
  if (blessed && h.isPlayer) hold(0.07, h, t);
  mendGadgets(h, t);
  if (h.traits.has('sunflare')) { const o = mostHurt(h, t); if (o && o.hp < o.maxHp) healHero(h, o, amt / 2, { size: 16 }); }
  if (h.bonuses.has('candlewake2')) t.hots.push({ src: h, per: 10, left: 4, next: 1 });
  if (h.unique === 'longnight') { t.absorb = Math.max(t.absorb, Math.round(60 * h.power)); t.absorbT = Math.max(t.absorbT, 6); t.wardBy = h; }
  fx({ type: 'beam', x: h.x, y: h.y - 56, x2: t.x, y2: t.y - 40, col: blessed ? '#F2C230' : '#FFE08A', dur: 0.22 });
  dots(t.x, t.y - 50, '#7BE05A', 5, 90, { up: true });
  if (t !== h) { h.face = angTo(h, t); }
  h.lunge = 0.1; h.lungeA = h.face;
  sfx('heal');
  if (h.isPlayer) HOOKS.pulseFrame(t.role);
  return true;
}
function abCircle(h, aim) {
  let p;
  if (aim && aim.x !== undefined && !aim.kind) p = clampRange(h, aim.x, aim.y, 520);
  else { const t = heroBy('tank'); p = t && t.alive && dist(t, h) < 520 ? { x: t.x, y: t.y } : { x: h.x, y: h.y }; }
  const chestMul = (h.bonuses.has('cw_chest') ? 1.25 : 1) * gearMul(h, 'circle');
  S.zones.push({ kind: 'heal', x: p.x, y: p.y, r: 114, t: 0, dur: 6 + (h.bonuses.has('sb_chest') ? 1 : 0), tick: 0.5, tickT: 0.2, val: Math.round(38 * chestMul), src: h, follow: circleFollows(h, p.x, p.y, 114) });
  sfx('circle');
  return true;
}
function abWard(h, aim) {
  let t = aim && aim.kind === 'hero' && aim.alive ? aim : null;
  if (!t) {
    const tank = heroBy('tank');
    const low = mostHurt(h, null);
    // Rally: with nobody badly hurt, it goes on the mate who hits hardest
    t = low && low.hp / low.maxHp < 0.7 ? low : rallyWard(h) || (tank && tank.alive && dist(tank, h) < MEND.range ? tank : low);
  }
  if (!t || dist(t, h) > MEND.range + 40) return false;
  const shMul = (h.bonuses.has('cw_shoulders') ? 1.3 : 1) * gearMul(h, 'ward');
  t.absorb = Math.max(t.absorb, Math.round(230 * shMul * h.power)); t.absorbT = Math.max(t.absorbT, 8 + (h.bonuses.has('sb_shoulders') ? 2 : 0)); t.wardBy = h;
  twinWard(h, t, Math.round(230 * shMul * h.power), 8);
  wardGadgets(h, t);
  if (h.bonuses.has('cw_shoulders')) healHero(h, t, 45, { size: 17 });
  fx({ type: 'ring', x: t.x, y: t.y - 40, r0: 10, r1: 52, col: '#DDF3FF', dur: 0.3, w: 5 });
  if (h.isPlayer || t.isPlayer) fxText(t.x, t.y - 96, 'Ward', '#DDF3FF', 18);
  fx({ type: 'beam', x: h.x, y: h.y - 50, x2: t.x, y2: t.y - 40, col: '#DDF3FF', dur: 0.25 });
  sfx('ward');
  return true;
}
function abSunburst(h) {
  // Miracle: once a run, a fallen mate in reach comes back first, and gets the heal too
  miracle(h, 470);
  for (const a of S.heroes) {
    if (!a.alive || dist(a, h) > 470) continue;
    healHero(h, a, 210, { show: true });
    a.st.root = 0; a.st.haunt = 0;
    if (a.st.curse) liftCurse(a, h);
    dawn(h, a);
    if (h.unique === 'longnight') {
      a.absorb = Math.max(a.absorb, Math.round(75 * h.power));
      a.absorbT = Math.max(a.absorbT, 6);
      a.wardBy = h;
    }
  }
  if (h.unique === 'longnight') {
    for (const m of foesNear(h.x, h.y, 180, false)) if (!m.cage) hurtMob(m, 90, h, { col: '#FFE08A', size: 19, noCrit: true });
  }
  // Sunpillar: a pillar of light on the tank's target (or yours)
  if (has(h, 'wr.pillar')) sunpillar(h, smiteTarget(h));
  sunburstGadgets(h);
  fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 30, r1: 470, col: '#F2C230', dur: 0.5, w: 9 });
  dots(h.x, h.y - 60, '#FFE08A', 16, 220);
  sfx('sunburst');
  return true;
}

/* ---------- Smite and Icicle: instant shots at your target (a cage takes one a hit, like a swing) ---------- */
function shot(h, aim, kind) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : null;
  if (!t) t = kind === 'smite' ? smiteTarget(h) : autoTarget(h);
  if (!t || dist(h, t) > 520) { if (loud(h)) fxText(h.x, h.y - 100, 'No target', '#DDF3FF', 16); return false; }
  h.face = angTo(h, t); h.lunge = 0.12; h.lungeA = h.face;
  S.projs.push({ team: 'hero', kind, x: h.x + Math.cos(h.face) * 18, y: h.y + Math.sin(h.face) * 8, z: 56, sp: kind === 'smite' ? 'orb_holy' : 'bolt_frost', src: h, tgt: t, speed: kind === 'smite' ? 900 : 1100, life: 1.5, big: true, col: trail(h, kind === 'smite' ? '#FFE08A' : '#DDF3FF') });
  // Hailstorm: a second shard, a third as strong, at another foe
  const o = kind === 'icicle' ? hailTarget(h, t) : null;
  if (o) S.projs.push({ team: 'hero', kind, half: true, x: h.x - Math.sin(h.face) * 14, y: h.y + Math.cos(h.face) * 8, z: 50, sp: 'bolt_frost', src: h, tgt: o, speed: 1000, life: 1.5, col: '#DDF3FF' });
  sfx(kind === 'smite' ? 'smite' : 'icicle', 0.85);
  return true;
}
/* Smite goes for a red bomb in reach first (hit it back), then the tank's target, then whatever is near */
function smiteTarget(h) {
  const bomb = bombInReach(h);
  if (bomb) return bomb;
  const tank = heroBy('tank');
  if (tank && tank.alive && isFoe(tank.target) && dist(h, tank.target) < 520) return tank.target;
  return autoTarget(h);
}
/** a hero's shot arrives */
export function projHit(p) {
  const h = p.src, t = p.tgt;
  if (t.cage) { hurtMob(t, 1, h); return; }
  if (p.kind === 'icicle') icicleHit(h, t, !!p.half);
  else if (p.kind === 'smite') smiteHit(h, t);
  else if (p.kind === 'firebolt') fireboltHit(h, t);
  // a shot that says what it does when it lands (the ranger's arrows, ranger.js)
  else if (p.land) p.land(p);
}
function smiteHit(h, t) {
  const got = hurtMob(t, AB.healer.a4.hit * fillerMul(h.bonuses), h, { col: '#FFE08A', size: 20, tier: 'filler', key: 'smite' });
  const crit = LAST.crit;
  // Twice Struck: every third Smite strikes again a moment later
  if (twiceStruck(h)) later(0.12, () => { if (t.alive && h.alive) hurtMob(t, AB.healer.a4.hit * fillerMul(h.bonuses), h, { col: '#FFE08A', size: 20, tier: 'filler', key: 'twice' }); });
  // Sunlance: it goes on into one more foe, and that hit heals too
  const o = got > 0 ? sunlanceTarget(h, t) : null;
  const more = o ? hurtMob(o, AB.healer.a4.hit * fillerMul(h.bonuses), h, { col: '#FFE08A', size: 18, tier: 'filler', key: 'lance' }) : 0;
  if (o) fx({ type: 'beam', x: t.x, y: t.y - 50, x2: o.x, y2: o.y - 50, col: '#FFE08A', dur: 0.2 });
  // it heals your most hurt mate (with Twin Light the next most hurt too) for half what it dealt (all of it on an
  // Exposed foe)
  for (const low of got > 0 ? smiteHealTargets(h) : []) {
    healHero(h, low, (got + more) * (t.exposed > 0 ? 1 : 0.5), { size: 17, raw: true });
    fx({ type: 'beam', x: t.x, y: t.y - 50, x2: low.x, y2: low.y - 40, col: '#FFE08A', dur: 0.22 });
  }
  smiteSear(h, t);
  if (crit) { sunstrike(h, got); flashpoint(h, t, got); }
  // it pulses your Prayer circles
  for (const z of S.zones) if (z.kind === 'heal' && z.src === h) {
    fx({ type: 'ring', x: z.x, y: z.y, r0: 24, r1: z.r, col: '#FFE08A', dur: 0.28, w: 6, ground: true });
    for (const a of S.heroes) if (a.alive && dist(a, z) <= z.r + a.r && a.hp < a.maxHp) healHero(h, a, 15, { size: 15 });
  }
  h.mana = Math.min(h.maxMana, h.mana + 4 + (h.bonuses.has('cw_helm') ? 1 : 0));
  // a Smite crit blesses the next Mend: free, and half again as big
  if (crit && !h.mendUp) { h.mendUp = true; if (h.isPlayer) fxText(h.x, h.y - 130, 'Mend blessed', '#F2C230', 18, { dur: 0.9 }); }
  sfx('holyhit', 0.6);
  dots(t.x, t.y - 50, '#FFE08A', 6, 120);
}
/** how hard an Icicle Shatters this foe, and whether it takes a primed Shatter to: 3× frozen; 1.5× a Chilled boss
 *  or anything Exposed; else, primed by a crit, as if frozen (a boss as if Chilled). k is 1 when it doesn't. */
export function icicleShatter(h, t) {
  const st = t.st || {};
  const own = st.freeze > 0 ? 3 : st.chill > 0 || t.exposed > 0 ? CHILL_SHATTER : 1;
  if (own > 1 || !(h.shatter > 0)) return { k: own, primed: false };
  return { k: t.isBoss ? CHILL_SHATTER : 3, primed: true };
}
function icicleHit(h, t, half = false) {
  // Hailstorm's second shard is a third as strong, and neither uses up nor primes a Shatter
  const sh = icicleShatter(h, t), primed = sh.primed && !half, k = half && sh.primed ? 1 : sh.k, shatters = k > 1;
  if (primed) h.shatter--;
  const got = hurtMob(t, AB.dps.a4.hit * fillerMul(h.bonuses) * k * hardRime(h, t) * (half ? 1 / 3 : 1), h, { crit: 0.25, col: shatters ? '#8FD6FF' : '#DDF3FF', tier: shatters ? 'payoff' : 'filler', shard: 'shard_ice', key: half ? 'hail' : 'icicle' });
  if (half) { if (shatters) shardburst(h, t, got); bits(t.x, t.y - 40, 'shard_ice', 3, 160); return; }
  // an Icicle crit primes the next one to Shatter anything (a Shattering Icicle's own crit doesn't chain)
  if (LAST.crit && !shatters) { h.shatter = Math.max(h.shatter, 1); if (h.isPlayer) fxText(h.x, h.y - 130, 'Shatter ready', '#8FD6FF', 18, { dur: 0.9 }); }
  if (shatters) shardburst(h, t, got);
  icicleGadgets(h, t, shatters);
  // Splinter (30% of the hit) and the Rimebone Crown (15) splash a second foe
  const o = S.mobs.find((m) => m !== t && isFoe(m) && engaged(m) && !m.cage && !m.M.thing && dist(m, t) < 200);
  if (o && got > 0 && h.traits.has('splinter')) hurtMob(o, got * 0.3, h, { raw: true, col: '#DDF3FF', size: 17, noCrit: true, tier: 'tick' });
  if (o && h.bonuses.has('rb_helm')) hurtMob(o, 15, h, { col: '#DDF3FF', size: 17, noCrit: true, tier: 'tick' });
  if (shatters) payoff(h, 'Shatter!', t.x, t.y - (t.isBoss ? 210 : 130), '#8FD6FF');
  if (shatters && !h.isPlayer) sfx('shatter', 0.5);
  if (!shatters) sfx('icehit', 0.6);
  bits(t.x, t.y - 40, 'shard_ice', shatters ? 7 : 3, 180);
}

/* ---------- the mage: Blizzard, Rime burst, Comet (Icicle is above) ---------- */
function abBlizzard(h, aim) {
  let p = null;
  if (aim && aim.x !== undefined && !aim.kind) p = clampRange(h, aim.x, aim.y, 520);
  else { const c = bestCluster(h, 120, 560); if (c) p = { x: c.x, y: c.y }; else { const t = autoTarget(h); if (t) p = { x: t.x, y: t.y }; } }
  if (!p) { if (loud(h)) fxText(h.x, h.y - 100, 'Nothing to freeze', '#DDF3FF', 16); return false; }
  p = clampRange(h, p.x, p.y, 520);
  const chestMul = h.bonuses.has('rb_chest') ? 1.25 : 1;
  const rb3Mul = h.bonuses.has('rimebone3') ? 1.3 : 1;
  const wide = wideWinter(h);
  S.zones.push({ kind: 'blizzard', x: p.x, y: p.y, r: Math.round(124 * wide.r), t: 0, dur: 5 + (h.bonuses.has('rb_chest') ? 1 : 0) + wide.dur, tick: 0.5, tickT: 0.15, val: Math.round(22 * chestMul * rb3Mul), src: h, seed: rng() * 100 });
  if (h.bonuses.has('rimebone3')) spawnThrall(h, 'frost', p.x, p.y + 24, 6);
  h.face = Math.atan2(p.y - h.y, p.x - h.x); h.lunge = 0.14; h.lungeA = h.face;
  sfx('blizzard');
  return true;
}
function abNova(h) {
  const R = AB.dps.a2.range;
  const shMul = (h.bonuses.has('rb_shoulders') ? 1.4 : 1) * gearMul(h, 'nova'), longer = h.bonuses.has('as_shoulders') ? 1 : 0;
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || dist(m, h) > R + m.r) continue;
    aggro(m, h, 0);
    hurtMob(m, 50 * shMul, h, { col: '#DDF3FF', key: 'nova' });
    if (!m.alive || m.M.thing) continue;
    // it stops casts, a boss's too (a boss is only Chilled)
    if (m.cast) interruptCast(m, h);
    if (m.isBoss) { m.st.slow = 0.4; m.st.slowT = 3; chillBoss(m, CHILL + longer); }
    else if (!m.M.wisp) { m.st.freeze = 4 + longer; m.wind = 0; }
  }
  if (h.bonuses.has('rb_shoulders')) h.cd.a3 = Math.max(0, h.cd.a3 - 1.5);
  if (h.unique === 'gravefrost') {
    // the Gravefrost Staff: your next two Icicles Shatter anything, and a frost storm swirls round you
    h.shatter = Math.max(h.shatter, 2);
    S.zones.push({ kind: 'blizzard', x: h.x, y: h.y, r: 125, t: 0, dur: 3, tick: 0.5, tickT: 0.15, val: 20, src: h, seed: rng() * 100 });
  }
  fx({ type: 'nova', x: h.x, y: h.y, r: R, dur: 0.45 });
  bits(h.x, h.y - 20, 'shard_ice', 12, 300);
  sfx('nova');
  if (h.isPlayer) shake(2);
  return true;
}
function abComet(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) && !aim.M.thing && !aim.cage ? aim : null;
  if (!t) t = autoTarget(h, true);
  if (!t || t.cage || dist(h, t) > 540) { if (loud(h)) fxText(h.x, h.y - 100, 'No target', '#DDF3FF', 16); return false; }
  h.cast = { key: 'comet', t: 0, dur: AB.dps.a3.cast * (h.traits.has('quickfrost') ? 0.5 : 1), target: t };
  sfx('castup');
  return true;
}
export function finishCast(h) {
  const c = h.cast; h.cast = null;
  if (c.key !== 'comet') return;
  const cd = AB.dps.a3.cd;
  h.cd.a3 = cd;
  if (h.isPlayer) HOOKS.fired('a3');
  const t = c.target;
  if (h.spec === 'fire') { fireCometLand(h, t, cd); return; }
  const tx = t.x, ty = t.y;
  fx({ type: 'comet', x: tx, y: ty, dur: 0.32 });
  sfx('whoosh');
  later(0.32, () => {
    // Long Winter: a Comet into your Blizzard Shatters as if its foe were frozen (a boss as if Chilled)
    const lw = t.alive && longWinter(h, t);
    const frozen = t.alive && (t.st.freeze > 0 || (lw && !t.isBoss)), chill = t.alive && (t.st.chill > 0 || t.exposed > 0 || (lw && t.isBoss));
    const lance = h.traits.has('shatterlance');
    // 2× a frozen foe (3× with Shatterlance), 1.5× a Chilled boss or anything Exposed (2× with Shatterlance)
    const k = frozen ? (lance ? 3 : 2) : chill ? (lance ? SHATTERLANCE_CHILL : CHILL_SHATTER) : 1, shatters = k > 1;
    const got = t.alive ? hurtMob(t, AB.dps.a3.hit * gearMul(h, 'comet') * k, h, { crit: 0.15, col: shatters ? '#8FD6FF' : '#DDF3FF', tier: shatters ? 'payoff' : 'hit', shard: 'shard_ice', key: 'comet' }) : 0;
    if (shatters) { payoff(h, 'Shatter!', tx, ty - (t.isBoss ? 230 : 150), '#8FD6FF'); shardburst(h, t, got); }
    if (shatters && h.bonuses.has('rimebone2')) h.cd.a3 = Math.min(h.cd.a3, cd / 2);
    const splash = foesNear(tx, ty, 90, false).filter((o) => o !== t && !o.cage);
    for (const o of splash) hurtMob(o, 114, h, { size: 19, key: 'comet' });
    if (h.unique === 'gravefrost') for (const o of [t, ...splash]) { if (!o.alive) continue; if (o.isBoss) { o.st.slow = Math.max(o.st.slow, 0.4); o.st.slowT = 2; chillBoss(o, 2); } else if (!o.M.wisp) { o.st.freeze = Math.max(o.st.freeze, 2); o.wind = 0; } }
    cometGadgets(h, t, tx, ty, shatters);
    fx({ type: 'ring', x: tx, y: ty, r0: 20, r1: 110, col: '#DDF3FF', dur: 0.3, w: 8, ground: true });
    bits(tx, ty - 20, 'shard_ice', 14, 320);
    if (h.isPlayer) shake(shatters ? 4 : 2);
    sfx('comet'); if (shatters && !h.isPlayer) sfx('shatter', 0.6);
  });
}

/** every button by its key, for heroes.js useAbility */
export const BUTTONS = {
  cleave: abCleave, charge: abCharge, slam: abSlam,
  circle: abCircle, ward: abWard, sunburst: abSunburst, smite: (h, aim) => shot(h, aim, 'smite'),
  blizzard: abBlizzard, nova: abNova, comet: abComet, icicle: (h, aim) => shot(h, aim, 'icicle'),
  ...ROGUE_BUTTONS,
  ...RANGER_BUTTONS,
};
