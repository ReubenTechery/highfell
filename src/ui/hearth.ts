/**
 * The Hearth: home. A tavern room you can drag around on a phone. Your pets sit by the fire and on
 * the rug, your mount waits in the stall, trophies go on the mantel and your banner hangs over the
 * fire. Tap a spot to change what is there, tap a hero for their gear, the door goes to the dungeon.
 */
import { COLLECTIBLES, DUNGEONS, GAME_NAME, TITLES } from '../content';
import { ROLES } from '../content/roles';
import type { RoleId } from '../content/types';
import { HEARTH_SPOTS, ownedOfKind } from '../meta/hearth';
import { points, maxPoints } from '../meta/achievements';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { placeSprite, tile } from './art';
import { SFX } from './sound';

/** the room is 1440 wide; the action band is y 0 to 900. Tall screens see the rafters and more floor. */
const W = 1440, H = 900, TOP = -420, BOTTOM = 1340;
/** where each spot sits in the room, and how its occupant is drawn */
const SPOT_AT: Record<string, { x: number; y: number; k?: number; anim?: string; w: number; h: number }> = {
  'pet.fire': { x: 500, y: 664, k: 1.35, anim: 'bob', w: 100, h: 130 },
  'pet.rug': { x: 772, y: 724, k: 1.35, anim: 'bob', w: 100, h: 130 },
  'mount.stall': { x: 1236, y: 714, k: 1.2, anim: 'breathe', w: 260, h: 190 },
  'mantel.1': { x: 570, y: 318, k: 1, w: 56, h: 80 },
  'mantel.2': { x: 650, y: 318, k: 1, w: 56, h: 80 },
  'mantel.3': { x: 790, y: 318, k: 1, w: 56, h: 80 },
  'mantel.4': { x: 870, y: 318, k: 1, w: 56, h: 80 },
  'banner.wall': { x: 720, y: 96, k: 1, anim: 'sway', w: 116, h: 140 },
};
const HERO_K = 1.3;
const HERO_AT: Record<RoleId, { x: number; y: number; flip?: boolean }> = {
  tank: { x: 584, y: 736 },
  healer: { x: 900, y: 748, flip: true },
  dps: { x: 1000, y: 704, flip: true },
};

