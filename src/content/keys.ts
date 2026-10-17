/** Each class's keys on a computer. The four buttons sit on E, Q, F and R beside WASD, with each class's main
 *  button on E (the one you mash) and the tank's shield on Q. 1 to 4 always work too. Rebinding comes later
 *  (the combat plan's stage 6) and will start from these. */
import type { AbilitySlot, GearKey } from './types';

export const DEFAULT_KEYS: Record<GearKey, Record<AbilitySlot, string>> = {
  tank: { a1: 'KeyE', a4: 'KeyQ', a2: 'KeyF', a3: 'KeyR' },
  healer: { a4: 'KeyE', a2: 'KeyQ', a1: 'KeyF', a3: 'KeyR' },
  dps: { a4: 'KeyE', a3: 'KeyQ', a1: 'KeyF', a2: 'KeyR' },
  rogue: { a1: 'KeyE', a2: 'KeyQ', a3: 'KeyF', a4: 'KeyR' },
};

const DIGITS: Record<string, AbilitySlot> = { Digit1: 'a1', Digit2: 'a2', Digit3: 'a3', Digit4: 'a4' };

/** which button a key presses for this class, if any */
export function slotForKey(k: GearKey, code: string): AbilitySlot | null {
  const keys = DEFAULT_KEYS[k];
  for (const s of Object.keys(keys) as AbilitySlot[]) if (keys[s] === code) return s;
  return DIGITS[code] ?? null;
}

/** the key a button shows on a computer: "E", "Q", "Space" */
export function keyLabel(k: GearKey, slot: string): string {
  if (slot === 'dodge') return 'Space';
  const code = DEFAULT_KEYS[k][slot as AbilitySlot];
  return code ? code.replace(/^Key|^Digit/, '') : '';
}
