
(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const C = { PULSE: 20, CAST_LEAD: 4, ENRAGE: 180, BOSS_HP: 130000, GCD: 0.6, SHIELD_AMT: 30, SHIELD_TIME: 8, TAUNT_CD: 8, CHOP_CD: 2.5, OVER_CD: 5, OVER_COST: 35, FROZEN: 1.4, EARLY: 0.9, PULL: 1.1, BOT_START: 2.5, SHOVE_WIND: 1.4 };
const NAMES = { brannoc: 'Brannoc', ivy: 'Ivy', maren: 'Maren', wren: 'Wren', tomas: 'Tomas' };
const MEMBERS = ['brannoc', 'ivy', 'maren', 'wren', 'tomas'];
const THREAT = { brannoc: 2.2, ivy: 1, wren: 0.9, tomas: 0.9, maren: 1 };
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.round(rand(a, b));
const fmt = (n) => Math.round(n).toLocaleString('en-AU');
const clock = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- sound: a tiny synth, no files ---------- */
const Sound = {
  ctx: null, master: null, on: true, buf: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type, vol, slide, delay) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  },
  noise(dur, vol, freq, ftype, delay) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + (delay || 0);
    if (!this.buf) {
      const len = Math.floor(c.sampleRate * 0.8), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.buf = b;
    }
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.buf; f.type = ftype || 'lowpass'; f.frequency.value = freq || 1000;
    g.gain.setValueAtTime(vol || 0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t0); s.stop(t0 + dur + 0.03);
  },
  hit() { this.noise(0.07, 0.16, 900); this.tone(150, 0.08, 'sine', 0.1, 90); },
  soft() { this.noise(0.05, 0.05, 700); },
  crit() { this.noise(0.09, 0.2, 1600); this.tone(660, 0.16, 'triangle', 0.09, 990); this.tone(990, 0.2, 'sine', 0.05, 1480, 0.04); },
  big() { this.noise(0.35, 0.3, 500); this.tone(110, 0.45, 'sawtooth', 0.07, 55); this.tone(880, 0.4, 'triangle', 0.08, 1320, 0.06); },
  shatter(p) { this.noise(0.3, p ? 0.26 : 0.18, 3800, 'highpass'); [1320, 1760, 2640].forEach((f, i) => this.tone(f, 0.5, 'triangle', p ? 0.06 : 0.04, null, i * 0.035)); },
  taunt() { this.tone(196, 0.16, 'square', 0.06, 262); this.tone(262, 0.12, 'square', 0.04, null, 0.1); },
  shout() { this.tone(330, 0.3, 'sawtooth', 0.04, 440); this.tone(660, 0.35, 'sine', 0.05, null, 0.05); },
  warn() { this.tone(523, 0.11, 'square', 0.045); this.tone(415, 0.15, 'square', 0.045, null, 0.12); },
  aggro() { [880, 660, 880, 660].forEach((f, i) => this.tone(f, 0.09, 'square', 0.045, null, i * 0.1)); },
  pulse() { this.tone(196, 0.9, 'sine', 0.09); this.tone(294, 0.9, 'sine', 0.05); },
  thud() { this.noise(0.1, 0.13, 220); this.tone(95, 0.12, 'sine', 0.09, 60); },
  slam() { this.noise(0.45, 0.34, 260); this.tone(70, 0.5, 'sawtooth', 0.08, 38); },
  sing() { [220, 262, 330, 392].forEach((f, i) => this.tone(f, 0.7, 'triangle', 0.035, f * 0.94, i * 0.05)); },
  shove() { this.noise(0.25, 0.18, 900, 'bandpass'); this.tone(140, 0.25, 'square', 0.05, 70); },
  absorb() { this.tone(1046, 0.09, 'sine', 0.05, 1568); },
  pop() { this.tone(1320, 0.12, 'triangle', 0.04, 520); this.noise(0.08, 0.05, 3000, 'highpass'); },
  frost() { this.noise(0.3, 0.08, 5000, 'highpass'); this.tone(1760, 0.3, 'triangle', 0.03, 2350); },
  heal() { this.tone(784, 0.14, 'sine', 0.03, 1046); },
  count() { this.tone(880, 0.06, 'square', 0.035); },
  now() { this.tone(1320, 0.1, 'square', 0.05); },
  nope() { this.tone(220, 0.08, 'square', 0.03, 180); },
  win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.08, null, i * 0.12)); },
  epic() { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.08, null, i * 0.1)); this.noise(0.7, 0.06, 6000, 'highpass', 0.55); },
  wipe() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.45, 'sawtooth', 0.045, null, i * 0.2)); },
  tick() { this.tone(1400, 0.025, 'square', 0.018); }
};

/* ---------- elements ---------- */
const el = {
  game: $('game'), world: $('world'), bossWrap: $('boss-wrap'), bossPose: $('boss-pose'), bossShake: $('boss-shake'), notes: $('notes'), fx: $('fx'), aggroLine: $('aggro-line'),
  bossHp: $('boss-hp'), bossTrail: $('boss-trail'), bossPct: $('boss-pct'), cast: $('cast'), castFill: $('cast-fill'), castName: $('cast-name'), bfTarget: $('bf-target'), bfTargetName: $('bf-target-name'),
  song: $('song'), songTag: $('song-tag'), phaseTag: $('phase-tag'), banner: $('banner'), call: $('call'),
  meHp: $('me-hp'), meAbs: $('me-abs'), rageNum: $('rage-num'), rageBar: $('rage-bar'), threat: $('threat'), threatLbl: $('threat-lbl'), threatBar: $('threat-bar'),
  pulseBar: $('pulse-bar'), pulseTime: $('pulse-time'), overlay: $('overlay'), card: $('ov-card'), soundBtn: $('sound-btn'), restartBtn: $('restart-btn')
};
const slots = {}, frames = {};
MEMBERS.forEach((m) => {
  const s = $('h-' + m), f = $('f-' + m);
  slots[m] = { root: s, art: s.querySelector('.art'), hp: s.querySelector('.hp i'), say: s.querySelector('.say'), sayTimer: 0 };
  frames[m] = { root: f, hp: f.querySelector('.hpf'), abs: f.querySelector('.abs') };
});
const abs = {};
['chop', 'overhead', 'shout', 'taunt', 'shatter', 'ult'].forEach((k) => {
  const b = $('ab-' + k);
  abs[k] = { b, sweep: b.querySelector('.sweep'), cdn: b.querySelector('.cdn') };
});

/* ---------- state ---------- */
let S = null;
function fresh() {
  const shield = {}, threat = {};
  MEMBERS.forEach((m) => { shield[m] = { amt: 0, until: -9 }; threat[m] = 0; });
  return {
    t: 0, running: false, freeze: 0, pending: [],
    boss: { hp: C.BOSS_HP, phase: 1, cast: null, frozenUntil: -9, auto: 2.2, target: 'brannoc', forced: 0, shoveNext: rand(9, 11), shoveAt: null },
    hp: { brannoc: 100, ivy: 100, maren: 100, wren: 100, tomas: 100 }, shield, threat,
    rage: 15, cd: { chop: 0, overhead: 0, taunt: 0, gcd: 0 },
    shoutFor: -1, shatterFor: -1, ultUsed: false, markUntil: -9,
    resolved: 0, casts: {}, kicked: {}, kickTried: {}, counted: {}, marked: {}, frost: {},
    tm: { auto: 0.6, ivy: C.BOT_START, wren: C.BOT_START + 0.3, tomas: C.BOT_START + 0.6, heal: 1.5, bigHealAt: 0, note: 0.5 },
    reviveUsed: false, revive: null,
    meter: { brannoc: 0, ivy: 0, wren: 0, tomas: 0 }, healing: 0,
    stats: { crits: 0, best: 0, perfects: 0, shatters: 0, freezes: 0, taunts: 0, losses: 0, absorbed: 0, bigHits: 0 },
    lastCall: '', endReason: ''
  };
}
const alive = (m) => S.hp[m] > 0;
const later = (sec, fn) => S.pending.push({ at: S.t + sec, fn });

