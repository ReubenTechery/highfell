/** Each class's keys on a computer. The four buttons sit on E, Q, F and R beside WASD, with each class's main
 *  button on E (the one you mash) and the tank's shield on Q; Space dodges, and 1 to 4 always work too. You can
 *  rebind them in Settings: src/ui/keybinds.ts keeps yours, per class, in this browser (they belong to a
 *  keyboard, not to your save), and these are where they start. */
import type { AbilitySlot, GearKey } from './types';

/** a button you can bind: the four, and the dodge */
export type BindSlot = AbilitySlot | 'dodge';
/** what presses each button: a key's code ("KeyE"), Shift and a key ("Shift+KeyE"), or a mouse button ("Mouse3") */
export type Binds = Record<BindSlot, string>;

export const DEFAULT_KEYS: Record<GearKey, Record<AbilitySlot, string>> = {
  tank: { a1: 'KeyE', a4: 'KeyQ', a2: 'KeyF', a3: 'KeyR' },
  healer: { a4: 'KeyE', a2: 'KeyQ', a1: 'KeyF', a3: 'KeyR' },
  dps: { a4: 'KeyE', a3: 'KeyQ', a1: 'KeyF', a2: 'KeyR' },
  rogue: { a1: 'KeyE', a2: 'KeyQ', a3: 'KeyF', a4: 'KeyR' },
};
export const DODGE_KEY = 'Space';

const DIGITS: Record<string, AbilitySlot> = { Digit1: 'a1', Digit2: 'a2', Digit3: 'a3', Digit4: 'a4' };
/** keys that can never be a button: they walk, pause, or are Shift and friends on their own */
const RESERVED = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'KeyP', 'Tab', 'Enter', 'CapsLock']);
/** the healer's own keys: Mend the tank, yourself, the DPS */
export const MEND_KEYS: Record<string, 'tank' | 'healer' | 'dps'> = { KeyZ: 'tank', KeyX: 'healer', KeyC: 'dps' };

/** a class's bindings: where they start, with yours over them */
export function bindsFor(k: GearKey, own?: Partial<Binds> | null): Binds {
  return { ...DEFAULT_KEYS[k], dodge: DODGE_KEY, ...(own || {}) };
}
/** a key press as a binding: Shift and the key while Shift is held (Shift on its own is just Shift) */
export function bindOf(code: string, shift: boolean): string {
  return shift && !code.startsWith('Shift') ? `Shift+${code}` : code;
}
/** which button a press works for this class, if any: its binding first, then the same key without Shift (so
 *  Shift+E is E unless you bound Shift+E), then 1 to 4 */
export function slotForKey(k: GearKey, bind: string, own?: Partial<Binds> | null): BindSlot | null {
  const b = bindsFor(k, own);
  for (const s of Object.keys(b) as BindSlot[]) if (b[s] === bind) return s;
  if (bind.startsWith('Shift+')) return slotForKey(k, bind.slice(6), own);
  return DIGITS[bind] ?? null;
}
/** does one of this class's buttons use Shift? Then Shift on its own stops dodging */
export function usesShift(k: GearKey, own?: Partial<Binds> | null): boolean {
  return Object.values(bindsFor(k, own)).some((b) => b.startsWith('Shift+'));
}

/** a binding as a button shows it: "E", "Shift E", "Space", "Mouse 4" */
export function bindLabel(b: string): string {
  if (!b) return '';
  if (b.startsWith('Shift+')) return `Shift ${bindLabel(b.slice(6))}`;
  if (b.startsWith('Mouse')) return { Mouse1: 'Middle', Mouse2: 'Right' }[b] || `Mouse ${+b.slice(5) + 1}`;
  return b.replace(/^Key|^Digit|^Numpad/, '').replace(/^Arrow/, '');
}
/** the key a button shows on a computer, for this class */
export function keyLabel(k: GearKey, slot: string, own?: Partial<Binds> | null): string {
  return bindLabel(bindsFor(k, own)[slot as BindSlot] || '');
}

/** why this can't be one of this class's buttons, or null when it can */
export function bindProblem(k: GearKey, b: string): string | null {
  const code = b.replace(/^Shift\+/, '');
  if (b === 'Mouse0') return 'The left button picks your target.';
  if (RESERVED.has(code)) return 'W, A, S, D and the arrows walk, and Esc and P pause.';
  if (k === 'healer' && MEND_KEYS[code]) return 'Z, X and C Mend your party.';
  if (/^(Shift|Control|Alt|Meta|OS)/.test(code)) return 'Pick a key to go with it.';
  return null;
}
/** your bindings with this button on `b`: the button that had `b` takes this one's old binding, so no two share */
export function rebind(k: GearKey, own: Partial<Binds>, slot: BindSlot, b: string): Partial<Binds> {
  const cur = bindsFor(k, own), def = bindsFor(k), next: Partial<Binds> = { ...own };
  const other = (Object.keys(cur) as BindSlot[]).find((s) => s !== slot && cur[s] === b);
  if (other) next[other] = cur[slot];
  next[slot] = b;
  // only what differs from where it started is kept
  for (const s of Object.keys(next) as BindSlot[]) if (next[s] === def[s]) delete next[s];
  return next;
}
