/**
 * The house's pictures, for its canvas (housecanvas.ts). Everything in the house is SVG markup (houseart.ts, the
 * scene in hearth.ts, the bits that move); here it is drawn into bitmaps, and each frame the canvas only copies
 * them. Two kinds:
 *  - A Picture is a big layer: the back (sky, hill, walls, frame and furniture) or the rooms' light. Its markup is
 *    loaded once as an image, drawn whole at the whole-house zoom, and drawn again, sharper, for just what's on
 *    screen once the camera rests close up (faded in over the whole one). Each holds at most 4 million pixels.
 *  - Sprites are the small pieces: each thing you tap and each bit that moves, drawn at a size for the zoom (in
 *    steps of √2) once the camera rests. Every one is kept at the whole-house size, so whatever pans into view
 *    always has something to show while its sharp copy is made.
 * Drawing SVG takes the page's main thread, so it is queued (Work) and done in small pieces, big pictures in
 * strips, and only while the camera is still: a flight or a pinch never stutters for it.
 * An image can't see the page's style sheet or fonts, so the scene's own rules (styles.css, the `.house` ones)
 * are copied into its pictures, and text is left out of the image and written with the canvas's own text, as
 * each label's computed style says (the display font is waited for, and the labels written again if it's late).
 */
export type Rect = [number, number, number, number];
/** a bitmap of part of the house: what it covers (house units), how sharp (pixels per unit), its size in pixels,
 *  which markup it was drawn from; for a sprite, when it was last drawn on screen, and false if its labels were
 *  written before the display font arrived */
export interface Bmp { src: CanvasImageSource; r: Rect; k: number; w: number; h: number; v: number; used?: number; font?: boolean }
/** a big picture: its strips, what it covers, how sharp, and which markup it was drawn from */
interface Pic { parts: Bmp[]; r: Rect; k: number; v: number }
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** the most pixels a picture may hold (16 MB), and a sprite */
const MAX_PX = 4_000_000;
const SPRITE_PX = 1_500_000;
/** a big picture is drawn in strips of about this many pixels, each a bitmap of its own, made one at a time, so
 *  no one piece holds the page up for long (a canvas only really draws when its bitmap is handed over) */
const STRIP_PX = 600_000;
/** how long a new sharp picture takes to fade in, in ms, and how far round the screen it reaches */
const FADE = 180;
const MARGIN = 0.2;

/** Drawing work, a little at a time (about `budget()` ms a go, at least one piece), while `ok()` says it may run.
 *  `urgent` work (what the screen is waiting for) goes first, and may run when the rest may not (`ok(true)`). */
export class Work {
  private jobs: (() => void)[] = [];
  private urgent: (() => void)[] = [];
  private timer = 0;
  constructor(private ok: (urgent: boolean) => boolean, private budget: () => number) {}
  add(job: () => void, urgent = false): void { (urgent ? this.urgent : this.jobs).push(job); this.kick(); }
  private next(): (() => void) | undefined {
    if (this.urgent.length && this.ok(true)) return this.urgent.shift();
    return this.jobs.length && this.ok(false) ? this.jobs.shift() : undefined;
  }
  /** carry on, if there's work and it may run now */
  kick(): void {
    if (this.timer || !((this.urgent.length && this.ok(true)) || (this.jobs.length && this.ok(false)))) return;
    this.timer = window.setTimeout(() => {
      const t0 = performance.now();
      try {
        for (let job = this.next(); job; job = performance.now() - t0 < this.budget() ? this.next() : undefined) job();
      } finally { this.timer = 0; this.kick(); }
    }, 0);
  }
}

