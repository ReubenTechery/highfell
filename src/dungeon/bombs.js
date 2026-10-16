/* ---------- bombs: a shared part (Thimblebriar Hollow's signature) ----------
   A bomb is lobbed at a spot, lands, and ticks for FUSE seconds (a ring runs down round it), then blows: a
   circle about 110 wide that hurts any hero in it.
     Hit it first   any hero's hit (a swing, a spell, any button) knocks it back at whoever threw it (or, if
                    they're gone, about 260 away from you). It turns gold: it's yours now. It blows where it
                    lands and hurts mobs, not heroes, and one that blows beside a boss opens him up (Exposed).
     Bat it back    a bomb thrown at the tank and perfect-blocked flies straight back and blows on its thrower
                    before it ever lands.
   A gold blast knocks any red bomb in it on as well. A Sticky Bomb is a curse that only the healer lifts
   (mobs.js): missed, its hero drops to a tenth and mates beside them take a hit; swiped off, it flies back
   and blows on whoever stuck it.
   Bombs are mobs that never fight (`thing`: no threat, no pulls, no pushing): `onHit` turns any hit into the
   knock, `tick` flies and ticks them, `draw` draws them. A red bomb's blast is an ordinary hazard (bots step
   out of it, the circle fills as it ticks); knocking the bomb takes the hazard away. */
import { TAU, angDiff, angTo, clamp, dist, lerp } from '../core/math';
import { vrand } from '../core/rng';
import { S, SHARED_MOBS, emit } from './state.js';
import { PERFECT_WINDOW, dots, exposeMob, fx, fxText, hitstop, hurtMob, sfx, shake } from './entities.js';
import { curseHero, spawnMob } from './mobs.js';
import { isFoe, onPerfectBlock } from './heroes.js';
import { canStand } from './world.js';

export const FUSE = 3;
/** how far a red blast reaches (a circle about 110 wide), and a gold one */
export const BLAST = 55, GOLD_BLAST = 80;
/** how far a knock sends a bomb when there's nobody to send it back to */
export const KNOCK = 260;
/** a gold bomb that blows this close to a boss's edge opens him up for EXPOSE seconds */
export const BESIDE = 110, EXPOSE = 2.5;
const LOB = 0.85, FLY = 0.42;

/** a bomb's mob, for a dungeon's MOBS. o: { name, sp (red), gold (its gold sprite), dmg (the red blast on a
 *  hero, as written), hurt (the gold blast on a mob), r } */
export function bombMob(o = {}) {
  return {
    name: o.name || 'Bomb', kind: 'melee', hp: 1, r: o.r || 14, speed: 0, dmg: 0, every: 99, wind: 0, reach: 0, aggro: 0,
    sp: o.sp || 'bomb', spGold: o.gold || 'bomb_gold', boom: o.dmg ?? 150, hurt: o.hurt ?? 160, fuse: o.fuse ?? FUSE,
    bomb: true, thing: true, tick: bombTick, onHit: hitBomb, draw: drawBomb,
  };
}

/* the gadgets' bombs (gadgets.js), which any dungeon can spawn: yours from the start */
Object.assign(SHARED_MOBS, {
  gbomb: bombMob({ name: 'Bomb', sp: 'bomb_gold', gold: 'bomb_gold', hurt: 220 }),
  frostbomb: { ...bombMob({ name: 'Frost bomb', sp: 'frost_bomb', gold: 'frost_bomb', hurt: 150 }), frost: true },
});

/* the nearest spot you can stand on, on the way from (x, y) back to (fx, fy) */
function standable(x, y, fx0, fy0) {
  for (let k = 0; k <= 10; k++) {
    const px = lerp(x, fx0, k / 10), py = lerp(y, fy0, k / 10);
    if (canStand(px, py, 16)) return { x: px, y: py };
  }
  return { x: fx0, y: fy0 };
}

/** Lob a red bomb from `owner` to (x, y). o: { type (its mob, 'bomb' unless given), at (a hero it's thrown at:
 *  it lands on them, and if that's the tank a perfect block bats it back), dur (seconds in the air) } */
