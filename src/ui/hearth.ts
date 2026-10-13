/**
 * The Hearth: home. A tavern room you can drag around on a phone, with the hero you are playing
 * standing big by the fire. Your pets sit by the fire and on the rug, your mount waits in the stall,
 * trophies go on the mantel and your banner hangs over the fire. Tap a spot to change what is there,
 * tap your hero for their gear, the door goes to the dungeon and the cauldron brews. Your other
 * heroes wait at the camp; Ride out takes you into the Vale.
 */
import { COLLECTIBLES, DUNGEONS, GAME_NAME, TITLES } from '../content';
import { CLASSES, RACES, type ClassId, type RaceId } from '../content/folk';
import { ROLES } from '../content/roles';
import { HEARTH_SPOTS, ownedOfKind } from '../meta/hearth';
import { loadoutFor, waiting } from '../meta/gear';
import { activeHero, roleOf, type Hero } from '../meta/profile';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { heroSprite, placeSprite, tile } from './art';
import { SFX } from './sound';
import { RECIPES } from '../content/vale';
import { logTotal } from './sheets';

/** the room is 1440 wide; the action band is y 0 to 900. Tall screens see the rafters and more floor. */
const W = 1440, H = 900, TOP = -420, BOTTOM = 1340;
type Mode = 'wide' | 'tall';
interface At { x: number; y: number; k?: number; anim?: string; w: number; h: number }
/** where each spot sits in the room, and how its occupant is drawn */
const SPOT_AT: Record<string, At> = {
  'pet.fire': { x: 880, y: 662, k: 1.35, anim: 'bob', w: 100, h: 130 },
  'pet.rug': { x: 800, y: 748, k: 1.35, anim: 'bob', w: 100, h: 130 },
  'mount.stall': { x: 1236, y: 714, k: 1.2, anim: 'breathe', w: 260, h: 190 },
  'mantel.1': { x: 570, y: 318, k: 1, w: 56, h: 80 },
  'mantel.2': { x: 650, y: 318, k: 1, w: 56, h: 80 },
  'mantel.3': { x: 790, y: 318, k: 1, w: 56, h: 80 },
  'mantel.4': { x: 870, y: 318, k: 1, w: 56, h: 80 },
  'banner.wall': { x: 720, y: 96, k: 1, anim: 'sway', w: 116, h: 140 },
};
/** On a tall screen your hero steps closer to the camera and the pet on the rug sits at their feet. */
const TALL_AT: Record<string, Partial<At>> = { 'pet.rug': { x: 812, y: 904, k: 1.5 }, 'pet.fire': { x: 866, y: 664 } };
const HERO_AT: Record<Mode, { x: number; y: number; k: number; pan: number }> = {
  wide: { x: 560, y: 704, k: 2.5, pan: W / 2 },
  tall: { x: 610, y: 868, k: 3.3, pan: 598 },
};

