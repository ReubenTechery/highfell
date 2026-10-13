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
  door: G('M6 21 V5 C6 3 18 3 18 5 V21 M3 21 H21 M14 13 V13.5', 2.6),
  home: G('M3 11 L12 4 L21 11 M6 9 V20 H18 V9', 2.6),
  sound: G('M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 C17.5 10.5 17.5 13.5 16 15', 2.4),
  mute: G('M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 L21 15 M21 9 L16 15', 2.4),
  cloud: G('M7 18 H17 C20 18 21 15 20 13 C19 11 17 11 16 11 C16 8 14 6 11 6 C8 6 6 8 6 11 C4 11 3 13 3 14.5 C3 16.5 5 18 7 18 Z', 2.4),
  device: G('M7 3 H17 V21 H7 Z M11 18 H13', 2.6),
  play: G('M8 5 L19 12 L8 19 Z', 2.6),
};
