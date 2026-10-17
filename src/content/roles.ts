/** The three seats in every party, and what each one can press. Four buttons each, plus the swipe dodge. */
import type { AbKey, AbilityDef, AbilitySlot, GearKey, RoleDef, RoleId } from './types';
import { CLASSES, type ClassId } from './folk';

export const ORDER: RoleId[] = ['tank', 'healer', 'dps'];
export const SLOTS_AB: AbilitySlot[] = ['a1', 'a2', 'a3', 'a4'];

export const abKey = (h: RoleId | AbKey | { role?: RoleId; cls?: string }): AbKey =>
  typeof h === 'string' ? h : h.cls === 'rogue' ? 'rogue' : h.cls === 'ranger' ? 'ranger' : (h.role ?? CLASSES[(h.cls as ClassId) || 'warrior']?.role ?? 'dps');

export const ROLES: Record<RoleId, RoleDef> = {
  tank: { id: 'tank', name: 'Brannoc', title: 'Tank', hp: 1250, armor: 0.44, speed: 176, r: 18, threat: 1.3, color: '#4F6FA8',
    blurb: 'Cleave through packs, Slam to yank foes into a whirlwind, Charge stragglers, block big hits.' },
  healer: { id: 'healer', name: 'Maren', title: 'Healer', hp: 820, armor: 0.2, speed: 182, r: 16, threat: 1, color: '#E7B53C',
    blurb: 'Tap a name to Mend. Smite on the quiet beats for mana.' },
  dps: { id: 'dps', name: 'Ivy', title: 'DPS', hp: 720, armor: 0.15, speed: 186, r: 16, threat: 1, color: '#3D7FC1',
    blurb: 'Icicle every beat. Freeze them, then shatter them.' },
};

/* Each class has a filler (no cooldown, once a beat), a payoff it sets up, and two cooldowns. Charge and Shadowstep
   move you, so they never wait for the beat; the shield is held. What each button does is src/dungeon/buttons.js. */