/* ---------- geometry and effects ---------- */
function gameBox() { return el.game.getBoundingClientRect(); }
function ptOf(node, fy) {
  const r = node.getBoundingClientRect(), g = gameBox();
  return [r.left - g.left + r.width / 2, r.top - g.top + r.height * fy];
}
const bossPt = (fy) => ptOf(el.bossShake, fy === undefined ? 0.42 : fy);
const heroPt = (m, fy) => ptOf(slots[m].art, fy === undefined ? 0.35 : fy);
function fxEl(cls, x, y, html) {
  const d = document.createElement('div');
  d.className = 'fx-' + cls;
  d.style.left = x + 'px';
  d.style.top = y + 'px';
  if (html) d.innerHTML = html;
  el.fx.appendChild(d);
  return d;
}
function floater(text, kind, x, y, label) {
  const d = fxEl('num ' + (kind || ''), x, y);
  d.textContent = text;
  if (label) { const s = document.createElement('small'); s.textContent = label; d.appendChild(s); }
  setTimeout(() => d.remove(), 1900);
}
const SLASH = {
  chop: '<svg viewBox="0 0 120 120"><path d="M18 100 C40 64 70 34 106 16" style="fill: none; stroke: #1E1A1A; stroke-width: 15; stroke-linecap: round"/><path d="M18 100 C40 64 70 34 106 16" style="fill: none; stroke: #FFF3D6; stroke-width: 8; stroke-linecap: round"/></svg>',
  over: '<svg viewBox="0 0 120 120"><path d="M60 6 C74 40 74 80 60 114" style="fill: none; stroke: #1E1A1A; stroke-width: 19; stroke-linecap: round"/><path d="M60 6 C74 40 74 80 60 114" style="fill: none; stroke: #FFD9B8; stroke-width: 11; stroke-linecap: round"/><path d="M44 20 C54 50 54 74 46 100" style="fill: none; stroke: #FF8A4C; stroke-width: 5; stroke-linecap: round"/></svg>',
  big: '<svg viewBox="0 0 120 120"><path d="M14 14 L106 106 M106 14 L14 106" style="fill: none; stroke: #1E1A1A; stroke-width: 20; stroke-linecap: round"/><path d="M14 14 L106 106 M106 14 L14 106" style="fill: none; stroke: #E9DEFF; stroke-width: 11; stroke-linecap: round"/><circle cx="60" cy="60" r="16" style="fill: #B79CFF; stroke: #1E1A1A; stroke-width: 4"/></svg>',
  shatter: '<svg viewBox="0 0 120 120"><path d="M60 8 L66 50 L108 40 L72 66 L96 106 L60 78 L22 104 L46 66 L10 44 L54 50 Z" style="fill: #DDF3FF; stroke: #1E1A1A; stroke-width: 5; stroke-linejoin: round"/></svg>',
  boss: '<svg viewBox="0 0 120 120"><path d="M14 30 C50 40 80 70 96 108" style="fill: none; stroke: #1E1A1A; stroke-width: 16; stroke-linecap: round"/><path d="M14 30 C50 40 80 70 96 108" style="fill: none; stroke: #FF6B5E; stroke-width: 8; stroke-linecap: round"/></svg>',
  wren: '<svg viewBox="0 0 120 120"><path d="M20 30 L100 90 M30 96 L96 24" style="fill: none; stroke: #1E1A1A; stroke-width: 12; stroke-linecap: round"/><path d="M20 30 L100 90 M30 96 L96 24" style="fill: none; stroke: #E6DCFF; stroke-width: 6; stroke-linecap: round"/></svg>'
};
function slash(x, y, kind, rot) {
  const d = fxEl('slash ' + (kind === 'big' ? 'big' : kind === 'boss' ? 'boss' : ''), x, y, SLASH[kind]);
  d.style.setProperty('--rot', (rot === undefined ? rand(-20, 20) : rot) + 'deg');
  setTimeout(() => d.remove(), 420);
}
function ring(x, y, color, size, ms) {
  const d = fxEl('ring', x, y);
  d.style.setProperty('--c', color);
  d.style.setProperty('--s', size + 'px');
  d.style.animationDuration = (ms || 700) + 'ms';
  setTimeout(() => d.remove(), (ms || 700) + 60);
}
function sparks(x, y, color, n, reach) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const s = fxEl('spark', x, y);
    s.style.background = color;
    const a = rand(0, Math.PI * 2), r = rand(reach * 0.5, reach);
    const anim = s.animate([{ transform: 'translate(-50%, -50%)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + (Math.cos(a) * r).toFixed(0) + 'px), calc(-50% + ' + (Math.sin(a) * r).toFixed(0) + 'px)) scale(0.6)', opacity: 0 }], { duration: rand(320, 560), easing: 'cubic-bezier(.2,.7,.3,1)' });
    anim.onfinish = () => s.remove();
    setTimeout(() => s.remove(), 900);
  }
}
const PROJ = {
  frost: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" style="fill: #8FD6FF; stroke: #1E1A1A; stroke-width: 2.5"/><circle cx="7.5" cy="7.5" r="2.5" style="fill: #F4FCFF"/></svg>',
  arrow: '<svg viewBox="0 0 40 10"><path d="M2 5 H32" style="fill: none; stroke: #1E1A1A; stroke-width: 4.5; stroke-linecap: round"/><path d="M2 5 H32" style="fill: none; stroke: #C9963A; stroke-width: 2; stroke-linecap: round"/><path d="M30 1 L39 5 L30 9 Z" style="fill: #DCE2E8; stroke: #1E1A1A; stroke-width: 1.5; stroke-linejoin: round"/><path d="M2 5 L-2 1 M2 5 L-2 9" style="fill: none; stroke: #9BD068; stroke-width: 2.5; stroke-linecap: round"/></svg>',
  holy: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" style="fill: #F4B942; stroke: #1E1A1A; stroke-width: 2.5"/></svg>'
};
function projectile(from, to, kind, ms) {
  const [x0, y0] = from, [x1, y1] = to;
  const d = fxEl('proj', x0, y0, PROJ[kind]);
  if (kind === 'arrow') { d.style.width = '34px'; d.style.height = '9px'; }
  const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  const anim = d.animate([{ transform: 'translate(-50%, -50%) rotate(' + ang + 'deg)' }, { transform: 'translate(calc(-50% + ' + (x1 - x0).toFixed(0) + 'px), calc(-50% + ' + (y1 - y0).toFixed(0) + 'px)) rotate(' + ang + 'deg)' }], { duration: ms, easing: 'linear' });
  anim.onfinish = () => d.remove();
  setTimeout(() => d.remove(), ms + 200);
}
function crack(x, y) {
  const d = fxEl('crack', x, y, '<svg viewBox="0 0 140 50"><path d="M70 25 L40 10 L18 18 M70 25 L32 34 L8 30 M70 25 L104 8 L128 16 M70 25 L110 38 L134 34 M70 25 L74 48" style="fill: none; stroke: #1E1A1A; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round"/><path d="M70 25 L40 10 L18 18 M70 25 L32 34 L8 30 M70 25 L104 8 L128 16 M70 25 L110 38 L134 34 M70 25 L74 48" style="fill: none; stroke: #FF8A4C; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round"/></svg>');
  setTimeout(() => d.remove(), 1500);
}
function flash(node, cls, ms) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); setTimeout(() => node.classList.remove(cls), ms); }
function shake(size) { if (!reduceMotion) flash(el.world, 'shake-' + size, size === 'l' ? 460 : size === 'm' ? 320 : 200); }
function pose(name, ms) { el.bossPose.classList.remove('windup', 'shove-wind', 'atk', 'slam', 'shove', 'burst'); void el.bossPose.offsetWidth; el.bossPose.classList.add(name); if (ms) setTimeout(() => el.bossPose.classList.remove(name), ms); }
function say(m, text, ms) {
  const s = slots[m];
  s.say.textContent = text;
  s.say.classList.add('on');
  clearTimeout(s.sayTimer);
  s.sayTimer = setTimeout(() => s.say.classList.remove('on'), ms || 1400);
}
let bannerTimer = 0;
function banner(text, kind, ms) {
  el.banner.textContent = text;
  el.banner.className = 'banner show ' + (kind || '');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { el.banner.className = 'banner ' + (kind || ''); }, ms || 1600);
}
function spawnNote(fast) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  n.setAttribute('viewBox', '0 0 24 24');
  n.setAttribute('class', 'note');
  n.setAttribute('aria-hidden', 'true');
  n.innerHTML = '<ellipse cx="8" cy="18" rx="5.5" ry="4.2" style="fill: #F6E9D2; stroke: #1E1A1A; stroke-width: 1.6"/><path d="M13 18 V4 L21 7" style="fill: none; stroke: #1E1A1A; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round"/><path d="M13 18 V4 L21 7" style="fill: none; stroke: #F6E9D2; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round"/>';
  n.style.setProperty('--dx', (Math.random() < 0.5 ? -1 : 1) * rand(20, 80) + 'px');
  n.style.setProperty('--rot', rand(-25, 25) + 'deg');
  n.style.left = rand(-10, 10) + 'px';
  if (fast) n.style.animationDuration = '1.5s';
  el.notes.appendChild(n);
  setTimeout(() => n.remove(), 2600);
}

