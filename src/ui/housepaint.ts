/**
 * The house's back layer (the sky, the hill, the walls, the frame and the furniture) as pictures, not as a live
 * drawing. The live drawing has over a thousand shapes, and a phone redrew all of it, patch by patch, every
 * time the camera stopped at a new zoom: the house "glitched its way" onto the screen. Here it is drawn once
 * into a picture of the whole house, and the camera only slides and scales that picture. When you zoom in past
 * what it holds sharp, a second, sharper picture of just what's on screen is drawn once the camera rests, and
 * laid over it. Each picture is held to about 4 million pixels, whatever the screen.
 *
 * The drawing's gradients and clips (`defs`) stay live in the page, in a tiny SVG of their own, because the
 * other layers (the rooms' things, the fireflies) use them too.
 */
type Rect = [number, number, number, number];

/** the most pixels one picture may hold (16 MB) */
const MAX_PX = 4_000_000;
/** how far round the screen the sharp picture reaches, as a share of the screen */
const MARGIN = 0.2;

/** Draw an SVG's markup, cropped to a rect of its user space, into a canvas at a density (pixels per unit).
 *  False if the picture couldn't be made (it then keeps what it had). */
async function paint(cv: HTMLCanvasElement, defs: string, body: string, r: Rect, k: number): Promise<boolean> {
  const [x, y, w, h] = r;
  const pw = Math.max(1, Math.round(w * k)), ph = Math.max(1, Math.round(h * k));
  const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${pw}" height="${ph}" preserveAspectRatio="none"><defs>${defs}</defs>${body}</svg>`;
  const img = new Image();
  const loaded = new Promise<boolean>((res) => { img.onload = () => res(true); img.onerror = () => res(false); });
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  // some Safaris won't decode an SVG ahead of time: then it's drawn once it has loaded
  if (!(await loaded)) return false;
  try { await img.decode(); } catch { /* drawn as it is */ }
  const ctx = cv.getContext('2d');
  if (!ctx) return false;
  cv.width = pw; cv.height = ph;
  ctx.drawImage(img, 0, 0, pw, ph);
  return true;
}

export class HousePaint {
  private defs: SVGSVGElement;
  /** the whole picture, and the sharp one over the part on screen */
  private lo: HTMLCanvasElement;
  private hi: HTMLCanvasElement;
  private body = '';
  private defsMarkup = '';
  /** what the whole picture covers and its density, or null until it's drawn */
  private loAt: { r: Rect; k: number } | null = null;
  private hiAt: { r: Rect; k: number } | null = null;
  /** bumped by every new drawing, so a slow one that's been overtaken is thrown away */
  private gen = 0;
  private hiGen = 0;
  /** where the camera last came to rest, so the sharp picture can follow once the whole one is ready */
  private last: { view: Rect; k: number } | null = null;

  /** `live`: the layer as a live drawing, shown only until its first picture is ready (so the house never
   *  opens without its walls). `origin`: the world's top left, in house units. */
  constructor(world: HTMLElement, private live: SVGSVGElement, private origin: [number, number]) {
    const before = live.nextElementSibling || live;
    const NS = 'http://www.w3.org/2000/svg';
    this.defs = document.createElementNS(NS, 'svg');
    this.defs.setAttribute('class', 'h-defs');
    this.defs.setAttribute('width', '0');
    this.defs.setAttribute('height', '0');
    this.defs.setAttribute('aria-hidden', 'true');
    this.lo = document.createElement('canvas');
    this.hi = document.createElement('canvas');
    this.lo.className = 'h-paint';
    this.hi.className = 'h-paint hi';
    for (const c of [this.lo, this.hi]) { c.setAttribute('aria-hidden', 'true'); c.width = 0; c.height = 0; }
    world.insertBefore(this.defs, live);
    world.insertBefore(this.lo, before);
    world.insertBefore(this.hi, before);
  }

