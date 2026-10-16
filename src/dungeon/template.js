/* ---------- Dungeon Template Engine: declarative map builder, visual themes, and set-piece script builders ---------- */
import { TAU, clamp, dist, distXY } from '../core/math';
import { pick } from '../core/rng';
import { HOOKS, S } from './state.js';
import { aggro, banner, dots, fx, fxText, killMob, sfx } from './entities.js';
import { breakCage, cutChain } from './mobs.js';
import { pullIn, spawnChest, triggerAmbush } from './game.js';
import { startWalkout } from './walkout.js';
import { roomIndexOf } from './world.js';

/**
 * Visual themes for dungeons. Each theme defines the void background, wall cap, brick wall,
 * stone/tomb/corridor floor slabs, and outdoor yard/sanctum turf & pebbles.
 */
export const DUNGEON_THEMES = {
  /** Dungeon 1: Barrow Crypt — Gothic undead slate & necrotic green fire */
  barrow: {
    id: 'barrow',
    voidCol: '#17121F',
    wallCapCol: '#2E2638',
    brick: ['#5C5070', '#463C5A'],
    stone: ['#4A4060', '#3A3150', '#43395A'],
    tomb: ['#4F4468', '#3C3354', '#463C5E'],
    corr: ['#453B5A', '#352D4A', '#3E3554'],
    yard: { base: '#463A48', tuftFill: '#5E7A4A', tuftStroke: '#3B4A32', pebbleFill: '#5C5070', pebbleStroke: '#3A3150' },
    accentCol: '#7CF06A',
  },
  /** Dungeon 2: Thimblebriar Hollow — Gnome fairytale mushroom & brass-clockwork burrow */
  thimblebriar: {
    id: 'thimblebriar',
    voidCol: '#1A110B',
    wallCapCol: '#3A2618',
    brick: ['#7A5234', '#593A22'],
    stone: ['#63432B', '#4B311E', '#573A24'],
    tomb: ['#6E473B', '#523228', '#603C31'],
    corr: ['#563924', '#402919', '#4C321F'],
    yard: { base: '#3F4A2C', tuftFill: '#68B85E', tuftStroke: '#2E542A', pebbleFill: '#D89B3C', pebbleStroke: '#6E4816' },
    accentCol: '#FF7AE6',
  },
  /** Dungeon 3: Moonmere Sanctum — Woodland elf twilight glade & sunken moon-ruins */
  moonmere: {
    id: 'moonmere',
    voidCol: '#0D1B1E',
    wallCapCol: '#1D3338',
    brick: ['#3D6466', '#2B494B'],
    stone: ['#325456', '#233E40', '#2B494B'],
    tomb: ['#385E6B', '#27444E', '#30515C'],
    corr: ['#2B484A', '#1E3436', '#253E40'],
    yard: { base: '#254236', tuftFill: '#54A878', tuftStroke: '#1D4D33', pebbleFill: '#8FD6FF', pebbleStroke: '#355E78' },
    accentCol: '#8FD6FF',
  },
};

/**
 * Declarative 6-room vertical dungeon map builder.
 * Automatically links rooms bottom-to-top with corridors, builds the walk chain, checkpoints,
 * and provides clean dressing helpers (`prop`, `decal`, `wall`, `pillars`, `ring`).
 */