/* ---------- threat ---------- */
function addThreat(m, amount) { S.threat[m] += amount * THREAT[m]; }
function topThreat(exclude) {
  let top = null, v = -1;
  MEMBERS.forEach((m) => { if (m !== exclude && alive(m) && S.threat[m] > v) { v = S.threat[m]; top = m; } });
  return [top, v];
}
function setTarget(m) {
  const prev = S.boss.target;
  if (prev === m) return;
  S.boss.target = m;
  if (m !== 'brannoc' && prev === 'brannoc') {
    S.stats.losses++;
    banner('He turns on ' + NAMES[m] + '!', 'warn', 1500);
    Sound.aggro();
  } else if (m === 'brannoc') {
    banner('He’s back on you.', 'good', 1100);
  }
}
function checkTarget() {
  const b = S.boss;
  if (S.t < b.forced && alive('brannoc')) return;
  const cur = alive(b.target) ? b.target : null;
  const [top, v] = topThreat();
  if (!top) return;
  if (!cur || (top !== cur && v > C.PULL * S.threat[cur])) setTarget(top);
}

/* ---------- damage, shields, healing ---------- */
function dealBoss(who, amount, opts) {
  if (!S.running) return;
  opts = opts || {};
  amount = Math.round(amount);
  S.boss.hp = Math.max(0, S.boss.hp - amount);
  S.meter[who] += amount;
  addThreat(who, amount);
  if (who === 'brannoc') {
    if (opts.crit) S.stats.crits++;
    if (amount > S.stats.best) S.stats.best = amount;
    const [x, y] = bossPt(0.42);
    const jx = x + rand(-40, 40), jy = y + rand(-30, 30);
    let kind = opts.crit ? 'crit' : '', label = opts.crit ? 'crit' : '';
    if (opts.kind === 'shatter') { kind = 'shatter'; label = opts.label; }
    if (opts.kind === 'big') { kind = 'big'; label = opts.frozen ? 'frozen smash' : (opts.crit ? 'crit' : 'big swing'); }
    if (opts.weak) label = 'weak point';
    floater(fmt(amount), kind, jx, jy, label);
    if (opts.kind === 'big') { Sound.big(); shake('l'); flash(el.bossShake, 'hit-big', 320); S.freeze = 0.14; sparks(x, y, '#B79CFF', 14, 140); }
    else if (opts.kind === 'shatter') { Sound.shatter(opts.label === 'Perfect'); shake('m'); flash(el.bossShake, 'hit-big', 320); S.freeze = opts.label === 'Perfect' ? 0.1 : 0.05; sparks(x, y, '#DDF3FF', 16, 150); }
    else if (opts.crit) { Sound.crit(); shake('s'); flash(el.bossShake, 'hit', 180); S.freeze = Math.max(S.freeze, 0.05); sparks(x, y, '#F4B942', 8, 90); }
    else if (opts.auto) Sound.soft();
    else { Sound.hit(); flash(el.bossShake, 'hit', 180); }
  } else {
    const [x, y] = bossPt(0.5);
    if (Math.random() < 0.55 || opts.crit) floater(fmt(amount), 'bot' + (opts.crit ? ' crit' : ''), x + rand(-90, 90), y + rand(10, 60));
  }
  if (S.boss.phase === 1 && S.boss.hp <= C.BOSS_HP * 0.5) phaseTwo();
  if (S.boss.hp <= 0) end('win');
}
function hurt(m, amount) {
  if (!S.running || !alive(m)) return 0;
  let a = amount, absorbed = 0;
  const sh = S.shield[m];
  if (sh.amt > 0 && S.t <= sh.until) {
    absorbed = Math.min(sh.amt, a);
    sh.amt -= absorbed;
    a -= absorbed;
    S.stats.absorbed += absorbed;
    const [x, y] = heroPt(m, 0.2);
    floater('Absorbed ' + absorbed, 'absorb', x, y - 10);
    Sound.absorb();
    if (sh.amt <= 0) { sh.until = -9; const [px, py] = heroPt(m, 0.45); ring(px, py, '#9BD068', 120, 420); sparks(px, py, '#CDEFA8', 8, 70); Sound.pop(); }
  }
  if (a > 0) {
    S.hp[m] = Math.max(0, S.hp[m] - a);
    if (m === 'brannoc') S.rage = Math.min(100, S.rage + Math.round(a / 3));
    const [x, y] = heroPt(m, 0.3);
    floater('-' + a, 'hurt', x + rand(-14, 14), y);
    flash(slots[m].root, 'hurt', 320);
    if (S.hp[m] <= 0) down(m);
  }
  return absorbed;
}
function heal(m, amount) {
  if (!alive(m)) return;
  const before = S.hp[m];
  S.hp[m] = Math.min(100, S.hp[m] + amount);
  const got = S.hp[m] - before;
  if (got > 0) {
    S.healing += got;
    addThreat('maren', got * 25);
    const [x, y] = heroPt(m, 0.3);
    floater('+' + got, 'heal', x, y - 6);
    if (got >= 20) sparks(x, y, '#9BD068', 8, 50);
  }
}
function down(m) {
  if (m === 'brannoc') { S.endReason = 'tank'; end('wipe'); return; }
  banner(NAMES[m] + ' is down!', 'warn', 1500);
  S.threat[m] = 0;
  checkTarget();
  if (!S.reviveUsed && alive('maren') && m !== 'maren' && !S.revive) S.revive = { m, at: S.t + 5 };
}

