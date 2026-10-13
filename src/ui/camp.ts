/**
 * The camp: every hero you have made, standing round a fire on the hill above Highfell. Tap one to
 * see who they are, play as them, look at their gear, rename a hero the game named for you, or let
 * one go. A new hero starts here too. Race and class never change; that is what alts are for.
 */
import { TITLES } from '../content';
import { CLASSES, MAX_HEROES, RACES, type ClassId, type RaceId } from '../content/folk';
import { ROLES } from '../content/roles';
import { loadoutFor } from '../meta/gear';
import { activeHero, heroById, nameProblem, removeHero, renameHero, roleOf, setActive, type Hero } from '../meta/profile';
import type { App } from './app';
import { actions, esc, fmtDate, fmtN, GLYPH } from './dom';
import { heroImg, heroSprite } from './art';
import { SFX } from './sound';
import { ilvl } from './hearth';

interface Slot { x: number; y: number; k: number }

/** Where heroes stand round the fire, in percent of the stage, in the order they fill up: the two
 *  closest to the fire first. Wide screens have one arc behind the fire; tall ones a ring round it. */
const WIDE: Slot[] = [{ x: 39, y: 61, k: 0.9 }, { x: 61, y: 61, k: 0.9 }, { x: 23.5, y: 66, k: 0.95 }, { x: 76.5, y: 66, k: 0.95 }, { x: 9.5, y: 73, k: 1 }, { x: 90.5, y: 73, k: 1 }];
const TALL: Slot[] = [{ x: 15, y: 62, k: 0.95 }, { x: 85, y: 62, k: 0.95 }, { x: 31, y: 34, k: 0.86 }, { x: 69, y: 34, k: 0.86 }, { x: 30, y: 88, k: 1.04 }, { x: 70, y: 88, k: 1.04 }];
const slots = (tall: boolean): Slot[] => (tall ? TALL : WIDE);

