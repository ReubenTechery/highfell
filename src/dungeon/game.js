/* ---------- the run: state, the loop, packs, bosses, wipes, the chest ---------- */
import { dist, distXY, lerp } from '../core/math';
import { setSeed } from '../core/rng';
import { ORDER } from '../content/roles';
import { HOOKS, S, emit, setS } from './state.js';
import { aggro, banner, bits, brewFx, dots, fx, fxText, healHero, hurtHero, hurtMob, makeHero, makeMob, sfx, shake } from './entities.js';
import { botTick, inHaz } from './bots.js';
import { applyBleed, heroBy, heroTick, isFoe, later } from './heroes.js';
import { projHit } from './buttons.js';
import { tickPress } from './press.js';
import { chainTick, curseTick, mobTick, nearestHeroTo, spawnMob } from './mobs.js';
import { canStand, inWalk, moveEnt, roomIndexOf, walkTo } from './world.js';
import { tickWalkout } from './walkout.js';
import { frostbite, has, holyGround } from './specs.js';
import { firestormTick } from './fire.js';

/* dg: a dungeon definition (map, mobs, packs, script). opts:
   { role, loadouts: {tank, healer, dps}, start, solo, seed, auto, quiet, testGear, heroic, noHeal (sims: an idle healer bot),
     xp (this run pays XP: a kill pops it over the mob), xpMul (its dungeon's XP multiplier) } */
export function newGame(dg, opts) {
  setSeed(opts.seed || ((Date.now() & 0xfffffff) | 1));
  setS({
    dg, t: 0, frame: 0, seq: 1, opts, heroes: [], mobs: [], packs: [], projs: [], hazards: [], zones: [], thralls: [], fx: [], texts: [], parts: [], timers: [], rings: [], chains: [],
    gates: JSON.parse(JSON.stringify(dg.gates)), props: [],
    inCombat: false, lastCombat: -99, combatStart: 0, boss: null, bossFight: null, ring: null, seal: null, dark: 0, darkTarget: 0, shake: 0, hurtFlash: 0,
    banner: null, call: null, walkout: null, hush: false, looks: new Set(opts.looks || []), stats: { deaths: 0, perfect: 0, kicks: 0, cuts: 0, cages: 0, wipes: 0, start: 0 }, hints: {}, over: false, chest: null,
    cp: 0, quiet: !!opts.quiet, auto: !!opts.auto, noEvents: !!opts.noEvents, cleared: 0, total: dg.packs.length, startedAt: 0,
    // how hard this dungeon is: hit (everything that hurts a hero), trashHp (health of everything but the
    // bosses), bossHp (the bosses' health), and for a mob named in them, its own health (hp) and how hard its
    // swings hit (dmg). opts.heroic plays it at the dungeon's heroic tune instead.
    tune: Object.assign({ hit: 1, trashHp: 1, bossHp: 1 }, opts.start === 'intro' ? { hit: 0.55, trashHp: 0.65, bossHp: 0.6 } : (opts.heroic && dg.heroic) || dg.tune || {}),
  });
  S.props = dg.props.map((p) => Object.assign({}, p, { room: roomIndexOf(p.x, p.y), sp0: p.sp }));
  const roles = opts.solo ? ['dps'] : ORDER;
  const L = opts.loadouts || {};
  // one bottle poured at the door: the whole party drinks it (opts.brew, a recipe id; see BREW_FX)
  const pour = opts.brew ? { brew: opts.brew, brewCol: opts.brewCol || null } : {};
  S.brewArea = brewFx(opts.brew).area || 1;
  for (const r of roles) S.heroes.push(makeHero(r, r === opts.role, Object.assign({}, L[r], pour)));
  S.player = S.heroes.find((h) => h.isPlayer) || S.heroes[0];
  S.player.isPlayer = true;
  // Brittle is the whole party's (frozen and Chilled foes take more from everyone); the last boss pays the most XP
  S.brittle = S.heroes.some((h) => has(h, 'fr.brittle'));
  S.finalBoss = [...dg.packs].reverse().find((p) => p.boss)?.boss || null;
  S.xpRun = 0;
  for (const def of dg.packs) {
    const p = { def, mobs: [], pulled: false, cleared: false, triggered: !def.ambush };
    if (!def.ambush) for (const [type, x, y] of def.mobs) { const m = makeMob(type, x, y, p); p.mobs.push(m); S.mobs.push(m); }
    S.packs.push(p);
  }
  if (dg.script.setup) dg.script.setup(opts.start || 'entrance');
  placeParty(dg.checkpoints[S.cp]);
  S.mobs = S.mobs.filter((m) => m.alive);
  emit({ type: 'run.start', dungeon: dg.id, role: S.player.role, practice: (opts.start || 'entrance') !== 'entrance', solo: !!opts.solo });
  return S;
}
export function placeParty(cp) {
  const off = { tank: [0, -20], healer: [-46, 34], dps: [46, 34] };
  for (const h of S.heroes) {
    const o = off[h.role];
    h.x = cp.x + o[0]; h.y = cp.y + o[1];
    if (!canStand(h.x, h.y, h.r)) { h.x = cp.x; h.y = cp.y; }
    h.face = -Math.PI / 2; h.back = true;
  }
}

