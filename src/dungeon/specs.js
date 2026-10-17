/* ---------- specs: what a hero's talents do in a run ----------
   A hero's spec and talents come with its loadout (meta/talents.ts talentLoadout): h.spec, h.tal (the talents
   that change a button) and h.ts (its stats added up, made into multipliers by makeHero). The stats are read
   where they apply (entities.js: damage, healing, health, crit, damage taken; heroes.js: cooldowns; threat at
   makeHero). Each talent that changes a button is here, called from that button in buttons.js, or from the hit
   or the tick it changes. Fire's own four buttons and its Burn are fire.js. Ids are content/talents' own. */
import { angTo, dist } from '../core/math';
import { S, emit } from './state.js';
import { STAGGER, bits, chillBoss, dots, exposeMob, fx, fxText, healHero, hurtMob, sfx, shake, staggerBoss } from './entities.js';
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

/** what a hero's hit on a mob gets from talents past its stats: Rising Fury (the axe's own), Grave Mark and
 *  Cutting Wind (on a foe its rogue marked or cut), Brittle (the whole party's, on a frozen or Chilled foe), and
 *  what a Mercy healer gave the hero: Heartening (after a Mend), Rally (while their Ward holds), Dawn (after
 *  Sunburst) */
export function talentHitMul(src, m) {
  let k = 1;
  if (src.fury > 0 && src.furyT > 0) k *= 1 + 0.03 * src.fury;
  if (m.markBy === src && m.markUntil > S.t) k *= 1.1;
  if (m.windBy === src && m.windUntil > S.t) k *= 1.15;
  if (S.brittle && m.st && (m.st.freeze > 0 || m.st.chill > 0)) k *= 1.1;
  if (src.heartT > 0) k *= 1.1;
  if (src.absorb > 0 && src.wardBy && has(src.wardBy, 'me.rally')) k *= 1.15;
  if (src.dawnT > 0) k *= 1.25;
  return k;
}
/** how many foes are on this hero now (fighting it) */
export const foesOn = (h) => S.mobs.reduce((n, m) => n + (isFoe(m) && !m.cage && !m.M.thing && m.target === h ? 1 : 0), 0);

/* ---------- the warrior ---------- */
/** Spiked Shield: a foe that hits you takes 30 back, 90 if you blocked it (not a telegraph's hit, which isn't a
 *  swing) */
