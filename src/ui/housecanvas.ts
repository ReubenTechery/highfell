/**
 * The house on screen: one canvas the game draws itself, the way a run is drawn, instead of layers of the page
 * for the browser to put together. As layers (a picture of the back, the scene as live SVG, the bits that move,
 * the light), a phone re-layered the house every time the camera started or stopped, ran out of graphics memory
 * and dropped whole frames: the screen flashed black, or the house showed half drawn. Each frame is now drawn
 * here, in the house's order: the back, each thing you tap (with its gold ring when it's hovered, focused or the
 * tour's), the bits that move (housemotion.ts), the rooms' light, the pips. The pictures are made in housepaint.ts.
 * The layer you tap stays in the page, see-through, under the camera as before, so taps, keys and screen readers
 * work on it as they always have. Until the canvas has its first frame (opening the game), the old layers stand
 * in, still, so the house is never missing; then they're emptied. A changed scene (a save) goes on the canvas
 * all at once, when its new pieces are drawn, so nothing blinks out while they are.
 */
import { BACKDROP, HOUSE_BOUNDS, HOUSE_FIT } from './houseart';
import { bitsHtml, type Bit } from './art';
import type { Camera } from './camera';
import { reducedMotion } from './dom';
import { motion, type Motion } from './housemotion';
import { Picture, Sprites, Work, labelsOf, sceneCss, type Label, type Rect, type SpriteDef } from './housepaint';

/** something you tap: its group in the layer you tap, its sprite (null if nothing of it shows), and its ring */
interface Item { el: Element; d: SpriteDef | null; ring: { x: number; y: number; w: number; h: number; rx: number } | null; tour: boolean }
/** a bit that moves: when it was first drawn (seconds on the house's clock), and its motion this frame, the
 *  rect that covers it there and the pose it was last drawn in */
interface Mover { bit: Bit; d: SpriteDef; born: number; mo?: Motion | null; at?: Rect | null; pose?: string }
/** what's on the canvas: the things you tap, the house's own bits, the scene's bits, the pips */
interface Scene { items: Item[]; fx: Mover[]; bits: Mover[]; pips: Mover[] }
type Kind = 'fx' | 'bits' | 'pips';
/** the house's layers in the page: the world the camera moves, the layer you tap, and the ones that stand in */
export interface HouseLayers { world: HTMLElement; svg: SVGSVGElement; back: SVGSVGElement; front: SVGSVGElement; fx: HTMLElement; bits: HTMLElement; pips: HTMLElement }

const rectOf = ([x0, y0, x1, y1]: [number, number, number, number]): Rect => [x0, y0, x1 - x0, y1 - y0];
/** a box grown by `p` all round, out to whole units */
const grow = ([x, y, w, h]: Rect, p: number): Rect => {
  const x0 = Math.floor(x - p), y0 = Math.floor(y - p);
  return [x0, y0, Math.ceil(x + w + p) - x0, Math.ceil(y + h + p) - y0];
};
const meets = (a: Rect, b: Rect): boolean => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
const [X0, Y0] = HOUSE_BOUNDS;
/** how long a changed scene waits for its new pieces before it goes on anyway, in ms */
const SWAP_WAIT = 600;

export class HouseCanvas {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  /** the gradients and clips the standing-in layers share, and a hidden SVG to read a bit's label style in */
  private defsEl: SVGSVGElement;
  private measureEl: SVGSVGElement;
  private work: Work;
  private back: Picture;
  private light: Picture;
  private sprites: Sprites;
  private now: Scene = { items: [], fx: [], bits: [], pips: [] };
  /** a changed scene, waiting for its new pieces to be drawn, and when it goes on anyway */
  private next: Scene | null = null;
  private nextBy = 0;
  /** each kind of mover's markup, last time, so a save that changes nothing changes nothing here */
  private had: Record<Kind, string> = { fx: '', bits: '', pips: '' };
  private defs = '';
  private deco = false;
  /** the canvas has drawn its first frame (the old layers have stopped standing in) */
  private ready = false;
  private readyBy = 0;
  private awake = false;
  private raf = 0;
  /** the house's clock starts as it comes on screen: coming home, the birds are 8s along again */
  private t0 = performance.now();
  private lastMove = 0;
  private lastDraw = 0;
  private dirty = true;
  private fading = false;
  /** whether the camera was at rest at the last frame, and the parts of the house to draw again in the next */
  private rested = false;
  private marks: Rect[] = [];
  /** a thing you tap couldn't be measured (the house wasn't laid out): read the layer again when it is */
  private unread = false;
  /** what the mouse is over, and what has the keyboard's focus */
  private hot: Element | null = null;
  private focused: Element | null = null;
  /** screen pixels per CSS pixel (a 3x phone draws at 2x, like the dungeon), and the whole-house sharpness */
  private d = 1;
  private kWhole = 0;

