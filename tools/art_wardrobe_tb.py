# Thimblebriar Hollow's sets on their armour stands (see art_wardrobe.py): the gnomes' brass, mushrooms and
# clockwork. Each set is drawn from its `look` in src/content/thimblebriar/items.ts, as the Barrow's are: every
# piece a layer round the stand's ground point, split into its silhouette (closed shapes only, so a ghost can
# outline it) and its details. Gilding turns their steel, bone and cream to gold; the brass and copper stay.
import math
from art_wardrobe import K, s, ln, beam, c, halo, m, f, bar, band, moved
from art_sprites import BONE, BONE_D, STEEL, STEEL_D, STEEL_L, RED, WOOD, WOOD_D, FROST, FROST_L, FLAME

BRASS, BRASS_D, BRASS_L, BRASS_DD = '#D9A520', '#A87A1E', '#F2C230', '#7A5614'
COPPER, COPPER_D, COPPER_L = '#C87533', '#9A5326', '#EDA36A'
AMBER, AMBER_D, AMBER_L = '#E7A13C', '#B8742A', '#F6C774'
MOSS, MOSS_D, MOSS_L = '#5E8C3A', '#46692B', '#82B355'
TEAL, TEAL_D, TEAL_L = '#2D5F6B', '#214751', '#41808D'
PLUM, PLUM_D, PLUM_L = '#5B3155', '#43233F', '#7A4772'
BLADE = '#D7DEE6'
LAMP = '#FFF3C4'
FUSE, FUSE_D = '#C9B08A', '#8C6F4A'
BELT = '#5A3A28'
GILLS = '#B9AC8C'


# ---------------------------------------------------------------- shapes the gnomes build with
def turn(px, py, x, y, deg):
    """a point drawn round (0, 0), turned by deg and moved to (x, y)"""
    a = math.radians(deg)
    return x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a)


def place(d, x, y, deg=0.0, k=1.0):
    """a path drawn round (0, 0), turned by deg, scaled by k and moved to (x, y)"""
    return moved(d, lambda px, py: turn(px * k, py * k, x, y, deg))


def oval(cx, cy, rx, ry, deg=0.0):
    """an ellipse as a path, so it can turn and the boxes can see it"""
    q = 0.5523
    return place(f'M{f(rx)} 0 C{f(rx)} {f(ry * q)} {f(rx * q)} {f(ry)} 0 {f(ry)} C{f(-rx * q)} {f(ry)} {f(-rx)} {f(ry * q)} {f(-rx)} 0 '
                 f'C{f(-rx)} {f(-ry * q)} {f(-rx * q)} {f(-ry)} 0 {f(-ry)} C{f(rx * q)} {f(-ry)} {f(rx)} {f(-ry * q)} {f(rx)} 0 Z', cx, cy, deg)


def cog(cx, cy, ro, ri, n, a0=-90.0):
    """a cog: n flat-topped teeth from ri out to ro, the first pointing at a0 degrees"""
    pts, st = [], 2 * math.pi / n
    for i in range(n):
        a = math.radians(a0) + i * st
        for r, da in ((ri, -0.31), (ro, -0.18), (ro, 0.18), (ri, 0.31)):
            pts.append((cx + r * math.cos(a + da * st), cy + r * math.sin(a + da * st)))
    return poly(pts)


def poly(pts, close=True):
    return 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + (' Z' if close else '')


def bez(p0, p1, p2, p3, n=10):
    """points along a cubic curve"""
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * q + t ** 3 * d
                  for a, b, q, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(n + 1))]


def taper(pts, w0, w1=0.0):
    """a shaft through some points narrowing from w0 to w1 (a root, a fuse), as a closed path"""
    left, right, n = [], [], len(pts)
    for i, (x, y) in enumerate(pts):
        (ax, ay), (bx, by) = pts[max(0, i - 1)], pts[min(n - 1, i + 1)]
        L = math.hypot(bx - ax, by - ay) or 1
        w = (w0 + (w1 - w0) * i / (n - 1)) / 2
        left.append((x - (by - ay) / L * w, y + (bx - ax) / L * w))
        right.append((x + (by - ay) / L * w, y - (bx - ax) / L * w))
    return poly(left + right[::-1])


