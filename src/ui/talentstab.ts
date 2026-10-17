/**
 * The armoury's Talents tab: your level and the points it gives (the same for every hero of yours), the hero's
 * two specs (pick one, free to switch: each keeps its own points) and the picked spec's tree, five rows that
 * open as points go in above them. Tap a talent to see it in the card at the bottom; tap it again, or Add a
 * point, to put a point in. Every point comes back out free, unless a row below needs it. The rules are
 * meta/talents.ts; what each talent does in a run is dungeon/specs.js.
 */
import { AB, MEND, abKey } from '../content/roles';
import { ROW_NEED, ROWS, TALENTS, TALENT_STATS, buttonFor, statLine } from '../content/talents';
import type { SpecDef, TalentDef, TalentStat } from '../content/types';
import { MAX_LEVEL } from '../content/xp';
import { addPoint, addProblem, canTakeBack, pickSpec, pointsAt, pointsOf, rankOf, resetSpec, rowOpen, specOf, specsOf, spentIn, takeBack, talentLoadout, unspent } from '../meta/talents';
import { levelProgress } from '../meta/xp';
import { heroById, type Hero, type Profile } from '../meta/profile';
import { esc, fmtN, GLYPH } from './dom';
import { tile } from './art';
import { SFX } from './sound';
import type { ArmouryHost, ArmouryView } from './armoury';
import type { SheetSpec } from './sheets';

type GearSpec = Extract<SheetSpec, { kind: 'gear' }>;

/** The talent the card shows: the one asked for if it's in the hero's spec, else the first a point can go in
 *  now, else the tree's first. */
export function pickedTalent(p: Profile, h: Hero, spec: SpecDef, id: string | undefined): TalentDef {
  return spec.talents.find((t) => t.id === id) || spec.talents.find((t) => !addProblem(p, h, spec, t)) || spec.talents[0];
}

/** the tab's buttons: a spec, a talent (a second tap puts a point in), add a point, take one back, take them all
 *  back (two taps) */
export function talentActions(x: ArmouryHost): Record<string, (el: HTMLElement) => void> {
  const cur = (): GearSpec | null => { const s = x.spec(); return s && s.kind === 'gear' ? s : null; };
  const hero = (): Hero | null => { const s = cur(); return s ? heroById(x.app.p, s.hero) : null; };
  const add = (id: string): void => {
    const s = cur(), h = hero(), spec = h ? specOf(h) : null;
    if (!s || !h || !spec) return;
    if (!addPoint(x.app.p, h, spec.id, id)) { SFX.play('nope'); return; }
    x.view.justTal = { id, at: performance.now() };
    SFX.play(TALENTS[id]?.def.capstone ? 'capstone' : 'talent');
    // the open tab stays on the talent the point went in, so the next tap adds another
    x.open({ ...s, node: id });
    x.app.save();
  };
  return {
    tspec: (el) => {
      const s = cur(), h = hero();
      if (!s || !h || !el.dataset.spec) return;
      if (!pickSpec(h, el.dataset.spec)) { SFX.play('ui'); return; }
      SFX.play('talent');
      x.open({ ...s, node: undefined });
      x.app.save();
    },
    tnode: (el) => {
      const s = cur(), id = el.dataset.id;
      if (!s || !id) return;
      if (s.node === id) { add(id); return; }
      SFX.play('ui');
      x.open({ ...s, node: id });
    },
    // the talent the card shows (the one tapped, or the first a point can go in)
    tadd: () => { const s = cur(), h = hero(), spec = h ? specOf(h) : null; if (s && h && spec) add(pickedTalent(x.app.p, h, spec, s.node).id); },
    tback: () => {
      const s = cur(), h = hero(), spec = h ? specOf(h) : null;
      const id = s && h && spec ? pickedTalent(x.app.p, h, spec, s.node).id : null;
      if (!s || !h || !spec || !id || !takeBack(h, spec.id, id)) { SFX.play('nope'); return; }
      SFX.play('ui');
      // the card stays on the talent the point came out of
      x.open({ ...s, node: id });
      x.app.save();
    },
    treset: () => {
      const s = cur(), h = hero(), spec = h ? specOf(h) : null;
      if (!s || !h || !spec) return;
      if (!x.view.tReset) {
        x.view.tReset = true; SFX.play('ui'); x.open(s);
        setTimeout(() => { if (!x.view.tReset) return; x.view.tReset = false; const now = cur(); if (now?.tab === 'talents') x.open(now); }, 4000);
        return;
      }
      x.view.tReset = false;
      if (resetSpec(h, spec.id)) { SFX.play('place'); x.open({ ...s, node: undefined }); x.app.save(); }
    },
  };
}

