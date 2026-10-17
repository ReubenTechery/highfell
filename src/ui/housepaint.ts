/**
 * A layer of the house (the back: sky, hill, walls, frame and furniture; or the rooms' soft light) as pictures,
 * not as a live drawing. The live drawing has over a thousand shapes, and a phone redrew all of it, patch by
 * patch, every time the camera stopped at a new zoom: the house "glitched its way" onto the screen. Here it is
 * drawn once into a picture of the whole house, and the camera only slides and scales that picture.
 *
 * Zoomed in past what that picture holds sharp, a second, sharper picture of just what's on screen is drawn
 * and faded in over it: as soon as a flight to a room sets off (so it's usually ready as the camera lands),
 * or once a pinch or a drag comes to rest. It stays when you zoom back out, and is only swapped for a new one.
 * Each picture holds at most about 4 million pixels, whatever the screen.
 *
 * The drawing's gradients and clips (`defs`) stay live in the page, in a tiny SVG of their own, because the
 * other layers (the rooms' things, the fireflies) use them too. A `soft` layer (the light) has only the whole
 * picture, at half the sharpness: soft light looks the same scaled up.
 */
type Rect = [number, number, number, number];

/** the most pixels one picture may hold (16 MB) */
const MAX_PX = 4_000_000;
/** how far round the screen the sharp picture reaches, as a share of the screen */
const MARGIN = 0.2;
/** how long a new sharp picture takes to fade in, in ms */
const FADE = 180;

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
  // a canvas the page reads back is kept as plain pixels: otherwise the browser may keep the drawing as a list of
  // its shapes and draw them all again every time the zoom changes, which is the very thing this avoids
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  cv.width = pw; cv.height = ph;
  ctx.drawImage(img, 0, 0, pw, ph);
  return true;
}

const canvas = (cls: string): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.className = cls; c.width = 0; c.height = 0;
  c.setAttribute('aria-hidden', 'true');
  return c;
};

export class HousePaint {
  private defs: SVGSVGElement | null = null;
  /** the whole picture; the sharp one showing over it, and a spare to draw the next sharp one into */
  private lo: HTMLCanvasElement;
  private hi: HTMLCanvasElement;
  private spare: HTMLCanvasElement;
  private body = '';
  private defsMarkup = '';
  /** what the whole picture covers and its density, or null until it's drawn */
  private loAt: { r: Rect; k: number } | null = null;
  /** what the sharp picture showing covers, and what the one being drawn will */
  private hiAt: { r: Rect; k: number } | null = null;
  private drawing: { r: Rect; k: number } | null = null;
  /** bumped by every new drawing, so a slow one that's been overtaken is thrown away */
  private gen = 0;
  private hiGen = 0;
  /** where the camera last came to rest (or is flying to), so the sharp picture can follow the whole one */
  private last: { view: Rect; k: number } | null = null;
  /** the sharp picture fading out under a new one, if one is */
  private fading: HTMLCanvasElement | null = null;
  private soft: boolean;

  /** `live`: the layer as a live drawing, shown only until its first picture is ready (so the house never
   *  opens without its walls); the pictures go just above it. `origin`: the world's top left, in house units. */
  constructor(world: HTMLElement, private live: SVGSVGElement, private origin: [number, number], o: { soft?: boolean } = {}) {
    this.soft = !!o.soft;
    const before = live.nextElementSibling;
    if (!this.soft) {
      this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.defs.setAttribute('class', 'h-defs');
      this.defs.setAttribute('width', '0');
      this.defs.setAttribute('height', '0');
      this.defs.setAttribute('aria-hidden', 'true');
      world.insertBefore(this.defs, live);
    }
    this.lo = canvas('h-paint');
    this.hi = canvas('h-paint hi');
    this.spare = canvas('h-paint hi');
    for (const c of [this.lo, this.hi, this.spare]) world.insertBefore(c, before);
  }

  /** New markup for the layer (a look changed): the old pictures stay up until the new one is ready. */
  set(defs: string, body: string): void {
    if (defs !== this.defsMarkup) { this.defsMarkup = defs; if (this.defs) this.defs.innerHTML = `<defs>${defs}</defs>`; }
    if (body === this.body) return;
    this.body = body;
    this.loAt = null;
    this.hiGen++; this.hiAt = null; this.drawing = null; this.fading = null;
    for (const c of [this.hi, this.spare]) this.free(c);
    // the very first time, the live drawing stands in until the picture is ready
    if (!this.lo.width) this.live.innerHTML = body;
  }