export function throwBomb(owner, x, y, o = {}) {
  const type = o.type || 'bomb';
  const p = standable(x, y, owner.x, owner.y);
  const b = spawnMob(type, owner.x, owner.y, null, false);
  b.state = 'idle'; b.owner = owner; b.dmgMul = owner.dmgMul || 1; b.gold = false; b.at = o.at || null; b.untargetable = true;
  const dur = o.dur ?? LOB;
  b.fly = { t: 0, dur, x0: owner.x, y0: owner.y, z0: owner.isBoss ? 120 : 50, x1: p.x, y1: p.y, h: 150, follow: b.at };
  const follow = b.at ? { followT: b.at, followFor: dur } : {};
  // the blast, from the moment it's thrown: the circle fills as it ticks, and bots step out of it
  b.haz = { shape: 'circle', x: p.x, y: p.y, r: BLAST, warn: dur + b.M.fuse, t: 0, dmg: b.M.boom, src: b, kind: 'bomb', ...follow,
    onFire: () => redBlast(b) };
  S.hazards.push(b.haz);
  // thrown at the tank: a gold circle under him says "block it"
  if (b.at && b.at.role === 'tank') { b.catch = { shape: 'circle', x: p.x, y: p.y, r: 42, warn: dur, t: 0, noDmg: true, tankBuster: true, src: b, ...follow }; S.hazards.push(b.catch); }
  sfx('whoosh', 0.5);
  return b;
}

/** Drop a gold bomb of yours at (x, y): it blows on the mobs there after `fuse` seconds (set bonuses, weapons:
 *  gadgets.js). A gadget's bomb never opens a boss up; only one knocked back or batted does. */
export function dropBomb(by, x, y, o = {}) {
  const b = spawnMob(o.type || 'gbomb', x, y, null, false);
  b.state = 'idle'; b.gold = true; b.gadget = true; b.by = by; b.owner = null; b.untargetable = true; b.fuseT = o.fuse ?? 0.8; b.mul = o.mul || 1;
  b.small = !!o.small;
  if (o.from) b.fly = { t: 0, dur: o.dur ?? 0.3, x0: o.from.x, y0: o.from.y, z0: 40, x1: x, y1: y, h: 50 };
  return b;
}

/* any hit on a red bomb that has landed knocks it */
function hitBomb(m, amt, src) {
  if (m.gold || m.fly || !src || src.kind !== 'hero') return 0;
  knockBomb(m, src, src.x, src.y);
  return 0;
}

/** Knock a red bomb: back at its thrower if they're still up, otherwise away from (fx, fy). It's `by`'s now. */
export function knockBomb(m, by, fx0, fy0) {
  if (!m.alive || m.gold) return false;
  const back = m.owner && m.owner.alive && !m.owner.hidden && dist(m, m.owner) < 760 ? m.owner : null;
  let tx, ty;
  if (back) { tx = back.x; ty = back.y; }
  else {
    const a = Math.abs(m.x - fx0) + Math.abs(m.y - fy0) < 1 ? by.face : Math.atan2(m.y - fy0, m.x - fx0);
    const p = standable(m.x + Math.cos(a) * KNOCK, m.y + Math.sin(a) * KNOCK, m.x, m.y);
    tx = p.x; ty = p.y;
  }
  goGold(m, by, tx, ty, back);
  // Clockguard's helm: a bomb its wearer knocks blows harder
  if (by.bonuses && by.bonuses.has('cg_helm')) m.mul = 1.5;
  S.stats.knocked = (S.stats.knocked || 0) + 1;
  if (by.isPlayer) fxText(m.x, m.y - 70, 'Smack!', '#FFE08A', 20, { dur: 0.7 });
  sfx('kick', 0.8);
  emit({ type: 'bomb.knocked', player: !!by.isPlayer });
  return true;
}

/* it's gold now and on its way: no blast on the heroes any more */
function goGold(m, by, tx, ty, follow) {
  m.gold = true; m.by = by; m.untargetable = true;
  S.hazards = S.hazards.filter((z) => z !== m.haz && z !== m.catch);
  m.haz = m.catch = null;
  m.fly = { t: 0, dur: FLY, x0: m.x, y0: m.y, z0: m.z || 0, x1: tx, y1: ty, h: 90, follow };
  dots(m.x, m.y - 20, '#F2C230', 6, 140);
}

function bombTick(m, dt) {
  m.st.kx = m.st.ky = 0; m.target = null;
  const f = m.fly;
  if (f) {
    f.t += dt;
    if (f.follow && f.follow.alive) { f.x1 = f.follow.x; f.y1 = f.follow.y; }
    const k = Math.min(1, f.t / f.dur);
    m.x = lerp(f.x0, f.x1, k); m.y = lerp(f.y0, f.y1, k);
    m.z = Math.sin(k * Math.PI) * f.h + (1 - k) * (f.z0 || 0);
    if (k >= 1) land(m);
    return;
  }
  if (m.gold) {
    // one stuck on a mob (Gearshade's) rides along with it, and goes off if it falls
    if (m.stuck) { if (m.stuck.alive) { m.x = m.stuck.x + 10; m.y = m.stuck.y + 2; } else m.fuseT = 0; }
    m.fuseT -= dt;
    if (m.fuseT <= 0) goldBlast(m);
    return;
  }
  // a boss's bombs go out with him
  if (m.owner && m.owner.isBoss && !m.owner.alive) fizzle(m);
}

