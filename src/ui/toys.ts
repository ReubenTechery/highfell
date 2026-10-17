/**
 * The close-ups: a gathering spot seen up close, one gesture at a time, three goes a harvest. Snip a
 * stem on the dotted line, pluck a glowcap as it sparkles (its brightest). Each Perfect puts one more in your
 * satchel, and every cut pays Gathering XP the moment it lands (the bar at the foot fills as you go).
 * If a pet dropped, the plant gives it away before you finish: the gathering walkout.
 *
 * Everything is drawn in the house style (one black line, flat colour) and animated by hand, so a
 * close-up is one SVG and a requestAnimationFrame loop. Keys work too: Space snips, 1 to 3 pluck.
 */
import type { NodeDef } from '../content/types';
import type { Grade, XpGain } from '../meta/vale';
import { esc, GLYPH, reducedMotion } from './dom';
import { placeSprite } from './art';
import { SFX } from './sound';
import { XpBar } from './xpbar';

/** onGrade pays the XP for a cut as it lands; xp is your Gathering XP when the close-up opens */
export interface ToyRun { node: NodeDef; shimmer: boolean; pet: string | null; xp: number; onGrade?: (g: Grade) => XpGain | null }
export interface ToyResult { perfects: number; goods: number; roughs: number }

const K = '#1E1A1A';
const ink = (fill: string, w = 4) => `fill: ${fill}; stroke: ${K}; stroke-width: ${w}; stroke-linejoin: round; stroke-linecap: round`;
const S = (d: string, fill: string, w = 4, extra = '') => `<path d="${d}" style="${ink(fill, w)}"${extra}/>`;
const L = (d: string, col = K, w = 3, extra = '') => `<path d="${d}" style="fill: none; stroke: ${col}; stroke-width: ${w}; stroke-linecap: round; stroke-linejoin: round"${extra}/>`;
const B = (d: string, col: string, w: number) => L(d, K, w + 5) + L(d, col, w);
const C = (x: number, y: number, r: number, fill: string, w = 4, extra = '') => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" style="${w ? ink(fill, w) : 'fill: ' + fill}"${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, w = 4, rot = 0) => `<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})" style="${w ? ink(fill, w) : 'fill: ' + fill}"/>`;
/** a sprite with its ground point at (x, y) */
const SPRITE = (name: string, x: number, y: number, k: number) => placeSprite(name, x, y, { k });

const BASE = { x: 200, y: 478 };
const BASKET = { x: 330, y: 500 };
const GRADE_WORD: Record<Grade, string> = { perfect: 'Perfect!', good: 'Good', rough: 'Rough', ouch: 'Ouch!' };
const GRADE_COL: Record<Grade, string> = { perfect: '#F2C230', good: '#FFF8EC', rough: '#C9BED6', ouch: '#FF6B5E' };
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Open a close-up over `host` and resolve when its three goes are done (or you leave early). */
export function playToy(host: HTMLElement, run: ToyRun): Promise<ToyResult> {
  return new Promise((resolve) => {
    const toy = run.node.toy === 'pluck' ? new Pluck(host, run, resolve) : new Snip(host, run, resolve);
    toy.start();
  });
}

/* ---------------------------------------------------------------- shared frame */
abstract class Toy {
  protected el: HTMLDivElement;
  protected svg!: SVGSVGElement;
  protected fx!: SVGGElement;
  protected raf = 0;
  protected t0 = 0;
  protected done = false;
  protected tally: ToyResult = { perfects: 0, goods: 0, roughs: 0 };
  protected step = 0;
  protected readonly quick = reducedMotion();
  private keyFn = (e: KeyboardEvent) => this.onKey(e);
  private bar: XpBar;

  constructor(protected host: HTMLElement, protected run: ToyRun, private resolve: (r: ToyResult) => void) {
    this.el = document.createElement('div');
    this.el.className = `toy ${run.shimmer ? 'shimmer' : ''}`;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', `${run.node.name}, up close`);
    this.bar = new XpBar(this.el, 'gather', 's_gather', run.xp);
  }
  abstract hint(): string;
  abstract scene(): string;
  abstract tick(t: number, dt: number): void;
  protected onKey(_e: KeyboardEvent): void { /* per toy */ }

  start(): void {
    this.el.innerHTML = `
      <div class="toy-head"><div><b>${esc(this.run.node.name)}</b>${this.run.shimmer ? '<em>Shimmering</em>' : ''}</div><span class="toy-step" id="toy-step">1 of 3</span>
        <button type="button" class="icon-btn toy-x" aria-label="Leave the close-up">${GLYPH.close}</button></div>
      <svg class="toy-stage" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${this.backdrop()}${this.scene()}${this.basket()}<g class="fxl"></g></svg>
      <p class="toy-hint">${esc(this.hint())}</p>
      <div class="toy-pips" aria-hidden="true"><i></i><i></i><i></i></div>${this.bar.html()}`;
    this.host.appendChild(this.el);
    this.bar.bind();
    this.svg = this.el.querySelector<SVGSVGElement>('svg.toy-stage')!;
    this.fx = this.svg.querySelector('.fxl') as SVGGElement;
    this.el.querySelector('.toy-x')!.addEventListener('click', () => this.finish(true));
    window.addEventListener('keydown', this.keyFn);
    let last = performance.now();
    this.t0 = last;
    const loop = (now: number) => {
      if (this.done) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      this.tick((now - this.t0) / 1000, dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    (this.el.querySelector('.toy-x') as HTMLElement).focus({ preventScroll: true });
  }

  /** a soft macro background: out-of-focus light behind the plant */
  backdrop(): string {
    const glow = this.run.node.look === 'cap' ? '#2E4A3A' : this.run.node.look === 'sprig' ? '#3E2E44' : '#2E3A5A';
    let o = `<defs><radialGradient id="toybg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="#141020"/></radialGradient></defs>`;
    o += `<rect x="-200" y="-200" width="800" height="960" style="fill: url(#toybg)"/>`;
    const bokeh: [number, number, number, string][] = [[60, 110, 46, '#FFF3C4'], [330, 80, 34, '#BDE8FF'], [300, 250, 58, '#9BE15D'], [80, 330, 30, '#FFF3C4'], [180, 60, 22, '#FFFFFF'], [360, 400, 40, '#F2C230']];
    for (const [x, y, r, c] of bokeh) o += `<circle cx="${x}" cy="${y}" r="${r}" style="fill: ${c}; opacity: 0.08"/>`;
    // the ground and a wicker basket
    o += S('M-40 560 V488 C40 470 120 462 200 462 C280 462 360 470 440 488 V560 Z', '#5A3E2A', 4);
    o += L('M10 500 C60 492 120 488 170 488 M240 494 C300 494 350 500 390 508', '#4A3222', 3);
    return o;
  }
  /** the wicker basket, in front of the plants */
  basket(): string {
    return `<g class="basket">${S(`M${BASKET.x - 50} ${BASKET.y - 30} H${BASKET.x + 50} L${BASKET.x + 40} ${BASKET.y + 26} H${BASKET.x - 40} Z`, '#C9925A', 4)}
      ${L(`M${BASKET.x - 46} ${BASKET.y - 12} H${BASKET.x + 46} M${BASKET.x - 43} ${BASKET.y + 6} H${BASKET.x + 43}`, '#9E6A3A', 3)}
      ${L(`M${BASKET.x - 30} ${BASKET.y - 30} L${BASKET.x - 24} ${BASKET.y + 26} M${BASKET.x} ${BASKET.y - 30} V${BASKET.y + 26} M${BASKET.x + 30} ${BASKET.y - 30} L${BASKET.x + 24} ${BASKET.y + 26}`, '#9E6A3A', 3)}
      <g class="basket-in"></g></g>`;
  }

  /** a grade lands: pips, a floating word, a sound */
  protected grade(g: Grade, x: number, y: number): void {
    if (g === 'perfect') this.tally.perfects++; else if (g === 'good') this.tally.goods++; else this.tally.roughs++;
    const pip = this.el.querySelectorAll('.toy-pips i')[this.step];
    if (pip) pip.className = g === 'ouch' ? 'rough' : g;
    this.float(GRADE_WORD[g], x, y - 20, GRADE_COL[g], g === 'perfect' ? 34 : 26);
    if (g === 'perfect') SFX.play('perfect', 0.6); else if (g === 'ouch') SFX.play('ouch');
    if (this.run.shimmer) { this.float('+ Starlight Dew', x, y + 14, '#BDE8FF', 18); SFX.play('dew', 0.7); }
    // the XP for this cut, right now
    const xp = this.run.onGrade?.(g);
    if (xp) { this.float(`+${xp.xp} XP`, x, y + (this.run.shimmer ? 46 : 16), '#9BE15D', 20, 'xp'); setTimeout(() => this.bar.gain(xp), this.quick ? 0 : 260); }
  }
  protected float(text: string, x: number, y: number, col: string, size: number, cls = ''): void {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(x)); t.setAttribute('y', String(y));
    t.setAttribute('class', `toy-word ${cls}`);
    t.setAttribute('style', `fill: ${col}; font-size: ${size}px`);
    t.textContent = text;
    this.fx.appendChild(t);
    setTimeout(() => t.remove(), 1100);
  }
  protected sparks(x: number, y: number, col: string, n = 10): void {
    if (this.quick) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 40;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(x)); c.setAttribute('cy', String(y)); c.setAttribute('r', String(2 + Math.random() * 3));
      c.setAttribute('style', `fill: ${col}; --dx: ${(Math.cos(a) * d).toFixed(1)}px; --dy: ${(Math.sin(a) * d - 20).toFixed(1)}px`);
      c.setAttribute('class', 'toy-spark');
      this.fx.appendChild(c);
      setTimeout(() => c.remove(), 700);
    }
  }
  /** something lands in the basket: it bounces and keeps a little token of it */
  protected toBasket(token: string): void {
    SFX.play('basket');
    const b = this.svg.querySelector('.basket') as SVGGElement;
    b.classList.remove('bump'); void b.getBoundingClientRect(); b.classList.add('bump');
    const inn = this.svg.querySelector('.basket-in')!;
    inn.insertAdjacentHTML('beforeend', `<g transform="translate(${BASKET.x - 28 + Math.random() * 56} ${BASKET.y - 32 - Math.random() * 8})">${token}</g>`);
  }
  protected setStep(): void { const s = this.el.querySelector('#toy-step'); if (s) s.textContent = `${Math.min(3, this.step + 1)} of 3`; }

  protected async finish(early = false): Promise<void> {
    if (this.done) return;
    this.done = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyFn);
    if (!early) await wait(this.quick ? 150 : 650);
    this.el.classList.add('out');
    setTimeout(() => this.el.remove(), 220);
    this.resolve(this.tally);
  }
  /** client point to stage point */
  protected pt(e: PointerEvent): { x: number; y: number } {
    const m = this.svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
}

