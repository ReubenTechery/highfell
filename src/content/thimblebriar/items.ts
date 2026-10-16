/** Thimblebriar Hollow's uniques: a set per class and the Tinker King's four weapons, at Tier 2 (item level 34).
 *  Each piece makes one button better; two and three pieces are the gnomes' gadgets, built round the bombs. */
import type { ItemDef, SetDef } from '../types';

export const THIMBLEBRIAR_SETS: SetDef[] = [
  {
    id: 'clockguard', name: 'Clockguard', role: 'tank', dungeon: 'thimblebriar', tier: 2,
    look: 'Riveted brass plate, spring-coiled pauldrons, a ticking bulwark',
    pieces: ['clockguard.helm', 'clockguard.shoulders', 'clockguard.chest'],
    bonus2: { id: 'clockguard2', desc: 'A perfect block winds your spring: a 150 brass shield.' },
    bonus3: { id: 'clockguard3', desc: 'Your perfect block drops a lit bomb of yours at the attacker’s feet.', ready: true },
  },
  {
    id: 'sporebloom', name: 'Sporebloom', role: 'healer', dungeon: 'thimblebriar', tier: 2,
    look: 'A glowing toadstool cap, an amber root mantle, a fairy-lantern censer',
    pieces: ['sporebloom.helm', 'sporebloom.shoulders', 'sporebloom.chest'],
    bonus2: { id: 'sporebloom2', desc: 'Mend plants a glowing spore that heals 45 more over 4 seconds.' },
    bonus3: { id: 'sporebloom3', desc: 'Ward leaves a little patch-up turret for 6 seconds that heals the most hurt mate near it.', ready: true },
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
    bonus2: { id: 'gearshade2', desc: 'Critical hits with Shadowstrike or Viper Blades throw a 55 spark.' },
    bonus3: { id: 'gearshade3', desc: 'Viper Blades stick a little bomb on the target, and Shadowstrike sets it off.', ready: true },
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
  piece('sporebloom.helm', 'Sporebloom Cap', 'healer', 'cleric', 'helm', 'sporebloom', 's_sporebloom_helm',
    'sb_helm', 'Mend heals 15% more and costs 2 less mana.',
    'It glows in the dark, which is handy, and a little bit at breakfast, which is not.'),
  piece('sporebloom.shoulders', 'Sporebloom Mantle', 'healer', 'cleric', 'shoulders', 'sporebloom', 's_sporebloom_shoulders',
    'sb_shoulders', 'Ward shields 30% more and lasts 2 seconds longer.',
    'Amber roots, still growing. Water it on Sundays.'),
  piece('sporebloom.chest', 'Sporebloom Robe', 'healer', 'cleric', 'chest', 'sporebloom', 's_sporebloom_chest',
    'sb_chest', 'Prayer circle heals 25% more and lasts a second longer.',
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
  { id: 'tinker.healer', name: 'The Sporelight Censer', role: 'healer', slot: 'weapon', kind: 'unique', rar: 3, tier: 2, icon: 'u_sporelight', dungeon: 'thimblebriar',
    effect: 'sporelight', effectDesc: 'Mend’s spore bursts to heal everyone near it, and Sunburst sends the bombs near you flying.', flavor: 'A mushroom-cap censer with a lamp inside. It smells like rain.' },
  { id: 'tinker.dps', name: 'The Arcwright’s Coil', role: 'dps', slot: 'weapon', kind: 'unique', rar: 3, tier: 2, icon: 'u_arcwright', dungeon: 'thimblebriar',
    effect: 'arcwright', effectDesc: 'Icicle chains to 2 more foes, and an Icicle into a frozen foe bounces twice.', flavor: 'A staff wound with copper coil. Your hair stands up when you hold it.' },
  { id: 'tinker.rogue', name: 'The Fusecutters', role: 'dps', cls: 'rogue', slot: 'weapon', kind: 'unique', rar: 3, tier: 2, icon: 'u_fusecutters', dungeon: 'thimblebriar',
    effect: 'fusecutters', effectDesc: 'Shadowstep leaves a lit bomb of yours where you were.', flavor: 'Twin daggers with fuse cord on the hilts. Always lit, never burning down.' },
];
