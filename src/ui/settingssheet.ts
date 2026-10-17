/**
 * Settings: sound and the music's volume (kept on this device), your keys on a computer (kept in this browser), where your
 * save lives, the testing switches (the reveal and the lantern's tells, the garden's instant growth and luck, every house
 * look) and starting over. The sheets wire up its buttons.
 */
import type { SyncState } from '../core/store';
import type { Profile } from '../meta/profile';
import type { Dev } from './app';
import { esc, fmtDate, fmtN, GLYPH } from './dom';
import { MUSIC } from './music';
import { AB, SLOTS_AB } from '../content/roles';
import { DEFAULT_KEYS, keyLabel, type BindSlot } from '../content/keys';
import type { GearKey } from '../content/types';
import { tile } from './art';
import { KEYWAIT, ownKeys } from './keybinds';

/** Your keys: each of your class's four buttons and the dodge, E, Q, F, R order. Tap one, then press a key. */
function keysBox(k: GearKey, cls: string): string {
  const own = ownKeys(k);
  const order = (Object.entries(DEFAULT_KEYS[k]) as [string, string][]).sort((a, b) => 'EQFR'.indexOf(a[1].slice(3)) - 'EQFR'.indexOf(b[1].slice(3))).map(([s]) => s as BindSlot);
  const row = (slot: BindSlot): string => {
    const name = slot === 'dodge' ? 'Dodge' : AB[k][slot as 'a1'].name, icon = slot === 'dodge' ? 'dodge' : AB[k][slot as 'a1'].key;
    const wait = KEYWAIT.slot === slot;
    return `<li class="kb-row"><span class="kb-ic">${tile(icon)}</span><span class="kb-n">${esc(name)}</span><button type="button" class="btn small kb-k${wait ? ' wait' : ''}" data-act="rebind" data-slot="${slot}" aria-label="${esc(name)}: ${wait ? 'press a key' : esc(keyLabel(k, slot, own))}">${wait ? 'Press a key…' : esc(keyLabel(k, slot, own))}</button></li>`;
  };
  const changed = Object.keys(own).length > 0;
  return `<div class="box"><h3 class="section-title">Keys</h3>
      <p class="fine">Your ${esc(cls)}’s buttons on this computer. Tap one, then press a key or a mouse button; Shift and a key works too. 1 to 4 always work, and W, A, S, D walk.</p>
      <ul class="kb-list">${[...order, ...SLOTS_AB.filter((s) => !order.includes(s)), 'dodge' as BindSlot].map(row).join('')}</ul>
      ${KEYWAIT.err ? `<p class="fine kb-err">${esc(KEYWAIT.err)}</p>` : ''}
      ${changed ? `<div class="actions"><button type="button" class="btn small" data-act="keysreset">Back to E, Q, F, R</button></div>` : ''}</div>`;
}

declare const __BUILD__: string;
const BUILD = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';

/** `keys`: your class on a computer (its Keys list), or null on a touch screen or before your first hero */
export function settingsSheet(p: Profile, st: SyncState, dev: Dev, resetArmed: boolean, keys: { k: GearKey; cls: string } | null): { head: string; body: string } {
  const where = st === 'account' ? 'Saved to your account. It follows you between your phone and your computer.' : st === 'connecting' ? 'Connecting to your account…' : st === 'offline' ? 'Your account save could not be reached, so this device is keeping your progress until it can.' : 'Saved on this device. Open the game on claude.ai to keep it in your account too.';
  const body = `
    <div class="box"><h3 class="section-title">Sound</h3><div class="actions vol-row"><button type="button" class="btn small" data-act="sound">${p.settings.sound ? GLYPH.sound + 'Sound on' : GLYPH.mute + 'Sound off'}</button>
      <label class="vol"><span>Music</span><input type="range" min="0" max="100" step="5" value="${Math.round(MUSIC.volume * 100)}" data-act="music" aria-label="Music volume"></label></div></div>
    ${keys ? keysBox(keys.k, keys.cls) : ''}
    <div class="box"><h3 class="section-title">Your save</h3><p class="fine">${esc(where)}</p><p class="fine">Save ${fmtN(p.rev)} · started ${fmtDate(p.createdAt)} · ${p.roster.length} hero${p.roster.length === 1 ? '' : 'es'}</p></div>
    <div class="box"><h3 class="section-title">For testing</h3>
      <p class="fine">See the end-of-run reveal of the dungeon picked on the Dungeons sheet, without earning it. Nothing is added to your save.</p>
      <div class="actions"><button type="button" class="btn small" data-act="preview" data-v="normal">Normal</button><button type="button" class="btn small" data-act="preview" data-v="kit">Kit</button><button type="button" class="btn small" data-act="preview" data-v="unique">Unique</button><button type="button" class="btn small" data-act="preview" data-v="pet">Pet</button><button type="button" class="btn small" data-act="preview" data-v="log">Log complete</button></div>
      <p class="fine">The garden: instant growth lets you harvest a bed that is still growing, and lucky makes its rares 50 times likelier. What you get still goes in your save.</p>
      <div class="seg"><button type="button" class="sg" role="switch" data-act="vfree" aria-checked="${dev.valeFree}">Instant growth</button><button type="button" class="sg" role="switch" data-act="vluck" aria-checked="${dev.valeLuck}">Lucky ×50</button></div>
      <p class="fine">Collection log rewards and Heroic: try the house looks, the Risen and Heroic before you earn them. A look you haven't earned shows only while this is on; a hero you make stays.</p>
      <div class="seg"><button type="button" class="sg" role="switch" data-act="allopen" aria-checked="${dev.allOpen}">Everything open</button></div>
      <p class="fine">Onboarding: replay the Crypt Trial as your hero, or the guided tour of your house.</p>
      <div class="actions"><button type="button" class="btn small" data-act="intro">Play the trial</button><button type="button" class="btn small" data-act="tour">Hearth tour</button></div></div>
    <div class="box"><h3 class="section-title">Start over</h3><p class="fine">Wipes every hero, their gear, kill counts, the collection log, achievements and the house.</p>
      <div class="actions"><button type="button" class="btn small" data-act="reset" style="${resetArmed ? 'background: var(--red); color: #FFFFFF' : ''}">${resetArmed ? 'Tap again to wipe everything' : 'Start over'}</button></div></div>
    <p class="fine">Build ${esc(BUILD)}</p>`;
  return { head: `<h2>Settings</h2>`, body };
}
