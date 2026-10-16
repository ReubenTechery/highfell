/**
 * The Hearth: home, a tall house cut open so you can see into every room. Zoomed out you see the whole
 * house with a sign on each room; tap one to go in. Zoomed in, you tap things to use them: the Barrow
 * door in the cellar (the dungeons), the planter beds in the yard (the garden), the armour stand (your gear),
 * the big book in the loft (the collection log), the cauldron and the larder. Your hero stands by the
 * fire and your other heroes wait by their beds upstairs. Pets, trophies and banners go in spots all
 * over the house; Decorate shows the empty ones. Out in the paddock every mount in the game has its own
 * place: yours wander about, the rest are shadows; tap one for its card. One big button: Dungeons.
 * The house is drawn in layers the camera moves as one picture: the back (the outside, rooms and
 * furniture) and the front (the lights) are built only when a look changes; between them are what you
 * tap (things, spots, heroes) and the bits that move, each its own small picture (art.ts), and the pips.
 */
import { COLLECTIBLES, DUNGEONS } from '../content';
import { CLASSES, MAX_HEROES, RACES, type ClassId, type RaceId } from '../content/folk';
import { BUNK_SLOTS, FLOORS, HOUSE_SPOTS, LOOK_ROOMS, PADDOCK, ROOMS, THINGS, paddockSlots, roomAt, type HouseAction, type HouseSpot, type ThingDef } from '../content/house';
import { lookOf, ownedOfKind, paddock } from '../meta/hearth';
import { loadoutFor, waiting } from '../meta/gear';
import { activeHero, finishHearthTour, finishSeedTour, needsHearthTour, needsSeedTour, roleOf, type Hero } from '../meta/profile';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { ART, bitsHtml, heroSprite, placeSprite, spriteBit, tile, type Bit } from './art';
import { SFX } from './sound';
import { Camera } from './camera';
import { HOUSE_BOUNDS, HOUSE_FIT, houseBack, houseBits, houseDefs, houseFront } from './houseart';
import { bedLook } from './garden';

/** how big each kind of thing is drawn in a spot, its tap area, and how it moves */
const SPOT_LOOK: Record<string, { k: number; w: number; h: number; anim: string }> = {
  pet: { k: 1.3, w: 100, h: 130, anim: 'bob' },
  trophy: { k: 1, w: 66, h: 84, anim: '' },
  banner: { k: 1, w: 112, h: 146, anim: 'sway' },
};
/** where your hero stands in the hall, and how big */
const HERO_AT = { x: 360, y: FLOORS.hall - 20, k: 2.2 };
/** the room the camera starts in */
const HOME_ROOM = 'hall';
/** the world's top left: every layer of the house is drawn from here, in world units */
const [X0, Y0] = HOUSE_BOUNDS;
/** what a scene draws besides the layer you tap: the bits that move (y-sorted like the layer) and the pips */
interface Extras { bits: { y: number; bit: Bit }[]; pips: Bit[] }

/** a step of a guided tour of the house: its room, what it points at (a thing's id, 'me' for your hero by
 *  the fire, 'newhero' for the empty bed), where its pin stands and, if not over the pin, where the camera looks */
interface TourStep { room: string; thing?: string; at: [number, number]; cam?: number; callout: string; step: string; title: string; sub: string; next: string }
/** the 3-step guided tour shown after making your first hero: points directly at the object in each room */
const TOUR_STEPS: TourStep[] = [
  {
    room: 'hall',
    thing: 'me',
    at: [HERO_AT.x, HERO_AT.y - 310],
    cam: HERO_AT.x + 70,
    callout: 'Tap Your Hero · Gear',
    step: '1 / 3',
    title: 'Your Hero',
    sub: 'New gear waits here. You put it on.',
    next: 'Next →',
  },
  {
    room: 'bunks',
    thing: 'newhero',
    at: [BUNK_SLOTS[0][0], BUNK_SLOTS[0][1] - 190],
    cam: 270,
    callout: 'Tap a Bed · New Hero',
    step: '2 / 3',
    title: 'Your Warband',
    sub: 'A hero for each role fills your party seats.',
    next: 'Next →',
  },
  {
    room: 'cellar',
    thing: 'barrow',
    at: [300, 140],
    callout: 'Tap Door · Enter Dungeon',
    step: '3 / 3',
    title: 'Dungeons',
    sub: '4-minute runs for rare loot & pets.',
    next: 'Dungeons',
  },
];
/** the one-step tip back home after your first seed drops: the planter beds in the yard */
const SEED_STEPS: TourStep[] = [
  {
    room: 'yard',
    thing: 'bed.1',
    at: [-400, -150],
    callout: 'Tap a Bed · Plant It',
    step: 'New',
    title: 'Your First Seed',
    sub: 'Plant it here. It grows over 3 dungeon clears.',
    next: 'Got it',
  },
];

