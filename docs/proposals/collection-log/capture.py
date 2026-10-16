# Screenshots every collection-log screen and state of the built game, phone and desktop.
# Seeds saves at 0, 6, 16 and 17 of 17 (and Heroic), then shoots every log page, the item sheet, the Dungeons sheet's log and the chest.
# Usage (after npm run build): python3 docs/proposals/collection-log/capture.py [OUTDIR] [phone|desktop|both]
import sys, os, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / 'shots' / 'log-proposal'
WORK.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT / 'tools'))
from pathlib import Path
from playwright.sync_api import sync_playwright
from pw_check import wrap

OUT = sys.argv[1] if len(sys.argv) > 1 else str(WORK / 'before')
WHICH = sys.argv[2] if len(sys.argv) > 2 else 'both'
os.makedirs(OUT, exist_ok=True)

SEED = r"""
window.__seed = (kind) => {
  const H = window.highfell, p = H.p, now = Date.now(), day = 86400000;
  p.collection = {}; p.seen = {}; p.achievements = {}; p.titles = []; p.bosses = {}; p.dungeons = {};
  const give = (id, kc, n = 1, ago = 1, seen = true) => { p.collection[id] = { n, kc, at: now - ago * day }; if (seen) p.seen[id] = now; };
  const ach = (id, ago = 1) => { p.achievements[id] = { at: now - ago * day }; };
  if (kind === 'fresh') { /* just made a hero: nothing yet */ }
  if (kind === 'mid' || kind === 'near' || kind === 'full') {
    p.dungeons.barrow = { runs: 44, clears: 41, pb: 211, marks: 50 };
    p.bosses['barrow.knight'] = { kc: 43, pb: 38, wipes: 1 };
    p.bosses['barrow.keeper'] = { kc: 41, pb: 118, wipes: 3 };
    give('trophy.rattlebones_plume', 8, 1, 20);
    give('barrowguard.helm', 12, 1, 18);
    give('candlewake.shoulders', 19, 1, 15);
    give('barrowguard.chest', 27, 2, 10);
    give('gravekeeper.tank', 33, 1, 5);
    give('rimebone.helm', 41, 1, 0, false);
    give('trophy.barrow_key', 0, 1, 20); ach('barrow.into', 20);
    give('trophy.broken_shackle', 0, 1, 12); ach('barrow.chains', 12);
    give('banner.party', 0, 1, 9); ach('barrow.nobody', 9);
  }
  if (kind === 'near' || kind === 'full') {
    p.dungeons.barrow = { runs: 231, clears: 214, pb: 131, marks: 300 };
    p.bosses['barrow.knight'] = { kc: 220, pb: 21, wipes: 2 };
    p.bosses['barrow.keeper'] = { kc: 214, pb: 64, wipes: 7 };
    for (const [id, kc, n] of [['barrowguard.shoulders', 77, 1], ['candlewake.helm', 58, 3], ['candlewake.chest', 102, 1], ['rimebone.shoulders', 66, 2], ['rimebone.chest', 140, 1],
      ['shadeveil.helm', 91, 1], ['shadeveil.shoulders', 120, 1], ['shadeveil.chest', 155, 2], ['gravekeeper.healer', 49, 1], ['gravekeeper.dps', 188, 1], ['mount.gravehound', 171, 1]]) give(id, kc, n, 3);
    p.collection['trophy.rattlebones_plume'].n = 4;
  }
  if (kind === 'full') {
    give('gravekeeper.rogue', 214, 1, 0, false);
    ach('barrow.log', 0); p.titles.push('title.gravewarden');
  }
  if (kind === 'heroic') {
    p.dungeons.barrow = { runs: 231, clears: 214, pb: 131, marks: 300 };
    p.dungeons['barrow-heroic'] = { runs: 9, clears: 6, pb: 236, marks: 6 };
    p.bosses['barrow-heroic.knight'] = { kc: 7, pb: 44, wipes: 2 };
    p.bosses['barrow-heroic.keeper'] = { kc: 6, pb: 151, wipes: 3 };
    give('barrowguard.helm.gilded', 4, 1, 1);
    give('gravekeeper.tank.gilded', 6, 1, 0, false);
  }
  H.save();
  return Object.keys(p.collection).length;
};
window.__open = (spec) => { window.highfell.sheets.open(spec); return true; };
"""