export class Hearth {
  private pan = W / 2;
  private visW = W;
  private visH = H;
  private svg: SVGSVGElement | null = null;
  private drag: { id: number; x: number; pan0: number; moved: boolean } | null = null;
  private suppressClick = false;
  /** collectibles that just arrived: they pop in the first time you see them */
  fresh = new Set<string>();

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      dungeon: () => { SFX.play('ui'); app.sheets.open({ kind: 'dungeon' }); },
      gear: () => { SFX.play('ui'); app.sheets.open({ kind: 'gear', role: app.p.role }); },
      logs: () => { SFX.play('ui'); app.sheets.open({ kind: 'logs', tab: 'collection' }); },
      settings: () => { SFX.play('ui'); app.sheets.open({ kind: 'settings' }); },
      panl: () => this.panBy(-this.visW * 0.6),
      panr: () => this.panBy(this.visW * 0.6),
    });
  }

  render(): void {
    const p = this.app.p;
    const dg = DUNGEONS.barrow;
    const rec = p.dungeons.barrow;
    const got = dg.collection.filter((id) => p.collection[id]).length;
    this.root.innerHTML = `
      ${this.roomSvg()}
      <button type="button" class="pan-hint l" data-act="panl" aria-label="Look left">${GLYPH.left}</button>
      <button type="button" class="pan-hint r" data-act="panr" aria-label="Look right">${GLYPH.right}</button>
      <div class="h-top">
        <div class="wordmark">${esc(GAME_NAME)}<small>The Hearth</small></div>
        <div class="right">
          <span class="chip dark" id="sync-chip"></span>
          <button type="button" class="icon-btn" data-act="settings" aria-label="Settings">${GLYPH.gear}</button>
        </div>
      </div>
      <div class="h-bottom">
        <div class="h-stats">
          <span class="chip dark"><span class="ic">${tile('marks')}</span><b>${rec ? rec.marks : 0}</b> <span class="long">${esc(dg.marksName)}</span><span class="short">Marks</span></span>
          <span class="chip dark"><span class="long">Collection</span><span class="short">Log</span> <b>${got}/${dg.collection.length}</b></span>
          <span class="chip dark"><span class="long">Achievements</span><span class="short">Points</span> <b>${points(p)}</b><span class="long">/${maxPoints()}</span></span>
        </div>
        <div class="h-row">
          <button type="button" class="btn" data-act="gear">${GLYPH.shield}Gear</button>
          <button type="button" class="btn gold big" data-act="dungeon">Into the Barrow</button>
          <button type="button" class="btn" data-act="logs">${GLYPH.book}Logs</button>
        </div>
      </div>`;
    this.svg = this.root.querySelector('svg.room');
    this.bindRoom();
    this.layout();
    this.syncState();
    if (this.fresh.size) setTimeout(() => this.fresh.clear(), 1200);
  }

  /** the save chip: where your progress lives right now */
  syncState(): void {
    const el = this.root.querySelector('#sync-chip');
    if (!el) return;
    const st = this.app.store.state;
    const [g, t, short] = st === 'account' ? [GLYPH.cloud, 'Saved to your account', 'Account'] : st === 'connecting' ? [GLYPH.cloud, 'Connecting…', '…'] : st === 'offline' ? [GLYPH.device, 'Saved on this device (offline)', 'Offline'] : [GLYPH.device, 'Saved on this device', 'This device'];
    el.innerHTML = `<span class="ic" style="color: #E9DDCB">${g}</span><span class="long">${t}</span><span class="short">${short}</span>`;
    el.setAttribute('title', t);
  }

  /** fit the room to the screen: full height, as much width as fits, drag for the rest */
  layout(): void {
    if (!this.svg) return;
    const r = this.root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const aspect = r.width / r.height;
    // wide screens: full height, as much width as fits. Tall screens: a fixed width, and the extra height shows rafters and floor.
    this.visW = aspect >= 1 ? Math.min(W, H * aspect) : Math.min(W, Math.max(660, H * aspect));
    this.visH = this.visW / aspect;
    this.setPan(this.pan === W / 2 ? W / 2 : this.pan);
  }
  private setPan(center: number): void {
    const half = this.visW / 2;
    this.pan = Math.min(W - half, Math.max(half, center));
    // keep the action band clear of the buttons: centred a little low, but never above the rafters or below the floor we drew
    const y0 = Math.max(TOP, Math.min(BOTTOM - this.visH, 540 - this.visH / 2));
    if (this.svg) this.svg.setAttribute('viewBox', `${(this.pan - half).toFixed(1)} ${(this.visH > H ? y0 : 0).toFixed(1)} ${this.visW.toFixed(1)} ${(this.visH > H ? this.visH : H).toFixed(1)}`);
    const canPan = this.visW < W - 1;
    const l = this.root.querySelector<HTMLElement>('.pan-hint.l'), rr = this.root.querySelector<HTMLElement>('.pan-hint.r');
    if (l) l.hidden = !canPan || this.pan <= half + 4;
    if (rr) rr.hidden = !canPan || this.pan >= W - half - 4;
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
      else if (hero) this.app.sheets.open({ kind: 'gear', role: hero as RoleId });
      else if (go === 'dungeon') this.app.sheets.open({ kind: 'dungeon' });
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

  private roomSvg(): string {
    const p = this.app.p;
    const o: string[] = [];
    o.push(`<defs>
      <radialGradient id="fireglow" cx="720" cy="560" r="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FF9A4C" stop-opacity="0.34"/><stop offset="0.5" stop-color="#FF8A4C" stop-opacity="0.12"/><stop offset="1" stop-color="#FF8A4C" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="720" cy="470" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.55" stop-color="#0E0A12" stop-opacity="0"/><stop offset="1" stop-color="#0E0A12" stop-opacity="0.7"/></radialGradient>
      <radialGradient id="torchglow"><stop offset="0" stop-color="#FF9A4C" stop-opacity="0.32"/><stop offset="1" stop-color="#FF9A4C" stop-opacity="0"/></radialGradient>
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
    o.push(placeSprite('woodpile', 986, 616));
    o.push(placeSprite('rug', 740, 712));
    o.push(placeSprite('barrel', 1418, 676));
    o.push(placeSprite('stool', 214, 750) + placeSprite('table', 314, 766) + placeSprite('stool', 414, 754));
    // the spots, sorted so lower things draw in front
    const spots = HEARTH_SPOTS.map((s) => ({ s, at: SPOT_AT[s.id] })).filter((x) => x.at).sort((a, b) => a.at.y - b.at.y);
    const heroes = (Object.keys(HERO_AT) as RoleId[]).map((r) => ({ r, at: HERO_AT[r] }));
    const layer: { y: number; svg: string }[] = [];
    for (const { s, at } of spots) {
      const id = p.hearth.spots[s.id];
      const def = id ? COLLECTIBLES[id] : null;
      const owns = ownedOfKind(p, s.kind).length > 0;
      const cls = def ? 'has' : owns ? 'empty' : 'none';
      const label = def ? `${s.label}: ${def.name}` : `${s.label}: empty`;
      let body = '';
      if (def && def.sprite) {
        const anim = this.fresh.has(id!) ? 'new-pop' : at.anim || '';
        body = s.kind === 'banner' ? placeSprite(def.sprite, at.x, at.y, { cls: anim }) : placeSprite(def.sprite, at.x, at.y, { k: at.k, cls: anim, flip: s.id === 'pet.rug' });
        if (s.kind === 'pet' || s.kind === 'mount') body = `<ellipse cx="${at.x}" cy="${at.y}" rx="${at.w * 0.42}" ry="${at.w * 0.12}" style="fill: rgba(18, 12, 28, 0.35)"/>` + body;
      } else if (s.kind === 'banner') {
        body = placeSprite('banner_rod', at.x, at.y) + `<rect class="mark" x="${at.x - 40}" y="${at.y + 12}" width="80" height="112" rx="10"/>` + plus(at.x, at.y + 68);
      } else if (s.kind === 'trophy') {
        body = `<rect class="mark" x="${at.x - 24}" y="${at.y - 54}" width="48" height="52" rx="10"/>` + plus(at.x, at.y - 28);
      } else {
        body = `<ellipse class="mark" cx="${at.x}" cy="${at.y - 4}" rx="${at.w * 0.45}" ry="${at.w * 0.16}"/>` + plus(at.x, at.y - 40);
      }
      const top = s.kind === 'banner' ? at.y : at.y - at.h;
      const hit = `<rect class="hl" x="${at.x - at.w / 2}" y="${top}" width="${at.w}" height="${at.h}" rx="14" style="fill: transparent"/>`;
      layer.push({ y: s.kind === 'trophy' || s.kind === 'banner' ? 0 : at.y, svg: `<g class="spot ${cls}" data-spot="${s.id}" data-x="${at.x}" tabindex="0" role="button" aria-label="${esc(label)}">${body}${hit}</g>` });
    }
    for (const { r, at } of heroes) {
      const R = ROLES[r];
      const me = p.role === r;
      const ring = me ? `<ellipse cx="${at.x}" cy="${at.y + 2}" rx="44" ry="15" style="fill: none; stroke: #F2C230; stroke-width: 4"/>` : '';
      layer.push({ y: at.y, svg: `<g class="hero" data-hero="${r}" data-x="${at.x}" tabindex="0" role="button" aria-label="${esc(R.name)}, ${esc(R.title)}: gear">
        <ellipse cx="${at.x}" cy="${at.y}" rx="38" ry="12" style="fill: rgba(18, 12, 28, 0.4)"/>${ring}
        ${placeSprite(R.sprite + '_f', at.x, at.y, { k: HERO_K, cls: 'breathe', flip: at.flip })}
        <rect class="hl" x="${at.x - 52}" y="${at.y - 172}" width="104" height="182" rx="14" style="fill: transparent"/>
        <text class="lbl small" x="${at.x}" y="${at.y + 34}">${esc(R.name)}${p.title && r === p.role ? ' ' + esc(TITLES[p.title]?.text || '') : ''}</text></g>` });
    }
    layer.sort((a, b) => a.y - b.y);
    for (const l of layer) o.push(l.svg);
    // light: the fire's glow and the dark corners
    o.push(`<rect class="glow" x="-20" y="${TOP}" width="${W + 40}" height="${BOTTOM - TOP}" style="fill: url(#fireglow); pointer-events: none"/>`);
    o.push(`<rect x="-20" y="${TOP}" width="${W + 40}" height="${BOTTOM - TOP}" style="fill: url(#vig); pointer-events: none"/>`);
    return `<svg class="room" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="The Hearth">${o.join('')}</svg>`;
  }
}

const plus = (x: number, y: number): string => `<path class="plus" d="M${x - 9} ${y} H${x + 9} M${x} ${y - 9} V${y + 9}"/>`;
