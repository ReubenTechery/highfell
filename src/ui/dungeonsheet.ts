/**
 * The Dungeons sheet, opened by the big Dungeons button or a door in the house's cellar. Its head is the dungeon's name,
 * which opens All dungeons (each one's log and Heroic, and what the coming ones will ask). The door with
 * its Normal / Heroic switch (Heroic opens after ten clears and plays harder: the same drops, plus gilding kits), and right
 * under it one small line for that version's collection log: how full it is, with what finishing it gives
 * at the end of the bar (the Barrow's: a new kind of hero, the Risen). The line opens the Loot page: those
 * rewards and what each role can get, yours first (what you have lit up, every drop rate; tap one to hold
 * it up against what you wear). On desktop the loot sits beside the rest instead. The main thing is the
 * door: your party standing in front of the dungeon's door with its final boss behind them (stage.ts). On
 * Normal your own Warband heroes from your bunk room fill the other seats in their own gear (or bots stand
 * in until you make them); tap a hero for Who goes in, to play another or make one. Heroic needs at least
 * two players (party.ts), so its other seats wait for friends and the gold button stays locked until online
 * play. Then your brew (one button; its page has every bottle and what it does), and the gold button. The first
 * time, a tip under the door says who comes with you (your Warband), and your first bottle gets one too (tips.ts).
 * A hero short of the dungeon's recommended Power is warned first (party.ts), once per tap, and can go anyway.
 */
import { COLLECTIBLES, DUNGEONS, SEASONS, TITLES, heroicVersion } from '../content';
import { ACT1_DUNGEONS, type Act1DungeonMeta } from '../content/act1';
import { KIT_RATE } from '../content/kits';
import { MAX_HEROES, RACES, type RaceId } from '../content/folk';
import { LOOKS } from '../content/house';
import { ORDER, ROLES } from '../content/roles';
import type { AchievementDef, DropDef, DungeonInfo, DungeonStage, RoleId } from '../content/types';
import { RECIPES, RECIPE_ORDER } from '../content/vale';
import { loadoutFor, partyRar, wholeIlvl } from '../meta/gear';
import { heroicOpen, heroicProgress, lootFor } from '../meta/loot';
import { logAchievement, logProgress } from '../meta/logs';
import { groupOf, heroesFor, partyProblem, seats, underPowered, type PowerGap } from '../meta/party';
import { activeHero, heroById, roleOf, setActive, type Hero, type Profile } from '../meta/profile';
import { doorTip, finishTip, type DoorTip } from '../meta/tips';
import type { App } from './app';
import { esc, fmtRate, fmtT, GLYPH } from './dom';
import { botSprite, colourOf, heroImg, heroSprite, iconOf, nameOf, placeSprite, tile } from './art';
import { ilvl } from './hearth';
import { SWATCH } from './lookssheet';
import { SFX } from './sound';
import { seatAt, stageShape, stageSvg } from './stage';
import { warbandOpen, warbandWhy } from '../meta/warband';

/** the sheet's pages: the door (the everyday one) and the ones a tap away, each with a back arrow */
export type DgPage = 'door' | 'loot' | 'heroes' | 'brews' | 'list';

/** what the sheet remembers while the page is open: which page, Normal or Heroic, and which dungeon; whether
 *  the under-powered warning is up over the gold button, and the dungeons you chose Go anyway for (they don't
 *  warn again until the page is reloaded) */
export interface DungeonPick {
  dungeon?: string;
  page: DgPage;
  heroic: boolean;
  warn?: boolean;
  braved?: string[];
}

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
/** the season a dungeon on the ladder is in: a built one's from its data, one still coming from its card */
const seasonOf = (m: Act1DungeonMeta): number => DUNGEONS[m.id]?.season ?? m.season ?? 0;
/** a season's name, and the small tag that says it under a dungeon's name */
const seasonName = (s: number): string => SEASONS[s]?.name || `Season ${s}`;
const seasonTag = (s: number): string => `<span class="dgx-season">${esc(seasonName(s))}</span>`;

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

/** the one line of numbers on a dungeon's picture */
const statLine = (clears: number, kc: number, pb: number | null | undefined): string =>
  clears ? `<b>${clears}</b> clear${clears === 1 ? '' : 's'} · KC <b>${kc}</b> · best <b>${fmtT(pb)}</b>` : 'No clears yet';

