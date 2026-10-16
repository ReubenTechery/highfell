/**
 * The Dungeons sheet, opened by the big Dungeons button or the Barrow door. The dungeon's picture with
 * its Normal / Heroic switch (Heroic opens after ten clears and plays harder, for gilded drops), and right
 * under it one small line for that version's collection log: how full it is, with what finishing it gives
 * at the end of the bar (the Barrow's: a new kind of hero, the Risen). The line opens the Loot page: those
 * rewards and what each role can get, yours first (what you have lit up, every drop rate; tap one to hold
 * it up against what you wear). On desktop the loot sits beside the rest instead. Then the main thing: your
 * role, your hero (picking a role picks the hero of that role you played last; change to another or make
 * one) and your brew, then loot or practice. On Normal your own Warband heroes from your bunk room fill the
 * other seats in their own gear (or bots stand in until you make them); Heroic needs at least two players
 * (party.ts), so for now it opens only for practice.
 */
import { COLLECTIBLES, DUNGEONS, DUNGEON_ENGINES, TITLES, heroicVersion } from '../content';
import { MAX_HEROES, RACES, type RaceId } from '../content/folk';
import { LOOKS } from '../content/house';
import { ORDER, ROLES } from '../content/roles';
import type { AchievementDef, DropDef, DungeonInfo, Rar, RoleId } from '../content/types';
import { RECIPES, RECIPE_ORDER } from '../content/vale';
import { loadoutFor } from '../meta/gear';
import { HEROIC_AFTER, heroicOpen, heroicProgress, lootFor } from '../meta/loot';
import { logAchievement, logProgress } from '../meta/logs';
import { groupOf, heroesFor, partyProblem, pickRole, seats } from '../meta/party';
import { activeHero, heroById, roleOf, setActive, type Profile } from '../meta/profile';
import type { App } from './app';
import { esc, fmtRate, fmtT, GLYPH } from './dom';
import { colourOf, heroImg, heroSprite, iconOf, nameOf, placeSprite, tile } from './art';
import { ilvl } from './hearth';
import { SWATCH } from './lookssheet';
import { SFX } from './sound';

/** the sheet's pages: the door (the everyday one) and the ones a tap away, each with a back arrow */
export type DgPage = 'door' | 'loot';

/** what the sheet remembers while the page is open: which page, the run's options, the role you're
 *  looking at, whether the list of your other heroes is open, Normal or Heroic, and which dungeon */