STATES = [
    # name, seed, js to open, scroll pages
    ('01-log-index-fresh', 'fresh', "__open({kind:'logs', tab:'collection'})", 2),
    ('02-keeper-page-fresh', 'fresh', "__open({kind:'logs', tab:'collection', entry:'barrow.keeper'})", 3),
    ('03-barrow-log-fresh', 'fresh', "__open({kind:'logs', tab:'collection', entry:'barrow.log'})", 3),
    ('04-log-index-mid', 'mid', "__open({kind:'logs', tab:'collection'})", 1),
    ('05-keeper-page-mid', 'mid', "__open({kind:'logs', tab:'collection', entry:'barrow.keeper'})", 3),
    ('06-knight-page-mid', 'mid', "__open({kind:'logs', tab:'collection', entry:'barrow.knight'})", 1),
    ('07-barrow-log-mid', 'mid', "__open({kind:'logs', tab:'collection', entry:'barrow.log'})", 3),
    ('08-keeper-page-near', 'near', "__open({kind:'logs', tab:'collection', entry:'barrow.keeper'})", 3),
    ('09-barrow-log-near', 'near', "__open({kind:'logs', tab:'collection', entry:'barrow.log'})", 2),
    ('10-barrow-log-full', 'full', "__open({kind:'logs', tab:'collection', entry:'barrow.log'})", 2),
    ('11-keeper-page-full', 'full', "__open({kind:'logs', tab:'collection', entry:'barrow.keeper'})", 3),
    ('12-heroic-keeper', 'heroic', "__open({kind:'logs', tab:'collection', entry:'barrow-heroic.keeper'})", 2),
    ('13-heroic-log', 'heroic', "__open({kind:'logs', tab:'collection', entry:'barrow-heroic.log'})", 2),
    ('14-garden-page', 'mid', "__open({kind:'logs', tab:'collection', entry:'garden.harvests'})", 2),
    ('15-other-page', 'mid', "__open({kind:'logs', tab:'collection', entry:'other.rewards'})", 2),
    ('16-item-from-log-got', 'mid', "__open({kind:'item', id:'barrowguard.chest', back:{kind:'logs', tab:'collection', entry:'barrow.keeper'}})", 2),
    ('17-item-from-log-missing', 'mid', "__open({kind:'item', id:'shadeveil.helm', back:{kind:'logs', tab:'collection', entry:'barrow.keeper'}})", 2),
    ('18-item-pet-missing', 'mid', "__open({kind:'item', id:'pet.pint_gravekeeper', back:{kind:'logs', tab:'collection', entry:'barrow.keeper'}})", 1),
    ('19-dungeons-log-open', 'mid', "__open({kind:'dungeon'}); document.querySelector('[data-act=logx]')?.click()", 3),
]


def shoot_sheet(pg, name, tag, pages):
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{OUT}/{name}-{tag}.png')
    info = pg.evaluate("() => { const b = document.querySelector('.sheet-body'); return b ? [b.scrollHeight, b.clientHeight] : [0, 0]; }")
    sh, ch = info
    shots = 1
    pos = 0
    while shots < pages and sh > ch and pos + ch < sh:
        pos = min(sh - ch, pos + int(ch * 0.85))
        pg.evaluate(f"() => {{ document.querySelector('.sheet-body').scrollTop = {pos}; }}")
        pg.wait_for_timeout(250)
        pg.screenshot(path=f'{OUT}/{name}-{tag}-{chr(97 + shots)}.png')
        shots += 1
    return sh, ch


