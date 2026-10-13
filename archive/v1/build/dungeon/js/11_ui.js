/* ---------- UI: the HUD, the screens, hints, gear and the loot roll ---------- */
const SAVE_KEY = 'highfell.crypt.v1';
const G = { save: null, role: 'tank', tier: 'mine', start: 'entrance', touch: false };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtT = (t) => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const fmtN = (n) => Math.round(n).toLocaleString('en-AU');
const ROLE_ICON = { tank: 'shield', healer: 'mend', dps: 'blizzard' };

function loadSave() {
  const fresh = { gear: {}, runs: 0, clears: 0, best: null, role: 'tank' };
  for (const r of ORDER) { fresh.gear[r] = {}; for (const [slot] of SLOTS[r]) fresh.gear[r][slot] = { rar: 0, trait: null }; }
  let d = null;
  try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { d = null; }
  if (d && d.gear) {
    for (const r of ORDER) for (const [slot] of SLOTS[r]) {
      const it = d.gear[r] && d.gear[r][slot];
      if (it && it.rar >= 0 && it.rar <= 3) { const ok = it.rar === 3 && TRAITS[r][slot].some((t) => t[0] === it.trait); fresh.gear[r][slot] = { rar: it.rar | 0, trait: ok ? it.trait : it.rar === 3 ? TRAITS[r][slot][0][0] : null }; }
    }
    fresh.runs = d.runs | 0; fresh.clears = d.clears | 0; fresh.best = typeof d.best === 'number' ? d.best : null;
    if (ORDER.includes(d.role)) fresh.role = d.role;
  }
  return fresh;
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) { /* private window: progress just won't stick */ } }
function savedSet(role) { const s = {}; for (const [slot] of SLOTS[role]) { const it = G.save.gear[role][slot]; s[slot] = makeItem(role, slot, it.rar, it.trait); } return s; }
function avgRar(role) { const v = Object.values(G.save.gear[role]); return Math.round(v.reduce((a, it) => a + it.rar, 0) / v.length); }

function tileSvg(name, cls) { return (TILES[name] || '').replace('<svg ', `<svg class="${cls || 'tl'}" `); }

const UI = {
  hintKey: null, hintT: 0, hintsDone: new Set(), lastFrame: {}, ctx: null,
  inGame() { return !!S && !$('ov-start').hidden === false && $('hud').hidden === false; },
  audioKick() { if (typeof SFX !== 'undefined') SFX.unlock(); },
  nope(slot) { const b = document.querySelector(`.ab[data-slot="${slot}"]`); if (b) flashCls(b, 'nope', 260); if (S && !S.quiet) sfx('nope'); },
  fired(slot) { const b = document.querySelector(`.ab[data-slot="${slot}"]`); if (b) flashCls(b, 'fired', 300); },
  pulseFrame(role) { document.querySelectorAll(`[data-heal="${role}"]`).forEach((el) => flashCls(el, 'fired', 260)); },
  holdBtn(slot, on) { const b = document.querySelector(`.ab[data-slot="${slot}"]`); if (b) b.classList.toggle('held', on); },
  stick(s) {
    const el = $('stick');
    if (!el) return;
    if (!s) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = s.ox + 'px'; el.style.top = s.oy + 'px';
    const dx = s.x - s.ox, dy = s.y - s.oy, l = Math.hypot(dx, dy), m = Math.min(l, 56);
    el.firstElementChild.style.transform = `translate(${(dx / (l || 1)) * m}px, ${(dy / (l || 1)) * m}px)`;
    UI.hintDone('move');
  },
  hint(key) {
    if (!S || S.quiet || UI.hintsDone.has(key)) return;
    const t = HINTS[key];
    if (!t) return;
    const txt = G.touch ? t[0] : t[1];
    $('hint').innerHTML = `<b>${esc(t[2] || 'Tip')}</b><span>${esc(txt)}</span>`;
    $('hint').hidden = false;
    UI.hintKey = key; UI.hintT = t[3] || 6;
  },
  hintDone(key) { UI.hintsDone.add(key); if (UI.hintKey === key) { $('hint').hidden = true; UI.hintKey = null; } },
};
const HINTS = {
  move: ['Drag on the left side of the screen to move.', 'WASD or the arrow keys to move.', 'Move', 8],
  dodge: ['Swipe anywhere to dodge-roll out of the red.', 'Space to dodge-roll out of the red.', 'Dodge', 6],
  block: ['Hold the shield button. Block right before it lands to stun him.', 'Hold 2 to block. Block right before it lands to stun him.', 'Block it', 6],
  taunt: ['Taunt grabs every mob near you. Use it when one runs at your mates.', 'Taunt (1) grabs every mob near you. Use it when one runs at your mates.', 'Taunt', 6],
  heal: ['Tap a name, or tap a hero, to heal them.', 'Click a name, or press Z, X or C, to heal.', 'Heal', 7],
  aim: ['Drag Blizzard to aim it. A quick tap aims it for you.', 'Blizzard (1) lands where your mouse is.', 'Aim', 6],
  kick: ['He is casting. Hit him hard, Charge him or Frost Nova him to stop it.', 'He is casting. Hit him hard, Charge him or Frost Nova him to stop it.', 'Interrupt', 6],
  wisp: ['Swipe through the wisps before they reach anyone.', 'Click and drag through the wisps before they reach anyone.', 'Wisps', 6],
  chain: ['Swipe across the chain to cut it.', 'Drag across the chain, or press E, to cut it.', 'Chain', 6],
  cage: ['Tap the cage to break your mate out.', 'Click the cage to break your mate out.', 'Cage', 6],
  cageSelf: ['Tap fast to break out!', 'Mash Space to break out!', 'Caged', 4],
  wild: ['Mobs that aren’t on the tank go wild after a few seconds: faster and harder hitting. Tanks, grab them.', 'Mobs that aren’t on the tank go wild after a few seconds: faster and harder hitting. Tanks, grab them.', 'Wild', 7],
  rings: ['Dodge-roll through the rings as they reach you.', 'Space through the rings as they reach you.', 'Rings', 6],
};
function flashCls(el, c, ms) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); setTimeout(() => el.classList.remove(c), ms); }

