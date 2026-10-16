# Mockup art: the four Barrow sets on a wardrobe stand, drawn in the locked style with the game's own
# helpers (tools/art_sprites.py). Each piece is <g class="pc ..."><g class="sil">..</g><g class="det">..</g></g>
# so the page can draw a missing piece as a ghost (sil only, dashed) and a found one in full colour.
# A draft for the collection-log proposal, not game art yet. Run from anywhere: python3 docs/proposals/collection-log/mannequins.py
# Writes shots/log-proposal/mannequins.json and mannequins.html (a check sheet of every set: done, part, empty, gilded).
import json, sys, os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / 'shots' / 'log-proposal'
WORK.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT / 'tools'))
from art_sprites import (K, s, ln, beam, c, e, halo, m, both, gild, f,
                         BONE, BONE_D, GRN, GRN_L, STEEL, STEEL_D, STEEL_L, GOLD, GOLD_D, RED, RED_D,
                         BLUE, BLUE_D, WOOD, WOOD_D, PURP, PURP_D, FROST, FROST_L, FIRE, FLAME)
from art_hearth import lantern_parts

OUT = str(WORK)
VB = (-104, -262, 232, 270)
CANVAS, CANVAS_D = '#E3D3B0', '#BFA77E'
CLOTH, CLOTH_D = '#2F2838', '#221C2A'      # Candlewake's black robes
LEATHER, LEATHER_D = '#5B4361', '#46324C'  # Shadeveil's oiled leather
HOOD = '#2E2440'
FUR = '#F2EEE6'
SHAFT = '#5C4A6A'


def pc(cls, sil, det):
    return f'<g class="pc {cls}"><g class="sil">{"".join(sil)}</g><g class="det">{"".join(det)}</g></g>'


# ---------------------------------------------------------------- the bare stand
def stand():
    o = [s('M-48 0 L-40 -14 L40 -14 L48 0 Z', WOOD_D, 4),
         s('M-7 -14 L-7 -100 L7 -100 L7 -14 Z', WOOD, 4),
         s('M-33 -176 C-39 -146 -35 -118 -24 -98 L24 -98 C35 -118 39 -146 33 -176 C16 -183 -16 -183 -33 -176 Z', CANVAS, 4),
         ln('M0 -178 L0 -100', CANVAS_D, 3), ln('M-22 -150 C-14 -146 -8 -146 -3 -150', '#F6EBD3', 3),
         s('M-26 -104 L26 -104 L26 -94 L-26 -94 Z', WOOD_D, 3.5),
         s('M-8 -192 L-8 -176 L8 -176 L8 -192 Z', WOOD, 3),
         c(0, -210, 20, WOOD, 4), ln('M-10 -220 C-6 -225 0 -226 4 -225', '#A9764A', 3)]
    return ''.join(o)


# ---------------------------------------------------------------- Barrowguard: bone plate, skulls, ribs
def skull(cx, cy, k=1.0):
    q = lambda dx, dy: f'{f(cx + dx * k)} {f(cy + dy * k)}'
    sil = [s(f'M{q(-24, 4)} C{q(-27, -14)} {q(-15, -24)} {q(0, -24)} C{q(15, -24)} {q(27, -14)} {q(24, 4)} C{q(22, 10)} {q(18, 12)} {q(14, 13)} L{q(12, 24)} C{q(6, 28)} {q(-6, 28)} {q(-12, 24)} L{q(-14, 13)} C{q(-18, 12)} {q(-22, 10)} {q(-24, 4)} Z', BONE, 4)]
    det = [s(f'M{q(-17, -6)} L{q(-3, -1)} L{q(-5, 6)} C{q(-9, 8)} {q(-15, 6)} {q(-17, -6)} Z', K, 0),
           s(f'M{q(17, -6)} L{q(3, -1)} L{q(5, 6)} C{q(9, 8)} {q(15, 6)} {q(17, -6)} Z', K, 0),
           s(f'M{q(0, 6)} L{q(-3.5, 12)} L{q(3.5, 12)} Z', K, 0),
           ln(f'M{q(-7, 15)} L{q(-7, 24)} M{q(0, 15)} L{q(0, 26)} M{q(7, 15)} L{q(7, 24)}', K, 2.6),
           ln(f'M{q(-15, -16)} C{q(-10, -20)} {q(-4, -21)} {q(1, -20)}', '#FFFFFF', 3)]
    return sil, det