/* ---------- boss ---------- */
function phaseTwo() {
  S.boss.phase = 2;
  el.bossWrap.classList.add('phase2');
  el.phaseTag.textContent = 'Phase two';
  banner('Phase two! He stands up. No more kicking the Dirge.', 'warn', 2600);
  Sound.warn();
}
function startCast(n) {
  const move = n % 2 === 1 ? 'cleave' : 'dirge';
  S.casts[n] = move;
  S.boss.cast = { move, n, start: S.t, end: n * C.PULSE };
  el.cast.classList.remove('kicked');
  if (move === 'cleave') { pose('windup'); el.bossWrap.classList.add('cleaving'); banner('Grave Cleave incoming! Shout now.', 'gold', 1800); }
  else { el.bossWrap.classList.add('singing'); banner(S.boss.phase === 1 && alive('wren') ? 'Dirge of the Dead! Wren’s on the kick.' : 'Dirge of the Dead! Can’t kick it now.', 'gold', 1800); }
}
function tryKick(n) {
  S.kickTried[n] = true;
  const [bx, by] = bossPt(0.35);
  flash(slots.wren.root, 'dash', 440);
  say('wren', 'Kick!', 900);
  if (Math.random() < 0.75) {
    S.kicked[n] = true;
    el.cast.classList.add('kicked');
    el.castName.textContent = 'Interrupted';
    el.bossWrap.classList.remove('singing');
    later(0.15, () => { slash(bx, by, 'wren', 0); sparks(bx, by, '#B79CFF', 10, 90); banner('Wren kicked it!', 'good', 1300); Sound.taunt(); });
  } else {
    later(0.15, () => { banner('Wren missed the kick!', 'warn', 1300); Sound.warn(); say('wren', 'Missed!', 900); });
  }
}
function resolvePulse(n) {
  const move = S.casts[n];
  S.boss.cast = null;
  el.bossWrap.classList.remove('singing', 'cleaving');
  Sound.pulse();
  if (move && !S.kicked[n]) {
    if (move === 'cleave') {
      pose('slam', 440);
      const tgt = alive(S.boss.target) ? S.boss.target : 'brannoc';
      later(0.12, () => {
        const [x, y] = heroPt(tgt, 0.55);
        ring(x, y + 30, '#FF8A4C', 220, 600);
        crack(x, y + 50);
        Sound.slam();
        shake('m');
        const ab = hurt(tgt, 56);
        if (S.running) banner(ab >= 30 ? 'Your shield soaked half of it.' : 'Grave Cleave hits ' + (tgt === 'brannoc' ? 'you' : NAMES[tgt]) + ' hard!', ab >= 30 ? 'good' : 'warn', 1500);
      });
    } else {
      pose('burst', 520);
      Sound.sing();
      const [x, y] = bossPt(0.34);
      ring(x, y, '#9BD068', Math.max(gameBox().width, gameBox().height) * 1.1, 900);
      let soaked = 0, hits = 0;
      MEMBERS.forEach((m, i) => later(0.12 + i * 0.06, () => { if (!alive(m)) return; hits++; soaked += hurt(m, 30) >= 30 ? 1 : 0; }));
      later(0.5, () => { if (S.running) banner(soaked >= 3 ? 'The Dirge hits your shields.' : 'The Dirge hits everyone!', soaked >= 3 ? 'good' : 'warn', 1500); });
    }
  } else {
    pose('atk', 300);
  }
  if (alive('ivy')) {
    S.boss.frozenUntil = n * C.PULSE + C.FROZEN;
    if (!S.frost[n]) S.stats.freezes++;
    S.frost[n] = true;
    const [x, y] = bossPt(0.45);
    ring(x, y, '#8FD6FF', 260, 600);
    Sound.frost();
  }
}
function bossAuto() {
  const b = S.boss, m = b.target;
  if (!alive(m)) return;
  pose('atk', 300);
  later(0.14, () => {
    if (!alive(m)) return;
    const [x, y] = heroPt(m, 0.4);
    slash(x, y, 'boss');
    Sound.thud();
    hurt(m, m === 'brannoc' ? (b.phase === 2 ? 5 : 4) : (b.phase === 2 ? 30 : 26));
  });
}
function shove() {
  const b = S.boss;
  b.shoveAt = null;
  b.shoveNext = S.t + (b.phase === 2 ? rand(17, 22) : rand(24, 30));
  pose('shove', 440);
  Sound.shove();
  later(0.14, () => {
    if (!alive('brannoc')) return;
    flash(slots.brannoc.root, 'knocked', 720);
    const [x, y] = heroPt('brannoc', 0.1);
    floater('Threat wiped', 'alert', x, y - 20);
    hurt('brannoc', 8);
    S.threat.brannoc = 0;
    checkTarget();
  });
}

/* ---------- your buttons ---------- */
function weakPoint() { if (S.t <= S.markUntil) { S.markUntil = -9; return true; } return false; }
function swing(kind) {
  flash(slots.brannoc.root, kind === 'big' || kind === 'over' ? 'lunge-big' : 'lunge', kind === 'big' ? 340 : 220);
  const [x, y] = bossPt(0.45);
  slash(x + rand(-30, 30), y + rand(-30, 20), kind);
}
function act(k) {
  if (!S || !S.running) return;
  const t = S.t;
  if (k === 'chop') {
    if (t < S.cd.chop || t < S.cd.gcd) return Sound.nope();
    const weak = weakPoint(), crit = weak || Math.random() < 0.25;
    let d = irand(270, 330); if (crit) d *= weak ? 2.5 : 2;
    S.cd.chop = t + C.CHOP_CD; S.cd.gcd = t + C.GCD;
    S.rage = Math.min(100, S.rage + 12);
    swing('chop');
    dealBoss('brannoc', d, { crit, weak });
  } else if (k === 'overhead') {
    if (t < S.cd.overhead || t < S.cd.gcd) return Sound.nope();
    if (S.rage < C.OVER_COST) { banner('Not enough rage. Chop builds it.', 'warn', 1000); return Sound.nope(); }
    const weak = weakPoint(), crit = weak || Math.random() < 0.35;
    let d = irand(760, 880); if (crit) d *= weak ? 2.5 : 2;
    S.rage -= C.OVER_COST;
    S.cd.overhead = t + C.OVER_CD; S.cd.gcd = t + C.GCD;
    swing('over');
    dealBoss('brannoc', d, { crit, weak });
  } else if (k === 'shout') {
    const n = Math.floor(t / C.PULSE) + 1;
    if (S.shoutFor === n) return Sound.nope();
    S.shoutFor = n;
    MEMBERS.forEach((m) => { if (alive(m)) S.shield[m] = { amt: C.SHIELD_AMT, until: t + C.SHIELD_TIME }; });
    say('brannoc', 'Shields up!', 1100);
    const [x, y] = heroPt('brannoc', 0.4);
    ring(x, y, '#9BD068', gameBox().width * 0.9, 650);
    Sound.shout();
  } else if (k === 'taunt') {
    if (S.boss.target === 'brannoc') { banner('He’s already on you.', '', 900); return Sound.nope(); }
    if (t < S.cd.taunt) return Sound.nope();
    S.cd.taunt = t + C.TAUNT_CD;
    S.stats.taunts++;
    const [, v] = topThreat('brannoc');
    S.threat.brannoc = Math.max(S.threat.brannoc, v * 1.3);
    S.boss.forced = t + 3;
    say('brannoc', 'Oi! Over here!', 1100);
    const [x, y] = heroPt('brannoc', 0.3);
    ring(x, y, '#F4B942', 200, 500);
    setTarget('brannoc');
    pose('atk', 300);
    Sound.taunt();
  } else if (k === 'shatter') {
    const n = shatterPulse();
    if (n === null) { banner('Shatter only works on Ivy’s Now!', '', 900); return Sound.nope(); }
    S.shatterFor = n;
    if (!S.frost[n]) { S.frost[n] = true; S.stats.freezes++; }
    S.stats.shatters++;
    const d = t - n * C.PULSE, a = Math.abs(d);
    let mult = 1, label = 'Too early';
    if (a <= 0.25) { mult = 3; label = 'Perfect'; S.stats.perfects++; }
    else if (a <= 0.6) { mult = 2; label = 'Good'; }
    else if (d > 0) { mult = 1.3; label = 'Late'; }
    flash(slots.brannoc.root, 'lunge-big', 340);
    const [x, y] = bossPt(0.45);
    slash(x, y, 'shatter', rand(0, 40));
    dealBoss('brannoc', 1500 * mult * rand(0.96, 1.04), { kind: 'shatter', label });
  } else if (k === 'ult') {
    if (S.ultUsed || t < S.cd.gcd) return Sound.nope();
    S.ultUsed = true;
    S.cd.gcd = t + C.GCD;
    const frozen = t <= S.boss.frozenUntil, crit = frozen || Math.random() < 0.5;
    let d = irand(2600, 3000);
    if (crit) d *= 2;
    if (frozen) d *= 2;
    S.stats.bigHits = d;
    swing('big');
    dealBoss('brannoc', d, { kind: 'big', crit, frozen });
  }
  return true;
}
function shatterPulse() {
  const n = Math.round(S.t / C.PULSE), P = n * C.PULSE;
  if (n < 1 || S.shatterFor === n || !alive('ivy')) return null;
  if (S.t < P - C.EARLY || S.t > P + C.FROZEN) return null;
  if (S.t > P && !S.frost[n]) return null;
  return n;
}