function land(m) {
  const f = m.fly;
  m.fly = null; m.z = 0;
  if (m.gold) { if (m.fuseT > 0) return; goldBlast(m); return; }
  // thrown at the tank: shield up just before it lands (a perfect block) and it flies straight back
  const t = m.at;
  if (t && t.alive && t.role === 'tank' && t.blocking && t.blockT <= PERFECT_WINDOW + 0.1 && dist(t, m) < t.r + 70 && m.owner && m.owner.alive
    && Math.abs(angDiff(t.face, angTo(t, m.owner))) < 1.6) { batBack(m, t); return; }
  m.untargetable = false;
  sfx('thud', 0.35);
  dots(m.x, m.y, '#C9B79A', 5, 90);
  if (f && m.at && m.at.isPlayer && m.at.role !== 'tank' && !S.hints.bomb) { S.hints.bomb = 1; S.call = { str: 'Hit the bomb to knock it back!', kind: 'alarm', t: 0, dur: 1.8 }; }
}

/* a perfect block: the bomb goes straight back at its thrower, and lands on him */
function batBack(m, t) {
  goGold(m, t, m.owner.x, m.owner.y, m.owner);
  m.batted = true;
  t.stats.perfect++; S.stats.perfect++;
  if (t.isPlayer) fxText(t.x, t.y - 96, 'PERFECT!', '#F2C230', 30, { dur: 1.3 });
  fx({ type: 'ring', x: t.x, y: t.y - 30, r0: 20, r1: 110, col: '#F2C230', dur: 0.35, w: 6 });
  sfx('perfect'); shake(5); hitstop(0.06);
  S.stats.batted = (S.stats.batted || 0) + 1;
  emit({ type: 'block', perfect: true, player: !!t.isPlayer, smash: false });
  emit({ type: 'bomb.batted', player: !!t.isPlayer });
  onPerfectBlock(t, null);
}

/* a red bomb goes off (its hazard does the damage to the heroes in it) */
function redBlast(m) {
  boomFx(m.x, m.y, '#FF8A4C', BLAST);
  gone(m);
}

/* a gold bomb goes off: it hurts the mobs round it, opens up a boss beside it, and knocks any red bomb in it */
function goldBlast(m) {
  const by = m.by, R = m.small ? 60 : GOLD_BLAST;
  boomFx(m.x, m.y, m.M.frost ? '#8FD6FF' : '#F2C230', R);
  gone(m);
  if (!by) return;
  let boss = null, chain = false;
  for (const f of S.mobs) {
    if (f === m || !f.alive || f.cage) continue;
    const d = dist(f, m);
    if (f.M.bomb) { if (!f.gold && !f.fly && d <= R + f.r && knockBomb(f, by, m.x, m.y)) chain = true; continue; }
    if (!isFoe(f)) continue;
    // a bomb is a gadget, not a fight: it pulls little threat, so knocking one into a boss doesn't turn him on you
    if (d <= R + f.r) {
      hurtMob(f, m.M.hurt * (m.small ? 0.45 : 1) * (m.mul || 1), by, { col: m.M.frost ? '#8FD6FF' : '#F2C230', size: 30, crit: 0.2, threat: 0.3 });
      if (m.M.frost && f.alive) { f.st.slow = Math.max(f.st.slow || 0, 0.4); f.st.slowT = Math.max(f.st.slowT || 0, 1.5); }
    }
    if (f.isBoss && f.alive && d <= f.r + BESIDE && !m.small && !m.gadget) boss = f;
  }
  if (boss) {
    // two bombs blowing on him together open him up once: one label, not two on top of each other
    if (boss.bombedAt !== undefined && S.t - boss.bombedAt < 0.5 && boss.exposed > 0) boss.exposed = Math.max(boss.exposed, EXPOSE);
    else exposeMob(boss, EXPOSE, m.batted ? 'Right back at you! Exposed!' : 'Bombed! Exposed!');
    boss.bombedAt = S.t;
    if (m.batted) boss.st.stun = Math.max(boss.st.stun, 1.0);
    if (S.bossFight && by.isPlayer) S.bossFight.bombed = (S.bossFight.bombed || 0) + 1;
  }
  if (chain) emit({ type: 'bomb.chain', player: !!by.isPlayer });
}

