/**
 * An achievement, said the same plain way everywhere it shows: what you did (its how, one sentence), what
 * you got and where it went (rewardsOf), your progress while it counts something, and the day you earned
 * it with the kill count it came at. The row is the achievements page's and the chest's; the card is its
 * closer look over the Logs sheet, which a tap on the toast, a row, the garden's or the cauldron's chip, or
 * a reward's own sheet opens. A title has its Wear it button wherever it shows, for the hero you play.
 */
import { ACHIEVEMENTS, COLLECTIBLES, placeName } from '../content';
import type { AchievementDef, Tier } from '../content/types';
import { bestClear, progress, rewardsOf, type RewardLine } from '../meta/achievements';
import { activeHero, type Profile } from '../meta/profile';
import { esc, fmtDate, fmtN, fmtT, GLYPH } from './dom';
import { iconOf, tile } from './art';
import { mainReward } from './dungeonsheet';
import { SWATCH } from './lookssheet';

/** the word for each kind of reward, said before its name */
export const REWARD_WORD: Record<RewardLine['kind'], string> = { title: 'Title', pet: 'Pet', mount: 'Mount', trophy: 'Trophy', banner: 'Banner', cosmetic: 'Look', look: 'House look', race: 'New hero', points: 'Points' };
export const TIER_WORD: Record<Tier, string> = { log: 'Collection log', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', meta: 'Mastery', hidden: 'Hidden' };
/** each tier's colour, for the light round its card */
const TIER_COL: Record<Tier, string> = { log: '#E7B53C', bronze: '#D08A4E', silver: '#C9D2DC', gold: '#F2C230', meta: '#B79CFF', hidden: '#5C5070' };

/** a hidden achievement you haven't earned keeps its secret */
export const secretOf = (p: Profile, a: AchievementDef): boolean => a.tier === 'hidden' && !p.achievements[a.id];

/** What you got, in one line: each reward's kind and name, or the points when that's all it gives. */
export function gotLine(p: Profile, a: AchievementDef): string {
  const rw = rewardsOf(p, a).filter((r) => r.kind !== 'points');
  return rw.length ? rw.map((r) => `${REWARD_WORD[r.kind]}: ${r.name}`).join(' · ') : `${a.points} points`;
}

/** your progress while it counts something (370 / 500 and a bar), or your best clear against its mark */
export function progressHtml(p: Profile, a: AchievementDef): string {
  if (p.achievements[a.id]) return '';
  const t = bestClear(p, a);
  if (t) return `<p class="ac-pr ac-best">${t.best === null ? 'No clear yet' : `Your best clear: <b>${fmtT(t.best)}</b>`}. Under <b>${fmtT(t.need)}</b> earns it.</p>`;
  const pr = progress(p, a);
  // a count of one (your first harvest) has nothing to show on the way
  if (!pr || pr.need <= 1) return '';
  // a lifetime count adds up over every run (or harvest): say so
  return `<p class="ac-pr"><span class="bar" role="progressbar" aria-label="Progress" aria-valuenow="${pr.have}" aria-valuemax="${pr.need}"><i style="width: ${((pr.have / Math.max(1, pr.need)) * 100).toFixed(1)}%"></i></span><b>${fmtN(pr.have)} / ${fmtN(pr.need)}</b>${a.counter ? '<span>so far</span>' : ''}</p>`;
}

/** the day you earned it, and the kill count it came at (kept from save v10 on; none before your first kill) */
export function earnedHtml(p: Profile, a: AchievementDef): string {
  const e = p.achievements[a.id];
  return e ? `<p class="ac-when">${GLYPH.check}Earned ${esc(fmtDate(e.at))}${e.kc ? ` · at KC ${fmtN(e.kc)}` : ''}</p>` : '';
}

/** Everything it gives but the points, each with its picture, its name, its kind and where it went, and its
 *  button: Wear it for a title once it's yours (on the hero you play), and on the card See it for a thing,
 *  Put it up for a house look and Make one for a new kind of hero. */
export function rewardsHtml(p: Profile, a: AchievementDef, card: boolean, earned = !!p.achievements[a.id]): string {
  const h = activeHero(p);
  const rows = rewardsOf(p, a).filter((r) => r.kind !== 'points').map((r) => {
    let btn = '';
    if (earned && r.kind === 'title' && h) btn = h.title === r.id ? `<span class="ac-on">${GLYPH.check}Wearing</span>` : `<button type="button" class="btn small gold" data-act="wear" data-id="${esc(r.id)}">Wear it</button>`;
    else if (card && earned && r.kind === 'look') btn = '<button type="button" class="btn small" data-act="putlook">Put it up</button>';
    else if (card && earned && r.kind === 'race') btn = `<button type="button" class="btn small gold" data-act="makerace" data-race="${esc(r.id)}">Make one</button>`;
    else if (card && COLLECTIBLES[r.id]) btn = `<button type="button" class="btn small" data-act="item" data-id="${esc(r.id)}">See it</button>`;
    return `<li class="ac-rw"><span class="ac-pic" aria-hidden="true">${pic(a, r)}</span><span class="ac-what"><b>${esc(r.name)}</b><small>${esc(REWARD_WORD[r.kind])} · ${esc(r.where)}</small></span>${btn}</li>`;
  }).join('');
  return rows ? `<ul class="ac-rws">${rows}</ul>` : '';
}
function pic(a: AchievementDef, r: RewardLine): string {
  if (r.kind === 'title') return `<span class="tile ac-ttl">${GLYPH.pen}</span>`;
  if (r.kind === 'look') return `<span class="tile lk-sw">${SWATCH[r.id] || ''}</span>`;
  if (r.kind === 'race') return `<span class="tile">${tile(mainReward(a)?.icon || '')}</span>`;
  return `<span class="tile">${iconOf(r.id)}</span>`;
}

/** An achievement on the page or in the chest: its medal, name and how, your progress or when you earned it,
 *  and what it gives with where it went. Tapping it opens its card. A hidden one you haven't earned is ???.
 *  `earned` shows it as yours (the chest's preview, which adds nothing to the save). */
export function achRow(p: Profile, a: AchievementDef, earned = !!p.achievements[a.id]): string {
  const secret = !earned && a.tier === 'hidden';
  return `<article class="ach ac-row ${earned ? 'done' : 'locked'}">
    <button type="button" class="ac-hit" data-act="ach" data-id="${esc(a.id)}" aria-label="${esc(secret ? 'A hidden achievement' : a.name)}: more about it"></button>
    <span class="medal ${a.tier}" aria-hidden="true">${earned ? '✓' : a.points}</span>
    <div class="ac-tx"><div class="n">${secret ? '???' : esc(a.name)}</div>
      <p class="h">${secret ? 'Hidden. You’ll know it when it happens.' : esc(a.how)}</p></div>
    <div class="pts">${a.points}<small>points</small></div>
    <div class="ac-more">${secret ? '' : (earned ? '' : progressHtml(p, a)) + rewardsHtml(p, a, false, earned)}${earnedHtml(p, a)}</div></article>`;
}

/** The closer look at one achievement, over the Logs sheet: its medal big, its tier, points and where it's
 *  earned, what to do, your progress or when you earned it (with the kill count it came at), and everything
 *  it gives, each with where it went and its button. */
export function achCard(p: Profile, id: string): string {
  const a = ACHIEVEMENTS[id];
  if (!a) return '';
  const done = !!p.achievements[a.id], secret = secretOf(p, a);
  const name = secret ? 'A hidden achievement' : a.name;
  return `<div class="pk-wrap" data-act="achclose"><div class="pk-box" data-act="peekin" style="--rc: ${TIER_COL[a.tier]}">
    <button type="button" class="icon-btn pk-x" data-act="achclose" aria-label="Close">${GLYPH.close}</button>
    <section class="pk ac-card ${done ? 'got' : 'miss'}" role="dialog" aria-modal="true" aria-label="${esc(name)}">
      <div class="ac-top"><span class="medal ${a.tier}" aria-hidden="true">${done ? '✓' : a.points}</span>
        <div class="pk-id"><p class="pk-kind">${esc(TIER_WORD[a.tier])} · ${a.points} points · ${esc(placeName(a.dungeon) || '')}</p><h3>${secret ? '???' : esc(a.name)}</h3>
          ${done ? earnedHtml(p, a) : '<p class="ac-when no">Not yet</p>'}</div></div>
      <div class="ac-sec"><h4>${done ? 'What you did' : 'What to do'}</h4><p class="ac-how">${secret ? 'It’s hidden. You’ll know it when it happens.' : esc(a.how)}</p>${secret ? '' : progressHtml(p, a)}</div>
      ${secret ? '' : `<div class="ac-sec"><h4>${done ? 'What you got' : 'What it gives'}</h4>${rewardsHtml(p, a, true)}<p class="ac-pts"><span class="medal ${a.tier}" aria-hidden="true">${a.points}</span>${a.points} achievement points</p></div>`}
    </section></div></div>`;
}

/** the achievements a harvest or a brew just earned, as chips that open their cards */
export function achChips(p: Profile, ids: string[]): string {
  return ids.length ? `<div class="vc-ach">${ids.filter((id) => ACHIEVEMENTS[id]).map((id) => `<button type="button" class="chip ac-chip" data-act="ach" data-id="${esc(id)}">Achievement <b>${esc(ACHIEVEMENTS[id].name)}</b><span>${esc(gotLine(p, ACHIEVEMENTS[id]))}</span></button>`).join('')}</div>` : '';
}
