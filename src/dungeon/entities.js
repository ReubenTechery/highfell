/* ---------- entities: heroes, mobs, damage, healing, threat ---------- */
import { angDiff, TAU } from '../core/math';
import { rand, rng, vrand } from '../core/rng';
import { hpMultiplier } from '../content/gear';
import { ROLES } from '../content/roles';
import { HOOKS, S, emit } from './state.js';
import { onBossDead, checkPack, startBoss } from './game.js';
import { breakCage, cutChain, interruptCast } from './mobs.js';
import { onPerfectBlock } from './heroes.js';

export const sfx = (n, v) => { if (S && !S.quiet) HOOKS.sound(n, v); };
const later = (t, fn) => S.timers.push({ t, fn });

/* loadout: what the meta layer worked out from the hero's gear.
   { power, traits: Set, bonuses: Set, weaponRar, unique } */
export function makeHero(role, isPlayer, loadout) {
  const R = ROLES[role];
  const L = loadout || {};
  const power = L.power || 1;
  const maxHp = Math.round(R.hp * hpMultiplier(power));
  return {
    id: 'h_' + role, kind: 'hero', role, name: R.name, isPlayer, x: 0, y: 0, r: R.r,
    face: -Math.PI / 2, back: true, flip: false, hp: maxHp, maxHp, armor: R.armor, power,
    traits: new Set(L.traits || []), bonuses: new Set(L.bonuses || []), unique: L.unique || null,
    weaponRar: L.weaponRar || 0, threatMod: R.threat, speed: R.speed, alive: true,
    mana: 100, maxMana: 100, cd: { a1: 0, a2: 0, a3: 0, a4: 0, dodge: 0 }, gcd: 0, atkT: 0.4,
    target: null, picked: null, stillT: 1, dodgeT: 0, dodgeX: 0, dodgeY: -1, iframe: 0,
    blocking: false, blockT: 9, dash: null, cast: null,
    st: { stun: 0, root: 0, haunt: 0, air: 0, kx: 0, ky: 0, chained: null, caged: null },
    absorb: 0, absorbT: 0, flash: 0, hurtT: 0, lunge: 0, lungeA: 0, walkT: 0, squash: 0, moving: 0,
    say: null, sayT: 0, deadT: 0, swings: 0, hots: [],
    intent: { mx: 0, my: 0, block: false },
    bot: { think: 0, react: rand(0.18, 0.34), skill: isPlayer ? 0.97 : 0.93, goal: null, lastPos: null, waitT: 0, blockFor: null, cutAt: 0, side: rng() < 0.5 ? -1 : 1, dodged: new Set() },
    stats: { dmg: 0, heal: 0, taken: 0, dodges: 0, blocks: 0, perfect: 0, deaths: 0, overheal: 0 },
  };
}

export function makeMob(type, x, y, pack) {
  const M = S.dg.mobs[type];
  return {
    id: 'm' + (S.seq++), kind: 'mob', type, M, name: M.name, x, y, r: M.r, home: { x, y }, home0: { x, y }, pack,
    hp: M.hp, maxHp: M.hp, speed: M.speed, alive: true, state: 'idle',
    threat: new Map(), target: null, forced: null, forcedT: 0,
    atkT: rand(0.3, 0.9), wind: 0, ab: {}, cast: null, busy: 0,
    st: { stun: 0, freeze: 0, slow: 0, slowT: 0, kx: 0, ky: 0 },
    flash: 0, lunge: 0, lungeA: 0, face: Math.PI / 2, flip: rng() < 0.5, walkT: rand(0, 6), squash: 0, rise: 0, deadT: 0, moving: 0,
    isBoss: !!M.boss, phase: 1, armorUp: 0, untargetable: false, hidden: false, pose: null, dmgMul: 1, ghostProps: !!M.wisp,
  };
}

