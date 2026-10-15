/**
 * Sheets: panels that slide up over the house. The dungeon picker, a hero (from their bed), a hero's
 * gear (the doll), the logs (logsheet.ts: the collection log, achievements, the Vale's story, stats), the
 * satchel, settings, the spot picker, the house's looks and an item's details. Each one is drawn from the
 * profile every time, so whatever changed is always shown. This file opens and closes them and wires up
 * their buttons; most of them draw in a file of their own.
 */
import { COLLECTIBLES, DUNGEONS, ITEMS, SETS, TITLES, thing } from '../content';
import { AB, ROLES, SLOTS_AB, abKey } from '../content/roles';
import { ROLE_SLOTS, SLOT_IDS, TRAITS, gearId, gearKey, traitDef } from '../content/gear';
import { CLASSES, RACES, type ClassId, type RaceId } from '../content/folk';
import type { AbilitySlot, GearKey, ItemDef, Rar, RoleId, SlotId } from '../content/types';
import { INGREDIENTS, INGREDIENT_ORDER, PLACES, RECIPES, RECIPE_ORDER, SKILLS } from '../content/vale';
import { rankProgress, recipeUnlocked } from '../meta/vale';
import { activeHero, freshProfile, heroById, nameProblem, removeHero, renameHero, roleOf, setActive, type Hero } from '../meta/profile';
import { pickRole } from '../meta/party';
import { REROLL_COST, bestRegular, buyTrait, effectsOf, equip, healthPct, itemShare, loadoutFor, ownedFor, powerPct, putOn, seenSlot, waitingFor, worn, type Waiting, type Worn } from '../meta/gear';
import { HEARTH_SPOTS, place, setLook, spotById, spotOf } from '../meta/hearth';
import type { App } from './app';
import { actions, cap, esc, fmtN, fmtRate, GLYPH } from './dom';
import { heroImg, heroSprite, iconOf, nameOf, rarLook, tile } from './art';
import { SFX } from './sound';
import { ilvl } from './hearth';
import { heroSheet, type HeroSheetState } from './herosheet';
import { dungeonSheet, pickedDungeon, type DungeonPick } from './dungeonsheet';
import { itemSheet, KIND_WORD, ROLE_STAT } from './itemsheet';
import { LOG_TABS, logsSheet, type LogTab } from './logsheet';
import { looksSheet, pickedLook } from './lookssheet';
import { settingsSheet } from './settingssheet';

export type SheetSpec =
  | { kind: 'dungeon' }
  | { kind: 'satchel' }
  | { kind: 'hero'; hero: string }
  | { kind: 'gear'; hero: string; slot?: SlotId }
  | { kind: 'logs'; tab: LogTab; entry?: string }
  | { kind: 'settings' }
  | { kind: 'picker'; spot: string }
  | { kind: 'item'; id: string; back?: SheetSpec }
  | { kind: 'looks' };

/** A panel carried over from an older version of the page might not make sense any more. */
export function normSpec(x: unknown): SheetSpec | null {
  const s = x as Record<string, any> | null;
  if (!s || typeof s !== 'object') return null;
  switch (s.kind) {
    case 'dungeon': case 'settings': case 'satchel': case 'looks': return { kind: s.kind };
    case 'hero': return typeof s.hero === 'string' ? { kind: 'hero', hero: s.hero } : null;
    case 'gear': return typeof s.hero === 'string' ? { kind: 'gear', hero: s.hero, ...(SLOT_IDS.includes(s.slot) ? { slot: s.slot } : {}) } : null;
    case 'logs': return { kind: 'logs', tab: LOG_TABS.includes(s.tab) ? s.tab : 'collection', ...(typeof s.entry === 'string' ? { entry: s.entry } : {}) };
    case 'picker': return typeof s.spot === 'string' && spotById(s.spot) ? { kind: 'picker', spot: s.spot } : null;
    case 'item': return typeof s.id === 'string' && thing(s.id) ? { kind: 'item', id: s.id, ...(s.back ? { back: normSpec(s.back) || undefined } : {}) } : null;
  }
  return null;
}

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 L14.9 8.7 L21.6 9.4 L16.6 13.9 L18 20.6 L12 17.2 L6 20.6 L7.4 13.9 L2.4 9.4 L9.1 8.7 Z" style="fill: #F2C230; stroke: #1E1A1A; stroke-width: 2; stroke-linejoin: round"/></svg>';
const LEFT_SLOTS: SlotId[] = ['helm', 'shoulders', 'chest'];


