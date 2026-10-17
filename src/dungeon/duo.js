/* ---------- the duo: the pair, the duel card's counts, combos, going down, dodges ----------
   The duo rework's contracts (docs/duo.md, docs/duo-agents.md). Every workstream codes against these. Heroes are
   known by seat (h.seat, h.id 'h0', 'h1') and class (h.cls); h.role is the old trinity's and new code doesn't use
   it. Staying alive without a healer is here too: going down and being picked up, full again soon after a fight,
   payoffs that heal a little, and the perfect dodge. */
import { dist } from '../core/math';
import { S, emit } from './state.js';
import { banner, bits, dots, exposeMob, fx, fxText, healHero, hold, hurtMob, killHero, sfx, shake, staggerBoss } from './entities.js';
import { interruptCast } from './mobs.js';
import { foesNear } from './heroes.js';
import { addBurn, burnOf } from './fire.js';

/* ---------- the pair ---------- */
/** the hero in a seat (seats count from 0; the player can sit in any) */
export const heroAt = (seat) => (S && S.heroes.find((h) => h.seat === seat)) || null;
/** a hero's seat, -1 for anything else */
export const seatOf = (h) => (h && h.kind === 'hero' ? h.seat : -1);
/** the other hero of a pair; in a bigger party, the nearest other one (one that's up first) */
export function mateOf(h) {
  if (!S || !h) return null;
  const others = S.heroes.filter((o) => o !== h);
  if (others.length <= 1) return others[0] || null;
  const pool = others.some((o) => o.alive) ? others.filter((o) => o.alive) : others;
  let best = null, bd = Infinity;
  for (const o of pool) { const d = Math.hypot(o.x - h.x, o.y - h.y); if (d < bd) { bd = d; best = o; } }
  return best;
}

/* ---------- the duel card's counts ---------- */
/** what the duel card counts for each hero (S.duel[h.id]); damage and the biggest crit come from hurtMob */
export const DUEL_KEYS = ['dmg', 'bigCrit', 'combosSet', 'combosLanded', 'lifts', 'breaks', 'keys', 'pickups', 'bombs'];
/** a fresh card for every hero in the run (newGame) */
export function duelReset() {
  S.duel = {};
  for (const h of S.heroes) S.duel[h.id] = Object.fromEntries(DUEL_KEYS.map((k) => [k, 0]));
}
const card = (h) => (S && S.duel && h && S.duel[h.id]) || null;
/** count something on a hero's duel card: 'combosSet', 'combosLanded', 'lifts', 'breaks', 'keys', 'pickups', 'bombs' */
export function duelAdd(h, key, n = 1) {
  const c = card(h);
  if (c) c[key] = (c[key] || 0) + n;
}
/** a hit a hero landed (hurtMob calls this): its damage, and the biggest crit */
export function duelDamage(h, amt, crit) {
  const c = card(h);
  if (!c) return;
  c.dmg += amt;
  if (crit && amt > c.bigCrit) c.bigCrit = amt;
}

/* ---------- combos: your setup, my payoff ----------
   Every class leaves something on a foe (setUp): the warrior's stuns and Staggers, Frost's freezes and Chills (and
   its Blizzard), Fire's Burn once it's 3 or more, the rogue's poison, the ranger's marks, and anyone's Exposed (an
   interrupt, a perfect block or a perfect dodge). Any payoff on a foe your mate set up is a COMBO: COMBO times as
   hard, a gold pop, and the kind's own extra (COMBO_DO), counted for both of you on the duel card. A combo uses the
   setup up, except Exposed: that's the burn window you hit together. Your own setups feed your own payoffs as
   before and never make a combo. */
/** how much harder a payoff hits on a foe your mate set up */
export const COMBO = 1.5;
/** how long a setup counts for a combo when the call doesn't say (seconds) */
const SETUP_LIFE = 4;
/** which setup a payoff cashes in when a foe has more than one of your mate's */
const COMBO_ORDER = ['mark', 'freeze', 'burn', 'stun', 'poison', 'expose'];
/** `by` set `foe` up: 'freeze', 'burn', 'stun', 'poison', 'mark' or 'expose', for `dur` seconds (SETUP_LIFE if not
 *  given). The newest setup of a kind replaces the last. */
