/* ---------- the beat and the press queue ----------
   The four buttons and Mend share a beat (BEAT.len in content/roles): firing one starts it, and the others on the
   beat wait for it to end. Charge and Shadowstep (offBeat) and the shield never wait for it. While the tank's
   shield is up, buttons on the beat wait too, so a held Cleave can't keep reopening the perfect-block window.

   A press is never thrown away for being early: one made up to BEAT.queue before its button can fire is kept as
   the hero's one waiting press (h.next) and fires the moment it can. One made during a dodge, a dash or a cast
   waits for that to end and then for the beat (its cooldown counts as early only from when it ends), so Charge
   into Cleave lands as one move; the shield holds a press on the beat until it comes down. A tap to Mend waits the whole beat. A dodge clears the waiting press, the newest press replaces
   it, and it lapses after about a beat. A press too early to keep is let go quietly (HOOKS.early pulses the button;
   nothing buzzes).

   Bots don't queue: they press when ready() says the button can fire. */
import { AB, BEAT, abKey } from '../content/roles';
import { HOOKS, S } from './state.js';
import { useAbility } from './heroes.js';
import { mend } from './buttons.js';

/** 'mend' is the healer's tap on a mate: not one of the four buttons, but on the beat like them */
const MEND = 'mend';
const defOf = (h, slot) => AB[abKey(h)][slot];

/** does this button wait for the beat? (everything but Charge, Shadowstep and the shield; Mend does) */
export function onBeat(h, slot) {
  if (slot === MEND) return true;
  const d = defOf(h, slot);
  return !!d && !d.offBeat && !d.hold;
}

/** can this button fire right now, as far as its cooldown, the beat and the shield go? */
export function ready(h, slot) {
  if (slot === MEND) return h.beat <= 0 && h.gcd <= 0;
  if (h.cd[slot] > 0) return false;
  return !onBeat(h, slot) || (h.beat <= 0 && !h.blocking);
}

/** seconds until this button's cooldown and the beat allow it, or Infinity while the hero can't act at all */
function waitFor(h, slot) {
  if (!h.alive || S.over || h.st.stun > 0 || h.st.caged || h.st.air > 0) return Infinity;
  if (slot === MEND) return Math.max(h.beat, h.gcd, 0);
  return Math.max(h.cd[slot], onBeat(h, slot) ? h.beat : 0);
}

/** something that holds a press until it ends: a dodge, a dash, a cast, or the shield for buttons on the beat */
function held(h, slot) {
  return h.dodgeT > 0 || !!h.dash || !!h.cast || (onBeat(h, slot) && h.blocking);
}
/** how long the dodge, dash or cast under way has left: a press made during one counts as early from its end */
function busyLeft(h) {
  return Math.max(h.dodgeT > 0 ? h.dodgeT : 0, h.dash ? Math.max(0, h.dash.t) : 0, h.cast ? Math.max(0, h.cast.dur - h.cast.t) : 0);
}
const fireNow = (h, slot, aim, quiet) => (slot === MEND ? mend(h, aim) : useAbility(h, slot, aim, quiet));

/** The player presses a button (or taps a mate to Mend: slot 'mend', aim the mate): it fires now, waits as the
 *  hero's next press, or is let go quietly. `repeat` is a held touch button pressing again: it never pushes out a
 *  press you tapped, and a repeat that can't fire stays quiet (no "No target", no buzz). Returns true when the
 *  press fired or is waiting. */
export function press(h, slot, aim, repeat = false) {
  if (slot === MEND) { if (!aim || !aim.alive || h.role !== 'healer') return false; }
  else { const def = defOf(h, slot); if (!def || def.hold) return false; }
  if (!h.alive || S.over) return false;
  const wait = waitFor(h, slot);
  if (wait === Infinity) return false;
  if (wait <= 0 && !held(h, slot)) {
    if (h.next && h.next.slot === slot) h.next = null;
    return fireNow(h, slot, aim, repeat);
  }
  // a tap to Mend waits out the whole beat; a button waits only if it's nearly ready. One pressed during a dodge,
  // a Charge or a cast waits out the beat too, if its own cooldown is up by then (Charge into Cleave is one move)
  const busy = busyLeft(h);
  const window = slot === MEND ? BEAT.len + BEAT.queue : BEAT.queue;
  const cdOnly = slot === MEND ? 0 : h.cd[slot];
  if (wait <= window + busy || (busy > 0 && cdOnly <= BEAT.queue + busy)) {
    if (repeat && h.next && !h.next.repeat) return false;
    // it lapses BEAT.wait after the press, or a little after it could first fire if that's later
    h.next = { slot, aim: aim || null, repeat, t: 0, life: Math.max(BEAT.wait, wait + BEAT.queue) };
    return true;
  }
  if (!repeat && h.isPlayer) HOOKS.early(slot);
  return false;
}

/** every tick: the waiting press fires the moment it can, or lapses */
export function tickPress(h, dt) {
  const q = h.next;
  if (!q) return;
  q.t += dt;
  if (q.t > (q.life || BEAT.wait) + busyLeft(h) || !h.alive) { h.next = null; return; }
  const wait = waitFor(h, q.slot);
  if (wait > 0 || held(h, q.slot)) return;
  h.next = null;
  // a picked foe that died while the press waited: let the button pick its own target
  const aim = q.aim && q.aim.kind === 'mob' && !q.aim.alive ? null : q.aim;
  if (q.slot === MEND && !(aim && aim.alive)) return;
  fireNow(h, q.slot, aim, q.repeat);
}
