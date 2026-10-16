/// <reference types="node" />
/**
 * Season 0 and Power: every dungeon's season, the Power the game shows (the item level, as a whole number),
 * and the warning on the Dungeons sheet when the hero you play is short of a dungeon's recommended Power
 * (a warning, never a lock: once per tap of Enter, and not again for that dungeon after Go anyway).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUNGEONS, SEASONS, heroicVersion } from '../src/content';
import { TEMPLATE_DUNGEON } from '../src/content/_template';
import { SLOT_IDS } from '../src/content/gear';
import type { Rar } from '../src/content/types';
import { equip, loadoutFor, newHero, wholeIlvl } from '../src/meta/gear';
import { underPowered } from '../src/meta/party';
import { freshProfile, setActive, type Hero, type Profile } from '../src/meta/profile';
import { ACT1_DUNGEONS, dungeonActions, dungeonSheet, type DungeonPick } from '../src/ui/dungeonsheet';
import type { App } from '../src/ui/app';

/** a profile whose hero you play is a tank in regular gear of one rarity in every slot (0 Common to 3 Epic) */
function tankIn(rar: Rar, p: Profile = freshProfile()): { p: Profile; h: Hero } {
  const h = newHero(p, { name: 'Hollis Emberhand', race: 'dwarf', cls: 'warrior' })!;
  setActive(p, h.id);
  for (const s of SLOT_IDS) h.regular[s] = { rar };
  return { p, h };
}
/** the same tank, holding the Barrow's boss weapon (Power 26) */
function withBarrowWeapon(p: Profile, h: Hero): void {
  p.collection['gravekeeper.tank'] = { n: 1, kc: 50, at: 0 };
  assert.ok(equip(p, h, 'weapon', 'gravekeeper.tank'));
}

test('seasons: Barrow Crypt, Thimblebriar Hollow and Moonmere Sanctum are Season 0, and a Heroic is in its dungeon’s season', () => {
  assert.equal(SEASONS[0].name, 'Season 0');
  for (const d of Object.values(DUNGEONS)) assert.ok(SEASONS[d.season], `${d.id} is in a season`);
  assert.equal(DUNGEONS.barrow.season, 0);
  assert.equal(DUNGEONS.thimblebriar.season, 0);
  for (const d of Object.values(DUNGEONS)) if (d.heroicOf) assert.equal(d.season, DUNGEONS[d.heroicOf].season, d.id);
  assert.equal(heroicVersion('thimblebriar')?.season, 0);
  // Moonmere isn't built yet: its door on the Dungeons sheet says what it will be
  assert.equal(ACT1_DUNGEONS.find((m) => m.id === 'moonmere')?.season, 0);
  assert.ok(SEASONS[TEMPLATE_DUNGEON.season], 'the template names a season, so a copy of it does too');
});

test('power: the game shows Power as a whole number, the weighted item level rounded', () => {
  assert.equal(wholeIlvl(10), 10);
  assert.equal(wholeIlvl(13.2), 13, 'Power 13, never 13.2');
  assert.equal(wholeIlvl(21.6), 22);
  const fresh = tankIn(0);
  assert.equal(wholeIlvl(loadoutFor(fresh.p, fresh.h).score), 10, 'a fresh hero is Power 10');
  // Rare everywhere is 18; a Barrow boss weapon on top is 26 × 0.4 + 18 × 0.6 = 21.2, shown as 21
  const rare = tankIn(2);
  assert.equal(wholeIlvl(loadoutFor(rare.p, rare.h).score), 18);
  withBarrowWeapon(rare.p, rare.h);
  assert.equal(loadoutFor(rare.p, rare.h).score.toFixed(1), '21.2');
  assert.equal(wholeIlvl(loadoutFor(rare.p, rare.h).score), 21);
});

test('power: a hero short of a dungeon’s recommended Power is warned, by how much; never on the Barrow in fresh gear', () => {
  const barrow = DUNGEONS.barrow, hollow = DUNGEONS.thimblebriar;
  assert.equal(barrow.recIlvl, 10);
  assert.equal(hollow.recIlvl, 22, 'Thimblebriar is made for the Barrow’s epics: Power 22 (power 1.72)');
  const fresh = tankIn(0);
  assert.equal(underPowered(fresh.p, fresh.h, barrow), null, 'no warning for the Barrow on a fresh hero');
  assert.deepEqual(underPowered(fresh.p, fresh.h, hollow), { have: 10, want: 22, short: 12, likely: true });
  // Rare is a whole rarity short: the bots in Rare wipe there in most runs
  const rare = tankIn(2);
  assert.deepEqual(underPowered(rare.p, rare.h, hollow), { have: 18, want: 22, short: 4, likely: true });
  // a Barrow weapon gets it to 21: still short, but a wipe is no longer very likely
  withBarrowWeapon(rare.p, rare.h);
  assert.deepEqual(underPowered(rare.p, rare.h, hollow), { have: 21, want: 22, short: 1, likely: false });
  // plain Epic everywhere meets it
  const epic = tankIn(3);
  assert.equal(underPowered(epic.p, epic.h, hollow), null);
  // a Heroic has no recommended Power yet, so it never warns
  assert.equal(underPowered(fresh.p, fresh.h, heroicVersion('barrow')!), null);
  assert.equal(underPowered(fresh.p, fresh.h, heroicVersion('thimblebriar')!), null);
  // it's about the hero you pass in: another hero in the same save gets their own answer
  const healer = newHero(epic.p, { name: 'Wren Ashby', race: 'human', cls: 'cleric' })!;
  assert.equal(underPowered(epic.p, epic.h, hollow), null);
  assert.equal(underPowered(epic.p, healer, hollow)?.have, 10);
});