/** a bitmap to draw into: an OffscreenCanvas where there is one (its bitmap handed over whole), else a canvas */
function surface(w: number, h: number): { ctx: Ctx; done: () => CanvasImageSource } | null {
  if (typeof OffscreenCanvas === 'function') {
    const c = new OffscreenCanvas(w, h), ctx = c.getContext('2d');
    if (ctx) return { ctx, done: () => c.transferToImageBitmap() };
  }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  return ctx ? { ctx, done: () => c } : null;
}
/** let a bitmap's memory go */
export function free(b: Bmp | null | undefined): void {
  const s = b?.src;
  if (typeof ImageBitmap === 'function' && s instanceof ImageBitmap) s.close();
  else if (s instanceof HTMLCanvasElement) { s.width = 0; s.height = 0; }
}
/** SVG markup as an image, loaded; null if it couldn't be */
async function image(markup: string): Promise<HTMLImageElement | null> {
  const img = new Image();
  const ok = await new Promise<boolean>((res) => {
    img.onload = () => res(true);
    img.onerror = () => res(false);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  });
  if (!ok) return null;
  try { await img.decode(); } catch { /* drawn as it is */ }
  return img;
}
/** an SVG of a rect of the house, one image pixel to a house unit */
const svgOf = (r: Rect, inner: string, cls = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r.join(' ')}" width="${r[2]}" height="${r[3]}" preserveAspectRatio="none"${cls ? ` class="${cls}"` : ''}>${inner}</svg>`;
const same = (a: Rect, b: Rect): boolean => a.every((v, i) => Math.abs(v - b[i]) < 0.5);
/** whether rect a holds all of rect b */
const covers = (a: Rect, b: Rect): boolean => a[0] <= b[0] && a[1] <= b[1] && a[0] + a[2] >= b[0] + b[2] && a[1] + a[3] >= b[1] + b[3];
const clip = (a: Rect, b: Rect): Rect => {
  const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]);
  return [x0, y0, Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - x0), Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - y0)];
};

/* ---------------------------------------------------------------- text and rules an image can't see */
/** a label to write over a picture: its text, where (house units), and how, from its computed style */
export interface Label { s: string; x: number; y: number; font: string; fill: string; stroke: string; sw: number; align: CanvasTextAlign; under: boolean; join: CanvasLineJoin; miter: number }
/** Every label inside a live element, with the style the page gives it. Labels are placed by x and y in house units. */
export function labelsOf(el: Element): Label[] {
  return Array.from(el.querySelectorAll('text')).flatMap((t) => {
    const cs = getComputedStyle(t);
    if (cs.display === 'none') return [];
    const a = cs.textAnchor;
    return [{
      s: t.textContent || '', x: parseFloat(t.getAttribute('x') || '0'), y: parseFloat(t.getAttribute('y') || '0'),
      font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
      fill: cs.fill, stroke: cs.stroke, sw: parseFloat(cs.strokeWidth) || 0,
      align: a === 'middle' ? 'center' : a === 'end' ? 'right' : 'left',
      under: cs.paintOrder.startsWith('stroke'), join: (cs.strokeLinejoin || 'miter') as CanvasLineJoin, miter: parseFloat(cs.strokeMiterlimit) || 4,
    }];
  });
}
function writeLabels(ctx: Ctx, ls: Label[]): void {
  ctx.textBaseline = 'alphabetic';
  for (const l of ls) {
    ctx.font = l.font;
    ctx.textAlign = l.align;
    const edge = (): void => {
      if (l.stroke === 'none' || l.sw <= 0) return;
      ctx.lineJoin = l.join; ctx.miterLimit = l.miter; ctx.lineWidth = l.sw; ctx.strokeStyle = l.stroke;
      ctx.strokeText(l.s, l.x, l.y);
    };
    const fill = (): void => { if (l.fill !== 'none') { ctx.fillStyle = l.fill; ctx.fillText(l.s, l.x, l.y); } };
    if (l.under) { edge(); fill(); } else { fill(); edge(); }
  }
}
const noText = (m: string): string => m.replace(/<text\b[\s\S]*?<\/text>/g, '');

let fontsAsked: Promise<void> | null = null;
const display = (): string => `22px ${getComputedStyle(document.documentElement).getPropertyValue('--f-display').trim() || 'sans-serif'}`;
/** the display font, loaded, or given up on after 3s (labels written before it arrives are written again: Sprites.fonts) */
function fontsReady(): Promise<void> {
  if (!fontsAsked) {
    fontsAsked = Promise.race([
      document.fonts ? document.fonts.load(display()).then(() => undefined) : Promise.resolve(),
      new Promise<void>((res) => setTimeout(res, 3000)),
    ]).catch(() => undefined);
  }
  return fontsAsked;
}
/** whether the display font is here */
function fontHere(): boolean {
  try { return !document.fonts || document.fonts.check(display()); } catch { return true; }
}

let rules: string | null = null;
/** The page's rules for the scene (styles.css: the `.house` ones), as they are with nothing hovered or focused, for an
 *  image of a piece of it. Hovers, focus and the tour's ring are drawn by the canvas. */
