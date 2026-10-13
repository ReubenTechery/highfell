import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Play-through of the v2 fight page.
# Usage: fighttest2.py page.html mode(good|smash|idle) width height prefix [real_seconds]
#   no real_seconds: fake clock, plays to the end as fast as possible (balance numbers)
#   real_seconds: real time for that many seconds, screenshots at key moments (visual check)
import sys, os, json, time, random
from playwright.sync_api import sync_playwright
page_file, mode, W, H, prefix = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
REAL = float(sys.argv[6]) if len(sys.argv) > 6 else 0
F = HF_ROOT + '/build/fonts/node_modules/@fontsource'
fonts = f"""
@font-face{{font-family:'Lilita One';src:url('file://{F}/lilita-one/files/lilita-one-latin-400-normal.woff2')}}
@font-face{{font-family:'DM Mono';font-weight:400;src:url('file://{F}/dm-mono/files/dm-mono-latin-400-normal.woff2')}}
@font-face{{font-family:'DM Mono';font-weight:500;src:url('file://{F}/dm-mono/files/dm-mono-latin-500-normal.woff2')}}
@font-face{{font-family:'IM Fell English SC';src:url('file://{F}/im-fell-english-sc/files/im-fell-english-sc-latin-400-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:400;src:url('file://{F}/spectral/files/spectral-latin-400-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:500;src:url('file://{F}/spectral/files/spectral-latin-500-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:400;font-style:italic;src:url('file://{F}/spectral/files/spectral-latin-400-italic.woff2')}}
"""
content = open(page_file, encoding='utf-8').read()
content = content.replace('<link rel="stylesheet" href="https://fonts.googleapis.com', '<link data-off="1" href="https://fonts.googleapis.com')
html = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}' + fonts + '</style></head><body>' + content + '</body></html>')
harness = os.path.abspath(prefix + '_harness.html')
open(harness, 'w', encoding='utf-8').write(html)

