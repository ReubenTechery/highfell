/** Thimblebriar Hollow's uniques: a set per class and the Tinker King's four weapons, at Tier 2 (item level 34).
 *  Each piece makes one button better; two and three pieces are the gnomes' gadgets, built round the bombs. */
import type { ItemDef, SetDef } from '../types';

export const THIMBLEBRIAR_SETS: SetDef[] = [
  {
    id: 'clockguard', name: 'Clockguard', role: 'tank', dungeon: 'thimblebriar', tier: 2,
    look: 'Riveted brass plate, spring-coiled pauldrons, a ticking bulwark',
    pieces: ['clockguard.helm', 'clockguard.shoulders', 'clockguard.chest'],
    bonus2: { id: 'clockguard2', desc: 'A perfect block, or a Slam that pulls three or more, winds your spring: a 150 brass shield.' },
    bonus3: { id: 'clockguard3', desc: 'Your perfect blocks and your Slams drop a lit bomb of yours at the foes’ feet.', ready: true },
  },
  {
    id: 'sporebloom', name: 'Thistledown', role: 'healer', dungeon: 'thimblebriar', tier: 2,
    look: 'A glowcap hood, a spring-wound quiver, moss-green leathers with a lantern at the hip',
    pieces: ['sporebloom.helm', 'sporebloom.shoulders', 'sporebloom.chest'],
    bonus2: { id: 'thistledown2', desc: 'Snare drops a lit bomb of yours in the trap when it springs.' },
    bonus3: { id: 'thistledown3', desc: 'Longshot carries a little bomb that blows where it lands.', ready: true },
  },
  {
    id: 'arcspark', name: 'Arcspark', role: 'dps', dungeon: 'thimblebriar', tier: 2,
    look: 'A copper filament crown, coil shoulders, star-threaded robes',
    pieces: ['arcspark.helm', 'arcspark.shoulders', 'arcspark.chest'],
    bonus2: { id: 'arcspark2', desc: 'Comet on a frozen foe or a Chilled boss arcs to 2 more foes (or back into it, if it is alone).' },
    bonus3: { id: 'arcspark3', desc: 'Comet splits into four small frost bombs that blow a moment later.', ready: true },
  },
  {
    id: 'gearshade', name: 'Gearshade', role: 'dps', cls: 'rogue', dungeon: 'thimblebriar', tier: 2,
    look: 'A clockwork lens visor, spring-blade spaulders, a velvet burrower’s coat',
    pieces: ['gearshade.helm', 'gearshade.shoulders', 'gearshade.chest'],
    bonus2: { id: 'gearshade2', desc: 'Critical hits throw a spark: 55 from Shadowstrike, 24 from Viper Blades.' },
    bonus3: { id: 'gearshade3', desc: 'Viper Blades stick a little bomb on every foe they cut, and Shadowstrike sets them all off.', ready: true },
  },
];

// only the rogue's pieces name a class: the other seats have one class each
const piece = (id: string, name: string, role: ItemDef['role'], cls: ItemDef['cls'], slot: ItemDef['slot'], setId: string, icon: string, effect: string, effectDesc: string, flavor: string): ItemDef =>
  ({ id, name, role, ...(cls === 'rogue' ? { cls } : {}), slot, kind: 'set', rar: 3, tier: 2, icon, setId, dungeon: 'thimblebriar', effect, effectDesc, flavor });

