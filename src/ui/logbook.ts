/**
 * The collection log as a wardrobe: one page per dungeon's log, Normal or Heroic. At the top the log's big
 * prize on a plinth with how many slots you have; then each set on its own armour stand, the pieces you've
 * found on it and the rest as dashed ghosts; then the shelf with the dungeon's trophy and its bonus pet,
 * mount and dye. A stand opens its set's page; its role's badge sits in its corner. The garden's harvests and
 * the other rewards are pages of tiles. Every slot shows its rarity, its drop rate and, once it's yours, the
 * kill count you got it at. Tapping any slot (a piece under a stand, the shelf, a set's rows, a tile) opens a
 * closer look at it over the page (logpeek.ts).
 */
import { ACHIEVEMENT_LIST, COLLECTIBLES, DUNGEONS, ITEMS, TITLES, heroicVersion } from '../content';
import { CLASSES, type ClassId } from '../content/folk';
import { LOOKS } from '../content/house';
import { ROLES } from '../content/roles';
import type { AchievementDef, DungeonInfo, RoleId } from '../content/types';
import { GARDEN_TABLE } from '../content/vale';
import { logAchievement, logDone, logProgress, shelfOf, standPieces, standsOf, type Stand } from '../meta/logs';
import type { Profile } from '../meta/profile';
import { esc, fmtDate, fmtN, fmtRate, fmtT, GLYPH } from './dom';
import { iconOf, nameOf, rarLook, spriteURL, standSvg, tile } from './art';
import { mainReward } from './dungeonsheet';
import { SWATCH } from './lookssheet';

/** what the page remembers while it's open: Try it on, on a set's page, the slot it's taking a closer look at,
 *  and whether this draw is the one just after the Normal or Heroic toggle flipped (its thumb slides over) */
export interface LogView { tryOn: boolean; peek: string | null; flip: boolean }

/** who stands on a log's plinth: the Barrow's Risen, gilded for its heroic log */
export const PRIZE_ART: Record<string, string> = { 'barrow.log': 'risen_tank_f', 'barrow-heroic.log': 'risen_tank_gilded_f' };

type Page = { kind: 'dungeon'; dg: DungeonInfo } | { kind: 'set'; dg: DungeonInfo; stand: Stand } | { kind: 'garden' } | { kind: 'other' };
const SLOT_WORD: Record<string, string> = { helm: 'Helm', shoulders: 'Shoulders', chest: 'Chest', weapon: 'Weapon' };

/** the dungeons that have logs, normal versions only */
const bases = (): DungeonInfo[] => Object.values(DUNGEONS).filter((d) => !d.heroicOf && d.collection.length);

/** The collection log tab. `heroicWas` is whether it was showing the heroic logs; a page asked for from the
 *  other version switches it, and it hands back what it is now. */
export function collectionLog(p: Profile, entry: string | undefined, heroicWas: boolean, view: LogView): { html: string; heroic: boolean } {
  const pg = pageOf(p, entry, heroicWas);
  const heroic = pg.kind === 'dungeon' || pg.kind === 'set' ? !!pg.dg.heroicOf : heroicWas;
  const body = pg.kind === 'set' ? setPage(p, pg.dg, pg.stand, view)
    : chips(p, pg, heroic) + (pg.kind === 'dungeon' ? prize(p, pg.dg, view.flip) + wardrobe(p, pg.dg, view.peek) + shelf(p, pg.dg) : pg.kind === 'garden' ? gardenPage(p) : otherPage(p));
  const gilt = (pg.kind === 'dungeon' || pg.kind === 'set') && heroic;
  return { html: `<div class="lb${gilt ? ' gilt' : ''}">${body}</div>`, heroic };
}

function pageOf(p: Profile, entry: string | undefined, heroic: boolean): Page {
  if (entry === 'garden.harvests') return { kind: 'garden' };
  if (entry === 'other.rewards') return { kind: 'other' };
  const set = entry?.match(/^(.+)\.set\.(.+)$/);
  if (set) {
    const dg = DUNGEONS[set[1]], stand = dg && standsOf(dg.id).find((s) => s.set.id === set[2]);
    if (dg && stand) return { kind: 'set', dg, stand };
  }
  // a dungeon's log (a page from before the wardrobe, a boss's, opens its dungeon's)
  const asked = entry ? DUNGEONS[entry.replace(/\.[^.]+$/, '')] : undefined;
  if (asked && asked.collection.length) return { kind: 'dungeon', dg: asked };
  const all = bases(), base = all.find((d) => !logDone(p, d.id)) || all[0];
  return { kind: 'dungeon', dg: (heroic && heroicVersion(base.id)) || base };
}

