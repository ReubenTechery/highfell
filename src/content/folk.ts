/**
 * Who you can be. Dwarves, elves and humans from the start; gnomes, goblins, the Risen (undead) and orcs
 * are earned, each in its own dungeon: finishing that dungeon's collection log opens them (the
 * achievement that gives a race says so in its reward), so the Risen come from the Barrow and the others
 * with dungeons to come. Four classes: warrior, cleric, mage and rogue. A hero is one race and one class,
 * fixed when the hero is made. You can have up to six. A combo is makeable once it has in-game art
 * (HERO_ART); the races and classes pass fills the rest.
 */
import type { RoleId } from './types';

export type RaceId = 'dwarf' | 'elf' | 'human' | 'gnome' | 'goblin' | 'risen' | 'orc';
export type ClassId = 'warrior' | 'cleric' | 'mage' | 'rogue';

export interface RaceDef {
  id: RaceId;
  name: string;
  plural: string;
  hometown: string;
  /** the hometown's light: the glow behind your hero */
  light: string;
  height: string;
  lore: string;
  look: string;
  trick: { name: string; desc: string };
  first: string[];
  family: string[];
  /** earned in its own dungeon: locked until an achievement (that dungeon's whole log) gives it */
  earned?: boolean;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  role: RoleId;
  /** what the seat is called on the hero card */
  roleName: string;
  blurb: string;
  /** has a kit in the game today */
  ready: boolean;
}

export const RACES: Record<RaceId, RaceDef> = {
  dwarf: {
    id: 'dwarf', name: 'Dwarf', plural: 'Dwarves', hometown: 'Emberdeep', light: '#FF8A4C', height: 'About 3 heads tall',
    lore: 'They dug too deep once and woke the cold. Emberdeep’s forges have burned day and night ever since, just in case.',
    look: 'Wide as a door. Big beard, bigger hands, short legs, no neck.',
    trick: { name: 'Stubborn', desc: 'Once a raid, stay standing through one hit that should have knocked you out.' },
    first: ['Brannoc', 'Hollis', 'Gruna', 'Thalbrek', 'Dunna', 'Orvik', 'Bera', 'Kettil', 'Morra', 'Haldric'],
    family: ['Ashvale', 'Coalbeard', 'Emberhand', 'Deepforge', 'Stonepint', 'Anvilsong', 'Soothammer', 'Brassbelly'],
  },
  gnome: {
    id: 'gnome', name: 'Gnome', plural: 'Gnomes', hometown: 'Bramblewick', light: '#9BD068', height: 'About 2½ heads tall',
    lore: 'Inventors who live inside hollow hills. Half their inventions work; the other half are on fire, which they’d argue is also working.',
    look: 'Tiny body, huge head, ears like sails, nose like a turnip.',
    trick: { name: 'Pocket gadget', desc: 'Once a raid, reroll one action that failed.' },
    first: ['Wren', 'Pip', 'Tibbet', 'Fennick', 'Dottle', 'Quill', 'Nib', 'Bramble'],
    family: ['Copperkettle', 'Sparkwhistle', 'Gearpatch', 'Tinkerwick', 'Burrowfield', 'Thimblesprocket'],
    earned: true,
  },
  goblin: {
    id: 'goblin', name: 'Goblin', plural: 'Goblins', hometown: 'The Rattlecoin Warrens', light: '#B5D640', height: 'About 2 heads tall',
    lore: 'Small, green, loud and always selling something. Most of it used to be yours, and they will sell it back at a very fair price.',
    look: 'Knee-high, all ears and teeth, pockets on the pockets.',
    trick: { name: 'Finders keepers', desc: 'Once a raid, pick up something nobody else saw.' },
    first: ['Snik', 'Grubb', 'Pazz', 'Nettle', 'Rikka', 'Fizzwick', 'Dob', 'Mott'],
    family: ['Coinbiter', 'Ratchetgrin', 'Mudpocket', 'Sparkfinger', 'Junkwhistle', 'Tinbuckle'],
    earned: true,
  },
  elf: {
    id: 'elf', name: 'Elf', plural: 'Elves', hometown: 'Moonmere', light: '#8FD6FF', height: 'About 4 heads tall',
    lore: 'They remember the last time the Frost King woke. They won’t say how it ended, which is never a good sign.',
    look: 'Tall and narrow, long ears, long hair, very calm about everything.',
    trick: { name: 'Old magic', desc: 'Once a raid, add three seconds to one live window for the whole party.' },
    first: ['Ivy', 'Sorrel', 'Ilaris', 'Nyth', 'Caelen', 'Wynreth', 'Aelis', 'Lirien', 'Orrin'],
    family: ['Stillwater', 'Moonmere', 'Hollowbrook', 'Nightfern', 'Mistvale', 'Larkreed'],
  },
  human: {
    id: 'human', name: 'Human', plural: 'Humans', hometown: 'Highfell', light: '#F4B942', height: 'About 4 heads tall',
    lore: 'Everyone ends up in Highfell eventually. It’s the market town at the foot of the hills, and the Last Lantern never closes.',
    look: 'Middle height, any shape, any face. The everyday hero.',
    trick: { name: 'Seen it all', desc: 'Once a raid, for one round, see what another class sees.' },
    first: ['Maren', 'Tomas', 'Edda', 'Corwin', 'Pell', 'Isolde', 'Rook', 'Annis', 'Garret', 'Wynna'],
    family: ['Brightwell', 'Thatcher', 'Fairweather', 'Lanternby', 'Holloway', 'Ashby', 'Millward', 'Crane'],
  },
  risen: {
    id: 'risen', name: 'Risen', plural: 'Risen', hometown: 'The Barrow', light: '#9BE15D', height: 'As tall as they ever were',
    lore: 'Heroes who went down into the Barrow and didn’t come back up. Then, one night, they did. They’re on your side now, and they’d like their old room back.',
    look: 'Bones in their old armour, a skull under the helm, two green lights for eyes.',
    trick: { name: 'Not again', desc: 'Once a raid, get back up for six seconds after you go down.' },
    first: ['Morrow', 'Sable', 'Grisel', 'Hollin', 'Wick', 'Vesper', 'Rattick', 'Dusk', 'Tallow', 'Brine'],
    family: ['Gravesend', 'Coffinwood', 'Barrowmoor', 'Dustmantle', 'Stillheart', 'Lanternless', 'Ashgrave', 'Bonewright'],
    earned: true,
  },
  orc: {
    id: 'orc', name: 'Orc', plural: 'Orcs', hometown: 'Thunderhorn Hold', light: '#D9603A', height: 'About 5 heads tall, mostly shoulders',
    lore: 'Built like a castle wall and twice as stubborn. In the Hold they count a friend by the fights you have been in together.',
    look: 'Huge shoulders, little tusks, a jaw like an anvil. Very gentle with small animals.',
    trick: { name: 'War cry', desc: 'Once a raid, shout the party back to their feet for a moment.' },
    first: ['Grokka', 'Thar', 'Uzra', 'Brakk', 'Morga', 'Durn', 'Hasha', 'Korl'],
    family: ['Ironhorn', 'Stonejaw', 'Redhand', 'Thunderhide', 'Skullsplit', 'Ashbrow'],
    earned: true,
  },
};
/** the folk in the hero maker's order: the three from the start, then the ones you earn */
export const RACE_ORDER: RaceId[] = ['dwarf', 'elf', 'human', 'gnome', 'goblin', 'risen', 'orc'];

