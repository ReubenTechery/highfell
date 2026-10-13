/**
 * Sheets: panels that slide up over the hearth. The dungeon picker, a hero's gear (the doll), the
 * logs (the collection log by boss and gathering spot, achievements, the Vale's story, stats), the
 * satchel, settings, the hearth spot picker and an item's details. Each one is drawn from the profile
 * every time, so whatever changed is always shown.
 */
import { ACHIEVEMENT_LIST, COLLECTIBLES, DUNGEONS, ITEMS, SETS, TITLES, thing } from '../content';
import { AB, ROLES, SLOTS_AB } from '../content/roles';
import { ROLE_SLOTS, SLOT_IDS, TRAITS, gearId, traitDef } from '../content/gear';
import { CLASSES, RACES, type ClassId, type RaceId } from '../content/folk';
import type { BossInfo, CollectibleKind, DropDef, DungeonInfo, ItemDef, NodeDef, PlaceDef, Rar, RoleId, SlotId, Tier } from '../content/types';
import { INGREDIENTS, INGREDIENT_ORDER, PLACES, RECIPES, RECIPE_ORDER, SKILLS } from '../content/vale';
import { rankProgress, recipeUnlocked, skillRank } from '../meta/vale';
import { activeHero, freshProfile, heroById, roleOf, setActive, type Hero } from '../meta/profile';
import { REROLL_COST, buyTrait, equip, healthPct, itemShare, loadoutFor, ownedFor, powerPct, worn, type Worn } from '../meta/gear';
import { HEARTH_SPOTS, place, spotById, spotOf } from '../meta/hearth';
import { maxPoints, points, progress } from '../meta/achievements';
import type { App } from './app';
import { actions, esc, fmtDate, fmtN, fmtRate, fmtT, GLYPH } from './dom';
import { colourOf, heroImg, heroSprite, iconOf, nameOf, rarLook, spriteURL, tile } from './art';
import { SFX } from './sound';
import { ilvl } from './hearth';
import { STARTS } from '../content/barrow/script.js';

export type LogTab = 'collection' | 'achievements' | 'lore' | 'stats';
const LOG_TABS: LogTab[] = ['collection', 'achievements', 'lore', 'stats'];
export type SheetSpec =
  | { kind: 'dungeon' }
  | { kind: 'satchel' }
  | { kind: 'gear'; hero: string; slot?: SlotId }
  | { kind: 'logs'; tab: LogTab; entry?: string }
  | { kind: 'settings' }
  | { kind: 'picker'; spot: string }
  | { kind: 'item'; id: string; back?: SheetSpec };

/** A panel carried over from an older version of the page might not make sense any more. */
export function normSpec(x: unknown): SheetSpec | null {
  const s = x as Record<string, any> | null;
  if (!s || typeof s !== 'object') return null;
  switch (s.kind) {
    case 'dungeon': case 'settings': case 'satchel': return { kind: s.kind };
    case 'gear': return typeof s.hero === 'string' ? { kind: 'gear', hero: s.hero, ...(SLOT_IDS.includes(s.slot) ? { slot: s.slot } : {}) } : null;
    case 'logs': return { kind: 'logs', tab: LOG_TABS.includes(s.tab) ? s.tab : 'collection', ...(typeof s.entry === 'string' ? { entry: s.entry } : {}) };
    case 'picker': return typeof s.spot === 'string' && spotById(s.spot) ? { kind: 'picker', spot: s.spot } : null;
    case 'item': return typeof s.id === 'string' && thing(s.id) ? { kind: 'item', id: s.id, ...(s.back ? { back: normSpec(s.back) || undefined } : {}) } : null;
  }
  return null;
}

type GearChoice = 'mine' | 2 | 3;
const KIND_WORD: Record<CollectibleKind, string> = { pet: 'Pets', mount: 'Mounts', trophy: 'Trophies', banner: 'Banners', cosmetic: 'Looks' };
const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'meta', 'hidden'];
const TIER_WORD: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', meta: 'Mastery', hidden: 'Hidden' };
/** what power does for each seat, in plain words */
const ROLE_STAT: Record<RoleId, { main: string; short: string }> = {
  tank: { main: 'damage and threat', short: 'damage' },
  healer: { main: 'healing', short: 'healing' },
  dps: { main: 'damage', short: 'damage' },
};
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 L14.9 8.7 L21.6 9.4 L16.6 13.9 L18 20.6 L12 17.2 L6 20.6 L7.4 13.9 L2.4 9.4 L9.1 8.7 Z" style="fill: #F2C230; stroke: #1E1A1A; stroke-width: 2; stroke-linejoin: round"/></svg>';
const LEFT_SLOTS: SlotId[] = ['helm', 'shoulders', 'chest'];

/** one page of the collection log: a boss and what it drops, a gathering spot or a villager's errands and what they give, or the rewards that are not drops */
interface LogEntry { id: string; group: string; name: string; items: string[]; dg?: DungeonInfo; boss?: BossInfo; vale?: { place: PlaceDef; node?: NodeDef; table: DropDef[] } }
const NODE_ART: Record<string, string> = { moonpetal: 'node_moonpetal', glowcap: 'node_glowcap', bramble: 'node_bramble' };
/** where a Vale rare comes from: its table, and the counter that is its kill count */
function valeSource(id: string): { rate: number; key: string; word: string } | null {
  for (const pl of Object.values(PLACES)) {
    for (const n of pl.nodes) { const d = n.table.find((x) => x.id === id); if (d) return { rate: d.rate, key: `vale.${pl.id}.${n.id}`, word: `harvested the ${n.name.toLowerCase()}` }; }
    const d = pl.errandTable.find((x) => x.id === id);
    if (d) return { rate: d.rate, key: `vale.${pl.id}.errands`, word: `done ${pl.villager.name.split(' ')[0]}’s errands` };
  }
  return null;
}