export function setUp(foe, by, kind, dur) {
  if (!S || !foe || !by || !foe.alive || foe.cage || (foe.M && (foe.M.thing || foe.M.wisp))) return;
  foe.setups = foe.setups || {};
  foe.setups[kind] = { by, until: S.t + (dur ?? SETUP_LIFE) };
}
/** the kind of a setup your mate left on this foe that's still on, or null: your own setups never make a combo */
export function comboFor(foe, attacker) {
  if (!S || !foe || !foe.setups || !attacker) return null;
  for (const kind of COMBO_ORDER) {
    const s = foe.setups[kind];
    if (s && s.by !== attacker && s.by.kind === 'hero' && S.t < s.until) return kind;
  }
  return null;
}
/** a payoff landed on a foe its mate set up (the payoff hits COMBO times as hard itself): the word pops, the kind's
 *  extra goes off, it counts for both of you on the duel card, and the setup is used up (Exposed stays). `dealt` is
 *  what the payoff did, for the extras that scale with it. */
export function combo(attacker, foe, kind, dealt = 0) {
  const s = foe && foe.setups && foe.setups[kind];
  duelAdd(attacker, 'combosLanded');
  if (s) duelAdd(s.by, 'combosSet');
  if (s && kind !== 'expose') delete foe.setups[kind];
  if (foe && attacker && COMBO_DO[kind]) COMBO_DO[kind](attacker, foe, dealt, s && s.by);
  const mine = (attacker && attacker.isPlayer) || (s && s.by.isPlayer);
  if (foe && mine) {
    fxText(foe.x, foe.y - (foe.isBoss ? 200 : 110), 'COMBO!', '#F2C230', 26, { dur: 1.1 });
    fx({ type: 'ring', x: foe.x, y: foe.y - 40, r0: 18, r1: foe.r + 70, col: '#F2C230', dur: 0.3, w: 6 });
    sfx('combo', 0.9);
    if (attacker.isPlayer) hold(0.05, attacker, foe);
  }
  emit({ type: 'combo', kind, player: !!(attacker && attacker.isPlayer) });
}
/** what a combo does on top of hitting half again as hard, by the setup it cashed in (docs/duo.md) */
const near = (foe, r) => foesNear(foe.x, foe.y, r, false).filter((o) => o !== foe && !o.cage && !o.M.thing && !o.M.wisp);
export const COMBO_DO = {
  // frozen: it shatters, bursting ice on the foes round it (a quarter of the payoff)
  freeze(a, foe, dealt) {
    for (const o of near(foe, 120)) hurtMob(o, Math.max(20, dealt / 4), a, { raw: true, noCrit: true, size: 17, col: '#8FD6FF', tier: 'tick', key: 'combo' });
    bits(foe.x, foe.y - 40, 'shard_ice', 8, 240);
  },
  // burning: the Burn spreads to the foes round it, as much as it had (at least 3)
  burn(a, foe) {
    const n = Math.max(3, burnOf(foe));
    for (const o of near(foe, 130)) if (burnOf(o) < n) addBurn(a, o, n - burnOf(o));
    dots(foe.x, foe.y - 40, '#FFB347', 10, 200);
  },
  // stunned: it's knocked down, so the stun lasts a beat longer (a boss staggers a beat longer). A foe in the
  // pile a Slam made isn't stunned, and a payoff never stuns it: only an interrupt stops a cast
  stun(_a, foe) {
    if (!foe.alive) return;
    if (foe.isBoss) { if (foe.st.stagger > 0) staggerBoss(foe, foe.st.stagger + 1); }
    else if (foe.st.stun > 0) { foe.st.stun += 1; foe.wind = 0; }
  },
  // poisoned: the venom left on it is cashed in at once
  poison(a, foe) {
    const b = foe.bleed;
    if (!foe.alive || !b || b.left <= 0) return;
    foe.bleed = null;
    hurtMob(foe, b.per * (b.n || 1) * Math.ceil(b.left / 0.5), a, { raw: true, noCrit: true, col: '#7CF06A', size: 20, key: 'combo' });
    dots(foe.x, foe.y - 44, '#7CF06A', 10, 160);
  },
};
/** the crit chance a payoff hits with: a combo on a foe your mate marked always crits */
export const comboCrit = (kind, chance) => (kind === 'mark' ? 1 : chance);
/** a payoff's multiplier for this combo kind (1 when there is none) */
export const comboMul = (kind) => (kind ? COMBO : 1);

