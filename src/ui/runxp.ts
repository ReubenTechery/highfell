/**
 * XP in a run, in gold (the owner's call, 18 Oct: "make it all really satisfying"): one bar across the whole bottom
 * of the screen, like an MMO's, with your level at its left end. A kill's XP leaves the mob as a gold mote that
 * flies to the bar (a big mob sends three, a boss a shower); it lands as a gold drop that rises off the bar, the way
 * a skill's XP drops do (drops landing together add up), and the bar fills with a flash. A new level fills it to the
 * end, flashes it, pops your level and bursts in the middle of the screen. The XP itself is added to your save the
 * moment a kill pays it (meta/xp.ts), so a wipe or leaving the run keeps it; only the picture waits for the mote.
 * Nothing gold happens over the mobs themselves, where gold means a crit or a payoff. A run that doesn't count (the
 * Crypt Trial, test gear) shows no bar and pays nothing.
 */
import { levelBonus } from '../content/xp';
import { gainXp, levelProgress, type XpGain } from '../meta/xp';
import { pointsAt } from '../meta/talents';
import type { Profile } from '../meta/profile';
import { esc, fmtN, reducedMotion } from './dom';
import { SFX } from './sound';

/** how long a mote takes to reach the bar, and how close together two drops land to add up (ms) */
const FLY = 560, MERGE = 320;

export class RunXp {
  /** XP the kills paid this run, for the chest */
  kills = 0;
  /** your XP when the run started */
  start = 0;
  private on = false;
  private bar: HTMLElement | null = null;
  private drop: { el: HTMLElement; n: number; at: number } | null = null;
  private ticked = 0;

  constructor(private host: HTMLElement) {}

  /** a run starts: the bar across the bottom shows your level and how far into it you are (nothing on a run that
   *  pays nothing) */
  begin(p: Profile, on: boolean): void {
    this.on = on; this.kills = 0; this.start = p.xp; this.drop = null;
    this.host.querySelector('.xpb')?.remove();
    this.host.classList.toggle('has-xpb', on);
    this.bar = null;
    if (!on) return;
    const pr = levelProgress(p.xp);
    const el = document.createElement('div');
    el.className = 'xpb';
    el.setAttribute('role', 'progressbar');
    el.setAttribute('aria-label', 'Your level');
    el.innerHTML = `<span class="xpb-track"><i class="xpb-fill"></i><span class="xpb-ticks" aria-hidden="true">${'<i></i>'.repeat(10)}</span></span>
      <b class="xpb-lv"><small>Lv</small><span>${pr.level}</span></b><span class="xpb-drops" aria-hidden="true"></span>`;
    this.host.appendChild(el);
    this.bar = el;
    this.fill(p);
  }

  /** a kill paid XP: into your save at once; then a mote flies from `from` (where the mob was on the screen, or
   *  nothing to skip the flight) and the bar takes it when it lands. Returns what it did. */
  gain(p: Profile, n: number, from: { x: number; y: number } | null = null, big: 0 | 1 | 2 = 0): XpGain | null {
    if (!this.on || n <= 0) return null;
    const g = gainXp(p, n);
    this.kills += g.xp;
    const land = (): void => this.land(p, g);
    if (from && this.bar && !reducedMotion()) this.fly(from, big, land);
    else land();
    return g;
  }

