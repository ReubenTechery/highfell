/**
 * The Dungeons sheet, opened by the big Dungeons button or the Barrow door. The dungeon's picture, and
 * right under it one small line for its collection log that opens to show what each role can get here
 * (what you have lit up, every drop rate; tap one to hold it up against what you wear). Then the main
 * thing: your role, your hero (picking a role picks the hero of that role you played last; change to
 * another or make one) and your brew, then loot or practice. Bots take the other seats at your gear
 * level. The sheets wire up its buttons.
 */
import { DUNGEONS } from '../content';
import { MAX_HEROES } from '../content/folk';
import { ORDER, ROLES } from '../content/roles';
import type { DropDef, RoleId } from '../content/types';
import { RECIPES, RECIPE_ORDER } from '../content/vale';
import { STARTS } from '../content/barrow/script.js';
import { loadoutFor } from '../meta/gear';
import { lootFor } from '../meta/loot';
import { heroesFor, seats } from '../meta/party';
import { activeHero, roleOf, type Profile } from '../meta/profile';
import { esc, fmtRate, fmtT, GLYPH } from './dom';
import { colourOf, heroImg, heroSprite, iconOf, nameOf, placeSprite, tile } from './art';
import { ilvl } from './hearth';

/** what the sheet remembers while the page is open: the run's options, the role you're looking at, and
 *  whether the list of your other heroes is open */
export interface DungeonPick { mode: 'loot' | 'practice'; start: string; gear: 'mine' | 2 | 3; role: RoleId | null; alts: boolean; log: boolean }

