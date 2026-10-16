/**
 * The Logs sheet: the collection log (logbook.ts: each dungeon's log as a wardrobe, the garden, the other
 * rewards), the achievements, Bramblewick's story (if you found any of it) and the stats, with its buttons
 * (logActions) and the closer look at a slot riding over it (logpeek.ts). The sheets mark what you've seen.
 * And the paddock's page: every mount in the game, which the paddock opens when you tap it from far away.
 */
import { ACHIEVEMENT_LIST, COLLECTIBLES, DUNGEONS } from '../content';
import type { RaceId } from '../content/folk';
import { ROLES } from '../content/roles';
import type { Tier } from '../content/types';
import { LORE } from '../content/vale';
import { maxPoints, points, progress } from '../meta/achievements';
import { paddock } from '../meta/hearth';
import type { Profile } from '../meta/profile';
import { skillRank } from '../meta/vale';
import { esc, fmtDate, fmtN, fmtT } from './dom';
import { colourOf, iconOf, nameOf } from './art';
import { collectionLog, type LogView } from './logbook';
import { peekCard } from './logpeek';
import { SFX } from './sound';
import type { App } from './app';
import type { SheetSpec } from './sheets';

export type LogTab = 'collection' | 'achievements' | 'lore' | 'stats';
export const LOG_TABS: LogTab[] = ['collection', 'achievements', 'lore', 'stats'];
const TIER_ORDER: Tier[] = ['log', 'bronze', 'silver', 'gold', 'meta', 'hidden'];
const TIER_WORD: Record<Tier, string> = { log: 'Collection logs', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', meta: 'Mastery', hidden: 'Hidden' };

/** The sheet for a tab. `heroic` is whether the collection log shows the heroic logs; a page asked for from
 *  the other version switches it, and the sheet hands back what it is now. `over` is the closer look at a
 *  slot, drawn over the sheet. */
export function logsSheet(p: Profile, tab: LogTab, entry: string | undefined, heroic: boolean, view: LogView): { head: string; tabs: string; body: string; heroic: boolean; over: string } {
  const word: Record<LogTab, string> = { collection: 'Collection log', achievements: 'Achievements', lore: 'Story', stats: 'Stats' };
  // the story tab only shows if you found pages of Bramblewick's story back when you rode out
  const tabs = `<div class="tabs" role="tablist">${LOG_TABS.filter((t) => t !== 'lore' || p.vale.lore.length || tab === 'lore').map((t) => `<button type="button" class="tab" role="tab" data-act="tab" data-tab="${t}" aria-selected="${t === tab}">${word[t]}</button>`).join('')}</div>`;
  let body: string, h = heroic;
  if (tab === 'collection') ({ html: body, heroic: h } = collectionLog(p, entry, heroic, view));
  else body = tab === 'stats' ? stats(p) : tab === 'lore' ? lore(p) : achievements(p);
  const over = tab === 'collection' && view.peek ? peekCard(p, view.peek, entry?.includes('.set.') ? entry : undefined) : '';
  return { head: '<h2>Logs</h2>', tabs, body, heroic: h, over };
}

/** what the Logs sheet's buttons need from the sheets: what the page remembers, and the ways to move */
export interface LogHost { app: App; root: HTMLElement; view: LogView; open(spec: SheetSpec): void; refresh(): void; close(): void }

/** the Logs sheet's buttons: its tabs and pages, Try it on, the closer look (focus goes into it, and back to
 *  what opened it), and a finished log's way in */
export function logActions(h: LogHost): Record<string, (el: HTMLElement) => void> {
  const reset = (): void => { h.view.tryOn = false; h.view.peek = null; };
  return {
    tab: (el) => { reset(); SFX.play('ui'); h.open({ kind: 'logs', tab: el.dataset.tab as LogTab }); },
    entry: (el) => { reset(); SFX.play('ui'); h.open({ kind: 'logs', tab: 'collection', ...(el.dataset.id ? { entry: el.dataset.id } : {}) }); },
    tryon: () => { h.view.tryOn = !h.view.tryOn; SFX.play('ui'); h.refresh(); },
    peek: (el) => { h.view.peek = el.dataset.id || null; SFX.play('ui'); h.refresh(); h.root.querySelector<HTMLElement>('.pk-x')?.focus({ preventScroll: true }); },
    peekclose: () => {
      const id = h.view.peek;
      h.view.peek = null;
      SFX.play('ui');
      h.refresh();
      if (id) h.root.querySelector<HTMLElement>(`[data-act="peek"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    },
    makerace: (el) => { SFX.play('ui'); h.close(); h.app.showCreate(undefined, el.dataset.race as RaceId); },
    putlook: () => { SFX.play('ui'); h.open({ kind: 'looks' }); },
  };
}

/** Every mount in the game, in the paddock's order: yours lit up with when you got it, the rest dark with
 *  where they come from. Tap one for its card. */
export function mountsSheet(p: Profile): { head: string; body: string } {
  const ms = paddock(p), have = ms.filter((m) => m.owned).length;
  const grid = ms.map(({ id }) => {
    const c = p.collection[id];
    const cap = c ? (c.kc ? `KC ${fmtN(c.kc)}` : 'Owned') : COLLECTIBLES[id]?.source || '';
    return `<button type="button" class="cl-it ${c ? 'got' : 'miss'}" data-act="item" data-id="${id}" title="${esc(nameOf(id))}" aria-label="${esc(nameOf(id))}${c ? ', in your paddock' : ', not yet'}" style="--rc: ${colourOf(id)}">
      <span class="tile" aria-hidden="true">${iconOf(id)}</span><span class="n">${esc(nameOf(id))}</span><span class="m">${esc(cap)}</span></button>`;
  }).join('');
  return { head: `<h2>Mounts</h2><p>${have} of ${ms.length} in your paddock</p>`, body: `<div class="cl-grid">${grid}</div><p class="fine">Every mount in the game has a place in the paddock. Tap one for where it comes from.</p>` };
}

function stats(p: Profile): string {
  let out = '';
  for (const dg of Object.values(DUNGEONS)) {
    const rec = p.dungeons[dg.id];
    out += `<h3 class="section-title">${esc(dg.name)}</h3>
      <div class="stats"><span class="chip">Runs <b>${rec ? rec.runs : 0}</b></span><span class="chip">Clears <b>${rec ? rec.clears : 0}</b></span><span class="chip">Best <b>${fmtT(rec?.pb)}</b></span></div>`;
    for (const b of dg.bosses) {
      const r = p.bosses[`${dg.id}.${b.id}`];
      out += `<div class="stats"><span class="chip">${esc(b.name)} <b>KC ${r ? fmtN(r.kc) : 0}</b></span><span class="chip">Fastest <b>${fmtT(r?.pb)}</b></span><span class="chip">Wipes <b>${r ? r.wipes : 0}</b></span></div>`;
    }
  }
  if (p.roster.length) {
    out += `<h3 class="section-title">Heroes</h3><div class="stats">${p.roster.map((h) => `<span class="chip">${esc(h.name)} <b>${fmtN(h.clears)} clear${h.clears === 1 ? '' : 's'}</b></span>`).join('')}</div>`;
  }
  const c = p.counters;
  const row = (k: string, label: string) => `<span class="chip">${label} <b>${fmtN(c[k] || 0)}</b></span>`;
  out += `<h3 class="section-title">The garden</h3><div class="stats">${row('vale.seeds', 'Seeds found')}${row('vale.planted', 'Planted')}${row('vale.harvests', 'Harvests')}${row('vale.perfects', 'Perfects')}${row('vale.brews', 'Brews')}<span class="chip">Gathering <b>${skillRank(p, 'gather')}</b></span><span class="chip">Brewing <b>${skillRank(p, 'brew')}</b></span></div>`;
  out += `<h3 class="section-title">Lifetime</h3><div class="stats">${row('kills', 'Kills')}${row('barrow.skeletons', 'Skeletons')}${row('barrow.wisps', 'Wisps sliced')}${row('barrow.chains', 'Chains cut')}${row('perfect_blocks', 'Perfect blocks')}${row('dodges', 'Dodges')}${row('saves', 'Saves')}${row('crits', 'Crits')}${row('biggest_crit', 'Biggest crit')}${row('deaths', 'Deaths')}${row('wipes', 'Wipes')}</div>`;
  return out;
}

function achievements(p: Profile): string {
  // a retired achievement (it can't be earned any more) shows only for whoever has it
  const shown = ACHIEVEMENT_LIST.filter((a) => !a.retired || p.achievements[a.id]);
  let out = `<div class="stats"><span class="chip">Points <b>${points(p)}</b> / ${maxPoints()}</span><span class="chip">Earned <b>${Object.keys(p.achievements).length}</b> / ${shown.length}</span><span class="chip">Titles <b>${p.titles.length}</b></span></div>`;
  for (const tier of TIER_ORDER) {
    const list = shown.filter((a) => a.tier === tier);
    if (!list.length) continue;
    out += `<h3 class="section-title">${TIER_WORD[tier]}</h3>`;
    for (const a of list) {
      const done = p.achievements[a.id];
      const secret = tier === 'hidden' && !done;
      const pr = progress(p, a);
      const role = a.role ? ` · ${ROLES[a.role].title} only` : '';
      out += `<div class="ach ${done ? '' : 'locked'}"><span class="medal ${a.tier}" aria-hidden="true">${done ? '✓' : a.points}</span>
        <div><div class="n">${secret ? '???' : esc(a.name)}</div><div class="h">${secret ? 'Hidden. You will know it when it happens.' : esc(a.how) + esc(role)}</div>${secret ? '' : `<div class="rw">${esc(a.reward.text)}</div>`}</div>
        <div class="pts">${a.points}<small>${done ? fmtDate(done.at) : 'points'}</small></div>
        ${pr && !done ? `<div class="bar" role="progressbar" aria-valuenow="${pr.have}" aria-valuemax="${pr.need}" title="${pr.have} / ${pr.need}"><i style="width: ${(pr.have / pr.need) * 100}%"></i></div>` : ''}</div>`;
    }
  }
  return out;
}

/** the pages of Bramblewick's story you found when you rode out there (no new ones come) */
function lore(p: Profile): string {
  const found = LORE.filter((l) => p.vale.lore.includes(l.id));
  return `<h3 class="section-title">Bramblewick<small>${found.length} of ${LORE.length} pages</small></h3><div class="pages">`
    + found.map((l) => `<article class="page"><b>${esc(l.title)}</b><p>${esc(l.text)}</p></article>`).join('')
    + '</div><p class="fine">Pages you found in the days you rode out to Bramblewick. They stay yours.</p>';
}
