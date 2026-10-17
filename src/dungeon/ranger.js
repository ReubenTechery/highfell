/* ---------- the ranger's buttons: Quick Shot, Longshot, Pin Shot, Snare ----------
   The duo rework's new class (docs/duo.md; the names are drafts), at range with a bow.
     Marks (m.marks): every Quick Shot leaves one on its foe, up to MARKS.max (MARKS.deep with Deep Marks), for
       MARKS.life seconds. Three are a combo setup for your mate (setUp 'mark'), and they show over the foe
       (drawMarks).
     Longshot, the payoff: on a foe with three marks, or once an Exposed window on a foe without them (a burn, not a
       loop: rogue.js burnable), a drawn arrow that spends the marks, hits hard, goes on through the foes behind it
       and heals you a little. On a foe your mate set up it's a COMBO (duo.js); on one a mate's marks set up, a crit.
     Pin Shot, the interrupt: it stops a cast and Exposes the caster; a foe that isn't casting is pinned, slowed
       right down for a moment.
     Snare: a trap thrown on the ground. Foes that walk in are held (a boss Staggers) and bitten; on Trapper it bursts
       into Arrowfall, a rain of arrows on the spot.
   Longbow's and Trapper's talents are here (content/talents/ranger.ts names them), and the Barrow's set and bow;
   Thimblebriar's are gadgets.js. buttons.js lists these with the other classes' buttons. */
import { angDiff, angTo, dist, distXY, TAU } from '../core/math';
import { rng } from '../core/rng';
import { AB, fillerMul } from '../content/roles';
import { RARITY } from '../content/gear';
import { S } from './state.js';
import { LAST, STAGGER, bits, dots, fx, fxText, healHero, hurtMob, sfx, staggerBoss } from './entities.js';
import { interruptCast } from './mobs.js';
import { canStand } from './world.js';
import { COMBO, combo, comboFor, setUp } from './duo.js';
import { gearMul, longshotGadgets, pinGadgets, quickGadgets, springGadgets, thistleTrap } from './gadgets.js';
import { autoTarget, bestCluster, clampRange, isFoe, later, loud, spawnThrall } from './heroes.js';
import { burnable } from './rogue.js';

const has = (h, id) => !!(h && h.tal && h.tal.has(id));
/** how far the ranger's arrows reach */
export const RANGE = 540;
/** marks: how many a Longshot needs, the most a foe holds (with Deep Marks, `deep`), and how long they last */
export const MARKS = { need: 3, max: 3, deep: 5, life: 8 };
/** Longshot (its hit is AB.ranger.a2.hit): up to `pierce` foes behind its target, out to `reach` past it, take
 *  `through` of it; it heals you `heal` (with your Power, like any heal) */
export const LONGSHOT = { through: 0.6, pierce: 2, reach: 460, heal: 30 };
/** Pin Shot's hit, and a foe that isn't casting pinned: slowed this much for this long */
export const PIN = { hit: 70, slow: 0.85, dur: 2 };
/** Snare: how far its jaws reach, how long a trap waits for something to walk in, how long it holds, its bite, and
 *  the most traps of yours on the ground at once */
export const SNARE = { r: 80, wait: 8, hold: 2.5, bite: 60, most: 4 };
/** Arrowfall: how far it reaches, how long it rains, how often an arrow lands on each foe in it, and its hit */
export const ARROWFALL = { r: 120, dur: 3, every: 0.4, hit: 15 };
const COL = '#E8F5C8', GOLD = '#F2C230', LINE = '#1E1A1A';

/** a payoff of yours lands: its word and its sound (the hit itself feels like one: entities.js FEEL) */
function payoff(h, word, x, y, col) {
  if (!h.isPlayer) return;
  fxText(x, y, word, col || '#FFE08A', 30, { dur: 0.95 });
  sfx('crit', 0.9);
}
/** the arrow's trail takes the weapon's rarity colour (Common keeps the class's own) */
const trail = (h, base) => (h.weaponRar >= 1 ? RARITY[h.weaponRar].color : base);
/** loose an arrow at a foe: `land` is what it does when it arrives (buttons.js projHit); without one it's only seen */
function shoot(h, t, o) {
  h.face = angTo(h, t); h.lunge = 0.1; h.lungeA = h.face + Math.PI;
  S.projs.push({ team: 'hero', x: h.x + Math.cos(h.face) * 20, y: h.y + Math.sin(h.face) * 8, z: 58, sp: 'arrow', src: h, tgt: t, speed: o.speed || 1300, life: 1.5, big: true, col: o.col || trail(h, COL), ox: h.x, oy: h.y, ...o });
}

