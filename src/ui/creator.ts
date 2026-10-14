/**
 * Making a hero: pick a race and a class, name them, and they are yours for good. A combo can be
 * made once it has a kit and art; the rest are shown so you can see what is coming. The first time
 * you play, this is the first thing you see.
 */
import { CLASSES, CLASS_ORDER, MAX_HEROES, RACES, RACE_ORDER, canMake, heroArt, type ClassId, type RaceId } from '../content/folk';
import { ROLES } from '../content/roles';
import type { RoleId } from '../content/types';
import { newHero } from '../meta/gear';
import { nameProblem, setActive } from '../meta/profile';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { heroImg } from './art';
import { SFX } from './sound';

/** the races that have art for a class */
const racesFor = (cls: ClassId): RaceId[] => RACE_ORDER.filter((r) => canMake(r, cls));
/** the classes a race can be today */
const classesFor = (race: RaceId): ClassId[] => CLASS_ORDER.filter((c) => canMake(race, c));

export class Creator {
  private race: RaceId = 'dwarf';
  private cls: ClassId = 'warrior';
  private name = '';
  private typed = false;
  private err = '';
  private first = false;
  /** made from a seat in the dungeon picker: go back to it after */
  private forSeat = false;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      back: () => { SFX.play('ui'); app.showHearth('bunks'); },
      race: (el) => this.pickRace(el.dataset.v as RaceId),
      cls: (el) => this.pickClass(el.dataset.v as ClassId),
      dice: () => { this.name = this.roll(); this.typed = false; this.err = ''; SFX.play('ui'); this.render(); },
    });
    root.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.id !== 'cr-name') return;
      this.name = t.value; this.typed = true; this.err = '';
      this.syncGo();
    });
    root.addEventListener('submit', (e) => { e.preventDefault(); this.create(); });
  }

  /** open the maker; `first` means there are no heroes yet, so there is no going back. A role (from a
   *  seat in the dungeon picker) starts on a class for that seat. */
  open(first: boolean, role?: RoleId): void {
    this.first = first;
    this.err = '';
    this.forSeat = !!role;
    const c = role ? CLASS_ORDER.find((x) => CLASSES[x].role === role && racesFor(x).length) : undefined;
    if (c) { this.cls = c; this.race = racesFor(c)[0]; this.typed = false; this.name = ''; }
    if (!this.typed || !this.name) this.name = this.roll();
    this.render();
  }

  private pickRace(r: RaceId): void {
    if (!RACES[r]) return;
    this.race = r;
    // keep the class if this race can be it, otherwise the first class it can be
    if (!canMake(r, this.cls)) { const c = classesFor(r)[0]; if (c) this.cls = c; }
    if (!this.typed) this.name = this.roll();
    SFX.play('ui');
    this.render();
  }
  private pickClass(c: ClassId): void {
    if (!CLASSES[c]) return;
    this.cls = c;
    // a class only some races are drawn as: switch to one of them
    if (!canMake(this.race, c)) { const r = racesFor(c)[0]; if (r) { this.race = r; if (!this.typed) this.name = this.roll(); } }
    SFX.play('ui');
    this.render();
  }

  private roll(): string {
    const R = RACES[this.race];
    for (let i = 0; i < 30; i++) {
      const n = `${R.first[Math.floor(Math.random() * R.first.length)]} ${R.family[Math.floor(Math.random() * R.family.length)]}`;
      if (n.length <= 24 && !nameProblem(this.app.p, n)) return n;
    }
    return R.first[0];
  }

  private why(): string | null {
    if (this.app.p.roster.length >= MAX_HEROES) return `You have ${MAX_HEROES} heroes. Let one go in the bunk room to make another.`;
    if (!CLASSES[this.cls].ready) return `${CLASSES[this.cls].name}s are coming in the classes pass.`;
    if (!canMake(this.race, this.cls)) return classesFor(this.race).length ? `${RACES[this.race].name} ${CLASSES[this.cls].name.toLowerCase()}s aren’t drawn yet.` : `${RACES[this.race].plural} arrive in the races pass.`;
    return nameProblem(this.app.p, this.name);
  }
  private syncGo(): void {
    const go = this.root.querySelector<HTMLButtonElement>('#cr-go');
    const note = this.root.querySelector<HTMLElement>('#cr-note');
    const why = this.why();
    if (go) { go.disabled = !!why; go.textContent = `Make ${this.name.trim().split(' ')[0] || 'hero'}`; }
    if (note) { note.textContent = this.err || (this.name.trim() ? why || '' : 'Name your hero'); note.classList.toggle('err', !!this.err); }
  }

  private create(): void {
    const p = this.app.p;
    const why = this.why();
    if (why) { this.err = why; SFX.play('nope'); this.syncGo(); return; }
    const h = newHero(p, { name: this.name, race: this.race, cls: this.cls });
    if (!h) { this.err = 'That hero could not be made'; SFX.play('nope'); this.syncGo(); return; }
    setActive(p, h.id);
    // saving redraws the maker, so note now where to go after
    const toDungeons = this.forSeat;
    this.typed = false; this.name = ''; this.forSeat = false;
    SFX.play('place');
    this.app.save();
    this.app.toasts.text(`${h.name} is ready`, `${RACES[this.race].name} ${CLASSES[this.cls].name} · ${CLASSES[this.cls].roleName}. Race and class are for keeps.`);
    this.app.showHearth();
    if (toDungeons) this.app.sheets.open({ kind: 'dungeon' });
  }

  render(): void {
    const R = RACES[this.race], C = CLASSES[this.cls];
    const ok = canMake(this.race, this.cls);
    const art = heroArt(this.race, this.cls) || (racesFor(this.cls).length ? heroArt(racesFor(this.cls)[0], this.cls) : null) || ROLES[C.role].sprite;
    const raceChips = RACE_ORDER.map((r) => {
      const x = RACES[r], can = classesFor(r).length > 0;
      return `<button type="button" class="cr-chip" data-act="race" data-v="${r}" aria-pressed="${r === this.race}" style="--c: ${x.light}">
        <i class="sw" aria-hidden="true"></i><b>${esc(x.name)}</b><span>${esc(x.hometown)}</span>${can ? '' : '<em>Soon</em>'}</button>`;
    }).join('');
    const classChips = CLASS_ORDER.map((c) => {
      const x = CLASSES[c];
      const who = racesFor(c);
      const tag = !x.ready ? 'Soon' : canMake(this.race, c) ? '' : who.length === 1 ? `${RACES[who[0]].name} only` : '';
      return `<button type="button" class="cr-chip" data-act="cls" data-v="${c}" aria-pressed="${c === this.cls}">
        <i class="rdot ${x.role}" aria-hidden="true"></i><b>${esc(x.name)}</b><span>${esc(x.roleName)}</span>${tag ? `<em>${esc(tag)}</em>` : ''}</button>`;
    }).join('');
    const why = this.why();
    this.root.className = 'scene create';
    this.root.style.setProperty('--light', R.light);
    this.root.innerHTML = `
      <div class="cr-top">
        ${this.first ? '<span></span>' : `<button type="button" class="btn small" data-act="back">${GLYPH.left}Back</button>`}
        <div class="cr-title"><h2>${this.first ? 'Make your hero' : 'New hero'}</h2><p>Race and class are for keeps. Up to ${MAX_HEROES} heroes.</p></div>
        <span></span>
      </div>
      <div class="cr-main">
        <section class="cr-col cr-races" aria-label="Race"><h3>Race</h3><div class="cr-chips">${raceChips}</div></section>
        <div class="cr-model ${ok ? '' : 'shadow'}">
          <span class="cr-light" aria-hidden="true"></span>
          <div class="cr-fig">${heroImg(art, { cls: 'cr-img', alt: ok ? `${R.name} ${C.name}` : '' })}<span class="cr-floor" aria-hidden="true"></span></div>
          ${ok ? '' : `<p class="cr-soon">Not drawn yet</p>`}
          <p class="cr-home">${esc(R.hometown)}</p>
        </div>
        <section class="cr-col cr-classes" aria-label="Class"><h3>Class</h3><div class="cr-chips">${classChips}</div></section>
        <section class="cr-lore">
          <div><h4>${esc(R.plural)} <small>${esc(R.hometown)} · ${esc(R.height)}</small></h4><p>${esc(R.lore)}</p><p class="look">${esc(R.look)}</p><p><b>${esc(R.trick.name)}.</b> ${esc(R.trick.desc)}</p></div>
          <div><h4>${esc(C.name)} <small><i class="rdot ${C.role}" aria-hidden="true"></i>${esc(C.roleName)}</small></h4><p>${esc(C.blurb)}</p>${C.ready ? '' : '<p class="look">Its kit is still being made.</p>'}</div>
        </section>
      </div>
      <form class="cr-foot" autocomplete="off">
        <label class="sr" for="cr-name">Name</label>
        <div class="cr-namebox"><input id="cr-name" maxlength="24" value="${esc(this.name)}" placeholder="Name" spellcheck="false" enterkeyhint="done"><button type="button" class="icon-btn" data-act="dice" aria-label="Roll a ${esc(R.name.toLowerCase())} name" title="Roll a name">${GLYPH.dice}</button></div>
        <button type="submit" class="btn gold big" id="cr-go" ${why ? 'disabled' : ''}>Make ${esc(this.name.split(' ')[0] || 'hero')}</button>
        <p class="cr-note ${this.err ? 'err' : ''}" id="cr-note" aria-live="polite">${esc(this.err || why || '')}</p>
      </form>`;
  }
}