  /** the motes, from the mob to your level at the end of the bar; the first to arrive brings the XP */
  private fly(from: { x: number; y: number }, big: 0 | 1 | 2, land: () => void): void {
    const lv = this.bar?.querySelector<HTMLElement>('.xpb-lv');
    if (!lv) { land(); return; }
    const hr = this.host.getBoundingClientRect(), r = lv.getBoundingClientRect();
    const tx = r.left - hr.left + r.width / 2, ty = r.top - hr.top + r.height / 2;
    const count = big === 2 ? 9 : big === 1 ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const m = document.createElement('i');
      m.className = `xpb-mote${big ? ' big' : ''}`;
      this.host.appendChild(m);
      // each mote leaves in its own direction, swings out and is pulled in to the bar
      const a = (i / count) * Math.PI * 2 + (count > 1 ? 0.3 : -1.9), spread = count > 1 ? 70 : 46;
      const sx = from.x + (count > 1 ? Math.cos(a) * 14 : 0), sy = from.y + (count > 1 ? Math.sin(a) * 14 : 0);
      const mx = from.x + Math.cos(a) * spread + (tx - from.x) * 0.15, my = from.y + Math.sin(a) * spread * 0.6 - 40;
      const anim = m.animate([
        { transform: `translate(${sx}px, ${sy}px) scale(0.3)`, opacity: 0.4 },
        { transform: `translate(${mx}px, ${my}px) scale(1.15)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.6)`, opacity: 1 },
      ], { duration: FLY + i * 45, delay: i * 30, easing: 'cubic-bezier(.45, 0, .8, .4)', fill: 'both' });
      anim.onfinish = () => { m.remove(); if (i === 0) land(); else this.bump(); };
    }
  }

  /** the XP lands: a drop rises off the bar (one that lands right after another adds to it), and the bar fills */
  private land(p: Profile, g: XpGain): void {
    const bar = this.bar;
    if (!bar) return;
    const drops = bar.querySelector<HTMLElement>('.xpb-drops'), now = performance.now();
    if (drops) {
      if (this.drop && now - this.drop.at < MERGE && this.drop.el.isConnected) {
        this.drop.n += g.xp; this.drop.at = now;
        this.drop.el.innerHTML = `+${fmtN(this.drop.n)}<small>XP</small>`;
        this.drop.el.classList.remove('go'); void this.drop.el.offsetWidth; this.drop.el.classList.add('go');
      } else {
        const el = document.createElement('b');
        el.className = `xpb-drop go${g.xp >= 200 ? ' big' : ''}`;
        el.innerHTML = `+${fmtN(g.xp)}<small>XP</small>`;
        drops.appendChild(el);
        setTimeout(() => el.remove(), 1700);
        this.drop = { el, n: g.xp, at: now };
      }
    }
    if (now - this.ticked > 110) { this.ticked = now; SFX.play('xp', 0.35); }
    this.bump();
    if (g.to > g.from) this.levelled(p, g);
    else this.fill(p);
  }

  /** the bar takes a hit of XP: a white flash on the fill */
  private bump(): void {
    const bar = this.bar;
    if (!bar) return;
    bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump');
  }

  /** the bar as far into your level as you are now, and its numbers for a screen reader */
  private fill(p: Profile): void {
    const bar = this.bar, pr = levelProgress(p.xp);
    const f = bar?.querySelector<HTMLElement>('.xpb-fill');
    if (!bar || !f) return;
    f.style.width = `${(pr.k * 100).toFixed(1)}%`;
    bar.setAttribute('aria-valuenow', String(Math.round(pr.k * 100)));
    bar.setAttribute('aria-valuetext', `Level ${pr.level}, ${fmtN(pr.into)} of ${fmtN(pr.need)} XP`);
    bar.setAttribute('title', `Level ${pr.level} · ${fmtN(pr.into)} / ${fmtN(pr.need)} XP`);
  }

  /** a new level: the bar fills to the end and flashes, your level pops, then the next level's bar starts */
  private levelled(p: Profile, g: XpGain): void {
    const bar = this.bar, f = bar?.querySelector<HTMLElement>('.xpb-fill'), lv = bar?.querySelector('.xpb-lv span');
    if (!bar || !f || !lv) return;
    f.style.width = '100%';
    bar.classList.remove('lvl'); void bar.offsetWidth; bar.classList.add('lvl');
    setTimeout(() => {
      lv.textContent = String(levelProgress(p.xp).level);
      f.style.transition = 'none'; f.style.width = '0%'; void f.offsetWidth; f.style.transition = '';
      this.fill(p);
    }, 420);
    this.burst(g);
  }

  /** a new level, right there in the fight: its number big and gold, the talent point it brings and how much
   *  stronger it makes the party (the next fight's heroes feel it; this one's are already in) */
  private burst(g: XpGain): void {
    const pts = pointsAt(g.to) - pointsAt(g.from);
    const more = `+${Math.round((levelBonus(g.to) - levelBonus(g.from)) * 1000) / 10}% to your party`;
    const el = document.createElement('div');
    el.className = 'lvl-up';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="lu-rays" aria-hidden="true"></span><b>Level ${g.to}!</b><small>${pts > 0 ? `+${pts} talent point${pts === 1 ? '' : 's'} · ` : ''}${more}</small>`;
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