def run(vp):
    tag = vp['tag']
    path = wrap(str(ROOT / 'dist' / 'highfell.html'))
    errs = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={'width': vp['w'], 'height': vp['h']}, has_touch=vp['touch'], is_mobile=vp['touch'], device_scale_factor=vp['dpr'])
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.goto(Path(path).as_uri())
        pg.wait_for_timeout(1200)
        pg.click('#cr-go')
        pg.wait_for_timeout(1500)
        if pg.query_selector('[data-w="skip"]'):
            pg.click('[data-w="skip"]')
        elif pg.query_selector('#intro-skip'):
            pg.click('#intro-skip')
        pg.wait_for_timeout(1500)
        # step through the hearth tour if it shows
        for _ in range(4):
            btn = pg.query_selector('.h-tour-acts .btn')
            if not btn:
                break
            btn.click()
            pg.wait_for_timeout(500)
        # dismiss the tour / welcome if any
        pg.evaluate("() => { try { window.highfell.showHearth(); } catch (e) {} }")
        pg.wait_for_timeout(500)
        pg.screenshot(path=f'{OUT}/00-hearth-{tag}.png')
        pg.add_script_tag(content=SEED)
        # the lectern: the way into the log from the house
        try:
            pg.evaluate("() => window.highfell.showHearth('loft')")
            pg.wait_for_timeout(900)
            pg.screenshot(path=f'{OUT}/00-loft-lectern-{tag}.png')
        except Exception as e:
            errs.append('loft: ' + str(e))
        sizes = {}
        for name, seed, js, pages in STATES:
            pg.evaluate("() => { window.highfell.sheets.close(); }")
            n = pg.evaluate(f"() => __seed('{seed}')")
            pg.evaluate(f"() => {{ {js}; }}")
            sizes[name] = shoot_sheet(pg, name, tag, pages)
        pg.evaluate("() => { window.highfell.sheets.close(); }")
        # the chest reveal after an ordinary clear (a new set piece and a dupe trophy)
        pg.evaluate("() => __seed('mid')")
        pg.evaluate("() => window.highfell.reveal.preview('unique')")
        pg.wait_for_timeout(900)
        pg.screenshot(path=f'{OUT}/20-reveal-chest-{tag}.png')
        pg.click('.chest-stage')
        pg.wait_for_timeout(9000)
        pg.screenshot(path=f'{OUT}/21-reveal-cards-{tag}.png')
        pg.evaluate("() => document.querySelector('#rv-sum')?.scrollIntoView({block: 'start'})")
        pg.wait_for_timeout(400)
        pg.screenshot(path=f'{OUT}/22-reveal-summary-{tag}.png')
        # the run that fills the log: the big moment, then what it gave
        pg.evaluate("() => __seed('full')")
        pg.evaluate("() => window.highfell.reveal.preview('log')")
        pg.wait_for_timeout(900)
        pg.click('.chest-stage')
        found = False
        for _ in range(60):
            pg.wait_for_timeout(300)
            if pg.query_selector('.log-moment'):
                found = True
                break
        pg.wait_for_timeout(1200)
        pg.screenshot(path=f'{OUT}/23-reveal-log-moment-{tag}.png')
        if found:
            pg.click('.log-moment')
            pg.wait_for_timeout(900)
        pg.evaluate("() => document.querySelector('#rv-log')?.scrollIntoView({block: 'start'})")
        pg.wait_for_timeout(400)
        pg.screenshot(path=f'{OUT}/24-reveal-log-panel-{tag}.png')
        # the Crypt Trial's chest and its log panel
        pg.evaluate("() => __seed('fresh')")
        pg.evaluate("() => window.highfell.reveal.showTrial(64, window.highfell.p.roster[0], false)")
        pg.wait_for_timeout(900)
        pg.click('.chest-stage')
        pg.wait_for_timeout(500)
        if pg.query_selector('#rv-skip:not([hidden])'):
            pg.click('#rv-skip')
        pg.wait_for_timeout(2500)
        pg.screenshot(path=f'{OUT}/25-trial-cards-{tag}.png')
        pg.evaluate("() => document.querySelector('#rv-log')?.scrollIntoView({block: 'start'})")
        pg.wait_for_timeout(400)
        pg.screenshot(path=f'{OUT}/26-trial-log-panel-{tag}.png')
        b.close()
    os.remove(path)
    print(tag, 'sizes', sizes)
    for e in errs:
        print(tag, e)


VPS = {
    'phone': {'tag': 'phone', 'w': 390, 'h': 844, 'touch': True, 'dpr': 2},
    'desktop': {'tag': 'desktop', 'w': 1440, 'h': 900, 'touch': False, 'dpr': 1},
}
for k, vp in VPS.items():
    if WHICH in (k, 'both'):
        t0 = time.time()
        run(vp)
        print(k, 'done in', round(time.time() - t0), 's')