export interface DungeonPick {
  dungeon?: string;
  page: DgPage;
  mode: 'loot' | 'practice';
  start: string;
  gear: 'mine' | 2 | 3;
  role: RoleId | null;
  alts: boolean;
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

/** The Act 1 dungeons as name tabs above the picture: the one you're looking at in its own light, the ones
 *  still being built dashed. Everything else about a dungeon is said once, on its picture or its loot. */
function dungeonStrip(activeId: string): string {
  const tabs = ACT1_DUNGEONS.map((m) => {
    const live = DUNGEONS[m.id], on = activeId === m.id, name = live?.name || m.name;
    return `<button type="button" class="dgx-tab${on ? ' on' : ''}${live ? '' : ' soon'}" role="tab" aria-selected="${on}" aria-label="${esc(name)}${live ? '' : ', coming soon'}" data-act="dgpick" data-id="${esc(m.id)}" style="--dc: ${m.themeLight}">${esc(name.split(' ')[0])}</button>`;
  }).join('');
  return `<div class="dgx-strip" role="tablist" aria-label="Dungeons">${tabs}</div>`;
}

/** the one line of numbers on a dungeon's picture */
const statLine = (clears: number, kc: number, pb: number | null | undefined): string =>
  clears ? `<b>${clears}</b> clear${clears === 1 ? '' : 's'} · KC <b>${kc}</b> · best <b>${fmtT(pb)}</b>` : 'No clears yet';

export function dungeonSheet(p: Profile, pick: DungeonPick, allOpen: boolean): { head: string; body: string; foot: string } {
  const reqId = pick.dungeon || 'barrow';
  const meta = ACT1_DUNGEONS.find((m) => m.id === reqId) || ACT1_DUNGEONS[0];
  const liveBase = DUNGEONS[reqId];
  const strip = dungeonStrip(reqId);
  const role = pickedRole(p, pick);
  const h = activeHero(p);
  const myIlvl = h ? +ilvl(loadoutFor(p, h).score) : 10;

  // If the selected Act 1 dungeon is not yet registered in DUNGEONS, show its stepped preview + Warband readiness
  if (!liveBase) {
    const ready = myIlvl >= meta.recIlvl;
    const body = `${strip}<div class="dgx preview-dg">
      <div class="dgx-side">
        <div class="dgx-art">${banner(false, meta.id)}
          <div class="dgx-name"><h3>${esc(meta.name)}</h3><p class="dgx-line">Bosses <b>${esc(meta.bossNames[0])}</b> &amp; <b>${esc(meta.bossNames[1])}</b></p></div>
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
    const foot = `<p class="fine dgx-shut">${GLYPH.lock}${esc(meta.name)} is coming soon.</p>`;
    return { head: '<h2>Dungeons</h2>', body, foot };
  }

  const base = liveBase;
  const { dg, open } = pickedDungeon(p, pick, allOpen);
  const rec = p.dungeons[dg.id], keeper = p.bosses[`${dg.id}.${dg.finalBoss}`];
  const playing = !!h && roleOf(h) === role;
  const practice = pick.mode === 'practice';
  // who may go in is party.ts's rule; the "Everything open" testing switch lets you in anyway
  const blocked = allOpen ? null : partyProblem(groupOf(p), { heroic: pick.heroic, practice });
  const hp = heroicProgress(p, base.id);
  const hOpen = allOpen || heroicOpen(p, base.id);
  const diff = `<div class="dgx-diff" role="radiogroup" aria-label="Normal or Heroic">
      <button type="button" class="dgx-d" role="radio" data-act="diff" data-v="normal" aria-checked="${!pick.heroic}">Normal</button>
      <button type="button" class="dgx-d h" role="radio" data-act="diff" data-v="heroic" aria-checked="${pick.heroic}">${hOpen ? '' : GLYPH.lock}Heroic${hOpen ? '' : ` <small>${hp.have}/${hp.need}</small>`}</button></div>`;
  const starts = (DUNGEON_ENGINES[base.id]?.starts || []).filter((s: { id: string; name: string }) => s.id !== 'intro');
  let foot: string;
  if (!open) foot = `<p class="fine dgx-shut">${GLYPH.lock}Heroic opens after ${HEROIC_AFTER} clears of the ${esc(base.name.split(' ')[0])}. You have ${hp.have}.</p>`;
  else if (!playing && p.roster.length < MAX_HEROES) foot = `<button type="button" class="btn gold big" data-act="newseat" data-role="${role}">${GLYPH.plus}Make a ${esc(word(role))}</button>`;
  else if (!playing) foot = `<p class="fine">Your bunk room is full. Let a hero go to make a ${esc(word(role))}.</p>`;
  else if (blocked) foot = `<p class="fine dgx-shut">${GLYPH.lock}${esc(blocked)}</p>`;
  else foot = `<button type="button" class="btn gold big${pick.heroic ? ' heroic' : ''}" data-act="go">${practice ? 'Start practice' : pick.heroic ? 'Enter Heroic' : `Enter the ${esc(base.name.split(' ')[0])}`}</button>`;
  const loot = lootPanel(p, dg, role);
  if (pick.page === 'loot') return { head: subHead(`${pick.heroic ? 'Heroic ' : ''}${base.name.split(' ')[0]} loot`), body: `<div class="dgx-lootpage">${loot}</div>`, foot };
  // on a phone the log line opens the Loot page; on desktop the loot sits in its own column instead
  const body = `${strip}<div class="dgx${pick.heroic ? ' heroic' : ''}">
    <div class="dgx-art">${banner(pick.heroic, base.id)}${diff}
      <div class="dgx-name"><h3>${esc(base.name)}</h3><p class="dgx-line">${statLine(rec?.clears || 0, keeper?.kc || 0, rec?.pb)}</p></div>
    </div>
    ${logLine(p, dg, true)}
    <aside class="dgx-lootcol" aria-label="Loot">${loot}</aside>
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
  return { head: '<h2>Dungeons</h2>', body, foot };
}

/** an inner page's head: back to the door, and the page's name */
const subHead = (title: string): string =>
  `<div class="dgx-sub"><button type="button" class="icon-btn" data-act="dgback" aria-label="Back">${GLYPH.left}</button><h2>${esc(title)}</h2></div>`;

/** the log's line: how full it is, with what finishing it gives at the end of the bar. On the door it is the
 *  way to the Loot page; at the top of the loot it is just the line. */
function logLine(p: Profile, dg: DungeonInfo, button: boolean): string {
  const { have, need } = logProgress(p, dg.id);
  const ach = logAchievement(dg.id), done = !!ach && !!p.achievements[ach.id], main = ach ? mainReward(ach) : null;
  const label = dg.heroicOf ? 'Heroic log' : 'Collection log';
  const inner = `<span>${label}</span><b>${have}/${need}</b><i aria-hidden="true"><i style="width: ${((have / Math.max(1, need)) * 100).toFixed(1)}%"></i></i>${main ? `<span class="dgx-prize${done ? ' got' : ''}" title="${esc(main.name)}" aria-hidden="true">${tile(main.icon)}</span>` : ''}`;
  return button
    ? `<button type="button" class="dgx-logbar${done ? ' done' : ''}" data-act="logx" aria-label="${label}, ${have} of ${need}. See the loot">${inner}<span class="dgx-go" aria-hidden="true">${GLYPH.right}</span></button>`
    : `<div class="dgx-logbar still${done ? ' done' : ''}">${inner}</div>`;
}

/** the loot: the log's line, the item levels it drops, what finishing it gives, then every drop by who can
 *  get it, the role you're looking at first (tap one to hold it up against what that role wears) */
function lootPanel(p: Profile, dg: DungeonInfo, role: RoleId): string {
  const h = activeHero(p), base = DUNGEONS[dg.heroicOf || dg.id] || dg;
  const ach = logAchievement(dg.id), done = !!ach && !!p.achievements[ach.id];
  const drops = base.dropsIlvl;
  const rows: { label: string; role: RoleId | null; drops: DropDef[]; yours: boolean }[] = [];
  for (const r of ORDER) {
    if (r !== 'dps') { rows.push({ label: ROLES[r].title, role: r, drops: lootFor(dg, r).mine, yours: r === role }); continue; }
    const rogue = h?.cls === 'rogue';
    rows.push({ label: 'Mage', role: 'dps', drops: lootFor(dg, 'dps', 'mage').mine, yours: role === 'dps' && !rogue });
    rows.push({ label: 'Rogue', role: 'dps', drops: lootFor(dg, 'dps', 'rogue').mine, yours: role === 'dps' && rogue });
  }
  rows.sort((a, b) => Number(b.yours) - Number(a.yours));
  rows.push({ label: 'Anyone', role: null, drops: lootFor(dg, role).shared, yours: false });
  return `${logLine(p, dg, false)}
    ${drops ? `<p class="dgx-ilvl">Drops up to <b>ilvl ${drops}</b>${dg.heroicOf ? `, gilded · made for <b>ilvl ${drops - 2}</b>` : ''}</p>` : ''}
    ${ach ? rewards(ach, done) : ''}
    <div class="dgx-rows">${rows.map((r) => lootRow(p, r.label, r.role, r.drops, r.yours)).join('')}</div>
    <button type="button" class="btn small dgx-open" data-act="entry" data-id="${dg.id}.${dg.finalBoss}">${GLYPH.book}Open the collection log</button>`;
}

/** what the Dungeons sheet needs from the sheets around it */
export interface DungeonHost { app: App; root: HTMLElement; pick: DungeonPick; refresh(): void; close(): void }

/** the Dungeons sheet's buttons: its pages, the dungeon and its version, your role and hero, practice, and
 *  going in */
export function dungeonActions(d: DungeonHost): Record<string, (el: HTMLElement) => void> {
  const page = (to: DgPage): void => {
    d.pick.page = to;
    SFX.play('ui');
    d.refresh();
    const b = d.root.querySelector('.sheet-body');
    if (b) b.scrollTop = 0;
  };
  return {
    logx: () => page('loot'),
    dgback: () => page('door'),
    dgpick: (el) => { d.pick.dungeon = el.dataset.id || 'barrow'; d.pick.heroic = false; d.pick.page = 'door'; SFX.play('ui'); d.refresh(); },
    diff: (el) => { d.pick.heroic = el.dataset.v === 'heroic'; SFX.play('ui'); d.refresh(); },
    mode: (el) => { d.pick.mode = el.dataset.v as 'loot' | 'practice'; SFX.play('ui'); d.refresh(); },
    start: (el) => { d.pick.start = el.dataset.v!; SFX.play('ui'); d.refresh(); },
    tgear: (el) => { const v = el.dataset.v!; d.pick.gear = v === 'mine' ? 'mine' : (+v as 2 | 3); SFX.play('ui'); d.refresh(); },
    role: (el) => {
      const r = el.dataset.role as RoleId, p = d.app.p, was = p.active;
      d.pick.role = r; d.pick.alts = false;
      SFX.play('ui');
      if (pickRole(p, r) && p.active !== was) d.app.save(); else d.refresh();
    },
    alts: () => { d.pick.alts = !d.pick.alts; SFX.play('ui'); d.refresh(); },
    playseat: (el) => {
      const h = heroById(d.app.p, el.dataset.id || null); if (!h) return;
      setActive(d.app.p, h.id); d.pick.role = roleOf(h); d.pick.alts = false; SFX.play('place'); d.app.save();
    },
    newseat: (el) => { const r = el.dataset.role as RoleId; d.pick.alts = false; SFX.play('ui'); d.close(); d.app.showCreate(r); },
    go: () => goIn(d),
  };
}

/** Escape on an inner page goes back to the door; true when it did */
export function dungeonBack(pick: DungeonPick): boolean {
  if (pick.page === 'door') return false;
  pick.page = 'door';
  return true;
}

/** into the dungeon: Normal for loot, Heroic when your group may, or practice */
function goIn(d: DungeonHost): void {
  const pr = d.pick, app = d.app;
  const practice = pr.mode === 'practice';
  const { dg, open } = pickedDungeon(app.p, pr, app.dev.allOpen);
  if (!open) { SFX.play('nope'); return; }
  if (pr.heroic && !practice && !app.dev.allOpen) { SFX.play('nope'); return; }
  const baseId = dg.heroicOf || dg.id;
  SFX.play('ui');
  if (practice) app.startRun({ dungeon: baseId, start: pr.start, testRar: pr.gear === 'mine' ? null : (pr.gear as Rar), heroic: pr.heroic });
  else app.startRun({ dungeon: baseId, start: 'entrance', testRar: null, heroic: pr.heroic });
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
  return `<div class="dgx-row${role ? ` r-${role}` : ''}${yours ? ' yours' : ''}"><span class="dgx-lbl">${esc(label)}${yours ? '<em class="dgx-yours">yours</em>' : ''}</span>${drops.map((d) => item(p, d)).join('')}</div>`;
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
