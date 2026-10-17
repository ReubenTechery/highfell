/**
 * Making a hero: pick a race and a class, name them, and they are yours for good. A combo can be
 * made once it has a kit and art; the rest are shown so you can see what is coming. Dwarves, elves and
 * humans are there from the start; the other races are earned, each in its own dungeon (the Risen from
 * the Barrow's collection log), and show how close you are. The first time you play, this is the first
 * thing you see.
 */
import { DUNGEONS } from '../content';
import { CLASSES, CLASS_ORDER, MAX_HEROES, RACES, RACE_ORDER, canMake, defaultSex, heroArt, type ClassId, type RaceId, type SexId } from '../content/folk';
import { AB, abKey } from '../content/roles';
import type { RoleId } from '../content/types';
import { newHero } from '../meta/gear';
import { grantTrialStarter } from '../meta/loot';
import { openProgress, opened, unlockOf } from '../meta/logs';
import { finishIntroRun, nameProblem, needsIntroRun, setActive, startHearthTour } from '../meta/profile';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { heroImg, heroSprite, tile } from './art';
import { SFX } from './sound';
import { warbandOpen, warbandWhy } from '../meta/warband';


export class Creator {
  private race: RaceId = 'dwarf';
  private cls: ClassId = 'warrior';
  private sex: SexId = 'm';
  private showLore = false;
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
      sex: (el) => this.pickSex(el.dataset.v as SexId),
      lore: () => { this.showLore = !this.showLore; SFX.play('ui'); this.render(); },
      dice: () => { this.name = this.roll(); this.typed = false; this.err = ''; SFX.play('ui'); this.render(); },
      devopen: () => { this.app.setDev({ allOpen: true }); this.err = ''; SFX.play('equip'); this.render(); },
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
    this.showLore = false;
    this.forSeat = !!role;
    const c = role ? CLASS_ORDER.find((x) => CLASSES[x].role === role && this.racesFor(x).length) : undefined;
    if (c) { this.cls = c; this.race = this.racesFor(c)[0]; this.sex = defaultSex(this.race, this.cls); this.typed = false; this.name = ''; }
    if (race && RACES[race]) { this.race = race; if (!canMake(race, this.cls)) this.cls = this.classesFor(race)[0] || this.cls; this.sex = defaultSex(this.race, this.cls); this.typed = false; this.name = ''; }
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
  private pickSex(s: SexId): void {
    if (s !== 'm' && s !== 'f') return;
    this.sex = s;
    if (!this.typed) this.name = this.roll();
    SFX.play('ui');
    this.render();
  }

  private roll(): string {
    const R = RACES[this.race];
    const pool = R.firstBySex?.[this.sex] || R.first;
    for (let i = 0; i < 30; i++) {
      const n = `${pool[Math.floor(Math.random() * pool.length)]} ${R.family[Math.floor(Math.random() * R.family.length)]}`;
      if (n.length <= 24 && !nameProblem(this.app.p, n)) return n;
    }
    return pool[0];
  }

  /** where a race is earned: the dungeon whose log gives it, if there is one yet */
  private earnedIn(r: RaceId): string | null {
    const log = unlockOf('race', r)?.log;
    return log && DUNGEONS[log] ? DUNGEONS[log].name : null;
  }

  private why(): string | null {
    if (this.app.p.roster.length >= MAX_HEROES) return `You have ${MAX_HEROES} heroes. Let one go in the bunk room to make another.`;
    if (this.app.p.roster.length && !warbandOpen(this.app.p) && !this.app.dev.allOpen) return warbandWhy(this.app.p);
    const R = RACES[this.race];
    if (!CLASSES[this.cls].ready) return `${CLASSES[this.cls].name}s are coming in the classes pass.`;
    if (!canMake(this.race, this.cls)) return this.classesFor(this.race).length ? `${RACES[this.race].name} ${CLASSES[this.cls].name.toLowerCase()}s aren’t drawn yet.` : `${RACES[this.race].plural} arrive in the races pass.`;
    if (!this.open_(this.race)) {
      if (!this.earnedIn(this.race)) return `${R.plural} will be earned in a dungeon of their own.`;
      const pr = openProgress(this.app.p, 'race', this.race);
      return `The ${R.plural} come from filling ${this.earnedIn(this.race)}’s collection log (${pr.have}/${pr.need}).`;
    }
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
    const first = p.roster.length === 0;
    const runTrial = first && needsIntroRun(p);
    const h = newHero(p, { name: this.name, race: this.race, cls: this.cls, sex: this.sex, free: this.app.dev.allOpen });
    if (!h) { this.err = 'That hero could not be made'; SFX.play('nope'); this.syncGo(); return; }
    setActive(p, h.id);
    // the first hero gets the Crypt Trial's chest now, so quitting or skipping the trial loses nothing
    if (first) { grantTrialStarter(p, h); startHearthTour(p); }
    // saving redraws the maker, so note now where to go after
    const toDungeons = this.forSeat;
    this.typed = false; this.name = ''; this.forSeat = false;
    SFX.play('place');
    if (runTrial) {
      this.app.save();
      this.app.startIntro();
      return;
    }
    finishIntroRun(p);
    this.app.save();
    this.app.toasts.text(`${h.name} is ready`, `${RACES[this.race].name} ${CLASSES[this.cls].name} · ${CLASSES[this.cls].roleName}. Race and class are for keeps.`);
    this.app.showHearth();
    if (toDungeons) this.app.sheets.open({ kind: 'dungeon' });
  }

