/* The live run. `S` is the whole state of the dungeon in play; the engine reads and writes it every frame.
   HOOKS is how the engine reaches the screen without knowing it: the app fills them in, the
   headless sims leave them as no-ops. */
import { bus } from '../core/events';

/** @type {any} */
export let S = null;
/** mobs any dungeon can spawn on top of its own (the gadgets' bombs, bombs.js): makeMob looks here second */
export const SHARED_MOBS = {};
export function setS(v) { S = v; }

export const HOOKS = {
  nope(_slot) {},          // a button press that could not fire
  fired(_slot) {},         // a button that just fired
  early(_slot) {},         // a press too early to keep: the button's ring pulses (no buzz)
  hint(_key) {},           // show a one-time tip
  pulseFrame(_role) {},    // flash a party frame (a heal landed)
  onWipe() {},             // everyone is down
  onLost() {},             // the solo DPS went down
  onChest() {},            // the final chest opened
  sound(_name, _vol) {},   // play a sound effect
  playerIntent(_h) {},     // read the controls into the player's hero
};
export function setHooks(h) { Object.assign(HOOKS, h); }

/* report something that happened, for achievements, logs and toasts */
export function emit(e) { if (S && !S.noEvents) bus.emit(e); }