/* ---------------------------------------------------------------- snip: cut the stem on the line */
class Snip extends Toy {
  private H = 300;
  private d0 = 150;
  private thorns: number[] = [];
  private angle = 0;
  private phase = Math.random() * 6;
  private cut: number | null = null;
  private rise = 1;
  private trail: { x: number; y: number; t: number }[] = [];
  private prev: { x: number; y: number } | null = null;
  private sprig = this.run.node.look === 'sprig';
  private falling: { el: SVGGElement; t: number; from: { x: number; y: number }; to: { x: number; y: number }; spin: number } | null = null;

  hint(): string { return this.sprig ? 'Swipe across the branch on the dotted line. Miss the thorns.' : 'Swipe across the stem on the dotted line.'; }

  scene(): string {
    return `<g class="tell"></g><g class="plant"></g><g class="falls"></g><path class="trail" d="" style="fill: none; stroke: #FFFFFF; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; opacity: 0.85"/>`;
  }
  start(): void {
    super.start();
    this.newStem();
    this.svg.addEventListener('pointerdown', (e) => { e.preventDefault(); try { this.svg.setPointerCapture(e.pointerId); } catch { /* fine */ } this.prev = this.pt(e); this.trail = [{ ...this.prev, t: performance.now() }]; });
    this.svg.addEventListener('pointermove', (e) => {
      if (!this.prev) return;
      const p = this.pt(e);
      this.trail.push({ ...p, t: performance.now() });
      this.tryCut(this.prev, p);
      this.prev = p;
    });
    const up = () => { this.prev = null; };
    this.svg.addEventListener('pointerup', up);
    this.svg.addEventListener('pointercancel', up);
  }

