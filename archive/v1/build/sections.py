import sys, os
from playwright.sync_api import sync_playwright
BUILD = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(BUILD, "fonts", "node_modules", "@fontsource")
CSS = ["spectral/300.css","spectral/400.css","spectral/500.css","spectral/600.css","spectral/300-italic.css","spectral/400-italic.css","im-fell-english-sc/400.css","dm-mono/400.css","dm-mono/500.css","im-fell-double-pica/400.css","im-fell-double-pica/400-italic.css"]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.route("**/fonts.googleapis.com/**", lambda r: r.abort()); pg.route("**/support.js", lambda r: r.abort())
    pg.goto("file://" + os.path.abspath(sys.argv[1]))
    for c in CSS:
        pg.evaluate("(h) => { const l = document.createElement('link'); l.rel='stylesheet'; l.href=h; document.head.appendChild(l); }", "file://" + os.path.join(FONTS, c))
    pg.wait_for_timeout(600); pg.evaluate("() => document.fonts.ready"); pg.wait_for_timeout(300)
    rows = pg.evaluate("""() => [...document.querySelectorAll('x-dc > div > *')].map(e => {
      const h = e.querySelector('h1,h2,h3,p,div'); const cs = getComputedStyle(e);
      return [e.tagName, Math.round(e.getBoundingClientRect().height), cs.paddingTop + '/' + cs.paddingBottom, (h ? h.textContent : '').trim().slice(0, 50)]; })""")
    for r in rows: print(r)
    print("total", pg.evaluate("() => document.documentElement.scrollHeight"))
    b.close()