export const THIMBLEBRIAR_ITEMS: ItemDef[] = [
  piece('clockguard.helm', 'Clockguard Greathelm', 'tank', 'warrior', 'helm', 'clockguard', 's_clockguard_helm',
    'cg_helm', 'Cleave hits 25% harder, and a bomb it knocks blows 50% harder.',
    'There is a clock in the visor. Nobody has ever wound it, and it keeps perfect time.'),
  piece('clockguard.shoulders', 'Clockguard Pauldrons', 'tank', 'warrior', 'shoulders', 'clockguard', 's_clockguard_shoulders',
    'cg_shoulders', 'Charge hits 35% harder and gives you a 90 brass shield.',
    'Two springs, wound tight. Shrug carefully.'),
  piece('clockguard.chest', 'Clockguard Breastplate', 'tank', 'warrior', 'chest', 'clockguard', 's_clockguard_chest',
    'cg_chest', 'Slam hits 35% harder and heals you for 20 for each foe it pulls.',
    'Riveted by a gnome on a ladder. Every rivet is signed.'),
  piece('sporebloom.helm', 'Thistledown Cap', 'healer', 'cleric', 'helm', 'sporebloom', 's_sporebloom_helm',
    'sb_helm', 'Quick Shot hits 25% harder and slows what it hits.',
    'It glows in the dark, which is handy, and a little bit at breakfast, which is not.'),
  piece('sporebloom.shoulders', 'Thistledown Mantle', 'healer', 'cleric', 'shoulders', 'sporebloom', 's_sporebloom_shoulders',
    'sb_shoulders', 'Pin Shot hits 40% harder, and the foe it Exposes stays Exposed a second longer.',
    'Amber roots and thistle fletching, still growing. Water it on Sundays.'),
  piece('sporebloom.chest', 'Thistledown Coat', 'healer', 'cleric', 'chest', 'sporebloom', 's_sporebloom_chest',
    'sb_chest', 'Snare is a third wider and waits 4 seconds longer for something to walk in.',
    'Moss-green, with a lantern on a hook at the hip.'),
  piece('arcspark.helm', 'Arcspark Crown', 'dps', 'mage', 'helm', 'arcspark', 's_arcspark_helm',
    'as_helm', 'Icicle hits 25% harder and slows what it hits.',
    'Copper filaments that hum a little before a storm.'),
  piece('arcspark.shoulders', 'Arcspark Coils', 'dps', 'mage', 'shoulders', 'arcspark', 's_arcspark_shoulders',
    'as_shoulders', 'Rime burst hits 40% harder and its freeze lasts a second longer.',
    'Don’t touch both at once.'),
  piece('arcspark.chest', 'Arcspark Robe', 'dps', 'mage', 'chest', 'arcspark', 's_arcspark_chest',
    'as_chest', 'Comet hits 20% harder.',
    'Stars stitched in silver thread. Some of them are real.'),
  piece('gearshade.helm', 'Gearshade Visor', 'dps', 'rogue', 'helm', 'gearshade', 's_gearshade_helm',
    'gs_helm', 'Shadowstrike hits 25% harder.',
    'Three lenses, one for each kind of dark.'),
  piece('gearshade.shoulders', 'Gearshade Spaulders', 'dps', 'rogue', 'shoulders', 'gearshade', 's_gearshade_shoulders',
    'gs_shoulders', 'Fan of Blades reaches 25% wider and hits 25% harder.',
    'Spring blades, folded. Mostly folded.'),
  piece('gearshade.chest', 'Gearshade Coat', 'dps', 'rogue', 'chest', 'gearshade', 's_gearshade_chest',
    'gs_chest', 'Viper Venom ticks 30% harder.',
    'Velvet, for burrows. Forty pockets, thirty-nine of them empty.'),
  { id: 'tinker.tank', name: 'The Mainspring Maul', role: 'tank', slot: 'weapon', kind: 'unique', rar: 3, tier: 2, icon: 'u_mainspring', dungeon: 'thimblebriar',
    effect: 'mainspring', effectDesc: 'Charge winds the spring: your next Cleave hits twice.', flavor: 'A brass hammer with a wind-up key. Four turns is plenty.' },
  { id: 'tinker.healer', name: 'The Cogspring Bow', role: 'healer', slot: 'weapon', kind: 'unique', rar: 3, tier: 2, icon: 'u_sporelight', dungeon: 'thimblebriar',
    effect: 'cogspring', effectDesc: 'Pin Shot sticks a lit bomb of yours on its foe, and it blows a moment later.', flavor: 'Brass limbs and a wind-up key. It hums when it’s ready to loose.' },
  { id: 'tinker.dps', name: 'The Arcwright’s Coil', role: 'dps', slot: 'weapon', kind: 'unique', rar: 3, tier: 2, icon: 'u_arcwright', dungeon: 'thimblebriar',
    effect: 'arcwright', effectDesc: 'Icicle chains to 2 more foes, and an Icicle into a frozen foe bounces twice.', flavor: 'A staff wound with copper coil. Your hair stands up when you hold it.' },
  { id: 'tinker.rogue', name: 'The Fusecutters', role: 'dps', cls: 'rogue', slot: 'weapon', kind: 'unique', rar: 3, tier: 2, icon: 'u_fusecutters', dungeon: 'thimblebriar',
    effect: 'fusecutters', effectDesc: 'Shadowstep leaves a lit bomb of yours where you were.', flavor: 'Twin daggers with fuse cord on the hilts. Always lit, never burning down.' },
];
