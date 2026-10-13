/* ---------- core: maths, random, config, map, gear ---------- */
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const distXY = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
export const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };

export let SEED = 1;
export function setSeed(v) { SEED = v; }
export function rng() { SEED |= 0; SEED = (SEED + 0x6D2B79F5) | 0; let t = Math.imul(SEED ^ (SEED >>> 15), 1 | SEED); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
export const rand = (a, b) => a + (b - a) * rng();
export const irand = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(rng() * arr.length)];
export const vrand = (a, b) => a + (b - a) * Math.random(); // visual only, keeps the game rolls repeatable

/* roles: base numbers at common gear */
export const ROLES = {
  tank: { name: 'Brannoc', title: 'Tank', hp: 1250, armor: 0.55, speed: 176, r: 18, threat: 3.6, color: '#4F6FA8', sprite: 'tank',
    blurb: 'Grab the mobs, hold the boss, block the big hits.',
    kit: [['taunt', 'Taunt'], ['shield', 'Shield (hold)'], ['charge', 'Charge']] },
  healer: { name: 'Maren', title: 'Healer', hp: 820, armor: 0.2, speed: 182, r: 16, threat: 1, color: '#E7B53C', sprite: 'healer',
    blurb: 'Tap a frame to heal. Keep everyone standing.',
    kit: [['circle', 'Prayer circle'], ['ward', 'Ward'], ['sunburst', 'Sunburst']] },
  dps: { name: 'Ivy', title: 'DPS', hp: 720, armor: 0.15, speed: 186, r: 16, threat: 1, color: '#3D7FC1', sprite: 'dps',
    blurb: 'Stand still to cast. Blizzard the packs, Comet the bosses.',
    kit: [['blizzard', 'Blizzard'], ['nova', 'Frost nova'], ['comet', 'Comet']] },
};
export const ORDER = ['tank', 'healer', 'dps'];

export const AB = {
  tank: {
    a1: { key: 'taunt', name: 'Taunt', cd: 8, desc: 'Every mob nearby turns on you.' },
    a2: { key: 'shield', name: 'Shield', cd: 0, hold: true, desc: 'Hold to block hits from the front. Block right before a big hit to stun.' },
    a3: { key: 'charge', name: 'Charge', cd: 10, desc: 'Dash to a mob and stun what is around it.' },
  },
  healer: {
    a1: { key: 'circle', name: 'Prayer circle', cd: 6, mana: 14, aim: true, range: 520, desc: 'Allies standing in it heal fast.' },
    a2: { key: 'ward', name: 'Ward', cd: 5, mana: 10, desc: 'Shield the ally who needs it most.' },
    a3: { key: 'sunburst', name: 'Sunburst', cd: 18, mana: 22, desc: 'Heal everyone and clear nasty effects.' },
  },
  dps: {
    a1: { key: 'blizzard', name: 'Blizzard', cd: 9, aim: true, range: 520, desc: 'Ice storm on the ground. Hits everything in it.' },
    a2: { key: 'nova', name: 'Frost nova', cd: 14, desc: 'Freeze everything close to you.' },
    a3: { key: 'comet', name: 'Comet', cd: 7, cast: 0.9, desc: 'Big hit. Double on frozen targets.' },
  },
};
export const MEND = { heal: 140, mana: 6, gcd: 0.45, range: 560 };