/** the logs across the top: each dungeon's, the garden's and the other rewards */
function chips(p: Profile, pg: Page, heroic: boolean): string {
  const fresh = (ids: string[]): boolean => ids.some((id) => p.collection[id] && !p.seen[id]);
  const chip = (id: string, label: string, on: boolean, dot: boolean): string =>
    `<button type="button" class="lb-chip" data-act="entry" data-id="${esc(id)}" aria-pressed="${on}">${esc(label)}${dot ? '<i class="dot" aria-hidden="true"></i>' : ''}</button>`;
  const dgs = bases().map((b) => {
    const d = (heroic && heroicVersion(b.id)) || b;
    return chip(`${d.id}.log`, b.name.split(' ')[0], pg.kind === 'dungeon' && pg.dg.id === d.id, fresh(d.collection));
  });
  return `<nav class="lb-chips" aria-label="Logs">${dgs.join('')}${chip('garden.harvests', 'Garden', pg.kind === 'garden', fresh(GARDEN_TABLE.map((d) => d.id)))}${chip('other.rewards', 'Other', pg.kind === 'other', false)}</nav>`;
}

/** the log's big prize on its plinth, how many slots you have, what finishing gives, and your kill counts, under
 *  the toggle between the dungeon's log and its heroic one */
function prize(p: Profile, dg: DungeonInfo, flipped: boolean): string {
  const ach = logAchievement(dg.id), pr = logProgress(p, dg.id), won = !!ach && !!p.achievements[ach.id];
  const main = ach ? mainReward(ach) : null, art = ach ? PRIZE_ART[ach.id] : undefined;
  const left = pr.need - pr.have;
  const ORDER = ['pet', 'mount', 'dye'];
  const bonus = (dg.bonus || []).map((id) => (id.startsWith('dye.') ? 'dye' : COLLECTIBLES[id]?.kind || 'drop')).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const line = won ? `Log complete on <b>${esc(fmtDate(p.achievements[ach!.id].at))}</b>.`
    : `<b>${left} to go</b> for ${esc(main ? main.name.replace(/^The /, 'the ') : 'its prize')}.${bonus.length ? ` The ${esc(andList(bonus))} ${bonus.length > 1 ? 'are' : 'is'} a bonus.` : ''}`;
  const kcs = dg.bosses.map((b) => `<span class="lb-kc">${esc(b.name)} <b>KC ${fmtN(p.bosses[`${dg.id}.${b.id}`]?.kc || 0)}</b></span>`).join('')
    + (p.dungeons[dg.id]?.pb ? `<span class="lb-kc">Best <b>${fmtT(p.dungeons[dg.id].pb)}</b></span>` : '');
  const race = ach?.reward.race, look = ach?.reward.look;
  // Normal or Heroic: a toggle across the top of the stage, its thumb on the side you're on. Heroic's pieces are the
  // same ones gilded, at the same power, and the page says so: it's a rarer look and a log of its own, not an upgrade
  const base = dg.heroicOf ? DUNGEONS[dg.heroicOf] : dg, hero = heroicVersion(base.id), on = !!dg.heroicOf;
  const side = (d: DungeonInfo, label: string, mine: boolean): string =>
    `<button type="button" role="radio" aria-checked="${mine}" data-act="entry" data-id="${esc(d.id)}.log"${mine ? '' : ' data-flip="1"'}>${label}</button>`;
  const mode = hero ? `<div class="lb-mode${on ? ' on' : ''}${flipped ? ' flip' : ''}" role="radiogroup" aria-label="Normal or Heroic log">${side(base, 'Normal', !on)}${side(hero, '<span class="gem" aria-hidden="true"><i></i></span>Heroic', on)}</div>
    ${on ? '<p class="lb-mode-note">Gilded pieces: the same power as Normal, a rarer look, and a log of their own.</p>' : ''}` : '';
  const acts = won ? `<div class="lb-acts">${race && main ? `<button type="button" class="btn gold small" data-act="makerace" data-race="${esc(race)}">${GLYPH.plus}Make a ${esc(main.name.replace(/^The /, ''))}</button>` : ''}${look ? '<button type="button" class="btn small" data-act="putlook">Put up the look</button>' : ''}</div>` : '';
  return `<section class="lb-prize${won ? ' done' : ''}" aria-label="${esc(dg.name)} log">${mode}
    <div class="lb-plinth">${art ? `<img src="${spriteURL(art)}" alt="${esc(main?.name || '')}">` : ''}<span class="lb-base" aria-hidden="true"></span>${won ? '' : `<span class="lb-lock">${GLYPH.lock}${left} to go</span>`}</div>
    <div class="lb-top"><p class="eyebrow">${esc(dg.name)} log</p><p class="lb-count">${pr.have}<span> / ${pr.need}</span></p></div>
    <div class="lb-bar" role="progressbar" aria-label="Slots filled" aria-valuenow="${pr.have}" aria-valuemax="${pr.need}" style="--n: ${Math.max(1, pr.need)}"><i style="width: ${((pr.have / Math.max(1, pr.need)) * 100).toFixed(1)}%"></i></div>
    <p class="lb-line">${line}</p>
    ${ach ? `<div class="lb-rw">${prizeRewards(ach)}</div>` : ''}<div class="lb-kcs">${kcs}</div>${acts}</section>`;
}