export function dungeonSheet(p: Profile, pick: DungeonPick, allOpen: boolean): { head: string; body: string; foot: string } {
  // a dungeon that's built has its door; one still coming has a door that says what it will ask of you
  const base = DUNGEONS[pick.dungeon || 'barrow'] || DUNGEONS.barrow;
  const meta = ACT1_DUNGEONS.find((m) => m.id === base.id) || ACT1_DUNGEONS[0];
  const h = activeHero(p);
  const role: RoleId = h ? roleOf(h) : 'tank';
  if (pick.page === 'list') return { head: subHead('Dungeons'), body: dungeonList(p, pick.dungeon || base.id), foot: '' };
  const soon = ACT1_DUNGEONS.find((m) => m.id === pick.dungeon && !DUNGEONS[m.id]);
  if (soon) return soonSheet(p, soon);

  const { dg, open } = pickedDungeon(p, pick, allOpen);
  const rec = p.dungeons[dg.id], keeper = p.bosses[`${dg.id}.${dg.finalBoss}`];
  // who may go in is party.ts's rule; the "Everything open" testing switch lets you in anyway
  const blocked = allOpen ? null : partyProblem(groupOf(p), { heroic: pick.heroic });
  const hp = heroicProgress(p, base.id);
  const hOpen = allOpen || heroicOpen(p, base.id);
  const diff = `<div class="dgx-diff" role="radiogroup" aria-label="Normal or Heroic">
      <button type="button" class="dgx-d" role="radio" data-act="diff" data-v="normal" aria-checked="${!pick.heroic}">Normal</button>
      <button type="button" class="dgx-d h" role="radio" data-act="diff" data-v="heroic" aria-checked="${pick.heroic}">${hOpen ? '' : GLYPH.lock}Heroic${hOpen ? '' : ` <small>${hp.have}/${hp.need}</small>`}</button></div>`;
  // the one gold button: it always says where you're going (Heroic's two-player rule is on the door itself);
  // after a tap of it, a hero short of the dungeon's Power gets the warning in its place
  const gap = h && pick.warn ? underPowered(p, h, dg) : null;
  let foot: string;
  if (!open) foot = `<p class="fine dgx-shut">${GLYPH.lock}Heroic opens once you’ve found ${hp.need} pieces of the ${esc(base.name.split(' ')[0])}’s log. You have ${hp.have}.</p>`;
  else if (!h) foot = `<button type="button" class="btn gold big dgx-enter" data-act="newhero">${GLYPH.plus}Make a hero</button>`;
  else if (blocked && pick.heroic) foot = `<button type="button" class="btn gold big dgx-enter heroic" disabled>${GLYPH.lock}Enter Heroic</button>`;
  else if (blocked) foot = `<p class="fine dgx-shut">${GLYPH.lock}${esc(blocked)}</p>`;
  else if (gap) foot = warning(base, gap);
  else foot = powerLine(p, h, dg) + `<button type="button" class="btn gold big dgx-enter${pick.heroic ? ' heroic' : ''}" data-act="go">${pick.heroic ? 'Enter Heroic' : `Enter the ${esc(base.name.split(' ')[0])}`}</button>`;
  const loot = lootPanel(p, dg, role);
  if (pick.page === 'loot') return { head: subHead(`${pick.heroic ? 'Heroic ' : ''}${base.name.split(' ')[0]} loot`), body: `<div class="dgx-lootpage">${loot}</div>`, foot };
  if (pick.page === 'heroes') return { head: subHead('Who goes in'), body: heroesPage(p, pick.heroic, allOpen || warbandOpen(p)), foot };
  if (pick.page === 'brews') return { head: subHead('Your brew'), body: brewsPage(p), foot };
  const head = `<h2><button type="button" class="dgx-namebtn" data-act="dglist" aria-label="${esc(base.name)}. All dungeons">${esc(base.name)}${GLYPH.down}</button></h2><p>${seasonTag(base.season)}Tier ${meta.roman}${pick.heroic ? ' · Heroic' : ''} · ${statLine(rec?.clears || 0, keeper?.kc || 0, rec?.pb)}</p>`;
  // on a phone the log line opens the Loot page; on desktop the loot sits in its own column instead
  const tip = doorTip(p, pick.heroic);
  const body = `<div class="dgx${pick.heroic ? ' heroic' : ''}${tip ? ' tipping' : ''}">
    ${door(p, base, pick.heroic, diff + steps(base.id), tip === 'warband')}
    ${logLine(p, dg, true)}
    <aside class="dgx-lootcol" aria-label="Loot">${loot}</aside>
    <div class="dgx-you">${brewButton(p, tip === 'brew')}${tip === 'brew' ? brewTip() : ''}</div>
  </div>`;
  return { head, body, foot };
}