export class Hearth {
  /** collectibles that just arrived: they pop in the first time you see them */
  fresh = new Set<string>();
  private cam: Camera;
  private svg: SVGSVGElement;
  private back: SVGSVGElement;
  private front: SVGSVGElement;
  private fx: HTMLElement;
  private bits: HTMLElement;
  private pips: HTMLElement;
  /** the looks the back and front were last built for, and the markup each layer was last given */
  private looks = '';
  private drawn = new Map<Element, string>();
  private signs: HTMLElement;
  private top: HTMLElement;
  private bottom: HTMLElement;
  private decorating = false;
  /** the tour showing (the welcome tour or the garden tip) and its step, or null */
  private tour: TourStep[] = TOUR_STEPS;
  private tourStep: number | null = null;
  private placed = false;
  private want: string | null = null;
  private lastTap = { t: 0, x: 0, y: 0 };
  /** the zoom where a room fills a phone, and the zoom where the whole house fits */
  private roomZ = 0.6;
  private fitZ = 0.2;

  constructor(private app: App, private root: HTMLElement) {
    const [, , x1, y1] = HOUSE_BOUNDS, size = `viewBox="${X0} ${Y0} ${x1 - X0} ${y1 - Y0}" width="${x1 - X0}" height="${y1 - Y0}"`;
    root.innerHTML = `<div class="h-cam"><div class="h-world" style="width: ${x1 - X0}px; height: ${y1 - Y0}px">
        <svg class="h-back" ${size} aria-hidden="true"></svg><svg class="room house" ${size} role="group" aria-label="Your house"></svg>
        <div class="h-fx" aria-hidden="true"></div><div class="h-bits" aria-hidden="true"></div>
        <svg class="h-front" ${size} aria-hidden="true"></svg><div class="h-pips" aria-hidden="true"></div></div></div>
      <div class="h-signs no-cam"></div><div class="h-top no-cam"></div><div class="h-bottom no-cam"></div>`;
    this.svg = root.querySelector('svg.house')!;
    this.back = root.querySelector('svg.h-back')!;
    this.front = root.querySelector('svg.h-front')!;
    this.fx = root.querySelector('.h-fx')!;
    this.bits = root.querySelector('.h-bits')!;
    this.pips = root.querySelector('.h-pips')!;
    this.signs = root.querySelector('.h-signs')!;
    this.top = root.querySelector('.h-top')!;
    this.bottom = root.querySelector('.h-bottom')!;
    this.cam = new Camera(root, root.querySelector('.h-cam')!, root.querySelector('.h-world')!, { bounds: HOUSE_BOUNDS, onChange: () => this.onView() });
    actions(root, {
      dungeon: () => { SFX.play('ui'); if (this.tourStep !== null) this.endTour(true); else app.sheets.open({ kind: 'dungeon' }); },
      gear: () => { SFX.play('ui'); if (this.tourStep !== null) this.endTour(false); this.act('gear'); },
      settings: () => { SFX.play('ui'); app.sheets.open({ kind: 'settings' }); },
      deco: () => { if (this.tourStep !== null) this.endTour(false); this.decorating = !this.decorating; SFX.play('ui'); this.render(); },
      looks: () => { SFX.play('ui'); app.sheets.open({ kind: 'looks' }); },
      zoom: () => { SFX.play('ui'); if (this.far()) this.goRoom(HOME_ROOM); else this.overview(); },
      room: (el) => { SFX.play('ui'); this.goRoom(el.dataset.room!); },
      tournext: () => { SFX.play('ui'); this.nextTour(); },
      tourskip: () => { SFX.play('ui'); this.endTour(false); },
    });
    // taps anywhere in the scene, past the house's edges too; the buttons over it look after themselves
    root.addEventListener('click', (e) => { const t = e.target as Element; if (this.root.contains(t) && !t.closest('.no-cam, [data-act]')) this.tap(e); });
    this.svg.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = (e.target as Element).closest(TAPPABLE);
      if (el) { e.preventDefault(); this.use(el); }
    });
    this.svg.addEventListener('focusin', (e) => {
      const el = (e.target as Element).closest<SVGGElement>('[data-x]');
      if (!el) return;
      const x = +el.dataset.x!, y = +el.dataset.y!;
      const [sx, sy] = this.cam.toScreen(x, y);
      if (sx < 40 || sx > this.cam.w - 40 || sy < 80 || sy > this.cam.h - 110) this.cam.flyTo(x, y - 120, Math.max(this.cam.z, this.roomZ));
    });
    root.addEventListener('keydown', (e) => {
      if ((e.target as Element).closest('input, textarea')) return;
      if (e.key === '+' || e.key === '=') this.cam.zoomAt(1.25, this.cam.w / 2, this.cam.h / 2);
      if (e.key === '-' || e.key === '_') this.cam.zoomAt(0.8, this.cam.w / 2, this.cam.h / 2);
    });
  }

  /** The next time the house is drawn, go to this room (the bunk room after making a hero, say). */
  aim(room: string): void { this.want = room; }

  /** Start (or replay) the 3-step Hearth tour. */
  startTour(): void {
    this.beginTour(TOUR_STEPS);
    this.app.showHearth(TOUR_STEPS[0].room);
  }

  private beginTour(steps: TourStep[]): void {
    this.tour = steps;
    this.tourStep = 0;
    this.decorating = false;
    this.want = steps[0].room;
  }
  private get step(): TourStep | null { return this.tourStep !== null ? this.tour[this.tourStep] || null : null; }
  /** where a step's pin stands: the empty bed moves along as the bunk room fills */
  private tourAt(step: TourStep): [number, number] {
    if (step.thing !== 'newhero') return step.at;
    const [bx, by] = BUNK_SLOTS[Math.min(this.app.p.roster.length - 1, BUNK_SLOTS.length - 1)] || BUNK_SLOTS[0];
    return [bx, by - 190];
  }

  private nextTour(): void {
    if (this.tourStep === null) return;
    if (this.tourStep < this.tour.length - 1) {
      this.tourStep++;
      const step = this.tour[this.tourStep];
      this.render();
      this.goRoom(step.room);
    } else {
      this.endTour(this.tour === TOUR_STEPS);
    }
  }

  /** the tour is over (finished, skipped or tapped through): it doesn't come back */
  private closeTour(): void {
    if (this.tourStep === null) return;
    this.tourStep = null;
    if (this.tour === SEED_STEPS) finishSeedTour(this.app.p);
    else finishHearthTour(this.app.p);
  }

  private endTour(openDungeons = false): void {
    // the welcome tour ends in the hall; the garden tip leaves you by the beds
    if (this.tour === TOUR_STEPS) this.goRoom(HOME_ROOM);
    this.closeTour();
    this.app.save();
    if (openDungeons) this.app.sheets.open({ kind: 'dungeon' });
  }

  render(): void {
    const p = this.app.p, h = activeHero(p);
    if (!h) return;
    if (this.tourStep === null && needsHearthTour(p)) this.beginTour(TOUR_STEPS);
    else if (this.tourStep === null && needsSeedTour(p)) this.beginTour(SEED_STEPS);
    const look = (room: string): string => lookOf(p, room, this.app.dev.allOpen);
    const looks = LOOK_ROOMS.map(look).join(' ');
    if (looks !== this.looks) {
      this.looks = looks;
      this.back.innerHTML = `<defs>${houseDefs()}</defs>${houseBack(look)}`;
      this.front.innerHTML = houseFront(look);
      this.fx.innerHTML = bitsHtml(houseBits(look), X0, Y0);
    }
    const extra: Extras = { bits: [], pips: [] };
    this.draw(this.svg, this.scene(h, extra));
    this.draw(this.bits, bitsHtml(extra.bits.sort((a, b) => a.y - b.y).map((b) => b.bit), X0, Y0));
    this.draw(this.pips, bitsHtml(extra.pips, X0, Y0));
    this.svg.classList.toggle('deco', this.decorating);
    this.root.classList.toggle('decorating', this.decorating);
    this.hud(h);
    this.layout();
    if (this.fresh.size) setTimeout(() => this.fresh.clear(), 1200);
  }

  /** give a layer new markup, unless it already has exactly that (most saves change nothing you can see) */
  private draw(el: Element, html: string): void {
    if (this.drawn.get(el) === html) return;
    this.drawn.set(el, html);
    el.innerHTML = html;
  }

  /** fit the camera to the screen: on the first look, start in the hall */
  layout(): void {
    const w0 = this.cam.w, h0 = this.cam.h;
    this.cam.measure();
    if (this.cam.w < 2) return;
    const wasFar = this.placed && this.far();
    const [x0, y0, x1, y1] = HOUSE_FIT;
    this.fitZ = Math.min(this.cam.w / (x1 - x0), (this.cam.h - 160) / (y1 - y0));
    this.roomZ = Math.min(this.cam.w / 640, this.cam.h / 1000);
    this.cam.zMin = this.fitZ * 0.9;
    this.cam.zMax = this.roomZ * 2.4;
    if (this.want) { const r = this.want; this.want = null; this.placed = true; this.goRoom(r, !this.root.offsetParent); return; }
    if (!this.placed) { this.placed = true; this.goRoom(HOME_ROOM, true); return; }
    if (this.cam.w === w0 && this.cam.h === h0) return;
    if (wasFar) this.overview(true);
    else this.cam.set(this.cam.cx, this.cam.cy, this.cam.z);
  }

  /** the save chip: shown only when your progress is not in your account */
  syncState(): void {
    const el = this.root.querySelector<HTMLElement>('#sync-chip');
    if (!el) return;
    const st = this.app.store.state;
    const [g, t] = st === 'connecting' ? [GLYPH.cloud, 'Connecting…'] : st === 'offline' ? [GLYPH.device, 'Saved on this device (offline)'] : [GLYPH.device, 'Saved on this device'];
    el.hidden = st === 'account';
    el.innerHTML = `<span class="ic" style="color: #E9DDCB">${g}</span><span class="long">${t}</span>`;
    el.setAttribute('title', t);
    el.setAttribute('aria-label', t);
  }

  private far(): boolean { return this.cam.z < this.roomZ * 0.75; }
  private goRoom(id: string, jump = false): void {
    const r = ROOMS.find((x) => x.id === id) || ROOMS.find((x) => x.id === HOME_ROOM)!;
    const step = this.step?.room === id ? this.step : null;
    const fx = step ? step.cam ?? this.tourAt(step)[0] : r.focus[0];
    const fy = r.focus[1];
    if (jump) this.cam.set(fx, fy, this.roomZ);
    else this.cam.flyTo(fx, fy, this.roomZ);
  }
  private overview(jump = false): void {
    const [x0, y0, x1, y1] = HOUSE_FIT;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 20 / this.fitZ;
    if (jump) this.cam.set(cx, cy, this.fitZ); else this.cam.flyTo(cx, cy, this.fitZ);
  }

  /** after every move of the camera: room signs follow their rooms, and show only when you're zoomed out */
  private onView(): void {
    const far = this.far(), wasFar = this.root.classList.contains('far');
    if (far !== wasFar) this.root.classList.toggle('far', far);
    if (far || wasFar) {
      // a sign by the edge of the screen (the garden's, the paddock's) shifts in so it can be read; the
      // widths are all read before any sign moves, so the page is laid out once
      const signs = [...this.signs.querySelectorAll<HTMLElement>('.h-sign')].map((el) => ({ el, hw: el.offsetWidth / 2 + 6 }));
      for (const { el, hw } of signs) {
        const r = ROOMS.find((x) => x.id === el.dataset.room);
        if (!r) continue;
        const [ax, ay] = r.sign || r.focus;
        const [sx0, sy] = this.cam.toScreen(ax, ay);
        const sx = sx0 < 0 || sx0 > this.cam.w ? sx0 : Math.max(hw, Math.min(this.cam.w - hw, sx0));
        el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -50%)`;
      }
    }
    const pin = this.signs.querySelector<HTMLElement>('.h-tour-pin');
    if (pin && this.step) {
      const [ax, ay] = this.tourAt(this.step);
      const [sx0, sy] = this.cam.toScreen(ax, ay);
      const sx = Math.max(125, Math.min(this.cam.w - 125, sx0));
      pin.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
    }
    const z = this.root.querySelector<HTMLElement>('[data-act="zoom"]');
    if (z) {
      const t = far ? 'Back to the hall' : 'See the whole house';
      if (z.getAttribute('aria-label') !== t) { z.setAttribute('aria-label', t); z.setAttribute('title', t); z.innerHTML = far ? GLYPH.home : HOUSE_GLYPH; }
    }
  }

  /* ---------------------------------------------------------------- what a tap does */
  private tap(e: MouseEvent): void {
    if (this.cam.moved()) return;
    const el = (e.target as Element).closest(TAPPABLE);
    const box = this.root.getBoundingClientRect();
    const px = e.clientX - box.left, py = e.clientY - box.top;
    // from far away, a tap takes you into the room you tapped
    if (this.far() && !this.decorating) {
      const [wx, wy] = this.cam.toWorld(px, py);
      const r = roomAt(wx, wy);
      if (r) { SFX.play('ui'); this.goRoom(r.id); }
      return;
    }
    if (el) { this.use(el); return; }
    // a double tap on nothing zooms in there
    const now = performance.now();
    if (now - this.lastTap.t < 340 && Math.hypot(px - this.lastTap.x, py - this.lastTap.y) < 30) {
      this.lastTap.t = 0;
      const [wx, wy] = this.cam.toWorld(px, py);
      this.cam.flyTo(wx, wy, Math.min(this.cam.zMax, this.cam.z * 1.7), 320);
    } else this.lastTap = { t: now, x: px, y: py };
  }
  private use(el: Element): void {
    const d = (el as SVGElement).dataset;
    SFX.play('ui');
    if (this.tourStep !== null) {
      this.closeTour();
      this.app.store.save();
      const h = activeHero(this.app.p);
      if (h) this.hud(h);
    }
    if (d.thing) { const t = THINGS.find((x) => x.id === d.thing); if (t) this.act(t.action, t.bed); }
    else if (d.spot) this.app.sheets.open({ kind: 'picker', spot: d.spot });
    else if (d.mount) this.app.sheets.open({ kind: 'item', id: d.mount });
    else if (d.hero) { if (d.hero === this.app.p.active) this.act('gear'); else this.app.sheets.open({ kind: 'hero', hero: d.hero }); }
    else if (d.new !== undefined) this.app.showCreate();
  }
  /** what a thing in the house opens (the caller plays the click) */
  private act(a: HouseAction, bed = 0): void {
    const app = this.app;
    switch (a) {
      case 'dungeons': app.sheets.open({ kind: 'dungeon' }); break;
      case 'garden': app.garden.open(bed); break;
      case 'gear': { const h = activeHero(app.p); if (h) app.sheets.open({ kind: 'gear', hero: h.id }); break; }
      case 'logs': app.sheets.open({ kind: 'logs', tab: 'collection' }); break;
      case 'brew': app.showBrew(); break;
      case 'satchel': app.sheets.open({ kind: 'satchel' }); break;
    }
  }

  /* ---------------------------------------------------------------- the picture */
  /** the layer you tap: things, spots and heroes in painter's order; what moves in them goes into `extra` */
  private scene(h: Hero, extra: Extras): string {
    const p = this.app.p;
    const race = RACES[h.race as RaceId];
    const light = race?.light || '#F4B942';
    const layer: { y: number; svg: string }[] = [];
    for (const t of THINGS) layer.push({ y: t.y, svg: this.thing(t, h, extra) });
    for (const s of HOUSE_SPOTS) layer.push({ y: spotY(s), svg: this.spot(s, extra) });
    layer.push(...this.heroes(h, extra), ...this.mounts(extra));
    layer.sort((a, b) => a.y - b.y);
    if (Object.keys(p.collection).some((id) => !p.seen[id])) extra.pips.push(pip(600, -1940, '!'));
    return `<defs><radialGradient id="h-hero"><stop offset="0" stop-color="${light}" stop-opacity="0.38"/><stop offset="0.6" stop-color="${light}" stop-opacity="0.12"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient></defs>
      ${layer.map((l) => l.svg).join('')}`;
  }

  private thing(t: ThingDef, h: Hero, extra: Extras): string {
    const k = t.k ?? 1;
    // a garden bed is drawn as what grows in it
    const bed = t.action === 'garden' ? bedLook(this.app.p, t.bed ?? 0) : null;
    const sprite = bed ? bed.sprite : t.sprite, a = ART[sprite];
    if (!a) return '';
    const [vx, vy, w, hh] = a.vb;
    const top = t.y + vy * k;
    let label = '';
    if (bed) {
      label = `<text class="lbl small" x="${t.x}" y="${t.y + 26}">${esc(bed.label)}</text>`;
      if (bed.ready) extra.pips.push(pip(t.x + 70, top + 10, '!'));
    } else if (t.action === 'dungeons') label = `<text class="lbl" x="${t.x}" y="${t.y + 44}">Dungeons</text>`;
    else if (t.action === 'gear') label = `<text class="lbl small" x="${t.x}" y="${t.y + 28}">Gear</text>`;
    else if (t.action === 'logs') label = `<text class="lbl small" x="${t.x}" y="${t.y + 26}">Collection Log</text>`;
    else if (t.action === 'brew') label = `<text class="lbl small" x="${t.x}" y="${t.y + 26}">Brew</text>`;
    else if (t.action === 'satchel') label = `<text class="lbl small" x="${t.x}" y="${t.y + 26}">Satchel</text>`;
    if (t.action === 'gear') { const up = waiting(this.app.p, h).length; if (up) extra.pips.push(pip(t.x + 60, top + 20, String(up))); }
    const hl = this.step?.thing === t.id ? ' tour-hl' : '';
    return `<g class="thing a-${t.action}${hl}" data-thing="${t.id}" data-x="${t.x}" data-y="${t.y}" tabindex="0" role="button" aria-label="${esc(t.label)}">
      ${placeSprite(sprite, t.x, t.y, { k })}${bed?.plant ? placeSprite(bed.plant, t.x, t.y - 36 * k, { k: 0.9 * k }) : ''}${label}<rect class="hl" x="${(t.x + vx * k).toFixed(1)}" y="${top.toFixed(1)}" width="${(w * k).toFixed(1)}" height="${(hh * k).toFixed(1)}" rx="16"/></g>`;
  }

  private spot(s: HouseSpot, extra: Extras): string {
    const p = this.app.p, look = SPOT_LOOK[s.kind];
    const id = p.hearth.spots[s.id];
    const def = id ? COLLECTIBLES[id] : null;
    const owns = ownedOfKind(p, s.kind).length > 0;
    const k = s.k ?? look.k;
    let body = '';
    if (def && def.sprite) {
      const anim = this.fresh.has(id!) ? 'new-pop' : look.anim;
      if (s.kind === 'pet') body += `<ellipse cx="${s.x}" cy="${s.y}" rx="38" ry="10" style="fill: rgba(18, 12, 28, 0.35)"/>`;
      const bit = anim ? spriteBit(def.sprite, s.x, s.y, { k, cls: anim, flip: !!s.flip }) : null;
      if (bit) extra.bits.push({ y: spotY(s), bit });
      else body += placeSprite(def.sprite, s.x, s.y, { k, flip: !!s.flip });
    } else if (s.kind === 'banner') {
      body += (this.decorating ? placeSprite('banner_rod', s.x, s.y) : '') + `<rect class="mark" x="${s.x - 42}" y="${s.y + 14}" width="84" height="110" rx="10"/>` + plus(s.x, s.y + 68);
    } else if (s.kind === 'trophy') {
      body += `<rect class="mark" x="${s.x - 26}" y="${s.y - 58}" width="52" height="56" rx="10"/>` + plus(s.x, s.y - 30);
    } else {
      body += `<ellipse class="mark" cx="${s.x}" cy="${s.y - 4}" rx="42" ry="13"/>` + plus(s.x, s.y - 40);
    }
    const top = s.kind === 'banner' ? s.y : s.y - look.h;
    const cls = def ? 'has' : owns ? 'empty' : 'none';
    const label = def ? `${s.label}: ${def.name}` : `${s.label}: empty`;
    return `<g class="spot k-${s.kind} ${cls}" data-spot="${s.id}" data-x="${s.x}" data-y="${s.y}" tabindex="${def || this.decorating ? 0 : -1}" role="button" aria-label="${esc(label)}">${body}<rect class="hl" x="${s.x - look.w / 2}" y="${top}" width="${look.w}" height="${look.h}" rx="14"/></g>`;
  }

  /** The paddock: every mount in the game in its own place. Yours wander a little either side of it; one you
   *  haven't got is its shadow with a "?". Both are drawn as bits (so they sort by where they stand) over a
   *  tap area that covers where they wander. */
  private mounts(extra: Extras): { y: number; svg: string }[] {
    const ms = paddock(this.app.p), at = paddockSlots(ms.length), out: { y: number; svg: string }[] = [];
    ms.forEach((m, i) => {
      const c = COLLECTIBLES[m.id], a = c?.sprite ? ART[c.sprite] : null;
      if (!c?.sprite || !a) return;
      const { x, y, k } = at[i], [vx, vy, w, h] = a.vb;
      // the bit is as wide each side of the mount's feet, so it turns round on the spot
      const half = Math.max(-vx, vx + w) * k + 4, top = y + vy * k - 4, bottom = y + 24 * k;
      const shadow = `<ellipse cx="${x}" cy="${y}" rx="${f1(92 * k)}" ry="${f1(17 * k)}" style="fill: rgba(18, 12, 28, ${m.owned ? 0.35 : 0.22})"/>`;
      const body = m.owned ? shadow + placeSprite(c.sprite, x, y, { k })
        : shadow + placeSprite(c.sprite, x, y, { k, shade: true }) + `<text class="pq" x="${x}" y="${f1(y + (vy + h * 0.62) * k)}">?</text>`;
      const cls = !m.owned ? 'still' : this.fresh.has(m.id) ? 'new-pop' : `wander w${i % 4}`;
      extra.bits.push({ y, bit: { box: [x - half, top, half * 2, bottom - top], body, cls } });
      const reach = half + (m.owned ? PADDOCK.wander : 0);
      const label = m.owned ? `${c.name}, in your paddock` : 'A mount you haven’t found yet';
      out.push({ y, svg: `<g class="mount ${m.owned ? 'has' : 'none'}" data-mount="${esc(m.id)}" data-x="${x}" data-y="${y}" tabindex="0" role="button" aria-label="${esc(label)}">
        <rect class="hl" x="${f1(x - reach)}" y="${f1(top)}" width="${f1(reach * 2)}" height="${f1(bottom - top)}" rx="16"/></g>` });
    });
    return out;
  }

  /** you by the fire; everyone else by their beds upstairs, and a bed for a new hero */
  private heroes(h: Hero, extra: Extras): { y: number; svg: string }[] {
    const p = this.app.p, out: { y: number; svg: string }[] = [];
    const { x, y, k } = HERO_AT;
    const hl = this.step?.thing === 'me' ? ' tour-hl' : '';
    const me = spriteBit(heroSprite(h, roleOf(h), p) + '_f', x, y, { k, cls: 'breathe' });
    if (me) extra.bits.push({ y, bit: me });
    out.push({ y, svg: `<g class="hero me${hl}" data-hero="${esc(h.id)}" data-x="${x}" data-y="${y}" tabindex="0" role="button" aria-label="${esc(h.name)}: gear">
      <circle cx="${x}" cy="${y - 150 * k * 0.45}" r="${120 * k}" style="fill: url(#h-hero)"/>
      <ellipse cx="${x}" cy="${y}" rx="${34 * k}" ry="${10 * k}" style="fill: rgba(18, 12, 28, 0.45)"/>
      <rect class="hl" x="${x - 46 * k}" y="${y - 140 * k}" width="${92 * k}" height="${146 * k}" rx="20"/></g>` });
    const others = p.roster.filter((x2) => x2.id !== p.active);
    others.forEach((o, i) => {
      const [bx, by] = BUNK_SLOTS[i], bk = 1.45, role = roleOf(o);
      const up = waiting(p, o).length;
      if (up) extra.pips.push(pip(bx + 34, by - 170, String(up)));
      out.push({ y: by, svg: `<g class="hero" data-hero="${esc(o.id)}" data-x="${bx}" data-y="${by}" tabindex="0" role="button" aria-label="${esc(o.name)}, ${esc(CLASSES[o.cls as ClassId]?.name || o.cls)}">
        <ellipse cx="${bx}" cy="${by}" rx="${30 * bk}" ry="${9 * bk}" style="fill: rgba(18, 12, 28, 0.4)"/>
        ${placeSprite(heroSprite(o, role, p) + '_f', bx, by, { k: bk })}
        <text class="lbl small" x="${bx}" y="${FLOORS.upper + 26}">${esc(o.name.split(' ')[0])}</text>
        <rect class="hl" x="${bx - 48}" y="${by - 200}" width="96" height="210" rx="16"/></g>` });
    });
    if (p.roster.length < MAX_HEROES) {
      const [bx, by] = BUNK_SLOTS[others.length];
      out.push({ y: by, svg: `<g class="newhero${this.step?.thing === 'newhero' ? ' tour-hl' : ''}" data-new="1" data-x="${bx}" data-y="${by}" tabindex="0" role="button" aria-label="Make a new hero (${p.roster.length} of ${MAX_HEROES})">
        <rect x="${bx - 40}" y="${by - 176}" width="80" height="172" rx="34" class="ring"/>${plus(bx, by - 92)}
        <text class="lbl small" x="${bx}" y="${FLOORS.upper + 26}">New hero</text>
        <rect class="hl" x="${bx - 48}" y="${by - 150}" width="96" height="160" rx="16"/></g>` });
    }
    return out;
  }

  /* ---------------------------------------------------------------- the buttons over the house */
  private hud(h: Hero): void {
    const p = this.app.p, role = roleOf(h);
    const cls = CLASSES[h.cls as ClassId], race = RACES[h.race as RaceId];
    const rec = p.dungeons.barrow, dg = DUNGEONS.barrow;
    const up = waiting(p, h).length;
    this.top.innerHTML = `
      <button type="button" class="h-tag" data-act="gear" style="--light: ${race?.light || '#F4B942'}" aria-label="${esc(h.name)}, item level ${ilvl(loadoutFor(p, h).score)}: gear${up ? `, ${up} new to put on` : ''}">
        <i class="rdot ${role}" aria-hidden="true"></i><span><b>${esc(h.name)}</b><small><span class="long">${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · </span>Item level ${ilvl(loadoutFor(p, h).score)}</small></span>
        ${up ? `<i class="badge" aria-hidden="true">${up}</i>` : ''}
      </button>
      <div class="right">
        <span class="chip dark" title="${esc(dg.marksName)}"><span class="ic">${tile('marks')}</span><b>${rec ? rec.marks : 0}</b><span class="long">${esc(dg.marksName)}</span></span>
        <span class="chip dark" id="sync-chip" hidden></span>
        <button type="button" class="icon-btn" data-act="deco" aria-pressed="${this.decorating}" aria-label="Decorate" title="Decorate">${GLYPH.pen}</button>
        <button type="button" class="icon-btn" data-act="settings" aria-label="Settings" title="Settings">${GLYPH.gear}</button>
      </div>`;
    const step = this.step, tip = this.tour === SEED_STEPS;
    this.bottom.innerHTML = step
      ? `<div class="h-tour" role="region" aria-label="${tip ? 'Garden tip' : 'Welcome tour'}">
          <div class="h-tour-tx">
            <b><span class="h-tour-step">${esc(step.step)}</span>${esc(step.title)}</b>
            <p>${esc(step.sub)}</p>
          </div>
          <div class="h-tour-acts">
            ${tip ? '' : '<button type="button" class="btn small" data-act="tourskip">Skip</button>'}
            <button type="button" class="btn small gold" data-act="tournext">${!tip && this.tourStep === TOUR_STEPS.length - 1 ? GLYPH.door : ''}${esc(step.next)}</button>
          </div>
        </div>`
      : this.decorating
      ? `<div class="h-deco"><span><b>Decorating</b><small>Tap a <i aria-hidden="true">+</i> to put something there</small></span><button type="button" class="btn small" data-act="looks">${GLYPH.roller}Looks</button><button type="button" class="btn gold" data-act="deco">Done</button></div>`
      : `<div class="h-bar">
          <button type="button" class="icon-btn h-zoom" data-act="zoom" aria-label="See the whole house" title="See the whole house">${HOUSE_GLYPH}</button>
          <button type="button" class="btn gold big h-go" data-act="dungeon">${GLYPH.door}Dungeons</button>
        </div>`;
    const pinHtml = step ? `<button type="button" class="h-tour-pin" data-act="tournext"><b>${esc(step.callout)}</b><i aria-hidden="true">▼</i></button>` : '';
    this.signs.innerHTML = ROOMS.map((r) => `<button type="button" class="h-sign" data-act="room" data-room="${r.id}" tabindex="-1">${esc(r.name)}</button>`).join('') + pinHtml;
    this.onView();
    this.syncState();
  }
}

/** Item level: the weighted gear score, where the weapon counts twice. */
export const ilvl = (score: number): string => (Math.round(score * 10) / 10).toString();
const plus = (x: number, y: number): string => `<path class="plus" d="M${x - 10} ${y} H${x + 10} M${x} ${y - 10} V${y + 10}"/>`;
/** a little red count, like the one on a button, bobbing over what it counts */
const pip = (x: number, y: number, t: string): Bit => ({ box: [x - 27, y - 27, 54, 54], body: `<circle cx="${x}" cy="${y}" r="24"/><text x="${x}" y="${y + 9}">${esc(t)}</text>`, cls: 'pip' });
/** where a spot sorts in the layer: pets by where they stand, the rest at the back */
const spotY = (s: HouseSpot): number => (s.kind === 'pet' ? s.y : -9999);
/** what you can tap in the house */
const TAPPABLE = '[data-thing], [data-spot], [data-hero], [data-new], [data-mount]';
const f1 = (n: number): string => (Math.round(n * 10) / 10).toString();
/** the house, for the zoom-out button */
const HOUSE_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21 V9 L12 3 L20 9 V21 Z M4 13 H20 M4 17 H20 M12 13 V21" style="fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round"/></svg>';
