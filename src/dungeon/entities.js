/* ---------- entities: heroes, mobs, damage, healing, threat ---------- */
import { angDiff, TAU } from '../core/math';
import { rand, rng, vrand } from '../core/rng';
import { hpMultiplier } from '../content/gear';
import { ROLES } from '../content/roles';
import { HOOKS, S, SHARED_MOBS, emit } from './state.js';
import { onBossDead, checkPack, startBoss } from './game.js';
import { breakCage, cutChain, interruptCast } from './mobs.js';
import { onPerfectBlock } from './heroes.js';

/* play a sound; during the pet walkout everything is hushed except what forces through */
export const sfx = (n, v, force) => { if (S && !S.quiet && (!S.hush || force)) HOOKS.sound(n, v); };
/* floating numbers and hit words are only shown when they are about you: your hits, your heals, what hits you */
export const mine = (a, b) => !!((a && a.isPlayer) || (b && b.isPlayer));
const later = (t, fn) => S.timers.push({ t, fn });

/* What each brew does, by recipe id. One bottle is poured at the door for the whole party, so every hero
   carries it: dmg (all damage), speed (moving), threat (the tank's grip), area (how wide area hits reach,
   see foesNear), cd (how fast cooldowns come back), dodgeHeal (a share of health per dodge), save (once a
   run, a knockout hit leaves you on half health). Brews make a run quicker; nothing needs one. */
export const BREW_FX = {
  glow: { dmg: 1.25, speed: 1.15, threat: 1.5, area: 1.25 },
  elixir: { dmg: 1.25, speed: 1.15, threat: 1.5, area: 1.25, save: true },
  tonic: { speed: 1.15, dodgeHeal: 0.1 },
  fizz: { speed: 1.25, cd: 1.25 },
};
export const brewFx = (id) => (id && BREW_FX[id]) || {};

/* loadout: what the meta layer worked out from the hero's gear.
   { power, traits: Set, bonuses: Set, weaponRar, unique, name?, sprite?, brew?, brewCol? }
   name and sprite are your hero's; the bots in the other seats use the role's own. */
export function makeHero(role, isPlayer, loadout) {
  const R = ROLES[role];
  const L = loadout || {};
  const cls = L.cls || (role === 'tank' ? 'warrior' : role === 'healer' ? 'cleric' : 'mage');
  const isRogue = cls === 'rogue';
  const power = L.power || 1;
  const maxHp = Math.round(R.hp * hpMultiplier(power));
  const B = brewFx(L.brew);
  return {
    id: 'h_' + role, kind: 'hero', role, cls, name: L.name || R.name, sprite: L.sprite || (isRogue ? 'rogue' : R.sprite), isPlayer, x: 0, y: 0, r: R.r,
    face: -Math.PI / 2, back: true, flip: false, hp: maxHp, maxHp, armor: R.armor, power,
    traits: new Set(L.traits || []), bonuses: new Set(L.bonuses || []), unique: L.unique || null,
    weaponRar: L.weaponRar || 0, threatMod: R.threat * (B.threat || 1), speed: R.speed * (isRogue ? 1.1 : 1) * (B.speed || 1), alive: true,
    // the party's brew, poured at the door (see BREW_FX)
    brew: L.brew || null, brewCol: L.brewCol || null, brewUsed: false,
    mana: 100, maxMana: 100, cd: { a1: 0, a2: 0, a3: 0, a4: 0, dodge: 0 }, gcd: 0, atkT: 0.4,
    frenzyT: 0, nightstalkerT: 0, ghostSaved: false,
    target: null, picked: null, stillT: 1, dodgeT: 0, dodgeX: 0, dodgeY: -1, iframe: 0,
    blocking: false, blockT: 9, dash: null, cast: null,
    st: { stun: 0, root: 0, haunt: 0, air: 0, ghost: 0, surge: 0, zeal: 0, kx: 0, ky: 0, chained: null, caged: null, curse: null },
    absorb: 0, absorbT: 0, flash: 0, hurtT: 0, lunge: 0, lungeA: 0, walkT: 0, squash: 0, moving: 0,
    say: null, sayT: 0, deadT: 0, swings: 0, hots: [],
    intent: { mx: 0, my: 0, block: false },
    bot: { think: 0, react: rand(0.18, 0.34), skill: isPlayer ? 0.97 : 0.93, goal: null, lastPos: null, waitT: 0, blockFor: null, cutAt: 0, side: rng() < 0.5 ? -1 : 1, dodged: new Set() },
    stats: { dmg: 0, heal: 0, taken: 0, dodges: 0, blocks: 0, perfect: 0, deaths: 0, overheal: 0 },
  };
}

