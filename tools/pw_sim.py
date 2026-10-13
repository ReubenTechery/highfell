# Runs one seeded autopilot run of a built page in headless Chromium and prints the result as JSON.
# Browser twin of the node sims: use it to check the built page behaves like the sims say.
# Usage: python3 tools/pw_sim.py PAGE ROLE [seed] [start] [solo] [tier]
import sys, os, json, time, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = ROOT + '/archive/v1/build/fonts/node_modules/@fontsource'


def harness(page_path):
    content = open(page_path, encoding='utf-8').read().replace('<link rel="stylesheet" href="https://fonts.googleapis.com', '<link data-off="1" href="https://fonts.googleapis.com')
    fonts = (f"@font-face{{font-family:'Lilita One';src:url('file://{FONTS}/lilita-one/files/lilita-one-latin-400-normal.woff2')}}"
             f"@font-face{{font-family:'DM Mono';src:url('file://{FONTS}/dm-mono/files/dm-mono-latin-400-normal.woff2')}}"
             f"@font-face{{font-family:'Spectral';src:url('file://{FONTS}/spectral/files/spectral-latin-400-normal.woff2')}}")
    html = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}' + fonts + '</style></head><body>' + content + '</body></html>')
    fd, path = tempfile.mkstemp(suffix='.html', dir=ROOT + '/dist' if os.path.isdir(ROOT + '/dist') else None)
    os.write(fd, html.encode('utf-8')); os.close(fd)
    return path


def run(page_path, role, seed=11, start='entrance', solo=False, tier='mine'):
    path = harness(page_path)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 800, 'height': 600})
        errs = []
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.goto('file://' + path)
        pg.wait_for_function('window.__crypt && document.getElementById("loading").hidden', timeout=20000)
        tierv = 'mine' if tier == 'mine' else int(tier)
        st = pg.evaluate(f'__crypt.start({{ role: "{role}", auto: true, manual: true, seed: {seed}, start: "{start}", solo: {"true" if solo else "false"}, tier: {json.dumps(tierv)} }})')
        t0 = time.time()
        while True:
            st = pg.evaluate('__crypt.step(600)')
            if st['over'] == 'wipe':
                st = pg.evaluate('__crypt.respawn()')
                if st['wipes'] >= 6:
                    break
            if st['over'] in ('victory', 'lost') or st['t'] > 1500 or time.time() - t0 > 300:
                break
        b.close()
    os.unlink(path)
    return {'role': role, 'seed': seed, 'over': st['over'], 't': st['t'], 'clear': st['clear'], 'wipes': st['wipes'], 'stats': st['stats'],
            'heroes': [{k: h[k] for k in ('role', 'dmg', 'heal', 'taken', 'dodges', 'perfect', 'blocks', 'deaths')} for h in st['heroes']], 'errors': errs[:5]}


if __name__ == '__main__':
    a = sys.argv[1:]
    print(json.dumps(run(a[0], a[1], int(a[2]) if len(a) > 2 else 11, a[3] if len(a) > 3 else 'entrance', len(a) > 4 and a[4] == 'solo', a[5] if len(a) > 5 else 'mine')))
