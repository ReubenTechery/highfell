/**
 * The Hearth: home, a tall house cut open so you can see into every room. It opens zoomed out on the
 * whole house, a sign on each room, every time you come home; tap a room to go in, and one with one clear
 * job (its `main`) opens it as the camera lands. Zoomed in, you tap things to use them: a door for every dungeon
 * in the cellar (the Hall of Doors), the planter beds in the yard (the garden), the armour stand (your gear), the
 * big book in the loft (the collection log), the cauldron and the larder. Your hero stands by the fire
 * under a name tag; your other heroes wait by their beds upstairs. Pets, trophies and banners go in spots
 * all over the house; Decorate shows the empty ones. Out in the paddock every mount in the game has its own
 * place: yours wander about, the rest are shadows; tap one for its card. One big button: Dungeons.
 * The house is drawn on one canvas (housecanvas.ts): the back (the outside, rooms and furniture) and the
 * front (the lights) are built only when a look changes; between them are what you tap (things, spots, heroes:
 * the scene, a layer in the page you tap, see-through) and the bits that move (art.ts), and the pips.
 */
import { COLLECTIBLES } from '../content';
import { CLASSES, MAX_HEROES, RACES, type ClassId, type RaceId } from '../content/folk';
import { BUNK_SLOTS, FLOORS, HERO_AT, HOUSE_SPOTS, LOOK_ROOMS, PADDOCK, ROOMS, THINGS, paddockSlots, roomAt, type HouseAction, type HouseSpot, type ThingDef } from '../content/house';
import { lookOf, ownedOfKind, paddock } from '../meta/hearth';
import { loadoutFor, waiting, wholeIlvl } from '../meta/gear';
import { activeHero, roleOf, type Hero } from '../meta/profile';
import { unspent } from '../meta/talents';
import { levelOf } from '../content/xp';
import { finishTip, houseTip, type HouseTip } from '../meta/tips';
import { bedToOpen } from '../meta/vale';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { ART, heroSprite, placeSprite, spriteBit, type Bit } from './art';
import { SFX } from './sound';
import { Camera } from './camera';
import { BACKDROP, HOUSE_BOUNDS, HOUSE_FIT, houseBack, houseBits, houseDefs, houseLights, houseWalls } from './houseart';
import { HouseCanvas } from './housecanvas';
import { bedLook } from './garden';
import { hallDoors } from './halldoors';
import { NameTag } from './nametag';
import { TOUR_STEPS, tipSteps, type TourStep } from './tours';
import { warbandOpen, warbandWhy } from '../meta/warband';

/** how big each kind of thing is drawn in a spot, its tap area, and how it moves */
const SPOT_LOOK: Record<string, { k: number; w: number; h: number; anim: string }> = {
  pet: { k: 1.3, w: 100, h: 130, anim: 'bob' },
  trophy: { k: 1, w: 66, h: 84, anim: '' },
  banner: { k: 1, w: 112, h: 146, anim: 'sway' },
};
/** the room the zoom button goes into from the whole house */
const HOME_ROOM = 'hall';
/** what the house is told to show next for the whole house, in place of a room */
const WHOLE = 'house';
/** the world's top left: every layer of the house is drawn from here, in world units */
const [X0, Y0] = HOUSE_BOUNDS;
/** what a scene draws besides the layer you tap: the bits that move (y-sorted like the layer) and the pips */
interface Extras { bits: { y: number; bit: Bit }[]; pips: Bit[] }

export class Hearth {
  /** collectibles that just arrived: they pop in the first time you see them */
  fresh = new Set<string>();
  private cam: Camera;
  private svg: SVGSVGElement;
  /** the house on screen: one canvas, drawn from the layers below (housecanvas.ts) */
  private house: HouseCanvas;
  /** the looks the back and front were last built for, and the markup each layer was last given */
  private looks = '';
  private drawn = new Map<Element, string>();
  private signs: HTMLElement;
  private top: HTMLElement;
  private bottom: HTMLElement;
  private decorating = false;
  /** the tip showing (the welcome tour or one of the garden's), its steps for this save, and its step, or null */
  private tip: HouseTip = 'tour';
  private tour: TourStep[] = TOUR_STEPS;
  private tourStep: number | null = null;
  private placed = false;
  /** where to go the next time the house is drawn: a room, the whole house (WHOLE), or stay put */
  private want: string | null = null;
  /** what is open over the house was opened from the whole house: when it closes, go back out to it */
  private out = false;
  private lastTap = { t: 0, x: 0, y: 0 };
  /** the zoom where a room fills a phone, and the zoom where the whole house fits */
  private roomZ = 0.6;
  private fitZ = 0.2;
  /** your hero's name tag, over their head */
  private tag: NameTag;

