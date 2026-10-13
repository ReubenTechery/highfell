import sys, os, json
from playwright.sync_api import sync_playwright

BUILD = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(BUILD, "fonts", "node_modules", "@fontsource")
CSS = [
    "spectral/300.css", "spectral/400.css", "spectral/500.css", "spectral/600.css",
    "spectral/300-italic.css", "spectral/400-italic.css",
    "im-fell-english-sc/400.css", "dm-mono/400.css", "dm-mono/500.css",
    "im-fell-double-pica/400.css", "im-fell-double-pica/400-italic.css",
]

page_file = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else None
clips = json.loads(sys.argv[3]) if len(sys.argv) > 3 else []
width = 1440

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": width, "height": 900})
    pg.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    pg.route("**/support.js", lambda r: r.abort())
    pg.goto("file://" + os.path.abspath(page_file))
    for c in CSS:
        pg.evaluate("(h) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); }", "file://" + os.path.join(FONTS, c))
    pg.wait_for_timeout(600)
    pg.evaluate("() => document.fonts.ready")
    pg.wait_for_timeout(300)
    h = pg.evaluate("() => document.documentElement.scrollHeight")
    loaded = pg.evaluate("() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight + ' ' + f.style)")
    print("height", h)
    print("fonts", sorted(set(loaded)))
    if out:
        if clips:
            for i, c in enumerate(clips):
                pg.screenshot(path=out.replace(".png", f"_{i}.png"), full_page=True, clip={"x": 0, "y": c[0], "width": width, "height": c[1]})
        else:
            pg.screenshot(path=out, full_page=True)
    b.close()