/* ---------- gear: common to epic is real power, epic is the cap, traits are the sideways layer ---------- */
export const RARITY = [
  { key: 'common', name: 'Common', score: 10, color: '#8E8A84', ink: '#5E5A55' },
  { key: 'uncommon', name: 'Uncommon', score: 14, color: '#4E9A4A', ink: '#2E6B2A' },
  { key: 'rare', name: 'Rare', score: 18, color: '#3D7FC1', ink: '#2F5F99' },
  { key: 'epic', name: 'Epic', score: 22, color: '#8A63D2', ink: '#5E3FA3' },
];
export const SLOTS = {
  tank: [['weapon', 'Axe', 'i_axe'], ['offhand', 'Shield', 'i_shield'], ['armour', 'Armour', 'i_plate']],
  healer: [['weapon', 'Staff', 'i_sunstaff'], ['armour', 'Robe', 'i_robe'], ['trinket', 'Charm', 'i_charm']],
  dps: [['weapon', 'Staff', 'i_icestaff'], ['armour', 'Robe', 'i_robe'], ['trinket', 'Charm', 'i_charm']],
};
export const ITEM_NAMES = {
  tank: { weapon: ['Rusty Hand Axe', 'Iron War Axe', 'Barrow Cleaver', 'Gravebreaker'], offhand: ['Plank Shield', 'Iron Round Shield', 'Bonewall Shield', 'The Last Door'], armour: ['Patched Mail', 'Iron Plate', 'Crypt Warden Plate', 'Plate of the Long Watch'] },
  healer: { weapon: ['Ash Staff', 'Sunwood Staff', 'Dawnbringer', 'Staff of First Light'], armour: ['Linen Robe', 'Pilgrim Robe', 'Robe of Quiet Mercy', 'Vestments of the Sun'], trinket: ['Clay Charm', 'Silver Charm', 'Saint’s Knucklebone', 'Heart of Morning'] },
  dps: { weapon: ['Birch Staff', 'Frostwood Staff', 'Rimecaller', 'Winter’s Edge'], armour: ['Wool Robe', 'Snowweave Robe', 'Robe of the Long Night', 'Mantle of the Glacier'], trinket: ['Glass Bead', 'Frost Charm', 'Shard of Old Ice', 'Heart of Winter'] },
};
export const TRAITS = {
  tank: {
    weapon: [['cleave', 'Cleave', 'Your swings hit everything in front of you at full damage.'], ['ringing', 'Ringing Blow', 'Charge hits twice and taunts what it hits.']],
    offhand: [['spiked', 'Spiked Rim', 'Mobs that hit your shield take 40 damage.'], ['bulwark', 'Bulwark', 'Twice as long to land a perfect block.']],
    armour: [['laststand', 'Last Stand', 'Below 30% health you take 30% less damage.'], ['boneward', 'Bone Ward', 'Taunt also shields you for 200.']],
  },
  healer: {
    weapon: [['sunflare', 'Sunflare', 'Mend also heals the next most hurt ally for half.'], ['lightbolt', 'Light Bolt', 'Your bolts heal the most hurt ally for 30.']],
    armour: [['widecircle', 'Wide Circle', 'Prayer circle is 40% bigger.'], ['secondwind', 'Second Wind', 'A ward that breaks gives back 6 mana.']],
    trinket: [['dawn', 'Dawn', 'Sunburst comes back 6 seconds sooner.'], ['quickhands', 'Quick Hands', 'Mend is faster to cast again.']],
  },
  dps: {
    weapon: [['shatterlance', 'Shatterlance', 'Comet on a frozen target hits three times as hard.'], ['splinter', 'Splinter', 'Frostbolts split to a second enemy.']],
    armour: [['glacier', 'Glacier', 'Blizzard is 50% bigger.'], ['deepfreeze', 'Deep Freeze', 'Frost nova freezes for 2 seconds longer.']],
    trinket: [['icyveins', 'Icy Veins', 'Comet casts twice as fast.'], ['coldsnap', 'Cold Snap', 'Dodging leaves a patch of ice that freezes mobs.']],
  },
};
export function makeItem(role, slot, rar, trait) {
  const slots = SLOTS[role];
  const sd = slots.find((s) => s[0] === slot);
  const it = { role, slot, slotName: sd[1], icon: sd[2], rar, name: ITEM_NAMES[role][slot][rar], score: RARITY[rar].score };
  if (rar === 3) { const pool = TRAITS[role][slot]; const t = trait ? pool.find((p) => p[0] === trait) : pick(pool); it.trait = t[0]; it.traitName = t[1]; it.traitDesc = t[2]; }
  return it;
}
export function starterGear() { const g = {}; for (const r of ORDER) { g[r] = {}; for (const [slot] of SLOTS[r]) g[r][slot] = makeItem(r, slot, 0); } return g; }
export function gearScore(set) { return Object.values(set).reduce((a, it) => a + it.score, 0); }
export function gearPower(gs) { return 1 + (gs - 30) * 0.0125; }
export function tierSet(role, rar) { const s = {}; for (const [slot] of SLOTS[role]) s[slot] = makeItem(role, slot, rar); return s; }