function fizzle(m) {
  S.hazards = S.hazards.filter((z) => z !== m.haz && z !== m.catch);
  dots(m.x, m.y - 14, '#9A9AA6', 8, 80);
  gone(m);
}
function gone(m) { m.alive = false; m.state = 'dead'; m.deadT = 99; m.haz = m.catch = null; }

function boomFx(x, y, col, r) {
  fx({ type: 'ring', x, y, r0: 12, r1: r + 26, col, dur: 0.32, w: 9, ground: true });
  dots(x, y - 20, col, 14, 260);
  dots(x, y - 20, '#FFF6D0', 6, 180);
  sfx('burst', 0.8); shake(4);
}

/* ---------- the Sticky Bomb: a curse only the healer lifts (mobs.js) ---------- */
export const STICKY_COL = '#FF8A4C';
/** stick a bomb on a hero. Missed, it drops them to a tenth (never kills) and hits mates beside them;
 *  swiped off by the healer (or Sunburst), it flies back and blows on whoever stuck it */
export function stickBomb(m, h) {
  return curseHero(m, h, { kind: 'sticky', sp: 'sticky_bomb', col: STICKY_COL, word: 'Sticky Bomb!', onBurst: stickyBurst, onLift: stickyLift });
}
/** what a missed Sticky Bomb does to the mates beside its hero, as written (the dungeon's tune scales it) */
export const STICKY_SPLASH = 130;
function stickyBurst(h) {
  for (const o of S.heroes) {
    if (o === h || !o.alive || dist(o, h) > 120) continue;
    const a = Math.min(Math.round(STICKY_SPLASH * S.tune.hit), o.hp - 1);
    if (a <= 0) continue;
    o.hp -= a; o.flash = 0.12; o.hurtT = 0.25; o.stats.taken += a;
    if (o.isPlayer) fxText(o.x, o.y - 60, '-' + a, '#FF6B5E', 24);
  }
  boomFx(h.x, h.y, STICKY_COL, 110);
}
function stickyLift(h, c, by) {
  const owner = c.by;
  if (!by || !owner || !owner.alive) return;
  const b = spawnMob('gbomb', h.x, h.y, null, false);
  b.state = 'idle'; b.owner = owner;
  b.x = h.x; b.y = h.y; b.z = 80;
  goGold(b, by, owner.x, owner.y, owner);
}

/* ---------- drawing (render.js calls `draw` for a mob that has one) ---------- */
function drawBomb(ctx, m, drawSpr) {
  if (!m.alive) return;
  const z = m.z || 0;
  // the shadow on the ground under a bomb in the air
  if (z > 4) { ctx.fillStyle = 'rgba(18, 12, 28, 0.3)'; ctx.beginPath(); ctx.ellipse(m.x, m.y, 16, 6, 0, 0, TAU); ctx.fill(); }
  let sx = 1, sy = 1, rot = 0;
  if (m.fly) rot = (m.fly.t / m.fly.dur) * TAU * (m.gold ? 2 : 1);
  else if (!m.gold && m.haz) {
    // it swells and shakes as the fuse runs down, and the ring round it runs out (red at the end)
    const left = clamp(1 - m.haz.t / m.haz.warn, 0, 1);
    const beat = 1 + Math.sin(S.t * (10 + 26 * (1 - left))) * 0.05 * (1.4 - left);
    sx = sy = beat;
    ctx.beginPath(); ctx.arc(m.x, m.y - 18, 26, -Math.PI / 2, -Math.PI / 2 + TAU * left);
    ctx.lineWidth = 8; ctx.strokeStyle = '#1E1A1A'; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = left < 0.3 ? '#FF6B5E' : '#FFE08A'; ctx.stroke();
  }
  const k = m.small ? 0.7 : 1;
  drawSpr(ctx, m.gold ? m.M.spGold : m.M.sp, m.x, m.y - z, { rot, sx: sx * k, sy: sy * k });
  // a spark on the fuse
  if (!m.fly && S.frame % 3 === 0) S.parts.push({ x: m.x + 8 * k + vrand(-3, 3), y: m.y, z: z + 30 * k, vx: vrand(-30, 30), vy: 0, vz: vrand(40, 90), col: m.gold ? '#FFE9A8' : '#FFE08A', size: vrand(2, 3.5), t: 0, dur: 0.35 });
}
