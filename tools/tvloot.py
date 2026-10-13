# Loot icons for the fight's end screen, in the locked TV-cartoon style (black line, flat colour, one flat halo).
# Run directly to write a preview: tvloot.py out.html
import sys

K = '#1E1A1A'


def p(d, fill, w=2.4, extra=''):
    return f'<path d="{d}" style="fill: {fill}; stroke: {K}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round{extra}"/>'


def ln(d, col=K, w=2.2):
    return f'<path d="{d}" style="fill: none; stroke: {col}; stroke-width: {w}; stroke-linecap: round; stroke-linejoin: round"/>'


def c(cx, cy, r, fill, w=2):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" style="fill: {fill}; stroke: {K}; stroke-width: {w}"/>'


def halo(col):
    return f'<circle cx="24" cy="25" r="22" style="fill: {col}; opacity: 0.32"/>'


def svg(inner):
    return f'<svg viewBox="0 0 48 48" aria-hidden="true">{inner}</svg>'


crown = svg(
    halo('#B79CFF') +
    p('M8 33 L7 16 L16 24 L24 10 L32 24 L41 16 L40 33 Z', '#F2C230') +
    ln('M13 21 L15 30 M35 21 L33 30', '#FFE08A', 2) +
    p('M7 32 H41 V39 C41 40.5 40 41 38.5 41 H9.5 C8 41 7 40.5 7 39 Z', '#E0A82A') +
    c(7, 15, 2.6, '#F2C230') + c(24, 9, 3, '#F2C230') + c(41, 15, 2.6, '#F2C230') +
    c(15, 36.5, 2.3, '#E04A3F', 1.8) + c(24, 36.5, 2.6, '#9BE15D', 1.8) + c(33, 36.5, 2.3, '#4F86C6', 1.8) +
    p('M24 18 L27 23 L24 28 L21 23 Z', '#B79CFF', 1.8)
)

lantern = svg(
    halo('#8FD6FF') +
    ln('M18 11 C18 4 30 4 30 11', K, 2.6) +
    p('M14 12 H34 L31 17 H17 Z', '#7D8FA3') +
    p('M16 17 H32 V35 H16 Z', '#DDF3FF') +
    p('M24 19.5 C28.5 19.5 29.5 23.5 29.5 27 V33 L27.5 31.2 L25.8 33 L24 31.2 L22.2 33 L20.5 31.2 L18.5 33 V27 C18.5 23.5 19.5 19.5 24 19.5 Z', '#8FD6FF', 1.8) +
    c(22, 25.5, 1.1, K, 0) + c(26, 25.5, 1.1, K, 0) +
    ln('M22.5 28.6 C23.5 29.4 24.5 29.4 25.5 28.6', K, 1.4) +
    p('M14 35 H34 L32 40 H16 Z', '#7D8FA3') +
    ln('M19 15 H29', '#B8C6D6', 1.6)
)

bracers = svg(
    halo('#9BD068') +
    '<g transform="rotate(-32 24 25)">' +
    p('M11 14 C21 14 31 16.5 39 19 C41.5 22.5 41.5 27.5 39 31 C31 33.5 21 36 11 36 C8 31 8 19 11 14 Z', '#8A5A34') +
    ln('M38.2 19.6 C36.4 23 36.4 27.2 38.2 30.4', '#5E3A20', 1.8) +
    p('M14.5 25 L18.5 21.2 L22.5 25 L26.5 21.6 L30.5 25 L34.5 22 M14.5 25 L18.5 28.8 L22.5 25 L26.5 28.4 L30.5 25 L34.5 28', 'none', 3.8) +
    ln('M14.5 25 L18.5 21.2 L22.5 25 L26.5 21.6 L30.5 25 L34.5 22 M14.5 25 L18.5 28.8 L22.5 25 L26.5 28.4 L30.5 25 L34.5 28', '#F3E6CC', 1.6) +
    c(33, 18.6, 1.9, '#F2C230', 1.6) + c(33, 31.4, 1.9, '#F2C230', 1.6) +
    p('M13 10 C9 9.5 6 12.5 7.2 15.5 C4.4 17.5 5 21.5 7 22.8 C4.4 25.5 5 29.5 7.2 30.8 C5.5 34 7.6 38 11.5 38 C12.8 40 16 39.4 15.6 36.8 C11.6 30.5 11.6 18.5 15.6 12.4 C15.8 10.2 14.6 9.4 13 10 Z', '#C9C2B4') +
    ln('M9.6 17.5 L11.2 18.4 M9.4 25 L11.2 25.2 M9.8 32.2 L11.4 31.4', '#8E877A', 1.5) +
    '</g>'
)

LOOT_ICONS = {'crown': crown, 'lantern': lantern, 'bracers': bracers}

if __name__ == '__main__':
    out = sys.argv[1]
    cells = ''.join(f'<div style="width:{s}px;height:{s}px">{v.replace("<svg ", "<svg style=\"display:block;width:100%;height:100%\" ")}</div>'
                    for s in (120, 56, 40) for v in LOOT_ICONS.values())
    open(out, 'w').write(f'<body style="margin:0;padding:20px;background:#F3E6CC"><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;width:620px">{cells}</div></body>')
    print('ok', {k: len(v) for k, v in LOOT_ICONS.items()})
