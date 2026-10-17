/* ---------- entities: heroes, mobs, damage, healing, threat ---------- */
import { angDiff, TAU } from '../core/math';
import { rand, rng, vrand } from '../core/rng';
import { hpMultiplier } from '../content/gear';
import { ROLES } from '../content/roles';
import { HOOKS, S, SHARED_MOBS, emit } from './state.js';
import { onBossDead, checkPack, startBoss } from './game.js';
import { breakCage, cutChain, interruptCast } from './mobs.js';
import { onPerfectBlock } from './buttons.js';
import { spikes, talentHitMul, talentStats, wallMul } from './specs.js';
import { killXp } from '../content/xp';

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

/* loadout: what the meta layer worked out from the hero's gear and talents.
   { power, might?, traits: Set, bonuses: Set, weaponRar, unique, name?, sprite?, fit?, brew?, brewCol?, spec?, tal?, ts? }
   might is your level's bonus (content/xp.ts levelBonus), the same for every seat: it multiplies the gear's power
   (so hits, heals and shields grow with your level) and your health, all by the same amount. Crit chance comes from
   the gear alone (gearPower).
   spec is the hero's spec (Fire changes the buttons), tal the talents it has that change a button, ts its talent
   stats added up (meta/talents.ts talentLoadout; specs.js turns them into multipliers). Bots have none.
   name is your hero's (a bot's is its role's); sprite is the hero's picture for this run, composed in layers by the
   run screen, and fit its weapon glow and head top (render.js heroFit). */