def barrowguard():
    helm_sil = [s('M-30 -214 C-42 -216 -52 -230 -50 -250 C-44 -240 -36 -234 -26 -232 Z', BONE, 3.5),
                s(m('M-30 -214 C-42 -216 -52 -230 -50 -250 C-44 -240 -36 -234 -26 -232 Z'), BONE, 3.5),
                s('M-28 -190 C-31 -226 -18 -244 0 -244 C18 -244 31 -226 28 -190 Z', BONE, 4),
                s('M-27 -208 L27 -208 L25 -188 C15 -182 -15 -182 -25 -188 Z', BONE_D, 3.5)]
    helm_det = [e(-10, -218, 6.5, 5, K, 0), e(10, -218, 6.5, 5, K, 0),
                ln('M-15 -206 L-15 -190 M-7.5 -206 L-7.5 -186 M0 -206 L0 -185 M7.5 -206 L7.5 -186 M15 -206 L15 -190', K, 2.6),
                ln('M0 -242 L0 -226', BONE_D, 3), ln('M-18 -234 C-14 -238 -9 -240 -4 -240', '#FFFFFF', 3)]
    sh_sil, sh_det = [], []
    plate = 'M-30 -182 C-52 -194 -76 -184 -80 -158 C-68 -162 -50 -162 -32 -156 Z'
    sh_sil += [s(plate, BONE_D, 4), s(m(plate), BONE_D, 4)]
    for sx in (-1, 1):
        a, b = skull(sx * 54, -176, 0.92)
        sh_sil += a; sh_det += b
    chest = 'M-36 -178 C-42 -146 -38 -116 -26 -96 L26 -96 C38 -116 42 -146 36 -178 C18 -186 -18 -186 -36 -178 Z'
    ch_sil = [s(chest, BONE, 4)]
    ch_det = [s('M-5 -176 L5 -176 L5 -112 L-5 -112 Z', BONE_D, 3)]
    for y, w in ((-160, 27), (-142, 27), (-124, 22)):
        d = f'M-6 {y} C-12 {y - 6} -{w - 6} {y - 5} -{w} {y + 4}'
        ch_det.append(beam(d, BONE_D, 6, 2.6) + beam(m(d), BONE_D, 6, 2.6))
    ch_det += [s('M-28 -110 L28 -110 L28 -96 L-28 -96 Z', WOOD_D, 3.5), s('M-7 -111 L7 -111 L7 -95 L-7 -95 Z', GOLD, 2.6)]
    wp_sil = [s('M50 -16 L66 -10 L62 4 L46 -2 Z', '#8E96A3', 3.5),
              beam('M58 -8 L88 -206', '#A0703F', 7, 4),
              s('M82 -206 C94 -236 124 -232 124 -198 C110 -198 94 -200 82 -206 Z', '#D7DEE6', 4)]
    wp_det = [c(73, -108, 5, GRN, 2.4), ln('M92 -218 C100 -224 110 -224 116 -218', '#FFFFFF', 3)]
    return {'helm': pc('helm', helm_sil, helm_det), 'shoulders': pc('shoulders', sh_sil, sh_det),
            'chest': pc('chest', ch_sil, ch_det), 'weapon': pc('weapon', wp_sil, wp_det)}


