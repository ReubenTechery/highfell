/** Little cards that drop in from the top: achievements, new collection log slots, drops mid-run. An
 *  achievement's says what you did and what you got, and a tap opens its card (never mid-fight: there the
 *  tap goes to the game, and the chest lists them all). */
import { ACHIEVEMENTS, COLLECTIBLES } from '../content';
import type { Profile } from '../meta/profile';
import { esc } from './dom';
import { iconOf, nameOf, tile } from './art';
import { gotLine } from './achcard';
import { SFX } from './sound';

interface Toast { html: string; ach?: string }

export class Toasts {
  private queue: Toast[] = [];
  private showing = 0;
  constructor(private root: HTMLElement, private open: (achievement: string) => void = () => {}) {
    root.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-ach]');
      if (!el || !el.dataset.ach) return;
      SFX.play('ui');
      el.classList.add('out');
      this.open(el.dataset.ach);
    });
  }

  push(html: string, sound?: string, ach?: string): void {
    this.queue.push({ html, ach });
    if (sound) SFX.play(sound);
    this.pump();
  }
  private pump(): void {
    while (this.showing < 3 && this.queue.length) {
      const t = this.queue.shift()!;
      const el = document.createElement(t.ach ? 'button' : 'div');
      el.className = t.ach ? 'toast tap' : 'toast';
      if (t.ach) { (el as HTMLButtonElement).type = 'button'; el.dataset.ach = t.ach; }
      el.innerHTML = t.html;
      this.root.appendChild(el);
      this.showing++;
      // an achievement has more to read: what you did and what you got
      setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); this.showing--; this.pump(); }, 320); }, t.ach ? 5200 : 3600);
    }
  }

  achievement(p: Profile, id: string): void {
    const a = ACHIEVEMENTS[id];
    if (!a) return;
    this.push(`<span class="medal ${a.tier}" aria-hidden="true">${a.points}</span><span class="tt"><small>Achievement<i class="t-tap"> · tap for more</i></small><b>${esc(a.name)}</b><span class="t-line">${esc(a.how)} <em>→ ${esc(gotLine(p, a))}</em></span></span>`, 'ach', id);
  }
  collected(id: string, kc?: number, kcWord = 'Kill count'): void {
    const c = COLLECTIBLES[id];
    const what = c ? (c.kind === 'pet' ? 'New pet' : c.kind === 'mount' ? 'New mount' : 'New collection log slot') : 'New collection log slot';
    this.push(`<span class="tile" aria-hidden="true">${iconOf(id)}</span><span class="tt"><small>${what}</small><b>${esc(nameOf(id))}</b>${kc ? `<span>${esc(kcWord)} ${kc}</span>` : ''}</span>`, 'rare');
  }
  /** a skill went up a rank */
  rank(skill: string, rank: number, icon: string, note = ''): void {
    this.push(`<span class="tile" aria-hidden="true">${tile(icon)}</span><span class="tt"><small>Rank up</small><b>${esc(skill)} ${rank}</b>${note ? `<span>${esc(note)}</span>` : ''}</span>`, 'rankup');
  }
  text(title: string, sub = '', eyebrow = ''): void {
    this.push(`<span class="medal hidden" aria-hidden="true">!</span><span class="tt">${eyebrow ? `<small>${esc(eyebrow)}</small>` : ''}<b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</span>`);
  }
}