/* ---------- bosses ---------- */
export function startBoss(pack) {
  const m = pack.mobs[0];
  S.boss = m; m.fightT = 0;
  S.bossFight = { boss: m.type, started: S.t, smashes: 0, smashPerfect: 0, bombed: 0 };
  if (S.dg.script.onBossPulled) S.dg.script.onBossPulled(pack);
  banner(m.name, 'boss', 2.2);
  sfx('gate'); sfx('roar');
  shake(4);
  emit({ type: 'boss.pulled', boss: m.type });
}
/* move everyone not already inside the boss room to its doorway */
export function pullIn(room, y) {
  for (const h of S.heroes) {
    if (roomIndexOf(h.x, h.y) === room && h.y < y - 10) continue;
    h.x = 500 + (h.role === 'healer' ? -50 : h.role === 'dps' ? 50 : 0); h.y = y - 20;
    h.dodgeT = 0; h.dash = null; h.st.kx = h.st.ky = 0;
  }
}
export function onBossDead(m) {
  S.boss = null;
  const f = S.bossFight || { started: S.t, smashes: 0, smashPerfect: 0 };
  S.bossFight = null;
  const up = S.heroes.filter((h) => h.alive);
  // where its loot lands: a boss with a lantern drops the lantern
  const L = m.M.light, x = L ? m.x + L.dx * (m.flip ? -1 : 1) : m.x, y = m.y;
  emit({ type: 'boss.killed', boss: m.type, time: S.t - f.started, armorUp: m.armorUp > 0, onlyPlayerAlive: up.length === 1 && up[0] === S.player && S.heroes.length > 1,
    smashes: f.smashes, smashPerfect: f.smashPerfect, playerIsTank: S.player.role === 'tank', x, y, bombed: f.bombed || 0 });
  if (S.dg.script.onBossDead) S.dg.script.onBossDead(m);
}
/* the final chest: the run is cleared once the party opens it */
export function spawnChest(x, y, boss) {
  S.chest = { x, y, open: false, t: 0, boss: boss.type };
  S.clearTime = S.t - S.startedAt;
}
export function checkPack(p) {
  if (p.cleared || p.mobs.some((m) => m.alive)) return;
  p.cleared = true; S.cleared++;
  if (!p.def.boss) {
    const dur = S.t - (p.pulledAt || S.combatStart || S.t);
    const melted = dur > 0.2 && dur < 13.5;
    fxText(S.player.x, S.player.y - 140, melted ? 'MELTED!' : 'Pack down', melted ? '#F2C230' : '#9BE15D', melted ? 25 : 20, { dur: 1.25 });
    // the last of a pack down: a short low chord
    sfx('packdown', 0.8);
  }
}
export function triggerAmbush(p) {
  p.triggered = true; p.pulled = true; p.pulledAt = S.t;
  for (const [type, x, y] of p.def.mobs) {
    const m = spawnMob(type, x, y, null, true);
    m.pack = p; p.mobs.push(m); m.rise = 0.9; m.riseDur = 0.9;
    const near = nearestHeroTo(x, y);
    if (near) aggro(m, near, 3);
  }
  if (S.dg.script.onAmbush) S.dg.script.onAmbush(p);
  shake(7); sfx('rise'); sfx('roar');
}