export function makeMob(type, x, y, pack) {
  const M = S.dg.mobs[type] || SHARED_MOBS[type];
  // the dungeon's tuning: ordinary mobs get its health multiplier, bosses theirs (as written outside heroic),
  // and a mob named in its hp gets that one instead
  const own = S.tune.hp && S.tune.hp[type];
  const hp = Math.max(1, Math.round(M.hp * (own !== undefined ? own : M.boss ? S.tune.bossHp : S.tune.trashHp)));
  return {
    id: 'm' + (S.seq++), kind: 'mob', type, M, name: M.name, x, y, r: M.r, home: { x, y }, home0: { x, y }, pack,
    hp, maxHp: hp, speed: M.speed, alive: true, state: 'idle',
    threat: new Map(), target: null, forced: null, forcedT: 0,
    atkT: rand(0.3, 0.9), wind: 0, ab: {}, cast: null, busy: 0,
    st: { stun: 0, freeze: 0, chill: 0, stagger: 0, slow: 0, slowT: 0, kx: 0, ky: 0 },
    flash: 0, lunge: 0, lungeA: 0, face: Math.PI / 2, flip: rng() < 0.5, walkT: rand(0, 6), squash: 0, rise: 0, deadT: 0, moving: 0,
    isBoss: !!M.boss, phase: 1, armorUp: 0, exposed: 0, untargetable: false, hidden: false, pose: null, dmgMul: 1, ghostProps: !!M.wisp,
  };
}

/* Bosses never freeze or stun, but the combos still land on them. Frost that would freeze leaves a boss Chilled:
   Icicle and Comet shatter him for CHILL_SHATTER (Comet with Shatterlance for SHATTERLANCE_CHILL). A knock that
   would stun Staggers him: it counts as a stun for Cleave and Headsman, and he keeps doing what he was doing. */
export const CHILL = 4, CHILL_SHATTER = 1.5, SHATTERLANCE_CHILL = 2, STAGGER = 1;
export function chillBoss(m, dur) {
  if (!m.alive) return;
  if (!(m.st.chill > 0)) fxText(m.x, m.y - 245, 'Chilled', '#8FD6FF', 22, { dur: 1.0 });
  m.st.chill = Math.max(m.st.chill || 0, dur);
}
export function staggerBoss(m, dur) {
  if (!m.alive) return;
  if (!(m.st.stagger > 0)) fxText(m.x, m.y - 245, 'Staggered', '#FFE08A', 22, { dur: 1.0 });
  m.st.stagger = Math.max(m.st.stagger || 0, dur);
}
/* stunned for a combo's sake: a stun, or a boss's Stagger */
export const stunned = (m) => !!m.st && (m.st.stun > 0 || m.st.stagger > 0);
/* Icicle and Comet shatter what is frozen, and a Chilled boss */
export const shatterable = (m) => !!m.st && (m.st.freeze > 0 || m.st.chill > 0);

