/**
 * Sheets: panels that slide up over the house. The dungeon picker, a hero (from their bed), a hero's
 * gear (armoury.ts), the logs (logsheet.ts: the collection log, achievements, the Vale's story, stats), the
 * satchel, settings, the spot picker, the house's looks and an item's details. Each one is drawn from the
 * profile every time, so whatever changed is always shown. This file opens and closes them and wires up
 * their buttons; most of them draw in a file of their own.
 */
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, ITEMS, thing } from '../content';
import { SLOT_IDS } from '../content/gear';
import type { SlotId } from '../content/types';
import { INGREDIENTS, INGREDIENT_ORDER, LORE, PLANTS, RECIPES, RECIPE_ORDER, SEED_ICON, SEED_ORDER, SKILLS } from '../content/vale';
import { rankProgress, recipeUnlocked } from '../meta/vale';
import { activeHero, freshProfile, heroById, nameProblem, removeHero, renameHero, roleOf, setActive, type Hero } from '../meta/profile';
import { setGilded } from '../meta/gear';
import type { Tell } from '../meta/loot';
import { HEARTH_SPOTS, place, setLook, spotById, spotOf } from '../meta/hearth';
import type { App } from './app';
import { actions, esc, fmtN, GLYPH } from './dom';
import { tile } from './art';
import { MUSIC } from './music';
import { SFX } from './sound';
import { heroesSheet, heroSheet, type HeroSheetState } from './herosheet';
import { dungeonActions, dungeonBack, dungeonSheet, dungeonStep, type DungeonPick } from './dungeonsheet';
import { itemSheet, KIND_WORD, ROLE_STAT } from './itemsheet';
import { LOG_TABS, logActions, logsSheet, mountsSheet, type LogTab } from './logsheet';
import type { LogView } from './logbook';
import { markSeen } from '../meta/logs';
import { looksSheet, pickedLook } from './lookssheet';
import { settingsSheet } from './settingssheet';
import { resetKeys, stopWaiting, waitForKey } from './keybinds';
import type { BindSlot } from '../content/keys';
import { gearKey } from '../content/gear';
import { CLASSES } from '../content/folk';
import { ARMOURY_TABS, armouryActions, armourySheet, countUp, leftSlot, settle, type ArmouryTab, type ArmouryView } from './armoury';
import { TALENTS } from '../content/talents';
import { MAX_LEVEL, levelOf, xpForLevel } from '../content/xp';
import { gainXp } from '../meta/xp';
import { specOf } from '../meta/talents';

export type SheetSpec =
  /** the Dungeons, on that dungeon's door when it says (a door in the house's cellar) */
  | { kind: 'dungeon'; dungeon?: string }
  | { kind: 'satchel' }
  | { kind: 'hero'; hero: string }
  | { kind: 'gear'; hero: string; slot?: SlotId; pick?: string; tab?: ArmouryTab; node?: string }
  | { kind: 'logs'; tab: LogTab; entry?: string }
  | { kind: 'settings' }
  | { kind: 'picker'; spot: string }
  | { kind: 'item'; id: string; back?: SheetSpec }
  | { kind: 'looks' }
  | { kind: 'heroes' } | { kind: 'mounts' };

/** A panel carried over from an older version of the page might not make sense any more. */
export function normSpec(x: unknown): SheetSpec | null {
  const s = x as Record<string, any> | null;
  if (!s || typeof s !== 'object') return null;
  switch (s.kind) {
    case 'dungeon': return typeof s.dungeon === 'string' ? { kind: 'dungeon', dungeon: s.dungeon } : { kind: 'dungeon' };
    case 'settings': case 'satchel': case 'looks': case 'heroes': case 'mounts': return { kind: s.kind };
    case 'hero': return typeof s.hero === 'string' ? { kind: 'hero', hero: s.hero } : null;
    case 'gear': return typeof s.hero === 'string' ? { kind: 'gear', hero: s.hero, ...(SLOT_IDS.includes(s.slot) ? { slot: s.slot } : {}), ...(typeof s.pick === 'string' && ITEMS[s.pick] ? { pick: s.pick } : {}), ...(ARMOURY_TABS.includes(s.tab) ? { tab: s.tab } : {}), ...(typeof s.node === 'string' && TALENTS[s.node] ? { node: s.node } : {}) } : null;
    case 'logs': return { kind: 'logs', tab: LOG_TABS.includes(s.tab) ? s.tab : 'collection', ...(typeof s.entry === 'string' ? { entry: s.entry } : {}) };
    case 'picker': return typeof s.spot === 'string' && spotById(s.spot) ? { kind: 'picker', spot: s.spot } : null;
    case 'item': return typeof s.id === 'string' && thing(s.id) ? { kind: 'item', id: s.id, ...(s.back ? { back: normSpec(s.back) || undefined } : {}) } : null;
  }
  return null;
}

