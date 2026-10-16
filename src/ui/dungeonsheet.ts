/**
 * The Dungeons sheet, opened by the big Dungeons button or the Barrow door. The dungeon's picture with
 * its Normal / Heroic switch (Heroic opens after ten clears and plays harder: the same drops, plus gilding
 * kits), and right under it one small line for that version's collection log: how full it is, with what finishing it gives
 * at the end of the bar (the Barrow's: a new kind of hero, the Risen). It opens to show those rewards and
 * what each role can get (what you have lit up, every drop rate; tap one to hold it up against what you
 * wear). Then the main thing: your role, your hero (picking a role picks the hero of that role you played
 * last; change to another or make one) and your brew, then loot or practice. On Normal your own Warband
 * heroes from your bunk room fill the other seats in their own gear (or bots stand in until you make them);
 * Heroic needs at least two players (party.ts), so for now it opens only for practice.
 */
import { COLLECTIBLES, DUNGEONS, DUNGEON_ENGINES, TITLES, heroicVersion } from '../content';
import { KIT_RATE } from '../content/kits';
import { MAX_HEROES, RACES, type RaceId } from '../content/folk';
import { LOOKS } from '../content/house';
import { ORDER, ROLES } from '../content/roles';
import type { AchievementDef, DropDef, DungeonInfo, RoleId } from '../content/types';
import { RECIPES, RECIPE_ORDER } from '../content/vale';
import { loadoutFor } from '../meta/gear';
import { HEROIC_AFTER, heroicOpen, heroicProgress, lootFor } from '../meta/loot';
import { logAchievement, logProgress } from '../meta/logs';
import { groupOf, heroesFor, partyProblem, seats } from '../meta/party';
import { activeHero, roleOf, type Profile } from '../meta/profile';
import { esc, fmtRate, fmtT, GLYPH } from './dom';
import { colourOf, heroImg, heroSprite, iconOf, nameOf, placeSprite, tile } from './art';
import { ilvl } from './hearth';
import { SWATCH } from './lookssheet';

/** what the sheet remembers while the page is open: the run's options, the role you're looking at,
 *  whether the list of your other heroes and the log are open, Normal or Heroic, and which dungeon is selected */
export interface DungeonPick {
  dungeon?: string;
  mode: 'loot' | 'practice';
  start: string;
  gear: 'mine' | 2 | 3;
  role: RoleId | null;
  alts: boolean;
  log: boolean;
  heroic: boolean;
}

/** Act 1 stepped dungeon progression ladder (Tier I -> II -> III: ilvl 26 -> 34 -> 42).
 *  When a dungeon is registered in DUNGEONS, it uses its live content & engine; otherwise it displays its Act 1 preview card. */