def spiral(cx, cy, r0, r1, turns, squash=1.0, a0=math.pi, n=60):
    """a flat spiral from r0 out to r1: a wound spring"""
    return poly([(cx + (r0 + (r1 - r0) * t) * math.cos(a0 + t * turns * 2 * math.pi),
                  cy + (r0 + (r1 - r0) * t) * math.sin(a0 + t * turns * 2 * math.pi) * squash) for t in (i / n for i in range(n + 1))], False)


def star(cx, cy, r, col, w=2.0):
    """a four-point star"""
    q, p = r * 0.3, r * 0.12
    return s(f'M{f(cx)} {f(cy - r)} C{f(cx + p)} {f(cy - q)} {f(cx + q)} {f(cy - p)} {f(cx + r)} {f(cy)} '
             f'C{f(cx + q)} {f(cy + p)} {f(cx + p)} {f(cy + q)} {f(cx)} {f(cy + r)} '
             f'C{f(cx - p)} {f(cy + q)} {f(cx - q)} {f(cy + p)} {f(cx - r)} {f(cy)} '
             f'C{f(cx - q)} {f(cy - p)} {f(cx - p)} {f(cy - q)} {f(cx)} {f(cy - r)} Z', col, w)


def zap(pts, w=2.2):
    """a little arc of lightning"""
    return ln(poly(pts, False), FROST_L, w)


def rivets(pts, r=2.3, col=BRASS_L):
    return [c(x, y, r, col, 1.8) for x, y in pts]


def both(fn):
    """a pair of shoulder pieces: fn(sx, mm) draws the left one (sx = -1); the right is its mirror"""
    sil, det = [], []
    for sx in (-1, 1):
        a, b = fn(sx, (lambda d: d) if sx < 0 else m)
        sil += a
        det += b
    return sil, det


def toadstool(x, y, k=1.0):
    """a little toadstool growing at (x, y): (silhouette, details)"""
    return ([s(place('M-3.5 0 C-4 -4 -3.5 -8 -3 -10 L3 -10 C3.5 -8 4 -4 3.5 0 Z', x, y, 0, k), BONE, 2.6),
             s(place('M-10 -9 C-10 -17 -5 -21 0 -21 C5 -21 10 -17 10 -9 C4 -7 -4 -7 -10 -9 Z', x, y, 0, k), RED, 2.8)],
            [c(x - 4 * k, y - 15 * k, 2 * k, BONE, 1.4), c(x + 3.5 * k, y - 17 * k, 1.5 * k, BONE, 1.2)])