/** stop a foe's cast with one of your buttons: a cast it can be kicked out of Exposes it, and that's a setup for your
 *  mate */
export function kick(m, by) {
  if (!m || !m.cast) return;
  const kickable = !!m.cast.kick;
  interruptCast(m, by);
  if (kickable && by) setUp(m, by, 'expose', 3);
}
/** a foe stunned by a hero (a boss Staggers): the stun and the setup for your mate */
export function stunBy(m, dur, by, stagger = dur) {
  if (!m || !m.alive || m.M.thing || m.cage) return;
  if (m.isBoss) staggerBoss(m, stagger);
  else { m.st.stun = Math.max(m.st.stun, dur); m.wind = 0; }
  if (by) setUp(m, by, 'stun', (m.isBoss ? stagger : dur) + 0.3);
}
/** a foe Exposed by a hero: the window, and the setup for your mate */
export function exposeBy(m, dur, by, label) {
  if (!m || !m.alive) return;
  exposeMob(m, dur, label);
  if (by && m.exposed > 0) setUp(m, by, 'expose', dur);
}

/* ---------- staying alive ---------- */
/** out of a fight you're full again within about 2 seconds: `after` once it's over, then `rate` of your health a
 *  second */
export const REFILL = { after: 0.4, rate: 0.6 };
/** every payoff heals you this share of your health */
export const PAYOFF_HEAL = 0.04;
/** going down: a mate standing within `reach` of you (centre to centre) for `time` seconds picks you up with `hp` of
 *  your health; walking off loses it twice as fast as it came */
export const PICK_UP = { time: 1.5, reach: 90, hp: 0.4 };
/** a dodge is perfect when a big hit lands within this long of pressing it */
export const PERFECT_DODGE = 0.25;

/** a payoff landed: it heals you a little (once a press, however many it hit) */
export function payoffHeal(h) {
  if (!h || !h.alive || h.hp >= h.maxHp) return;
  healHero(h, h, h.maxHp * PAYOFF_HEAL, { raw: true, size: 15 });
}
/** the health a hero gets back out of a fight this tick (heroTick) */
export function refill(h, dt) {
  if (!h.alive || h.hp >= h.maxHp || S.inCombat || S.t - S.lastCombat < REFILL.after) return;
  h.hp = Math.min(h.maxHp, h.hp + h.maxHp * REFILL.rate * dt);
}

/* ---------- going down ---------- */
/** a hero's conditions, all clear */
export const freshSt = () => ({ stun: 0, root: 0, haunt: 0, air: 0, ghost: 0, surge: 0, zeal: 0, kx: 0, ky: 0, chained: null, caged: null, curse: null });
/** where a hero goes when its health hits zero (hurtHero calls this): down, not out. A downed hero isn't alive (no
 *  foe targets it and it does nothing), lies in its ring of light, and its mate picks it up by standing beside it
 *  for PICK_UP.time. With nobody up, it's a wipe (game.js); when the fight ends with it down, it gets up anyway. */
export function heroFalls(h, _src) {
  killHero(h);
  h.down = true; h.downT = 0; h.pickT = 0; h.pickBy = null;
  if (h.isPlayer && S.heroes.some((o) => o !== h && o.alive)) banner('You’re down. Your mate can pick you up.', 'warn', 3);
}
/** is this hero down, waiting for its mate */
export const isDown = (h) => !!(h && h.down && !h.alive);
/** a mate who can pick someone up: up, and not caged, stunned, thrown or charging */
const canLift = (o) => o.alive && !o.st.caged && !(o.st.stun > 0) && !(o.st.air > 0) && !o.dash;
/** the mate standing beside a downed hero who can pick them up now (the nearest), or null */
export function rescuer(h) {
  if (!isDown(h)) return null;
  let best = null, bd = PICK_UP.reach;
  for (const o of S.heroes) {
    if (o === h || !canLift(o)) continue;
    const d = dist(o, h);
    if (d <= bd) { bd = d; best = o; }
  }
  return best;
}
/** a downed hero's tick (heroTick): a mate beside it fills the pick-up, and it's back up when that's full */
export function downTick(h, dt) {
  if (!isDown(h)) return;
  h.downT = (h.downT || 0) + dt;
  const by = rescuer(h);
  h.pickBy = by;
  if (by) { h.pickT = (h.pickT || 0) + dt; if (h.pickT >= PICK_UP.time) pickUp(h, by); }
  else h.pickT = Math.max(0, (h.pickT || 0) - dt * 2);
}
/** how far along a downed hero's pick-up is, 0 to 1 (for the ring of light) */
export const pickUpOf = (h) => (isDown(h) ? Math.min(1, (h.pickT || 0) / PICK_UP.time) : 0);
/** `by` picks `h` back up, with PICK_UP.hp of its health: true if it worked (h was down, by is up). It counts on
 *  `by`'s duel card. */
