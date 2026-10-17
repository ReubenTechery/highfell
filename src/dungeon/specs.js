/* ---------- specs: what a hero's talents do in a run ----------
   A hero's spec and talents come with its loadout (meta/talents.ts talentLoadout): h.spec, h.tal (the talents
   that change a button) and h.ts (its stats added up, made into multipliers by makeHero). The stats are read
   where they apply (entities.js: damage, healing, health, crit, damage taken; heroes.js: cooldowns; threat at
   makeHero). Each talent that changes a button is here, called from that button in buttons.js, or from the hit
   or the tick it changes. Fire's own four buttons and its Burn are fire.js. Ids are content/talents' own. */
import { angTo, dist } from '../core/math';
import { S, emit } from './state.js';
import { bits, dots, fx, fxText, healHero, hurtMob, sfx, shake, staggerBoss } from './entities.js';
import { applyBleed, foesNear, isFoe, mostHurt } from './heroes.js';
import { burnTick } from './fire.js';

/** does this hero have this talent? */
export const has = (h, id) => !!(h && h.tal && h.tal.has(id));

/** a hero's stats from talents, as multipliers (makeHero): dmg, heal, hp, threat and haste multiply, crit adds,
 *  armor multiplies the damage taken */
export function talentStats(T) {
  T = T || {};
  return { dmg: 1 + (T.dmg || 0), heal: 1 + (T.heal || 0), hp: 1 + (T.hp || 0), crit: T.crit || 0, haste: 1 + (T.haste || 0), armor: 1 - (T.armor || 0), threat: 1 + (T.threat || 0) };
}

/** what a hero's hit on a mob gets from talents past its stats: Rising Fury (the axe's own), Death Mark (the
 *  marker's own), Brittle (the whole party's, on a frozen or Chilled foe) */
export function talentHitMul(src, m) {
  let k = 1;
  if (src.fury > 0 && src.furyT > 0) k *= 1 + 0.03 * src.fury;
  if (m.markBy === src && m.markUntil > S.t) k *= 1.1;
  if (S.brittle && m.st && (m.st.freeze > 0 || m.st.chill > 0)) k *= 1.1;
  return k;
}

/* ---------- the warrior ---------- */
/** Spiked Shield: a block that isn't perfect hits back for 60 */
export function onBlock(h, src) {
  if (has(h, 'sh.spikes') && src && src.kind === 'mob' && src.alive) hurtMob(src, 60, h, { size: 18, col: '#C9D2DC', key: 'spikes' });
}
/** Brace heals on a perfect block; Payback readies the next Cleave */
export function onPerfect(h) {
  if (has(h, 'sh.brace')) healHero(h, h, h.maxHp * 0.12, { raw: true, size: 18, show: true });
  if (has(h, 'sh.payback')) {
    h.payback = true;
    if (h.isPlayer) fxText(h.x, h.y - 140, 'Payback ready', '#F2C230', 18, { dur: 0.9 });
  }
}
/** Payback: is this Cleave the one a perfect block readied? (it uses it up) */
export function takePayback(h) {
  if (!h.payback) return false;
  h.payback = false;
  return true;
}
/** Payback's swing stuns what it hits (a boss staggers) */
export function paybackStun(m) {
  if (!m.alive || m.M.thing) return;
  if (m.isBoss) staggerBoss(m, 1.2);
  else { m.st.stun = Math.max(m.st.stun, 1.5); m.wind = 0; }
}
/** Hungry Axe: a fifth of the Crushes' damage heals you; Rising Fury stacks with every Crush */
export function onCrush(h, dealt) {
  if (dealt > 0 && has(h, 'ax.hungry')) healHero(h, h, dealt * 0.2, { raw: true, size: 16 });
  if (has(h, 'ax.fury')) {
    h.fury = Math.min(5, (h.furyT > 0 ? h.fury || 0 : 0) + 1);
    h.furyT = 8;
    if (h.isPlayer && h.fury > 1) fxText(h.x, h.y - 150, `Fury ×${h.fury}`, '#FF8A4C', 17, { dur: 0.8 });
  }
}
/** Axe Storm: a primed Cleave sweeps all the way round, and its Crushes hit 15% harder */
export const axeStorm = (h, primed) => primed && has(h, 'ax.storm');
/** Cover: Slam shields your two mates for 120 */
export function onSlam(h) {
  if (!has(h, 'sh.cover')) return;
  for (const a of S.heroes) {
    if (a === h || !a.alive) continue;
    a.absorb = Math.max(a.absorb, Math.round(120 * h.power));
    a.absorbT = Math.max(a.absorbT, 6);
    fx({ type: 'beam', x: h.x, y: h.y - 40, x2: a.x, y2: a.y - 40, col: '#9AA7B8', dur: 0.22 });
    if (a.isPlayer || h.isPlayer) fxText(a.x, a.y - 96, 'Cover', '#DDF3FF', 17);
  }
}
/** Iron Wall: a hit on a mate within 160 of a tank holding the shield up takes a fifth less */
export function wallMul(t) {
  if (t.role === 'tank') return 1;
  for (const h of S.heroes) if (h.role === 'tank' && h.alive && h.blocking && has(h, 'sh.wall') && dist(h, t) <= 160 + t.r) return 0.8;
  return 1;
}

