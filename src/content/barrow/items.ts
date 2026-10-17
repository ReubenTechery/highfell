/** Barrow Crypt's uniques: one set per role and one weapon per role, all at Epic power. The healer's set and weapon
 *  are the ranger's now (the duo rework: what the code calls healer gear), with their log slots. */
import type { ItemDef, SetDef } from '../types';

export const BARROW_SETS: SetDef[] = [
  {
    id: 'barrowguard', name: 'Barrowguard', role: 'tank', dungeon: 'barrow',
    look: 'Bone-white plate, skull pauldrons, a coffin-lid shield',
    pieces: ['barrowguard.helm', 'barrowguard.shoulders', 'barrowguard.chest'],
    bonus2: { id: 'barrowguard2', desc: 'Perfect blocks give you a 150 bone shield.' },
    bonus3: { id: 'barrowguard3', desc: 'Slam raises two skeleton thralls for 8 seconds. They fight beside you and soak hits.', ready: true },
  },
  {
    id: 'candlewake', name: 'Gravewood', role: 'healer', dungeon: 'barrow',
    look: 'A hood of churchyard yew, a candle-stub quiver, crypt-black leathers',
    pieces: ['candlewake.helm', 'candlewake.shoulders', 'candlewake.chest'],
    bonus2: { id: 'gravewood2', desc: 'Longshot leaves a mark on every foe it hits.' },
    bonus3: { id: 'gravewood3', desc: 'Snare raises a skeleton beside your trap that fights for you for 8 seconds.', ready: true },
  },
  {
    id: 'rimebone', name: 'Rimebone', role: 'dps', dungeon: 'barrow',
    look: 'A frosted bone crown, icicle shoulders',
    pieces: ['rimebone.helm', 'rimebone.shoulders', 'rimebone.chest'],
    bonus2: { id: 'rimebone2', desc: 'Comet on a frozen mob or a Chilled boss gives back half its cooldown.' },
    bonus3: { id: 'rimebone3', desc: 'Blizzard rains bone shards and raises frost skeletons that fight for you for 6 seconds.', ready: true },
  },
  {
    id: 'shadeveil', name: 'Shadeveil', role: 'dps', cls: 'rogue', dungeon: 'barrow',
    look: 'A shadow-stitched mask, bone-bladed spaulders, and a silent leather jerkin',
    pieces: ['shadeveil.helm', 'shadeveil.shoulders', 'shadeveil.chest'],
    bonus2: { id: 'shadeveil2', desc: 'Critical hits erupt in shadow: 55 damage from Shadowstrike, 24 from Viper Blades.' },
    bonus3: { id: 'shadeveil3', desc: 'Shadowstep leaves a shadow clone for 6 seconds that slashes your target with twin daggers.', ready: true },
  },
];

const piece = (id: string, name: string, role: ItemDef['role'], slot: ItemDef['slot'], setId: string, icon: string, effect: string, effectDesc: string, flavor: string, cls?: ItemDef['cls']): ItemDef =>
  ({ id, name, role, ...(cls ? { cls } : {}), slot, kind: 'set', rar: 3, icon, setId, dungeon: 'barrow', effect, effectDesc, flavor });

