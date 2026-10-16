/**
 * A closer look at one thing in the collection log, over the page you're on: tap a piece under a stand, a
 * thing on the shelf, a row on a set's page, or a tile on the garden's and other pages. A small card at the
 * bottom of the sheet, never the whole screen: the thing's own picture big in its rarity's light, its
 * rarity word and name, and where it comes from or when you got it. Gear then has its stats, each with how
 * it changes what its role wears now (and whether that's an upgrade), what it does when worn and its set's
 * two bonuses. Details opens its own sheet (what it replaces, its flavour); a piece you own and haven't put
 * on can go straight to the gear doll.
 */
import { COLLECTIBLES, DUNGEONS, ITEMS, SETS } from '../content';
import { ROLES } from '../content/roles';
import type { DungeonInfo, ItemDef } from '../content/types';
import { FIRST_HARVEST_GIFT, GARDEN_TABLE } from '../content/vale';
import { bestRegular, compareFor, compareOn, floorWorn, itemShare, wearerOf } from '../meta/gear';
import { spotById, spotOf } from '../meta/hearth';
import { standPieces, standsOf } from '../meta/logs';
import type { Profile } from '../meta/profile';
import { iconOf, nameOf, pieceSvg, spriteURL } from './art';
import { cap, esc, fmtDate, fmtN, fmtRate, GLYPH } from './dom';
import { ROLE_STAT, VERDICT, tag } from './itemsheet';
import { slotTag, whoOf } from './logbook';

const SLOT_WORD: Record<string, string> = { helm: 'Helm', shoulders: 'Shoulders', chest: 'Chest', weapon: 'Weapon' };

/** where a log slot drops: the dungeon, the boss's name, its rate and your kill count on that boss */
export function dropSource(p: Profile, id: string): { dg: DungeonInfo; boss: string; rate: number; kc: number } | null {
  for (const dg of Object.values(DUNGEONS)) for (const t of dg.loot) {
    const d = t.drops.find((x) => x.id === id);
    if (d) return { dg, boss: dg.bosses.find((b) => b.id === t.boss)?.name || '', rate: d.rate, kc: p.bosses[`${dg.id}.${t.boss}`]?.kc || 0 };
  }
  return null;
}

/** The card, or nothing for an id that isn't a log slot. `onSet` is the set page it was opened on, if any. */
export function peekCard(p: Profile, id: string, onSet?: string): string {
  const it = ITEMS[id], c = COLLECTIBLES[id];
  if (!it && !c) return '';
  const e = p.collection[id], src = dropSource(p, id), harvest = GARDEN_TABLE.find((d) => d.id === id);
  const bonus = !!src?.dg.bonus?.includes(id), t = slotTag(id);
  const stand = src && it ? standsOf(src.dg.id).find((s) => standPieces(s).includes(id)) : undefined;
  // where it comes from, or when it came
  const when = e ? `${GLYPH.check}Got${e.kc ? ` at ${harvest || id === FIRST_HARVEST_GIFT ? 'harvest' : 'KC'} ${fmtN(e.kc)} ·` : ''} ${esc(fmtDate(e.at))}${e.n > 1 ? ` <i class="pk-seen">Seen ${fmtN(e.n)}×</i>` : ''}`
    : src ? `<b>${fmtRate(src.rate)}</b> from ${esc(`${src.dg.heroicOf ? 'Heroic ' : ''}${src.boss}`)} · your KC ${fmtN(src.kc)}`
    : harvest ? `<b>${fmtRate(harvest.rate)}</b> from any harvest · ${fmtN(p.counters['vale.harvests'] || 0)} so far`
    : esc(c?.source || 'Not yet');
  const art = (it && pieceSvg(id)) || (c?.sprite ? `<img src="${spriteURL(c.sprite)}" alt="">` : `<span class="tile">${iconOf(id)}</span>`);
  const kind = it ? (it.setId ? `${SLOT_WORD[it.slot]} · ${whoOf(it.role, it.cls)} · ${SETS[it.setId].name} set` : `Boss weapon · ${whoOf(it.role, it.cls)}`)
    : `${t.word}${bonus ? ' · a bonus slot, never needed' : ''}`;
  let body: string, acts = '';
  if (it) {
    const g = gear(p, it, stand ? stand.pieces.filter((x) => p.collection[x]).length : 0);
    body = g.html;
    acts = g.act;
    if (stand && onSet !== `${src!.dg.id}.set.${stand.set.id}`) acts += `<button type="button" class="btn small" data-act="entry" data-id="${esc(src!.dg.id)}.set.${esc(stand.set.id)}">The set</button>`;
  } else {
    const spot = e ? spotOf(p, id) : null;
    const home = spot ? `It's in your house: ${spotById(spot)?.label.toLowerCase() || ''}.` : e && c?.kind === 'mount' ? 'It lives in your paddock.' : '';
    body = `<p class="pk-desc">${esc(c!.desc)}</p>${home ? `<p class="pk-home">${esc(home)}</p>` : ''}`;
  }
  acts += `<button type="button" class="btn small" data-act="item" data-id="${esc(id)}">Details</button>`;
  return `<div class="pk-wrap" data-act="peekclose"><div class="pk-box" data-act="peekin" style="--rc: ${t.bg}; --ri: ${t.ink}">
    <button type="button" class="icon-btn pk-x" data-act="peekclose" aria-label="Close">${GLYPH.close}</button>
    <section class="pk ${e ? 'got' : 'miss'}" role="dialog" aria-modal="true" aria-label="${esc(nameOf(id))}"><div class="pk-top"><div class="pk-art${id.endsWith('.gilded') ? ' gilt' : ''}">${art}${e ? '' : '<i class="pk-not">Not yet</i>'}</div>
      <div class="pk-id"><i class="pk-rar${t.pale ? ' pale' : ''}">${esc(t.word)}</i><h3>${esc(nameOf(id))}</h3><p class="pk-kind">${esc(kind)}</p><p class="pk-got${e ? '' : ' no'}">${when}</p></div></div>
    ${body}<div class="pk-acts">${acts}</div></section></div></div>`;
}

