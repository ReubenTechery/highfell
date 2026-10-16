/**
 * The armoury: a hero's gear, in three tabs. Gear: the hero, their four slots in a row, every piece they have
 * for the picked slot with the uniques still to find dimmed at the end, the card that says what putting the
 * picked piece on would change (armourycard.ts), and one Put it on at the bottom. Abilities: the four buttons
 * and what the gear does to them. Looks: the title and the looks. Your other heroes are a tap away in the
 * corner. Its buttons (armouryActions), the moment a piece goes on (the burst, the item level counting up)
 * and looking clearing New (leftSlot) live here too; the sheets open and close it.
 */
import { COLLECTIBLES, ITEMS, SETS, TITLES } from '../content';
import { AB, ROLES, SLOTS_AB, abKey } from '../content/roles';
import { ROLE_SLOTS, SLOT_IDS, gearKey } from '../content/gear';
import { CLASSES, RACES, type ClassId, type RaceId } from '../content/folk';
import type { AbilitySlot, SlotId } from '../content/types';
import { activeHero, heroById, roleOf, setActive, type Hero, type Profile } from '../meta/profile';
import { betterFor, buyTrait, compareOn, effectsOf, healthPct, itemScore, loadoutFor, lookId, powerPct, seenSlot, shelfFor, waiting, waitingFor, wear, worn, type ShelfPiece, type Worn } from '../meta/gear';
import type { App } from './app';
import { cap, esc, fmtRate, GLYPH } from './dom';
import { heroImg, heroSprite, iconOf, nameOf, rarLook, tile } from './art';
import { SFX } from './sound';
import { ilvl } from './hearth';
import { ROLE_STAT } from './itemsheet';
import { dropSource } from './logpeek';
import { pieceCard, traitRow } from './armourycard';
import type { SheetSpec } from './sheets';

export type ArmouryTab = 'gear' | 'abilities' | 'looks';
export const ARMOURY_TABS: ArmouryTab[] = ['gear', 'abilities', 'looks'];
const TAB_WORD: Record<ArmouryTab, string> = { gear: 'Gear', abilities: 'Abilities', looks: 'Looks' };
type GearSpec = Extract<SheetSpec, { kind: 'gear' }>;

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 L14.9 8.7 L21.6 9.4 L16.6 13.9 L18 20.6 L12 17.2 L6 20.6 L7.4 13.9 L2.4 9.4 L9.1 8.7 Z" style="fill: #F2C230; stroke: #1E1A1A; stroke-width: 2; stroke-linejoin: round"/></svg>';
const BURST = '<span class="sl-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>';

/** what the armoury remembers while the page is open: the piece just put on, for the moment it takes (which
 *  slot, and the item level before and after) */
export interface ArmouryView { justOn: { hero: string; slot: SlotId; from: number; to: number; at: number } | null }

/** what the armoury's buttons need from the sheets: what is open, a way to open something, and where it's drawn */
export interface ArmouryHost { app: App; root: HTMLElement; view: ArmouryView; spec(): SheetSpec | null; open(spec: SheetSpec): void }

/** The armoury with nothing left to guess: its hero, its tab, the picked slot (the first with something new,
 *  or else the weapon) and the picked piece (the first new one, or else what's worn). */
export function settle(p: Profile, s: GearSpec): GearSpec {
  const h = heroById(p, s.hero) || activeHero(p);
  if (!h) return s;
  const slot = s.slot || SLOT_IDS.find((x) => waitingFor(p, h, x)) || 'weapon';
  const row = shelfFor(p, h, slot);
  const pick = s.pick && row.some((x) => x.def.id === s.pick) ? s.pick : (row.find((x) => x.isNew) || row.find((x) => x.worn) || row[0]).def.id;
  return { kind: 'gear', hero: h.id, slot, pick, tab: s.tab || 'gear' };
}

/** Moving on from the slot you had open (another slot, another hero, or closing): you've looked, so its new
 *  uniques stop glowing. They stay yours to wear. True when that changed anything. */
export function leftSlot(p: Profile, from: SheetSpec | null, next: SheetSpec | null): boolean {
  if (!from || from.kind !== 'gear' || !from.slot) return false;
  if (next && next.kind === 'gear' && next.hero === from.hero && next.slot === from.slot) return false;
  const h = heroById(p, from.hero);
  return !!h && seenSlot(h, from.slot);
}