export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: { id: 'warrior', name: 'Warrior', role: 'tank', roleName: 'Tank', ready: true,
    blurb: 'Holds the boss’s attention, mostly by insulting it. Blocks the big hits and swings at everything else.' },
  cleric: { id: 'cleric', name: 'Cleric', role: 'healer', roleName: 'Healer', ready: true,
    blurb: 'Sees everyone’s health and has opinions about all of it. Keeps the party standing.' },
  mage: { id: 'mage', name: 'Mage', role: 'dps', roleName: 'DPS', ready: true,
    blurb: 'Hits the hardest and freezes the rest. Stands still to cast and would like everyone to stop shouting.' },
  rogue: { id: 'rogue', name: 'Rogue', role: 'dps', roleName: 'DPS', ready: false,
    blurb: 'The only one who can interrupt a spell, and the first to the chest.' },
};
export const CLASS_ORDER: ClassId[] = ['warrior', 'cleric', 'mage', 'rogue'];

/** Which race and class combos have in-game art, and the sprite set that draws them. */
export const HERO_ART: Partial<Record<`${RaceId}.${ClassId}`, string>> = {
  'dwarf.warrior': 'tank',
  'human.cleric': 'healer',
  'elf.mage': 'dps',
  'risen.warrior': 'risen_tank',
  'risen.cleric': 'risen_healer',
  'risen.mage': 'risen_dps',
};
export const heroArt = (race: string, cls: string): string | null => HERO_ART[`${race}.${cls}` as `${RaceId}.${ClassId}`] || null;
/** A hero can be made from a combo with a kit and art. */
export const canMake = (race: string, cls: string): boolean => !!heroArt(race, cls) && !!CLASSES[cls as ClassId]?.ready;

export const MAX_HEROES = 6;

/** The founding six from the Look Book: the reference cast, and who fills the bot seats. */
export const FOUNDERS: Record<RoleId, { name: string; race: RaceId; cls: ClassId }> = {
  tank: { name: 'Brannoc Ashvale', race: 'dwarf', cls: 'warrior' },
  healer: { name: 'Sister Maren', race: 'human', cls: 'cleric' },
  dps: { name: 'Ivy', race: 'elf', cls: 'mage' },
};

/** A name a person typed: letters, spaces, apostrophes and hyphens, 2 to 24 long. */
export function cleanName(raw: string): string | null {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > 24) return null;
  if (!/^[\p{L}][\p{L}' -]*$/u.test(s)) return null;
  return s;
}