export class Sheets {
  spec: SheetSpec | null = null;
  /** the dungeon picker remembers its choices while the page is open */
  private pick = { mode: 'loot' as 'loot' | 'practice', start: 'keeper', gear: 'mine' as GearChoice };
  private resetArmed = false;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      close: () => this.close(),
      back: () => { const s = this.spec; if (s && s.kind === 'item' && s.back) this.open(s.back); else this.close(); },
      mode: (el) => { this.pick.mode = el.dataset.v as 'loot' | 'practice'; SFX.play('ui'); this.refresh(); },
      start: (el) => { this.pick.start = el.dataset.v!; SFX.play('ui'); this.refresh(); },
      tgear: (el) => { const v = el.dataset.v!; this.pick.gear = v === 'mine' ? 'mine' : (+v as 2 | 3); SFX.play('ui'); this.refresh(); },
      go: () => this.go(),
      camp: () => { SFX.play('ui'); this.close(); this.app.showCamp(); },
      slot: (el) => { const s = this.spec; if (!s || s.kind !== 'gear') return; SFX.play('ui'); this.open({ ...s, slot: el.dataset.slot as SlotId }); },
      equip: (el) => { const h = this.gearHero(); if (!h) return; equip(this.app.p, h, el.dataset.slot as SlotId, el.dataset.id || null); SFX.play('place'); this.app.save(); },
      trait: (el) => { const h = this.gearHero(); if (!h) return; if (buyTrait(this.app.p, h, 'barrow', el.dataset.trait!)) { SFX.play('coin'); this.app.save(); } else SFX.play('nope'); },
      playas: () => { const h = this.gearHero(); if (!h) return; setActive(this.app.p, h.id); SFX.play('ui'); this.app.save(); },
      look: (el) => { const p = this.app.p, id = el.dataset.id!; const off = new Set(p.settings.looksOff); if (off.has(id)) off.delete(id); else off.add(id); p.settings.looksOff = [...off]; SFX.play('ui'); this.app.save(); },
      tab: (el) => { SFX.play('ui'); this.open({ kind: 'logs', tab: el.dataset.tab as LogTab }); },
      entry: (el) => { SFX.play('ui'); this.open({ kind: 'logs', tab: 'collection', ...(el.dataset.id ? { entry: el.dataset.id } : {}) }); },
      item: (el) => { SFX.play('ui'); this.open({ kind: 'item', id: el.dataset.id!, back: this.spec || undefined }); },
      title: (el) => { const h = this.gearHero(); if (!h) return; h.title = el.dataset.id || null; SFX.play('ui'); this.app.save(); },
      place: (el) => { const s = this.spec; if (!s || s.kind !== 'picker') return; if (place(this.app.p, s.spot, el.dataset.id || null)) { SFX.play('place'); this.app.save(); this.close(); } },
      sound: () => { const p = this.app.p; p.settings.sound = !p.settings.sound; SFX.on = p.settings.sound; if (SFX.on) SFX.play('ui'); this.app.save(); },
      reset: () => {
        if (!this.resetArmed) { this.resetArmed = true; this.refresh(); setTimeout(() => { this.resetArmed = false; this.refresh(); }, 4000); return; }
        this.resetArmed = false;
        this.close();
        this.app.store.replace(freshProfile());
        this.app.toasts.text('Fresh start', 'Everything is back to zero. Make a hero to begin.');
      },
      preview: (el) => { this.close(); this.app.reveal.preview(el.dataset.v as 'normal' | 'unique' | 'pet'); },
      walkout: (el) => { this.app.setDev({ walkout: el.dataset.v as 'off' }); SFX.play('ui'); this.refresh(); },
      drink: (el) => { const p = this.app.p, id = el.dataset.id || null; p.vale.drink = id && RECIPES[id] ? id : null; SFX.play(id ? 'clink' : 'ui'); this.app.save(); },
      brewgo: () => { SFX.play('ui'); this.close(); this.app.showBrew(); },
      ridego: () => { SFX.play('ui'); this.close(); void this.app.showVale(); },
      lore: () => { SFX.play('page'); this.open({ kind: 'logs', tab: 'lore' }); },
      vfree: () => { this.app.setDev({ valeFree: !this.app.dev.valeFree }); SFX.play('ui'); this.app.refresh(); },
      vluck: () => { this.app.setDev({ valeLuck: !this.app.dev.valeLuck }); SFX.play('ui'); this.app.refresh(); },
    });
    root.addEventListener('click', (e) => { if (e.target === root.firstElementChild) this.close(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.spec) this.close(); });
  }

  open(spec: SheetSpec): void {
    const was = !!this.spec;
    this.spec = spec;
    this.render(!was);
  }
  close(): void {
    if (!this.spec) return;
    this.spec = null;
    this.root.innerHTML = '';
  }
  refresh(): void { if (this.spec) this.render(false); }

  private gearHero(): Hero | null {
    const s = this.spec;
    return s && s.kind === 'gear' ? heroById(this.app.p, s.hero) : null;
  }

  private render(fresh: boolean): void {
    const s = this.spec!;
    const scroll = this.root.querySelector('.sheet-body')?.scrollTop || 0;
    let head = '', tabs = '', body = '', foot = '', wide = false;
    switch (s.kind) {
      case 'dungeon': ({ head, body, foot } = this.dungeon()); break;
      case 'gear': {
        const h = heroById(this.app.p, s.hero) || activeHero(this.app.p);
        if (!h) { this.close(); return; }
        ({ head, body } = this.gear(h, s.slot || 'weapon'));
        break;
      }
      case 'logs': ({ head, tabs, body } = this.logs(s.tab, s.entry)); wide = s.tab === 'collection'; break;
      case 'settings': ({ head, body } = this.settings()); break;
      case 'satchel': ({ head, body } = this.satchel()); break;
      case 'picker': ({ head, body } = this.picker(s.spot)); break;
      case 'item': ({ head, body } = this.item(s.id, !!s.back)); break;
    }
    this.root.innerHTML = `<div class="sheet-wrap"><section class="sheet ${wide ? 'wide' : ''} k-${s.kind}" role="dialog" aria-modal="true" aria-label="${esc(head.replace(/<[^>]+>/g, ' ').trim().split('  ')[0] || 'Panel')}">
      <header class="sheet-head"><div>${head}</div><button type="button" class="icon-btn" data-act="close" aria-label="Close">${GLYPH.close}</button></header>
      ${tabs}<div class="sheet-body">${body}</div>${foot ? `<footer class="sheet-foot">${foot}</footer>` : ''}</section></div>`;
    const b = this.root.querySelector('.sheet-body');
    if (b && !fresh) b.scrollTop = scroll;
    if (fresh) (this.root.querySelector('.sheet-head .icon-btn') as HTMLElement | null)?.focus({ preventScroll: true });
    if (s.kind === 'logs' && s.tab === 'collection') this.markSeen();
  }

  /* ---------------------------------------------------------------- the dungeon picker */
  private dungeon() {
    const p = this.app.p, dg = DUNGEONS.barrow;
    const rec = p.dungeons.barrow, keeper = p.bosses['barrow.keeper'];
    const h = activeHero(p);
    const pr = this.pick;
    const practice = pr.mode === 'practice';
    const seg = (act: string, cur: string, opts: [string, string][]) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;
    const starts = STARTS.map((s: { id: string; name: string }) => [s.id, s.name] as [string, string]);
    let heroCard = '';
    if (h) {
      const role = roleOf(h), race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
      const L = loadoutFor(p, h);
      const bots = (['tank', 'healer', 'dps'] as RoleId[]).filter((r) => r !== role).map((r) => `${ROLES[r].name} (${ROLES[r].title})`).join(' and ');
      heroCard = `<div class="hero-card" style="--light: ${race?.light || '#F4B942'}">
        <span class="hc-fig" aria-hidden="true">${heroImg(heroSprite(h, role), { cls: 'hc-img' })}</span>
        <div class="hc-tx"><b>${esc(h.name)}</b><span>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · <i class="rdot ${role}"></i>${esc(cls?.roleName || ROLES[role].title)}</span><span>Item level ${ilvl(L.score)} · ${ROLE_STAT[role].short} +${powerPct(L)}%</span>
          <span class="kit">${SLOTS_AB.map((a) => `<span class="tile" title="${esc(AB[role][a].name)}">${tile(AB[role][a].key)}</span>`).join('')}</span></div>
        <button type="button" class="btn small" data-act="camp">${GLYPH.people}Change</button>
      </div><p class="fine">Bots take the other seats: ${esc(bots)}.</p>`;
    }
    const body = `
      <div class="dg-card">
        <span class="art" aria-hidden="true"><img src="${spriteURL('keeper')}" alt="" style="width: 92%; margin-bottom: -6px"></span>
        <div><h3>${esc(dg.name)}</h3><p>${esc(dg.blurb)}</p>
          <div class="chips"><span class="chip">Clears <b>${rec ? rec.clears : 0}</b></span><span class="chip">Best <b>${fmtT(rec?.pb)}</b></span><span class="chip">Gravekeeper KC <b>${keeper ? keeper.kc : 0}</b></span></div></div>
      </div>
      <h3 class="section-title">Your hero</h3>
      ${heroCard}
      <h3 class="section-title">Run</h3>
      ${seg('mode', pr.mode, [['loot', 'For loot'], ['practice', 'Practice']])}
      ${practice ? `
        <div class="box">
          <div class="seg-row"><b style="font-family: var(--f-display); font-weight: 400">Start at</b> ${seg('start', pr.start, starts)}</div>
          <div class="seg-row"><b style="font-family: var(--f-display); font-weight: 400">Gear</b> ${seg('tgear', String(pr.gear), [['mine', 'Mine'], ['2', 'Try Rare'], ['3', 'Try Epic']])}</div>
          <p class="fine">Practice gives no loot, no kill count and no achievements. Good for learning a boss.</p>
        </div>` : `<p class="fine">From the entrance. Kill counts, drops, the walkout and achievements all count. Every clear upgrades a piece of ${h ? esc(h.name.split(' ')[0]) + '’s' : 'your'} gear.</p>`}
      ${this.brewPicker(practice)}
      <div class="dg-card locked"><div><h3>More dungeons</h3><p style="color: inherit">Being mapped. Each one brings its own sets, pets, trophies and achievements.</p></div></div>`;
    const foot = `<button type="button" class="btn gold big" data-act="go" ${h ? '' : 'disabled'}>${practice ? 'Start practice' : 'Enter the crypt'}</button>`;
    return { head: `<h2>Into the Barrow</h2><p>Dungeon 1 of many</p>`, body, foot };
  }
  private go(): void {
    const pr = this.pick;
    SFX.play('ui');
    if (pr.mode === 'practice') this.app.startRun({ start: pr.start, testRar: pr.gear === 'mine' ? null : (pr.gear as Rar) });
    else this.app.startRun({ start: 'entrance', testRar: null });
  }

  /* ---------------------------------------------------------------- gear: the doll */
  private gear(h: Hero, sel: SlotId) {
    const p = this.app.p, role = roleOf(h);
    const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
    const L = loadoutFor(p, h);
    const w = worn(p, h);
    const word = ROLE_STAT[role];
    const card = (slot: SlotId) => this.slotCard(w[slot], role, L.sets, slot === sel);
    const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
    const doll = `<div class="doll" style="--light: ${race?.light || '#F4B942'}">
      <div class="doll-col l">${LEFT_SLOTS.map(card).join('')}</div>
      <div class="doll-fig"><span class="doll-glow" aria-hidden="true"></span>${heroImg(heroSprite(h, role), { cls: 'doll-img', alt: `${h.name}` })}<span class="doll-floor" aria-hidden="true"></span></div>
      <div class="doll-col r">
        <div class="doll-ilvl"><b>${ilvl(L.score)}</b><span>Item level</span></div>
        ${card('weapon')}
        <div class="doll-pw"><span>${esc(cap(word.short))}</span><b>+${powerPct(L)}%</b><span>Health</span><b>+${healthPct(L)}%</b></div>
      </div>
    </div>`;
    const extras = Object.entries(L.sets).map(([id, n]) => SETS[id] ? `<span class="chip set">${esc(SETS[id].name)} set <b>${n}/3</b>${n >= 2 ? ' · bonus on' : ''}</span>` : '').join('')
      + L.traits.map((t) => `<span class="chip">Trait <b>${esc(traitDef(role, t)?.name || t)}</b></span>`).join('');
    const stats = extras ? `<div class="power">${extras}</div>` : '';
    const tip = this.tooltip(h, w[sel], L.sets);
    // the set for this role
    const setBoxes = Object.values(SETS).filter((s) => s.role === role).map((set) => {
      const n = L.sets[set.id] || 0;
      const have = set.pieces.filter((id) => p.collection[id]).length;
      return `<div class="box setbox">
        <h3 class="section-title">${esc(set.name)} set<small>wearing ${n} of 3 · own ${have} of 3</small></h3>
        <div class="setpieces">${set.pieces.map((id) => { const own = !!p.collection[id], on = Object.values(w).some((x) => x.def.id === id); return `<button type="button" class="sp ${on ? 'on' : own ? 'own' : ''}" data-act="item" data-id="${id}"><span class="tile" aria-hidden="true">${iconOf(id)}</span><span>${esc(nameOf(id))}<small>${on ? 'Wearing' : own ? 'Owned' : fmtRate(1 / 50)}</small></span></button>`; }).join('')}</div>
        <div class="setline ${n >= 2 ? 'on' : ''}"><i>2</i><span>${esc(set.bonus2.desc)}</span></div>
        <div class="setline ${n >= 3 ? 'on' : ''} ${set.bonus3.ready ? '' : 'later'}"><i>3</i><span>${esc(set.bonus3.desc)}${set.bonus3.ready ? '' : ' <em>(coming in a later update)</em>'}</span></div>
        <p class="fine">Pieces drop from the Gravekeeper, 1 in 50 each. ${esc(set.look)}.</p></div>`;
    }).join('');
    // epic weapon trait
    const marks = p.dungeons.barrow?.marks || 0;
    const regW = h.regular.weapon;
    const traitBox = regW.rar === 3 ? `<div class="box"><h3 class="section-title">Weapon trait<small>${marks} Barrow Marks</small></h3>
      <div class="offer">${TRAITS[role].map((t) => `<button type="button" class="opt" data-act="trait" data-trait="${t.id}" aria-pressed="${regW.trait === t.id}" ${regW.trait === t.id || marks < REROLL_COST ? 'disabled' : ''}><b>${esc(t.name)}</b>${esc(t.desc)}${regW.trait === t.id ? '<span class="m">On your weapon</span>' : `<span class="m">Swap for ${REROLL_COST} marks</span>`}</button>`).join('')}</div>
      ${w.weapon.unique ? '<p class="fine">You are wearing a unique weapon; the trait is on your regular one.</p>' : ''}</div>`
      : `<p class="fine">At Epic your regular weapon rolls a trait that changes how a button works. Every clear moves your weakest piece up.</p>`;
    // title
    const titles = p.titles.filter((t) => TITLES[t]);
    const titleBox = `<div class="box"><h3 class="section-title">Title<small>shown with ${esc(h.name.split(' ')[0])}’s name</small></h3>${titles.length ? `<div class="titles" role="radiogroup">
      <button type="button" class="sg" role="radio" data-act="title" data-id="" aria-checked="${!h.title}">None</button>
      ${titles.map((t) => `<button type="button" class="sg" role="radio" data-act="title" data-id="${t}" aria-checked="${h.title === t}">${esc(TITLES[t].text)}</button>`).join('')}</div>` : '<p class="fine">Some achievements give a title. Every hero can wear the ones you earn.</p>'}</div>`;
    // looks
    const looks = ['cosmetic.glow_shield', 'cosmetic.glow_staff', 'cosmetic.crit_ice', 'cosmetic.trail_wisp', 'dye.ghostly']
      .filter((id) => (id === 'cosmetic.glow_shield' ? role === 'tank' : id === 'cosmetic.glow_staff' ? role === 'healer' : id === 'cosmetic.crit_ice' ? role === 'dps' : true));
    const looksBox = `<div class="box"><h3 class="section-title">Looks<small>never power</small></h3><div class="picks">${looks.map((id) => {
      const c = COLLECTIBLES[id], own = !!p.collection[id], on = own && !p.settings.looksOff.includes(id);
      return `<button type="button" class="pick" data-act="${own ? 'look' : 'item'}" data-id="${id}" aria-pressed="${on}"><span class="tile" aria-hidden="true" ${own ? '' : 'style="filter: grayscale(1) opacity(0.5)"'}>${tile(c.icon)}</span><span><b>${esc(c.name)}</b><span>${own ? (on ? 'On' : 'Off') : esc(c.source)}</span></span></button>`;
    }).join('')}</div></div>`;
    const play = p.active === h.id ? '' : `<div class="actions"><button type="button" class="btn small gold" data-act="playas">${GLYPH.play}Play as ${esc(h.name.split(' ')[0])}</button></div>`;
    const body = `${doll}${tip}${stats}${play}${setBoxes}${traitBox}${titleBox}${looksBox}`;
    const head = `<h2>${esc(h.name)}${title ? ` <em class="h-title">${esc(title)}</em>` : ''}</h2><p><i class="rdot ${role}" aria-hidden="true"></i>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · ${esc(cls?.roleName || ROLES[role].title)}${p.active === h.id ? ' · playing' : ''}</p>`;
    return { head, body };
  }

  /** one slot on the doll: rarity frame, set count, unique star and what it adds */
  private slotCard(it: Worn, role: RoleId, sets: Record<string, number>, on: boolean): string {
    const d = it.def, look = rarLook(d.id);
    const share = itemShare(d);
    const set = d.setId ? SETS[d.setId] : null;
    const slotName = ROLE_SLOTS[role][it.slot].name;
    return `<button type="button" class="slot r-${look.key}" data-act="slot" data-slot="${it.slot}" aria-pressed="${on}" style="--rc: ${look.color}; --rl: ${look.light}" aria-label="${esc(slotName)}: ${esc(d.name)}, ${esc(look.name)}${set ? `, ${esc(set.name)} set` : ''}">
      <span class="sl-tile"><span class="tile">${iconOf(d.id)}</span>${set ? `<i class="sl-set" title="${esc(set.name)} set">${sets[set.id] || 0}/3</i>` : ''}${d.kind === 'unique' ? `<i class="sl-star" title="Unique">${STAR}</i>` : ''}</span>
      <span class="sl-tx"><span class="sl-kind">${esc(slotName)}</span><b class="sl-name" style="color: ${look.ink}">${esc(d.name)}</b>
        <span class="sl-meta"><b style="color: ${look.ink}">${esc(look.name)}</b><span class="sl-il"> · ${share.ilvl}</span></span>
        <span class="sl-stat">${share.power > 0 ? `+${share.power}% ${ROLE_STAT[role].short}` : 'Starter'}</span>${set ? `<span class="sl-setname">${esc(set.name)} ${sets[set.id] || 0}/3</span>` : ''}</span>
    </button>`;
  }

  /** the item in the picked slot, the way an RPG tooltip reads */
  private tooltip(h: Hero, it: Worn, sets: Record<string, number>): string {
    const p = this.app.p, role = roleOf(h), d = it.def, look = rarLook(d.id);
    const share = itemShare(d);
    const slotName = ROLE_SLOTS[role][it.slot].name;
    const lines: string[] = [];
    if (share.power > 0) lines.push(`<li>+${share.power}% ${esc(ROLE_STAT[role].main)}</li><li>+${share.health}% health</li>`);
    else lines.push(`<li class="dim">Starter gear: no bonus yet</li>`);
    let extra = '';
    if (d.effectDesc) extra += `<p class="tip-eq">When worn: ${esc(d.effectDesc)}</p>`;
    const tr = it.trait ? traitDef(role, it.trait) : undefined;
    if (tr) extra += `<p class="tip-tr"><b>Trait: ${esc(tr.name)}.</b> ${esc(tr.desc)}</p>`;
    if (d.setId && SETS[d.setId]) {
      const s = SETS[d.setId], n = sets[s.id] || 0;
      const wornIds = new Set(Object.values(worn(p, h)).map((x) => x.def.id));
      extra += `<div class="tip-set"><b>${esc(s.name)} (${n}/3)</b><ul>${s.pieces.map((id) => `<li class="${wornIds.has(id) ? 'on' : p.collection[id] ? 'own' : ''}">${esc(nameOf(id))}${wornIds.has(id) ? '' : p.collection[id] ? ' · owned' : ''}</li>`).join('')}</ul>
        <p class="${n >= 2 ? 'on' : ''}">(2) ${esc(s.bonus2.desc)}</p><p class="${n >= 3 && s.bonus3.ready ? 'on' : ''}">(3) ${esc(s.bonus3.desc)}${s.bonus3.ready ? '' : ' Coming in a later update.'}</p></div>`;
    }
    if (d.flavor) extra += `<p class="tip-fl">“${esc(d.flavor)}”</p>`;
    let src = '';
    if (d.kind === 'gear') src = d.rar < 3 ? 'Regular gear. Every clear upgrades your weakest piece.' : 'Regular gear, as good as it gets. Clears now offer new traits.';
    else {
      for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) for (const x of tb.drops) if (x.id === d.id) src = `Drops from ${dg.bosses.find((b) => b.id === tb.boss)?.name || tb.boss}, ${fmtRate(x.rate)}.`;
      const e = p.collection[d.id];
      if (e) src += ` You got it at kill count ${fmtN(e.kc)}.`;
    }
    const owned = ownedFor(p, h, it.slot);
    const reg = h.regular[it.slot];
    const regName = ITEMS[gearId(role, it.slot, reg.rar)]?.name || 'Regular';
    const swap = owned.length ? `<div class="tip-swap" role="radiogroup" aria-label="Wear in the ${esc(slotName.toLowerCase())} slot"><span>Wear</span>
      <button type="button" class="sg" role="radio" data-act="equip" data-slot="${it.slot}" data-id="" aria-checked="${!it.unique}">${esc(regName)}</button>
      ${owned.map((u) => `<button type="button" class="sg" role="radio" data-act="equip" data-slot="${it.slot}" data-id="${u.id}" aria-checked="${it.unique && d.id === u.id}">${esc(u.name)}</button>`).join('')}</div>` : '';
    return `<div class="tip" style="--rc: ${look.color}; --rl: ${look.light}" aria-live="polite">
      <div class="tip-head"><span class="tile" aria-hidden="true">${iconOf(d.id)}</span><div><b class="tip-n">${esc(d.name)}</b><span class="tip-k">${esc(look.name)} ${esc(slotName.toLowerCase())} · Item level ${share.ilvl}</span></div></div>
      <ul class="tip-stats">${lines.join('')}</ul>${extra}<p class="tip-src">${esc(src)}</p>${swap}</div>`;
  }

  /* ---------------------------------------------------------------- logs */
  private logs(tab: LogTab, entry?: string) {
    const word: Record<LogTab, string> = { collection: 'Collection log', achievements: 'Achievements', lore: 'Story', stats: 'Stats' };
    const tabs = `<div class="tabs" role="tablist">${LOG_TABS.map((t) => `<button type="button" class="tab" role="tab" data-act="tab" data-tab="${t}" aria-selected="${t === tab}">${word[t]}</button>`).join('')}</div>`;
    const body = tab === 'collection' ? this.clog(entry) : tab === 'stats' ? this.stats() : tab === 'lore' ? this.lore() : this.achievements();
    return { head: `<h2>Logs</h2><p>Everything you have found, killed and earned</p>`, tabs, body };
  }

  private logEntries(): LogEntry[] { return logEntries(); }

  /** the collection log, OSRS style: every boss by dungeon on the left, its drops on the right */
  private clog(entry?: string): string {
    const p = this.app.p;
    const all = this.logEntries();
    const cur = all.find((e) => e.id === entry) || all[0];
    const total = new Set(all.flatMap((e) => e.items));
    const gotAll = [...total].filter((id) => p.collection[id]).length;
    let list = `<p class="cl-total">Obtained <b>${gotAll}/${total.size}</b></p>`;
    let group = '';
    for (const e of all) {
      if (e.group !== group) { group = e.group; list += `<h4 class="cl-group">${esc(group)}</h4>`; }
      const got = e.items.filter((id) => p.collection[id]).length;
      const fresh = e.items.some((id) => p.collection[id] && !p.seen[id]);
      list += `<button type="button" class="cl-entry ${got === e.items.length ? 'done' : got ? 'part' : ''}" data-act="entry" data-id="${e.id}" aria-current="${e === cur && !!entry}" aria-pressed="${e === cur}">
        <span>${esc(e.name)}${fresh ? '<i class="dot" aria-hidden="true"></i>' : ''}</span><b>${got}/${e.items.length}</b></button>`;
    }
    return `<div class="clog ${entry ? 'has-entry' : ''}"><nav class="cl-list" aria-label="Bosses and places">${list}</nav><section class="cl-page" aria-label="${esc(cur.name)}">${this.logPage(cur)}</section></div>`;
  }

  private logPage(e: LogEntry): string {
    const p = this.app.p;
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
      const v = e.vale, key = v.node ? `vale.${v.place.id}.${v.node.id}` : `vale.${v.place.id}.errands`;
      head = `<div class="cl-head vale"><span class="art" aria-hidden="true"><img src="${spriteURL(v.node ? NODE_ART[v.node.id] || 'node_moonpetal' : 'npc_gnome')}" alt=""></span><div>
        <p class="eyebrow">${esc(v.place.name)}</p><h3>${esc(e.name)}</h3>
        <p class="cl-obt">Obtained: <b class="${state}">${got}/${e.items.length}</b></p>
        <p class="cl-kc">${v.node ? 'Harvests' : 'Errands done'}: <b>${fmtN(p.counters[key] || 0)}</b></p></div></div>`;
    } else {
      head = `<div class="cl-head plain"><div><p class="eyebrow">${esc(e.group)}</p><h3>${esc(e.name)}</h3><p class="cl-obt">Obtained: <b class="${state}">${got}/${e.items.length}</b></p><p class="fine">Pets, mounts, trophies, banners and looks that achievements and firsts give. Never power.</p></div></div>`;
    }
    const rateOf = (id: string): number | undefined => { if (e.vale) return e.vale.table.find((d) => d.id === id)?.rate; if (!e.dg || !e.boss) return undefined; return e.dg.loot.find((t) => t.boss === e.boss!.id)?.drops.find((d) => d.id === id)?.rate; };
    const roleOfDrop = (id: string): RoleId | undefined => { if (!e.dg || !e.boss) return undefined; return e.dg.loot.find((t) => t.boss === e.boss!.id)?.drops.find((d) => d.id === id)?.role; };
    const grid = e.items.map((id) => {
      const c = p.collection[id];
      const isNew = c && !p.seen[id];
      const role = roleOfDrop(id);
      const ach = !e.boss && !e.vale ? ACHIEVEMENT_LIST.find((a) => a.reward.collectible === id) : undefined;
      const cap = c ? (c.kc ? `KC ${fmtN(c.kc)}` : 'Owned') : e.boss || e.vale ? `${fmtRate(rateOf(id))}${role ? ` · ${ROLES[role].title}` : ''}` : ach ? ach.name : COLLECTIBLES[id]?.source || '';
      return `<button type="button" class="cl-it ${c ? 'got' : 'miss'} ${isNew ? 'new' : ''}" data-act="item" data-id="${id}" title="${esc(nameOf(id))}" aria-label="${esc(nameOf(id))}${c ? `, obtained${c.n > 1 ? ' ' + c.n + ' times' : ''}` : ', not yet'}" style="--rc: ${colourOf(id)}">
        <span class="tile" aria-hidden="true">${iconOf(id)}</span>${c && c.n > 1 ? `<i class="q">${fmtN(c.n)}</i>` : ''}<span class="n">${esc(nameOf(id))}</span><span class="m">${esc(cap)}</span></button>`;
    }).join('');
    return `<button type="button" class="btn small cl-back" data-act="entry" data-id="">${GLYPH.left}Everything</button>${head}<div class="cl-grid">${grid}</div>`;
  }

  private markSeen(): void {
    const p = this.app.p;
    let changed = false;
    for (const id of Object.keys(p.collection)) if (!p.seen[id]) { p.seen[id] = Date.now(); changed = true; }
    if (changed) this.app.store.save();
  }

  private stats(): string {
    const p = this.app.p;
    let out = '';
    for (const dg of Object.values(DUNGEONS)) {
      const rec = p.dungeons[dg.id];
      out += `<h3 class="section-title">${esc(dg.name)}</h3>
        <div class="stats"><span class="chip">Runs <b>${rec ? rec.runs : 0}</b></span><span class="chip">Clears <b>${rec ? rec.clears : 0}</b></span><span class="chip">Best <b>${fmtT(rec?.pb)}</b></span><span class="chip">${esc(dg.marksName)} <b>${rec ? rec.marks : 0}</b></span></div>`;
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
    out += `<h3 class="section-title">The Vale</h3><div class="stats">${row('vale.harvests', 'Harvests')}${row('vale.perfects', 'Perfects')}${row('vale.errands', 'Errands')}${row('vale.brews', 'Brews')}<span class="chip">Rides out <b>${fmtN(p.vale.rides)}</b></span><span class="chip">Gathering <b>${skillRank(p, 'gather')}</b></span><span class="chip">Brewing <b>${skillRank(p, 'brew')}</b></span></div>`;
    out += `<h3 class="section-title">Lifetime</h3><div class="stats">${row('kills', 'Kills')}${row('barrow.skeletons', 'Skeletons')}${row('barrow.wisps', 'Wisps sliced')}${row('barrow.chains', 'Chains cut')}${row('perfect_blocks', 'Perfect blocks')}${row('dodges', 'Dodges')}${row('saves', 'Saves')}${row('crits', 'Crits')}${row('biggest_crit', 'Biggest crit')}${row('deaths', 'Deaths')}${row('wipes', 'Wipes')}</div>`;
    return out;
  }

  private achievements(): string {
    const p = this.app.p;
    let out = `<div class="stats"><span class="chip">Points <b>${points(p)}</b> / ${maxPoints()}</span><span class="chip">Earned <b>${Object.keys(p.achievements).length}</b> / ${ACHIEVEMENT_LIST.length}</span><span class="chip">Titles <b>${p.titles.length}</b></span></div>`;
    for (const tier of TIER_ORDER) {
      const list = ACHIEVEMENT_LIST.filter((a) => a.tier === tier);
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

  /* ---------------------------------------------------------------- one item */
  private item(id: string, hasBack: boolean) {
    const p = this.app.p;
    const t = thing(id);
    const e = p.collection[id];
    let kind = '', desc = '', more = '';
    if (t?.kind === 'item') {
      const d: ItemDef = t.def;
      const look = rarLook(id);
      kind = d.kind === 'unique' ? `Unique ${ROLE_SLOTS[d.role][d.slot].name.toLowerCase()} · ${ROLES[d.role].title}` : d.kind === 'set' ? `Epic · ${SETS[d.setId!].name} set · ${ROLES[d.role].title} ${d.slot}` : `${look.name} ${d.slot}`;
      desc = d.flavor || '';
      const share = itemShare(d);
      more += `<div class="stats"><span class="chip">Item level <b>${share.ilvl}</b></span>${share.power > 0 ? `<span class="chip">${esc(cap(ROLE_STAT[d.role].main))} <b>+${share.power}%</b></span><span class="chip">Health <b>+${share.health}%</b></span>` : ''}</div>`;
      if (d.effectDesc) more += `<div class="box"><b style="font-family: var(--f-display); font-weight: 400">When worn</b><span class="fine">${esc(d.effectDesc)}</span></div>`;
      if (d.setId) { const s = SETS[d.setId]; more += `<div class="box setbox"><b style="font-family: var(--f-display); font-weight: 400">${esc(s.name)} set</b><div class="setline"><i>2</i><span>${esc(s.bonus2.desc)}</span></div><div class="setline later"><i>3</i><span>${esc(s.bonus3.desc)}</span></div></div>`; }
    } else if (t?.kind === 'collectible') {
      kind = KIND_WORD[t.def.kind];
      desc = t.def.desc;
    }
    let source = '';
    for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) for (const d of tb.drops) if (d.id === id) source = `${dg.bosses.find((b) => b.id === tb.boss)?.name}, ${fmtRate(d.rate)}${d.role ? ` (${ROLES[d.role].title})` : ''}`;
    if (!source && t?.kind === 'collectible') source = t.def.source;
    const kc = (() => { for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) if (tb.drops.some((d) => d.id === id)) return p.bosses[`${dg.id}.${tb.boss}`]?.kc || 0; return null; })();
    const vs = valeSource(id);
    const got = e ? `Got it${e.kc ? ` at ${vs ? 'count' : 'kill count'} ${fmtN(e.kc)}` : ''} on ${fmtDate(e.at)}${e.n > 1 ? `. Seen ${e.n} times.` : '.'}`
      : kc !== null ? `Not yet. Your kill count is ${fmtN(kc)}.` : vs ? `Not yet. You’ve ${vs.word} ${fmtN(p.counters[vs.key] || 0)} times.` : 'Not yet.';
    const spot = e ? spotOf(p, id) : null;
    const body = `<div class="detail"><span class="tile" aria-hidden="true" style="box-shadow: 0 3px 0 var(--ink), inset 0 0 0 4px ${colourOf(id)}">${iconOf(id)}</span>
      <div><h3>${esc(nameOf(id))}</h3><p class="fine">${esc(kind)}</p></div></div>
      ${desc ? `<p class="lede">${esc(desc)}</p>` : ''}${more}
      <div class="stats"><span class="chip">From <b>${esc(source || 'Unknown')}</b></span></div>
      <p class="fine">${esc(got)}${spot ? ` It is in your hearth: ${esc(spotById(spot)?.label.toLowerCase() || '')}.` : ''}</p>
      ${hasBack ? `<div class="actions"><button type="button" class="btn small" data-act="back">${GLYPH.left}Back</button></div>` : ''}`;
    return { head: `<h2>${esc(nameOf(id))}</h2><p>${esc(kind)}</p>`, body };
  }

  /* ---------------------------------------------------------------- hearth spot picker */
  private picker(spotId: string) {
    const p = this.app.p, spot = spotById(spotId)!;
    const all = Object.values(COLLECTIBLES).filter((c) => c.kind === spot.kind);
    const cur = p.hearth.spots[spotId] || null;
    const picks = all.map((c) => {
      const own = !!p.collection[c.id];
      const where = own ? spotOf(p, c.id) : null;
      const note = !own ? c.source : where && where !== spotId ? `Moves from ${spotById(where)?.label.toLowerCase()}` : where === spotId ? 'Here now' : 'Put it here';
      return `<button type="button" class="pick" data-act="${own ? 'place' : 'item'}" data-id="${c.id}" aria-pressed="${cur === c.id}"><span class="tile" aria-hidden="true" ${own ? '' : 'style="filter: grayscale(1) opacity(0.45)"'}>${tile(c.icon)}</span><span><b>${own ? esc(c.name) : '?'}</b><span>${esc(note)}</span></span></button>`;
    }).join('');
    const n = HEARTH_SPOTS.filter((s) => s.kind === spot.kind).length;
    const body = `<div class="picks">${picks}</div>
      ${cur ? `<div class="actions"><button type="button" class="btn small" data-act="place" data-id="">Leave it empty</button></div>` : ''}
      <p class="fine">${spot.kind === 'pet' ? 'Pets are rare drops. Once you have one it follows you home.' : spot.kind === 'mount' ? 'Mounts are very rare drops.' : spot.kind === 'trophy' ? 'Trophies come from achievements and bosses.' : 'Banners come from achievements.'} Later you will be able to invite people over to see it.</p>`;
    return { head: `<h2>${esc(spot.label)}</h2><p>${esc(KIND_WORD[spot.kind])} · ${n} spot${n > 1 ? 's' : ''} in the hearth</p>`, body };
  }

  /* ---------------------------------------------------------------- brews, the satchel, the story */
  /** which brew you take into the dungeon: one bottle a run */
  private brewPicker(practice: boolean): string {
    const p = this.app.p;
    const have = RECIPE_ORDER.filter((id) => (p.vale.shelf[id] || 0) > 0);
    const drink = p.vale.drink && (p.vale.shelf[p.vale.drink] || 0) > 0 ? p.vale.drink : null;
    if (!have.length) return `<h3 class="section-title">Brew<small>one bottle a run</small></h3><p class="fine">No brews yet. Ride out to Bramblewick, gather, then brew at the cauldron by your fire.</p>`;
    const opt = (id: string | null) => {
      const r = id ? RECIPES[id] : null;
      return `<button type="button" class="brw" role="radio" data-act="drink" data-id="${id || ''}" aria-checked="${drink === id}" ${r ? `style="--c: ${r.color}"` : ''}>
        <span class="tile" aria-hidden="true" ${r ? '' : 'style="filter: grayscale(1) opacity(0.6)"'}>${tile(r ? r.icon : 's_brew')}</span>
        <span><b>${r ? esc(r.name) : 'No brew'}${r ? ` <small>×${p.vale.shelf[r.id]}</small>` : ''}</b><span>${r ? esc(r.desc) : 'Go in as you are.'}</span></span></button>`;
    };
    return `<h3 class="section-title">Brew<small>one bottle a run</small></h3>
      <div class="brews" role="radiogroup" aria-label="Brew">${opt(null)}${have.map(opt).join('')}</div>
      <p class="fine">${practice ? 'Practice uses the brew but keeps the bottle.' : 'You drink it at the door. Win or wipe, the bottle is gone.'}</p>`;
  }

  private satchel() {
    const p = this.app.p, scene = this.app.scene;
    const ing = INGREDIENT_ORDER.map((id) => {
      const n = p.vale.satchel[id] || 0, d = INGREDIENTS[id];
      return `<div class="sat-it ${n ? '' : 'none'} ${d.rare ? 'rare' : ''}" title="${esc(d.desc)}"><span class="tile" aria-hidden="true">${tile(d.icon)}</span><b>${fmtN(n)}</b><span>${esc(d.name)}</span></div>`;
    }).join('');
    const shelf = RECIPE_ORDER.map((id) => {
      const n = p.vale.shelf[id] || 0, r = RECIPES[id], on = p.vale.drink === id && n > 0;
      const note = on ? 'Taking it on your next run' : n ? 'Tap to take it on your next run' : recipeUnlocked(p, id) ? 'Brew some at the cauldron' : `Learn it at Brewing ${r.rank}`;
      return `<button type="button" class="pick" data-act="drink" data-id="${on ? '' : id}" aria-pressed="${on}" ${n ? '' : 'disabled'}><span class="tile" aria-hidden="true" ${n ? '' : 'style="filter: grayscale(1) opacity(0.5)"'}>${tile(r.icon)}</span><span><b>${esc(r.name)} ×${n}</b><span>${esc(note)}</span></span></button>`;
    }).join('');
    const skills = ['gather', 'brew'].map((sk) => {
      const pr = rankProgress(p.vale.xp[sk] || 0);
      return `<div class="skill"><span class="tile" aria-hidden="true">${tile(sk === 'brew' ? 's_brew' : 's_gather')}</span><div><b>${esc(SKILLS[sk].name)} ${pr.rank}</b><div class="bar"><i style="width: ${(pr.k * 100).toFixed(1)}%"></i></div><span>${pr.need ? `${fmtN(pr.into)} / ${fmtN(pr.need)} to rank ${pr.rank + 1}` : 'Top rank'} · ${esc(SKILLS[sk].blurb)}</span></div></div>`;
    }).join('');
    const pages = p.vale.lore.length, total = Object.values(PLACES).reduce((a, pl) => a + pl.lore.length, 0);
    const go = `${scene !== 'brew' ? `<button type="button" class="btn small gold" data-act="brewgo">${GLYPH.pot}Go to the cauldron</button>` : ''}${scene !== 'vale' ? `<button type="button" class="btn small" data-act="ridego">${GLYPH.sign}Ride out</button>` : ''}`;
    const body = `
      <h3 class="section-title">Ingredients</h3><div class="sat-grid">${ing}</div>
      <h3 class="section-title">Brews<small>one bottle is one dungeon run</small></h3><div class="picks">${shelf}</div>
      ${go ? `<div class="actions">${go}</div>` : ''}
      <h3 class="section-title">Skills</h3><div class="skills">${skills}</div>
      <div class="actions"><button type="button" class="btn small" data-act="lore">${GLYPH.book}The Vale’s story · ${pages} of ${total} pages</button></div>`;
    return { head: `<h2>Satchel</h2><p>What you have gathered and brewed</p>`, body };
  }

  /** the pages of each place's story, found one an errand */
  private lore(): string {
    const p = this.app.p;
    let out = '';
    for (const pl of Object.values(PLACES)) {
      const have = pl.lore.filter((l) => p.vale.lore.includes(l.id)).length;
      out += `<h3 class="section-title">${esc(pl.name)}<small>${have} of ${pl.lore.length} pages</small></h3><div class="pages">`;
      out += pl.lore.map((l, i) => (p.vale.lore.includes(l.id)
        ? `<article class="page"><small>Page ${i + 1}</small><b>${esc(l.title)}</b><p>${esc(l.text)}</p></article>`
        : `<article class="page locked"><small>Page ${i + 1}</small><b>Not found yet</b><p>Do ${esc(pl.villager.name.split(' ')[0])}’s errands. Every one turns up a page.</p></article>`)).join('');
      out += '</div>';
    }
    return out + '<p class="fine">Each place you can ride to has its own story. More places are coming.</p>';
  }

  /* ---------------------------------------------------------------- settings */
  private settings() {
    const p = this.app.p, st = this.app.store.state, dev = this.app.dev;
    const where = st === 'account' ? 'Saved to your account. It follows you between your phone and your computer.' : st === 'connecting' ? 'Connecting to your account…' : st === 'offline' ? 'Your account save could not be reached, so this device is keeping your progress until it can.' : 'Saved on this device. Open the game on claude.ai to keep it in your account too.';
    const seg = (act: string, cur: string, opts: [string, string][]) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;
    const body = `
      <div class="box"><h3 class="section-title">Sound</h3><div class="actions"><button type="button" class="btn small" data-act="sound">${p.settings.sound ? GLYPH.sound + 'Sound on' : GLYPH.mute + 'Sound off'}</button></div></div>
      <div class="box"><h3 class="section-title">Your save</h3><p class="fine">${esc(where)}</p><p class="fine">Save ${fmtN(p.rev)} · started ${fmtDate(p.createdAt)} · ${p.roster.length} hero${p.roster.length === 1 ? '' : 'es'}</p></div>
      <div class="box"><h3 class="section-title">For testing</h3>
        <p class="fine">See the end-of-run reveal without earning it. Nothing is added to your save.</p>
        <div class="actions"><button type="button" class="btn small" data-act="preview" data-v="normal">Normal</button><button type="button" class="btn small" data-act="preview" data-v="unique">Unique</button><button type="button" class="btn small" data-act="preview" data-v="pet">Pet</button></div>
        <p class="fine">Play the lantern's walkout at the end of practice runs, so you can learn the tells.</p>
        ${seg('walkout', dev.walkout, [['off', 'Off'], ['normal', 'Normal'], ['unique', 'Unique'], ['pet', 'Pet']])}
        <p class="fine">The Vale: free harvests don’t use up a spot, and lucky makes its rares 50 times likelier. What you get still goes in your save.</p>
        <div class="seg"><button type="button" class="sg" role="switch" data-act="vfree" aria-checked="${dev.valeFree}">Free harvests</button><button type="button" class="sg" role="switch" data-act="vluck" aria-checked="${dev.valeLuck}">Lucky ×50</button></div></div>
      <div class="box"><h3 class="section-title">Start over</h3><p class="fine">Wipes every hero, their gear, kill counts, the collection log, achievements and the hearth.</p>
        <div class="actions"><button type="button" class="btn small" data-act="reset" style="${this.resetArmed ? 'background: var(--red); color: #FFFFFF' : ''}">${this.resetArmed ? 'Tap again to wipe everything' : 'Start over'}</button></div></div>
      <p class="fine">Build ${esc(BUILD)}</p>`;
    return { head: `<h2>Settings</h2>`, body };
  }
}