/** what finishing a log gives, small: the big prize, the house look, the title */
function prizeRewards(a: AchievementDef): string {
  const main = mainReward(a), look = a.reward.look ? LOOKS.find((l) => l.id === a.reward.look) : undefined, title = a.reward.title ? TITLES[a.reward.title] : undefined;
  const kind = a.reward.race ? 'New race' : a.reward.collectible ? ({ cosmetic: 'A look', pet: 'Pet', mount: 'Mount', trophy: 'Trophy', banner: 'Banner' }[COLLECTIBLES[a.reward.collectible]?.kind || 'cosmetic']) : '';
  const rw = (pic: string, name: string, what: string, cls = ''): string => `<div class="lb-r${cls}"><span class="lb-r-pic" aria-hidden="true">${pic}</span><b>${esc(name)}</b><small>${esc(what)}</small></div>`;
  return (main ? rw(tile(main.icon), main.name, kind, ' main') : '')
    + (look ? rw(`<span class="lk-sw">${SWATCH[look.id] || ''}</span>`, look.name, 'House look') : '')
    + (title ? rw(`<span class="lb-ttl">${GLYPH.pen}</span>`, title.text, 'Title') : '');
}

/** the wardrobe: every set of the dungeon on its stand */
function wardrobe(p: Profile, dg: DungeonInfo, peek: string | null): string {
  const stands = standsOf(dg.id);
  if (!stands.length) return '';
  const piece = dropOf(dg, stands[0].pieces[0]).rate, weapon = stands[0].weapon ? dropOf(dg, stands[0].weapon).rate : undefined;
  return `<section class="lb-sec"><header class="lb-h"><h3>The wardrobe</h3><small>${piece ? `Pieces ${fmtRate(piece)}` : ''}${weapon ? ` · weapons ${fmtRate(weapon)}` : ''}</small></header>
    <div class="lb-stands">${stands.map((s) => standCard(p, dg, s, peek)).join('')}</div></section>`;
}

/** a stand's card: the stand (it opens the set's page) with its role's badge in the corner, its name and
 *  count, and a tile for each piece that opens a closer look at it */
