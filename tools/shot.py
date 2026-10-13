# Screenshot a local HTML file. Usage: shot.py in.html out.png width height [full]
import sys
from playwright.sync_api import sync_playwright
src, out, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
full = len(sys.argv) > 5
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': W, 'height': H})
    pg.goto('file://' + src)
    pg.wait_for_timeout(300)
    pg.screenshot(path=out, full_page=full)
    b.close()
