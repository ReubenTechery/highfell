/**
 * Act 1, the dungeons in the order you meet them: the ones built (in DUNGEONS) and the ones still coming. The
 * Dungeons sheet steps through them and lists them, and the house's cellar has a door for each.
 */

/** Act 1, shown as Season 0: three dungeons, each harder than the last and asking a higher level, all dropping gear
 *  of the same Power (26 a set piece, 30 a boss weapon). When a dungeon is registered in DUNGEONS, it uses its live
 *  content & engine; otherwise it displays its Act 1 preview card. */
export interface Act1DungeonMeta {
  id: string;
  /** a dungeon still being built: the season it comes in (a built one's is on its DungeonInfo) */
  season?: number;
  tier: 1 | 2 | 3;
  roman: string;
  name: string;
  blurb: string;
  recIlvl: number;
  /** the level it recommends coming in at */
  recLevel: number;
  dropsIlvl: number;
  prizeName: string;
  prizeDesc: string;
  prizeIcon: string;
  lookName: string;
  titleText: string;
  bossNames: [string, string];
  themeLight: string;
  themeBg: string;
}

export const ACT1_DUNGEONS: Act1DungeonMeta[] = [
  {
    id: 'barrow',
    tier: 1,
    roman: 'I',
    name: 'Barrow Crypt',
    blurb: 'A drowned hill-tomb of restless bone and lantern-fire beneath the mist.',
    recIlvl: 10,
    recLevel: 1,
    dropsIlvl: 30,
    prizeName: 'The Risen',
    prizeDesc: 'A new kind of hero',
    prizeIcon: 'c_risen',
    lookName: 'Barrow Hall',
    titleText: 'the Gravewarden',
    bossNames: ['Sir Rattlebones', 'The Gravekeeper'],
    themeLight: '#9BE15D',
    themeBg: '#241C33',
  },
  {
    id: 'thimblebriar',
    tier: 2,
    roman: 'II',
    name: 'Thimblebriar Hollow',
    blurb: 'A gnome burrow of mushrooms and brass, where the inventions went wrong.',
    recIlvl: 22,
    recLevel: 15,
    dropsIlvl: 30,
    prizeName: 'The Gnomes',
    prizeDesc: 'A new kind of hero',
    prizeIcon: 'c_gnome',
    lookName: 'Toadstool Workshop',
    titleText: 'the Clockwork Knight',
    bossNames: ['Old Toadstool', 'The Tinker King'],
    themeLight: '#FF9F43',
    themeBg: '#1A110B',
  },
  {
    id: 'moonmere',
    season: 0,
    tier: 3,
    roman: 'III',
    name: 'Moonmere Sanctum',
    blurb: 'A silver-lit woodland lake shrine where starlight weavers guard the sunken weirwood.',
    recIlvl: 26,
    recLevel: 30,
    dropsIlvl: 30,
    prizeName: 'Starlight Conservatory',
    prizeDesc: 'A moonlit sanctum look & astral mount for your house',
    prizeIcon: 'c_elf',
    lookName: 'Moonmere Hall',
    titleText: 'the Star-Warden',
    bossNames: ['Thorn-Matron Lyris', 'Archon Vaelen'],
    themeLight: '#6CD4FF',
    themeBg: '#182436',
  },
];