/* ---------- the loop ---------- */
function update(dt) {
  S.t += dt;
  const t = S.t, P = C.PULSE;
  if (S.pending.length) {
    const due = S.pending.filter((p) => p.at <= t);
    if (due.length) { S.pending = S.pending.filter((p) => p.at > t); due.forEach((p) => { if (S.running) p.fn(); }); }
  }
  if (!S.running) return;
  const done = Math.floor(t / P);
  while (S.resolved < done && S.running) { S.resolved++; resolvePulse(S.resolved); }
  if (!S.running) return;
  const up = done + 1, c = t - done * P, b = S.boss;

  if (c >= P - C.CAST_LEAD && !S.casts[up]) startCast(up);
  [3, 2, 1].forEach((k) => { const key = up + '-' + k; if (c >= P - k && !S.counted[key]) { S.counted[key] = true; if (alive('ivy')) Sound.count(); } });
  if (!S.counted[done + '-now'] && done >= 1 && c < 0.3) { S.counted[done + '-now'] = true; if (alive('ivy')) Sound.now(); }
  if (alive('ivy') && c >= P - 5 && c < P - 4.9 && !S.counted[up + '-ivy']) { S.counted[up + '-ivy'] = true; say('ivy', 'Freezing him on the pulse!', 2600); }
  if (S.casts[up] === 'dirge' && b.phase === 1 && c >= P - 1.6 && !S.kickTried[up] && alive('wren')) tryKick(up);
  if (c >= 7 && c < 12 && !S.marked[done] && alive('tomas')) {
    S.marked[done] = true;
    S.markUntil = t + 6;
    say('tomas', 'Weak spot!', 1300);
    projectile(heroPt('tomas', 0.3), bossPt(0.52), 'arrow', 240);
    banner('Tomas marks a weak point. Next hit crits!', 'good', 1400);
  }

  if (b.shoveAt === null && t >= b.shoveNext) {
    if (c > P - 5.5 || c < 2 || b.target !== 'brannoc' || b.cast) b.shoveNext = t + 0.5;
    else { b.shoveAt = t + C.SHOVE_WIND; pose('shove-wind'); banner('He raises his boot!', 'gold', 1300); Sound.warn(); }
  }
  if (b.shoveAt !== null && t >= b.shoveAt) shove();
  if (!S.running) return;

  checkTarget();
  b.auto -= dt;
  if (b.auto <= 0) {
    b.auto = 2.0;
    if (!b.cast && b.shoveAt === null) bossAuto();
  }

  S.tm.auto -= dt;
  if (S.tm.auto <= 0) {
    S.tm.auto = 2.4;
    const crit = Math.random() < 0.2;
    S.rage = Math.min(100, S.rage + 6);
    flash(slots.brannoc.root, 'lunge', 220);
    dealBoss('brannoc', irand(150, 190) * (crit ? 2 : 1), { crit, auto: true });
    if (!S.running) return;
  }
  S.tm.ivy -= dt;
  if (S.tm.ivy <= 0) {
    S.tm.ivy = 2.4 * rand(0.9, 1.1);
    if (alive('ivy')) {
      const nuke = Math.random() < 0.07, crit = nuke || Math.random() < 0.3;
      const d = irand(220, 270) * (nuke ? 3.2 : crit ? 2 : 1);
      projectile(heroPt('ivy', 0.18), bossPt(0.45), 'frost', 300);
      later(0.3, () => { if (alive('ivy')) dealBoss('ivy', d, { crit }); });
    }
  }
  S.tm.tomas -= dt;
  if (S.tm.tomas <= 0) {
    S.tm.tomas = 2.1 * rand(0.9, 1.1);
    if (alive('tomas')) {
      const crit = Math.random() < 0.25, d = irand(170, 210) * (crit ? 2 : 1);
      projectile(heroPt('tomas', 0.3), bossPt(0.5), 'arrow', 240);
      later(0.24, () => { if (alive('tomas')) dealBoss('tomas', d, { crit }); });
    }
  }
  S.tm.wren -= dt;
  if (S.tm.wren <= 0) {
    S.tm.wren = 1.5 * rand(0.9, 1.1);
    if (alive('wren')) {
      const crit = Math.random() < 0.3, d = irand(120, 150) * (crit ? 2 : 1);
      flash(slots.wren.root, 'lunge', 220);
      dealBoss('wren', d, { crit });
    }
  }
  if (!S.running) return;

  S.tm.heal -= dt;
  if (S.tm.heal <= 0) {
    S.tm.heal = 1.5;
    if (alive('maren')) {
      const list = MEMBERS.filter((m) => alive(m) && S.hp[m] < 100).sort((x, y) => S.hp[x] - S.hp[y]);
      if (list.length) {
        const m = list[0];
        if (S.hp[m] <= 32 && t >= S.tm.bigHealAt) { heal(m, 30); S.tm.bigHealAt = t + 6; Sound.heal(); say('maren', m === 'maren' ? 'Bless me!' : 'Got you, ' + NAMES[m] + '!', 1200); }
        else heal(m, 7);
      }
    }
  }
  if (S.revive && t >= S.revive.at) {
    const m = S.revive.m;
    S.revive = null;
    if (alive('maren') && !alive(m)) {
      S.reviveUsed = true;
      S.hp[m] = 40;
      say('maren', 'Up you get!', 1300);
      banner('Maren brings ' + NAMES[m] + ' back!', 'good', 1500);
      Sound.heal();
    }
  }
  MEMBERS.forEach((m) => { const sh = S.shield[m]; if (sh.amt > 0 && t > sh.until) { sh.amt = 0; } });
  S.tm.note -= dt;
  if (S.tm.note <= 0) {
    const singing = !!(b.cast && b.cast.move === 'dirge' && !S.kicked[b.cast.n]);
    S.tm.note = singing ? 0.3 : 1.3;
    if (t > b.frozenUntil) spawnNote(singing);
  }
  if (t >= C.ENRAGE) { S.endReason = 'enrage'; end('wipe'); }
}