/* ---------- start screen ---------- */
function renderStart() {
  G.role = G.save.role || 'tank';
  const roles = ORDER.map((r) => {
    const R = ROLES[r];
    const kit = R.kit.map(([t, n]) => `<li>${tileSvg(t, 'ki')}<span>${esc(n)}</span></li>`).join('');
    return `<button type="button" class="role" role="radio" data-role="${r}" aria-checked="false">
      <span class="role-art" aria-hidden="true">${PORTRAITS[r] || ''}</span>
      <span class="role-txt"><span class="role-t">${R.title}</span><span class="role-n">${R.name}</span><span class="role-b">${esc(R.blurb)}</span><ul class="kit">${kit}</ul></span>
    </button>`;
  }).join('');
  $('roles').innerHTML = roles;
  $('roles').querySelectorAll('.role').forEach((b) => b.addEventListener('click', () => { G.role = b.dataset.role; G.save.role = G.role; writeSave(); syncStart(); }));
  document.querySelectorAll('#tier .sg').forEach((b) => b.addEventListener('click', () => { G.tier = b.dataset.v === 'mine' ? 'mine' : +b.dataset.v; syncStart(); }));
  document.querySelectorAll('#where .sg').forEach((b) => b.addEventListener('click', () => { G.start = b.dataset.v; syncStart(); }));
  syncStart();
}
function itemLi(it) {
  const R = RARITY[it.rar];
  return `<li class="it r${it.rar}" style="--rc: ${R.color}"><span class="it-ic">${tileSvg(it.icon, 'ii')}</span><span class="it-tx"><span class="it-n" style="color: ${R.ink}">${esc(it.name)}</span><span class="it-m">${R.name} ${esc(it.slotName.toLowerCase())}${it.trait ? ' · ' + esc(it.traitName) : ''}</span></span></li>`;
}
function syncStart() {
  document.querySelectorAll('#roles .role').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.role === G.role)));
  const set = G.tier === 'mine' ? savedSet(G.role) : tierSet(G.role, G.tier);
  const gs = gearScore(set);
  $('gear-head').innerHTML = `<b>${ROLES[G.role].title} gear</b><span class="gs">Gear score <b>${gs}</b> · power ${Math.round((gearPower(gs) - 1) * 100) >= 0 ? '+' : ''}${Math.round((gearPower(gs) - 1) * 100)}%</span>`;
  $('gear-items').innerHTML = Object.values(set).map(itemLi).join('');
  document.querySelectorAll('#tier .sg').forEach((b) => b.setAttribute('aria-checked', String(String(G.tier) === b.dataset.v)));
  document.querySelectorAll('#where .sg').forEach((b) => b.setAttribute('aria-checked', String(G.start === b.dataset.v)));
  $('tier-note').textContent = G.tier === 'mine' ? 'Common to Epic is real power. Epic is the cap. After that, gear changes how your moves work instead of how hard they hit.' : `Test only: everyone in ${RARITY[G.tier].name} gear so you can feel the difference. Loot still goes to your real gear.`;
  $('runs').textContent = G.save.clears ? `Cleared ${G.save.clears} time${G.save.clears > 1 ? 's' : ''}${G.save.best ? ' · best ' + fmtT(G.save.best) : ''}` : 'Not cleared yet';
}