/* ---------- wipes and coming back ---------- */
export function respawn() {
  const room = S.wipeRoom !== undefined ? S.wipeRoom : S.cp;
  const cps = S.dg.checkpoints;
  const cp = cps[Math.min(room, cps.length - 1)];
  S.hazards = []; S.zones = []; S.thralls = []; S.projs = []; S.rings = []; S.chains = []; S.timers = []; S.ring = null; S.dark = 0; S.darkTarget = 0;
  for (const h of S.heroes) {
    Object.assign(h, { alive: true, hp: h.maxHp, mana: h.maxMana, absorb: 0, absorbT: 0, dodgeT: 0, dash: null, cast: null, blocking: false, target: null, picked: null, holdFire: false, hots: [], ghostSaved: false, beat: 0, next: null, crush: 0, shatter: 0, points: 0, mendUp: false, payback: false, fury: 0, furyT: 0, stormT: 0 });
    h.st = { stun: 0, root: 0, haunt: 0, air: 0, ghost: 0, surge: 0, zeal: 0, kx: 0, ky: 0, chained: null, caged: null, curse: null };
    for (const k in h.cd) h.cd[k] = 0;
    h.bot.ignore = new Set(); h.bot.seen = new Set();
  }
  placeParty(cp);
  S.mobs = S.mobs.filter((m) => m.alive && !m.cage && !m.M.wisp && !m.extra && !m.rally);
  let resetAmbush = false;
  for (const p of S.packs) {
    if (p.cleared) continue;
    if (p.def.ambush && p.triggered) {
      p.triggered = false; p.pulled = false;
      p.mobs.forEach((m) => { m.alive = false; });
      S.mobs = S.mobs.filter((m) => m.pack !== p);
      p.mobs = [];
      resetAmbush = true;
      continue;
    }
    p.pulled = false;
    p.mobs = p.mobs.filter((m) => m.alive && !m.extra);
    for (const m of p.mobs) {
      // its burn, venom, sear and mark go too: a tick after the wipe would pull it straight back into the fight
      Object.assign(m, { x: m.home0 ? m.home0.x : m.home.x, y: m.home0 ? m.home0.y : m.home.y, hp: m.maxHp, state: 'idle', target: null, forced: null, forcedT: 0, wind: 0, cast: null, busy: 0, act: null, pose: null, ab: {}, phase: 1, armorUp: 0, exposed: 0, dmgMul: 1, hidden: false, untargetable: false, jumpZ: 0, calmUntil: S.t + 4, burn: null, bleed: null, sear: null, markBy: null, markUntil: 0 });
      m.threat = new Map(); m.st = { stun: 0, freeze: 0, chill: 0, stagger: 0, slow: 0, slowT: 0, kx: 0, ky: 0 };
      m.speed = m.M.speed;
      if (m.home0) m.home = { x: m.home0.x, y: m.home0.y };
    }
  }
  if (S.dg.script.onRespawn) S.dg.script.onRespawn(resetAmbush);
  S.boss = null; S.bossFight = null; S.inCombat = false; S.lastCombat = S.t - 10; S.over = false; S.wipeRoom = undefined;
  S.stats.wipes++;
  banner('Back on your feet. Go again.', 'good', 2.2);
}