# ---------------------------------------------------------------- Clockguard: riveted brass, spring-coiled pauldrons
def clockguard():
    # the Greathelm: a squat brass bucket under a cog of a crest, a clock set in the middle of its visor
    dome = 'M-30 -188 C-32 -204 -32 -218 -29 -226 C-25 -236 -14 -241 0 -241 C14 -241 25 -236 29 -226 C32 -218 32 -204 30 -188 Z'
    helm = ([s(cog(0, -236, 21, 15, 12), BRASS_D, 3.5), s(dome, BRASS, 4),
             s('M-34 -195 C-12 -199 12 -199 34 -195 L35 -183 C12 -187 -12 -187 -35 -183 Z', STEEL, 3.5)],
            [s('M-27 -223 C-10 -225 10 -225 27 -223 L26 -209 C10 -211 -10 -211 -26 -209 Z', K, 0),
             c(0, -216, 12.5, BRASS_L, 3), c(0, -216, 8.6, BONE, 2.2),
             ln('M0 -216 L0 -222 M0 -216 L4.6 -213.5', K, 2.4), c(0, -216, 1.6, K, 0), ln('M0 -206 L0 -199', BRASS_D, 3)]
            + rivets([(-27, -189), (-14, -191.5), (14, -191.5), (27, -189)])
            + [ln('M-21 -232 C-16 -236 -10 -238 -4 -238', '#FFFFFF', 3)])

    # the Pauldrons: a brass dome on each shoulder over two steel lames, a steel mainspring wound tight on its face
    def pauldron(sx, mm):
        return ([s(mm('M-86 -148 C-68 -155 -50 -156 -31 -151 L-33 -136 C-50 -140 -64 -139 -80 -133 Z'), STEEL, 3.5),
                 s(mm('M-90 -160 C-72 -167 -50 -168 -29 -163 L-31 -147 C-50 -152 -68 -151 -86 -144 Z'), STEEL, 3.5),
                 s(mm('M-27 -184 C-38 -207 -78 -209 -91 -180 C-94 -172 -93 -162 -90 -156 C-72 -163 -48 -164 -29 -158 Z'), BRASS, 4)],
                [beam(mm(spiral(-60, -183, 2, 15.5, 2.25, 0.78)), STEEL_L, 3, 2), c(sx * 60, -183, 3.2, STEEL, 2),
                 ln(mm('M-84 -188 C-78 -196 -70 -200 -62 -201'), '#FFFFFF', 3)]
                + rivets([(sx * 84, -152), (sx * 68, -156), (sx * 50, -156), (sx * 36, -153)], 2))

    # the Breastplate: a barrel of brass, riveted along every seam, steel at the throat and the hips, a cog on the heart
    tass = 'M-32 -110 L-12 -108 L-13 -88 C-18 -84 -26 -84 -30 -88 Z'
    chest = ([s(tass, STEEL, 3.5), s(m(tass), STEEL, 3.5), s('M-10 -108 L10 -108 L9 -86 C4 -82 -4 -82 -9 -86 Z', STEEL, 3.5),
              s('M-38 -178 C-45 -150 -43 -124 -33 -104 L33 -104 C43 -124 45 -150 38 -178 C20 -186 -20 -186 -38 -178 Z', BRASS, 4)],
             [s('M-24 -183 C-12 -188 12 -188 24 -183 L21 -173 C10 -177 -10 -177 -21 -173 Z', STEEL, 3),
              ln('M-42 -136 C-20 -130 20 -130 42 -136', BRASS_D, 3.5),
              s(cog(0, -156, 13, 9.5, 8), BRASS_L, 3), c(0, -156, 4.6, BRASS_DD, 2.4),
              s('M-34 -118 L34 -118 L33 -107 L-33 -107 Z', BELT, 3), s('M-7 -120 L7 -120 L7 -105 L-7 -105 Z', STEEL, 2.6),
              ln('M-27 -170 C-31 -160 -33 -150 -33 -142', '#FFFFFF', 3)]
             + rivets([(-36, -131.5), (-24, -129), (-12, -128), (12, -128), (24, -129), (36, -131.5)])
             + rivets([(-21, -97), (0, -95), (21, -97)], 2))
    return {'helm': helm, 'shoulders': both(pauldron), 'chest': chest, 'weapon': mainspring()}


def mainspring(hx=88, hy=-210, a=6.0):
    """the Mainspring Maul on its stand: a brass drum of a head with steel faces, a wind-up key in its top"""
    hd = lambda d: place(d, hx, hy, a)
    pt = lambda px, py: turn(px, py, hx, hy, a)
    ear = 'M0 -32 C-4 -42 -10 -48 -17 -46 C-24 -44 -24 -34 -17 -31 C-11 -29 -5 -30 0 -32 Z'
    sil = [s('M44 -12 L58 -9 L56 3 L42 0 Z', BRASS_D, 3.5), bar(51, -6, hx - 3, hy + 12, 9, WOOD),
           s(hd('M-4 -28 L4 -28 L4 -14 L-4 -14 Z'), STEEL, 3), s(hd(ear), STEEL, 3), s(hd(m(ear)), STEEL, 3), s(hd(oval(0, -31, 5, 4)), STEEL, 2.6),
           s(hd('M-24 -15 C-24 -18 -22 -19 -19 -19 L19 -19 C22 -19 24 -18 24 -15 L24 15 C24 18 22 19 19 19 L-19 19 C-22 19 -24 18 -24 15 Z'), BRASS, 4),
           s(hd('M-32 -16 L-23 -16 L-23 16 L-32 16 C-34 6 -34 -6 -32 -16 Z'), STEEL, 3.5),
           s(hd('M32 -16 L23 -16 L23 16 L32 16 C34 6 34 -6 32 -16 Z'), STEEL, 3.5),
           s(place('M-6 -8 L6 -8 L6 8 L-6 8 Z', hx - 4, hy + 22, a), BRASS_D, 3)]
    det = ([c(*pt(-15, -38.5), 3, K, 0), c(*pt(15, -38.5), 3, K, 0),
            s(hd('M-23 -4 L23 -4 L23 4 L-23 4 Z'), BRASS_D, 2.6), ln(hd('M-18 -13 C-10 -15 -2 -15 6 -14'), '#FFFFFF', 2.6),
            ln(hd('M-29 -11 L-29 11'), STEEL_L, 2.4)]
           + rivets([pt(x, 11) for x in (-15, -5, 5, 15)] + [pt(x, -11) for x in (-15, 15)], 2))
    return sil, det