export function buildDungeonMap(cfg) {
  const W = cfg.width || 1000, H = cfg.height || 5800, CX = cfg.cx || 500, OV = cfg.overlap || 70;
  const corrX0 = cfg.corridorX ? cfg.corridorX[0] : 420;
  const corrX1 = cfg.corridorX ? cfg.corridorX[1] : 580;

  const MAP = { W, H, CX, OV, theme: cfg.theme || 'barrow', rooms: cfg.rooms.map((r) => ({ ...r })), corridors: [], chain: [], walk: [], arena: { ...cfg.arena } };

  for (let i = 0; i < MAP.rooms.length - 1; i++) {
    const lo = MAP.rooms[i], hi = MAP.rooms[i + 1];
    MAP.corridors.push({ id: 'c' + i, x0: corrX0, x1: corrX1, y0: hi.y1, y1: lo.y0 });
  }
  MAP.rooms.forEach((r, i) => {
    MAP.chain.push({ ...r, kind: 'room', idx: i });
    if (MAP.corridors[i]) MAP.chain.push({ ...MAP.corridors[i], kind: 'corridor', idx: i });
  });
  MAP.chain.forEach((a, i) => { a.ci = i; });
  MAP.walk = MAP.chain.map((a) => (a.kind === 'room' ? { x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1, ci: a.ci } : { x0: a.x0, y0: a.y0 - MAP.OV, x1: a.x1, y1: a.y1 + MAP.OV, ci: a.ci }));

  const GATES = JSON.parse(JSON.stringify(cfg.gates || {
    g3b: { x0: corrX0, x1: corrX1, y: MAP.rooms[3]?.y1 || 3180, closed: false },
    g3t: { x0: corrX0, x1: corrX1, y: MAP.rooms[3]?.y0 || 2460, closed: true, north: true },
    g5: { x0: corrX0, x1: corrX1, y: MAP.rooms[5]?.y1 || 1180, closed: false },
  }));

  const PROPS = [];
  const DECALS = [];
  const WALLDECOR = [];
  const api = {
    MAP,
    prop(sp, x, y, col, sc) { PROPS.push({ sp, x, y, col: col || null, sc: sc || 1, id: 'p' + PROPS.length }); },
    decal(sp, x, y, sc, rot) { DECALS.push({ sp, x, y, sc: sc || 1, rot: rot || 0 }); },
    wall(sp, x, roomIdx) { WALLDECOR.push([sp, x, roomIdx]); },
    pillars(sp, pts, r = 26) { for (const [x, y] of pts) api.prop(sp, x, y, ['c', r]); },
    ring(count, rx, ry, fn) {
      const A = MAP.arena;
      for (let k = 0; k < count; k++) {
        const a = (k / count) * TAU + 0.12;
        const x = Math.round(A.x + Math.cos(a) * rx), y = Math.round(A.y + Math.sin(a) * ry);
        fn(k, x, y, a);
      }
    },
  };
  if (cfg.dress) cfg.dress(api);

  const CHECKPOINTS = cfg.checkpoints || MAP.rooms.map((r, i) => ({ room: i, x: CX, y: i === 0 ? r.y1 - 160 : i === 3 ? r.y1 + 150 : i === 5 ? r.y1 + 140 : r.y1 - 70 }));
  const floorArt = cfg.floorArt || (() => {});

  return { MAP, GATES, PROPS, DECALS, WALLDECOR, CHECKPOINTS, floorArt };
}

/**
 * 10 standard 3-seat floor rune / spore-pad / starlight formation patterns.
 * Any dungeon can use these or supply its own pattern list.
 */
export const DEFAULT_SEAL_PATTERNS = [
  { id: 'spearhead', name: 'Spearhead', pads: [['tank', 0, -55], ['healer', -75, 45], ['dps', 75, 45]] },
  { id: 'wedge', name: 'Inverted Wedge', pads: [['tank', 0, 55], ['healer', -80, -45], ['dps', 80, -45]] },
  { id: 'line', name: 'Honor Line', pads: [['healer', -95, 0], ['tank', 0, 0], ['dps', 95, 0]] },
  { id: 'column', name: 'Vanguard Column', pads: [['tank', 0, -58], ['dps', 0, 0], ['healer', 0, 58]] },
  { id: 'left_flank', name: 'Left Flank', pads: [['tank', -72, -42], ['dps', 0, 0], ['healer', 72, 42]] },
  { id: 'right_flank', name: 'Right Flank', pads: [['tank', 72, -42], ['dps', 0, 0], ['healer', -72, 42]] },
  { id: 'crescent', name: 'Crescent Arc', pads: [['healer', -88, 32], ['tank', 0, -46], ['dps', 88, 32]] },
  { id: 'pincer', name: 'Pincer', pads: [['dps', -84, -40], ['healer', 84, -40], ['tank', 0, 50]] },
  { id: 'triad', name: 'Lantern Triad', pads: [['tank', -66, 40], ['dps', 66, 40], ['healer', 0, -52]] },
  { id: 'cross', name: 'Cross Steps', pads: [['healer', -75, -22], ['tank', 75, -22], ['dps', 0, 52]] },
];

