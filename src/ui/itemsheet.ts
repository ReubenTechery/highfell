/**
 * One thing's sheet, opened from the collection log, the dungeon picker or the gear doll. A piece of
 * gear is held up against what its role wears now (your hero of that role, the one you played last, or
 * what a new one would start in): better or worse at a glance, then what changes, then what the piece
 * gives and does on its own, and its gilded look: where its gilding kit drops, or, once you have the piece
 * and its kit, the switch between plain and gilded. A kit's sheet is its piece, gilded. Pets, mounts,
 * trophies and looks say what they are and where they come from.
 */
import { DUNGEONS, ITEMS, KITS, SETS, rewardSource, thing } from '../content';
import { gilded } from '../content/kits';
import { ROLES } from '../content/roles';
import { ROLE_SLOTS, gearKey } from '../content/gear';
import type { AchievementDef, CollectibleKind, ItemDef, RoleId } from '../content/types';
import { FIRST_HARVEST_GIFT, GARDEN_TABLE } from '../content/vale';
import { bestRegular, compareFor, compareOn, floorWorn, gildedOn, itemShare, lookId, wearerOf, type Compare, type Effect, type Verdict } from '../meta/gear';
import { spotById, spotOf } from '../meta/hearth';
import type { Profile } from '../meta/profile';
import { cap, esc, fmtDate, fmtN, fmtRate, GLYPH } from './dom';
import { setState } from '../meta/sets';
import { setWords } from './setcard';
import { colourOf, iconOf, nameOf, rarLook } from './art';

export const KIND_WORD: Record<CollectibleKind, string> = { pet: 'Pets', mount: 'Mounts', trophy: 'Trophies', banner: 'Banners', cosmetic: 'Looks' };
/** what power does for each seat, in plain words */
export const ROLE_STAT: Record<RoleId, { main: string; short: string }> = {
  tank: { main: 'damage and threat', short: 'damage' },
  healer: { main: 'healing', short: 'healing' },
  dps: { main: 'damage', short: 'damage' },
};

/** where a garden rare comes from: its line on the harvest table, and the counter that is its kill count */
function valeSource(id: string): { rate: number; key: string; word: string } | null {
  const d = GARDEN_TABLE.find((x) => x.id === id);
  return d ? { rate: d.rate, key: 'vale.harvests', word: 'harvested the garden' } : null;
}

/** where a drop comes from: its dungeon, its boss's name and its rate */
function dropLine(id: string): { heroic: boolean; boss: string; rate: number; role?: RoleId; kc: string } | null {
  for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) for (const d of tb.drops) if (d.id === id) return { heroic: !!dg.heroicOf, boss: dg.bosses.find((b) => b.id === tb.boss)?.name || '', rate: d.rate, role: d.role, kc: `${dg.id}.${tb.boss}` };
  return null;
}

/** a piece's gilded look: where its kit drops, or that it's yours, and with the piece and its kit, the switch */
function gildBox(p: Profile, d: ItemDef): string {
  const k = KITS[gilded(d.id)], src = k && dropLine(k.id);
  if (!k || !src) return '';
  const kit = !!p.collection[k.id], own = !!p.collection[d.id], on = gildedOn(p, d.id);
  const line = kit && own ? 'Plain or gilded, the same power.' : kit ? 'Its kit is yours: when the piece drops, it comes gilded.'
    : `Its gilding kit drops in Heroic, ${fmtRate(src.rate)} from ${src.boss}, for any seat. Same power.`;
  const sw = kit && own ? `<div class="seg gild-sw" role="radiogroup" aria-label="Its look">${['Plain', 'Gilded'].map((w, i) => `<button type="button" class="sg" role="radio" data-act="gild" data-id="${esc(d.id)}" data-v="${i}" aria-checked="${on === !!i}">${w}</button>`).join('')}</div>` : '';
  return `<div class="box gild-box${on ? ' on' : ''}"><b style="font-family: var(--f-display); font-weight: 400">Gilded look</b>
    <div class="gild-row"><span class="tile${kit ? '' : ' dim'}" aria-hidden="true">${iconOf(k.id)}</span><span class="fine">${esc(line)}</span></div>${sw}</div>`;
}