/** the armoury's buttons: its tabs, a slot, a piece, another hero, Put it on (with its moment), the weapon
 *  trait, playing as this hero, a title, a look on or off, and the way in from a drop's sheet */
export function armouryActions(x: ArmouryHost): Record<string, (el: HTMLElement) => void> {
  const cur = (): GearSpec | null => { const s = x.spec(); return s && s.kind === 'gear' ? s : null; };
  const gearHero = (): Hero | null => { const s = cur(); return s ? heroById(x.app.p, s.hero) : null; };
  const go = (patch: Partial<GearSpec>): void => { const s = cur(); if (!s) return; SFX.play('ui'); x.open({ ...s, ...patch }); };
  return {
    artab: (el) => go({ tab: el.dataset.tab as ArmouryTab }),
    arslot: (el) => go({ slot: el.dataset.slot as SlotId, pick: undefined, tab: 'gear' }),
    arpick: (el) => go({ pick: el.dataset.id }),
    arhero: (el) => { const s = cur(); if (!s || !el.dataset.id) return; SFX.play('ui'); x.open({ kind: 'gear', hero: el.dataset.id, tab: s.tab }); },
    arheroes: () => { SFX.play('ui'); x.open({ kind: 'heroes' }); },
    arwear: () => {
      const s = cur(), h = gearHero(), p = x.app.p, def = s?.pick ? ITEMS[s.pick] : undefined;
      if (!h || !def) return;
      const from = +ilvl(loadoutFor(p, h).score);
      if (!wear(p, h, def)) { SFX.play('nope'); return; }
      const v = x.view;
      v.justOn = { hero: h.id, slot: def.slot, from, to: +ilvl(loadoutFor(p, h).score), at: performance.now() };
      SFX.play('equip');
      x.app.save();
      // the moment happens up top (the slot bursts, the item level climbs), so scroll back up to it
      const b = x.root.querySelector<HTMLElement>('.sheet-body');
      if (b && b.scrollTop > 0) b.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(() => { if (v.justOn && performance.now() - v.justOn.at > 1500) v.justOn = null; }, 1600);
    },
    trait: (el) => { const h = gearHero(); if (!h) return; if (buyTrait(x.app.p, h, 'barrow', el.dataset.trait!)) { SFX.play('coin'); x.app.save(); } else SFX.play('nope'); },
    playas: () => { const h = gearHero(); if (!h) return; setActive(x.app.p, h.id); SFX.play('ui'); x.app.save(); },
    look: (el) => { const p = x.app.p, id = el.dataset.id!; const off = new Set(p.settings.looksOff); if (off.has(id)) off.delete(id); else off.add(id); p.settings.looksOff = [...off]; SFX.play('ui'); x.app.save(); },
    gearat: (el) => {
      const h = heroById(x.app.p, el.dataset.hero || null);
      if (!h) return;
      SFX.play('ui');
      if (x.app.scene === 'reveal') x.app.showHearth();
      x.open({ kind: 'gear', hero: h.id, slot: el.dataset.slot as SlotId, ...(el.dataset.id ? { pick: el.dataset.id } : {}) });
    },
    title: (el) => { const h = gearHero(); if (!h) return; h.title = el.dataset.id || null; SFX.play('ui'); x.app.save(); },
  };
}