/* ---------- starting a run ---------- */
function startRun(o) {
  o = o || {};
  const role = o.solo ? 'dps' : (o.role || G.role);
  const tier = o.tier !== undefined ? o.tier : G.tier;
  const sets = {};
  for (const r of ORDER) sets[r] = tier === 'mine' ? (r === role ? savedSet(r) : tierSet(r, avgRar(role))) : tierSet(r, tier);
  newGame({ role, sets, start: o.start || G.start, solo: !!o.solo, seed: o.seed, auto: !!o.auto, quiet: !!o.quiet });
  S.startedAt = S.t;
  S.tier = tier;
  if (o.skill) { S.player.bot.skill = o.skill; S.player.bot.react = o.react || 0.45; S.player.bot.sloppy = true; }
  IN.aim = null; IN.block = false; IN.keys = {}; IN.stick = null;
  UI.hintsDone = new Set(); UI.hintKey = null;
  ['ov-start', 'ov-msg', 'ov-loot'].forEach((id) => { $(id).hidden = true; });
  $('hud').hidden = false;
  buildHud();
  updateCam(0, true);
  UI.lastRoom = -1;
  if (!o.quiet) {
    setTimeout(() => UI.hint('move'), 600);
    if (role === 'healer') setTimeout(() => UI.hint('heal'), 9000);
  }
  return S;
}

/* ---------- HUD ---------- */
function buildHud() {
  const fr = S.heroes.map((h) => `<li class="fr${h.isPlayer ? ' me' : ''}" data-heal="${h.role}" data-role="${h.role}">
      <span class="fr-top">${tileSvg(ROLE_ICON[h.role], 'fi')}<span class="fr-n">${h.isPlayer ? 'You' : h.name}</span><i class="ag" aria-hidden="true"></i></span>
      <span class="fb"><i class="hpf"></i><i class="abf"></i></span>${h.role === 'healer' ? '<span class="fb mp"><i class="mpf"></i></span>' : ''}
    </li>`).join('');
  $('frames').innerHTML = fr;
  $('frames').querySelectorAll('.fr').forEach((li) => li.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (S.player.role === 'healer') { mend(S.player, heroBy(li.dataset.role)); UI.hintDone('heal'); } }));
  const p = S.player, A = AB[p.role];
  const keyOf = { a1: '1', a2: '2', a3: '3', dodge: 'Space' };
  const btn = (slot) => {
    const def = slot === 'dodge' ? { key: 'dodge', name: 'Dodge' } : A[slot];
    return `<button type="button" class="ab${def.hold ? ' hold' : ''}${slot === 'dodge' ? ' dg' : ''}" data-slot="${slot}" aria-label="${esc(def.name)}" title="${esc(def.name + (def.desc ? ': ' + def.desc : ''))} (${keyOf[slot]})">
      <span class="tile">${tileSvg(def.key, 'ti')}</span><span class="sweep"></span><span class="cdn"></span><kbd>${keyOf[slot]}</kbd>${def.mana ? `<span class="cost">${def.mana}</span>` : ''}<span class="glow"></span></button>`;
  };
  $('abar').innerHTML = ['a1', 'a3', 'dodge', 'a2'].map(btn).join('');
  $('abar').querySelectorAll('.ab').forEach((b) => bindAbility(b, b.dataset.slot));
  const pad = $('pad');
  if (p.role === 'healer') {
    pad.hidden = false;
    pad.innerHTML = S.heroes.map((h) => `<button type="button" class="pd" data-heal="${h.role}" data-role="${h.role}" aria-label="Heal ${h.isPlayer ? 'yourself' : h.name}"><span class="pd-n">${h.isPlayer ? 'You' : h.name}</span><span class="fb"><i class="hpf"></i><i class="abf"></i></span></button>`).join('');
    pad.querySelectorAll('.pd').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); UI.audioKick(); mend(S.player, heroBy(b.dataset.role)); UI.hintDone('heal'); }));
  } else { pad.hidden = true; pad.innerHTML = ''; }
  $('game').dataset.role = p.role;
  $('bossbar').hidden = true;
  UI.lastFrame = {};
}
function bindAbility(b, slot) {
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!S || S.over || S.paused) return;
    UI.audioKick();
    const p = S.player;
    if (p.st.caged) { mashCage(p); return; }
    if (slot === 'dodge') { doDodge(p, p.intent.mx, p.intent.my); UI.hintDone('dodge'); return; }
    const def = AB[p.role][slot];
    if (def.hold) {
      IN.block = true; b.classList.add('held'); UI.hintDone('block');
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
      const up = () => { IN.block = false; b.classList.remove('held'); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      return;
    }
    if (def.aim) {
      const r = VIEW.cv.getBoundingClientRect();
      IN.aim = { slot, id: e.pointerId, sx: e.clientX - r.left, sy: e.clientY - r.top, cx: e.clientX - r.left, cy: e.clientY - r.top, live: true };
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
      const move = (ev) => { if (!IN.aim || ev.pointerId !== IN.aim.id) return; IN.aim.cx = ev.clientX - r.left; IN.aim.cy = ev.clientY - r.top; };
      const up = (ev) => {
        b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up);
        const a = IN.aim; IN.aim = null;
        if (!a || ev.type === 'pointercancel') return;
        const moved = Math.hypot(a.cx - a.sx, a.cy - a.sy) >= 14;
        useAbility(S.player, slot, moved ? aimPoint(a) : null);
        if (moved) UI.hintDone('aim');
      };
      b.addEventListener('pointermove', move); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      return;
    }
    useAbility(p, slot, p.picked && isFoe(p.picked) ? p.picked : null);
  });
}