export class Camp {
  private sel: string | null = null;
  private delArmed = false;
  private delTimer = 0;
  private renaming = false;
  private renameErr = '';

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      home: () => { SFX.play('ui'); app.showHearth(); },
      pick: (el) => { if (this.sel !== el.dataset.id) { this.sel = el.dataset.id!; this.disarm(); this.renaming = false; SFX.play('ui'); this.render(); } },
      play: () => {
        const h = this.hero();
        if (!h) return;
        SFX.play('ui');
        if (app.p.active !== h.id) { setActive(app.p, h.id); app.save(); app.toasts.text(h.name, 'Back by the fire at the hearth.'); }
        app.showHearth();
      },
      gear: () => { const h = this.hero(); if (h) { SFX.play('ui'); app.sheets.open({ kind: 'gear', hero: h.id }); } },
      new: () => { SFX.play('ui'); app.showCreate(); },
      del: () => {
        const h = this.hero();
        if (!h || app.p.roster.length <= 1) { SFX.play('nope'); return; }
        if (!this.delArmed) { this.delArmed = true; SFX.play('ui'); this.render(); this.delTimer = window.setTimeout(() => { this.delArmed = false; this.render(); }, 4000); return; }
        this.disarm();
        const name = h.name;
        if (removeHero(app.p, h.id)) { this.sel = app.p.active; SFX.play('ui'); app.save(); app.toasts.text(`${name} has gone`, 'Their uniques stay in your collection.'); }
      },
      rename: () => { this.renaming = true; this.renameErr = ''; SFX.play('ui'); this.render(); },
      renamecancel: () => { this.renaming = false; this.render(); },
    });
    root.addEventListener('submit', (e) => {
      e.preventDefault();
      const h = this.hero();
      const input = root.querySelector<HTMLInputElement>('#cp-name');
      if (!h || !input) return;
      const why = nameProblem(app.p, input.value, h.id);
      if (why || !renameHero(app.p, h.id, input.value)) { this.renameErr = why || 'That name can’t be used'; SFX.play('nope'); this.render(); return; }
      this.renaming = false;
      SFX.play('place');
      app.save();
    });
  }

  private disarm(): void { this.delArmed = false; clearTimeout(this.delTimer); }
  private hero(): Hero | null { return heroById(this.app.p, this.sel) || activeHero(this.app.p); }

  /** open on a hero, or on the one you are playing */
  show(sel?: string): void {
    this.sel = sel || this.app.p.active;
    this.disarm(); this.renaming = false;
    this.render();
  }

  render(): void {
    const p = this.app.p;
    if (!heroById(p, this.sel)) this.sel = p.active;
    const r = this.root.getBoundingClientRect();
    const tall = r.width > 0 && r.width / Math.max(1, r.height) < 0.85;
    const room = p.roster.length < MAX_HEROES;
    const pos = slots(tall);
    const heroes = p.roster.map((h, i) => this.heroAt(h, pos[i])).join('');
    const ghost = room ? (() => { const s = pos[p.roster.length]; return `<button type="button" class="ch ghost" data-act="new" style="--x: ${s.x}%; --y: ${s.y}%; --k: ${s.k}; z-index: ${Math.round(s.y)}"><span class="ch-ring"></span><span class="ch-plus">${GLYPH.plus}</span><span class="ch-plate"><b>New hero</b><span>${p.roster.length} of ${MAX_HEROES}</span></span></button>`; })() : '';
    const sel = this.hero();
    this.root.className = `scene camp ${tall ? 'tall' : 'wide'}`;
    this.root.innerHTML = `
      ${SKY}
      <div class="camp-top">
        <button type="button" class="btn small" data-act="home">${GLYPH.left}Hearth</button>
        <div class="camp-title"><h2>Your heroes</h2><p>${p.roster.length} of ${MAX_HEROES}<span class="long"> · race and class are for keeps</span></p></div>
        ${room ? `<button type="button" class="btn small" data-act="new">${GLYPH.plus}<span class="long">New hero</span><span class="short">New</span></button>` : '<span></span>'}
      </div>
      <div class="camp-stage">
        <div class="camp-land">${HILLS}</div>
        ${heroes}${ghost}
        <div class="camp-fire" aria-hidden="true"><span class="fglow"></span>${FIRE}</div>
      </div>
      ${sel ? this.panel(sel) : ''}`;
    if (this.renaming) { const i = this.root.querySelector<HTMLInputElement>('#cp-name'); if (i) { i.focus(); i.select(); } }
  }

  private heroAt(h: Hero, s: Slot): string {
    const p = this.app.p, role = roleOf(h);
    const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
    const on = h.id === this.sel, playing = h.id === p.active;
    return `<button type="button" class="ch ${on ? 'sel' : ''}" data-act="pick" data-id="${esc(h.id)}" aria-pressed="${on}" style="--x: ${s.x}%; --y: ${s.y}%; --k: ${s.k}; z-index: ${Math.round(s.y)}; --light: ${race?.light || '#F4B942'}" aria-label="${esc(h.name)}, ${esc(race?.name || '')} ${esc(cls?.name || '')}${playing ? ', playing now' : ''}">
      <span class="ch-glow"></span><span class="ch-ring"></span>
      ${heroImg(heroSprite(h, role), { cls: 'ch-img' })}
      <span class="ch-plate"><b>${esc(h.name)}</b><span>${esc(cls?.name || h.cls)} · <i class="rdot ${role}"></i>${esc(cls?.roleName || ROLES[role].title)}</span>${playing ? '<em>Playing</em>' : ''}</span>
    </button>`;
  }

  private panel(h: Hero): string {
    const p = this.app.p, role = roleOf(h);
    const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
    const L = loadoutFor(p, h);
    const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
    const first = h.name.split(' ')[0];
    const nameRow = this.renaming
      ? `<form class="cp-rename" autocomplete="off"><label class="sr" for="cp-name">New name</label><input id="cp-name" maxlength="24" value="${esc(h.name)}" spellcheck="false"><button type="submit" class="btn small gold">${GLYPH.check}Save</button><button type="button" class="btn small" data-act="renamecancel">Cancel</button>${this.renameErr ? `<p class="err">${esc(this.renameErr)}</p>` : '<p class="fine">You can rename this hero once.</p>'}</form>`
      : `<div class="cp-name"><b>${esc(h.name)}</b>${title ? `<em>${esc(title)}</em>` : ''}</div>`;
    return `<div class="camp-panel" style="--light: ${race?.light || '#F4B942'}">
      ${nameRow}
      <p class="cp-sub"><i class="rdot ${role}" aria-hidden="true"></i>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · ${esc(cls?.roleName || ROLES[role].title)} · Item level ${ilvl(L.score)} · ${fmtN(h.clears)} clear${h.clears === 1 ? '' : 's'} · made ${fmtDate(h.createdAt)}</p>
      <div class="cp-actions">
        <button type="button" class="btn gold big" data-act="play">${GLYPH.play}${h.id === p.active ? 'Play' : `Play as ${esc(first)}`}</button>
        <button type="button" class="btn" data-act="gear">${GLYPH.shield}Gear</button>
        ${!h.named && !this.renaming ? `<button type="button" class="btn" data-act="rename">${GLYPH.pen}Rename</button>` : ''}
        ${p.roster.length > 1 ? `<button type="button" class="btn ${this.delArmed ? 'danger' : 'icon-only'}" data-act="del" aria-label="${this.delArmed ? `Tap again to delete ${esc(h.name)} for good` : `Delete ${esc(h.name)}`}">${GLYPH.trash}${this.delArmed ? `Delete ${esc(first)} for good?` : ''}</button>` : ''}
      </div>
    </div>`;
  }
}