  constructor(private app: App, private root: HTMLElement) {
    const [, , x1, y1] = HOUSE_BOUNDS, size = `viewBox="${X0} ${Y0} ${x1 - X0} ${y1 - Y0}" width="${x1 - X0}" height="${y1 - Y0}"`;
    root.innerHTML = `<div class="h-cam"><div class="h-world" style="width: ${x1 - X0}px; height: ${y1 - Y0}px">
        <svg class="h-back" ${size} aria-hidden="true"></svg><svg class="room house" ${size} role="group" aria-label="Your house"></svg>
        <div class="h-fx" aria-hidden="true"></div><div class="h-bits" aria-hidden="true"></div>
        <svg class="h-front" ${size} aria-hidden="true"></svg><div class="h-pips" aria-hidden="true"></div></div></div>
      <div class="h-signs no-cam"></div><div class="h-top no-cam"></div><div class="h-bottom no-cam"></div>`;
    this.svg = root.querySelector('svg.house')!;
    this.signs = root.querySelector('.h-signs')!;
    this.top = root.querySelector('.h-top')!;
    this.bottom = root.querySelector('.h-bottom')!;
    this.tag = new NameTag(root, this.top, this.bottom);
    const world = root.querySelector<HTMLElement>('.h-world')!, q = <T extends Element>(sel: string): T => world.querySelector<T>(sel)!;
    this.cam = new Camera(root, root.querySelector('.h-cam')!, world, { bounds: HOUSE_BOUNDS, onChange: () => this.onView() });
    this.house = new HouseCanvas(root, this.cam, { world, svg: this.svg, back: q('svg.h-back'), front: q('svg.h-front'), fx: q('.h-fx'), bits: q('.h-bits'), pips: q('.h-pips') });
    actions(root, {
      dungeon: () => { SFX.play('ui'); if (this.tourStep !== null) this.endTour(true); else { this.out = this.far(); app.sheets.open({ kind: 'dungeon' }); } },
      gear: () => { SFX.play('ui'); if (this.tourStep !== null) this.endTour(false); this.act('gear'); },
      settings: () => { SFX.play('ui'); this.out = this.far(); app.sheets.open({ kind: 'settings' }); },
      deco: () => { if (this.tourStep !== null) this.endTour(false); this.decorating = !this.decorating; SFX.play('ui'); this.render(); },
      looks: () => { SFX.play('ui'); this.out = this.far(); app.sheets.open({ kind: 'looks' }); },
      zoom: () => { SFX.play('ui'); if (this.far()) this.goRoom(HOME_ROOM); else this.overview(); },
      room: (el) => { SFX.play('ui'); this.enter(el.dataset.room!); },
      tournext: () => { SFX.play('ui'); this.nextTour(); },
      tourpin: () => { SFX.play('ui'); this.pinTap(); },
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
    // the name tag changes size when the display font arrives, and the house's labels are written again in it
    if (document.fonts) document.fonts.addEventListener('loadingdone', () => { this.tag.measure(); this.house.fonts(); this.onView(); });
  }

  /** The next time the house is drawn, go to this room (the bunk room after making a hero, say). */
  aim(room: string): void { this.want = room; this.out = false; }
  /** The next time the house is drawn, show the whole house: coming home from a run, or on load. */
  home(): void { this.want = WHOLE; this.out = false; }
  /** What was open over the house has closed (a sheet, a garden bed's card, the cauldron): if it was
   *  opened from the whole house, go back out to it. */
  closed(): void {
    // a tip that waited for what was open to close (your first herbs, after the harvest's card) goes there
    // instead, once it's clear the house is staying on screen (closing for a run or the hero maker, it waits)
    if (this.tourStep === null && houseTip(this.app.p)) { this.out = false; setTimeout(() => this.tipNow(), 0); return; }
    if (!this.out) return;
    this.out = false;
    if (this.root.offsetParent) this.overview(); else this.want = WHOLE;
  }

  /** Start (or replay) the 3-step Hearth tour. */
  startTour(): void {
    this.beginTour('tour');
    this.app.showHearth(TOUR_STEPS[0].room);
  }

  private beginTour(tip: HouseTip): void {
    this.tip = tip;
    this.tour = tipSteps(tip, this.app.p);
    this.tourStep = 0;
    this.decorating = false;
    this.want = this.tour[0].room;
  }
  /** something is open over the house (a sheet, a garden bed's card or a harvest): a tip waits for it to close */
  private covered(): boolean { return !!this.app.sheets.spec || this.app.garden.showing; }
  /** a waiting tip begins, if the house is on screen with nothing over it */
  private tipNow(): void {
    if (this.tourStep === null && this.root.offsetParent && !this.covered() && houseTip(this.app.p)) this.render();
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
      this.endTour(this.tip === 'tour');
    }
  }

  /** the pin over what a step points at: on the welcome tour it's Next; on a tip it does what it says (the talents
   *  tip opens your hero's Talents) */
  private pinTap(): void {
    if (this.tip === 'talents') { this.dropTour(); const h = activeHero(this.app.p); if (h) this.app.sheets.open({ kind: 'gear', hero: h.id, tab: 'talents' }); return; }
    const t = this.tip !== 'tour' ? THINGS.find((x) => x.id === this.step?.thing) : undefined;
    if (!t) { this.nextTour(); return; }
    this.dropTour();
    this.act(t.action, { bed: t.bed });
  }

  /** the tour is over (finished, skipped or tapped through): it doesn't come back */
  private closeTour(): void {
    if (this.tourStep === null) return;
    this.tourStep = null;
    finishTip(this.app.p, this.tip);
  }

  private endTour(openDungeons = false): void {
    // the welcome tour ends on the whole house, home; a garden tip leaves you where it was
    if (this.tip === 'tour') this.overview();
    this.closeTour();
    this.app.save();
    if (openDungeons) this.app.sheets.open({ kind: 'dungeon' });
  }

  render(): void {
    const p = this.app.p, h = activeHero(p);
    if (!h) return;
    this.house.wake();
    // a tip whose moment has come begins once nothing is open over the house
    if (this.tourStep === null && !this.covered()) { const t = houseTip(p); if (t) this.beginTour(t); }
    const look = (room: string): string => lookOf(p, room, this.app.dev.allOpen);
    const looks = LOOK_ROOMS.map(look).join(' ');
    if (looks !== this.looks) {
      this.looks = looks;
      // the outer walls' cut edges go in the back picture; each room's light is a soft picture over everything
      this.house.setBack(houseDefs(), houseBack(look) + houseWalls(look), houseLights(look), houseBits(look));
    }
    const extra: Extras = { bits: [], pips: [] };
    const changed = this.draw(this.svg, this.scene(h, extra));
    this.svg.classList.toggle('deco', this.decorating);
    this.root.classList.toggle('decorating', this.decorating);
    this.house.setScene(extra.bits.sort((a, b) => a.y - b.y).map((b) => b.bit), extra.pips, changed);
    this.hud(h);
    this.layout();
    if (this.fresh.size) setTimeout(() => this.fresh.clear(), 1200);
  }

  /** give a layer new markup, unless it already has exactly that (most saves change nothing you can see);
   *  true if it did */
  private draw(el: Element, html: string): boolean {
    if (this.drawn.get(el) === html) return false;
    this.drawn.set(el, html);
    el.innerHTML = html;
    return true;
  }

  /** the house's whole pictures: over all the camera can show (a portrait screen clips to the house's bounds),
   *  sharp enough for the whole-house zoom */
  private paintWhole(): void {
    if (this.cam.w < 2) return;
    const [bx0, by0, bx1, by1] = HOUSE_BOUNDS, [ax0, ay0, ax1, ay1] = BACKDROP;
    let r: [number, number, number, number] = [bx0, by0, bx1 - bx0, by1 - by0];
    if (this.cam.w > this.cam.h) {
      // wider than tall: as far as the screen reaches at the furthest zoom out, but never past the backdrop
      const vw = Math.max(bx1 - bx0, this.cam.w / this.cam.zMin), vh = Math.max(by1 - by0, this.cam.h / this.cam.zMin);
      const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
      const x0 = Math.max(ax0, cx - vw / 2), y0 = Math.max(ay0, cy - vh / 2), x1 = Math.min(ax1, cx + vw / 2), y1 = Math.min(ay1, cy + vh / 2);
      r = [x0, y0, x1 - x0, y1 - y0];
    }
    this.house.whole(r, this.fitZ);
  }
  /** your Warband is open (or the testing switch opens everything) */
  private warband(): boolean { return warbandOpen(this.app.p) || this.app.dev.allOpen; }
  /** The house is off screen: it stops drawing, and its pictures let go of their memory. */
  sleep(): void { this.house.sleep(); }

  /** fit the camera to the screen: on the first look, and coming home, show the whole house */
  layout(): void {
    const w0 = this.cam.w, h0 = this.cam.h;
    this.cam.measure();
    if (this.cam.w < 2) return;
    this.house.resize();
    const wasFar = this.placed && this.far();
    const [x0, y0, x1, y1] = HOUSE_FIT;
    this.fitZ = Math.min(this.cam.w / (x1 - x0), (this.cam.h - 160) / (y1 - y0));
    this.roomZ = Math.min(this.cam.w / 640, this.cam.h / 1000);
    this.cam.zMin = this.fitZ * 0.9;
    this.cam.zMax = this.roomZ * 2.4;
    this.paintWhole();
    if (this.cam.w !== w0 || this.cam.h !== h0) this.tag.measure();
    if (this.want) { const r = this.want; this.want = null; this.placed = true; if (r === WHOLE) this.overview(true); else this.goRoom(r, !this.root.offsetParent); return; }
    if (!this.placed) { this.placed = true; this.overview(true); return; }
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
  private goRoom(id: string, jump = false, done?: () => void): void {
    const r = ROOMS.find((x) => x.id === id) || ROOMS.find((x) => x.id === HOME_ROOM)!;
    const step = this.step?.room === id ? this.step : null;
    const fx = step ? step.cam ?? this.tourAt(step)[0] : r.focus[0];
    const fy = r.focus[1];
    if (jump) { this.cam.set(fx, fy, this.roomZ); done?.(); }
    else this.cam.flyTo(fx, fy, this.roomZ, 480, done);
  }
  /** From the whole house, go into a room; one with one clear job opens it as the camera lands (the garden
   *  opens the bed you tapped, or the one that wants you; the Dungeons, the door you tapped). */
  private enter(id: string, pick: Pick = {}): void {
    const main = ROOMS.find((x) => x.id === id)?.main;
    if (!main) { this.goRoom(id); return; }
    this.goRoom(id, false, () => { this.dropTour(); this.act(main, pick, true); });
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
    this.tag.place(this.cam, this.step?.thing === 'me');
    const z = this.root.querySelector<HTMLElement>('[data-act="zoom"]');
    if (z) {
      const t = far ? 'Go into the hall' : 'See the whole house';
      if (z.getAttribute('aria-label') !== t) { z.setAttribute('aria-label', t); z.setAttribute('title', t); z.innerHTML = far ? GLYPH.home : HOUSE_GLYPH; }
    }
    this.house.view();
  }

  /* ---------------------------------------------------------------- what a tap does */
  private tap(e: MouseEvent): void {
    if (this.cam.moved()) return;
    const el = (e.target as Element).closest(TAPPABLE);
    const box = this.root.getBoundingClientRect();
    const px = e.clientX - box.left, py = e.clientY - box.top;
    // from far away, a tap takes you into the room you tapped, and opens its main thing (a garden bed you hit, that
    // bed; a door you hit, its dungeon)
    if (this.far() && !this.decorating) {
      const [wx, wy] = this.cam.toWorld(px, py);
      const r = roomAt(wx, wy);
      if (!r) return;
      SFX.play('ui');
      const d = (el as SVGElement | null)?.dataset, t = THINGS.find((x) => x.id === d?.thing);
      this.enter(r.id, { bed: t && t.room === r.id && t.action === r.main ? t.bed : undefined, dungeon: r.main === 'dungeons' ? d?.door : undefined });
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
    this.dropTour();
    this.out = this.far();
    if (d.thing) { const t = THINGS.find((x) => x.id === d.thing); if (t) this.act(t.action, { bed: t.bed }); }
    else if (d.door) this.act('dungeons', { dungeon: d.door });
    else if (d.spot) this.app.sheets.open({ kind: 'picker', spot: d.spot });
    else if (d.mount) this.app.sheets.open({ kind: 'item', id: d.mount });
    else if (d.hero) { if (d.hero === this.app.p.active) this.act('gear'); else this.app.sheets.open({ kind: 'hero', hero: d.hero }); }
    else if (d.new !== undefined) {
      if (this.warband()) this.app.showCreate();
      else this.app.toasts.text('Your Warband opens later', warbandWhy(this.app.p));
    }
  }
  /** a tap on something ends the tour showing: it doesn't come back */
  private dropTour(): void {
    if (this.tourStep === null) return;
    this.closeTour();
    this.app.store.save();
    const h = activeHero(this.app.p);
    if (h) this.hud(h);
  }
  /** What a thing in the house, or a room's main thing, opens (the caller plays the click): the garden on `pick.bed`,
   *  the Dungeons on `pick.dungeon`, if there's one. `out`: it was opened from the whole house, so closing it goes back
   *  out there. */
  private act(a: HouseAction, pick: Pick = {}, out = this.far()): void {
    const app = this.app;
    this.out = out;
    switch (a) {
      case 'dungeons': app.sheets.open(pick.dungeon ? { kind: 'dungeon', dungeon: pick.dungeon } : { kind: 'dungeon' }); break;
      case 'garden': app.garden.open(pick.bed ?? bedToOpen(app.p)); break;
      // your gear, or your talents when they have points to spend and the gear has nothing new
      case 'gear': { const h = activeHero(app.p); if (h) app.sheets.open({ kind: 'gear', hero: h.id, ...(!waiting(app.p, h).length && unspent(app.p, h) ? { tab: 'talents' as const } : {}) }); break; }
      case 'logs': app.sheets.open({ kind: 'logs', tab: 'collection' }); break;
      case 'brew': app.showBrew(); break;
      case 'satchel': app.sheets.open({ kind: 'satchel' }); break;
      case 'heroes': app.sheets.open({ kind: 'heroes' }); break;
      case 'mounts': app.sheets.open({ kind: 'mounts' }); break;
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
    const hall = hallDoors(p, this.step?.thing);
    layer.push(...this.heroes(h, extra), ...this.mounts(extra), ...hall.layer);
    extra.bits.push(...hall.bits);
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
    if (t.action === 'gear') { const up = waiting(this.app.p, h).length || unspent(this.app.p, h); if (up) extra.pips.push(pip(t.x + 60, top + 20, String(up))); }
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
    this.tag.at = [x, me ? me.box[1] : y - 140 * k];
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
      const [bx, by] = BUNK_SLOTS[others.length], shut = !this.warband();
      out.push({ y: by, svg: `<g class="newhero${shut ? ' shut' : ''}${this.step?.thing === 'newhero' ? ' tour-hl' : ''}" data-new="1" data-x="${bx}" data-y="${by}" tabindex="0" role="button" aria-label="${shut ? 'Your Warband opens later' : `Make a new hero (${p.roster.length} of ${MAX_HEROES})`}">
        <rect x="${bx - 40}" y="${by - 176}" width="80" height="172" rx="34" class="ring"/>${shut ? padlock(bx, by - 92) : plus(bx, by - 92)}
        <text class="lbl small" x="${bx}" y="${FLOORS.upper + 26}">${shut ? 'Warband' : 'New hero'}</text>
        <rect class="hl" x="${bx - 48}" y="${by - 150}" width="96" height="160" rx="16"/></g>` });
    }
    return out;
  }

  /* ---------------------------------------------------------------- the buttons over the house */
  private hud(h: Hero): void {
    const p = this.app.p, role = roleOf(h);
    const cls = CLASSES[h.cls as ClassId], race = RACES[h.race as RaceId];
    const up = waiting(p, h).length, pts = unspent(p, h), lv = levelOf(p.xp);
    // the bars and the signs are only rebuilt when they change, so a save keeps the name tag bobbing and the focus where it was
    const top = this.draw(this.top, `
      <button type="button" class="h-tag" data-act="gear" style="--light: ${race?.light || '#F4B942'}" aria-label="${esc(h.name)}, Level ${lv}, Power ${ilvl(loadoutFor(p, h).score)}: gear${up ? `, ${up} new to put on` : ''}${pts ? `, ${pts} talent point${pts === 1 ? '' : 's'} to spend` : ''}">
        <i class="rdot ${role}" aria-hidden="true"></i><span><b>${esc(h.name)}</b><small><span class="long">${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · </span>Level ${lv} · Power ${ilvl(loadoutFor(p, h).score)}</small></span>
        ${up ? `<i class="badge" aria-hidden="true">${up}</i>` : pts ? `<i class="badge gold" aria-hidden="true">${pts}</i>` : ''}
      </button>
      <div class="right">
        <span class="chip dark" id="sync-chip" hidden></span>
        <button type="button" class="icon-btn" data-act="deco" aria-pressed="${this.decorating}" aria-label="Decorate" title="Decorate">${GLYPH.pen}</button>
        <button type="button" class="icon-btn" data-act="settings" aria-label="Settings" title="Settings">${GLYPH.gear}</button>
      </div>`);
    const step = this.step, tip = this.tip !== 'tour';
    const bottom = this.draw(this.bottom, step
      ? `<div class="h-tour" role="region" aria-label="${tip ? 'Tip' : 'Welcome tour'}">
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
        </div>`);
    const pinHtml = step ? `<button type="button" class="h-tour-pin" data-act="tourpin"><b>${esc(step.callout)}</b><i aria-hidden="true">▼</i></button>` : '';
    const signs = this.draw(this.signs, this.tag.html(h, race?.light || '#F4B942') + ROOMS.map((r) => `<button type="button" class="h-sign" data-act="room" data-room="${r.id}" tabindex="-1">${esc(r.name)}</button>`).join('') + pinHtml);
    if (top || bottom || signs) this.tag.measure();
    this.onView();
    this.syncState();
  }
}

/** Item level, shown as Power: the weighted gear score, where the weapon counts twice, as a whole number. */
export const ilvl = (score: number): string => String(wholeIlvl(score));
/** a padlock, for the bed your Warband will fill */
const padlock = (x: number, y: number): string => `<g class="padlock"><path d="M${x - 11} ${y - 4} V${y - 14} A11 11 0 0 1 ${x + 11} ${y - 14} V${y - 4}"/><rect x="${x - 17}" y="${y - 5}" width="34" height="26" rx="5"/></g>`;
const plus = (x: number, y: number): string => `<path class="plus" d="M${x - 10} ${y} H${x + 10} M${x} ${y - 10} V${y + 10}"/>`;
/** a little red count, like the one on a button, bobbing over what it counts */
const pip = (x: number, y: number, t: string): Bit => ({ box: [x - 27, y - 27, 54, 54], body: `<circle cx="${x}" cy="${y}" r="24" style="fill: #E04A3F; stroke: #1E1A1A; stroke-width: 4"/><text x="${x}" y="${y + 9}">${esc(t)}</text>`, cls: 'pip' });
/** what a tap on something in the house picks out for what it opens: a garden bed, a dungeon's door */
type Pick = { bed?: number; dungeon?: string };
/** where a spot sorts in the layer: pets by where they stand, the rest at the back */
const spotY = (s: HouseSpot): number => (s.kind === 'pet' ? s.y : -9999);
/** what you can tap in the house */
const TAPPABLE = '[data-thing], [data-door], [data-spot], [data-hero], [data-new], [data-mount]';
const f1 = (n: number): string => (Math.round(n * 10) / 10).toString();
/** the house, for the zoom-out button */
const HOUSE_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21 V9 L12 3 L20 9 V21 Z M4 13 H20 M4 17 H20 M12 13 V21" style="fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round"/></svg>';