function setW(el, k) { const v = (clamp(k, 0, 1) * 100).toFixed(1) + '%'; if (el.style.width !== v) el.style.width = v; }
function hudTick(dt) {
  if (!S || $('hud').hidden) return;
  const p = S.player;
  const targeted = new Set();
  for (const m of S.mobs) if (m.alive && m.state === 'fight' && m.target && !m.cage && !m.M.wisp) targeted.add(m.target.role);
  document.querySelectorAll('[data-heal]').forEach((el) => {
    const h = heroBy(el.dataset.role);
    if (!h) return;
    setW(el.querySelector('.hpf'), h.hp / h.maxHp);
    const ab = el.querySelector('.abf'); if (ab) { ab.style.left = (clamp(h.hp / h.maxHp, 0, 1) * 100).toFixed(1) + '%'; setW(ab, Math.min(h.absorb / h.maxHp, 1 - h.hp / h.maxHp)); }
    const mp = el.querySelector('.mpf'); if (mp) setW(mp, h.mana / h.maxMana);
    el.classList.toggle('dead', !h.alive);
    el.classList.toggle('low', h.alive && h.hp < h.maxHp * 0.35);
    el.classList.toggle('aggro', h.alive && h.role !== 'tank' && targeted.has(h.role));
    el.classList.toggle('far', p.role === 'healer' && h.alive && dist(h, p) > MEND.range);
  });
  // boss
  const bb = $('bossbar');
  const B = S.boss && S.boss.alive ? S.boss : null;
  if (B) {
    if (bb.hidden) { bb.hidden = false; $('bb-name').textContent = B.name; UI.trail = 1; }
    const k = B.hp / B.maxHp;
    setW($('bb-fill'), k);
    UI.trail = Math.max(k, (UI.trail || 1) - dt * 0.25);
    setW($('bb-trail'), UI.trail);
    $('bb-pct').textContent = Math.ceil(k * 100) + '%';
    const phases = B.type === 'knight' ? 2 : 3;
    $('bb-phase').textContent = `Phase ${B.phase} of ${phases}`;
    const actNames = { smash: 'Shovel Smash', burrow: 'Burrowing', sweep: 'Cleaving Sweep', charge: 'Shield Charge', rally: 'Rally the Dead', leap: 'Leap', bury: 'Bury the Yard' };
    const enr = B.type === 'knight' ? 150 : 270;
    const left = enr - ((B.ab && B.ab.t) || 0);
    $('bb-sub').textContent = (B.act && actNames[B.act.k] ? actNames[B.act.k] + ' · ' : '') + (left > 0 ? 'Enrage in ' + fmtT(left) : 'Enraged');
    $('bb-sub').classList.toggle('hot', !!(B.act && actNames[B.act.k]) || left <= 30);
  } else if (!bb.hidden) bb.hidden = true;
  // buttons
  const A = AB[p.role];
  document.querySelectorAll('.ab').forEach((b) => {
    const slot = b.dataset.slot;
    let cd = 0, max = 1, usable = p.alive && !p.st.stun && !p.st.caged;
    if (slot === 'dodge') { cd = p.cd.dodge; max = 1.6; }
    else { const def = A[slot]; cd = p.cd[slot]; max = def.cd || 1; if (def.key === 'comet' && p.cast) { cd = 0; } if (def.mana && p.mana < def.mana) usable = false; }
    const pr = cd > 0 ? cd / max : 0;
    const sw = b.querySelector('.sweep'); const v = pr.toFixed(3); if (sw.dataset.p !== v) { sw.style.setProperty('--p', v); sw.dataset.p = v; }
    const cdn = b.querySelector('.cdn'); const txt = cd > 0.95 ? String(Math.ceil(cd)) : ''; if (cdn.textContent !== txt) cdn.textContent = txt;
    b.classList.toggle('dim', !usable);
    b.classList.toggle('proc', usable && cd <= 0 && procFor(p, slot));
  });
  // banner and call
  const bn = $('banner');
  const btxt = S.banner ? S.banner.str : '';
  if (bn.textContent !== btxt) { bn.textContent = btxt; bn.className = 'banner' + (S.banner ? ' show ' + S.banner.kind : ''); }
  const cl = $('call');
  const ctxt = S.call ? S.call.str : '';
  if (cl.textContent !== ctxt) { cl.textContent = ctxt; cl.className = 'call' + (S.call ? ' show ' + S.call.kind : ''); if (ctxt) flashCls(cl, 'pop', 260); }
  $('hurt').style.opacity = String(clamp(S.hurtFlash, 0, 0.9));
  $('cutbtn').hidden = !(S.chains.length && p.alive && !p.st.caged);
  // hints
  if (UI.hintKey) { UI.hintT -= dt; if (UI.hintT <= 0) { $('hint').hidden = true; UI.hintsDone.add(UI.hintKey); UI.hintKey = null; } }
  if (!UI.hintsDone.has('dodge') && S.hazards.some((z) => !z.noDmg && inHaz(z, p.x, p.y, p.r))) UI.hint('dodge');
  if (p.role === 'tank' && !UI.hintsDone.has('taunt') && S.mobs.some((m) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp)) UI.hint('taunt');
  if (p.role === 'dps' && !UI.hintsDone.has('aim') && S.inCombat && S.mobs.filter((m) => m.alive && m.state === 'fight').length >= 3) UI.hint('aim');
  // room names
  const ri = roomIndexOf(p.x, p.y);
  if (ri >= 0 && ri !== UI.lastRoom) { if (UI.lastRoom !== -1 && ri > UI.lastRoom && !S.boss) banner(MAP.rooms[ri].name, 'room', 1.8); UI.lastRoom = ri; }
}
function procFor(p, slot) {
  const def = slot === 'dodge' ? null : AB[p.role][slot];
  if (!def) return S.hazards.some((z) => !z.noDmg && !(z.tankBuster && p.role === 'tank') && z.t > 0.2 && inHaz(z, p.x, p.y, p.r)) || S.rings.some((g) => !g.hit.has(p.id) && Math.abs(dist(p, g) - g.r) < 90);
  switch (def.key) {
    case 'taunt': return S.mobs.some((m) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && !m.cage && m.forcedT <= 0 && dist(m, p) < 260);
    case 'shield': return S.hazards.some((z) => (z.tankBuster || (z.shape === 'rect' && z.src && z.src.type === 'knight')) && !z.fired && (z.followT === p || inHaz(z, p.x, p.y, p.r)) && z.warn - z.t < 0.9);
    case 'charge': return S.mobs.some((m) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && !m.cage && dist(m, p) > 200 && dist(m, p) < 420);
    case 'sunburst': return S.heroes.filter((a) => a.alive && a.hp < a.maxHp * 0.6).length >= 2;
    case 'ward': { const t = heroBy('tank'); return !!(t && t.alive && t.absorb <= 0 && S.hazards.some((z) => z.tankBuster && !z.fired && (z.followT === t || inHaz(z, t.x, t.y, t.r)))); }
    case 'circle': return false;
    case 'blizzard': { const c = bestCluster(p, 120, 560); return !!(c && c.score >= 3); }
    case 'nova': return S.mobs.filter((m) => isFoe(m) && !m.isBoss && !m.cage && m.state === 'fight' && dist(m, p) < 150 + m.r).length >= 2 || S.mobs.some((m) => isFoe(m) && m.cast && m.cast.kick && dist(m, p) < 150 + m.r);
    case 'comet': { const t = p.picked || p.target; return !!(t && t.alive && t.st && t.st.freeze > 0.6); }
  }
  return false;
}

