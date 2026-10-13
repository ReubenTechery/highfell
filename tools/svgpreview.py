import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Render an SVG/HTML fragment with the Look Book fonts on a dark page. Usage: svgpreview.py frag.html out.png width
import sys, os
from playwright.sync_api import sync_playwright
frag, out, width = sys.argv[1], sys.argv[2], int(sys.argv[3])
F = HF_ROOT + '/build/fonts/node_modules/@fontsource'
fonts = f"""
@font-face{{font-family:'Lilita One';src:url('file://{F}/lilita-one/files/lilita-one-latin-400-normal.woff2')}}
@font-face{{font-family:'IM Fell English SC';src:url('file://{F}/im-fell-english-sc/files/im-fell-english-sc-latin-400-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:400;font-style:italic;src:url('file://{F}/spectral/files/spectral-latin-400-italic.woff2')}}
@font-face{{font-family:'Spectral';font-weight:400;src:url('file://{F}/spectral/files/spectral-latin-400-normal.woff2')}}
"""
html = '<!doctype html><html><head><meta charset="utf-8"><style>' + fonts + 'body{margin:0;background:#16121C;padding:24px}</style></head><body>' + open(frag).read() + '</body></html>'
page = os.path.abspath(out) + '.html'
open(page, 'w').write(html)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': width, 'height': 600})
    pg.goto('file://' + page)
    pg.wait_for_timeout(300)
    pg.screenshot(path=out, full_page=True)
    b.close()