export function spikes(h, src, blocked) {
  if (!has(h, 'sh.spikes') || !src || src.kind !== 'mob' || !src.alive || src.M.thing) return;
  hurtMob(src, blocked ? 90 : 30, h, { size: blocked ? 18 : 15, col: '#C9D2DC', noCrit: true, tier: 'tick', key: 'spikes' });
}
/** Payback readies the next Cleave on a perfect block */
export function onPerfect(h) {
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
/** Rim Strike: is this Cleave a third one, that stuns what it hits? (it counts the Cleaves) */
export const rimStrike = (h) => has(h, 'sh.rim') && ++h.rims % 3 === 0;
/** a Rim Strike or a Final Word's stun on what it hit: a second (a boss staggers) */
export function stunHit(m, dur) {
  if (!m.alive || m.M.thing) return;
  if (m.isBoss) staggerBoss(m, STAGGER);
  else { m.st.stun = Math.max(m.st.stun, dur); m.wind = 0; }
}
/** Breach: Charge Exposes what it hits for 2 seconds */
export function breach(h, m) {
  if (has(h, 'sh.brace') && m.alive && !m.M.thing) exposeMob(m, 2, 'Exposed!');
}
/** Bulwark: how far Slam reaches (half as far again), and what the foes it pulled add to your next Cleave */
export const slamReach = (h) => (has(h, 'sh.bulwark') ? 1.5 : 1);
export function bulwarkPull(h, n) { if (has(h, 'sh.bulwark') && n > 0) h.bulwark = Math.min(8, n); }
/** the Cleave after a Bulwark Slam: 6% harder a foe it pulled (up to 8); it uses it up */
export function bulwarkMul(h) {
  if (!h.bulwark) return 1;
  const k = 1 + 0.06 * h.bulwark;
  h.bulwark = 0;
  return k;
}
/** Unbowed: three or more foes on you make Slam come back twice as fast and its whirlwind twice as hard */
export const unbowed = (h) => has(h, 'sh.unbowed') && foesOn(h) >= 3;
/** Savage Swing: Cleave 15% harder on a foe under half its health */
export const savageMul = (h, m) => (has(h, 'ax.savage') && m.hp < m.maxHp * 0.5 ? 1.15 : 1);
/** Headlong: Charge primes two Crushes, not one */
export const chargeCrushes = (h) => (has(h, 'ax.headlong') ? 2 : 1);
/** Final Word: is this foe low enough for a Crush to finish (a boss to take it twice as hard)? */
export const finalWord = (h, m) => has(h, 'ax.final') && m.hp < m.maxHp * 0.2;
/** a finishing blow: whatever a foe has left (a Final Word, a Last Breath) */
export function finish(h, m, word) {
  if (!m.alive || m.isBoss || m.M.thing) return;
  hurtMob(m, m.hp + 1, h, { raw: true, noCrit: true, quiet: true });
  if (h.isPlayer) fxText(m.x, m.y - 120, word, '#F2C230', 22, { dur: 0.9 });
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
/** Heartening: a mate you Mend hits 10% harder for 6 seconds */
export function hearten(h, t) {
  if (!has(h, 'me.heart') || !t.alive) return;
  if (!(t.heartT > 0) && (h.isPlayer || t.isPlayer)) fxText(t.x, t.y - 120, 'Heartened', '#F2C230', 16, { dur: 0.8 });
  t.heartT = 6;
}
/** Rally: with nobody badly hurt, Ward goes on the mate who hits hardest (the DPS) */
export function rallyWard(h) {
  if (!has(h, 'me.rally')) return null;
  if (S.heroes.some((a) => a.alive && a.hp < a.maxHp * 0.7)) return null;
  const d = S.heroes.find((a) => a.alive && a.role === 'dps' && a !== h);
  return d && d.absorb <= 0 ? d : null;
}
/** Dawn: Sunburst makes everyone it reaches hit 25% harder for 8 seconds */
export function dawn(h, a) {
  if (!has(h, 'me.dawn') || !a.alive) return;
  a.dawnT = 8;
  if (h.isPlayer || a.isPlayer) fxText(a.x, a.y - 120, 'Dawn', '#F2C230', 18, { dur: 0.9 });
}
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
/** Twice Struck: is this Smite a third one, that strikes twice? (it counts the Smites) */
export const twiceStruck = (h) => has(h, 'wr.twice') && ++h.smites % 3 === 0;
/** Flashpoint: a Smite crit bursts, hitting every foe near its target for half */
export function flashpoint(h, t, got) {
  if (!has(h, 'wr.flash') || got <= 0) return;
  for (const o of foesNear(t.x, t.y, 120, false)) if (o !== t && !o.cage && !o.M.wisp && !o.M.thing) hurtMob(o, got / 2, h, { raw: true, noCrit: true, size: 17, col: '#FFE08A', key: 'flash' });
  fx({ type: 'ring', x: t.x, y: t.y - 30, r0: 16, r1: 120, col: '#F2C230', dur: 0.3, w: 6 });
}
/** Sunpillar: Sunburst calls a pillar of light on your target, 300 to it and 100 to the foes round it */
export function sunpillar(h, t) {
  if (!has(h, 'wr.pillar') || !t || !isFoe(t) || t.cage) return;
  hurtMob(t, 300, h, { crit: 0.15, col: '#FFE08A', key: 'pillar' });
  for (const o of foesNear(t.x, t.y, 110, false)) if (o !== t && !o.cage && !o.M.wisp && !o.M.thing) hurtMob(o, 100, h, { noCrit: true, size: 18, col: '#FFE08A', key: 'pillar' });
  fx({ type: 'beam', x: t.x, y: t.y - 420, x2: t.x, y2: t.y - 20, col: '#FFE08A', dur: 0.35 });
  fx({ type: 'ring', x: t.x, y: t.y, r0: 14, r1: 110, col: '#F2C230', dur: 0.32, w: 8, ground: true });
  dots(t.x, t.y - 60, '#FFE08A', 12, 220);
}
/** Holy Ground: a Prayer circle of yours burns the foes in it, every pulse */
export function holyGround(z) {
  if (!has(z.src, 'wr.ground')) return;
  for (const m of S.mobs) if (isFoe(m) && !m.cage && !m.M.wisp && Math.hypot(m.x - z.x, m.y - z.y) <= z.r + m.r * 0.5) hurtMob(m, 18, z.src, { col: '#FFE08A', size: 15, noCrit: true, tier: 'tick', key: 'ground' });
}

/* ---------- the mage (frost; fire is fire.js) ---------- */
/** Hard Rime: Icicle hits a frozen or Chilled foe 15% harder */
export const hardRime = (h, t) => (has(h, 'fr.deep') && t.st && (t.st.freeze > 0 || t.st.chill > 0) ? 1.15 : 1);
/** Wide Winter: Blizzard a third wider and a second longer */
export const wideWinter = (h) => (has(h, 'fr.wide') ? { r: 1.33, dur: 1 } : { r: 1, dur: 0 });
/** Long Winter: is this foe in a Blizzard of yours (so a Comet into it Shatters as if it were frozen)? */
export const longWinter = (h, t) => has(h, 'fr.long') && S.zones.some((z) => z.kind === 'blizzard' && z.src === h && Math.hypot(t.x - z.x, t.y - z.y) <= z.r + t.r * 0.5);
/** Icefall: a Blizzard of yours ends in a crash of ice, three of its hits at once on everything in it, which
 *  freezes for 2 seconds (a boss is Chilled) */
export function icefall(z) {
  if (z.kind !== 'blizzard' || !has(z.src, 'fr.icefall') || !z.src.alive) return;
  for (const m of foesNear(z.x, z.y, z.r, false)) {
    if (m.cage || m.M.thing || m.M.wisp) continue;
    hurtMob(m, (z.val || 20) * 3, z.src, { crit: 0.15, col: '#8FD6FF', size: 20, key: 'icefall' });
    if (!m.alive) continue;
    if (m.isBoss) chillBoss(m, 2); else { m.st.freeze = Math.max(m.st.freeze, 2); m.wind = 0; }
  }
  fx({ type: 'ring', x: z.x, y: z.y, r0: z.r, r1: 20, col: '#DDF3FF', dur: 0.3, w: 9, ground: true });
  bits(z.x, z.y - 30, 'shard_ice', 14, 300);
  if (z.src.isPlayer) { fxText(z.x, z.y - 140, 'Icefall!', '#8FD6FF', 22, { dur: 0.9 }); shake(3); }
  sfx('shatter', z.src.isPlayer ? 0.8 : 0.4);
}
/** Numbing Cold: a foe that has stayed 2 seconds in a Blizzard of yours freezes (a boss is Chilled), then it can't
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
/** Bitter Edge: Viper Blades 25% harder on a poisoned foe */
export const bitterMul = (h, t) => (has(h, 've.bitter') && t.bleed && t.bleed.left > 0 ? 1.25 : 1);
/** Lingering Cut: a poisoned Shadowstrike leaves its foe bleeding for half the hit again over 4 seconds */
export function lingeringCut(h, t, got) {
  if (!has(h, 've.cut') || !t.alive || got <= 0 || t.M.thing) return;
  t.cut = { src: h, per: (got * 0.5) / 8, left: 4, next: 0.5 };
}
/** Last Breath: is this foe low enough for Shadowstrike to finish (a boss to take half again)? */
export const lastBreath = (h, t) => has(h, 've.last') && t.hp < t.maxHp * 0.2;
/** Twin Edge: Viper Blades strikes twice, each 60% as hard */
export const twinEdge = (h) => has(h, 'bl.twin');
/** Second Ring: Fan of Blades throws a second ring a moment later */
export const secondRing = (h) => has(h, 'bl.ring');
/** Cutting Wind: a foe Fan of Blades hits takes 15% more from you for 6 seconds */
export function cuttingWind(h, m) {
  if (!has(h, 'bl.wind') || !m.alive || m.M.thing) return;
  m.windBy = h; m.windUntil = S.t + 6;
}
/** Toxic Burst: a poisoned Shadowstrike deals all of the venom's damage at once, and it's gone */
export function toxicBurst(h, t) {
  if (!has(h, 've.burst') || !t.bleed || t.bleed.left <= 0 || !t.alive) return;
  const b = t.bleed, ticks = Math.ceil(b.left / 0.5);
  t.bleed = null;
  hurtMob(t, b.per * (b.n || 1) * ticks, h, { raw: true, noCrit: true, col: '#7CF06A', size: 22, key: 'toxic' });
  dots(t.x, t.y - 44, '#7CF06A', 10, 160);
}
/** Grave Mark: Shadowstep marks its target, which takes 10% more from you for 8 seconds */
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
/** Knife Storm: for 6 seconds after Shadowstep, Viper Blades and your swings hit every foe around you */
export const knifeStorm = (h) => has(h, 'bl.storm') && h.stormT > 0;
export const KNIFE_STORM = 6;

/* ---------- damage over time on mobs: venom, Lingering Cut, Burning Light's sear, Fire's Burn ---------- */
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
  const c = m.cut;
  if (c && c.left > 0) {
    c.left -= dt; c.next -= dt;
    if (c.next <= 0) {
      c.next += 0.5;
      hurtMob(m, c.per, c.src, { raw: true, col: '#FF6B6B', size: 15, noCrit: true, tier: 'tick', key: 'cut' });
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