/* ---------- the cleric ---------- */
/** Saving Grace: a Mend on a mate under 35% heals half again */
export const mendMul = (h, t) => (has(h, 'me.saving') && t.hp < t.maxHp * 0.35 ? 1.5 : 1);
/** Overflow: Mend's overhealing becomes a Ward on the same mate, up to 150 */
export function overflow(h, t, over) {
  if (!has(h, 'me.overflow') || over <= 0 || !t.alive) return;
  t.absorb = Math.max(t.absorb, Math.min(150, Math.round(over)));
  t.absorbT = Math.max(t.absorbT, 6);
  t.wardBy = h;
  if (h.isPlayer || t.isPlayer) fxText(t.x, t.y - 96, 'Overflow', '#DDF3FF', 16);
}
/** Walking Prayer: the mate a Prayer circle lands on (it follows them), or none */
export function circleFollows(h, x, y, r) {
  if (!has(h, 'me.walk')) return null;
  let best = null, bd = r + 20;
  for (const a of S.heroes) { if (!a.alive) continue; const d = Math.hypot(a.x - x, a.y - y); if (d < bd) { bd = d; best = a; } }
  return best;
}
/** Twin Ward: Ward shields your next most hurt mate too, for half */
export function twinWard(h, t, amt, dur) {
  if (!has(h, 'me.twin')) return;
  const o = mostHurt(h, t);
  if (!o || o === t) return;
  o.absorb = Math.max(o.absorb, Math.round(amt / 2)); o.absorbT = Math.max(o.absorbT, dur); o.wardBy = h;
  fx({ type: 'beam', x: h.x, y: h.y - 50, x2: o.x, y2: o.y - 40, col: '#DDF3FF', dur: 0.25 });
  if (h.isPlayer || o.isPlayer) fxText(o.x, o.y - 96, 'Ward', '#DDF3FF', 16);
}
/** Miracle: once a run, Sunburst brings a fallen mate in its reach back with 40% health */
export function miracle(h, reach) {
  if (!has(h, 'me.miracle') || h.miracleUsed) return;
  const t = S.heroes.find((a) => !a.alive && a !== h && dist(a, h) <= reach);
  if (!t) return;
  h.miracleUsed = true;
  t.alive = true; t.hp = Math.round(t.maxHp * 0.4); t.deadT = 0; t.iframe = 1; t.flash = 0.2;
  t.st = { stun: 0, root: 0, haunt: 0, air: 0, ghost: 0, surge: 0, zeal: 0, kx: 0, ky: 0, chained: null, caged: null, curse: null };
  fxText(t.x, t.y - 130, 'MIRACLE!', '#F2C230', 32, { dur: 1.6 });
  fx({ type: 'ring', x: t.x, y: t.y - 40, r0: 20, r1: 150, col: '#F2C230', dur: 0.55, w: 8 });
  dots(t.x, t.y - 60, '#FFE08A', 22, 240);
  sfx('revive');
  if (h.isPlayer || t.isPlayer) shake(5);
  emit({ type: 'hero.raised', role: t.role, player: !!t.isPlayer });
}
/** a mate Miracle could bring back now, for the bots */
export const miracleFor = (h, reach) => has(h, 'me.miracle') && !h.miracleUsed && S.heroes.some((a) => !a.alive && a !== h && dist(a, h) <= reach);
/** Smite's heal goes to your most hurt mate, and with Twin Light the next most hurt too */
export function smiteHealTargets(h) {
  const a = mostHurt(h, null);
  if (!a || a.hp >= a.maxHp) return [];
  if (!has(h, 'wr.twin')) return [a];
  const b = mostHurt(h, a);
  return b && b.hp < b.maxHp ? [a, b] : [a];
}
/** Burning Light: Smite sets its target burning for 40 over 4 seconds */
export function smiteSear(h, t) {
  if (!has(h, 'wr.burn') || !t.alive || t.M.thing || t.cage) return;
  t.sear = { src: h, per: 10, left: 4, next: 1 };
}
/** Sunlance: Smite goes on into one more foe, behind its target */
export function sunlanceTarget(h, t) {
  if (!has(h, 'wr.lance')) return null;
  const a = angTo(h, t);
  let best = null, bd = 220;
  for (const m of S.mobs) {
    if (m === t || !isFoe(m) || m.cage || m.M.thing || m.M.wisp) continue;
    const d = dist(m, t);
    if (d < bd && Math.cos(angTo(t, m) - a) > 0.1) { bd = d; best = m; }
  }
  return best;
}
/** Sunstrike: a Smite crit heals your whole party for what it dealt */
export function sunstrike(h, got) {
  if (!has(h, 'wr.sunstrike') || got <= 0) return;
  for (const a of S.heroes) if (a.alive && a.hp < a.maxHp) healHero(h, a, got, { raw: true, size: 17 });
  fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 30, r1: 300, col: '#F2C230', dur: 0.4, w: 6 });
  if (h.isPlayer) fxText(h.x, h.y - 140, 'Sunstrike!', '#F2C230', 22, { dur: 1.0 });
}
/** Holy Ground: a Prayer circle of yours burns the foes in it, every pulse */
export function holyGround(z) {
  if (!has(z.src, 'wr.ground')) return;
  for (const m of S.mobs) if (isFoe(m) && !m.cage && !m.M.wisp && Math.hypot(m.x - z.x, m.y - z.y) <= z.r + m.r * 0.5) hurtMob(m, 18, z.src, { col: '#FFE08A', size: 15, noCrit: true, tier: 'tick', key: 'ground' });
}