# ---------------------------------------------------------------- Sporebloom: a toadstool cap, an amber root mantle
def sporebloom():
    # the Cap: a red toadstool with cream spots and pale gills, a few glowing spores drifting off it
    cap = ('M-44 -212 C-46 -236 -25 -253 0 -253 C25 -253 46 -236 44 -212 C40 -207 33 -206 26 -207 '
           'C14 -210 -14 -210 -26 -207 C-33 -206 -40 -207 -44 -212 Z')
    spots = ((-23, -234, 7), (3, -245, 5.2), (24, -232, 7.8), (-37, -219, 3.8), (37, -218, 4.2), (-6, -226, 3.6), (12, -221, 2.8))
    helm = ([s('M-37 -209 C-20 -213 20 -213 37 -209 C29 -200 -29 -200 -37 -209 Z', BONE_D, 3), s(cap, RED, 4)],
            [ln('M-24 -207.5 L-22 -203.5 M-12 -208.5 L-11 -203 M0 -209 L0 -202.5 M12 -208.5 L11 -203 M24 -207.5 L22 -203.5', GILLS, 2)]
            + [c(x, y, r, BONE, 2.2) for x, y, r in spots]
            + [halo(x, y, r, LAMP, 0.9) for x, y, r in ((-52, -238, 2), (-48, -250, 1.4), (50, -244, 2.2), (44, -256, 1.4), (56, -230, 1.3))]
            + [ln('M-33 -232 C-29 -240 -21 -246 -13 -249', '#FFFFFF', 3)])

    # the Mantle: amber roots woven over the shoulders from a knot at the throat, running on past its edge to
    # hang and curl, toadstools sprouting on top
    strands = ((bez((-8, -190), (-40, -198), (-74, -190), (-84, -164), 10) + bez((-84, -164), (-88, -150), (-84, -136), (-92, -124), 6)[1:], 11),
               (bez((-12, -181), (-38, -186), (-60, -178), (-66, -160), 10) + bez((-66, -160), (-68, -150), (-70, -142), (-64, -132), 6)[1:], 10),
               (bez((-16, -172), (-32, -174), (-44, -168), (-47, -158), 8) + bez((-47, -158), (-48, -150), (-43, -147), (-45, -140), 5)[1:], 8.5))

    def mantle(sx, mm):
        sil, det = [], []
        for pts, w in strands:
            pts = [(-sx * x, y) for x, y in pts]
            sil.append(s(taper(pts, w, 1.6), AMBER, 2.8))
            det.append(ln(poly([(x, y - 1.6) for x, y in pts[2:8]], False), AMBER_L, 2.2))
        return sil, det

    body = ('M-34 -188 C-56 -194 -82 -182 -88 -154 C-80 -150 -72 -152 -62 -155 C-50 -159 -24 -163 0 -161 C24 -163 50 -159 62 -155 '
            'C72 -152 80 -150 88 -154 C82 -182 56 -194 34 -188 C18 -193 -18 -193 -34 -188 Z')
    sh_sil, sh_det = both(mantle)
    sh_sil = [s(body, AMBER_D, 4)] + sh_sil + [s(oval(0, -177, 11, 8), AMBER, 3)]
    sh_det += [ln('M-9 -181 C-4 -178 4 -178 9 -181', AMBER_D, 2.2), s(oval(0, -176, 6.5, 3.6), BONE, 2.2)]
    for x, y, k in ((-62, -192, 1.0), (-48, -195, 0.72), (60, -191, 0.85)):
        a, b = toadstool(x, y, k)
        sh_sil += a
        sh_det += b

    # the Robe: moss green, a scalloped hem, a root rope at the waist, a little lantern hooked at the hip
    hem = ''.join(f' C{f(x0 + 4)} -58 {f(x0 + 14)} -58 {f(x0 + 18)} -64' for x0 in range(-54, 54, 18))
    chest = ([s(f'M54 -64 C48 -100 44 -140 34 -178 C16 -186 -16 -186 -34 -178 C-44 -140 -48 -100 -54 -64{hem} Z', MOSS, 4),
              band([(-34, -114), (-42, -110), (-46, -103)], 3.6, K, 0),
              s('M-53 -103 C-53 -110 -39 -110 -39 -103 Z', STEEL, 2.6),
              s(oval(-46, -92, 8.5, 10), LAMP, 3),
              s('M-50 -82 L-42 -82 L-43 -77 L-49 -77 Z', STEEL, 2.4)],
             [s('M-18 -182 C-6 -160 6 -140 20 -112 L28 -112 C16 -140 8 -162 -2 -184 Z', MOSS_L, 3),
              band([(-38, -116), (0, -112), (38, -116)], 6, AMBER, 3),
              s(oval(14, -113, 5, 4.5), AMBER, 2.6),
              s(taper([(12, -110), (13, -100), (11, -90)], 4.5, 2), AMBER, 2.4), s(taper([(17, -110), (20, -101), (21, -93)], 4.5, 2), AMBER, 2.4),
              halo(-46, -92, 16, LAMP, 0.4), s('M-46 -99 C-43 -95 -43 -90 -46 -87 C-49 -90 -49 -95 -46 -99 Z', FLAME, 1.6),
              ln('M-40 -70 C-34 -76 -30 -80 -28 -88 M38 -72 C34 -78 32 -84 32 -92', MOSS_D, 3),
              ln('M-26 -168 C-30 -158 -32 -148 -33 -140', MOSS_L, 3)])
    return {'helm': helm, 'shoulders': (sh_sil, sh_det), 'chest': chest, 'weapon': sporelight()}


