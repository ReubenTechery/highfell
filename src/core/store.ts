/**
 * Where the profile lives. Two copies: this browser (instant, works anywhere) and, on claude.ai,
 * the page's own database under your account (survives clearing the browser, follows you between
 * phone and computer). Every save bumps `rev`; on load the higher `rev` wins.
 *
 * The database copy is one document, data/users/<your id>/profile, holding the profile as a JSON
 * string so its keys never trip the store's field rules.
 */
import { migrate, type Profile } from '../meta/profile';

const KEY = 'highfell.profile.v2';
export type SyncState = 'device' | 'connecting' | 'account' | 'offline';

function readLocal(): unknown {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function writeLocal(p: Profile): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private window: the account copy still saves */ }
}

type Doc = { get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; set(d: Record<string, unknown>): Promise<void> };

export class Store {
  profile: Profile;
  state: SyncState = 'device';
  private doc: Doc | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private writing = false;
  private dirty = false;
  private listeners = new Set<(why: 'remote' | 'state') => void>();

  constructor() { this.profile = migrate(readLocal()); }

  onChange(fn: (why: 'remote' | 'state') => void): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private tell(why: 'remote' | 'state'): void { for (const fn of this.listeners) fn(why); }

  /** Connects to the account copy when the page runs on claude.ai. Safe to call anywhere. */
  async connect(): Promise<void> {
    const c = (globalThis as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
    if (!c || typeof c.use !== 'function') return;
    this.state = 'connecting'; this.tell('state');
    try {
      const [db, user] = (await Promise.all([c.use('db'), c.use('user')])) as [{ doc(p: string): Doc } | null, { id(): Promise<string | null> } | null];
      const uid = db && user ? await user.id() : null;
      if (!db || !uid) { this.state = 'device'; this.tell('state'); return; }
      this.doc = db.doc(`data/users/${uid}/profile`);
      const snap = await this.doc.get();
      const body = snap.exists ? snap.data() : undefined;
      const remote = body && typeof body.json === 'string' ? migrate(JSON.parse(body.json)) : null;
      if (remote && remote.rev > this.profile.rev) {
        this.profile = remote;
        writeLocal(remote);
        this.state = 'account';
        this.tell('remote');
      } else {
        this.state = 'account';
        if (!remote || this.profile.rev > remote.rev) await this.flush();
      }
      this.tell('state');
    } catch (e) {
      console.warn('account save unavailable', e);
      this.doc = null; this.state = 'offline'; this.tell('state');
    }
  }

  /** Call after any change to the profile. Writes this device now and the account copy shortly after. */
  save(): void {
    const p = this.profile;
    p.rev++; p.savedAt = Date.now();
    writeLocal(p);
    if (!this.doc) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, 700);
  }

  /** Swap in a whole profile (dev tools, a reset). */
  replace(p: Profile): void { p.rev = Math.max(p.rev, this.profile.rev); this.profile = p; this.save(); this.tell('remote'); }

  private async flush(): Promise<void> {
    if (!this.doc) return;
    if (this.writing) { this.dirty = true; return; }
    this.writing = true;
    try {
      await this.doc.set({ json: JSON.stringify(this.profile), rev: this.profile.rev, savedAt: this.profile.savedAt, v: this.profile.v });
      if (this.state !== 'account') { this.state = 'account'; this.tell('state'); }
    } catch (e) {
      console.warn('account save failed', e);
      if (this.state !== 'offline') { this.state = 'offline'; this.tell('state'); }
    } finally {
      this.writing = false;
      if (this.dirty) { this.dirty = false; void this.flush(); }
    }
  }
}
