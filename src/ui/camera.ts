/**
 * A camera over a big drawing, like a map: drag to look around, pinch or scroll to zoom, and smooth
 * flights to a point. It never redraws the drawing to move: the drawing sits in a `layer` the browser moves
 * and scales as a picture, and inside it a `world` holds everything in world units at the zoom it was last
 * drawn sharp at (`base`). When the camera comes to rest at a new zoom, it rebases: the world is drawn
 * sharp again at that zoom (never past SHARP_MAX, and at no more than 2x pixels) and the layer goes back to scale 1. What a tap does is up to the scene, which
 * asks `moved()` first so the click that ends a drag or a pinch never counts as a tap. Pointers that start
 * on the scene's buttons (anything inside `.no-cam`) are left alone.
 */
import { reducedMotion } from './dom';

export interface CameraOpts {
  /** the furthest the view may go: left, top, right, bottom in world units; the world's top left is the first two */
  bounds: [number, number, number, number];
  /** called after the view changes, at most once a frame */
  onChange: () => void;
}
type Pt = { x: number; y: number };

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
/** how long the camera must be still before the world is drawn sharp again */
const REST_MS = 150;
/** The sharpest the world is ever drawn. Past this zoom the layer is only scaled up as a picture (a little
 *  soft), because drawing the whole world sharp at a close zoom makes a picture far bigger than a phone will
 *  hold: iOS then leaves parts of it blank. A room fills a phone at about 0.6, so that stays sharp. */
const SHARP_MAX = 0.8;

export class Camera {
  /** the world point at the middle of the screen, and the zoom in screen pixels per world unit */
  cx = 0; cy = 0; z = 1;
  /** the screen's size in pixels */
  w = 1; h = 1;
  zMin = 0.1; zMax = 3;
  private pts = new Map<number, Pt>();
  private drag: { x: number; y: number; moved: boolean } | null = null;
  private pinch: { d: number; z: number; m: Pt } | null = null;
  private quiet = 0;
  private flight = 0;
  private flying = false;
  private raf = 0;
  /** the zoom the world was last drawn at, and the timer that redraws it when the camera rests */
  private base = 0;
  /** whether the layer is marked as moving (will-change), from the first move until the camera rests */
  private moving = false;
  private rest = 0;

  constructor(private root: HTMLElement, private layer: HTMLElement, private world: HTMLElement, private o: CameraOpts) {
    this.bind();
  }

  /** Read the screen's size again (after a resize, or the scene being shown). */
  measure(): void {
    const r = this.root.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
  }
  set(cx: number, cy: number, z: number): void {
    this.stop();
    this.cx = cx; this.cy = cy; this.z = z;
    this.clamp();
    if (!this.pts.size) this.rebase();
    this.write();
  }
  toWorld(px: number, py: number): [number, number] { return [this.cx + (px - this.w / 2) / this.z, this.cy + (py - this.h / 2) / this.z]; }
  toScreen(wx: number, wy: number): [number, number] { return [(wx - this.cx) * this.z + this.w / 2, (wy - this.cy) * this.z + this.h / 2]; }
  /** true for a moment after a drag or a pinch, so the click that ends it does nothing */
  moved(): boolean { return performance.now() < this.quiet; }