/* ---------- the map: rooms bottom to top, corridors between, everything aligned on x = 500 ---------- */
export const MAP = { W: 1000, H: 5800, CX: 500, OV: 70 };
MAP.rooms = [
  { id: 'r0', name: 'Barrow Stairs', x0: 330, y0: 5420, x1: 670, y1: 5760, floor: 'stone', wall: 100 },
  { id: 'r1', name: 'Hall of Bones', x0: 160, y0: 4560, x1: 840, y1: 5220, floor: 'stone', wall: 110 },
  { id: 'r2', name: 'The Ossuary', x0: 100, y0: 3420, x1: 900, y1: 4320, floor: 'stone', wall: 110 },
  { id: 'r3', name: 'The Knight’s Tomb', x0: 160, y0: 2460, x1: 840, y1: 3180, floor: 'tomb', wall: 120 },
  { id: 'r4', name: 'The Catacombs', x0: 120, y0: 1420, x1: 880, y1: 2220, floor: 'stone', wall: 110 },
  { id: 'r5', name: 'The Gravekeeper’s Yard', x0: 60, y0: 120, x1: 940, y1: 1180, floor: 'yard', wall: 130 },
];
MAP.corridors = [];
for (let i = 0; i < MAP.rooms.length - 1; i++) {
  const lo = MAP.rooms[i], hi = MAP.rooms[i + 1];
  MAP.corridors.push({ id: 'c' + i, x0: 420, x1: 580, y0: hi.y1, y1: lo.y0 });
}
/* walk chain bottom (entrance) to top (boss): r0 c0 r1 c1 ... r5 */
MAP.chain = [];
MAP.rooms.forEach((r, i) => { MAP.chain.push({ ...r, kind: 'room', idx: i }); if (MAP.corridors[i]) MAP.chain.push({ ...MAP.corridors[i], kind: 'corridor', idx: i }); });
MAP.chain.forEach((a, i) => { a.ci = i; });
MAP.walk = MAP.chain.map((a) => (a.kind === 'room' ? { x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1, ci: a.ci } : { x0: a.x0, y0: a.y0 - MAP.OV, x1: a.x1, y1: a.y1 + MAP.OV, ci: a.ci }));
MAP.arena = { x: 500, y: 640, r: 430 };

/* gates sit on corridor ends */
export const GATES = {
  g3b: { x0: 420, x1: 580, y: 3180, closed: false },
  g3t: { x0: 420, x1: 580, y: 2460, closed: true, north: true },
  g5: { x0: 420, x1: 580, y: 1180, closed: false },
};