/** the tab: the level, the specs, the tree, what it all adds up to; the picked talent's card goes in the foot */
export function talentsTab(p: Profile, h: Hero, node: string | undefined, view: ArmouryView): { body: string; foot: string } {
  const spec = specOf(h);
  if (!spec) return { body: `<div class="tn">${levelLine(p, h)}${pickSpecs(h)}</div>`, foot: '' };
  const t = pickedTalent(p, h, spec, node);
  const body = `<div class="tn" style="--sc: ${spec.color}">${levelLine(p, h)}${specRow(h, spec)}
    ${spec.base ? `<p class="tn-base">${esc(spec.base)}</p>` : ''}${tree(p, h, spec, t, view)}${sums(h, spec)}${resetRow(h, spec, view)}</div>`;
  return { body, foot: card(p, h, spec, t) };
}

/** your level, how far into it, the points it gives and how many this hero has left to spend */
function levelLine(p: Profile, h: Hero): string {
  const pr = levelProgress(p.xp), pts = pointsOf(p), left = unspent(p, h);
  const next = pr.level >= MAX_LEVEL ? 'The top level' : `${fmtN(pr.into)} / ${fmtN(pr.need)} XP to level ${pr.level + 1}`;
  return `<div class="tn-lv">
    <span class="tn-lvn"><small>Level</small><b>${pr.level}</b></span>
    <span class="tn-lvx"><span class="tn-bar" aria-hidden="true"><i style="width: ${(pr.k * 100).toFixed(1)}%"></i></span><small>${next}</small></span>
    <span class="tn-pts${left ? ' on' : ''}"><b>${left}</b><small>${pts ? 'to spend' : 'points'}</small></span></div>`;
}

/** no spec yet: the two, big, each with what it's like */
function pickSpecs(h: Hero): string {
  return `<h3 class="section-title">Pick a spec<small>switch any time, free</small></h3>
    <div class="tn-picks">${specsOf(h).map((s) => `<button type="button" class="tn-big" data-act="tspec" data-spec="${s.id}" style="--sc: ${s.color}">
      <span class="tile">${tile(s.icon)}</span><span class="tn-bx"><b>${esc(s.name)}</b><small>${esc(s.pitch)}</small>${s.base ? `<em>${esc(s.base)}</em>` : ''}</span></button>`).join('')}</div>
    <p class="fine">Each spec has its own tree and keeps its own points, so switching back costs nothing.</p>`;
}

/** the hero's spec and its other one, small, each with the points in it; then what the picked one is like */
function specRow(h: Hero, spec: SpecDef): string {
  const cards = specsOf(h).map((s) => {
    const on = s.id === spec.id, n = spentIn(h, s);
    return `<button type="button" class="tn-spec" role="radio" aria-checked="${on}" data-act="tspec" data-spec="${s.id}" style="--sc: ${s.color}">
      <span class="tile">${tile(s.icon)}</span><span class="tn-sx"><b>${esc(s.name)}</b><small>${on ? `${n} point${n === 1 ? '' : 's'} in` : `Switch · ${n} in`}</small></span></button>`;
  }).join('');
  return `<div class="tn-specs" role="radiogroup" aria-label="Spec">${cards}</div><p class="tn-pitch">${esc(spec.pitch)}</p>`;
}

/** the tree: five rows, each opening once enough points are in the rows above (its gate says how many) */
function tree(p: Profile, h: Hero, spec: SpecDef, picked: TalentDef, view: ArmouryView): string {
  const j = view.justTal && performance.now() - view.justTal.at < 700 ? view.justTal.id : null;
  const rows = ROWS.map((row) => {
    const open = rowOpen(h, spec, row), ts = spec.talents.filter((t) => t.row === row);
    const nodes = ts.map((t, i) => {
      const or = t.choice && ts[i + 1]?.choice === t.choice ? '<i class="tn-or" aria-hidden="true">or</i>' : '';
      return node(p, h, spec, t, t === picked, t.id === j) + or;
    }).join('');
    const need = ROW_NEED[row];
    const gate = open ? `<b>${row}</b>` : `${GLYPH.lock}<small>${need}</small>`;
    return `<div class="tn-row${open ? '' : ' shut'}"><span class="tn-gate" title="${open ? `Row ${row}` : `Opens with ${need} points in the rows above`}">${gate}</span><div class="tn-ns">${nodes}</div></div>`;
  }).join('');
  return `<div class="tn-tree" role="group" aria-label="${esc(spec.name)} tree">${rows}</div>`;
}