  /** Zoom by a factor, keeping the world point under (px, py) where it is. */
  zoomAt(f: number, px: number, py: number): void {
    const [wx, wy] = this.toWorld(px, py);
    this.z = clamp(this.z * f, this.zMin, this.zMax);
    this.cx = wx - (px - this.w / 2) / this.z;
    this.cy = wy - (py - this.h / 2) / this.z;
    this.clamp();
    this.apply();
  }
  panBy(dx: number, dy: number): void {
    this.cx -= dx / this.z;
    this.cy -= dy / this.z;
    this.clamp();
    this.apply();
  }
  /** A smooth move to a point and a zoom; with reduced motion, a jump. `done` runs when it lands, unless
   *  something else moves the camera first. */
  flyTo(cx: number, cy: number, z: number, ms = 480, done?: () => void): void {
    const from = { cx: this.cx, cy: this.cy, z: this.z };
    const to = this.clamped(cx, cy, clamp(z, this.zMin, this.zMax));
    if (reducedMotion() || (Math.hypot(to.cx - from.cx, to.cy - from.cy) < 1 && Math.abs(to.z / from.z - 1) < 0.002)) { this.set(to.cx, to.cy, to.z); done?.(); return; }
    this.stop();
    const id = this.flight;
    this.flying = true;
    const t0 = performance.now();
    const step = (t: number) => {
      if (id !== this.flight) return;
      // a frame's time can be from just before the flight began: never run it backwards
      const k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3);
      this.z = from.z * Math.pow(to.z / from.z, e);
      this.cx = from.cx + (to.cx - from.cx) * e;
      this.cy = from.cy + (to.cy - from.cy) * e;
      if (k < 1) { this.write(); requestAnimationFrame(step); return; }
      // landed: sharp straight away
      this.flying = false;
      this.rebase();
      this.write();
      done?.();
    };
    requestAnimationFrame(step);
  }

  /** cancel any flight */
  private stop(): void {
    this.flight++;
    this.flying = false;
  }
  /** where the view would be after clamping, without moving it */
  private clamped(cx: number, cy: number, z: number): { cx: number; cy: number; z: number } {
    const [x0, y0, x1, y1] = this.o.bounds;
    const vw = this.w / z, vh = this.h / z;
    return {
      cx: vw >= x1 - x0 ? (x0 + x1) / 2 : clamp(cx, x0 + vw / 2, x1 - vw / 2),
      cy: vh >= y1 - y0 ? (y0 + y1) / 2 : clamp(cy, y0 + vh / 2, y1 - vh / 2),
      z,
    };
  }
  private clamp(): void {
    this.z = clamp(this.z, this.zMin, this.zMax);
    const c = this.clamped(this.cx, this.cy, this.z);
    this.cx = c.cx; this.cy = c.cy;
  }
  /** draw the world sharp at the zoom the camera is at now (a repaint, so only when it has changed) */
  private rebase(): void {
    // a 3x phone gets the world drawn at 2x and scaled up a touch, like the dungeon: a third of the memory
    const dpr = window.devicePixelRatio || 1, want = Math.min(this.z, SHARP_MAX) * (dpr > 2 ? 2 / dpr : 1);
    if (this.base && Math.abs(want / this.base - 1) < 0.002) return;
    this.base = want;
    this.world.style.transform = `scale(${this.base})`;
  }
  /** after the camera has been still a moment, with no finger down and no flight, draw it sharp */
  private settle(): void {
    if (this.pts.size || this.flying) return;
    const was = this.base;
    this.rebase();
    if (this.base !== was) this.write();
    else this.still();
  }
  /** At rest the layer stops being marked as moving, so the browser paints the whole world fresh at the zoom
   *  it's at now. Marked as moving for good, a phone keeps the first zoom's sharpness and, after a flight out
   *  of a room, paints only the patch that was on screen before. */
  private still(): void {
    if (!this.moving) return;
    this.moving = false;
    this.layer.style.willChange = 'auto';
  }
  /** write the view now: move and scale the layer, in whole device pixels so it stays crisp at rest */
  private write(): void {
    if (!this.base) this.rebase();
    // while the camera moves, the browser slides and scales the layer as one picture, with no repaints
    if (!this.moving) { this.moving = true; this.layer.style.willChange = 'transform'; }
    const [x0, y0] = this.o.bounds;
    const dpr = window.devicePixelRatio || 1, snap = (v: number): number => Math.round(v * dpr) / dpr;
    this.layer.style.transform = `translate(${snap(this.w / 2 - (this.cx - x0) * this.z)}px, ${snap(this.h / 2 - (this.cy - y0) * this.z)}px) scale(${(this.z / this.base).toFixed(5)})`;
    this.o.onChange();
    clearTimeout(this.rest);
    this.rest = window.setTimeout(() => this.settle(), REST_MS);
  }
  /** write the view on the next frame: many pointer moves, one move of the layer */
  private apply(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.write(); });
  }

  private bind(): void {
    const el = this.root;
    const local = (p: Pt): Pt => { const r = el.getBoundingClientRect(); return { x: p.x - r.left, y: p.y - r.top }; };
    const skip = (e: Event): boolean => !!(e.target as Element).closest?.('.no-cam');
    el.addEventListener('pointerdown', (e) => {
      if (skip(e) || (e.pointerType === 'mouse' && e.button !== 0)) return;
      this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.stop();
      if (this.pts.size === 1) this.drag = { x: e.clientX, y: e.clientY, moved: false };
      if (this.pts.size === 2) {
        const [a, b] = [...this.pts.values()];
        this.pinch = { d: Math.max(1, dist(a, b)), z: this.z, m: mid(a, b) };
        this.drag = null;
      }
    });
    el.addEventListener('pointermove', (e) => {
      const p = this.pts.get(e.pointerId);
      if (!p) return;
      const before = { x: p.x, y: p.y };
      p.x = e.clientX; p.y = e.clientY;
      if (this.pinch && this.pts.size >= 2) {
        const [a, b] = [...this.pts.values()];
        const m = mid(a, b), at = local(m);
        this.zoomAt((this.pinch.z * dist(a, b)) / this.pinch.d / this.z, at.x, at.y);
        this.panBy(m.x - this.pinch.m.x, m.y - this.pinch.m.y);
        this.pinch.m = m;
        this.quiet = performance.now() + 300;
        return;
      }
      const d = this.drag;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
        d.moved = true;
        el.classList.add('dragging');
        try { el.setPointerCapture(e.pointerId); } catch { /* fine */ }
      }
      if (d.moved) { this.panBy(e.clientX - before.x, e.clientY - before.y); this.quiet = performance.now() + 300; }
    });
    const end = (e: PointerEvent) => {
      if (!this.pts.delete(e.pointerId)) return;
      if (this.pts.size < 2) this.pinch = null;
      if (this.pts.size === 1) { const [a] = [...this.pts.values()]; this.drag = { x: a.x, y: a.y, moved: true }; }
      if (this.pts.size === 0) {
        this.drag = null;
        el.classList.remove('dragging');
        clearTimeout(this.rest);
        this.rest = window.setTimeout(() => this.settle(), REST_MS);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      if (skip(e)) return;
      e.preventDefault();
      this.stop();
      const at = local({ x: e.clientX, y: e.clientY });
      // a trackpad pinch arrives as a wheel with ctrl held, in small steps
      this.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0016)), at.x, at.y);
    }, { passive: false });
  }
}