/* props: [sprite, x, y, collider] collider: ['c', r] circle or ['r', hw, hh, dy] box around (x, y + dy) */
export const PROPS = [];
export const DECALS = [];
export const WALLDECOR = []; // [sprite, x, roomIndex]
export function prop(sp, x, y, col, sc) { PROPS.push({ sp, x, y, col, sc: sc || 1, id: 'p' + PROPS.length }); }
export function decal(sp, x, y, sc, rot) { DECALS.push({ sp, x, y, sc: sc || 1, rot: rot || 0 }); }
(function dress() {
  // r0 stairs
  WALLDECOR.push(['torch', 390, 0], ['torch', 610, 0]);
  prop('candles', 362, 5452, null); prop('candles', 640, 5452, null); decal('bones', 600, 5700, 0.9, 0.3);
  // r1 hall of bones
  for (const [x, y] of [[250, 4700], [750, 4700], [250, 5080], [750, 5080]]) prop('pillar', x, y, ['c', 26]);
  WALLDECOR.push(['torch', 270, 1], ['torch', 730, 1], ['banner', 380, 1], ['banner', 620, 1]);
  prop('skullpile', 200, 4610, ['c', 22]); prop('skullpile', 800, 4610, ['c', 22]);
  prop('urn', 192, 4880, ['c', 13]); prop('urn', 808, 4880, ['c', 13]); prop('candles', 196, 5186, null); prop('candles', 804, 5186, null);
  decal('bones', 340, 4800, 1, 0.4); decal('bones', 660, 4990, 1, -0.6); decal('bones', 470, 5160, 0.9, 1.2);
  // r2 ossuary
  for (const [x, y] of [[220, 3560], [780, 3560], [220, 4180], [780, 4180]]) prop('pillar', x, y, ['c', 26]);
  WALLDECOR.push(['torch', 230, 2], ['torch', 770, 2], ['banner', 360, 2], ['banner', 640, 2]);
  prop('skullpile', 140, 3470, ['c', 22]); prop('skullpile', 860, 3470, ['c', 22]); prop('skullpile', 140, 3860, ['c', 22]); prop('skullpile', 860, 3860, ['c', 22]);
  prop('coffin', 140, 4060, ['r', 26, 40, -48]); prop('coffin', 860, 4060, ['r', 26, 40, -48]);
  for (const [x, y, r] of [[300, 3700, 0.3], [700, 3980, -0.8], [520, 4250, 1.4], [380, 3500, 2.2], [620, 3800, 0.9]]) decal('bones', x, y, 1, r);
  // r3 knight's tomb
  prop('coffin', 500, 2600, ['r', 36, 52, -60], 1.35);
  for (const [x, y] of [[214, 2690], [214, 2990], [786, 2690], [786, 2990]]) prop('coffin', x, y, ['r', 26, 40, -48]);
  prop('pillar', 250, 3110, ['c', 26]); prop('pillar', 750, 3110, ['c', 26]);
  WALLDECOR.push(['torch', 300, 3], ['torch', 700, 3], ['banner', 410, 3], ['banner', 590, 3]);
  prop('candles', 430, 2540, null); prop('candles', 570, 2540, null);
  // r4 catacombs
  for (const [x, y] of [[170, 1600], [170, 1760], [170, 1920], [830, 1600], [830, 1760], [830, 1920]]) prop('coffin', x, y, ['r', 26, 40, -48]);
  prop('coffin', 500, 1540, ['r', 34, 50, -56], 1.3);
  prop('pillar', 300, 2120, ['c', 26]); prop('pillar', 700, 2120, ['c', 26]);
  prop('urn', 160, 2180, ['c', 13]); prop('urn', 840, 2180, ['c', 13]);
  WALLDECOR.push(['torch', 260, 4], ['torch', 740, 4], ['banner', 400, 4], ['banner', 600, 4]);
  for (const [x, y, r] of [[360, 2060, 0.5], [640, 1900, -0.4], [420, 1700, 1.1]]) decal('bones', x, y, 1, r);
  // r5 the yard: tombstones around the ring, trees in the corners, his own grave behind him
  const A = MAP.arena;
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * TAU + 0.12;
    const x = A.x + Math.cos(a) * (A.r + 46), y = A.y + Math.sin(a) * (A.r + 34);
    if (x < 90 || x > 910 || y < 150 || y > 1150) continue;
    if (Math.abs(x - 500) < 110 && y > 1000) continue; // keep the way in clear
    prop('tomb' + (k % 3), Math.round(x), Math.round(y), ['r', 18, 8, -6]);
  }
  prop('tree', 110, 210, ['c', 16]); prop('tree', 890, 210, ['c', 16]); prop('tree', 100, 1120, ['c', 16]); prop('tree', 900, 1120, ['c', 16]);
  decal('grave', 500, 240, 1.2, 0);
  for (const [x, y] of [[300, 420], [700, 430], [330, 880], [690, 870]]) decal('grave', x, y, 0.8, 0);
  WALLDECOR.push(['torch', 250, 5], ['torch', 750, 5], ['banner', 420, 5], ['banner', 580, 5]);
})();

