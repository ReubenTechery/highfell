/**
 * The Vale: riding out. A map of the valley, the ride itself, and the places you ride to. A place is
 * one screen: gathering spots you tap for a close-up, a villager with an errand a day, and your hero
 * on their mount. What you get goes into the save the moment you get it.
 */
import { ACHIEVEMENTS, COLLECTIBLES } from '../content';
import { INGREDIENTS, PLACES, SKILLS, VALE_MAP } from '../content/vale';
import type { ErrandDef, NodeDef } from '../content/types';
import { Achiever } from '../meta/achievements';
import { activeHero, roleOf } from '../meta/profile';
import {
  beginHarvest, completeErrand, dayOf, endHarvest, ensureStarter, errandAt, errandShort, ingredientName, placeState,
  rankProgress, readyAt, rideMount, skillRank, type ErrandDone, type Harvest, type HarvestEnd, type RankUp, type ValeDrop,
} from '../meta/vale';
import type { App } from './app';
import { actions, esc, fmtN, fmtRate, GLYPH, reducedMotion, wait } from './dom';
import { heroSprite, iconOf, nameOf, placeSprite, riderSvg, spriteURL, tile } from './art';
import { SFX } from './sound';
import { playToy, type ToyResult } from './toys';
import { BW_AT, BW_HIDE, bramblewickScenery, mapScenery, P, PLACE_H, PLACE_W, rideStrips, shooSpots, SKY_STOPS, type Lay } from './valeart';

type Mode = 'map' | 'ride' | 'place';
interface Job { kind: 'find' | 'shoo'; errand: ErrandDef; spot: number; left: boolean[] }
type Card =
  | { kind: 'talk'; errand: ErrandDef | null }
  | { kind: 'harvest'; h: Harvest; end: HarvestEnd; res: ToyResult; unlocked: string[] }
  | { kind: 'errand'; done: ErrandDone; unlocked: string[] };

const NODE_SPRITE: Record<string, [string, string]> = { moonpetal: ['node_moonpetal', 'node_moonpetal_shim'], glowcap: ['node_glowcap', 'node_glowcap'], bramble: ['node_bramble', 'node_bramble'] };
const FIND_SPRITE: Record<string, [string, number]> = { kettle: ['kettle_walk', 0.85], goggles: ['goggles', 1.15] };
const THING_WORD: Record<string, string> = { kettle: 'the walking kettle', goggles: 'Dottle’s goggles', crow: 'crows', spark: 'sparks' };
/** where your rider stands on the map, by place */
const TOKEN_AT: Record<string, [number, number]> = { highfell: [592, 628], bramblewick: [352, 790], barrow: [676, 800] };