export function itemSheet(p: Profile, id: string, hasBack: boolean): { head: string; body: string } {
  const t = thing(id);
  const e = p.collection[id];
  let kind = '', side = '', more = '', vs = '', act = '';
  if (t?.kind === 'kit') {
    // a gilding kit: its piece, gilded, and the way to the piece
    const d = ITEMS[t.def.item];
    kind = `Gilding kit · ${d.setId ? `${SETS[d.setId].name} ${d.slot}` : `boss weapon`} · ${ROLES[d.role].title}`;
    side = `<p class="lede">Turns the ${esc(d.name)} gold for every hero who wears it. Never more power.${e ? '' : ' Any seat can get it.'}</p>`;
    if (e) more = gildBox(p, d);
    act = `<button type="button" class="btn small" data-act="item" data-id="${esc(d.id)}">${GLYPH.shield}The ${d.slot === 'weapon' ? 'weapon' : 'piece'}</button>`;
  } else if (t?.kind === 'item') {
    const d: ItemDef = t.def, gk = gearKey(d);
    const look = rarLook(id);
    const tierTag = d.tier && d.tier > 1 ? ` · Tier ${d.tier}` : '';
    kind = d.kind === 'unique' ? `Unique ${ROLE_SLOTS[gk][d.slot].name.toLowerCase()} · ${ROLES[d.role].title}${tierTag}` : d.kind === 'set' ? `Epic · ${SETS[d.setId!].name} set · ${ROLES[d.role].title} ${d.slot}${tierTag}` : `${look.name} ${d.slot}`;
    const cmp = held(p, d);
    if (cmp) { vs = cmp.html; act = cmp.act; }
    // what the piece gives on its own, next to its picture
    const share = itemShare(d);
    side = `<div class="stats"><span class="chip">Power <b>${share.ilvl}</b></span>${share.power > 0 ? `<span class="chip">${esc(cap(ROLE_STAT[d.role].main))} <b>+${share.power}%</b></span><span class="chip">Health <b>+${share.health}%</b></span>` : ''}</div>`;
    // the effect is already in the comparison when wearing it would add it
    if (d.effectDesc && !cmp?.c.gains.some((x) => x.kind === 'unique')) more += `<div class="box"><b style="font-family: var(--f-display); font-weight: 400">When worn</b><span class="fine">${esc(d.effectDesc)}</span></div>`;
    const st = d.setId ? setState(p, wearerOf(p, d), d.setId) : null;
    if (st) more += `<div class="box">${setWords(st)}</div>`;
    more += gildBox(p, d);
    if (d.flavor) more += `<p class="fine it-fl">“${esc(d.flavor)}”</p>`;
  } else if (t?.kind === 'collectible') {
    kind = KIND_WORD[t.def.kind];
    side = `<p class="lede">${esc(t.def.desc)}</p>`;
  }
  const line = dropLine(id), giver = t?.kind === 'collectible' ? rewardSource(id) : undefined;
  let source = line ? `${line.heroic ? 'Heroic: ' : ''}${line.boss}, ${fmtRate(line.rate)}${line.role ? ` (${ROLES[line.role].title})` : ''}` : '';
  if (!source && t?.kind === 'item' && t.def.kind === 'gear') source = 'Every dungeon clear upgrades your weakest regular slot up to Rare';
  if (!source && t?.kind === 'collectible') source = t.def.source;
  const kc = line ? p.bosses[line.kc]?.kc || 0 : null;
  const vsrc = valeSource(id);
  const got = e ? `Got it${e.kc ? ` at ${vsrc || id === FIRST_HARVEST_GIFT ? 'harvest' : 'kill count'} ${fmtN(e.kc)}` : ''} on ${fmtDate(e.at)}${e.n > 1 ? `. Seen ${e.n} times.` : '.'}`
    : t?.kind === 'item' && t.def.kind === 'gear' ? 'Regular progression gear from dungeon clears.' : kc !== null ? `Not yet. Your kill count is ${fmtN(kc)}.` : vsrc ? `Not yet. You’ve ${vsrc.word} ${fmtN(p.counters[vsrc.key] || 0)} times.` : 'Not yet.';
  const spot = e ? spotOf(p, id) : null;
  const home = spot ? ` It is in your house: ${spotById(spot)?.label.toLowerCase() || ''}.` : e && t?.kind === 'collectible' && t.def.kind === 'mount' ? ' It lives in your paddock.' : '';
  const acts = [hasBack ? `<button type="button" class="btn small" data-act="back">${GLYPH.left}Back</button>` : '', act].filter(Boolean).join('');
  // a piece you own shows as it looks: gilded, once its kit is yours and on
  const pic = t?.kind === 'item' ? lookId(p, id) : id;
  const body = `<div class="detail"><span class="tile" aria-hidden="true" style="box-shadow: 0 3px 0 var(--ink), inset 0 0 0 4px ${colourOf(id)}">${iconOf(pic)}</span>
      <div class="detail-side">${side}</div></div>
    ${vs}${more}
    ${giver ? fromAch(giver) : `<div class="stats"><span class="chip">From <b>${esc(source || 'Unknown')}</b></span></div>`}
    <p class="fine">${esc(got + home)}</p>
    ${acts ? `<div class="actions">${acts}</div>` : ''}`;
  return { head: `<h2>${esc(nameOf(pic))}</h2><p>${esc(kind)}</p>`, body };
}

/** a reward an achievement gives: which one, what to do for it, and the way to its card */
export function fromAch(a: AchievementDef): string {
  return `<div class="box ac-from"><span><b>From the achievement ${esc(a.name)}</b><span class="fine">${esc(a.how)}</span></span><button type="button" class="btn small" data-act="ach" data-id="${esc(a.id)}">The achievement</button></div>`;
}