# ---------------------------------------------------------------- Candlewake: black robes, candle crown, lantern
def candlewake():
    helm_sil = [s('M-26 -208 C-10 -213 10 -213 26 -208 L26 -192 C10 -197 -10 -197 -26 -192 Z', GOLD, 3.5)]
    helm_det = []
    for x, h in ((-22, 14), (-15, 20), (-7.5, 26), (0, 30), (7.5, 26), (15, 20), (22, 14)):
        y0 = -209 - (2 if abs(x) < 10 else 0)
        helm_sil.append(s(f'M{f(x - 3.6)} {f(y0 + 2)} L{f(x - 3.6)} {f(y0 - h)} L{f(x + 3.6)} {f(y0 - h)} L{f(x + 3.6)} {f(y0 + 2)} Z', BONE, 2.6))
        ft = y0 - h - 15
        helm_det.append(halo(x, ft + 8, 9, FLAME, 0.32))
        helm_det.append(s(f'M{f(x)} {f(ft)} C{f(x + 5)} {f(ft + 7)} {f(x + 4.5)} {f(ft + 13)} {f(x)} {f(ft + 13)} C{f(x - 4.5)} {f(ft + 13)} {f(x - 5)} {f(ft + 7)} {f(x)} {f(ft)} Z', FLAME, 2.2))
    helm_det += [c(0, -201, 3.6, RED, 2), ln('M-20 -204 C-12 -206 -6 -207 -2 -207', '#FFF3C4', 2.4)]
    mantle = 'M-38 -184 C-60 -186 -80 -168 -82 -140 C-72 -146 -60 -146 -52 -138 C-44 -150 -26 -154 0 -152 C26 -154 44 -150 52 -138 C60 -146 72 -146 82 -140 C80 -168 60 -186 38 -184 C20 -190 -20 -190 -38 -184 Z'
    sh_sil = [s(mantle, CLOTH, 4)]
    sh_det = [ln('M-78 -146 C-68 -150 -60 -150 -52 -143 C-44 -154 -26 -158 0 -156 C26 -158 44 -154 52 -143 C60 -150 68 -150 78 -146', GOLD, 3)]
    for x, y, h in ((-66, -147, 10), (-40, -151, 14), (22, -155, 9), (60, -147, 12)):
        sh_det.append(s(f'M{f(x - 4)} {f(y)} L{f(x + 4)} {f(y)} L{f(x + 3)} {f(y + h)} C{f(x + 3)} {f(y + h + 4)} {f(x - 3)} {f(y + h + 4)} {f(x - 3)} {f(y + h)} Z', BONE, 2.2))
    sh_det += [c(0, -164, 6.5, GOLD, 3), ln('M-60 -176 C-52 -180 -44 -181 -36 -180', '#4A4058', 3)]
    robe = 'M-34 -178 C-44 -140 -48 -98 -56 -60 L56 -60 C48 -98 44 -140 34 -178 C16 -186 -16 -186 -34 -178 Z'
    ch_sil = [s(robe, CLOTH, 4)]
    ch_det = [s('M-6 -176 L6 -176 L10 -62 L-10 -62 Z', GOLD_D, 3),
              ln('M-30 -112 C-10 -105 10 -105 30 -112', GOLD, 4), ln('M18 -108 L22 -88', GOLD, 4),
              s('M-14 -178 L-10 -168 L-6 -176 L-2 -164 L2 -176 L6 -170 L10 -177 L14 -178 Z', BONE, 2.2),
              ln('M-40 -96 C-38 -84 -40 -74 -44 -66', '#4A4058', 3)]
    wp_sil = [beam('M66 -2 L72 -222', WOOD, 6, 4), ln('M72 -222 C78 -232 90 -230 92 -220', K, 4)]
    lant = lantern_parts(92, -216, GRN, '#2E4A3A', lit=True, k=1.0)
    wp_det = [halo(92, -190, 26, GRN, 0.22)] + lant
    return {'helm': pc('helm', helm_sil, helm_det), 'shoulders': pc('shoulders', sh_sil, sh_det),
            'chest': pc('chest', ch_sil, ch_det), 'weapon': pc('weapon', wp_sil + lant[1:3], wp_det)}


