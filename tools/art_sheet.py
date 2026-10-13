# A contact sheet of the generated art, so you can LOOK at what you drew before it goes in the game.
# Sprites are drawn at game size on a dusk-grey board with their ground point marked (red dot) and
# their name under them; icon tiles are drawn at 64 px. Writes OUT.html, and OUT.png too when Playwright
# is installed (pip install playwright, then python3 -m playwright install chromium).
# Usage: python3 tools/art_sheet.py OUT.png art/vale.json [art/hearth.json ...] [--only a,b,c] [--cols 6]
import json, os, sys
from pathlib import Path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def inner(svg):
    return svg[svg.index('>') + 1: svg.rindex('</svg>')]


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print('usage: python3 tools/art_sheet.py OUT.png art/x.json [art/y.json ...] [--only a,b] [--cols 6]'); sys.exit(1)
    only, cols = None, 6
    if '--only' in args:
        k = args.index('--only'); only = set(args[k + 1].split(',')); del args[k:k + 2]
    if '--cols' in args:
        k = args.index('--cols'); cols = int(args[k + 1]); del args[k:k + 2]
    out, files = args[0], args[1:]
    sprites, icons = {}, {}
    for f in files:
        data = json.load(open(f if os.path.isabs(f) else os.path.join(os.getcwd(), f), encoding='utf-8'))
        for name, v in data.items():
            if only and name not in only:
                continue
            (sprites if isinstance(v, dict) else icons)[name] = v
    cells = []
    cw, ch = 260, 300
    for i, (name, s) in enumerate(sprites.items()):
        vx, vy, w, h = s['vb']
        k = min(1.0, 200 / max(w, h))
        x, y = (i % cols) * cw + cw / 2, (i // cols) * ch + ch - 60
        cells.append(f'<svg x="{x + vx * k:.1f}" y="{y + vy * k:.1f}" width="{w * k:.1f}" height="{h * k:.1f}" viewBox="{vx} {vy} {w} {h}" overflow="visible">{inner(s["svg"])}</svg>'
                     f'<circle cx="{x}" cy="{y}" r="3" fill="#E04A3F"/><text x="{x}" y="{y + 28}" font-size="15" text-anchor="middle" fill="#FFF8EC" font-family="monospace">{name}{" ×" + format(k, ".2f") if k < 1 else ""}</text>')
    rows = (len(sprites) + cols - 1) // cols
    top = rows * ch + 20
    icols = max(1, cols * 3)
    for i, (name, svg) in enumerate(icons.items()):
        x, y = (i % icols) * 86 + 12, top + (i // icols) * 110
        cells.append(f'<svg x="{x}" y="{y}" width="64" height="64" viewBox="0 0 64 64">{inner(svg)}</svg><text x="{x + 32}" y="{y + 84}" font-size="11" text-anchor="middle" fill="#FFF8EC" font-family="monospace">{name[:12]}</text>')
    W = max(cols * cw, icols * 86 + 24)
    H = top + ((len(icons) + icols - 1) // icols) * 110 + 20
    html = f'<!doctype html><meta charset="utf-8"><body style="margin:0;background:#4A4060"><svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{"".join(cells)}</svg></body>'
    base = out[:-4] if out.endswith('.png') else out
    open(base + '.html', 'w', encoding='utf-8').write(html)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(f'wrote {base}.html (install Playwright for a PNG)'); return
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': W, 'height': H})
        pg.goto(Path(base + '.html').resolve().as_uri())
        pg.wait_for_timeout(200)
        pg.screenshot(path=base + '.png', full_page=True)
        b.close()
    print(f'wrote {base}.png ({len(sprites)} sprites, {len(icons)} icons)')


if __name__ == '__main__':
    main()
