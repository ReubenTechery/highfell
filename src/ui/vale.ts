/**
 * The Vale: riding out. A map of the valley, the ride itself, and the places you ride to. A place is
 * one screen: gathering spots you tap for a close-up, a villager with an errand a day, and your hero
 * (on their mount, once they have one). What you get goes into the save the moment you get it.
 *
 * You start on foot: Dottle's first errand is herding her goats, and the one that likes you is yours.
 * A mount makes every ride quicker; nothing else about it is power. The errands are little toys:
 * goats to herd, crows that come in gangs and hop about, sparks drifting at the thatch, a kettle
 * that runs off when you find it.
 */
import { ACHIEVEMENTS, COLLECTIBLES } from '../content';
import { FOOT_SECS, INGREDIENTS, PLACES, VALE_MAP } from '../content/vale';
import type { ErrandDef, NodeDef } from '../content/types';
import { Achiever } from '../meta/achievements';
import { activeHero, roleOf } from '../meta/profile';
import {
  beginHarvest, completeErrand, cutXp, dayOf, endHarvest, errandAt, errandShort, ingredientName, placeState,
  rankProgress, readyAt, rideMount, rideSecs, skillRank, type ErrandDone, type Harvest, type HarvestEnd, type ValeDrop,
} from '../meta/vale';
import { SKILLS } from '../content/vale';
import type { App } from './app';
import { actions, esc, fmtN, fmtRate, GLYPH, reducedMotion, wait } from './dom';
import { heroSprite, iconOf, nameOf, placeSprite, riderSvg, spriteURL, tile } from './art';
import { SFX } from './sound';
import { playToy, type ToyResult } from './toys';
import { BW_AT, BW_HIDE, BW_PEN, bramblewickScenery, mapScenery, P, PLACE_H, PLACE_W, rideStrips, shooSpots, SKY_STOPS, sparkSky, type Lay } from './valeart';

type Mode = 'map' | 'ride' | 'place';
/** something moving about during an errand: a goat, a crow, a spark, the kettle */
interface Thing {
  i: number; x: number; y: number;
  /** where it is headed, from where, and how far along (0 to 1) */
  fx: number; fy: number; tx: number; ty: number; k: number; dur: number;
  state: 'in' | 'idle' | 'walk' | 'hop' | 'drift' | 'home' | 'yours' | 'gone';
  wait: number; spot: number; flip: boolean; el: SVGGElement | null;
}
interface Job {
  kind: 'find' | 'shoo' | 'herd';
  errand: ErrandDef;
  thing: string;
  target: number;
  done: number;
  things: Thing[];
  /** find: where it hides, and whether it has already run off once */
  spot: number; ran: boolean;
  /** shoo: the wave, and the combo of quick taps */
  wave: number; combo: number; lastHit: number; best: number;
  /** sparks: how hot the thatch is, 0 to 1, and the clock to the next spark */
  heat: number; spawn: number;
  seq: number;
}
type Card =
  | { kind: 'talk'; errand: ErrandDef | null }
  | { kind: 'harvest'; h: Harvest; end: HarvestEnd; res: ToyResult; unlocked: string[] }
  | { kind: 'errand'; done: ErrandDone; unlocked: string[]; best: number };

const NODE_SPRITE: Record<string, [string, string]> = { moonpetal: ['node_moonpetal', 'node_moonpetal_shim'], glowcap: ['node_glowcap', 'node_glowcap'], bramble: ['node_bramble', 'node_bramble'] };
const FIND_SPRITE: Record<string, [string, number]> = { kettle: ['kettle_walk', 0.85], goggles: ['goggles', 1.15] };
const THING_WORD: Record<string, string> = { kettle: 'the walking kettle', goggles: 'Dottle’s goggles', crow: 'crows', spark: 'sparks', goat: 'goats' };
/** where you stand on the map */
const TOKEN_AT: [number, number] = [592, 628];
/** crows come in gangs */
const WAVES = [3, 3, 2];
/** what Dottle shouts while you work */
const QUIPS: Record<string, string[]> = {
  goat: ['Turnip! Parsnip! Come back!', 'Good goat!', 'That one’s Parsnip.', 'Nearly there!'],
  crow: ['Shoo! Go on, shoo!', 'Here come more!', 'They’ve brought friends!'],
  spark: ['Mind the thatch!', 'Hot! Hot!', 'Got it! Keep going!'],
  combo: ['Look at you go!', 'Ha! Lovely!', 'Show-off!'],
};