/* ---------- message screens: pause, wipe, solo ---------- */
function showMsg(o) {
  $('hint').hidden = true; UI.hintKey = null;
  $('msg-eyebrow').textContent = o.eyebrow || '';
  $('msg-title').textContent = o.title;
  $('msg-text').textContent = o.text || '';
  $('msg-chips').innerHTML = (o.chips || []).map((c) => `<span class="chip">${c}</span>`).join('');
  $('msg-actions').innerHTML = o.buttons.map((b, i) => `<button type="button" class="${i ? 'ghost' : 'primary'}" data-i="${i}">${esc(b[0])}</button>`).join('');
  $('msg-actions').querySelectorAll('button').forEach((el) => el.addEventListener('click', () => { o.buttons[+el.dataset.i][1](); }));
  $('ov-msg').hidden = false;
  const f = $('msg-actions').querySelector('button'); if (f) f.focus({ preventScroll: true });
}
UI.togglePause = function () {
  if (!S || S.over) return;
  if (S.paused) { S.paused = false; $('ov-msg').hidden = true; return; }
  S.paused = true;
  showMsg({ eyebrow: 'Barrow Crypt', title: 'Paused', text: `${fmtT(S.t - S.startedAt)} in. Sound is ${SFX.on ? 'on' : 'off'}.`, buttons: [
    ['Keep going', () => UI.togglePause()],
    [SFX.on ? 'Sound off' : 'Sound on', () => { SFX.on = !SFX.on; S.paused = false; UI.togglePause(); }],
    ['Restart the run', () => { startRun({ role: S.opts.role, solo: S.opts.solo, tier: S.tier, start: S.opts.start }); }],
    ['Back to the start', () => backToStart()],
  ] });
};
UI.showWipe = function () {
  const room = MAP.rooms[S.wipeRoom !== undefined ? S.wipeRoom : S.cp];
  showMsg({ eyebrow: 'Wipe', title: 'Everyone went down', text: `Back to the start of ${room ? room.name : 'the room'}. Anything you killed stays dead.`, buttons: [
    ['Go again', () => { $('ov-msg').hidden = true; respawn(); }],
    ['Back to the start', () => backToStart()],
  ] });
};
UI.showLost = function () {
  const k = S.packs.filter((p) => p.cleared).length;
  showMsg({ eyebrow: 'Solo run', title: 'Ivy went down alone', text: `${k ? 'She got through ' + (k === 1 ? 'one pack' : k + ' packs') + ' before they caught her.' : 'They caught her at the first pack.'} With no tank, every mob goes for her. With no healer, nothing brings her back up. You need all three.`, buttons: [
    ['Bring the party', () => startRun({ role: 'dps' })],
    ['Try solo again', () => startRun({ solo: true })],
    ['Back to the start', () => backToStart()],
  ] });
};
function backToStart() {
  S && (S.paused = false);
  $('ov-msg').hidden = true; $('ov-loot').hidden = true; $('hud').hidden = true;
  renderStart();
  $('ov-start').hidden = false;
}

