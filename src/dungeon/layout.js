/* ---------- layouts: a dungeon's rooms and the corridors between them, as data ----------
   A layout is a list of rooms and the links between them. A room is a box ({ x0, y0, x1, y1 }) or round
   ({ round: true, x, y, r }). A link joins two rooms through a door on one side of the first one ('n', 's',
   'e' or 'w'; the second room gets the opposite side), `at` the door's middle along that side (x for n and s,
   y for e and w), `w` wide. Any shape works: a line, branches, side rooms, a round arena.

   Leave the links out and the rooms make a line from the bottom up, each joined to the next by a corridor on
   `corridorX` (Barrow Crypt is built that way).

   What comes out is what the engine reads (src/dungeon/world.js, mapdraw.js):
     MAP.rooms        the rooms, each with its doors ({ side, x0, x1 } or { side, y0, y1 }, `cor` its corridor)
     MAP.corridors    one per link: { x0, y0, x1, y1, dir: 'v' | 'h', a, b } (a and b are room indexes)
     MAP.chain        every area, rooms and corridors (`kind`, `idx`, `ci` its place here)
     MAP.walk         where you can stand: a box per room and per corridor (a corridor's reaches `overlap`
                      into its rooms), or a circle for a round room
     MAP.next         next[a][b]: the next area on the shortest way from area a to area b
     MAP.gaps         gaps[a][b]: the doorway from area a into the area b next to it ({ x, y, dx, dy })
     MAP.arches       where an arch stands over a north door
     MAP.arena        the final fight's circle: given, or the last round room
   and beside it GATES (closed ones block their door), CHECKPOINTS (one per room, where a wipe puts you back)
   and the dressing: PROPS, DECALS, WALLDECOR, floorArt. Rooms are numbered in the order you meet them: a
   checkpoint only ever moves forward, to a room with a higher number. */
import { TAU } from '../core/math';

const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
const DIR = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

/** a room's bounding box (a round room's too) */
const box = (r) => (r.round ? { x0: r.x - r.r, y0: r.y - r.r, x1: r.x + r.r, y1: r.y + r.r } : r);

/** where a door at `at` on `side` of room `r` meets the room's edge (y for n and s, x for e and w) */
function edgeAt(r, side, at) {
  if (!r.round) return side === 'n' ? r.y0 : side === 's' ? r.y1 : side === 'e' ? r.x1 : r.x0;
  const off = at - (side === 'n' || side === 's' ? r.x : r.y);
  const h = Math.sqrt(Math.max(0, r.r * r.r - off * off));
  return side === 'n' ? r.y - h : side === 's' ? r.y + h : side === 'e' ? r.x + h : r.x - h;
}

/** is the door span [a, b] on this side of the room, clear of its corners? (On a round room: within seven
 *  tenths of its radius of the middle of that side, where the rim is still close to square on.) */
function fitsSide(r, side, a, b) {
  const B = box(r), v = side === 'n' || side === 's';
  const lo = v ? B.x0 : B.y0, hi = v ? B.x1 : B.y1;
  if (r.round) { const c = v ? r.x : r.y; return a >= c - r.r * 0.7 && b <= c + r.r * 0.7; }
  return a >= lo + 20 && b <= hi - 20;
}

/** Build a dungeon's layout. Throws on a layout that doesn't hold together (a door off its room, rooms on
 *  the wrong side of each other, a room you can't reach), so a broken layout fails its test, not a run. */