/* ---------- floating text and effects ---------- */
export function fxText(x, y, str, col, size, o) { S.texts.push(Object.assign({ x: x + vrand(-8, 8), y, str, col, size: size || 22, t: 0, dur: 1.0, vy: -70 }, o || {})); }
export function fx(o) { o.t = 0; S.fx.push(o); return o; }
export function shake(a) { S.shake = Math.max(S.shake, a); }
export function hitstop(t) { S.hitstop = Math.max(S.hitstop, t); }
export function bits(x, y, sp, n, spd, o) {
  for (let i = 0; i < n; i++) {
    const a = vrand(0, TAU), v = vrand(spd * 0.4, spd);
    S.parts.push(Object.assign({ x, y, z: vrand(10, 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vrand(120, 320), sp, rot: vrand(0, TAU), vr: vrand(-8, 8), t: 0, dur: vrand(0.6, 1.1) }, o || {}));
  }
}
export function dots(x, y, col, n, spd, o) {
  for (let i = 0; i < n; i++) {
    const a = vrand(0, TAU), v = vrand(spd * 0.3, spd);
    S.parts.push(Object.assign({ x, y, z: vrand(0, 30), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vrand(40, 160), col, size: vrand(3, 6), t: 0, dur: vrand(0.35, 0.7) }, o || {}));
  }
}
export function say(h, str, dur) { h.say = str; h.sayT = dur || 1.2; }
export function banner(str, kind, dur) { S.banner = { str, kind: kind || '', t: 0, dur: dur || 2.2 }; }
export function call(str, kind, dur) { S.call = { str, kind: kind || '', t: 0, dur: dur || 1.1 }; }

/* ---------- threat ---------- */
export function addThreat(m, h, v) { if (m.cage || m.M.wisp) return; m.threat.set(h.id, (m.threat.get(h.id) || 0) + v); }
export function topThreat(m) { let v = 0; m.threat.forEach((x) => { if (x > v) v = x; }); return v; }
export function pickTarget(m) {
  if (m.forcedT > 0 && m.forced && m.forced.alive) return m.forced;
  let best = null, bv = -1;
  for (const h of S.heroes) { if (!h.alive) continue; const v = m.threat.get(h.id) || 0; if (v > bv) { bv = v; best = h; } }
  if (m.target && m.target.alive && best !== m.target) { const cv = m.threat.get(m.target.id) || 0; if (bv < cv * 1.1 + 2) return m.target; }
  return best;
}
export function aggro(m, h, v) {
  if (!m.alive || m.cage) return;
  if (m.state === 'idle') { m.state = 'fight'; m.fightT = 0; m.atkT = Math.max(m.atkT, 0.5); onMobAggro(m); }
  if (h) addThreat(m, h, v || 1);
}
function onMobAggro(m) {
  if (m.pack && !m.pack.pulled) {
    m.pack.pulled = true;
    m.pack.mobs.forEach((o) => { if (o !== m && o.alive && o.state === 'idle') { o.state = 'fight'; o.fightT = 0; m.threat.forEach((v, k) => o.threat.set(k, Math.max(o.threat.get(k) || 0, 1))); } });
    if (m.pack.def.boss) startBoss(m.pack);
  }
}
export function taunt(m, h, dur) {
  if (!m.alive || m.cage || m.M.wisp) return;
  aggro(m, h, 1);
  m.threat.set(h.id, Math.max(topThreat(m) * 1.3 + 40, m.threat.get(h.id) || 0));
  m.forced = h; m.forcedT = dur || 4; m.target = h;
}

/* ---------- damage to heroes ---------- */
/** how long after raising the shield a heavy hit counts as a perfect block */
export const PERFECT_WINDOW = 0.5;

export function hurtHero(h, amt, src, o) {
  o = o || {};
  if (!h.alive || S.over) return 0;
  if (h.iframe > 0 && o.dodge !== false) { if (!o.quiet) { fxText(h.x, h.y - 80, 'Dodged', '#DDF3FF', 18); h.stats.dodges++; } return 0; }
  if (o.ground && h.st.air > 0) return 0;
  let a = amt;
  if (o.block !== false && h.blocking && src) {
    const off = Math.abs(angDiff(h.face, Math.atan2(src.y - h.y, src.x - h.x)));
    if (off < 1.45) {
      if (o.heavy && o.perfectable !== false && h.blockT <= PERFECT_WINDOW) {
        a = 0; h.stats.perfect++; S.stats.perfect++;
        fxText(h.x, h.y - 96, 'PERFECT!', '#F2C230', 30, { dur: 1.3 });
        if (src.kind === 'mob' && src.alive) { src.st.stun = Math.max(src.st.stun, src.isBoss ? 1.6 : 1.2); src.wind = 0; src.busy = 0; fxText(src.x, src.y - (src.isBoss ? 200 : 110), 'Stunned', '#FFE08A', 20); }
        sfx('perfect'); shake(6); hitstop(0.08);
        fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 20, r1: 110, col: '#F2C230', dur: 0.35, w: 6 });
        if (o.smash && S.bossFight && h.isPlayer) S.bossFight.smashPerfect++;
        emit({ type: 'block', perfect: true, player: !!h.isPlayer, smash: !!o.smash });
        onPerfectBlock(h, src);
      } else {
        a *= 0.25; h.stats.blocks++;
        fxText(h.x, h.y - 90, 'Blocked', '#C9D2DC', 18); sfx('block');
        fx({ type: 'ring', x: h.x + Math.cos(h.face) * 22, y: h.y - 30 + Math.sin(h.face) * 12, r0: 6, r1: 40, col: '#FFFFFF', dur: 0.2, w: 4 });
        emit({ type: 'block', perfect: false, player: !!h.isPlayer, smash: !!o.smash });
      }
    }
  }
  if (!o.pierce) a *= 1 - h.armor * (o.magic ? 0.4 : 1);
  if (h.absorb > 0 && a > 0) {
    const t = Math.min(h.absorb, a); h.absorb -= t; a -= t;
    if (t > 0 && !o.quiet) fxText(h.x, h.y - 70, 'Absorbed', '#DDF3FF', 16);
    if (h.absorb <= 0.5) {
      h.absorb = 0;
      // Kindle: a Ward that breaks heals whoever wore it
      const by = h.wardBy; h.wardBy = null;
      if (by && by.alive && by.traits.has('kindle')) later(0, () => healHero(by, h, 80, { show: true, raw: true }));
    }
  }
  a = Math.round(a);
  if (a > 0) {
    h.hp -= a; h.flash = 0.12; h.hurtT = 0.25; h.stats.taken += a;
    if (!o.quiet) fxText(h.x, h.y - 60, '-' + a, '#FF6B5E', a >= 100 ? 26 : 20);
    if (h.isPlayer) { shake(a >= 100 ? 7 : 3); S.hurtFlash = Math.min(1, S.hurtFlash + a / 300); }
    if (o.kind) { S.stats[o.kind + 'Hits'] = (S.stats[o.kind + 'Hits'] || 0) + 1; emit({ type: 'hazard.hit', kind: o.kind, player: !!h.isPlayer }); }
    if (h.hp <= 0) killHero(h);
  }
  return a;
}
export function killHero(h) {
  h.hp = 0; h.alive = false; h.blocking = false; h.cast = null; h.dash = null; h.deadT = 0; h.stats.deaths++; S.stats.deaths++;
  if (h.st.chained) cutChain(h.st.chained, false);
  if (h.st.caged) breakCage(h.st.caged, false);
  fxText(h.x, h.y - 100, h.isPlayer ? 'You went down' : h.name + ' is down', '#FF6B5E', 22, { dur: 1.8 });
  if (h.isPlayer && S.heroes.some((o) => o.alive && o !== h)) banner('You’re down. Your mates can still win this one.', 'warn', 3);
  sfx('down');
  bits(h.x, h.y - 30, 'shard_dirt', 5, 120);
  for (const m of S.mobs) { m.threat.delete(h.id); if (m.target === h) m.target = null; if (m.forced === h) { m.forced = null; m.forcedT = 0; } }
  emit({ type: 'hero.died', role: h.role, player: !!h.isPlayer });
}