/** the item level climbing after you put something on */
export function countUp(root: HTMLElement, view: ArmouryView): void {
  const j = view.justOn, el = root.querySelector<HTMLElement>('.ar-il b');
  if (!j || !el || el.dataset.done) return;
  el.dataset.done = '1';
  if (j.to === j.from) return;
  const t0 = performance.now(), dur = 700;
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = ilvl(j.from + (j.to - j.from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  el.textContent = ilvl(j.from);
  requestAnimationFrame(tick);
}

/** The armoury for a hero, on a settled spec. */
export function armourySheet(p: Profile, h: Hero, s: GearSpec, view: ArmouryView): { head: string; tabs: string; body: string; foot: string } {
  const tab = s.tab || 'gear', n = waiting(p, h).length;
  const tabs = `<div class="tabs" role="tablist">${ARMOURY_TABS.map((t) => `<button type="button" class="tab" role="tab" data-act="artab" data-tab="${t}" aria-selected="${t === tab}">${TAB_WORD[t]}${t === 'gear' && n ? ` <i class="tab-pip gold">${n}</i>` : ''}</button>`).join('')}</div>`;
  if (tab === 'abilities') return { head: head(p, h), tabs, body: abilities(p, h), foot: '' };
  if (tab === 'looks') return { head: head(p, h), tabs, body: looks(p, h), foot: '' };
  return { head: head(p, h), tabs, ...gear(p, h, s, view) };
}

/** who: the name and title, race, class and role, and your other heroes' faces (each with how many slots
 *  have something new for them, the ones with the most first). Three fit; past that, two and a +N that
 *  opens all your heroes. */
function head(p: Profile, h: Hero): string {
  const role = roleOf(h), race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
  const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
  const others = p.roster.filter((o) => o.id !== h.id).map((o) => ({ o, k: waiting(p, o).length })).sort((a, b) => b.k - a.k);
  const shown = others.length > 3 ? others.slice(0, 2) : others, rest = others.slice(shown.length);
  const badge = (k: number): string => (k ? `<i class="badge" aria-hidden="true">${k}</i>` : '');
  const faces = shown.map(({ o, k }) => `<button type="button" class="ar-face" data-act="arhero" data-id="${esc(o.id)}" style="--light: ${RACES[o.race as RaceId]?.light || '#F4B942'}" aria-label="${esc(o.name)}’s gear${k ? `, ${k} new` : ''}"><span class="ar-face-pic">${heroImg(heroSprite(o, roleOf(o), p), { cls: 'ar-face-img' })}</span>${badge(k)}</button>`).join('');
  const more = rest.length ? `<button type="button" class="ar-face ar-more" data-act="arheroes" aria-label="All your heroes"><span class="ar-face-pic">+${rest.length}</span>${badge(rest.reduce((n, r) => n + r.k, 0))}</button>` : '';
  return `<div class="ar-hd"><div class="ar-who"><h2>${esc(h.name)}${title ? ` <em class="h-title">${esc(title)}</em>` : ''}</h2><p><i class="rdot ${role}" aria-hidden="true"></i>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · ${esc(cls?.roleName || ROLES[role].title)}</p></div>
    ${faces ? `<div class="ar-faces" aria-label="Your other heroes">${faces}${more}</div>` : ''}</div>`;
}

/** the Gear tab: the hero, the slot row, the picked slot's pieces, the card, and Put it on at the bottom */
function gear(p: Profile, h: Hero, s: GearSpec, view: ArmouryView): { body: string; foot: string } {
  const role = roleOf(h), gk = gearKey(h), race = RACES[h.race as RaceId];
  const L = loadoutFor(p, h), w = worn(p, h), first = h.name.split(' ')[0];
  const slot = s.slot || 'weapon', row = shelfFor(p, h, slot);
  const picked = row.find((x) => x.def.id === s.pick) || row[0];
  const j = view.justOn && view.justOn.hero === h.id && performance.now() - view.justOn.at < 1400 ? view.justOn : null;
  const stage = `<div class="ar-stage${j ? ' just-on' : ''}" style="--light: ${race?.light || '#F4B942'}">
    <span class="ar-glow" aria-hidden="true"></span>${heroImg(heroSprite(h, role, p), { cls: 'ar-img', alt: h.name })}<span class="ar-floor" aria-hidden="true"></span>
    <div class="ar-il"><b>${ilvl(L.score)}</b><span>Item level</span></div>
    <div class="ar-pw"><span>${esc(cap(ROLE_STAT[role].short))}</span><b>+${powerPct(L)}%</b><span>Health</span><b>+${healthPct(L)}%</b></div>
    ${p.active === h.id ? '<span class="ar-playing">Playing</span>' : `<button type="button" class="btn small ar-play" data-act="playas">${GLYPH.play}Play as ${esc(first)}</button>`}
  </div>`;
  const slots = `<div class="ar-slots" role="tablist" aria-label="What ${esc(first)} wears">${SLOT_IDS.map((sl) => slotTile(p, h, w[sl], L.sets, sl === slot, j?.slot === sl)).join('')}</div>`;
  const found = row.filter((x) => x.found).length, toFind = row.length - found;
  const pieces = `<section class="ar-row" aria-label="${esc(ROLE_SLOTS[gk][slot].name)}: what ${esc(first)} has">
    <p class="ar-row-h"><b>${esc(ROLE_SLOTS[gk][slot].name)}</b><small>${found} yours${toFind ? ` · ${toFind} to find` : ''}</small></p>
    <div class="ar-pcs">${row.map((x) => pieceTile(p, x, x === picked)).join('')}</div></section>`;
  const body = `<div class="ar">${stage}${slots}${pieces}${pieceCard(p, h, picked)}${slot === 'weapon' ? traitRow(p, h) : ''}</div>`;
  return { body, foot: foot(p, h, slot, picked, j) };
}

/** one slot in the row: its piece in its rarity's frame, its item level, a set count or the unique star,
 *  New while something waits to go on, then a quiet arrow while something you have still beats it */
function slotTile(p: Profile, h: Hero, it: Worn, sets: Record<string, number>, on: boolean, just: boolean): string {
  const d = it.def, look = rarLook(d.id), name = ROLE_SLOTS[gearKey(h)][it.slot].name, shown = lookId(p, d.id);
  const isNew = !!waitingFor(p, h, it.slot), up = !isNew && betterFor(p, h, it.slot);
  const set = d.setId ? SETS[d.setId] : undefined;
  return `<button type="button" class="ar-slot${isNew ? ' new' : ''}${just ? ' just-on' : ''}" role="tab" aria-selected="${on}" data-act="arslot" data-slot="${it.slot}" style="--rc: ${look.color}" aria-label="${esc(name)}: ${esc(nameOf(shown))}, ${esc(look.name)}, item level ${itemScore(d)}${isNew ? ', something new to put on' : up ? ', something better to put on' : ''}">
    <span class="ar-st"><span class="tile">${iconOf(shown)}</span>${isNew ? '<i class="ar-new">New</i>' : ''}${up ? `<i class="ar-up" title="Something better">${GLYPH.rise}</i>` : ''}${set ? `<i class="ar-setn">${sets[set.id] || 0}/3</i>` : d.kind === 'unique' ? `<i class="ar-star">${STAR}</i>` : ''}<i class="ar-lv">${itemScore(d)}</i>${just ? BURST : ''}</span>
    <span class="ar-sn">${esc(name)}</span></button>`;
}

/** one piece in a slot's row as it looks (gilded, once its kit is yours): worn (a tick), new, picked, or not
 *  found yet (dimmed, with its drop rate) */
function pieceTile(p: Profile, x: ShelfPiece, on: boolean): string {
  const d = x.def, look = rarLook(d.id), shown = x.found ? lookId(p, d.id) : d.id;
  const chip = x.worn ? `<i class="ar-on" title="Wearing">${GLYPH.check}</i>` : `<i class="ar-lv">${x.found ? itemScore(d) : fmtRate(dropSource(p, d.id)?.rate) || '?'}</i>`;
  return `<button type="button" class="ar-pc${x.found ? '' : ' ghost'}" data-act="arpick" data-id="${esc(d.id)}" aria-pressed="${on}" style="--rc: ${look.color}; --rk: ${look.ink}" aria-label="${esc(nameOf(shown))}${x.worn ? ', wearing' : x.isNew ? ', new' : x.found ? '' : ', not found yet'}">
    <span class="ar-pt"><span class="tile">${iconOf(shown)}</span>${x.found ? '' : '<span class="ar-q" aria-hidden="true">?</span>'}${x.isNew ? '<i class="ar-new">New</i>' : ''}${chip}</span>
    <b>${esc(nameOf(shown))}</b></button>`;
}

/** the bottom: Put it on (gold unless it's a downgrade), or what's worn or not found yet, and the next slot
 *  with something new */
function foot(p: Profile, h: Hero, slot: SlotId, x: ShelfPiece, j: ArmouryView['justOn']): string {
  const next = SLOT_IDS.find((sl) => sl !== slot && waitingFor(p, h, sl));
  const nextBtn = next ? `<button type="button" class="btn small ar-next" data-act="arslot" data-slot="${next}"><span>Next new: ${esc(ROLE_SLOTS[gearKey(h)][next].name)}</span>${GLYPH.right}</button>` : '';
  if (!x.found) return `<p class="ar-note"><i class="ar-qi" aria-hidden="true">?</i><span>Not found yet</span></p>${nextBtn}`;
  if (x.worn) return `<p class="ar-note on">${GLYPH.check}<span>Wearing it<small>${j ? `Item level ${ilvl(j.to)}` : 'Tap another piece to compare'}</small></span></p>${nextBtn}`;
  const worse = compareOn(worn(p, h), gearKey(h), x.def).verdict === 'worse';
  return `<button type="button" class="btn big ar-wear${worse ? '' : ' gold'}" data-act="arwear">${GLYPH.shield}Put it on</button>`;
}

/** the Abilities tab: the four buttons with what the gear does to each, then what is always on */
function abilities(p: Profile, h: Hero): string {
  const gk = gearKey(h), ak = abKey(h), L = loadoutFor(p, h);
  const keyNum: Record<AbilitySlot, string> = { a1: '1', a2: '2', a3: '3', a4: '4' };
  const fx = effectsOf(L, gk).filter((e) => !e.later);
  const cards = SLOTS_AB.map((s) => {
    const ab = AB[ak][s];
    const buffs = fx.filter((e) => e.desc.toLowerCase().includes(ab.name.toLowerCase()));
    return `<article class="at-card${buffs.length ? ' on' : ''}">
      <div class="at-top">
        <span class="at-ic"><span class="tile">${tile(ab.key)}</span><kbd>${keyNum[s]}</kbd></span>
        <div class="at-info">
          <div class="at-title-row"><b>${esc(ab.name)}</b><span class="at-meta">${ab.hold ? 'Hold · Block' : `${ab.cd}s CD`}${ab.mana ? ` · ${ab.mana} Mana` : ''}</span></div>
          <p>${esc(ab.desc)}</p>
        </div>
      </div>
      ${buffs.map((b) => `<div class="at-combo"><b>+ ${esc(b.name)}:</b> ${esc(b.desc)}</div>`).join('')}
    </article>`;
  }).join('');
  const always = fx.filter((e) => e.kind === 'set' || e.kind === 'trait');
  return `<h3 class="section-title">Your four buttons<small>with your gear</small></h3><div class="at-list">${cards}</div>
    <h3 class="section-title">Always on<small>sets and the weapon trait</small></h3>
    ${always.length ? `<div class="ar-always">${always.map((e) => `<p><b>${esc(e.kind === 'trait' ? `${e.name} trait` : e.name)}</b> ${esc(e.desc)}</p>`).join('')}</div>` : '<p class="fine">Wear two pieces of a set, or a Rare weapon with a trait, to switch one on.</p>'}`;
}

/** the Looks tab: a title to wear, and the looks you own, on or off (never power) */
function looks(p: Profile, h: Hero): string {
  const role = roleOf(h);
  const titles = p.titles.filter((t) => TITLES[t]);
  const titleBox = `<div class="box"><h3 class="section-title">Title<small>shown with ${esc(h.name.split(' ')[0])}’s name</small></h3>${titles.length ? `<div class="titles" role="radiogroup">
    <button type="button" class="sg" role="radio" data-act="title" data-id="" aria-checked="${!h.title}">None</button>
    ${titles.map((t) => `<button type="button" class="sg" role="radio" data-act="title" data-id="${t}" aria-checked="${h.title === t}">${esc(TITLES[t].text)}</button>`).join('')}</div>` : '<p class="fine">Some achievements give a title. Every hero can wear the ones you earn.</p>'}</div>`;
  const ids = ['cosmetic.glow_shield', 'cosmetic.glow_staff', 'cosmetic.crit_ice', 'cosmetic.trail_wisp', 'dye.ghostly', 'dye.ghostly.gilded', 'cosmetic.gilded_bones']
    .filter((id) => (id === 'cosmetic.glow_shield' ? role === 'tank' : id === 'cosmetic.glow_staff' ? role === 'healer' : id === 'cosmetic.crit_ice' ? role === 'dps' : id === 'cosmetic.gilded_bones' ? h.race === 'risen' : true) && (!COLLECTIBLES[id].retired || !!p.collection[id]));
  const looksBox = `<div class="box"><h3 class="section-title">Looks<small>never power</small></h3><div class="picks">${ids.map((id) => {
    const c = COLLECTIBLES[id], own = !!p.collection[id], on = own && !p.settings.looksOff.includes(id);
    return `<button type="button" class="pick" data-act="${own ? 'look' : 'item'}" data-id="${id}" aria-pressed="${on}"><span class="tile" aria-hidden="true" ${own ? '' : 'style="filter: grayscale(1) opacity(0.5)"'}>${tile(c.icon)}</span><span><b>${esc(c.name)}</b><span>${own ? (on ? 'On' : 'Off') : esc(c.source)}</span></span></button>`;
  }).join('')}</div></div>`;
  return titleBox + looksBox;
}
