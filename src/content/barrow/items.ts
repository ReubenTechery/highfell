/** Barrow Crypt's uniques: one set per role and one weapon per role, all at Epic power. */
import type { ItemDef, SetDef } from '../types';

export const BARROW_SETS: SetDef[] = [
  {
    id: 'barrowguard', name: 'Barrowguard', role: 'tank', dungeon: 'barrow',
    look: 'Bone-white plate, skull pauldrons, a coffin-lid shield',
    pieces: ['barrowguard.helm', 'barrowguard.shoulders', 'barrowguard.chest'],
    bonus2: { id: 'barrowguard2', desc: 'Perfect blocks give you a 150 bone shield.' },
    bonus3: { id: 'barrowguard3', desc: 'Slam raises two skeleton thralls for 8 seconds. They fight beside you and soak hits.', ready: false },
  },
  {
    id: 'candlewake', name: 'Candlewake', role: 'healer', dungeon: 'barrow',
    look: 'Black robes, a crown of candles, a lantern',
    pieces: ['candlewake.helm', 'candlewake.shoulders', 'candlewake.chest'],
    bonus2: { id: 'candlewake2', desc: 'Mend leaves a candle that heals 40 more over 4 seconds.' },
    bonus3: { id: 'candlewake3', desc: 'An ally who would die becomes a ghost for 6 seconds instead. Heal them to full to bring them back. Once per ally per fight.', ready: false },
  },
  {
    id: 'rimebone', name: 'Rimebone', role: 'dps', dungeon: 'barrow',
    look: 'A frosted bone crown, icicle shoulders',
    pieces: ['rimebone.helm', 'rimebone.shoulders', 'rimebone.chest'],
    bonus2: { id: 'rimebone2', desc: 'Comet on a frozen mob gives back half its cooldown.' },
    bonus3: { id: 'rimebone3', desc: 'Blizzard rains bone shards. Anything that dies in it rises as a frost skeleton that fights for you for 6 seconds.', ready: false },
  },
];

const piece = (id: string, name: string, role: ItemDef['role'], slot: ItemDef['slot'], setId: string, icon: string, flavor: string): ItemDef =>
  ({ id, name, role, slot, kind: 'set', rar: 3, icon, setId, dungeon: 'barrow', flavor });

export const BARROW_ITEMS: ItemDef[] = [
  piece('barrowguard.helm', 'Barrowguard Helm', 'tank', 'helm', 'barrowguard', 'i_helm', 'The visor is a jaw. It still clacks when you shout.'),
  piece('barrowguard.shoulders', 'Barrowguard Pauldrons', 'tank', 'shoulders', 'barrowguard', 'i_pauldrons', 'Two skulls, one on each shoulder, both judging you.'),
  piece('barrowguard.chest', 'Barrowguard Plate', 'tank', 'chest', 'barrowguard', 'i_plate', 'Ribs on the outside, which feels backwards.'),
  piece('candlewake.helm', 'Candlewake Crown', 'healer', 'helm', 'candlewake', 'i_hood', 'Seven candles. They never burn down and nobody asks why.'),
  piece('candlewake.shoulders', 'Candlewake Mantle', 'healer', 'shoulders', 'candlewake', 'i_mantle', 'Smells like church and a little like smoke.'),
  piece('candlewake.chest', 'Candlewake Robe', 'healer', 'chest', 'candlewake', 'i_robe', 'Black, with wax drips that are definitely on purpose.'),
  piece('rimebone.helm', 'Rimebone Crown', 'dps', 'helm', 'rimebone', 'i_hat', 'Frost grows on it overnight. Bring a towel.'),
  piece('rimebone.shoulders', 'Rimebone Mantle', 'dps', 'shoulders', 'rimebone', 'i_mantle', 'Icicles that never melt and always drip.'),
  piece('rimebone.chest', 'Rimebone Robe', 'dps', 'chest', 'rimebone', 'i_robe', 'Lined with something that used to be a wolf.'),
  { id: 'gravekeeper.tank', name: 'The Gravedigger', role: 'tank', slot: 'weapon', kind: 'unique', rar: 3, icon: 'i_axe', dungeon: 'barrow',
    effect: 'gravedigger', effectDesc: 'Every fifth swing digs in: a burst that stuns nearby mobs for 1 second.', flavor: 'Half axe, half shovel, all argument.' },
  { id: 'gravekeeper.healer', name: 'Lantern of the Long Night', role: 'healer', slot: 'weapon', kind: 'unique', rar: 3, icon: 'i_sunstaff', dungeon: 'barrow',
    effect: 'longnight', effectDesc: 'Mend also wards its target for 60.', flavor: 'The Gravekeeper’s own light. It still knows the way home.' },
  { id: 'gravekeeper.dps', name: 'Gravefrost Staff', role: 'dps', slot: 'weapon', kind: 'unique', rar: 3, icon: 'i_icestaff', dungeon: 'barrow',
    effect: 'gravefrost', effectDesc: 'Comet freezes everything it hits for 2 seconds.', flavor: 'Cold enough to keep the dead where you put them.' },
];
