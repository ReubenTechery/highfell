import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Play-tests the Barrow Crypt page.
# Usage:
#   dgtest.py start W H out.png                      start screen screenshot
#   dgtest.py sim ROLE [seed] [start] [solo] [tier]    headless autopilot run, prints a log + summary
#   dgtest.py real ROLE W H prefix seconds [start] [tier]  real-time autopilot with screenshots every few seconds
import sys, os, json, time
from playwright.sync_api import sync_playwright
B = HF_ROOT + '/'
PAGE = B + 'dungeon/barrow-crypt.html'
F = B + 'build/fonts/node_modules/@fontsource'
fonts = f"""
@font-face{{font-family:'Lilita One';src:url('file://{F}/lilita-one/files/lilita-one-latin-400-normal.woff2')}}
@font-face{{font-family:'DM Mono';font-weight:400;src:url('file://{F}/dm-mono/files/dm-mono-latin-400-normal.woff2')}}
@font-face{{font-family:'DM Mono';font-weight:500;src:url('file://{F}/dm-mono/files/dm-mono-latin-500-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:400;src:url('file://{F}/spectral/files/spectral-latin-400-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:500;src:url('file://{F}/spectral/files/spectral-latin-500-normal.woff2')}}
"""


def harness(tag):
    content = open(PAGE, encoding='utf-8').read().replace('<link rel="stylesheet" href="https://fonts.googleapis.com', '<link data-off="1" href="https://fonts.googleapis.com')
    html = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}' + fonts + '</style></head><body>' + content + '</body></html>')
    path = B + f'build/dungeon/_h_{tag}.html'
    open(path, 'w', encoding='utf-8').write(html)
    return path


def open_page(p, W, H, tag, touch=False):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': W, 'height': H}, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errs.append('console ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.goto('file://' + harness(tag))
    pg.wait_for_function('window.__crypt && !document.getElementById("loading") || document.getElementById("loading").hidden', timeout=15000)
    pg.wait_for_timeout(300)
    return b, pg, errs


mode = sys.argv[1]
with sync_playwright() as p:
    if mode == 'start':
        W, H, out = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        b, pg, errs = open_page(p, W, H, 'start', touch=W < 800)
        pg.screenshot(path=out)
        print(json.dumps({'errors': errs[:6]}))
        b.close()
    elif mode == 'sim':
        role = sys.argv[2]
        seed = int(sys.argv[3]) if len(sys.argv) > 3 else 11
        start = sys.argv[4] if len(sys.argv) > 4 else 'entrance'
        solo = len(sys.argv) > 5 and sys.argv[5] == 'solo'
        tier = sys.argv[6] if len(sys.argv) > 6 else 'mine'
        tierv = 'mine' if tier == 'mine' else int(tier)
        skill = float(sys.argv[7]) if len(sys.argv) > 7 else 0
        b, pg, errs = open_page(p, 800, 600, 'sim_' + role + str(seed) + tier + str(skill))
        st = pg.evaluate(f'__crypt.start({{ role: "{role}", auto: true, manual: true, seed: {seed}, start: "{start}", solo: {"true" if solo else "false"}, tier: {json.dumps(tierv)}, skill: {skill} }})')
        log = []
        last_packs = st['packs']
        t0 = time.time()
        while True:
            st = pg.evaluate('__crypt.step(300)')
            line = f"t={st['t']:6.1f} packs={st['packs']} cp={st['cp']} mobs={st['mobs']} " + ' '.join(f"{h['role'][0]}:{h['hp']}/{h['max']}{'' if h['alive'] else 'X'}" for h in st['heroes'])
            if st['boss']:
                line += f" BOSS {st['boss']['name'][:10]} {st['boss']['hp']}% p{st['boss']['phase']}"
            if st['packs'] != last_packs or st['over'] or int(st['t']) % 15 == 0:
                log.append(line)
            last_packs = st['packs']
            if st['over'] == 'wipe':
                log.append('WIPE ' + line)
                st = pg.evaluate('__crypt.respawn()')
                if st['wipes'] >= 6:
                    break
            if st['over'] in ('victory', 'lost'):
                break
            if st['t'] > 1500 or time.time() - t0 > 400:
                log.append('TIMEOUT')
                break
        print('\n'.join(log[-60:]))
        print(json.dumps({'role': role, 'seed': seed, 'over': st['over'], 't': st['t'], 'clear': st['clear'], 'wipes': st['wipes'], 'stats': st['stats'],
                          'heroes': [{k: h[k] for k in ('role', 'dmg', 'heal', 'taken', 'dodges', 'perfect', 'blocks', 'deaths')} for h in st['heroes']], 'errors': errs[:8]}))
        b.close()
    elif mode == 'real':
        role, W, H, prefix, secs = sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5], float(sys.argv[6])
        start = sys.argv[7] if len(sys.argv) > 7 else 'entrance'
        tier = sys.argv[8] if len(sys.argv) > 8 else 'mine'
        tierv = 'mine' if tier == 'mine' else int(tier)
        b, pg, errs = open_page(p, W, H, 'real_' + os.path.basename(prefix), touch=W < 800)
        pg.evaluate(f'__crypt.start({{ role: "{role}", auto: true, manual: false, seed: 5, start: "{start}", tier: {json.dumps(tierv)} }})')
        pg.evaluate('__crypt.live()')
        t0 = time.time(); k = 0; shots = []
        every = float(os.environ.get('EVERY', '6'))
        nxt = 1.5
        while time.time() - t0 < secs:
            pg.wait_for_timeout(250)
            el = time.time() - t0
            if el >= nxt:
                path = f'{prefix}_{k:02d}.png'; pg.screenshot(path=path); shots.append((round(el, 1), path)); k += 1; nxt += every
            st = pg.evaluate('__crypt.snap()')
            if st['over'] == 'victory':
                pg.wait_for_timeout(1800); pg.screenshot(path=f'{prefix}_loot.png'); shots.append(('loot', f'{prefix}_loot.png')); break
            if st['over'] == 'wipe':
                pg.wait_for_timeout(1900); pg.screenshot(path=f'{prefix}_wipe.png'); shots.append(('wipe', f'{prefix}_wipe.png')); pg.evaluate('__crypt.respawn()')
        st = pg.evaluate('__crypt.snap()')
        print(json.dumps({'shots': shots, 'state': {k2: st[k2] for k2 in ('t', 'over', 'packs', 'boss', 'wipes')}, 'errors': errs[:8]}))
        b.close()