function render() {
  const t = S.t, P = C.PULSE, done = Math.floor(t / P), c = t - done * P, up = done + 1, b = S.boss;
  el.bossHp.style.width = (b.hp / C.BOSS_HP * 100).toFixed(2) + '%';
  el.bossTrail.style.width = el.bossHp.style.width;
  el.bossPct.textContent = Math.ceil(b.hp / C.BOSS_HP * 100) + '%';
  if (b.cast) {
    el.cast.classList.add('on');
    if (!S.kicked[b.cast.n]) {
      el.castFill.style.width = Math.min(100, (t - b.cast.start) / (b.cast.end - b.cast.start) * 100).toFixed(1) + '%';
      el.castName.textContent = b.cast.move === 'cleave' ? 'Grave Cleave' : 'Dirge of the Dead';
    }
  } else if (b.shoveAt !== null) {
    el.cast.classList.add('on'); el.cast.classList.remove('kicked');
    el.castFill.style.width = Math.min(100, (1 - (b.shoveAt - t) / C.SHOVE_WIND) * 100).toFixed(1) + '%';
    el.castName.textContent = 'Boot';
  } else { el.cast.classList.remove('on'); el.castFill.style.width = '0%'; el.castName.textContent = 'Not casting'; }
  el.bossWrap.classList.toggle('casting', !!b.cast && !S.kicked[b.cast.n]);
  const frozen = t <= b.frozenUntil;
  el.bossWrap.classList.toggle('frozen', frozen);
  el.bossWrap.classList.toggle('marked', t <= S.markUntil);
  const lost = b.target !== 'brannoc' && alive(b.target);
  el.bfTarget.classList.toggle('lost', lost);
  el.bfTargetName.textContent = NAMES[b.target];
  el.game.classList.toggle('alarm', lost && S.running);
  const left = C.ENRAGE - t;
  el.song.textContent = clock(left);
  el.songTag.classList.toggle('late', left < 30);
  el.pulseBar.style.width = (c / P * 100).toFixed(2) + '%';
  el.pulseTime.textContent = (P - c).toFixed(1);

  MEMBERS.forEach((m) => {
    const hp = S.hp[m], s = slots[m], f = frames[m], sh = S.shield[m];
    const shield = sh.amt > 0 && t <= sh.until && hp > 0;
    const targeted = b.target === m && hp > 0;
    s.hp.style.width = hp + '%';
    s.root.classList.toggle('dead', hp <= 0);
    s.root.classList.toggle('low', hp > 0 && hp <= 35);
    s.root.classList.toggle('targeted', targeted);
    s.root.classList.toggle('shielded', shield);
    s.root.classList.toggle('danger', targeted && ((!!b.cast && b.cast.move === 'cleave') || b.shoveAt !== null));
    f.hp.style.width = hp + '%';
    f.abs.style.left = hp + '%';
    f.abs.style.width = (shield ? sh.amt : 0) + '%';
    f.root.classList.toggle('dead', hp <= 0);
    f.root.classList.toggle('low', hp > 0 && hp <= 35);
    f.root.classList.toggle('targeted', targeted);
  });
  el.meHp.style.width = S.hp.brannoc + '%';
  const msh = S.shield.brannoc, mShield = msh.amt > 0 && t <= msh.until;
  el.meAbs.style.left = S.hp.brannoc + '%';
  el.meAbs.style.width = (mShield ? msh.amt : 0) + '%';
  el.rageNum.textContent = S.rage;
  el.rageBar.style.width = S.rage + '%';

  const [top, tv] = topThreat('brannoc');
  let ratio = 0, state = 'safe', label = 'Threat · safe';
  if (lost) { ratio = 1; state = 'lost'; label = 'Lost to ' + NAMES[b.target]; }
  else if (top && S.threat.brannoc > 0) {
    ratio = Math.min(1, tv / (C.PULL * S.threat.brannoc));
    state = ratio > 0.9 ? 'danger' : ratio > 0.7 ? 'close' : 'safe';
    label = state === 'danger' ? NAMES[top] + ' is pulling him' : state === 'close' ? NAMES[top] + ' is close' : 'Threat · safe';
  } else if (top && tv > 0) { ratio = 1; state = 'danger'; label = NAMES[top] + ' is pulling him'; }
  el.threat.className = 'me threat ' + state;
  el.threatLbl.textContent = label;
  el.threatBar.style.width = (ratio * 100).toFixed(1) + '%';

  if (lost) {
    const [x0, y0] = bossPt(0.24), [x1, y1] = heroPt(b.target, 0.15);
    const len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    el.aggroLine.style.transform = 'translate(' + x0.toFixed(0) + 'px, ' + y0.toFixed(0) + 'px) rotate(' + ang.toFixed(1) + 'deg)';
    el.aggroLine.style.width = len.toFixed(0) + 'px';
    el.aggroLine.classList.add('on');
  } else el.aggroLine.classList.remove('on');

  const sp = shatterPulse();
  const bigHitComing = (S.casts[up] ? (S.casts[up] === 'cleave' || !S.kicked[up]) : true);
  const shoutUsed = S.shoutFor === up;
  const shoutProc = !shoutUsed && c >= P - 5 && bigHitComing;
  let call = '', cls = '';
  if (lost) { call = 'TAUNT!<small>He’s on ' + NAMES[b.target] + '</small>'; cls = 'alarm'; }
  else if (sp !== null && (c >= P - 0.3 || c < C.FROZEN + 0.05)) { call = 'NOW!'; cls = 'frost'; }
  else if (alive('ivy') && c >= P - 3) { call = String(Math.ceil(P - c)); cls = 'count'; }
  else if (shoutProc) { call = 'SHOUT!'; cls = 'moss'; }
  if (call !== S.lastCall) {
    S.lastCall = call;
    el.call.innerHTML = call;
    el.call.className = 'call ' + cls;
    if (call) flash(el.call, 'pop', 260);
  }

  const gcdLeft = Math.max(0, S.cd.gcd - t), marked = t <= S.markUntil;
  setAb('chop', Math.max(S.cd.chop - t, gcdLeft), C.CHOP_CD, { proc: marked });
  setAb('overhead', Math.max(S.cd.overhead - t, gcdLeft), C.OVER_CD, { nores: S.rage < C.OVER_COST, proc: marked && S.rage >= C.OVER_COST });
  setAb('shout', shoutUsed ? P - c : 0, P, { proc: shoutProc, hideNum: shoutUsed && P - c > 9 });
  setAb('taunt', Math.max(0, S.cd.taunt - t), C.TAUNT_CD, { dim: !lost, proc: lost });
  if (sp !== null) setAb('shatter', 0, P, { proc: true });
  else setAb('shatter', alive('ivy') ? P - c : 0, P, { dim: true, hideNum: !alive('ivy') || P - c > 5 });
  setAb('ult', S.ultUsed ? 1 : 0, 1, { dim: S.ultUsed, proc: !S.ultUsed && frozen && gcdLeft <= 0, hideNum: true });
}
function setAb(k, left, total, o) {
  const a = abs[k];
  const cooling = left > 0.02;
  a.sweep.style.setProperty('--p', cooling ? Math.min(1, left / total).toFixed(3) : '0');
  a.cdn.textContent = cooling && !o.hideNum && left > C.GCD + 0.02 ? Math.ceil(left) : '';
  a.b.classList.toggle('proc', !!o.proc && !cooling);
  a.b.classList.toggle('dim', !!o.dim && !o.proc);
  a.b.classList.toggle('nores', !!o.nores && !cooling);
}