export function runSummary() {
  return {
    dungeon: S.dg.id, role: S.player.role, practice: (S.opts.start || 'entrance') !== 'entrance', testGear: !!S.opts.testGear,
    time: S.clearTime || S.t - S.startedAt, deaths: S.stats.deaths, wipes: S.stats.wipes,
    handHits: S.stats.handHits || 0, ringHits: S.stats.ringHits || 0, saves: S.stats.saves || 0,
    bombHits: S.stats.bombHits || 0, lifts: S.stats.lifts || 0, bursts: S.stats.bursts || 0,
    playerDeaths: S.player.stats.deaths, kicks: S.stats.kicks, perfectBlocks: S.player.stats.perfect,
  };
}

/* ---------- the loop ---------- */
export function update(dt) {
  if (S.over === 'victory' || S.over === 'lost' || S.paused) return;
  S.t += dt; S.frame++;
  for (let i = S.timers.length - 1; i >= 0; i--) { const tm = S.timers[i]; tm.t -= dt; if (tm.t <= 0) { S.timers.splice(i, 1); tm.fn(); } }
  if (S.over) { tickFx(dt); return; }
  S.healerUp = S.heroes.some((x) => x.role === 'healer' && x.alive);
  if (!S.auto) HOOKS.playerIntent(S.player);
  for (const h of S.heroes) { h.botDriven = !h.isPlayer || S.auto; if (h.botDriven) botTick(h, dt); }
  for (const h of S.heroes) { heroTick(h, dt); if (h.next) tickPress(h, dt); }
  for (const m of S.mobs) mobTick(m, dt);
  tickThralls(dt);
  tickProjs(dt); tickHazards(dt); tickZones(dt); tickRings(dt);
  for (const ch of S.chains.slice()) chainTick(ch, dt);
  for (const h of S.heroes) if (h.st.curse) curseTick(h, dt);
  if (S.ring) tickFireRing(dt);
  separate();
  // fight state
  const fighting = S.mobs.some((m) => m.alive && m.state === 'fight' && !m.cage);
  if (fighting) { if (!S.inCombat) { S.inCombat = true; S.combatStart = S.t; } S.lastCombat = S.t; }
  else if (S.inCombat) { S.inCombat = false; onCombatEnd(); }
  if (S.dg.script.triggers) S.dg.script.triggers();
  if (S.walkout) tickWalkout(dt);
  if (!S.inCombat) { const r = roomIndexOf(S.player.x, S.player.y); if (r > S.cp) S.cp = r; }
  S.mobs = S.mobs.filter((m) => m.alive || m.deadT < 1.2);
  // wipe?
  const up = S.heroes.filter((h) => h.alive);
  if (!up.length && !S.over) {
    S.over = 'wipe';
    S.wipeRoom = S.boss ? S.boss.pack.def.room : Math.max(0, roomIndexOf(S.player.x, S.player.y));
    if (S.wipeRoom < 0) S.wipeRoom = S.cp;
    sfx('wipe');
    later(1.6, () => {
      if (S.opts.solo) { S.over = 'lost'; emit({ type: 'run.lost', dungeon: S.dg.id, packsCleared: S.packs.filter((p) => p.cleared).length }); HOOKS.onLost(); }
      else { emit({ type: 'run.wipe', dungeon: S.dg.id }); HOOKS.onWipe(); }
    });
  }
  if (S.chest && !S.chest.open) {
    S.chest.t += dt;
    if (S.chest.knockT > 0) S.chest.knockT -= dt;
    const near = S.heroes.some((h) => h.alive && dist(h, S.chest) < 95);
    if (near && S.t - S.lastCombat > 1.0 && (!S.walkout || S.walkout.done)) {
      S.chest.open = true; sfx('chest');
      bits(S.chest.x, S.chest.y - 40, 'shard_ice', 1, 10);
      dots(S.chest.x, S.chest.y - 50, '#F2C230', 26, 260);
      later(1.1, () => { S.over = 'victory'; emit({ type: 'run.cleared', summary: runSummary() }); HOOKS.onChest(); });
    }
  }
  S.dark = lerp(S.dark, S.darkTarget, Math.min(1, dt * 2.2));
  tickFx(dt);
}
function onCombatEnd() {
  for (const h of S.heroes) {
    h.ghostSaved = false;
    if (h.st) { h.st.ghost = 0; h.st.curse = null; }
  }
  // a rogue's points stay on them, and fade 10 s after the fight (unless the next one has started by then)
  later(10, () => { if (S.inCombat) return; for (const h of S.heroes) h.points = 0; });
  const dead = S.heroes.filter((h) => !h.alive);
  if (!dead.length || S.over) return;
  later(2.4, () => {
    if (S.inCombat || S.over) return;
    const healer = heroBy('healer');
    for (const h of S.heroes) {
      if (h.alive) continue;
      h.alive = true; h.hp = Math.round(h.maxHp * 0.5); h.st = { stun: 0, root: 0, haunt: 0, air: 0, ghost: 0, surge: 0, zeal: 0, kx: 0, ky: 0, chained: null, caged: null, curse: null };
      fxText(h.x, h.y - 100, healer && healer.alive && healer !== h ? healer.name + ' brings ' + (h.isPlayer ? 'you' : h.name) + ' back' : 'Back up', '#9BE15D', 20, { dur: 1.6 });
      dots(h.x, h.y - 40, '#FFE08A', 14, 160);
    }
    sfx('revive');
  });
}