export function pickUp(h, by) {
  if (!S || S.over || !isDown(h)) return false;
  if (by && (by === h || !by.alive)) return false;
  Object.assign(h, { alive: true, down: false, downT: 0, pickT: 0, pickBy: null, deadT: 0, dodgeT: 0, dash: null, cast: null, blocking: false, next: null });
  h.hp = Math.max(1, Math.round(h.maxHp * PICK_UP.hp)); h.st = freshSt();
  h.iframe = Math.max(h.iframe, 1); h.flash = 0.2;
  if (by) { duelAdd(by, 'pickups'); S.stats.pickups = (S.stats.pickups || 0) + 1; by.stats.pickups = (by.stats.pickups || 0) + 1; }
  const mine = h.isPlayer || (by && by.isPlayer);
  fxText(h.x, h.y - 120, h.isPlayer ? 'Back up!' : by && by.isPlayer ? 'Picked up!' : h.name + ' is up', '#F2C230', mine ? 28 : 20, { dur: 1.3 });
  fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 18, r1: 120, col: '#FFE08A', dur: 0.45, w: 7, ground: true });
  dots(h.x, h.y - 50, '#FFE08A', 16, 200);
  sfx('revive');
  if (mine) shake(3);
  emit({ type: 'hero.raised', role: h.role, player: !!h.isPlayer });
  return true;
}
/** a downed mate of `h`'s and where to stand to pick them up, or null (for the bots) */
export function downedMate(h) {
  if (!h || !h.alive) return null;
  let best = null, bd = Infinity;
  for (const o of S.heroes) { if (o === h || !isDown(o)) continue; const d = dist(o, h); if (d < bd) { bd = d; best = o; } }
  return best;
}

/* ---------- dodges ---------- */
/** is this hit a big one, worth a perfect dodge: a heavy swing, or a boss's or a big foe's move */
const bigHit = (src, o) => !!(o.heavy || o.smash || (src && src.kind === 'mob' && (src.isBoss || src.M.big) && (o.hazard || o.magic || o.kind)));
/** a hero's dodge took a hit that would have landed (hurtHero calls this). Rolled just as a big hit landed
 *  (PERFECT_DODGE), it's perfect: the hit misses you and opens its foe up (a boss for 3.5 seconds), like a perfect
 *  block, once a dodge. */
export function dodged(h, src, o) {
  o = o || {};
  if (!h || !h.alive || h.dodgePerfect || !(S.t - (h.dodgeAt ?? -99) <= PERFECT_DODGE) || !bigHit(src, o)) return;
  h.dodgePerfect = true;
  h.stats.perfectDodges = (h.stats.perfectDodges || 0) + 1;
  S.stats.perfectDodges = (S.stats.perfectDodges || 0) + 1;
  if (src && src.kind === 'mob' && src.alive && !src.M.thing) exposeBy(src, src.isBoss ? 3.5 : 2.5, h, 'Exposed!');
  if (h.isPlayer) {
    fxText(h.x, h.y - 96, 'PERFECT!', '#F2C230', 30, { dur: 1.3 });
    shake(4);
    if (src) hold(0.06, h, src);
  }
  fx({ type: 'ring', x: h.x, y: h.y - 30, r0: 16, r1: 96, col: '#F2C230', dur: 0.32, w: 6 });
  sfx('perfect', h.isPlayer ? 1 : 0.6);
  emit({ type: 'dodge', player: !!h.isPlayer, perfect: true });
}