/** the Dungeons sheet's buttons, on a stand-in app that counts the runs it starts */
function sheet(p: Profile, dungeon: string) {
  const runs: { dungeon: string; heroic: boolean }[] = [];
  const app = { p, dev: { allOpen: false }, startRun: (o: { dungeon: string; heroic: boolean }) => runs.push(o), save: () => {} } as unknown as App;
  const pick: DungeonPick = { dungeon, page: 'door', heroic: false };
  const host = { app, root: { querySelector: () => null } as unknown as HTMLElement, pick, refresh: () => {}, close: () => {} };
  const act = dungeonActions(host);
  const tap = (name: string): void => act[name]({ dataset: {} } as HTMLElement);
  // the foot's words, without the markup
  const foot = (): string => dungeonSheet(p, pick, false).foot.replace(/<[^>]+>/g, '');
  return { runs, pick, tap, foot };
}

test('dungeons sheet: Enter warns an under-powered hero once per tap, Back keeps them out, and Go anyway is remembered', () => {
  const { p } = tankIn(0);
  const s = sheet(p, 'thimblebriar');
  assert.match(s.foot(), /Enter the Thimblebriar/);
  s.tap('go');
  assert.equal(s.runs.length, 0, 'the warning comes first');
  assert.match(s.foot(), /You’re Power 10\. Thimblebriar wants Power 22\. You’ll very likely be wiped\./);
  assert.match(s.foot(), /Go anyway/);
  assert.match(s.foot(), /Back/);
  s.tap('warnback');
  assert.equal(s.runs.length, 0);
  assert.match(s.foot(), /Enter the Thimblebriar/, 'Back goes back to the door');
  s.tap('go');
  assert.equal(s.runs.length, 0, 'every tap of Enter warns again until you choose Go anyway');
  s.tap('goanyway');
  assert.deepEqual(s.runs, [{ dungeon: 'thimblebriar', start: 'entrance', testRar: null, heroic: false }]);
  assert.match(s.foot(), /Enter the Thimblebriar/);
  s.tap('go');
  assert.equal(s.runs.length, 2, 'after Go anyway, Enter goes straight in for the rest of the session');
});

test('dungeons sheet: no warning on the Barrow for a fresh hero, a gentler one when only a little short', () => {
  const fresh = tankIn(0);
  const s = sheet(fresh.p, 'barrow');
  s.tap('go');
  assert.equal(s.runs.length, 1, 'straight in');
  const rare = tankIn(2);
  withBarrowWeapon(rare.p, rare.h);
  const t = sheet(rare.p, 'thimblebriar');
  t.tap('go');
  assert.equal(t.runs.length, 0);
  assert.match(t.foot(), /You’re Power 21\. Thimblebriar wants Power 22\. You might be wiped\./);
  // moving to another page puts the warning away
  t.tap('dglist');
  t.tap('dgback');
  assert.match(t.foot(), /Enter the Thimblebriar/);
});

/** what a player sees or hears of some markup: its words and its labels, not its class names */
const seen = (html: string): string => html.replace(/<[^>]+>/g, ' ') + [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]).join(' ');

test('dungeons sheet: All dungeons is grouped by season, and the door wears a Season 0 tag', () => {
  const { p } = tankIn(0);
  const list = dungeonSheet(p, { dungeon: 'barrow', page: 'list', heroic: false }, false).body;
  assert.match(list, /Season 0/);
  assert.doesNotMatch(list, /Act 1/);
  for (const name of ['Barrow Crypt', 'Thimblebriar Hollow', 'Moonmere Sanctum']) assert.match(list, new RegExp(name));
  assert.match(list, /Recommended <b>Power 30<\/b>/);
  assert.doesNotMatch(seen(list), /ilvl|item level/i);
  for (const dungeon of ['barrow', 'thimblebriar', 'moonmere']) {
    const door = dungeonSheet(p, { dungeon, page: 'door', heroic: false }, false);
    assert.match(door.head, /Season 0/, dungeon);
    assert.doesNotMatch(seen(door.head + door.body + door.foot), /ilvl|item level/i, dungeon);
  }
  const loot = dungeonSheet(p, { dungeon: 'barrow', page: 'loot', heroic: false }, false).body;
  assert.match(loot, /Drops up to <b>Power 26<\/b>/);
});