/* ---------- loot ---------- */
function rollItems(role) {
  const mine = G.save.gear[role];
  const slots = SLOTS[role].map((s) => s[0]);
  const minR = Math.min(...slots.map((s) => mine[s].rar));
  const slot = pick(slots.filter((s) => mine[s].rar === minR));
  let rar = minR;
  if (minR < 3) { const r = rng(); rar = Math.min(3, minR + (r < 0.12 ? 0 : r < 0.84 ? 1 : 2)); }
  let trait = null;
  if (rar === 3 && mine[slot].rar === 3) trait = TRAITS[role][slot].find((t) => t[0] !== mine[slot].trait)[0];
  const items = [makeItem(role, slot, rar, trait)];
  const weights = [0, 0.46, 0.36, 0.18];
  const wr = () => { let r = rng(); for (let i = 1; i < 4; i++) { r -= weights[i]; if (r <= 0) return i; } return 1; };
  const others = ORDER.filter((x) => x !== role);
  items.push(makeItem(others[0], pick(SLOTS[others[0]])[0], wr()));
  const third = rng() < 0.35 ? role : others[1];
  const s3 = third === role ? pick(slots.filter((s) => s !== slot)) : pick(SLOTS[third])[0];
  items.push(makeItem(third, s3, third === role ? Math.max(1, Math.min(3, mine[s3].rar + (rng() < 0.6 ? 1 : 0))) : wr()));
  return items;
}
UI.showLoot = function () {
  const role = S.opts.role;
  const time = S.clearTime || S.t - S.startedAt;
  const full = (S.opts.start || 'entrance') === 'entrance';
  G.save.runs++;
  if (full) { G.save.clears++; if (S.tier === 'mine' && (!G.save.best || time < G.save.best)) G.save.best = time; }
  writeSave();
  const p = S.player;
  const chips = [`Wipes <b>${S.stats.wipes}</b>`, `Your dodges <b>${p.stats.dodges}</b>`];
  if (role === 'tank') chips.push(`Perfect blocks <b>${p.stats.perfect}</b>`, `Blocked <b>${p.stats.blocks}</b>`);
  if (role === 'healer') chips.push(`Healing <b>${fmtN(p.stats.heal)}</b>`);
  else chips.push(`Damage <b>${fmtN(p.stats.dmg)}</b>`);
  if (S.stats.kicks) chips.push(`Interrupts <b>${S.stats.kicks}</b>`);
  if (S.stats.cuts) chips.push(`Chains cut <b>${S.stats.cuts}</b>`);
  $('lt-eyebrow').textContent = `${full ? 'Barrow Crypt cleared in ' + fmtT(time) : 'Practice from ' + (S.opts.start === 'knight' ? 'Sir Rattlebones' : 'the Gravekeeper') + ' · ' + fmtT(time)}${S.tier !== 'mine' ? ' · ' + RARITY[S.tier].name + ' test gear' : ''}`;
  $('hint').hidden = true; UI.hintKey = null;
  $('lt-chips').innerHTML = chips.map((c) => `<span class="chip">${c}</span>`).join('');
  const items = rollItems(role);
  UI.loot = { items, choice: items.map((it) => (it.role === role ? 'need' : 'greed')), rolled: false, before: gearScore(savedSet(role)) };
  $('lt-items').innerHTML = items.map((it, i) => lootRow(it, i, role)).join('');
  $('lt-items').querySelectorAll('.ch button').forEach((b) => b.addEventListener('click', () => { if (UI.loot.rolled) return; UI.loot.choice[+b.dataset.i] = b.dataset.c; syncChoices(); }));
  syncChoices();
  $('lt-result').textContent = '';
  $('lt-gear').innerHTML = '';
  $('roll-btn').hidden = false;
  $('lt-after').hidden = true;
  $('hud').hidden = true;
  $('ov-loot').hidden = false;
  $('roll-btn').focus({ preventScroll: true });
};
function lootRow(it, i, role) {
  const R = RARITY[it.rar];
  const cur = G.save.gear[it.role][it.slot];
  const curIt = makeItem(it.role, it.slot, cur.rar, cur.trait);
  const cmp = it.rar > cur.rar ? `Upgrade on your ${esc(curIt.name)}` : it.rar === cur.rar && it.rar === 3 && it.trait !== cur.trait ? `Same power, different trait: yours is ${esc(curIt.traitName)}` : `Not better than your ${esc(curIt.name)}`;
  const forYou = it.role === role;
  return `<div class="lr r${it.rar}" style="--rc: ${R.color}" data-i="${i}">
    <span class="lr-ic">${tileSvg(it.icon, 'ii')}</span>
    <span class="lr-tx"><span class="lr-n" style="color: ${R.ink}">${esc(it.name)}</span>
      <span class="lr-m">${R.name} · ${ROLES[it.role].title} ${esc(it.slotName.toLowerCase())} · score ${it.score}</span>
      ${it.trait ? `<span class="lr-t"><b>${esc(it.traitName)}:</b> ${esc(it.traitDesc)}</span>` : ''}
      <span class="lr-c">${forYou ? '' : ROLES[it.role].title + ' gear. Yours to keep for when you play ' + ROLES[it.role].title.toLowerCase() + '. '}${cmp}.</span></span>
    <span class="ch" role="group" aria-label="Roll on ${esc(it.name)}">
      <button type="button" data-i="${i}" data-c="need" ${forYou ? '' : 'disabled'}>Need</button><button type="button" data-i="${i}" data-c="greed">Greed</button><button type="button" data-i="${i}" data-c="pass">Pass</button>
    </span>
    <span class="rolls" id="rolls-${i}"></span>
  </div>`;
}
function syncChoices() {
  document.querySelectorAll('#lt-items .ch button').forEach((b) => b.setAttribute('aria-pressed', String(UI.loot.choice[+b.dataset.i] === b.dataset.c)));
}
function doRolls() {
  if (UI.loot.rolled) return;
  UI.loot.rolled = true;
  $('roll-btn').hidden = true;
  const role = S.opts.role;
  const L = UI.loot;
  const people = S.heroes.map((h) => ({ role: h.role, name: h.isPlayer ? 'You' : h.name, you: h.isPlayer }));
  L.results = L.items.map((it, i) => {
    const rolls = people.map((pp) => {
      let c = pp.you ? L.choice[i] : it.role === pp.role ? 'need' : rng() < 0.5 ? 'greed' : 'pass';
      return { ...pp, c, v: c === 'pass' ? 0 : irand(1, 100), tie: rng() };
    });
    const rank = (r) => (r.c === 'need' ? 2 : r.c === 'greed' ? 1 : 0);
    const win = rolls.filter((r) => r.c !== 'pass').sort((a, b) => rank(b) - rank(a) || b.v - a.v || b.tie - a.tie)[0] || null;
    return { rolls, win };
  });
  const t0 = performance.now(), D = 1400;
  const spin = () => {
    const k = (performance.now() - t0) / D;
    L.results.forEach((res, i) => {
      $('rolls-' + i).innerHTML = res.rolls.map((r) => `<span class="rv${k >= 1 && res.win === r ? ' win' : ''}">${esc(r.name)} <b>${r.c === 'pass' ? 'pass' : k >= 1 ? r.v : irandVis()}</b>${r.c === 'need' ? ' <i>need</i>' : ''}</span>`).join('');
    });
    if (k < 1) { if (Math.random() < 0.4) sfx('tick'); requestAnimationFrame(spin); return; }
    finishLoot();
  };
  requestAnimationFrame(spin);
}
const irandVis = () => 1 + Math.floor(Math.random() * 100);
function finishLoot() {
  const role = S.opts.role, L = UI.loot;
  const lines = [], gearLines = [];
  let epicPick = null;
  L.results.forEach((res, i) => {
    const it = L.items[i];
    if (!res.win) { lines.push(`Nobody took the ${it.name}.`); return; }
    if (!res.win.you) { lines.push(`${res.win.name} wins the ${it.name}.`); return; }
    const cur = G.save.gear[it.role][it.slot];
    if (it.rar > cur.rar) { G.save.gear[it.role][it.slot] = { rar: it.rar, trait: it.trait || null }; gearLines.push(it); lines.push(`You win the ${it.name}. Equipped.`); }
    else if (it.rar === 3 && cur.rar === 3 && it.trait !== cur.trait) { epicPick = it; lines.push(`You win the ${it.name}. Same power, new trait. Pick one below.`); }
    else lines.push(`You win the ${it.name}, but yours is better. It goes in the bag.`);
  });
  writeSave();
  const after = gearScore(savedSet(role));
  $('lt-result').textContent = lines.join(' ');
  let g = `<div class="ga-head"><b>Your ${ROLES[role].title.toLowerCase()} gear</b><span class="gs">Gear score ${L.before}${after !== L.before ? ' → <b>' + after + '</b>' : ''} · power +${Math.round((gearPower(after) - 1) * 100)}%</span></div><ul class="items">${Object.values(savedSet(role)).map(itemLi).join('')}</ul>`;
  if (epicPick) {
    const cur = makeItem(role, epicPick.slot, 3, G.save.gear[role][epicPick.slot].trait);
    g += `<div class="side"><b>Sideways pick for your ${esc(epicPick.slotName.toLowerCase())}</b><div class="side-opts">
      <button type="button" class="opt" data-t="${cur.trait}" aria-pressed="true"><b>${esc(cur.traitName)}</b><span>${esc(cur.traitDesc)}</span></button>
      <button type="button" class="opt" data-t="${epicPick.trait}" aria-pressed="false"><b>${esc(epicPick.traitName)}</b><span>${esc(epicPick.traitDesc)}</span></button></div></div>`;
  }
  if (gearLines.length && after >= 66) g += `<p class="fine">That's full Epic. You've hit the power cap. From here, loot is about traits and looks.</p>`;
  $('lt-gear').innerHTML = g;
  $('lt-gear').querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    G.save.gear[role][epicPick.slot].trait = b.dataset.t; writeSave();
    $('lt-gear').querySelectorAll('.opt').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));
  $('lt-after').hidden = false;
  sfx(gearLines.some((it) => it.rar === 3) ? 'epic' : 'win');
}
