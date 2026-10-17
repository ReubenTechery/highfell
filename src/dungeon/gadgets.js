/* ---------- gadgets: Thimblebriar Hollow's set pieces, set bonuses and the Tinker King's weapons ----------
   Each piece makes one button better (gearMul). Two and three pieces of a set, and the Tinker King's four
   weapons, are gnome gadgets built round the bombs (bombs.js). They change what a button does, never add one:
     Clockguard   2: a perfect block winds a 150 brass shield. 3: it drops a lit bomb of yours at the attacker.
     Sporebloom   2: Mend plants a spore that heals 45 more. 3: Ward leaves a patch-up turret for 6 seconds.
     Arcspark     2: Comet into a frozen foe (or a Chilled boss) arcs to 2 more (with nobody else near, back into it).
                  3: Comet splits into four frost bombs.
     Gearshade    2: a crit with Shadowstrike throws a 55 spark (Viper Blades 24). 3: Viper Blades stick a bomb on
                  the target and Shadowstrike sets it off.
     Mainspring Maul      Charge winds the spring: the next Cleave hits twice.
     Sporelight Censer    Mend's spore bursts to heal everyone near it; Sunburst sends the bombs near you flying.
     Arcwright's Coil     Icicle chains to 2 more foes; into a frozen foe, each one bounces twice.
     Fusecutters          Shadowstep leaves a lit bomb of yours where you were.
   heroes.js calls in at the moments that matter. A gadget's bomb is yours from the start, and only a bomb
   knocked back (or batted) opens a boss up. */
import { TAU, dist } from '../core/math';
import { S } from './state.js';
import { dots, fx, fxText, healHero, hurtMob, sfx } from './entities.js';
import { dropBomb, knockBomb } from './bombs.js';
import { isFoe, engaged } from './heroes.js';

/** what a hero's Thimblebriar pieces add to a button (1 when they wear none); the helms that make a filler hit
    harder are FILLER_PIECES in content/roles.ts, with the Barrow's */
const PIECE = {
  cg_shoulders: { charge: 1.35 }, cg_chest: { slam: 1.35 },
  sb_helm: { mend: 1.15 }, sb_shoulders: { ward: 1.3 }, sb_chest: { circle: 1.25 },
  as_shoulders: { nova: 1.4 }, as_chest: { comet: 1.2 },
  gs_helm: { ambush: 1.25 }, gs_shoulders: { flurry: 1.25 }, gs_chest: { venom: 1.3 },
};
export function gearMul(h, key) {
  let k = 1;
  if (h.bonuses) for (const b of h.bonuses) { const p = PIECE[b]; if (p && p[key]) k *= p[key]; }
  return k;
}

const others = (h, near, r, but) => S.mobs.filter((m) => m !== but && isFoe(m) && !m.cage && !m.M.thing && engaged(m) && dist(m, near) <= r).sort((a, b) => dist(a, near) - dist(b, near));

/* ---------- the tank ---------- */
/** a perfect block: Clockguard's brass shield and its bomb at the attacker's feet */
export function blockGadgets(h, src) {
  if (h.bonuses.has('clockguard2')) {
    h.absorb = Math.max(h.absorb, Math.round(150 * h.power)); h.absorbT = 6;
    if (h.isPlayer) fxText(h.x, h.y - 120, 'Brass shield', '#FFE08A', 18);
  }
  if (h.bonuses.has('clockguard3') && src && src.kind === 'mob' && src.alive) dropBomb(h, src.x, src.y + 10, { fuse: 0.45, from: h });
}
/** Charge lands: Clockguard's pauldrons give a brass shield, and the Mainspring Maul winds its spring */
export function chargeGadgets(h) {
  if (h.bonuses.has('cg_shoulders')) { h.absorb = Math.max(h.absorb, Math.round(90 * h.power)); h.absorbT = Math.max(h.absorbT, 5); }
  if (h.unique === 'mainspring') { h.wound = true; if (h.isPlayer) fxText(h.x, h.y - 130, 'Wound up!', '#FFE08A', 18); }
}
/** Cleave: the Mainspring Maul's wound spring hits everything again a moment later */
export function cleaveGadgets(h, hits, dmg) {
  if (h.unique !== 'mainspring' || !h.wound || !hits.length) return;
  h.wound = false;
  S.timers.push({ t: 0.16, fn: () => {
    if (!h.alive) return;
    for (const m of hits) if (isFoe(m)) hurtMob(m, dmg, h, { knock: 60, col: '#FFE08A' });
    fx({ type: 'cleave', x: h.x, y: h.y - 30, a: h.face, r: 106, dur: 0.22, col: '#FFE08A', wide: true });
    sfx('sweep', 0.7);
  } });
}