export function sceneCss(): string {
  if (rules !== null) return rules;
  const vars = getComputedStyle(document.documentElement), out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try { list = sheet.cssRules; } catch { continue; } // another site's sheet (the fonts)
    for (const r of Array.from(list)) {
      if (r instanceof CSSStyleRule && /\.house(?![\w-])/.test(r.selectorText) && !/:hover|:focus|tour-hl/.test(r.selectorText)) out.push(r.cssText);
    }
  }
  return (rules = out.join('').replace(/var\((--[\w-]+)\)/g, (_, v: string) => vars.getPropertyValue(v).trim()));
}

/* ---------------------------------------------------------------- a big layer */
export class Picture {
  private img: Promise<HTMLImageElement | null> = Promise.resolve(null);
  private full: Rect = [0, 0, 1, 1];
  private markup = '';
  /** which markup is current: a bitmap of an older one is let go once a new whole picture is ready */
  private v = 0;
  /** the whole picture; the sharp one over it, and the one before, fading out under it */
  lo: Pic | null = null;
  private hi: Pic | null = null;
  private old: Pic | null = null;
  private fadeAt = 0;
  /** what's being drawn, and a count for each kind, bumped to drop work that's been overtaken */
  private loAsk: { r: Rect; k: number; v: number } | null = null;
  private hiAsk: { r: Rect; k: number; v: number } | null = null;
  private loGen = 0;
  private hiGen = 0;

  /** `soft`: only the whole picture, at half the sharpness (soft light looks the same scaled up). `drawn`: a
   *  new bitmap is ready. */
  constructor(private work: Work, private o: { soft?: boolean; drawn: () => void }) {}

  /** New markup, for `full` (everything it draws, in house units). What's showing stays until the new whole
   *  picture is ready. */
  set(defs: string, body: string, full: Rect): void {
    const m = `<defs>${defs}</defs>${body}`;
    if (m === this.markup && same(full, this.full)) return;
    this.markup = m; this.full = full; this.v++;
    this.img = image(svgOf(full, m));
    this.hiAsk = null; this.hiGen++;
    const a = this.loAsk;
    if (a) this.paintLo(a.r, a.k);
  }

  /** The whole picture, over `r` (all the camera can show), sharp enough for k pixels per unit, if it isn't
   *  already. */
  whole(r: Rect, k: number): void {
    k = Math.min(this.o.soft ? k / 2 : k, Math.sqrt(MAX_PX / (r[2] * r[3])));
    const a = this.loAsk;
    if (a && a.v === this.v && same(a.r, r) && Math.abs(a.k / k - 1) < 0.05) return;
    this.paintLo(r, k);
  }
  private paintLo(r: Rect, k: number): void {
    const gen = ++this.loGen;
    this.loAsk = { r, k, v: this.v };
    this.paint(r, k, () => gen === this.loGen, (b) => {
      drop(this.lo);
      this.lo = b;
      for (const s of ['hi', 'old'] as const) { const x = this[s]; if (x && x.v !== b.v) { drop(x); this[s] = null; } }
      this.o.drawn();
    });
  }

  /** The camera is still, showing `view` at k pixels per unit: if the whole picture is too soft for that, draw
   *  what's on screen (and a margin round it) sharp. */
  sharp(view: Rect, k: number): void {
    const lo = this.lo;
    if (this.o.soft || !lo || lo.v !== this.v || k <= lo.k * 1.15) return;
    const want = clip(view, lo.r);
    if (!want[2] || !want[3]) return;
    for (const at of [this.hi, this.hiAsk]) if (at && at.v === this.v && covers(at.r, want) && at.k >= k * 0.9 && at.k <= k * 1.6) return;
    const [vx, vy, vw, vh] = view, mx = vw * MARGIN, my = vh * MARGIN;
    const r = clip([vx - mx, vy - my, vw + 2 * mx, vh + 2 * my], lo.r);
    k = Math.min(k, Math.sqrt(MAX_PX / (r[2] * r[3])));
    const gen = ++this.hiGen;
    this.hiAsk = { r, k, v: this.v };
    this.paint(r, k, () => gen === this.hiGen, (b) => {
      this.hiAsk = null;
      if (b.v !== this.lo?.v) { drop(b); return; }
      drop(this.old);
      this.old = this.hi;
      this.hi = b;
      this.fadeAt = performance.now();
      this.o.drawn();
    });
  }