/** All dungeons, season by season: each one's picture, its log and how close its Heroic is (tap one to go to
 *  its door), and for the ones still coming, the Power they'll ask of you and what they drop. */
function dungeonList(p: Profile, current: string): string {
  const h = activeHero(p), mine = h ? +ilvl(loadoutFor(p, h).score) : 10;
  const bar = (k: number): string => `<i class="dgx-bar" aria-hidden="true"><i style="width: ${(Math.min(1, k) * 100).toFixed(1)}%"></i></i>`;
  const card = (m: Act1DungeonMeta): string => {
    const live = DUNGEONS[m.id];
    const name = `<span class="dgx-card-name"><span class="dgx-num">${m.roman}</span>${esc(live?.name || m.name)}</span>`;
    if (!live) {
      return `<button type="button" class="dgx-card soon${m.id === current ? ' on' : ''}" data-act="dgpick" data-id="${esc(m.id)}" style="--dc: ${m.themeLight}" aria-label="${esc(m.name)}, coming soon"><span class="dgx-card-art">${banner(false, m.id)}<span class="dgx-soon">Soon</span>${name}</span>
        <span class="dgx-card-info"><span class="dgx-card-line${mine < m.recIlvl ? ' low' : ''}"><span>Recommended <b>Power ${m.recIlvl}</b> · ${esc(h ? h.name.split(' ')[0] : 'you')} <b class="mine">${mine}</b></span>${bar(mine / m.recIlvl)}</span>
          <span class="dgx-card-sub">Drops up to <b>Power ${m.dropsIlvl}</b> · its log gives <b>${esc(m.prizeName)}</b></span></span></button>`;
    }
    const { have, need } = logProgress(p, live.id), hp = heroicProgress(p, live.id);
    const ach = logAchievement(live.id), main = ach ? mainReward(ach) : null, done = !!ach && !!p.achievements[ach.id];
    const clears = p.dungeons[live.id]?.clears || 0;
    return `<button type="button" class="dgx-card${live.id === current ? ' on' : ''}" data-act="dgpick" data-id="${esc(live.id)}" style="--dc: ${m.themeLight}" aria-label="${esc(live.name)}, log ${have} of ${need}">
      <span class="dgx-card-art">${banner(false, m.id)}${name}</span>
      <span class="dgx-card-info"><span class="dgx-card-line"><span>Log <b>${have}/${need}</b></span>${bar(have / Math.max(1, need))}${main ? `<span class="dgx-prize${done ? ' got' : ''}" aria-hidden="true">${tile(main.icon)}</span>` : ''}</span>
        <span class="dgx-card-sub${mine < m.recIlvl ? ' low' : ''}">Recommended <b>Power ${m.recIlvl}</b> · ${esc(h ? h.name.split(' ')[0] : 'you')} <b class="mine">${mine}</b></span>
        <span class="dgx-card-sub">${clears ? `<b>${clears}</b> clear${clears === 1 ? '' : 's'} · ` : ''}Heroic ${heroicOpen(p, live.id) ? '<b>open</b>' : `<b>${hp.have}/${hp.need}</b> log pieces`}</span></span></button>`;
  };
  // each season under its own name, its dungeons in their order
  const seasons = [...new Set(ACT1_DUNGEONS.map(seasonOf))];
  return seasons.map((s) => `<p class="dgx-eyebrow">${esc(seasonName(s))}</p>${ACT1_DUNGEONS.filter((m) => seasonOf(m) === s).map(card).join('')}`).join('');
}

/** the arrows on the door: the dungeon before and after this one in Act 1, going round at the ends */
function steps(id: string): string {
  const n = ACT1_DUNGEONS.length, i = Math.max(0, ACT1_DUNGEONS.findIndex((m) => m.id === id));
  const nameAt = (k: number): string => { const m = ACT1_DUNGEONS[(i + k + n) % n]; return DUNGEONS[m.id]?.name || m.name; };
  return `<button type="button" class="dgx-step prev" data-act="dgstep" data-v="-1" aria-label="Previous dungeon: ${esc(nameAt(-1))}">${GLYPH.left}</button>
    <button type="button" class="dgx-step next" data-act="dgstep" data-v="1" aria-label="Next dungeon: ${esc(nameAt(1))}">${GLYPH.right}</button>`;
}

/** A dungeon still being built: its picture marked Soon, the Power it will want against your hero's, and
 *  what finishing its log will give. The gold button stays locked. */