# ---------------------------------------------------------------- Rimebone: frosted bone crown, icicles, wolf fur
def rimebone():
    crown = 'M-25 -196 L-28 -226 L-16 -208 L-10 -242 L0 -212 L10 -242 L16 -208 L28 -226 L25 -196 Z'
    helm_sil = [s(crown, BONE, 3.5), s('M-26 -200 L26 -200 L26 -188 L-26 -188 Z', BONE_D, 3.5)]
    helm_det = [s('M-31 -224 L-28 -232 L-24 -224 Z', FROST_L, 2), s('M-13 -240 L-10 -249 L-6 -240 Z', FROST_L, 2),
                s('M7 -240 L10 -249 L13 -240 Z', FROST_L, 2), s('M24 -224 L28 -232 L31 -224 Z', FROST_L, 2),
                c(0, -194, 4.6, FROST, 2.4), c(-14, -194, 2.6, FROST_L, 1.6), c(14, -194, 2.6, FROST_L, 1.6),
                ln('M-6 -226 L-8 -214', '#FFFFFF', 2.4)]
    mantle = 'M-36 -182 C-58 -190 -80 -176 -80 -150 L-58 -150 C-50 -158 -40 -160 -30 -158 L30 -158 C40 -160 50 -158 58 -150 L80 -150 C80 -176 58 -190 36 -182 C18 -188 -18 -188 -36 -182 Z'
    sh_sil = [s(mantle, BLUE, 4)]
    sh_det = []
    for x in (-74, -62, -50, -38, 38, 50, 62, 74):
        y = -151 if abs(x) > 40 else -159
        h = 18 if abs(x) in (62, 38) else 13
        sh_det.append(s(f'M{f(x - 5)} {f(y)} L{f(x + 5)} {f(y)} L{f(x)} {f(y + h)} Z', FROST_L, 2.4))
    sh_det += [c(-62, -126, 2.4, FROST, 0), c(38, -132, 2.4, FROST, 0), ln('M-66 -178 C-58 -182 -50 -183 -42 -182', '#7D98C8', 3)]
    robe = 'M-34 -178 C-44 -140 -46 -102 -52 -70 L52 -70 C46 -102 44 -140 34 -178 C16 -186 -16 -186 -34 -178 Z'
    fur = 'M-32 -182 C-26 -166 -12 -160 0 -160 C12 -160 26 -166 32 -182 C20 -194 -20 -194 -32 -182 Z'
    ch_sil = [s(robe, BLUE_D, 4), s(fur, FUR, 3.5)]
    ch_det = [ln('M-26 -172 L-22 -168 M-14 -166 L-10 -163 M0 -163 L0 -159 M14 -166 L10 -163 M26 -172 L22 -168', STEEL_L, 2.6),
              s('M-5 -160 L5 -160 L8 -72 L-8 -72 Z', FROST_L, 2.6),
              ln('M-10 -122 L10 -122 M0 -132 L0 -112 M-7 -129 L7 -115 M7 -129 L-7 -115', FROST_L, 2.6),
              ln('M-46 -84 L46 -84', FROST_L, 3)]
    wp_sil = [beam('M64 -2 L76 -196', SHAFT, 6, 4),
              s('M62 -214 C62 -232 92 -232 92 -214 C92 -204 86 -200 84 -194 L70 -194 C68 -200 62 -204 62 -214 Z', BONE, 3.5)]
    wp_det = [halo(77, -214, 24, FROST, 0.3), c(71, -214, 4, FROST, 2), c(83, -214, 4, FROST, 2),
              ln('M73 -198 L73 -194 M77 -198 L77 -194 M81 -198 L81 -194', K, 2), ln('M66 -222 C70 -228 76 -229 81 -228', '#FFFFFF', 2.4)]
    return {'helm': pc('helm', helm_sil, helm_det), 'shoulders': pc('shoulders', sh_sil, sh_det),
            'chest': pc('chest', ch_sil, ch_det), 'weapon': pc('weapon', wp_sil, wp_det)}


