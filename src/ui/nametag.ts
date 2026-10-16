/**
 * Your hero's name tag in the house: their name and title over their head, the same size at any zoom so it
 * reads from the whole house, bobbing gently (styles.css). It shifts in from the screen's sides and hides
 * where it would cover the top bar or the Dungeons button. Only the hero you play has one; the hearth says
 * where their head is, puts the tag in the layer over the house, and places it after every camera move.
 */
import { TITLES } from '../content';
import type { Hero } from '../meta/profile';
import type { Camera } from './camera';
import { esc } from './dom';

export class NameTag {
  /** the top of your hero's head, in house units */
  at: [number, number] = [0, 0];
  /** the tag's size on screen, and the screen rows it may use: between the top bar and the bottom one */
  private size: [number, number] = [0, 0];
  private band: [number, number] = [0, 0];

  constructor(private root: HTMLElement, private top: HTMLElement, private bottom: HTMLElement) {}

  /** its markup, for the layer over the house */
  html(h: Hero, light: string): string {
    const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
    return `<div class="h-name" style="--light: ${light}" aria-hidden="true"><span><b>${esc(h.name)}</b>${title ? `<small>${esc(title)}</small>` : ''}</span></div>`;
  }

  /** read its size and the rows between the bars again: after either changes, a resize or a font arriving */
  measure(): void {
    const tag = this.el();
    if (!tag || !this.root.offsetParent) return;
    const box = this.root.getBoundingClientRect();
    const low = this.bottom.firstElementChild?.getBoundingClientRect().top ?? box.bottom;
    this.band = [this.top.getBoundingClientRect().bottom - box.top + 6, low - box.top - 6];
    this.size = [tag.offsetWidth, tag.offsetHeight];
  }

  /** put it over your hero's head for where the camera is now; `hide` while the tour points at your hero */
  place(cam: Camera, hide: boolean): void {
    const tag = this.el();
    if (!tag) return;
    const [sx0, sy0] = cam.toScreen(...this.at);
    const [tw, th] = this.size, hw = tw / 2 + 6, sy = sy0 - 6;
    const sx = Math.max(hw, Math.min(cam.w - hw, sx0));
    tag.classList.toggle('off', hide || sx0 < 0 || sx0 > cam.w || sy - th - 4 < this.band[0] || sy > this.band[1]);
    tag.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
  }

  private el(): HTMLElement | null { return this.root.querySelector<HTMLElement>('.h-name'); }
}
