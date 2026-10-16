/**
 * The Logs sheet: the collection log (every boss by dungeon, Normal or Heroic, each dungeon's whole log
 * with what finishing it gives at the end of its bar; the garden; the other rewards), the
 * achievements, Bramblewick's story (if you found any of it) and the stats. The sheets wire up its buttons and mark what you've seen.
 */
import { ACHIEVEMENT_LIST, COLLECTIBLES, DUNGEONS } from '../content';
import { ROLES } from '../content/roles';
import type { BossInfo, DropDef, DungeonInfo, RoleId, Tier } from '../content/types';
import { GARDEN_TABLE, LORE } from '../content/vale';
import { maxPoints, points, progress } from '../meta/achievements';
import { logAchievement, logProgress } from '../meta/logs';
import type { Profile } from '../meta/profile';
import { skillRank } from '../meta/vale';
import { esc, fmtDate, fmtN, fmtRate, fmtT, GLYPH } from './dom';
import { colourOf, iconOf, nameOf, spriteURL, tile } from './art';
import { mainReward, rewards } from './dungeonsheet';

export type LogTab = 'collection' | 'achievements' | 'lore' | 'stats';
export const LOG_TABS: LogTab[] = ['collection', 'achievements', 'lore', 'stats'];
const TIER_ORDER: Tier[] = ['log', 'bronze', 'silver', 'gold', 'meta', 'hidden'];
const TIER_WORD: Record<Tier, string> = { log: 'Collection logs', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', meta: 'Mastery', hidden: 'Hidden' };

/** one page of the collection log: a boss and what it drops, the garden's harvests and what they give, or the rewards that are not drops */
interface LogEntry { id: string; group: string; name: string; items: string[]; dg?: DungeonInfo; boss?: BossInfo; vale?: { table: DropDef[] } }

/** The sheet for a tab. `heroic` is whether the collection log shows the heroic dungeons; a page asked
 *  for from the other version switches it, and the sheet hands back what it is now. */
export function logsSheet(p: Profile, tab: LogTab, entry: string | undefined, heroic: boolean): { head: string; tabs: string; body: string; heroic: boolean } {
  const word: Record<LogTab, string> = { collection: 'Collection log', achievements: 'Achievements', lore: 'Story', stats: 'Stats' };
  // the story tab only shows if you found pages of Bramblewick's story back when you rode out
  const tabs = `<div class="tabs" role="tablist">${LOG_TABS.filter((t) => t !== 'lore' || p.vale.lore.length || tab === 'lore').map((t) => `<button type="button" class="tab" role="tab" data-act="tab" data-tab="${t}" aria-selected="${t === tab}">${word[t]}</button>`).join('')}</div>`;
  let body: string, h = heroic;
  if (tab === 'collection') ({ html: body, heroic: h } = clog(p, entry, heroic));
  else body = tab === 'stats' ? stats(p) : tab === 'lore' ? lore(p) : achievements(p);
  return { head: `<h2>Logs</h2><p>Everything you have found, killed and earned</p>`, tabs, body, heroic: h };
}

/** the collection log, OSRS style: every boss by dungeon on the left, its drops on the right. Normal or
 *  Heroic picks which version of each dungeon it shows, and each dungeon's heading is its whole log's bar
 *  with what finishing it gives at the end; tap it for those rewards. */
function clog(p: Profile, entry: string | undefined, heroicWas: boolean): { html: string; heroic: boolean } {
  // a page from the other version of a dungeon (from the Dungeons sheet, say) switches the log to it
  const logDg = Object.values(DUNGEONS).find((d) => `${d.id}.log` === entry);
  const asked = logDg || logEntries().find((e) => e.id === entry)?.dg;
  const heroic = asked ? !!asked.heroicOf : heroicWas;
  const all = logEntries().filter((e) => !e.dg || !!e.dg.heroicOf === heroic);
  const cur = all.find((e) => e.id === entry) || all[0];
  const total = new Set(all.flatMap((e) => e.items));
  const gotAll = [...total].filter((id) => p.collection[id]).length;
  let list = `<div class="seg cl-diff" role="radiogroup" aria-label="Normal or Heroic">${(['normal', 'heroic'] as const).map((v) => `<button type="button" class="sg" role="radio" data-act="logdiff" data-v="${v}" aria-checked="${(v === 'heroic') === heroic}">${v === 'heroic' ? 'Heroic' : 'Normal'}</button>`).join('')}</div>
    <p class="cl-total">Obtained <b>${gotAll}/${total.size}</b></p>`;
  let group = '';
  for (const e of all) {
    if (e.group !== group) {
      group = e.group;
      if (e.dg) {
        const pr = logProgress(p, e.dg.id), ach = logAchievement(e.dg.id), main = ach && mainReward(ach), won = !!ach && !!p.achievements[ach.id];
        list += `<button type="button" class="cl-dg${won ? ' done' : ''}" data-act="entry" data-id="${e.dg.id}.log" aria-pressed="${logDg === e.dg}"><span>${esc(group)}</span><b>${pr.have}/${pr.need}</b>
          <i class="cl-bar" aria-hidden="true"><i style="width: ${((pr.have / Math.max(1, pr.need)) * 100).toFixed(1)}%"></i></i>${main ? `<span class="cl-prize${won ? ' got' : ''}" aria-hidden="true">${tile(main.icon)}</span>` : ''}</button>`;
      } else list += `<h4 class="cl-group">${esc(group)}</h4>`;
    }
    const got = e.items.filter((id) => p.collection[id]).length;
    const fresh = e.items.some((id) => p.collection[id] && !p.seen[id]);
    list += `<button type="button" class="cl-entry ${got === e.items.length ? 'done' : got ? 'part' : ''}" data-act="entry" data-id="${e.id}" aria-current="${e === cur && !!entry}" aria-pressed="${e === cur}">
      <span>${esc(e.name)}${fresh ? '<i class="dot" aria-hidden="true"></i>' : ''}</span><b>${got}/${e.items.length}</b></button>`;
  }
  const page = logDg ? logRewards(p, logDg) : logPage(p, cur);
  return { html: `<div class="clog ${entry ? 'has-entry' : ''}"><nav class="cl-list" aria-label="Bosses and places">${list}</nav><section class="cl-page" aria-label="${esc(logDg ? logDg.name : cur.name)}">${page}</section></div>`, heroic };
}

/** a dungeon's whole log: how full it is, what finishing it gives, and what's still to find */
function logRewards(p: Profile, dg: DungeonInfo): string {
  const pr = logProgress(p, dg.id), ach = logAchievement(dg.id), done = !!ach && !!p.achievements[ach.id];
  const state = pr.have >= pr.need ? 'done' : pr.have ? 'part' : 'none';
  const left = dg.collection.filter((id) => !p.collection[id]);
  return `<button type="button" class="btn small cl-back" data-act="entry" data-id="">${GLYPH.left}Everything</button>
    <div class="cl-head plain"><div><p class="eyebrow">Collection log</p><h3>${esc(dg.name)}</h3><p class="cl-obt">Obtained: <b class="${state}">${pr.have}/${pr.need}</b></p>
      <p class="fine">Every drop for every role, so it takes a tank, a healer and a DPS of yours. What it gives is for your whole account, for keeps.</p></div></div>
    ${ach ? rewards(ach, done) : ''}
    ${left.length ? `<h3 class="section-title">Still to find</h3><div class="cl-grid">${left.map((id) => `<button type="button" class="cl-it miss" data-act="item" data-id="${id}" title="${esc(nameOf(id))}" style="--rc: ${colourOf(id)}"><span class="tile" aria-hidden="true">${iconOf(id)}</span><span class="n">${esc(nameOf(id))}</span></button>`).join('')}</div>` : ''}`;
}

function logPage(p: Profile, e: LogEntry): string {
  const got = e.items.filter((id) => p.collection[id]).length;
  const state = got === e.items.length ? 'done' : got ? 'part' : 'none';
  let head = '';
  if (e.boss && e.dg) {
    const r = p.bosses[`${e.dg.id}.${e.boss.id}`];
    head = `<div class="cl-head"><span class="art" aria-hidden="true"><img src="${spriteURL(e.boss.id)}" alt=""></span><div>
      <p class="eyebrow">${esc(e.dg.name)}</p><h3>${esc(e.boss.name)}</h3>
      <p class="cl-obt">Obtained: <b class="${state}">${got}/${e.items.length}</b></p>
      <p class="cl-kc">${esc(e.boss.name)} kills: <b>${fmtN(r?.kc || 0)}</b></p>
      <div class="stats"><span class="chip">Fastest <b>${fmtT(r?.pb)}</b></span><span class="chip">Wipes <b>${r?.wipes || 0}</b></span></div></div></div>`;
  } else if (e.vale) {
    head = `<div class="cl-head vale"><span class="art" aria-hidden="true"><img src="${spriteURL('node_glowcap')}" alt=""></span><div>
      <p class="eyebrow">${esc(e.group)}</p><h3>${esc(e.name)}</h3>
      <p class="cl-obt">Obtained: <b class="${state}">${got}/${e.items.length}</b></p>
      <p class="cl-kc">Harvests: <b>${fmtN(p.counters['vale.harvests'] || 0)}</b></p></div></div>`;
  } else {
    head = `<div class="cl-head plain"><div><p class="eyebrow">${esc(e.group)}</p><h3>${esc(e.name)}</h3><p class="cl-obt">Obtained: <b class="${state}">${got}/${e.items.length}</b></p><p class="fine">Pets, mounts, trophies, banners and looks that achievements and firsts give. Never power.</p></div></div>`;
  }
  const rateOf = (id: string): number | undefined => { if (e.vale) return e.vale.table.find((d) => d.id === id)?.rate; if (!e.dg || !e.boss) return undefined; return e.dg.loot.find((t) => t.boss === e.boss!.id)?.drops.find((d) => d.id === id)?.rate; };
  const whoOfDrop = (id: string): string | undefined => {
    if (!e.dg || !e.boss) return undefined;
    const d = e.dg.loot.find((t) => t.boss === e.boss!.id)?.drops.find((x) => x.id === id);
    if (!d?.role) return undefined;
    return d.cls === 'rogue' ? 'Rogue' : d.role === 'dps' ? 'Mage' : ROLES[d.role].title;
  };
  const grid = e.items.map((id) => {
    const c = p.collection[id];
    const isNew = c && !p.seen[id];
    const who = whoOfDrop(id);
    const ach = !e.boss && !e.vale ? ACHIEVEMENT_LIST.find((a) => a.reward.collectible === id) : undefined;
    const cap = c ? (c.kc ? `KC ${fmtN(c.kc)}` : 'Owned') : e.boss || e.vale ? `${fmtRate(rateOf(id))}${who ? ` · ${who}` : ''}` : ach ? ach.name : COLLECTIBLES[id]?.source || '';
    return `<button type="button" class="cl-it ${c ? 'got' : 'miss'} ${isNew ? 'new' : ''}" data-act="item" data-id="${id}" title="${esc(nameOf(id))}" aria-label="${esc(nameOf(id))}${c ? `, obtained${c.n > 1 ? ' ' + c.n + ' times' : ''}` : ', not yet'}" style="--rc: ${colourOf(id)}">
      <span class="tile" aria-hidden="true">${iconOf(id)}</span>${c && c.n > 1 ? `<i class="q">${fmtN(c.n)}</i>` : ''}<span class="n">${esc(nameOf(id))}</span><span class="m">${esc(cap)}</span></button>`;
  }).join('');
  return `<button type="button" class="btn small cl-back" data-act="entry" data-id="">${GLYPH.left}Everything</button>${head}<div class="cl-grid">${grid}</div>`;
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

/** every page of the collection log, in order: bosses by dungeon, then the garden, then other rewards */
function logEntries(): LogEntry[] {
  const out: LogEntry[] = [];
  for (const dg of Object.values(DUNGEONS)) {
    for (const b of dg.bosses) {
      const table = dg.loot.find((t) => t.boss === b.id);
      if (!table) continue;
      const ids = dg.collection.filter((id) => table.drops.some((d) => d.id === id));
      for (const d of table.drops) if (!ids.includes(d.id)) ids.push(d.id);
      out.push({ id: `${dg.id}.${b.id}`, group: dg.name, name: b.name, items: ids, dg, boss: b });
    }
  }
  out.push({ id: 'garden.harvests', group: 'The garden', name: 'Harvests', items: GARDEN_TABLE.map((d) => d.id), vale: { table: GARDEN_TABLE } });
  const drops = new Set([...Object.values(DUNGEONS).flatMap((d) => d.loot.flatMap((t) => t.drops.map((x) => x.id))), ...out.flatMap((e) => (e.vale ? e.items : []))]);
  out.push({ id: 'other.rewards', group: 'Other', name: 'Rewards', items: Object.values(COLLECTIBLES).filter((c) => !drops.has(c.id)).map((c) => c.id) });
  return out;
}