export class Vale {
  mode: Mode = 'map';
  private where = 'highfell';
  private sel = 'bramblewick';
  private placeId = 'bramblewick';
  private lay: Lay = 'wide';
  private busy = false;
  private job: Job | null = null;
  private card: Card | null = null;
  private rideStop: (() => void) | null = null;
  private momentDone: (() => void) | null = null;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      home: () => { SFX.play('ui'); app.showHearth(); },
      map: () => { if (this.busy) return; SFX.play('ui'); this.where = this.placeId; this.sel = this.placeId; this.job = null; this.card = null; this.showMap(); },
      pick: (el) => this.pick(el.dataset.id!),
      go: () => { void this.go(); },
      satchel: () => { SFX.play('ui'); app.sheets.open({ kind: 'satchel' }); },
      skip: () => this.rideStop?.(),
      ridehome: () => { void this.rideHome(); },
      close: () => { SFX.play('ui'); this.closeCard(); },
      again: (el) => { this.closeCard(); void this.harvest(el.dataset.id!); },
      start: () => this.startJob(),
      hand: () => { void this.finishErrand(); },
      stop: () => { SFX.play('ui'); this.job = null; this.renderDyn(); this.banner(); },
      moment: () => this.momentDone?.(),
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.card) { e.preventDefault(); this.closeCard(); }
      if (e.key === 'Escape' && this.mode === 'ride') this.rideStop?.();
    });
  }

  /* ---------------------------------------------------------------- coming and going */
  /** Ride out from the hearth: the map, with your first mount if this is your first time. */
  async enter(): Promise<void> {
    const p = this.app.p;
    this.where = 'highfell';
    this.sel = 'bramblewick';
    this.job = null; this.card = null; this.busy = false;
    this.showMap();
    if (ensureStarter(p)) {
      this.app.hearth.fresh.add('mount.goat');
      this.app.store.save();
      SFX.play('bleat');
      await this.moment('mount.goat', 'Your first mount', 'Everyone who rides out gets a hill goat. It waits in the stall at home.');
      this.update();
    }
  }
  private showMap(): void {
    this.mode = 'map';
    this.render();
  }
  private pick(id: string): void {
    if (this.sel === id) { void this.go(); return; }
    this.sel = id;
    SFX.play('ui');
    this.update();
  }
  /** the button on the map card: ride somewhere, go in the dungeon, or go home */
  private async go(): Promise<void> {
    if (this.busy) return;
    const mp = VALE_MAP.find((m) => m.id === this.sel);
    if (!mp) return;
    SFX.play('ui');
    if (mp.kind === 'home') { if (this.where === 'highfell') this.app.showHearth(); else await this.rideHome(); return; }
    if (mp.kind === 'dungeon') { this.app.sheets.open({ kind: 'dungeon' }); return; }
    if (mp.kind !== 'place' || !PLACES[mp.id]) { SFX.play('nope'); return; }
    this.app.p.vale.rides++;
    this.app.store.save();
    await this.ride(mp.name, false);
    this.placeId = mp.id;
    this.where = mp.id;
    this.mode = 'place';
    this.render();
  }
  private async rideHome(): Promise<void> {
    if (this.busy) return;
    this.job = null; this.card = null;
    await this.ride('Highfell', true);
    this.where = 'highfell';
    this.app.showHearth();
  }

  /* ---------------------------------------------------------------- drawing */
  render(): void {
    this.lay = this.measureLay();
    if (this.mode === 'map') this.renderMap();
    else if (this.mode === 'place') this.renderPlace();
  }
  /** a light redraw after the save changes: counts, badges, the open card */
  update(): void {
    if (this.mode === 'map') { this.renderMapDyn(); return; }
    if (this.mode === 'place') { this.renderDyn(); this.renderTop(); if (this.card) this.renderCard(); }
  }
  layout(): void {
    if (this.mode === 'map') { const svg = this.root.querySelector('svg.vl-map'); if (svg) svg.setAttribute('viewBox', this.mapBox()); return; }
    if (this.mode === 'place' && !this.busy && this.measureLay() !== this.lay) this.render();
  }
  private measureLay(): Lay {
    const r = this.root.getBoundingClientRect();
    return r.width > 0 && r.width / Math.max(1, r.height) < 0.85 ? 'tall' : 'wide';
  }

  /* ---------------------------------------------------------------- the map */
  /** fit everything you can tap (x 110 to 890, y 150 to 860) between the top bar and the card */
  private mapBox(): string {
    const r = this.root.getBoundingClientRect();
    const W = r.width || 390, H = r.height || 844;
    const card = this.root.querySelector<HTMLElement>('#vl-mapcard');
    const top = 64, bottom = (card?.offsetHeight || (W < 640 ? 200 : 160)) + 20;
    const availH = Math.max(200, H - top - bottom);
    const s = Math.min(W / 780, availH / 710, 1.3);
    const vw = W / s, vh = H / s;
    return `${(500 - vw / 2).toFixed(1)} ${(505 - (top + availH / 2) / s).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
  }
  private renderMap(): void {
    this.root.className = 'scene vale m-map';
    this.root.innerHTML = `
      <svg class="vl-map" viewBox="${this.mapBox()}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="The Vale">${mapScenery()}<g class="vl-dyn"></g></svg>
      <div class="vl-top">
        <button type="button" class="btn small" data-act="home">${GLYPH.home}<span class="long">Hearth</span></button>
        <div class="vl-title"><h2>The Vale</h2><p>Ride out between dungeons</p></div>
        <button type="button" class="btn small" data-act="satchel" aria-label="Satchel">${GLYPH.bag}<span class="long">Satchel</span></button>
      </div>
      <div class="vl-mapcard" id="vl-mapcard"></div>`;
    const svg = this.root.querySelector<SVGSVGElement>('svg.vl-map')!;
    svg.addEventListener('click', (e) => { const el = (e.target as Element).closest('[data-place]'); if (el) this.pick(el.getAttribute('data-place')!); });
    svg.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const el = (e.target as Element).closest('[data-place]'); if (el) { e.preventDefault(); this.pick(el.getAttribute('data-place')!); } });
    this.renderMapDyn();
  }
  private renderMapDyn(): void {
    const p = this.app.p, h = activeHero(p);
    const dyn = this.root.querySelector('svg.vl-map .vl-dyn');
    if (!dyn) return;
    const o: string[] = [];
    for (const m of VALE_MAP) {
      const on = m.id === this.sel;
      const ly = m.id === 'highfell' ? m.y + 82 : m.id === 'bramblewick' ? m.y + 86 : m.id === 'barrow' ? m.y + 72 : m.y + 70;
      let badge = '';
      if (m.kind === 'place' && PLACES[m.id]) {
        const ready = PLACES[m.id].nodes.reduce((s, n) => s + readyAt(p, m.id, n.id), 0);
        const job = !!errandAt(p, m.id);
        badge = `<g class="mp-badge" transform="translate(${m.x} ${m.y - 118})">${ready ? `<rect x="-66" y="-20" width="132" height="34" rx="17"/><text x="0" y="4">${ready} to gather</text>` : ''}${job ? `<g transform="translate(${ready ? 74 : 0} -4)"><g class="bang"><circle r="19"/><text y="9">!</text></g></g>` : ''}</g>`;
      }
      o.push(`<g class="mp ${m.kind} ${on ? 'on' : ''}" data-place="${m.id}" tabindex="0" role="button" aria-label="${esc(m.name)}${m.kind === 'soon' ? ', coming later' : ''}">
        <circle class="mp-ring" cx="${m.x}" cy="${m.y - 10}" r="104"/>
        <circle class="hit" cx="${m.x}" cy="${m.y - 10}" r="112"/>
        <g class="vl-plate ${m.kind}" transform="translate(${m.x} ${ly})"><rect x="${-plateW(m.name) / 2}" y="0" width="${plateW(m.name)}" height="40" rx="14"/><text class="t" x="0" y="28">${esc(m.name)}</text></g>
        ${m.kind === 'soon' ? `<g class="soon-tag" transform="translate(${m.x + plateW(m.name) / 2 - 8} ${ly - 6})"><rect x="-30" y="-14" width="60" height="26" rx="9"/><text y="5">Soon</text></g>` : ''}
        ${badge}</g>`);
    }
    // you, on your mount, wherever you are
    if (h) {
      const [tx, ty] = TOKEN_AT[this.where] || TOKEN_AT.highfell;
      o.push(`<g class="mp-me">${riderSvg(heroSprite(h, roleOf(h)), rideMount(p), tx, ty, { k: 0.4, cls: 'bob' })}</g>`);
    }
    dyn.innerHTML = o.join('');
    const card = this.root.querySelector('#vl-mapcard');
    if (card) card.innerHTML = this.mapCard();
    this.root.querySelector('svg.vl-map')?.setAttribute('viewBox', this.mapBox());
  }
  private mapCard(): string {
    const p = this.app.p;
    const m = VALE_MAP.find((x) => x.id === this.sel) || VALE_MAP[0];
    let sub = '', act = '';
    if (m.kind === 'place' && PLACES[m.id]) {
      const pl = PLACES[m.id];
      const ready = pl.nodes.reduce((s, n) => s + readyAt(p, m.id, n.id), 0);
      const e = errandAt(p, m.id);
      sub = `${ready ? `${ready} to gather` : 'Everything regrows tomorrow'}${e ? ` · ${pl.villager.name.split(' ')[0]} has a job for you` : ''}`;
      act = `<button type="button" class="btn gold big" data-act="go">${GLYPH.sign}Ride to ${esc(m.name.split(' ')[0])}</button>`;
    } else if (m.kind === 'dungeon') {
      sub = 'Dungeon · bots take the other seats';
      act = `<button type="button" class="btn gold big" data-act="go">${GLYPH.door}Into the Barrow</button>`;
    } else if (m.kind === 'home') {
      sub = 'Home';
      act = `<button type="button" class="btn big" data-act="go">${GLYPH.home}${this.where === 'highfell' ? 'Back to the hearth' : 'Ride home'}</button>`;
    } else {
      sub = 'Coming later';
      act = `<span class="chip">Not open yet</span>`;
    }
    return `<div class="mc"><div class="mc-tx"><b>${esc(m.name)}</b><span>${esc(sub)}</span><p>${esc(m.blurb)}</p></div><div class="mc-act">${act}</div></div>`;
  }

  /* ---------------------------------------------------------------- the ride */
  /** your hero on their mount, the Vale going past. Tap to skip. */
  private ride(to: string, back: boolean): Promise<void> {
    const p = this.app.p, h = activeHero(p);
    this.mode = 'ride';
    this.busy = true;
    const st = rideStrips();
    const strip = (s: string) => `${s}<g transform="translate(${st.w} 0)">${s}</g>`;
    const rx = back ? 700 : 500;
    this.root.className = 'scene vale m-ride';
    this.root.innerHTML = `
      <svg class="vl-ride" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs><linearGradient id="rdsky" x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">${SKY_STOPS}</linearGradient>
          <radialGradient id="rdsun"><stop offset="0" stop-color="#FFF1C4" stop-opacity="0.85"/><stop offset="1" stop-color="#FFD48A" stop-opacity="0"/></radialGradient></defs>
        <rect x="-200" y="-400" width="1600" height="1200" style="fill: url(#rdsky)"/>
        <circle cx="${back ? 260 : 940}" cy="360" r="190" style="fill: url(#rdsun)"/><circle cx="${back ? 260 : 940}" cy="360" r="58" style="fill: #FFE7A8; stroke: #1E1A1A; stroke-width: 4"/>
        <g class="far">${strip(st.far)}</g><g class="mid">${strip(st.mid)}</g><g class="near">${strip(st.near)}</g>
        <g class="dust"></g>
        <g class="rider-run" transform="translate(${rx} 632)">${h ? riderSvg(heroSprite(h, roleOf(h)), rideMount(p), 0, 0, { k: 1.25, flip: back }) : ''}</g>
      </svg>
      <button type="button" class="vl-ride-tx" data-act="skip"><b>${back ? 'Riding home' : `Riding to ${esc(to)}`}</b><span>Tap to skip</span></button>`;
    const svg = this.root.querySelector<SVGSVGElement>('svg.vl-ride')!;
    const layers = (['far', 'mid', 'near'] as const).map((n) => svg.querySelector('.' + n) as SVGGElement);
    const speed = [40, 150, 560];
    const rider = svg.querySelector('.rider-run') as SVGGElement;
    const dust = svg.querySelector('.dust') as SVGGElement;
    const dir = back ? 1 : -1;
    const dur = reducedMotion() ? 0.6 : 2.6;
    SFX.play(rideMount(p) === 'mount.goat' ? 'bleat' : 'hoof', 0.8);
    return new Promise((resolve) => {
      let t = 0, last = performance.now(), hoof = 0, puff = 0, raf = 0, done = false;
      const end = () => { if (done) return; done = true; cancelAnimationFrame(raf); this.rideStop = null; this.busy = false; resolve(); };
      this.rideStop = end;
      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        layers.forEach((g, i) => { const x = ((dir * t * speed[i]) % st.w + (dir < 0 ? 0 : -st.w)); g.setAttribute('transform', `translate(${x.toFixed(1)} 0)`); });
        const bob = Math.abs(Math.sin(t * Math.PI * 4.2)) * 10;
        rider.setAttribute('transform', `translate(${rx} ${(632 - bob).toFixed(1)}) rotate(${(Math.sin(t * Math.PI * 4.2) * 1.6).toFixed(2)})`);
        if ((hoof -= dt) <= 0) { hoof = 0.24; SFX.play('hoof', 0.5); }
        if ((puff -= dt) <= 0 && !reducedMotion()) {
          puff = 0.12;
          const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', String(rx + (back ? 70 : -70))); c.setAttribute('cy', '628'); c.setAttribute('r', String(8 + Math.random() * 8));
          c.setAttribute('class', 'puff'); c.setAttribute('style', `--dx: ${(dir * 90).toFixed(0)}px`);
          dust.appendChild(c); setTimeout(() => c.remove(), 600);
        }
        if (t >= dur) { end(); return; }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
  }

  /* ---------------------------------------------------------------- a place */
  private renderPlace(): void {
    const pl = PLACES[this.placeId];
    const W = PLACE_W[this.lay], H = PLACE_H[this.lay];
    this.root.className = `scene vale m-place l-${this.lay}`;
    this.root.innerHTML = `
      <svg class="vl-place" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${this.lay === 'wide' ? 'xMidYMax' : 'xMidYMid'} slice" role="group" aria-label="${esc(pl.name)}">
        ${bramblewickScenery(this.lay)}${this.flies(W, H)}<g class="vl-dyn"></g><g class="vl-fx"></g></svg>
      <div class="vl-top" id="vl-top"></div>
      <div class="vl-banner" id="vl-banner" hidden></div>
      <div class="vl-bottom"><p class="vl-hint" id="vl-hint"></p><button type="button" class="btn" data-act="ridehome">${GLYPH.sign}Ride home</button></div>
      <div class="vl-cardwrap" id="vl-card" hidden></div>`;
    const svg = this.root.querySelector<SVGSVGElement>('svg.vl-place')!;
    svg.addEventListener('click', (e) => this.tapScene(e.target as Element));
    svg.addEventListener('pointerdown', (e) => { const el = (e.target as Element).closest('[data-shoo]'); if (el) { e.preventDefault(); this.shoo(+el.getAttribute('data-shoo')!); } });
    svg.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); const sh = (e.target as Element).closest('[data-shoo]'); if (sh) this.shoo(+sh.getAttribute('data-shoo')!); else this.tapScene(e.target as Element); });
    this.renderTop();
    this.renderDyn();
    this.banner();
    if (this.card) this.renderCard();
  }
  private flies(W: number, H: number): string {
    let s = '<g class="flies" aria-hidden="true">', seed = 3;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 16; i++) s += `<circle class="fly" cx="${(r() * W).toFixed(0)}" cy="${(H * 0.55 + r() * H * 0.4).toFixed(0)}" r="${(3 + r() * 2.5).toFixed(1)}" style="animation-delay: ${(-r() * 6).toFixed(2)}s; animation-duration: ${(4 + r() * 4).toFixed(2)}s"/>`;
    return s + '</g>';
  }
  private renderTop(): void {
    const el = this.root.querySelector('#vl-top');
    if (!el) return;
    const p = this.app.p, pl = PLACES[this.placeId];
    const items = Object.values(p.vale.satchel).reduce((a, b) => a + b, 0);
    el.innerHTML = `<button type="button" class="btn small" data-act="map">${GLYPH.map}<span class="long">Map</span></button>
      <div class="vl-title"><h2>${esc(pl.name)}</h2><p>Gathering ${skillRank(p, 'gather')} · Brewing ${skillRank(p, 'brew')}</p></div>
      <button type="button" class="btn small" data-act="satchel" aria-label="Satchel, ${items} things">${GLYPH.bag}<b>${fmtN(items)}</b></button>`;
    const hint = this.root.querySelector('#vl-hint');
    if (hint) {
      const ready = pl.nodes.reduce((s, n) => s + readyAt(p, this.placeId, n.id), 0);
      const e = errandAt(p, this.placeId);
      hint.textContent = this.job ? '' : ready ? `Tap a plant to gather.${e ? ` ${pl.villager.name.split(' ')[0]} has a job for you.` : ''}` : e ? `All picked for today. ${pl.villager.name.split(' ')[0]} has a job for you.` : 'All done for today. It regrows overnight.';
    }
  }
  /** everything in the place that changes: the plants and their counts, the villager, your rider, an errand's bits */
  private renderDyn(): void {
    const dyn = this.root.querySelector('svg.vl-place .vl-dyn');
    if (!dyn) return;
    const p = this.app.p, pl = PLACES[this.placeId], A = BW_AT[this.lay];
    const st = placeState(p, this.placeId);
    const layer: { y: number; svg: string }[] = [];
    const plates: string[] = [];
    for (const n of pl.nodes) {
      const at = A[n.id], ns = st.nodes[n.id], k = at.k || 1;
      const ready = ns?.n || 0, shim = !!ns?.shimmer && ready > 0;
      const spr = NODE_SPRITE[n.id]?.[shim ? 1 : 0] || 'node_moonpetal';
      const w = 150 * k, hh = 110 * k;
      const glints = shim ? [[-0.42, -0.62], [0.4, -0.85], [0.12, -1.1], [-0.2, -0.95]].map(([dx, dy], i) => `<path class="glint" style="animation-delay: ${i * 0.35}s" d="M${(at.x + dx * w).toFixed(0)} ${(at.y + dy * hh - 12).toFixed(0)} l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 l8 -4 Z"/>`).join('') : '';
      const sub = ready ? `${shim ? 'Shimmering · ' : ''}${ready} ready` : 'Regrows tomorrow';
      layer.push({ y: at.y, svg: `<g class="node ${ready ? '' : 'empty'} ${shim ? 'shim' : ''}" data-node="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}: ${esc(sub)}">
        <ellipse cx="${at.x}" cy="${at.y}" rx="${(w * 0.48).toFixed(0)}" ry="${(w * 0.13).toFixed(0)}" style="fill: rgba(20, 30, 14, 0.3)"/>
        ${placeSprite(spr, at.x, at.y, { k, cls: ready ? 'spr sway' : 'spr' })}${glints}
        <rect class="hl" x="${(at.x - w * 0.55).toFixed(0)}" y="${(at.y - hh).toFixed(0)}" width="${(w * 1.1).toFixed(0)}" height="${(hh + 20).toFixed(0)}" rx="18"/></g>` });
      plates.push(plate(at.x, at.y + 16, n.name, sub, ready ? (shim ? 'shim' : 'ready') : 'empty'));
    }
    // the villager, with a ! when there's a job
    const d = A.dottle, dk = d.k || 1, e = errandAt(p, this.placeId);
    const vName = pl.villager.name.split(' ')[0];
    layer.push({ y: d.y, svg: `<g class="npc" data-npc="1" tabindex="0" role="button" aria-label="${esc(pl.villager.name)}, ${esc(pl.villager.title)}${e ? ': has a job for you' : ''}">
      <ellipse cx="${d.x}" cy="${d.y}" rx="${36 * dk}" ry="${9 * dk}" style="fill: rgba(20, 30, 14, 0.35)"/>
      ${placeSprite('npc_gnome', d.x, d.y, { k: dk, cls: 'npc-idle' })}
      ${e && !this.job ? `<g transform="translate(${(d.x + 30 * dk).toFixed(0)} ${(d.y - 132 * dk).toFixed(0)})"><g class="bang"><circle r="21"/><text y="10">!</text></g></g>` : ''}
      <rect class="hl" x="${d.x - 50 * dk}" y="${d.y - 122 * dk}" width="${100 * dk}" height="${134 * dk}" rx="18"/></g>` });
    plates.push(plate(d.x, d.y + 14, vName, pl.villager.title, 'npc'));
    // you, on your mount
    const h = activeHero(p);
    if (h) {
      const ra = A.rider;
      layer.push({ y: ra.y, svg: `<g class="me" data-mount="1"><ellipse cx="${ra.x}" cy="${ra.y}" rx="${86 * (ra.k || 1)}" ry="${12 * (ra.k || 1)}" style="fill: rgba(20, 30, 14, 0.35)"/>${riderSvg(heroSprite(h, roleOf(h)), rideMount(p), ra.x, ra.y, { k: ra.k, cls: 'idle-ride' })}</g>` });
    }
    // an errand under way: something hidden, or things to shoo
    const j = this.job;
    if (j && j.kind === 'find') {
      const spot = BW_HIDE[this.lay][j.spot % BW_HIDE[this.lay].length];
      const [spr, k] = FIND_SPRITE[j.errand.thing || 'kettle'] || FIND_SPRITE.kettle;
      const tuft = P(`M${spot.x - 40} ${spot.y + 4} C${spot.x - 36} ${spot.y - 22} ${spot.x - 30} ${spot.y - 30} ${spot.x - 22} ${spot.y - 16} C${spot.x - 18} ${spot.y - 40} ${spot.x - 8} ${spot.y - 44} ${spot.x - 2} ${spot.y - 18} C${spot.x + 6} ${spot.y - 42} ${spot.x + 18} ${spot.y - 38} ${spot.x + 20} ${spot.y - 14} C${spot.x + 28} ${spot.y - 30} ${spot.x + 40} ${spot.y - 22} ${spot.x + 42} ${spot.y + 4} Z`, '#5E9A45', 3.5);
      layer.push({ y: spot.y + 1, svg: `<g class="lost" data-find="1" tabindex="0" role="button" aria-label="Something in the grass">${placeSprite(spr, spot.x + 6, spot.y - 4, { k, cls: 'wiggle' })}${tuft}<circle class="hit" cx="${spot.x}" cy="${spot.y - 20}" r="54"/></g>` });
    }
    if (j && j.kind === 'shoo') {
      const spots = shooSpots(this.lay, j.errand.thing || 'crow');
      spots.forEach((s, i) => {
        if (!j.left[i]) return;
        const crow = j.errand.thing !== 'spark';
        layer.push({ y: s.y + 0.5, svg: `<g class="shoo ${crow ? 'crow' : 'spark'}" data-shoo="${i}" tabindex="0" role="button" aria-label="${crow ? 'A crow' : 'A spark'}">${placeSprite(crow ? 'crow' : 'spark', s.x, s.y, { k: crow ? 1.05 : 1.3, flip: crow && i % 2 === 1, cls: crow ? 'peck' : 'flicker' })}<circle class="hit" cx="${s.x}" cy="${s.y - 22}" r="44"/></g>` });
      });
    }
    layer.sort((a, b) => a.y - b.y);
    dyn.innerHTML = layer.map((l) => l.svg).join('') + `<g class="plates">${plates.join('')}</g>`;
  }
  private tapScene(target: Element): void {
    if (this.busy || this.card) return;
    const node = target.closest('[data-node]'), npc = target.closest('[data-npc]'), lost = target.closest('[data-find]'), mount = target.closest('[data-mount]');
    if (lost) { void this.found(); return; }
    if (this.job && (node || npc)) { SFX.play('nope'); this.flashBanner(); return; }
    if (node) { void this.harvest(node.getAttribute('data-node')!); return; }
    if (npc) { this.talk(); return; }
    if (mount) { SFX.play(rideMount(this.app.p) === 'mount.goat' ? 'bleat' : 'hoof'); const g = mount.querySelector('.idle-ride'); g?.classList.remove('hop'); void (g as SVGGElement | null)?.getBoundingClientRect(); g?.classList.add('hop'); }
  }

  /* ---------------------------------------------------------------- gathering */
  private async harvest(nodeId: string): Promise<void> {
    if (this.busy) return;
    const app = this.app, p = app.p, dev = app.dev;
    const pl = PLACES[this.placeId], node: NodeDef | undefined = pl?.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (readyAt(p, this.placeId, nodeId) <= 0 && !dev.valeFree) { SFX.play('nope'); app.toasts.text(`${node.name}: all picked`, 'It regrows overnight. Up to three days save up.'); return; }
    const h = beginHarvest(p, this.placeId, nodeId, Math.random, Date.now(), { free: dev.valeFree, luck: dev.valeLuck ? 50 : 1 });
    if (!h) return;
    app.store.save();
    this.busy = true;
    this.root.classList.add('away');
    const pet = h.drops.find((d) => COLLECTIBLES[d.id]?.kind === 'pet')?.id || null;
    const res = await playToy(this.root, { node, shimmer: h.shimmer, pet });
    const end = endHarvest(p, h, res.perfects);
    const ach = this.achiever();
    const unlocked = [...ach.check(), ...h.drops.filter((d) => d.isNew).flatMap((d) => ach.collected(d.id))];
    for (const d of h.drops) if (d.isNew && COLLECTIBLES[d.id]) app.hearth.fresh.add(d.id);
    app.store.save();
    this.root.classList.remove('away');
    this.renderDyn(); this.renderTop();
    for (const d of h.drops) if (d.isNew && ['pet', 'mount'].includes(COLLECTIBLES[d.id]?.kind)) await this.moment(d.id, `${fmtRate(d.rate)} · harvest ${fmtN(h.kc)}`, COLLECTIBLES[d.id].kind === 'pet' ? 'It followed you home. It’s by the fire.' : 'It’s waiting in the stall at home.');
    this.busy = false;
    this.card = { kind: 'harvest', h, end, res, unlocked };
    this.renderCard();
    this.afterGain(end.rankUp, unlocked);
  }
  private achiever(): Achiever {
    const p = this.app.p, h = activeHero(p);
    return new Achiever(p, { dungeon: this.placeId, role: h ? roleOf(h) : 'tank', practice: false, testGear: false });
  }
  private afterGain(rankUp: RankUp | null, unlocked: string[]): void {
    if (rankUp) {
      const sk = SKILLS[rankUp.skill];
      const note = rankUp.skill === 'gather' && [4, 7, 10].includes(rankUp.rank) ? 'Every harvest gives one more' : rankUp.skill === 'brew' && rankUp.rank === 2 ? 'You can brew Glowcap Draught' : rankUp.skill === 'brew' && rankUp.rank === 3 ? 'You can brew Starlight Elixir' : '';
      this.app.toasts.rank(sk?.name || rankUp.skill, rankUp.rank, rankUp.skill === 'brew' ? 's_brew' : 's_gather', note);
    }
    for (const id of unlocked) this.app.toasts.achievement(id);
  }

  /* ---------------------------------------------------------------- errands */
  private talk(): void {
    const e = errandAt(this.app.p, this.placeId);
    SFX.play(e ? 'page' : 'ui');
    this.card = { kind: 'talk', errand: e };
    this.renderCard();
  }
  private startJob(): void {
    const c = this.card;
    if (!c || c.kind !== 'talk' || !c.errand) return;
    const e = c.errand;
    this.card = null;
    this.closeCard();
    SFX.play('ui');
    if (e.kind === 'deliver') { void this.finishErrand(); return; }
    const st = placeState(this.app.p, this.placeId);
    this.job = { kind: e.kind === 'find' ? 'find' : 'shoo', errand: e, spot: (st.errands.next + dayOf(Date.now())) % 6, left: new Array(e.target || 6).fill(true) };
    if (e.kind === 'shoo') SFX.play(e.thing === 'spark' ? 'sizzle' : 'caw');
    this.renderDyn();
    this.renderTop();
    this.banner();
  }
  private banner(): void {
    const el = this.root.querySelector<HTMLElement>('#vl-banner');
    if (!el) return;
    const j = this.job;
    if (!j) { el.hidden = true; return; }
    const total = j.left.length, gone = j.left.filter((x) => !x).length;
    const thing = j.errand.thing || '';
    el.hidden = false;
    el.innerHTML = `<span>${j.kind === 'find' ? `Find ${esc(THING_WORD[thing] || 'it')}` : `${thing === 'spark' ? 'Stamp out the sparks' : 'Shoo the crows'}: <b>${gone} of ${total}</b>`}</span><button type="button" class="btn small" data-act="stop">Stop</button>`;
  }
  private flashBanner(): void { const el = this.root.querySelector('#vl-banner'); el?.classList.remove('nudge'); void (el as HTMLElement | null)?.offsetWidth; el?.classList.add('nudge'); }
  private shoo(i: number): void {
    const j = this.job;
    if (!j || j.kind !== 'shoo' || !j.left[i] || this.busy) return;
    j.left[i] = false;
    const crow = j.errand.thing !== 'spark';
    const s = shooSpots(this.lay, j.errand.thing || 'crow')[i];
    const fx = this.root.querySelector('svg.vl-place .vl-fx');
    if (fx) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', crow ? 'flyoff' : 'stamp');
      g.setAttribute('style', `--dx: ${i % 2 ? -260 : 260}px`);
      g.innerHTML = crow ? placeSprite('crow', s.x, s.y, { k: 1.05, flip: i % 2 === 1 }) : `<circle cx="${s.x}" cy="${s.y - 16}" r="26" style="fill: #E9DDCB; stroke: #1E1A1A; stroke-width: 3; opacity: 0.9"/>`;
      fx.appendChild(g);
      setTimeout(() => g.remove(), 800);
    }
    SFX.play(crow ? 'flap' : 'sizzle');
    if (crow && Math.random() < 0.5) setTimeout(() => SFX.play('caw', 0.6), 120);
    this.renderDyn();
    this.banner();
    if (j.left.every((x) => !x)) { this.busy = true; setTimeout(() => { this.busy = false; void this.finishErrand(); }, 500); }
  }
  private async found(): Promise<void> {
    const j = this.job;
    if (!j || j.kind !== 'find' || this.busy) return;
    this.busy = true;
    SFX.play('perfect', 0.7);
    const el = this.root.querySelector('svg.vl-place [data-find] .wiggle');
    el?.classList.add('caught');
    await wait(reducedMotion() ? 100 : 650);
    this.busy = false;
    await this.finishErrand();
  }
  private async finishErrand(): Promise<void> {
    const app = this.app, p = app.p;
    const done = completeErrand(p, this.placeId, Math.random, Date.now(), { luck: app.dev.valeLuck ? 50 : 1 });
    this.job = null;
    this.banner();
    if (!done) { SFX.play('nope'); this.renderDyn(); return; }
    const ach = this.achiever();
    const unlocked = [...ach.check(), ...done.drops.filter((d) => d.isNew).flatMap((d) => ach.collected(d.id))];
    for (const d of done.drops) if (d.isNew && COLLECTIBLES[d.id]) app.hearth.fresh.add(d.id);
    app.store.save();
    SFX.play('ach', 0.8);
    this.renderDyn(); this.renderTop();
    const kc = p.counters[`vale.${this.placeId}.errands`] || 0;
    for (const d of done.drops) if (d.isNew && ['pet', 'mount'].includes(COLLECTIBLES[d.id]?.kind)) await this.moment(d.id, `${fmtRate(d.rate)} · errand ${fmtN(kc)}`, COLLECTIBLES[d.id].kind === 'pet' ? 'It followed you home. It’s by the fire.' : 'A thank-you from Dottle. It’s waiting in the stall at home.');
    this.card = { kind: 'errand', done, unlocked };
    this.renderCard();
    this.afterGain(done.rankUp, unlocked);
  }

  /* ---------------------------------------------------------------- cards */
  private closeCard(): void {
    this.card = null;
    const el = this.root.querySelector<HTMLElement>('#vl-card');
    if (el) { el.hidden = true; el.innerHTML = ''; }
    this.renderDyn();
  }
  private renderCard(): void {
    const el = this.root.querySelector<HTMLElement>('#vl-card');
    const c = this.card;
    if (!el || !c) return;
    const p = this.app.p, pl = PLACES[this.placeId];
    let body = '';
    if (c.kind === 'talk') {
      const e = c.errand;
      const who = `<div class="vc-who"><span class="tile" aria-hidden="true">${tile('c_gnome')}</span><div><b>${esc(pl.villager.name)}</b><span>${esc(pl.villager.title)}</span></div></div>`;
      if (!e) {
        body = `${who}<p class="vc-say">“That’s everything for today. Thank you! Come back tomorrow, something is bound to have gone wrong by then.”</p>
          <p class="fine">A new job every day. Up to three save up.</p><div class="vc-act"><button type="button" class="btn gold" data-act="close">See you</button></div>`;
      } else {
        const short = errandShort(p, e);
        const needs = e.needs ? `<div class="vc-needs">${Object.entries(e.needs).map(([k, n]) => { const have = p.vale.satchel[k] || 0; return `<span class="need ${have >= n ? 'ok' : ''}"><span class="tile" aria-hidden="true">${tile(INGREDIENTS[k]?.icon || '')}</span>${esc(ingredientName(k))} <b>${Math.min(have, n)}/${n}</b></span>`; }).join('')}</div>` : '';
        const go = e.kind === 'deliver'
          ? (short ? `<button type="button" class="btn" disabled>Need ${Object.entries(short).map(([k, n]) => `${n} more ${ingredientName(k)}`).join(', ')}</button>` : `<button type="button" class="btn gold" data-act="start">Hand them over</button>`)
          : `<button type="button" class="btn gold" data-act="start">${e.kind === 'find' ? 'I’ll have a look' : 'On it'}</button>`;
        body = `${who}<h3 class="vc-title">${esc(e.title)}</h3><p class="vc-say">“${esc(e.ask)}”</p>${needs}
          ${short ? '<p class="fine">Gather some first. The plants are right here.</p>' : ''}
          <div class="vc-act">${go}<button type="button" class="btn" data-act="close">Later</button></div>`;
      }
    } else if (c.kind === 'harvest') {
      const ing = INGREDIENTS[c.h.node.gives];
      const pr = rankProgress(p.vale.xp.gather || 0);
      const left = readyAt(p, this.placeId, c.h.node.id);
      const pips = [0, 1, 2].map((i) => `<i class="${i < c.res.perfects ? 'perfect' : i < c.res.perfects + c.res.goods ? 'good' : 'rough'}"></i>`).join('');
      body = `<div class="vc-gain"><span class="tile" aria-hidden="true">${tile(ing?.icon || '')}</span><div><b>+${c.end.gained} ${esc(ing?.name || '')}</b><span>${c.end.perfects ? `${c.end.perfects} Perfect${c.end.perfects > 1 ? 's' : ''}, +${c.end.perfects} for steady hands` : 'No Perfects this time'}</span></div><span class="toy-pips" aria-hidden="true">${pips}</span></div>
        ${c.h.dew ? `<div class="vc-line"><span class="tile" aria-hidden="true">${tile('g_dew')}</span><span>+${c.h.dew} Starlight Dew <em>it was shimmering</em></span></div>` : ''}
        ${this.dropsHtml(c.h.drops, `harvest ${fmtN(c.h.kc)}`)}
        ${xpRow('Gathering', 's_gather', pr, c.end.xp)}
        ${achHtml(c.unlocked)}
        <div class="vc-act">${left > 0 || this.app.dev.valeFree ? `<button type="button" class="btn gold" data-act="again" data-id="${c.h.node.id}">${esc(c.h.node.verb)} again<small>${this.app.dev.valeFree ? 'free' : `${left} left`}</small></button>` : ''}<button type="button" class="btn ${left > 0 ? '' : 'gold'}" data-act="close">Done</button></div>`;
    } else {
      const d = c.done;
      const pr = rankProgress(p.vale.xp.gather || 0);
      const n = pl.lore.length, have = p.vale.lore.filter((id) => pl.lore.some((l) => l.id === id)).length;
      body = `<div class="vc-who"><span class="tile" aria-hidden="true">${tile('c_gnome')}</span><div><b>${esc(d.errand.title)}</b><span>Done</span></div></div>
        <p class="vc-say">“${esc(d.errand.thanks)}”</p>
        ${d.page ? `<div class="vc-page"><small>A page of the hollow’s story · ${have} of ${n}</small><b>${esc(d.page.title)}</b><p>${esc(d.page.text)}</p></div>` : `<p class="fine">You have every page of Bramblewick’s story.</p>`}
        ${this.dropsHtml(d.drops, `errand ${fmtN(p.counters[`vale.${this.placeId}.errands`] || 0)}`)}
        ${xpRow('Gathering', 's_gather', pr, d.xp)}
        ${achHtml(c.unlocked)}
        <div class="vc-act"><button type="button" class="btn gold" data-act="close">Done</button></div>`;
    }
    el.hidden = false;
    el.innerHTML = `<section class="vc ${c.kind}" role="dialog" aria-label="${c.kind === 'talk' ? esc(pl.villager.name) : 'What you got'}"><button type="button" class="icon-btn vc-x" data-act="close" aria-label="Close">${GLYPH.close}</button>${body}</section>`;
    (el.querySelector('.vc-act .btn:not([disabled])') as HTMLElement | null)?.focus({ preventScroll: true });
  }
  private dropsHtml(drops: ValeDrop[], kc: string): string {
    if (!drops.length) return '';
    return drops.map((d) => {
      const c = COLLECTIBLES[d.id];
      const pet = c?.kind === 'pet';
      const note = d.dupe ? (pet ? 'You have a funny feeling you’d have been followed. +2 Starlight Dew' : 'Duplicate: +2 Starlight Dew') : c?.kind === 'pet' ? 'Waiting by the fire at home' : c?.kind === 'mount' ? 'In the stall at home' : c?.kind === 'banner' ? 'Hanging over the fire at home' : 'On the mantel at home';
      return `<div class="vc-drop ${d.dupe ? 'dupe' : 'new'}"><span class="tile" aria-hidden="true">${iconOf(d.id)}</span><div><b>${esc(nameOf(d.id))}${d.dupe ? '' : ' <i>New</i>'}</b><span>${fmtRate(d.rate)} · ${esc(kc)}</span><em>${esc(note)}</em></div></div>`;
    }).join('');
  }

  /* ---------------------------------------------------------------- a big moment */
  /** a pet or a mount takes the whole screen until you tap */
  private moment(id: string, line: string, where: string): Promise<void> {
    const c = COLLECTIBLES[id];
    if (!c) return Promise.resolve();
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = `big-moment ${c.kind === 'mount' ? 'gold' : ''}`;
      el.setAttribute('data-act', 'moment');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', c.name);
      el.tabIndex = -1;
      el.innerHTML = `<span class="rays"></span><div class="bm"><img src="${spriteURL(c.sprite || '')}" alt="" class="${c.kind === 'mount' ? 'mount' : ''}"><h2>${esc(c.name)}</h2>
        <p>${esc(line)}</p><p>${esc(where)}</p><p style="opacity: 0.7">Tap to carry on</p></div>`;
      this.root.appendChild(el);
      SFX.play('petfound');
      el.focus({ preventScroll: true });
      this.momentDone = () => { el.remove(); this.momentDone = null; res(); };
    });
  }
}

/* ---------------------------------------------------------------- little pieces */
const plateW = (s: string): number => Math.max(120, Math.round(s.length * 13.2 + 34));
/** a name plate under something you can tap */
function plate(x: number, y: number, title: string, sub: string, cls: string): string {
  const w = Math.max(plateW(title), sub.length * 8.6 + 28);
  return `<g class="vl-plate ${cls}" transform="translate(${x} ${y})" aria-hidden="true"><rect x="${(-w / 2).toFixed(0)}" y="0" width="${w.toFixed(0)}" height="${sub ? 54 : 38}" rx="14"/><text class="t" x="0" y="25">${esc(title)}</text>${sub ? `<text class="s" x="0" y="44">${esc(sub)}</text>` : ''}</g>`;
}
function xpRow(name: string, icon: string, pr: { rank: number; into: number; need: number; k: number }, xp: number): string {
  return `<div class="vc-xp"><span class="tile" aria-hidden="true">${tile(icon)}</span><div><span>${esc(name)} <b>${pr.rank}</b>${pr.need ? ` · ${fmtN(pr.into)}/${fmtN(pr.need)}` : ' · max'}</span><div class="bar"><i style="width: ${(pr.k * 100).toFixed(1)}%"></i></div></div><b class="plus">+${xp}</b></div>`;
}
function achHtml(ids: string[]): string {
  return ids.length ? `<div class="vc-ach">${ids.map((id) => `<span class="chip">Achievement <b>${esc(nameOfAch(id))}</b></span>`).join('')}</div>` : '';
}
const nameOfAch = (id: string): string => ACHIEVEMENTS[id]?.name || id;
