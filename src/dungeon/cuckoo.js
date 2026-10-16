/* ---------- Thimblebriar Hollow's walkout: the Tinker King's cuckoo clock ----------
   The same moments as the Barrow's lantern (walkout.js keeps the clock); only the thing that tells is new.
     normal  it ticks a few times, slower and slower, and stops.
     kit     (Heroic) it keeps ticking, lit, and gold dust sifts down onto the chest.
     unique  its light turns gold and the cuckoo pops out twice, in gold, as the chest lid jumps.
     pet     it strikes midnight, every light goes out, and the cuckoo flies down carrying the little Tinker King.
   The first second is the same every time: it drops, pops up off the ground and ticks.
   The clock's sprites: `cuckoo` (lit, door shut), `cuckoo_open` (door open), `cuckoo_still` (stopped and dark),
   `cuckoo_bird` and `cuckoo_bird_gold`. Its face is at (0, FACE) from its ground point and its door at
   (0, DOOR); the hands and the pendulum are drawn here. */
import { TAU, clamp } from '../core/math';
import { S } from './state.js';

const FACE = -58, DOOR = -100, PEND = 46;

/* the clock's state from the walkout's own clock: how hard the pendulum swings, and the cuckoo popping out */
export function cuckooBeats(w, t, once, SPLIT, knock, sfx) {
  // the first second: it ticks, the same for every tell
  const ticks = [0.35, 0.7, 1.05];
  if (w.tell === 'normal') ticks.push(SPLIT + 0.4, SPLIT + 0.95, SPLIT + 1.7);
  else if (w.tell !== 'pet') for (let k = SPLIT + 0.35; k < SPLIT + 2.2; k += 0.35) ticks.push(k);
  ticks.forEach((at, i) => once('tick' + i, at, () => sfx('clocktick', 0.8)));
  w.swing = w.tell === 'normal' && t > SPLIT ? clamp(1 - (t - SPLIT) / 1.9, 0, 1) : w.tell === 'pet' && t > SPLIT ? 0 : 1;
  if (w.tell === 'unique') {
    for (const [k, at] of [['pop1', SPLIT + 0.9], ['pop2', SPLIT + 1.45]]) once(k, at, () => { w.popAt = t; sfx('cuckoo', 0.9); knock(); });
  }
  if (w.tell === 'pet') once('midnight', SPLIT + 0.1, () => sfx('midnight', 1, true));
}

/** draw the clock, its pendulum and hands, the cuckoo, and (for the pet) the cuckoo carrying the little king down */
export function drawCuckoo(ctx, w, drawSpr) {
  const lit = w.tell === 'pet' ? (w.caught ? 1 : 0.4) : w.glow;
  const hover = Math.min(1, w.t / 0.5);
  const ly = w.y - 46 * hover * (2 - hover) - Math.sin(S.t * 3) * 3 * hover;
  if (lit > 0.02) {
    ctx.globalAlpha = 0.2 * lit; ctx.fillStyle = w.gold > 0 ? '#F2C230' : '#FF9F43';
    ctx.beginPath(); ctx.arc(w.x, ly + FACE, 70 + w.gold * 40 + Math.sin(S.t * 9) * 3, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // the pendulum swings under the clock (and stops)
  const sw = Math.sin(S.t * 6.2) * 0.42 * (w.swing ?? 1);
  const px = w.x + Math.sin(sw) * PEND, py = ly + Math.cos(sw) * PEND - 8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1E1A1A'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(w.x, ly - 8); ctx.lineTo(px, py); ctx.stroke();
  ctx.strokeStyle = '#D9A520'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = w.gold > 0.5 ? '#F2C230' : '#D9A520'; ctx.lineWidth = 3.5; ctx.strokeStyle = '#1E1A1A';
  ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill(); ctx.stroke();
  const pop = w.popAt !== undefined ? clamp(1 - (w.t - w.popAt) / 0.45, 0, 1) : 0;
  const body = w.tell === 'normal' && lit < 0.35 ? 'cuckoo_still' : pop > 0 ? 'cuckoo_open' : 'cuckoo';
  if (!(w.pet && !w.caught && w.flying)) drawSpr(ctx, body, w.x, ly, { sx: 1.25, sy: 1.25 });
  else drawSpr(ctx, 'cuckoo_open', w.x, ly, { sx: 1.25, sy: 1.25 });
  // the hands: midnight for the pet, otherwise turning with the ticks
  const fx = w.x, fy = ly + FACE * 1.25;
  const turn = w.tell === 'pet' && w.t > 1.2 ? 0 : (w.t * (w.swing ?? 1)) * 1.2;
  hand(ctx, fx, fy, w.tell === 'pet' && w.t > 1.2 ? 0 : -0.6 + turn * 0.15, 11);
  hand(ctx, fx, fy, w.tell === 'pet' && w.t > 1.2 ? 0 : 1.9 + turn, 17);
  // the cuckoo pops out of its door, in gold
  if (pop > 0) {
    const out = Math.sin(Math.min(1, (1 - pop) * 2.2) * Math.PI * 0.5);
    drawSpr(ctx, 'cuckoo_bird_gold', w.x, ly + DOOR * 1.25 + 14 - out * 18, { sx: 0.9 + out * 0.3, sy: 0.9 + out * 0.3 });
  }
  if (w.pet) {
    if (!w.caught) {
      // the cuckoo carries the little king down from its door to the floor beside the chest
      const k = w.pet.k, bx = w.pet.x, by = w.pet.y;
      drawSpr(ctx, 'pet_tinker', bx, by + 6, { sx: 1.15, sy: 1.15 });
      drawSpr(ctx, 'cuckoo_bird', bx, by - 92 - Math.sin(S.t * 18) * 3 * (1 - k), { sx: 1.1, sy: 1.1, flip: true });
    } else drawSpr(ctx, 'pet_tinker', w.pet.x, w.y - Math.abs(Math.sin(S.t * 3)) * 2, { sx: 1.25, sy: 1.25 });
  }
}

/* a clock hand from the middle of the face, `a` radians from twelve o'clock */
function hand(ctx, x, y, a, len) {
  const ex = x + Math.sin(a) * len, ey = y - Math.cos(a) * len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1E1A1A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
}

/** the pet's flight down for the cuckoo tell: from the clock's door to the floor beside it */
export function cuckooPet(w, dt, SPLIT) {
  const from = SPLIT + 1.7, dur = 1.8;
  if (w.t < from) return;
  const ly = w.y - 46;
  const k = clamp((w.t - from) / dur, 0, 1);
  if (!w.pet) w.pet = { x: w.x, y: ly + DOOR, k: 0 };
  w.flying = k < 1;
  w.pet.k = k;
  const ease = k * k * (3 - 2 * k);
  w.pet.x = w.x - 60 * ease;
  w.pet.y = ly + DOOR * 1.25 + (w.y - (ly + DOOR * 1.25)) * ease + Math.sin(k * Math.PI) * -40;
}
