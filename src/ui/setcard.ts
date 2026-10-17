/**
 * A set, drawn and said the same way everywhere: the Dungeons door and its Your set page, the collection log,
 * the armoury, the chest, the item card. The words are "Barrowguard is a set of 3. Wear 2: … Wear all 3: …",
 * each bonus marked On, Put them on (you have the pieces but they aren't all on), Turns on or Turns off (the
 * piece the armoury has picked), or how many more it needs. The big block has your own hero wearing the whole
 * set on a dark stage, the pieces you haven't found as pale ghosts with a dashed edge (art.ts: setLookSvg), the
 * three pieces (found ones lit, missing ones dashed with their drop rate) and where the pieces drop. The door
 * has a slim row of it, and the chest only the three pieces as little stickers and how many are left. The state
 * of a set comes from meta/sets.ts.
 */
import { DUNGEONS, ITEMS, heroicVersion } from '../content';
import type { Hero, Profile } from '../meta/profile';
import type { SetState } from '../meta/sets';
import { esc, fmtRate, GLYPH } from './dom';
import { iconOf, rarLook, setLookSvg } from './art';
import { dropSource } from './logpeek';

type Bonus = SetState['bonuses'][number];
const WEAR: Record<2 | 3, string> = { 2: 'Wear 2', 3: 'Wear all 3' };
/** a bonus's tag: what putting on the picked piece would do to it, or else where it stands */
const TAG = (b: Bonus): string => (b.later ? 'Later' : b.change === 'turnon' ? 'Turns on' : b.change === 'turnoff' ? 'Turns off' : b.state === 'on' ? 'On' : b.state === 'ready' ? 'Put them on' : `${b.more} more`);

/** The words: the set's name, a set of 3 (with how many you have, unless the block around it says so), and its
 *  two bonuses, each with its tag. */
export function setWords(st: SetState, o: { have?: boolean } = {}): string {
  const line = (b: Bonus): string => `<p class="sw-b ${b.later ? 'later' : b.change || b.state}"><i aria-hidden="true">${b.n}</i><span><b>${WEAR[b.n]}:</b> ${esc(b.desc)}</span><em>${TAG(b)}</em></p>`;
  return `<div class="sw"><p class="sw-h"><b>${esc(st.set.name)}</b> is a set of 3.${o.have === false ? '' : ` <span class="sw-n">You have ${st.have}</span>`}</p>
    ${st.bonuses.map(line).join('')}</div>`;
}

/** The three pieces as tiles: a found one lit and ticked (ringed gold while worn), a missing one dashed with its
 *  drop rate. `act` makes each a button: 'item' (its sheet), 'peek' (the log's closer look) or 'gearat' (the
 *  armoury on that slot, for `hero`). */
export function setTiles(p: Profile, st: SetState, o: { act?: 'item' | 'peek' | 'gearat'; hero?: string } = {}): string {
  return `<span class="st-pcs">${st.pieces.map((x) => {
    const name = ITEMS[x.id].name, rate = fmtRate(dropSource(p, x.id)?.rate);
    const cls = `st-pc${x.have ? ' got' : ''}${x.worn ? ' on' : ''}`, inner = `<span class="tile" aria-hidden="true">${iconOf(x.id)}</span><small aria-hidden="true">${x.have ? GLYPH.check : rate}</small>`;
    const label = `${name}: ${x.worn ? 'wearing it' : x.have ? 'yours' : `not found yet, ${rate}`}`;
    if (!o.act) return `<span class="${cls}" style="--rc: ${rarLook(x.id).color}" role="img" aria-label="${esc(label)}">${inner}</span>`;
    const to = o.act === 'gearat' ? ` data-hero="${esc(o.hero || '')}" data-slot="${x.slot}"` : '';
    return `<button type="button" class="${cls}" style="--rc: ${rarLook(x.id).color}" data-act="${o.act}" data-id="${esc(x.id)}"${to} aria-label="${esc(label)}">${inner}</button>`;
  }).join('')}</span>`;
}

/** Where a set's pieces drop, in one line: the boss and the rate (each piece rolls on its own), and that its
 *  Heroic drops them too. */
