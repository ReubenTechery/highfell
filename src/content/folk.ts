/**
 * Who you can be: the four folk of the Vale and the six classes, as set out in the Look Book.
 * A hero is one race and one class, fixed when the hero is made. You can have up to six.
 * A combo is makeable once it has in-game art (HERO_ART); the races and classes pass fills the rest.
 */
import type { RoleId } from './types';

export type RaceId = 'dwarf' | 'gnome' | 'elf' | 'human';
export type ClassId = 'warrior' | 'cleric' | 'mage' | 'rogue' | 'ranger' | 'bard';

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
  },
  elf: {
    id: 'elf', name: 'Elf', plural: 'Elves', hometown: 'Moonmere', light: '#8FD6FF', height: 'About 5½ heads tall',
    lore: 'They remember the last time the Frost King woke. They won’t say how it ended, which is never a good sign.',
    look: 'Tall and narrow, long ears, long hair, very calm about everything.',
    trick: { name: 'Old magic', desc: 'Once a raid, add three seconds to one live window for the whole party.' },
    first: ['Ivy', 'Sorrel', 'Ilaris', 'Nyth', 'Caelen', 'Wynreth', 'Aelis', 'Lirien', 'Orrin'],
    family: ['Stillwater', 'Moonmere', 'Hollowbrook', 'Nightfern', 'Mistvale', 'Larkreed'],
  },
  human: {
    id: 'human', name: 'Human', plural: 'Humans', hometown: 'Highfell', light: '#F4B942', height: 'About 5 heads tall',
    lore: 'Everyone ends up in Highfell eventually. It’s the market town at the foot of the hills, and the Last Lantern never closes.',
    look: 'Middle height, any shape, any face. The everyday hero.',
    trick: { name: 'Seen it all', desc: 'Once a raid, for one round, see what another class sees.' },
    first: ['Maren', 'Tomas', 'Edda', 'Corwin', 'Pell', 'Isolde', 'Rook', 'Annis', 'Garret', 'Wynna'],
    family: ['Brightwell', 'Thatcher', 'Fairweather', 'Lanternby', 'Holloway', 'Ashby', 'Millward', 'Crane'],
  },
};
export const RACE_ORDER: RaceId[] = ['dwarf', 'gnome', 'elf', 'human'];

export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: { id: 'warrior', name: 'Warrior', role: 'tank', roleName: 'Tank', ready: true,
    blurb: 'Holds the boss’s attention, mostly by insulting it. Blocks the big hits and swings at everything else.' },
  cleric: { id: 'cleric', name: 'Cleric', role: 'healer', roleName: 'Healer', ready: true,
    blurb: 'Sees everyone’s health and has opinions about all of it. Keeps the party standing.' },
  mage: { id: 'mage', name: 'Mage', role: 'dps', roleName: 'DPS', ready: true,
    blurb: 'Hits the hardest and freezes the rest. Stands still to cast and would like everyone to stop shouting.' },
  rogue: { id: 'rogue', name: 'Rogue', role: 'dps', roleName: 'DPS', ready: false,
    blurb: 'The only one who can interrupt a spell, and the first to the chest.' },
  ranger: { id: 'ranger', name: 'Ranger', role: 'dps', roleName: 'DPS', ready: false,
    blurb: 'Sees the boss’s next two moves and calls them out loud, usually a second too late.' },
  bard: { id: 'bard', name: 'Bard', role: 'healer', roleName: 'Support', ready: false,
    blurb: 'Counts the party in for the Battle Hymn. Has a song about every raid, including the ones he missed.' },
};
export const CLASS_ORDER: ClassId[] = ['warrior', 'cleric', 'mage', 'rogue', 'ranger', 'bard'];

/** Which race and class combos have in-game art, and the sprite set that draws them. */
export const HERO_ART: Partial<Record<`${RaceId}.${ClassId}`, string>> = {
  'dwarf.warrior': 'tank',
  'human.cleric': 'healer',
  'elf.mage': 'dps',
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
