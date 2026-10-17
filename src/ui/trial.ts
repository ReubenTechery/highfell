/**
 * The Crypt Trial's lessons, for each class: the button each one waits on (the card says how to press it), its
 * picture and its words. The run screen (run.ts) pauses on each one in turn, and only the lesson's own button
 * carries it on. Five lessons a class: its main button, its pull or freeze, a roll out of red, a big hit, and the
 * boss Exposed.
 */
import type { ClassId } from '../content/folk';

/** a lesson of the Crypt Trial: the button it waits on (the card says how to press it), its picture and its words */
export interface TutStep { slot: string; icon: string; step: string; title: string; badge: string; text: string }
export const TUT_BY_CLASS: Record<ClassId, Record<string, TutStep>> = {
  warrior: {
    introAb: { slot: 'a1', icon: 'cleave', step: '1 / 5', title: 'Cleave', badge: 'Your main button', text: 'Sweep the whole pack in front of you.' },
    slam: { slot: 'a3', icon: 'slam', step: '2 / 5', title: 'Slam (Taunt)', badge: 'Ivy has aggro! ➔ Pull pack in', text: 'Yank the mobs back onto you. Your next Cleave Crushes!' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Roll out of his charge!' },
    block: { slot: 'a4', icon: 'shield', step: '4 / 5', title: 'Block Gold Hits', badge: 'Gold cone ➔ Block right before hit', text: 'Parry the heavy swing! A perfect block primes a Crush.' },
    stagger: { slot: 'a2', icon: 'charge', step: '5 / 5', title: 'Boss Exposed!', badge: 'Perfect Block = Stun + +35% DMG!', text: 'Rush in and punish him!' },
  },
  cleric: {
    introAb: { slot: 'a1', icon: 'circle', step: '1 / 5', title: 'Prayer Circle', badge: 'Ground healing zone', text: 'Drop a glowing Prayer Circle under your party!' },
    slam: { slot: 'a4', icon: 'smite', step: '2 / 5', title: 'Smite', badge: 'Your main button: mana back', text: 'Smite on every quiet beat: it hits, heals your most hurt mate and gives mana back.' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Roll out of Sir Rattlebones’s charge!' },
    block: { slot: 'a2', icon: 'ward', step: '4 / 5', title: 'Ward the Tank', badge: 'Heavy boss swing incoming!', text: 'Shield your Tank before the heavy swing lands!' },
    stagger: { slot: 'a3', icon: 'sunburst', step: '5 / 5', title: 'Boss Exposed!', badge: 'Boss staggered (+35% DMG taken)!', text: 'Unleash Sunburst to top up the party and sear the boss!' },
  },
  mage: {
    introAb: { slot: 'a1', icon: 'blizzard', step: '1 / 5', title: 'Blizzard', badge: 'Chilling ice storm', text: 'Call down Blizzard to slow and melt the pack!' },
    slam: { slot: 'a2', icon: 'nova', step: '2 / 5', title: 'Rime Burst (Freeze)', badge: 'Freeze pack ➔ Shatter combo!', text: 'Freeze nearby foes solid so your ice spells Shatter!' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Roll out of Sir Rattlebones’s charge!' },
    block: { slot: 'a4', icon: 'icicle', step: '4 / 5', title: 'Icicle', badge: 'Your main button', text: 'Fire Icicle while the Tank blocks the heavy swing! A crit makes the next one Shatter.' },
    stagger: { slot: 'a3', icon: 'comet', step: '5 / 5', title: 'Boss Exposed!', badge: 'Boss staggered (+35% DMG taken)!', text: 'Drop a massive Comet during the Exposed window!' },
  },
  rogue: {
    introAb: { slot: 'a1', icon: 'viper', step: '1 / 5', title: 'Viper Blades', badge: 'Your main button: venom + a point', text: 'Slash to poison your target and add a point.' },
    slam: { slot: 'a3', icon: 'flurry', step: '2 / 5', title: 'Fan of Blades', badge: 'AoE knives + a point', text: 'Spin Fan of Blades to slice the pack, refresh venom and stop casts!' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Roll out of Sir Rattlebones’s charge!' },
    block: { slot: 'a4', icon: 'shadowstep', step: '4 / 5', title: 'Shadowstep Behind', badge: 'Gold cone ➔ Blink behind boss', text: 'Shadowstep behind him while the Tank parries his swing: two more points!' },
    stagger: { slot: 'a2', icon: 'ambush', step: '5 / 5', title: 'Boss Exposed!', badge: 'Five points + poisoned + Exposed!', text: 'Spend all five on Shadowstrike for a guaranteed massive crit!' },
  },
};