/* ---------------------------------------------------------------- the night over the camp */
/** a campfire in the house style: a ring of stones, crossed logs and two flame frames that swap */
const FIRE = (() => {
  const K = '#1E1A1A';
  const sh = (d: string, fill: string, w = 4) => `<path d="${d}" style="fill: ${fill}; stroke: ${K}; stroke-width: ${w}; stroke-linejoin: round; stroke-linecap: round"/>`;
  const flame = 'M0 -104 C12 -84 32 -72 33 -46 C34 -18 19 0 0 0 C-19 0 -34 -17 -32 -42 C-31 -60 -19 -68 -14 -88 C-7 -76 -3 -72 0 -104 Z';
  const core = 'M3 -66 C11 -52 19 -43 17 -26 C15 -11 8 -5 0 -5 C-8 -5 -16 -12 -15 -27 C-14 -40 -5 -46 3 -66 Z';
  const frame = (cls: string, flip: boolean) => `<g class="${cls}"${flip ? ' transform="scale(-1 1)"' : ''}>${sh(flame, '#FF8A4C')}${sh(core, '#FFE08A', 3)}</g>`;
  const stones = [[-52, 6, 15, 10], [-30, 12, 14, 9], [-6, 14, 14, 9], [18, 13, 14, 9], [42, 9, 14, 9], [58, 2, 12, 9], [-62, -2, 11, 8]]
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" style="fill: #8C8098; stroke: ${K}; stroke-width: 3.5"/>`).join('');
  const logs = sh('M-50 -2 L40 -22 L46 -10 L-44 10 Z', '#8A5A34') + sh('M50 -2 L-40 -22 L-46 -10 L44 10 Z', '#6B4528') + `<ellipse cx="-47" cy="4" rx="5" ry="7" style="fill: #C9925A; stroke: ${K}; stroke-width: 3"/><ellipse cx="47" cy="4" rx="5" ry="7" style="fill: #C9925A; stroke: ${K}; stroke-width: 3"/>`;
  return `<svg viewBox="-80 -112 160 136" overflow="visible">${stones}<g transform="translate(0 -4)">${frame('fl-a', false)}${frame('fl-b', true)}</g>${logs}</svg>`;
})();
const stars = (): string => {
  let s = '', seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) s += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 560).toFixed(0)}" r="${(1.2 + r() * 2.2).toFixed(1)}" style="fill: #FFF8EC; opacity: ${(0.35 + r() * 0.6).toFixed(2)}"/>`;
  return s;
};
const SKY = `<svg class="camp-sky" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${stars()}
  <circle cx="1270" cy="150" r="90" style="fill: #F3E6CC; opacity: 0.12"/><circle cx="1270" cy="150" r="48" style="fill: #F3E6CC; stroke: #1E1A1A; stroke-width: 4"/>
  <circle cx="1254" cy="140" r="9" style="fill: #E2D2B0"/><circle cx="1284" cy="168" r="6" style="fill: #E2D2B0"/></svg>`;
/** the far hills, Highfell's lights on the hill, and the dark trees, sitting on the horizon */
const HILLS = (() => {
  const K = '#1E1A1A';
  const o: string[] = [];
  o.push(`<path d="M0 300 C160 230 300 250 420 210 C540 170 640 120 760 110 C880 100 980 170 1100 200 C1240 236 1380 200 1600 250 V320 H0 Z" style="fill: #2B2442; stroke: ${K}; stroke-width: 4"/>`);
  // Highfell: a market town on its hill, and the Last Lantern at the top
  const houses: [number, number, number][] = [[600, 168, 34], [646, 150, 30], [700, 130, 38], [752, 124, 30], [800, 132, 36], [850, 148, 30], [896, 166, 32]];
  for (const [x, y, w] of houses) {
    o.push(`<path d="M${x} ${y} h${w} v-${w * 0.8} l-${w / 2} -${w * 0.55} l-${w / 2} ${w * 0.55} Z" style="fill: #3A3150; stroke: ${K}; stroke-width: 3; stroke-linejoin: round"/>`);
    o.push(`<rect x="${x + w * 0.32}" y="${y - w * 0.55}" width="${w * 0.36}" height="${w * 0.3}" style="fill: #F4B942"/>`);
  }
  o.push(`<path d="M772 116 V40" style="stroke: ${K}; stroke-width: 6"/><circle cx="772" cy="34" r="30" style="fill: #F4B942; opacity: 0.25"/><path d="M762 26 h20 v18 h-20 Z" style="fill: #FFE08A; stroke: ${K}; stroke-width: 3"/>`);
  o.push(`<path d="M0 320 C200 290 360 300 520 286 C700 270 900 280 1080 290 C1260 300 1420 282 1600 296 V340 H0 Z" style="fill: #232B33; stroke: ${K}; stroke-width: 4"/>`);
  for (let i = 0; i < 26; i++) {
    const x = (i * 67 + (i % 3) * 19) % 1640 - 20, h = 50 + ((i * 37) % 40);
    if (x > 520 && x < 1080) continue;
    o.push(`<path d="M${x} 318 l${h * 0.32} -${h} l${h * 0.32} ${h} Z" style="fill: #1B2A26; stroke: ${K}; stroke-width: 3; stroke-linejoin: round"/>`);
  }
  return `<svg class="hills" viewBox="0 0 1600 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${o.join('')}</svg>`;
})();
