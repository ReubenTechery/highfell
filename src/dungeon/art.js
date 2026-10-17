import { TAU } from '../core/math';
import { ART } from './assets.js';

/* ---------- art: SVG sprites baked to bitmaps at the current zoom, plus floor and wall patterns ---------- */
/** the one black line, and the font the fight's words and numbers are drawn in */
export const K = '#1E1A1A';
export const FONT = "'Lilita One', 'Trebuchet MS', sans-serif";
export const SPR = {};
export let BAKE_S = 0;
export const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };

/* Each sprite's SVG is kept as a loaded picture only until it is baked: a loaded SVG picture is a whole
   document in the browser, and keeping all of them (over 300) cost a phone about 55 MB for nothing. The
   game bakes them once at start (prebake in render.js) and lets them go. A new zoom loads them again; until
   then the old bitmap still draws, just at the old sharpness. */
function loadImg(s) {
  if (s.loading) return s.loading;
  const img = new Image();
  s.loading = new Promise((res) => {
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART[s.name].svg);
  }).then((im) => { s.loading = null; s.ok = s.ok || !!im; return im; });
  return s.loading;
}
export function loadArt() {
  for (const [name, a] of Object.entries(ART)) SPR[name] = { name, vb: a.vb, ok: false, img: null, loading: null };
  return Promise.all(Object.values(SPR).map((s) => loadImg(s).then((img) => { s.img = img; })));
}

export function bakeAll(S) {
  BAKE_S = S;
  for (const s of Object.values(SPR)) {
    if (s.bmp && s.S === S) continue;
    if (s.img) { bakeOne(s, S, s.img); s.img = null; continue; }
    void loadImg(s).then((img) => { if (img && BAKE_S === S && SPR[s.name] === s) bakeOne(s, S, img); });
  }
  makePatterns(S);
}
export function bakeOne(s, S, img) {
  const [, , w, h] = s.vb;
  const cw = Math.ceil(w * S), ch = Math.ceil(h * S);
  const c = mkCanvas(cw, ch);
  c.getContext('2d').drawImage(img, 0, 0, cw, ch);
  free(s.bmp); for (const k of VARIANTS) free(s[k]);
  s.bmp = c; s.S = S; for (const k of VARIANTS) s[k] = null;
}
const VARIANTS = ['flash', 'frost', 'dark', 'ghost', 'gold', 'spore'];
/** let every tinted copy go (made as a run needs them): called when a run ends, so they never pile up */
export function dropVariants() { for (const s of Object.values(SPR)) for (const k of VARIANTS) if (s[k]) { free(s[k]); s[k] = null; } }

/* A hero drawn in layers comes to the run as one picture per view, composed by the run screen
   (src/ui/heroart.ts). It is baked once, at the run's scale, like any sprite (a new zoom bakes it again), and
   let go with its tinted copies when the run ends (dropHeroes), so no run leaves a hero behind. Every
   combination of gear is never baked: only the three heroes in this run. Resolves once they're baked. */