/* ---------- the healer ---------- */
/** Mend: Sporebloom's spore heals 45 more; the Sporelight Censer's spore bursts on everyone near */
export function mendGadgets(h, t) {
  if (h.bonuses.has('sporebloom2')) { t.hots.push({ src: h, per: 11.25, left: 4, next: 1 }); dots(t.x, t.y - 50, '#9BE15D', 5, 70, { up: true }); }
  if (h.unique === 'sporelight') {
    S.timers.push({ t: 1.4, fn: () => {
      if (!h.alive) return;
      for (const a of S.heroes) if (a.alive && dist(a, t) <= 150) healHero(h, a, 55, { size: 16 });
      fx({ type: 'ring', x: t.x, y: t.y - 20, r0: 20, r1: 150, col: '#9BE15D', dur: 0.4, w: 6, ground: true });
      dots(t.x, t.y - 40, '#D8FFB8', 10, 150);
    } });
  }
}
/** Ward: Sporebloom's patch-up turret, for 6 seconds where the Ward went */
export function wardGadgets(h, t) {
  if (!h.bonuses.has('sporebloom3')) return;
  S.zones.push({ kind: 'turret', x: t.x + 40, y: t.y + 20, r: 260, t: 0, dur: 6, tick: 1, tickT: 0.4, src: h, fn: turretTick, draw: drawTurret });
}
function turretTick(z) {
  let low = null;
  for (const a of S.heroes) if (a.alive && dist(a, z) <= z.r && a.hp < a.maxHp && (!low || a.hp / a.maxHp < low.hp / low.maxHp)) low = a;
  if (!low) return;
  healHero(z.src, low, 40, { size: 15 });
  fx({ type: 'beam', x: z.x, y: z.y - 60, x2: low.x, y2: low.y - 40, col: '#9BE15D', dur: 0.2 });
}
function drawTurret(ctx, z, drawSpr, fade) {
  ctx.globalAlpha = fade * 0.25; ctx.fillStyle = '#9BE15D';
  ctx.beginPath(); ctx.arc(z.x, z.y - 58, 40 + Math.sin(S.t * 6) * 3, 0, TAU); ctx.fill();
  ctx.globalAlpha = fade;
  drawSpr(ctx, 'tb_turret', z.x, z.y, {});
}
/** Sunburst: the Sporelight Censer sends every red bomb near you flying back */
export function sunburstGadgets(h) {
  if (h.unique !== 'sporelight') return;
  for (const b of S.mobs) if (b.alive && b.M.bomb && !b.gold && !b.fly && dist(b, h) <= 470) knockBomb(b, h, h.x, h.y);
}

/* ---------- the mage ---------- */
/** Comet lands on (tx, ty): Arcspark arcs it to two more from a frozen foe, and splits it into frost bombs */
export function cometGadgets(h, t, tx, ty, shattered) {
  if (shattered && h.bonuses.has('arcspark2')) {
    const near = others(h, { x: tx, y: ty }, 280, t).slice(0, 2);
    // a boss on his own: the arc comes back round into him
    for (const o of near.length ? near : t.alive ? [t] : []) {
      hurtMob(o, 140, h, { col: '#8FD6FF', size: 20 });
      fx({ type: 'beam', x: tx, y: ty - 60, x2: o.x, y2: o.y - 50, col: '#8FD6FF', dur: 0.25 });
    }
  }
  if (h.bonuses.has('arcspark3')) {
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + 0.4;
      dropBomb(h, tx + Math.cos(a) * 64, ty + Math.sin(a) * 46, { type: 'frostbomb', small: true, fuse: 0.55, from: { x: tx, y: ty } });
    }
  }
}
/** Icicle hit `t`: the Arcwright's Coil chains it on (twice each into a frozen foe) */
export function icicleGadgets(h, t, shattered) {
  if (h.bonuses.has('as_helm') && t.alive) { t.st.slow = Math.max(t.st.slow || 0, 0.3); t.st.slowT = Math.max(t.st.slowT || 0, 2); }
  if (h.unique !== 'arcwright') return;
  const hops = shattered ? 2 : 1;
  for (const o of others(h, t, 240, t).slice(0, 2)) {
    // 15 a hop: Icicle is a filler now, so it chains every beat
    for (let k = 0; k < hops; k++) S.timers.push({ t: 0.08 + k * 0.12, fn: () => { if (isFoe(o)) hurtMob(o, 15, h, { col: '#C87533', size: 17, tier: 'tick' }); } });
    fx({ type: 'beam', x: t.x, y: t.y - 50, x2: o.x, y2: o.y - 50, col: '#F2A65A', dur: 0.2 });
  }
}

/* ---------- the rogue ---------- */
/** a crit with Shadowstrike (55) or Viper Blades (24: it crits far more often): Gearshade's spark */
export function critSpark(h, t, amt = 55) {
  if (!h.bonuses.has('gearshade2') || !t.alive) return;
  hurtMob(t, amt, h, { col: '#FFB070', size: 19, noCrit: true });
  dots(t.x, t.y - 50, '#FFE08A', 8, 160);
}
/** Viper Blades: Gearshade sticks a little bomb on the target (one at a time) */
export function viperGadgets(h, t) {
  if (!h.bonuses.has('gearshade3') || !t.alive || t.M.thing) return;
  if (S.mobs.some((b) => b.alive && b.stuck === t && b.by === h)) return;
  const b = dropBomb(h, t.x, t.y, { fuse: 6 });
  b.stuck = t; b.small = true;
}
/** Shadowstrike: sets off the bomb you stuck on its target */
export function ambushGadgets(h, t) {
  const b = S.mobs.find((x) => x.alive && x.stuck === t && x.by === h);
  if (b) { b.small = false; b.fuseT = 0; }
}
/** Shadowstep from (ox, oy): the Fusecutters leave a lit bomb of yours there */
export function stepGadgets(h, ox, oy) {
  if (h.unique === 'fusecutters') dropBomb(h, ox, oy, { fuse: 0.7 });
}
