/**
 * One thing's sheet, opened from the collection log, the dungeon picker or the gear doll. A piece of
 * gear is held up against what its role wears now (your hero of that role, the one you played last, or
 * what a new one would start in): better or worse at a glance, then what changes, then what the piece
 * gives and does on its own. Pets, mounts, trophies and looks say what they are and where they come from.
 */
import { DUNGEONS, SETS, thing } from '../content';
import { ROLES } from '../content/roles';
import { ROLE_SLOTS } from '../content/gear';
import type { CollectibleKind, ItemDef, RoleId } from '../content/types';
import { PLACES } from '../content/vale';
import { compareFor, compareOn, floorWorn, itemShare, wearerOf, type Compare, type Effect, type Verdict } from '../meta/gear';
import { spotById, spotOf } from '../meta/hearth';
import type { Profile } from '../meta/profile';
import { cap, esc, fmtDate, fmtN, fmtRate, GLYPH } from './dom';
import { colourOf, iconOf, nameOf, rarLook } from './art';

export const KIND_WORD: Record<CollectibleKind, string> = { pet: 'Pets', mount: 'Mounts', trophy: 'Trophies', banner: 'Banners', cosmetic: 'Looks' };
/** what power does for each seat, in plain words */
export const ROLE_STAT: Record<RoleId, { main: string; short: string }> = {
  tank: { main: 'damage and threat', short: 'damage' },
  healer: { main: 'healing', short: 'healing' },
  dps: { main: 'damage', short: 'damage' },
};

/** where a Vale rare comes from: its table, and the counter that is its kill count */
function valeSource(id: string): { rate: number; key: string; word: string } | null {
  for (const pl of Object.values(PLACES)) {
    for (const n of pl.nodes) { const d = n.table.find((x) => x.id === id); if (d) return { rate: d.rate, key: `vale.${pl.id}.${n.id}`, word: `harvested the ${n.name.toLowerCase()}` }; }
    const d = pl.errandTable.find((x) => x.id === id);
    if (d) return { rate: d.rate, key: `vale.${pl.id}.errands`, word: `done ${pl.villager.name.split(' ')[0]}’s errands` };
  }
  return null;
}

export function itemSheet(p: Profile, id: string, hasBack: boolean): { head: string; body: string } {
  const t = thing(id);
  const e = p.collection[id];
  let kind = '', side = '', more = '', vs = '', act = '';
  if (t?.kind === 'item') {
    const d: ItemDef = t.def;
    const look = rarLook(id);
    kind = d.kind === 'unique' ? `Unique ${ROLE_SLOTS[d.role][d.slot].name.toLowerCase()} · ${ROLES[d.role].title}` : d.kind === 'set' ? `Epic · ${SETS[d.setId!].name} set · ${ROLES[d.role].title} ${d.slot}` : `${look.name} ${d.slot}`;
    const cmp = held(p, d);
    if (cmp) { vs = cmp.html; act = cmp.act; }
    // what the piece gives on its own, next to its picture
    const share = itemShare(d);
    side = `<div class="stats"><span class="chip">Item level <b>${share.ilvl}</b></span>${share.power > 0 ? `<span class="chip">${esc(cap(ROLE_STAT[d.role].main))} <b>+${share.power}%</b></span><span class="chip">Health <b>+${share.health}%</b></span>` : ''}</div>`;
    // the effect is already in the comparison when wearing it would add it
    if (d.effectDesc && !cmp?.c.gains.some((x) => x.kind === 'unique')) more += `<div class="box"><b style="font-family: var(--f-display); font-weight: 400">When worn</b><span class="fine">${esc(d.effectDesc)}</span></div>`;
    if (d.setId) { const s = SETS[d.setId]; more += `<div class="box setbox"><b style="font-family: var(--f-display); font-weight: 400">${esc(s.name)} set</b><div class="setline"><i>2</i><span>${esc(s.bonus2.desc)}</span></div><div class="setline later"><i>3</i><span>${esc(s.bonus3.desc)}</span></div></div>`; }
    if (d.flavor) more += `<p class="fine it-fl">“${esc(d.flavor)}”</p>`;
  } else if (t?.kind === 'collectible') {
    kind = KIND_WORD[t.def.kind];
    side = `<p class="lede">${esc(t.def.desc)}</p>`;
  }
  let source = '';
  for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) for (const d of tb.drops) if (d.id === id) source = `${dg.heroicOf ? 'Heroic: ' : ''}${dg.bosses.find((b) => b.id === tb.boss)?.name}, ${fmtRate(d.rate)}${d.role ? ` (${ROLES[d.role].title})` : ''}`;
  if (!source && t?.kind === 'collectible') source = t.def.source;
  const kc = (() => { for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) if (tb.drops.some((d) => d.id === id)) return p.bosses[`${dg.id}.${tb.boss}`]?.kc || 0; return null; })();
  const vsrc = valeSource(id);
  const got = e ? `Got it${e.kc ? ` at ${vsrc ? 'count' : 'kill count'} ${fmtN(e.kc)}` : ''} on ${fmtDate(e.at)}${e.n > 1 ? `. Seen ${e.n} times.` : '.'}`
    : kc !== null ? `Not yet. Your kill count is ${fmtN(kc)}.` : vsrc ? `Not yet. You’ve ${vsrc.word} ${fmtN(p.counters[vsrc.key] || 0)} times.` : 'Not yet.';
  const spot = e ? spotOf(p, id) : null;
  const acts = [hasBack ? `<button type="button" class="btn small" data-act="back">${GLYPH.left}Back</button>` : '', act].filter(Boolean).join('');
  const body = `<div class="detail"><span class="tile" aria-hidden="true" style="box-shadow: 0 3px 0 var(--ink), inset 0 0 0 4px ${colourOf(id)}">${iconOf(id)}</span>
      <div class="detail-side">${side}</div></div>
    ${vs}${more}
    <div class="stats"><span class="chip">From <b>${esc(source || 'Unknown')}</b></span></div>
    <p class="fine">${esc(got)}${spot ? ` It is in your house: ${esc(spotById(spot)?.label.toLowerCase() || '')}.` : ''}</p>
    ${acts ? `<div class="actions">${acts}</div>` : ''}`;
  return { head: `<h2>${esc(nameOf(id))}</h2><p>${esc(kind)}</p>`, body };
}

