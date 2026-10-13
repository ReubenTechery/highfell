# Opens the built game in headless Chromium, runs optional steps and takes a screenshot.
# Usage: python3 tools/pw_check.py OUT.png [--w 390] [--h 844] [--wait 800] [--js "code"]... [--page dist/highfell.html]
# Each --js runs in the page (await allowed) in order, with a short wait after; console errors are printed.
# Fonts: local copies when they are installed (npm ci --prefix archive/v1/build/fonts), so it works offline;
# otherwise the page loads its web fonts as it normally does.
import sys, os, argparse, tempfile, asyncio
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = Path(ROOT, 'archive/v1/build/fonts/node_modules/@fontsource')
FACES = [('Lilita One', 400, 'lilita-one/files/lilita-one-latin-400-normal.woff2'),
         ('DM Mono', 400, 'dm-mono/files/dm-mono-latin-400-normal.woff2'),
         ('DM Mono', 500, 'dm-mono/files/dm-mono-latin-500-normal.woff2'),
         ('Spectral', 400, 'spectral/files/spectral-latin-400-normal.woff2')]


def wrap(page_path):
    content = open(page_path, encoding='utf-8').read()
    fonts = ''
    if FONTS.is_dir():
        content = content.replace('<link rel="stylesheet" href="https://fonts.googleapis.com', '<link data-off="1" href="https://fonts.googleapis.com')
        fonts = ''.join(f"@font-face{{font-family:'{fam}';font-weight:{wt};src:url('{(FONTS / f).as_uri()}')}}" for fam, wt, f in FACES)
    html = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            '<style>body{margin:0}' + fonts + '</style></head><body>' + content + '</body></html>')
    fd, path = tempfile.mkstemp(suffix='.html', dir=ROOT + '/dist')
    os.write(fd, html.encode('utf-8')); os.close(fd)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--w', type=int, default=390)
    ap.add_argument('--h', type=int, default=844)
    ap.add_argument('--wait', type=int, default=900)
    ap.add_argument('--js', action='append', default=[])
    ap.add_argument('--page', default=ROOT + '/dist/highfell.html')
    ap.add_argument('--touch', action='store_true')
    ap.add_argument('--full', action='store_true')
    a = ap.parse_args()
    path = wrap(a.page)
    errs = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': a.w, 'height': a.h}, has_touch=a.touch, is_mobile=a.touch, device_scale_factor=2 if a.touch else 1)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.goto(Path(path).as_uri())
        pg.wait_for_timeout(a.wait)
        for js in a.js:
            r = pg.evaluate('async () => { ' + js + ' }')
            if r is not None:
                print('js ->', r)
            pg.wait_for_timeout(400)
        pg.screenshot(path=a.out, full_page=a.full)
        b.close()
    os.remove(path)
    for e in errs:
        print(e)
    print('ok', a.out)


if __name__ == '__main__':
    main()