/* ---------- damage to mobs ---------- */
export function hurtMob(m, amt, src, o) {
  o = o || {};
  if (!m.alive || m.untargetable || S.over) return 0;
  if (m.cage) { m.hp -= 1; m.flash = 0.1; sfx('cagehit'); bits(m.x, m.y - 50, 'shard_bone', 1, 90); if (m.hp <= 0) breakCage(m, true, src); return 1; }
  let a = amt * (o.raw ? 1 : (src && src.power) || 1);
  let crit = false;
  if (!o.noCrit && rng() < (o.crit === undefined ? 0.12 : o.crit)) { a *= 2; crit = true; }
  else if (!o.noCrit && src && src.traits && src.traits.has('headsman') && m.st.stun > 0) { a *= 2; crit = true; }
  if (o.shatter && m.st.freeze > 0) a *= o.shatter;
  if (m.armorUp > 0) a *= 1 - m.armorUp;
  a = Math.round(a);
  if (a <= 0) return 0;
  m.hp -= a;
  if (!m.isBoss || crit || a >= 200) m.flash = m.isBoss ? 0.07 : 0.08;
  if (m.cast && m.cast.kick) { m.cast.taken += a; if (m.cast.taken >= m.cast.kick) interruptCast(m); }
  if (src && src.kind === 'hero') { aggro(m, src, 0); addThreat(m, src, a * src.threatMod * (o.threat || 1)); src.stats.dmg += a; }
  const big = crit || a >= 250;
  if (!o.quiet) fxText(m.x, m.y - (m.isBoss ? 170 : m.M.big ? 120 : 70), (crit ? a + '!' : '' + a), o.col || (crit ? '#F2C230' : '#FFFFFF'), o.size || (a >= 600 ? 40 : big ? 30 : 21), { dur: big ? 1.15 : 0.9, crit, mine: !!(src && src.isPlayer) });
  if (o.knock && !m.isBoss && !m.M.big) { const an = Math.atan2(m.y - src.y, m.x - src.x); m.st.kx += Math.cos(an) * o.knock; m.st.ky += Math.sin(an) * o.knock; }
  if (crit && src && src.isPlayer) hitstop(0.035);
  if (crit && src && src.kind === 'hero') emit({ type: 'crit', amount: a, player: !!src.isPlayer });
  if (m.hp <= 0) killMob(m, src);
  return a;
}
export function killMob(m, src) {
  m.hp = 0; m.alive = false; m.deadT = 0; m.cast = null; m.state = 'dead';
  emit({ type: 'mob.killed', mob: m.type, boss: !!m.isBoss, undead: !!m.M.skeleton, byPlayer: !!(src && src.isPlayer) });
  if (m.M.wisp) { dots(m.x, m.y - 40, '#C8F5E8', 10, 160); fx({ type: 'ring', x: m.x, y: m.y - 40, r0: 8, r1: 46, col: '#C8F5E8', dur: 0.25, w: 4 }); sfx('pop'); return; }
  const big = m.M.big;
  bits(m.x, m.y - (big ? 70 : 40), 'shard_bone', big ? 10 : 5, big ? 260 : 190);
  bits(m.x, m.y - (big ? 90 : 60), 'shard_skull', 1, 150);
  sfx(big ? 'bigdie' : 'die');
  if (src && src.isPlayer) hitstop(big ? 0.09 : 0.04);
  if (m.isBoss) onBossDead(m);
  if (m.pack) checkPack(m.pack);
}