def sporelight(hx=100, top=-216):
    """the Sporelight Censer on its stand: a silver bowl under a toadstool lid, hung from a brass crook, its
    lamp shining through the holes, spores drifting up"""
    cy = top + 34
    X = lambda dx: f(hx + dx)
    Y = lambda dy: f(cy + dy)
    sil = [bar(64, -2, 72, -210, 8, WOOD),
           band([(71, -208), (73, -221), (83, -230), (96, -228), (hx, top)], 5.5, BRASS, 3),
           band([(hx, top), (hx, cy - 12)], 3.4, K, 0),
           s(f'M{X(-17)} {Y(2)} L{X(17)} {Y(2)} C{X(17)} {Y(22)} {X(9)} {Y(30)} {X(0)} {Y(30)} C{X(-9)} {Y(30)} {X(-17)} {Y(22)} {X(-17)} {Y(2)} Z', STEEL, 3.5),
           s(f'M{X(-6)} {Y(29)} L{X(6)} {Y(29)} L{X(8)} {Y(36)} L{X(-8)} {Y(36)} Z', STEEL_D, 3),
           s(f'M{X(-23)} {Y(3)} C{X(-23)} {Y(-17)} {X(23)} {Y(-17)} {X(23)} {Y(3)} C{X(14)} {Y(7)} {X(-14)} {Y(7)} {X(-23)} {Y(3)} Z', RED, 3.5),
           c(hx, cy - 13, 4.2, BRASS_L, 2.4)]
    det = [halo(hx, cy + 14, 24, LAMP, 0.28),
           c(hx - 9, cy + 13, 3.4, LAMP, 1.8), c(hx, cy + 16, 3.4, LAMP, 1.8), c(hx + 9, cy + 13, 3.4, LAMP, 1.8),
           ln(f'M{X(-15)} {Y(7)} L{X(15)} {Y(7)}', STEEL_D, 2.4),
           c(hx - 12, cy - 4, 3, BONE, 1.6), c(hx + 2, cy - 9, 2.4, BONE, 1.4), c(hx + 13, cy - 3, 3, BONE, 1.6),
           ln(f'M{X(18)} {Y(-10)} C{X(23)} {Y(-16)} {X(17)} {Y(-22)} {X(22)} {Y(-28)}', LAMP, 2.4),
           halo(hx + 13, cy - 31, 1.8, LAMP, 0.9), halo(hx + 21, cy - 38, 1.4, LAMP, 0.9)]
    return sil, det