function tickThralls(dt) {
  if (!S.thralls || !S.thralls.length) return;
  for (let i = S.thralls.length - 1; i >= 0; i--) {
    const tr = S.thralls[i];
    tr.life -= dt;
    tr.lunge = Math.max(0, (tr.lunge || 0) - dt);
    tr.moving = Math.max(0, (tr.moving || 0) - dt);
    if (!tr.alive || tr.life <= 0 || !tr.owner || !tr.owner.alive || S.over) {
      tr.alive = false;
      S.thralls.splice(i, 1);
      continue;
    }
    if (tr.rise > 0) { tr.rise -= dt; continue; }
    let t = tr.owner.target && isFoe(tr.owner.target) && !tr.owner.target.cage && !tr.owner.target.M.wisp ? tr.owner.target : null;
    if (!t) {
      let bd = 420;
      for (const m of S.mobs) {
        if (!isFoe(m) || m.cage || m.M.wisp || (m.state !== 'fight' && !m.isBoss)) continue;
        const d = dist(tr, m);
        if (d < bd) { bd = d; t = m; }
      }
    }
    if (t) {
      const d = dist(tr, t), reach = tr.r + t.r + 22;
      if (d > reach) {
        walkTo(tr, t.x, t.y, 260, dt, reach - 4);
      } else {
        tr.face = Math.atan2(t.y - tr.y, t.x - tr.x);
        tr.flip = Math.cos(tr.face) < 0;
        tr.atkT -= dt;
        if (tr.atkT <= 0) {
          tr.atkT = tr.kind === 'shade' ? 0.55 : 0.85;
          tr.lunge = 0.14; tr.lungeA = tr.face;
          const dmg = tr.kind === 'shade' ? 30 : tr.kind === 'frost' ? 28 : 22;
          const col = tr.kind === 'shade' ? '#B79CFF' : tr.kind === 'frost' ? '#8FD6FF' : '#FFE08A';
          hurtMob(t, dmg, tr.owner, { col, size: 16, threat: tr.kind === 'bg' ? 2 : 0.5 });
          if (tr.kind === 'shade' && t.alive) applyBleed(tr.owner, t, 3.5);
          if (tr.kind === 'frost' && t.alive && !t.isBoss) {
            t.st.slow = Math.max(t.st.slow, 0.35);
            t.st.slowT = Math.max(t.st.slowT, 1.5);
          }
          fx({ type: 'slash', x: tr.x, y: tr.y - 24, a: tr.face, r: 34, dur: 0.14, col });
        }
      }
    } else if (dist(tr, tr.owner) > 68) {
      walkTo(tr, tr.owner.x, tr.owner.y + 24, 230, dt, 48);
    }
  }
}