export const AB: Record<AbKey, Record<AbilitySlot, AbilityDef>> = {
  tank: {
    a1: { key: 'cleave', name: 'Cleave', cd: 0, filler: true, hit: 60, desc: 'A wide axe sweep through everything in front of you, every beat. Primed, it Crushes for 1.6×.', combo: 'The Cleave after a Charge, a Slam, a perfect block or a Cleave crit Crushes, and a stunned, Staggered or Exposed foe is always Crushed' },
    a2: { key: 'charge', name: 'Charge', cd: 8, offBeat: true, desc: 'Rush a mob and shoulder-slam it: it stuns the foes round it, stops their casts and primes Crush. A boss staggers.', combo: 'On a boss: a 1s Stagger, not a stun (he keeps attacking), and it still stops his cast' },
    a3: { key: 'slam', name: 'Slam', cd: 8, desc: 'Drag every foe near you in, make them turn on you, spin a whirlwind through them, and prime Crush.', combo: 'On a boss: a taunt and the whirlwind, no drag' },
    a4: { key: 'shield', name: 'Shield', cd: 0, hold: true, desc: 'Hold to block from the front. Block right before a big hit to stun it, strike back and prime Crush.', combo: 'A perfect block ends the beat, so Cleave fires the moment the shield comes down. It stuns and exposes a boss too' },
  },
  healer: {
    a1: { key: 'circle', name: 'Prayer circle', cd: 5, mana: 14, aim: true, range: 520, desc: 'Allies standing in it heal fast.', combo: 'Your Smites pulse it' },
    a2: { key: 'ward', name: 'Ward', cd: 4, mana: 10, desc: 'Shield the ally who needs it most.', combo: 'Ward the tank before a big boss swing' },
    a3: { key: 'sunburst', name: 'Sunburst', cd: 13, mana: 22, desc: 'Heal everyone and clear nasty effects.', combo: 'A full-party heal that lifts curses and frees roots' },
    a4: { key: 'smite', name: 'Smite', cd: 0, filler: true, hit: 60, desc: 'Throw light at the tank’s target, every beat. It heals your most hurt ally for half, gives 4 mana back and pulses your Prayer circles.', combo: 'A crit makes your next Mend free and half again as big' },
  },
  dps: {
    a1: { key: 'blizzard', name: 'Blizzard', cd: 7.8, aim: true, range: 520, desc: 'Ice storm on the ground. Hits and slows everything in it.', combo: 'Slow the pack, then Rime burst freezes it. On a boss it hits, but doesn’t slow' },
    a2: { key: 'nova', name: 'Rime burst', cd: 10, range: 155, desc: 'Freeze everything close to you for 4 seconds and stop their casts. A boss is Chilled instead.', combo: 'Frozen foes Shatter: Icicle 3×, Comet 2×. A Chilled boss Shatters for 1.5×' },
    a3: { key: 'comet', name: 'Comet', cd: 5.6, cast: 0.9, hit: 280, desc: 'A big hit with splash damage. Double damage on frozen targets.', combo: '2× on frozen targets, 1.5× on a Chilled boss' },
    a4: { key: 'icicle', name: 'Icicle', cd: 0, filler: true, hit: 68, desc: 'An instant ice shard, every beat. Shatters frozen foes for 3× and a Chilled boss for 1.5×.', combo: 'A crit makes the next Icicle Shatter anything' },
  },
  rogue: {
    a1: { key: 'viper', name: 'Viper Blades', cd: 0, filler: true, hit: 38, desc: 'Slash with venomed daggers, every beat: it poisons for 5.5 seconds and adds a point (two on a crit).', combo: 'Build five points, then spend them on Shadowstrike' },
    a2: { key: 'ambush', name: 'Shadowstrike', cd: 0, desc: 'Spend every point on one strike, 28 a point. On a poisoned target it always crits and hits 35% harder, and a rogue’s crits hit two and a half times as hard.', combo: 'At five points it’s the biggest hit you have' },
    a3: { key: 'flurry', name: 'Fan of Blades', cd: 6.0, desc: 'Whirl knives round you: they stop casts, refresh venom and add a point if they hit.', combo: 'Your interrupt for a pack’s casters' },
    a4: { key: 'shadowstep', name: 'Shadowstep', cd: 8, offBeat: true, desc: 'Blink behind your target, strike it and stop its cast. You swing 35% faster for 3.8 seconds and gain two points.', combo: 'Close the gap, stop a cast, and bank points' },
  },
  // the ranger (docs/duo.md, names are drafts): the plumbing's placeholder; the ranger's stream gives it its numbers
  // and builds the buttons in src/dungeon/ranger.js. No hero can be a ranger until CLASS_ORDER offers it.
  ranger: {
    a1: { key: 'quickshot', name: 'Quick Shot', cd: 0, filler: true, hit: 60, desc: 'An arrow every beat that marks its foe.', combo: 'Three marks make a Longshot' },
    a2: { key: 'longshot', name: 'Longshot', cd: 0, desc: 'On a foe with three marks, or an Exposed one, a drawn arrow that hits hard and goes through to the foes behind it.', combo: 'Your payoff' },
    a3: { key: 'pinshot', name: 'Pin Shot', cd: 8, desc: 'An arrow that stops a cast and Exposes the caster.', combo: 'Your interrupt' },
    a4: { key: 'snare', name: 'Snare', cd: 10, aim: true, range: 520, desc: 'Throw a trap that roots whatever walks in.', combo: 'Lay it where your mate drags the pack' },
  },
};

/** a class's filler: its button and what it does */
export function fillerOf(k: AbKey): { slot: AbilitySlot; def: AbilityDef } {
  const slot = SLOTS_AB.find((s) => AB[k][s].filler) || 'a1';
  return { slot, def: AB[k][slot] };
}
/** the set pieces that make a filler hit harder, and by how much: the Barrow's and Thimblebriar's helms */
export const FILLER_PIECES: Record<string, number> = { bg_helm: 1.25, cg_helm: 1.25, cw_helm: 1.3, rb_helm: 1.25, as_helm: 1.25 };
/** how much harder these bonuses make a filler hit */
export function fillerMul(bonuses: Iterable<string>): number {
  let k = 1;
  for (const b of bonuses) k *= FILLER_PIECES[b] ?? 1;
  return k;
}

/** Mend: a tap on a mate's name. On the beat like the four buttons (Quick Hands: it waits for the beat but never
 *  starts it, only its own short pause, `quick`). */
export const MEND = { heal: 230, mana: 9, quick: 0.35, range: 560 };

/** The beat the four buttons and Mend share (see src/dungeon/press.js): firing one starts it, and the rest wait
 *  for it to end. A press up to `queue` seconds early is kept and fires the moment it can; a kept press lapses
 *  after `wait`, long enough to wait out a dodge, a Charge, a cast or the shield (a tap to Mend waits the whole
 *  beat). Gear never changes it; brews and Lantern Zeal speed it up as they do cooldowns. */
export const BEAT = { len: 1.0, queue: 0.4, wait: 1.0 };
