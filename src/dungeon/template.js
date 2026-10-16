/* ---------- the dungeon template: themes, the layout builder, the Heroic seal and the run script ----------
   A new dungeon is data plus a few hooks (see src/content/_template/README.md): its layout goes through
   buildDungeonMap (layout.js), its bosses are built from the shared moves (moves.js), and its run script comes
   from makeDungeonScript below: gates, starts from a boss, pulls, the chest. */
import { clamp, dist, distXY } from '../core/math';
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

/* the layout builder lives in layout.js; dungeons import it from here too */
export { buildDungeonMap } from './layout.js';

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
 * The run script (`STARTS`, `setup`, `onBossPulled`, `onBossDead`, `triggers`, `onAmbush`, `onRespawn`) from
 * a config, so a new dungeon doesn't copy it:
 *   miniBoss, finalBoss  { id, name, room, gateIn, gateOut (the mini boss's way on), victoryText, chestX/Y (the
 *                        final one's chest) }. A boss's pull brings everyone through its gateIn door (Barrow
 *                        still gives the old `pullY`).
 *   seal                 optional, and only ever on Heroic: the three-seat puzzle after pack `afterPack`.
 *   ambush               optional: pack `packId` bursts out of props (`propClosed` to `propOpen`) once a hero
 *                        passes `triggerY` in `room` after pack `afterPack` is down (Barrow's coffins).
 */
export function makeDungeonScript(cfg) {
  const mini = cfg.miniBoss;
  const fin = cfg.finalBoss;
  const amb = cfg.ambush;
  const sealCfg = cfg.seal;
  const MAP = cfg.map;
  const packOf = (boss) => S.packs.find((p) => p.def.boss === boss);

  const STARTS = [
    { id: 'entrance', name: cfg.entranceName || 'The entrance' },
    { id: mini.id, name: mini.name },
    { id: fin.id, name: fin.name },
  ];

  function setup(start) {
    // the seal is a Heroic-only hook: Normal never gets a puzzle
    if (sealCfg && S.opts && S.opts.heroic) S.seal = makeSealTrial(sealCfg);
    if (!start || start === 'entrance') return;
    // starting at a boss (tests and sims): every pack before his is down (the Crypt Trial, Barrow's, names its own)
    const upto = start === 'intro' ? ['A', 'D', 'E', 'G'] : packsBefore(start === mini.id ? mini.id : fin.id);
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
  function packsBefore(boss) {
    const ids = S.packs.map((p) => p.def.id);
    return ids.slice(0, Math.max(0, S.packs.findIndex((p) => p.def.boss === boss)));
  }

  function onBossPulled(pack) {
    if (pack.def.boss === mini.id) {
      if (S.gates[mini.gateIn]) S.gates[mini.gateIn].closed = true;
      pull(mini, 3, 3120);
    } else {
      if (S.gates[fin.gateIn]) S.gates[fin.gateIn].closed = true;
      pull(fin, 5, 1120);
    }
  }
  function pull(b, room, y) {
    if (b.pullY !== undefined || !S.gates[b.gateIn]) pullIn(b.room ?? room, b.pullY ?? y);
    else pullThrough(S.gates[b.gateIn], b.room ?? room);
  }

  function onBossDead(m) {
    if (m.type === mini.id) {
      if (S.gates[mini.gateIn]) S.gates[mini.gateIn].closed = false;
      S.mobs.forEach((o) => { if (o.alive && (o.rally || o.add === m)) { o.hp = 1; killMob(o, null); } });
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
      S.mobs.forEach((o) => { if (o.alive && o.add === m) { o.hp = 1; killMob(o, null); } });
      spawnChest(fin.chestX ?? 500, fin.chestY ?? 660, m);
      banner(fin.victoryText || `${fin.name} is defeated!`, 'good', 3.2);
      sfx('fanfare');
    }
  }

  function triggers() {
    const E = S.packs.find((p) => p.def.id === (amb?.packId || 'E'));
    const D = S.packs.find((p) => p.def.id === (amb?.afterPack || 'D'));
    const sealAfter = sealCfg && sealCfg.afterPack ? S.packs.find((p) => p.def.id === sealCfg.afterPack) : D;
    if (S.seal && !S.seal.done && sealAfter && sealAfter.cleared) {
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
    // the final boss wakes when someone steps into his arena
    const G = packOf(fin.id);
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
    const K = packOf(mini.id), G = packOf(fin.id);
    if (amb) S.props.forEach((pr) => { if (pr.room === (mini.room ?? 3) && pr.sp === amb.propOpen && pr.sc === 1 && K && !K.cleared) pr.sp = amb.propClosed; });
    if (K && !K.cleared && S.gates[mini.gateIn]) S.gates[mini.gateIn].closed = false;
    if (G && !G.cleared && S.gates[fin.gateIn]) S.gates[fin.gateIn].closed = false;
  }

  return { STARTS, setup, onBossPulled, onBossDead, triggers, onAmbush, onRespawn };
}

/* a boss's pull: everyone not already well inside his room comes through the door his gate closes, so nobody
   is shut out. Works for a door on any side. */
function pullThrough(g, room) {
  const across = g.x === undefined; // the gate lies across a north or south door
  const mx = across ? (g.x0 + g.x1) / 2 : g.x, my = across ? g.y : (g.y0 + g.y1) / 2;
  const r = S.dg.map.rooms[room];
  const cx = r.round ? r.x : (r.x0 + r.x1) / 2, cy = r.round ? r.y : (r.y0 + r.y1) / 2;
  const nx = across ? 0 : Math.sign(cx - mx), ny = across ? Math.sign(cy - my) : 0;
  for (const h of S.heroes) {
    if (roomIndexOf(h.x, h.y) === room && (h.x - mx) * nx + (h.y - my) * ny > 70) continue;
    const side = h.role === 'healer' ? -50 : h.role === 'dps' ? 50 : 0;
    h.x = mx + nx * 80 + (across ? side : 0); h.y = my + ny * 80 + (across ? 0 : side);
    h.dodgeT = 0; h.dash = null; h.st.kx = h.st.ky = 0;
  }
}
