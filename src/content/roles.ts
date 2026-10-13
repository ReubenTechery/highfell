/** The three seats in every party, and what each one can press. */
import type { AbilityDef, AbilitySlot, RoleDef, RoleId } from './types';

export const ORDER: RoleId[] = ['tank', 'healer', 'dps'];

export const ROLES: Record<RoleId, RoleDef & { kit: [string, string][] }> = {
  tank: { id: 'tank', name: 'Brannoc', title: 'Tank', hp: 1250, armor: 0.55, speed: 176, r: 18, threat: 3.6, color: '#4F6FA8', sprite: 'tank',
    blurb: 'Grab the mobs, hold the boss, block the big hits.',
    kit: [['taunt', 'Taunt'], ['shield', 'Shield (hold)'], ['charge', 'Charge']] },
  healer: { id: 'healer', name: 'Maren', title: 'Healer', hp: 820, armor: 0.2, speed: 182, r: 16, threat: 1, color: '#E7B53C', sprite: 'healer',
    blurb: 'Tap a frame to heal. Keep everyone standing.',
    kit: [['circle', 'Prayer circle'], ['ward', 'Ward'], ['sunburst', 'Sunburst']] },
  dps: { id: 'dps', name: 'Ivy', title: 'DPS', hp: 720, armor: 0.15, speed: 186, r: 16, threat: 1, color: '#3D7FC1', sprite: 'dps',
    blurb: 'Stand still to cast. Blizzard the packs, Comet the bosses.',
    kit: [['blizzard', 'Blizzard'], ['nova', 'Frost nova'], ['comet', 'Comet']] },
};

export const AB: Record<RoleId, Partial<Record<AbilitySlot, AbilityDef>>> = {
  tank: {
    a1: { key: 'taunt', name: 'Taunt', cd: 8, desc: 'Every mob nearby turns on you.' },
    a2: { key: 'shield', name: 'Shield', cd: 0, hold: true, desc: 'Hold to block hits from the front. Block right before a big hit to stun.' },
    a3: { key: 'charge', name: 'Charge', cd: 10, desc: 'Dash to a mob and stun what is around it.' },
  },
  healer: {
    a1: { key: 'circle', name: 'Prayer circle', cd: 6, mana: 14, aim: true, range: 520, desc: 'Allies standing in it heal fast.' },
    a2: { key: 'ward', name: 'Ward', cd: 5, mana: 10, desc: 'Shield the ally who needs it most.' },
    a3: { key: 'sunburst', name: 'Sunburst', cd: 18, mana: 22, desc: 'Heal everyone and clear nasty effects.' },
  },
  dps: {
    a1: { key: 'blizzard', name: 'Blizzard', cd: 9, aim: true, range: 520, desc: 'Ice storm on the ground. Hits everything in it.' },
    a2: { key: 'nova', name: 'Frost nova', cd: 14, desc: 'Freeze everything close to you.' },
    a3: { key: 'comet', name: 'Comet', cd: 7, cast: 0.9, desc: 'Big hit. Double on frozen targets.' },
  },
};

export const MEND = { heal: 140, mana: 6, gcd: 0.45, range: 560 };