/* checkpoints: where you come back after a wipe, by room */
export const CHECKPOINTS = [
  { room: 0, x: 500, y: 5600 }, { room: 1, x: 500, y: 5150 }, { room: 2, x: 500, y: 4250 },
  { room: 3, x: 500, y: 3330 }, { room: 4, x: 500, y: 2150 }, { room: 5, x: 500, y: 1320 },
];

/* packs: mobs and where they stand */
export const PACKS = [
  { id: 'A', room: 1, label: 'skeletons', mobs: [['rattler', 455, 4850], ['rattler2', 548, 4846], ['rattler', 470, 4935], ['rattler2', 545, 4925]] },
  { id: 'B', room: 2, label: 'bonebrute', mobs: [['brute', 380, 4030], ['rattler', 320, 4100], ['rattler2', 440, 4100], ['rattler', 380, 4150]] },
  { id: 'C', room: 2, label: 'archers', mobs: [['archer', 580, 3600], ['archer', 720, 3620], ['rattler', 620, 3700], ['rattler2', 690, 3712]] },
  { id: 'K', room: 3, label: 'Sir Rattlebones', boss: 'knight', mobs: [['knight', 500, 2720]] },
  { id: 'D', room: 4, label: 'gravecaller', mobs: [['caller', 500, 1960], ['rattler', 440, 2030], ['rattler2', 560, 2030], ['archer', 650, 1880]] },
  { id: 'E', room: 4, label: 'ambush', ambush: true, mobs: [['rattler', 205, 1600], ['rattler2', 205, 1760], ['rattler', 205, 1920], ['rattler2', 795, 1600], ['rattler', 795, 1760], ['rattler2', 795, 1920], ['brute', 500, 1600]] },
  { id: 'G', room: 5, label: 'The Gravekeeper', boss: 'keeper', mobs: [['keeper', 500, 520]] },
];

/* mob types */
export const MOBS = {
  rattler: { name: 'Rattler', hp: 380, r: 15, speed: 152, dmg: 40, every: 1.4, wind: 0.3, reach: 22, aggro: 230, sp: 'rattler', xp: 1 },
  rattler2: { name: 'Rattler', hp: 400, r: 15, speed: 148, dmg: 42, every: 1.45, wind: 0.3, reach: 22, aggro: 230, sp: 'rattler2' },
  archer: { name: 'Bone Archer', hp: 260, r: 14, speed: 125, dmg: 22, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'archer', ranged: { min: 220, max: 360, dmg: 48, every: 2.4, warn: 0.55, speed: 560 } },
  brute: { name: 'Bonebrute', hp: 2400, r: 30, speed: 100, dmg: 110, every: 2.2, wind: 0.5, reach: 30, aggro: 240, sp: 'brute', heavy: true, big: true },
  caller: { name: 'Gravecaller', hp: 600, r: 15, speed: 110, dmg: 22, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'caller', keep: 240 },
  wisp: { name: 'Wisp', hp: 1, r: 12, speed: 98, dmg: 70, every: 99, wind: 0, reach: 6, aggro: 0, sp: 'wisp', wisp: true },
  knight: { name: 'Sir Rattlebones', hp: 8500, r: 36, speed: 100, dmg: 120, every: 2.0, wind: 0.45, reach: 34, aggro: 260, sp: 'knight', heavy: true, big: true, boss: true },
  keeper: { name: 'The Gravekeeper', hp: 22000, r: 50, speed: 92, dmg: 150, every: 2.0, wind: 0.5, reach: 40, aggro: 0, sp: 'keeper', heavy: true, big: true, boss: true },
};