/** each role's icon on its tab */
const ROLE_ICON: Record<RoleId, string> = { tank: 'shield', healer: 'mend', dps: 'comet' };
const word = (r: RoleId): string => (r === 'dps' ? 'DPS' : ROLES[r].title.toLowerCase());
const seg = (act: string, cur: string, opts: [string, string][]): string =>
  `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;

/** The role the sheet shows: the one you picked, or your hero's. */
export function pickedRole(p: Profile, pick: DungeonPick): RoleId {
  const h = activeHero(p);
  return pick.role || (h ? roleOf(h) : 'tank');
}

export function dungeonSheet(p: Profile, pick: DungeonPick): { head: string; body: string; foot: string } {
  const dg = DUNGEONS.barrow, rec = p.dungeons.barrow, keeper = p.bosses[`${dg.id}.${dg.finalBoss}`];
  const role = pickedRole(p, pick);
  const h = activeHero(p);
  const playing = !!h && roleOf(h) === role;
  const practice = pick.mode === 'practice';
  const got = dg.collection.filter((id) => p.collection[id]).length, all = dg.collection.length;
  const body = `<div class="dgx">
    <div class="dgx-side">
      <div class="dgx-art">${BANNER}
        <div class="dgx-name"><h3>${esc(dg.name)}</h3><span class="dg-stats"><span>Clears <b>${rec ? rec.clears : 0}</b></span><span>Best <b>${fmtT(rec?.pb)}</b></span><span>KC <b>${keeper ? keeper.kc : 0}</b></span></span></div>
      </div>
      <section class="dgx-log">
        <button type="button" class="dgx-logbar" data-act="logx" aria-expanded="${pick.log}"><span>Collection log</span><b>${got}/${all}</b><i aria-hidden="true"><i style="width: ${((got / all) * 100).toFixed(1)}%"></i></i><span class="dgx-more">${pick.log ? 'Hide' : 'Loot'}${pick.log ? GLYPH.up : GLYPH.down}</span></button>
        ${pick.log ? `<div class="dgx-loot">${ORDER.map((r) => lootRow(p, ROLES[r].title, r, lootFor(dg, r).mine, r === role)).join('')}${lootRow(p, 'Anyone', null, lootFor(dg, role).shared, false)}
          <button type="button" class="btn small" data-act="entry" data-id="${dg.id}.${dg.finalBoss}">${GLYPH.book}Open the collection log</button></div>` : ''}
      </section>
    </div>
    <div class="dgx-you">
      <section class="dgx-main" aria-label="You">
        <div class="dgx-roles" role="radiogroup" aria-label="Your role">${ORDER.map((r) => `<button type="button" class="dgx-role r-${r}" role="radio" aria-checked="${r === role}" data-act="role" data-role="${r}"><span class="tile" aria-hidden="true">${tile(ROLE_ICON[r])}</span>${esc(ROLES[r].title)}</button>`).join('')}</div>
        ${me(p, role, pick)}
        ${brews(p, practice)}
      </section>
      <section class="dgx-mode">
        ${seg('mode', pick.mode, [['loot', 'For loot'], ['practice', 'Practice']])}
        ${practice ? `<div class="box">
            <div class="seg-row"><b>Start at</b> ${seg('start', pick.start, STARTS.map((s: { id: string; name: string }) => [s.id, s.name] as [string, string]))}</div>
            <div class="seg-row"><b>Gear</b> ${seg('tgear', String(pick.gear), [['mine', 'Mine'], ['2', 'Try Rare'], ['3', 'Try Epic']])}</div>
            <p class="fine">No loot, kill counts or achievements.</p>
          </div>` : ''}
      </section>
    </div>
  </div>`;
  let foot: string;
  if (playing) foot = `<button type="button" class="btn gold big" data-act="go">${practice ? 'Start practice' : `Enter the ${esc(dg.name.split(' ')[0])}`}</button>`;
  else if (p.roster.length < MAX_HEROES) foot = `<button type="button" class="btn gold big" data-act="newseat" data-role="${role}">${GLYPH.plus}Make a ${esc(word(role))}</button>`;
  else foot = `<p class="fine">Your bunk room is full. Let a hero go to make a ${esc(word(role))}.</p>`;
  return { head: '<h2>Dungeons</h2>', body, foot };
}

/** one row of the loot: who can get it, then each drop */
function lootRow(p: Profile, label: string, role: RoleId | null, drops: DropDef[], yours: boolean): string {
  return `<div class="dgx-row${role ? ` r-${role}` : ''}${yours ? ' yours' : ''}"><span class="dgx-lbl">${esc(label)}</span>${drops.map((d) => item(p, d)).join('')}</div>`;
}

/** a drop: lit up if you have it, its drop rate if you don't */
function item(p: Profile, d: DropDef): string {
  const have = !!p.collection[d.id];
  return `<button type="button" class="dgx-it${have ? ' got' : ''}" data-act="item" data-id="${esc(d.id)}" style="--c: ${colourOf(d.id)}" aria-label="${esc(nameOf(d.id))}: ${have ? 'in your collection' : `drops ${fmtRate(d.rate)}`}">
    <span class="tile" aria-hidden="true">${iconOf(d.id)}</span><small>${have ? GLYPH.check : fmtRate(d.rate)}</small></button>`;
}

/** who plays the role: your hero, a way to change to another of yours, and who the bots are */
function me(p: Profile, role: RoleId, pick: DungeonPick): string {
  const h = activeHero(p);
  if (!h || roleOf(h) !== role) return `<div class="dgx-me none r-${role}"><b>No ${esc(word(role))} yet</b><span class="fine">Make one to play this seat.</span></div>`;
  const others = heroesFor(p, role).filter((x) => x.id !== h.id);
  const room = p.roster.length < MAX_HEROES;
  const bots = seats(p).filter((s) => s.bot).map((s) => s.bot);
  const list = pick.alts
    ? `<div class="seat-pick">${others.map((x) => `<button type="button" class="btn small" data-act="playseat" data-id="${esc(x.id)}">${GLYPH.play}${esc(x.name.split(' ')[0])}</button>`).join('')}${room ? `<button type="button" class="btn small" data-act="newseat" data-role="${role}">${GLYPH.plus}New ${esc(word(role))}</button>` : ''}</div>`
    : '';
  return `<div class="dgx-me r-${role}">
      <span class="dgx-fig" aria-hidden="true">${heroImg(heroSprite(h, role), { cls: 'dgx-img' })}</span>
      <span class="dgx-who"><b>${esc(h.name)}</b><span>Item level ${ilvl(loadoutFor(p, h).score)}</span></span>
      ${others.length || room ? `<button type="button" class="btn small" data-act="alts" aria-expanded="${pick.alts}">Change</button>` : ''}
    </div>${list}
    <p class="fine">${esc(bots.join(' and '))} join as bots.</p>`;
}

/** which brew you take in: one bottle a run */
function brews(p: Profile, practice: boolean): string {
  const have = RECIPE_ORDER.filter((id) => (p.vale.shelf[id] || 0) > 0);
  if (!have.length) return '';
  const drink = p.vale.drink && (p.vale.shelf[p.vale.drink] || 0) > 0 ? p.vale.drink : null;
  const chip = (id: string | null) => {
    const r = id ? RECIPES[id] : null;
    return `<button type="button" class="bc" role="radio" data-act="drink" data-id="${id || ''}" aria-checked="${drink === id}" ${r ? `style="--c: ${r.color}"` : ''}>
      ${r ? `<span class="tile" aria-hidden="true">${tile(r.icon)}</span>${esc(r.name)} <small>×${p.vale.shelf[r.id]}</small>` : 'No brew'}</button>`;
  };
  return `<div class="brewchips" role="radiogroup" aria-label="Brew, one bottle a run">${chip(null)}${have.map(chip).join('')}</div>
    <p class="fine">${esc(drink ? RECIPES[drink].desc : 'Go in as you are.')}${drink && practice ? ' Practice keeps the bottle.' : ''}</p>`;
}

/** the dungeon's picture: its bosses in the crypt, in the green light of the Gravekeeper's lantern */
const BANNER = (() => {
  const o: string[] = ['<rect x="0" y="0" width="640" height="300" style="fill: #241C33"/>', '<circle cx="320" cy="168" r="230" style="fill: url(#dgx-glow)"/>'];
  o.push(placeSprite('arch', 320, 262, { k: 1.32 }));
  o.push(placeSprite('pillar', 92, 266, { k: 1.06 }) + placeSprite('pillar', 548, 266, { k: 1.06 }));
  o.push('<path d="M-4 256 H644 V304 H-4 Z" style="fill: #3A3150; stroke: #1E1A1A; stroke-width: 4"/>');
  o.push(placeSprite('tomb1', 28, 282, { k: 1.1 }) + placeSprite('tomb2', 612, 284, { k: 1.1 }));
  o.push(placeSprite('knight', 176, 288, { k: 0.74 }) + placeSprite('rattler', 470, 290, { k: 0.9, flip: true }));
  o.push(placeSprite('keeper', 324, 296, { k: 0.8 }));
  o.push(placeSprite('candles', 248, 296, { k: 0.95 }) + placeSprite('candles', 404, 298, { k: 0.95 }));
  o.push('<rect x="0" y="0" width="640" height="300" style="fill: url(#dgx-vig)"/>');
  return `<svg class="dgx-svg" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <radialGradient id="dgx-glow"><stop offset="0" stop-color="#9BE15D" stop-opacity="0.42"/><stop offset="1" stop-color="#9BE15D" stop-opacity="0"/></radialGradient>
    <radialGradient id="dgx-vig" cx="50%" cy="42%" r="72%"><stop offset="0.62" stop-color="#140E18" stop-opacity="0"/><stop offset="1" stop-color="#140E18" stop-opacity="0.6"/></radialGradient>
  </defs>${o.join('')}</svg>`;
})();