  /** New markup for the layer (a look changed): the old pictures stay up until the new one is ready. */
  set(defs: string, body: string): void {
    if (defs !== this.defsMarkup) { this.defsMarkup = defs; this.defs.innerHTML = `<defs>${defs}</defs>`; }
    if (body === this.body) return;
    this.body = body;
    // the very first time, the live drawing stands in until the picture is ready
    if (!this.lo.width) this.live.innerHTML = body;
    this.loAt = null;
    this.hiAt = null;
    this.hide(this.hi);
  }

  /** The whole picture, over `extent` (what the camera can ever show), sharp enough for `k` pixels per unit
   *  (the whole-house zoom), if it isn't drawn already for that. */
  whole(extent: Rect, k: number): void {
    const [, , w, h] = extent;
    k = Math.min(k, Math.sqrt(MAX_PX / (w * h)));
    if (!this.body || (this.loAt && same(this.loAt.r, extent) && Math.abs(this.loAt.k / k - 1) < 0.05)) return;
    const gen = ++this.gen, body = this.body;
    void paint(this.lo, this.defsMarkup, body, extent, k).then((ok) => {
      if (!ok || gen !== this.gen) return;
      this.place(this.lo, extent);
      this.loAt = { r: extent, k };
      if (this.live.firstChild) this.live.textContent = '';
      if (this.last) this.rest(this.last.view, this.last.k);
    });
  }

  /** The camera has come to rest showing `view` (house units) at `k` pixels per unit: if the whole picture is
   *  too soft for that, draw the part on screen sharp. */
  rest(view: Rect, k: number): void {
    this.last = { view, k };
    if (!this.body || !this.loAt) return;
    if (k <= this.loAt.k * 1.15) { if (this.hiAt) { this.hiGen++; this.hide(this.hi); this.hi.width = 0; this.hi.height = 0; this.hiAt = null; } return; }
    const [vx, vy, vw, vh] = view, [ex, ey, ew, eh] = this.loAt.r;
    const mx = vw * MARGIN, my = vh * MARGIN;
    const x0 = Math.max(ex, vx - mx), y0 = Math.max(ey, vy - my);
    const x1 = Math.min(ex + ew, vx + vw + mx), y1 = Math.min(ey + eh, vy + vh + my);
    if (x1 <= x0 || y1 <= y0) return;
    const r: Rect = [x0, y0, x1 - x0, y1 - y0];
    k = Math.min(k, Math.sqrt(MAX_PX / (r[2] * r[3])));
    // already sharp over all of the screen, at about this zoom: nothing to do
    if (this.hiAt && covers(this.hiAt.r, view) && Math.abs(this.hiAt.k / k - 1) < 0.1) return;
    const gen = ++this.hiGen, body = this.body;
    void paint(this.hi, this.defsMarkup, body, r, k).then((ok) => {
      if (!ok || gen !== this.hiGen || body !== this.body) return;
      this.place(this.hi, r);
      this.hiAt = { r, k };
    });
  }

  /** The house is off screen (a run, the cauldron): the sharp picture lets its memory go. The whole one stays
   *  (about 14 MB on a phone), so coming home shows the house at once. */
  sleep(): void {
    this.hiGen++;
    this.hiAt = null; this.last = null;
    this.hide(this.hi); this.hi.width = 0; this.hi.height = 0;
  }

  /** put a picture where its rect is, in the world's own units */
  private place(c: HTMLCanvasElement, [x, y, w, h]: Rect): void {
    const s = c.style;
    s.left = `${x - this.origin[0]}px`; s.top = `${y - this.origin[1]}px`;
    s.width = `${w}px`; s.height = `${h}px`;
    s.visibility = 'visible';
  }
  private hide(c: HTMLCanvasElement): void { c.style.visibility = 'hidden'; }
}

const same = (a: Rect, b: Rect): boolean => a.every((v, i) => Math.abs(v - b[i]) < 0.5);
/** whether rect a holds all of rect b */
const covers = (a: Rect, b: Rect): boolean => a[0] <= b[0] && a[1] <= b[1] && a[0] + a[2] >= b[0] + b[2] && a[1] + a[3] >= b[1] + b[3];