export function setWhere(p: Profile, st: SetState): string {
  const src = st.pieces.map((x) => dropSource(p, x.id));
  const first = src[0];
  if (!first) return '';
  const heroic = heroicVersion(DUNGEONS[st.set.dungeon]?.id || '') ? ', on Normal and Heroic' : '';
  if (src.every((s) => s && s.boss === first.boss && s.rate === first.rate)) return `${first.boss} drops each piece: ${fmtRate(first.rate)}${heroic}.`;
  return `${st.pieces.map((x, i) => `${ITEMS[x.id].name}: ${src[i] ? `${src[i]!.boss}, ${fmtRate(src[i]!.rate)}` : '?'}`).join('. ')}${heroic}.`;
}

/** The big block: your hero in the whole set on a dark stage, the set's name, how many you have and its three
 *  pieces, then the words, and where the pieces drop. */
export function setShow(p: Profile, h: Hero, st: SetState, o: { eyebrow?: string; where?: boolean; act?: 'item' | 'peek' | 'gearat' } = {}): string {
  const where = o.where ? setWhere(p, st) : '';
  return `<section class="ss${st.done ? ' done' : ''}" aria-label="${esc(`${st.set.name}: ${st.have} of 3`)}">
    <div class="ss-stage">${setLookSvg(p, h, st.set.pieces)}<span class="ss-floor" aria-hidden="true"></span>${st.done ? '' : '<i class="ss-stamp">Full set</i>'}</div>
    <div class="ss-side">${o.eyebrow ? `<p class="ss-eye">${esc(o.eyebrow)}</p>` : ''}<h3>${esc(st.set.name)}</h3>
      <p class="ss-n">${st.done ? `${GLYPH.check}Set done` : `<b>${st.have}</b> of 3`}</p>${setTiles(p, st, { act: o.act, hero: h.id })}</div>
    ${setWords(st, { have: false })}${where ? `<p class="ss-where">${esc(where)}</p>` : ''}</section>`;
}

/** The chest's set piece, kept short: the set's three pieces as little stickers in their boxes (found ones lit,
 *  the one that just came glowing, missing ones faded in a dashed box), and how many are left, or that it's done. */
export function setStickers(st: SetState, drop?: string): string {
  const left = st.pieces.length - st.have;
  const pcs = st.pieces.map((x) => `<span class="sk${x.have ? ' got' : ''}${x.id === drop ? ' new' : ''}" style="--rc: ${rarLook(x.id).color}"><span class="tile">${iconOf(x.id)}</span></span>`).join('');
  const line = st.done ? `${GLYPH.check}${esc(st.set.name)} set done!` : `${left} more to finish ${esc(st.set.name)}`;
  return `<div class="sm-stickers${st.done ? ' done' : ''}" role="img" aria-label="${esc(`${st.set.name}: ${st.have} of ${st.pieces.length}. ${st.done ? 'Set done' : `${left} more to finish it`}`)}">
    <span class="sk-row" aria-hidden="true">${pcs}</span><p class="sk-left" aria-hidden="true">${line}</p></div>`;
}

/** The door's slim row: the three pieces small (found ones lit, missing ones dashed), "Your set" over the set's
 *  name, and how many you have, or a tick once it's done. It opens the Your set page. */
export function setRow(st: SetState): string {
  const pcs = st.pieces.map((x) => `<span class="tile${x.have ? '' : ' miss'}" style="--rc: ${rarLook(x.id).color}">${iconOf(x.id)}</span>`).join('');
  return `<button type="button" class="dgx-setbar${st.done ? ' done' : ''}" data-act="setx" aria-label="${esc(`Your set: ${st.set.name}, ${st.done ? 'done' : `${st.have} of 3`}. See it`)}">
    <span class="dgx-set-pcs" aria-hidden="true">${pcs}</span><span class="dgx-set-name"><small>Your set</small><b>${esc(st.set.name)}</b></span>
    ${st.done ? `<span class="dgx-set-n done" aria-hidden="true">${GLYPH.check}</span>` : `<b class="dgx-set-n" aria-hidden="true">${st.have}/3</b>`}<span class="dgx-go" aria-hidden="true">${GLYPH.right}</span></button>`;
}