/** each verdict's word, its colour class and its mark */
const VERDICT: Record<Verdict, { word: string; cls: string; mark: string }> = {
  better: { word: 'Upgrade', cls: 'up', mark: GLYPH.rise },
  worse: { word: 'Downgrade', cls: 'down', mark: GLYPH.fall },
  same: { word: 'Same power', cls: 'same', mark: GLYPH.same },
  mixed: { word: 'A trade', cls: 'mixed', mark: GLYPH.swap },
  wearing: { word: 'Wearing it', cls: 'on', mark: GLYPH.check },
};

/** a change as a coloured tag: green and up, red and down, or the same */
function tag(n: number, unit = ''): string {
  if (n > 0) return `<b class="cmp-d up">${GLYPH.rise}+${n}${unit}</b>`;
  if (n < 0) return `<b class="cmp-d down">${GLYPH.fall}−${Math.abs(n)}${unit}</b>`;
  return '<b class="cmp-d">Same</b>';
}

/** the piece held up against what its role wears: the verdict, what it replaces, what changes, and
 *  (when you own it) a way to the gear doll to put it on */
function held(p: Profile, d: ItemDef): { html: string; act: string; c: Compare } {
  const h = wearerOf(p, d);
  const c = (h && compareFor(p, h, d.id)) || compareOn(floorWorn(p, d.role), d.role, d);
  const who = h ? h.name.split(' ')[0] : `a new ${d.role === 'dps' ? 'DPS' : ROLES[d.role].title.toLowerCase()}`;
  const v = VERDICT[c.verdict];
  const top = `<div class="cmp-verdict">${v.mark}<b>${v.word}</b><span>${c.verdict === 'wearing' ? `${esc(who)} has it on` : `for ${esc(who)}`}</span></div>`;
  const act = h && p.collection[d.id] && c.verdict !== 'wearing' ? `<button type="button" class="btn small gold" data-act="gearat" data-hero="${esc(h.id)}" data-slot="${d.slot}">${GLYPH.shield}Open in Gear</button>` : '';
  if (c.verdict === 'wearing') return { html: `<section class="cmp v-on" aria-label="Against what you wear">${top}</section>`, act, c };
  const now = c.now.def, nl = rarLook(now.id);
  const rows = [`<div class="cmp-row"><span>Item level <small>${c.ilvl[0]} → ${c.ilvl[1]}</small></span>${tag(c.ilvl[1] - c.ilvl[0])}</div>`];
  if (c.power) rows.push(`<div class="cmp-row"><span>${esc(cap(ROLE_STAT[d.role].main))}</span>${tag(c.power, '%')}</div>`);
  if (c.health) rows.push(`<div class="cmp-row"><span>Health</span>${tag(c.health, '%')}</div>`);
  if (c.set && d.setId) rows.push(`<div class="cmp-row"><span>${esc(SETS[d.setId].name)} set <small>${c.set[0]} → ${c.set[1]} of 3</small></span>${tag(c.set[1] - c.set[0])}</div>`);
  const fx = (x: Effect, gain: boolean): string => `<li class="${gain ? 'gain' : 'loss'}${x.later ? ' later' : ''}"><i aria-hidden="true">${gain ? '+' : '−'}</i><span><b>${esc(x.name)}${x.kind === 'trait' ? ' trait' : ''}</b> ${esc(x.desc)}${x.later ? ' <em>Coming in a later update.</em>' : ''}</span></li>`;
  const effects = c.gains.length || c.loses.length ? `<ul class="cmp-fx" aria-label="What it adds and takes away">${c.gains.map((x) => fx(x, true)).join('')}${c.loses.map((x) => fx(x, false)).join('')}</ul>` : '';
  const html = `<section class="cmp v-${v.cls}" aria-label="Against what ${esc(who)} wears">${top}
    <div class="cmp-now"><span class="tile" aria-hidden="true" style="--c: ${nl.color}">${iconOf(now.id)}</span><span><small>Instead of</small><b style="color: ${nl.ink}">${esc(now.name)}</b><small>${esc(nl.name)}</small></span></div>
    <div class="cmp-rows">${rows.join('')}</div>${effects}</section>`;
  return { html, act, c };
}