export function buildDungeonMap(cfg) {
  const W = cfg.width || 1000, H = cfg.height || 5800, CX = cfg.cx || 500, OV = cfg.overlap || 70;
  const corrX0 = cfg.corridorX ? cfg.corridorX[0] : 420;
  const corrX1 = cfg.corridorX ? cfg.corridorX[1] : 580;

  const MAP = { W, H, CX, OV, theme: cfg.theme || 'barrow', rooms: cfg.rooms.map((r) => (r.round ? { ...r, ...box(r) } : { ...r })), corridors: [], chain: [], walk: [], arena: null };
  const byId = {};
  MAP.rooms.forEach((r, i) => { if (byId[r.id] !== undefined) throw new Error(`layout: two rooms called ${r.id}`); byId[r.id] = i; r.doors = []; });
  const links = cfg.links || MAP.rooms.slice(1).map((r, i) => ({ from: MAP.rooms[i].id, to: r.id, side: 'n', at: (corrX0 + corrX1) / 2, w: corrX1 - corrX0 }));

  // a corridor for every link, and a door at each end of it
  links.forEach((L, i) => {
    const a = byId[L.from], b = byId[L.to];
    if (a === undefined || b === undefined) throw new Error(`layout: link ${L.from} to ${L.to} names a room that isn't there`);
    const A = MAP.rooms[a], B = MAP.rooms[b], side = L.side || 'n', back = OPP[side];
    if (!DIR[side]) throw new Error(`layout: link ${L.from} to ${L.to} has no side n, s, e or w`);
    const v = side === 'n' || side === 's', w = L.w || 160;
    const at = L.at !== undefined ? L.at : v ? (box(A).x0 + box(A).x1) / 2 : (box(A).y0 + box(A).y1) / 2;
    const lo = at - w / 2, hi = at + w / 2;
    if (!fitsSide(A, side, lo, hi) || !fitsSide(B, back, lo, hi)) throw new Error(`layout: the door from ${L.from} to ${L.to} isn't on both rooms' walls`);
    const ea = edgeAt(A, side, at), eb = edgeAt(B, back, at);
    const c = { id: 'c' + i, x0: 0, y0: 0, x1: 0, y1: 0, dir: v ? 'v' : 'h', a, b, at, w };
    if (v) { c.x0 = lo; c.x1 = hi; c.y0 = Math.min(ea, eb); c.y1 = Math.max(ea, eb); }
    else { c.y0 = lo; c.y1 = hi; c.x0 = Math.min(ea, eb); c.x1 = Math.max(ea, eb); }
    if ((side === 'n' && eb >= ea) || (side === 's' && eb <= ea) || (side === 'e' && eb <= ea) || (side === 'w' && eb >= ea)) {
      throw new Error(`layout: ${L.to} isn't to the ${side} of ${L.from}`);
    }
    MAP.corridors.push(c);
    const door = (s) => (v ? { side: s, x0: lo, x1: hi, cor: i, at } : { side: s, y0: lo, y1: hi, cor: i, at });
    A.doors.push(door(side)); B.doors.push(door(back));
    c.link = L;
  });

  // the areas: each room, then the corridors that lead on from it
  MAP.rooms.forEach((r, i) => {
    MAP.chain.push({ ...r, kind: 'room', idx: i });
    MAP.corridors.forEach((c, k) => { if (c.a === i) MAP.chain.push({ ...c, kind: 'corridor', idx: k }); });
  });
  MAP.chain.forEach((a, i) => { a.ci = i; });
  const areaOfRoom = (i) => MAP.chain.findIndex((a) => a.kind === 'room' && a.idx === i);
  const areaOfCor = (k) => MAP.chain.findIndex((a) => a.kind === 'corridor' && a.idx === k);
  MAP.walk = MAP.chain.map((a) => {
    if (a.kind === 'room') return a.round ? { round: true, x: a.x, y: a.y, r: a.r, x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1, ci: a.ci } : { x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1, ci: a.ci };
    return a.dir === 'v' ? { x0: a.x0, y0: a.y0 - MAP.OV, x1: a.x1, y1: a.y1 + MAP.OV, ci: a.ci } : { x0: a.x0 - MAP.OV, y0: a.y0, x1: a.x1 + MAP.OV, y1: a.y1, ci: a.ci };
  });

  // the doorways between neighbouring areas, and the next step on the shortest way between any two
  const n = MAP.chain.length;
  const nbr = Array.from({ length: n }, () => []);
  MAP.gaps = Array.from({ length: n }, () => ({}));
  MAP.corridors.forEach((c, k) => {
    const ci = areaOfCor(k);
    for (const ri of [c.a, c.b]) {
      const room = MAP.rooms[ri], rA = areaOfRoom(ri), d = room.doors.find((dd) => dd.cor === k);
      const [dx, dy] = DIR[d.side];
      const ex = c.dir === 'v' ? c.at : edgeAt(room, d.side, c.at), ey = c.dir === 'v' ? edgeAt(room, d.side, c.at) : c.at;
      MAP.gaps[rA][ci] = { x: ex, y: ey, dx, dy };
      MAP.gaps[ci][rA] = { x: ex, y: ey, dx: -dx, dy: -dy };
      nbr[rA].push(ci); nbr[ci].push(rA);
    }
  });
  MAP.next = Array.from({ length: n }, () => new Array(n).fill(-1));
  for (let b = 0; b < n; b++) {
    // walk out from b: the next step from a toward b is the area a was reached from
    const seen = new Array(n).fill(false), q = [b];
    seen[b] = true; MAP.next[b][b] = b;
    while (q.length) {
      const x = q.shift();
      for (const y of nbr[x]) if (!seen[y]) { seen[y] = true; MAP.next[y][b] = x; q.push(y); }
    }
    if (seen.some((s) => !s)) throw new Error(`layout: ${MAP.chain[seen.indexOf(false)].id} can't be reached`);
  }

  // an arch over every north door
  MAP.arches = [];
  MAP.rooms.forEach((r) => { for (const d of r.doors) if (d.side === 'n') MAP.arches.push({ x: (d.x0 + d.x1) / 2, y: edgeAt(r, 'n', d.at) + 2 }); });

  const lastRound = [...MAP.rooms].reverse().find((r) => r.round);
  const lastRoom = MAP.rooms[MAP.rooms.length - 1];
  MAP.arena = cfg.arena ? { ...cfg.arena } : lastRound ? { x: lastRound.x, y: lastRound.y, r: lastRound.r } : { x: (lastRoom.x0 + lastRoom.x1) / 2, y: (lastRoom.y0 + lastRoom.y1) / 2, r: Math.min(lastRoom.x1 - lastRoom.x0, lastRoom.y1 - lastRoom.y0) / 2 };

  // gates: given outright, or named on a link ({ id, end: 'from' | 'to', closed }) and sat in that room's door
  let GATES;
  if (cfg.gates) GATES = JSON.parse(JSON.stringify(cfg.gates));
  else if (!cfg.links) {
    GATES = {
      g3b: { x0: corrX0, x1: corrX1, y: MAP.rooms[3]?.y1 || 3180, closed: false },
      g3t: { x0: corrX0, x1: corrX1, y: MAP.rooms[3]?.y0 || 2460, closed: true, north: true },
      g5: { x0: corrX0, x1: corrX1, y: MAP.rooms[5]?.y1 || 1180, closed: false },
    };
  } else {
    GATES = {};
    MAP.corridors.forEach((c) => {
      for (const g of [].concat(c.link.gate || [])) {
        const ri = g.end === 'from' ? c.a : c.b, room = MAP.rooms[ri];
        const d = room.doors.find((dd) => dd.cor === MAP.corridors.indexOf(c));
        const e = edgeAt(room, d.side, c.at);
        GATES[g.id] = c.dir === 'v'
          ? { x0: c.x0, x1: c.x1, y: e, closed: !!g.closed, ...(d.side === 'n' ? { north: true } : {}), room: ri }
          : { y0: c.y0, y1: c.y1, x: e, closed: !!g.closed, room: ri };
      }
    });
  }

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

  const CHECKPOINTS = cfg.checkpoints || (cfg.links ? MAP.rooms.map((r, i) => checkpointFor(MAP, r, i)) : MAP.rooms.map((r, i) => ({ room: i, x: CX, y: i === 0 ? r.y1 - 160 : i === 3 ? r.y1 + 150 : i === 5 ? r.y1 + 140 : r.y1 - 70 })));
  const floorArt = cfg.floorArt || (() => {});

  return { MAP, GATES, PROPS, DECALS, WALLDECOR, CHECKPOINTS, floorArt };
}

/* where a wipe puts you back: just inside the door you came in by, or (`cp: 'out'`, for a boss's room) just
   outside it, so you gather before you go back in. The first room: its middle, or near its bottom. */
function checkpointFor(MAP, r, i) {
  if (r.cp && r.cp.x !== undefined) return { room: i, x: r.cp.x, y: r.cp.y };
  if (i === 0) return r.round ? { room: i, x: r.x, y: r.y } : { room: i, x: (r.x0 + r.x1) / 2, y: r.y1 - 160 };
  // the door you come in by: the first step on the shortest way back to the first room
  const first = MAP.chain.findIndex((a) => a.kind === 'room' && a.idx === 0);
  const me = MAP.chain.findIndex((a) => a.kind === 'room' && a.idx === i);
  const g = MAP.gaps[me][MAP.next[me][first]];
  const k = r.cp === 'out' ? 150 : -90;
  return { room: i, x: Math.round(g.x + g.dx * k), y: Math.round(g.y + g.dy * k) };
}
