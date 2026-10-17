/// <reference types="node" />
/**
 * The engine's rules for a fight: threat, the tank's tools, cages, what floats over heads, the dungeon's tuning,
 * where each hero's weapon and head are, and how the bots keep the party together.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { LAST, aggro, exposeMob, healHero, hurtHero, hurtMob, pickTarget } from '../src/dungeon/entities.js';
import { abCd, useAbility } from '../src/dungeon/heroes.js';
import { MAX_POINTS, onPerfectBlock } from '../src/dungeon/buttons.js';
import { AB, BEAT } from '../src/content/roles';
import { CURSE_TIME, breakCage, curseHero, cutChain, liftCurse, makeCage, makeChain, mashCage, spawnMob } from '../src/dungeon/mobs.js';
import { GIVE_UP, KEEP_UP } from '../src/dungeon/bots.js';
import { navPoint } from '../src/dungeon/world.js';
import { heroFit } from '../src/dungeon/render.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { TEMPLATE_ENGINE } from '../src/content/_template/engine';
import { TEMPLATE_DUNGEON } from '../src/content/_template';
import { TEMPLATE_HEROIC } from '../src/content/_template/heroic';
import { DUNGEON_THEMES } from '../src/dungeon/template.js';
import { allHeroArt } from '../src/content/folk';

const game = (role: string, start = 'entrance', heroic = false) => {
  newGame(BARROW_ENGINE, { role, seed: 99, start, heroic, auto: false, quiet: true, noEvents: true, loadouts: {} });
  const s = S as any;
  const by = (r: string) => s.heroes.find((h: any) => h.role === r);
  return { s, tank: by('tank'), healer: by('healer'), dps: by('dps') };
};
const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };

test('tune: Barrow Crypt hits half as hard again as written, and its ordinary mobs have more health', () => {
  const { s, dps } = game('dps');
  assert.equal(s.tune.hit, 1.5);
  const before = dps.hp;
  hurtHero(dps, 100, null, { pierce: true, dodge: false, block: false });
  assert.equal(before - dps.hp, 150);
  const rattler = s.mobs.find((m: any) => m.type === 'rattler');
  assert.ok(BARROW_ENGINE.tune.trashHp > 1);
  assert.equal(rattler.maxHp, Math.round(BARROW_ENGINE.mobs.rattler.hp * BARROW_ENGINE.tune.trashHp));
});

test('threat: hit harder than the tank and it comes for you; Slam grabs it back and drags it in', () => {
  const { s, tank, dps } = game('tank');
  const pack = s.packs[0];
  const m = pack.mobs[0];
  tank.x = m.x; tank.y = m.y + 60; dps.x = m.x + 40; dps.y = m.y + 360;
  hurtMob(m, 20, tank, { quiet: true, noCrit: true });
  m.hp = m.maxHp = 1e6;
  assert.equal(pickTarget(m), tank);
  // the DPS out-damages the tank by a lot: the mob turns
  hurtMob(m, 400, dps, { quiet: true, noCrit: true });
  m.target = pickTarget(m);
  assert.equal(m.target, dps);
  // Slam (a3) from 150 away: it turns back, can't be pulled off for a while, slides in, and gets sliced by the whirlwind
  m.x = tank.x + 150; m.y = tank.y; m.st.kx = m.st.ky = 0;
  assert.ok(useAbility(tank, 'a3', null));
  assert.equal(pickTarget(m), tank);
  assert.ok(m.forcedT > 3);
  assert.ok(tank.whirlT > 0.3, 'Slam starts the 360° whirlwind spin');
  const far = Math.hypot(m.x - tank.x, m.y - tank.y);
  step(0.6);
  const near = Math.hypot(m.x - tank.x, m.y - tank.y);
  assert.ok(near < far - 80, `dragged from ${far.toFixed(0)} to ${near.toFixed(0)}`);
});

test('threat: a tank pressing Cleave every beat holds a pack against a mage pressing Icicle every beat from the first second', () => {
  const { s, tank, dps } = game('tank');
  const m = s.packs[0].mobs[0];
  m.hp = m.maxHp = 1e6;
  tank.x = m.x; tank.y = m.y + 60; tank.face = Math.atan2(m.y - tank.y, m.x - tank.x);
  for (let beat = 1; beat <= 12; beat++) {
    // the mage's Icicle lands first, then the tank's Cleave: Cleave is the tank's threat engine (2×, a Crush 3×)
    hurtMob(m, AB.dps.a4.hit!, dps, { crit: 0.25, tier: 'filler', key: 'icicle' });
    tank.beat = 0;
    assert.ok(useAbility(tank, 'a1', m));
    m.target = pickTarget(m);
    assert.equal(m.target, tank, `beat ${beat}: the mage took it`);
  }
});

test('cages: only the tank, nothing can target him inside, and he has to win the boss back', () => {
  const { s, tank, dps } = game('dps', 'keeper');
  // walk in and pull the Gravekeeper
  s.auto = true;
  for (let i = 0; i < 60 * 30 && !s.boss; i++) update(1 / 60);
  const boss = s.boss;
  assert.ok(boss, 'the boss is pulled');
  step(4);
  boss.hp = boss.maxHp = 1e7;
  // Normal's second phase has the cage, and it goes on the tank, whoever else is up
  boss.phase = 2; boss.act = null; boss.wind = 0;
  Object.assign(boss.ab, { cage: 0, smash: 99, burrow: 99, pulse: 99 });
  for (let i = 0; i < 60 && !tank.st.caged; i++) update(1 / 60);
  assert.ok(tank.st.caged, 'the tank is caged');
  assert.ok(!s.heroes.some((h: any) => h !== tank && h.st.caged));
  // inside, he can't be the target
  const t = pickTarget(boss);
  assert.ok(t && t !== tank);
  // he mashes out: ten taps
  for (let i = 0; i < 10; i++) mashCage(tank);
  assert.ok(!tank.st.caged, 'out');
  // a cage costs him half his threat on everything, so he has to Slam the boss back
  const before = boss.threat.get(tank.id);
  makeCage(tank, boss);
  assert.equal(boss.threat.get(tank.id), before / 2);
  assert.notEqual(pickTarget(boss), tank);
  void dps;
});

test('numbers: you only see your own hits, heals and hurts', () => {
  const { s, tank, dps, healer } = game('dps');
  const m = s.mobs.find((x: any) => x.type === 'rattler');
  m.hp = m.maxHp = 1e6;
  const n = () => s.texts.length;
  let k = n();
  hurtMob(m, 50, tank, { noCrit: true });
  hurtHero(tank, 50, m, { pierce: true, dodge: false, block: false });
  assert.equal(n(), k, 'a mate’s hit and a mate’s hurt show nothing');
  k = n();
  hurtMob(m, 50, dps, { noCrit: true });
  hurtHero(dps, 50, m, { pierce: true, dodge: false, block: false });
  assert.equal(n(), k + 2, 'your hit and your hurt both show');
  void healer;
});

test('cages: a bot tank in a cage mashes its own way out', () => {
  const { s, tank } = game('dps', 'keeper');
  s.auto = true;
  const c = makeCage(tank, null);
  assert.equal(tank.st.caged, c);
  step(4);
  assert.ok(!tank.st.caged, 'out inside four seconds');
  assert.ok(tank.alive);
});

test('heroes: every hero the game can draw is a body in layers, which brings its own fit; from behind, the weapon is in the other hand', () => {
  // a body's views and anchors, and where its weapon and head are, are checked in tests/heroart.test.ts
  for (const art of allHeroArt()) assert.ok(art.includes('.'), `${art}: a body drawn in layers`);
  const own = { weapon: [-40, -70], top: -101 };
  assert.deepEqual(heroFit(false, own), { wx: -40, wy: -70, top: -101 });
  assert.deepEqual(heroFit(true, own), { wx: 40, wy: -70, top: -101 });
});

test('intro: starts in the Ossuary, protects the party from dying, and spawns the walkout and chest when Sir Rattlebones falls', () => {
  const { s, tank, healer, dps } = game('tank', 'intro');
  assert.ok(s.tune.hit < 1 && s.tune.bossHp < 1, 'intro tuning is gentler and faster');
  // Room 1 and Rooms 4-5 are already marked cleared so the run ends at Sir Rattlebones
  const byId = (id: string) => s.packs.find((p: any) => p.def.id === id);
  assert.equal(byId('A').cleared, true);
  assert.equal(byId('B').cleared, false);
  assert.equal(byId('C').cleared, false);
  assert.equal(byId('K').cleared, false);
  assert.equal(byId('D').cleared, true);
  assert.equal(byId('E').cleared, true);
  assert.equal(byId('G').cleared, true);
  // non-lethal protection: no hero can drop below 20% health in the intro
  hurtHero(tank, 99999, null, { pierce: true, dodge: false, block: false });
  assert.ok(tank.alive && tank.hp >= Math.round(tank.maxHp * 0.2), 'cannot die in the intro');
  tank.hp = tank.maxHp;
  for (const h of [tank, healer, dps]) h.power = 1.45;
  s.auto = true;
  for (let i = 0; i < 60 * 75 && s.over !== 'victory'; i++) update(1 / 60);
  assert.equal(byId('K').cleared, true, 'Sir Rattlebones is defeated');
  assert.ok(s.hints.dodge && s.hints.block && s.hints.stagger && s.hints.slam, 'dodge, block, stagger and slam tutorial moments all triggered before the boss fell');
  assert.ok(s.walkout && s.walkout.tell === 'unique', 'the unique lantern walkout played');
  assert.ok(s.chest && s.chest.open, 'the chest spawned in the tomb and opened');
  assert.equal(s.over, 'victory');
});

test('intro: the Crypt Trial plays as any class, and every one of them gets Sir Rattlebones down to the chest', () => {
  for (const [role, cls] of [['healer', 'cleric'], ['dps', 'mage'], ['dps', 'rogue']] as const) {
    newGame(BARROW_ENGINE, { role, seed: 99, start: 'intro', auto: false, quiet: true, noEvents: true, loadouts: { [role]: { cls } } });
    const s = S as any;
    assert.equal(s.player.role, role);
    for (const h of s.heroes) h.power = 1.45;
    s.auto = true;
    for (let i = 0; i < 60 * 90 && s.over !== 'victory'; i++) update(1 / 60);
    assert.ok(s.hints.dodge && s.hints.block, `${cls}: the dodge and the heavy swing were both shown`);
    assert.equal(s.over, 'victory', `${cls}: the trial ends at the chest, not stuck on a lesson only a tank can do`);
    assert.ok(s.chest && s.chest.open);
  }
});

test('combat: Cleave is the filler (no cooldown, once a beat); a perfect block, Charge and Slam prime Crush; the boss weapons change what buttons do', () => {
  const { s, tank, healer, dps } = game('tank');
  assert.equal(abCd(tank, 'a1'), 0, 'Cleave has no cooldown');
  const m = s.packs[0].mobs[0];
  m.hp = m.maxHp = 50000;
  tank.x = m.x; tank.y = m.y + 70; tank.face = Math.atan2(m.y - tank.y, m.x - tank.x);
  assert.ok(useAbility(tank, 'a1', m));
  assert.equal(tank.cd.a1, 0, 'nothing to wait for but the beat');
  assert.equal(tank.beat, BEAT.len, 'it starts the beat');
  assert.equal(useAbility(tank, 'a1', m), false, 'once a beat');

  // a perfect block primes a Crush and ends the beat; Barrowguard 2pc gives a 150 bone shield
  tank.crush = 0;
  tank.bonuses.add('barrowguard2');
  onPerfectBlock(tank, m);
  assert.equal(tank.crush, 1, 'the next Cleave Crushes');
  assert.equal(tank.beat, 0, 'so Cleave fires the moment the shield comes down');
  assert.equal(tank.absorb, Math.round(150 * tank.power), 'Barrowguard 2-piece grants 150 absorb on Perfect Block');
  assert.ok(useAbility(tank, 'a1', m));
  assert.equal(LAST.tier, 'payoff', 'a Crush');
  assert.equal(tank.crush, 0, 'and it used the prime');
  tank.beat = 0;
  assert.ok(useAbility(tank, 'a1', m));
  assert.equal(LAST.tier, 'filler', 'the Cleave after a Crush is a plain one (a Crush’s crit never chains)');

  // Slam primes a Crush too
  tank.beat = 0; tank.cd.a3 = 0; tank.crush = 0;
  assert.ok(useAbility(tank, 'a3', null));
  assert.equal(tank.crush, 1, 'Slam primes Crush');

  // the Gravedigger: Charge primes two Crushes
  tank.unique = 'gravedigger'; tank.crush = 0;
  tank.x = m.x; tank.y = m.y + 160;
  tank.cd.a2 = 0; tank.beat = 0;
  assert.ok(useAbility(tank, 'a2', m));
  step(0.6);
  assert.equal(tank.crush, 2, 'The Gravedigger: Charge primes two Crushes');

  // Healer Boss Weapon (longnight): Sunburst (a3) sears nearby enemies and wards allies for 75
  healer.unique = 'longnight';
  healer.x = m.x + 40; healer.y = m.y;
  healer.cd.a3 = 0; healer.beat = 0;
  const mHpBefore = m.hp;
  assert.ok(useAbility(healer, 'a3', null));
  assert.ok(m.hp < mHpBefore, 'Lantern of the Long Night makes Sunburst sear nearby foes');
  assert.ok(healer.absorb >= Math.round(75 * healer.power), 'Lantern of the Long Night makes Sunburst ward allies');

  // Mage Boss Weapon (gravefrost): Rime burst primes two Shatters and spawns a frost storm
  dps.unique = 'gravefrost';
  dps.cd.a2 = 0; dps.beat = 0; dps.shatter = 0;
  const zonesBefore = s.zones.length;
  assert.ok(useAbility(dps, 'a2', null));
  assert.equal(dps.shatter, 2, 'Gravefrost Staff: the next two Icicles Shatter');
  assert.equal(s.zones.length, zonesBefore + 1, 'Gravefrost Staff makes Rime burst leave a frost storm');
});

test('cooperative roles & lethal telegraphs: only healer can banish wisps and cut chains, and unblocked hazards ignore passive armor', () => {
  const { s, tank, healer, dps } = game('tank');
  // 1. Only Healer can damage/banish Wisps and cut Chains
  const wisp = spawnMob('wisp', tank.x + 20, tank.y, null);
  assert.equal(hurtMob(wisp, 50, tank), 0, 'Tank cannot damage wisps');
  assert.equal(hurtMob(wisp, 50, dps), 0, 'DPS cannot damage wisps');
  assert.ok(wisp.alive);
  assert.ok(hurtMob(wisp, 50, healer) > 0, 'Healer banishes wisps');
  assert.ok(!wisp.alive);

  const ch = makeChain(s.packs[0].mobs[0], dps);
  assert.equal(s.chains.length, 1);
  cutChain(ch, tank);
  cutChain(ch, dps);
  assert.equal(s.chains.length, 1, 'Tank and DPS cannot cut chains');
  cutChain(ch, healer);
  assert.equal(s.chains.length, 0, 'Healer cuts chains');

  // 2. Unblocked hazard telegraphs bypass passive armor, while blocked hazards get both block + armor reduction
  const m = s.packs[0].mobs[0];
  const hp0 = tank.hp;
  hurtHero(tank, 200, m, { hazard: true, block: true });
  assert.equal(hp0 - tank.hp, 300, 'Unblocked 200 hazard deals full 300 (1.5x tune) ignoring passive armor');
  tank.hp = hp0;
  tank.blocking = true;
  tank.blockT = 1.0;
  tank.face = Math.atan2(m.y - tank.y, m.x - tank.x);
  hurtHero(tank, 200, m, { hazard: true, block: true });
  assert.ok(hp0 - tank.hp < 50, 'Blocked hazard receives both block reduction and armor mitigation');
});

test('rogue: fast and fragile; Viper Blades poisons and builds points, Shadowstrike spends them (always a crit on a poisoned foe), Fan stops a cast, Shadowstep blinks behind and banks two', () => {
  newGame(BARROW_ENGINE, { role: 'dps', seed: 77, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: { dps: { cls: 'rogue' } } });
  const s = S as any;
  const rogue = s.heroes.find((h: any) => h.role === 'dps');
  const tank = s.heroes.find((h: any) => h.role === 'tank');
  assert.equal(rogue.cls, 'rogue');
  assert.equal(rogue.maxHp, 720, 'glass cannon HP like mage');
  assert.equal(rogue.armor, 0.15, 'glass cannon armor like mage');
  assert.ok(Math.abs(rogue.speed - 186 * 1.1) < 1e-6, '+10% permanent movement speed');
  assert.ok(rogue.speed > tank.speed, 'faster than tank');

  const m = s.packs[0].mobs[0];
  m.hp = m.maxHp = 100000;
  rogue.x = m.x; rogue.y = m.y + 45;
  const again = () => { rogue.beat = 0; };

  // Shadowstrike spends points: with none, it doesn't fire
  assert.equal(useAbility(rogue, 'a2', m), false, 'no points, no Shadowstrike');

  // Viper Blades: a slash, 5 s of venom, and a point (two on a crit)
  assert.ok(useAbility(rogue, 'a1', m));
  assert.ok(m.bleed && m.bleed.left >= 5, 'Viper Blades applies Viper Venom');
  assert.equal(rogue.points, LAST.crit ? 2 : 1, 'a point, two on a crit');
  const hpAfterViper = m.hp;
  step(1.1);
  assert.ok(m.hp < hpAfterViper, 'Viper Venom ticks');
  for (let i = 0; i < 6; i++) { again(); useAbility(rogue, 'a1', m); }
  assert.equal(rogue.points, MAX_POINTS, 'points stop at five');

  // Shadowstrike on a poisoned foe at five points: always a crit, the payoff, and the points are spent
  again();
  assert.ok(useAbility(rogue, 'a2', m));
  assert.ok(LAST.crit, 'a poisoned foe is always crit');
  assert.equal(LAST.tier, 'payoff', 'five points is the payoff');
  assert.equal(rogue.points, 0, 'every point spent');

  // an Exposed foe takes one Shadowstrike a window as if you had five points
  again(); m.exposed = 3;
  assert.ok(useAbility(rogue, 'a2', m), 'Exposed: no points needed');
  assert.equal(LAST.tier, 'payoff');
  again();
  assert.equal(useAbility(rogue, 'a2', m), false, 'once a window');
  m.exposed = 0; m.burned = null;

  // Shadowstep: blinks behind, swings faster, and banks two points (three with the Cryptfangs)
  rogue.points = 0; rogue.x = m.x; rogue.y = m.y + 220;
  assert.ok(useAbility(rogue, 'a4', m));
  assert.ok(Math.hypot(rogue.x - m.x, rogue.y - m.y) < 80, 'Shadowstep blinks into melee behind target');
  assert.ok(rogue.frenzyT >= 3.7, 'Shadowstep grants Shadow Frenzy attack speed buff');
  assert.equal(rogue.points, 2, 'two points');
  rogue.unique = 'cryptfangs'; rogue.points = 0; rogue.cd.a4 = 0;
  assert.ok(useAbility(rogue, 'a4', m));
  assert.equal(rogue.points, 3, 'The Cryptfangs: one more point');

  // Fan of Blades: stops a cast, refreshes venom, and adds a point
  m.bleed.left = 1.2;
  m.cast = { k: 'volley', t: 0.5, dur: 1.5, kick: true, fn: () => {} };
  rogue.cd.a3 = 0; again(); rogue.points = 0;
  assert.ok(useAbility(rogue, 'a3', null));
  assert.equal(m.cast, null, 'Fan of Blades interrupts enemy cast');
  assert.ok(m.bleed.left >= 4.9, 'Fan of Blades refreshes Viper Blades duration');
  assert.equal(rogue.points, 1, 'and adds a point');
});

test('barrow revamp: Crushing Blows on non-tanks, hazard Ward bleed-through, Exposed windows, 3-piece sets, moving Phase 3 ring, and Heroic Crypt Seals', () => {
  const { s, tank, healer, dps } = game('tank');

  // 1. Avoidable hazards pierce 60% of Ward shields (only 40% absorbed)
  dps.absorb = 500;
  dps.absorbT = 6;
  const dpsHp0 = dps.hp;
  hurtHero(dps, 100, s.packs[0].mobs[0], { hazard: true, dodge: false, block: false });
  // 100 * 1.5 tune = 150 raw; Ward caps at 40% (60 absorbed), 90 bleeds through to HP
  assert.equal(dpsHp0 - dps.hp, 90, 'Avoidable hazard pierces 60% of Ward shield');
  assert.equal(dps.absorb, 440);
  dps.hp = dps.maxHp;
  dps.absorb = 0;

  // 2. Boss Exposed (+35% damage taken) window, Soul Chain cut, Wisp banish backlash, and fast Bone Cage break
  const m = s.packs[0].mobs[0];
  m.hp = m.maxHp = 100000;
  const hpBeforeNormal = m.hp;
  hurtMob(m, 100, tank, { noCrit: true, quiet: true });
  const normalHit = hpBeforeNormal - m.hp;
  exposeMob(m, 3.5);
  assert.ok(m.exposed >= 3.5, 'exposeMob sets exposed duration');
  const hpBeforeExp = m.hp;
  hurtMob(m, 100, tank, { noCrit: true, quiet: true });
  const expHit = hpBeforeExp - m.hp;
  assert.equal(expHit, Math.round(normalHit * 1.35), 'Exposed mob takes +35% damage');

  const ch = makeChain(m, dps);
  m.exposed = 0;
  cutChain(ch, healer);
  assert.ok(m.exposed >= 3.0, 'Cutting Soul Chain exposes the boss for 3s');

  m.exposed = 0;
  tank.cd.a2 = 5.0;
  const cage = makeCage(tank, m);
  breakCage(cage, true);
  assert.ok(m.exposed > 0, 'Breaking Bone Cage quickly (<2.0s) exposes the boss');
  assert.equal(tank.cd.a2, 0, 'Fast Bone Cage break resets Tank Charge cooldown');

  // 3. 3-piece sets: barrowguard3, candlewake3, rimebone3
  tank.bonuses.add('barrowguard3');
  tank.cd.a3 = 0; tank.gcd = 0;
  assert.ok(useAbility(tank, 'a3', null));
  assert.equal(s.thralls.filter((tr: any) => tr.alive && tr.kind === 'bg').length, 2, 'Barrowguard 3pc spawns 2 skeletal thralls on Slam');
  const tankHpBefore = tank.hp;
  hurtHero(tank, 100, null, { pierce: true, dodge: false, block: false });
  // 100 * 1.5 = 150 raw, reduced by 25% thrall soak = 113
  assert.equal(tankHpBefore - tank.hp, Math.round(150 * 0.75), 'Barrowguard 3pc transfers 25% of damage to an active thrall');

  healer.bonuses.add('candlewake3');
  dps.hp = 50;
  hurtHero(dps, 500, null, { pierce: true, dodge: false, block: false });
  assert.ok(dps.alive && dps.ghostSaved && dps.st.ghost > 0, 'Candlewake 3pc saves dying ally as a ghost once per fight');
  assert.equal(dps.hp, Math.round(dps.maxHp * 0.35), 'Ghost Save restores ally to 35% HP');

  dps.bonuses.add('rimebone3');
  dps.cd.a1 = 0; dps.gcd = 0;
  assert.ok(useAbility(dps, 'a1', { x: m.x, y: m.y }));
  assert.ok(s.thralls.some((tr: any) => tr.alive && tr.kind === 'frost'), 'Rimebone 3pc spawns a frost skeleton in Blizzard');

  // 4. Phase 3 moving lantern circle follows the Gravekeeper and grants Lantern Zeal inside, plus Wisp banish backlash
  s.boss = m;
  m.isBoss = true;
  const bossHpBeforeWisp = m.hp;
  const wisp2 = spawnMob('wisp', healer.x + 15, healer.y, null);
  hurtMob(wisp2, 50, healer);
  assert.ok(m.hp < bossHpBeforeWisp, 'Banishing a wisp deals Soul Spark backlash damage to the boss');
  m.x = 400; m.y = 480;
  s.ring = { x: m.x, y: m.y, r: 265, target: 265, followBoss: true, tick: 0 };
  m.x = 620; m.y = 540;
  tank.x = 620; tank.y = 540;
  step(0.5);
  assert.ok(s.ring.x > 450, 'Phase 3 lantern ring tracks the moving Gravekeeper');
  assert.ok(tank.st.zeal > 0, 'Standing inside the Phase 3 lantern circle grants Lantern Zeal');

  // 5. Heroic's Crypt Seal in Room 4 grants Crypt Surge (+25% speed, +20% damage) when all 3 pads are lit
  newGame(BARROW_ENGINE, { role: 'tank', seed: 99, start: 'entrance', heroic: true, auto: false, quiet: true, noEvents: true, loadouts: {} });
  const h = S as any;
  for (const mob of h.mobs) { mob.alive = false; mob.state = 'dead'; }
  const packD = h.packs.find((p: any) => p.def.id === 'D');
  packD.cleared = true;
  for (const pad of h.seal.pads) {
    const hero = h.heroes.find((x: any) => x.role === pad.role);
    hero.x = pad.x; hero.y = pad.y;
    hero.intent.mx = 0; hero.intent.my = 0;
  }
  step(0.35);
  assert.equal(h.seal.cleared, true, 'Standing on all 3 role rune pads shatters the Crypt Seal');
  assert.ok(h.heroes.find((x: any) => x.role === 'tank').st.surge > 10, 'Crypt Seal grants Crypt Surge to the party');
});

test('dungeon template: starter _template dungeon builds map, packs, themes, heroic gilded log, and runs in engine', () => {
  assert.ok(DUNGEON_THEMES.barrow && DUNGEON_THEMES.thimblebriar && DUNGEON_THEMES.moonmere);
  assert.equal(TEMPLATE_DUNGEON.collection.length, 20);
  // its Heroic log: a gilding kit for each of its 16 uniques, and the gilded trophy, mount and pet as bonus slots
  assert.equal(TEMPLATE_HEROIC.collection.length, 19);
  assert.equal(TEMPLATE_HEROIC.bonus?.length, 3);
  assert.ok(TEMPLATE_HEROIC.collection.every((id: string) => id.endsWith('.gilded')));
  newGame(TEMPLATE_ENGINE, { role: 'tank', seed: 123, start: 'entrance', auto: true, quiet: true, noEvents: true, loadouts: {} });
  const s = S as any;
  assert.equal(s.dg.id, 'template');
  assert.equal(s.dg.theme.id, 'thimblebriar');
  assert.equal(s.packs.length, 6);
  assert.equal(s.seal, null, 'no seal on Normal');
  step(2.0);
  assert.ok(s.heroes.every((h: any) => h.alive), 'template dungeon ticks cleanly with bots');
});

test('bots: a mate beside the yard corridor walks in, not into the corner, and the leader stops waiting for a mate who can’t move', () => {
  // where the party once got stuck: the tank in the yard gate, the DPS just east of the corridor's mouth
  const spots = (g: ReturnType<typeof game>, dy: number) => {
    g.tank.x = 500; g.tank.y = 1101; g.healer.x = 452; g.healer.y = 1242; g.dps.x = 570; g.dps.y = 1436 + dy;
  };
  const a = game('tank', 'keeper');
  spots(a, 0);
  const p = navPoint(a.dps, 562, 1211);
  assert.equal(p.x, 500, 'too wide for the corridor where it stands: heads for its middle first');
  // and it gets in, even when its unstick nudge turns it away from the corridor
  a.dps.bot.side = 1;
  a.s.auto = true;
  let t = 0;
  while (t < 3 && Math.hypot(a.dps.x - a.tank.x, a.dps.y - a.tank.y) > KEEP_UP) { update(1 / 60); t += 1 / 60; }
  assert.ok(t < 2, `the DPS caught up in ${t.toFixed(1)}s (at ${a.dps.x.toFixed(0)}, ${a.dps.y.toFixed(0)})`);

  // a bot mate who can't move holds the leader up for about four seconds, then the pull brings them along
  const b = game('tank', 'keeper');
  spots(b, 80);
  b.dps.st.root = 99;
  b.s.auto = true;
  step(GIVE_UP - 0.5);
  assert.ok(!b.s.boss && b.tank.y > 1090, 'still waiting');
  step(3);
  assert.ok(b.s.boss, 'went on and pulled the Gravekeeper');
  assert.ok(b.dps.y < 1180, 'the pull brought the stuck DPS into the yard');

  // a player is always waited for
  const c = game('dps', 'keeper');
  spots(c, 80);
  step(GIVE_UP + 3);
  assert.ok(!c.s.boss, 'the tank still waits for the player');
});

test('Sir Rattlebones: the lash from his last guard dying can finish him, and the run goes on', () => {
  const { s, tank } = game('tank', 'knight');
  const knight = s.mobs.find((m: any) => m.type === 'knight');
  s.boss = knight; knight.state = 'fight'; knight.phase = 2; knight.hp = 5;
  const guard = spawnMob('rattler', knight.x + 60, knight.y, null, true) as any;
  guard.rally = true;
  hurtMob(guard, 1e6, tank, { quiet: true, noCrit: true });
  assert.equal(knight.alive, false);
  assert.equal(s.boss, null);
  step(1);
});

test('curses: in 4 seconds a curse drops its hero to a tenth of their health, and it never kills on its own', () => {
  const { s, dps } = game('healer');
  const caller = spawnMob('caller', dps.x + 2000, dps.y, null);
  assert.equal(CURSE_TIME, 4);
  assert.ok(curseHero(caller, dps));
  assert.ok(!curseHero(caller, dps), 'one curse at a time on a hero');
  step(3.9);
  assert.ok(dps.st.curse, 'still cursed just before it bursts');
  assert.equal(dps.hp, dps.maxHp);
  step(0.12);
  assert.equal(dps.st.curse, null, 'it burst');
  // (out of a fight the party heals a little every frame, so allow a frame or two of that)
  assert.ok(dps.hp <= Math.round(dps.maxHp * 0.1) + 5, `down to a tenth (${dps.hp} of ${dps.maxHp})`);
  assert.ok(s.stats.bursts >= 1);
  // on a hero already under a tenth it takes nothing more, so on its own it can't kill
  dps.hp = dps.maxHp;
  curseHero(caller, dps);
  step(3.95);
  dps.hp = 1;
  step(0.1);
  assert.equal(dps.st.curse, null);
  assert.ok(dps.alive && dps.hp >= 1, 'a curse never kills');
});

test('curses: only the healer lifts one, by a swipe or Sunburst, and gets 5 mana back', () => {
  const { s, tank, healer, dps } = game('healer');
  const caller = spawnMob('caller', healer.x + 2000, healer.y, null);
  curseHero(caller, dps);
  assert.equal(liftCurse(dps, tank), false, 'the tank cannot lift it');
  assert.equal(liftCurse(dps, dps), false, 'nor can the cursed hero');
  assert.ok(dps.st.curse);
  healer.mana = 50;
  assert.equal(liftCurse(dps, healer), true, 'the healer lifts it');
  assert.equal(dps.st.curse, null);
  assert.equal(healer.mana, 55);
  assert.equal(s.stats.lifts, 1);
  // Sunburst lifts every curse on the heroes it reaches
  tank.x = healer.x + 60; tank.y = healer.y; dps.x = healer.x - 60; dps.y = healer.y;
  curseHero(caller, tank); curseHero(caller, dps);
  healer.cd.a3 = 0; healer.gcd = 0; healer.mana = 100;
  assert.ok(useAbility(healer, 'a3', null));
  assert.equal(tank.st.curse, null);
  assert.equal(dps.st.curse, null);
});

test('curses: a bot healer lifts nearly every curse within about a second; curses end with the fight or the hero', () => {
  const { s, tank, healer, dps } = game('dps');
  const caller = spawnMob('caller', healer.x + 2000, healer.y, null);
  let lifted = 0;
  for (let i = 0; i < 12; i++) {
    tank.x = healer.x + 80; tank.y = healer.y; tank.hp = tank.maxHp;
    curseHero(caller, tank);
    const c = tank.st.curse;
    step(2.2);
    if (tank.st.curse !== c || !tank.st.curse) lifted++;
    tank.st.curse = null;
  }
  assert.ok(lifted >= 10, `the bot healer lifted ${lifted} of 12`);
  // a fight that ends takes its curses with it; so does going down
  aggro(caller, tank, 5);
  step(0.1);
  assert.ok(s.inCombat);
  healer.alive = false;
  curseHero(caller, dps);
  caller.hp = 1; hurtMob(caller, 50, tank, { quiet: true, noCrit: true });
  step(0.2);
  assert.equal(s.inCombat, false);
  assert.equal(dps.st.curse, null, 'the fight ended, so did the curse');
  curseHero(spawnMob('caller', dps.x + 2000, dps.y, null), dps);
  hurtHero(dps, 1e6, null, { pierce: true, dodge: false, block: false });
  assert.equal(dps.alive, false);
  assert.equal(dps.st.curse, null, 'a fallen hero loses the curse');
});

test('curses: Gravecallers cast them in a fight, packs A and C have one, and the Crypt Trial has none', () => {
  const { s, tank } = game('healer');
  const ids = (id: string) => s.packs.find((p: any) => p.def.id === id).mobs.map((m: any) => m.type);
  assert.ok(ids('A').includes('caller') && ids('C').includes('caller') && ids('D').includes('caller'));
  const caller = s.packs.find((p: any) => p.def.id === 'A').mobs.find((m: any) => m.type === 'caller');
  caller.hp = caller.maxHp = 1e6; // the bots go for Gravecallers first; this one has to live long enough to show its curse
  aggro(caller, tank, 5);
  let cursed = false;
  for (let i = 0; i < 60 * 4 && !cursed; i++) { step(1 / 60); cursed = s.heroes.some((h: any) => h.st.curse); }
  assert.ok(cursed, 'a Gravecaller curses someone within a few seconds of the pull');
  newGame(BARROW_ENGINE, { role: 'healer', seed: 99, start: 'intro', auto: false, quiet: true, noEvents: true, loadouts: {} });
  const t = S as any;
  const dps = t.heroes.find((h: any) => h.role === 'dps');
  assert.equal(curseHero(spawnMob('caller', dps.x + 200, dps.y, null), dps), null, 'no curses in the Crypt Trial');
});

test('saves: your heal on a mate under 15% pops SAVED!, once per mate every few seconds', () => {
  const { s, healer, dps } = game('healer');
  dps.hp = Math.round(dps.maxHp * 0.1);
  healHero(healer, dps, 138);
  assert.ok(s.texts.some((t: any) => t.str === 'SAVED!'), 'SAVED! pops');
  const n = s.texts.filter((t: any) => t.str === 'SAVED!').length;
  dps.hp = Math.round(dps.maxHp * 0.1);
  healHero(healer, dps, 138);
  assert.equal(s.texts.filter((t: any) => t.str === 'SAVED!').length, n, 'not again straight away');
  const { s: s2, tank, dps: d2 } = game('tank');
  d2.hp = Math.round(d2.maxHp * 0.1);
  healHero(tank, d2, 50);
  assert.ok(!s2.texts.some((t: any) => t.str === 'SAVED!'), 'only the healer saves');
});

test('crypt seals: only on heroic Barrow; normal Barrow has none', () => {
  newGame(BARROW_ENGINE, { role: 'tank', seed: 99, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: {} });
  assert.equal((S as any).seal, null, 'normal Barrow has no Crypt Seal');
  newGame(BARROW_ENGINE, { role: 'tank', seed: 99, start: 'entrance', heroic: true, auto: false, quiet: true, noEvents: true, loadouts: {} });
  assert.ok((S as any).seal && (S as any).seal.pads.length === 3, 'heroic Barrow has one');
});

test('the Gravekeeper: two phases on Normal with a little over half his written health, all three on Heroic with more', () => {
  // pull him with a party that won't fall over: this is about what he does, not whether they live
  const pull = (heroic: boolean) => {
    const g = game('tank', 'keeper', heroic);
    g.s.auto = true;
    for (const h of g.s.heroes) h.hp = h.maxHp = 1e6;
    for (let i = 0; i < 60 * 30 && !g.s.boss; i++) update(1 / 60);
    assert.ok(g.s.boss, 'pulled');
    return { ...g, boss: g.s.boss };
  };
  // what he does over a while, with his health parked at a share of a pool too big to finish
  const watch = (g: ReturnType<typeof pull>, share: number, secs: number) => {
    g.boss.maxHp = 1e7; g.boss.hp = 1e7 * share;
    const seen = new Set<string>();
    for (let i = 0; i < Math.round(secs * 60); i++) {
      update(1 / 60);
      if (g.boss.act) seen.add(g.boss.act.k);
      if (g.s.heroes.some((h: any) => h.st.caged)) seen.add('caged');
      if (g.s.chains.length) seen.add('chained');
      if (g.s.mobs.some((m: any) => m.alive && m.M.wisp)) seen.add('wisps');
      if (g.s.ring) seen.add('ring');
    }
    return seen;
  };

  const n = pull(false);
  assert.ok(BARROW_ENGINE.tune.hp.keeper > 0.5 && BARROW_ENGINE.tune.hp.keeper < 0.7);
  assert.equal(n.boss.maxHp, Math.round(BARROW_ENGINE.mobs.keeper.hp * BARROW_ENGINE.tune.hp.keeper));
  const n1 = watch(n, 0.49, 3);
  assert.equal(n.boss.phase, 2, 'lights out at half health');
  assert.equal(n.s.darkTarget, 1);
  const n2 = watch(n, 0.1, 30);
  assert.equal(n.boss.phase, 2, 'and that is the last phase');
  for (const k of ['caged', 'chained', 'wisps', 'smash']) assert.ok(n2.has(k), `Normal's second phase has ${k}`);
  for (const k of ['leap', 'bury', 'stride', 'burrow', 'ring']) assert.ok(!n1.has(k) && !n2.has(k), `no ${k} on Normal`);

  const h = pull(true);
  assert.equal(h.boss.maxHp, Math.round(BARROW_ENGINE.mobs.keeper.hp * BARROW_ENGINE.heroic.bossHp));
  const h1 = watch(h, 0.6, 3);
  assert.equal(h.boss.phase, 2);
  assert.ok(h1.has('leap'), 'Heroic leaps in for the dark');
  const h2 = watch(h, 0.3, 30);
  assert.equal(h.boss.phase, 3, 'Heroic has a third phase');
  for (const k of ['bury', 'stride', 'burrow', 'ring', 'caged']) assert.ok(h2.has(k), `Heroic's third phase has ${k}`);
});

test('the Gravekeeper: a banished wisp’s bolt can finish him, and the run goes on', () => {
  const { s, healer } = game('healer', 'keeper');
  const keeper = s.mobs.find((m: any) => m.type === 'keeper');
  s.boss = keeper; keeper.state = 'fight'; keeper.hp = 5;
  const wisp = spawnMob('wisp', healer.x + 15, healer.y, null);
  hurtMob(wisp, 50, healer);
  assert.equal(keeper.alive, false);
  assert.equal(s.boss, null);
  step(1);
});

test('flawless: a hand, a burrow ring or a bomb that lands is counted, and one that misses is not', async () => {
  const { runSummary } = await import('../src/dungeon/game.js');
  const { s, dps, healer } = game('dps');
  const at = (h: any, kind: string) => ({ shape: 'circle', x: h.x, y: h.y, r: 40, warn: 0.05, t: 0, dmg: 50, kind, src: null });
  s.hazards.push(at(dps, 'hand'), { ...at(dps, 'hand'), x: dps.x + 900 }, at(healer, 'bomb'));
  s.rings.push({ x: dps.x - 100, y: dps.y, r: 40, speed: 270, w: 26, max: 200, hit: new Set(), dmg: 50, src: null });
  step(1);
  const r = runSummary();
  assert.equal(r.handHits, 1, 'the hand on the DPS lands, the one far off misses');
  assert.equal(r.bombHits, 1);
  assert.equal(r.ringHits, 1);
});

test('boss weapons: every boss weapon’s power is one the engine knows, and the Crypt Trial lends each class the Barrow’s own', async () => {
  const { readFileSync } = await import('node:fs');
  const { ITEMS } = await import('../src/content');
  const { TEMPLATE_ITEMS } = await import('../src/content/_template/items');
  const { trialWeapon } = await import('../src/meta/gear');
  const engine = ['heroes.js', 'buttons.js', 'gadgets.js', 'bombs.js'].map((f) => readFileSync(`src/dungeon/${f}`, 'utf8')).join('\n');
  for (const it of [...Object.values(ITEMS), ...TEMPLATE_ITEMS].filter((i) => i.kind === 'unique' && i.slot === 'weapon')) {
    assert.ok(it.effect && engine.includes(`'${it.effect}'`), `${it.id}: its power "${it.effect}" does nothing in the engine`);
  }
  assert.equal(trialWeapon('tank', 'warrior'), 'gravedigger');
  assert.equal(trialWeapon('healer', 'cleric'), 'longnight');
  assert.equal(trialWeapon('dps', 'mage'), 'gravefrost');
  assert.equal(trialWeapon('dps', 'rogue'), 'cryptfangs');
});