  /** The whole picture, over `extent` (what the camera can ever show), sharp enough for `k` pixels per unit
   *  (the whole-house zoom), if it isn't drawn already for that. */
  whole(extent: Rect, k: number): void {
    const [, , w, h] = extent;
    k = Math.min(this.soft ? k / 2 : k, Math.sqrt(MAX_PX / (w * h)));
    if (!this.body || (this.loAt && same(this.loAt.r, extent) && Math.abs(this.loAt.k / k - 1) < 0.05)) return;
    const gen = ++this.gen, body = this.body;
    void paint(this.lo, this.defsMarkup, body, extent, k).then((ok) => {
      if (!ok || gen !== this.gen) return;
      this.place(this.lo, extent);
      this.loAt = { r: extent, k };
      if (this.live.firstChild) this.live.textContent = '';
      if (this.last) this.sharp(this.last.view, this.last.k);
    });
  }

  /** The camera shows `view` (house units) at `k` pixels per unit, or is flying there: if the whole picture is
   *  too soft for that, draw the part on screen sharp and fade it in. */
  sharp(view: Rect, k: number): void {
    this.last = { view, k };
    if (this.soft || !this.body || !this.loAt) return;
    // the whole picture is sharp enough here: whatever sharp one there is can stay (it's sharper still)
    if (k <= this.loAt.k * 1.15) return;
    // already sharp over all of the screen at about this zoom, or being drawn so
    for (const at of [this.hiAt, this.drawing]) if (at && covers(at.r, view) && at.k >= k * 0.9 && at.k <= k * 1.6) return;
    const [vx, vy, vw, vh] = view, [ex, ey, ew, eh] = this.loAt.r;
    const mx = vw * MARGIN, my = vh * MARGIN;
    const x0 = Math.max(ex, vx - mx), y0 = Math.max(ey, vy - my);
    const x1 = Math.min(ex + ew, vx + vw + mx), y1 = Math.min(ey + eh, vy + vh + my);
    if (x1 <= x0 || y1 <= y0) return;
    const r: Rect = [x0, y0, x1 - x0, y1 - y0];
    k = Math.min(k, Math.sqrt(MAX_PX / (r[2] * r[3])));
    // a fade still running ends now: the spare it was fading out is drawn into next
    if (this.fading) { this.free(this.fading); this.fading = null; this.hi.style.transition = ''; this.hi.style.opacity = '1'; }
    const gen = ++this.hiGen, body = this.body, next = this.spare;
    this.drawing = { r, k };
    void paint(next, this.defsMarkup, body, r, k).then((ok) => {
      if (gen !== this.hiGen) return;
      this.drawing = null;
      if (!ok || body !== this.body) return;
      this.show(next, r);
      this.hiAt = { r, k };
    });
  }

  /** The house is off screen (a run, the cauldron): the sharp pictures let their memory go. The whole one
   *  stays (about 14 MB on a phone), so coming home shows the house at once. */
  sleep(): void {
    this.hiGen++;
    this.hiAt = null; this.drawing = null; this.last = null; this.fading = null;
    for (const c of [this.hi, this.spare]) this.free(c);
  }

  /** a new sharp picture: laid over the one showing and faded in, then the old one is let go */
  private show(next: HTMLCanvasElement, r: Rect): void {
    const old = this.hi;
    this.place(next, r);
    old.after(next);
    this.hi = next; this.spare = old;
    if (!old.width || matchMedia('(prefers-reduced-motion: reduce)').matches) { this.free(old); return; }
    next.style.opacity = '0';
    next.getBoundingClientRect();
    next.style.transition = `opacity ${FADE}ms ease-out`;
    next.style.opacity = '1';
    this.fading = old;
    setTimeout(() => { if (this.fading === old) { this.free(old); this.fading = null; } }, FADE + 40);
  }

  /** put a picture where its rect is, in the world's own units */
  private place(c: HTMLCanvasElement, [x, y, w, h]: Rect): void {
    const s = c.style;
    s.left = `${x - this.origin[0]}px`; s.top = `${y - this.origin[1]}px`;
    s.width = `${w}px`; s.height = `${h}px`;
    s.transition = ''; s.opacity = '1';
    s.visibility = 'visible';
  }
  private free(c: HTMLCanvasElement): void { c.style.visibility = 'hidden'; c.width = 0; c.height = 0; }
}

const same = (a: Rect, b: Rect): boolean => a.every((v, i) => Math.abs(v - b[i]) < 0.5);
/** whether rect a holds all of rect b */
const covers = (a: Rect, b: Rect): boolean => a[0] <= b[0] && a[1] <= b[1] && a[0] + a[2] >= b[0] + b[2] && a[1] + a[3] >= b[1] + b[3];
