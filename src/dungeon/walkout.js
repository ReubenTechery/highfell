/* ---------- the walkout ----------
   When the last boss falls, his lantern drops and what it does next tells you what is in the chest,
   before any loot shows. Once you know, you know.
     normal  it flickers and gutters out.
     kit     (Heroic) it stays lit and green, gold dust sifts down from it onto the chest, and the lid
             rings once like a little bell: a gilding kit is inside.
     unique  it flares gold, stays lit, and the chest knocks twice. With a kit inside too, the gold
             dust falls after the knocks and the bell rings.
     pet     every light in the yard dies and the sound goes with it. The lantern lifts off the
             ground, and something small walks out of the dark to carry it.
   The first second looks the same every time, so you are always watching the lantern.
   That's the Barrow's. Another dungeon names its own (`walkout` in its engine def): Thimblebriar Hollow's is the
   Tinker King's cuckoo clock (cuckoo.js), on the same clock with the same moments. */
import { TAU } from '../core/math';
import { vrand } from '../core/rng';
import { S } from './state.js';
import { dots, fx, fxText, sfx, shake } from './entities.js';
import { cuckooBeats, cuckooPet, drawCuckoo } from './cuckoo.js';

/** what each dungeon's walkout leaves beside the chest for each tell (the reveal shows the same): its sprites */
export const TELL_SPRITES = {
  lantern: { normal: 'lantern_out', kit: 'lantern', unique: 'lantern_gold' },
  cuckoo: { normal: 'cuckoo_tell_still', kit: 'cuckoo_tell', unique: 'cuckoo_gold' },
};

export const WALKOUT_LEN = { normal: 2.6, kit: 3.2, unique: 3.4, pet: 6.4 };
export const SPLIT = 1.1; // when the tells start to differ

/* `gild`: a gilding kit is in the chest too (the kit tell always has one; the pet's moment stays its own) */
export function startWalkout(tell, x, y, gild) {
  const t = tell || 'normal';
  S.walkout = { tell: t, style: (S.dg && S.dg.walkout) || 'lantern', gild: t === 'kit' || (!!gild && t === 'unique'), t: 0, x, y, lift: 0, glow: 1, gold: 0, done: false, beats: new Set(), pet: null };
}

/* runs every frame from the game loop */
export function tickWalkout(dt) {
  const w = S.walkout;
  if (!w || w.done) return;
  w.t += dt;
  const t = w.t, once = (k, at, fn) => { if (t >= at && !w.beats.has(k)) { w.beats.add(k); fn(); } };
  once('drop', 0.05, () => { sfx('thud', 0.5); dots(w.x, w.y, w.style === 'cuckoo' ? '#FF9F43' : '#9BE15D', 8, 120); });
  if (w.style === 'cuckoo') cuckooTick(w, t, dt, once);
  else if (w.tell === 'normal') {
    if (t > SPLIT) w.glow = Math.max(0, 1 - (t - SPLIT) / 1.1) * (0.6 + 0.4 * Math.abs(Math.sin(t * 23)));
    once('gutter', SPLIT + 1.0, () => { sfx('gutter'); for (let i = 0; i < 6; i++) S.parts.push({ x: w.x + vrand(-6, 6), y: w.y, z: 40, vx: vrand(-10, 10), vy: 0, vz: 0, up: true, col: '#6E6382', size: vrand(4, 7), t: 0, dur: 1.1 }); });
  } else if (w.tell === 'kit') {
    // the lantern holds, still green: no flare and no knocks
    if (t > SPLIT) w.glow = 1 + 0.12 * Math.sin(t * 6);
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
  if (w.gild) {
    // gold dust sifts from the lantern (or clock) down onto the chest, then the lid rings once like a little bell
    const from = w.tell === 'unique' ? SPLIT + 0.5 : SPLIT + 0.1, bell = from + 1.5;
    if (t > from && t < from + 0.8) { w.dust = (w.dust || 0) + dt * 40; while (w.dust >= 1) { w.dust--; goldDust(w); } }
    once('bell', bell, () => {
      sfx('gild');
      const c = S.chest || w;
      fx({ type: 'ring', x: c.x, y: c.y - 30, r0: 8, r1: 80, col: '#F2C230', dur: 0.5, w: 4 });
      dots(c.x, c.y - 34, '#FFE9A8', 10, 110);
    });
  }
  if (t >= WALKOUT_LEN[w.tell]) { w.done = true; S.hush = false; if (w.tell === 'pet') S.darkTarget = 0; }
}

/* the cuckoo clock's moments, on the walkout's clock: its light, the pops and knocks, midnight and the pet */
function cuckooTick(w, t, dt, once) {
  cuckooBeats(w, t, once, SPLIT, knock, sfx);
  if (w.tell === 'normal' && t > SPLIT) w.glow = Math.max(0, 1 - (t - SPLIT) / 1.6);
  else if (w.tell === 'unique') {
    if (t > SPLIT) { w.gold = Math.min(1, (t - SPLIT) / 0.35); w.glow = 1 + w.gold * 0.5; }
    once('flare', SPLIT, () => { sfx('flare'); fx({ type: 'ring', x: w.x, y: w.y - 80, r0: 10, r1: 120, col: '#F2C230', dur: 0.45, w: 6 }); });
  } else if (w.tell === 'pet') {
    once('dark', SPLIT, () => { S.darkTarget = 1; S.dark = Math.max(S.dark, 0.7); S.hush = true; sfx('lightsout', 1, true); });
    cuckooPet(w, dt, SPLIT);
    once('chime', SPLIT + 1.7, () => sfx('petchime', 1, true));
    once('caught', SPLIT + 4.2, () => { w.caught = true; w.flying = false; S.hush = false; sfx('petfound'); fx({ type: 'ring', x: w.pet ? w.pet.x : w.x, y: w.y - 40, r0: 10, r1: 90, col: '#C8F5E8', dur: 0.5, w: 5 }); });
    once('light', SPLIT + 4.6, () => { S.darkTarget = 0; });
  }
}

/* a mote of gold dust: from the lantern's flame, drifting down to land on the chest's lid */
function goldDust(w) {
  const c = S.chest, x = w.x + vrand(-12, 12), z = 84 + vrand(-10, 6);
  const tx = c ? c.x + vrand(-28, 28) : x + vrand(-24, 24), ty = c ? c.y - 2 : w.y + vrand(-8, 8), tz = c ? 34 : 0;
  const dur = Math.min(1.1, Math.max(0.6, Math.hypot(tx - x, ty - w.y) / 320)) + vrand(0, 0.15);
  S.parts.push({ x, y: w.y, z, vx: (tx - x) / dur, vy: (ty - w.y) / dur, vz: 0, fall: (z - tz) / dur, col: vrand(0, 1) < 0.6 ? '#F2C230' : '#FFE9A8', size: vrand(2.6, 4.4), t: 0, dur });
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
  if (w.style === 'cuckoo') { drawCuckoo(ctx, w, drawSpr); return; }
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