export function exposeMob(m, dur, label) {
  if (!m || !m.alive || m.cage || m.M.wisp) return;
  m.exposed = Math.max(m.exposed || 0, dur || 3.0);
  fxText(m.x, m.y - (m.isBoss ? 210 : 120), label || 'Exposed!', '#FFE08A', 24, { dur: 1.3 });
  fx({ type: 'ring', x: m.x, y: m.y - 30, r0: 24, r1: m.r + 74, col: '#F2C230', dur: 0.35, w: 6 });
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

/* ---------- threat ----------
   Every hit adds threat (the tank's 1.3 times, Slam's twice that), heals add a little on everything in the fight, and a mob
   goes for whoever has the most, switching once someone beats its target by a tenth. Slam and Charge are how
   the tank grabs things back. A caged hero can't be targeted, so the boss turns on whoever is next. */
export function addThreat(m, h, v) { if (m.cage || m.M.wisp || m.M.thing) return; m.threat.set(h.id, (m.threat.get(h.id) || 0) + v); }
export function topThreat(m) { let v = 0; m.threat.forEach((x) => { if (x > v) v = x; }); return v; }
const targetable = (h) => h.alive && !h.st.caged;
export function pickTarget(m) {
  if (m.forcedT > 0 && m.forced && targetable(m.forced)) return m.forced;
  let best = null, bv = -1;
  for (const h of S.heroes) { if (!targetable(h)) continue; const v = m.threat.get(h.id) || 0; if (v > bv) { bv = v; best = h; } }
  if (m.target && targetable(m.target) && best !== m.target) { const cv = m.threat.get(m.target.id) || 0; if (bv < cv * 1.1 + 2) return m.target; }
  return best;
}
export function aggro(m, h, v) {
  if (!m.alive || m.cage || m.M.thing) return;
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
  if (!m.alive || m.cage || m.M.wisp || m.M.thing) return;
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
  if (h.iframe > 0 && o.dodge !== false) { if (!o.quiet) { if (h.isPlayer) fxText(h.x, h.y - 80, 'Dodged', '#DDF3FF', 18); h.stats.dodges++; } return 0; }
  if (o.ground && h.st.air > 0) return 0;
  // the dungeon's tuning: everything that hurts a hero hits this much harder
  let a = amt * S.tune.hit;
  let blocked = false;
  if (o.block !== false && h.blocking && src) {
    const off = Math.abs(angDiff(h.face, Math.atan2(src.y - h.y, src.x - h.x)));
    if (off < 1.45) {
      blocked = true;
      if (o.heavy && o.perfectable !== false && h.blockT <= PERFECT_WINDOW) {
        a = 0; h.stats.perfect++; S.stats.perfect++;
        const intro = S.opts && S.opts.start === 'intro';
        if (h.isPlayer) fxText(h.x, h.y - 96, 'PERFECT!', '#F2C230', 30, { dur: 1.3 });
        if (src.kind === 'mob' && src.alive) {
          src.st.stun = Math.max(src.st.stun, intro && src.isBoss ? 3.2 : (src.isBoss ? 1.6 : 1.2));
          src.wind = 0; src.busy = 0;
          exposeMob(src, src.isBoss ? 3.5 : 2.5, intro && src.isBoss ? 'Staggered!' : 'Exposed!');
        }
        sfx('perfect'); shake(6); hitstop(0.08);
        fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 20, r1: 110, col: '#F2C230', dur: 0.35, w: 6 });
        if (o.smash && S.bossFight && h.isPlayer) S.bossFight.smashPerfect++;
        emit({ type: 'block', perfect: true, player: !!h.isPlayer, smash: !!o.smash });
        onPerfectBlock(h, src);
        if (intro && h.isPlayer && src.isBoss && !S.hints.stagger) {
          later(0.26, () => { if (!S.hints.stagger) { S.hints.stagger = 1; HOOKS.hint('stagger'); } });
        }
      } else {
        a *= 0.25; h.stats.blocks++;
        if (h.isPlayer) fxText(h.x, h.y - 90, 'Blocked', '#C9D2DC', 18);
        sfx('block');
        fx({ type: 'ring', x: h.x + Math.cos(h.face) * 22, y: h.y - 30 + Math.sin(h.face) * 12, r0: 6, r1: 40, col: '#FFFFFF', dur: 0.2, w: 4 });
        emit({ type: 'block', perfect: false, player: !!h.isPlayer, smash: !!o.smash });
      }
    }
  }
  if (!o.pierce && (!o.hazard || blocked)) a *= 1 - h.armor * (o.magic ? 0.4 : 1);
  // Barrowguard 3pc: active skeleton thralls beside the tank soak 25% of incoming hits
  if (h.role === 'tank' && a > 0 && S.thralls && S.thralls.some((tr) => tr.alive && tr.kind === 'bg' && tr.owner === h)) {
    a *= 0.75;
  }
  // Starlight Elixir: once a run, a hit that would knock you down leaves you on half health
  if (brewFx(h.brew).save && !h.brewUsed && h.hp - Math.round(Math.max(0, a - h.absorb)) <= 0) {
    h.brewUsed = true; h.absorb = 0; h.hp = Math.round(h.maxHp * 0.5); h.flash = 0.12; h.iframe = Math.max(h.iframe, 0.6);
    fxText(h.x, h.y - 110, 'Starlight!', '#F2C230', 30, { dur: 1.6 });
    fx({ type: 'ring', x: h.x, y: h.y - 40, r0: 20, r1: 130, col: '#F2C230', dur: 0.5, w: 7 });
    dots(h.x, h.y - 50, '#FFE7A8', 16, 200);
    sfx('revive'); shake(5);
    emit({ type: 'brew.saved', player: !!h.isPlayer });
    return 0;
  }
  if (h.absorb > 0 && a > 0) {
    // Unblocked ground/boss telegraphs pierce 60% of Ward shields so standing in red circles still hurts
    const cap = o.hazard && !blocked ? a * 0.4 : a;
    const t = Math.min(h.absorb, cap); h.absorb = Math.max(0, h.absorb - t); a -= t;
    if (t > 0 && !o.quiet && h.isPlayer) fxText(h.x, h.y - 70, 'Absorbed', '#DDF3FF', 16);
    if (h.absorb <= 0.5) {
      h.absorb = 0;
      // Kindle: a Ward that breaks heals whoever wore it
      const by = h.wardBy; h.wardBy = null;
      if (by && by.alive && by.traits.has('kindle')) later(0, () => healHero(by, h, 80, { show: true, raw: true }));
    }
  }
  a = Math.round(a);
  if (S.opts && S.opts.start === 'intro') a = Math.min(a, Math.max(0, h.hp - Math.round(h.maxHp * 0.2)));
  // Candlewake 3pc: once per fight, an ally taking fatal damage becomes a ghost for 6s instead of dying
  if (h.st && h.st.ghost > 0) {
    a = Math.min(a, Math.max(0, h.hp - 1));
  } else if (a > 0 && h.hp - a <= 0 && !h.ghostSaved && S.heroes.some((hl) => hl.alive && hl.bonuses && hl.bonuses.has('candlewake3'))) {
    h.ghostSaved = true; h.absorb = 0; h.hp = Math.max(1, Math.round(h.maxHp * 0.35)); h.st.ghost = 6.0; h.flash = 0.14; h.iframe = Math.max(h.iframe, 0.7);
    fxText(h.x, h.y - 114, 'Candlewake!', '#C8F5E8', 28, { dur: 1.5 });
    fx({ type: 'ring', x: h.x, y: h.y - 40, r0: 20, r1: 120, col: '#C8F5E8', dur: 0.45, w: 6 });
    dots(h.x, h.y - 50, '#C8F5E8', 14, 180);
    sfx('revive'); shake(4);
    return 0;
  }
  if (a > 0) {
    h.hp -= a; h.flash = 0.12; h.hurtT = 0.25; h.stats.taken += a;
    if (!o.quiet && h.isPlayer) {
      const label = o.crush ? `-${a} CRUSH!` : '-' + a;
      fxText(h.x, h.y - 60, label, o.numCol || '#FF6B5E', o.numSize || (o.crush || a >= 100 ? 26 : 20), o.numDur ? { dur: o.numDur } : undefined);
    }
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
  h.st.curse = null;
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
  // something that isn't a fighter (a bomb) turns a hit into its own thing
  if (m.M.onHit) return m.M.onHit(m, amt, src, o) || 0;
  // only the healer can banish wisps
  if (m.M.wisp && src && src.role !== 'healer') return 0;
  if (m.cage) { m.hp -= 1; m.flash = 0.1; sfx('cagehit'); bits(m.x, m.y - 50, 'shard_bone', 1, 90); if (m.hp <= 0) breakCage(m, true, src); return 1; }
  let a = amt * (o.raw ? 1 : (src && src.power) || 1);
  if (!o.raw && src && src.st) {
    if (src.st.surge > 0) a *= 1.2;
    if (src.st.ghost > 0) a *= 1.25;
  }
  if (m.exposed > 0) a *= 1.35;
  let crit = false;
  // the party's brew: Glowcap Draught and Starlight Elixir hit harder
  if (src && src.brew) a *= brewFx(src.brew).dmg || 1;
  const gearCrit = src && src.power > 1 ? Math.min(0.14, (src.power - 1) * 0.14) : 0;
  const zealCrit = src && src.st && src.st.zeal > 0 ? 0.1 : 0;
  const critChance = (o.crit === undefined ? 0.12 : o.crit) + (o.crit === 1 ? 0 : gearCrit + zealCrit);
  if (!o.noCrit && rng() < critChance) { a *= 2; crit = true; }
  else if (!o.noCrit && src && src.traits && src.traits.has('headsman') && stunned(m)) { a *= 2; crit = true; }
  const shattered = !!o.shatter && shatterable(m);
  if (shattered) a *= m.st.freeze > 0 ? o.shatter : o.chillShatter || CHILL_SHATTER;
  if (m.armorUp > 0) a *= 1 - m.armorUp;
  a = Math.round(a);
  if (a <= 0) return 0;
  m.hp -= a;
  if (!m.isBoss || crit || shattered || a >= 200) m.flash = m.isBoss ? 0.07 : 0.08;
  if (m.cast && m.cast.kick) { m.cast.taken += a; if (m.cast.taken >= m.cast.kick) interruptCast(m); }
  if (src && src.kind === 'hero') { aggro(m, src, 0); addThreat(m, src, a * src.threatMod * (o.threat || 1)); src.stats.dmg += a; }
  const big = crit || a >= 250;
  const iceCrit = crit && src && src.isPlayer && S.looks && S.looks.has('cosmetic.crit_ice');
  if (iceCrit) bits(m.x, m.y - (m.isBoss ? 150 : 60), 'shard_ice', 6, 220);
  if (!o.quiet && src && src.isPlayer) fxText(m.x, m.y - (m.isBoss ? 170 : m.M.big ? 120 : 70), (crit ? a + '!' : '' + a), iceCrit ? '#8FD6FF' : o.col || (crit || m.exposed > 0 ? '#F2C230' : '#FFFFFF'), o.size || (a >= 600 ? 40 : big ? 30 : 21), { dur: big ? 1.15 : 0.9, crit });
  if (o.knock && !m.isBoss && !m.M.big) { const an = Math.atan2(m.y - src.y, m.x - src.x); m.st.kx += Math.cos(an) * o.knock; m.st.ky += Math.sin(an) * o.knock; }
  if (crit && src && src.isPlayer) { hitstop(0.035); if (!o.quiet) sfx('crit', 0.9); }
  if (crit && src && src.kind === 'hero') emit({ type: 'crit', amount: a, player: !!src.isPlayer });
  if (m.hp <= 0) killMob(m, src);
  return a;
}
export function killMob(m, src) {
  m.hp = 0; m.alive = false; m.deadT = 0; m.cast = null; m.state = 'dead';
  emit({ type: 'mob.killed', mob: m.type, boss: !!m.isBoss, undead: !!m.M.skeleton, byPlayer: !!(src && src.isPlayer), ...(m.M.tally ? { tally: m.M.tally } : {}) });
  if (m.M.wisp) {
    dots(m.x, m.y - 40, '#C8F5E8', 10, 160); fx({ type: 'ring', x: m.x, y: m.y - 40, r0: 8, r1: 46, col: '#C8F5E8', dur: 0.25, w: 4 }); sfx('pop');
    // Soul Spark backlash: banishing a wisp during a boss fight zaps the boss and restores healer mana
    if (src && src.role === 'healer' && S.boss && S.boss.alive && !S.boss.hidden) {
      // the bolt can finish him, so hold on to him for the beam
      const b = S.boss;
      src.mana = Math.min(src.maxMana, src.mana + 5);
      hurtMob(b, 180, src, { raw: true, noCrit: true, col: '#C8F5E8', size: 19 });
      fx({ type: 'beam', x: m.x, y: m.y - 40, x2: b.x, y2: b.y - 90, col: '#C8F5E8', dur: 0.22 });
    }
    return;
  }
  // Rimebone 3pc: anything dying inside Blizzard rises as a frost skeleton for 6s
  if (!m.isBoss && S.zones && S.thralls) {
    const bz = S.zones.find((z) => z.kind === 'blizzard' && z.src && z.src.bonuses && z.src.bonuses.has('rimebone3') && Math.hypot(m.x - z.x, m.y - z.y) <= z.r + m.r + 20);
    if (bz && S.thralls.filter((tr) => tr.alive && tr.kind === 'frost').length < 3) {
      S.thralls.push({ id: 'tr' + (S.seq++), kind: 'frost', owner: bz.src, sp: 'rattler', x: m.x, y: m.y, r: 15, life: 6, maxLife: 6, atkT: 0.3, face: -Math.PI / 2, flip: false, walkT: 0, moving: 0, lunge: 0, lungeA: 0, rise: 0.35, alive: true });
      fxText(m.x, m.y - 84, 'Frost Skeleton!', '#8FD6FF', 18, { dur: 1.0 });
    }
  }
  // Sir Rattlebones Phase 2: killing a rallied guard lashes the boss and cracks his rally armour when the last one falls
  if (m.rally && S.boss && S.boss.alive && S.boss.type === 'knight') {
    // the lash can finish him, and then there's no boss left to crack
    const k = S.boss;
    hurtMob(k, Math.round(k.maxHp * 0.04), src, { raw: true, noCrit: true, col: '#FFE08A', size: 19 });
    if (k.alive && !S.mobs.some((o) => o !== m && o.alive && o.rally)) {
      k.armorUp = 0;
      exposeMob(k, 3.0, 'Armour Cracked! Exposed!');
    }
  }
  // what a mob leaves behind when it dies (a Waddlecap's spore cloud)
  if (m.M.onDeath) m.M.onDeath(m, src);
  const big = m.M.big;
  bits(m.x, m.y - (big ? 70 : 40), m.M.shard || 'shard_bone', big ? 10 : 5, big ? 260 : 190);
  if (!m.M.shard) bits(m.x, m.y - (big ? 90 : 60), 'shard_skull', 1, 150);
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
  if (t.st && t.st.ghost > 0 && t.hp >= t.maxHp * 0.85) {
    t.st.ghost = 0;
    fxText(t.x, t.y - 106, 'Restored!', '#FFE08A', 22, { dur: 1.1 });
  }
  if (src) { src.stats.heal += real; src.stats.overheal += a - real; }
  if ((real > 0 || o.show) && mine(src, t)) fxText(t.x, t.y - 74, '+' + a, '#7BE05A', o.size || (a >= 150 ? 22 : 18), { dur: 0.9 });
  // healing pulls a little threat from everything in the fight
  if (src && real > 0) { const fighting = S.mobs.filter((m) => m.alive && m.state === 'fight' && !m.cage && !m.M.wisp); fighting.forEach((m) => addThreat(m, src, (real * 0.5) / Math.max(1, fighting.length))); }
  // a save: the player catches someone under 15% and they are still up three seconds later
  if (src && src.isPlayer && real > 0 && before < 0.15 && S.t >= (t.saveLock || 0)) {
    t.saveLock = S.t + 6;
    if (src.role === 'healer') {
      fxText(t.x, t.y - 130, 'SAVED!', '#F2C230', 30, { dur: 1.3 });
      fx({ type: 'ring', x: t.x, y: t.y - 40, r0: 16, r1: 110, col: '#F2C230', dur: 0.4, w: 7 });
      dots(t.x, t.y - 50, '#FFE08A', 14, 200);
      sfx('saved'); hitstop(0.12);
    }
    S.timers.push({ t: 3, fn: () => { if (t.alive) { S.stats.saves = (S.stats.saves || 0) + 1; emit({ type: 'heal.save', player: true }); } } });
  }
  return real;
}
