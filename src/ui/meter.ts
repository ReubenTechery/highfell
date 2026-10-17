/**
 * The live meter: the damage each of you has done so far in a run, behind a switch in Settings, off by default (the
 * duel card at the chest shows it all either way). The switch belongs to this device: it's kept in this browser
 * under `highfell.meter`, never in the save.
 */
const STORE = 'highfell.meter';

function load(): boolean {
  try { return localStorage.getItem(STORE) === '1'; } catch { return false; }
}
let on = load();

/** is the live meter switched on, on this device */
export const meterOn = (): boolean => on;
export function setMeter(v: boolean): void {
  on = v;
  try { localStorage.setItem(STORE, v ? '1' : '0'); } catch { /* this browser keeps nothing: it lasts until the page closes */ }
}
