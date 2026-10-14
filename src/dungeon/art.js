import { TAU } from '../core/math';
import { ART } from './assets.js';

/* ---------- art: SVG sprites baked to bitmaps at the current zoom, plus floor and wall patterns ---------- */
export const SPR = {};
export let BAKE_S = 0;
export const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };

export function loadArt() {
  const jobs = [];
  for (const [name, a] of Object.entries(ART)) {
    const img = new Image();
    const s = { name, img, vb: a.vb, ok: false };
    SPR[name] = s;
    jobs.push(new Promise((res) => {
      img.onload = () => { s.ok = true; res(); };
      img.onerror = () => res();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(a.svg);
    }));
  }
  return Promise.all(jobs);
}

export function bakeAll(S) {
  BAKE_S = S;
  for (const s of Object.values(SPR)) bakeOne(s, S);
  makePatterns(S);
}
export function bakeOne(s, S) {
  if (!s.ok) return;
  const [, , w, h] = s.vb;
  const cw = Math.ceil(w * S), ch = Math.ceil(h * S);
  const c = mkCanvas(cw, ch);
  c.getContext('2d').drawImage(s.img, 0, 0, cw, ch);
  s.bmp = c; s.S = S; s.flash = null; s.frost = null; s.dark = null;
}
export function variant(s, kind) {
  if (!s.bmp) return null;
  if (s[kind]) return s[kind];
  const c = mkCanvas(s.bmp.width, s.bmp.height);
  const g = c.getContext('2d');
  g.drawImage(s.bmp, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = kind === 'flash' ? '#FFFFFF' : kind === 'frost' ? 'rgba(143, 214, 255, 0.55)' : kind === 'ghost' ? 'rgba(220, 255, 240, 0.85)' : kind === 'gold' ? 'rgba(242, 194, 48, 0.85)' : 'rgba(22, 16, 30, 0.6)';
  g.fillRect(0, 0, c.width, c.height);
  s[kind] = c;
  return c;
}
/* draw a sprite with its ground point at (x, y) in world units; sx/sy scale, flip mirrors */
export function drawSpr(ctx, name, x, y, o) {
  const s = SPR[name];
  if (!s || !s.bmp) return;
  o = o || {};
  const [vx, vy, w, h] = s.vb;
  const sx = (o.sx || 1) * (o.flip ? -1 : 1), sy = o.sy || 1;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(sx, sy);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.drawImage(s.bmp, vx, vy, w, h);
  if (o.tint) { const v = variant(s, o.tint); if (v) { ctx.globalAlpha *= (o.tintA === undefined ? 1 : o.tintA); ctx.drawImage(v, vx, vy, w, h); } }
  ctx.restore();
}

/* ---------- patterns: drawn in world units, baked at the current zoom ---------- */
export const PAT = {};
export function patternFrom(wu, hu, S, draw) {
  const c = mkCanvas(Math.round(wu * S), Math.round(hu * S));
  const g = c.getContext('2d');
  g.scale(c.width / wu, c.height / hu);
  draw(g);
  const p = g.createPattern(c, 'repeat');
  try { p.setTransform(new DOMMatrix().scale(wu / c.width, hu / c.height)); } catch (e) { /* older engines draw it a touch soft */ }
  return p;
}
export function makePatterns(S) {
  const line = (g, col, w, pts) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
  const slabs = (base, seam, chip) => (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 160, 120);
    g.strokeStyle = seam; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 1.5); g.lineTo(160, 1.5); g.moveTo(0, 61.5); g.lineTo(160, 61.5);
    g.moveTo(1.5, 0); g.lineTo(1.5, 60); g.moveTo(81.5, 0); g.lineTo(81.5, 60);
    g.moveTo(41.5, 60); g.lineTo(41.5, 120); g.moveTo(121.5, 60); g.lineTo(121.5, 120);
    g.stroke();
    line(g, chip, 2.5, [18, 24, 26, 30, 24, 38]);
    line(g, chip, 2.5, [104, 86, 112, 92]);
    line(g, chip, 2.5, [140, 20, 146, 30]);
  };
  PAT.stone = patternFrom(160, 120, S, slabs('#4A4060', '#3A3150', '#43395A'));
  PAT.tomb = patternFrom(160, 120, S, slabs('#4F4468', '#3C3354', '#463C5E'));
  PAT.corr = patternFrom(160, 120, S, slabs('#453B5A', '#352D4A', '#3E3554'));
  PAT.yard = patternFrom(200, 200, S, (g) => {
    g.fillStyle = '#463A48'; g.fillRect(0, 0, 200, 200);
    const tuft = (x, y) => { g.fillStyle = '#5E7A4A'; g.strokeStyle = '#3B4A32'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 5, y - 9); g.lineTo(x - 1, y - 2); g.lineTo(x + 3, y - 11); g.lineTo(x + 6, y - 2); g.lineTo(x + 10, y - 7); g.lineTo(x + 11, y); g.closePath(); g.fill(); g.stroke(); };
    tuft(40, 50); tuft(150, 120); tuft(80, 170); tuft(170, 30);
    g.fillStyle = '#5C5070'; g.strokeStyle = '#3A3150'; g.lineWidth = 2;
    for (const [x, y, r] of [[110, 60, 5], [30, 140, 4], [130, 180, 6], [190, 90, 3.5]]) { g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, TAU); g.fill(); g.stroke(); }
  });
  PAT.brick = patternFrom(128, 64, S, (g) => {
    g.fillStyle = '#5C5070'; g.fillRect(0, 0, 128, 64);
    g.strokeStyle = '#463C5A'; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 1.5); g.lineTo(128, 1.5); g.moveTo(0, 33.5); g.lineTo(128, 33.5);
    g.moveTo(1.5, 0); g.lineTo(1.5, 32); g.moveTo(65.5, 0); g.lineTo(65.5, 32);
    g.moveTo(33.5, 32); g.lineTo(33.5, 64); g.moveTo(97.5, 32); g.lineTo(97.5, 64);
    g.stroke();
  });
}