/* ---------- the mage (frost; fire is fire.js) ---------- */
/** Deep Freeze: Rime burst's freeze a second longer, a boss's Chill two seconds longer */
export const deepFreeze = (h) => (has(h, 'fr.deep') ? { freeze: 1, chill: 2 } : { freeze: 0, chill: 0 });
/** Frostbite: a foe that has stayed 2 seconds in a Blizzard of yours freezes (a boss is Chilled), then it can't
 *  again for 2 seconds */
export function frostbite(z, m) {
  if (!has(z.src, 'fr.bite') || m.M.wisp || m.M.thing) return;
  const inT = (z.inT ||= {});
  inT[m.id] = (inT[m.id] || 0) + z.tick;
  if (inT[m.id] < 2) return;
  inT[m.id] = -2;
  if (m.isBoss) { m.st.chill = Math.max(m.st.chill || 0, 2); fxText(m.x, m.y - 245, 'Chilled', '#8FD6FF', 20, { dur: 0.9 }); }
  else { m.st.freeze = Math.max(m.st.freeze, 1); m.wind = 0; }
}
/** Shardburst: a Shatter hits every foe near it for a quarter as much */
export function shardburst(h, t, got) {
  if (!has(h, 'fr.shards') || got <= 0) return;
  for (const o of foesNear(t.x, t.y, 110, false)) if (o !== t && !o.cage && !o.M.thing) hurtMob(o, got / 4, h, { raw: true, noCrit: true, size: 16, col: '#8FD6FF', tier: 'tick', key: 'shards' });
  bits(t.x, t.y - 40, 'shard_ice', 6, 220);
}
/** Hailstorm: another foe for Icicle's second shard (the same one if it's alone) */
export function hailTarget(h, t) {
  if (!has(h, 'fr.hail')) return null;
  let best = null, bd = 420;
  for (const m of S.mobs) { if (m === t || !isFoe(m) || m.cage || m.M.thing || m.M.wisp || m.state !== 'fight') continue; const d = dist(m, t); if (d < bd) { bd = d; best = m; } }
  return best || t;
}