/** a piece of gear: its stats, each with how it changes what its role wears now and the verdict on top (and a
 *  way to put it on when it's yours), what it does when worn, and its set's bonuses lit by how many of the set
 *  you have */
function gear(p: Profile, d: ItemDef, found: number): { html: string; act: string } {
  const share = itemShare(d), word = ROLE_STAT[d.role];
  const h = wearerOf(p, d);
  const cmp = (h && compareFor(p, h, d.id)) || compareOn(floorWorn(p, d.role, d.cls), d.role, d);
  const who = h ? h.name.split(' ')[0] : `a new ${d.role === 'dps' ? 'DPS' : ROLES[d.role].title.toLowerCase()}`;
  const v = VERDICT[cmp.verdict], on = cmp.verdict === 'wearing';
  const stat = (n: string, label: string, change: number, unit = ''): string => `<span class="pk-s"><b>${n}</b><small>${esc(label)}</small>${on ? '' : tag(change, unit)}</span>`;
  const vs = `<div class="pk-cmp v-${v.cls}"><p class="pk-v">${v.mark}<b>${esc(v.word)}</b><span>${on ? `${esc(who)} has it on` : `for ${esc(who)}`}</span></p>
    <div class="pk-ss">${stat(String(share.ilvl), 'Item level', cmp.ilvl[1] - cmp.ilvl[0])}${share.power > 0 ? stat(`+${share.power}%`, cap(word.short), cmp.power, '%') + stat(`+${share.health}%`, 'Health', cmp.health, '%') : ''}</div></div>`;
  const owns = !!(p.collection[d.id] || (d.kind === 'gear' && h && bestRegular(h, d.slot).rar >= d.rar));
  const act = h && owns && cmp.verdict !== 'wearing' ? `<button type="button" class="btn small gold" data-act="gearat" data-hero="${esc(h.id)}" data-slot="${d.slot}" data-id="${esc(d.id)}">${GLYPH.shield}Put it on</button>` : '';
  const gilt = d.id.endsWith('.gilded') ? '<p class="pk-gild">Gilded: the same power as its Normal piece, a rarer look.</p>' : '';
  const fx = d.effectDesc ? `<p class="pk-fx"><b>When worn</b> ${esc(d.effectDesc)}</p>` : '';
  const s = d.setId ? SETS[d.setId] : undefined;
  const set = s ? `<div class="lb-bonus pk-set"><p class="pk-set-h"><b>${esc(s.name)} set</b><small>${found} of ${s.pieces.length} found</small></p>
      <p class="${found >= 2 ? 'on' : ''}"><i>2</i><span>${esc(s.bonus2.desc)}</span></p><p class="${found >= 3 ? 'on' : ''}"><i>3</i><span>${esc(s.bonus3.desc)}</span></p></div>` : '';
  return { html: vs + gilt + fx + set, act };
}
