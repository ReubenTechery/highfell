/* ---------- the walkout ----------
   When the last boss falls, his lantern drops and what it does next tells you what is in the chest,
   before any loot shows. Once you know, you know.
     normal  it flickers and gutters out.
     unique  it flares gold, stays lit, and the chest knocks twice.
     pet     every light in the yard dies and the sound goes with it. The lantern lifts off the
             ground, and something small walks out of the dark to carry it.
   The first second looks the same every time, so you are always watching the lantern. */
import { TAU } from '../core/math';
import { vrand } from '../core/rng';
import { S } from './state.js';
import { dots, fx, fxText, sfx, shake } from './entities.js';

export const WALKOUT_LEN = { normal: 2.6, unique: 3.4, pet: 6.4 };
export const SPLIT = 1.1; // when the tells start to differ

export function startWalkout(tell, x, y) {
  S.walkout = { tell: tell || 'normal', t: 0, x, y, lift: 0, glow: 1, gold: 0, done: false, beats: new Set(), pet: null };
}

/* runs every frame from the game loop */
export function tickWalkout(dt) {
  const w = S.walkout;
  if (!w || w.done) return;
  w.t += dt;
  const t = w.t, once = (k, at, fn) => { if (t >= at && !w.beats.has(k)) { w.beats.add(k); fn(); } };
  once('drop', 0.05, () => { sfx('thud', 0.5); dots(w.x, w.y, '#9BE15D', 8, 120); });
  if (w.tell === 'normal') {
    if (t > SPLIT) w.glow = Math.max(0, 1 - (t - SPLIT) / 1.1) * (0.6 + 0.4 * Math.abs(Math.sin(t * 23)));
    once('gutter', SPLIT + 1.0, () => { sfx('gutter'); for (let i = 0; i < 6; i++) S.parts.push({ x: w.x + vrand(-6, 6), y: w.y, z: 40, vx: vrand(-10, 10), vy: 0, vz: 0, up: true, col: '#6E6382', size: vrand(4, 7), t: 0, dur: 1.1 }); });
  } else if (w.tell === 'unique') {
    if (t > SPLIT) { w.gold = Math.min(1, (t - SPLIT) / 0.35); w.glow = 1 + w.gold * 0.5; }
    once('flare', SPLIT, () => { sfx('flare'); fx({ type: 'ring', x: w.x, y: w.y - 30, r0: 10, r1: 120, col: '#F2C230', dur: 0.45, w: 6 }); });
    once('knock1', SPLIT + 0.9, () => knock());
    once('knock2', SPLIT + 1.45, () => knock());
  } else {
    // pet: the lights die, the lantern rises, the little one walks out
    once('dark', SPLIT, () => { S.darkTarget = 1; S.dark = Math.max(S.dark, 0.7); S.hush = true; sfx('lightsout', 1, true); });
    if (t > SPLIT + 0.6) w.lift = Math.min(1, (t - SPLIT - 0.6) / 1.4);
    if (t > SPLIT + 1.6) {
      if (!w.pet) w.pet = { x: w.x - 300, flip: false, walkT: 0 };
      const stop = w.x - 26;
      if (w.pet.x < stop) { w.pet.x = Math.min(stop, w.pet.x + 120 * dt); w.pet.walkT += dt * 10; }
    }
    once('chime', SPLIT + 1.7, () => sfx('petchime', 1, true));
    once('caught', SPLIT + 4.2, () => { w.caught = true; S.hush = false; sfx('petfound'); fx({ type: 'ring', x: w.x, y: w.y - 40, r0: 10, r1: 90, col: '#C8F5E8', dur: 0.5, w: 5 }); });
    once('light', SPLIT + 4.6, () => { S.darkTarget = 0; });
  }
  if (t >= WALKOUT_LEN[w.tell]) { w.done = true; S.hush = false; if (w.tell === 'pet') S.darkTarget = 0; }
}

function knock() {
  if (S.chest) S.chest.knockT = 0.22;
  sfx('knock');
  shake(3);
  if (S.chest) dots(S.chest.x, S.chest.y - 20, '#F2C230', 6, 140);
}

/* a boss's table dropped something mid-run: a short gold glint where it fell */
export function lootGlint(x, y, label) {
  fx({ type: 'ring', x, y: y - 40, r0: 10, r1: 110, col: '#F2C230', dur: 0.5, w: 6 });
  dots(x, y - 40, '#F2C230', 18, 200);
  sfx('flare');
  if (label) fxText(x, y - 150, label, '#F2C230', 24, { dur: 2.2 });
}

/* where the walkout wants the camera, or null */
export function walkoutFocus() {
  const w = S.walkout;
  return w && !w.done ? { x: w.x, y: w.y - 60 } : null;
}

/* ---------- drawing, called from render ---------- */
export function drawWalkout(ctx, drawSpr) {
  const w = S.walkout;
  if (!w) return;
  const lit = w.tell === 'pet' ? 1 : w.glow;
  const col = w.gold > 0 ? '#F2C230' : '#9BE15D';
  // the lantern pops up off the ground so nobody stands in front of it, then the tell plays
  const hover = Math.min(1, w.t / 0.5);
  const ly = w.y - 50 * hover * (2 - hover) - 60 * w.lift - Math.sin(S.t * 3) * 4 * hover;
  if (lit > 0.02) {
    ctx.globalAlpha = 0.22 * lit; ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(w.x, ly - 34, 64 + w.gold * 44 + Math.sin(S.t * 9) * 3, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (w.pet) {
    const bob = w.caught ? Math.abs(Math.sin(S.t * 3)) * 2 : Math.abs(Math.sin(w.pet.walkT)) * 3;
    drawSpr(ctx, w.caught ? 'pet_keeper' : 'pet_keeper_reach', w.pet.x, w.y - bob, { sx: 1.25, sy: 1.25 });
  }
  if (!w.caught) drawSpr(ctx, lit > 0.05 ? (w.gold > 0.5 ? 'lantern_gold' : 'lantern') : 'lantern_out', w.x, ly, { sx: 1.3, sy: 1.3 });
}