/* ---------- marks ---------- */
/** a foe's marks now (0 when it has none, or they've run out) */
export const marksOf = (m) => (m && m.marks && S.t < m.marks.until ? m.marks.n : 0);
/** Mark a foe `k` times, up to the most `h` can stack, for MARKS.life seconds from now (longer in the Gravewood
 *  Hood). Three or more are a setup for your mate's payoff. */
export function addMarks(h, m, k = 1) {
  if (!m || !m.alive || m.cage || m.hidden || m.M.thing || m.M.wisp || m.M.bomb) return;
  const max = has(h, 'lb.deep') ? MARKS.deep : MARKS.max, now = marksOf(m);
  const life = MARKS.life + (h.bonuses.has('cw_helm') ? 3 : 0);
  m.marks = { n: Math.max(now, Math.min(max, now + k)), until: S.t + life, by: h };
  if (m.marks.n >= MARKS.need) setUp(m, h, 'mark', life);
}
/** a small arrowhead over a marked foe for each mark, above its health and cast bars: green, gold once a Longshot
 *  can go (render.js draws it with the foe) */
export function drawMarks(ctx, m, x) {
  const n = marksOf(m), top = m.y - (m.isBoss ? 250 : m.M.big ? 188 : 138);
  ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = LINE; ctx.fillStyle = n >= MARKS.need ? GOLD : '#9BD068';
  for (let i = 0; i < n; i++) {
    const cx = x + (i - (n - 1) / 2) * 17;
    ctx.beginPath(); ctx.moveTo(cx - 7, top - 6); ctx.lineTo(cx + 7, top - 6); ctx.lineTo(cx, top + 7); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}

/* ---------- Quick Shot: the filler ---------- */
function quickShot(h, aim) {
  const t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : autoTarget(h);
  if (!t || dist(h, t) > RANGE) { if (loud(h)) fxText(h.x, h.y - 100, 'No target', COL, 16); return false; }
  h.quick = (h.quick || 0) + 1;
  shoot(h, t, { land: quickLand, n: h.quick });
  // the Bow of the Long Night: every fourth Quick Shot looses a second arrow at its foe
  if (h.unique === 'longnight' && h.quick % 4 === 0) later(0.12, () => { if (h.alive && isFoe(t)) shoot(h, t, { land: quickLand, second: true }); });
  sfx('arrow', 0.75);
  return true;
}
/** a Quick Shot arrives: its hit, and a mark (two with Quick Nock on every third, and Keen Fletching on a crit) */
function quickLand(p) {
  const h = p.src, t = p.tgt;
  // Steady Aim: it crits half again as often while you stand still
  const still = h.traits.has('steadyaim') && h.stillT > 0.4 ? 1.5 : 1;
  hurtMob(t, AB.ranger.a1.hit * fillerMul(h.bonuses), h, { crit: 0.22 * still, col: COL, tier: 'filler', key: p.second ? 'second' : 'quickshot' });
  const crit = LAST.crit;
  addMarks(h, t, 1 + (crit && h.traits.has('keenfletch') ? 1 : 0) + (!p.second && has(h, 'lb.nock') && p.n % 3 === 0 ? 1 : 0));
  // Spreading Marks: the foe nearest it takes one too
  if (has(h, 'tr.spread')) { const o = nearest(t, 170, new Set([t])); if (o) addMarks(h, o, 1); }
  quickGadgets(h, t);
  dots(t.x, t.y - 46, COL, 4, 110);
  sfx('arrowhit', 0.6);
}
/** the foe nearest `t` within `r`, not one of `but` */
function nearest(t, r, but) {
  let best = null, bd = r;
  for (const m of S.mobs) {
    if (but.has(m) || !isFoe(m) || m.cage || m.M.thing || m.M.wisp || m.M.bomb) continue;
    const d = dist(m, t);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

/* ---------- Longshot: the payoff ---------- */
/** can a Longshot of yours go at this foe now? three marks, or an Exposed window of its you haven't spent */
export const canLongshot = (h, t) => !!t && isFoe(t) && !t.cage && !t.M.thing && !t.M.bomb && (marksOf(t) >= MARKS.need || burnable(h, t));
/** the foe a Longshot goes at: the one you picked or are shooting, if it can, else the one in reach with the most
 *  marks */
export function longshotTarget(h, aim) {
  if (aim && aim.kind === 'mob' && canLongshot(h, aim) && dist(h, aim) <= RANGE) return aim;
  const t = autoTarget(h, true);
  if (canLongshot(h, t) && dist(h, t) <= RANGE) return t;
  let best = null, bn = 0;
  for (const m of S.mobs) {
    if (!canLongshot(h, m) || dist(h, m) > RANGE) continue;
    const n = marksOf(m) + (m.exposed > 0 ? 0.5 : 0) + (m.isBoss ? 0.25 : 0);
    if (n > bn) { bn = n; best = m; }
  }
  return best;
}
function longshot(h, aim) {
  const t = longshotTarget(h, aim);
  if (!t) { if (loud(h)) fxText(h.x, h.y - 100, 'Needs three marks', COL, 16); return false; }
  const n = marksOf(t);
  // an Exposed foe without its marks takes one Longshot of yours a window
  if (n < MARKS.need) (t.burned ||= new Set()).add(h.id);
  t.marks = null;
  shoot(h, t, { land: longLand, speed: 1700, col: GOLD, marks: n });
  h.lunge = 0.18;
  fx({ type: 'ring', x: h.x, y: h.y - 40, r0: 36, r1: 12, col: GOLD, dur: 0.18, w: 4 });
  sfx('arrow', 1); sfx('whoosh', 0.45);
  return true;
}
/** a Longshot arrives: its hit on its foe, then on through the ones behind */
function longLand(p) {
  const h = p.src, t = p.tgt, n = p.marks || 0;
  const a = Math.atan2(t.y - p.oy, t.x - p.ox), hit = AB.ranger.a2.hit * gearMul(h, 'longshot');
  // a setup your mate left: a COMBO, half again as hard (on their marks, a crit; with Sitting Duck, any of them)
  const kind = comboFor(t, h);
  const deep = has(h, 'lb.deep') ? 1 + 0.25 * Math.max(0, n - MARKS.need) : 1;
  const bodkin = has(h, 'lb.bodkin') && (t.isBoss || t.M.big) ? 1.25 : 1;
  const quarry = has(h, 'lb.quarry') && t.hp < t.maxHp * 0.5 ? 1.3 : 1;
  const sure = kind === 'mark' || (kind && has(h, 'lb.duck'));
  hurtMob(t, hit * deep * bodkin * quarry * (kind ? COMBO : 1), h, { crit: sure ? 1 : 0.3, col: GOLD, tier: 'payoff', key: 'longshot' });
  const crit = LAST.crit;
  if (kind) combo(h, t, kind);
  payoff(h, 'Longshot!', t.x, t.y - (t.isBoss ? 220 : 140), GOLD);
  healHero(h, h, LONGSHOT.heal, { size: 16 });
  // on through: the foes behind it in the arrow's line (Clean Through: as hard as its target)
  const share = h.traits.has('cleanthrough') ? 1 : LONGSHOT.through;
  const behind = foesBehind(t, a, LONGSHOT.pierce);
  for (const o of behind) hurtMob(o, hit * share, h, { crit: 0.15, col: '#FFE08A', size: 20, key: 'through' });
  const end = behind.length ? behind[behind.length - 1] : { x: t.x + Math.cos(a) * 160, y: t.y + Math.sin(a) * 160 };
  fx({ type: 'beam', x: t.x, y: t.y - 50, x2: end.x, y2: end.y - 50, col: GOLD, dur: 0.22 });
  // Forked Arrow: two more arrows fan out from your bow
  const fork = has(h, 'tr.fork') ? forked(h, t, a, hit) : [];
  const all = [t, ...behind, ...fork];
  // the Gravewood's two pieces: it marks every foe it hits; Follow Through: a crit marks its foe three times
  if (h.bonuses.has('gravewood2')) for (const m of all) addMarks(h, m, 1);
  if (crit && has(h, 'lb.follow')) addMarks(h, t, 3);
  // Tripwire: through three or more foes, Snare is ready again
  if (has(h, 'tr.trip') && all.length >= 3 && h.cd.a4 > 0) { h.cd.a4 = 0; if (h.isPlayer) fxText(h.x, h.y - 130, 'Snare ready', COL, 17, { dur: 0.8 }); }
  // Second Arrow: another a moment later, half as hard
  if (has(h, 'lb.second')) later(0.22, () => { if (isFoe(t) && h.alive) { hurtMob(t, hit * 0.5, h, { crit: 0.3, col: GOLD, size: 22, key: 'second' }); bits(t.x, t.y - 50, 'shard_bone', 3, 160); } });
  longshotGadgets(h, t);
  bits(t.x, t.y - 50, 'shard_bone', 5, 220);
  sfx('arrowhit', 1); sfx('thud', 0.7);
}
/** the foes behind `t` in a line going `a`, nearest first, up to `n` */
function foesBehind(t, a, n) {
  const ca = Math.cos(a), sa = Math.sin(a), out = [];
  for (const m of S.mobs) {
    if (m === t || !isFoe(m) || m.cage || m.M.thing || m.M.wisp || m.M.bomb) continue;
    const dx = m.x - t.x, dy = m.y - t.y, along = dx * ca + dy * sa;
    if (along > 0 && along <= LONGSHOT.reach && Math.abs(dy * ca - dx * sa) <= m.r + 44) out.push({ m, along });
  }
  return out.sort((x, y) => x.along - y.along).slice(0, n).map((o) => o.m);
}
/** Forked Arrow: an arrow either side of the Longshot, each at the foe nearest its line, for half */
function forked(h, t, a, hit) {
  const got = [];
  for (const side of [-0.42, 0.42]) {
    let best = null, bd = 0.36;
    for (const m of S.mobs) {
      if (m === t || got.includes(m) || !isFoe(m) || m.cage || m.M.thing || m.M.wisp || m.M.bomb || dist(h, m) > RANGE + 60) continue;
      const off = Math.abs(angDiff(a + side, angTo(h, m)));
      if (off < bd) { bd = off; best = m; }
    }
    if (!best) continue;
    got.push(best);
    hurtMob(best, hit * 0.5, h, { crit: 0.15, col: '#FFE08A', size: 20, key: 'fork' });
    fx({ type: 'beam', x: h.x, y: h.y - 56, x2: best.x, y2: best.y - 50, col: '#FFE08A', dur: 0.2 });
  }
  return got;
}

/* ---------- Pin Shot: the interrupt ---------- */
/** the marks a Pin Shot of yours leaves: three with Pinned Down, two with the Bow of the Long Night or the Gravewood
 *  Mantle */
export const pinMarks = (h) => Math.max(has(h, 'lb.pinned') ? 3 : 0, h.unique === 'longnight' || h.bonuses.has('cw_shoulders') ? 2 : 0);
function pinShot(h, aim) {
  let t = aim && aim.kind === 'mob' && isFoe(aim) ? aim : null;
  if (!t) t = S.mobs.find((m) => isFoe(m) && m.cast && m.cast.kick && dist(h, m) <= RANGE + 40) || autoTarget(h, true);
  if (!t || dist(h, t) > RANGE + 40) { if (loud(h)) fxText(h.x, h.y - 100, 'No target', COL, 16); return false; }
  // it pins at once (the arrow is only seen flying); a cage takes it as one hit when it lands
  shoot(h, t, { speed: 2200, col: '#DDF3FF' });
  sfx('arrow', 0.9);
  if (t.cage) return true;
  hurtMob(t, PIN.hit * (h.bonuses.has('cw_shoulders') ? 1.4 : 1) * gearMul(h, 'pinshot'), h, { crit: 0.2, col: '#DDF3FF', key: 'pinshot' });
  if (!t.alive) return true;
  if (t.cast) {
    // it stops the cast, and a cast that can be stopped leaves its caster Exposed: a setup for your mate
    const kick = !!t.cast.kick;
    interruptCast(t, h);
    if (kick && t.exposed > 0) setUp(t, h, 'expose', t.exposed);
  } else if (!t.isBoss && !t.M.big && !t.M.thing) {
    t.st.slow = Math.max(t.st.slow || 0, PIN.slow); t.st.slowT = Math.max(t.st.slowT || 0, PIN.dur);
    if (h.isPlayer) fxText(t.x, t.y - 110, 'Pinned', '#DDF3FF', 17, { dur: 0.8 });
  }
  const marks = pinMarks(h);
  if (marks) addMarks(h, t, marks);
  pinGadgets(h, t);
  return true;
}

/* ---------- Snare, and Trapper's Arrowfall ---------- */
function snare(h, aim) {
  const R = AB.ranger.a4.range;
  let p;
  if (aim && aim.x !== undefined && !aim.kind) p = { x: aim.x, y: aim.y };
  else if (aim && aim.kind === 'mob' && isFoe(aim)) p = { x: aim.x, y: aim.y };
  else {
    const c = bestCluster(h, 100, R), t = c ? null : autoTarget(h, true);
    p = c ? { x: c.x, y: c.y } : t ? { x: t.x, y: t.y } : { x: h.x + Math.cos(h.face) * 140, y: h.y + Math.sin(h.face) * 140 };
  }
  p = clampRange(h, p.x, p.y, R);
  const a = Math.atan2(p.y - h.y, p.x - h.x);
  // Twin Traps: two, side by side across the throw
  const spots = has(h, 'tr.twin') ? [-1, 1].map((k) => ({ x: p.x - Math.sin(a) * 62 * k, y: p.y + Math.cos(a) * 62 * k })) : [p];
  for (const s of spots) layTrap(h, s.x, s.y);
  // the Gravewood's three pieces: a skeleton climbs out beside the trap to fight for you
  if (h.bonuses.has('gravewood3')) {
    spawnThrall(h, 'bg', p.x + 44, p.y + 18, 8);
    if (h.isPlayer) fxText(p.x, p.y - 120, 'Gravewood Skeleton!', '#FFE08A', 20);
  }
  h.face = a; h.lunge = 0.14; h.lungeA = a;
  sfx('toss', 0.8);
  return true;
}
/** a trap on the ground: it waits for a foe to walk in (Thistledown's coat: wider, and longer) */
function layTrap(h, x, y) {
  // a spot nobody can stand on comes back towards you until it's one they can
  for (let k = 0; k < 6 && !canStand(x, y, 12); k++) { x += (h.x - x) * 0.3; y += (h.y - y) * 0.3; }
  const mine = S.zones.filter((z) => z.kind === 'snare' && z.src === h && !z.sprung);
  if (mine.length >= SNARE.most) mine[0].dur = mine[0].t;
  const tb = thistleTrap(h), wide = (has(h, 'tr.jaws') ? 1.5 : 1) * tb.r;
  S.zones.push({ kind: 'snare', x, y, r: Math.round(SNARE.r * wide), t: 0, dur: SNARE.wait + tb.wait, tick: 0.05, tickT: 0.3, src: h, fn: snareTick, draw: drawSnare, sprung: false });
  fx({ type: 'ring', x, y, r0: 14, r1: SNARE.r * wide, col: '#C9B79A', dur: 0.22, w: 5, ground: true });
  dots(x, y, '#C9B79A', 6, 90, { size: 5 });
}
function snareTick(z) {
  if (z.sprung || !z.src) return;
  const caught = S.mobs.filter((m) => isFoe(m) && !m.cage && !m.M.thing && !m.M.wisp && !m.M.bomb && distXY(m.x, m.y, z.x, z.y) <= z.r + m.r * 0.5);
  if (caught.length) spring(z, caught);
}
/** the jaws shut on everything in them: they're held (a boss Staggers) and bitten, a setup for your mate */
function spring(z, caught) {
  const h = z.src;
  z.sprung = true; z.sprungT = z.t; z.dur = z.t + 0.45;
  const hold = SNARE.hold + (h.bonuses.has('cw_chest') ? 1 : 0);
  const bite = (SNARE.bite + (h.bonuses.has('cw_chest') ? 50 : 0) + (has(h, 'tr.bite') ? 80 : 0)) * gearMul(h, 'snare');
  for (const m of caught) {
    hurtMob(m, bite, h, { col: '#C9B79A', size: 19, key: 'snare' });
    if (!m.alive) continue;
    if (m.isBoss) staggerBoss(m, STAGGER);
    else { m.st.stun = Math.max(m.st.stun, hold); m.wind = 0; }
    setUp(m, h, 'stun', m.isBoss ? STAGGER : hold);
    // Biting Jaws: it marks what it holds twice
    if (has(h, 'tr.bite')) addMarks(h, m, 2);
  }
  if (h.isPlayer) fxText(z.x, z.y - 110, 'Snared!', '#C9D2DC', 20, { dur: 0.9 });
  bits(z.x, z.y - 10, 'shard_dirt', 5, 160);
  sfx('cagehit', 0.9); sfx('thud', 0.5);
  // Trapper: it bursts into Arrowfall
  if (h.spec === 'trapper') arrowfall(h, z.x, z.y);
  springGadgets(h, z);
}
/** Arrowfall: arrows rain on the spot (Wide Jaws: wider; Downpour: longer; Cloudburst: a third more often, and
 *  every foe in it takes a mark) */
function arrowfall(h, x, y) {
  const r = Math.round(ARROWFALL.r * (has(h, 'tr.jaws') ? 1.5 : 1));
  S.zones.push({ kind: 'arrowfall', x, y, r, t: 0, dur: ARROWFALL.dur + (has(h, 'tr.downpour') ? 1.5 : 0), tick: ARROWFALL.every / (has(h, 'tr.cloud') ? 4 / 3 : 1), tickT: 0.15, src: h, fn: arrowfallTick, draw: drawArrowfall, seed: rng() * 100, born: S.t, marked: new Set() });
  if (h.isPlayer) fxText(x, y - 140, 'Arrowfall!', COL, 22, { dur: 1.0 });
  sfx('whoosh', 0.6);
}
const inRain = (z, m) => distXY(m.x, m.y, z.x, z.y) <= z.r + m.r * 0.5;
function arrowfallTick(z) {
  const h = z.src;
  // two of your Arrowfalls on one foe (Twin Traps) don't stack: the older one has it
  const older = S.zones.filter((o) => o !== z && o.kind === 'arrowfall' && o.src === h && o.born < z.born);
  for (const m of S.mobs) {
    if (!isFoe(m) || m.cage || m.M.thing || m.M.wisp || m.M.bomb || !inRain(z, m) || older.some((o) => inRain(o, m))) continue;
    hurtMob(m, ARROWFALL.hit, h, { crit: 0.06, size: 16, col: COL, tier: 'tick', key: 'arrowfall' });
    if (m.alive && has(h, 'tr.cloud') && !z.marked.has(m)) { z.marked.add(m); addMarks(h, m, 1); }
  }
}

/* ---------- drawing the traps ---------- */
/* an iron ring of teeth on the ground, that snaps shut when it springs */
function drawSnare(ctx, z) {
  const shut = z.sprung ? Math.min(1, (z.t - z.sprungT) / 0.12) : 0, rx = z.r * (1 - 0.4 * shut), ry = rx * 0.55;
  ctx.fillStyle = 'rgba(201, 183, 154, 0.16)';
  ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, TAU); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = LINE; ctx.beginPath(); ctx.ellipse(z.x, z.y, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = '#9AA7B8'; ctx.stroke();
  ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.fillStyle = '#C9D2DC';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, b = 0.17, c = Math.cos(a), s = Math.sin(a);
    const x0 = z.x + Math.cos(a - b) * rx, y0 = z.y + Math.sin(a - b) * ry, x1 = z.x + Math.cos(a + b) * rx, y1 = z.y + Math.sin(a + b) * ry;
    const tip = 0.72 + 0.2 * shut;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(z.x + c * rx * tip, z.y + s * ry * tip); ctx.lineTo(x1, y1); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}
/* arrows falling on a ring of churned ground */
function drawArrowfall(ctx, z, drawSpr) {
  ctx.fillStyle = 'rgba(232, 245, 200, 0.14)';
  ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, TAU); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = LINE; ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#C9B79A'; ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = i * 2.39996 + z.seed, rr = z.r * Math.sqrt((i * 0.618) % 1), fall = (S.t * 2.4 + i * 0.137) % 1;
    const x = z.x + Math.cos(a) * rr, y = z.y + Math.sin(a) * rr * 0.55;
    drawSpr(ctx, 'arrow', x, y - 170 * (1 - fall), { rot: Math.PI / 2, alpha: 0.5 + fall * 0.5 });
  }
}

/** every button by its key, for buttons.js */
export const RANGER_BUTTONS = { quickshot: quickShot, longshot, pinshot: pinShot, snare };