function soonSheet(p: Profile, m: Act1DungeonMeta): { head: string; body: string; foot: string } {
  const h = activeHero(p), mine = h ? +ilvl(loadoutFor(p, h).score) : 10;
  const rw = (pic: string, name: string, cls = ''): string => `<div class="dgx-rw ${cls}"><span class="dgx-rw-pic" aria-hidden="true">${pic}</span><span><b>${esc(name)}</b></span></div>`;
  const head = `<h2><button type="button" class="dgx-namebtn" data-act="dglist" aria-label="${esc(m.name)}. All dungeons">${esc(m.name)}${GLYPH.down}</button></h2><p>${seasonTag(seasonOf(m))}Tier ${m.roman} · coming soon</p>`;
  const body = `<div class="dgx soon-dg">
    <div class="dgx-door"><div class="dgx-stage soon" style="--stage-bg: ${m.themeBg}; --stage-shape: 448 / 456; --stage-k: 1.0179">${banner(false, m.id)}<span class="dgx-soon">Soon</span>${steps(m.id)}</div></div>
    <div class="dgx-you">
      <div class="dgx-ready"><p class="dgx-gh">Recommended Power ${m.recIlvl}</p>
        <span class="dgx-card-line"><span>${esc(h ? h.name.split(' ')[0] : 'You')} <b>${mine}</b> · drops up to <b>Power ${m.dropsIlvl}</b></span><i class="dgx-bar" aria-hidden="true"><i style="width: ${(Math.min(1, mine / m.recIlvl) * 100).toFixed(1)}%"></i></i></span></div>
      <div class="dgx-rewards"><p class="dgx-rw-h">Finish its log to earn</p>
        ${rw(tile(m.prizeIcon), m.prizeName, 'main')}${rw(`<span class="dgx-ttl">${GLYPH.home}</span>`, m.lookName)}${rw(`<span class="dgx-ttl">${GLYPH.pen}</span>`, m.titleText)}</div>
    </div>
  </div>`;
  return { head, body, foot: `<button type="button" class="btn gold big dgx-enter" disabled>${GLYPH.lock}Coming soon</button>` };
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

/** the loot: the log's line, the Power it drops, what finishing it gives, then every drop by who can
 *  get it, the role you're looking at first (tap one to hold it up against what that role wears). The way into
 *  the collection log sits under the list, so on desktop it stays put while the list scrolls. */
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
  return `<div class="dgx-lootlist">${logLine(p, dg, false)}
    ${drops ? `<p class="dgx-ilvl">Drops up to <b>Power ${drops}</b>${dg.heroicOf ? ` · made for <b>Power ${drops - 2}</b>` : ''}</p>` : ''}
    ${dg.heroicOf ? `<p class="dgx-ilvl">Everything Normal drops, plus a gilding kit for every piece: any seat, <b>${fmtRate(KIT_RATE)}</b> each. Same power.</p>` : ''}
    ${ach ? rewards(ach, done) : ''}
    <div class="dgx-rows">${rows.map((r) => lootRow(p, r.label, r.role, r.drops, r.yours)).join('')}</div></div>
    <button type="button" class="btn small dgx-open" data-act="entry" data-id="${dg.id}.${dg.finalBoss}">${GLYPH.book}Open the collection log</button>`;
}

/** what the Dungeons sheet needs from the sheets around it */
export interface DungeonHost { app: App; root: HTMLElement; pick: DungeonPick; refresh(): void; close(): void }

/** the Dungeons sheet's buttons: its pages, the dungeon and its version, who goes in, your brew, and going in
 *  (with the under-powered warning's Back and Go anyway). Moving anywhere else puts the warning away. */