/* ---------- start, end, loot ---------- */
let raf = 0, last = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  if (!S || !S.running) { last = now; return; }
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) return;
  if (dt > 0.1) dt = 0.1;
  if (S.freeze > 0) { S.freeze -= dt; return; }
  update(dt);
  if (S.running) render();
}
function pull() {
  Sound.init();
  S = fresh();
  el.fx.innerHTML = '';
  el.notes.innerHTML = '';
  el.bossWrap.classList.remove('phase2', 'frozen', 'casting', 'singing', 'marked', 'cleaving');
  el.bossPose.className = 'boss-pose';
  el.phaseTag.textContent = 'Phase one';
  el.overlay.hidden = true;
  S.running = true;
  last = performance.now();
  render();
  banner('The Barrow King wakes up singing.', 'gold', 1800);
  Sound.warn();
}
function end(result) {
  if (!S.running) return;
  S.running = false;
  render();
  el.game.classList.remove('alarm');
  el.aggroLine.classList.remove('on');
  setTimeout(() => (result === 'win' ? showWin() : showWipe()), result === 'win' ? 1000 : 800);
  if (result === 'win') { banner('The Barrow King goes back to sleep.', 'good', 2400); Sound.win(); }
  else { banner(S.endReason === 'enrage' ? 'He finished his song.' : 'Brannoc is down.', 'warn', 2400); Sound.wipe(); }
}
function meterHtml() {
  const rows = ['brannoc', 'ivy', 'wren', 'tomas'].map((m) => [m, S.meter[m]]).sort((a, b) => b[1] - a[1]);
  const top = Math.max(1, rows[0][1]);
  return '<div class="meter" aria-label="Damage done">' + rows.map(([m, v]) =>
    '<div class="row' + (m === 'brannoc' ? ' me' : '') + '"><span class="nm">' + NAMES[m] + '</span><span class="mb"><i style="width:' + (v / top * 100).toFixed(1) + '%"></i></span><span class="val">' + fmt(v) + '</span></div>'
  ).join('') + '<div class="row"><span class="nm">Maren</span><span class="mb"><i style="width:0%"></i></span><span class="val">' + fmt(S.healing) + ' heal</span></div></div>';
}
function chipsHtml() {
  const st = S.stats;
  const items = [['Crits', st.crits], ['Best hit', fmt(st.best)], ['Perfect shatters', st.perfects + ' of ' + st.freezes], ['Lost him', st.losses + ' times'], ['Taunts', st.taunts], ['Shields absorbed', st.absorbed]];
  if (S.ultUsed) items.push(['Big Swing', fmt(st.bigHits)]);
  return '<div class="chips">' + items.map(([k, v]) => '<span class="chip">' + k + ' <b>' + v + '</b></span>').join('') + '</div>';
}
function showWipe() {
  const pct = Math.ceil(S.boss.hp / C.BOSS_HP * 100), st = S.stats;
  let tip = 'More damage. Overhead whenever you have 35 rage, Shatter on Ivy’s Now!, and Big Swing while he’s frozen.';
  if (S.endReason === 'tank') tip = 'You went down. Shout just before the pulse. The shield eats most of Grave Cleave.';
  else if (st.losses - st.taunts >= 2) tip = 'When the screen goes red, hit Taunt straight away. Your party can’t take his hits for long.';
  else if (st.perfects === 0) tip = 'Hit Shatter right on Ivy’s Now! A perfect one is triple damage.';
  else if (!S.ultUsed) tip = 'You never used Big Swing. Save it for a frozen pulse and it hits for over ten thousand.';
  el.card.innerHTML = '<p class="eyebrow">Wipe at ' + clock(S.t) + '</p>' +
    '<h2 id="ov-title">' + (S.endReason === 'enrage' ? 'He finished his song' : 'Brannoc went down') + '</h2>' +
    '<p class="lede">The Barrow King had ' + pct + '% left. Everyone wakes up back at the Last Lantern.</p>' +
    '<p class="tip">' + tip + '</p>' + meterHtml() + chipsHtml() +
    '<button type="button" class="primary" id="again-btn">One more pull</button>';
  el.overlay.hidden = false;
  $('again-btn').addEventListener('click', pull);
  $('again-btn').focus({ preventScroll: true });
}
const DROPS = [
  { name: 'Crown of the Barrow King', rarity: 'Epic', color: '#B79CFF', ink: '#6A4BA3', icon: 'crown', shape: 'hex', meta: 'Epic · helm', who: ['brannoc', 'maren'], odds: 0.3, real: 'Winning it also lets you order the real enamel pin.' },
  { name: 'Ghostlight Lantern', rarity: 'Rare', color: '#8FD6FF', ink: '#2F6FA8', icon: 'lantern', shape: 'square', meta: 'Rare · pet', who: ['brannoc', 'ivy', 'maren', 'wren', 'tomas'], odds: 0.3, real: 'It floats along behind your hero from now on.' },
  { name: 'Wolfhide Bracers', rarity: 'Uncommon', color: '#9BD068', ink: '#3D8B2F', icon: 'bracers', shape: 'diamond', meta: 'Uncommon · wrists', who: ['brannoc', 'wren', 'tomas'], odds: 0.4, real: 'A new look, added to your wardrobe.' }
];
const BOT_WIN = { ivy: 'Ivy wins it. She’ll be insufferable about it.', maren: 'Maren wins it, and says a short prayer about it.', wren: 'Wren wins it. Check your pockets anyway.', tomas: 'Tomas wins it. He’s already named it.' };
const LOOT_ICONS = {"crown": "<svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"25\" r=\"22\" style=\"fill: #B79CFF; opacity: 0.32\"/><path d=\"M8 33 L7 16 L16 24 L24 10 L32 24 L41 16 L40 33 Z\" style=\"fill: #F2C230; stroke: #1E1A1A; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round\"/><path d=\"M13 21 L15 30 M35 21 L33 30\" style=\"fill: none; stroke: #FFE08A; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round\"/><path d=\"M7 32 H41 V39 C41 40.5 40 41 38.5 41 H9.5 C8 41 7 40.5 7 39 Z\" style=\"fill: #E0A82A; stroke: #1E1A1A; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round\"/><circle cx=\"7\" cy=\"15\" r=\"2.6\" style=\"fill: #F2C230; stroke: #1E1A1A; stroke-width: 2\"/><circle cx=\"24\" cy=\"9\" r=\"3\" style=\"fill: #F2C230; stroke: #1E1A1A; stroke-width: 2\"/><circle cx=\"41\" cy=\"15\" r=\"2.6\" style=\"fill: #F2C230; stroke: #1E1A1A; stroke-width: 2\"/><circle cx=\"15\" cy=\"36.5\" r=\"2.3\" style=\"fill: #E04A3F; stroke: #1E1A1A; stroke-width: 1.8\"/><circle cx=\"24\" cy=\"36.5\" r=\"2.6\" style=\"fill: #9BE15D; stroke: #1E1A1A; stroke-width: 1.8\"/><circle cx=\"33\" cy=\"36.5\" r=\"2.3\" style=\"fill: #4F86C6; stroke: #1E1A1A; stroke-width: 1.8\"/><path d=\"M24 18 L27 23 L24 28 L21 23 Z\" style=\"fill: #B79CFF; stroke: #1E1A1A; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round\"/></svg>", "lantern": "<svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"25\" r=\"22\" style=\"fill: #8FD6FF; opacity: 0.32\"/><path d=\"M18 11 C18 4 30 4 30 11\" style=\"fill: none; stroke: #1E1A1A; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round\"/><path d=\"M14 12 H34 L31 17 H17 Z\" style=\"fill: #7D8FA3; stroke: #1E1A1A; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round\"/><path d=\"M16 17 H32 V35 H16 Z\" style=\"fill: #DDF3FF; stroke: #1E1A1A; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round\"/><path d=\"M24 19.5 C28.5 19.5 29.5 23.5 29.5 27 V33 L27.5 31.2 L25.8 33 L24 31.2 L22.2 33 L20.5 31.2 L18.5 33 V27 C18.5 23.5 19.5 19.5 24 19.5 Z\" style=\"fill: #8FD6FF; stroke: #1E1A1A; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round\"/><circle cx=\"22\" cy=\"25.5\" r=\"1.1\" style=\"fill: #1E1A1A; stroke: #1E1A1A; stroke-width: 0\"/><circle cx=\"26\" cy=\"25.5\" r=\"1.1\" style=\"fill: #1E1A1A; stroke: #1E1A1A; stroke-width: 0\"/><path d=\"M22.5 28.6 C23.5 29.4 24.5 29.4 25.5 28.6\" style=\"fill: none; stroke: #1E1A1A; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round\"/><path d=\"M14 35 H34 L32 40 H16 Z\" style=\"fill: #7D8FA3; stroke: #1E1A1A; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round\"/><path d=\"M19 15 H29\" style=\"fill: none; stroke: #B8C6D6; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round\"/></svg>", "bracers": "<svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"25\" r=\"22\" style=\"fill: #9BD068; opacity: 0.32\"/><g transform=\"rotate(-32 24 25)\"><path d=\"M11 14 C21 14 31 16.5 39 19 C41.5 22.5 41.5 27.5 39 31 C31 33.5 21 36 11 36 C8 31 8 19 11 14 Z\" style=\"fill: #8A5A34; stroke: #1E1A1A; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round\"/><path d=\"M38.2 19.6 C36.4 23 36.4 27.2 38.2 30.4\" style=\"fill: none; stroke: #5E3A20; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round\"/><path d=\"M14.5 25 L18.5 21.2 L22.5 25 L26.5 21.6 L30.5 25 L34.5 22 M14.5 25 L18.5 28.8 L22.5 25 L26.5 28.4 L30.5 25 L34.5 28\" style=\"fill: none; stroke: #1E1A1A; stroke-width: 3.8; stroke-linejoin: round; stroke-linecap: round\"/><path d=\"M14.5 25 L18.5 21.2 L22.5 25 L26.5 21.6 L30.5 25 L34.5 22 M14.5 25 L18.5 28.8 L22.5 25 L26.5 28.4 L30.5 25 L34.5 28\" style=\"fill: none; stroke: #F3E6CC; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round\"/><circle cx=\"33\" cy=\"18.6\" r=\"1.9\" style=\"fill: #F2C230; stroke: #1E1A1A; stroke-width: 1.6\"/><circle cx=\"33\" cy=\"31.4\" r=\"1.9\" style=\"fill: #F2C230; stroke: #1E1A1A; stroke-width: 1.6\"/><path d=\"M13 10 C9 9.5 6 12.5 7.2 15.5 C4.4 17.5 5 21.5 7 22.8 C4.4 25.5 5 29.5 7.2 30.8 C5.5 34 7.6 38 11.5 38 C12.8 40 16 39.4 15.6 36.8 C11.6 30.5 11.6 18.5 15.6 12.4 C15.8 10.2 14.6 9.4 13 10 Z\" style=\"fill: #C9C2B4; stroke: #1E1A1A; stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round\"/><path d=\"M9.6 17.5 L11.2 18.4 M9.4 25 L11.2 25.2 M9.8 32.2 L11.4 31.4\" style=\"fill: none; stroke: #8E877A; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round\"/></g></svg>"};
function shapeSvg(d) {
  if (d.icon && LOOT_ICONS[d.icon]) return LOOT_ICONS[d.icon];
  const st = 'style="fill: ' + d.color + '; stroke: #1E1A1A; stroke-width: 2.5; stroke-linejoin: round"';
  if (d.shape === 'hex') return '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 2 L32 10 V26 L18 34 L4 26 V10 Z" ' + st + '/></svg>';
  if (d.shape === 'square') return '<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="5" y="5" width="26" height="26" rx="3" ' + st + '/></svg>';
  return '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3 L33 18 L18 33 L3 18 Z" ' + st + '/></svg>';
}
function showWin() {
  let r = Math.random(), drop = DROPS[DROPS.length - 1];
  for (const d of DROPS) { if ((r -= d.odds) <= 0) { drop = d; break; } }
  const mvp = ['brannoc', 'ivy', 'wren', 'tomas'].sort((a, b) => S.meter[b] - S.meter[a])[0];
  const rolls = drop.who.map((m) => ({ m, v: irand(1, 100) + (m === mvp ? 10 : 0), tie: Math.random() }));
  rolls.sort((a, b) => (b.v - a.v) || (b.tie - a.tie));
  const winner = rolls[0].m;
  el.card.innerHTML = '<p class="eyebrow">Raid I cleared in ' + clock(S.t) + '</p>' +
    '<h2 id="ov-title">The Barrow King sleeps again</h2>' + meterHtml() + chipsHtml() +
    '<div class="loot"><div class="item">' + shapeSvg(drop) + '<div><div class="it-name">' + drop.name + '</div><div class="it-meta" style="color:' + (drop.ink || drop.color) + '">' + drop.meta + '</div></div></div>' +
    '<ul class="rolls">' + drop.who.map((m) => '<li id="r-' + m + '"><span class="rn">' + NAMES[m] + '</span><span class="rv">0</span><span class="rx">' + (m === mvp ? '+10 top damage' : '') + '</span></li>').join('') + '</ul>' +
    '<p class="loot-result" id="loot-result">Rolling…</p></div>' +
    '<button type="button" class="primary" id="again-btn">One more pull</button>';
  el.overlay.hidden = false;
  $('again-btn').addEventListener('click', pull);
  const t0 = performance.now(), D = 1500;
  const spin = () => {
    const k = (performance.now() - t0) / D;
    rolls.forEach((ro) => { const li = $('r-' + ro.m); if (li) li.querySelector('.rv').textContent = k >= 1 ? ro.v : irand(1, 100); });
    if (k < 1) { if (Math.random() < 0.5) Sound.tick(); requestAnimationFrame(spin); return; }
    const li = $('r-' + winner); if (li) li.classList.add('win');
    const res = $('loot-result');
    if (!res) return;
    if (winner === 'brannoc') {
      res.textContent = 'It’s yours. Brannoc puts it on straight away. ' + drop.real;
      if (drop.rarity === 'Epic') { res.classList.add('epic'); Sound.epic(); } else Sound.win();
    } else res.textContent = BOT_WIN[winner];
  };
  requestAnimationFrame(spin);
}