# ---------------------------------------------------------------- Shadeveil: stitched mask, bone blades, leather
def shadeveil():
    hood = 'M-29 -186 C-35 -214 -22 -242 0 -246 C22 -242 35 -214 29 -186 C18 -180 -18 -180 -29 -186 Z'
    helm_sil = [s(hood, HOOD, 4)]
    helm_det = [s('M-18 -192 C-21 -210 -12 -224 0 -224 C12 -224 21 -210 18 -192 Z', K, 0),
                c(-7.5, -211, 3.8, GRN, 0), c(7.5, -211, 3.8, GRN, 0), c(-7, -211.6, 1.4, GRN_L, 0), c(8, -211.6, 1.4, GRN_L, 0),
                s('M-20 -205 L20 -205 L17 -190 C8 -186 -8 -186 -17 -190 Z', '#3A2F4A', 3),
                ln('M-12 -201 L-8 -195 M-8 -201 L-12 -195 M-2 -201 L2 -195 M2 -201 L-2 -195 M8 -201 L12 -195 M12 -201 L8 -195', BONE_D, 2),
                ln('M-14 -238 C-8 -242 -2 -243 4 -242', '#4A3D62', 3)]
    guard = 'M-33 -182 C-54 -190 -74 -178 -74 -154 C-62 -158 -46 -158 -31 -154 Z'
    blade = 'M-46 -186 C-52 -206 -64 -218 -82 -224 C-74 -208 -68 -196 -62 -184 Z'
    blade2 = 'M-62 -178 C-74 -190 -88 -194 -100 -192 C-90 -184 -82 -176 -74 -168 Z'
    sh_sil = [s(blade, BONE, 3.5), s(m(blade), BONE, 3.5), s(blade2, BONE, 3.5), s(m(blade2), BONE, 3.5),
              s(guard, LEATHER_D, 4), s(m(guard), LEATHER_D, 4)]
    sh_det = [c(-54, -170, 3.6, GRN, 2), c(54, -170, 3.6, GRN, 2),
              ln('M-66 -170 C-60 -174 -52 -176 -44 -175 M66 -170 C60 -174 52 -176 44 -175', '#6E567A', 2.6)]
    chest = 'M-35 -178 C-42 -146 -38 -116 -26 -96 L26 -96 C38 -116 42 -146 35 -178 C18 -186 -18 -186 -35 -178 Z'
    ch_sil = [s(chest, LEATHER, 4)]
    ch_det = [beam('M-28 -172 L24 -108', WOOD, 6, 3), beam('M28 -172 L-24 -108', WOOD, 6, 3),
              c(0, -140, 6, GOLD, 3), s('M-28 -110 L28 -110 L28 -98 L-28 -98 Z', LEATHER_D, 3.5),
              s('M14 -110 L26 -110 L26 -94 L14 -94 Z', WOOD_D, 3), ln('M-24 -160 C-18 -156 -12 -156 -8 -158', '#7A6080', 3)]
    fang = 'M70 -40 C58 -84 62 -130 90 -164 C92 -150 86 -146 84 -132 C80 -100 82 -74 84 -46 Z'
    fang2 = 'M96 -36 C112 -78 110 -126 86 -160 C86 -146 92 -140 94 -128 C100 -98 100 -76 94 -44 Z'
    wp_sil = [s('M64 -40 L90 -40 L88 -30 L66 -30 Z', '#4A4458', 3), s('M72 -30 L82 -30 L80 -4 L74 -4 Z', '#4A4458', 3),
              s(fang, BONE, 3.5),
              s('M86 -34 L112 -34 L110 -24 L88 -24 Z', '#4A4458', 3), s('M94 -24 L104 -24 L102 2 L96 2 Z', '#4A4458', 3),
              s(fang2, BONE, 3.5)]
    wp_det = [c(77, -2, 3.6, GRN, 2), c(99, 4, 3.6, GRN, 2), ln('M70 -60 C69 -86 74 -112 84 -138', '#FFFFFF', 2.4)]
    return {'helm': pc('helm', helm_sil, helm_det), 'shoulders': pc('shoulders', sh_sil, sh_det),
            'chest': pc('chest', ch_sil, ch_det), 'weapon': pc('weapon', wp_sil, wp_det)}


SETS = {'barrowguard': barrowguard(), 'candlewake': candlewake(), 'rimebone': rimebone(), 'shadeveil': shadeveil()}
ORDER = ['weapon', 'chest', 'shoulders', 'helm']


def assemble(set_id, have=('helm', 'shoulders', 'chest', 'weapon'), gilded=False):
    """the whole stand as one svg: found pieces in colour, the rest as ghosts (class 'ghost')."""
    pieces = SETS[set_id]
    out = {}
    for slot in ORDER:
        g = pieces[slot]
        if gilded:
            g = gild(g)
        if slot not in have:
            g = g.replace('class="pc ', 'class="pc ghost ', 1)
        out[slot] = g
    x, y, w, h = VB
    # the weapon leans behind the stand; the chest, shoulders and helm go on in that order
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" class="stand-svg">'
            f'{out["weapon"]}{stand()}{out["chest"]}{out["shoulders"]}{out["helm"]}</svg>')


data = {'vb': VB, 'stand': stand(), 'sets': SETS, 'gilded': {k: {sl: gild(v) for sl, v in p.items()} for k, p in SETS.items()}}
json.dump(data, open(os.path.join(OUT, 'mannequins.json'), 'w'))

# a check sheet: each set full, partly found, empty, and gilded
GHOST_CSS = ('.ghost .det{display:none}.ghost .sil path,.ghost .sil circle,.ghost .sil ellipse{fill:rgba(255,248,236,.10)!important;'
             'stroke:rgba(255,248,236,.62)!important;stroke-width:3!important;stroke-dasharray:7 6}')
rows = []
for sid in SETS:
    cells = [assemble(sid), assemble(sid, ('helm', 'chest')), assemble(sid, ()), assemble(sid, gilded=True)]
    rows.append('<div style="display:flex;gap:10px;margin:10px">' + ''.join(f'<div style="width:232px;height:270px;background:#2E2A55;border-radius:12px">{x}</div>' for x in cells) + '</div>')
html = f'<html><head><style>body{{background:#17121F;margin:0}}svg{{width:232px;height:270px}}{GHOST_CSS}</style></head><body>{"".join(rows)}</body></html>'
open(os.path.join(OUT, 'mannequins.html'), 'w').write(html)
print('ok')