  constructor(private root: HTMLElement, private cam: Camera, private layer: HouseLayers) {
    this.cv = document.createElement('canvas');
    this.cv.className = 'h-canvas';
    this.cv.setAttribute('aria-hidden', 'true');
    root.prepend(this.cv);
    this.ctx = this.cv.getContext('2d');
    const svg = (cls: string): SVGSVGElement => {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', cls); s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true');
      return s;
    };
    this.defsEl = svg('h-defs');
    layer.world.insertBefore(this.defsEl, layer.back);
    this.measureEl = svg('h-measure');
    root.append(this.measureEl);
    // before the first frame, the work goes as fast as it can: the layers standing in don't move
    this.work = new Work((urgent) => this.awake && (urgent || !this.ready || this.still(performance.now())), () => (this.ready ? 8 : 40));
    const drawn = (): void => { this.dirty = true; this.check(); };
    this.back = new Picture(this.work, { drawn });
    this.light = new Picture(this.work, { soft: true, drawn });
    // a sprite's new copy is drawn where it shows, not the whole house
    this.sprites = new Sprites(this.work, (d) => {
      const s = this.now, mv = [...s.fx, ...s.bits, ...s.pips].find((m) => m.d === d);
      this.marks.push(mv?.at || d.r);
      this.check();
    });
    const item = (e: Event): Element | null => (e.target as Element).closest?.('.house > g') ?? null;
    layer.svg.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') { this.hot = item(e); this.dirty = true; } });
    layer.svg.addEventListener('pointerout', (e) => {
      if (e.pointerType !== 'mouse' || (e.relatedTarget instanceof Element && this.hot?.contains(e.relatedTarget))) return;
      this.hot = null; this.dirty = true;
    });
    layer.svg.addEventListener('focusin', (e) => { const el = item(e); this.focused = el && keyed(el) ? el : null; this.dirty = true; });
    layer.svg.addEventListener('focusout', () => { this.focused = null; this.dirty = true; });
    // a phone that resets its graphics (the app left in the background a long while) loses the bitmaps with them
    this.cv.addEventListener('contextrestored', () => {
      this.back.redo(); this.light.redo(); this.sprites.redo();
      this.forget();
      this.dirty = true;
    });
    document.addEventListener('visibilitychange', () => { this.dirty = true; });
  }

  /** The looks changed: new markup for the back (behind what you tap), the rooms' light (over it all), and the
   *  bits that move in the house itself (the fire, the smoke, the birds). `defs`: the gradients and clips they use. */
  setBack(defs: string, back: string, light: string, fx: Bit[]): void {
    this.defs = defs;
    this.back.set(defs, back, rectOf(BACKDROP));
    this.light.set(defs, light, rectOf(HOUSE_FIT));
    this.change({ fx: this.movers(fx, 'fx') });
    if (this.ready) return;
    this.defsEl.innerHTML = `<defs>${defs}</defs>`;
    this.layer.back.innerHTML = back;
    this.layer.front.innerHTML = light;
    this.layer.fx.innerHTML = bitsHtml(fx, X0, Y0);
  }

  /** The scene was drawn (hearth.ts): the layer you tap (`changed`: its markup is new), the bits that move in it
   *  (in the order they're drawn) and the pips. Read after the layer's `deco` class is set. */
  setScene(bits: Bit[], pips: Bit[], changed: boolean): void {
    const deco = this.layer.svg.classList.contains('deco');
    const fresh = changed || deco !== this.deco || !this.now.items.length;
    this.deco = deco;
    this.change({ ...(fresh ? { items: this.readItems() } : {}), bits: this.movers(bits, 'bits'), pips: this.movers(pips, 'pips') });
    if (this.ready) return;
    this.layer.bits.innerHTML = bitsHtml(bits, X0, Y0);
    this.layer.pips.innerHTML = bitsHtml(pips, X0, Y0);
  }

  /** The whole-house zoom is `z`: the whole pictures cover `back` (all the camera can show) and the house, sharp
   *  enough for that zoom with a little to spare, and every sprite gets a copy that sharp. */
  whole(back: Rect, z: number): void {
    const k = z * this.d * 1.25;
    this.kWhole = k;
    this.sprites.base = k;
    this.back.whole(back, k);
    this.light.whole(rectOf(HOUSE_FIT), k);
    for (const d of this.allDefs()) this.sprites.want(d, k);
  }

  /** The camera moved: draw now, so the canvas keeps step with the signs and the name tag. */
  view(): void {
    this.lastMove = performance.now();
    this.dirty = true;
    this.draw(this.lastMove);
  }

  /** The screen changed size, or the house came on screen. */
  resize(): void {
    this.d = Math.min(2, window.devicePixelRatio || 1);
    if (!this.awake || this.cam.w < 2) return;
    const w = Math.round(this.cam.w * this.d), h = Math.round(this.cam.h * this.d);
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; this.dirty = true; }
  }

  /** The house is on screen: start drawing (the house's clock starts again). */
  wake(): void {
    if (this.awake) return;
    this.awake = true;
    this.t0 = performance.now();
    for (const s of [this.now, this.next]) for (const m of s ? [...s.fx, ...s.bits, ...s.pips] : []) m.born = 0;
    this.resize();
    this.dirty = true;
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }
  /** The house is off screen (a run, the cauldron): stop, and let the sharp pictures and the canvas go. */
  sleep(): void {
    if (!this.awake) return;
    this.awake = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.back.sleep();
    this.light.sleep();
    this.sprites.trim(Infinity);
    this.cv.width = 0; this.cv.height = 0;
  }
  /** the display font has arrived: the labels are written again in it */
  fonts(): void { this.sprites.fonts(); }

  /* ---------------------------------------------------------------- drawing */
  private loop = (now: number): void => {
    this.raf = 0;
    if (!this.awake) return;
    if (this.unread && this.root.offsetParent) { this.unread = false; this.change({ items: this.readItems() }); }
    this.check();
    const gap = now - this.lastDraw;
    // a moving camera draws as it moves (view); held still, the bits move at 30 frames a second
    if (gap > 8 && (this.dirty || this.fading || this.marks.length || (gap >= 31 && !reducedMotion()))) this.draw(now);
    this.work.kick();
    this.raf = requestAnimationFrame(this.loop);
  };
  /** no finger down, no flight, and no move for a moment: work can be done, and what's soft drawn sharp */
  private still(now: number): boolean { return !this.cam.busy && now - this.lastMove > 120; }
  /** what the camera shows, in house units */
  private shown(): Rect { const { cx, cy, w, h, z } = this.cam; return [cx - w / 2 / z, cy - h / 2 / z, w / z, h / z]; }

  /** Draw the house as it is now. Everything is drawn when the camera has moved or something new has arrived;
   *  otherwise only round the bits that have moved since the last frame (a breath, a flicker), which is most of
   *  the time: the house standing still costs next to nothing. */
  private draw(now: number): void {
    const c = this.ctx;
    if (!c || !this.ready || !this.awake || !this.cv.width) return;
    this.lastDraw = now;
    const rest = this.still(now), t = (now - this.t0) / 1000, calm = reducedMotion(), s = this.now, view = this.shown();
    // coming to rest, everything is drawn once more, so what's soft on screen is asked for sharp
    if (rest !== this.rested) { this.rested = rest; if (rest) this.dirty = true; }
    const moved: Rect[] = [];
    for (const mv of [...s.fx, ...s.bits, ...s.pips]) {
      const mo = motion(mv.bit.cls, mv.bit.box, t, mv.born, calm), at = mo ? spread(mv.d.r, mo.m) : null, pose = mo ? `${mo.a.toFixed(3)} ${mo.m.map((v) => v.toFixed(2)).join(' ')}` : '';
      if (pose !== mv.pose) { if (mv.at) moved.push(mv.at); if (at) moved.push(at); }
      mv.mo = mo; mv.at = at; mv.pose = pose;
    }
    const parts = this.dirty || this.fading ? null : merge([...moved, ...this.marks].filter((r) => meets(r, view)));
    this.marks = [];
    if (parts && parts.reduce((a, r) => a + r[2] * r[3], 0) < view[2] * view[3] * 0.4) { for (const r of parts) this.frame(c, now, r); return; }
    this.frame(c, now, null);
    // at rest, after a whole frame (every sprite on screen has just been used): sharpen what's soft, let go of the rest
    if (rest) { this.back.sharp(view, this.cam.z * this.d); this.sprites.trim(now); }
  }
  /** Draw everything, or just what's in `part` (house units): the back, the things you tap and their rings, the
   *  bits, the light, the pips. */
  private frame(c: CanvasRenderingContext2D, now: number, part: Rect | null): void {
    const cam = this.cam, d = this.d, k = cam.z * d, rest = this.still(now), calm = reducedMotion(), s = this.now;
    const m: [number, number, number, number, number, number] = [k, 0, 0, k, d * (cam.w / 2 - cam.cx * cam.z), d * (cam.h / 2 - cam.cy * cam.z)];
    let view = this.shown();
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (part) {
      // whole screen pixels round the part, so its edges never cut a pixel in two
      const x0 = Math.floor(part[0] * k + m[4]) - 1, y0 = Math.floor(part[1] * k + m[5]) - 1;
      const x1 = Math.ceil((part[0] + part[2]) * k + m[4]) + 1, y1 = Math.ceil((part[1] + part[3]) * k + m[5]) + 1;
      c.save();
      c.beginPath();
      c.rect(x0, y0, x1 - x0, y1 - y0);
      c.clip();
      c.clearRect(x0, y0, x1 - x0, y1 - y0);
      view = [(x0 - m[4]) / k, (y0 - m[5]) / k, (x1 - x0) / k, (y1 - y0) / k];
    } else {
      this.dirty = false;
      c.clearRect(0, 0, this.cv.width, this.cv.height);
    }
    c.setTransform(...m);
    let fading = this.back.draw(c, now, calm, view);
    const dragging = this.root.classList.contains('dragging');
    for (const it of s.items) {
      if (it.d && meets(it.d.r, view)) this.sprite(c, it.d, k, rest, now);
      const a = it.tour || it.el === this.focused ? 0.14 : it.el === this.hot && !dragging ? 0.1 : 0;
      if (a && it.ring && meets(grow([it.ring.x, it.ring.y, it.ring.w, it.ring.h], 4), view)) ring(c, it.ring, a);
    }
    for (const mv of [...s.fx, ...s.bits]) this.mover(c, mv, m, view, k, rest, now);
    fading = this.light.draw(c, now, calm, view) || fading;
    for (const mv of s.pips) this.mover(c, mv, m, view, k, rest, now);
    if (part) c.restore();
    else this.fading = fading;
  }
  private sprite(c: CanvasRenderingContext2D, d: SpriteDef, k: number, rest: boolean, now: number): void {
    const b = this.sprites.get(d, k, now);
    if (rest && (!b || b.k < k * 0.9)) this.sprites.want(d, k);
    if (b) c.drawImage(b.src, d.r[0], d.r[1], d.r[2], d.r[3]);
  }
  /** a bit, where its motion has it this frame (worked out in draw) */
  private mover(c: CanvasRenderingContext2D, mv: Mover, m: number[], view: Rect, k: number, rest: boolean, now: number): void {
    const mo = mv.mo;
    if (!mo || !mv.at || !meets(mv.at, view)) return;
    c.transform(...mo.m);
    c.globalAlpha = mo.a;
    this.sprite(c, mv.d, k, rest, now);
    c.globalAlpha = 1;
    c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  }

  /* ---------------------------------------------------------------- the scene, read and changed */
  /** Part of the scene changed. Before the first frame it simply is the scene; after, the new scene waits for
   *  its new pieces (those on screen as sharp as the zoom wants) and goes on all at once. */
  private change(part: Partial<Scene>): void {
    const base = this.next || this.now, n: Scene = { ...base, ...part };
    if (!this.ready) { this.now = n; this.forget(); return; }
    this.next = n;
    this.nextBy = performance.now() + SWAP_WAIT;
    this.forget();
    this.swap(performance.now());
  }
  /** The scene waiting goes on once every piece of it on screen is drawn as sharp as the zoom wants (after a
   *  moment, drawn at all): until then, the old one stays. */
  private swap(now: number): void {
    const n = this.next;
    if (!n) return;
    const view = this.shown(), k = this.cam.z * this.d, late = now >= this.nextBy;
    const wait = defsOf(n).filter((d) => meets(d.r, view) && !(late ? this.sprites.has(d) : this.sprites.sharp(d, k)));
    for (const d of wait) this.sprites.want(d, k, true);
    if (wait.length) return;
    this.now = n;
    this.next = null;
    this.forget();
    this.dirty = true;
  }
  /** each thing you tap, from the layer you tap: its sprite is its group's markup (its labels written apart) */
  private readItems(): Item[] {
    const svg = this.layer.svg, own = svg.querySelector(':scope > defs')?.outerHTML || '';
    const head = `<style>${sceneCss()}</style><defs>${this.defs}</defs>${own}`;
    return Array.from(svg.querySelectorAll<SVGGElement>(':scope > g')).map((el) => {
      const hl = el.querySelector<SVGRectElement>(':scope > rect.hl');
      const n = (a: string): number => +(hl?.getAttribute(a) || 0);
      const ring = hl ? { x: n('x'), y: n('y'), w: n('width'), h: n('height'), rx: n('rx') } : null;
      const shows = Array.from(el.children).some((ch) => !ch.classList.contains('hl') && getComputedStyle(ch).display !== 'none');
      let d: SpriteDef | null = null, bb: DOMRect | null = null;
      try { bb = el.getBBox(); } catch { /* not laid out */ }
      if (shows && !(bb && bb.width > 0 && bb.height > 0)) this.unread ||= !this.root.offsetParent;
      else if (shows && bb) {
        // only a spot shows what Decorate shows; the tour's ring is drawn here, so it isn't part of the picture
        const deco = this.deco && el.classList.contains('spot'), body = el.outerHTML.replace(' tour-hl', '');
        d = { key: `${deco ? 'deco ' : ''}${body}`, body, r: grow([bb.x, bb.y, bb.width, bb.height], 12), labels: labelsOf(el), head, cls: `room house${deco ? ' deco' : ''}` };
      }
      return { el, d, ring, tour: el.classList.contains('tour-hl') };
    });
  }
  /** bits as movers, keeping when each was first drawn; the same markup as last time keeps the movers it made */
  private movers(bits: Bit[], kind: Kind): Mover[] {
    const had = (this.next || this.now)[kind];
    const all = bits.map((b) => `${b.cls}|${b.box.join()}|${b.body}`).join('\n');
    if (all === this.had[kind] && had.length === bits.length) return had;
    this.had[kind] = all;
    const old = new Map(had.map((mv) => [`${mv.bit.box.join()}|${mv.bit.body}`, mv])), now = (performance.now() - this.t0) / 1000, head = `<defs>${this.defs}</defs>`;
    return bits.map((bit) => {
      const was = old.get(`${bit.box.join()}|${bit.body}`);
      if (was) return { bit, d: was.d, born: was.born };
      const { r, labels } = this.measure(bit);
      return { bit, d: { key: `${r.join()}|${bit.body}`, body: bit.body, r, labels, head, cls: '' }, born: now };
    });
  }
  /** What a bit covers (its drawing can spill out of its box: the fire's glow does) and its labels, styled as the
   *  page styles them in that bit (styles.css: `.bit.pip text`, `.bit .pq`). */
  private measure(bit: Bit): { r: Rect; labels: Label[] } {
    const m = this.measureEl;
    m.setAttribute('class', `h-measure bit ${bit.cls}`);
    m.innerHTML = `<g>${bit.body}</g>`;
    let [x0, y0, w, h] = bit.box, x1 = x0 + w, y1 = y0 + h;
    try {
      const bb = (m.firstElementChild as SVGGElement).getBBox();
      if (bb.width > 0 && bb.height > 0) { x0 = Math.min(x0, bb.x); y0 = Math.min(y0, bb.y); x1 = Math.max(x1, bb.x + bb.width); y1 = Math.max(y1, bb.y + bb.height); }
    } catch { /* not laid out: its box */ }
    const labels = bit.body.includes('<text') ? labelsOf(m) : [];
    m.textContent = '';
    return { r: grow([x0, y0, x1 - x0, y1 - y0], 6), labels };
  }
  private allDefs(): SpriteDef[] { return [...defsOf(this.now), ...(this.next ? defsOf(this.next) : [])]; }
  /** the sprites still in the house (or waiting to go in) are kept, and every one gets its whole-house copy */
  private forget(): void {
    const ds = this.allDefs();
    this.sprites.keep(new Set(ds.map((d) => d.key)));
    if (this.kWhole) for (const d of ds) this.sprites.want(d, this.kWhole);
  }

  /** The first frame is ready once the whole pictures are, and every sprite has a copy (or, after 2.5s more,
   *  whatever's there): the canvas takes over from the layers standing in. After that, a changed scene goes on
   *  when it can. */
  private check(): void {
    const now = performance.now();
    if (this.ready) { this.swap(now); return; }
    if (!this.ctx || !this.back.lo || !this.light.lo) return;
    if (!this.readyBy) this.readyBy = now + 2500;
    if (now < this.readyBy && !this.allDefs().every((d) => this.sprites.has(d))) return;
    this.ready = true;
    this.draw(now);
    const L = this.layer;
    for (const el of [L.back, L.front, L.fx, L.bits, L.pips]) el.textContent = '';
    this.root.classList.add('h-drawn');
  }
}

