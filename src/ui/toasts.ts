/** Little cards that drop in from the top: achievements, new collection log slots, drops mid-run. */
import { ACHIEVEMENTS, COLLECTIBLES, TITLES } from '../content';
import { esc } from './dom';
import { iconOf, nameOf } from './art';
import { SFX } from './sound';

export class Toasts {
  private queue: string[] = [];
  private showing = 0;
  constructor(private root: HTMLElement) {}

  push(html: string, sound?: string): void {
    this.queue.push(html);
    if (sound) SFX.play(sound);
    this.pump();
  }
  private pump(): void {
    while (this.showing < 3 && this.queue.length) {
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = this.queue.shift()!;
      this.root.appendChild(el);
      this.showing++;
      setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); this.showing--; this.pump(); }, 320); }, 3600);
    }
  }

  achievement(id: string): void {
    const a = ACHIEVEMENTS[id];
    if (!a) return;
    const reward = a.reward.title ? `Title: ${TITLES[a.reward.title]?.text || ''}` : a.reward.text;
    this.push(`<span class="medal ${a.tier}" aria-hidden="true">${a.points}</span><div><small>Achievement</small><b>${esc(a.name)}</b><span>${esc(reward)}</span></div>`, 'ach');
  }
  collected(id: string, kc?: number): void {
    const c = COLLECTIBLES[id];
    const what = c ? (c.kind === 'pet' ? 'New pet' : c.kind === 'mount' ? 'New mount' : 'New collection log slot') : 'New collection log slot';
    this.push(`<span class="tile" aria-hidden="true">${iconOf(id)}</span><div><small>${what}</small><b>${esc(nameOf(id))}</b>${kc ? `<span>Kill count ${kc}</span>` : ''}</div>`, 'rare');
  }
  text(title: string, sub = '', eyebrow = ''): void {
    this.push(`<span class="medal hidden" aria-hidden="true">!</span><div>${eyebrow ? `<small>${esc(eyebrow)}</small>` : ''}<b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>`);
  }
}