export class Sheets {
  spec: SheetSpec | null = null;
  /** the dungeon picker remembers its choices while the page is open */
  private pick: DungeonPick = { mode: 'loot', start: 'keeper', gear: 'mine', role: null, alts: false, log: false, heroic: false };
  private resetArmed = false;
  /** the look picked in the looks sheet, while the page is open */
  private lookPick: string | null = null;
  /** the collection log shows the heroic dungeons' pages instead of the normal ones */
  private logHeroic = false;
  /** a hero's sheet: letting them go takes two taps, and renaming has its own little form */
  private heroSt: HeroSheetState = { delArmed: false, renaming: false, err: '' };
  private heroTimer = 0;
  /** the piece just put on, for the moment it takes: which slot and the item level before and after */
  private justOn: { hero: string; slot: SlotId; from: number; to: number; at: number } | null = null;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      close: () => this.close(),
      back: () => { const s = this.spec; if (s && s.kind === 'item' && s.back) this.open(s.back); else this.close(); },
      mode: (el) => { this.pick.mode = el.dataset.v as 'loot' | 'practice'; SFX.play('ui'); this.refresh(); },
      start: (el) => { this.pick.start = el.dataset.v!; SFX.play('ui'); this.refresh(); },
      tgear: (el) => { const v = el.dataset.v!; this.pick.gear = v === 'mine' ? 'mine' : (+v as 2 | 3); SFX.play('ui'); this.refresh(); },
      role: (el) => {
        const r = el.dataset.role as RoleId, p = this.app.p, was = p.active;
        this.pick.role = r; this.pick.alts = false;
        SFX.play('ui');
        if (pickRole(p, r) && p.active !== was) this.app.save(); else this.refresh();
      },
      alts: () => { this.pick.alts = !this.pick.alts; SFX.play('ui'); this.refresh(); },
      logx: () => { this.pick.log = !this.pick.log; SFX.play('ui'); this.refresh(); },
      diff: (el) => { this.pick.heroic = el.dataset.v === 'heroic'; SFX.play('ui'); this.refresh(); },
      playseat: (el) => {
        const h = heroById(this.app.p, el.dataset.id || null); if (!h) return;
        setActive(this.app.p, h.id); this.pick.role = roleOf(h); this.pick.alts = false; SFX.play('place'); this.app.save();
      },
      newseat: (el) => { const r = el.dataset.role as RoleId; this.pick.alts = false; SFX.play('ui'); this.close(); this.app.showCreate(r); },
      go: () => this.go(),
      heroplay: () => {
        const h = this.sheetHero(); if (!h) return;
        SFX.play('ui'); setActive(this.app.p, h.id); this.close(); this.app.save();
        this.app.toasts.text(h.name, 'By the fire in the hall.');
        this.app.showHearth('hall');
      },
      herogear: () => { const h = this.sheetHero(); if (h) { SFX.play('ui'); this.open({ kind: 'gear', hero: h.id }); } },
      herorename: () => { this.heroSt = { ...this.heroSt, renaming: true, err: '' }; SFX.play('ui'); this.refresh(); this.root.querySelector<HTMLInputElement>('#cp-name')?.select(); },
      herocancel: () => { this.heroSt = { ...this.heroSt, renaming: false }; this.refresh(); },
      herodel: () => {
        const h = this.sheetHero(), p = this.app.p;
        if (!h || p.roster.length <= 1) { SFX.play('nope'); return; }
        if (!this.heroSt.delArmed) {
          this.heroSt = { ...this.heroSt, delArmed: true }; SFX.play('ui'); this.refresh();
          this.heroTimer = window.setTimeout(() => { this.heroSt = { ...this.heroSt, delArmed: false }; this.refresh(); }, 4000);
          return;
        }
        clearTimeout(this.heroTimer);
        const name = h.name;
        if (removeHero(p, h.id)) { SFX.play('ui'); this.close(); this.app.save(); this.app.toasts.text(`${name} has gone`, 'Their uniques stay in your collection.'); }
      },
      slot: (el) => { const s = this.spec; if (!s || s.kind !== 'gear') return; SFX.play('ui'); this.open({ ...s, slot: el.dataset.slot as SlotId }); },
      equip: (el) => {
        const h = this.gearHero(); if (!h) return;
        const slot = el.dataset.slot as SlotId, id = el.dataset.id || null;
        if (id && h.fresh.includes(id)) { this.putOn(h, slot); return; }
        equip(this.app.p, h, slot, id); if (!id) seenSlot(h, slot); SFX.play('place'); this.app.save();
      },
      puton: (el) => { const h = this.gearHero(); if (h) this.putOn(h, el.dataset.slot as SlotId); },
      notnow: (el) => { const h = this.gearHero(); if (!h) return; seenSlot(h, el.dataset.slot as SlotId); SFX.play('ui'); this.app.save(); },
      trait: (el) => { const h = this.gearHero(); if (!h) return; if (buyTrait(this.app.p, h, 'barrow', el.dataset.trait!)) { SFX.play('coin'); this.app.save(); } else SFX.play('nope'); },
      playas: () => { const h = this.gearHero(); if (!h) return; setActive(this.app.p, h.id); SFX.play('ui'); this.app.save(); },
      look: (el) => { const p = this.app.p, id = el.dataset.id!; const off = new Set(p.settings.looksOff); if (off.has(id)) off.delete(id); else off.add(id); p.settings.looksOff = [...off]; SFX.play('ui'); this.app.save(); },
      tab: (el) => { SFX.play('ui'); this.open({ kind: 'logs', tab: el.dataset.tab as LogTab }); },
      logdiff: (el) => { this.logHeroic = el.dataset.v === 'heroic'; SFX.play('ui'); this.open({ kind: 'logs', tab: 'collection' }); },
      entry: (el) => { SFX.play('ui'); this.open({ kind: 'logs', tab: 'collection', ...(el.dataset.id ? { entry: el.dataset.id } : {}) }); },
      item: (el) => { SFX.play('ui'); this.open({ kind: 'item', id: el.dataset.id!, back: this.spec || undefined }); },
      gearat: (el) => { const h = heroById(this.app.p, el.dataset.hero || null); if (!h) return; SFX.play('ui'); this.open({ kind: 'gear', hero: h.id, slot: el.dataset.slot as SlotId }); },
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
      preview: (el) => { this.close(); this.app.reveal.preview(el.dataset.v as 'normal' | 'unique' | 'pet' | 'log'); },
      intro: () => { SFX.play('ui'); this.close(); this.app.startIntro(); },
      tour: () => { SFX.play('ui'); this.close(); this.app.hearth.startTour(); },
      walkout: (el) => { this.app.setDev({ walkout: el.dataset.v as 'off' }); SFX.play('ui'); this.refresh(); },
      drink: (el) => { const p = this.app.p, id = el.dataset.id || null; p.vale.drink = id && RECIPES[id] ? id : null; SFX.play(id ? 'clink' : 'ui'); this.app.save(); },
      brewgo: () => { SFX.play('ui'); this.close(); this.app.showBrew(); },
      ridego: () => { SFX.play('ui'); this.close(); void this.app.showVale(); },
      lore: () => { SFX.play('page'); this.open({ kind: 'logs', tab: 'lore' }); },
      vfree: () => { this.app.setDev({ valeFree: !this.app.dev.valeFree }); SFX.play('ui'); this.app.refresh(); },
      vluck: () => { this.app.setDev({ valeLuck: !this.app.dev.valeLuck }); SFX.play('ui'); this.app.refresh(); },
      allopen: () => { this.app.setDev({ allOpen: !this.app.dev.allOpen }); SFX.play('ui'); this.app.refresh(); },
      lookpick: (el) => { this.lookPick = el.dataset.id || null; SFX.play('ui'); this.refresh(); },
      lookput: (el) => {
        const room = el.dataset.room!;
        if (!setLook(this.app.p, room, pickedLook(this.app.p, this.lookPick, this.app.dev.allOpen), this.app.dev.allOpen)) { SFX.play('nope'); return; }
        // the house goes to that room, so it's there when the sheet closes
        if (room !== 'house') this.app.hearth.aim(room);
        SFX.play('place'); this.app.save();
      },
    });
    root.addEventListener('click', (e) => { if (e.target === root.firstElementChild) this.close(); });
    root.addEventListener('submit', (e) => {
      e.preventDefault();
      const h = this.sheetHero(), input = root.querySelector<HTMLInputElement>('#cp-name');
      if (!h || !input) return;
      const why = nameProblem(this.app.p, input.value, h.id);
      if (why || !renameHero(this.app.p, h.id, input.value)) { this.heroSt = { ...this.heroSt, err: why || 'That name can’t be used' }; SFX.play('nope'); this.refresh(); return; }
      this.heroSt = { ...this.heroSt, renaming: false, err: '' };
      SFX.play('place');
      this.app.save();
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.spec) this.close(); });
  }

  open(spec: SheetSpec): void {
    const was = !!this.spec;
    // the dungeon picker starts fresh when it opens, but not when you come back to it from one of its drops
    const inDungeon = (s: SheetSpec | null): boolean => !!s && (s.kind === 'dungeon' || (s.kind === 'item' && s.back?.kind === 'dungeon'));
    if (spec.kind === 'dungeon' && !inDungeon(this.spec)) { this.pick.role = null; this.pick.alts = false; this.pick.log = false; }
    if (spec.kind === 'hero' && !(this.spec && this.spec.kind === 'hero' && this.spec.hero === spec.hero)) { clearTimeout(this.heroTimer); this.heroSt = { delArmed: false, renaming: false, err: '' }; }
    this.spec = spec;
    this.render(!was);
  }
  close(): void {
    if (!this.spec) return;
    this.spec = null;
    this.root.innerHTML = '';
  }
  refresh(): void { if (this.spec) this.render(false); }

  private sheetHero(): Hero | null {
    const s = this.spec;
    return s && s.kind === 'hero' ? heroById(this.app.p, s.hero) : null;
  }
  private gearHero(): Hero | null {
    const s = this.spec;
    return s && s.kind === 'gear' ? heroById(this.app.p, s.hero) : null;
  }
  /** put on what waits in a slot, with the moment it deserves */
  private putOn(h: Hero, slot: SlotId): void {
    const p = this.app.p;
    const from = +ilvl(loadoutFor(p, h).score);
    if (!putOn(p, h, slot)) { SFX.play('nope'); return; }
    this.justOn = { hero: h.id, slot, from, to: +ilvl(loadoutFor(p, h).score), at: performance.now() };
    SFX.play('equip');
    const s = this.spec;
    if (s && s.kind === 'gear') this.spec = { ...s, slot };
    this.app.save();
    setTimeout(() => { if (this.justOn && performance.now() - this.justOn.at > 1500) this.justOn = null; }, 1600);
  }

  private render(fresh: boolean): void {
    const s = this.spec!;
    const scroll = this.root.querySelector('.sheet-body')?.scrollTop || 0;
    let head = '', tabs = '', body = '', foot = '', wide = false;
    switch (s.kind) {
      case 'dungeon': ({ head, body, foot } = dungeonSheet(this.app.p, this.pick, this.app.dev.allOpen)); wide = true; break;
      case 'hero': {
        const h = heroById(this.app.p, s.hero);
        if (!h) { this.close(); return; }
        ({ head, body } = heroSheet(this.app.p, h, this.heroSt));
        break;
      }
      case 'gear': {
        const h = heroById(this.app.p, s.hero) || activeHero(this.app.p);
        if (!h) { this.close(); return; }
        ({ head, body } = this.gear(h, s.slot || 'weapon'));
        break;
      }
      case 'logs': {
        const r = logsSheet(this.app.p, s.tab, s.entry, this.logHeroic);
        ({ head, tabs, body } = r); this.logHeroic = r.heroic; wide = s.tab === 'collection';
        break;
      }
      case 'settings': ({ head, body } = settingsSheet(this.app.p, this.app.store.state, this.app.dev, this.resetArmed)); break;
      case 'satchel': ({ head, body } = this.satchel()); break;
      case 'picker': ({ head, body } = this.picker(s.spot)); break;
      case 'item': ({ head, body } = itemSheet(this.app.p, s.id, !!s.back)); break;
      case 'looks': ({ head, body } = looksSheet(this.app.p, this.lookPick, this.app.dev.allOpen)); break;
    }
    this.root.innerHTML = `<div class="sheet-wrap"><section class="sheet ${wide ? 'wide' : ''} k-${s.kind}" role="dialog" aria-modal="true" aria-label="${esc(head.replace(/<[^>]+>/g, ' ').trim().split('  ')[0] || 'Panel')}">
      <header class="sheet-head"><div>${head}</div><button type="button" class="icon-btn" data-act="close" aria-label="Close">${GLYPH.close}</button></header>
      ${tabs}<div class="sheet-body">${body}</div>${foot ? `<footer class="sheet-foot">${foot}</footer>` : ''}</section></div>`;
    const b = this.root.querySelector('.sheet-body');
    if (b && !fresh) b.scrollTop = scroll;
    if (fresh) (this.root.querySelector('.sheet-head .icon-btn') as HTMLElement | null)?.focus({ preventScroll: true });
    if (s.kind === 'logs' && s.tab === 'collection') this.markSeen();
    if (s.kind === 'gear') this.countUp();
  }
  /** the item level climbing after you put something on */
  private countUp(): void {
    const j = this.justOn, el = this.root.querySelector<HTMLElement>('.doll-ilvl b');
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

  /* ---------------------------------------------------------------- the dungeon picker (drawn in dungeonsheet.ts) */
  private go(): void {
    const pr = this.pick;
    if (!pickedDungeon(this.app.p, pr, this.app.dev.allOpen).open) { SFX.play('nope'); return; }
    SFX.play('ui');
    if (pr.mode === 'practice') this.app.startRun({ start: pr.start, testRar: pr.gear === 'mine' ? null : (pr.gear as Rar), heroic: pr.heroic });
    else this.app.startRun({ start: 'entrance', testRar: null, heroic: pr.heroic });
  }

  /* ---------------------------------------------------------------- gear: the doll, abilities & weapon buffs */
  private gear(h: Hero, sel: SlotId) {
    const p = this.app.p, role = roleOf(h), gk = gearKey(h), ak = abKey(h);
    const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
    const L = loadoutFor(p, h);
    const w = worn(p, h);
    const word = ROLE_STAT[role];
    const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
    const head = `<h2>${esc(h.name)}${title ? ` <em class="h-title">${esc(title)}</em>` : ''}</h2><p><i class="rdot ${role}" aria-hidden="true"></i>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · ${esc(cls?.roleName || ROLES[role].title)}${p.active === h.id ? ' · playing' : ''}</p>`;

    const j = this.justOn && this.justOn.hero === h.id && performance.now() - this.justOn.at < 1400 ? this.justOn : null;
    const card = (slot: SlotId) => this.slotCard(w[slot], role, gk, L.sets, slot === sel, waitingFor(p, h, slot), j?.slot === slot);
    const doll = `<div class="doll${j ? ' just-on' : ''}" style="--light: ${race?.light || '#F4B942'}">
      <div class="doll-col l">${LEFT_SLOTS.map(card).join('')}</div>
      <div class="doll-fig"><span class="doll-glow" aria-hidden="true"></span>${heroImg(heroSprite(h, role, p), { cls: 'doll-img', alt: `${h.name}` })}<span class="doll-floor" aria-hidden="true"></span></div>
      <div class="doll-col r">
        <div class="doll-ilvl"><b>${ilvl(L.score)}</b><span>Item level</span></div>
        ${card('weapon')}
        <div class="doll-pw"><span>${esc(cap(word.short))}</span><b>+${powerPct(L)}%</b><span>Health</span><b>+${healthPct(L)}%</b></div>
      </div>
    </div>`;
    const extras = Object.entries(L.sets).map(([id, n]) => SETS[id] ? `<span class="chip set">${esc(SETS[id].name)} set <b>${n}/3</b>${n >= 2 ? ' · bonus on' : ''}</span>` : '').join('')
      + L.traits.map((t) => `<span class="chip">Trait <b>${esc(traitDef(gk, t)?.name || t)}</b></span>`).join('');
    const stats = extras ? `<div class="power">${extras}</div>` : '';
    const tip = this.tooltip(h, w[sel], L.sets, waitingFor(p, h, sel));

    // Abilities & active Gear/Weapon buffs
    const keyNum: Record<AbilitySlot, string> = { a1: '1', a2: '2', a3: '3', a4: '4' };
    const activeEffects = effectsOf(L, gk).filter((e) => !e.later);
    const abBox = `<div class="box"><h3 class="section-title">Abilities &amp; Gear Buffs<small>${activeEffects.length ? `${activeEffects.length} active` : 'buffed by sets &amp; boss weapons'}</small></h3>
      <div class="at-list">${SLOTS_AB.map((s) => {
        const ab = AB[ak][s];
        const cdTxt = ab.hold ? 'Hold · Block' : `${ab.cd}s CD`;
        const manaTxt = ab.mana ? ` · ${ab.mana} Mana` : '';
        const buffs = activeEffects.filter((e) => e.desc.toLowerCase().includes(ab.name.toLowerCase()));
        return `<article class="at-card${buffs.length ? ' on' : ''}">
          <div class="at-top">
            <span class="at-ic"><span class="tile">${tile(ab.key)}</span><kbd>${keyNum[s]}</kbd></span>
            <div class="at-info">
              <div class="at-title-row"><b>${esc(ab.name)}</b><span class="at-meta">${cdTxt}${manaTxt}</span></div>
              <p>${esc(ab.desc)}</p>
            </div>
          </div>
          ${buffs.map((b) => `<div class="at-combo"><b>+ ${esc(b.name)}:</b> ${esc(b.desc)}</div>`).join('')}
        </article>`;
      }).join('')}</div></div>`;

    // the set for this role and class
    const setBoxes = Object.values(SETS).filter((s) => s.role === role && (!s.cls || s.cls === h.cls) && (h.cls !== 'rogue' || s.cls === 'rogue')).map((set) => {
      const n = L.sets[set.id] || 0;
      const have = set.pieces.filter((id) => p.collection[id]).length;
      return `<div class="box setbox">
        <h3 class="section-title">${esc(set.name)} set<small>wearing ${n} of 3 · own ${have} of 3</small></h3>
        <div class="setpieces">${set.pieces.map((id) => { const own = !!p.collection[id], on = Object.values(w).some((x) => x.def.id === id); return `<button type="button" class="sp ${on ? 'on' : own ? 'own' : ''}" data-act="item" data-id="${id}"><span class="tile" aria-hidden="true">${iconOf(id)}</span><span>${esc(nameOf(id))}<small>${on ? 'Wearing' : own ? 'Owned' : fmtRate(1 / 35)}</small></span></button>`; }).join('')}</div>
        <div class="setline ${n >= 2 ? 'on' : ''}"><i>2</i><span>${esc(set.bonus2.desc)}</span></div>
        <div class="setline ${n >= 3 ? 'on' : ''} ${set.bonus3.ready ? '' : 'later'}"><i>3</i><span>${esc(set.bonus3.desc)}${set.bonus3.ready ? '' : ' <em>(coming in a later update)</em>'}</span></div>
        <p class="fine">Epic set pieces drop from the Gravekeeper, 1 in 35 each. ${esc(set.look)}.</p></div>`;
    }).join('');
    // weapon trait (unlocked at Rare)
    const marks = p.dungeons.barrow?.marks || 0;
    const regW = bestRegular(h, 'weapon');
    const traitBox = regW.rar >= 2 ? `<div class="box"><h3 class="section-title">Weapon trait<small>${marks} Barrow Marks</small></h3>
      <div class="offer">${TRAITS[gk].map((t) => `<button type="button" class="opt" data-act="trait" data-trait="${t.id}" aria-pressed="${regW.trait === t.id}" ${regW.trait === t.id || marks < REROLL_COST ? 'disabled' : ''}><b>${esc(t.name)}</b>${esc(t.desc)}${regW.trait === t.id ? '<span class="m">Active on your hero</span>' : `<span class="m">Swap for ${REROLL_COST} marks</span>`}</button>`).join('')}</div>
      ${w.weapon.unique ? '<p class="fine">Your unlocked weapon trait stays active alongside your unique weapon.</p>' : ''}</div>`
      : `<p class="fine">At Rare your weapon rolls a trait that changes how an ability works. Every clear moves your weakest piece up.</p>`;
    // title
    const titles = p.titles.filter((t) => TITLES[t]);
    const titleBox = `<div class="box"><h3 class="section-title">Title<small>shown with ${esc(h.name.split(' ')[0])}’s name</small></h3>${titles.length ? `<div class="titles" role="radiogroup">
      <button type="button" class="sg" role="radio" data-act="title" data-id="" aria-checked="${!h.title}">None</button>
      ${titles.map((t) => `<button type="button" class="sg" role="radio" data-act="title" data-id="${t}" aria-checked="${h.title === t}">${esc(TITLES[t].text)}</button>`).join('')}</div>` : '<p class="fine">Some achievements give a title. Every hero can wear the ones you earn.</p>'}</div>`;
    // looks
    const looks = ['cosmetic.glow_shield', 'cosmetic.glow_staff', 'cosmetic.crit_ice', 'cosmetic.trail_wisp', 'dye.ghostly', 'dye.ghostly.gilded', 'cosmetic.gilded_bones']
      .filter((id) => (id === 'cosmetic.glow_shield' ? role === 'tank' : id === 'cosmetic.glow_staff' ? role === 'healer' : id === 'cosmetic.crit_ice' ? role === 'dps' : id === 'cosmetic.gilded_bones' ? h.race === 'risen' : true));
    const looksBox = `<div class="box"><h3 class="section-title">Looks<small>never power</small></h3><div class="picks">${looks.map((id) => {
      const c = COLLECTIBLES[id], own = !!p.collection[id], on = own && !p.settings.looksOff.includes(id);
      return `<button type="button" class="pick" data-act="${own ? 'look' : 'item'}" data-id="${id}" aria-pressed="${on}"><span class="tile" aria-hidden="true" ${own ? '' : 'style="filter: grayscale(1) opacity(0.5)"'}>${tile(c.icon)}</span><span><b>${esc(c.name)}</b><span>${own ? (on ? 'On' : 'Off') : esc(c.source)}</span></span></button>`;
    }).join('')}</div></div>`;
    const play = p.active === h.id ? '' : `<div class="actions"><button type="button" class="btn small gold" data-act="playas">${GLYPH.play}Play as ${esc(h.name.split(' ')[0])}</button></div>`;
    const body = `${doll}${tip}${stats}${play}${abBox}${setBoxes}${traitBox}${titleBox}${looksBox}`;
    return { head, body };
  }

  /** one slot on the doll: rarity frame, set count, unique star and what it adds. It glows while something better waits to go on. */
  private slotCard(it: Worn, role: RoleId, gk: GearKey, sets: Record<string, number>, on: boolean, wait: Waiting | null, just: boolean): string {
    const d = it.def, look = rarLook(d.id);
    const share = itemShare(d);
    const set = d.setId ? SETS[d.setId] : null;
    const slotName = ROLE_SLOTS[gk][it.slot].name;
    const wShare = wait ? itemShare(ITEMS[wait.id]) : null;
    const dp = wShare ? Math.round((wShare.power - share.power) * 10) / 10 : 0;
    const badge = wait ? `<i class="sl-up" aria-hidden="true">${dp > 0 ? `+${dp}%` : wait.kind === 'unique' ? 'New' : 'Up'}</i>` : '';
    return `<button type="button" class="slot r-${look.key}${wait ? ' up' : ''}${just ? ' just-on' : ''}" data-act="slot" data-slot="${it.slot}" aria-pressed="${on}" style="--rc: ${look.color}; --rl: ${look.light}" aria-label="${esc(slotName)}: ${esc(d.name)}, ${esc(look.name)}${set ? `, ${esc(set.name)} set` : ''}${wait ? '. Something better is waiting to go on' : ''}">
      ${badge}${just ? '<span class="sl-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' : ''}<span class="sl-tile"><span class="tile">${iconOf(d.id)}</span>${set ? `<i class="sl-set" title="${esc(set.name)} set">${sets[set.id] || 0}/3</i>` : ''}${d.kind === 'unique' ? `<i class="sl-star" title="Unique">${STAR}</i>` : ''}</span>
      <span class="sl-tx"><span class="sl-kind">${esc(slotName)}</span><b class="sl-name" style="color: ${look.ink}">${esc(d.name)}</b>
        <span class="sl-meta"><b style="color: ${look.ink}">${esc(look.name)}</b><span class="sl-il"> · ${share.ilvl}</span></span>
        <span class="sl-stat">${share.power > 0 ? `+${share.power}% ${ROLE_STAT[role].short}` : 'Starter rags'}</span>${wait ? `<span class="sl-up-line">${GLYPH.rise}${dp > 0 ? `+${dp}% ${ROLE_STAT[role].short} waiting` : `${esc(ITEMS[wait.id].name)} waiting`}</span>` : set ? `<span class="sl-setname">${esc(set.name)} ${sets[set.id] || 0}/3</span>` : ''}</span>
    </button>`;
  }

  /** something waiting to go on: side-by-side Old -> New comparison, exact stat gains, and the button */
  private waitCard(h: Hero, wt: Waiting, wornDef: ItemDef, sets: Record<string, number>): string {
    const role = roleOf(h), gk = gearKey(h), d = ITEMS[wt.id], look = rarLook(d.id), oldLook = rarLook(wornDef.id);
    const share = itemShare(d), now = itemShare(wornDef);
    const slotName = ROLE_SLOTS[gk][wt.slot].name;
    const dp = Math.round((share.power - now.power) * 10) / 10, dh = Math.round((share.health - now.health) * 10) / 10, dil = share.ilvl - now.ilvl;
    const delta = (v: number, u = '') => v > 0 ? `<b class="cmp-d up">${GLYPH.rise}+${v}${u}</b>` : v < 0 ? `<b class="cmp-d down">${GLYPH.fall}−${Math.abs(v)}${u}</b>` : `<b class="cmp-d">Same</b>`;
    let extra = '';
    if (d.effectDesc) extra += `<p class="tip-eq"><b>+ ${d.kind === 'set' ? 'Piece perk' : 'Unique effect'}:</b> ${esc(d.effectDesc)}</p>`;
    const trait = wt.kind === 'regular' ? wt.piece.trait : undefined;
    const tr = trait ? traitDef(gk, trait) : undefined;
    if (tr) extra += `<p class="tip-tr"><b>+ Weapon trait (${esc(tr.name)}):</b> ${esc(tr.desc)}</p>`;
    if (d.setId && SETS[d.setId]) { const st = SETS[d.setId], n = (sets[st.id] || 0) + 1; extra += `<p class="tip-tr"><b>+ ${esc(st.name)} set (${sets[st.id] || 0}/3 → ${n}/3):</b> ${n >= 2 ? esc(st.bonus2.desc) : `1 more piece activates: ${esc(st.bonus2.desc)}`}</p>`; }
    return `<div class="tip tip-wait" style="--rc: ${look.color}; --rl: ${look.light}">
      <span class="tw-eye">${wt.kind === 'unique' ? 'New unique upgrade' : 'Upgrade waiting'} · tap below to equip</span>
      <div class="tw-vs">
        <div class="tw-side old"><span class="tile" style="--c: ${oldLook.color}">${iconOf(wornDef.id)}</span><div><small>Wearing now</small><b style="color: ${oldLook.ink}">${esc(wornDef.name)}</b><span>${esc(oldLook.name)} · ilvl ${now.ilvl}</span></div></div>
        <i class="tw-arrow" aria-hidden="true">${GLYPH.right}</i>
        <div class="tw-side new"><span class="tile" style="--c: ${look.color}">${iconOf(d.id)}</span><div><small>New ${esc(slotName.toLowerCase())}</small><b style="color: ${look.ink}">${esc(d.name)}</b><span>${esc(look.name)} · ilvl ${share.ilvl}</span></div></div>
      </div>
      <div class="cmp-rows tw-rows">
        <div class="cmp-row"><span>Item level <small>${now.ilvl} → ${share.ilvl}</small></span>${delta(dil)}</div>
        <div class="cmp-row"><span>${esc(cap(ROLE_STAT[role].main))} <small>+${now.power}% → +${share.power}%</small></span>${delta(dp, '%')}</div>
        <div class="cmp-row"><span>Health <small>+${now.health}% → +${share.health}%</small></span>${delta(dh, '%')}</div>
      </div>
      ${extra}
      <div class="tw-acts"><button type="button" class="btn gold big puton" data-act="puton" data-slot="${wt.slot}">${GLYPH.shield}Put on ${esc(d.name)}</button>${wt.kind === 'unique' ? `<button type="button" class="btn small ghost" data-act="notnow" data-slot="${wt.slot}">Not now</button>` : ''}</div>
    </div>`;
  }

  /** the item in the picked slot, the way an RPG tooltip reads (with anything waiting to go on above it) */
  private tooltip(h: Hero, it: Worn, sets: Record<string, number>, wt: Waiting | null): string {
    const p = this.app.p, role = roleOf(h), gk = gearKey(h), d = it.def, look = rarLook(d.id);
    const share = itemShare(d);
    const slotName = ROLE_SLOTS[gk][it.slot].name;
    const lines: string[] = [];
    if (share.power > 0) lines.push(`<li>+${share.power}% ${esc(ROLE_STAT[role].main)}</li><li>+${share.health}% health</li>`);
    else lines.push(`<li class="dim">Starter gear: no bonus yet</li>`);
    let extra = '';
    if (d.effectDesc) extra += `<p class="tip-eq"><b>When worn:</b> ${esc(d.effectDesc)}</p>`;
    const tr = it.trait ? traitDef(gk, it.trait) : undefined;
    if (tr) extra += `<p class="tip-tr"><b>Trait: ${esc(tr.name)}.</b> ${esc(tr.desc)}</p>`;
    if (d.setId && SETS[d.setId]) {
      const s = SETS[d.setId], n = sets[s.id] || 0;
      const wornIds = new Set(Object.values(worn(p, h)).map((x) => x.def.id));
      extra += `<div class="tip-set"><b>${esc(s.name)} (${n}/3)</b><ul>${s.pieces.map((id) => `<li class="${wornIds.has(id) ? 'on' : p.collection[id] ? 'own' : ''}">${esc(nameOf(id))}${wornIds.has(id) ? '' : p.collection[id] ? ' · owned' : ''}</li>`).join('')}</ul>
        <p class="${n >= 2 ? 'on' : ''}">(2) ${esc(s.bonus2.desc)}</p><p class="${n >= 3 && s.bonus3.ready ? 'on' : ''}">(3) ${esc(s.bonus3.desc)}${s.bonus3.ready ? '' : ' Coming in a later update.'}</p></div>`;
    }
    if (d.flavor) extra += `<p class="tip-fl">“${esc(d.flavor)}”</p>`;
    let src = '';
    if (d.kind === 'gear') src = d.rar < 2 ? 'Regular gear. Every clear upgrades your weakest piece up to Rare.' : 'Regular Rare gear (ladder cap). Epic gear drops from the dungeon set (1/35) and boss weapons (1/50).';
    else {
      for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) for (const x of tb.drops) if (x.id === d.id) src = `Drops from ${dg.bosses.find((b) => b.id === tb.boss)?.name || tb.boss}, ${fmtRate(x.rate)}.`;
      const e = p.collection[d.id];
      if (e) src += ` You got it at kill count ${fmtN(e.kc)}.`;
    }
    const owned = ownedFor(p, h, it.slot);
    const reg = h.regular[it.slot];
    const regName = ITEMS[gearId(gk, it.slot, reg.rar)]?.name || 'Regular';
    const swap = owned.length ? `<div class="tip-swap" role="radiogroup" aria-label="Wear in the ${esc(slotName.toLowerCase())} slot"><span>Wear</span>
      <button type="button" class="sg" role="radio" data-act="equip" data-slot="${it.slot}" data-id="" aria-checked="${!it.unique}">${esc(regName)}</button>
      ${owned.map((u) => `<button type="button" class="sg" role="radio" data-act="equip" data-slot="${it.slot}" data-id="${u.id}" aria-checked="${it.unique && d.id === u.id}">${esc(u.name)}</button>`).join('')}</div>` : '';
    // a better regular piece in the bag while a unique is worn: say it is there for later
    const bag = it.unique && h.bag[it.slot] ? `<p class="tip-src">A better ${esc(slotName.toLowerCase())} (${esc(ITEMS[gearId(gk, it.slot, bestRegular(h, it.slot).rar)]?.name || '')}) is in your bag for when you wear regular gear here.</p>` : '';
    return `${wt ? this.waitCard(h, wt, d, sets) : ''}<div class="tip" style="--rc: ${look.color}; --rl: ${look.light}" aria-live="polite">
      ${wt ? '<span class="tw-eye now">Wearing now</span>' : ''}<div class="tip-head"><span class="tile" aria-hidden="true">${iconOf(d.id)}</span><div><b class="tip-n">${esc(d.name)}</b><span class="tip-k">${esc(look.name)} ${esc(slotName.toLowerCase())} · Item level ${share.ilvl}</span></div></div>
      <ul class="tip-stats">${lines.join('')}</ul>${extra}<p class="tip-src">${esc(src)}</p>${bag}${swap}</div>`;
  }

  private markSeen(): void {
    const p = this.app.p;
    let changed = false;
    for (const id of Object.keys(p.collection)) if (!p.seen[id]) { p.seen[id] = Date.now(); changed = true; }
    if (changed) this.app.store.save();
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
    return { head: `<h2>${esc(spot.label)}</h2><p>${esc(KIND_WORD[spot.kind])} · ${n} spot${n > 1 ? 's' : ''} in the house</p>`, body };
  }

  /* ---------------------------------------------------------------- brews, the satchel, the story */
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
}