function standCard(p: Profile, dg: DungeonInfo, s: Stand, peek: string | null): string {
  const ids = standPieces(s), have = ids.filter((id) => p.collection[id]).length;
  const fresh = ids.some((id) => p.collection[id] && !p.seen[id]), done = have === ids.length;
  const who = whoOf(s.set.role, s.set.cls);
  const pips = ids.map((id) => {
    const got = !!p.collection[id], rate = fmtRate(dropOf(dg, id).rate);
    return `<button type="button" class="lb-pip ${got ? 'got' : 'miss'}${id === peek ? ' on' : ''}" data-act="peek" data-id="${esc(id)}" style="--rc: ${slotTag(id).bg}" aria-label="${esc(`${nameOf(id)}, ${got ? 'yours' : rate}. Take a closer look`)}">
      <span class="tile" aria-hidden="true">${iconOf(id)}</span><small aria-hidden="true">${got ? GLYPH.check : rate}</small></button>`;
  }).join('');
  return `<div class="lb-st${done ? ' done' : ''}${fresh ? ' new' : ''}">
    <button type="button" class="lb-st-go" data-act="entry" data-id="${esc(dg.id)}.set.${esc(s.set.id)}" aria-label="${esc(`${s.set.name}, the ${who} set: ${have} of ${ids.length}. Open it`)}">
      <span class="lb-stg">${roleBadge(s)}${fresh ? '<i class="lb-rib new">New</i>' : done ? '<i class="lb-rib done">Set done</i>' : ''}${standSvg(ids, (id) => !!p.collection[id])}</span>
      <span class="lb-foot"><b>${esc(s.set.name)}</b><span class="lb-n">${have}<small>/${ids.length}</small></span></span></button>
    <div class="lb-pips">${pips}</div></div>`;
}

/** whose set it is, as their class's badge (a Barrow set fits one class: the mage's and the rogue's are both DPS) */
function roleBadge(s: Stand): string {
  const cls: ClassId = s.set.cls === 'rogue' ? 'rogue' : s.set.role === 'tank' ? 'warrior' : s.set.role === 'healer' ? 'cleric' : 'mage';
  return `<i class="lb-role r-${s.set.role}" aria-hidden="true">${tile(CLASSES[cls].icon)}</i>`;
}

/** the shelf: the dungeon's trophy, and its bonus pet, mount and dye, standing on a plank */
function shelf(p: Profile, dg: DungeonInfo): string {
  const ids = shelfOf(dg.id);
  if (!ids.length) return '';
  const bonus = dg.bonus || [];
  const items = ids.map((id) => {
    const c = COLLECTIBLES[id], e = p.collection[id], rate = dropOf(dg, id).rate;
    const art = c?.sprite ? `<img src="${spriteURL(c.sprite)}" alt="" class="k-${c.kind}">` : `<span class="tile">${iconOf(id)}</span>`;
    const sub = e ? `${e.kc ? `KC ${fmtN(e.kc)}` : 'Yours'}${e.n > 1 ? ` · ${fmtN(e.n)}×` : ''}` : fmtRate(rate);
    return `<button type="button" class="lb-sh ${e ? 'got' : 'miss'}${e && !p.seen[id] ? ' new' : ''}" data-act="peek" data-id="${esc(id)}" aria-label="${esc(`${nameOf(id)}${rate ? `, ${fmtRate(rate)}` : ''}${e ? ', yours' : ', not yet'}${bonus.includes(id) ? ', a bonus slot' : ''}`)}">
      <span class="lb-sh-art">${art}${e ? '' : `<i class="lb-rate">${fmtRate(rate)}</i>`}</span>
      <span class="lb-sh-tag"><b>${esc(nameOf(id))}</b><small>${esc(sub)}</small>${bonus.includes(id) ? '<i class="lb-bon">Bonus</i>' : ''}</span></button>`;
  }).join('');
  return `<section class="lb-sec"><header class="lb-h"><h3>Trophy shelf</h3></header>
    <div class="lb-shelf" style="--cols: ${ids.length}">${items}</div></section>`;
}

