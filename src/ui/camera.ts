/**
 * A camera over a big SVG drawing, like a map: drag to look around, pinch or scroll to zoom, and
 * smooth flights to a point. It only moves the view (the SVG's viewBox). What a tap does is up to the
 * scene, which asks `moved()` first so the click that ends a drag or a pinch never counts as a tap.
 * Pointers that start on the scene's buttons (anything inside `.no-cam`) are left alone.
 */
import { reducedMotion } from './dom';

export interface CameraOpts {
  /** the furthest the view may go: left, top, right, bottom in world units */
  bounds: [number, number, number, number];
  /** called after the view changes, at most once a frame */
  onChange: () => void;
}
type Pt = { x: number; y: number };

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

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
  private raf = 0;

  constructor(private root: HTMLElement, private svg: () => SVGSVGElement | null, private o: CameraOpts) {
    this.bind();
  }

  /** Read the screen's size again (after a resize, or the scene being shown). */
  measure(): void {
    const r = this.root.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
  }
  set(cx: number, cy: number, z: number): void {
    this.flight++;
    this.cx = cx; this.cy = cy; this.z = z;
    this.clamp();
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
  /** A smooth move to a point and a zoom; with reduced motion, a jump. */
  flyTo(cx: number, cy: number, z: number, ms = 480): void {
    const id = ++this.flight;
    const from = { cx: this.cx, cy: this.cy, z: this.z };
    const to = this.clamped(cx, cy, clamp(z, this.zMin, this.zMax));
    if (reducedMotion()) { this.set(to.cx, to.cy, to.z); return; }
    const t0 = performance.now();
    const step = (t: number) => {
      if (id !== this.flight) return;
      // a frame's time can be from just before the flight began: never run it backwards
      const k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3);
      this.z = from.z * Math.pow(to.z / from.z, e);
      this.cx = from.cx + (to.cx - from.cx) * e;
      this.cy = from.cy + (to.cy - from.cy) * e;
      this.write();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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
  /** write the view now */
  private write(): void {
    const s = this.svg();
    const vw = this.w / this.z, vh = this.h / this.z;
    if (s) s.setAttribute('viewBox', `${(this.cx - vw / 2).toFixed(1)} ${(this.cy - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
    this.o.onChange();
  }
  /** write the view on the next frame: many pointer moves, one redraw */
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
      this.flight++;
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
      if (this.pts.size === 0) { this.drag = null; el.classList.remove('dragging'); }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      if (skip(e)) return;
      e.preventDefault();
      this.flight++;
      const at = local({ x: e.clientX, y: e.clientY });
      // a trackpad pinch arrives as a wheel with ctrl held, in small steps
      this.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0016)), at.x, at.y);
    }, { passive: false });
  }
}
