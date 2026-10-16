import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# The wardrobe: each dungeon set on its own armour stand, for the collection log. One bare stand, then every
# piece of every set (helm, shoulders, chest, and the boss weapon of the same role) drawn as its own layer
# around the stand's ground point (0, 0), so the log can put on the pieces you've found and draw the rest as
# dashed ghosts. Each piece is <g class="pc"><g class="sil">..</g><g class="det">..</g></g>: the silhouette is
# what a ghost keeps, the details are what it drops. A ghost is drawn as one dashed line round the whole
# silhouette (its shapes are masked out of their own outline, so overlaps don't show), so every silhouette
# shape is a closed shape: shafts are bar() and band(), never a beam. Each set is drawn from its own `look`
# in src/content/barrow/items.ts, and the set icons in art_icons.py are cut from these same pieces.
# Heroic pieces are the same pieces through gild(). Each piece also gets its box, for showing it on its own.
# Usage: python3 tools/art_wardrobe.py -> art/wardrobe.json, art/_wardrobe_preview.html, shots/wardrobe_stands.json
import json, math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from art_sprites import (K, s, ln, beam, c, e, halo, m, gild, f, mirror,
                         BONE, BONE_D, GRN, GRN_L, STEEL_L, GOLD, GOLD_D, RED,
                         BLUE, BLUE_D, WOOD, WOOD_D, FROST, FROST_L, FLAME)

OUT = HF_ROOT + '/art/'
# the stand's box: every piece of every set fits inside it, ground point at (0, 0)
VB = (-104, -262, 232, 270)
CANVAS, CANVAS_D, CANVAS_L = '#E3D3B0', '#BFA77E', '#F6EBD3'
CLOTH = '#2F2838'                       # Candlewake's black robes
CLOTH_L = '#4A4058'
LEATHER, LEATHER_D, LEATHER_L = '#5B4361', '#46324C', '#7A6080'
HOOD, HOOD_L, MASK = '#2E2440', '#4A3D62', '#3A2F4A'
FUR = '#F2EEE6'
SHAFT = '#5C4A6A'
HANDLE = '#4A4458'
BLADE = '#D7DEE6'


def bar(x0, y0, x1, y1, w, col, edge=4):
    """a straight shaft as a closed shape, w wide from one point to another: a beam a ghost can outline"""
    L = math.hypot(x1 - x0, y1 - y0)
    nx, ny = -(y1 - y0) / L * w / 2, (x1 - x0) / L * w / 2
    return s(f'M{f(x0 + nx)} {f(y0 + ny)} L{f(x1 + nx)} {f(y1 + ny)} L{f(x1 - nx)} {f(y1 - ny)} L{f(x0 - nx)} {f(y0 - ny)} Z', col, edge)


