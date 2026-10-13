/** The three seats in every party, and what each one can press. Four buttons each, plus the swipe dodge. */
import type { AbilityDef, AbilitySlot, RoleDef, RoleId } from './types';

export const ORDER: RoleId[] = ['tank', 'healer', 'dps'];
export const SLOTS_AB: AbilitySlot[] = ['a1', 'a2', 'a3', 'a4'];

export const ROLES: Record<RoleId, RoleDef> = {
  tank: { id: 'tank', name: 'Brannoc', title: 'Tank', hp: 1250, armor: 0.55, speed: 176, r: 18, threat: 1.3, color: '#4F6FA8', sprite: 'tank',
    blurb: 'Slam to grab the pack, Charge whatever runs at your mates, block the big hits.' },
  healer: { id: 'healer', name: 'Maren', title: 'Healer', hp: 820, armor: 0.2, speed: 182, r: 16, threat: 1, color: '#E7B53C', sprite: 'healer',
    blurb: 'Tap a frame to heal. Smite when everyone is topped up.' },
  dps: { id: 'dps', name: 'Ivy', title: 'DPS', hp: 720, armor: 0.15, speed: 186, r: 16, threat: 1, color: '#3D7FC1', sprite: 'dps',
    blurb: 'Stand still to cast. Freeze them, then shatter them.' },
};

export const AB: Record<RoleId, Record<AbilitySlot, AbilityDef>> = {
  tank: {
    a1: { key: 'slam', name: 'Slam', cd: 6, desc: 'Hit everything around you. It all turns on you and gets dragged in.' },
    a2: { key: 'shield', name: 'Shield', cd: 0, hold: true, desc: 'Hold to block from the front. Block right before a big hit to stun it and hit back.' },
    a3: { key: 'charge', name: 'Charge', cd: 7, desc: 'Dash to a mob and smash it. It turns on you, and what is around it is stunned.' },
    a4: { key: 'cleave', name: 'Cleave', cd: 3.5, desc: 'A big swing through everything in front of you.' },
  },
  healer: {
    a1: { key: 'circle', name: 'Prayer circle', cd: 5, mana: 14, aim: true, range: 520, desc: 'Allies standing in it heal fast.' },
    a2: { key: 'ward', name: 'Ward', cd: 4, mana: 10, desc: 'Shield the ally who needs it most.' },
    a3: { key: 'sunburst', name: 'Sunburst', cd: 14, mana: 22, desc: 'Heal everyone and clear nasty effects.' },
    a4: { key: 'smite', name: 'Smite', cd: 2.5, desc: 'Throw light at the tank’s target. It heals your most hurt ally and gives mana back.' },
  },
  dps: {
    a1: { key: 'blizzard', name: 'Blizzard', cd: 7.5, aim: true, range: 520, desc: 'Ice storm on the ground. Hits everything in it.' },
    a2: { key: 'nova', name: 'Rime burst', cd: 11, desc: 'Freeze everything close to you.' },
    a3: { key: 'comet', name: 'Comet', cd: 5.5, cast: 0.9, desc: 'Big hit. Double on frozen targets.' },
    a4: { key: 'icicle', name: 'Icicle', cd: 2.5, desc: 'Instant shard. Triple damage on frozen targets.' },
  },
};

export const MEND = { heal: 140, mana: 6, gcd: 0.45, range: 560 };