/** the rect a box covers moved by a matrix */
function spread([x, y, w, h]: Rect, [a, b, c, d, e, f]: [number, number, number, number, number, number]): Rect {
  const xs = [x * a + y * c, (x + w) * a + y * c, x * a + (y + h) * c, (x + w) * a + (y + h) * c];
  const ys = [x * b + y * d, (x + w) * b + y * d, x * b + (y + h) * d, (x + w) * b + (y + h) * d];
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  return [x0 + e, y0 + f, Math.max(...xs) - x0, Math.max(...ys) - y0];
}
/** rects that overlap, joined into one, until none do */
function merge(rs: Rect[]): Rect[] {
  const out = rs.map((r) => [...r] as Rect);
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      if (!meets(a, b)) continue;
      const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
      out[i] = [x0, y0, Math.max(a[0] + a[2], b[0] + b[2]) - x0, Math.max(a[1] + a[3], b[1] + b[3]) - y0];
      out.splice(j, 1);
      j = i;
    }
  }
  return out;
}
function defsOf(s: Scene): SpriteDef[] {
  const out: SpriteDef[] = [];
  for (const it of s.items) if (it.d) out.push(it.d);
  for (const g of [s.fx, s.bits, s.pips]) for (const mv of g) out.push(mv.d);
  return out;
}
/** a ring round something you point at: gold, over a faint gold fill (styles.css: `.house ... .hl`) */
function ring(c: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number; rx: number }, a: number): void {
  c.beginPath();
  if (c.roundRect) c.roundRect(r.x, r.y, r.w, r.h, r.rx); else c.rect(r.x, r.y, r.w, r.h);
  c.fillStyle = `rgba(242, 194, 48, ${a})`;
  c.fill();
  c.lineWidth = 6;
  c.strokeStyle = '#F2C230';
  c.stroke();
}
/** whether something got the focus from the keyboard (an old browser that can't tell: yes) */
function keyed(el: Element): boolean {
  try { return el.matches(':focus-visible'); } catch { return true; }
}