# ---------------------------------------------------------------- Arcspark: a copper filament crown, coil shoulders
def arcspark():
    # the Crown: a copper band, copper rods with balls on, and in the middle a glass bulb with its filament lit
    cr_sil = []
    for x, h in ((-20, 12), (-10.5, 19), (10.5, 19), (20, 12)):
        y0 = -208 if abs(x) > 15 else -209.5
        cr_sil += [bar(x, y0 + 2, x, y0 - h, 4.4, COPPER, 2.4), c(x, y0 - h - 3, 4.6, COPPER_L, 2.4)]
    cr_sil += [s('M-5 -210 L5 -210 L5 -220 L-5 -220 Z', BRASS, 2.4),
               s('M-5 -220 C-12 -224 -13 -236 -9 -242 C-6 -247 6 -247 9 -242 C13 -236 12 -224 5 -220 Z', FROST_L, 2.8),
               s('M-25 -207 C-10 -211 10 -211 25 -207 L25 -194 C10 -198 -10 -198 -25 -194 Z', COPPER, 3.5)]
    cr_det = [halo(0, -233, 15, FROST, 0.3), ln('M-3.5 -221 L-3.5 -230 C-3.5 -238 3.5 -238 3.5 -230 L3.5 -221', COPPER_D, 2),
               ln('M-6 -238 C-5 -242 -2 -243 1 -243', '#FFFFFF', 1.8),
               zap([(-25, -226), (-21, -230), (-18, -227), (-14, -232)], 2), zap([(25, -226), (21, -230), (18, -227), (14, -232)], 2),
               c(-12, -201, 2.4, BRASS_L, 1.6), c(0, -202.5, 3.2, BRASS_L, 1.8), c(12, -201, 2.4, BRASS_L, 1.6),
               ln('M-20 -204 C-14 -206 -8 -207 -3 -207.5', COPPER_L, 2.4)]

    # the Coils: a bobbin of copper wire on each shoulder pad, capped in iron, a terminal at its end crackling
    cx, cy, deg, L, R = -59, -185, -19, 45, 11.5
    h = L / 2

    def coil(sx, mm):
        P = lambda d: mm(place(d, cx, cy, deg))
        tx, ty = turn(-h - 13, 0, cx, cy, deg)
        zx, zy = turn(-h - 17, -2, cx, cy, deg)
        sil = [s(mm('M-90 -157 C-72 -164 -50 -165 -29 -160 L-31 -145 C-50 -150 -68 -149 -86 -142 Z'), TEAL_D, 3.5),
               s(mm('M-26 -182 C-38 -200 -78 -200 -90 -172 C-92 -166 -92 -158 -90 -152 C-72 -158 -48 -159 -28 -154 Z'), TEAL, 4),
               s(P(f'M{-h} {-R} L{h} {-R} L{h} {R} L{-h} {R} Z'), COPPER, 3.5),
               s(P(oval(h, 0, 4.5, R + 3)), STEEL, 3), s(P(oval(-h, 0, 4.5, R + 3)), STEEL, 3),
               s(P(f'M{-h - 10} -3.5 L{-h - 3} -3.5 L{-h - 3} 3.5 L{-h - 10} 3.5 Z'), BRASS_D, 2.4),
               c(-sx * tx, ty, 5, BRASS_L, 2.6)]
        det = [ln(P(f'M{f(u + 1.5)} {-R + 1} C{f(u - 1)} {-R / 2} {f(u - 1)} {R / 2} {f(u + 1.5)} {R - 1}'), COPPER_D, 2)
               for u in (-h + k * L / 8 for k in range(1, 8))]
        zx = -sx * zx
        det += [ln(P(f'M{-h + 4} {-R + 4} L{h - 4} {-R + 4}'), COPPER_L, 2.6),
                halo(-sx * tx, ty, 9, FROST, 0.25),
                zap([(zx, zy), (zx + sx * 3, zy - 5), (zx + sx * 1, zy - 8), (zx + sx * 4, zy - 14)]),
                ln(mm('M-88 -160 C-90 -166 -89 -171 -86 -176'), TEAL_L, 2.6)]
        return sil, det

    # the Robe: deep teal, a dagged hem trimmed in copper, silver stars stitched all over (one of them real)
    hem = ' L-42 -62 L-31 -70 L-21 -60 L-10 -68 L0 -58 L10 -68 L21 -60 L31 -70 L42 -62'
    chest = ([s(f'M-34 -178 C-42 -144 -46 -108 -52 -70{hem} L52 -70 C46 -108 42 -144 34 -178 C16 -186 -16 -186 -34 -178 Z', TEAL, 4)],
             [ln('M-49 -76 L-42 -68 L-31 -76 L-21 -66 L-10 -74 L0 -64 L10 -74 L21 -66 L31 -76 L42 -68 L49 -76', COPPER, 4),
              beam('M-22 -181 L0 -150 L22 -181', COPPER, 4, 3), halo(-20, -134, 11, FROST_L, 0.3)]
             + [star(x, y, r, STEEL_L) for x, y, r in ((-20, -134, 7.5), (18, -120, 6), (-10, -100, 5), (26, -92, 4.5), (8, -146, 4), (-30, -86, 4))]
             + [c(x, y, 1.8, STEEL_L, 0) for x, y in ((-28, -156), (24, -150), (-2, -122), (14, -96), (-22, -112), (32, -132))]
             + [ln('M-27 -168 C-31 -158 -33 -148 -34 -140', TEAL_L, 3)])
    return {'helm': (cr_sil, cr_det), 'shoulders': both(coil), 'chest': chest, 'weapon': arcwright()}