export function makeHero(role, isPlayer, loadout) {
  const R = ROLES[role];
  const L = loadout || {};
  const cls = L.cls || (role === 'tank' ? 'warrior' : role === 'healer' ? 'cleric' : 'mage');
  const isRogue = cls === 'rogue';
  const gearPower = L.power || 1, might = L.might || 1, power = gearPower * might;
  const ts = talentStats(L.ts);
  const maxHp = Math.round(R.hp * hpMultiplier(gearPower) * might * ts.hp);
  const B = brewFx(L.brew);
  return {
    id: 'h_' + role, kind: 'hero', role, cls, name: L.name || R.name, sprite: L.sprite || '', fit: L.fit || null, isPlayer, x: 0, y: 0, r: R.r,
    face: -Math.PI / 2, back: true, flip: false, hp: maxHp, maxHp, armor: R.armor, power, gearPower, might,
    traits: new Set(L.traits || []), bonuses: new Set(L.bonuses || []), unique: L.unique || null,
    spec: L.spec || null, tal: new Set(L.tal || []), ts,
    weaponRar: L.weaponRar || 0, threatMod: R.threat * (B.threat || 1) * ts.threat, speed: R.speed * (isRogue ? 1.1 : 1) * (B.speed || 1), alive: true,
    // the party's brew, poured at the door (see BREW_FX)
    brew: L.brew || null, brewCol: L.brewCol || null, brewUsed: false,
    mana: 100, maxMana: 100, cd: { a1: 0, a2: 0, a3: 0, a4: 0, dodge: 0 }, gcd: 0, atkT: 0.4,
    // the beat the four buttons share, and the one press waiting for it (press.js)
    beat: 0, next: null,
    // the payoffs a class sets up (buttons.js): Crushes primed, Shatters primed, a rogue's points, an empowered Mend
    crush: 0, shatter: 0, points: 0, mendUp: false, cleaves: 0,
    // only drawn: held still on impact, the green glow of a heal
    holdT: 0, healGlow: 0,
    frenzyT: 0, nightstalkerT: 0, ghostSaved: false,
    // talents (specs.js): Payback readied, Rising Fury's stacks, Knife Storm, Miracle used, the Cleaves and Smites
    // counted (Rim Strike, Twice Struck), Bulwark's pull, Heartening and Dawn from a Mercy healer
    payback: false, fury: 0, furyT: 0, stormT: 0, miracleUsed: false, rims: 0, smites: 0, bulwark: 0, heartT: 0, dawnT: 0,
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

/** A level came in mid-run: every hero is `k` times as strong from now on (hits, heals, shields and health), keeping
 *  the health they'd lost. */
export function strengthen(k) {
  if (!(k > 0) || k === 1) return;
  for (const h of S.heroes) {
    h.might = (h.might || 1) * k;
    h.power = (h.gearPower || 1) * h.might;
    const max = Math.round(ROLES[h.role].hp * hpMultiplier(h.gearPower || 1) * h.might * h.ts.hp);
    if (h.alive) h.hp = Math.max(1, h.hp + max - h.maxHp);
    h.maxHp = max;
  }
}

/** how hard a mob of this type swings for this dungeon's tuning (tune.dmg names a mob's own, on top of `hit` for
    everything): only its ordinary swings, never its moves or its bombs */
export const tunedDmg = (type) => (S.tune.dmg && S.tune.dmg[type]) || 1;
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
    flash: 0, lunge: 0, lungeA: 0, face: Math.PI / 2, flip: rng() < 0.5, walkT: rand(0, 6), squash: 0, holdT: 0, rise: 0, deadT: 0, moving: 0,
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

/* Exposed: +35% damage taken, and it counts as the setup for every class's payoff (Cleave Crushes, Icicle and Comet
   Shatter as on a Chilled boss, Shadowstrike hits as if you had five points, Smite heals double). A boss's window
   is called out to the whole party: the gold buttons light up together. */
export function exposeMob(m, dur, label) {
  if (!m || !m.alive || m.cage || m.M.wisp) return;
  const was = m.exposed > 0;
  m.exposed = Math.max(m.exposed || 0, dur || 3.0);
  fxText(m.x, m.y - (m.isBoss ? 210 : 120), label || 'Exposed!', '#FFE08A', 24, { dur: 1.3 });
  fx({ type: 'ring', x: m.x, y: m.y - 30, r0: 24, r1: m.r + 74, col: '#F2C230', dur: 0.35, w: 6 });
  if (m.isBoss && !was) { call('EXPOSED! Hit him now!', 'good', 1.4); sfx('exposed'); }
}

/* ---------- floating text and effects ---------- */
export function fxText(x, y, str, col, size, o) {
  const t = Object.assign({ x: x + vrand(-8, 8), y, str, col, size: size || 22, t: 0, dur: 1.0, vy: -70 }, o || {});
  // a number steps up over one still rising from the same spot, instead of piling on it; a crit's tilts
  if (t.num) for (let i = 0; i < 4; i++) {
    const under = S.texts.find((u) => u.num && u.t < 0.4 && Math.abs(u.x - t.x) < 48 && Math.abs(u.y - t.y) < t.size * 0.8);
    if (!under) break;
    t.y = under.y - t.size * 0.85;
  }
  if (t.crit) t.tilt = vrand(-0.2, 0.2);
  S.texts.push(t);
}
export function fx(o) { o.t = 0; S.fx.push(o); return o; }
export function shake(a) { S.shake = Math.max(S.shake, a); }
/* the freeze on impact is drawn, not played: the hitter and the target are held still on screen for a moment
   while the fight goes on (render.js), so the beat stays steady. Several at once take the longest. */
export function hold(t, ...who) {
  for (const e of who) {
    if (!e) continue;
    if (!(e.holdT > 0)) { e.holdX = e.x; e.holdY = e.y; }
    e.holdT = Math.max(e.holdT || 0, t);
  }
}
/* How your own hits feel (bots never shake or freeze the screen). A hit's tier: 'tick' (an auto swing, a venom or
   Blizzard tick), 'filler' (the class's filler), 'hit' (any other button), 'payoff' (Crush, Shatter, a five-point
   Shadowstrike); a crit lifts anything but a payoff to 'crit'. */
export const FEEL = {
  tick: { hold: 0, flash: 0.05, shake: 0, size: 17 },
  filler: { hold: 0.025, flash: 0.08, shake: 0, size: 21, flinch: true },
  hit: { hold: 0.025, flash: 0.08, shake: 0, size: 21, flinch: true },
  crit: { hold: 0.05, flash: 0.1, shake: 1.5, size: 30, flinch: true, sparks: 4 },
  payoff: { hold: 0.07, flash: 0.12, shake: 3.5, size: 34, flinch: true, shards: 8 },
};
/** how hard a crit hits: twice as hard, and a rogue's two and a half times (the rogue's crits are its big numbers) */
export const ROGUE_CRIT = 2.5;
const critMul = (src) => (src && src.cls === 'rogue' ? ROGUE_CRIT : 2);
/** the last hit hurtMob landed: whether it crit and how it felt (the buttons read it to prime their payoffs) */
export const LAST = { crit: false, tier: 'hit', amt: 0 };
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
        sfx('perfect', h.isPlayer ? 1 : 0.6);
        if (h.isPlayer) { shake(6); hold(0.08, h, src); }
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
  // Spiked Shield: a foe's swing that lands, blocked or not, hurts it back (a telegraph's hit isn't a swing)
  if (!o.hazard && !o.ground && a > 0) spikes(h, src, blocked);
  if (!o.pierce && (!o.hazard || blocked)) a *= 1 - h.armor * (o.magic ? 0.4 : 1);
  // talents: a tank's thicker skin, and a mate behind an Iron Wall
  if (h.ts) a *= h.ts.armor;
  a *= wallMul(h);
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
    // counts hits by kind (handHits, ringHits, bombHits, ...): the flawless achievements read these from runSummary
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
/** the crit chance gear, talents and Lantern Zeal add to a hero's own (up to +14% from Power, +10% in the Zeal) */
export function critBonus(src) {
  if (!src || src.kind !== 'hero') return 0;
  const gp = src.gearPower ?? src.power;
  return (gp > 1 ? Math.min(0.14, (gp - 1) * 0.14) : 0) + (src.st && src.st.zeal > 0 ? 0.1 : 0) + (src.ts ? src.ts.crit : 0);
}
/** A hit on a mob. o: { raw (no Power), crit (its chance; 1 always), noCrit, shatter / chillShatter (Shatter
 *  multipliers), knock, threat (×), tier (how it feels: FEEL), auto (an automatic swing, counted apart), col,
 *  size, quiet }. Returns the damage done; LAST says whether it crit. */
export function hurtMob(m, amt, src, o) {
  o = o || {};
  LAST.crit = false; LAST.amt = 0;
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
  // talents: the hero's damage, and what its talents add on this foe (specs.js)
  if (!o.raw && src && src.kind === 'hero' && src.ts) a *= src.ts.dmg * talentHitMul(src, m);
  if (m.exposed > 0) a *= 1.35;
  let crit = false;
  // the party's brew: Glowcap Draught and Starlight Elixir hit harder
  if (src && src.brew) a *= brewFx(src.brew).dmg || 1;
  const critChance = o.crit === 1 ? 1 : (o.crit === undefined ? 0.12 : o.crit) + critBonus(src);
  if (!o.noCrit && rng() < critChance) { a *= critMul(src); crit = true; }
  else if (!o.noCrit && src && src.traits && src.traits.has('headsman') && stunned(m)) { a *= 2; crit = true; }
  const shattered = !!o.shatter && shatterable(m);
  if (shattered) a *= m.st.freeze > 0 ? o.shatter : o.chillShatter || CHILL_SHATTER;
  if (m.armorUp > 0) a *= 1 - m.armorUp;
  a = Math.round(a);
  if (a <= 0) return 0;
  LAST.crit = crit; LAST.amt = a;
  m.hp -= a;
  const mineHit = !!(src && src.isPlayer);
  const tier = crit && o.tier !== 'payoff' ? 'crit' : o.tier || 'hit';
  LAST.tier = tier;
  const F = FEEL[tier];
  // every hit flashes a small mob; a boss flashes briefly on your filler, crits and payoffs, never on swings and
  // ticks (so he doesn't strobe), and on any hit of 200 or more
  if (!m.isBoss) { m.flash = Math.max(m.flash, F.flash); m.flashMax = Math.max(m.flash, 0.05); m.flashGold = tier === 'payoff'; }
  else if ((mineHit && tier !== 'tick' && tier !== 'hit') || a >= 200) { m.flash = Math.max(m.flash, tier === 'payoff' ? 0.12 : 0.05); m.flashMax = m.flash; m.flashGold = tier === 'payoff'; }
  // small mobs squash for two frames and are nudged back (only drawn)
  if (F.flinch && !m.isBoss && !m.M.big) { m.squash = 0.035; if (src) m.nudgeA = Math.atan2(m.y - src.y, m.x - src.x); }
  if (src && src.kind === 'hero') {
    aggro(m, src, 0); addThreat(m, src, a * src.threatMod * (o.threat || 1)); src.stats.dmg += a;
    if (o.auto) src.stats.auto = (src.stats.auto || 0) + a;
    // what did it: the sims break a hero's damage down by button (npm run sim)
    if (o.key) { const by = src.stats.by || (src.stats.by = {}); by[o.key] = (by[o.key] || 0) + a; }
  }
  const iceCrit = crit && mineHit && S.looks && S.looks.has('cosmetic.crit_ice');
  if (iceCrit) bits(m.x, m.y - (m.isBoss ? 150 : 60), 'shard_ice', 6, 220);
  if (!o.quiet && mineHit) {
    const big = tier === 'crit' || tier === 'payoff';
    const size = big ? (a >= 600 ? 40 : F.size) : o.size || (a >= 600 ? 40 : a >= 250 ? 26 : F.size);
    const col = iceCrit ? '#8FD6FF' : big || m.exposed > 0 ? '#F2C230' : o.col || '#FFFFFF';
    fxText(m.x, m.y - (m.isBoss ? 170 : m.M.big ? 120 : 70), crit ? a + '!' : '' + a, col, size, { dur: big ? 1.15 : 0.9, crit, num: true });
  }
  if (o.knock && !m.isBoss && !m.M.big) { const an = Math.atan2(m.y - src.y, m.x - src.x); m.st.kx += Math.cos(an) * o.knock; m.st.ky += Math.sin(an) * o.knock; }
  if (mineHit) {
    if (F.hold) hold(F.hold, src, m);
    if (F.shake) shake(F.shake);
    if (F.sparks) dots(m.x, m.y - (m.isBoss ? 130 : 50), '#FFE08A', F.sparks, 170);
    if (F.shards) bits(m.x, m.y - (m.isBoss ? 130 : 50), o.shard || m.M.shard || 'shard_bone', F.shards, 240);
    if (crit && !o.quiet) sfx('crit', 0.9);
    // auto swings and ticks get a soft tick, at most one every 0.1 s
    if (tier === 'tick' && !o.quiet && S.t - (S.tickSfx ?? -1) >= 0.1) { S.tickSfx = S.t; sfx('tap', 0.5); }
  }
  if (crit && src && src.kind === 'hero') emit({ type: 'crit', amount: a, player: !!src.isPlayer });
  if (m.hp <= 0) killMob(m, src);
  return a;
}
export function killMob(m, src) {
  m.hp = 0; m.alive = false; m.deadT = 0; m.cast = null; m.state = 'dead';
  // a wisp that reaches you and bursts was never killed: no XP for being haunted
  const xp = m.M.wisp && !src ? 0 : killXpOf(m);
  emit({ type: 'mob.killed', mob: m.type, boss: !!m.isBoss, undead: !!m.M.skeleton, byPlayer: !!(src && src.isPlayer), x: m.x, y: m.y, xp, ...(m.M.tally ? { tally: m.M.tally } : {}) });
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
  // Rimebone 3pc: anything dying inside Blizzard (or Fire's Firestorm, its button) rises as a frost skeleton for 6s
  if (!m.isBoss && S.zones && S.thralls) {
    const bz = S.zones.find((z) => (z.kind === 'blizzard' || z.kind === 'firestorm') && z.src && z.src.bonuses && z.src.bonuses.has('rimebone3') && Math.hypot(m.x - z.x, m.y - z.y) <= z.r + m.r + 20);
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
  // a kill flings a small mob away from whoever landed it; a big one collapses where it stands (render.js)
  m.dieA = src ? Math.atan2(m.y - src.y, m.x - src.x) : -Math.PI / 2;
  if (src && src.isPlayer) { hold(big ? 0.09 : 0.04, src, m); if (big) shake(3); }
  if (m.isBoss) onBossDead(m);
  if (m.pack) checkPack(m.pack);
}

/* ---------- XP ---------- */
/** What a kill pays (content/xp.ts), times the run's multiplier (its dungeon's tier, Heroic), popped in violet over
 *  the mob. Only a run that counts pays (the run sets opts.xp); the run scene adds it to your total. */
export const XP_COL = '#B98CFF';
function killXpOf(m) {
  if (!S.opts || !S.opts.xp) return 0;
  const n = Math.round(killXp(m.M, m.type === S.finalBoss) * (S.opts.xpMul || 1));
  if (n > 0) {
    S.xpRun = (S.xpRun || 0) + n;
    const big = m.isBoss;
    fxText(m.x, m.y - (big ? 260 : m.M.big ? 150 : 100), `+${n} XP`, XP_COL, big ? 30 : m.M.big ? 22 : 17, { dur: big ? 1.8 : 1.2, vy: -46 });
  }
  return n;
}

/* ---------- healing ---------- */
/** A heal. o: { raw (no Power and no crit), noCrit, show (a number even at full health), size }. Heals from a hero
 *  crit for 1.5x on the same chance as a hit. Returns what it really healed. */
export function healHero(src, t, amt, o) {
  o = o || {};
  if (!t.alive) return 0;
  const before = t.hp / t.maxHp;
  const crit = !o.raw && !o.noCrit && !!src && src.kind === 'hero' && rng() < 0.12 + critBonus(src);
  const a = Math.round(amt * (o.raw ? 1 : ((src && src.power) || 1) * ((src && src.ts && src.ts.heal) || 1)) * (crit ? 1.5 : 1));
  LAST.healCrit = crit; LAST.healAmt = a;
  const real = Math.min(a, t.maxHp - t.hp);
  t.hp += real;
  if (t.st && t.st.ghost > 0 && t.hp >= t.maxHp * 0.85) {
    t.st.ghost = 0;
    fxText(t.x, t.y - 106, 'Restored!', '#FFE08A', 22, { dur: 1.1 });
  }
  if (src) { src.stats.heal += real; src.stats.overheal += a - real; }
  if ((real > 0 || o.show) && mine(src, t)) fxText(t.x, t.y - 74, '+' + a + (crit ? '!' : ''), '#7BE05A', crit ? (a >= 300 ? 30 : 26) : o.size || (a >= 150 ? 22 : 18), { dur: crit ? 1.1 : 0.9, crit, num: true });
  // the mate your heal lands on glows green a moment, and your own heal's crit chimes
  if (real > 0 && src && src.isPlayer) t.healGlow = 0.22;
  if (crit && src && src.isPlayer && !o.quiet) sfx('healcrit', 0.8);
  // healing pulls a little threat from everything in the fight
  if (src && real > 0) { const fighting = S.mobs.filter((m) => m.alive && m.state === 'fight' && !m.cage && !m.M.wisp); fighting.forEach((m) => addThreat(m, src, (real * 0.5) / Math.max(1, fighting.length))); }
  // a save: the player catches someone under 15% and they are still up three seconds later
  if (src && src.isPlayer && real > 0 && before < 0.15 && S.t >= (t.saveLock || 0)) {
    t.saveLock = S.t + 6;
    if (src.role === 'healer') {
      fxText(t.x, t.y - 130, 'SAVED!', '#F2C230', 30, { dur: 1.3 });
      fx({ type: 'ring', x: t.x, y: t.y - 40, r0: 16, r1: 110, col: '#F2C230', dur: 0.4, w: 7 });
      dots(t.x, t.y - 50, '#FFE08A', 14, 200);
      sfx('saved'); hold(0.12, src, t);
    }
    S.timers.push({ t: 3, fn: () => { if (t.alive) { S.stats.saves = (S.stats.saves || 0) + 1; emit({ type: 'heal.save', player: true }); } } });
  }
  return real;
}