/* ---------- healing ---------- */
export function healHero(src, t, amt, o) {
  o = o || {};
  if (!t.alive) return 0;
  const before = t.hp / t.maxHp;
  const a = Math.round(amt * (o.raw ? 1 : (src && src.power) || 1));
  const real = Math.min(a, t.maxHp - t.hp);
  t.hp += real;
  if (src) { src.stats.heal += real; src.stats.overheal += a - real; }
  if (real > 0 || o.show) fxText(t.x, t.y - 74, '+' + a, '#7BE05A', o.size || (a >= 150 ? 22 : 18), { dur: 0.9 });
  // healing pulls a little threat from everything in the fight
  if (src && real > 0) { const fighting = S.mobs.filter((m) => m.alive && m.state === 'fight' && !m.cage && !m.M.wisp); fighting.forEach((m) => addThreat(m, src, (real * 0.5) / Math.max(1, fighting.length))); }
  // a save: the player catches someone under 15% and they are still up three seconds later
  if (src && src.isPlayer && real > 0 && before < 0.15 && S.t >= (t.saveLock || 0)) {
    t.saveLock = S.t + 6;
    S.timers.push({ t: 3, fn: () => { if (t.alive) { S.stats.saves = (S.stats.saves || 0) + 1; emit({ type: 'heal.save', player: true }); } } });
  }
  return real;
}
