/* ---------- the coach: which of your buttons has its moment right now ----------
   For a class's first few runs the HUD glows the one button this names (learnGlow in src/meta/profile.ts
   says how strongly). A roll out of a hit about to land comes first, then each class's own reads, most urgent
   first. Advice only: nothing here changes the fight. Gives { slot, tag } (slot 'a1'..'a4' or 'dodge'), or for
   a healer with one mate to patch up { frame: role, tag }, or null. */
import { dist } from '../core/math';
import { MEND } from '../content/roles';
import { S } from './state.js';
import { abMana, bestCluster, heroBy, isFoe } from './heroes.js';
import { MAX_POINTS, burnable, crushes, icicleShatter } from './buttons.js';
import { inHaz } from './bots.js';

/* ready as far as its own cooldown and mana go (the beat doesn't count: a press waits for it, so the glow holds) */
const ready = (h, slot) => (slot === 'dodge' ? h.cd.dodge <= 0 : h.cd[slot] <= 0 && h.mana >= abMana(h, slot));
/** a cast in reach that this button can stop, a moment into it */
const kickIn = (h, r) => S.mobs.some((m) => isFoe(m) && m.cast && m.cast.kick && m.cast.t > 0.2 && dist(m, h) < r + m.r);
/** the first button in the list that is ready and whose moment it is */
const first = (h, reads) => { for (const [slot, tag, now] of reads) if (ready(h, slot) && now()) return { slot, tag }; return null; };
const foesInFight = () => S.mobs.filter((m) => isFoe(m) && !m.cage && !m.M.wisp && m.state === 'fight');
/** a hit about to land on you that a roll gets you out of (a tank blocks the big ones instead) */
function aboutToBeHit(h) {
  const lane = (z) => z.shape === 'rect' && z.src && z.src.isBoss;
  return S.hazards.some((z) => (!z.noDmg || lane(z)) && !z.fired && !(z.tankBuster && h.role === 'tank') && z.warn - z.t < 0.9 && inHaz(z, h.x, h.y, h.r))
    || S.rings.some((g) => !g.hit.has(h.id) && Math.abs(dist(h, g) - g.r) < 90);
}

/** @typedef {{ slot?: string, frame?: string, tag: string }} Moment */
/** @param {any} h @returns {Moment | null} */
export function momentFor(h) {
  if (!S || !h || !h.alive || S.over || !S.inCombat || h.st.stun > 0 || h.st.caged || h.dodgeT > 0) return null;
  if (ready(h, 'dodge') && aboutToBeHit(h)) return { slot: 'dodge', tag: 'ROLL!' };
  if (h.role === 'healer') return healerMoment(h);
  if (h.role === 'tank') return tankMoment(h);
  return h.cls === 'rogue' ? rogueMoment(h) : mageMoment(h);
}

function healerMoment(h) {
  const tank = heroBy('tank');
  const party = S.heroes.filter((a) => a.alive);
  const reach = party.filter((a) => dist(a, h) <= 470);
  const cursed = reach.some((a) => a.st.curse);
  const bigHit = () => tank && tank.alive && tank.absorb <= 0 && dist(tank, h) <= MEND.range + 40
    && S.hazards.some((z) => z.tankBuster && !z.fired && (z.followT === tank || inHaz(z, tank.x, tank.y, tank.r)));
  const urgent = first(h, [
    ['a2', 'WARD!', bigHit],
    ['a3', cursed ? 'LIFT!' : 'HEAL ALL!', () => cursed || reach.filter((a) => a.hp < a.maxHp * 0.5).length >= 2],
  ]);
  if (urgent) return urgent;
  // one mate low: tap their frame to heal them
  const low = party.filter((a) => a.hp < a.maxHp * 0.6 && dist(a, h) <= MEND.range).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (low && h.mana >= MEND.mana) return { frame: low.role, tag: 'TAP' };
  const bunched = party.length > 1 && party.every((a) => party.every((b) => dist(a, b) <= 200));
  return first(h, [
    ['a1', 'CIRCLE!', () => bunched && party.some((a) => a.hp < a.maxHp * 0.9)],
    ['a4', 'SMITE!', () => party.every((a) => a.hp > a.maxHp * 0.8) && !!tank && isFoe(tank.target)],
  ]);
}

function tankMoment(h) {
  const foes = foesInFight();
  const loose = foes.filter((m) => m.target && m.target !== h && m.forcedT <= 0);
  return first(h, [
    ['a4', 'BLOCK!', () => S.hazards.some((z) => (z.tankBuster || (z.shape === 'rect' && z.src && z.src.isBoss)) && !z.fired && (z.followT === h || inHaz(z, h.x, h.y, h.r)) && z.warn - z.t < 0.9)],
    ['a2', 'KICK!', () => kickIn(h, 420)],
    ['a3', loose.some((m) => dist(m, h) < 240 + m.r) ? 'TAUNT!' : 'PULL!', () => loose.some((m) => dist(m, h) < 240 + m.r) || foes.filter((m) => dist(m, h) < 200 + m.r).length >= 3],
    ['a2', 'PEEL!', () => loose.some((m) => { const d = dist(m, h); return d > 200 && d < 420; })],
    // the filler glows only when it's the payoff: the next Cleave will Crush
    ['a1', 'CRUSH!', () => foes.some((m) => dist(m, h) <= 105 + m.r && crushes(h, m))],
  ]);
}

function mageMoment(h) {
  const foes = foesInFight();
  const t = h.picked || h.target;
  return first(h, [
    ['a2', 'KICK!', () => kickIn(h, 150)],
    ['a2', 'FREEZE!', () => foes.filter((m) => !m.isBoss && dist(m, h) < 150 + m.r).length >= 2],
    // a boss never freezes: Rime burst Chills him, and Icicle shatters him for less
    ['a2', 'CHILL!', () => foes.some((m) => m.isBoss && !(m.st.chill > 0) && dist(m, h) < 150 + m.r)],
    ['a4', 'SHATTER!', () => foes.some((m) => dist(m, h) < 500 && icicleShatter(h, m).k > 1)],
    ['a1', 'STORM!', () => { const c = bestCluster(h, 120, 520); return !!c && c.score >= 3; }],
    ['a3', 'COMET!', () => isFoe(t) && !t.cage && (t.st.freeze > 0.6 || t.isBoss || !!t.M.big) && dist(t, h) < 520],
  ]);
}

function rogueMoment(h) {
  const foes = foesInFight();
  const t = h.picked || h.target;
  const inReach = isFoe(t) && !t.cage && dist(t, h) <= 105 + t.r;
  return first(h, [
    ['a3', 'KICK!', () => kickIn(h, 135)],
    ['a3', 'FAN!', () => foes.filter((m) => dist(m, h) < 135 + m.r).length >= 2],
    ['a4', 'BLINK!', () => isFoe(t) && !t.cage && dist(t, h) > 105 + t.r && dist(t, h) <= 340 + t.r],
    // five points (or an Exposed target): spend them
    ['a2', 'FINISH!', () => inReach && (h.points >= MAX_POINTS || burnable(h, t))],
    ['a1', 'VENOM!', () => inReach && (!t.bleed || t.bleed.left < 1.8)],
  ]);
}