  /** Draw what of it is in `view`, on a canvas set to house units; true while a sharp picture is still fading in.
   *  The whole picture is left out where the sharp one covers it. */
  draw(c: CanvasRenderingContext2D, now: number, still: boolean, view: Rect): boolean {
    const lo = this.lo, hi = this.hi?.v === lo?.v ? this.hi : null;
    if (!lo) return false;
    const f = (now - this.fadeAt) / FADE;
    if (hi && (f >= 1 || still)) {
      if (this.old) { drop(this.old); this.old = null; }
      if (!covers(hi.r, view)) put(c, lo);
      put(c, hi);
      return false;
    }
    put(c, lo);
    if (!hi) return false;
    if (this.old && this.old.v === lo.v) put(c, this.old);
    c.globalAlpha = Math.max(0, f);
    put(c, hi);
    c.globalAlpha = 1;
    return true;
  }

  /** The house is off screen: the sharp pictures let their memory go. The whole one stays (about 13 MB on a
   *  phone), so coming home shows the house at once. */
  sleep(): void {
    this.hiGen++; this.hiAsk = null;
    drop(this.hi); drop(this.old);
    this.hi = null; this.old = null;
  }
  /** The browser lost the bitmaps (its graphics were reset): draw the whole picture again. */
  redo(): void {
    this.sleep();
    const a = this.loAsk;
    if (a) this.paintLo(a.r, a.k);
  }

  /** draw the picture's markup over `r` at k pixels per unit, a strip at a time, then hand it to `done` */
  private paint(r: Rect, k: number, alive: () => boolean, done: (p: Pic) => void): void {
    const v = this.v, full = this.full, w = Math.max(1, Math.round(r[2] * k)), h = Math.max(1, Math.round(r[3] * k));
    void this.img.then((im) => {
      if (!im || !alive()) return;
      const rows = Math.ceil(h / Math.max(1, Math.ceil((w * h) / STRIP_PX))), parts: Bmp[] = [];
      for (let y = 0; y < h; y += rows) {
        // a strip reaches one row into the next, which is drawn over it: no seam shows between them
        const y1 = Math.min(h, y + rows), y2 = Math.min(h, y1 + 1);
        this.work.add(() => {
          if (!alive()) return;
          const sf = surface(w, y2 - y), sy = r[1] + (y / h) * r[3], sh = ((y2 - y) / h) * r[3];
          if (sf) {
            sf.ctx.drawImage(im, r[0] - full[0], sy - full[1], r[2], sh, 0, 0, w, y2 - y);
            parts.push({ src: sf.done(), r: [r[0], sy, r[2], sh], k, w, h: y2 - y, v });
          }
          if (y1 >= h) done({ parts, r, k, v });
        });
      }
    });
  }
}
const put = (c: CanvasRenderingContext2D, p: Pic): void => { for (const b of p.parts) c.drawImage(b.src, b.r[0], b.r[1], b.r[2], b.r[3]); };
const drop = (p: Pic | null): void => { p?.parts.forEach(free); };

/* ---------------------------------------------------------------- the small pieces */
/** Something small to draw: its key (the same markup is the same sprite), its markup, the rect it's drawn in
 *  (house units), its labels, and what an image of it needs besides: `head` (rules and gradients) and the class of
 *  the layer it's in. */
export interface SpriteDef { key: string; body: string; r: Rect; labels: Label[]; head: string; cls: string }
interface Entry { d: SpriteDef; tiers: Bmp[]; asked: Set<number>; bad: boolean }
/** the size a sprite is drawn at for k pixels per unit: the next step of √2 up */
const tierOf = (k: number): number => 2 ** (Math.ceil(Math.log2(Math.max(k, 1 / 64)) * 2 - 0.05) / 2);
/** how long a sprite's sharp copy is kept once it's off screen, in ms */
const KEEP = 4000;

export class Sprites {
  private all = new Map<string, Entry>();
  /** the whole-house sharpness: every sprite keeps a copy this sharp */
  base = 0;
  /** `drawn`: a new copy of a sprite is ready */
  constructor(private work: Work, private drawn: (d: SpriteDef) => void) {}

