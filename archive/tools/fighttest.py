import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# One headless play-through of the fight page with a fake clock.
# Usage: fighttest.py page.html mode(good|idle) width height shots_prefix
import sys, os, json
from playwright.sync_api import sync_playwright
page_file, mode, W, H, prefix = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
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
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}' + fonts + '</style></head><body>' + content + '</body></html>')
harness = os.path.abspath(prefix + '_harness.html')
open(harness, 'w', encoding='utf-8').write(html)

STATE_JS = """() => {
  const q = (s) => document.querySelector(s);
  const cls = (id) => q('#' + id).className;
  return {
    overlay: !q('#overlay').hidden,
    eyebrow: q('#ov-card .eyebrow') ? q('#ov-card .eyebrow').textContent : '',
    title: q('#ov-title') ? q('#ov-title').textContent : '',
    pulse: parseFloat(q('#pulse-time').textContent),
    boss: q('#boss-pct').textContent,
    chop: cls('ab-chop'), over: cls('ab-overhead'), shout: cls('ab-shout'), taunt: cls('ab-taunt'), shatter: cls('ab-shatter'), ult: cls('ab-ult'),
    frozen: q('#boss-wrap').classList.contains('frozen'),
    rage: q('#rage-num').textContent, dmg: q('#my-dmg').textContent
  };
}"""
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': W, 'height': H})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.clock.install()
    pg.goto('file://' + harness)
    pg.clock.run_for(600)
    pg.screenshot(path=prefix + '_intro.png')
    pg.click('#pull-btn')
    presses = {'chop': 0, 'over': 0, 'shout': 0, 'taunt': 0, 'shatter': 0, 'ult': 0}
    shot_mid = False
    ms = 0
    while ms < 200000:
        pg.clock.run_for(100)
        ms += 100
        st = pg.evaluate(STATE_JS)
        if st['overlay']:
            break
        if mode == 'good':
            def press(k, name):
                pg.keyboard.press(k); presses[name] += 1
            if 'urgent' in st['taunt']:
                press('Digit4', 'taunt')
            elif 'window' in st['shatter'] and st['pulse'] <= 0.2:
                press('Space', 'shatter')
            elif 'window' in st['shatter'] and st['pulse'] >= 19.3:
                press('Space', 'shatter')
            elif st['frozen'] and 'ready' in st['ult'] and 'used' not in st['ult']:
                press('Digit6', 'ult')
            elif st['pulse'] <= 5.0 and 'ready' in st['shout']:
                press('Digit3', 'shout')
            elif 'ready' in st['over']:
                press('Digit2', 'over')
            elif 'ready' in st['chop']:
                press('Digit1', 'chop')
        if mode == 'smash':
            if 'ready' in st['over']:
                pg.keyboard.press('Digit2'); presses['over'] += 1
            elif 'ready' in st['chop']:
                pg.keyboard.press('Digit1'); presses['chop'] += 1
        if not shot_mid and ms >= 19800:
            pg.screenshot(path=prefix + '_mid.png')
            shot_mid = True
    pg.clock.run_for(2600)
    st = pg.evaluate(STATE_JS)
    pg.screenshot(path=prefix + '_end.png', full_page=True)
    chips = pg.evaluate("() => Array.from(document.querySelectorAll('.chip')).map(c => c.textContent)")
    loot = pg.evaluate("() => { const r = document.querySelector('#loot-result'); return r ? r.textContent : ''; }")
    sw = pg.evaluate('document.documentElement.scrollWidth')
    b.close()
print(json.dumps({'mode': mode, 'game_ms': ms, 'eyebrow': st['eyebrow'], 'title': st['title'], 'boss': st['boss'], 'presses': presses, 'chips': chips, 'loot': loot, 'scrollWidth': sw, 'viewport': W, 'errors': errors[:8]}, indent=1))