/** a set's own page: its stand big, Try it on, its bonuses, and a row for every piece */
function setPage(p: Profile, dg: DungeonInfo, s: Stand, view: LogView): string {
  const ids = standPieces(s), have = ids.filter((id) => p.collection[id]).length, worn = s.pieces.filter((id) => p.collection[id]).length;
  const who = whoOf(s.set.role, s.set.cls), base = dg.heroicOf ? DUNGEONS[dg.heroicOf] : dg;
  const tryOn = view.tryOn && have < ids.length;
  const rows = ids.map((id) => pieceRow(p, dg, id)).join('');
  return `<button type="button" class="btn small lb-back" data-act="entry" data-id="${esc(dg.id)}.log">${GLYPH.left}${esc(`${dg.heroicOf ? 'Heroic ' : ''}${base.name.split(' ')[0]} log`)}</button>
    <section class="lb-set${tryOn ? ' try' : ''}">${tryOn ? '<i class="lb-stamp">Preview</i>' : ''}
      <div class="lb-set-stg">${roleBadge(s)}${standSvg(ids, (id) => tryOn || !!p.collection[id])}</div>
      <div class="lb-set-cap"><div><h3>${esc(s.set.name)}</h3><p><i class="rdot ${s.set.role}"></i>${who} · ${have} of ${ids.length}</p></div>
        ${have < ids.length ? `<button type="button" class="btn small" data-act="tryon" aria-pressed="${tryOn}">${GLYPH.eye}${tryOn ? 'Back to yours' : 'Try it on'}</button>` : ''}</div></section>
    <div class="lb-bonus"><p class="${worn >= 2 ? 'on' : ''}"><i>2</i><span><b>2 pieces:</b> ${esc(s.set.bonus2.desc)}</span></p><p class="${worn >= 3 ? 'on' : ''}"><i>3</i><span><b>3 pieces:</b> ${esc(s.set.bonus3.desc)}</span></p></div>
    <section class="lb-sec"><header class="lb-h"><h3>The pieces</h3><small>Tap one for a closer look</small></header><div class="lb-pieces">${rows}</div></section>`;
}

function pieceRow(p: Profile, dg: DungeonInfo, id: string): string {
  const it = ITEMS[id], c = p.collection[id], t = slotTag(id), d = dropOf(dg, id);
  const side = c ? `<b>KC ${fmtN(c.kc)}</b><small>${esc(fmtDate(c.at))}</small>${c.n > 1 ? `<span class="seen">Seen ${fmtN(c.n)}×</span>` : ''}` : `<b>${fmtRate(d.rate)}</b><small>Not yet</small>`;
  return `<button type="button" class="lb-pc ${c ? 'got' : 'miss'}${c && !p.seen[id] ? ' new' : ''}" data-act="peek" data-id="${esc(id)}" style="--rc: ${t.bg}; --ri: ${t.ink}" aria-label="${esc(`${nameOf(id)}, ${t.word}, ${fmtRate(d.rate)}${c ? `, yours since kill count ${fmtN(c.kc)}` : ', not yet'}`)}">
    <span class="lb-pc-t" aria-hidden="true"><span class="tile">${iconOf(id)}</span><i class="cl-rar${t.pale ? ' pale' : ''}">${esc(t.word)}</i></span>
    <span class="lb-pc-main"><b>${esc(nameOf(id))}</b><small>${esc([SLOT_WORD[it?.slot || ''], fmtRate(d.rate)].filter(Boolean).join(' · '))}</small>${it?.effectDesc ? `<em>${esc(it.effectDesc)}</em>` : ''}</span>
    <span class="lb-pc-side">${side}</span></button>`;
}

/** the garden's harvests: what a harvest can give */
function gardenPage(p: Profile): string {
  const ids = GARDEN_TABLE.map((d) => d.id), got = ids.filter((id) => p.collection[id]).length;
  return `<div class="cl-head vale"><span class="art" aria-hidden="true"><img src="${spriteURL('node_glowcap')}" alt=""></span><div>
      <p class="eyebrow">The garden</p><h3>Harvests</h3>
      <p class="cl-obt">Obtained: <b class="${state(got, ids.length)}">${got}/${ids.length}</b></p>
      <p class="cl-kc">Harvests: <b>${fmtN(p.counters['vale.harvests'] || 0)}</b></p></div></div>
    <div class="cl-grid">${GARDEN_TABLE.map((d) => slot(p, d.id, { rate: d.rate, harvest: true })).join('')}</div>`;
}

/** the rewards that aren't drops: from achievements and firsts */
function otherPage(p: Profile): string {
  const drops = new Set([...Object.values(DUNGEONS).flatMap((d) => d.loot.flatMap((t) => t.drops.map((x) => x.id))), ...GARDEN_TABLE.map((d) => d.id)]);
  const ids = Object.values(COLLECTIBLES).filter((c) => !drops.has(c.id)).map((c) => c.id), got = ids.filter((id) => p.collection[id]).length;
  return `<div class="cl-head plain"><div><p class="eyebrow">Other</p><h3>Rewards</h3><p class="cl-obt">Obtained: <b class="${state(got, ids.length)}">${got}/${ids.length}</b></p>
      <p class="fine">Pets, mounts, trophies, banners and looks that achievements and firsts give. Never power.</p></div></div>
    <div class="cl-grid">${ids.map((id) => { const a = ACHIEVEMENT_LIST.find((x) => x.reward.collectible === id); return slot(p, id, { note: a ? a.name : COLLECTIBLES[id]?.source || '' }); }).join('')}</div>`;
}