  /** The best bitmap there is of a sprite for k pixels per unit (the least sharp that's sharp enough, or else the
   *  sharpest), or null if there's none yet. */
  get(d: SpriteDef, k: number, now: number): Bmp | null {
    const ts = this.all.get(d.key)?.tiers;
    if (!ts?.length) return null;
    const b = ts.find((x) => x.k >= k * 0.9) || ts[ts.length - 1];
    b.used = now;
    return b;
  }
  /** whether a sprite has anything to show (or can't be drawn at all) */
  has(d: SpriteDef): boolean { const e = this.all.get(d.key); return !!e && (e.bad || e.tiers.length > 0); }
  /** whether a sprite has a copy as sharp as k wants (or as it's ever drawn), or can't be drawn at all */
  sharp(d: SpriteDef, k: number): boolean {
    const e = this.all.get(d.key);
    if (!e) return false;
    const need = Math.min(k * 0.9, Math.sqrt(SPRITE_PX / (d.r[2] * d.r[3])) * 0.99);
    return e.bad || e.tiers.some((b) => b.k >= need);
  }

  /** Ask for a sprite drawn at least k pixels per unit sharp; `urgent`: the screen is waiting for it. */
  want(d: SpriteDef, k: number, urgent = false): void {
    let e = this.all.get(d.key);
    if (!e) { e = { d, tiers: [], asked: new Set(), bad: false }; this.all.set(d.key, e); }
    const t = Math.min(tierOf(k), Math.sqrt(SPRITE_PX / (d.r[2] * d.r[3])));
    // a copy whose labels were written in the stand-in font doesn't count: it's drawn again
    if (e.bad || e.asked.has(t) || e.tiers.some((b) => b.font !== false && Math.abs(b.k / t - 1) < 0.01)) return;
    const entry = e, live = (): boolean => this.all.get(d.key) === entry;
    entry.asked.add(t);
    void (d.labels.length ? fontsReady() : Promise.resolve()).then(() => image(svgOf(d.r, d.head + noText(d.body), d.cls))).then((im) => {
      if (!live()) return;
      if (!im) { entry.bad = true; entry.asked.delete(t); return; }
      this.work.add(() => {
        if (!live()) return;
        entry.asked.delete(t);
        const [x, y, rw, rh] = d.r, w = Math.max(1, Math.round(rw * t)), h = Math.max(1, Math.round(rh * t));
        const sf = surface(w, h);
        if (!sf) return;
        sf.ctx.drawImage(im, 0, 0, w, h);
        if (d.labels.length) {
          sf.ctx.setTransform(w / rw, 0, 0, h / rh, (-x * w) / rw, (-y * h) / rh);
          writeLabels(sf.ctx, d.labels);
        }
        const b: Bmp = { src: sf.done(), r: d.r, k: t, w, h, v: 0, font: !d.labels.length || fontHere() };
        const i = entry.tiers.findIndex((o) => Math.abs(o.k / t - 1) < 0.01);
        if (i >= 0) { free(entry.tiers[i]); entry.tiers[i] = b; } else { entry.tiers.push(b); entry.tiers.sort((p, q) => p.k - q.k); }
        this.drawn(d);
      }, urgent);
    });
  }

  /** the browser lost the bitmaps: every sprite is drawn again, as it's asked for */
  redo(): void { for (const e of this.all.values()) e.tiers.forEach(free); this.all.clear(); }
  /** keep only these sprites: the rest have left the house */
  keep(keys: Set<string>): void {
    for (const [k, e] of this.all) if (!keys.has(k)) { e.tiers.forEach(free); this.all.delete(k); }
  }
  /** let go of sharp copies not on screen lately, down to the whole-house one */
  trim(now: number): void {
    const floor = tierOf(this.base) * 1.01;
    for (const e of this.all.values()) {
      if (e.tiers.length < 2) continue;
      e.tiers = e.tiers.filter((b) => {
        if (b.k <= floor || now - (b.used ?? 0) < KEEP) return true;
        free(b);
        return false;
      });
    }
  }
  /** the display font has arrived: a sprite whose labels were written without it is written again (the old copy
   *  shows till then) */
  fonts(): void {
    if (!fontHere()) return;
    for (const e of this.all.values()) for (const b of e.tiers) if (b.font === false) this.want(e.d, b.k);
  }
}