export class Hearth {
  private pan = -1;
  private visW = W;
  private visH = H;
  private mode: Mode = 'wide';
  private svg: SVGSVGElement | null = null;
  private drag: { id: number; x: number; pan0: number; moved: boolean } | null = null;
  private suppressClick = false;
  /** collectibles that just arrived: they pop in the first time you see them */
  fresh = new Set<string>();

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      dungeon: () => { SFX.play('ui'); app.sheets.open({ kind: 'dungeon' }); },
      gear: () => { SFX.play('ui'); const h = activeHero(app.p); if (h) app.sheets.open({ kind: 'gear', hero: h.id }); },
      heroes: () => { SFX.play('ui'); app.showCamp(); },
      ride: () => { SFX.play('ui'); void app.showVale(); },
      satchel: () => { SFX.play('ui'); app.sheets.open({ kind: 'satchel' }); },
      logs: () => { SFX.play('ui'); app.sheets.open({ kind: 'logs', tab: 'collection' }); },
      settings: () => { SFX.play('ui'); app.sheets.open({ kind: 'settings' }); },
      panl: () => this.panBy(-this.visW * 0.6),
      panr: () => this.panBy(this.visW * 0.6),
    });
  }

  render(): void {
    const p = this.app.p;
    const h = activeHero(p);
    if (!h) { this.root.innerHTML = ''; return; }
    const dg = DUNGEONS.barrow;
    const rec = p.dungeons.barrow;
    const log = logTotal(p);
    const unseen = Object.keys(p.collection).filter((id) => !p.seen[id]).length;
    // new gear never goes on by itself: the Gear button counts what is waiting
    const up = waiting(p, h).length;
    this.measure();
    this.root.innerHTML = `
      ${this.roomSvg(h)}
      <button type="button" class="pan-hint l" data-act="panl" aria-label="Look left">${GLYPH.left}</button>
      <button type="button" class="pan-hint r" data-act="panr" aria-label="Look right">${GLYPH.right}</button>
      <div class="h-top">
        <div class="wordmark">${esc(GAME_NAME)}<small>The Hearth</small></div>
        <div class="right">
          <span class="chip dark" title="${esc(dg.marksName)}"><span class="ic">${tile('marks')}</span><b>${rec ? rec.marks : 0}</b><span class="long">${esc(dg.marksName)}</span></span>
          <span class="chip dark" id="sync-chip"></span>
          <button type="button" class="btn small dark" data-act="logs" aria-label="Logs: collection ${log.got} of ${log.total}">${GLYPH.book}<span class="long">Logs</span><b>${log.got}/${log.total}</b>${unseen ? `<i class="dot" aria-hidden="true"></i>` : ''}</button>
          <button type="button" class="icon-btn" data-act="satchel" aria-label="Satchel">${GLYPH.bag}</button>
          <button type="button" class="icon-btn" data-act="settings" aria-label="Settings">${GLYPH.gear}</button>
        </div>
      </div>
      ${this.plate(h)}
      <div class="h-bottom">
        <div class="h-row">
          <button type="button" class="btn side" data-act="heroes" aria-label="Heroes">${GLYPH.people}<span class="bl">Heroes</span></button>
          <button type="button" class="btn ride" data-act="ride">${GLYPH.sign}Ride out</button>
          <button type="button" class="btn gold big" data-act="dungeon"><span><span class="long">Into the </span>Barrow</span></button>
          <button type="button" class="btn side${up ? ' has-up' : ''}" data-act="gear" aria-label="Gear${up ? `: ${up} new to put on` : ''}">${GLYPH.shield}<span class="bl">Gear</span>${up ? `<i class="badge" aria-hidden="true">${up}</i>` : ''}</button>
        </div>
      </div>`;
    this.svg = this.root.querySelector('svg.room');
    this.bindRoom();
    this.layout();
    this.syncState();
    if (this.fresh.size) setTimeout(() => this.fresh.clear(), 1200);
  }

  /** your hero's name, title, race, class and seat, under their feet */
  private plate(h: Hero): string {
    const p = this.app.p, role = roleOf(h);
    const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
    const L = loadoutFor(p, h);
    const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
    return `<button type="button" class="h-plate" data-act="gear" style="--light: ${race?.light || '#F4B942'}" aria-label="${esc(h.name)}: gear">
      ${title ? `<span class="hp-t">${esc(title)}</span>` : ''}<span class="hp-n">${esc(h.name)}</span>
      <span class="hp-s"><i class="rdot ${role}" aria-hidden="true"></i>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · ${esc(cls?.roleName || ROLES[role].title)} · Item level ${ilvl(L.score)}</span>
    </button>`;
  }

  /** the save chip: where your progress lives right now */
  syncState(): void {
    const el = this.root.querySelector('#sync-chip');
    if (!el) return;
    const st = this.app.store.state;
    const [g, t, short] = st === 'account' ? [GLYPH.cloud, 'Saved to your account', ''] : st === 'connecting' ? [GLYPH.cloud, 'Connecting…', '…'] : st === 'offline' ? [GLYPH.device, 'Saved on this device (offline)', 'Offline'] : [GLYPH.device, 'Saved on this device', ''];
    el.innerHTML = `<span class="ic" style="color: #E9DDCB">${g}</span><span class="long">${t}</span>${short ? `<span class="short">${short}</span>` : ''}`;
    el.setAttribute('title', t);
    el.setAttribute('aria-label', t);
  }

  private measure(): boolean {
    const r = this.root.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const aspect = r.width / r.height;
    const mode: Mode = aspect < 0.85 ? 'tall' : 'wide';
    const changed = mode !== this.mode;
    this.mode = mode;
    // wide screens: full height, as much width as fits. Tall screens: a fixed width, and the extra height shows rafters and floor.
    this.visW = aspect >= 1 ? Math.min(W, H * aspect) : Math.min(W, Math.max(660, H * aspect));
    this.visH = this.visW / aspect;
    return changed;
  }
  /** fit the room to the screen: full height, as much width as fits, drag for the rest */
  layout(): void {
    if (!this.svg) return;
    if (this.measure()) { this.pan = -1; this.render(); return; }
    this.setPan(this.pan < 0 ? HERO_AT[this.mode].pan : this.pan);
  }
  private setPan(center: number): void {
    const half = this.visW / 2;
    this.pan = Math.min(W - half, Math.max(half, center));
    let y0 = 0, vh = H;
    if (this.mode === 'tall' || this.visH < H - 1) {
      // tall screens, and wide short ones like a phone on its side: frame the room so your hero's
      // feet sit just above their name plate
      vh = this.visH;
      const rh = this.root.clientHeight || 1;
      const plateEl = this.root.querySelector<HTMLElement>('.h-plate');
      const feetAt = Math.min(0.9, Math.max(0.5, ((plateEl ? plateEl.offsetTop : rh * 0.8) - 4) / rh));
      y0 = Math.max(TOP, Math.min(BOTTOM - vh, HERO_AT[this.mode].y - feetAt * vh));
    }
    if (this.svg) this.svg.setAttribute('viewBox', `${(this.pan - half).toFixed(1)} ${y0.toFixed(1)} ${this.visW.toFixed(1)} ${vh.toFixed(1)}`);
    const canPan = this.visW < W - 1;
    const l = this.root.querySelector<HTMLElement>('.pan-hint.l'), rr = this.root.querySelector<HTMLElement>('.pan-hint.r');
    if (l) l.hidden = !canPan || this.pan <= half + 4;
    if (rr) rr.hidden = !canPan || this.pan >= W - half - 4;
    // the plate follows your hero across the room
    const plate = this.root.querySelector<HTMLElement>('.h-plate');
    if (plate) {
      const rw = this.root.clientWidth;
      const x = ((HERO_AT[this.mode].x + 20 - (this.pan - half)) / this.visW) * rw;
      const pw = plate.offsetWidth;
      plate.style.left = Math.round(Math.max(8 + pw / 2, Math.min(rw - 8 - pw / 2, x))) + 'px';
      plate.classList.toggle('away', x < -40 || x > rw + 40);
    }
  }
  private panBy(dx: number): void { SFX.play('ui'); this.setPan(this.pan + dx); }

  private bindRoom(): void {
    const svg = this.svg!;
    svg.addEventListener('pointerdown', (e) => {
      this.drag = { id: e.pointerId, x: e.clientX, pan0: this.pan, moved: false };
    });
    svg.addEventListener('pointermove', (e) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 8) { d.moved = true; svg.classList.add('drag'); try { svg.setPointerCapture(e.pointerId); } catch { /* fine */ } }
      if (d.moved) this.setPan(d.pan0 - dx * (this.visW / svg.getBoundingClientRect().width));
    });
    const end = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      this.drag = null; svg.classList.remove('drag');
      if (d.moved) { this.suppressClick = true; setTimeout(() => { this.suppressClick = false; }, 50); }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    const activate = (el: Element) => {
      const spot = el.getAttribute('data-spot'), hero = el.getAttribute('data-hero'), go = el.getAttribute('data-go');
      SFX.play('ui');
      if (spot) this.app.sheets.open({ kind: 'picker', spot });
      else if (hero) this.app.sheets.open({ kind: 'gear', hero });
      else if (go === 'dungeon') this.app.sheets.open({ kind: 'dungeon' });
      else if (go === 'brew') this.app.showBrew();
    };
    svg.addEventListener('click', (e) => {
      if (this.suppressClick) return;
      const el = (e.target as Element).closest('[data-spot], [data-hero], [data-go]');
      if (el) activate(el);
    });
    svg.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = (e.target as Element).closest('[data-spot], [data-hero], [data-go]');
      if (el) { e.preventDefault(); activate(el); }
    });
    svg.addEventListener('focusin', (e) => {
      const el = (e.target as Element).closest<SVGGElement>('[data-x]');
      if (el) { const x = +el.dataset.x!; const half = this.visW / 2; if (x < this.pan - half + 60 || x > this.pan + half - 60) this.setPan(x); }
    });
  }

  private roomSvg(h: Hero): string {
    const p = this.app.p;
    const mode = this.mode;
    const at = (id: string): At => ({ ...SPOT_AT[id], ...(mode === 'tall' ? TALL_AT[id] : {}) });
    const o: string[] = [];
    const race = RACES[h.race as RaceId];
    o.push(`<defs>
      <radialGradient id="fireglow" cx="720" cy="560" r="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FF9A4C" stop-opacity="0.34"/><stop offset="0.5" stop-color="#FF8A4C" stop-opacity="0.12"/><stop offset="1" stop-color="#FF8A4C" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="720" cy="470" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.55" stop-color="#0E0A12" stop-opacity="0"/><stop offset="1" stop-color="#0E0A12" stop-opacity="0.7"/></radialGradient>
      <radialGradient id="torchglow"><stop offset="0" stop-color="#FF9A4C" stop-opacity="0.32"/><stop offset="1" stop-color="#FF9A4C" stop-opacity="0"/></radialGradient>
      <radialGradient id="herolight"><stop offset="0" stop-color="${race?.light || '#F4B942'}" stop-opacity="0.38"/><stop offset="0.6" stop-color="${race?.light || '#F4B942'}" stop-opacity="0.12"/><stop offset="1" stop-color="${race?.light || '#F4B942'}" stop-opacity="0"/></radialGradient>
      <linearGradient id="floorfade" x1="0" y1="560" x2="0" y2="1000" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
    </defs>`);
    // rafters above, for tall screens
    o.push(`<rect x="-20" y="${TOP}" width="${W + 40}" height="${-TOP}" style="fill: #2A1E28"/>`);
    for (let y = TOP + 60; y < 0; y += 120) o.push(`<rect x="-20" y="${y}" width="${W + 40}" height="34" style="fill: #3A2618; stroke: #1E1A1A; stroke-width: 3"/>`);
    for (let x = 0; x <= W; x += 360) o.push(`<rect x="${x - 15}" y="${TOP}" width="30" height="${-TOP}" style="fill: #3A2618; stroke: #1E1A1A; stroke-width: 3"/>`);
    o.push(`<path d="M520 ${TOP + 150} C580 ${TOP + 230} 660 ${TOP + 250} 720 ${TOP + 250} C780 ${TOP + 250} 860 ${TOP + 230} 920 ${TOP + 150}" style="fill: none; stroke: #4E9A4A; stroke-width: 10; stroke-linecap: round"/>`);
    for (const [x, c] of [[560, '#C8403F'], [620, '#E7B53C'], [680, '#4F86C6'], [760, '#C8403F'], [820, '#E7B53C'], [880, '#4F86C6']] as [number, string][]) {
      const yy = TOP + 150 + 100 * Math.sin(((x - 520) / 400) * Math.PI);
      o.push(`<path d="M${x - 14} ${yy} L${x} ${yy + 34} L${x + 14} ${yy} Z" style="fill: ${c}; stroke: #1E1A1A; stroke-width: 3; stroke-linejoin: round"/>`);
    }
    // wall: plaster between timber posts, a ceiling beam, wood panels low down
    o.push(`<rect x="-20" y="0" width="${W + 40}" height="560" style="fill: #3B2C3A"/>`);
    for (let x = 0; x < W; x += 360) o.push(`<rect x="${x + 22}" y="40" width="316" height="396" rx="6" style="fill: #46354A"/>`);
    for (let x = 0; x <= W; x += 360) o.push(`<rect x="${x - 13}" y="0" width="26" height="560" style="fill: #4A3020; stroke: #1E1A1A; stroke-width: 3"/>`);
    o.push(`<rect x="-20" y="0" width="${W + 40}" height="40" style="fill: #4A3020; stroke: #1E1A1A; stroke-width: 3"/>`);
    o.push(`<rect x="-20" y="436" width="${W + 40}" height="124" style="fill: #5A3A2A; stroke: #1E1A1A; stroke-width: 3"/>`);
    for (let x = 20; x < W; x += 46) o.push(`<path d="M${x} 446 V556" style="fill: none; stroke: #4A2E20; stroke-width: 3"/>`);
    o.push(`<rect x="-20" y="430" width="${W + 40}" height="14" style="fill: #6B4528; stroke: #1E1A1A; stroke-width: 3"/>`);
    // the chimney carries on up into the rafters
    o.push(`<rect x="570" y="${TOP}" width="300" height="${-TOP + 10}" style="fill: #7A6E86; stroke: #1E1A1A; stroke-width: 4"/>`);
    for (let y = TOP + 20; y < 0; y += 40) o.push(`<path d="M570 ${y} H870" style="fill: none; stroke: #665A72; stroke-width: 3"/>`);
    // floor boards
    o.push(`<rect x="-20" y="560" width="${W + 40}" height="${BOTTOM - 560}" style="fill: #6E4A2E"/>`);
    let row = 0;
    for (let y = 560; y < BOTTOM; y += 44, row++) {
      o.push(`<path d="M-20 ${y} H${W + 20}" style="fill: none; stroke: #573821; stroke-width: 3"/>`);
      for (let x = (row % 2) * 110 - 40; x < W; x += 220) o.push(`<path d="M${x} ${y} V${y + 44}" style="fill: none; stroke: #573821; stroke-width: 3"/>`);
    }
    o.push(`<rect x="-20" y="560" width="${W + 40}" height="${BOTTOM - 560}" style="fill: url(#floorfade)"/>`);
    o.push(`<path d="M-20 560 H${W + 20}" style="fill: none; stroke: #1E1A1A; stroke-width: 4"/>`);
    // furniture and the walls' bits
    o.push(placeSprite('window', 300, 418));
    o.push(`<g data-go="dungeon" data-x="104" tabindex="0" role="button" aria-label="The door to the Barrow" style="cursor: pointer">${placeSprite('door', 104, 600)}<text class="lbl small" x="104" y="628">To the Barrow</text></g>`);
    o.push(placeSprite('shelf', 1000, 330));
    for (const x of [480, 960]) o.push(`<circle cx="${x}" cy="378" r="90" style="fill: url(#torchglow)"/>` + placeSprite('torch', x, 418));
    o.push(placeSprite('stall', 1236, 600));
    o.push(placeSprite('fireplace', 720, 600));
    o.push(placeSprite('logs', 720, 594));
    o.push(placeSprite('fire_a', 720, 588, { cls: 'fire-a' }) + placeSprite('fire_b', 720, 588, { cls: 'fire-b' }));
    o.push(placeSprite('woodpile', 1010, 616));
    // the cauldron, for brewing what you gather in the Vale
    const drink = p.vale.drink && RECIPES[p.vale.drink] && (p.vale.shelf[p.vale.drink] || 0) > 0 ? RECIPES[p.vale.drink].color : '#9BE15D';
    o.push(`<g data-go="brew" data-x="1004" tabindex="0" role="button" aria-label="The cauldron: brew" style="cursor: pointer"><ellipse cx="1004" cy="812" rx="70" ry="13" style="fill: rgba(18, 12, 28, 0.4)"/>${placeSprite('cauldron', 1004, 812, { k: 0.86 })}
      <ellipse cx="1004" cy="728" rx="50" ry="9" style="fill: ${drink}; opacity: 0.6"/><g class="steam">${[984, 1004, 1024].map((x, i) => `<path class="st" style="animation-delay: ${i * 0.6}s" d="M${x} 716 C${x - 10} 700 ${x + 10} 690 ${x} 672"/>`).join('')}</g>
      <text class="lbl small" x="1004" y="842">Cauldron</text></g>`);
    o.push(placeSprite('rug', 690, 730));
    o.push(placeSprite('barrel', 1418, 676));
    o.push(placeSprite('stool', 214, 750) + placeSprite('table', 314, 766) + placeSprite('stool', 414, 754));
    // the spots, sorted so lower things draw in front
    const layer: { y: number; svg: string }[] = [];
    for (const s of HEARTH_SPOTS) {
      if (!SPOT_AT[s.id]) continue;
      const a = at(s.id);
      const id = p.hearth.spots[s.id];
      const def = id ? COLLECTIBLES[id] : null;
      const owns = ownedOfKind(p, s.kind).length > 0;
      const cls = def ? 'has' : owns ? 'empty' : 'none';
      const label = def ? `${s.label}: ${def.name}` : `${s.label}: empty`;
      let body = '';
      if (def && def.sprite) {
        const anim = this.fresh.has(id!) ? 'new-pop' : a.anim || '';
        body = s.kind === 'banner' ? placeSprite(def.sprite, a.x, a.y, { cls: anim }) : placeSprite(def.sprite, a.x, a.y, { k: a.k, cls: anim, flip: s.id === 'pet.rug' });
        if (s.kind === 'pet' || s.kind === 'mount') body = `<ellipse cx="${a.x}" cy="${a.y}" rx="${a.w * 0.42}" ry="${a.w * 0.12}" style="fill: rgba(18, 12, 28, 0.35)"/>` + body;
      } else if (s.kind === 'banner') {
        body = placeSprite('banner_rod', a.x, a.y) + `<rect class="mark" x="${a.x - 40}" y="${a.y + 12}" width="80" height="112" rx="10"/>` + plus(a.x, a.y + 68);
      } else if (s.kind === 'trophy') {
        body = `<rect class="mark" x="${a.x - 24}" y="${a.y - 54}" width="48" height="52" rx="10"/>` + plus(a.x, a.y - 28);
      } else {
        body = `<ellipse class="mark" cx="${a.x}" cy="${a.y - 4}" rx="${a.w * 0.45}" ry="${a.w * 0.16}"/>` + plus(a.x, a.y - 40);
      }
      const top = s.kind === 'banner' ? a.y : a.y - a.h;
      const hit = `<rect class="hl" x="${a.x - a.w / 2}" y="${top}" width="${a.w}" height="${a.h}" rx="14" style="fill: transparent"/>`;
      layer.push({ y: s.kind === 'trophy' || s.kind === 'banner' ? 0 : a.y, svg: `<g class="spot ${cls}" data-spot="${s.id}" data-x="${a.x}" tabindex="0" role="button" aria-label="${esc(label)}">${body}${hit}</g>` });
    }
    // your hero, big, by the fire, in their hometown's light
    const ha = HERO_AT[mode], role = roleOf(h);
    const spr = heroSprite(h, role) + '_f';
    const k = ha.k;
    layer.push({ y: ha.y, svg: `<g class="hero me" data-hero="${esc(h.id)}" data-x="${ha.x}" tabindex="0" role="button" aria-label="${esc(h.name)}: gear">
      <circle cx="${ha.x}" cy="${ha.y - 150 * k * 0.45}" r="${120 * k}" style="fill: url(#herolight)"/>
      <ellipse cx="${ha.x}" cy="${ha.y}" rx="${34 * k}" ry="${10 * k}" style="fill: rgba(18, 12, 28, 0.45)"/>
      ${placeSprite(spr, ha.x, ha.y, { k, cls: 'breathe' })}
      <rect class="hl" x="${ha.x - 46 * k}" y="${ha.y - 140 * k}" width="${92 * k}" height="${146 * k}" rx="20" style="fill: transparent"/></g>` });
    layer.sort((a, b) => a.y - b.y);
    for (const l of layer) o.push(l.svg);
    // light: the fire's glow and the dark corners
    o.push(`<rect class="glow" x="-20" y="${TOP}" width="${W + 40}" height="${BOTTOM - TOP}" style="fill: url(#fireglow); pointer-events: none"/>`);
    o.push(`<rect x="-20" y="${TOP}" width="${W + 40}" height="${BOTTOM - TOP}" style="fill: url(#vig); pointer-events: none"/>`);
    return `<svg class="room" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="The Hearth">${o.join('')}</svg>`;
  }
}

/** Item level: the weighted gear score, where the weapon counts twice. */
export const ilvl = (score: number): string => (Math.round(score * 10) / 10).toString();
const plus = (x: number, y: number): string => `<path class="plus" d="M${x - 9} ${y} H${x + 9} M${x} ${y - 9} V${y + 9}"/>`;