/** one talent: its picture with its points (a tick when full), its name, and how it stands */
function node(p: Profile, h: Hero, spec: SpecDef, t: TalentDef, on: boolean, just: boolean): string {
  const n = rankOf(h, spec, t.id), why = addProblem(p, h, spec, t);
  const gone = why === 'You took the other one', shut = !rowOpen(h, spec, t.row);
  const cls = [n >= t.ranks ? 'full' : n ? 'some' : '', !why ? 'can' : '', shut ? 'shut' : '', gone ? 'gone' : '', t.capstone ? 'cap' : '', just ? 'just' : ''].filter(Boolean).join(' ');
  const chip = n >= t.ranks && t.ranks === 1 ? `<i class="tn-r ok">${GLYPH.check}</i>` : `<i class="tn-r">${n}/${t.ranks}</i>`;
  return `<button type="button" class="tn-n ${cls}" data-act="tnode" data-id="${esc(t.id)}" aria-pressed="${on}" aria-label="${esc(t.name)}, ${n} of ${t.ranks}${shut ? ', not open yet' : gone ? ', you took the other one' : ''}${on && !why ? '. Tap again to add a point' : ''}">
    <span class="tn-t"><span class="tile">${tile(t.icon)}</span>${chip}${just ? '<span class="sl-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' : ''}</span><b>${esc(t.name)}</b></button>`;
}

/** what the spec's points add up to: each stat's total, and the talents that change a button */
function sums(h: Hero, spec: SpecDef): string {
  const stats: Partial<Record<TalentStat, number>> = {}, took: string[] = [];
  for (const t of spec.talents) {
    const n = rankOf(h, spec, t.id);
    if (!n) continue;
    if (t.stat) stats[t.stat] = (stats[t.stat] || 0) + n;
    else took.push(t.name);
  }
  const lines = (Object.entries(stats) as [TalentStat, number][]).map(([s, n]) => statLine(s, n));
  if (!lines.length && !took.length) return '';
  return `<div class="tn-sum"><b>${esc(h.name.split(' ')[0])}’s ${esc(spec.name)}</b><span>${[...lines, ...took].map(esc).join(' · ')}</span></div>`;
}

/** what a hero's talents add, in words, as a run gets them: each stat's total ("+5% damage") */
export function talentLines(p: Profile, h: Hero): string[] {
  const ts = talentLoadout(p, h).ts;
  return (Object.entries(ts) as [TalentStat, number][]).map(([s, k]) => statLine(s, Math.round(k / TALENT_STATS[s].per)));
}

/** taking every point back out of the tree: two taps, and free */
function resetRow(h: Hero, spec: SpecDef, view: ArmouryView): string {
  const n = spentIn(h, spec);
  if (!n) return '';
  return `<div class="actions"><button type="button" class="btn small${view.tReset ? ' danger' : ''}" data-act="treset">${view.tReset ? `Tap again: all ${n} back` : `Take all ${n} points back`}</button></div>`;
}

/** the picked talent: what it does, its points, and the buttons to add one or take one back */
function card(p: Profile, h: Hero, spec: SpecDef, t: TalentDef): string {
  const n = rankOf(h, spec, t.id), why = addProblem(p, h, spec, t), back = canTakeBack(h, spec, t.id);
  const ak = abKey(h);
  const what = t.stat ? `${n ? `Now ${statLine(t.stat, n)}` : 'None in yet'}${t.ranks > 1 && n < t.ranks ? ` · all ${t.ranks}: ${statLine(t.stat, t.ranks)}` : ''}`
    : t.slot === 'mend' ? `Changes Mend (${MEND.heal} healing)` : t.slot ? `Changes ${buttonFor(AB[ak][t.slot], spec.id, t.slot).name}` : '';
  const pair = t.choice ? spec.talents.find((x) => x !== t && x.choice === t.choice) : undefined;
  const tag = t.capstone ? 'The top of the tree' : pair ? `Or ${pair.name}: one of the two` : `Row ${t.row}`;
  const left = unspent(p, h);
  const whyText = why === 'No points left' ? (pointsOf(p) >= pointsAt(MAX_LEVEL) ? 'Every point is in' : `No points left · more at level ${levelProgress(p.xp).level + 1}`) : why;
  return `<div class="tn-card${t.capstone ? ' cap' : ''}" style="--sc: ${spec.color}">
      <span class="tile">${tile(t.icon)}</span>
      <div class="tn-cx"><p class="tn-ch"><b>${esc(t.name)}</b><i>${n}/${t.ranks}</i></p><p class="tn-cd">${esc(t.desc)}</p><small>${esc(tag)}${what ? ` · ${esc(what)}` : ''}</small></div></div>
    <div class="tn-acts">
      <button type="button" class="btn icon-only tn-back" data-act="tback"${back ? '' : ' disabled'} aria-label="Take a point back" title="Take a point back">−</button>
      ${why ? `<p class="tn-why">${why === 'Full' ? GLYPH.check : GLYPH.lock}<span>${esc(whyText || '')}</span></p>`
        : `<button type="button" class="btn gold tn-add${left ? ' now' : ''}" data-act="tadd">${GLYPH.plus}Add a point<small>${left} left</small></button>`}
    </div>`;
}
