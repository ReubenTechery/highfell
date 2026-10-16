/** Small DOM helpers. Every string that reaches innerHTML goes through `esc` unless it is our own art. */

export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Seconds as m:ss. */
export function fmtT(t: number | null | undefined): string {
  if (t == null || !isFinite(t)) return '-';
  const s = Math.max(0, Math.round(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export const fmtN = (n: number): string => Math.round(n).toLocaleString('en-AU');
/** The first letter in capitals. */
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** A drop rate as OSRS writes it: 1/50, 1/5,000. */
export const fmtRate = (r: number | undefined): string => (r ? `1/${fmtN(1 / r)}` : '');
export function fmtDate(at: number): string {
  try { return new Date(at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
}

/** Restart a CSS animation class. */
export function flash(el: Element | null, cls: string, ms: number): void {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

/** One delegated click handler: `data-act="name"` on any element inside `root` calls handlers[name](el, event). */
export function actions(root: HTMLElement, handlers: Record<string, (el: HTMLElement, e: Event) => void>): void {
  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el || !root.contains(el)) return;
    const fn = handlers[el.dataset.act!];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
}

export const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
export const reducedMotion = (): boolean => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** UI glyphs: small line icons for buttons. */
const G = (d: string, w = 3): string => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" style="fill: none; stroke: currentColor; stroke-width: ${w}; stroke-linecap: round; stroke-linejoin: round"/></svg>`;
export const GLYPH = {
  close: G('M6 6 L18 18 M18 6 L6 18'),
  pause: G('M8 5 V19 M16 5 V19', 4),
  gear: G('M12 3 L14 6 L18 5 L18 9 L21 12 L18 15 L18 19 L14 18 L12 21 L10 18 L6 19 L6 15 L3 12 L6 9 L6 5 L10 6 Z M12 9.5 A2.5 2.5 0 1 0 12.01 9.5', 2.4),
  book: G('M4 5 C8 4 10 5 12 7 C14 5 16 4 20 5 V19 C16 18 14 19 12 20 C10 19 8 18 4 19 Z M12 7 V20', 2.6),
  shield: G('M12 3 L19 6 V11 C19 16 16 19 12 21 C8 19 5 16 5 11 V6 Z', 2.6),
  left: G('M15 5 L8 12 L15 19', 3.4),
  right: G('M9 5 L16 12 L9 19', 3.4),
  up: G('M6 15 L12 9 L18 15', 3.2),
  down: G('M6 9 L12 15 L18 9', 3.2),
  rise: G('M12 20 V5 M6 11 L12 5 L18 11', 3.4),
  fall: G('M12 4 V19 M6 13 L12 19 L18 13', 3.4),
  same: G('M5 9 H19 M5 15 H19', 3.4),
  swap: G('M4 8 H18 M14 4 L18 8 L14 12 M20 16 H6 M10 12 L6 16 L10 20', 3),
  door: G('M6 21 V5 C6 3 18 3 18 5 V21 M3 21 H21 M14 13 V13.5', 2.6),
  home: G('M3 11 L12 4 L21 11 M6 9 V20 H18 V9', 2.6),
  sound: G('M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 C17.5 10.5 17.5 13.5 16 15', 2.4),
  mute: G('M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 L21 15 M21 9 L16 15', 2.4),
  cloud: G('M7 18 H17 C20 18 21 15 20 13 C19 11 17 11 16 11 C16 8 14 6 11 6 C8 6 6 8 6 11 C4 11 3 13 3 14.5 C3 16.5 5 18 7 18 Z', 2.4),
  device: G('M7 3 H17 V21 H7 Z M11 18 H13', 2.6),
  play: G('M8 5 L19 12 L8 19 Z', 2.6),
  people: G('M6 8 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M3 20 c0 -3.5 2.7 -6 6 -6 s6 2.5 6 6 M15 5.2 a3 3 0 1 1 0 5.6 M17.2 14.2 c2.4 0.6 3.8 2.8 3.8 5.8', 2.4),
  plus: G('M12 5 V19 M5 12 H19', 3.2),
  dice: G('M5 5 H19 V19 H5 Z M9 9 H9.01 M15 9 H15.01 M12 12 H12.01 M9 15 H9.01 M15 15 H15.01', 2.6),
  trash: G('M4 7 H20 M9 7 V4 H15 V7 M6 7 L7 20 H17 L18 7 M10 11 V16 M14 11 V16', 2.4),
  pen: G('M4 20 L5 15 L16 4 L20 8 L9 19 Z M13 7 L17 11', 2.4),
  check: G('M5 12 L10 17 L19 7', 3.2),
  bag: G('M5 9 H19 L17.5 20 H6.5 Z M9 9 V7.5 C9 4 15 4 15 7.5 V9 M9.5 13 H14.5', 2.4),
  map: G('M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z M9 4 V18 M15 6 V20', 2.3),
  sign: G('M12 3 V21 M9 21 H15 M12 5 H18 L20.5 7.5 L18 10 H12 M12 12 H6 L3.5 14.5 L6 17 H12', 2.4),
  lock: G('M7.5 11 V8 C7.5 4 16.5 4 16.5 8 V11 M5 11 H19 V20.5 H5 Z M12 14.5 V17', 2.4),
  male: G('M9.5 10 a4.5 4.5 0 1 0 0.01 0 M13 11 L19 5 M14 5 H19 V10', 2.6),
  female: G('M12 4.5 a4.5 4.5 0 1 0 0.01 0 M12 13.5 V20.5 M9 17.5 H15', 2.6),
  roller: G('M4 4 H17 V9.5 H4 Z M17 6.75 H20 V13 H11 V15.5 M9.5 15.5 H12.5 V21 H9.5 Z', 2.4),
  pot: G('M3.5 9 H20.5 M5 9 C5 15.5 8 19 12 19 C16 19 19 15.5 19 9 M7.5 18 L6.5 21 M16.5 18 L17.5 21 M9 6.5 a1 1 0 1 0 0.01 0 M14 4.5 a1 1 0 1 0 0.01 0', 2.3),
  eye: G('M2.5 12 C6 6 18 6 21.5 12 C18 18 6 18 2.5 12 Z M12 9.5 a2.5 2.5 0 1 0 0.01 0', 2.4),
  target: G('M12 3 a9 9 0 1 0 0.01 0 M12 8 a4 4 0 1 0 0.01 0 M12 11.5 a0.5 0.5 0 1 0 0.01 0', 2.6),
};
