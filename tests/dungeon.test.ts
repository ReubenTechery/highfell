/// <reference types="node" />
/**
 * The engine's rules for a fight: threat, the tank's tools, cages, what floats over heads, the dungeon's tuning,
 * and where each hero's weapon and head are.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtHero, hurtMob, pickTarget } from '../src/dungeon/entities.js';
import { useAbility } from '../src/dungeon/heroes.js';
import { makeCage, mashCage } from '../src/dungeon/mobs.js';
import { HERO_FIT, heroFit } from '../src/dungeon/render.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { HERO_ART } from '../src/content/folk';
import SPRITES from '../art/sprites.json';

const game = (role: string, start = 'entrance') => {
  newGame(BARROW_ENGINE, { role, seed: 99, start, auto: false, quiet: true, noEvents: true, loadouts: {} });
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
  assert.equal(rattler.maxHp, Math.round(BARROW_ENGINE.mobs.rattler.hp * 1.3));
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
  // Slam from 150 away: it turns back, can't be pulled off for a while, and slides in to the tank
  m.x = tank.x + 150; m.y = tank.y; m.st.kx = m.st.ky = 0;
  assert.ok(useAbility(tank, 'a1', null));
  assert.equal(pickTarget(m), tank);
  assert.ok(m.forcedT > 3);
  const far = Math.hypot(m.x - tank.x, m.y - tank.y);
  step(0.6);
  const near = Math.hypot(m.x - tank.x, m.y - tank.y);
  assert.ok(near < far - 80, `dragged from ${far.toFixed(0)} to ${near.toFixed(0)}`);
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
  // the third phase's cage goes on the tank, whoever else is up
  boss.phase = 3; boss.act = null; boss.wind = 0;
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

test('heroes: every one the game can draw knows where its weapon is and how tall it stands, front and back', () => {
  const sprites = SPRITES as Record<string, { vb: number[] }>;
  for (const set of new Set(Object.values(HERO_ART))) {
    assert.ok((HERO_FIT as Record<string, unknown>)[set], `no fit for ${set}`);
    for (const g of set.startsWith('risen') ? ['', '_gilded'] : ['']) for (const back of [false, true]) {
      const name = set + g + (back ? '_b' : '_f');
      const [vx, vy, w] = sprites[name].vb;
      const { wx, wy, top } = heroFit(set + g, back);
      assert.ok(wx > vx && wx < vx + w && wy > vy && wy < 0, `${name}: the weapon is on the sprite`);
      assert.ok(top >= vy && top < -90, `${name}: the head's top is on the sprite`);
    }
  }
  // from behind, the weapon is in the other hand
  assert.equal(heroFit('tank', true).wx, -heroFit('tank', false).wx);
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

