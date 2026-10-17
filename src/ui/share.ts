/**
 * Share: a moment worth showing off, as a picture to post (the moments are meta/brag.ts, the card is
 * sharecard.ts). It opens over whatever is showing, on the best moment first, with arrows to the others. Where
 * the system's share sheet takes a picture (a phone), Share hands it over, straight to Discord or Messages.
 * Where it doesn't (a computer, or the page inside claude.ai's frame), the picture is there to keep: hold it
 * or right-click it, or Save the image. Nothing goes in the save, and the pictures are let go when it closes.
 */
import { GAME_NAME, PLAY_URL } from '../content';
import type { Brag } from '../meta/brag';
import { activeHero, heroById } from '../meta/profile';
import type { App } from './app';
import { actions, esc, GLYPH } from './dom';
import { SFX } from './sound';
import { cardHero, cardWords, makeCard } from './sharecard';

/** a card, made: the picture to hand over, and the same as a link for the page */
interface Pic { file: File; url: string }

const dataUrl = (b: Blob): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result));
  r.onerror = () => rej(r.error);
  r.readAsDataURL(b);
});
const fileName = (title: string): string => `${GAME_NAME}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';

export class Share {
  private el: HTMLElement | null = null;
  private brags: Brag[] = [];
  private at = 0;
  private hero: string | null = null;
  private preview = false;
  private pics: (Pic | undefined)[] = [];
  /** the cards being drawn: a new set for each open, so a slow one from before never blocks or lands */
  private drawing = new Set<number>();
  private failed = false;
  /** where focus was, to go back to on close */
  private back: HTMLElement | null = null;
  /** the share sheet said no (a page inside a frame that doesn't allow it): offer the picture to keep from now on */
  private noSheet = false;

  constructor(private app: App) {
    window.addEventListener('keydown', (e) => {
      if (!this.el) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.stopPropagation(); this.step(e.key === 'ArrowLeft' ? -1 : 1); }
    }, true);
  }

  /** Open on `brags[at]`, with the hero they happened to (or the one you play). A preview's cards say so. */
  open(brags: Brag[], o: { hero?: string | null; preview?: boolean; at?: number } = {}): void {
    if (!brags.length) return;
    this.close();
    this.brags = brags; this.at = Math.max(0, Math.min(brags.length - 1, o.at || 0));
    this.hero = o.hero ?? null; this.preview = !!o.preview; this.pics = []; this.failed = false; this.drawing = new Set();
    this.back = document.activeElement as HTMLElement | null;
    const el = this.el = document.createElement('div');
    el.className = 'share';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Share');
    actions(el, { close: () => this.close(), prev: () => this.step(-1), next: () => this.step(1), send: () => { void this.send(); }, again: () => { this.failed = false; this.render(); } });
    el.addEventListener('click', (e) => { if (e.target === el) this.close(); });
    this.app.root.appendChild(el);
    SFX.play('ui');
    this.render();
  }
  close(): void {
    if (!this.el) return;
    this.el.remove();
    this.el = null; this.pics = []; this.brags = [];
    this.back?.focus?.({ preventScroll: true });
    this.back = null;
  }

  /** a card as a picture, with the hero you play (for testing: tools and the contact sheet) */
  card(b: Brag, preview = false): Promise<Blob> {
    const h = activeHero(this.app.p);
    return h ? makeCard(b, cardHero(this.app.p, h), { preview }) : Promise.reject(new Error('no hero'));
  }

  private step(d: number): void {
    const n = this.brags.length;
    if (n < 2) return;
    this.at = (this.at + d + n) % n;
    SFX.play('ui');
    this.render();
  }

  /** the share sheet takes this picture */
  private sheetFor(file: File): boolean {
    if (this.noSheet || !navigator.share || !navigator.canShare) return false;
    try { return navigator.canShare({ files: [file] }); } catch { return false; }
  }

  private render(): void {
    const el = this.el;
    if (!el) return;
    const n = this.brags.length, pic = this.pics[this.at], w = cardWords(this.brags[this.at]);
    const sheet = !!pic && this.sheetFor(pic.file);
    const hint = this.app.touch ? 'Hold the picture to save it' : 'Right-click the picture to save or copy it';
    const had = (document.activeElement as HTMLElement | null)?.dataset?.act;
    const wait = this.failed ? '<span class="sh-wait">The picture didn’t draw.<button type="button" class="btn small" data-act="again">Try again</button></span>' : '<span class="sh-wait">Drawing your card…</span>';
    el.innerHTML = `<div class="sh-in">
      <div class="sh-top"><p class="eyebrow">Share${n > 1 ? ` · ${this.at + 1} of ${n}` : ''}</p><button type="button" class="icon-btn" data-act="close" aria-label="Close">${GLYPH.close}</button></div>
      <div class="sh-pic">${pic ? `<img src="${pic.url}" alt="${esc(`${w.title}. ${w.sub}`)}">` : wait}
        ${n > 1 ? `<button type="button" class="sh-step l" data-act="prev" aria-label="The moment before">${GLYPH.left}</button><button type="button" class="sh-step r" data-act="next" aria-label="The next moment">${GLYPH.right}</button>` : ''}</div>
      ${n > 1 ? `<div class="sh-dots" aria-hidden="true">${this.brags.map((_, i) => `<i${i === this.at ? ' class="on"' : ''}></i>`).join('')}</div>` : ''}
      ${pic && !sheet ? `<p class="sh-hint">${hint}</p>` : ''}
      <div class="sh-acts">${sheet ? `<button type="button" class="btn gold big" data-act="send">${GLYPH.share}Share</button>` : ''}
        ${pic && !framed() ? `<a class="btn${sheet ? '' : ' gold big'}" href="${pic.url}" download="${esc(pic.file.name)}">Save the image</a>` : ''}</div></div>`;
    if (!pic && !this.failed) void this.draw(this.at);
    // focus stays on the button you used (an arrow), or goes to the main one
    (el.querySelector<HTMLElement>(had ? `[data-act="${had}"]` : '.sh-acts .btn') || el.querySelector<HTMLElement>('.sh-acts .btn') || el.querySelector<HTMLElement>('[data-act="close"]'))?.focus({ preventScroll: true });
  }

  private async draw(i: number): Promise<void> {
    const b = this.brags[i], h = heroById(this.app.p, this.hero) || activeHero(this.app.p), mine = this.drawing;
    if (!h) { this.close(); return; }
    if (mine.has(i)) return;
    mine.add(i);
    try {
      const blob = await makeCard(b, cardHero(this.app.p, h), { preview: this.preview });
      const url = await dataUrl(blob);
      // closed, or opened again, while it drew
      if (this.drawing !== mine || !this.el) return;
      this.pics[i] = { file: new File([blob], fileName(cardWords(b).title), { type: 'image/png' }), url };
      if (i === this.at) this.render();
    } catch {
      if (this.drawing === mine && this.el && i === this.at) { this.failed = true; this.render(); }
    } finally {
      mine.delete(i);
    }
  }

  private async send(): Promise<void> {
    const pic = this.pics[this.at];
    if (!pic) return;
    SFX.play('ui');
    const data: ShareData = { files: [pic.file], title: GAME_NAME, text: `${cardWords(this.brags[this.at]).title} · ${GAME_NAME} ${PLAY_URL}` };
    try {
      await navigator.share(navigator.canShare(data) ? data : { files: [pic.file] });
    } catch (e) {
      // closing the share sheet is fine; anything else means it can't be used here, so show the picture to keep
      if ((e as { name?: string } | null)?.name === 'AbortError') return;
      this.noSheet = true;
      this.render();
    }
  }
}

/** the page is inside another (claude.ai's viewer), where a download link does nothing: holding or right-clicking
 *  the picture still saves it */
function framed(): boolean {
  try { return window.top !== window.self; } catch { return true; }
}
