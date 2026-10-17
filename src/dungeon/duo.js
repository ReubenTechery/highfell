/* ---------- the duo: the pair, the duel card's counts, combos, going down, dodges ----------
   The duo rework's contracts (docs/duo.md, docs/duo-agents.md). Every workstream codes against these. The
   integrator wrote them with today's behaviour; stream 2 fills in going down (heroFalls, isDown, pickUp), perfect
   dodges (dodged) and how a combo looks and sounds (combo). Heroes are known by seat (h.seat, h.id 'h0', 'h1')
   and class (h.cls); h.role is the old trinity's and new code doesn't use it. */
import { S, emit } from './state.js';
import { fxText, killHero } from './entities.js';

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

/* ---------- combos: your setup, my payoff ---------- */
/** how much harder a payoff hits on a foe your mate set up */
export const COMBO = 1.5;
/** how long a setup counts for a combo when the call doesn't say (seconds) */
const SETUP_LIFE = 4;
/** `by` set `foe` up: 'freeze', 'burn', 'stun', 'poison', 'mark' or 'expose', for `dur` seconds (SETUP_LIFE if not
 *  given). The newest setup of a kind replaces the last. */
export function setUp(foe, by, kind, dur) {
  if (!S || !foe || !by || !foe.alive) return;
  foe.setups = foe.setups || {};
  foe.setups[kind] = { by, until: S.t + (dur ?? SETUP_LIFE) };
}
/** the kind of a setup your mate left on this foe that's still on, or null: your own setups never make a combo */
export function comboFor(foe, attacker) {
  if (!S || !foe || !foe.setups || !attacker) return null;
  for (const [kind, s] of Object.entries(foe.setups)) if (s.by !== attacker && s.by.kind === 'hero' && S.t < s.until) return kind;
  return null;
}
/** a payoff landed on a foe its mate set up (the payoff hits COMBO times as hard itself): the word pops, and it
 *  counts for both of you on the duel card */
export function combo(attacker, foe, kind) {
  const s = foe && foe.setups && foe.setups[kind];
  duelAdd(attacker, 'combosLanded');
  if (s) duelAdd(s.by, 'combosSet');
  if (foe && ((attacker && attacker.isPlayer) || (s && s.by.isPlayer))) fxText(foe.x, foe.y - (foe.isBoss ? 200 : 110), 'COMBO!', '#F2C230', 26, { dur: 1.1 });
  emit({ type: 'combo', kind, player: !!(attacker && attacker.isPlayer) });
}

/* ---------- going down ---------- */
/** where a hero goes when its health hits zero (hurtHero calls this). Today it's the old death; stream 2 makes it
 *  going down, with the mate to pick it up. */
export function heroFalls(h, _src) { killHero(h); }
/** is this hero down, waiting for its mate */
export const isDown = (h) => !!(h && h.down);
/** `by` picks `h` back up: true if it worked (stream 2 fills it in) */
export function pickUp(_h, _by) { return false; }

/* ---------- dodges ---------- */
/** a hero's dodge took a hit that would have landed (hurtHero calls this); stream 2 makes a perfect one open the
 *  boss up */
export function dodged(_h, _src, _o) {}
