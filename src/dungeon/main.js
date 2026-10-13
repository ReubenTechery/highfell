import { loadArt } from './art.js';
import { MAP, ORDER, SLOTS, dist, tierSet } from './core.js';
import { S, hurtHero } from './entities.js';
import { newGame, respawn, update } from './game.js';
import { heroBy } from './heroes.js';
import { bindInput } from './input.js';
import { cutChain } from './mobs.js';
import { VIEW, render, resizeView, updateCam } from './render.js';
import { $, G, UI, backToStart, doRolls, hudTick, loadSave, renderStart, startRun, syncStart, writeSave } from './ui.js';

/* ---------- boot and the frame loop ---------- */
export const STEP = 1 / 60;
export const TEST = { manual: false };
export let LAST = 0, ACC = 0;
UI.inGame = () => !!S && $('ov-start').hidden && !$('hud').hidden;

export function frame(ts) {
  requestAnimationFrame(frame);
  const now = ts / 1000;
  let dt = LAST ? now - LAST : STEP;
  LAST = now;
  if (dt > 0.25) dt = 0.25;
  if (S && !TEST.manual && UI.inGame()) {
    ACC += dt;
    let n = 0;
    while (ACC >= STEP && n < 6) { update(STEP); ACC -= STEP; n++; }
    if (n >= 6) ACC = 0;
  } else ACC = 0;
  if (S) { updateCam(dt); if (!TEST.manual) hudTick(dt); }
  render();
}

export function bindScreens() {
  $('go').addEventListener('click', () => { UI.audioKick(); startRun(); });
  $('solo').addEventListener('click', () => { UI.audioKick(); startRun({ solo: true }); });
  $('roll-btn').addEventListener('click', () => { UI.audioKick(); doRolls(); });
  $('again').addEventListener('click', () => startRun({ role: S.opts.role, tier: S.tier }));
  $('tostart').addEventListener('click', () => backToStart());
  $('pause-btn').addEventListener('click', (e) => { e.stopPropagation(); UI.togglePause(); });
  $('cutbtn').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); const ch = S && S.chains[0]; if (ch && S.player.alive) { cutChain(ch, S.player); UI.hintDone('chain'); } });
  let armed = false;
  $('reset-gear').addEventListener('click', () => {
    if (!armed) { armed = true; $('reset-gear').textContent = 'Tap again to reset all three sets'; setTimeout(() => { armed = false; $('reset-gear').textContent = 'Reset my gear to Common'; }, 3000); return; }
    armed = false; const keep = G.save.role; G.save = loadSave(); for (const r of ORDER) for (const [slot] of SLOTS[r]) G.save.gear[r][slot] = { rar: 0, trait: null };
    G.save.role = keep; writeSave(); $('reset-gear').textContent = 'Reset my gear to Common'; syncStart();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S && UI.inGame() && !S.paused && !S.over) UI.togglePause(); });
}

export function backdrop() {
  const role = G.save.role || 'tank';
  const sets = {}; for (const r of ORDER) sets[r] = tierSet(r, 0);
  newGame({ role, sets, start: 'entrance', quiet: true, seed: 7 });
  S.paused = true;
  VIEW.cam.x = 500; VIEW.cam.y = 5320;
  S.player.y = 5420;
  updateCam(0, true);
}

export async function boot() {
  G.save = loadSave();
  G.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  $('game').classList.toggle('touchy', !!G.touch);
  VIEW.cv = $('cv'); VIEW.ctx = VIEW.cv.getContext('2d');
  await loadArt();
  resizeView();
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resizeView, 80); });
  if (document.fonts && document.fonts.load) document.fonts.load('24px "Lilita One"').catch(() => {});
  bindInput();
  bindScreens();
  renderStart();
  backdrop();
  $('loading').hidden = true;
  $('ov-start').hidden = false;
  requestAnimationFrame(frame);
}

/* hooks for automated play-testing */
export function snapState() {
  if (!S) return null;
  return {
    t: +S.t.toFixed(2), over: S.over || '', cleared: S.cleared, cp: S.cp, inCombat: S.inCombat, wipes: S.stats.wipes,
    boss: S.boss ? { name: S.boss.name, hp: Math.round((S.boss.hp / S.boss.maxHp) * 100), phase: S.boss.phase } : null,
    heroes: S.heroes.map((h) => ({ role: h.role, hp: Math.round(h.hp), max: h.maxHp, alive: h.alive, x: Math.round(h.x), y: Math.round(h.y), mana: Math.round(h.mana), dmg: Math.round(h.stats.dmg), heal: Math.round(h.stats.heal), taken: Math.round(h.stats.taken), dodges: h.stats.dodges, perfect: h.stats.perfect, blocks: h.stats.blocks, deaths: h.stats.deaths })),
    mobs: S.mobs.filter((m) => m.alive).length, packs: S.packs.map((p) => p.def.id + (p.cleared ? '+' : p.pulled ? '~' : '-')).join(''),
    stats: S.stats, clear: S.clearTime || null, dark: +S.dark.toFixed(2), ring: S.ring ? Math.round(S.ring.r) : null,
  };
}
window.__crypt = {
  start(o) { TEST.manual = !!(o && o.manual); startRun(Object.assign({ quiet: true }, o || {})); return snapState(); },
  step(n) { for (let i = 0; i < n; i++) { update(STEP); if (S.over === 'victory' || S.over === 'lost') break; if (S.over === 'wipe' && S.timers.length === 0) break; } return snapState(); },
  respawn() { $('ov-msg').hidden = true; respawn(); return snapState(); },
  snap: snapState,
  live() { TEST.manual = false; },
  peek(f) { return f(S, { dist, MAP, heroBy }); },
  wipeNow() { for (const h of S.heroes) if (h.alive) { h.hp = 1; hurtHero(h, 9999, null, { pierce: true, block: false, dodge: false }); } },
};

boot();
