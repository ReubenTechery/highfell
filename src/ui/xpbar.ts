/**
 * A slim skill bar for the close-ups (gathering and the cauldron). XP lands a cut or a lap at a time:
 * the bar fills as it comes in, and a new rank gets a burst right there, mid-harvest.
 */
import { SKILLS } from '../content/vale';
import { rankProgress, type XpGain } from '../meta/vale';
import { esc, fmtN } from './dom';
import { tile } from './art';
import { SFX } from './sound';

export class XpBar {
  private el: HTMLElement | null = null;

  constructor(private host: HTMLElement, private skill: string, private icon: string, private xp: number) {}

  /** the bar's markup, for the close-up's foot */
  html(): string {
    const pr = rankProgress(this.xp);
    return `<div class="toy-xp" aria-live="polite"><span class="tile" aria-hidden="true">${tile(this.icon)}</span>
      <span class="tx-n">${esc(SKILLS[this.skill]?.name || this.skill)} <b>${pr.rank}</b></span>
      <span class="tx-bar"><i style="width: ${(pr.k * 100).toFixed(1)}%"></i></span>
      <span class="tx-v">${pr.need ? `${fmtN(pr.into)}/${fmtN(pr.need)}` : 'max'}</span></div>`;
  }
  /** call once the markup is in the page */
  bind(): void { this.el = this.host.querySelector('.toy-xp'); }

  /** XP just landed: fill the bar, and on a new rank, burst */
  gain(g: XpGain): void {
    this.xp = g.total;
    const el = this.el;
    if (!el) return;
    const pr = rankProgress(this.xp);
    const fill = el.querySelector<HTMLElement>('.tx-bar i')!;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    if (g.rankUp) {
      // fill to the end, then start the new rank
      fill.style.width = '100%';
      setTimeout(() => { fill.style.transition = 'none'; fill.style.width = '0%'; void fill.offsetWidth; fill.style.transition = ''; fill.style.width = `${(pr.k * 100).toFixed(1)}%`; }, 380);
      this.burst(g.rankUp.rank);
    } else fill.style.width = `${(pr.k * 100).toFixed(1)}%`;
    el.querySelector('.tx-n b')!.textContent = String(pr.rank);
    el.querySelector('.tx-v')!.textContent = pr.need ? `${fmtN(pr.into)}/${fmtN(pr.need)}` : 'max';
    SFX.play(g.rankUp ? 'rankup' : 'xp', 0.8);
  }

  /** a new rank, right there in the close-up */
  private burst(rank: number): void {
    const b = document.createElement('div');
    b.className = 'toy-rank';
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = `<span class="tr-rays"></span><span class="tr-tile">${tile(this.icon)}</span><b>${esc(SKILLS[this.skill]?.name || this.skill)} ${rank}!</b>`;
    this.host.appendChild(b);
    setTimeout(() => b.remove(), 1700);
  }
}
