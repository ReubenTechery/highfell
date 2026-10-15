/** The three seats in every party, and what each one can press. Four buttons each, plus the swipe dodge. */
import type { AbilityDef, AbilitySlot, GearKey, RoleDef, RoleId } from './types';
import { CLASSES, type ClassId } from './folk';

export const ORDER: RoleId[] = ['tank', 'healer', 'dps'];
export const SLOTS_AB: AbilitySlot[] = ['a1', 'a2', 'a3', 'a4'];

export const abKey = (h: RoleId | GearKey | { role?: RoleId; cls?: string }): GearKey =>
  typeof h === 'string' ? h : h.cls === 'rogue' ? 'rogue' : (h.role ?? CLASSES[(h.cls as ClassId) || 'warrior']?.role ?? 'dps');

export const ROLES: Record<RoleId, RoleDef> = {
  tank: { id: 'tank', name: 'Brannoc', title: 'Tank', hp: 1250, armor: 0.55, speed: 176, r: 18, threat: 1.3, color: '#4F6FA8', sprite: 'tank',
    blurb: 'Cleave through packs, Slam to yank foes into a whirlwind, Charge stragglers, block big hits.' },
  healer: { id: 'healer', name: 'Maren', title: 'Healer', hp: 820, armor: 0.2, speed: 182, r: 16, threat: 1, color: '#E7B53C', sprite: 'healer',
    blurb: 'Tap a frame to heal. Smite when everyone is topped up.' },
  dps: { id: 'dps', name: 'Ivy', title: 'DPS', hp: 720, armor: 0.15, speed: 186, r: 16, threat: 1, color: '#3D7FC1', sprite: 'dps',
    blurb: 'Stand still to cast. Freeze them, then shatter them.' },
};

export const AB: Record<GearKey, Record<AbilitySlot, AbilityDef>> = {
  tank: {
    a1: { key: 'cleave', name: 'Cleave', cd: 2.2, desc: 'Fast, wide axe sweep through foes in front of you. Crushes heavy foes, stunned targets, or clumped packs for bonus damage.', combo: '② Spammable finisher: Crush! bonus damage on heavy foes, stunned targets, or 2+ packs' },
    a2: { key: 'charge', name: 'Charge', cd: 6.5, desc: 'Rush a mob and shoulder-slam it. Stuns nearby foes and shaves 1.2s off Cleave.', combo: '① Charge stuns pack & readies Cleave ➔ ② Cleave crushes' },
    a3: { key: 'slam', name: 'Slam', cd: 6.0, desc: 'Drag every nearby foe in, force them onto you, and spin a 360° whirlwind through the pack.', combo: '① Drag pack in + Whirlwind ➔ ② Cleave crushes the clump' },
    a4: { key: 'shield', name: 'Shield', cd: 0, hold: true, desc: 'Hold to block from the front. Block right before a big hit to stun it, counter-strike, and reset Cleave.', combo: '① Perfect block stuns & resets Cleave ➔ ② Cleave crushes' },
  },
  healer: {
    a1: { key: 'circle', name: 'Prayer circle', cd: 5, mana: 14, aim: true, range: 520, desc: 'Allies standing in it heal fast.', combo: '① Drop Circle ➔ ② Smite pulses bonus healing inside it' },
    a2: { key: 'ward', name: 'Ward', cd: 3.8, mana: 10, desc: 'Shield the ally who needs it most.', combo: '① Pre-shield tank before big boss swings' },
    a3: { key: 'sunburst', name: 'Sunburst', cd: 13, mana: 22, desc: 'Heal everyone and clear nasty effects.', combo: '② Emergency: full-party heal + cleanses roots & curses' },
    a4: { key: 'smite', name: 'Smite', cd: 2.4, desc: 'Throw light at the tank’s target. Heals your most hurt ally, restores mana, and pulses active Prayer circles.', combo: '② Payoff: restores mana + pulses active Prayer circle' },
  },
  dps: {
    a1: { key: 'blizzard', name: 'Blizzard', cd: 7.8, aim: true, range: 520, desc: 'Ice storm on the ground. Hits and slows everything in it.', combo: '① Slow pack in Blizzard ➔ ② Rime burst to freeze all' },
    a2: { key: 'nova', name: 'Rime burst', cd: 11.5, desc: 'Freeze everything close to you and stop casts.', combo: '① Freeze foes ➔ ② Icicle (3×) or Comet (2×) Shatter!' },
    a3: { key: 'comet', name: 'Comet', cd: 5.6, cast: 0.9, desc: 'Big hit with splash damage. Double damage on frozen targets.', combo: '② Finisher: 2× Shatter damage on frozen targets' },
    a4: { key: 'icicle', name: 'Icicle', cd: 2.6, desc: 'Instant ice shard. Triple damage on frozen targets.', combo: '② Finisher: 3× Shatter damage on frozen targets' },
  },
  rogue: {
    a1: { key: 'viper', name: 'Viper Blades', cd: 2.3, desc: 'Slash a single foe with twin venom-coated daggers and poison them with Viper Venom for 5.5 seconds.', combo: '① Poison boss with Viper Venom ➔ ② Shadowstrike always crits!' },
    a2: { key: 'ambush', name: 'Shadowstrike', cd: 3.4, desc: 'Strike a single target from the shadows with both daggers. Always crits and deals 60% bonus damage on poisoned targets.', combo: '② Finisher: guaranteed crit + 1.6× damage on poisoned foes' },
    a3: { key: 'flurry', name: 'Fan of Blades', cd: 6.0, desc: 'Whirl and fling throwing knives in a circle around you, interrupting enemy casts, slicing nearby foes, and refreshing active venom.', combo: '① Interrupt enemy casts & refresh venom (modest AoE)' },
    a4: { key: 'shadowstep', name: 'Shadowstep', cd: 5.5, desc: 'Blink through shadow behind your target, strike it, interrupt casts, gain +35% attack speed for 3.8s, and shave 2s off Shadowstrike.', combo: '① Blink behind boss + shaves 2.0s off Shadowstrike ➔ ② Shadowstrike' },
  },
};

export const MEND = { heal: 140, mana: 6, gcd: 0.45, range: 560 };