export function dungeonActions(d: DungeonHost): Record<string, (el: HTMLElement) => void> {
  const page = (to: DgPage): void => {
    d.pick.page = to;
    d.pick.warn = false;
    SFX.play('ui');
    d.refresh();
    const b = d.root.querySelector('.sheet-body');
    if (b) b.scrollTop = 0;
  };
  return {
    logx: () => page('loot'),
    dglist: () => page('list'),
    dgback: () => page('door'),
    dgpick: (el) => { d.pick.dungeon = el.dataset.id || 'barrow'; d.pick.heroic = false; d.pick.page = 'door'; SFX.play('ui'); d.refresh(); },
    dgstep: (el) => { dungeonStep(d.pick, +(el.dataset.v || 1)); SFX.play('ui'); d.refresh(); },
    diff: (el) => { d.pick.heroic = el.dataset.v === 'heroic'; d.pick.warn = false; SFX.play('ui'); d.refresh(); },
    // tapping what a tip points at is the tip seen
    seats: () => { seenTip(d, 'warband'); page('heroes'); },
    brews: () => { seenTip(d, 'brew'); page('brews'); },
    tipok: (el) => { finishTip(d.app.p, el.dataset.tip === 'brew' ? 'brew' : 'warband'); SFX.play('ui'); d.app.save(); },
    brewpick: (el) => {
      const p = d.app.p, id = el.dataset.id || null;
      p.vale.drink = id && RECIPES[id] ? id : null;
      d.pick.page = 'door';
      SFX.play(id ? 'clink' : 'ui');
      d.app.save();
    },
    playseat: (el) => {
      const h = heroById(d.app.p, el.dataset.id || null); if (!h) return;
      setActive(d.app.p, h.id); d.pick.page = 'door'; SFX.play('place'); d.app.save();
    },
    newseat: (el) => {
      const r = el.dataset.role as RoleId;
      // the Warband tip stays up until the last bot seat gets a hero (or you tap Later)
      if (seats(d.app.p, false).filter((s) => !s.hero).length <= 1) seenTip(d, 'warband');
      SFX.play('ui'); d.close(); d.app.showCreate(r);
    },
    go: () => goIn(d, false),
    goanyway: () => goIn(d, true),
    warnback: () => { d.pick.warn = false; SFX.play('ui'); d.refresh(); },
  };
}

/** a door tip is showing and you tapped what it points at (or went in): it's seen */
function seenTip(d: DungeonHost, tip: DoorTip): void {
  if (doorTip(d.app.p, d.pick.heroic) !== tip) return;
  finishTip(d.app.p, tip);
  d.app.store.save();
}

/** the arrows (and the arrow keys): to the dungeon before or after this one on the ladder, on its Normal door */
export function dungeonStep(pick: DungeonPick, by: number): void {
  const n = ACT1_DUNGEONS.length, i = Math.max(0, ACT1_DUNGEONS.findIndex((m) => m.id === (pick.dungeon || 'barrow')));
  pick.dungeon = ACT1_DUNGEONS[(((i + by) % n) + n) % n].id;
  pick.heroic = false;
  pick.page = 'door';
  pick.warn = false;
}

/** Escape puts the warning away, or goes back to the door from an inner page; true when it did */
export function dungeonBack(pick: DungeonPick): boolean {
  if (pick.warn) { pick.warn = false; return true; }
  if (pick.page === 'door') return false;
  pick.page = 'door';
  return true;
}

/** Into the dungeon from the entrance: Normal, or Heroic when your group may. A hero short of the dungeon's
 *  recommended Power gets the warning instead, each tap, until they choose Go anyway (`anyway`): then that
 *  dungeon lets them straight in until the page is reloaded. */
function goIn(d: DungeonHost, anyway: boolean): void {
  const pr = d.pick, app = d.app;
  const { dg, open } = pickedDungeon(app.p, pr, app.dev.allOpen);
  if (!open || (pr.heroic && partyProblem(groupOf(app.p), { heroic: true }) && !app.dev.allOpen)) { SFX.play('nope'); return; }
  const h = activeHero(app.p), braved = (pr.braved ||= []);
  if (anyway && !braved.includes(dg.id)) braved.push(dg.id);
  if (h && !braved.includes(dg.id) && underPowered(app.p, h, dg)) {
    pr.warn = true;
    SFX.play('nope');
    d.refresh();
    d.root.querySelector<HTMLElement>('[data-act="warnback"]')?.focus({ preventScroll: true });
    return;
  }
  pr.warn = false;
  // going in with a tip up is the tip seen (the run saves as it starts)
  const tip = doorTip(app.p, pr.heroic);
  if (tip) finishTip(app.p, tip);
  SFX.play('ui');
  app.startRun({ dungeon: dg.heroicOf || dg.id, start: 'entrance', testRar: null, heroic: pr.heroic });
}

/** over the gold button: the Power the dungeon wants and yours, green once you have it (a Heroic has none yet) */
function powerLine(p: Profile, h: Hero, dg: DungeonInfo): string {
  if (!dg.recIlvl) return '';
  const mine = wholeIlvl(loadoutFor(p, h).score), ok = mine >= dg.recIlvl;
  return `<p class="dgx-power${ok ? ' ok' : ''}">${ok ? GLYPH.check : ''}Recommended <b>Power ${dg.recIlvl}</b> · ${esc(h.name.split(' ')[0])} <b class="mine">${mine}</b></p>`;
}

/** the warning in the gold button's place: your Power against what the dungeon wants, how likely a wipe is,
 *  and the two ways on. A warning, never a lock. */