def band(pts, w, col, edge=4):
    """a bent shaft through some points, as a closed shape"""
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        (ax, ay), (bx, by) = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        L = math.hypot(bx - ax, by - ay) or 1
        nx, ny = -(by - ay) / L * w / 2, (bx - ax) / L * w / 2
        left.append((x + nx, y + ny)); right.append((x - nx, y - ny))
    return s('M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in left + right[::-1]) + ' Z', col, edge)


TOK = re.compile(r'[A-Za-z]|-?\d+(?:\.\d+)?')


def moved(d, fn):
    """a path (M, L, C and Z only) with every point moved by fn(x, y)"""
    out, xy = [], []
    for t in TOK.findall(d):
        if t.isalpha():
            out.append(t)
            continue
        xy.append(float(t))
        if len(xy) == 2:
            x, y = fn(*xy)
            out.append(f'{f(x)} {f(y)}')
            xy = []
    return ' '.join(out)


def pc(slot, sil, det):
    return f'<g class="pc {slot}"><g class="sil">{"".join(sil)}</g><g class="det">{"".join(det)}</g></g>'


def stand():
    """the bare stand: a wooden foot and pole, a canvas body, a wooden head"""
    return ''.join([
        s('M-48 0 L-40 -14 L40 -14 L48 0 Z', WOOD_D, 4),
        s('M-7 -14 L-7 -100 L7 -100 L7 -14 Z', WOOD, 4),
        s('M-33 -176 C-39 -146 -35 -118 -24 -98 L24 -98 C35 -118 39 -146 33 -176 C16 -183 -16 -183 -33 -176 Z', CANVAS, 4),
        ln('M0 -178 L0 -100', CANVAS_D, 3), ln('M-22 -150 C-14 -146 -8 -146 -3 -150', CANVAS_L, 3),
        s('M-26 -104 L26 -104 L26 -94 L-26 -94 Z', WOOD_D, 3.5),
        s('M-8 -192 L-8 -176 L8 -176 L8 -192 Z', WOOD, 3),
        c(0, -210, 20, WOOD, 4), ln('M-10 -220 C-6 -225 0 -226 4 -225', '#A9764A', 3)])


# ---------------------------------------------------------------- Barrowguard: bone-white plate, skull pauldrons
def skull(cx, cy, k=1.0):
    """a judging skull for a shoulder: round crown, angry sockets, a jaw of teeth"""
    q = lambda dx, dy: f'{f(cx + dx * k)} {f(cy + dy * k)}'
    sil = [s(f'M{q(-24, 4)} C{q(-27, -14)} {q(-15, -24)} {q(0, -24)} C{q(15, -24)} {q(27, -14)} {q(24, 4)} C{q(22, 10)} {q(18, 12)} {q(14, 13)} '
             f'L{q(12, 24)} C{q(6, 28)} {q(-6, 28)} {q(-12, 24)} L{q(-14, 13)} C{q(-18, 12)} {q(-22, 10)} {q(-24, 4)} Z', BONE, 4)]
    det = [s(f'M{q(-17, -6)} L{q(-3, -1)} L{q(-5, 6)} C{q(-9, 8)} {q(-15, 6)} {q(-17, -6)} Z', K, 0),
           s(f'M{q(17, -6)} L{q(3, -1)} L{q(5, 6)} C{q(9, 8)} {q(15, 6)} {q(17, -6)} Z', K, 0),
           s(f'M{q(0, 6)} L{q(-3.5, 12)} L{q(3.5, 12)} Z', K, 0),
           ln(f'M{q(-7, 15)} L{q(-7, 24)} M{q(0, 15)} L{q(0, 26)} M{q(7, 15)} L{q(7, 24)}', K, 2.6),
           ln(f'M{q(-15, -16)} C{q(-10, -20)} {q(-4, -21)} {q(1, -20)}', '#FFFFFF', 3)]
    return sil, det


def barrowguard():
    horn = 'M-30 -214 C-42 -216 -52 -230 -50 -250 C-44 -240 -36 -234 -26 -232 Z'
    helm = ([s(horn, BONE, 3.5), s(m(horn), BONE, 3.5),
             s('M-28 -190 C-31 -226 -18 -244 0 -244 C18 -244 31 -226 28 -190 Z', BONE, 4),
             s('M-27 -208 L27 -208 L25 -188 C15 -182 -15 -182 -25 -188 Z', BONE_D, 3.5)],
            [e(-10, -218, 6.5, 5, K, 0), e(10, -218, 6.5, 5, K, 0),
             ln('M-15 -206 L-15 -190 M-7.5 -206 L-7.5 -186 M0 -206 L0 -185 M7.5 -206 L7.5 -186 M15 -206 L15 -190', K, 2.6),
             ln('M0 -242 L0 -226', BONE_D, 3), ln('M-18 -234 C-14 -238 -9 -240 -4 -240', '#FFFFFF', 3)])
    # each pauldron: a rounded bone dome over two lames, a skull mounted on its face
    dome = 'M-26 -186 C-40 -203 -72 -203 -86 -179 C-92 -167 -92 -155 -88 -147 C-72 -155 -50 -157 -30 -151 Z'
    # each lame tucks up under the plate above it, so no seam shows where they meet
    lames = ('M-89 -152 C-72 -160 -50 -162 -29 -156 L-31 -141 C-50 -147 -68 -145 -84 -137 Z',
             'M-85 -142 C-68 -150 -50 -152 -30 -146 L-33 -132 C-50 -137 -64 -135 -78 -128 Z')
    sh_sil, sh_det = [], []
    for sx in (-1, 1):
        mm = (lambda d: d) if sx < 0 else m
        sh_sil += [s(mm(lames[1]), BONE, 3.5), s(mm(lames[0]), BONE, 3.5), s(mm(dome), BONE_D, 4)]
        a, b = skull(sx * 59, -175, 0.52)
        sh_sil += a
        sh_det += b + [ln(mm('M-82 -181 C-77 -190 -69 -195 -61 -197'), '#FFFFFF', 3), c(sx * 37, -160, 2.4, BONE, 1.8)]
    chest = 'M-36 -178 C-42 -146 -38 -116 -26 -96 L26 -96 C38 -116 42 -146 36 -178 C18 -186 -18 -186 -36 -178 Z'
    ch_det = [s('M-5 -176 L5 -176 L5 -112 L-5 -112 Z', BONE_D, 3)]
    for y, w in ((-160, 27), (-142, 27), (-124, 22)):
        d = f'M-6 {y} C-12 {y - 6} -{w - 6} {y - 5} -{w} {y + 4}'
        ch_det.append(beam(d, BONE_D, 6, 2.6) + beam(m(d), BONE_D, 6, 2.6))
    ch_det += [s('M-28 -110 L28 -110 L28 -96 L-28 -96 Z', WOOD_D, 3.5), s('M-7 -111 L7 -111 L7 -95 L-7 -95 Z', GOLD, 2.6)]
    # the Gravedigger: half axe, half shovel. An iron foot, a stout shaft, a collar, and a broad head whose
    # face is dished like a spade and whose far edge is an axe's
    weapon = ([s('M42 -12 L58 -8 L56 4 L40 0 Z', '#8E96A3', 3.5),
               bar(50, -6, 76, -226, 9, '#A0703F'),
               s('M76 -236 C89 -248 109 -250 119 -238 C123 -219 121 -200 114 -186 C101 -191 88 -199 78 -210 Z', BLADE, 4),
               s('M65 -224 L84 -220 L82 -204 L63 -208 Z', '#8E96A3', 3.5)],
              [s('M88 -230 C99 -237 110 -236 114 -230 C117 -218 115 -206 110 -197 C101 -201 93 -206 88 -214 Z', '#B9C2CD', 2.4),
               ln('M117 -232 C120 -219 119 -205 113 -193', '#FFFFFF', 3), ln('M68 -216 L80 -213', '#C9D2DC', 2.4),
               c(64, -110, 5, GRN, 2.4)])
    return {'helm': helm, 'shoulders': (sh_sil, sh_det), 'chest': ([s(chest, BONE, 4)], ch_det), 'weapon': weapon}


# ---------------------------------------------------------------- Candlewake: black robes, a crown of candles, a lantern
def candlewake():
    crown_sil = [s('M-26 -208 C-10 -213 10 -213 26 -208 L26 -192 C10 -197 -10 -197 -26 -192 Z', GOLD, 3.5)]
    crown_det = []
    for x, h in ((-22, 14), (-15, 20), (-7.5, 26), (0, 30), (7.5, 26), (15, 20), (22, 14)):
        y0 = -209 - (2 if abs(x) < 10 else 0)
        crown_sil.append(s(f'M{f(x - 3.6)} {f(y0 + 2)} L{f(x - 3.6)} {f(y0 - h)} L{f(x + 3.6)} {f(y0 - h)} L{f(x + 3.6)} {f(y0 + 2)} Z', BONE, 2.6))
        ft = y0 - h - 15
        crown_det.append(halo(x, ft + 8, 9, FLAME, 0.32))
        crown_det.append(s(f'M{f(x)} {f(ft)} C{f(x + 5)} {f(ft + 7)} {f(x + 4.5)} {f(ft + 13)} {f(x)} {f(ft + 13)} C{f(x - 4.5)} {f(ft + 13)} {f(x - 5)} {f(ft + 7)} {f(x)} {f(ft)} Z', FLAME, 2.2))
    crown_det += [c(0, -201, 3.6, RED, 2), ln('M-20 -204 C-12 -206 -6 -207 -2 -207', '#FFF3C4', 2.4)]
    mantle = ('M-38 -184 C-60 -186 -80 -168 -82 -140 C-72 -146 -60 -146 -52 -138 C-44 -150 -26 -154 0 -152 C26 -154 44 -150 52 -138 '
              'C60 -146 72 -146 82 -140 C80 -168 60 -186 38 -184 C20 -190 -20 -190 -38 -184 Z')
    sh_det = [ln('M-78 -146 C-68 -150 -60 -150 -52 -143 C-44 -154 -26 -158 0 -156 C26 -158 44 -154 52 -143 C60 -150 68 -150 78 -146', GOLD, 3)]
    for x, y, h in ((-66, -147, 10), (-40, -151, 14), (22, -155, 9), (60, -147, 12)):
        sh_det.append(s(f'M{f(x - 4)} {f(y)} L{f(x + 4)} {f(y)} L{f(x + 3)} {f(y + h)} C{f(x + 3)} {f(y + h + 4)} {f(x - 3)} {f(y + h + 4)} {f(x - 3)} {f(y + h)} Z', BONE, 2.2))
    sh_det += [c(0, -164, 6.5, GOLD, 3), ln('M-60 -176 C-52 -180 -44 -181 -36 -180', CLOTH_L, 3)]
    robe = 'M-34 -178 C-44 -140 -48 -98 -56 -60 L56 -60 C48 -98 44 -140 34 -178 C16 -186 -16 -186 -34 -178 Z'
    ch_det = [s('M-6 -176 L6 -176 L10 -62 L-10 -62 Z', GOLD_D, 3),
              ln('M-30 -112 C-10 -105 10 -105 30 -112', GOLD, 4), ln('M18 -108 L22 -88', GOLD, 4),
              s('M-14 -178 L-10 -168 L-6 -176 L-2 -164 L2 -176 L6 -170 L10 -177 L14 -178 Z', BONE, 2.2),
              ln('M-40 -96 C-38 -84 -40 -74 -44 -66', CLOTH_L, 3)]
    lant = lantern(92, -216)
    weapon = ([bar(66, -2, 72, -222, 8, WOOD), band([(71, -221), (75, -228), (83, -232), (89, -229), (92, -221)], 4.5, K, 0),
               lant[1], lant[5], lant[6]],
              [halo(92, -190, 26, GRN, 0.22)] + lant)
    return {'helm': (crown_sil, crown_det), 'shoulders': ([s(mantle, CLOTH, 4)], sh_det), 'chest': ([s(robe, CLOTH, 4)], ch_det), 'weapon': weapon}


def lantern(x, y):
    """the Gravekeeper's lantern, hung from (x, y): the same lantern as the house's, at stand size"""
    X, Y = (lambda dx: f(x + dx)), (lambda dy: f(y + dy))
    return [ln(f'M{X(-8)} {Y(2)} C{X(-8)} {Y(-12)} {X(8)} {Y(-12)} {X(8)} {Y(2)}', K, 3.4),
            s(f'M{X(-15)} {Y(4)} L{X(15)} {Y(4)} L{X(12)} {Y(44)} L{X(-12)} {Y(44)} Z', HANDLE, 4),
            s(f'M{X(-8)} {Y(10)} L{X(8)} {Y(10)} L{X(8)} {Y(38)} L{X(-8)} {Y(38)} Z', '#2E4A3A', 2.5),
            s(f'M{X(0)} {Y(14)} C{X(7)} {Y(22)} {X(6)} {Y(32)} {X(0)} {Y(36)} C{X(-6)} {Y(32)} {X(-7)} {Y(22)} {X(0)} {Y(14)} Z', GRN, 2),
            c(x - 1.5, y + 27, 1.8, '#FFFFFF', 0),
            s(f'M{X(-18)} {Y(44)} L{X(18)} {Y(44)} L{X(14)} {Y(52)} L{X(-14)} {Y(52)} Z', HANDLE, 3.5),
            s(f'M{X(-12)} {Y(-2)} L{X(12)} {Y(-2)} L{X(15)} {Y(4)} L{X(-15)} {Y(4)} Z', HANDLE, 3.5)]


# ---------------------------------------------------------------- Rimebone: a frosted bone crown, icicle shoulders
def rimebone():
    crown = 'M-25 -196 L-28 -226 L-16 -208 L-10 -242 L0 -212 L10 -242 L16 -208 L28 -226 L25 -196 Z'
    helm = ([s(crown, BONE, 3.5), s('M-26 -200 L26 -200 L26 -188 L-26 -188 Z', BONE_D, 3.5)],
            [s('M-31 -224 L-28 -232 L-24 -224 Z', FROST_L, 2), s('M-13 -240 L-10 -249 L-6 -240 Z', FROST_L, 2),
             s('M7 -240 L10 -249 L13 -240 Z', FROST_L, 2), s('M24 -224 L28 -232 L31 -224 Z', FROST_L, 2),
             c(0, -194, 4.6, FROST, 2.4), c(-14, -194, 2.6, FROST_L, 1.6), c(14, -194, 2.6, FROST_L, 1.6),
             ln('M-6 -226 L-8 -214', '#FFFFFF', 2.4)])
    mantle = ('M-36 -182 C-58 -190 -80 -176 -80 -150 L-58 -150 C-50 -158 -40 -160 -30 -158 L30 -158 C40 -160 50 -158 58 -150 '
              'L80 -150 C80 -176 58 -190 36 -182 C18 -188 -18 -188 -36 -182 Z')
    sh_det = []
    for x in (-74, -62, -50, -38, 38, 50, 62, 74):
        y = -151 if abs(x) > 40 else -159
        h = 18 if abs(x) in (62, 38) else 13
        sh_det.append(s(f'M{f(x - 5)} {f(y)} L{f(x + 5)} {f(y)} L{f(x)} {f(y + h)} Z', FROST_L, 2.4))
    sh_det += [c(-62, -126, 2.4, FROST, 0), c(38, -132, 2.4, FROST, 0), ln('M-66 -178 C-58 -182 -50 -183 -42 -182', '#7D98C8', 3)]
    robe = 'M-34 -178 C-44 -140 -46 -102 -52 -70 L52 -70 C46 -102 44 -140 34 -178 C16 -186 -16 -186 -34 -178 Z'
    fur = 'M-32 -182 C-26 -166 -12 -160 0 -160 C12 -160 26 -166 32 -182 C20 -194 -20 -194 -32 -182 Z'
    ch_det = [ln('M-26 -172 L-22 -168 M-14 -166 L-10 -163 M0 -163 L0 -159 M14 -166 L10 -163 M26 -172 L22 -168', STEEL_L, 2.6),
              s('M-5 -160 L5 -160 L8 -72 L-8 -72 Z', FROST_L, 2.6),
              ln('M-10 -122 L10 -122 M0 -132 L0 -112 M-7 -129 L7 -115 M7 -129 L-7 -115', FROST_L, 2.6),
              ln('M-46 -84 L46 -84', FROST_L, 3)]
    weapon = ([bar(64, -2, 76, -196, 8, SHAFT),
               s('M62 -214 C62 -232 92 -232 92 -214 C92 -204 86 -200 84 -194 L70 -194 C68 -200 62 -204 62 -214 Z', BONE, 3.5)],
              [halo(77, -214, 24, FROST, 0.3), c(71, -214, 4, FROST, 2), c(83, -214, 4, FROST, 2),
               ln('M73 -198 L73 -194 M77 -198 L77 -194 M81 -198 L81 -194', K, 2), ln('M66 -222 C70 -228 76 -229 81 -228', '#FFFFFF', 2.4)])
    return {'helm': helm, 'shoulders': ([s(mantle, BLUE, 4)], sh_det), 'chest': ([s(robe, BLUE_D, 4), s(fur, FUR, 3.5)], ch_det), 'weapon': weapon}


# ---------------------------------------------------------------- Shadeveil: a stitched mask, bone-bladed spaulders, a leather jerkin
def shadeveil():
    hood = 'M-29 -186 C-35 -214 -22 -242 0 -246 C22 -242 35 -214 29 -186 C18 -180 -18 -180 -29 -186 Z'
    helm = ([s(hood, HOOD, 4)],
            [s('M-18 -192 C-21 -210 -12 -224 0 -224 C12 -224 21 -210 18 -192 Z', K, 0),
             c(-7.5, -211, 3.8, GRN, 0), c(7.5, -211, 3.8, GRN, 0), c(-7, -211.6, 1.4, GRN_L, 0), c(8, -211.6, 1.4, GRN_L, 0),
             s('M-20 -205 L20 -205 L17 -190 C8 -186 -8 -186 -17 -190 Z', MASK, 3),
             ln('M-12 -201 L-8 -195 M-8 -201 L-12 -195 M-2 -201 L2 -195 M2 -201 L-2 -195 M8 -201 L12 -195 M12 -201 L8 -195', BONE_D, 2),
             ln('M-14 -238 C-8 -242 -2 -243 4 -242', HOOD_L, 3)])
    guard = 'M-33 -182 C-54 -190 -74 -178 -74 -154 C-62 -158 -46 -158 -31 -154 Z'
    blade = 'M-46 -186 C-52 -206 -64 -218 -82 -224 C-74 -208 -68 -196 -62 -184 Z'
    blade2 = 'M-62 -178 C-74 -190 -88 -194 -100 -192 C-90 -184 -82 -176 -74 -168 Z'
    shoulders = ([s(blade, BONE, 3.5), s(m(blade), BONE, 3.5), s(blade2, BONE, 3.5), s(m(blade2), BONE, 3.5),
                  s(guard, LEATHER_D, 4), s(m(guard), LEATHER_D, 4)],
                 [c(-54, -170, 3.6, GRN, 2), c(54, -170, 3.6, GRN, 2),
                  ln('M-66 -170 C-60 -174 -52 -176 -44 -175 M66 -170 C60 -174 52 -176 44 -175', '#6E567A', 2.6)])
    chest = 'M-35 -178 C-42 -146 -38 -116 -26 -96 L26 -96 C38 -116 42 -146 35 -178 C18 -186 -18 -186 -35 -178 Z'
    ch_det = [beam('M-28 -172 L24 -108', WOOD, 6, 3), beam('M28 -172 L-24 -108', WOOD, 6, 3),
              c(0, -140, 6, GOLD, 3), s('M-28 -110 L28 -110 L28 -98 L-28 -98 Z', LEATHER_D, 3.5),
              s('M14 -110 L26 -110 L26 -94 L14 -94 Z', WOOD_D, 3), ln('M-24 -160 C-18 -156 -12 -156 -8 -158', LEATHER_L, 3)]
    weapon = cryptfangs()
    return {'helm': helm, 'shoulders': shoulders, 'chest': ([s(chest, LEATHER, 4)], ch_det), 'weapon': weapon}


def cryptfangs():
    """the Cryptfangs, crossed on the ground beside the stand: two daggers, each a green gem for a pommel, a
    wrapped dark grip, a curled guard with a gem, and a bone fang of a blade curving outward"""
    a = math.radians(18)
    put = lambda x, y: (66 + x * math.cos(a) - y * math.sin(a), -6 + x * math.sin(a) + y * math.cos(a))
    one = lambda d: moved(d, put)
    sil = [c(*put(0, -3), 4.6, GRN, 2.4),
           s(one('M-4 -7 L4 -7 L4 -33 L-4 -33 Z'), HANDLE, 3.5),
           s(one('M-11 -33 C-7 -39 7 -39 11 -33 C7 -29 -7 -29 -11 -33 Z'), '#3A3446', 3),
           s(one('M-6 -36 C-11 -64 -7 -92 9 -118 C11 -96 12 -66 6 -36 Z'), BONE, 3.5)]
    det = [ln(one('M-4 -14 L4 -18 M-4 -22 L4 -26'), '#6E6880', 2.2), c(*put(0, -34), 3.4, GRN, 2),
           ln(one('M-3 -46 C-5 -66 -2 -86 5 -104'), '#FFFFFF', 2.4)]
    # the other dagger is the first one turned round, leaning the other way: crossed above their guards
    twin = lambda parts: [re.sub(r' d="([^"]+)"', lambda mm: f' d="{mirror(mm.group(1), 88)}"', x).replace('cx="', 'cx="~') for x in parts]
    flip = lambda x: re.sub(r'cx="~([-\d.]+)"', lambda mm: f'cx="{f(176 - float(mm.group(1)))}"', x)
    return [flip(x) for x in twin(sil)] + sil, [flip(x) for x in twin(det)] + det


# every set's pieces by item id: the set's own three, and the boss weapon of its role
SETS = {
    'barrowguard': (barrowguard, 'gravekeeper.tank'),
    'candlewake': (candlewake, 'gravekeeper.healer'),
    'rimebone': (rimebone, 'gravekeeper.dps'),
    'shadeveil': (shadeveil, 'gravekeeper.rogue'),
}
SLOTS = ('helm', 'shoulders', 'chest', 'weapon')


def parts(set_id):
    """a set's pieces as (silhouette, details) lists, by slot"""
    return SETS[set_id][0]()


def _bbox(svg):
    """a rough box round some svg: the points of its paths (control points too) and its circles"""
    xs, ys = [], []
    for d in re.findall(r' d="([^"]+)"', svg):
        nums = [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', d)]
        xs += nums[0::2]; ys += nums[1::2]
    for cx, cy, r in re.findall(r'<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"', svg):
        xs += [float(cx) - float(r), float(cx) + float(r)]; ys += [float(cy) - float(r), float(cy) + float(r)]
    return min(xs), min(ys), max(xs), max(ys)


def _fit(body, box, weight):
    """an svg body fitted into a box, its ink kept at `weight` of the stand's"""
    x0, y0, x1, y1 = _bbox(body)
    bx, by, bw, bh = box
    k = min(bw / (x1 - x0), bh / (y1 - y0))
    tx, ty = bx + (bw - (x1 - x0) * k) / 2 - x0 * k, by + (bh - (y1 - y0) * k) / 2 - y0 * k
    body = re.sub(r'stroke-width: ([\d.]+)', lambda mm: f'stroke-width: {f(float(mm.group(1)) * weight / k)}', body)
    return f'<g transform="translate({f(tx)} {f(ty)}) scale({k:.4f})">{body}</g>'


def cut(set_id, slot, box=(6, 6, 52, 52), weight=0.8, pair=False):
    """a piece cut out for a 64x64 icon, its glows left out. `pair`: a piece made of a left and a right half
    (two pauldrons) has its halves drawn side by side, so they fill the tile instead of sitting far apart."""
    sil, det = parts(set_id)[slot]
    keep = [x for x in sil + det if 'opacity:' not in x]
    if not pair:
        return _fit(''.join(keep), box, weight)
    left = ''.join(x for x in keep if sum(_bbox(x)[0::2]) / 2 < 0)
    bx, by, bw, bh = box
    half = _fit(left, (bx, by, bw / 2, bh), weight)
    return half + f'<g transform="translate({f(2 * bx + bw)} 0) scale(-1 1)">{half}</g>'


def box_of(sil, det, pad=8):
    """a piece's box (x, y, w, h) with some room round it, its glows left out"""
    x0, y0, x1, y1 = _bbox(''.join(x for x in sil + det if 'opacity:' not in x))
    return [round(x0 - pad), round(y0 - pad), round(x1 - x0 + 2 * pad), round(y1 - y0 + 2 * pad)]


def build():
    pieces, boxes = {}, {}
    for set_id, (draw, weapon) in SETS.items():
        for slot, (sil, det) in draw().items():
            pid = weapon if slot == 'weapon' else f'{set_id}.{slot}'
            pieces[pid] = pc(slot, sil, det)
            pieces[pid + '.gilded'] = gild(pieces[pid])
            boxes[pid] = box_of(sil, det)
    return {'vb': list(VB), 'stand': stand(), 'pieces': pieces, 'boxes': boxes}


GHOST_CSS = ('<style>.gm *{fill:#000!important;stroke:none!important}'
             '.go *{fill:none!important;stroke:rgba(255,248,236,.72)!important;stroke-width:6!important;stroke-dasharray:9 7;stroke-linecap:round}'
             '.gf{opacity:.1}.gf *{fill:#FFF8EC!important;stroke:none!important}</style>')
_ghosts = [0]


def ghost(piece):
    """a piece drawn as a ghost, the way src/ui/art.ts draws one: its silhouette's outline with the
    silhouette itself masked out (so only the outer half of the line shows, and overlaps vanish), then the
    silhouette faintly filled as one layer. The details are left out."""
    _ghosts[0] += 1
    sil = piece[piece.index('<g class="sil">') + 15:piece.index('</g><g class="det">')]
    slot = re.search(r'class="pc (\w+)"', piece).group(1)
    box = 'x="{}" y="{}" width="{}" height="{}"'.format(*VB)
    gid = f'wg{_ghosts[0]}'
    return (f'<g class="pc ghost {slot}"><mask id="{gid}" maskUnits="userSpaceOnUse" {box}><rect {box} fill="#fff"/><g class="gm">{sil}</g></mask>'
            f'<g class="go" mask="url(#{gid})">{sil}</g><g class="gf">{sil}</g></g>')


def assemble(w, set_id, have=SLOTS, gilded=False):
    """one stand as a sprite ({svg, vb}): the pieces in `have` on it, the rest as ghosts"""
    weapon = SETS[set_id][1]
    def piece(slot):
        pid = (weapon if slot == 'weapon' else f'{set_id}.{slot}') + ('.gilded' if gilded else '')
        g = w['pieces'][pid]
        return g if slot in have else ghost(g)
    x, y, wd, ht = VB
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {wd} {ht}" width="{wd}" height="{ht}">{GHOST_CSS}'
           f'{piece("weapon")}{w["stand"]}{piece("chest")}{piece("shoulders")}{piece("helm")}</svg>')
    return {'svg': svg, 'vb': list(VB)}


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    w = build()
    json.dump(w, open(OUT + 'wardrobe.json', 'w'))
    # for the art loop: every set done, half found, empty and gilded, as sprites tools/art_sheet.py can lay out
    sheet = {}
    for sid in SETS:
        sheet[f'stand_{sid}'] = assemble(w, sid)
        sheet[f'stand_{sid}_part'] = assemble(w, sid, ('helm', 'chest'))
        sheet[f'stand_{sid}_none'] = assemble(w, sid, ())
        sheet[f'stand_{sid}_gilded'] = assemble(w, sid, gilded=True)
    os.makedirs(HF_ROOT + '/shots', exist_ok=True)
    json.dump(sheet, open(HF_ROOT + '/shots/wardrobe_stands.json', 'w'))
    cells = ''.join(f'<div style="background:#2E2A55;border-radius:10px;padding:6px">{v["svg"].replace("<svg ", "<svg style=\'width:232px;height:270px\' ", 1)}'
                    f'<div style="font:12px monospace;color:#ddd;text-align:center">{k}</div></div>' for k, v in sheet.items())
    open(OUT + '_wardrobe_preview.html', 'w').write('<body style="margin:0;padding:16px;background:#17121F"><div style="display:grid;grid-template-columns:repeat(4,244px);gap:10px">' + cells + '</div></body>')
    print('wardrobe: stand +', len(w['pieces']), 'pieces, bytes', sum(len(v) for v in w['pieces'].values()) + len(w['stand']))
