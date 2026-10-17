/**
 * A run in progress keeps hold of the page. On a phone the back swipe (or the back button) pauses the run
 * instead of leaving the game, so a thumb near the edge mid-boss never throws the run away; closing the tab or
 * reloading asks first, where the browser allows it. Inside claude.ai's frame the page's history isn't ours to
 * touch, so there it only asks.
 */
const KEY = 'highfellRun';

/** the page is inside another (claude.ai's viewer) */
function framed(): boolean {
  try { return window.top !== window.self; } catch { return true; }
}

export class RunGuard {
  private armed = false;
  /** the history step this guard added, waiting to be taken back off */
  private pushed = false;
  /** a back the guard did itself, which isn't the player's */
  private ownBack = false;

  constructor(private onBack: () => void) {
    window.addEventListener('popstate', () => {
      if (this.ownBack) { this.ownBack = false; return; }
      if (!this.armed) return;
      // the player went back mid-run: stay, put the step back, and pause
      history.pushState({ [KEY]: 1 }, '');
      this.onBack();
    });
    window.addEventListener('beforeunload', (e) => {
      if (!this.armed) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  /** a run has started: hold the page */
  arm(): void {
    if (this.armed) return;
    this.armed = true;
    if (framed() || this.pushed) return;
    try { history.pushState({ [KEY]: 1 }, ''); this.pushed = true; } catch { /* no history here: the ask still works */ }
  }

  /** the run is over: let go, and take the history step back off */
  disarm(): void {
    if (!this.armed) return;
    this.armed = false;
    if (!this.pushed) return;
    this.pushed = false;
    if ((history.state as Record<string, unknown> | null)?.[KEY]) { this.ownBack = true; history.back(); }
  }
}