function separate() {
  const L = [];
  for (const h of S.heroes) if (h.alive && h.dodgeT <= 0 && !h.dash) L.push(h);
  for (const m of S.mobs) if (m.alive && !m.cage && !m.M.wisp && !m.M.thing && !m.hidden && m.rise <= 0) L.push(m);
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j];
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r - 2;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 0.0001) continue;
      const d = Math.sqrt(d2), push = (rr - d) * 0.5, ux = dx / d, uy = dy / d;
      const wa = a.isBoss ? 0 : a.M && a.M.big ? 0.25 : 1, wb = b.isBoss ? 0 : b.M && b.M.big ? 0.25 : 1;
      const tot = wa + wb || 1;
      if (wa) moveEnt(a, -ux * push * 2 * (wa / tot), -uy * push * 2 * (wa / tot));
      if (wb) moveEnt(b, ux * push * 2 * (wb / tot), uy * push * 2 * (wb / tot));
    }
  }
}

function tickProjs(dt) {
  for (let i = S.projs.length - 1; i >= 0; i--) {
    const p = S.projs[i];
    p.life -= dt;
    if (p.team === 'hero') {
      const t = p.tgt;
      if (!isFoe(t)) { S.projs.splice(i, 1); continue; }
      const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
      if (d <= t.r + 8 || p.life <= 0) { S.projs.splice(i, 1); projHit(p); continue; }
      const step = Math.min(p.speed * dt, d);
      p.vx = (dx / d) * p.speed; p.vy = (dy / d) * p.speed;
      p.x += (dx / d) * step; p.y += (dy / d) * step;
      p.z = lerp(p.z, t.isBoss ? 120 : t.M.big ? 70 : 40, Math.min(1, dt * 6));
    } else {
      p.x += p.vx * dt; p.y += p.vy * dt;
      let hit = false;
      for (const h of S.heroes) {
        if (!h.alive) continue;
        if (distXY(h.x, h.y, p.x, p.y) < h.r + p.r) { hurtHero(h, p.dmg, p.src, { block: true }); sfx('arrowhit', 0.6); hit = true; break; }
      }
      if (hit || p.life <= 0 || !inWalk(p.x, p.y, 0)) S.projs.splice(i, 1);
    }
  }
}
function tickHazards(dt) {
  for (let i = S.hazards.length - 1; i >= 0; i--) {
    const z = S.hazards[i];
    // a hit in here can end a fight (a perfect block's riposte finishing a boss clears the hazards)
    if (!z) continue;
    z.t += dt;
    if (z.src && z.src.kind === 'mob' && !z.src.alive && !z.fired) { S.hazards.splice(i, 1); continue; }
    if (z.follow && z.follow.alive && !z.fired) { z.x = z.follow.x; z.y = z.follow.y; }
    if (z.followT && z.t < (z.followFor || 0)) {
      const t = z.followT;
      if (t.alive) {
        if (z.followSpeed) { const dx = t.x - z.x, dy = t.y - z.y, d = Math.hypot(dx, dy), s = Math.min(d, z.followSpeed * dt); if (d > 0.1) { z.x += (dx / d) * s; z.y += (dy / d) * s; } }
        else { z.x = t.x; z.y = t.y; }
      }
    }
    if (!z.fired && z.t >= z.warn) { z.fired = true; fireHazard(z); }
    if (z.live && z.fired) {
      z.tickT = (z.tickT === undefined ? 0 : z.tickT) - dt;
      if (z.tickT <= 0) {
        z.tickT = z.tick;
        for (const h of S.heroes) if (h.alive && inHaz(z, h.x, h.y, h.r * 0.6)) hurtHero(h, z.dmg, z.src, { magic: z.magic, block: false, dodge: false, quiet: false, hazard: true });
      }
    }
    const end = z.live ? z.warn + z.live : z.warn + 0.12;
    if (z.t >= end) S.hazards.splice(i, 1);
  }
}
function fireHazard(z) {
  if (z.onFire) z.onFire(z);
  if (z.noDmg || z.smash || z.burrow || z.live) return;
  const mul = (z.src && z.src.dmgMul) || 1;
  for (const h of S.heroes) {
    if (!h.alive || !inHaz(z, h.x, h.y, h.r)) continue;
    const got = hurtHero(h, z.dmg * mul, z.src, { heavy: z.heavy, block: z.block === true, magic: z.magic, kind: z.kind, hazard: true, ...(z.counted ? { smash: true } : {}) });
    if (got > 0 && z.knock) { const a = Math.atan2(h.y - z.y, h.x - z.x); h.st.kx += Math.cos(a) * z.knock; h.st.ky += Math.sin(a) * z.knock; }
    if (got > 0 && z.root) { h.st.root = z.root; if (h.isPlayer) fxText(h.x, h.y - 112, 'Grabbed', '#C9B79A', 17); }
    if (got > 0 && z.stun) { h.st.stun = Math.max(h.st.stun, z.stun); }
  }
}
function tickZones(dt) {
  for (let i = S.zones.length - 1; i >= 0; i--) {
    const z = S.zones[i];
    z.t += dt; z.tickT -= dt;
    // Walking Prayer: a circle that landed on a mate goes where they go
    if (z.follow && z.follow.alive) { z.x = z.follow.x; z.y = z.follow.y; }
    if (z.tickT <= 0) {
      z.tickT = z.tick;
      // a zone that does its own thing every tick (a gadget's turret)
      if (z.fn) z.fn(z);
      else if (z.kind === 'heal') {
        for (const h of S.heroes) if (h.alive && distXY(h.x, h.y, z.x, z.y) <= z.r + h.r * 0.5) healHero(z.src, h, z.val || 36, { size: 16 });
        if (z.src) holyGround(z);
        if (z.src && z.src.bonuses && z.src.bonuses.has('candlewake3')) {
          for (const m of S.mobs) if (isFoe(m) && !m.cage && distXY(m.x, m.y, z.x, z.y) <= z.r + m.r * 0.5) hurtMob(m, 32, z.src, { col: '#FFE08A', size: 16, noCrit: true });
        }
      } else if (z.kind === 'blizzard') {
        const rb3 = !!(z.src && z.src.bonuses && z.src.bonuses.has('rimebone3'));
        if (rb3) bits(z.x + Math.cos(S.t * 7 + i) * z.r * 0.45, z.y + Math.sin(S.t * 5 + i) * z.r * 0.35, 'shard_bone', 1, 95);
        for (const m of S.mobs) {
          if (!isFoe(m) || m.cage || distXY(m.x, m.y, z.x, z.y) > z.r + m.r * 0.5) continue;
          hurtMob(m, z.val || 20, z.src, { crit: 0.06, size: 17, col: '#DDF3FF', tier: 'tick', key: 'blizzard' });
          if (m.alive && !m.isBoss) { m.st.slow = Math.max(m.st.slow, 0.4); m.st.slowT = 0.8; }
          if (m.alive && z.src) frostbite(z, m);
        }
      } else if (z.kind === 'firestorm') {
        firestormTick(z);
      } else if (z.kind === 'ice') {
        for (const m of S.mobs) if (isFoe(m) && !m.cage && !m.isBoss && !m.M.wisp && !z.hit.has(m.id) && distXY(m.x, m.y, z.x, z.y) <= z.r + m.r) { z.hit.add(m.id); m.st.freeze = Math.max(m.st.freeze, 1.5); m.wind = 0; }
      }
    }
    if (z.t >= z.dur) S.zones.splice(i, 1);
  }
}
function tickRings(dt) {
  for (let i = S.rings.length - 1; i >= 0; i--) {
    const g = S.rings[i];
    g.r += g.speed * dt;
    for (const h of S.heroes) {
      if (!h.alive || g.hit.has(h.id)) continue;
      const d = dist(h, g);
      if (Math.abs(d - g.r) <= g.w / 2 + h.r) {
        g.hit.add(h.id);
        if (h.st.air > 0) continue;
        if (h.iframe > 0) { if (h.isPlayer) fxText(h.x, h.y - 80, 'Dodged', '#DDF3FF', 18); h.stats.dodges++; continue; }
        hurtHero(h, g.dmg * ((g.src && g.src.dmgMul) || 1), g.src, { block: false, dodge: false, kind: 'ring' });
        h.st.kx += ((h.x - g.x) / (d || 1)) * 140; h.st.ky += ((h.y - g.y) / (d || 1)) * 140;
      }
    }
    if (g.r > g.max) S.rings.splice(i, 1);
  }
}
function tickFireRing(dt) {
  const R = S.ring, A = S.dg.map.arena;
  if (R.followBoss && S.boss && S.boss.alive && !S.boss.hidden) {
    R.x = lerp(R.x === undefined ? A.x : R.x, S.boss.x, Math.min(1, dt * 6));
    R.y = lerp(R.y === undefined ? A.y : R.y, S.boss.y, Math.min(1, dt * 6));
  } else if (R.x === undefined) {
    R.x = A.x; R.y = A.y;
  }
  R.r = Math.max(R.target, R.r - 24 * dt);
  for (const h of S.heroes) {
    if (!h.alive) continue;
    if (distXY(h.x, h.y, R.x, R.y) <= R.r - h.r * 0.35) {
      h.st.zeal = Math.max(h.st.zeal || 0, 0.6);
    }
  }
  R.tick -= dt;
  if (R.tick <= 0) {
    R.tick = 0.5;
    for (const h of S.heroes) {
      if (!h.alive) continue;
      if (distXY(h.x, h.y, R.x, R.y) > R.r - h.r * 0.35) {
        hurtHero(h, 34, null, { magic: true, pierce: true, block: false, dodge: false, numCol: '#9BE15D', numSize: 16, numDur: 0.6 });
        if (h.isPlayer && !S.hints.fire) { S.hints.fire = 1; S.call = { str: 'Stay inside his green circle!', kind: 'alarm', t: 0, dur: 1.6 }; }
      }
    }
  }
}

