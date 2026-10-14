/**
 * Making a hero: pick a race and a class, name them, and they are yours for good. A combo can be
 * made once it has a kit and art; the rest are shown so you can see what is coming. Dwarves, elves and
 * humans are there from the start; the other races are earned, each in its own dungeon (the Risen from
 * the Barrow's collection log), and show how close you are. The first time you play, this is the first
 * thing you see.
 */
import { DUNGEONS } from '../content';
import { CLASSES, CLASS_ORDER, MAX_HEROES, RACES, RACE_ORDER, canMake, heroArt, type ClassId, type RaceId } from '../content/folk';
import { ROLES } from '../content/roles';
import type { RoleId } from '../content/types';
import { newHero } from '../meta/gear';
import { openProgress, opened, unlockOf } from '../meta/logs';
import { nameProblem, setActive } from '../meta/profile';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { heroImg } from './art';
import { SFX } from './sound';


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

  /** a race you can make now: drawn, and earned if it has to be (or the testing switch is on) */
  private open_(r: RaceId): boolean { return this.app.dev.allOpen || opened(this.app.p, 'race', r); }
  /** the races you can make a class as */
  private racesFor(cls: ClassId): RaceId[] { return RACE_ORDER.filter((r) => canMake(r, cls) && this.open_(r)); }
  /** the classes a race can be today */
  private classesFor(race: RaceId): ClassId[] { return CLASS_ORDER.filter((c) => canMake(race, c)); }

  /** open the maker; `first` means there are no heroes yet, so there is no going back. A role (from a
   *  seat in the dungeon picker) starts on a class for that seat; a race (the Risen, just earned) on it. */
  open(first: boolean, role?: RoleId, race?: RaceId): void {
    this.first = first;
    this.err = '';
    this.forSeat = !!role;
    const c = role ? CLASS_ORDER.find((x) => CLASSES[x].role === role && this.racesFor(x).length) : undefined;
    if (c) { this.cls = c; this.race = this.racesFor(c)[0]; this.typed = false; this.name = ''; }
    if (race && RACES[race]) { this.race = race; if (!canMake(race, this.cls)) this.cls = this.classesFor(race)[0] || this.cls; this.typed = false; this.name = ''; }
    if (!this.typed || !this.name) this.name = this.roll();
    this.render();
  }

  private pickRace(r: RaceId): void {
    if (!RACES[r]) return;
    this.race = r;
    // keep the class if this race can be it, otherwise the first class it can be
    if (!canMake(r, this.cls)) { const c = this.classesFor(r)[0]; if (c) this.cls = c; }
    if (!this.typed) this.name = this.roll();
    SFX.play('ui');
    this.render();
  }
  private pickClass(c: ClassId): void {
    if (!CLASSES[c]) return;
    this.cls = c;
    // a class only some races are drawn as: switch to one of them
    if (!canMake(this.race, c)) { const r = this.racesFor(c)[0]; if (r) { this.race = r; if (!this.typed) this.name = this.roll(); } }
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

  /** where a race is earned: the dungeon whose log gives it, if there is one yet */
  private earnedIn(r: RaceId): string | null {
    const log = unlockOf('race', r)?.log;
    return log && DUNGEONS[log] ? DUNGEONS[log].name : null;
  }

  private why(): string | null {
    if (this.app.p.roster.length >= MAX_HEROES) return `You have ${MAX_HEROES} heroes. Let one go in the bunk room to make another.`;
    const R = RACES[this.race];
    if (R.earned && !this.earnedIn(this.race)) return `${R.plural} will be earned in a dungeon of their own.`;
    if (!CLASSES[this.cls].ready) return `${CLASSES[this.cls].name}s are coming in the classes pass.`;
    if (!canMake(this.race, this.cls)) return this.classesFor(this.race).length ? `${RACES[this.race].name} ${CLASSES[this.cls].name.toLowerCase()}s aren’t drawn yet.` : `${RACES[this.race].plural} arrive in the races pass.`;
    if (!this.open_(this.race)) { const pr = openProgress(this.app.p, 'race', this.race); return `The ${R.plural} come from filling ${this.earnedIn(this.race)}’s collection log (${pr.have}/${pr.need}).`; }
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
    const h = newHero(p, { name: this.name, race: this.race, cls: this.cls, free: this.app.dev.allOpen });
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
    const earned = this.open_(this.race);
    const ok = canMake(this.race, this.cls) && earned;
    const art = heroArt(this.race, this.cls) || (this.racesFor(this.cls).length ? heroArt(this.racesFor(this.cls)[0], this.cls) : null) || ROLES[C.role].sprite;
    const chip = (r: RaceId): string => {
      const x = RACES[r], can = this.classesFor(r).length > 0, pr = openProgress(this.app.p, 'race', r), mine = this.open_(r);
      // a race you earn shows how close you are, then that it's yours
      const tag = !can || (x.earned && !this.earnedIn(r)) ? 'Soon' : pr.need ? (mine ? 'Earned' : `Log ${pr.have}/${pr.need}`) : '';
      return `<button type="button" class="cr-chip${x.earned ? ' earned' : ''}${x.earned && !mine ? ' locked' : ''}" data-act="race" data-v="${r}" aria-pressed="${r === this.race}" style="--c: ${x.light}">
        <i class="sw" aria-hidden="true"></i><b>${esc(x.name)}</b><span>${esc(x.hometown)}</span>${tag ? `<em>${esc(tag)}</em>` : ''}</button>`;
    };
    const raceChips = `<div class="cr-chips">${RACE_ORDER.filter((r) => !RACES[r].earned).map(chip).join('')}</div>
      <h4 class="cr-sub">Earned in dungeons</h4><div class="cr-chips earned">${RACE_ORDER.filter((r) => RACES[r].earned).map(chip).join('')}</div>`;
    const classChips = CLASS_ORDER.map((c) => {
      const x = CLASSES[c];
      const who = this.racesFor(c);
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
        <section class="cr-col cr-races" aria-label="Race"><h3>Race</h3>${raceChips}</section>
        <div class="cr-model ${ok ? '' : 'shadow'}">
          <span class="cr-light" aria-hidden="true"></span>
          <div class="cr-fig">${heroImg(art, { cls: 'cr-img', alt: ok ? `${R.name} ${C.name}` : '' })}<span class="cr-floor" aria-hidden="true"></span></div>
          ${ok ? '' : `<p class="cr-soon">${R.earned && !earned ? (this.earnedIn(this.race) ? `Earned in ${esc(this.earnedIn(this.race))}` : 'Earned in a dungeon to come') : 'Not drawn yet'}</p>`}
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