def arcwright():
    """the Arcwright's Coil on its stand: a dark staff wound with copper wire below the hand, a brass collar,
    and a spark gap of two steel horns at its head"""
    x_at = lambda y: 62 + 14 * (y + 2) / -194
    sil = [bar(62, -2, 76, -196, 8, WOOD_D)]
    for i in range(7):
        y = -98 - 7 * i
        sil.append(bar(x_at(y) - 8, y + 4, x_at(y) + 8, y - 3, 5, COPPER, 2.6))
    sil += [band([(75, -198), (70, -212), (66, -228)], 5.5, STEEL, 3), band([(77, -198), (84, -212), (90, -226)], 5.5, STEEL, 3),
            c(65, -231, 5, STEEL_L, 2.6), c(91, -229, 5, STEEL_L, 2.6), s(place('M-7 -6 L7 -6 L7 6 L-7 6 Z', 76, -197, 4), BRASS, 3)]
    det = [halo(78, -232, 13, FROST, 0.25), zap([(69, -232), (74, -236), (78, -230), (83, -235), (87, -231)], 2.6)]
    return sil, det


# ---------------------------------------------------------------- Gearshade: a lens visor, spring-blade spaulders, a coat
def gearshade():
    # the Visor: a velvet hood whose tip flops back, goggles of two lenses, and a third on a hinged arm
    hood = 'M-29 -186 C-35 -212 -25 -238 0 -244 C14 -247 28 -254 42 -253 C34 -247 30 -238 30 -224 C31 -210 31 -198 29 -186 C18 -180 -18 -180 -29 -186 Z'
    helm = ([s(hood, PLUM, 4), bar(17, -214, 33, -226, 4, BRASS_D, 2.6), c(35, -228, 7, STEEL, 3)],
            [s('M-19 -192 C-22 -210 -13 -226 0 -226 C13 -226 22 -210 19 -192 Z', K, 0),
             s('M-28 -216 L28 -216 L28 -208 L-28 -208 Z', BRASS_D, 2.6),
             c(-9, -212, 9, STEEL, 3), c(9, -212, 9, STEEL, 3),
             c(-9, -212, 5.6, '#FFB547', 2), c(9, -212, 5.6, '#9BE15D', 2), c(35, -228, 4, '#FF7A6B', 1.8),
             c(-11, -214, 1.8, '#FFFFFF', 0), c(7, -214, 1.8, '#FFFFFF', 0), c(33.5, -229.5, 1.3, '#FFFFFF', 0),
             s('M-20 -202 L20 -202 L17 -190 C8 -186 -8 -186 -17 -190 Z', PLUM_D, 3),
             s(cog(-27, -212, 6.5, 4.4, 7), BRASS_L, 2.2),
             ln('M-16 -236 C-10 -240 -4 -242 2 -242', PLUM_L, 3)])

    # the Spaulders: a velvet guard on each shoulder, a brass cog for a hinge, one spring blade folded along it
    # and one sprung half open
    blade = 'M0 -4.5 L28 -5.5 C35 -4.5 40 -1.5 43 1 C37 3.5 30 5 23 5 L0 4.5 Z'
    hub = (-60, -170)

    def spaulder(sx, mm):
        return ([s(mm(place(blade, *hub, 128, 0.94)), STEEL_L, 3.2), s(mm(place(blade, *hub, 178, 0.94)), STEEL_L, 3.2),
                 s(mm('M-80 -166 C-64 -169 -46 -167 -32 -161 L-34 -148 C-48 -153 -62 -154 -76 -151 Z'), PLUM_D, 3.5),
                 s(mm('M-30 -184 C-48 -193 -74 -186 -80 -162 C-64 -164 -46 -162 -32 -156 Z'), PLUM, 4),
                 s(mm(cog(*hub, 10, 7, 8)), BRASS, 3)],
                [c(-sx * hub[0], hub[1], 3.2, STEEL, 2),
                 ln(mm(place('M10 -1 L32 -1', *hub, 128)), '#FFFFFF', 2), ln(mm(place('M10 -1 L32 -1', *hub, 178)), '#FFFFFF', 2),
                 ln(mm('M-68 -180 C-60 -186 -50 -188 -42 -186'), PLUM_L, 2.6)])

    # the Coat: plum velvet to the knee, split at the back, lapels, silver buttons and a great many pockets
    pocket = lambda x, y: [s(f'M{x - 8} {y} L{x + 8} {y} L{x + 7} {y + 9} L{x - 7} {y + 9} Z', PLUM_D, 2.6), c(x, y + 5, 2, STEEL_L, 1.4)]
    chest = ([s('M-34 -180 C-42 -146 -42 -112 -46 -72 L-6 -72 L0 -84 L6 -72 L46 -72 C42 -112 42 -146 34 -180 C16 -188 -16 -188 -34 -180 Z', PLUM, 4)],
             [s('M-22 -184 L-6 -146 L-14 -146 L-30 -178 Z', PLUM_L, 3), s('M22 -184 L6 -146 L14 -146 L30 -178 Z', PLUM_L, 3),
              ln('M0 -150 L0 -84', PLUM_D, 3)]
             + pocket(-24, -150) + pocket(24, -150) + pocket(-28, -102) + pocket(28, -102) + pocket(-22, -88)
             + [s('M-41 -122 L41 -122 L41 -113 L-41 -113 Z', BELT, 3), s('M-6 -124 L6 -124 L6 -111 L-6 -111 Z', STEEL, 2.6)]
             + [c(x, y, 2.2, STEEL_L, 1.6) for x in (-5, 5) for y in (-138, -100)]
             + [bar(26, -106, 34, -116, 2.6, STEEL, 2), c(35, -117, 3.2, STEEL, 2),
                ln('M-28 -170 C-31 -160 -33 -150 -34 -140', PLUM_L, 3)])
    return {'helm': helm, 'shoulders': both(spaulder), 'chest': chest, 'weapon': fusecutters()}