/* ---------- input ---------- */
function use(k) {
  const b = abs[k].b;
  flash(b, 'pressed', 110);
  if (act(k) === true) flash(b, 'fired', 300); else if (S && S.running) flash(b, 'nope', 280);
}
Object.keys(abs).forEach((k) => {
  const b = abs[k].b;
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); use(k); });
  b.addEventListener('click', (e) => { if (e.detail === 0) use(k); });
});
const KEYS = { Digit1: 'chop', Digit2: 'overhead', Digit3: 'shout', Digit4: 'taunt', Digit5: 'shatter', Space: 'shatter', Digit6: 'ult', Numpad1: 'chop', Numpad2: 'overhead', Numpad3: 'shout', Numpad4: 'taunt', Numpad5: 'shatter', Numpad6: 'ult' };
document.addEventListener('keydown', (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = KEYS[e.code];
  if (!k || !S || !S.running) return;
  e.preventDefault();
  use(k);
});
$('pull-btn').addEventListener('click', pull);
el.restartBtn.addEventListener('click', () => { if (S) S.running = false; pull(); });
function paintSound() {
  el.soundBtn.setAttribute('aria-pressed', Sound.on ? 'true' : 'false');
  el.soundBtn.setAttribute('aria-label', Sound.on ? 'Sound on' : 'Sound off');
  $('sound-waves').style.display = Sound.on ? '' : 'none';
  $('sound-off').style.display = Sound.on ? 'none' : '';
}
el.soundBtn.addEventListener('click', () => {
  Sound.on = !Sound.on;
  Sound.init();
  try { localStorage.setItem('barrow-sound', Sound.on ? 'on' : 'off'); } catch (e) {}
  paintSound();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S && S.running) {
    S.running = false;
    el.card.innerHTML = '<p class="eyebrow">Paused at ' + clock(S.t) + '</p><h2 id="ov-title">The king will wait</h2><p class="lede">He’s mid-verse, but he’ll hold the note.</p><button type="button" class="primary" id="resume-btn">Back to the fight</button>';
    el.overlay.hidden = false;
    $('resume-btn').addEventListener('click', () => { el.overlay.hidden = true; S.running = true; last = performance.now(); Sound.init(); });
  }
});

/* first frame: everyone in place, full health */
function boot(data) {
  try { if (localStorage.getItem('barrow-sound') === 'off') Sound.on = false; } catch (e) {}
  if (data && data.sound === 'off') Sound.on = false;
  paintSound();
  S = fresh();
  render();
  raf = requestAnimationFrame(frame);
}
const hot = window.claude && window.claude.hot;
if (hot && typeof hot.snapshot === 'function') { try { hot.snapshot(() => ({ sound: Sound.on ? 'on' : 'off' })); } catch (e) {} }
if (hot && typeof hot.ready === 'function') hot.ready(boot); else boot((hot && hot.data) || {});
})();