export function makeSealTrial(cfg = {}) {
  const patterns = cfg.patterns || DEFAULT_SEAL_PATTERNS;
  const pat = pick(patterns) || patterns[0];
  const cx = cfg.x ?? 500, cy = cfg.y ?? 1920, padR = cfg.padR ?? 34;
  return {
    id: pat.id,
    name: pat.name,
    x: cx,
    y: cy,
    pads: pat.pads.map(([role, dx, dy]) => ({ role, x: cx + dx, y: cy + dy, r: padR, lit: false })),
    active: false,
    done: false,
    cleared: false,
    hold: 0,
    t: 0,
    col: cfg.col || '#F2C230',
    floatText: cfg.floatText || 'CRYPT SURGE!',
    bannerText: cfg.bannerText || 'Crypt Seal shattered! +20% damage & +25% speed!',
    surgeDur: cfg.surgeDur || 18,
  };
}

/**
 * Builds the complete dungeon script (`STARTS`, `setup`, `onBossPulled`, `onBossDead`, `triggers`, `onAmbush`, `onRespawn`)
 * from a declarative config so new dungeons don't duplicate boilerplate.
 */
export function makeDungeonScript(cfg) {
  const mini = cfg.miniBoss;
  const fin = cfg.finalBoss;
  const amb = cfg.ambush;
  const sealCfg = cfg.seal;
  const MAP = cfg.map;

  const STARTS = [
    { id: 'entrance', name: cfg.entranceName || 'The entrance' },
    { id: mini.id, name: mini.name },
    { id: fin.id, name: fin.name },
  ];

  function setup(start) {
    if (sealCfg) S.seal = makeSealTrial(sealCfg);
    if (!start || start === 'entrance') return;
    const upto = start === 'intro' ? ['A', 'D', 'E', 'G'] : start === mini.id ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'K', 'D', 'E'];
    for (const p of S.packs) {
      if (upto.includes(p.def.id)) {
        p.cleared = true; p.pulled = true; p.triggered = true;
        p.mobs.forEach((m) => { m.alive = false; m.state = 'dead'; m.deadT = 99; });
        S.cleared++;
      }
    }
    if (start === fin.id) {
      if (S.gates[mini.gateIn]) S.gates[mini.gateIn].closed = false;
      if (S.gates[mini.gateOut]) S.gates[mini.gateOut].closed = false;
      if (amb) S.props.forEach((p) => { if (p.room === amb.room && p.sp === amb.propClosed) p.sp = amb.propOpen; });
      if (S.seal) S.seal.done = true;
    }
    S.cp = start === 'intro' ? 2 : start === mini.id ? (mini.room ?? 3) : (fin.room ?? 5);
  }

  function onBossPulled(pack) {
    if (pack.def.boss === mini.id) {
      if (S.gates[mini.gateIn]) S.gates[mini.gateIn].closed = true;
      pullIn(mini.room ?? 3, mini.pullY ?? 3120);
    } else {
      if (S.gates[fin.gateIn]) S.gates[fin.gateIn].closed = true;
      pullIn(fin.room ?? 5, fin.pullY ?? 1120);
    }
  }

  function onBossDead(m) {
    if (m.type === mini.id) {
      if (S.gates[mini.gateIn]) S.gates[mini.gateIn].closed = false;
      S.mobs.forEach((o) => { if (o.alive && o.rally) { o.hp = 1; killMob(o, null); } });
      if (S.opts && S.opts.start === 'intro') {
        S.hazards = [];
        const cx = clamp(m.x, 260, 740), cy = clamp(m.y, 2620, 3060);
        spawnChest(cx, cy, m);
        startWalkout('unique', clamp(cx - 84, 210, 790), cy);
        banner('Watch the lantern: gold flare and two knocks means a unique drop!', 'good', 3.4);
        HOOKS.hint('introChest');
        sfx('victory');
        return;
      }
      if (S.gates[mini.gateOut]) S.gates[mini.gateOut].closed = false;
      banner(mini.victoryText || `${mini.name} falls. The way on is open.`, 'good', 2.8);
      sfx('victory');
    } else {
      if (S.gates[fin.gateIn]) S.gates[fin.gateIn].closed = false;
      S.darkTarget = 0; S.ring = null; S.rings = []; S.hazards = [];
      S.chains.slice().forEach((c) => cutChain(c, null));
      S.mobs.forEach((o) => { if (o.alive && (o.M.wisp || o.cage)) { if (o.cage) breakCage(o, false); else { o.alive = false; o.state = 'dead'; } } });
      spawnChest(fin.chestX ?? 500, fin.chestY ?? 660, m);
      banner(fin.victoryText || `${fin.name} is defeated!`, 'good', 3.2);
      sfx('victory');
    }
  }

  function triggers() {
    const E = S.packs.find((p) => p.def.id === (amb?.packId || 'E'));
    const D = S.packs.find((p) => p.def.id === (amb?.afterPack || 'D'));
    if (S.seal && !S.seal.done && D && D.cleared) {
      if (E && E.triggered) {
        S.seal.done = true; S.seal.active = false;
      } else if (!S.inCombat) {
        if (!S.seal.active) S.seal.active = true;
        S.seal.t = (S.seal.t || 0) + 1 / 60;
        if (S.seal.t > 6.5) {
          S.seal.done = true; S.seal.active = false;
        } else {
          let allLit = true;
          for (const pad of S.seal.pads) {
            const h = S.heroes.find((x) => x.alive && x.role === pad.role);
            if (!h) continue;
            pad.lit = distXY(h.x, h.y, pad.x, pad.y) <= pad.r + h.r;
            if (!pad.lit) allLit = false;
          }
          if (allLit) {
            S.seal.hold = (S.seal.hold || 0) + 1 / 60;
            if (S.seal.hold >= 0.2) {
              S.seal.done = true; S.seal.active = false; S.seal.cleared = true;
              for (const h of S.heroes) if (h.alive) h.st.surge = S.seal.surgeDur || 18;
              fx({ type: 'ring', x: S.seal.x, y: S.seal.y, r0: 24, r1: 220, col: S.seal.col || '#F2C230', dur: 0.45, w: 9, ground: true });
              dots(S.seal.x, S.seal.y, '#FFE08A', 18, 240);
              if (S.player) fxText(S.player.x, S.player.y - 135, S.seal.floatText || 'CRYPT SURGE!', S.seal.col || '#F2C230', 26, { dur: 1.5 });
              banner(S.seal.bannerText || 'Crypt Seal shattered! +20% damage & +25% speed!', 'good', 2.4);
              sfx('perfect');
            }
          } else {
            S.seal.hold = 0;
          }
        }
      }
    }
    if (amb && E && !E.triggered && (!D || D.cleared)) {
      for (const h of S.heroes) {
        if (h.alive && roomIndexOf(h.x, h.y) === amb.room && h.y < amb.triggerY) {
          triggerAmbush(E);
          break;
        }
      }
    }
    const G = S.packs.find((p) => p.def.id === 'G');
    if (G && !G.cleared && !G.pulled) {
      const k = G.mobs[0];
      if (k && k.alive) {
        for (const h of S.heroes) {
          if (h.alive && roomIndexOf(h.x, h.y) === (fin.room ?? 5) && dist(h, MAP.arena) < MAP.arena.r - 30) {
            aggro(k, h, 1);
            break;
          }
        }
      }
    }
    if (cfg.extraTriggers) cfg.extraTriggers();
  }

  function onAmbush() {
    if (S.seal && !S.seal.done) { S.seal.done = true; S.seal.active = false; }
    if (amb) {
      S.props.forEach((pr) => { if (pr.room === amb.room && pr.sp === amb.propClosed) pr.sp = amb.propOpen; });
      banner(amb.bannerText || 'Ambush!', 'warn', 2.4);
    }
  }

  function onRespawn(resetAmbush) {
    if (resetAmbush && amb) {
      S.props.forEach((pr) => { if (pr.room === amb.room && pr.sp === amb.propOpen) pr.sp = amb.propClosed; });
      if (S.seal && !S.seal.cleared) { S.seal.done = false; S.seal.active = true; S.seal.hold = 0; S.seal.t = 0; }
    }
    const K = S.packs.find((p) => p.def.id === 'K'), G = S.packs.find((p) => p.def.id === 'G');
    if (amb) S.props.forEach((pr) => { if (pr.room === (mini.room ?? 3) && pr.sp === amb.propOpen && pr.sc === 1 && K && !K.cleared) pr.sp = amb.propClosed; });
    if (K && !K.cleared && S.gates[mini.gateIn]) S.gates[mini.gateIn].closed = false;
    if (G && !G.cleared && S.gates[fin.gateIn]) S.gates[fin.gateIn].closed = false;
  }

  return { STARTS, setup, onBossPulled, onBossDead, triggers, onAmbush, onRespawn };
}