function tickFx(dt) {
  for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.dur) S.fx.splice(i, 1); }
  for (let i = S.parts.length - 1; i >= 0; i--) {
    const p = S.parts[i];
    p.t += dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.up) { p.z += 60 * dt; } else if (p.fall) { p.z = Math.max(0, p.z - p.fall * dt); } else { p.vz -= 900 * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; } }
    if (p.rot !== undefined) p.rot += (p.vr || 0) * dt * (p.z > 0 ? 1 : 0.2);
    if (p.t >= p.dur) S.parts.splice(i, 1);
  }
  for (let i = S.texts.length - 1; i >= 0; i--) { const t = S.texts[i]; t.t += dt; t.y += t.vy * dt * (1 - t.t / t.dur); if (t.t >= t.dur) S.texts.splice(i, 1); }
  if (S.banner) { S.banner.t += dt; if (S.banner.t > S.banner.dur) S.banner = null; }
  if (S.call) { S.call.t += dt; if (S.call.t > S.call.dur) S.call = null; }
  S.shake = Math.max(0, S.shake - dt * 30);
  S.hurtFlash = Math.max(0, S.hurtFlash - dt * 1.6);
  // what's only drawn: a body held still on impact, a mob's squash, a healed mate's glow (render.js)
  for (const h of S.heroes) { if (h.holdT > 0) h.holdT -= dt; if (h.healGlow > 0) h.healGlow -= dt; }
  for (const m of S.mobs) { if (m.holdT > 0) m.holdT -= dt; if (m.squash > 0) m.squash -= dt; }
  for (const h of S.heroes) { if (h.say && h.sayT <= 0) h.say = null; if (!h.alive && S.over) h.deadT += dt; }
}