  render(): void {
    const R = RACES[this.race], C = CLASSES[this.cls];
    const earned = this.open_(this.race);
    const drawn = canMake(this.race, this.cls);
    const ok = drawn && earned;
    const fallbackRace = this.racesFor(this.cls)[0];
    const art = heroSprite({ race: drawn ? this.race : (fallbackRace || this.race), cls: this.cls, sex: this.sex, regular: this.app.p.warband[C.role] }, C.role, this.app.p);

    const raceMedallion = (r: RaceId): string => {
      const x = RACES[r], can = this.classesFor(r).length > 0, pr = openProgress(this.app.p, 'race', r), mine = this.open_(r);
      const locked = !can || (x.earned && !mine);
      const badge = locked
        ? `<i class="cr-lock" aria-hidden="true">${GLYPH.lock}</i>${pr.need ? `<em class="cr-prog">${pr.have}/${pr.need}</em>` : ''}`
        : x.earned && mine ? `<i class="cr-open" aria-hidden="true">${GLYPH.check}</i>` : '';
      return `<button type="button" class="cr-med${x.earned ? ' earned' : ''}${locked ? ' locked' : ''}" data-act="race" data-v="${r}" aria-pressed="${r === this.race}" style="--c: ${x.light}">
        <span class="cr-med-ring"><span class="cr-med-art">${tile(x.icon)}</span>${badge}</span>
        <b>${esc(x.name)}</b></button>`;
    };

    const classCrest = (c: ClassId): string => {
      const x = CLASSES[c];
      const can = x.ready && canMake(this.race, c);
      const starter = RACE_ORDER.find((r) => !RACES[r].earned && canMake(r, c)) || this.racesFor(c)[0];
      const only = !x.ready ? 'Soon' : !can && starter ? `${RACES[starter].name} only` : '';
      const clsState = !x.ready ? ' locked' : !can ? ' unavail' : '';
      return `<button type="button" class="cr-crest ${x.role}${clsState}" data-act="cls" data-v="${c}" aria-pressed="${c === this.cls}">
        <span class="cr-crest-tile"><span class="cr-crest-art">${tile(x.icon)}</span>${!can ? `<i class="cr-lock" aria-hidden="true">${GLYPH.lock}</i>` : `<i class="rdot ${x.role}" aria-hidden="true"></i>`}</span>
        <b>${esc(x.name)}</b>
        ${only ? `<em class="cr-only">${esc(only)}</em>` : `<span>${esc(x.roleName)}</span>`}</button>`;
    };

    const dng = this.earnedIn(this.race);
    const pr = openProgress(this.app.p, 'race', this.race);
    const pct = pr.need ? Math.round((pr.have / pr.need) * 100) : 0;
    const unlockCard = ok ? '' : R.earned && !earned
      ? dng
        ? `<div class="cr-unlock">
            <div class="cr-unlock-head"><i class="cr-unlock-ic">${GLYPH.lock}</i><div><b>Locked · ${esc(dng)}</b><span>Complete the collection log to awaken the ${esc(R.plural)}</span></div></div>
            <div class="cr-bar"><i style="width:${pct}%"></i><span>${pr.have} / ${pr.need} log slots</span></div>
          </div>`
        : `<div class="cr-unlock"><div class="cr-unlock-head"><i class="cr-unlock-ic">${GLYPH.lock}</i><div><b>Locked · Future Dungeon</b><span>${esc(R.plural)} are earned in a dungeon to come</span></div><button type="button" class="btn small" data-act="devopen">Unlock</button></div></div>`
      : `<div class="cr-unlock"><div class="cr-unlock-head"><i class="cr-unlock-ic">${GLYPH.lock}</i><div><b>Coming Soon</b><span>${esc(R.name)} ${esc(C.name.toLowerCase())}s are still on the drawing board</span></div></div></div>`;

    const sigs = C.signature.map((slot) => {
      const ab = AB[abKey({ role: C.role, cls: this.cls })][slot];
      const shortDesc = ab.desc.split('.')[0] + '.';
      return `<div class="cr-ab"><span class="cr-ab-ic">${tile(ab.key)}</span><div class="cr-ab-tx"><b>${esc(ab.name)}</b><span>${esc(shortDesc)}</span></div></div>`;
    }).join('');

    const lorePopover = this.showLore ? `<div class="cr-lore-pop" role="dialog" aria-label="Lore">
      <div class="cr-lore-head"><b>${esc(R.plural)} of ${esc(R.hometown)}</b><button type="button" class="icon-btn small" data-act="lore" aria-label="Close lore">${GLYPH.close}</button></div>
      <p>${esc(R.lore)}</p>
      <p class="cr-trick"><b>${esc(R.trick.name)}:</b> ${esc(R.trick.desc)}</p>
    </div>` : '';

    const why = this.why();
    this.root.className = 'scene create';
    this.root.style.setProperty('--light', R.light);
    this.root.innerHTML = `
      <div class="cr-top">
        ${this.first ? '<span></span>' : `<button type="button" class="btn small" data-act="back">${GLYPH.left}Back</button>`}
        <div class="cr-title"><h2>${this.first ? 'Choose Your Hero' : 'New Hero'}</h2><p>${esc(R.hometown)} · ${this.app.p.roster.length}/${MAX_HEROES} heroes</p></div>
        <button type="button" class="icon-btn cr-lore-btn" data-act="lore" aria-pressed="${this.showLore}" aria-label="Hero lore" title="Lore">${GLYPH.book}</button>
      </div>
      <div class="cr-main">
        <div class="cr-model ${drawn ? '' : 'shadow'}">
          <span class="cr-rays" aria-hidden="true"></span>
          <span class="cr-light" aria-hidden="true"></span>
          <div class="cr-stage-top">
            <span class="cr-badge"><i class="rdot ${C.role}"></i><b>${esc(R.name)} ${esc(C.name)}</b> · ${esc(C.roleName)}</span>
            <div class="cr-sex" role="group" aria-label="Body style">
              <button type="button" class="cr-sex-btn" data-act="sex" data-v="m" aria-pressed="${this.sex === 'm'}" aria-label="Male" title="Male">${GLYPH.male}</button>
              <button type="button" class="cr-sex-btn" data-act="sex" data-v="f" aria-pressed="${this.sex === 'f'}" aria-label="Female" title="Female">${GLYPH.female}</button>
            </div>
          </div>
          <div class="cr-fig">${heroImg(art, { cls: 'cr-img', alt: drawn ? `${R.name} ${C.name}` : '' })}<span class="cr-floor" aria-hidden="true"></span></div>
          ${unlockCard}
          ${lorePopover}
        </div>
        <div class="cr-controls">
          <section class="cr-sec cr-races" aria-label="Race">
            <div class="cr-sec-head"><h3>Race</h3><span>Starter &amp; dungeon-earned</span></div>
            <div class="cr-meds">${RACE_ORDER.map(raceMedallion).join('')}</div>
          </section>
          <section class="cr-sec cr-classes" aria-label="Class">
            <div class="cr-sec-head"><h3>Class &amp; Role</h3><span>4 buttons + dodge</span></div>
            <div class="cr-crests">${CLASS_ORDER.map(classCrest).join('')}</div>
            <div class="cr-kit">
              <div class="cr-role-banner ${C.role}">
                <span class="cr-role-tag"><i class="rdot ${C.role}"></i>${esc(C.roleName)}</span>
                <p>${esc(C.job)}</p>
              </div>
              ${sigs ? `<div class="cr-abs">${sigs}</div>` : `<p class="cr-kit-soon">Rogue kit arrives in the classes pass.</p>`}
            </div>
          </section>
        </div>
      </div>
      <form class="cr-foot" autocomplete="off">
        <label class="sr" for="cr-name">Name</label>
        <div class="cr-namebox"><input id="cr-name" maxlength="24" value="${esc(this.name)}" placeholder="Name" spellcheck="false" enterkeyhint="done"><button type="button" class="icon-btn" data-act="dice" aria-label="Roll a ${esc(R.name.toLowerCase())} name" title="Roll a name">${GLYPH.dice}</button></div>
        <button type="submit" class="btn gold big" id="cr-go" ${why ? 'disabled' : ''}>Make ${esc(this.name.split(' ')[0] || 'hero')}</button>
        <p class="cr-note ${this.err ? 'err' : ''}" id="cr-note" aria-live="polite">${esc(this.err || why || '')}</p>
      </form>`;
  }
}
