/** The three seats in every party, and what each one can press. Four buttons each, plus the swipe dodge. */
import type { AbilityDef, AbilitySlot, RoleDef, RoleId, TalentRankDef } from './types';

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
    a1: { key: 'slam', name: 'Slam', cd: 6, desc: 'Hit everything around you. It all turns on you and gets dragged in.', combo: '① Slam clumped pack ➔ ② Cleave crushes for +25%' },
    a2: { key: 'shield', name: 'Shield', cd: 0, hold: true, desc: 'Hold to block from the front. Block right before a big hit to stun it and hit back.', combo: '① Perfect block stuns ➔ ② Cleave crushes for +25%' },
    a3: { key: 'charge', name: 'Charge', cd: 7, desc: 'Dash to a mob and smash it. It turns on you, and what is around it is stunned.', combo: '① Charge stuns pack ➔ ② Cleave crushes for +25%' },
    a4: { key: 'cleave', name: 'Cleave', cd: 3.5, desc: 'A big swing through everything in front of you. +25% damage on stunned or 3+ clumped foes.', combo: '② Finisher: +25% Crush damage on stunned or clumped foes' },
  },
  healer: {
    a1: { key: 'circle', name: 'Prayer circle', cd: 5, mana: 14, aim: true, range: 520, desc: 'Allies standing in it heal fast.', combo: '① Drop Circle ➔ ② Smite pulses bonus healing inside it' },
    a2: { key: 'ward', name: 'Ward', cd: 4, mana: 10, desc: 'Shield the ally who needs it most.', combo: '① Pre-shield tank before big boss swings' },
    a3: { key: 'sunburst', name: 'Sunburst', cd: 14, mana: 22, desc: 'Heal everyone and clear nasty effects.', combo: '② Emergency: full-party heal + cleanses roots & curses' },
    a4: { key: 'smite', name: 'Smite', cd: 2.5, desc: 'Throw light at the tank’s target. Heals your most hurt ally, restores mana, and pulses active Prayer circles.', combo: '② Payoff: restores mana + pulses active Prayer circle' },
  },
  dps: {
    a1: { key: 'blizzard', name: 'Blizzard', cd: 7.5, aim: true, range: 520, desc: 'Ice storm on the ground. Hits and slows everything in it.', combo: '① Slow pack in Blizzard ➔ ② Rime burst to freeze all' },
    a2: { key: 'nova', name: 'Rime burst', cd: 11, desc: 'Freeze everything close to you and stop casts.', combo: '① Freeze foes ➔ ② Icicle (3×) or Comet (2×) Shatter!' },
    a3: { key: 'comet', name: 'Comet', cd: 5.5, cast: 0.9, desc: 'Big hit with splash damage. Double damage on frozen targets.', combo: '② Finisher: 2× Shatter damage on frozen targets' },
    a4: { key: 'icicle', name: 'Icicle', cd: 2.5, desc: 'Instant ice shard. Triple damage on frozen targets.', combo: '② Finisher: 3× Shatter damage on frozen targets' },
  },
};

/** Skill Tree Lite: two upgrade ranks per ability (8 talent points total from Level 1 to Level 9).
 *  Each point upgrades how one of your 4 buttons works and adds +1.5% Hero Mastery power. */
export const TALENTS: Record<RoleId, Record<AbilitySlot, [TalentRankDef, TalentRankDef]>> = {
  tank: {
    a1: [
      { name: 'Thunderclap', desc: '+25% Slam damage and +20% pull radius.' },
      { name: 'Iron Grip', desc: '−1.0s Slam cooldown and +50% threat.' },
    ],
    a2: [
      { name: 'Spiked Buckler', desc: '+30% Perfect Block counter damage.' },
      { name: 'Bulwark', desc: 'Perfect Block grants a 90 HP absorb shield.' },
    ],
    a3: [
      { name: 'Battering Ram', desc: '+25% Charge impact damage.' },
      { name: 'Relentless', desc: '−1.2s Charge cooldown and +0.4s stun.' },
    ],
    a4: [
      { name: 'Heavy Edge', desc: '+20% Cleave base damage.' },
      { name: 'Executioner', desc: '+35% Crush damage on stunned or clumped foes.' },
    ],
  },
  healer: {
    a1: [
      { name: 'Sanctuary', desc: '+20% Prayer circle healing and +15% radius.' },
      { name: 'Lingering Grace', desc: '+1.5s Circle duration and −2 mana cost.' },
    ],
    a2: [
      { name: 'Aegis', desc: '+25% Ward shield strength.' },
      { name: 'Swift Ward', desc: '−0.8s Ward cooldown.' },
    ],
    a3: [
      { name: 'Dawnlight', desc: '+25% Sunburst party healing.' },
      { name: 'Solar Renewal', desc: '−2.5s Sunburst cooldown.' },
    ],
    a4: [
      { name: 'Searing Light', desc: '+25% Smite damage and smart-heal.' },
      { name: 'Radiant Surge', desc: '+2 extra mana restored and +50% Circle pulse.' },
    ],
  },
  dps: {
    a1: [
      { name: 'Permafrost', desc: '+20% Blizzard damage and +15% radius.' },
      { name: 'Bitter Gale', desc: '−1.0s Blizzard cooldown and +1.0s duration.' },
    ],
    a2: [
      { name: 'Flash Freeze', desc: '+30% Rime burst damage and +0.5s freeze.' },
      { name: 'Cold Snap', desc: '−2.0s Rime burst cooldown.' },
    ],
    a3: [
      { name: 'Falling Star', desc: '+20% Comet and splash damage.' },
      { name: 'Cataclysm', desc: '−0.8s Comet cooldown and +10% crit chance.' },
    ],
    a4: [
      { name: 'Razor Ice', desc: '+20% Icicle damage.' },
      { name: 'Heartpiercer', desc: '−0.4s Icicle cooldown and +15% Shatter crit.' },
    ],
  },
};

export const MEND = { heal: 140, mana: 6, gcd: 0.45, range: 560 };