def fusecutters():
    """the Fusecutters on their stand: twin daggers crossed, points up, fuse cord wound on their grips and
    lit at the pommels"""
    def dagger(x, y, deg):
        P = lambda d: place(d, x, y, deg)
        tip = turn(15, -95, x, y, deg)
        return ([s(P('M0 0 C-5 -14 -8 -34 -7 -56 L7 -56 C8 -34 5 -14 0 0 Z'), BLADE, 3.4),
                 s(P('M-15 -55 C-15 -60 -12 -62 -8 -62 L8 -62 C12 -62 15 -60 15 -55 C10 -54 -10 -54 -15 -55 Z'), BRASS, 3),
                 s(P('M-4.5 -61 L4.5 -61 L4.5 -86 L-4.5 -86 Z'), FUSE, 3),
                 c(*turn(0, -90, x, y, deg), 5.4, BRASS, 3),
                 s(P(taper(bez((2, -95), (6, -102), (12, -102), (14, -96)), 3.2, 2.4)), FUSE, 2)],
                [ln(P('M0 -8 L0 -48'), '#FFFFFF', 2.2), ln(P('M-4.5 -66 L4.5 -70 M-4.5 -73 L4.5 -77 M-4.5 -80 L4.5 -84'), FUSE_D, 2),
                 halo(*tip, 8, FLAME, 0.35), star(*tip, 6.5, FLAME, 1.6)])
    a, b = dagger(64, -110, 158)
    c_, d = dagger(112, -110, 202)
    return a + c_, b + d


# every set's pieces by item id: the set's own three, and the boss weapon of its role
SETS = {
    'clockguard': (clockguard, 'tinker.tank'),
    'sporebloom': (sporebloom, 'tinker.healer'),
    'arcspark': (arcspark, 'tinker.dps'),
    'gearshade': (gearshade, 'tinker.rogue'),
}