STATE_JS = """() => {
  const q = (s) => document.querySelector(s);
  const ab = (k) => { const b = q('#ab-' + k); return { cls: b.className, p: parseFloat(b.querySelector('.sweep').style.getPropertyValue('--p') || '0') }; };
  return {
    overlay: !q('#overlay').hidden,
    eyebrow: q('#ov-card .eyebrow') ? q('#ov-card .eyebrow').textContent : '',
    title: q('#ov-title') ? q('#ov-title').textContent : '',
    pulse: parseFloat(q('#pulse-time').textContent),
    boss: q('#boss-pct').textContent,
    chop: ab('chop'), over: ab('overhead'), shout: ab('shout'), taunt: ab('taunt'), shatter: ab('shatter'), ult: ab('ult'),
    frozen: q('#boss-wrap').classList.contains('frozen'),
    windup: q('#boss-pose').classList.contains('windup'),
    shove: q('#boss-pose').classList.contains('shove-wind'),
    alarm: q('#game').classList.contains('alarm'),
    shielded: document.querySelectorAll('.hero-slot.shielded').length,
    absorb: document.querySelectorAll('.fx-num.absorb').length,
    call: q('#call').textContent,
    target: q('#bf-target-name').textContent,
    threat: q('#threat-lbl').textContent,
    rage: q('#rage-num').textContent,
    banner: q('#banner').classList.contains('show') ? q('#banner').textContent : ''
  };
}"""
errors = []
log = []
shots = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': W, 'height': H})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    if not REAL:
        pg.clock.install(time=0)
    pg.goto('file://' + harness)
    if not REAL:
        pg.clock.pause_at(pg.evaluate('Date.now()') + 500)
    if REAL:
        pg.wait_for_timeout(700)
    else:
        pg.clock.run_for(600)
    pg.screenshot(path=prefix + '_intro.png')
    pg.click('#pull-btn')
    presses = {'chop': 0, 'over': 0, 'shout': 0, 'taunt': 0, 'shatter': 0, 'ult': 0}
    keys = {'chop': 'Digit1', 'over': 'Digit2', 'shout': 'Digit3', 'taunt': 'Digit4', 'shatter': 'Space', 'ult': 'Digit6'}
    t0 = time.time()
    ms = 0
    lost_frames = 0
    lost_spells = 0
    was_lost = False
    tapped = False
    seen = {}
    first = {}
    last_banner = ''

    def press(name):
        presses[name] += 1
        pg.keyboard.press(keys[name])

    def usable(a):
        return a['p'] == 0 and 'nores' not in a['cls'] and 'dim' not in a['cls']

    def snap(name):
        if name not in shots:
            pg.screenshot(path=prefix + '_' + name + '.png')
            shots[name] = round(ms / 1000, 1)

    while ms < 200000:
        if REAL:
            pg.wait_for_timeout(90)
            ms = int((time.time() - t0) * 1000)
            if ms > REAL * 1000:
                break
        else:
            pg.clock.run_for(100)
            ms += 100
        st = pg.evaluate(STATE_JS)
        if st['overlay']:
            break
        if st['alarm']:
            lost_frames += 1
            if not was_lost:
                lost_spells += 1
                log.append((round(ms / 1000, 1), 'lost to ' + st['target']))
        was_lost = st['alarm']
        if st['banner'] and st['banner'] != last_banner:
            log.append((round(ms / 1000, 1), st['banner']))
        last_banner = st['banner']
        if REAL:
            for key, on in (('lost', st['alarm']), ('windup', st['windup']), ('boot', st['shove']), ('now', st['call'].startswith('NOW'))):
                if on:
                    first.setdefault(key, ms)
                else:
                    first.pop(key, None)
            if 'lost' in first and ms - first['lost'] >= 350:
                snap('lost')
            if 'windup' in first and ms - first['windup'] >= 1600:
                snap('windup')
            if 'boot' in first and ms - first['boot'] >= 700:
                snap('boot')
            if 'now' in first and ms - first['now'] >= 150:
                snap('now')
            if 'now' in first and ms - first['now'] >= 650:
                snap('slam')
            if 5000 < ms < 9000:
                snap('play')
            if st['frozen']:
                first.setdefault('frozen', ms)
            else:
                first.pop('frozen', None)
            if 'frozen' in first and ms - first['frozen'] >= 250:
                snap('frozen')
        if mode == 'good':
            if 'proc' in st['taunt']['cls'] and (not REAL or ms - first.get('lost', ms) >= 800):
                press('taunt')
            elif 'proc' in st['shatter']['cls'] and (st['pulse'] <= 0.2 or st['pulse'] >= 19.3):
                press('shatter')
            elif st['frozen'] and 'proc' in st['ult']['cls']:
                press('ult')
            elif 'proc' in st['shout']['cls']:
                if REAL and not tapped:
                    pg.click('#ab-shout'); presses['shout'] += 1; tapped = True
                else:
                    press('shout')
            elif usable(st['over']):
                press('over')
            elif usable(st['chop']):
                press('chop')
        elif mode == 'human':
            # slower, sloppier: reacts to glows after a beat, shatters by the countdown with some error
            for k in ('taunt', 'shout', 'ult'):
                if 'proc' in st[k]['cls']:
                    seen.setdefault(k, ms)
                else:
                    seen.pop(k, None)
            if 'proc' in st['shatter']['cls'] and (st['pulse'] <= 0.9 or st['pulse'] >= 18.6):
                seen.setdefault('shatter', ms + int(random.gauss(1050, 280)))
            else:
                seen.pop('shatter', None)
            if 'taunt' in seen and ms - seen['taunt'] >= 900:
                press('taunt'); seen.pop('taunt')
            elif 'shatter' in seen and ms >= seen['shatter'] and 'proc' in st['shatter']['cls']:
                press('shatter'); seen.pop('shatter')
            elif 'ult' in seen and st['frozen'] and ms - seen['ult'] >= 500:
                press('ult'); seen.pop('ult')
            elif 'shout' in seen and ms - seen['shout'] >= 1500:
                press('shout'); seen.pop('shout')
            elif random.random() < 0.6:
                if usable(st['over']):
                    press('over')
                elif usable(st['chop']):
                    press('chop')
        elif mode == 'smash':
            if usable(st['over']):
                press('over')
            elif usable(st['chop']):
                press('chop')
    if not REAL:
        pg.clock.run_for(2600)
    else:
        pg.wait_for_timeout(300)
    st = pg.evaluate(STATE_JS)
    pg.screenshot(path=prefix + '_end.png')
    chips = pg.evaluate("() => Array.from(document.querySelectorAll('.chip')).map(c => c.textContent)")
    loot = pg.evaluate("() => { const r = document.querySelector('#loot-result'); return r ? r.textContent : ''; }")
    tip = pg.evaluate("() => { const r = document.querySelector('.tip'); return r ? r.textContent : ''; }")
    sw = pg.evaluate('[document.documentElement.scrollWidth, document.documentElement.scrollHeight]')
    nodes = pg.evaluate("document.querySelectorAll('#fx > *').length")
    b.close()
print(json.dumps({'mode': mode, 'real': REAL, 'game_s': round(ms / 1000, 1), 'eyebrow': st['eyebrow'], 'title': st['title'], 'boss': st['boss'],
                  'presses': presses, 'lost_spells': lost_spells, 'lost_s': round(lost_frames * 0.1, 1), 'chips': chips, 'tip': tip, 'loot': loot,
                  'scroll': sw, 'viewport': [W, H], 'fx_left': nodes, 'shots': shots, 'log': log[:60], 'errors': errors[:8]}, indent=1))