  private newStem(): void {
    const s = this.step;
    this.H = 290 + Math.random() * 40;
    this.d0 = this.H * (0.42 + Math.random() * 0.16);
    this.thorns = this.sprig ? [0.15, 0.29, 0.75, 0.88].map((f) => f * this.H) : [];
    this.cut = null;
    this.rise = 1;
    this.phase = Math.random() * 6;
    const plant = this.svg.querySelector('.plant')!;
    plant.innerHTML = `<g class="lo">${this.drawPlant()}</g>${this.guide()}`;
    // a pet in this harvest shows itself on the last stem, before you cut it
    const tell = this.svg.querySelector('.tell')!;
    tell.innerHTML = this.run.pet && s === 2 ? this.tellSvg() : '';
    this.setStep();
  }

  private drawPlant(): string {
    const H = this.H, sh = this.run.shimmer;
    let o = '';
    if (this.sprig) {
      o += B(`M0 6 C-7 ${-H * 0.4} 7 ${-H * 0.7} 0 ${-H}`, '#7A5238', 8);
      this.thorns.forEach((d, i) => { const sx = i % 2 ? 1 : -1; o += S(`M${sx * 3} ${-d + 7} L${sx * 22} ${-d - 4} L${sx * 3} ${-d - 6} Z`, '#4A3020', 3); });
      o += S(`M2 ${-H * 0.22} C22 ${-H * 0.22 - 8} 36 ${-H * 0.22 - 26} 30 ${-H * 0.22 - 34} C18 ${-H * 0.22 - 26} 8 ${-H * 0.22 - 16} 2 ${-H * 0.22} Z`, '#5E9A4A', 3.5);
      o += S(`M-2 ${-H * 0.8} C-22 ${-H * 0.8 - 6} -34 ${-H * 0.8 - 22} -30 ${-H * 0.8 - 30} C-18 ${-H * 0.8 - 24} -8 ${-H * 0.8 - 14} -2 ${-H * 0.8} Z`, '#5E9A4A', 3.5);
      const berries: [number, number][] = [[0, 0], [-16, 8], [16, 6], [-8, 22], [10, 22], [0, -16], [-18, -10], [18, -12]];
      for (const [x, y] of berries) o += C(x, -H + y - 6, 12, sh ? '#7A5AA8' : '#4A2A5A', 3.5) + C(x - 4, -H + y - 10, 3, sh ? '#E9DDFF' : '#8A5AA8', 0);
      o += S(`M0 ${-H - 24} C-8 ${-H - 40} 4 ${-H - 50} 14 ${-H - 46} C12 ${-H - 36} 6 ${-H - 30} 0 ${-H - 24} Z`, '#7DBE5C', 3);
    } else {
      o += B(`M0 6 C-5 ${-H * 0.35} 5 ${-H * 0.65} 0 ${-H}`, '#5E9A4A', 6);
      o += S(`M-2 ${-H * 0.2} C-26 ${-H * 0.2 - 6} -38 ${-H * 0.2 - 26} -32 ${-H * 0.2 - 36} C-18 ${-H * 0.2 - 28} -6 ${-H * 0.2 - 16} -2 ${-H * 0.2} Z`, '#7DBE5C', 3.5);
      o += S(`M2 ${-H * 0.8} C26 ${-H * 0.8 - 4} 38 ${-H * 0.8 - 22} 32 ${-H * 0.8 - 32} C18 ${-H * 0.8 - 24} 6 ${-H * 0.8 - 14} 2 ${-H * 0.8} Z`, '#7DBE5C', 3.5);
      for (let k = 0; k < 6; k++) {
        const a = k * 60;
        o += E(Math.sin((a * Math.PI) / 180) * 22, -H - Math.cos((a * Math.PI) / 180) * 22, 13, 24, sh ? '#F7FAFF' : '#EAF2FF', 3.5, a);
      }
      o += C(0, -H, 13, '#F2C230', 3.5) + C(-4, -H - 4, 3.5, '#FFF6D0', 0);
      if (sh) for (const [x, y] of [[-26, -16], [24, 10], [8, -30]] as [number, number][]) o += C(x, -H + y, 4, '#BDE8FF', 2.4);
    }
    if (sh) o += `<g class="glints">${[[-40, -0.9], [36, -0.7], [-30, -0.5], [44, -1.05]].map(([x, f]) => L(`M${x} ${f * H - 8} V${f * H + 8} M${x - 8} ${f * H} H${x + 8}`, '#FFF3C4', 3)).join('')}</g>`;
    return o;
  }
  private guide(): string {
    const y = -this.d0;
    return `<g class="guide">${L(`M-42 ${y} H42`, '#FFFFFF', 3, ' stroke-dasharray="7 7"')}
      ${S(`M-52 ${y - 7} L-42 ${y} L-52 ${y + 7} Z`, '#FFFFFF', 2.5)}${S(`M52 ${y - 7} L42 ${y} L52 ${y + 7} Z`, '#FFFFFF', 2.5)}</g>`;
  }
  private tellSvg(): string {
    if (this.run.pet === 'pet.thimble') return `<g transform="translate(${BASE.x - 96} ${BASE.y - 10})"><g class="peek">${S('M-26 0 C-28 -14 -20 -26 -6 -28 L0 -36 L6 -26 L14 -32 L16 -22 C24 -18 28 -10 26 0 Z', '#7A5238', 3.5)}${C(-6, -30, 3.5, '#4A2A5A', 2)}</g></g>`;
    // a rootling's leaves poking out of the soil, wriggling
    return `<g transform="translate(${BASE.x - 70} ${BASE.y - 8})"><g class="peek">${S('M0 0 C-10 -14 -12 -26 -6 -30 C-2 -22 0 -12 0 0 Z', '#7DBE5C', 3)}${S('M2 0 C8 -16 18 -22 24 -18 C20 -10 12 -4 2 0 Z', '#7DBE5C', 3)}</g></g>`;
  }

