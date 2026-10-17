/**
 * XP in a run: your level and a thin violet bar in your own party frame (how far into the level), filling as kills
 * pay, and a level's burst in the middle of the screen. The XP itself is added to your save the moment a kill pays
 * it (meta/xp.ts), so a wipe or leaving the run keeps it. The engine pops each kill's number over the mob. A run
 * that doesn't count (the Crypt Trial, test gear) shows no bar and pays nothing.
 */
import { MAX_LEVEL } from '../content/xp';
import { gainXp, levelProgress, type XpGain } from '../meta/xp';
import { pointsAt } from '../meta/talents';
import type { Profile } from '../meta/profile';
import { esc, fmtN } from './dom';
import { tile } from './art';
import { SFX } from './sound';

export class RunXp {
  /** XP the kills paid this run, for the chest */
  kills = 0;
  /** your XP when the run started */
  start = 0;
  private on = false;

  private bar: HTMLElement | null = null;
  constructor(private host: HTMLElement) {}

  /** a run starts: your frame shows your level and how far into it you are (nothing on a run that pays nothing).
   *  Call it once the party frames are built. */
  begin(p: Profile, on: boolean): void {
    this.on = on; this.kills = 0; this.start = p.xp;
    const fr = this.host.querySelector<HTMLElement>('.frames .fr.me');
    this.bar = on ? fr : null;
    if (!fr || !on) return;
    const pr = levelProgress(p.xp);
    fr.querySelector('.fr-top')?.insertAdjacentHTML('beforeend', `<b class="xb-lv" title="Your level">${pr.level}</b>`);
    fr.insertAdjacentHTML('beforeend', `<span class="xb-track" title="${esc(pr.level >= MAX_LEVEL ? 'Level 99' : `${fmtN(pr.into)} / ${fmtN(pr.need)} XP`)}"><i class="xb-fill" style="width: ${(pr.k * 100).toFixed(1)}%"></i></span>`);
  }

  /** a kill paid XP: into your save, onto the bar, and a burst for a new level. Returns what it did. */
  gain(p: Profile, n: number): XpGain | null {
    if (!this.on || n <= 0) return null;
    const g = gainXp(p, n);
    this.kills += g.xp;
    this.show(p, g);
    return g;
  }

  /** the bar after XP came in; a level fills it to the end, then starts the next one, with its burst */
  private show(p: Profile, g: XpGain): void {
    const pr = levelProgress(p.xp);
    const bar = this.bar;
    const fill = bar?.querySelector<HTMLElement>('.xb-fill'), lv = bar?.querySelector('.xb-lv'), track = bar?.querySelector('.xb-track');
    if (!bar || !fill || !lv || !track) return;
    bar.classList.remove('xp-bump'); void bar.offsetWidth; bar.classList.add('xp-bump');
    track.setAttribute('title', pr.level >= MAX_LEVEL ? 'Level 99' : `${fmtN(pr.into)} / ${fmtN(pr.need)} XP`);
    if (g.to > g.from) {
      fill.style.width = '100%';
      setTimeout(() => { fill.style.transition = 'none'; fill.style.width = '0%'; void fill.offsetWidth; fill.style.transition = ''; fill.style.width = `${(pr.k * 100).toFixed(1)}%`; }, 360);
      lv.textContent = String(pr.level);
      this.burst(g);
    } else fill.style.width = `${(pr.k * 100).toFixed(1)}%`;
  }

  /** a new level, right there in the fight: its number big and gold, and the talent point it brings */
  private burst(g: XpGain): void {
    const pts = pointsAt(g.to) - pointsAt(g.from);
    const el = document.createElement('div');
    el.className = 'lvl-up';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="lu-rays" aria-hidden="true"></span><span class="lu-tile" aria-hidden="true">${tile('xp')}</span><b>Level ${g.to}!</b>${pts > 0 ? `<small>+${pts} talent point${pts === 1 ? '' : 's'}</small>` : ''}`;
    this.host.appendChild(el);
    SFX.play('levelup');
    setTimeout(() => el.remove(), 2200);
  }
}

/** the chest's XP line: what the run paid, and the level it took you to (for the reveal's numbers) */
export function xpLine(start: number, end: number): { gained: number; from: number; to: number; k: number; label: string } {
  const a = levelProgress(start), b = levelProgress(end);
  return { gained: end - start, from: a.level, to: b.level, k: b.k, label: esc(`${fmtN(end - start)} XP`) };
}
