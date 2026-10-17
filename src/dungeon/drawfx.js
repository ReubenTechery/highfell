/* ---------- the air layer: projectiles, chains, effects, bits, and the words and numbers ----------
   render.js draws the ground and everyone standing on it; this draws what flies over them. All of it is only
   drawn: nothing here changes the fight. */
import { TAU, clamp, lerp } from '../core/math';
import { S } from './state.js';
import { FONT, K, drawSpr } from './art.js';
import { chainEnds } from './mobs.js';

export function drawAir(ctx, v) {
  for (const p of S.projs) {
    const a = p.team === 'hero' ? Math.atan2(p.vy || 0, p.vx || 1) : Math.atan2(p.vy, p.vx);
    // a hero's shot trails its weapon's rarity colour (Common keeps the class's own)
    if (p.team === 'hero' && p.col && (p.vx || p.vy)) {
      ctx.lineCap = 'round'; ctx.globalAlpha = 0.55; ctx.lineWidth = 11; ctx.strokeStyle = p.col;
      ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.07, p.y - p.z - p.vy * 0.07); ctx.lineTo(p.x, p.y - p.z); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    drawSpr(ctx, p.sp, p.x, p.y - p.z, { rot: p.spin ? S.t * 14 : a, sx: p.big ? 1.6 : 1, sy: p.big ? 1.6 : 1 });
  }
  for (const ch of S.chains) drawChain(ctx, ch);
  for (const f of S.fx) if (!f.ground && f.type !== 'hand') drawFx(ctx, f);
  for (const p of S.parts) {
    const k = 1 - clamp((p.t - p.dur + 0.25) / 0.25, 0, 1);
    ctx.globalAlpha = k;
    if (p.sp) drawSpr(ctx, p.sp, p.x, p.y - p.z, { rot: p.rot });
    else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y - p.z, p.size, 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
export function drawChain(ctx, ch) {
  const e = chainEnds(ch);
  const n = Math.max(4, Math.round(Math.hypot(e.bx - e.ax, e.by - e.ay) / 22));
  const sag = 26 + Math.sin(S.t * 4) * 6;
  const pt = (t) => ({ x: lerp(e.ax, e.bx, t), y: lerp(e.ay, e.by, t) + Math.sin(t * Math.PI) * sag });
  ctx.globalAlpha = 0.35; ctx.strokeStyle = '#9BE15D'; ctx.lineWidth = 16;
  ctx.beginPath(); for (let i = 0; i <= n; i++) { const p = pt(i / n); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); } ctx.stroke();
  ctx.globalAlpha = 1;
  for (let i = 0; i < n; i++) {
    const p = pt((i + 0.5) / n), q = pt((i + 0.6) / n);
    const a = Math.atan2(q.y - p.y, q.x - p.x) + (i % 2 ? Math.PI / 2 : 0);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    ctx.lineWidth = 6.5; ctx.strokeStyle = K; ctx.beginPath(); ctx.ellipse(0, 0, 10, 5.5, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#C9D2DC'; ctx.stroke();
    ctx.restore();
  }
}
export function drawFx(ctx, f) {
  const k = clamp(f.t / f.dur, 0, 1);
  if (f.type === 'ring') {
    ctx.globalAlpha = 1 - k;
    const r = lerp(f.r0, f.r1, 1 - Math.pow(1 - k, 2));
    ctx.lineWidth = (f.w || 5) + 4; ctx.strokeStyle = K; ctx.beginPath(); if (f.ground) ctx.ellipse(f.x, f.y, r, r * 0.55, 0, 0, TAU); else ctx.arc(f.x, f.y, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = f.w || 5; ctx.strokeStyle = f.col; ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (f.type === 'slash') {
    ctx.globalAlpha = 1 - k;
    const span = f.wide ? 2.2 : 1.6, a0 = f.a - span / 2 + k * 0.3, a1 = f.a + span / 2 * (0.4 + k * 0.6);
    ctx.lineWidth = f.wide ? 16 : 10; ctx.strokeStyle = K; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, a0, a1); ctx.stroke();
    ctx.lineWidth = f.wide ? 9 : 5.5; ctx.strokeStyle = f.col; ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (f.type === 'cleave') {
    const ease = 1 - Math.pow(1 - k, 2.2);
    const span = 2.45;
    let a0 = f.a - span * 0.52 + ease * 0.38;
    let a1 = f.a - span * 0.1 + span * 0.65 * Math.min(1, ease * 1.45);
    // the axe swings left, then right: the second swing is the first mirrored about where it's aimed
    const back = f.dir < 0;
    if (back) { const b0 = 2 * f.a - a1, b1 = 2 * f.a - a0; a0 = b0; a1 = b1; }
    const rr = f.r * (0.82 + 0.22 * ease);
    ctx.save();
    ctx.lineCap = 'round';
    // Outer shockwave trail
    ctx.globalAlpha = (1 - k) * 0.35;
    ctx.lineWidth = f.crush ? 34 : 26;
    ctx.strokeStyle = f.crush ? '#FF8A4C' : '#F2C230';
    ctx.beginPath(); ctx.arc(f.x, f.y, rr * 0.94, a0, a1); ctx.stroke();
    // Main inked blade crescent
    ctx.globalAlpha = 1 - k * 0.85;
    ctx.lineWidth = f.crush ? 22 : 18;
    ctx.strokeStyle = K;
    ctx.beginPath(); ctx.arc(f.x, f.y, rr, a0, a1); ctx.stroke();
    ctx.lineWidth = f.crush ? 13 : 10;
    ctx.strokeStyle = f.col || '#F2C230';
    ctx.stroke();
    // Inner white-hot razor edge
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(f.x, f.y, rr + 2, back ? a0 : a0 + 0.18, back ? a1 - 0.18 : a1); ctx.stroke();
    ctx.restore();
  } else if (f.type === 'whirl') {
    const wx = f.h ? f.h.x : f.x, wy = (f.h ? f.h.y : f.y) - 28;
    const spin = k * TAU * 2.1;
    const fade = k < 0.8 ? 1 : (1 - k) / 0.2;
    ctx.save();
    ctx.translate(wx, wy);
    ctx.scale(1, 0.64);
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 2; arm++) {
      const a0 = spin + arm * Math.PI;
      const a1 = a0 + 2.05;
      const rr = f.r * (0.86 + 0.14 * Math.sin(k * Math.PI));
      ctx.globalAlpha = fade * 0.3;
      ctx.lineWidth = 28; ctx.strokeStyle = '#FF8A4C';
      ctx.beginPath(); ctx.arc(0, 0, rr * 0.92, a0, a1); ctx.stroke();
      ctx.globalAlpha = fade * 0.92;
      ctx.lineWidth = 17; ctx.strokeStyle = K;
      ctx.beginPath(); ctx.arc(0, 0, rr, a0, a1); ctx.stroke();
      ctx.lineWidth = 9.5; ctx.strokeStyle = f.col || '#F2C230';
      ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(0, 0, rr + 2, a0 + 0.35, a1); ctx.stroke();
    }
    ctx.restore();
  } else if (f.type === 'beam') {
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = 9; ctx.strokeStyle = K; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x2, f.y2); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = f.col; ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (f.type === 'nova') {
    // Rime burst's ring of ice, or Ember burst's of fire
    ctx.globalAlpha = 1 - k;
    const r = f.r * (0.3 + 0.7 * Math.sqrt(k));
    ctx.fillStyle = f.fire ? 'rgba(255, 138, 61, 0.28)' : 'rgba(143, 214, 255, 0.25)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.6, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = K; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = f.fire ? '#FFB347' : '#DDF3FF'; ctx.stroke();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; drawSpr(ctx, f.fire ? 'flame' : 'shard_ice', f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6 - 10, { sx: 1.6, sy: 1.6 }); }
    ctx.globalAlpha = 1;
  } else if (f.type === 'comet') {
    // a comet falling onto its spot (a burning one for Fire; Comet Shower's small ones)
    const z = (1 - k) * (f.small ? 300 : 420), sc = f.small ? 0.9 : 1.4;
    drawSpr(ctx, f.sp || 'comet', f.x - (1 - k) * (f.small ? 110 : 160), f.y - 30 - z, { rot: Math.atan2(420, 160) * 0.5 + 0.3, sx: sc, sy: sc });
  } else if (f.type === 'swipe') {
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = 12; ctx.strokeStyle = K; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(lerp(f.x, f.x2, Math.min(1, k * 2)), lerp(f.y, f.y2, Math.min(1, k * 2))); ctx.stroke();
    if (f.col) { ctx.globalAlpha = (1 - k) * 0.4; ctx.lineWidth = 26; ctx.strokeStyle = f.col; ctx.stroke(); ctx.globalAlpha = 1 - k; }
    ctx.lineWidth = 6; ctx.strokeStyle = f.col || '#FFFFFF'; ctx.stroke();
    ctx.globalAlpha = 1;
  }
}


/* words and numbers over the fight: each pops as it appears; a crit's number tilts and bounces once */
export function drawTexts(ctx) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const t of S.texts) {
    const k = t.t / t.dur;
    const pop = k < 0.12 ? 1 + (0.12 - k) * (t.crit ? 5 : 3) : 1;
    ctx.globalAlpha = 1 - clamp((k - 0.7) / 0.3, 0, 1);
    ctx.font = `${Math.round(t.size * pop)}px ${FONT}`;
    ctx.lineWidth = Math.max(4, t.size * 0.26); ctx.strokeStyle = K; ctx.fillStyle = t.col;
    if (t.crit) {
      const hop = k < 0.32 ? Math.abs(Math.sin((k / 0.32) * Math.PI)) * 12 : 0;
      ctx.save(); ctx.translate(t.x, t.y - hop); ctx.rotate(t.tilt || 0);
      ctx.strokeText(t.str, 0, 0); ctx.fillText(t.str, 0, 0);
      ctx.restore();
    } else { ctx.strokeText(t.str, t.x, t.y); ctx.fillText(t.str, t.x, t.y); }
  }
  ctx.globalAlpha = 1;
}

/* a burning foe: a flame flickering over it for each Burn, up to five shown (fire.js) */
export function drawBurn(ctx, m, x, y, n) {
  const top = y - (m.isBoss ? 190 : m.M.big ? 120 : 76), w = m.r * 0.9, shown = Math.min(5, n);
  for (let i = 0; i < shown; i++) {
    const a = (i / shown) * TAU + S.t * 1.6, fl = Math.sin(S.t * 13 + i * 2.1) * 0.12;
    drawSpr(ctx, 'flame', x + Math.cos(a) * w, top + Math.sin(a) * 8, { sx: 0.9 + fl, sy: 0.9 - fl, alpha: 0.9 });
  }
}
/* a Firestorm (or Afterburn's burning ground): an orange pool with flames rising and embers drifting up */
export function drawFireZone(ctx, z) {
  ctx.fillStyle = 'rgba(255, 138, 61, 0.22)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
  ctx.lineWidth = 7; ctx.strokeStyle = K; ctx.stroke();
  ctx.lineWidth = 3.5; ctx.strokeStyle = '#FFB347'; ctx.stroke();
  const n = Math.round(z.r / 8);
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + z.seed, rr = z.r * Math.sqrt(((i * 0.618) % 1));
    const k = ((S.t * 1.3 + i * 0.17) % 1);
    const x = z.x + Math.cos(a) * rr, y = z.y + Math.sin(a) * rr * 0.55;
    drawSpr(ctx, 'flame', x, y - 30 * k, { sx: 1.4 - k * 0.55, sy: 1.55 - k * 0.7, alpha: 1 - k * 0.8 });
  }
}
