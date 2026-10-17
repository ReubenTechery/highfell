/**
 * Your keys: each class's buttons rebound in Settings, kept in this browser under `highfell.keys` (they belong to
 * a keyboard, not to your save, so a phone and a computer each keep their own). Every read and write is wrapped:
 * with no storage the game uses the starting keys (src/content/keys.ts). Settings' Keys list waits here for the
 * key or mouse button you press next.
 */
import type { GearKey } from '../content/types';
import { bindOf, bindProblem, rebind, type BindSlot, type Binds } from '../content/keys';

const STORE = 'highfell.keys';
type Mine = Partial<Record<GearKey, Partial<Binds>>>;

function load(): Mine {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || '{}');
    const out: Mine = {};
    if (v && typeof v === 'object') {
      for (const [k, b] of Object.entries(v)) {
        if (!b || typeof b !== 'object') continue;
        const keep = Object.fromEntries(Object.entries(b as Record<string, unknown>).filter(([, x]) => typeof x === 'string'));
        out[k as GearKey] = keep as Partial<Binds>;
      }
    }
    return out;
  } catch { return {}; }
}
let mine: Mine = load();
function save(): void { try { localStorage.setItem(STORE, JSON.stringify(mine)); } catch { /* this browser keeps nothing: the keys last until the page closes */ } }

/** your own bindings for a class (only what differs from where it started) */
export const ownKeys = (k: GearKey): Partial<Binds> => mine[k] || {};
export function setKey(k: GearKey, slot: BindSlot, b: string): void { mine = { ...mine, [k]: rebind(k, ownKeys(k), slot, b) }; save(); }
export function resetKeys(k: GearKey): void { const next = { ...mine }; delete next[k]; mine = next; save(); }

/** Settings' Keys list: the button waiting for its key, and why the last one pressed couldn't be it */
export const KEYWAIT: { slot: BindSlot | null; err: string } = { slot: null, err: '' };
let stop: (() => void) | null = null;

/** wait for the next key or mouse button for this button; `done` redraws the list. Esc, or a click with the
 *  left button, stops waiting. */
export function waitForKey(k: GearKey, slot: BindSlot, done: () => void): void {
  stop?.();
  KEYWAIT.slot = slot; KEYWAIT.err = '';
  const take = (b: string): void => {
    const why = bindProblem(k, b);
    if (why) { KEYWAIT.err = why; done(); return; }
    setKey(k, slot, b); end(); done();
  };
  const onKey = (e: KeyboardEvent): void => {
    e.preventDefault(); e.stopPropagation();
    if (e.code === 'Escape') { end(); done(); return; }
    // Shift on its own is waiting for its key; Ctrl and Alt belong to the browser
    if (/^Shift/.test(e.code)) return;
    if (e.ctrlKey || e.altKey || e.metaKey || /^(Control|Alt|Meta|OS)/.test(e.code)) { KEYWAIT.err = 'Ctrl, Alt and Cmd belong to the browser.'; done(); return; }
    take(bindOf(e.code, e.shiftKey));
  };
  const onMouse = (e: MouseEvent): void => {
    // the left button stops waiting; redraw once its click has done whatever it was for (another key to change?)
    if (e.button === 0) { end(); window.addEventListener('click', () => setTimeout(done, 0), { once: true }); return; }
    e.preventDefault(); e.stopPropagation();
    take(`Mouse${e.button}`);
  };
  const noMenu = (e: Event): void => { e.preventDefault(); };
  const end = (): void => {
    window.removeEventListener('keydown', onKey, true); window.removeEventListener('mousedown', onMouse, true);
    window.removeEventListener('contextmenu', noMenu, true); window.removeEventListener('auxclick', noMenu, true);
    KEYWAIT.slot = null; stop = null;
  };
  window.addEventListener('keydown', onKey, true); window.addEventListener('mousedown', onMouse, true);
  window.addEventListener('contextmenu', noMenu, true); window.addEventListener('auxclick', noMenu, true);
  stop = end;
}
/** stop waiting (the sheet closed) */
export function stopWaiting(): void { stop?.(); }