/** every page of the collection log, in order: bosses by dungeon, then the Vale's places, then other rewards */
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
  for (const pl of Object.values(PLACES)) {
    for (const n of pl.nodes) out.push({ id: `vale.${pl.id}.${n.id}`, group: pl.name, name: n.name, items: n.table.map((d) => d.id), vale: { place: pl, node: n, table: n.table } });
    out.push({ id: `vale.${pl.id}.errands`, group: pl.name, name: `${pl.villager.name.split(' ')[0]}’s errands`, items: pl.errandTable.map((d) => d.id), vale: { place: pl, table: pl.errandTable } });
  }
  const drops = new Set([...Object.values(DUNGEONS).flatMap((d) => d.loot.flatMap((t) => t.drops.map((x) => x.id))), ...out.flatMap((e) => (e.vale ? e.items : []))]);
  out.push({ id: 'other.rewards', group: 'Other', name: 'Rewards', items: Object.values(COLLECTIBLES).filter((c) => !drops.has(c.id)).map((c) => c.id) });
  return out;
}
/** how much of the whole collection log you have, for the hearth's Logs button */
export function logTotal(p: { collection: Record<string, unknown> }): { got: number; total: number } {
  const all = new Set(logEntries().flatMap((e) => e.items));
  return { got: [...all].filter((id) => p.collection[id]).length, total: all.size };
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

declare const __BUILD__: string;
const BUILD = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';