const state = (got: number, all: number): string => (got >= all ? 'done' : got ? 'part' : 'none');
const andList = (w: string[]): string => (w.length < 2 ? w.join('') : `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}`);
export const whoOf = (role: RoleId, cls?: string): string => (cls === 'rogue' ? 'Rogue' : role === 'dps' ? 'Mage' : ROLES[role].title);

/** where a dungeon drop comes from: its rate and, for a role's drop, who can get it */
export function dropOf(dg: DungeonInfo, id: string): { rate?: number; who?: string } {
  for (const t of dg.loot) {
    const d = t.drops.find((x) => x.id === id);
    if (d) return { rate: d.rate, who: d.role ? whoOf(d.role, d.cls) : undefined };
  }
  return {};
}

/** the word on a slot's ribbon and its colours: the rarity for gear, Bonus for a log's bonus slots, the kind
 *  for everything else. `pale` grounds take ink-coloured words. */
export function slotTag(id: string, bonus = false): { word: string; bg: string; ink: string; pale: boolean } {
  if (bonus) return { word: 'Bonus', bg: '#9BE15D', ink: '#2E6B2A', pale: true };
  if (ITEMS[id]) { const r = rarLook(id); return { word: r.name, bg: r.color, ink: r.ink, pale: r.key === 'unique' }; }
  const k = COLLECTIBLES[id]?.kind;
  if (k === 'pet') return { word: 'Pet', bg: '#9BE15D', ink: '#2E6B2A', pale: true };
  if (k === 'mount') return { word: 'Mount', bg: '#8FD6FF', ink: '#2F5F99', pale: true };
  return { word: k === 'trophy' ? 'Trophy' : k === 'banner' ? 'Banner' : id.startsWith('dye.') ? 'Dye' : 'Look', bg: '#D9B98C', ink: '#6B4528', pale: true };
}

/** One slot as a tile: its picture in its rarity's frame with the word on a ribbon, its name, its drop rate
 *  (or where it comes from) always, and once it's yours the count you got it at and how often you've seen
 *  it. A slot you haven't got is faded, never hidden: you can see what you're after. */
function slot(p: Profile, id: string, o: { rate?: number; who?: string; bonus?: boolean; harvest?: boolean; note?: string }): string {
  const c = p.collection[id], t = slotTag(id, o.bonus);
  const isNew = !!c && !p.seen[id];
  const where = o.rate ? `${fmtRate(o.rate)}${o.who ? ` · ${o.who}` : ''}` : o.note || '';
  const kc = c ? (c.kc ? `${o.harvest ? 'Harvest' : 'KC'} ${fmtN(c.kc)}` : 'Yours') : '';
  const label = `${nameOf(id)}, ${t.word}${o.rate ? `, ${fmtRate(o.rate)}` : ''}${c ? `, yours${c.kc ? ` since ${o.harvest ? 'harvest' : 'kill count'} ${fmtN(c.kc)}` : ''}${c.n > 1 ? `, seen ${fmtN(c.n)} times` : ''}` : ', not yet'}`;
  return `<button type="button" class="cl-it ${c ? 'got' : 'miss'}${isNew ? ' new' : ''}" data-act="peek" data-id="${esc(id)}" aria-label="${esc(label)}" title="${esc(c ? `${nameOf(id)}: got ${fmtDate(c.at)}` : nameOf(id))}" style="--rc: ${t.bg}; --ri: ${t.ink}">
    ${isNew ? '<i class="cl-new" aria-hidden="true">New</i>' : ''}<span class="cl-tl" aria-hidden="true"><span class="tile">${iconOf(id)}</span><i class="cl-rar${t.pale ? ' pale' : ''}">${esc(t.word)}</i></span>
    <span class="n">${esc(nameOf(id))}</span>${where ? `<span class="m">${esc(where)}</span>` : ''}${kc ? `<span class="kc">${esc(kc)}</span>` : ''}${c && c.n > 1 ? `<span class="seen">Seen ${fmtN(c.n)}×</span>` : ''}</button>`;
}