  private tryCut(a: { x: number; y: number }, b: { x: number; y: number }): void {
    if (this.cut !== null || this.done || this.rise > 0.05) return;
    // the segment in the plant's own frame: base at the origin, stem straight up
    const ang = (-this.angle * Math.PI) / 180;
    const loc = (p: { x: number; y: number }) => { const dx = p.x - BASE.x, dy = p.y - BASE.y; return { x: dx * Math.cos(ang) - dy * Math.sin(ang), y: dx * Math.sin(ang) + dy * Math.cos(ang) }; };
    const p = loc(a), q = loc(b);
    if ((p.x > 0) === (q.x > 0) || p.x === q.x) return;
    const t = p.x / (p.x - q.x);
    const y = p.y + t * (q.y - p.y);
    const d = -y;
    if (d < 16 || d > this.H - 20) return;
    this.doCut(d);
  }

  private doCut(d: number): void {
    this.cut = d;
    const off = Math.abs(d - this.d0);
    let g: Grade = off <= 9 ? 'perfect' : off <= 24 ? 'good' : 'rough';
    if (this.thorns.some((t) => Math.abs(d - t) <= 9)) g = 'ouch';
    SFX.play('snip'); SFX.play('crunch', 0.7);
    // split the plant at the cut: the stub stays, the top falls into the basket
    const plant = this.svg.querySelector('.plant') as SVGGElement;
    const lo = plant.querySelector('.lo') as SVGGElement;
    const top = lo.cloneNode(true) as SVGGElement;
    const id = 'cut' + Date.now();
    const defs = this.svg.querySelector('defs')!;
    defs.insertAdjacentHTML('beforeend', `<clipPath id="${id}a"><rect x="-200" y="${-d}" width="400" height="${d + 40}"/></clipPath><clipPath id="${id}b"><rect x="-200" y="-600" width="400" height="${600 - d}"/></clipPath>`);
    lo.setAttribute('clip-path', `url(#${id}a)`);
    top.setAttribute('clip-path', `url(#${id}b)`);
    plant.querySelector('.guide')?.remove();
    // the falling part travels in stage space from where the cut is now
    const rad = (this.angle * Math.PI) / 180;
    const from = { x: BASE.x + Math.sin(rad) * d, y: BASE.y - Math.cos(rad) * d };
    const fall = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    inner.setAttribute('transform', `rotate(${this.angle.toFixed(1)}) translate(0 ${d})`);
    inner.appendChild(top);
    fall.appendChild(inner);
    this.svg.querySelector('.falls')!.appendChild(fall);
    this.falling = { el: fall, t: 0, from, to: { x: BASKET.x + (Math.random() * 20 - 10), y: BASKET.y - 30 }, spin: (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 80) };
    // a white streak where the blades met
    this.fx.insertAdjacentHTML('beforeend', `<path class="slash" d="M${from.x - 46} ${from.y + 8} L${from.x + 46} ${from.y - 8}" style="fill: none; stroke: #FFFFFF; stroke-width: 5; stroke-linecap: round"/>`);
    setTimeout(() => this.fx.querySelector('.slash')?.remove(), 160);
    this.sparks(from.x, from.y, this.sprig ? '#8A5AA8' : '#B8E6A0', 8);
    this.grade(g, from.x, from.y);
  }

