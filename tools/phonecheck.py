# Measures horizontal overflow of the last rendered board (_board.html) at a phone width.
import sys
from playwright.sync_api import sync_playwright
page, width = sys.argv[1], int(sys.argv[2])
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': width, 'height': 800})
    pg.goto('file://' + page)
    pg.wait_for_timeout(300)
    sw = pg.evaluate('document.documentElement.scrollWidth')
    wide = pg.evaluate('''(w) => { const out = []; document.querySelectorAll('body *').forEach(el => { const r = el.getBoundingClientRect(); if (r.right > w + 1 && getComputedStyle(el).position !== 'absolute') { let p = el.parentElement, clipped = false; while (p) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'hidden' || o === 'scroll') { clipped = true; break; } p = p.parentElement; } if (!clipped) out.push(el.tagName + ' ' + Math.round(r.right) + ' ' + (el.textContent || '').trim().slice(0, 40)); } }); return out.slice(0, 8); }''', width)
    pg.screenshot(path=sys.argv[3], full_page=False)
    b.close()
print('scrollWidth', sw, 'viewport', width, 'overflowing:', wide)