export class Sheets {
  spec: SheetSpec | null = null;
  /** the dungeon picker remembers its choices while the page is open */
  private pick: DungeonPick = { dungeon: 'barrow', page: 'door', heroic: false };
  private resetArmed = false;
  /** the look picked in the looks sheet, while the page is open */
  private lookPick: string | null = null;
  /** the collection log: heroic pages or normal ones, and what its page remembers (Try it on, the closer look) */
  private logHeroic = false;
  private readonly logView: LogView = { tryOn: false, peek: null, flip: false, ach: null };
  /** a hero's sheet: letting them go takes two taps, and renaming has its own little form */
  private heroSt: HeroSheetState = { delArmed: false, renaming: false, err: '' };
  private heroTimer = 0;
  /** the armoury remembers the piece just put on, for the moment it takes */
  private readonly armoury: ArmouryView = { justOn: null, justTal: null, tReset: false };

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      ...logActions({ app, root, view: this.logView, open: (s) => this.open(s), refresh: () => this.refresh(), close: () => this.close() }),
      ...dungeonActions({ app, root, pick: this.pick, refresh: () => this.refresh(), close: () => this.close() }),
      ...armouryActions({ app, root, view: this.armoury, spec: () => this.spec, open: (s) => this.open(s) }),
      close: () => this.close(),
      back: () => { const s = this.spec; if (s && s.kind === 'item' && s.back) this.open(s.back); else this.close(); },
      heroplay: () => {
        const h = this.sheetHero(); if (!h) return;
        SFX.play('ui'); setActive(this.app.p, h.id); this.close(); this.app.save();
        this.app.toasts.text(h.name, 'By the fire in the hall.');
        this.app.showHearth('hall');
      },
      herogear: () => { const h = this.sheetHero(); if (h) { SFX.play('ui'); this.open({ kind: 'gear', hero: h.id }); } },
      heroat: (el) => { const h = heroById(this.app.p, el.dataset.id || null); if (h) { SFX.play('ui'); this.open({ kind: 'hero', hero: h.id }); } },
      newhero: () => { SFX.play('ui'); this.close(); this.app.showCreate(); },
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
      item: (el) => { SFX.play('ui'); this.open({ kind: 'item', id: el.dataset.id!, back: this.spec || undefined }); },
      gild: (el) => { if (setGilded(this.app.p, el.dataset.id!, el.dataset.v === '1')) { SFX.play(el.dataset.v === '1' ? 'gild' : 'ui'); this.app.save(); } else SFX.play('nope'); },
      place: (el) => { const s = this.spec; if (!s || s.kind !== 'picker') return; if (place(this.app.p, s.spot, el.dataset.id || null)) { SFX.play('place'); this.app.save(); this.close(); } },
      sound: () => { const p = this.app.p; p.settings.sound = !p.settings.sound; SFX.on = p.settings.sound; if (SFX.on) SFX.play('ui'); this.app.save(); },
      rebind: (el) => { const k = this.keysClass(); if (!k) return; SFX.play('ui'); waitForKey(k.k, el.dataset.slot as BindSlot, () => { SFX.play('ui'); this.refresh(); }); this.refresh(); },
      keysreset: () => { const k = this.keysClass(); if (!k) return; stopWaiting(); resetKeys(k.k); SFX.play('ui'); this.refresh(); },
      reset: () => {
        if (!this.resetArmed) { this.resetArmed = true; this.refresh(); setTimeout(() => { this.resetArmed = false; this.refresh(); }, 4000); return; }
        this.resetArmed = false;
        this.close();
        this.app.store.replace(freshProfile());
        this.app.toasts.text('Fresh start', 'Everything is back to zero. Make a hero to begin.');
      },
      preview: (el) => { this.close(); this.app.reveal.preview(el.dataset.v as Tell | 'log', this.pick.dungeon); },
      intro: () => { SFX.play('ui'); this.close(); this.app.startIntro(); },
      tour: () => { SFX.play('ui'); this.close(); this.app.hearth.startTour(); },
      drink: (el) => { const p = this.app.p, id = el.dataset.id || null; p.vale.drink = id && RECIPES[id] ? id : null; SFX.play(id ? 'clink' : 'ui'); this.app.save(); },
      brewgo: () => { SFX.play('ui'); this.close(); this.app.showBrew(); },
      gardengo: () => { SFX.play('ui'); this.close(); this.app.showHearth('yard'); },
      lore: () => { SFX.play('page'); this.open({ kind: 'logs', tab: 'lore' }); },
      vfree: () => { this.app.setDev({ valeFree: !this.app.dev.valeFree }); SFX.play('ui'); this.app.refresh(); },
      vluck: () => { this.app.setDev({ valeLuck: !this.app.dev.valeLuck }); SFX.play('ui'); this.app.refresh(); },
      allopen: () => { this.app.setDev({ allOpen: !this.app.dev.allOpen }); SFX.play('ui'); this.app.refresh(); },
      xpup: () => {
        const p = this.app.p, to = Math.min(MAX_LEVEL, levelOf(p.xp) + 5);
        if (gainXp(p, xpForLevel(to) - p.xp).xp <= 0) { SFX.play('nope'); return; }
        SFX.play('levelup'); this.app.toasts.text(`Level ${to}`, 'For testing: spend the points in your hero’s Talents.'); this.app.levelAchievements(); this.app.save();
      },
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
    window.addEventListener('keydown', (e) => {
      if (!this.spec) return;
      // on the door, the arrow keys step between dungeons like the arrows on the picture
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && this.spec.kind === 'dungeon' && this.pick.page === 'door') { dungeonStep(this.pick, e.key === 'ArrowLeft' ? -1 : 1); SFX.play('ui'); this.refresh(); return; }
      if (e.key !== 'Escape') return;
      if (this.logView.peek || this.logView.ach) root.querySelector<HTMLElement>('.pk-x')?.click();
      else if (this.spec.kind === 'dungeon' && dungeonBack(this.pick)) { this.refresh(); const b = root.querySelector('.sheet-body'); if (b) b.scrollTop = 0; }
      else this.close();
    });
    root.addEventListener('input', (e) => { const el = e.target as HTMLInputElement; if (el.dataset.act === 'music') MUSIC.setVolume(+el.value / 100); });
  }

  open(to: SheetSpec): void {
    const was = !!this.spec;
    // the armoury always has a slot and a piece picked, so moving on from them can count as looking
    const spec = to.kind === 'gear' ? settle(this.app.p, to) : to;
    // the dungeon picker starts fresh when it opens, but not when you come back to it from one of its drops
    const inDungeon = (s: SheetSpec | null): boolean => !!s && (s.kind === 'dungeon' || (s.kind === 'item' && s.back?.kind === 'dungeon'));
    // the sheet opens on the door of a dungeon you can go into, or the one whose door you tapped in the cellar (one
    // still to come shows what it will ask of you)
    if (spec.kind === 'dungeon' && !inDungeon(this.spec)) {
      this.pick.page = 'door';
      this.pick.warn = false;
      if (spec.dungeon) { this.pick.dungeon = spec.dungeon; this.pick.heroic = false; }
      else if (!DUNGEONS[this.pick.dungeon || '']) this.pick.dungeon = 'barrow';
    }
    if (spec.kind === 'hero' && !(this.spec && this.spec.kind === 'hero' && this.spec.hero === spec.hero)) { clearTimeout(this.heroTimer); this.heroSt = { delArmed: false, renaming: false, err: '' }; }
    if (spec.kind !== 'logs' && spec.kind !== 'item') this.logView.peek = null;
    // an achievement asked for by its id opens its card, over its place's page; anything else closes it
    this.logView.ach = spec.kind === 'logs' && spec.tab === 'achievements' && spec.entry && ACHIEVEMENTS[spec.entry] ? spec.entry : null;
    const looked = leftSlot(this.app.p, this.spec, spec);
    this.spec = spec;
    this.render(!was);
    if (looked) this.app.save();
  }
  /** your active hero's class, for Settings' Keys list (none on a touch screen, where there are no keys) */
  private keysClass(): { k: ReturnType<typeof gearKey>; cls: string; spec: string | null } | null {
    const h = this.app.touch ? null : activeHero(this.app.p);
    return h ? { k: gearKey({ role: roleOf(h), cls: h.cls }), cls: CLASSES[h.cls as keyof typeof CLASSES]?.name || 'hero', spec: specOf(h)?.id || null } : null;
  }
  close(): void {
    if (!this.spec) return;
    stopWaiting();
    const looked = leftSlot(this.app.p, this.spec, null);
    this.spec = null; this.logView.tryOn = false; this.logView.peek = null; this.logView.ach = null;
    this.root.innerHTML = '';
    this.app.hearth.closed();
    if (looked) this.app.save();
  }
  refresh(): void { if (this.spec) this.render(false); }

  private sheetHero(): Hero | null {
    const s = this.spec;
    return s && s.kind === 'hero' ? heroById(this.app.p, s.hero) : null;
  }
  private render(fresh: boolean): void {
    const s = this.spec!;
    const scroll = this.root.querySelector('.sheet-body')?.scrollTop || 0;
    let head = '', tabs = '', body = '', foot = '', over = '', wide = false;
    switch (s.kind) {
      case 'dungeon': ({ head, body, foot } = dungeonSheet(this.app.p, this.pick, this.app.dev.allOpen)); wide = true; break;
      case 'hero': {
        const h = heroById(this.app.p, s.hero);
        if (!h) { this.close(); return; }
        ({ head, body } = heroSheet(this.app.p, h, this.heroSt));
        break;
      }
      case 'gear': {
        // what's picked may have moved since it opened (a piece put on, a save from another device)
        const g = settle(this.app.p, s), h = heroById(this.app.p, g.hero);
        if (!h) { this.close(); return; }
        this.spec = g;
        ({ head, tabs, body, foot } = armourySheet(this.app.p, h, g, this.armoury));
        break;
      }
      case 'logs': {
        const r = logsSheet(this.app.p, s.tab, s.entry, this.logHeroic, this.logView);
        ({ head, tabs, body, over } = r); this.logHeroic = r.heroic;
        break;
      }
      case 'settings': ({ head, body } = settingsSheet(this.app.p, this.app.store.state, this.app.dev, this.resetArmed, this.keysClass())); break;
      case 'satchel': ({ head, body } = this.satchel()); break;
      case 'picker': ({ head, body } = this.picker(s.spot)); break;
      case 'item': ({ head, body } = itemSheet(this.app.p, s.id, !!s.back)); break;
      case 'looks': ({ head, body } = looksSheet(this.app.p, this.lookPick, this.app.dev.allOpen)); break;
      case 'heroes': ({ head, body, foot } = heroesSheet(this.app.p)); break;
      case 'mounts': ({ head, body } = mountsSheet(this.app.p)); break;
    }
    // a sheet slides in when it opens, not every time it redraws
    this.root.innerHTML = `<div class="sheet-wrap"><section class="sheet ${wide ? 'wide' : ''}${fresh ? '' : ' still'} k-${s.kind}" role="dialog" aria-modal="true" aria-label="${esc(head.replace(/<[^>]+>/g, ' ').trim().split('  ')[0] || 'Panel')}">
      <header class="sheet-head"><div>${head}</div><button type="button" class="icon-btn" data-act="close" aria-label="Close">${GLYPH.close}</button></header>
      ${tabs}<div class="sheet-body">${body}</div>${foot ? `<footer class="sheet-foot">${foot}</footer>` : ''}${over}</section></div>`;
    const b = this.root.querySelector('.sheet-body');
    if (b && !fresh) b.scrollTop = scroll;
    if (fresh) (this.root.querySelector('.sheet-head .icon-btn') as HTMLElement | null)?.focus({ preventScroll: true });
    if (s.kind === 'logs' && s.tab === 'collection' && markSeen(this.app.p)) this.app.store.save();
    if (s.kind === 'gear') countUp(this.root, this.armoury);
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
    const seeds = SEED_ORDER.map((id) => {
      const n = p.vale.seeds[id] || 0;
      return `<div class="sat-it ${n ? '' : 'none'}"><span class="tile" aria-hidden="true">${tile(SEED_ICON[id])}</span><b>${fmtN(n)}</b><span>${esc(PLANTS[id].seed)}</span></div>`;
    }).join('');
    const pages = p.vale.lore.length;
    const go = `${scene !== 'brew' ? `<button type="button" class="btn small gold" data-act="brewgo">${GLYPH.pot}Go to the cauldron</button>` : ''}<button type="button" class="btn small" data-act="gardengo">${GLYPH.sign}Go to the garden</button>`;
    const body = `
      <h3 class="section-title">Seeds<small>dungeons drop them, the garden grows them</small></h3><div class="sat-grid">${seeds}</div>
      <h3 class="section-title">Ingredients</h3><div class="sat-grid">${ing}</div>
      <h3 class="section-title">Brews<small>one bottle serves the whole party for a run</small></h3><div class="picks">${shelf}</div>
      <div class="actions">${go}</div>
      <h3 class="section-title">Skills</h3><div class="skills">${skills}</div>
      ${pages ? `<div class="actions"><button type="button" class="btn small" data-act="lore">${GLYPH.book}Bramblewick’s story · ${pages} of ${LORE.length} pages</button></div>` : ''}`;
    return { head: `<h2>Satchel</h2><p>Your seeds, what you have grown and what you have brewed</p>`, body };
  }
}