/** each verdict's word, its colour class and its mark */
export const VERDICT: Record<Verdict, { word: string; cls: string; mark: string }> = {
  better: { word: 'Upgrade', cls: 'up', mark: GLYPH.rise },
  worse: { word: 'Downgrade', cls: 'down', mark: GLYPH.fall },
  same: { word: 'Same power', cls: 'same', mark: GLYPH.same },
  mixed: { word: 'A trade', cls: 'mixed', mark: GLYPH.swap },
  wearing: { word: 'Wearing it', cls: 'on', mark: GLYPH.check },
};

/** a change as a coloured tag: green and up, red and down, or the same */
export function tag(n: number, unit = ''): string {
  if (n > 0) return `<b class="cmp-d up">${GLYPH.rise}+${n}${unit}</b>`;
  if (n < 0) return `<b class="cmp-d down">${GLYPH.fall}−${Math.abs(n)}${unit}</b>`;
  return '<b class="cmp-d">Same</b>';
}

/** the piece held up against what its role wears: the verdict, side-by-side Equipped vs Drop cards, what changes, and
 *  (when you own it or have it in your bag) a button to open that slot in the Gear Armoury */
function held(p: Profile, d: ItemDef): { html: string; act: string; c: Compare } {
  const h = wearerOf(p, d);
  const c = (h && compareFor(p, h, d.id)) || compareOn(floorWorn(p, d.role, d.cls), d.role, d);
  const who = h ? h.name.split(' ')[0] : `a new ${d.role === 'dps' ? 'DPS' : ROLES[d.role].title.toLowerCase()}`;
  const v = VERDICT[c.verdict];
  const top = `<div class="cmp-verdict">${v.mark}<b>${v.word}</b><span>${c.verdict === 'wearing' ? `${esc(who)} has it on` : `compared to ${esc(who)}’s equipped ${esc(d.slot)}`}</span></div>`;
  const ownsPiece = !!(p.collection[d.id] || (d.kind === 'gear' && h && bestRegular(h, d.slot).rar >= d.rar));
  const act = h && ownsPiece && c.verdict !== 'wearing' ? `<button type="button" class="btn small gold" data-act="gearat" data-hero="${esc(h.id)}" data-slot="${d.slot}" data-id="${esc(d.id)}">${GLYPH.shield}View &amp; Equip in Armoury</button>` : '';
  if (c.verdict === 'wearing') return { html: `<section class="cmp v-on" aria-label="Against what you wear">${top}</section>`, act, c };
  const now = c.now.def, nl = rarLook(now.id), dl = rarLook(d.id);
  const vsCards = `<div class="tw-vs" style="margin: 0 12px">
    <div class="tw-side old"><span class="tile" style="--c: ${nl.color}">${iconOf(now.id)}</span><div><small>Equipped now</small><b style="color: ${nl.ink}">${esc(now.name)}</b><span>${esc(nl.name)} · Power ${c.ilvl[0]}</span></div></div>
    <i class="tw-arrow" aria-hidden="true">${GLYPH.right}</i>
    <div class="tw-side new"><span class="tile" style="--c: ${dl.color}">${iconOf(d.id)}</span><div><small>This ${esc(d.slot)}</small><b style="color: ${dl.ink}">${esc(d.name)}</b><span>${esc(dl.name)} · Power ${c.ilvl[1]}</span></div></div>
  </div>`;
  const rows = [`<div class="cmp-row"><span>Power <small>${c.ilvl[0]} → ${c.ilvl[1]}</small></span>${tag(c.ilvl[1] - c.ilvl[0])}</div>`];
  if (c.power) rows.push(`<div class="cmp-row"><span>${esc(cap(ROLE_STAT[d.role].main))}</span>${tag(c.power, '%')}</div>`);
  if (c.health) rows.push(`<div class="cmp-row"><span>Health</span>${tag(c.health, '%')}</div>`);
  if (c.set && d.setId) rows.push(`<div class="cmp-row"><span>${esc(SETS[d.setId].name)} set <small>${c.set[0]} → ${c.set[1]} of 3</small></span>${tag(c.set[1] - c.set[0])}</div>`);
  const fx = (x: Effect, gain: boolean): string => `<li class="${gain ? 'gain' : 'loss'}${x.later ? ' later' : ''}"><i aria-hidden="true">${gain ? '+' : '−'}</i><span><b>${esc(x.name)}${x.kind === 'trait' ? ' trait' : ''}</b> ${esc(x.desc)}${x.later ? ' <em>Coming in a later update.</em>' : ''}</span></li>`;
  const effects = c.gains.length || c.loses.length ? `<ul class="cmp-fx" aria-label="What it adds and takes away">${c.gains.map((x) => fx(x, true)).join('')}${c.loses.map((x) => fx(x, false)).join('')}</ul>` : '';
  const html = `<section class="cmp v-${v.cls}" aria-label="Against what ${esc(who)} wears">${top}
    ${vsCards}
    <div class="cmp-rows">${rows.join('')}</div>${effects}</section>`;
  return { html, act, c };
}