function warning(base: DungeonInfo, g: PowerGap): string {
  return `<div class="dgx-warn" role="alert"><p>${GLYPH.warn}<span>You’re Power ${g.have}. ${esc(base.name.split(' ')[0])} wants Power ${g.want}. <b>${g.likely ? 'You’ll very likely be wiped.' : 'You might be wiped.'}</b></span></p>
    <div class="dgx-warn-acts"><button type="button" class="btn small" data-act="warnback">Back</button><button type="button" class="btn small gold" data-act="goanyway">Go anyway</button></div></div>`;
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

/** The door: your party standing in front of the dungeon's door, its final boss behind them. On Normal your
 *  own Warband heroes fill the other seats in their own gear, or a bot where you have no hero of that role;
 *  on Heroic the other seats wait for friends. Each hero's name plate is a button for Who goes in. `warband`:
 *  the first time here, the other seats glow and a tip under the door says who they are. */
function door(p: Profile, base: DungeonInfo, heroic: boolean, diff: string, warband = false): string {
  const st = base.stage;
  if (!st) return `<div class="dgx-art">${banner(heroic, base.id)}${diff}</div>`;
  const h = activeHero(p);
  const cast = seats(p, heroic).map((s) => {
    const you = !!h && s.hero?.id === h.id;
    if (heroic && !you) return { role: s.role, sprite: null, name: 'Friend', tag: '', label: '' };
    if (s.hero) return { role: s.role, sprite: heroSprite(s.hero, s.role, p), name: s.hero.name.split(' ')[0], tag: you ? 'You' : '', label: `${s.hero.name}, ${word(s.role)}, Power ${ilvl(loadoutFor(p, s.hero).score)}${you ? ', playing' : ''}` };
    // a bot wears what bots in your party wear: plain gear as good as yours on average
    const bot = s.bot || ROLES[s.role].name;
    return { role: s.role, sprite: botSprite(s.role, h ? partyRar(p, h) : 0), name: bot, tag: 'Bot', label: `${bot}, a bot, as ${word(s.role)}` };
  });
  const plates = cast.map((c, i) => {
    const at = seatAt(st, i), style = `left: ${at.left.toFixed(2)}%; --feet: ${at.feet.toFixed(2)}%`;
    if (!c.sprite) return `<span class="dgx-seat open r-${c.role}" style="${style}"><span class="dgx-ghost" aria-hidden="true">${GLYPH.plus}</span><span class="dgx-plate">${esc(c.name)}</span></span>`;
    return `<button type="button" class="dgx-seat r-${c.role}${c.tag === 'You' ? ' me' : warband ? ' tip' : ''}" style="${style}" data-act="seats" aria-label="${esc(c.label)}. Change who goes in">${c.tag ? `<span class="dgx-tag${c.tag === 'Bot' ? ' bot' : ''}">${c.tag}</span>` : ''}<span class="dgx-plate">${esc(c.name)}</span></button>`;
  }).join('');
  return `<div class="dgx-door${heroic ? ' heroic' : ''}"><div class="dgx-stage${heroic ? ' heroic' : ''}" style="--stage-bg: ${st.bg}; --stage-shape: ${stageShape(st)}; --stage-k: ${(st.view[3] / st.view[2]).toFixed(4)}"><div class="dgx-stage-in">${stageSvg(base.id, st, heroic, cast.map((c) => c.sprite))}${plates}</div>${diff}</div>
    ${heroic ? '<p class="dgx-note">Heroic needs 2 players. A bot fills the last seat.</p>' : ''}${warband ? warbandTip(p) : ''}</div>`;
}

/** The first time at the door: who comes with you. Your other heroes take the other seats in their own gear,
 *  and a bot stands in for a role you have no hero for yet (its button makes one, and comes back here). */
function warbandTip(p: Profile): string {
  // a gold button for each seat a bot is filling (as many as there are free beds); making them is the point
  const free = MAX_HEROES - p.roster.length;
  const bots = seats(p, false).filter((s) => !s.hero).slice(0, Math.max(0, free));
  const make = bots.map((b) => `<button type="button" class="btn small gold" data-act="newseat" data-role="${b.role}">${GLYPH.plus}Make a ${esc(word(b.role))}</button>`).join('');
  const any = seats(p, false).some((s) => !s.hero);
  return `<div class="dgx-tip" role="note">
    <p class="dgx-tip-h"><span class="dgx-tip-new">New</span><b>Your Warband</b>${make ? '<button type="button" class="dgx-tip-later" data-act="tipok" data-tip="warband">Later</button>' : ''}</p>
    <p>Your other heroes fill these seats, in their own gear: better gear on them, faster runs. ${any ? 'A bot stands in until you make one.' : 'Tap a name to swap who goes in.'}</p>
    <div class="dgx-tip-acts${make ? ' make' : ''}">${make || '<button type="button" class="btn small gold" data-act="tipok" data-tip="warband">Got it</button>'}</div></div>`;
}

/** your first bottle: it's poured as you go in, for the whole party */
const brewTip = (): string => `<div class="dgx-tip one" role="note">
    <p class="dgx-tip-h"><span class="dgx-tip-new">New</span><b>Your Brew</b></p>
    <p>One bottle is poured as you go in. It helps the whole party for the run.</p>
    <div class="dgx-tip-acts"><button type="button" class="btn small gold" data-act="tipok" data-tip="brew">Got it</button></div></div>`;

/** Who goes in: every hero by role, who you're playing and who comes along with you. Tap one to play them;
 *  for each other seat the hero of that role you played last comes along (a bot where you have none). */
function heroesPage(p: Profile, heroic: boolean, open: boolean): string {
  // until your Warband opens (warband.ts), bots take the other seats and no more heroes can be made
  const h = activeHero(p), room = open ? MAX_HEROES - p.roster.length : 0;
  const groups = ORDER.map((r) => {
    const list = heroesFor(p, r), along = !heroic && h && roleOf(h) !== r ? list[0] : null;
    const rows = list.map((x) => heroRow(p, x, r, x.id === h?.id ? 'You' : x.id === along?.id ? 'Comes along' : ''));
    if (!list.length) {
      rows.push(`<div class="dgx-hero none r-${r}"><span class="dgx-hfig" aria-hidden="true">${heroImg(botSprite(r, h ? partyRar(p, h) : 0), { cls: 'dgx-himg' })}</span><span class="dgx-hname"><b>No ${esc(word(r))} yet</b><small>${esc(ROLES[r].name)}, a bot, ${heroic ? 'can stand in' : 'comes along'}</small></span></div>`);
      if (room) rows.push(`<button type="button" class="dgx-hero new r-${r}" data-act="newseat" data-role="${r}"><span class="dgx-hfig" aria-hidden="true">${GLYPH.plus}</span><span class="dgx-hname"><b>Make a ${esc(word(r))}</b><small>${room} bed${room === 1 ? '' : 's'} free</small></span></button>`);
    }
    return `<section class="dgx-group r-${r}"><p class="dgx-gh"><i aria-hidden="true"></i>${esc(ROLES[r].title)}</p><div class="dgx-heroes">${rows.join('')}</div></section>`;
  }).join('');
  const more = room && ORDER.every((r) => heroesFor(p, r).length)
    ? `<button type="button" class="dgx-hero new" data-act="newhero"><span class="dgx-hfig" aria-hidden="true">${GLYPH.plus}</span><span class="dgx-hname"><b>New hero</b><small>${room} bed${room === 1 ? '' : 's'} free</small></span></button>`
    : '';
  const note = heroic ? 'On Heroic your other heroes stay home: friends take the seats.' : open ? 'Tap a hero to play them. The others come along.' : warbandWhy(p);
  return `${groups}${more}<p class="dgx-note">${open || heroic ? '' : GLYPH.lock}${esc(note)}</p>`;
}

/** one of your heroes on Who goes in: their picture, name and Power, and whether they're you or coming along */
function heroRow(p: Profile, x: Hero, role: RoleId, tag: string): string {
  return `<button type="button" class="dgx-hero r-${role}${tag === 'You' ? ' me' : ''}" data-act="playseat" data-id="${esc(x.id)}">
    <span class="dgx-hfig" aria-hidden="true">${heroImg(heroSprite(x, role, p), { cls: 'dgx-himg' })}</span>
    <span class="dgx-hname"><b>${esc(x.name)}</b><small>Power ${ilvl(loadoutFor(p, x).score)}</small></span>${tag ? `<span class="dgx-htag${tag === 'You' ? ' you' : ''}">${tag}</span>` : ''}</button>`;
}

/** the brew you'll pour at the door, if you have one: a single button with what it does in a few words,
 *  and how many bottles you have. It opens the Brews page. */
const drinkOf = (p: Profile): string | null => (p.vale.drink && (p.vale.shelf[p.vale.drink] || 0) > 0 ? p.vale.drink : null);
function brewButton(p: Profile, tip = false): string {
  if (!RECIPE_ORDER.some((id) => (p.vale.shelf[id] || 0) > 0)) return '';
  const id = drinkOf(p), r = id ? RECIPES[id] : null;
  return `<button type="button" class="dgx-brew${r ? '' : ' none'}${tip ? ' tip' : ''}" data-act="brews" ${r ? `style="--c: ${r.color}"` : ''} aria-label="Brew: ${esc(r ? `${r.name}, ${r.short}` : 'none')}. Change brew">
    ${r ? `<span class="tile" aria-hidden="true">${tile(r.icon)}</span>` : `<span class="tile dgx-pot" aria-hidden="true">${GLYPH.pot}</span>`}
    <span class="dgx-bname"><b>${esc(r ? r.name : 'No brew')}</b><small>${esc(r ? r.short : 'Go in as you are')}</small></span>
    ${r ? `<span class="dgx-count">×${p.vale.shelf[r.id]}</span>` : ''}<span class="dgx-go" aria-hidden="true">${GLYPH.right}</span></button>`;
}

/** Your brew: every bottle on your shelf, with all it does. One serves the whole party for a run. */
function brewsPage(p: Profile): string {
  const drink = drinkOf(p);
  const opt = (id: string | null): string => {
    const r = id ? RECIPES[id] : null;
    return `<button type="button" class="dgx-bopt" role="radio" aria-checked="${drink === id}" data-act="brewpick" data-id="${id || ''}" ${r ? `style="--c: ${r.color}"` : ''}>
      ${r ? `<span class="tile" aria-hidden="true">${tile(r.icon)}</span>` : `<span class="tile dgx-pot" aria-hidden="true">${GLYPH.pot}</span>`}
      <span class="dgx-bname"><b>${esc(r ? r.name : 'No brew')}${r ? ` <span class="dgx-count">×${p.vale.shelf[r.id]}</span>` : ''}</b><small>${esc(r ? r.desc : 'Go in as you are.')}</small></span></button>`;
  };
  const have = RECIPE_ORDER.filter((id) => (p.vale.shelf[id] || 0) > 0);
  return `<div class="dgx-bopts" role="radiogroup" aria-label="Brew, one bottle a run">${opt(null)}${have.map(opt).join('')}</div>
    <p class="dgx-note">One bottle serves the whole party for a run.</p>`;
}

/** the dungeon's picture: its bosses in the crypt, in the green light of the Gravekeeper's lantern
 *  (gold for Heroic, moonlit cyan for Moonmere). A dungeon after the Barrow with a door (its stage) shows that:
 *  its door, its final boss in the doorway, in its own light. */
const BANNERS: Record<string, string> = {};
const banner = (heroic: boolean, dgId = 'barrow'): string => {
  const key = `${dgId}:${heroic}`;
  const meta = ACT1_DUNGEONS.find((m) => m.id === dgId) || ACT1_DUNGEONS[0];
  const light = heroic ? '#F2C230' : meta.themeLight;
  const st = dgId !== 'barrow' ? DUNGEONS[dgId]?.stage : undefined;
  return (BANNERS[key] ||= st ? stageBanner(st, light, `dgx-glow-${dgId}-${heroic ? 'h' : 'n'}`) : bannerSvg(light, meta.themeBg, `dgx-glow-${dgId}-${heroic ? 'h' : 'n'}`));
};
/* a door's stage as a card's wide picture: its dark, light and floor, the door, the boss and what stands in front */
function stageBanner(st: DungeonStage, light: string, id: string): string {
  const put = (pc: { sprite: string; x: number; y: number; k?: number; flip?: boolean }): string => placeSprite(pc.sprite, pc.x, pc.y, { k: pc.k, flip: pc.flip });
  const o: string[] = [`<rect x="0" y="0" width="640" height="300" style="fill: ${st.bg}"/>`, `<circle cx="${st.light.x}" cy="${st.light.y}" r="${st.light.r}" style="fill: url(#${id})"/>`];
  o.push(`<path d="M-4 ${st.floor.y} H644 V304 H-4 Z" style="fill: ${st.floor.color}; stroke: #1E1A1A; stroke-width: 4"/>`);
  o.push(...st.back.map(put), put(st.boss), ...st.front.map(put));
  o.push('<rect x="0" y="0" width="640" height="300" style="fill: url(#dgx-vig)"/>');
  return `<svg class="dgx-svg" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <radialGradient id="${id}"><stop offset="0" stop-color="${light}" stop-opacity="0.42"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    <radialGradient id="dgx-vig" cx="50%" cy="42%" r="72%"><stop offset="0.62" stop-color="#140E18" stop-opacity="0"/><stop offset="1" stop-color="#140E18" stop-opacity="0.6"/></radialGradient>
  </defs>${o.join('')}</svg>`;
}
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