export const BARROW_ITEMS: ItemDef[] = [
  piece('barrowguard.helm', 'Barrowguard Helm', 'tank', 'helm', 'barrowguard', 's_barrowguard_helm',
    'bg_helm', 'Cleave hits 25% harder and heals you for 11 whenever it connects.',
    'The visor is a jaw. It still clacks when you shout.'),
  piece('barrowguard.shoulders', 'Barrowguard Pauldrons', 'tank', 'shoulders', 'barrowguard', 's_barrowguard_shoulders',
    'bg_shoulders', 'Charge slams for 35% more damage and gives you an 80 bone shield.',
    'Two skulls, one on each shoulder, both judging you.'),
  piece('barrowguard.chest', 'Barrowguard Plate', 'tank', 'chest', 'barrowguard', 's_barrowguard_chest',
    'bg_chest', 'Slam hits 35% harder and heals you for 18 per enemy pulled.',
    'Ribs on the outside, which feels backwards.'),
  piece('candlewake.helm', 'Gravewood Hood', 'healer', 'helm', 'candlewake', 's_candlewake_helm',
    'cw_helm', 'Quick Shot hits 25% harder, and its marks last 3 seconds longer.',
    'Cut from the churchyard yew. It still smells of rain on old stone.'),
  piece('candlewake.shoulders', 'Gravewood Mantle', 'healer', 'shoulders', 'candlewake', 's_candlewake_shoulders',
    'cw_shoulders', 'Pin Shot hits 40% harder and marks its foe twice.',
    'Black feathers, bone toggles, and a candle stub nobody lights.'),
  piece('candlewake.chest', 'Gravewood Leathers', 'healer', 'chest', 'candlewake', 's_candlewake_chest',
    'cw_chest', 'Snare holds what it catches a second longer and bites for 50 more.',
    'Oiled crypt leather. It never creaks on the stairs.'),
  piece('rimebone.helm', 'Rimebone Crown', 'dps', 'helm', 'rimebone', 's_rimebone_helm',
    'rb_helm', 'Icicle hits 25% harder and splashes 15 frost damage to a nearby foe.',
    'Frost grows on it overnight. Bring a towel.'),
  piece('rimebone.shoulders', 'Rimebone Mantle', 'dps', 'shoulders', 'rimebone', 's_rimebone_shoulders',
    'rb_shoulders', 'Rime burst hits 40% harder and shaves 1.5s off Comet.',
    'Icicles that never melt and always drip.'),
  piece('rimebone.chest', 'Rimebone Robe', 'dps', 'chest', 'rimebone', 's_rimebone_chest',
    'rb_chest', 'Blizzard ticks 25% harder and lasts 1 second longer.',
    'Lined with something that used to be a wolf.'),
  piece('shadeveil.helm', 'Shadeveil Mask', 'dps', 'helm', 'shadeveil', 's_shadeveil_helm',
    'sv_helm', 'Shadowstrike hits 25% harder and heals you for 25 on a critical hit.',
    'Stitched from crypt velvet. Even your breathing goes quiet.', 'rogue'),
  piece('shadeveil.shoulders', 'Shadeveil Spaulders', 'dps', 'shoulders', 'shadeveil', 's_shadeveil_shoulders',
    'sv_shoulders', 'Shadowstep strikes 35% harder and gives you one more point.',
    'Carved bone blades on the shoulders. Don’t shrug near friends.', 'rogue'),
  piece('shadeveil.chest', 'Shadeveil Jerkin', 'dps', 'chest', 'shadeveil', 's_shadeveil_chest',
    'sv_chest', 'Viper Blades venom ticks 30% harder and lasts 1 second longer.',
    'Oiled leather that drinks the lantern light.', 'rogue'),
  { id: 'gravekeeper.tank', name: 'The Gravedigger', role: 'tank', slot: 'weapon', kind: 'unique', rar: 3, icon: 'u_gravedigger', dungeon: 'barrow',
    effect: 'gravedigger', effectDesc: 'Charge primes two Crushes, and every eighth Cleave digs in with a stunning tremor (a boss staggers).', flavor: 'Half axe, half shovel, all argument.' },
  { id: 'gravekeeper.healer', name: 'Bow of the Long Night', role: 'healer', slot: 'weapon', kind: 'unique', rar: 3, icon: 'u_longnight', dungeon: 'barrow',
    effect: 'longnight', effectDesc: 'Every fourth Quick Shot looses a second arrow at its foe, and Pin Shot leaves two marks.', flavor: 'The Gravekeeper’s own yew. It still knows the way home in the dark.' },
  { id: 'gravekeeper.dps', name: 'Gravefrost Staff', role: 'dps', slot: 'weapon', kind: 'unique', rar: 3, icon: 'u_gravefrost', dungeon: 'barrow',
    effect: 'gravefrost', effectDesc: 'Comet freezes everything it hits for 2 seconds (a boss is Chilled), and Rime burst makes your next two Icicles Shatter and summons a 3s frost storm.', flavor: 'Cold enough to keep the dead where you put them.' },
  { id: 'gravekeeper.rogue', name: 'The Cryptfangs', role: 'dps', cls: 'rogue', slot: 'weapon', kind: 'unique', rar: 3, icon: 'u_cryptfangs', dungeon: 'barrow',
    effect: 'cryptfangs', effectDesc: 'Every fourth twin-dagger slash strikes twice and refreshes Viper Venom, and Shadowstep gives you one more point.', flavor: 'Twin fangs pried from something older than the crypt. Always found as a pair.' },
];