/* ---------- the rogue ---------- */
/** Deadly Venom: Viper Venom stacks twice */
export const venomStacks = (h) => (has(h, 've.deadly') ? 2 : 1);
/** Toxic Burst: a poisoned Shadowstrike deals all of the venom's damage at once, and it's gone */
export function toxicBurst(h, t) {
  if (!has(h, 've.burst') || !t.bleed || t.bleed.left <= 0 || !t.alive) return;
  const b = t.bleed, ticks = Math.ceil(b.left / 0.5);
  t.bleed = null;
  hurtMob(t, b.per * (b.n || 1) * ticks, h, { raw: true, noCrit: true, col: '#7CF06A', size: 22, key: 'toxic' });
  dots(t.x, t.y - 44, '#7CF06A', 10, 160);
}
/** Death Mark: Shadowstep marks its target, which takes 10% more from you for 8 seconds */
export function deathMark(h, t) {
  if (!has(h, 've.mark') || !t.alive) return;
  t.markBy = h; t.markUntil = S.t + 8;
  if (h.isPlayer) fxText(t.x, t.y - (t.isBoss ? 200 : 110), 'Marked', '#FF6B6B', 18, { dur: 0.9 });
}
/** Scatter: Shadowstrike hits every foe near its target for half */
export function scatter(h, t, dmg) {
  if (!has(h, 'bl.scatter')) return;
  for (const o of foesNear(t.x, t.y, 130, false)) if (o !== t && !o.cage && !o.M.thing) hurtMob(o, dmg / 2, h, { crit: 0.2, col: '#B79CFF', size: 18, key: 'scatter' });
}
/** Sweeping Blades: the foes Viper Blades slashes besides its target (everything in front of you) */
export function sweepFoes(h, t) {
  if (!has(h, 'bl.sweep')) return [];
  return foesNear(h.x, h.y, 100, false).filter((m) => m !== t && !m.cage && Math.abs(Math.atan2(Math.sin(angTo(h, m) - h.face), Math.cos(angTo(h, m) - h.face))) < 1.1);
}
/** Venom Spray: Fan of Blades poisons everything it hits */
export function fanVenom(h, m) {
  if (has(h, 'bl.spray') ? m.alive : m.alive && m.bleed && m.bleed.left > 0) applyBleed(h, m);
}
/** Knife Storm: for 4 seconds after Shadowstep your swings hit every foe around you */
export const knifeStorm = (h) => has(h, 'bl.storm') && h.stormT > 0;

/* ---------- damage over time on mobs: venom, Burning Light's sear, Fire's Burn ---------- */
/** Ticks a mob's venom, sear and burn. True if it died. */
export function tickDots(m, dt) {
  const b = m.bleed;
  if (b && b.left > 0) {
    b.left -= dt; b.next -= dt;
    if (b.next <= 0) {
      b.next += 0.5;
      hurtMob(m, b.per * (b.n || 1), b.src, { col: '#7CF06A', size: 16, noCrit: true, tier: 'tick', key: 'venom' });
      dots(m.x, m.y - 38, '#7CF06A', 2, 70, { size: 4 });
      if (!m.alive) return true;
    }
  }
  const s = m.sear;
  if (s && s.left > 0) {
    s.left -= dt; s.next -= dt;
    if (s.next <= 0) {
      s.next += 1;
      hurtMob(m, s.per, s.src, { col: '#FFE08A', size: 15, noCrit: true, tier: 'tick', key: 'sear' });
      if (!m.alive) return true;
    }
  }
  return burnTick(m, dt);
}