export function addHeroes(pics) {
  const waits = [];
  for (const [name, pic] of Object.entries(pics)) {
    if (SPR[name]) continue;
    ART[name] = pic;
    const s = SPR[name] = { name, vb: pic.vb, ok: false, img: null, loading: null, hero: true };
    if (BAKE_S && typeof Image !== 'undefined') waits.push(loadImg(s).then((img) => { if (img && SPR[name] === s) bakeOne(s, BAKE_S, img); }));
  }
  return Promise.all(waits);
}
export function dropHeroes() {
  for (const s of Object.values(SPR)) {
    if (!s.hero) continue;
    free(s.bmp); for (const k of VARIANTS) free(s[k]);
    delete SPR[s.name]; delete ART[s.name];
  }
}
/** let a canvas go now: a phone frees its memory at once only when it has no size left */
function free(c) { if (c) { c.width = 0; c.height = 0; } }
export function variant(s, kind) {
  if (!s.bmp) return null;
  if (s[kind]) return s[kind];
  const c = mkCanvas(s.bmp.width, s.bmp.height);
  const g = c.getContext('2d');
  g.drawImage(s.bmp, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = kind === 'flash' ? '#FFFFFF' : kind === 'frost' ? 'rgba(143, 214, 255, 0.55)' : kind === 'ghost' ? 'rgba(220, 255, 240, 0.85)' : kind === 'gold' ? 'rgba(242, 194, 48, 0.85)' : kind === 'spore' ? 'rgba(155, 225, 93, 0.8)' : kind === 'fire' ? 'rgba(255, 138, 61, 0.6)' : 'rgba(22, 16, 30, 0.6)';
  g.fillRect(0, 0, c.width, c.height);
  s[kind] = c;
  return c;
}
/* draw a sprite with its ground point at (x, y) in world units; sx/sy scale, flip mirrors, tint lays a coloured
   copy over it (tintA strong), and only draws that coloured copy alone (a silhouette, for an outline behind it) */
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
  if (!o.only) ctx.drawImage(s.bmp, vx, vy, w, h);
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
export function makePatterns(S, theme) {
  const th = theme || {};
  const stone = th.stone || ['#4A4060', '#3A3150', '#43395A'];
  const tomb = th.tomb || ['#4F4468', '#3C3354', '#463C5E'];
  const corr = th.corr || ['#453B5A', '#352D4A', '#3E3554'];
  const brick = th.brick || ['#5C5070', '#463C5A'];
  const yard = th.yard || { base: '#463A48', tuftFill: '#5E7A4A', tuftStroke: '#3B4A32', pebbleFill: '#5C5070', pebbleStroke: '#3A3150' };
  PAT.themeId = th.id || 'barrow';
  PAT.voidCol = th.voidCol || '#17121F';
  PAT.wallCapCol = th.wallCapCol || '#2E2638';
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
  PAT.stone = patternFrom(160, 120, S, slabs(stone[0], stone[1], stone[2]));
  PAT.tomb = patternFrom(160, 120, S, slabs(tomb[0], tomb[1], tomb[2]));
  PAT.corr = patternFrom(160, 120, S, slabs(corr[0], corr[1], corr[2]));
  PAT.yard = patternFrom(200, 200, S, (g) => {
    g.fillStyle = yard.base; g.fillRect(0, 0, 200, 200);
    const tuft = (x, y) => { g.fillStyle = yard.tuftFill; g.strokeStyle = yard.tuftStroke; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 5, y - 9); g.lineTo(x - 1, y - 2); g.lineTo(x + 3, y - 11); g.lineTo(x + 6, y - 2); g.lineTo(x + 10, y - 7); g.lineTo(x + 11, y); g.closePath(); g.fill(); g.stroke(); };
    tuft(40, 50); tuft(150, 120); tuft(80, 170); tuft(170, 30);
    g.fillStyle = yard.pebbleFill; g.strokeStyle = yard.pebbleStroke; g.lineWidth = 2;
    for (const [x, y, r] of [[110, 60, 5], [30, 140, 4], [130, 180, 6], [190, 90, 3.5]]) { g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, TAU); g.fill(); g.stroke(); }
  });
  PAT.brick = patternFrom(128, 64, S, (g) => {
    g.fillStyle = brick[0]; g.fillRect(0, 0, 128, 64);
    g.strokeStyle = brick[1]; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 1.5); g.lineTo(128, 1.5); g.moveTo(0, 33.5); g.lineTo(128, 33.5);
    g.moveTo(1.5, 0); g.lineTo(1.5, 32); g.moveTo(65.5, 0); g.lineTo(65.5, 32);
    g.moveTo(33.5, 32); g.lineTo(33.5, 64); g.moveTo(97.5, 32); g.lineTo(97.5, 64);
    g.stroke();
  });
}