  tick(t: number, dt: number): void {
    // sway: a breeze, a little stronger each stem
    if (this.cut === null) this.angle = Math.sin(t * (1.2 + this.step * 0.25) + this.phase) * (4 + this.step * 3.2);
    if (this.rise > 0) this.rise = Math.max(0, this.rise - dt / 0.35);
    const plant = this.svg.querySelector('.plant') as SVGGElement | null;
    const yOff = this.quick ? 0 : this.rise * this.rise * this.H;
    plant?.setAttribute('transform', `translate(${BASE.x} ${BASE.y + yOff}) rotate(${this.angle.toFixed(2)})`);
    // the swipe trail fades behind your finger
    const now = performance.now();
    this.trail = this.trail.filter((p) => now - p.t < 140);
    const tr = this.svg.querySelector('.trail') as SVGPathElement | null;
    if (tr) tr.setAttribute('d', this.trail.length > 1 ? 'M' + this.trail.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L') : '');
    const f = this.falling;
    if (f) {
      f.t += dt / (this.quick ? 0.2 : 0.62);
      const k = Math.min(1, f.t);
      const x = f.from.x + (f.to.x - f.from.x) * k;
      const y = f.from.y + (f.to.y - f.from.y) * k - Math.sin(k * Math.PI) * 90;
      f.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(f.spin * k).toFixed(1)}) scale(${(1 - 0.62 * k).toFixed(3)})`);
      if (k >= 1) {
        f.el.remove();
        this.falling = null;
        this.toBasket(this.sprig ? C(0, 0, 7, '#4A2A5A', 2.5) + C(9, 3, 6, '#4A2A5A', 2.5) : C(0, 0, 9, '#EAF2FF', 2.5) + C(0, 0, 3.5, '#F2C230', 0));
        this.next();
      }
    }
  }

  private async next(): Promise<void> {
    const last = this.step >= 2;
    if (last && this.run.pet) await this.petOut();
    this.step++;
    if (this.step >= 3) { void this.finish(); return; }
    await wait(this.quick ? 50 : 160);
    this.newStem();
  }
  /** the pet gives itself away: it pops out of the soil, squeaks, and hops in the basket */
  private async petOut(): Promise<void> {
    const pet = this.run.pet!;
    const sprite = pet === 'pet.rootling' ? 'pet_rootling' : pet === 'pet.thimble' ? 'pet_thimble' : 'pet_puffcap';
    this.svg.querySelector('.tell')!.innerHTML = '';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'pet-pop');
    g.innerHTML = SPRITE(sprite, 0, 0, 1.15);
    g.setAttribute('transform', `translate(${BASE.x - 76} ${BASE.y + 30})`);
    this.fx.appendChild(g);
    SFX.play('squeak'); setTimeout(() => SFX.play('squeak', 0.8), 260);
    const steps = this.quick ? 1 : 26;
    for (let i = 1; i <= steps; i++) { const k = i / steps; g.setAttribute('transform', `translate(${BASE.x - 76} ${BASE.y + 30 - Math.sin(k * Math.PI * 0.5) * 50})`); await wait(16); }
    this.float('?!', BASE.x - 76, BASE.y - 110, '#9BE15D', 40);
    await wait(this.quick ? 100 : 700);
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      g.setAttribute('transform', `translate(${(BASE.x - 76 + (BASKET.x - BASE.x + 76) * k).toFixed(1)} ${(BASE.y - 20 + (BASKET.y - 30 - BASE.y + 20) * k - Math.sin(k * Math.PI) * 80).toFixed(1)}) scale(${(1 - 0.4 * k).toFixed(2)})`);
      await wait(16);
    }
    g.remove();
    this.toBasket(SPRITE(sprite, 0, 6, 0.42));
  }

  protected onKey(e: KeyboardEvent): void {
    if ((e.key === ' ' || e.key === 'Enter') && this.cut === null && this.rise <= 0.05) { e.preventDefault(); this.doCut(this.d0 + (Math.random() * 30 - 15)); }
    if (e.key === 'Escape') { e.preventDefault(); void this.finish(true); }
  }
}

/* ---------------------------------------------------------------- pluck: pick each glowcap as it sparkles */
interface Cap { x: number; h: number; period: number; phase: number; plucked: boolean; g: number; peaked: boolean; walker: boolean }
/** how bright a glowcap is when you pick it (0 to 1): a Perfect from PERFECT, while it sparkles, and a Good from GOOD */
const PERFECT = 0.86, GOOD = 0.55;
/** a four-point sparkle centred on (x, y) */
const SPARKLE = (x: number, y: number, r: number, fill: string): string => {
  const q = r * 0.26;
  return S(`M${x} ${y - r} Q${x + q} ${y - q} ${x + r} ${y} Q${x + q} ${y + q} ${x} ${y + r} Q${x - q} ${y + q} ${x - r} ${y} Q${x - q} ${y - q} ${x} ${y - r} Z`, fill, 3);
};
class Pluck extends Toy {
  private caps: Cap[] = [];

  /** said so you can see it: a glowcap sparkles exactly while a tap is a Perfect (a play tester didn't know what
   *  "its brightest" looked like, 18 Oct) */
  hint(): string { return 'Tap each glowcap as it sparkles.'; }
  scene(): string {
    const caps: Cap[] = [95, 200, 305].map((x, i) => ({ x, h: [96, 128, 104][i], period: [1.7, 1.35, 2.0][i], phase: Math.random() * 6, plucked: false, g: 0, peaked: false, walker: !!this.run.pet && i === 1 }));
    this.caps = caps;
    let o = S('M-20 470 C40 440 120 432 200 434 C290 436 360 444 420 470 V520 H-20 Z', '#3E6A34', 4);
    o += L('M30 452 C60 446 90 444 120 444 M260 446 C300 448 340 452 370 458', '#2E5A2A', 3);
    caps.forEach((c, i) => {
      const capCol = this.run.shimmer ? '#D8F57A' : '#9BE15D';
      o += `<g class="cap" data-i="${i}" transform="translate(${c.x} 448)">
        <circle class="halo" cx="0" cy="${-c.h}" r="62" style="fill: ${this.run.shimmer ? '#F2C230' : '#9BE15D'}; opacity: 0"/>
        <g class="body">${c.walker ? E(-10, -2, 9, 5, '#E8D5B8', 3) + E(10, -2, 9, 5, '#E8D5B8', 3) : ''}
          ${S(`M-13 0 C-15 ${-c.h * 0.4} -12 ${-c.h * 0.8} -9 ${-c.h} H9 C12 ${-c.h * 0.8} 15 ${-c.h * 0.4} 13 0 Z`, '#F0E8D2', 4)}
          ${c.walker ? `<g class="blink">${C(-6, -c.h * 0.55, 4, '#FFFFFF', 2.5)}${C(6, -c.h * 0.55, 4, '#FFFFFF', 2.5)}${C(-6, -c.h * 0.55 + 1, 2, K, 0)}${C(6, -c.h * 0.55 + 1, 2, K, 0)}</g>` : ''}
          <path class="capfill" d="M-46 ${-c.h} C-46 ${-c.h - 44} 46 ${-c.h - 44} 46 ${-c.h} C30 ${-c.h + 8} -30 ${-c.h + 8} -46 ${-c.h} Z" style="${ink(capCol, 4.5)}"/>
          ${C(-20, -c.h - 18, 6, '#E9FFD9', 0)}${C(8, -c.h - 28, 7, '#E9FFD9', 0)}${C(26, -c.h - 12, 5, '#E9FFD9', 0)}
          ${L(`M-32 ${-c.h - 14} C-24 ${-c.h - 30} -10 ${-c.h - 36} 4 ${-c.h - 36}`, '#FFFFFF', 3)}</g>
        <g class="ping" style="opacity: 0">${SPARKLE(0, -c.h - 64, 15, '#FFF3C4')}${SPARKLE(-50, -c.h - 22, 9, '#FFF3C4')}${SPARKLE(50, -c.h - 38, 8, '#FFF3C4')}</g>
        <rect x="-60" y="${-c.h - 70}" width="120" height="${c.h + 80}" style="fill: transparent"/>
      </g>`;
    });
    return o;
  }
  start(): void {
    super.start();
    this.svg.querySelectorAll<SVGGElement>('.cap').forEach((g) => g.addEventListener('pointerdown', (e) => { e.preventDefault(); this.pluck(+g.dataset.i!); }));
  }
  tick(t: number): void {
    this.caps.forEach((c, i) => {
      if (c.plucked) return;
      const g = 0.5 - 0.5 * Math.cos((t / c.period) * Math.PI * 2 + c.phase);
      c.g = g;
      const el = this.svg.querySelector(`.cap[data-i="${i}"]`) as SVGGElement;
      if (!el) return;
      // dark for most of its turn and lit up near the top, so the moment stands out; it sparkles (and twinkles)
      // the whole time a tap would be a Perfect
      const lit = g * g, now = g >= PERFECT;
      (el.querySelector('.halo') as SVGElement).style.opacity = (lit * 0.7).toFixed(3);
      (el.querySelector('.halo') as SVGElement).setAttribute('r', (38 + lit * 38).toFixed(1));
      const fill = this.run.shimmer ? mix('#6E7A2E', '#FFF6A8', lit) : mix('#2E5A2E', '#E4FFB0', lit);
      (el.querySelector('.capfill') as SVGElement).style.fill = fill;
      (el.querySelector('.ping') as SVGElement).style.opacity = now ? '1' : '0';
      if (now && !c.peaked) { c.peaked = true; SFX.play('twinkle', 0.5); }
      if (g < GOOD) c.peaked = false;
    });
  }
  private async pluck(i: number): Promise<void> {
    const c = this.caps[i];
    if (!c || c.plucked || this.done) return;
    c.plucked = true;
    const g: Grade = c.g >= PERFECT ? 'perfect' : c.g >= GOOD ? 'good' : 'rough';
    SFX.play('pluck');
    const el = this.svg.querySelector(`.cap[data-i="${i}"]`) as SVGGElement;
    (el.querySelector('.halo') as SVGElement).style.opacity = '0';
    (el.querySelector('.ping') as SVGElement).style.opacity = '0';
    this.sparks(c.x, 448 - c.h, this.run.shimmer ? '#F2C230' : '#C8FF8A', 12);
    this.grade(g, c.x, 448 - c.h - 40);
    this.step++;
    this.setStep();
    const body = el.querySelector('.body') as SVGGElement;
    if (c.walker) await this.walkOff(el, c);
    else {
      const steps = this.quick ? 1 : 30;
      for (let s = 1; s <= steps; s++) {
        const k = s / steps;
        const x = (BASKET.x - c.x) * k, y = (BASKET.y - 20 - 448) * k - Math.sin(k * Math.PI) * 120 - (k < 0.2 ? k * 100 : 0);
        body.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(k * 200).toFixed(1)} 0 ${-c.h}) scale(${(1 - 0.6 * k).toFixed(2)})`);
        await wait(16);
      }
      el.remove();
      this.toBasket(S('M-10 0 C-10 -12 10 -12 10 0 Z', '#9BE15D', 2.5) + L('M0 0 V7', '#F0E8D2', 3));
    }
    if (this.caps.every((x) => x.plucked)) void this.finish();
  }
  /** the Puffcap gives itself away: it has feet, and it walks to the basket on its own */
  private async walkOff(el: SVGGElement, c: Cap): Promise<void> {
    SFX.play('squeak');
    this.float('?!', c.x, 448 - c.h - 70, '#9BE15D', 40);
    const steps = this.quick ? 1 : 60;
    for (let s = 1; s <= steps; s++) {
      const k = s / steps;
      el.setAttribute('transform', `translate(${(c.x + (BASKET.x - c.x) * k).toFixed(1)} ${(448 + (BASKET.y - 448) * k - Math.abs(Math.sin(k * Math.PI * 6)) * 10).toFixed(1)}) scale(${(1 - 0.5 * k).toFixed(2)})`);
      await wait(16);
    }
    el.remove();
    this.toBasket(SPRITE('pet_puffcap', 0, 6, 0.4));
  }
  protected onKey(e: KeyboardEvent): void {
    const n = ['1', '2', '3'].indexOf(e.key);
    if (n >= 0) { e.preventDefault(); void this.pluck(n); }
    if (e.key === 'Escape') { e.preventDefault(); void this.finish(true); }
  }
}

/** mix two #RRGGBB colours */
function mix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