export class Vale {
  mode: Mode = 'map';
  private placeId = 'bramblewick';
  private lay: Lay = 'wide';
  private busy = false;
  private job: Job | null = null;
  private card: Card | null = null;
  private momentDone: (() => void) | null = null;
  private raf = 0;
  private quipT = 0;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      home: () => { SFX.play('ui'); app.showHearth(); },
      go: () => { void this.go(); },
      satchel: () => { SFX.play('ui'); app.sheets.open({ kind: 'satchel' }); },
      ridehome: () => { void this.rideHome(); },
      close: () => { SFX.play('ui'); this.closeCard(); },
      again: (el) => { this.closeCard(); void this.harvest(el.dataset.id!); },
      start: () => this.startJob(),
      stop: () => { SFX.play('ui'); this.endJob(); this.renderDyn(); this.renderTop(); },
      moment: () => this.momentDone?.(),
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.card) { e.preventDefault(); this.closeCard(); } });
  }

  /* ---------------------------------------------------------------- coming and going */
  /** Ride out from the hearth: the map, with Bramblewick the one place to go. */
  async enter(): Promise<void> {
    this.endJob();
    this.card = null; this.busy = false;
    this.mode = 'map';
    this.render();
  }
  /** the button on the map card: ride to Bramblewick */
  private async go(): Promise<void> {
    if (this.busy) return;
    SFX.play('ui');
    this.app.p.vale.rides++;
    this.app.store.save();
    await this.ride(PLACES.bramblewick.name, false);
    this.placeId = 'bramblewick';
    this.mode = 'place';
    this.render();
  }
  private async rideHome(): Promise<void> {
    if (this.busy) return;
    this.endJob(); this.card = null;
    await this.ride('Highfell', true);
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
    if (this.mode === 'place' && !this.busy && !this.job && this.measureLay() !== this.lay) this.render();
  }
  private measureLay(): Lay {
    const r = this.root.getBoundingClientRect();
    return r.width > 0 && r.width / Math.max(1, r.height) < 0.85 ? 'tall' : 'wide';
  }
  /** what you ride, and how long a ride takes */
  private mount(): { id: string | null; secs: number; name: string } {
    const id = rideMount(this.app.p);
    return { id, secs: rideSecs(id), name: id ? COLLECTIBLES[id]?.name || 'mount' : '' };
  }
  /** your hero, on their mount or on foot, with their feet at (x, y) */
  private me(x: number, y: number, k: number, o: { flip?: boolean; cls?: string } = {}): string {
    const p = this.app.p, h = activeHero(p);
    if (!h) return '';
    const spr = heroSprite(h, roleOf(h));
    const m = rideMount(p);
    return m ? riderSvg(spr, m, x, y, { k, flip: o.flip, cls: o.cls }) : placeSprite(spr + '_f', x, y, { k: k * 0.95, cls: o.cls });
  }

  /* ---------------------------------------------------------------- the map */
  /** fit everything worth seeing (x 110 to 890, y 150 to 860) between the top bar and the card */
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
    svg.addEventListener('click', (e) => { if ((e.target as Element).closest('[data-place="bramblewick"]')) void this.go(); });
    svg.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && (e.target as Element).closest('[data-place="bramblewick"]')) { e.preventDefault(); void this.go(); } });
    this.renderMapDyn();
  }
  /** Only Bramblewick can be ridden to: it glows, its road is lit and it has the button. The rest are
   *  landmarks (the Barrow is through the door at home) or locked until later. */
  private renderMapDyn(): void {
    const p = this.app.p;
    const dyn = this.root.querySelector('svg.vl-map .vl-dyn');
    if (!dyn) return;
    const o: string[] = [];
    o.push(`<path class="mp-road" d="M490 600 C440 650 380 660 330 690 C300 706 280 712 262 716"/>`);
    for (const m of VALE_MAP) {
      const ly = m.id === 'highfell' ? m.y + 82 : m.id === 'bramblewick' ? m.y + 86 : m.id === 'barrow' ? m.y + 72 : m.y + 70;
      const w = plateW(m.name);
      if (m.id === 'bramblewick') {
        const pl = PLACES[m.id];
        const ready = pl.nodes.reduce((s, n) => s + readyAt(p, m.id, n.id), 0);
        const job = !!errandAt(p, m.id);
        o.push(`<g class="mp go" data-place="${m.id}" tabindex="0" role="button" aria-label="Ride to ${esc(m.name)}">
          <circle class="mp-ring" cx="${m.x}" cy="${m.y - 10}" r="104"/><circle class="hit" cx="${m.x}" cy="${m.y - 10}" r="116"/>
          <g transform="translate(${m.x} ${m.y - 150})"><g class="mp-arrow">${P('M-16 -30 H16 V0 H32 L0 34 L-32 0 H-16 Z', '#F2C230', 4)}</g></g>
          <g class="vl-plate place" transform="translate(${m.x} ${ly})"><rect x="${-w / 2}" y="0" width="${w}" height="${job || ready ? 58 : 40}" rx="14"/><text class="t" x="0" y="28">${esc(m.name)}</text>${job || ready ? `<text class="s" x="0" y="48">${ready ? `${ready} to gather` : ''}${ready && job ? ' · ' : ''}${job ? 'a job for you' : ''}</text>` : ''}</g></g>`);
      } else if (m.kind === 'soon') {
        o.push(`<g class="mp soon" aria-hidden="true"><g class="vl-plate soon" transform="translate(${m.x} ${ly})"><rect x="${-w / 2 - 16}" y="0" width="${w + 32}" height="40" rx="14"/>
          <g transform="translate(${-w / 2 + 6} 20)">${lockIcon()}</g><text class="t" x="12" y="28">${esc(m.name)}</text></g>
          <g class="soon-tag" transform="translate(${m.x} ${ly + 52})"><rect x="-34" y="-14" width="68" height="26" rx="9"/><text y="5">Later</text></g></g>`);
      } else {
        // home and the dungeon: landmarks, not destinations from here
        o.push(`<g class="mp mark" aria-hidden="true"><g class="vl-plate ${m.kind}" transform="translate(${m.x} ${ly})"><rect x="${-w / 2}" y="0" width="${w}" height="${m.kind === 'home' ? 58 : 40}" rx="14"/><text class="t" x="0" y="28">${esc(m.name)}</text>${m.kind === 'home' ? '<text class="s" x="0" y="48">You are here</text>' : ''}</g></g>`);
      }
    }
    o.push(`<g class="mp-me">${this.me(TOKEN_AT[0], TOKEN_AT[1], 0.4, { cls: 'bob' })}</g>`);
    dyn.innerHTML = o.join('');
    const card = this.root.querySelector('#vl-mapcard');
    if (card) card.innerHTML = this.mapCard();
    this.root.querySelector('svg.vl-map')?.setAttribute('viewBox', this.mapBox());
  }
  private mapCard(): string {
    const p = this.app.p, pl = PLACES.bramblewick, m = this.mount();
    const ready = pl.nodes.reduce((s, n) => s + readyAt(p, pl.id, n.id), 0);
    const e = errandAt(p, pl.id);
    const who = pl.villager.name.split(' ')[0];
    const sub = [ready ? `${ready} to gather` : 'All picked: it regrows overnight', e ? `${who} needs a hand` : ''].filter(Boolean).join(' · ');
    const how = m.id ? `On your ${esc(m.name)} · ${m.secs} s` : `On foot · ${FOOT_SECS} s`;
    return `<div class="mc"><div class="mc-tx"><b>${esc(pl.name)}</b><span>${esc(sub)}</span><p>${m.id ? 'The gnomes’ hollow hills. The only place open for now: more of the Vale opens later.' : `You’re on foot. Help ${who} with her goats and one of them is yours.`}</p></div>
      <div class="mc-act"><button type="button" class="btn gold big" data-act="go">${GLYPH.sign}Ride there<small>${how}</small></button></div></div>`;
  }

  /* ---------------------------------------------------------------- the ride */
  /** your hero going past the Vale. A mount makes it quicker; there's no skipping it. */
  private ride(to: string, back: boolean): Promise<void> {
    const m = this.mount();
    this.mode = 'ride';
    this.busy = true;
    const st = rideStrips();
    const strip = (s: string) => `${s}<g transform="translate(${st.w} 0)">${s}</g>`;
    // the middle of the road, so a phone (which sees only the middle) sees you
    const rx = 600;
    const walking = !m.id;
    this.root.className = 'scene vale m-ride';
    this.root.innerHTML = `
      <svg class="vl-ride" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs><linearGradient id="rdsky" x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">${SKY_STOPS}</linearGradient>
          <radialGradient id="rdsun"><stop offset="0" stop-color="#FFF1C4" stop-opacity="0.85"/><stop offset="1" stop-color="#FFD48A" stop-opacity="0"/></radialGradient></defs>
        <rect x="-200" y="-400" width="1600" height="1200" style="fill: url(#rdsky)"/>
        <circle cx="${back ? 260 : 940}" cy="360" r="190" style="fill: url(#rdsun)"/><circle cx="${back ? 260 : 940}" cy="360" r="58" style="fill: #FFE7A8; stroke: #1E1A1A; stroke-width: 4"/>
        <g class="far">${strip(st.far)}</g><g class="mid">${strip(st.mid)}</g><g class="near">${strip(st.near)}</g>
        <g class="dust"></g>
        <g class="rider-run" transform="translate(${rx} 632)">${this.me(0, 0, walking ? 1.4 : 1.25, { flip: back })}</g>
      </svg>
      <div class="vl-ride-tx" role="status"><b>${back ? (walking ? 'Walking home' : 'Riding home') : `${walking ? 'Walking' : 'Riding'} to ${esc(to)}`}</b>
        <span>${walking ? 'A mount would get you there quicker' : `On your ${esc(m.name)}`}</span><i class="vl-ride-bar"><i></i></i></div>`;
    const svg = this.root.querySelector<SVGSVGElement>('svg.vl-ride')!;
    const layers = (['far', 'mid', 'near'] as const).map((n) => svg.querySelector('.' + n) as SVGGElement);
    // a mount covers the ground faster than legs do
    const pace = walking ? 0.45 : 1;
    const speed = [40 * pace, 150 * pace, 560 * pace];
    const rider = svg.querySelector('.rider-run') as SVGGElement;
    const dust = svg.querySelector('.dust') as SVGGElement;
    const bar = this.root.querySelector<HTMLElement>('.vl-ride-bar i')!;
    const dir = back ? 1 : -1;
    const dur = reducedMotion() ? 0.6 : m.secs;
    const step = walking ? 0.3 : 0.24;
    SFX.play(m.id === 'mount.goat' ? 'bleat' : walking ? 'step' : 'hoof', 0.8);
    return new Promise((resolve) => {
      let t = 0, last = performance.now(), hoof = 0, puff = 0, raf = 0;
      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        layers.forEach((g, i) => { const x = ((dir * t * speed[i]) % st.w + (dir < 0 ? 0 : -st.w)); g.setAttribute('transform', `translate(${x.toFixed(1)} 0)`); });
        const f = walking ? 3.3 : 4.2;
        const bob = Math.abs(Math.sin(t * Math.PI * f)) * (walking ? 7 : 10);
        rider.setAttribute('transform', `translate(${rx} ${(632 - bob).toFixed(1)}) rotate(${(Math.sin(t * Math.PI * f) * (walking ? 2.4 : 1.6)).toFixed(2)})`);
        bar.style.width = `${Math.min(100, (t / dur) * 100).toFixed(1)}%`;
        if ((hoof -= dt) <= 0) { hoof = step; SFX.play(walking ? 'step' : 'hoof', 0.5); }
        if ((puff -= dt) <= 0 && !reducedMotion() && !walking) {
          puff = 0.12;
          const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', String(rx + (back ? 70 : -70))); c.setAttribute('cy', '628'); c.setAttribute('r', String(8 + Math.random() * 8));
          c.setAttribute('class', 'puff'); c.setAttribute('style', `--dx: ${(dir * 90).toFixed(0)}px`);
          dust.appendChild(c); setTimeout(() => c.remove(), 600);
        }
        if (t >= dur) { cancelAnimationFrame(raf); this.busy = false; resolve(); return; }
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
        ${bramblewickScenery(this.lay)}${this.flies(W, H)}<g class="vl-dyn"></g><g class="vl-job"></g><g class="vl-fx"></g><g class="vl-say"></g></svg>
      <div class="vl-top" id="vl-top"></div>
      <div class="vl-banner" id="vl-banner" hidden></div>
      <div class="vl-bottom"><p class="vl-hint" id="vl-hint"></p></div>
      <div class="vl-cardwrap" id="vl-card" hidden></div>`;
    const svg = this.root.querySelector<SVGSVGElement>('svg.vl-place')!;
    svg.addEventListener('click', (e) => this.tapScene(e.target as Element));
    svg.addEventListener('pointerdown', (e) => {
      const t = e.target as Element;
      const sh = t.closest('[data-shoo]'), hd = t.closest('[data-herd]');
      if (sh) { e.preventDefault(); this.shoo(+sh.getAttribute('data-shoo')!); }
      else if (hd) { e.preventDefault(); this.herd(+hd.getAttribute('data-herd')!); }
    });
    svg.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const t = e.target as Element, sh = t.closest('[data-shoo]'), hd = t.closest('[data-herd]');
      if (sh) this.shoo(+sh.getAttribute('data-shoo')!); else if (hd) this.herd(+hd.getAttribute('data-herd')!); else this.tapScene(t);
    });
    this.renderTop();
    this.renderDyn();
    this.mountJob();
    this.banner();
    if (this.card) this.renderCard();
  }
  private flies(W: number, H: number): string {
    let s = '<g class="flies" aria-hidden="true">', seed = 3;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 16; i++) s += `<circle class="fly" cx="${(r() * W).toFixed(0)}" cy="${(H * 0.55 + r() * H * 0.4).toFixed(0)}" r="${(3 + r() * 2.5).toFixed(1)}" style="animation-delay: ${(-r() * 6).toFixed(2)}s; animation-duration: ${(4 + r() * 4).toFixed(2)}s"/>`;
    return s + '</g>';
  }
  /** the top bar: ride home, the place and your Gathering rank with its bar, the satchel */
  private renderTop(): void {
    const el = this.root.querySelector('#vl-top');
    if (!el) return;
    const p = this.app.p, pl = PLACES[this.placeId];
    const items = Object.values(p.vale.satchel).reduce((a, b) => a + b, 0);
    const pr = rankProgress(p.vale.xp.gather || 0);
    el.innerHTML = `<button type="button" class="btn small" data-act="ridehome">${GLYPH.home}<span class="long">Ride home</span></button>
      <div class="vl-title"><h2>${esc(pl.name)}</h2><p class="vl-rank"><span>${esc(SKILLS.gather.name)} ${pr.rank}</span><i class="vl-rbar"><i style="width: ${(pr.k * 100).toFixed(1)}%"></i></i></p></div>
      <button type="button" class="btn small" data-act="satchel" aria-label="Satchel, ${items} things">${GLYPH.bag}<b>${fmtN(items)}</b></button>`;
    const hint = this.root.querySelector('#vl-hint');
    if (hint) {
      const ready = pl.nodes.reduce((s, n) => s + readyAt(p, this.placeId, n.id), 0);
      const e = errandAt(p, this.placeId);
      const who = pl.villager.name.split(' ')[0];
      hint.textContent = this.job ? '' : e && !p.vale.lore.length ? `${who} needs a hand. Tap her.` : ready ? `Tap a plant to gather.${e ? ` ${who} has a job for you.` : ''}` : e ? `All picked for today. ${who} has a job for you.` : 'All done for today. It regrows overnight.';
    }
  }
  /** everything in the place that changes: the plants and their counts, the villager, you, the goat pen */
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
    // the goat pen, with whoever is home in it (not while they're out on the herding errand)
    const pen = BW_PEN[this.lay];
    const out = this.job?.kind === 'herd';
    layer.push({ y: pen.y + 30, svg: penSvg(pen.x, pen.y, pen.k || 1, out ? 0 : 3) });
    // you
    const ra = A.rider;
    layer.push({ y: ra.y, svg: `<g class="me" data-mount="1"><ellipse cx="${ra.x}" cy="${ra.y}" rx="${(rideMount(p) ? 86 : 40) * (ra.k || 1)}" ry="${12 * (ra.k || 1)}" style="fill: rgba(20, 30, 14, 0.35)"/>${this.me(ra.x, ra.y, ra.k || 1, { cls: 'idle-ride' })}</g>` });
    // a lost thing in the grass
    const j = this.job;
    if (j && j.kind === 'find') {
      const spot = BW_HIDE[this.lay][j.spot % BW_HIDE[this.lay].length];
      const [spr, k] = FIND_SPRITE[j.thing] || FIND_SPRITE.kettle;
      layer.push({ y: spot.y + 1, svg: `<g class="lost" data-find="1" tabindex="0" role="button" aria-label="Something in the grass">${placeSprite(spr, spot.x + 6, spot.y - 4, { k, cls: 'wiggle' })}${tuftSvg(spot.x, spot.y)}<circle class="hit" cx="${spot.x}" cy="${spot.y - 20}" r="54"/></g>` });
    }
    layer.sort((a, b) => a.y - b.y);
    dyn.innerHTML = layer.map((l) => l.svg).join('') + `<g class="plates">${plates.join('')}</g>`;
  }
  private tapScene(target: Element): void {
    if (this.busy || this.card) return;
    const node = target.closest('[data-node]'), npc = target.closest('[data-npc]'), lost = target.closest('[data-find]'), me = target.closest('[data-mount]');
    if (lost) { void this.found(); return; }
    if (this.job && (node || npc)) { SFX.play('nope'); this.flashBanner(); return; }
    if (node) { void this.harvest(node.getAttribute('data-node')!); return; }
    if (npc) { this.talk(); return; }
    if (me) { const m = rideMount(this.app.p); SFX.play(m === 'mount.goat' ? 'bleat' : m ? 'hoof' : 'step'); const g = me.querySelector('.idle-ride'); g?.classList.remove('hop'); void (g as SVGGElement | null)?.getBoundingClientRect(); g?.classList.add('hop'); }
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
    // every cut pays its XP the moment it lands
    let ranked = 0;
    const res = await playToy(this.root, { node, shimmer: h.shimmer, pet, xp: p.vale.xp.gather || 0, onGrade: (g) => { const x = cutXp(p, h, g); app.store.save(); if (x.rankUp) ranked = x.rankUp.rank; return x; } });
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
    this.afterGain(end.rankUp?.rank || ranked, 'gather', unlocked);
  }
  private achiever(): Achiever {
    const p = this.app.p, h = activeHero(p);
    return new Achiever(p, { dungeon: this.placeId, role: h ? roleOf(h) : 'tank', practice: false, testGear: false });
  }
  private afterGain(rank: number, skill: string, unlocked: string[]): void {
    if (rank) {
      const note = skill === 'gather' && [4, 7, 10].includes(rank) ? 'Every harvest gives one more' : '';
      this.app.toasts.rank(SKILLS[skill]?.name || skill, rank, skill === 'brew' ? 's_brew' : 's_gather', note);
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
    this.closeCard();
    SFX.play('ui');
    if (e.kind === 'deliver') { void this.finishErrand(); return; }
    const st = placeState(this.app.p, this.placeId);
    const kind = e.kind === 'find' ? 'find' : e.kind === 'herd' ? 'herd' : 'shoo';
    this.job = { kind, errand: e, thing: e.thing || 'kettle', target: e.target || 6, done: 0, things: [], spot: (st.errands.next + dayOf(Date.now())) % 6, ran: false,
      wave: 0, combo: 0, lastHit: 0, best: 0, heat: 0, spawn: 0.4, seq: 0 };
    if (kind === 'herd') this.spawnGoats();
    if (kind === 'shoo' && this.job.thing === 'crow') this.spawnWave();
    if (kind === 'shoo') SFX.play(this.job.thing === 'spark' ? 'sizzle' : 'caw');
    if (kind === 'herd') SFX.play('bleat');
    this.renderDyn();
    this.renderTop();
    this.mountJob();
    this.banner();
    this.say(QUIPS[this.job.thing]?.[0] || '');
    this.loop();
  }
  private endJob(): void {
    this.job = null;
    cancelAnimationFrame(this.raf); this.raf = 0;
    const g = this.root.querySelector('svg.vl-place .vl-job');
    if (g) g.innerHTML = '';
    const s = this.root.querySelector('svg.vl-place .vl-say');
    if (s) s.innerHTML = '';
    this.quipT = 0;
    this.banner();
  }
  /** the errand's moving parts, every frame */
  private loop(): void {
    cancelAnimationFrame(this.raf);
    let last = performance.now();
    const tick = (now: number) => {
      const j = this.job;
      if (!j || this.mode !== 'place' || this.app.scene !== 'vale') { this.raf = 0; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!this.busy && !this.card && !this.root.classList.contains('away')) this.stepJob(j, dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  private stepJob(j: Job, dt: number): void {
    if (this.quipT > 0) { this.quipT -= dt; if (this.quipT <= 0) { const s = this.root.querySelector('svg.vl-place .vl-say'); if (s) s.innerHTML = ''; } }
    if (j.kind === 'herd') this.stepGoats(j, dt);
    else if (j.kind === 'shoo' && j.thing === 'crow') this.stepCrows(j, dt);
    else if (j.kind === 'shoo') this.stepSparks(j, dt);
    else this.stepKettle(j, dt);
    for (const t of j.things) this.place(t);
  }
  /** the errand's things as SVG: each is a group we move by its transform */
  private mountJob(): void {
    const g = this.root.querySelector('svg.vl-place .vl-job');
    if (!g) return;
    g.innerHTML = '';
    const j = this.job;
    if (!j) return;
    for (const t of j.things) if (t.state !== 'gone') this.addThing(j, t);
  }
  private addThing(j: Job, t: Thing): void {
    const g = this.root.querySelector('svg.vl-place .vl-job');
    if (!g) return;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const goat = j.kind === 'herd', crow = j.thing === 'crow', spark = j.thing === 'spark';
    el.setAttribute('class', `th ${goat ? 'goat' : crow ? 'crow' : spark ? 'spark' : 'kettle'}`);
    if (goat) el.setAttribute('data-herd', String(t.i));
    else if (crow || spark) el.setAttribute('data-shoo', String(t.i));
    el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
    el.setAttribute('aria-label', goat ? 'A goat' : crow ? 'A crow' : spark ? 'A spark' : 'The kettle');
    const spr = goat ? placeSprite('goat', 0, 0, { k: 0.42 }) : crow ? placeSprite('crow', 0, 0, { k: 1.05, cls: 'peck' }) : spark ? placeSprite('spark', 0, 0, { k: 1.25, cls: 'flicker' }) : placeSprite('kettle_walk', 0, 0, { k: 0.85 });
    el.innerHTML = `<g class="th-f">${spr}</g><circle class="hit" cx="0" cy="${goat ? -30 : -22}" r="${goat ? 50 : 44}"/>`;
    g.appendChild(el);
    t.el = el;
    this.place(t);
  }
  private place(t: Thing): void {
    if (!t.el) return;
    t.el.setAttribute('transform', `translate(${t.x.toFixed(1)} ${t.y.toFixed(1)})`);
    const f = t.el.firstElementChild as SVGGElement;
    f.setAttribute('transform', t.flip ? 'scale(-1 1)' : '');
    t.el.classList.toggle('walking', t.state === 'walk');
  }
  private newThing(j: Job, x: number, y: number, state: Thing['state']): Thing {
    return { i: j.seq++, x, y, fx: x, fy: y, tx: x, ty: y, k: 1, dur: 1, state, wait: 0, spot: -1, flip: false, el: null };
  }
  /** start a thing travelling to (x, y) over `dur` seconds */
  private go2(t: Thing, x: number, y: number, dur: number, state: Thing['state']): void {
    t.fx = t.x; t.fy = t.y; t.tx = x; t.ty = y; t.k = 0; t.dur = Math.max(0.05, dur); t.state = state;
    if (Math.abs(x - t.x) > 4) t.flip = x < t.x;
  }
  /** move along: returns true on arrival. `arc` lifts it in a hop on the way. */
  private travel(t: Thing, dt: number, arc = 0): boolean {
    t.k = Math.min(1, t.k + dt / t.dur);
    const e = t.k < 0.5 ? 2 * t.k * t.k : 1 - Math.pow(-2 * t.k + 2, 2) / 2;
    t.x = t.fx + (t.tx - t.fx) * e;
    t.y = t.fy + (t.ty - t.fy) * e - Math.sin(t.k * Math.PI) * arc;
    return t.k >= 1;
  }

  /* -------- the goats: tap one and it trots home to the pen. The last one out decides it likes you. */
  private meadow(): { x0: number; x1: number; y0: number; y1: number } {
    return this.lay === 'wide' ? { x0: 260, x1: 1220, y0: 650, y1: 860 } : { x0: 170, x1: 640, y0: 690, y1: 1060 };
  }
  private spawnGoats(): void {
    const j = this.job!, m = this.meadow();
    const pts = this.lay === 'wide' ? [[300, 800], [560, 690], [1010, 760], [1230, 690]] : [[200, 760], [520, 700], [440, 940], [200, 1040]];
    for (const [x, y] of pts.slice(0, j.target)) {
      const t = this.newThing(j, Math.min(m.x1, Math.max(m.x0, x)), y, 'idle');
      t.wait = 0.4 + Math.random() * 1.6;
      t.flip = Math.random() < 0.5;
      j.things.push(t);
    }
  }
  private stepGoats(j: Job, dt: number): void {
    const m = this.meadow(), pen = BW_PEN[this.lay], ra = BW_AT[this.lay].rider;
    for (const t of j.things) {
      if (t.state === 'idle') {
        if ((t.wait -= dt) <= 0) {
          // wander somewhere nearby, now and then at a skip
          const x = Math.min(m.x1, Math.max(m.x0, t.x + (Math.random() * 2 - 1) * 220)), y = Math.min(m.y1, Math.max(m.y0, t.y + (Math.random() * 2 - 1) * 120));
          const d = Math.hypot(x - t.x, y - t.y);
          this.go2(t, x, y, d / (Math.random() < 0.25 ? 150 : 60), 'walk');
          if (Math.random() < 0.15) SFX.play('bleat', 0.35);
        }
      } else if (t.state === 'walk') {
        if (this.travel(t, dt)) { t.state = 'idle'; t.wait = 0.8 + Math.random() * 2.2; }
      } else if (t.state === 'hop') {
        // tapped: a happy hop on the spot, then off home (or to you)
        if (this.travel(t, dt, 26)) {
          if (t.spot === 99) { const x = ra.x + (this.lay === 'wide' ? 110 : -100) * (ra.k || 1), y = ra.y + 4; this.go2(t, x, y, Math.hypot(x - t.x, y - t.y) / 150, 'yours'); }
          else { const x = pen.x + (t.spot - 1) * 38 * (pen.k || 1), y = pen.y - 6; this.go2(t, x, y, Math.hypot(x - t.x, y - t.y) / 170, 'home'); }
        }
      } else if (t.state === 'home' || t.state === 'yours') {
        if (t.k < 1 && this.travel(t, dt)) { t.flip = t.state === 'yours' ? this.lay !== 'wide' : Math.random() < 0.5; if (t.state === 'yours') SFX.play('bleat'); }
      }
    }
  }
  private herd(i: number): void {
    const j = this.job;
    if (!j || j.kind !== 'herd' || this.busy || this.card) return;
    const t = j.things.find((x) => x.i === i);
    if (!t || t.state === 'hop' || t.state === 'home' || t.state === 'yours') return;
    j.done++;
    // the last goat out is the one that likes you, the first time round
    const yours = j.done >= j.target && !!j.errand.gives && !this.app.p.collection[j.errand.gives];
    t.spot = yours ? 99 : j.done;
    this.go2(t, t.x, t.y, 0.32, 'hop');
    SFX.play('bleat', 0.8); SFX.play('pop', 0.5);
    this.floatAt(t.x, t.y - 80, yours ? 'She likes you!' : `${j.done} of ${j.target}`, yours ? '#F2C230' : '#FFF8EC', 26);
    if (!yours && j.done < j.target) this.say(QUIPS.goat[Math.min(QUIPS.goat.length - 1, j.done)]);
    if (yours) this.say('Oh! She likes you.');
    this.banner();
    if (j.done >= j.target) { this.busy = true; setTimeout(() => { this.busy = false; void this.finishErrand(); }, yours ? 1900 : 900); }
  }

  /* -------- the crows: they come in gangs, hop between cabbages, and quick taps make a combo */
  private spawnWave(): void {
    const j = this.job!;
    const n = WAVES[Math.min(WAVES.length - 1, j.wave)];
    j.wave++;
    const spots = shooSpots(this.lay, 'crow');
    const free = spots.map((_, i) => i).filter((i) => !j.things.some((t) => t.state !== 'gone' && t.spot === i));
    for (let k = 0; k < n && free.length; k++) {
      const s = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const side = Math.random() < 0.5 ? -1 : 1;
      const t = this.newThing(j, spots[s].x + side * 420, spots[s].y - 380, 'in');
      t.spot = s;
      this.go2(t, spots[s].x, spots[s].y, 0.7 + k * 0.15, 'in');
      t.flip = side > 0;
      j.things.push(t);
      this.addThing(j, t);
    }
    SFX.play('caw', 0.7); SFX.play('flap', 0.6);
  }
  private stepCrows(j: Job, dt: number): void {
    const spots = shooSpots(this.lay, 'crow');
    for (const t of j.things) {
      if (t.state === 'in') { if (this.travel(t, dt, 60)) { t.state = 'idle'; t.wait = 1.2 + Math.random() * 1.6; } }
      else if (t.state === 'idle') {
        if ((t.wait -= dt) <= 0) {
          // hop to another cabbage
          const free = spots.map((_, i) => i).filter((i) => i !== t.spot && !j.things.some((o) => o.state !== 'gone' && o.spot === i));
          if (free.length) { const s = free[Math.floor(Math.random() * free.length)]; t.spot = s; this.go2(t, spots[s].x, spots[s].y, 0.34, 'hop'); }
          else t.wait = 0.6;
        }
      } else if (t.state === 'hop') { if (this.travel(t, dt, 30)) { t.state = 'idle'; t.wait = 1.0 + Math.random() * 1.8; } }
    }
  }

  /* -------- the sparks: they drift from the chimney towards the thatch; stamp them before they land */
  private stepSparks(j: Job, dt: number): void {
    const sky = sparkSky(this.lay), spots = shooSpots(this.lay, 'spark');
    const live = j.things.filter((t) => t.state === 'drift');
    if ((j.spawn -= dt) <= 0 && live.length < 3 && j.done + live.length < j.target + 2) {
      j.spawn = 0.8 + Math.random() * 0.7;
      const t = this.newThing(j, sky.x, sky.y, 'drift');
      const s = Math.floor(Math.random() * spots.length);
      t.spot = s;
      this.go2(t, spots[s].x, spots[s].y, 3.4 + Math.random() * 1.4, 'drift');
      j.things.push(t);
      this.addThing(j, t);
      SFX.play('pop', 0.35);
    }
    for (const t of j.things) {
      if (t.state !== 'drift') continue;
      // up out of the chimney, then a slow, wobbly drift down onto the roof
      const arrived = this.travel(t, dt, 110);
      t.x += Math.sin((t.k * 9 + t.i) * 1.3) * 1.6;
      if (arrived) {
        // it landed on the thatch: a flare, and the thatch gets hotter
        t.state = 'gone'; t.el?.remove(); t.el = null;
        j.heat = Math.min(1, j.heat + 0.25);
        this.flare(t.x, t.y);
        SFX.play('sizzle', 0.9);
        if (j.heat >= 1) {
          // never a fail: Dottle throws a bucket over it
          j.heat = 0.3;
          this.say('Splash! Got it! Keep going!');
          this.splash();
        } else this.say(QUIPS.spark[1]);
        this.banner();
      }
    }
    j.things = j.things.filter((t) => t.state !== 'gone');
  }
  private flare(x: number, y: number): void {
    const fx = this.root.querySelector('svg.vl-place .vl-fx');
    if (!fx) return;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'flare');
    g.innerHTML = P(`M${x - 18} ${y} C${x - 20} ${y - 22} ${x - 6} ${y - 30} ${x} ${y - 46} C${x + 8} ${y - 30} ${x + 22} ${y - 22} ${x + 18} ${y} Z`, '#FF8A4C', 3) + P(`M${x - 8} ${y} C${x - 8} ${y - 12} ${x} ${y - 18} ${x} ${y - 26} C${x + 4} ${y - 18} ${x + 8} ${y - 12} ${x + 8} ${y} Z`, '#FFE08A', 0);
    fx.appendChild(g);
    setTimeout(() => g.remove(), 900);
  }
  private splash(): void {
    const fx = this.root.querySelector('svg.vl-place .vl-fx');
    const d = BW_AT[this.lay].burrowRed, k = d.k || 1;
    if (!fx) return;
    for (let i = 0; i < 12; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(d.x + (Math.random() * 2 - 1) * 140 * k)); c.setAttribute('cy', String(d.y - 120 * k - Math.random() * 60 * k)); c.setAttribute('r', String(6 + Math.random() * 8));
      c.setAttribute('class', 'drop'); c.setAttribute('style', `--dy: ${(40 + Math.random() * 60).toFixed(0)}px`);
      fx.appendChild(c); setTimeout(() => c.remove(), 800);
    }
    SFX.play('splash');
  }
  private shoo(i: number): void {
    const j = this.job;
    if (!j || j.kind !== 'shoo' || this.busy || this.card) return;
    const t = j.things.find((x) => x.i === i);
    if (!t || t.state === 'gone') return;
    const crow = j.thing === 'crow';
    t.state = 'gone'; t.el?.remove(); t.el = null;
    j.done++;
    // quick taps chain into a combo
    const now = performance.now();
    j.combo = now - j.lastHit < 900 ? j.combo + 1 : 1;
    j.lastHit = now;
    j.best = Math.max(j.best, j.combo);
    const fx = this.root.querySelector('svg.vl-place .vl-fx');
    if (fx) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', crow ? 'flyoff' : 'stamp');
      g.setAttribute('style', `--dx: ${t.x < BW_AT[this.lay].cabbages.x ? -260 : 260}px`);
      g.innerHTML = crow ? placeSprite('crow', t.x, t.y, { k: 1.05, flip: t.flip }) : `<circle cx="${t.x}" cy="${t.y - 16}" r="26" style="fill: #E9DDCB; stroke: #1E1A1A; stroke-width: 3; opacity: 0.9"/>`;
      fx.appendChild(g);
      setTimeout(() => g.remove(), 800);
    }
    if (j.combo >= 2) { this.floatAt(t.x, t.y - 70, `×${j.combo}!`, j.combo >= 4 ? '#F2C230' : '#FFF8EC', 22 + Math.min(4, j.combo) * 4); SFX.play('combo', 0.5 + Math.min(4, j.combo) * 0.1); }
    if (j.combo === 3) this.say(QUIPS.combo[Math.floor(Math.random() * QUIPS.combo.length)]);
    SFX.play(crow ? 'flap' : 'sizzle');
    if (crow && Math.random() < 0.5) setTimeout(() => SFX.play('caw', 0.6), 120);
    j.things = j.things.filter((x) => x.state !== 'gone');
    this.banner();
    if (j.done >= j.target) { this.busy = true; setTimeout(() => { this.busy = false; void this.finishErrand(); }, 600); return; }
    if (crow && !j.things.length) { setTimeout(() => { if (this.job === j) { this.spawnWave(); this.say(QUIPS.crow[Math.min(2, j.wave - 1)]); } }, 650); }
  }

  /* -------- the kettle: the first time you find it, it runs off somewhere else */
  private stepKettle(j: Job, dt: number): void {
    const t = j.things[0];
    if (!t) return;
    if (this.travel(t, dt, 8)) {
      t.state = 'gone'; t.el?.remove(); t.el = null;
      j.things = [];
      this.renderDyn();
    }
  }
  private async found(): Promise<void> {
    const j = this.job;
    if (!j || j.kind !== 'find' || this.busy) return;
    if (j.thing === 'kettle' && !j.ran) {
      // it runs! across the meadow to a new hiding place
      j.ran = true;
      const spots = BW_HIDE[this.lay];
      const from = spots[j.spot % spots.length];
      j.spot = (j.spot + 2 + Math.floor(Math.random() * (spots.length - 2))) % spots.length;
      const to = spots[j.spot % spots.length];
      this.renderDyn();
      const t = this.newThing(j, from.x + 6, from.y - 4, 'walk');
      this.go2(t, to.x + 6, to.y - 4, 1.3, 'walk');
      j.things = [t];
      this.addThing(j, t);
      this.root.querySelector('svg.vl-place [data-find]')?.setAttribute('style', 'opacity: 0');
      SFX.play('squeak'); setTimeout(() => SFX.play('squeak', 0.7), 200);
      this.floatAt(from.x, from.y - 80, 'It ran off!', '#FFF8EC', 26);
      this.say('It’s running! After it!');
      return;
    }
    this.busy = true;
    SFX.play('perfect', 0.7);
    const el = this.root.querySelector('svg.vl-place [data-find] .wiggle');
    el?.classList.add('caught');
    await wait(reducedMotion() ? 100 : 650);
    this.busy = false;
    await this.finishErrand();
  }

  /* -------- what the errand looks like on screen */
  private banner(): void {
    const el = this.root.querySelector<HTMLElement>('#vl-banner');
    if (!el) return;
    const j = this.job;
    if (!j) { el.hidden = true; return; }
    el.hidden = false;
    const what = j.kind === 'find' ? `Find ${esc(THING_WORD[j.thing] || 'it')}`
      : j.kind === 'herd' ? `Herd the goats: <b>${j.done} of ${j.target}</b>`
      : j.thing === 'spark' ? `Stamp the sparks: <b>${j.done} of ${j.target}</b>` : `Shoo the crows: <b>${j.done} of ${j.target}</b>`;
    const heat = j.thing === 'spark' ? `<span class="heat" title="How hot the thatch is"><i style="width: ${(j.heat * 100).toFixed(0)}%"></i></span>` : '';
    el.innerHTML = `<span>${what}</span>${heat}<button type="button" class="btn small" data-act="stop">Stop</button>`;
  }
  private flashBanner(): void { const el = this.root.querySelector('#vl-banner'); el?.classList.remove('nudge'); void (el as HTMLElement | null)?.offsetWidth; el?.classList.add('nudge'); }
  /** Dottle says something: a speech bubble over her head for a couple of seconds */
  private say(text: string): void {
    const g = this.root.querySelector('svg.vl-place .vl-say');
    if (!g || !text) return;
    const d = BW_AT[this.lay].dottle, k = d.k || 1;
    const w = Math.max(120, text.length * 11.5 + 32);
    const left = d.x + w / 2 + 40 > PLACE_W[this.lay] - 20;
    const x = left ? d.x - w / 2 - 10 : d.x + w / 2 - 30, y = d.y - 168 * k;
    g.innerHTML = `<g class="bubble"><rect x="${(x - w / 2).toFixed(0)}" y="${(y - 26).toFixed(0)}" width="${w.toFixed(0)}" height="44" rx="16"/>
      ${P(left ? `M${x + w / 2 - 34} ${y + 16} L${x + w / 2 - 14} ${y + 38} L${x + w / 2 - 50} ${y + 17} Z` : `M${x - w / 2 + 34} ${y + 16} L${x - w / 2 + 14} ${y + 38} L${x - w / 2 + 50} ${y + 17} Z`, '#FFF8EC', 3)}
      <text x="${x.toFixed(0)}" y="${(y + 4).toFixed(0)}">${esc(text)}</text></g>`;
    this.quipT = 2.4;
  }
  private floatAt(x: number, y: number, text: string, col: string, size: number): void {
    const fx = this.root.querySelector('svg.vl-place .vl-fx');
    if (!fx) return;
    // keep it on screen: a phone sees only the middle of a tall place
    const pad = this.lay === 'tall' ? 200 : 130;
    x = Math.max(pad, Math.min(PLACE_W[this.lay] - pad, x));
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(x)); t.setAttribute('y', String(y));
    t.setAttribute('class', 'vl-word');
    t.setAttribute('style', `fill: ${col}; font-size: ${size}px`);
    t.textContent = text;
    fx.appendChild(t);
    setTimeout(() => t.remove(), 1100);
  }

  private async finishErrand(): Promise<void> {
    const app = this.app, p = app.p;
    const best = this.job?.best || 0;
    const done = completeErrand(p, this.placeId, Math.random, Date.now(), { luck: app.dev.valeLuck ? 50 : 1 });
    this.endJob();
    if (!done) { SFX.play('nope'); this.renderDyn(); return; }
    const ach = this.achiever();
    const unlocked = [...ach.check(), ...done.drops.filter((d) => d.isNew).flatMap((d) => ach.collected(d.id))];
    for (const d of done.drops) if (d.isNew && COLLECTIBLES[d.id]) app.hearth.fresh.add(d.id);
    if (done.gift) app.hearth.fresh.add(done.gift);
    app.store.save();
    SFX.play('ach', 0.8);
    this.renderDyn(); this.renderTop();
    const kc = p.counters[`vale.${this.placeId}.errands`] || 0;
    if (done.gift && COLLECTIBLES[done.gift]?.kind === 'mount') {
      const c = COLLECTIBLES[done.gift];
      await this.moment(done.gift, 'A thank-you from Dottle', `Rides out in ${c.ride || FOOT_SECS} seconds instead of ${FOOT_SECS} on foot. She’s in the stall at home.`);
      this.renderDyn();
    }
    for (const d of done.drops) if (d.isNew && ['pet', 'mount'].includes(COLLECTIBLES[d.id]?.kind)) await this.moment(d.id, `${fmtRate(d.rate)} · errand ${fmtN(kc)}`, COLLECTIBLES[d.id].kind === 'pet' ? 'It followed you home. It’s by the fire.' : 'A thank-you from Dottle. It’s waiting in the stall at home.');
    this.card = { kind: 'errand', done, unlocked, best };
    this.renderCard();
    this.afterGain(done.rankUp?.rank || 0, 'gather', unlocked);
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
        const gift = e.gives && !p.collection[e.gives] ? `<div class="vc-line gift"><span class="tile" aria-hidden="true">${iconOf(e.gives)}</span><span>Do this and you get a <b>${esc(nameOf(e.gives))}</b>: your first mount.</span></div>` : '';
        const go = e.kind === 'deliver'
          ? (short ? `<button type="button" class="btn" disabled>Need ${Object.entries(short).map(([k, n]) => `${n} more ${ingredientName(k)}`).join(', ')}</button>` : `<button type="button" class="btn gold" data-act="start">Hand them over</button>`)
          : `<button type="button" class="btn gold" data-act="start">${e.kind === 'find' ? 'I’ll have a look' : 'On it'}</button>`;
        body = `${who}<h3 class="vc-title">${esc(e.title)}</h3><p class="vc-say">“${esc(e.ask)}”</p>${needs}${gift}
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
      const gift = d.gift ? `<div class="vc-drop new"><span class="tile" aria-hidden="true">${iconOf(d.gift)}</span><div><b>${esc(nameOf(d.gift))} <i>New</i></b><span>A thank-you from Dottle</span><em>${COLLECTIBLES[d.gift]?.kind === 'mount' ? `Your first mount: rides out in ${COLLECTIBLES[d.gift].ride || FOOT_SECS} s instead of ${FOOT_SECS}` : 'At home'}</em></div></div>` : '';
      body = `<div class="vc-who"><span class="tile" aria-hidden="true">${tile('c_gnome')}</span><div><b>${esc(d.errand.title)}</b><span>Done${c.best >= 3 ? ` · best combo ×${c.best}` : ''}</span></div></div>
        <p class="vc-say">“${esc(d.errand.thanks)}”</p>
        ${gift}
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
/** a padlock for places that open later */
function lockIcon(): string {
  return `<path d="M-7 -2 V-8 C-7 -15 7 -15 7 -8 V-2" style="fill: none; stroke: #1E1A1A; stroke-width: 6; stroke-linecap: round"/><path d="M-7 -2 V-8 C-7 -15 7 -15 7 -8 V-2" style="fill: none; stroke: #C9BED6; stroke-width: 3; stroke-linecap: round"/>`
    + `<rect x="-11" y="-3" width="22" height="17" rx="4" style="fill: #C9BED6; stroke: #1E1A1A; stroke-width: 3"/>`;
}
/** a tuft of grass something can hide behind */
function tuftSvg(x: number, y: number): string {
  return P(`M${x - 40} ${y + 4} C${x - 36} ${y - 22} ${x - 30} ${y - 30} ${x - 22} ${y - 16} C${x - 18} ${y - 40} ${x - 8} ${y - 44} ${x - 2} ${y - 18} C${x + 6} ${y - 42} ${x + 18} ${y - 38} ${x + 20} ${y - 14} C${x + 28} ${y - 30} ${x + 40} ${y - 22} ${x + 42} ${y + 4} Z`, '#5E9A45', 3.5);
}
/** Dottle's goat pen: a little fenced yard with a gate, and the goats who are home */
function penSvg(x: number, y: number, k: number, goats: number): string {
  const w = 190 * k, h = 66 * k, post = (px: number, py: number) => P(`M${px - 5 * k} ${py} V${py - 34 * k} L${px} ${py - 42 * k} L${px + 5 * k} ${py - 34 * k} V${py} Z`, '#A0703F', 3);
  const back = y - h / 2, front = y + h / 2;
  let o = `<g class="pen" aria-hidden="true"><ellipse cx="${x}" cy="${y}" rx="${w / 2 + 10}" ry="${h / 2 + 8}" style="fill: #C9A26A; opacity: 0.55"/>`;
  // the back rail and posts
  o += P(`M${x - w / 2} ${back - 22 * k} H${x + w / 2} V${back - 14 * k} H${x - w / 2} Z`, '#8A5A34', 3);
  for (let i = 0; i <= 4; i++) o += post(x - w / 2 + (w / 4) * i, back);
  for (let i = 0; i < goats; i++) o += placeSprite('goat', x - w / 3 + (w / 3) * i, y + 6 * k - (i % 2) * 6, { k: 0.36 * k, flip: i === 1 });
  // the front rail with a gap for the gate, and the gate swung open
  o += P(`M${x - w / 2} ${front - 22 * k} H${x - 26 * k} V${front - 14 * k} H${x - w / 2} Z`, '#8A5A34', 3);
  o += P(`M${x + 26 * k} ${front - 22 * k} H${x + w / 2} V${front - 14 * k} H${x + 26 * k} Z`, '#8A5A34', 3);
  for (const px of [x - w / 2, x - w / 4, x - 26 * k, x + 26 * k, x + w / 4, x + w / 2]) o += post(px, front);
  o += P(`M${x + 26 * k} ${front - 30 * k} L${x + 64 * k} ${front - 6 * k} L${x + 64 * k} ${front + 2 * k} L${x + 26 * k} ${front - 22 * k} Z`, '#B8865A', 3);
  return o + '</g>';
}
