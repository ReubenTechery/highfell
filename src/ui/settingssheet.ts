/**
 * Settings: sound, where your save lives, the testing switches (the reveal and the lantern's tells, the
 * Vale's free harvests and luck, every house look) and starting over. The sheets wire up its buttons.
 */
import type { SyncState } from '../core/store';
import type { Profile } from '../meta/profile';
import type { Dev } from './app';
import { esc, fmtDate, fmtN, GLYPH } from './dom';

declare const __BUILD__: string;
const BUILD = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';

export function settingsSheet(p: Profile, st: SyncState, dev: Dev, resetArmed: boolean): { head: string; body: string } {
  const where = st === 'account' ? 'Saved to your account. It follows you between your phone and your computer.' : st === 'connecting' ? 'Connecting to your account…' : st === 'offline' ? 'Your account save could not be reached, so this device is keeping your progress until it can.' : 'Saved on this device. Open the game on claude.ai to keep it in your account too.';
  const seg = (act: string, cur: string, opts: [string, string][]) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;
  const body = `
    <div class="box"><h3 class="section-title">Sound</h3><div class="actions"><button type="button" class="btn small" data-act="sound">${p.settings.sound ? GLYPH.sound + 'Sound on' : GLYPH.mute + 'Sound off'}</button></div></div>
    <div class="box"><h3 class="section-title">Your save</h3><p class="fine">${esc(where)}</p><p class="fine">Save ${fmtN(p.rev)} · started ${fmtDate(p.createdAt)} · ${p.roster.length} hero${p.roster.length === 1 ? '' : 'es'}</p></div>
    <div class="box"><h3 class="section-title">For testing</h3>
      <p class="fine">See the end-of-run reveal without earning it. Nothing is added to your save.</p>
      <div class="actions"><button type="button" class="btn small" data-act="preview" data-v="normal">Normal</button><button type="button" class="btn small" data-act="preview" data-v="unique">Unique</button><button type="button" class="btn small" data-act="preview" data-v="pet">Pet</button><button type="button" class="btn small" data-act="preview" data-v="log">Log complete</button></div>
      <p class="fine">Play the lantern's walkout at the end of practice runs, so you can learn the tells.</p>
      ${seg('walkout', dev.walkout, [['off', 'Off'], ['normal', 'Normal'], ['unique', 'Unique'], ['pet', 'Pet']])}
      <p class="fine">The Vale: free harvests don’t use up a spot, and lucky makes its rares 50 times likelier. What you get still goes in your save.</p>
      <div class="seg"><button type="button" class="sg" role="switch" data-act="vfree" aria-checked="${dev.valeFree}">Free harvests</button><button type="button" class="sg" role="switch" data-act="vluck" aria-checked="${dev.valeLuck}">Lucky ×50</button></div>
      <p class="fine">Collection log rewards and Heroic: try the house looks, the Risen and Heroic before you earn them. A look you haven't earned shows only while this is on; a hero you make stays.</p>
      <div class="seg"><button type="button" class="sg" role="switch" data-act="allopen" aria-checked="${dev.allOpen}">Everything open</button></div>
      <p class="fine">Onboarding: replay the opening tank prologue or the guided tour of your house.</p>
      <div class="actions"><button type="button" class="btn small" data-act="intro">Play the prologue</button><button type="button" class="btn small" data-act="tour">Hearth tour</button></div></div>
    <div class="box"><h3 class="section-title">Start over</h3><p class="fine">Wipes every hero, their gear, kill counts, the collection log, achievements and the house.</p>
      <div class="actions"><button type="button" class="btn small" data-act="reset" style="${resetArmed ? 'background: var(--red); color: #FFFFFF' : ''}">${resetArmed ? 'Tap again to wipe everything' : 'Start over'}</button></div></div>
    <p class="fine">Build ${esc(BUILD)}</p>`;
  return { head: `<h2>Settings</h2>`, body };
}