export interface Act1DungeonMeta {
  id: string;
  tier: 1 | 2 | 3;
  roman: string;
  name: string;
  blurb: string;
  recIlvl: number;
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
    dropsIlvl: 26,
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
    blurb: 'An overgrown fairytale bramble-burrow of clockwork needles, spore-caps, and Briar-King Bramble.',
    recIlvl: 22,
    dropsIlvl: 34,
    prizeName: 'Thimblebriar Workshop',
    prizeDesc: 'A fairytale look & clockwork trophy for your house',
    prizeIcon: 'c_gnome',
    lookName: 'Thimblebriar Hall',
    titleText: 'the Bramble-Woven',
    bossNames: ['Spindle-Knight Stitch', 'Briar-King Bramble'],
    themeLight: '#F4B942',
    themeBg: '#271E2C',
  },
  {
    id: 'moonmere',
    tier: 3,
    roman: 'III',
    name: 'Moonmere Sanctum',
    blurb: 'A silver-lit woodland lake shrine where starlight weavers guard the sunken weirwood.',
    recIlvl: 30,
    dropsIlvl: 42,
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

/** each role's icon on its tab */
const ROLE_ICON: Record<RoleId, string> = { tank: 'shield', healer: 'mend', dps: 'comet' };
/** the picture for a kind of hero a log gives: its head */
const RACE_ICON: Partial<Record<RaceId, string>> = {
  risen: 'c_risen',
  gnome: 'c_gnome',
  goblin: 'c_goblin',
  orc: 'c_orc',
  dwarf: 'c_dwarf',
  elf: 'c_elf',
  human: 'c_human',
};
const word = (r: RoleId): string => (r === 'dps' ? 'DPS' : ROLES[r].title.toLowerCase());
const seg = (act: string, cur: string, opts: [string, string][]): string =>
  `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;

/** The role the sheet shows: the one you picked, or your hero's. */
export function pickedRole(p: Profile, pick: DungeonPick): RoleId {
  const h = activeHero(p);
  return pick.role || (h ? roleOf(h) : 'tank');
}

/** The dungeon version the sheet shows, and whether you can go in (Heroic opens after ten clears;
 *  `allOpen` is the testing switch). */
export function pickedDungeon(p: Profile, pick: DungeonPick, allOpen: boolean): { dg: DungeonInfo; open: boolean } {
  const reqId = pick.dungeon || 'barrow';
  const base = DUNGEONS[reqId] || DUNGEONS.barrow;
  const hero = heroicVersion(base.id);
  if (reqId !== base.id) return { dg: base, open: false };
  if (!pick.heroic || !hero) return { dg: base, open: true };
  return { dg: hero, open: allOpen || heroicOpen(p, base.id) };
}

/** Build the 3-dungeon Act 1 stepped progression strip at the top of the sheet. */
function dungeonStrip(p: Profile, activeId: string): string {
  const tabs = ACT1_DUNGEONS.map((m) => {
    const live = DUNGEONS[m.id];
    const on = activeId === m.id;
    const recIlvl = live?.recIlvl ?? m.recIlvl;
    const dropsIlvl = live?.dropsIlvl ?? m.dropsIlvl;
    const prog = live ? logProgress(p, live.id) : { have: 0, need: 16 };
    const clears = p.dungeons[m.id]?.clears || 0;
    return `<button type="button" class="dgx-tab${on ? ' on' : ''}${live ? '' : ' preview'}" role="tab" aria-selected="${on}" data-act="dgpick" data-id="${esc(m.id)}" style="--dc: ${m.themeLight}">
      <span class="dgx-t-top">
        <span class="dgx-t-tier">Tier ${m.roman}</span>
        <span class="dgx-t-ilvl">ilvl ${dropsIlvl}</span>
      </span>
      <b class="dgx-t-name">${esc(live?.name || m.name)}</b>
      <span class="dgx-t-sub">${live ? `Rec. ilvl ${recIlvl} · Log ${prog.have}/${prog.need}${clears ? ` · ${clears} clr` : ''}` : `Rec. ilvl ${recIlvl} · Act 1 Tier ${m.roman}`}</span>
    </button>`;
  }).join('');
  return `<div class="dgx-strip" role="tablist" aria-label="Act 1 Dungeons">${tabs}</div>`;
}

export function dungeonSheet(p: Profile, pick: DungeonPick, allOpen: boolean): { head: string; body: string; foot: string } {
  const reqId = pick.dungeon || 'barrow';
  const meta = ACT1_DUNGEONS.find((m) => m.id === reqId) || ACT1_DUNGEONS[0];
  const liveBase = DUNGEONS[reqId];
  const strip = dungeonStrip(p, reqId);
  const role = pickedRole(p, pick);
  const h = activeHero(p);
  const myIlvl = h ? +ilvl(loadoutFor(p, h).score) : 10;

  // If the selected Act 1 dungeon is not yet registered in DUNGEONS, show its stepped preview + Warband readiness
  if (!liveBase) {
    const ready = myIlvl >= meta.recIlvl;
    const body = `${strip}<div class="dgx preview-dg">
      <div class="dgx-side">
        <div class="dgx-art">${banner(false, meta.id)}
          <div class="dgx-name"><div class="dgx-tier-badge"><span>Tier ${meta.roman} · Recommended ilvl <b>${meta.recIlvl}</b> · Drops Epic ilvl <b>${meta.dropsIlvl}</b></span></div>
            <h3>${esc(meta.name)}</h3><span class="dg-stats"><span>Bosses <b>${esc(meta.bossNames[0])} &amp; ${esc(meta.bossNames[1])}</b></span></span></div>
        </div>
        <p class="fine dgx-blurb">${esc(meta.blurb)}</p>
        <section class="dgx-log">
          <div class="dgx-rewards">
            <p class="dgx-rw-h">Fill the ${esc(meta.name)} log to earn</p>
            <div class="dgx-rw main"><span class="dgx-rw-pic" aria-hidden="true">${tile(meta.prizeIcon)}</span><span><b>${esc(meta.prizeName)}</b><small>${esc(meta.prizeDesc)}</small></span></div>
            <div class="dgx-rw"><span class="dgx-rw-pic" aria-hidden="true"><span class="lk-sw">${SWATCH.barrow || ''}</span></span><span><b>${esc(meta.lookName)}</b><small>A look for your house</small></span></div>
            <div class="dgx-rw"><span class="dgx-rw-pic" aria-hidden="true"><span class="dgx-ttl">${GLYPH.pen}</span></span><span><b>${esc(meta.titleText)}</b><small>A title for every hero</small></span></div>
          </div>
        </section>
      </div>
      <div class="dgx-you">
        <section class="dgx-main" aria-label="Your Warband Readiness">
          <div class="dgx-ready ${ready ? 'ok' : 'warn'}">
            <b>${ready ? `${GLYPH.check}Warband Ready (ilvl ${myIlvl} vs Rec. ${meta.recIlvl})` : `Gear up in Tier ${meta.tier === 2 ? 'I (Barrow Crypt)' : 'II (Thimblebriar)'} first`}</b>
            <span>Your hero is <b>ilvl ${myIlvl}</b> · ${esc(meta.name)} recommends <b>ilvl ${meta.recIlvl}</b> and drops <b>ilvl ${meta.dropsIlvl}</b> sets &amp; boss weapons.</span>
          </div>
          <div class="dgx-roles" role="radiogroup" aria-label="Your role">${ORDER.map((r) => `<button type="button" class="dgx-role r-${r}" role="radio" aria-checked="${r === role}" data-act="role" data-role="${r}"><span class="tile" aria-hidden="true">${tile(ROLE_ICON[r])}</span>${esc(ROLES[r].title)}</button>`).join('')}</div>
          ${me(p, role, pick)}
        </section>
      </div>
    </div>`;
    const foot = `<p class="fine dgx-shut">${GLYPH.lock}${esc(meta.name)} (Tier ${meta.roman} · ilvl ${meta.dropsIlvl} drops) is the next Act 1 dungeon in the ladder.</p>`;
    return { head: '<h2>Dungeons</h2>', body, foot };
  }

  const base = liveBase;
  const { dg, open } = pickedDungeon(p, pick, allOpen);
  const rec = p.dungeons[dg.id], keeper = p.bosses[`${dg.id}.${dg.finalBoss}`];
  const playing = !!h && roleOf(h) === role;
  const practice = pick.mode === 'practice';
  // who may go in is party.ts's rule; the "Everything open" testing switch lets you in anyway
  const blocked = allOpen ? null : partyProblem(groupOf(p), { heroic: pick.heroic, practice });
  const { have: got, need: all } = logProgress(p, dg.id);
  const ach = logAchievement(dg.id);
  const done = !!ach && !!p.achievements[ach.id];
  const hp = heroicProgress(p, base.id);
  const hOpen = allOpen || heroicOpen(p, base.id);
  const recIlvl = pick.heroic ? (base.dropsIlvl || meta.dropsIlvl) - 2 : (base.recIlvl ?? meta.recIlvl);
  const dropsIlvl = base.dropsIlvl ?? meta.dropsIlvl;
  const diff = `<div class="dgx-diff" role="radiogroup" aria-label="Normal or Heroic">
      <button type="button" class="dgx-d" role="radio" data-act="diff" data-v="normal" aria-checked="${!pick.heroic}">Normal</button>
      <button type="button" class="dgx-d h" role="radio" data-act="diff" data-v="heroic" aria-checked="${pick.heroic}">${hOpen ? '' : GLYPH.lock}Heroic${hOpen ? '' : ` <small>${hp.have}/${hp.need}</small>`}</button></div>`;
  const main = ach ? mainReward(ach) : null;
  const starts = (DUNGEON_ENGINES[base.id]?.starts || []).filter((s: { id: string; name: string }) => s.id !== 'intro');
  const body = `${strip}<div class="dgx${pick.heroic ? ' heroic' : ''}">
    <div class="dgx-side">
      <div class="dgx-art">${banner(pick.heroic, base.id)}${diff}
        <div class="dgx-name"><div class="dgx-tier-badge"><span>Tier ${meta.roman} · Rec. ilvl <b>${recIlvl}</b> · Drops up to <b>ilvl ${dropsIlvl}</b>${pick.heroic ? ' + gilding kits' : ''}</span></div>
          <h3>${esc(base.name)}${pick.heroic ? ' <em class="dgx-h">Heroic</em>' : ''}</h3><span class="dg-stats"><span>Clears <b>${rec ? rec.clears : 0}</b></span><span>Best <b>${fmtT(rec?.pb)}</b></span><span>KC <b>${keeper ? keeper.kc : 0}</b></span></span></div>
      </div>
      <section class="dgx-log">
        <button type="button" class="dgx-logbar${done ? ' done' : ''}" data-act="logx" aria-expanded="${pick.log}"><span>Collection log</span><b>${got}/${all}</b><i aria-hidden="true"><i style="width: ${((got / all) * 100).toFixed(1)}%"></i></i>${main ? `<span class="dgx-prize${done ? ' got' : ''}" title="${esc(main.name)}" aria-hidden="true">${tile(main.icon)}</span>` : ''}<span class="dgx-more">${pick.log ? 'Hide' : 'Loot'}${pick.log ? GLYPH.up : GLYPH.down}</span></button>
        ${pick.log ? `<div class="dgx-loot">${ach ? rewards(ach, done) : ''}${pick.heroic ? `<p class="dgx-rw-h">Everything Normal drops, plus a gilding kit for every piece: any seat, ${fmtRate(KIT_RATE)} each. Same power.</p>` : ''}${ORDER.flatMap((r) => r === 'dps' ? [lootRow(p, 'Mage', 'dps', lootFor(dg, 'dps', 'mage').mine, role === 'dps' && h?.cls !== 'rogue'), lootRow(p, 'Rogue', 'dps', lootFor(dg, 'dps', 'rogue').mine, role === 'dps' && h?.cls === 'rogue')] : [lootRow(p, ROLES[r].title, r, lootFor(dg, r).mine, r === role)]).join('')}${lootRow(p, 'Anyone', null, lootFor(dg, role).shared, false)}
          <button type="button" class="btn small" data-act="entry" data-id="${dg.id}.${dg.finalBoss}">${GLYPH.book}Open the collection log</button></div>` : ''}
      </section>
    </div>
    <div class="dgx-you">
      <section class="dgx-main" aria-label="You">
        <div class="dgx-roles" role="radiogroup" aria-label="Your role">${ORDER.map((r) => `<button type="button" class="dgx-role r-${r}" role="radio" aria-checked="${r === role}" data-act="role" data-role="${r}"><span class="tile" aria-hidden="true">${tile(ROLE_ICON[r])}</span>${esc(ROLES[r].title)}</button>`).join('')}</div>
        ${me(p, role, pick)}
        ${brews(p, practice)}
      </section>
      <section class="dgx-mode">
        ${seg('mode', pick.mode, [['loot', 'For loot'], ['practice', 'Practice']])}
        ${practice ? `<div class="box">
            <div class="seg-row"><b>Start at</b> ${seg('start', pick.start, starts.map((s: { id: string; name: string }) => [s.id, s.name] as [string, string]))}</div>
            <div class="seg-row"><b>Gear</b> ${seg('tgear', String(pick.gear), [['mine', 'Mine'], ['2', 'Try Rare'], ['3', 'Try Epic']])}</div>
            <p class="fine">No loot, kill counts or achievements.</p>
          </div>` : ''}
      </section>
    </div>
  </div>`;
  let foot: string;
  if (!open) foot = `<p class="fine dgx-shut">${GLYPH.lock}Heroic opens after ${HEROIC_AFTER} clears of the ${esc(base.name.split(' ')[0])}. You have ${hp.have}.</p>`;
  else if (!playing && p.roster.length < MAX_HEROES) foot = `<button type="button" class="btn gold big" data-act="newseat" data-role="${role}">${GLYPH.plus}Make a ${esc(word(role))}</button>`;
  else if (!playing) foot = `<p class="fine">Your bunk room is full. Let a hero go to make a ${esc(word(role))}.</p>`;
  else if (blocked) foot = `<p class="fine dgx-shut">${GLYPH.lock}${esc(blocked)}</p>`;
  else foot = `<button type="button" class="btn gold big${pick.heroic ? ' heroic' : ''}" data-act="go">${practice ? 'Start practice' : pick.heroic ? 'Enter Heroic' : `Enter the ${esc(base.name.split(' ')[0])}`}</button>`;
  return { head: '<h2>Dungeons</h2>', body, foot };
}

/** the big one a log gives, for the end of its bar: a new kind of hero, or else what it gives your heroes */
export function mainReward(a: AchievementDef): { name: string; what: string; icon: string } | null {
  const r = a.reward;
  if (r.race && RACES[r.race as RaceId]) return { name: `The ${RACES[r.race as RaceId].plural}`, what: 'A new kind of hero', icon: RACE_ICON[r.race as RaceId] || 'c_risen' };
  if (r.collectible && COLLECTIBLES[r.collectible]) return { name: COLLECTIBLES[r.collectible].name, what: COLLECTIBLES[r.collectible].desc, icon: COLLECTIBLES[r.collectible].icon };
  return null;
}

/** what finishing the log gives: the big one first, then a look for the house and a title */
export function rewards(a: AchievementDef, done: boolean): string {
  const main = mainReward(a);
  const look = a.reward.look ? LOOKS.find((l) => l.id === a.reward.look) : undefined;
  const title = a.reward.title ? TITLES[a.reward.title] : undefined;
  const rw = (pic: string, name: string, what: string, cls = ''): string => `<div class="dgx-rw ${cls}"><span class="dgx-rw-pic" aria-hidden="true">${pic}</span><span><b>${esc(name)}</b><small>${esc(what)}</small></span></div>`;
  return `<div class="dgx-rewards${done ? ' done' : ''}"><p class="dgx-rw-h">${done ? `${GLYPH.check}Log complete: these are yours` : 'Fill the log to earn'}</p>
    ${main ? rw(tile(main.icon), main.name, main.what, 'main') : ''}
    ${look ? rw(`<span class="lk-sw">${SWATCH[look.id] || ''}</span>`, look.name, 'A look for your house') : ''}
    ${title ? rw(`<span class="dgx-ttl">${GLYPH.pen}</span>`, title.text, 'A title for every hero') : ''}</div>`;
}

/** one row of the loot: who can get it, then each drop */
function lootRow(p: Profile, label: string, role: RoleId | null, drops: DropDef[], yours: boolean): string {
  return `<div class="dgx-row${role ? ` r-${role}` : ''}${yours ? ' yours' : ''}"><span class="dgx-lbl">${esc(label)}</span>${drops.map((d) => item(p, d)).join('')}</div>`;
}

/** a drop: lit up if you have it, its drop rate if you don't */
function item(p: Profile, d: DropDef): string {
  const have = !!p.collection[d.id];
  return `<button type="button" class="dgx-it${have ? ' got' : ''}" data-act="item" data-id="${esc(d.id)}" style="--c: ${colourOf(d.id)}" aria-label="${esc(nameOf(d.id))}: ${have ? 'in your collection' : `drops ${fmtRate(d.rate)}`}">
    <span class="tile" aria-hidden="true">${iconOf(d.id)}</span><small>${have ? GLYPH.check : fmtRate(d.rate)}</small></button>`;
}

/** who plays the role: your hero, a way to change to another of yours, and who comes along (Normal: your
 *  Warband or a group; Heroic: two or three players and a bot, never your Warband) */
function me(p: Profile, role: RoleId, pick: DungeonPick): string {
  const h = activeHero(p);
  if (!h || roleOf(h) !== role) return `<div class="dgx-me none r-${role}"><b>No ${esc(word(role))} yet</b><span class="fine">Make one to play this seat.</span></div>`;
  const others = heroesFor(p, role).filter((x) => x.id !== h.id);
  const room = p.roster.length < MAX_HEROES;
  const mates = seats(p, false)
    .filter((s) => s.role !== role)
    .map((s) => (s.hero ? `${s.hero.name} (ilvl ${ilvl(loadoutFor(p, s.hero).score)})` : `${s.bot} (bot)`));
  const list = pick.alts
    ? `<div class="seat-pick">${others.map((x) => `<button type="button" class="btn small" data-act="playseat" data-id="${esc(x.id)}">${GLYPH.play}${esc(x.name.split(' ')[0])}</button>`).join('')}${room ? `<button type="button" class="btn small" data-act="newseat" data-role="${role}">${GLYPH.plus}New ${esc(word(role))}</button>` : ''}</div>`
    : '';
  const partyLine = pick.heroic
    ? `<p class="fine"><b>Group run:</b> two or three players, and a bot in an empty seat. Your Warband stays home.</p>`
    : `<p class="fine"><b>Warband &amp; Group:</b> ${esc(mates.join(' & '))} join your party (or group with friends).</p>`;
  return `<div class="dgx-me r-${role}">
      <span class="dgx-fig" aria-hidden="true">${heroImg(heroSprite(h, role, p), { cls: 'dgx-img' })}</span>
      <span class="dgx-who"><b>${esc(h.name)}</b><span>Item level ${ilvl(loadoutFor(p, h).score)}</span></span>
      ${others.length || room ? `<button type="button" class="btn small" data-act="alts" aria-expanded="${pick.alts}">Change</button>` : ''}
    </div>${list}
    ${partyLine}`;
}

/** which brew you take in: one bottle a run */
function brews(p: Profile, practice: boolean): string {
  const have = RECIPE_ORDER.filter((id) => (p.vale.shelf[id] || 0) > 0);
  if (!have.length) return '';
  const drink = p.vale.drink && (p.vale.shelf[p.vale.drink] || 0) > 0 ? p.vale.drink : null;
  const chip = (id: string | null) => {
    const r = id ? RECIPES[id] : null;
    return `<button type="button" class="bc" role="radio" data-act="drink" data-id="${id || ''}" aria-checked="${drink === id}" ${r ? `style="--c: ${r.color}"` : ''}>
      ${r ? `<span class="tile" aria-hidden="true">${tile(r.icon)}</span>${esc(r.name)} <small>×${p.vale.shelf[r.id]}</small>` : 'No brew'}</button>`;
  };
  return `<div class="brewchips" role="radiogroup" aria-label="Brew, one bottle a run">${chip(null)}${have.map(chip).join('')}</div>
    <p class="fine">${esc(drink ? RECIPES[drink].desc : 'Go in as you are.')}${drink && practice ? ' Practice keeps the bottle.' : ''}</p>`;
}

/** the dungeon's picture: its bosses in the crypt, in the green light of the Gravekeeper's lantern
 *  (gold for Heroic, amber-violet for Thimblebriar, moonlit cyan for Moonmere) */
const BANNERS: Record<string, string> = {};
const banner = (heroic: boolean, dgId = 'barrow'): string => {
  const key = `${dgId}:${heroic}`;
  const meta = ACT1_DUNGEONS.find((m) => m.id === dgId) || ACT1_DUNGEONS[0];
  const light = heroic ? '#F2C230' : meta.themeLight;
  const bg = meta.themeBg;
  return (BANNERS[key] ||= bannerSvg(light, bg, `dgx-glow-${dgId}-${heroic ? 'h' : 'n'}`));
};
function bannerSvg(light: string, bg: string, id: string): string {
  const o: string[] = [`<rect x="0" y="0" width="640" height="300" style="fill: ${bg}"/>`, `<circle cx="320" cy="168" r="230" style="fill: url(#${id})"/>`];
  o.push(placeSprite('arch', 320, 262, { k: 1.32 }));
  o.push(placeSprite('pillar', 92, 266, { k: 1.06 }) + placeSprite('pillar', 548, 266, { k: 1.06 }));
  o.push('<path d="M-4 256 H644 V304 H-4 Z" style="fill: #3A3150; stroke: #1E1A1A; stroke-width: 4"/>');
  o.push(placeSprite('tomb1', 28, 282, { k: 1.1 }) + placeSprite('tomb2', 612, 284, { k: 1.1 }));
  o.push(placeSprite('knight', 176, 288, { k: 0.74 }) + placeSprite('rattler', 470, 290, { k: 0.9, flip: true }));
  o.push(placeSprite('keeper', 324, 296, { k: 0.8 }));
  o.push(placeSprite('candles', 248, 296, { k: 0.95 }) + placeSprite('candles', 404, 298, { k: 0.95 }));
  o.push('<rect x="0" y="0" width="640" height="300" style="fill: url(#dgx-vig)"/>');
  return `<svg class="dgx-svg" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <radialGradient id="${id}"><stop offset="0" stop-color="${light}" stop-opacity="0.42"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    <radialGradient id="dgx-vig" cx="50%" cy="42%" r="72%"><stop offset="0.62" stop-color="#140E18" stop-opacity="0"/><stop offset="1" stop-color="#140E18" stop-opacity="0.6"/></radialGradient>
  </defs>${o.join('')}</svg>`;
}
