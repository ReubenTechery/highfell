# Thimblebriar Hollow's sprites in the locked TV-cartoon style: a gnome family's burrow under a hill, half
# mushroom cellar, half brass clockwork workshop where the inventions went wrong. This file has the shared
# helpers, the mobs and both bosses; art_thimble2.py has the bombs and bits, the props, the round door, the
# floor decals and the Tinker King's cuckoo clock. Every sprite is drawn around its ground point (0, 0), mobs
# facing right. Built into art/sprites.json by art_sprites.py (python3 tools/art_sprites.py).
import math, re
from art_sprites import K, LW, f, s, ln, beam, c, e, halo, m, both, STEEL, STEEL_D, STEEL_L, GOLD, GOLD_D, RED, \
    RED_D, WOOD, RUST, FROST, FIRE, FLAME
from art_heads import tp, GSKIN, GSKIN_D, GBLUSH

SPR = {}
TOK = re.compile(r'[A-Za-z]|-?\d*\.?\d+')

# the Hollow's colours: brass and copper, mushroom red and cream, moss, leather
BRASS, BRASS_L, BRASS_D, BRASS_DD = GOLD_D, GOLD, '#B8862A', '#8E6A1E'
COPPER, COPPER_D = '#C87533', '#9A5626'
CAP, CREAM, GILL = RED, '#F6F1E4', '#E6D3AE'
STALK, STALK_D = '#EFE3C8', '#D6C29E'
MOSS, MOSS_D, MOSS_L = '#68B85E', '#4C8F45', '#9BD068'
TAN, TAN_D = RUST, '#86592F'
BOOT, IRON, IRON_L, IRON_D = '#4A3428', '#5C5768', '#7A7484', '#46424F'
BOMB, BOMB_L, SOOT = '#3A3440', '#5E5668', '#4A4458'
GLOW, EMBER = FLAME, FIRE
GINGER, MUSTARD, MUSTARD_D = '#E2733A', '#D89B3C', '#B07A28'
WHITE_H, WHITE_HD = '#F7F3EA', '#D8D2C6'
PINK = '#FF7AE6'


def sprite(name, vb, body, note=''):
    x, y, w, h = vb
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x)} {f(y)} {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
           + ''.join(body) + '</svg>')
    SPR[name] = {'svg': svg, 'vb': [x, y, w, h], 'note': note}


# ---------------------------------------------------------------- shape helpers
def xf(d, ox, oy, deg=0.0, k=1.0):
    """a path in absolute M/L/C/Z commands, scaled by k, turned by deg and moved to (ox, oy)"""
    a = math.radians(deg)
    ca, sa = math.cos(a), math.sin(a)
    out, nums = [], []
    for t in TOK.findall(d):
        if t.isalpha():
            assert t in 'MLCZ', 'xf() takes M, L, C and Z only'
            out.append(t)
            continue
        nums.append(float(t))
        if len(nums) == 2:
            x, y = nums[0] * k, nums[1] * k
            out.append(f'{f(ox + x * ca - y * sa)} {f(oy + x * sa + y * ca)}')
            nums = []
    return ' '.join(out)


def xp(px, py, ox, oy, deg=0.0, k=1.0):
    """one point, moved like xf() moves a path"""
    a = math.radians(deg)
    return ox + k * (px * math.cos(a) - py * math.sin(a)), oy + k * (px * math.sin(a) + py * math.cos(a))


def cog_d(cx, cy, r, n, depth=None, turn=0.0):
    """a gear's outline: n chunky teeth round a circle of radius r"""
    ri = r - (r * 0.26 if depth is None else depth)
    st = 2 * math.pi / n
    pts = []
    for i in range(n):
        a = i * st - math.pi / 2 + turn
        for rr, da in ((ri, -0.29), (r, -0.16), (r, 0.16), (ri, 0.29)):
            pts.append(f'{f(cx + rr * math.cos(a + da * st))} {f(cy + rr * math.sin(a + da * st))}')
    return 'M' + ' L'.join(pts) + ' Z'


def cog(cx, cy, r, n, fill=BRASS, w=LW, hub=BRASS_D, holes=0, turn=0.0, shine=True):
    """a brass gear: teeth, a ring of holes when it's big, a hub and its axle"""
    o = s(cog_d(cx, cy, r, n, turn=turn), fill, w)
    if shine:
        ri = r * 0.6
        o += ln(f'M{f(cx - ri * 0.94)} {f(cy - ri * 0.34)} C{f(cx - ri * 0.8)} {f(cy - ri * 0.8)} {f(cx - ri * 0.34)} {f(cy - ri * 0.98)} {f(cx)} {f(cy - ri)}',
                '#FFF3C4' if fill in (BRASS, BRASS_L) else '#FFFFFF', max(1.6, r * 0.07))
    for i in range(holes):
        a = i * 2 * math.pi / holes + turn + 0.4
        o += c(cx + r * 0.47 * math.cos(a), cy + r * 0.47 * math.sin(a), r * 0.13, BRASS_DD, w * 0.7)
    o += c(cx, cy, r * 0.27, hub, w * 0.8) + c(cx, cy, r * 0.1, K, 0)
    return o


def rivets(pts, r=2.2, col=BRASS_L):
    return ''.join(c(x, y, r, col, 1.6) for x, y in pts)


def blob(circles, fill, w=LW):
    """a cloud, a puff or a lump from round bumps: one ink line round the outside only"""
    return (''.join(c(x, y, r, fill, w * 2) for x, y, r in circles)
            + ''.join(c(x, y, r, fill, 0) for x, y, r in circles))


def spark(cx, cy, r, fill=GLOW, w=2.2):
    q = r * 0.34
    return s(f'M{f(cx)} {f(cy - r)} L{f(cx + q)} {f(cy - q)} L{f(cx + r)} {f(cy)} L{f(cx + q)} {f(cy + q)} L{f(cx)} {f(cy + r)} '
             f'L{f(cx - q)} {f(cy + q)} L{f(cx - r)} {f(cy)} L{f(cx - q)} {f(cy - q)} Z', fill, w)


def fist(x, y, r=7.0, col=GSKIN):
    return c(x, y, r, col, 3.4) + ln(f'M{f(x - r * 0.5)} {f(y - r * 0.2)} H{f(x + r * 0.3)} M{f(x - r * 0.5)} {f(y + r * 0.3)} H{f(x + r * 0.3)}', K, 1.8)


# a big open-ended spanner, the jaw at the origin and the handle running down +y for 62
WRENCH = ('M-5 60 C-5 65 5 65 5 60 L5 9 C14 6 17 -6 11 -13 L5 -6 C7 -3 6 2 0 3 C-6 2 -7 -3 -5 -6 L-11 -13 '
          'C-17 -6 -14 6 -5 9 Z')


def wrench(jx, jy, deg, k=1.0, col=STEEL):
    return (s(xf(WRENCH, jx, jy, deg, k), col) + ln(xf('M-1.6 12 L-1.6 50', jx, jy, deg, k), '#FFFFFF', 2.2 * k)
            + c(*xp(0, 55, jx, jy, deg, k), 2.4 * k, STEEL_D, 2))


# ---------------------------------------------------------------- the gnomes' heads
G_FACE = 'M-15.4 -1 C-16 -19.5 16 -19.5 15.4 -1 C15.8 10 10.5 17 0 17.4 C-10.5 17 -15.8 10 -15.4 -1 Z'
G_EAR = 'M-13.5 -3 C-23 -12 -34 -8 -33 2 C-32 11 -21 12 -13.5 6 Z'
G_EAR_IN = 'M-17.5 0.5 C-22 -5 -29 -3 -28.5 2.5 C-28 6.5 -23 7.5 -19.5 5'
G_LID = 'M0.8 -7.2 L12 -7.2 L12 -4.6 L0.8 -1.2 Z'
G_BROW = 'M0 -1.8 L13 -6.6 L13.4 -10 L0.2 -5.2 Z'


def ghead(x, y, k, hair=GINGER, cross=True, shut=None, look=0.7, blush=True, goggles=False, brow=None):
    """a gnome mob's head round the middle of its eyes (x, y), k times the gnome heroes' head units: sail ears,
    a round face, big eyes under cross lids and bristling brows, a turnip of a nose. Mouths, whiskers and
    hats are the caller's. `shut`: -1 or 1 screws that eye shut (aiming); `goggles` rings both eyes in brass;
    `brow` is another brow shape (head units, the viewer's right one)."""
    T = lambda d, mx=1: tp(d, x, y, k, mx)
    o = [s(T(G_EAR), GSKIN, 3.4) + s(T(G_EAR, -1), GSKIN, 3.4)]
    o.append(ln(T(G_EAR_IN), GSKIN_D, 2.4) + ln(T(G_EAR_IN, -1), GSKIN_D, 2.4))
    o.append(s(T(G_FACE), GSKIN, 3.6))
    if blush:
        o.append(e(x - 10 * k, y + 5.4 * k, 3.4 * k, 2.1 * k, GBLUSH, 0) + e(x + 10 * k, y + 5.4 * k, 3.4 * k, 2.1 * k, GBLUSH, 0))
    for sx in (-1, 1):
        ex, ey = x + 6.2 * sx * k, y + 0.6 * k
        if shut == sx:
            o.append(ln(f'M{f(ex - 4 * k)} {f(ey)} C{f(ex - 2 * k)} {f(ey + 1.6 * k)} {f(ex + 2 * k)} {f(ey + 1.6 * k)} {f(ex + 4 * k)} {f(ey)}', K, 2.8))
        else:
            if goggles:
                o.append(c(ex, ey, 7.2 * k, BRASS, 3) + c(ex + 2.2 * sx * k, ey - 3.4 * k, 1.1 * k, BRASS_L, 0))
            o.append(e(ex, ey, 4.4 * k, 5.0 * k, '#FFFFFF', 2.4))
            o.append(c(ex + look * k, ey + 0.9 * k, 2.1 * k, K, 0) + c(ex + (look - 0.8) * k, ey, 0.7 * k, '#FFFFFF', 0))
            if cross:
                o.append(s(T(G_LID, sx), GSKIN, 0) + ln(T('M0.8 -1.2 L12 -4.6', sx), K, 2.4))
        o.append(s(T(brow or G_BROW, sx), hair, 2.6))
    o.append(c(x, y + 4.9 * k, 4.7 * k, GSKIN_D, 3.0) + c(x - 1.6 * k, y + 3.3 * k, 1.3 * k, '#FFE4D0', 0))
    return o


def moustache(x, y, k, col, droop=1.0):
    """a bristling walrus moustache under the nose (head units again)"""
    d = (f'M-15 {f(11 + droop)} C-13 5.5 -6 5 0 8.5 C6 5 13 5.5 15 {f(11 + droop)} C12 10.5 10 11.5 8 13.8 '
         f'C6 11.8 3 12.6 0 13.4 C-3 12.6 -6 11.8 -8 13.8 C-10 11.5 -12 10.5 -15 {f(11 + droop)} Z')
    return s(tp(d, x, y, k), col, 2.8)


# ---------------------------------------------------------------- mobs
def scrapper():
    o = []
    hx, hy, k = 0, -66, 1.2
    o.append(wrench(-62, -96, -29, 1.04))
    o.append(both('M-21 -13 H-4 V0 H-26 C-28 -6 -26 -11 -21 -13 Z', BOOT))
    o.append(both('M-17 -27 H-4 V-12 H-19 Z', '#3D5A8C'))
    o.append(s('M-22 -58 C-31 -48 -31 -30 -23 -22 H23 C31 -30 31 -48 22 -58 Z', MOSS_D))
    # the leather apron, its pocket and a screwdriver in it
    o.append(s('M-15 -54 H15 L19 -19 C8 -15 -8 -15 -19 -19 Z', TAN))
    o.append(beam('M5 -36 L7 -47', RED, 4.4, 3.2))
    o.append(s('M-10 -40 H10 V-28 H-10 Z', TAN_D, 3) + ln('M0 -40 V-28', K, 1.8))
    o.append(ln('M-12 -50 C-8 -48 8 -48 12 -50', '#C4945E', 2.2))
    # the free arm, a fist ready
    o.append(s('M21 -55 C30 -51 34 -44 35 -37 L27 -34 C26 -40 24 -44 17 -47 Z', MOSS_D))
    o.append(fist(31, -33, 7.4))
    # the wrench arm
    o.append(s('M-21 -55 C-30 -52 -34 -46 -35 -40 L-27 -36 C-26 -41 -24 -45 -17 -47 Z', MOSS_D))
    o.append(fist(-31, -39, 7.6))
    o += ghead(hx, hy, k, GINGER)
    # side tufts, the floppy cap with its goggles, the whiskers
    o.append(both('M-17.5 -76 L-24 -80 L-20 -82 L-24 -88 L-15.5 -84 Z', GINGER, 2.6))
    o.append(s('M-21 -80 C-23 -96 -12 -108 4 -109 C18 -109 31 -101 35 -91 C36 -86 32 -83 28 -86 C25 -91 21 -92 18 -89 L20.5 -80 Z', '#5E9E4E'))
    o.append(ln('M-7 -103 C1 -105 12 -104 21 -99', '#7FBF6E', 2.6))
    o.append(s('M-21.5 -86.5 C-8 -89 8 -89 21.5 -86.5 V-80 C8 -82.5 -8 -82.5 -21.5 -80 Z', '#6B4528', 3))
    for sx in (-1, 1):
        o.append(c(sx * 8, -88, 6.6, BRASS, 3) + c(sx * 8, -88, 3.9, FROST, 2) + c(sx * 8 - 1.4, -89.4, 1.3, '#FFFFFF', 0))
    o.append(moustache(hx, hy, k, GINGER))
    o.append(e(hx + 0.5, hy + 18.2, 3.4, 2.1, '#5A1E1E', 2))
    sprite('scrapper', (-83, -116, 127, 122), o, 'Gnome Scrapper')


def gn_slinger():
    o = []
    hx, hy, k = 0, -64, 1.15
    o.append(both('M-19 -12 H-4 V0 H-24 C-26 -5 -24 -10 -19 -12 Z', BOOT))
    o.append(both('M-15 -26 H-4 V-11 H-17 Z', '#6B4528'))
    o.append(s('M-18 -56 C-25 -46 -25 -32 -20 -22 H20 C25 -32 25 -46 18 -56 Z', '#4F86C6'))
    o.append(s('M-21 -32 H21 V-25 H-21 Z', '#6B4528', 3) + s('M-5 -33.5 H5 V-23.5 H-5 Z', BRASS, 2.6))
    # the pouch of cogs on the hip
    o.append(cog(-21, -37, 7.5, 8, w=2.6, shine=False) + cog(-11, -39, 6, 7, w=2.4, shine=False))
    o.append(s('M-30 -37 C-31 -24 -25 -18 -17 -18 C-9 -18 -4 -24 -6 -37 C-12 -34 -23 -34 -30 -37 Z', TAN, 3.2))
    o.append(ln('M-18 -33 V-22', TAN_D, 2.2))
    # the arm with a cog in its fist
    o.append(s('M-18 -53 C-26 -49 -29 -44 -30 -38 L-23 -36 C-22 -41 -20 -44 -15 -46 Z', '#4F86C6'))
    o.append(fist(-27, -34, 6.6))
    # the slingshot held out, loaded with a cog
    o.append(s('M18 -53 C28 -54 34 -56 38 -60 L42 -53 C36 -48 28 -46 17 -46 Z', '#4F86C6'))
    o.append(beam('M44 -40 L44 -58', WOOD, 5.5, 3.6) + beam('M44 -58 L35 -80 M44 -58 L53 -80', WOOD, 5, 3.6))
    o.append(ln('M35 -79 C36 -68 52 -68 53 -79', '#6B4528', 2.4))
    o.append(cog(44, -70, 5.2, 7, w=2.4, shine=False))
    o.append(fist(43, -53, 6.6))
    o += ghead(hx, hy, k, '#8A5A34', shut=-1, look=1.1)
    # the knitted hat, its tip flopped over with a bobble on the end
    o.append(s('M-19 -81 C-19 -90 -16 -96 -12 -99 C-16 -98 -21 -96 -24 -92 L-31 -95 C-25 -104 -12 -109 -1 -107 C10 -102 17 -93 19 -81 Z', MUSTARD))
    o.append(ln('M-6 -99 C-1 -96 5 -90 8 -85', '#F2C26A', 2.4))
    o.append(c(-30, -92, 6.4, RED, 3) + c(-32, -94, 1.8, '#E0605A', 0))
    o.append(s('M-20.5 -82 C-8 -85 8 -85 20.5 -82 L20.5 -76.5 C8 -79.5 -8 -79.5 -20.5 -76.5 Z', MUSTARD_D, 3))
    o.append(ln('M-14 -82.5 V-78 M-7 -83.6 V-79 M0 -84 V-79.4 M7 -83.6 V-79 M14 -82.5 V-78', '#8E6020', 1.8))
    # a cheeky gap-toothed grin
    o.append(s(tp('M-7.5 10.4 C-3 12 3 12 7.5 10.4 C6 17 -6 17 -7.5 10.4 Z', hx, hy, k), '#5A1E1E', 2.4))
    o.append(s(tp('M-3.8 11.6 H-0.7 V14 H-3.8 Z M0.7 11.6 H3.8 V14 H0.7 Z', hx, hy, k), '#FFFFFF', 1.4))
    sprite('gn_slinger', (-42, -114, 102, 120), o, 'Gnome Slinger')


def bombwright(name='bombwright', medic=False):
    """the Bombwright; medic=True is the mender: the same gnome in a green coat and a medic's apron, with tonic
    flasks where the bombs were"""
    o = []
    coat = '#4F9A6A' if medic else RED
    glass, glass_l = ('#9BE15D', '#D8FFB8') if medic else (BOMB, BOMB_L)
    hx, hy, k = 0, -64, 1.2
    o.append(both('M-20 -12 H-4 V0 H-25 C-27 -5 -25 -10 -20 -12 Z', BOOT))
    o.append(both('M-16 -26 H-4 V-11 H-18 Z', '#5A4A3A'))
    o.append(s('M-21 -57 C-29 -47 -29 -31 -22 -21 H22 C29 -31 29 -47 21 -57 Z', coat))
    if medic:
        # the apron, with a green plus
        o.append(s('M-14 -52 H14 L16 -22 H-16 Z', WHITE_H, 3) + s('M-3 -45 H3 V-41 H7 V-35 H3 V-31 H-3 V-35 H-7 V-41 H-3 Z', '#4E9A4A', 2))
    if not medic:
        o.append(ln('M-12 -50 C-14 -40 -13 -32 -11 -26', '#E0605A', 2.6))
    o.append(c(13, -46, 3.2, SOOT, 0) + c(-8, -31, 2.6, SOOT, 0))
    o.append(s('M-21 -30 H21 V-23 H-21 Z', '#4A3428', 3) + s('M-5 -31.5 H5 V-21.5 H-5 Z', BRASS, 2.6))
    # the satchel strap and the satchel of bombs on the hip
    o.append(s('M-18 -55 L-12 -57 L24 -28 L18 -24 Z', '#6B4528', 3))
    for bx, by, r in ((14, -37, 8), (27, -39, 7.5)):
        o.append(ln(f'M{f(bx + 1)} {f(by - r)} C{f(bx + 2)} {f(by - r - 4)} {f(bx + 5)} {f(by - r - 5)} {f(bx + 6)} {f(by - r - 8)}', '#C8B08A', 2.6))
        o.append(c(bx, by, r, glass, 3.2) + ln(f'M{f(bx - r * 0.6)} {f(by - r * 0.2)} C{f(bx - r * 0.5)} {f(by - r * 0.6)} {f(bx - r * 0.2)} {f(by - r * 0.75)} {f(bx + r * 0.1)} {f(by - r * 0.8)}', glass_l, 2.4))
    o.append(s('M7 -34 H35 L33 -14 C25 -10 16 -10 9 -14 Z', TAN, 3.4) + s('M7 -34 H35 L34 -27 C25 -24 17 -24 8 -27 Z', TAN_D, 3))
    o.append(c(21, -26, 2.6, BRASS, 2))
    # the arm down at the side
    o.append(s('M21 -54 C29 -50 33 -45 34 -40 L27 -37 C26 -42 24 -45 18 -47 Z', coat))
    o.append(fist(31, -35, 7))
    # the arm up with a lit bomb
    o.append(s('M-19 -52 C-28 -56 -33 -62 -35 -71 L-27 -73 C-25 -66 -22 -62 -15 -59 Z', coat))
    if medic:
        # a tonic flask held up, glowing
        o.append(halo(-32, -92, 16, '#D8FFB8', 0.4))
        o.append(c(-32, -90, 10, glass) + ln('M-38 -93 C-37 -96 -35 -97.4 -33 -97.8', glass_l, 2.6))
        o.append(s('M-35.4 -106 H-28.6 V-99 H-35.4 Z', '#D8D2C6', 2.4) + s('M-36.6 -110 H-27.4 V-105 H-36.6 Z', WOOD, 2.4))
    else:
        o.append(halo(-25, -110, 14, FLAME, 0.35))
        o.append(c(-32, -90, 11, BOMB) + ln('M-38.6 -94 C-37.8 -97 -35.8 -98.4 -33.4 -98.8', BOMB_L, 2.6))
        o.append(s('M-36.2 -102.6 L-29.8 -104 L-28.8 -100.2 L-35.2 -98.8 Z', BRASS, 2.4))
        o.append(ln('M-32.4 -103.6 C-32 -107.4 -29 -109.4 -27 -110.4', '#C8B08A', 2.6) + spark(-25.6, -112.4, 6.2))
    o.append(fist(-32, -76, 7))
    o += ghead(hx, hy, k, K, look=0.4)
    # soot on the face
    o.append(e(hx - 11.5, hy + 9.5, 4.6, 2.6, SOOT, 0) + e(hx + 9, hy + 16, 2.6, 1.6, SOOT, 0))
    # the leather cap and its smoky goggles
    o.append(s('M-20 -76.5 C-21.5 -93 -11 -101 0 -101 C11 -101 21.5 -93 20 -76.5 C10 -81.5 -10 -81.5 -20 -76.5 Z', '#7A5534'))
    o.append(ln('M0 -101 V-92', '#5E4026', 2.4) + ln('M-13 -95 C-9 -98 -4 -99.5 -1 -99.5', '#9C7148', 2.4))
    o.append(s('M-20 -91 C-8 -93 8 -93 20 -91 V-85 C8 -87 -8 -87 -20 -85 Z', '#4A3428', 2.8))
    for sx in (-1, 1):
        o.append(c(sx * 8, -88.5, 6.6, BRASS, 3) + c(sx * 8, -88.5, 3.9, '#5E7D8C', 2) + c(sx * 8 - 1.4, -89.9, 1.3, '#FFFFFF', 0))
    # a mad wide grin
    o.append(s(tp('M-9.5 10.2 C-3 11.6 3 11.6 9.5 10.2 C8 17.6 -8 17.6 -9.5 10.2 Z', hx, hy, k), '#FFFFFF', 2.4))
    o.append(ln(tp('M-8.2 12.6 C-3 14.2 3 14.2 8.2 12.6 M-3 11.4 V15.6 M3 11.4 V15.6', hx, hy, k), K, 1.4))
    sprite(name, (-48, -124, 92, 130), o, 'Gnome Medic' if medic else 'Bombwright')


def waddlecap():
    o = []
    # stubby legs and feet
    o.append(both('M-15 -22 H-5 V-8 H-15 Z', STALK_D, 3.4))
    o.append(both('M-20 -9 C-20 -15 -3 -15 -3 -9 V0 H-22 C-23 -3 -22 -7 -20 -9 Z', STALK_D, 3.6))
    # stubby arms
    o.append(both('M-17 -44 C-27 -45 -33 -40 -34 -33 L-27 -30 C-26 -35 -22 -37 -16 -36 Z', STALK, 3.6))
    o.append(c(-31, -29, 5.6, STALK, 3.4) + c(31, -29, 5.6, STALK, 3.4))
    # the stalk body and its frill
    o.append(s('M-19 -58 C-24 -44 -24 -28 -18 -16 C-10 -11 10 -11 18 -16 C24 -28 24 -44 19 -58 Z', STALK))
    o.append(ln('M-17 -40 C-18 -32 -17 -24 -14 -18 M16 -44 C17 -38 17 -30 15 -24', STALK_D, 2.6))
    # the angry little face under the cap
    for sx in (-1, 1):
        o.append(e(sx * 7, -44, 4.2, 4.8, '#FFFFFF', 2.4) + c(sx * 7 + 1.2, -43, 2.1, K, 0))
    o.append(ln('M-13 -51 L-3 -46.5 M13 -51 L3 -46.5', K, 4.2))
    o.append(s('M-8 -31 C-7 -37 7 -37 8 -31 C4 -33.4 -4 -33.4 -8 -31 Z', '#5A1E1E', 2.6) + s('M-4.4 -35 H4.4 L3.8 -33.6 H-3.8 Z', '#FFFFFF', 0))
    # the cap: gills under it, then the red dome and its spots
    o.append(s('M-44 -60 C-30 -50 30 -50 44 -60 Z', GILL, 3.4) + ln('M-26 -56 L-20 -53 M-10 -55 L-8 -52 M10 -55 L8 -52 M26 -56 L20 -53', '#B9A27A', 2))
    o.append(s('M-49 -60 C-53 -86 -28 -106 0 -106 C28 -106 53 -86 49 -60 C38 -55 -38 -55 -49 -60 Z', CAP))
    o.append(s('M-38 -78 C-36 -90 -24 -99 -12 -101 C-22 -95 -30 -88 -34 -76 Z', '#E0605A', 0))
    for x, y, rx, ry in ((-20, -86, 8, 7), (7, -96, 6.5, 5), (28, -82, 8, 7), (-2, -74, 5, 4.5), (-38, -67, 4, 4.5), (40, -66, 3.6, 4.2), (14, -66, 4, 3.2)):
        o.append(e(x, y, rx, ry, CREAM, 2.6))
    sprite('waddlecap', (-56, -112, 112, 116), o, 'Waddlecap')


def stomper():
    o = []
    # the chimney and its puff
    o.append(s('M18 -138 L16 -154 H34 L32 -138 Z', IRON) + s('M13 -158 H37 V-152 H13 Z', IRON_D, 3.4))
    o.append(blob([(21, -165, 6.5), (29, -169, 5.5), (36, -164, 4.5)], '#E8E2EC', 3.2))
    # the pressure gauge on its pipe
    o.append(beam('M-22 -136 L-26 -144', COPPER, 5, 3.4) + c(-27, -150, 9.5, CREAM, 3.4))
    o.append(s('M-27 -150 L-21 -157 A9 9 0 0 1 -18 -151 Z', RED, 0) + ln('M-27 -150 L-21 -155', K, 2.6) + c(-27, -150, 2, K, 0))
    # stumpy legs and big round feet
    o.append(both('M-36 -48 H-12 V-18 H-36 Z', IRON))
    o.append(both('M-37 -36 H-11 V-29 H-37 Z', COPPER, 3.2))
    o.append(both('M-44 -18 C-44 -26 -36 -27 -24 -27 C-12 -27 -6 -24 -6 -16 V0 H-48 C-50 -7 -48 -14 -44 -18 Z', BRASS))
    o.append(rivets([(-38, -9), (-26, -9), (-14, -9), (38, -9), (26, -9), (14, -9)], 2))
    # the boiler
    o.append(s('M-44 -130 C-44 -152 44 -152 44 -130 C53 -106 55 -72 46 -48 C30 -38 -30 -38 -46 -48 C-55 -72 -53 -106 -44 -130 Z', BRASS))
    o.append(s('M-38 -112 C-43 -96 -43 -76 -38 -60 C-34 -64 -34 -100 -38 -112 Z', BRASS_L, 0))
    o.append(s('M-46 -128 C-20 -120 20 -120 46 -128 L48 -119 C20 -111 -20 -111 -48 -119 Z', COPPER, 3.4))
    o.append(s('M-50 -64 C-20 -54 20 -54 50 -64 L48 -55 C20 -46 -20 -46 -48 -55 Z', COPPER, 3.4))
    o.append(rivets([(-36, -121), (-18, -117.5), (0, -116.5), (18, -117.5), (36, -121), (-36, -57), (-18, -53), (0, -52), (18, -53), (36, -57)]))
    # the face: porthole eyes under an iron brow, a grate of a mouth with the fire behind it
    o.append(halo(0, -78, 26, EMBER, 0.32))
    o.append(s('M-24 -88 H24 C28 -88 30 -86 30 -82 V-72 C30 -68 28 -66 24 -66 H-24 C-28 -66 -30 -68 -30 -72 V-82 C-30 -86 -28 -88 -24 -88 Z', '#2A1E18', 3.6))
    o.append(s('M-22 -84 H22 V-70 H-22 Z', EMBER, 0) + s('M-16 -80 H16 V-72 H-16 Z', GLOW, 0))
    o.append(ln('M-15 -87 V-67 M-5 -87 V-67 M5 -87 V-67 M15 -87 V-67', K, 3.6))
    for sx in (-1, 1):
        o.append(c(sx * 17, -101, 11.5, BRASS_D, 3.6) + c(sx * 17, -101, 7, GLOW, 2.6) + c(sx * 17 + 2.4, -100, 3, K, 0))
    o.append(s('M-34 -118 L0 -106 L34 -118 L35 -110 L0 -98 L-35 -110 Z', IRON, 3.4) + rivets([(-27, -111.5), (27, -111.5)], 1.8, IRON_L))
    o.append(c(28, -56, 8, RED, 3.2) + ln('M22 -56 H34 M28 -62 V-50', K, 2.4) + c(28, -56, 2.4, RED_D, 1.6))
    # piston arms, each with a heavy fist
    for sx in (-1, 1):
        o.append(beam(f'M{sx * 48} -110 L{sx * 66} -86', COPPER, 13, 3.6))
        o.append(c(sx * 48, -112, 10, BRASS, 3.6) + c(sx * 66, -84, 7.5, IRON, 3.4))
        o.append(s(f'M{sx * 60} -84 H{sx * 72} V-60 H{sx * 60} Z', BRASS, 3.4) + beam(f'M{sx * 66} -60 V-50', STEEL_L, 5, 3.4))
        o.append(s(tp('M-15 -52 H15 C17 -52 18 -50 18 -48 V-34 C18 -29 15 -26 12 -26 C9 -26 7 -28 6 -30 C5 -26 2 -24 0 -24 '
                      'C-2 -24 -5 -26 -6 -30 C-7 -28 -9 -26 -12 -26 C-15 -26 -18 -29 -18 -34 V-48 C-18 -50 -17 -52 -15 -52 Z', sx * 66, 0, 1, sx), IRON))
        o.append(ln(tp('M-6 -30 V-38 M6 -30 V-38 M-15 -42 H15', sx * 66, 0, 1, sx), K, 2.4))
        o.append(rivets([(sx * 66 - 10, -47), (sx * 66 + 10, -47)], 1.8, IRON_L))
    sprite('stomper', (-90, -178, 180, 184), o, 'Brass Stomper')


# ---------------------------------------------------------------- Old Toadstool, the mini boss
TS_CAP, TS_CAP_D, TS_CAP_L = '#A8452F', '#7E3324', '#C4614A'
TS_FLESH, TS_FLESH_D, TS_ROOT, TS_ROOT_D = '#E9DCBF', '#C9B48E', '#C2A57A', '#9C8058'
TS_NOSE = '#E2BE94'


def chipped(cx, cy, r, bite):
    """an old cap spot with a chip out of it on side `bite` (radians)"""
    pts = []
    for i in range(16):
        a = i * math.pi / 8
        d = abs((a - bite + math.pi) % (2 * math.pi) - math.pi)
        rr = r * (0.55 if d < 0.25 else 0.78 if d < 0.45 else 1.0)
        pts.append(f'{f(cx + rr * math.cos(a))} {f(cy + rr * 0.9 * math.sin(a))}')
    return s('M' + ' L'.join(pts) + ' Z', CREAM, 3)


def toadstool():
    o = []
    # the walking stick, a forked twig with two leaves
    o.append(beam('M112 -1 L104 -126', WOOD, 7, 3.8) + beam('M104 -126 L96 -142 M104 -126 L116 -144', WOOD, 5, 3.6))
    o.append(s(xf('M0 0 C6 -6 14 -6 20 0 C14 6 6 6 0 0 Z', 116, -144, -68), MOSS_L, 3) + s(xf('M0 0 C6 -6 14 -6 20 0 C14 6 6 6 0 0 Z', 96, -142, -150), MOSS, 3))
    # root feet splayed on the floor
    for d in ('M-64 -40 C-84 -34 -104 -20 -120 -3 C-112 1 -102 1 -96 -2 C-86 -12 -74 -20 -58 -24 Z',
              'M-50 -22 C-60 -14 -70 -6 -80 1 C-72 3 -62 3 -56 0 C-52 -6 -48 -12 -42 -16 Z',
              'M-30 -16 C-34 -10 -36 -4 -38 2 C-32 4 -24 4 -20 1 C-20 -6 -20 -10 -18 -14 Z'):
        o.append(s(d, TS_ROOT, 3.6) + s(m(d), TS_ROOT, 3.6))
    o.append(ln('M-74 -26 C-88 -18 -98 -10 -108 -3 M74 -26 C88 -18 98 -10 108 -3', TS_ROOT_D, 2.6))
    # the wrinkly old stalk
    o.append(s('M-60 -184 C-68 -150 -78 -110 -76 -70 C-75 -50 -70 -34 -62 -22 C-40 -12 40 -12 62 -22 C70 -34 75 -50 76 -70 C78 -110 68 -150 60 -184 Z', TS_FLESH))
    o.append(s('M-58 -150 C-66 -120 -68 -90 -64 -60 C-60 -84 -58 -120 -52 -146 Z', '#F5ECD8', 0))
    o.append(ln('M-66 -70 C-58 -64 -50 -64 -44 -68 M66 -58 C58 -52 50 -52 44 -56 M-70 -44 C-62 -38 -54 -38 -48 -42 M54 -118 C60 -112 66 -110 70 -112', TS_FLESH_D, 3))
    # stubby arms: one on the stick, one shaking a fist
    o.append(s('M62 -122 C78 -122 92 -114 100 -104 L90 -92 C84 -100 74 -106 60 -104 Z', TS_FLESH))
    o.append(c(100, -98, 11, TS_FLESH) + ln('M91 -102 H108 M91 -95 H108', K, 2.2))
    o.append(s('M-62 -114 C-78 -116 -92 -124 -100 -134 L-88 -144 C-82 -134 -72 -128 -58 -128 Z', TS_FLESH))
    o.append(c(-98, -142, 12, TS_FLESH) + ln('M-107 -146 H-90 M-107 -139 H-90', K, 2.2))
    # the mossy beard, with a little white flower in it
    o.append(blob([(-44, -96, 14), (-30, -78, 16), (-12, -62, 17), (10, -56, 17), (28, -70, 16), (42, -88, 14), (0, -84, 22),
                   (-22, -100, 14), (22, -100, 14)], MOSS, 3.6))
    o.append(ln('M-30 -76 C-28 -70 -24 -66 -20 -64 M2 -70 C4 -64 6 -60 10 -58 M30 -86 C30 -80 28 -76 26 -74', MOSS_D, 3))
    for fx, fy in ((-24, -82), (20, -66)):
        o.append(''.join(c(fx + 3.6 * math.cos(a * 1.2566), fy + 3.6 * math.sin(a * 1.2566), 2.6, '#FFFFFF', 1.6) for a in range(5)) + c(fx, fy, 1.8, GOLD, 0))
    # the grumpy old face: heavy lids, bushy white brows, a big nose, a mossy moustache and a scowl
    for sx in (-1, 1):
        o.append(e(sx * 26, -128, 9, 8, '#FFFFFF', 3) + c(sx * 26 + 2.6, -126, 3.6, K, 0) + c(sx * 26 + 1.4, -127.4, 1.1, '#FFFFFF', 0))
        o.append(s(tp('M14 -140 H38 V-129 C32 -131 22 -128 14 -125 Z', 0, 0, 1, sx), TS_FLESH, 0) + ln(tp('M15 -126 C22 -129 31 -131 37 -129.5', 0, 0, 1, sx), K, 3))
    o.append(ln('M-40 -150 C-30 -146 -18 -146 -10 -150 M10 -150 C18 -146 30 -146 40 -150', TS_FLESH_D, 2.6))
    o.append(blob([(-12, -136, 7), (-22, -140, 8.5), (-34, -141, 9), (-46, -137, 8), (-53, -129, 6)], WHITE_H, 3.2))
    o.append(blob([(12, -136, 7), (22, -140, 8.5), (34, -141, 9), (46, -137, 8), (53, -129, 6)], WHITE_H, 3.2))
    o.append(c(0, -110, 15, TS_NOSE, 3.6) + c(-5, -116, 4, '#F2D8B6', 0) + c(8, -104, 2.4, '#C99C6E', 1.6))
    o.append(blob([(-30, -92, 9), (-18, -95, 10), (-6, -95, 9), (6, -95, 9), (18, -95, 10), (30, -92, 9)], MOSS_D, 3.4))
    o.append(ln('M-10 -80 C-4 -84 4 -84 10 -80', K, 3.4))
    # the gills under the cap, then the big old cap
    o.append(s('M-118 -172 C-80 -144 80 -144 118 -172 Z', GILL, 3.6))
    o.append(ln('M-90 -166 L-70 -156 M-60 -162 L-46 -153 M-26 -160 L-20 -151 M26 -160 L20 -151 M60 -162 L46 -153 M90 -166 L70 -156', '#B79F74', 2.4))
    o.append(s('M-126 -170 C-132 -230 -72 -274 0 -274 C72 -274 132 -230 126 -170 C114 -166 108 -170 104 -164 L98 -170 '
               'C60 -160 -90 -158 -126 -170 Z', TS_CAP))
    o.append(s('M-104 -200 C-100 -230 -70 -256 -36 -264 C-64 -248 -86 -226 -94 -196 Z', TS_CAP_L, 0))
    o.append(ln('M78 -168 L84 -184 L80 -194 M-40 -268 L-32 -254', TS_CAP_D, 3))
    for x, y, r, b in ((-58, -228, 15, 0.6), (8, -246, 11, None), (60, -222, 17, 3.6), (-14, -200, 9, None), (-100, -188, 8, None),
                       (100, -192, 8, 2.0), (30, -184, 7, None), (-38, -182, 6, None)):
        o.append(chipped(x, y, r, b) if b is not None else e(x, y, r, r * 0.9, CREAM, 3))
    # a baby toadstool sprouting from the old one's cap, and a tuft of moss
    o.append(beam('M38 -264 L40 -278', STALK, 4, 3.2) + s('M28 -276 C28 -290 52 -290 52 -276 C46 -274 34 -274 28 -276 Z', CAP, 3) + c(36, -282, 2.2, CREAM, 0) + c(45, -280, 1.8, CREAM, 0))
    o.append(blob([(-82, -238, 7), (-72, -242, 8), (-62, -240, 6)], MOSS, 3))
    sprite('toadstool', (-130, -294, 260, 300), o, 'Old Toadstool')


# ---------------------------------------------------------------- the Tinker King, the final boss
KING_COAT = '#6A4BA3'
GLASS = '#B5E2F4'
WIND_KEY = 'M-5 0 L-5 -46 L-17 -50 C-30 -50 -34 -72 -20 -76 C-12 -78 -6 -72 -4 -66 L4 -66 C6 -72 12 -78 20 -76 C34 -72 30 -50 17 -50 L5 -46 L5 0 Z'
KING_BROW_UP = 'M1 -7.6 C4.5 -10.2 9.5 -10.6 14 -8.2 L13.4 -5.2 C9.4 -7.2 5.2 -7 1.4 -4.6 Z'
KING_BROW_MAD = 'M-0.4 -2.4 L13.4 -9 L14.2 -12.6 L-0.2 -6.2 Z'
KING_TASH = ('M-26 1 C-23 -2 -19 -1 -17 3 C-14 8 -6 6 0 8 C6 6 14 8 17 3 C19 -1 23 -2 26 1 C23 0 21 2 21 5 '
             'C18 13 8 14 0 12.4 C-8 14 -18 13 -21 5 C-21 2 -23 0 -26 1 Z')


def half_cog(x, y, r, n, fill=BRASS, w=3.0):
    """the top half of a gear, flat side down at (x, y): the Tinker King's crown"""
    ri, st = r * 0.72, math.pi / n
    pts = [f'{f(x - ri)} {f(y)}']
    for i in range(n):
        a = math.pi + (i + 0.5) * st
        for rr, da in ((ri, -0.3), (r, -0.17), (r, 0.17), (ri, 0.3)):
            pts.append(f'{f(x + rr * math.cos(a + da * st))} {f(y + rr * math.sin(a + da * st))}')
    pts.append(f'{f(x + ri)} {f(y)}')
    return s('M' + ' L'.join(pts) + ' Z', fill, w)


def king(o, mad=False):
    """the little Tinker King in his glass dome: purple coat, a half-cog crown, brass goggles, a huge white moustache"""
    x, y, k = 0, -267, 1.2
    T = lambda d: tp(d, x, y, k)
    o.append(s('M-30 -236 C-30 -250 -20 -256 -8 -256 H8 C20 -256 30 -250 30 -236 Z', KING_COAT))
    o.append(s('M-8 -256 L0 -244 L8 -256 Z', WHITE_H, 2.4))
    for sx in (-1, 1):
        o.append(beam(f'M{sx * 32} -232 L{sx * 46} -252', STEEL_D, 4, 3.2) + c(sx * 47, -254, 5.4, RED, 3))
    o += ghead(x, y, k, WHITE_H, cross=mad, look=0.9, goggles=True, brow=KING_BROW_MAD if mad else KING_BROW_UP)
    if mad:
        o.append(e(x - 11 * k, y + 6 * k, 4.2 * k, 2.6 * k, '#E86A6A', 0) + e(x + 11 * k, y + 6 * k, 4.2 * k, 2.6 * k, '#E86A6A', 0))
    tash = KING_TASH if not mad else KING_TASH.replace('C-23 -2 -19 -1', 'C-25 -6 -20 -5').replace('C19 -1 23 -2', 'C20 -5 25 -6')
    o.append(s(T(tash), WHITE_H, 2.8))
    o.append(ln(T('M-14 6.6 C-10 9 -5 9.4 -1 9.4 M14 6.6 C10 9 5 9.4 1 9.4'), WHITE_HD, 1.8))
    if mad:
        o.append(s(T('M-6 12.4 C-3 10.6 3 10.6 6 12.4 C5.4 18.6 -5.4 18.6 -6 12.4 Z'), '#5A1E1E', 2.6) + s(T('M-4.4 11.8 H4.4 V13.4 H-4.4 Z'), '#FFFFFF', 1.2))
    # the crown: half a cog with a pink stone in its hub
    o.append(half_cog(x, y - 13.6 * k, 13.2 * k, 5) + s(T('M-13.6 -15.6 H13.6 V-11.4 H-13.6 Z'), BRASS_D, 2.6))
    o.append(c(x, y - 15.8 * k, 3.4 * k, BRASS_D, 2.2) + c(x, y - 15.8 * k, 2.1 * k, PINK, 1.6))


def tinker_suit(clock, cracked=False):
    """the Tinker King's clockwork suit; `clock` draws the cuckoo clock (art_thimble2.clock)"""
    o = []
    # the wind-up key in its back
    kx, ky, kd = -52, -214, -40
    o.append(s(xf(WIND_KEY, kx, ky, kd), BRASS) + c(*xp(-20, -63, kx, ky, kd), 5, BRASS_DD, 3) + c(*xp(20, -63, kx, ky, kd), 5, BRASS_DD, 3))
    # stumpy legs and big flat feet
    o.append(both('M-74 -78 H-36 V-36 H-74 Z', IRON) + both('M-76 -62 H-34 V-53 H-76 Z', COPPER, 3.4))
    o.append(both('M-92 -30 C-92 -40 -82 -43 -66 -43 H-36 C-26 -43 -20 -37 -20 -27 V0 H-98 C-100 -12 -98 -24 -92 -30 Z', BRASS))
    o.append(rivets([(-84, -10), (-68, -10), (-52, -10), (-36, -10), (84, -10), (68, -10), (52, -10), (36, -10)], 2.4))
    # the wrench arm (the viewer's left) and the claw arm: big brass gauntlets on iron elbows
    for sx in (-1, 1):
        o.append(beam(f'M{sx * 100} -194 L{sx * 118} -152', COPPER, 20, 3.8) + c(sx * 118, -150, 15, IRON))
    o.append(wrench(-113, -30, 180, 1.45))
    talon = 'M-6 0 C-9 14 -9 30 -2 44 C3 36 5 22 6 0 Z'
    for deg in (30, 3, -24):
        o.append(s(xf(talon, 117, -96, deg, 1.25), STEEL_L, 3.6) + ln(xf('M-2 10 C-3 18 -3 26 -1 32', 117, -96, deg, 1.25), '#FFFFFF', 2))
    for sx in (-1, 1):
        o.append(s(tp('M-136 -150 H-100 L-102 -104 H-134 Z', 0, 0, 1, sx), BRASS) + s(tp('M-137 -113 H-99 V-100 H-137 Z', 0, 0, 1, sx), COPPER, 3.4))
        o.append(ln(tp('M-130 -142 C-131 -132 -130 -124 -129 -118', 0, 0, 1, sx), BRASS_L, 3) + rivets([(sx * 108, -142), (sx * 108, -122)], 2.2))
    o.append(c(117, -96, 14, BRASS_D) + c(117, -96, 4.4, K, 0))
    # the barrel of a body: hoops, plates, rivets and its big dial
    o.append(s('M-82 -230 C-104 -196 -108 -104 -86 -66 C-44 -54 44 -54 86 -66 C108 -104 104 -196 82 -230 C42 -240 -42 -240 -82 -230 Z', BRASS))
    o.append(s('M-84 -184 C-92 -160 -92 -122 -84 -98 C-80 -114 -80 -168 -84 -184 Z', BRASS_L, 0))
    o.append(ln('M-44 -196 C-48 -164 -48 -122 -44 -94 M44 -196 C48 -164 48 -122 44 -94', BRASS_D, 3.2))
    o.append(s('M-88 -214 C-40 -202 40 -202 88 -214 L92 -202 C40 -189 -40 -189 -92 -202 Z', COPPER, 3.6))
    o.append(s('M-98 -100 C-40 -86 40 -86 98 -100 L93 -88 C40 -74 -40 -74 -93 -88 Z', COPPER, 3.6))
    o.append(rivets([(-72, -205), (-36, -199), (0, -197.5), (36, -199), (72, -205), (-72, -90), (-36, -83), (0, -81.5), (36, -83), (72, -90)], 2.6))
    o.append(c(0, -146, 31, BRASS_D) + c(0, -146, 24, CREAM, 3.2))
    o.append(s('M10.5 -164.2 A21 21 0 0 1 21 -146 H15 A15 15 0 0 0 7.5 -159 Z', RED, 0))
    o.append(ln(' '.join(f'M{f(19 * math.sin(a * math.pi / 6))} {f(-146 - 19 * math.cos(a * math.pi / 6))} L{f(23 * math.sin(a * math.pi / 6))} {f(-146 - 23 * math.cos(a * math.pi / 6))}' for a in range(12)), K, 2.4))
    o.append(s('M-3 -148 L-15 -160 L-1 -143 Z' if not cracked else 'M-1 -149 L20 -154 L1 -143 Z', K, 2.2) + c(0, -146, 3.4, K, 0))
    if cracked:
        # a dented plate hanging off, the works showing behind it
        o.append(s('M46 -134 H84 C88 -134 90 -132 90 -128 V-104 C90 -100 88 -98 84 -98 H46 C42 -98 40 -100 40 -104 V-128 C40 -132 42 -134 46 -134 Z', '#2A1E18', 3.6))
        o.append(ln('M50 -126 L56 -110 L62 -126 L68 -110 L74 -126', STEEL_L, 3.4) + cog(80, -122, 9, 8, w=2.6, shine=False))
        o.append(s(xf('M0 0 L44 0 L44 36 L0 36 Z', 41, -133, 32), BRASS) + ln(xf('M8 12 L18 20 L30 14', 41, -133, 32), BRASS_D, 3) + rivets([xp(5, 5, 41, -133, 32)], 2.4))
        o.append(spark(88, -140, 9) + spark(58, -96, 6))
    # big shoulder domes
    pauldron = 'M-130 -184 C-132 -212 -114 -230 -94 -230 C-76 -230 -66 -220 -64 -204 C-82 -198 -106 -192 -130 -184 Z'
    o.append(s(pauldron, BRASS) + s(m(pauldron), BRASS))
    o.append(both('M-130 -184 C-106 -192 -82 -198 -64 -204 L-64 -196 C-84 -190 -108 -184 -129 -176 Z', COPPER, 3.4))
    o.append(rivets([(-112, -207), (-96, -214), (-80, -212), (112, -207), (96, -214), (80, -212)], 2.4))
    o.append(ln('M-116 -216 C-110 -222 -102 -225 -94 -225', '#FFF3C4', 3))
    # the cockpit: the little king under his glass dome on its brass collar (in phase 2 a chunk of it is gone)
    dome = 'M-66 -236 C-66 -280 -38 -304 0 -304 C38 -304 66 -280 66 -236 Z'
    broke = 'M-66 -236 C-66 -280 -38 -304 0 -304 L10 -303.4 L17 -293 L27 -298 L32 -286 L43 -290 L47 -276 L57 -279 L60 -264 L64 -252 L66 -236 Z'
    o.append(s(broke if cracked else dome, GLASS, 0))
    king(o, mad=cracked)
    glint = ln('M-54 -256 C-52 -272 -42 -287 -28 -295', '#FFFFFF', 4.4)
    if not cracked:
        o.append(ln(dome, K, 4.4) + glint + ln('M46 -282 C51 -274 54 -265 55 -255', '#FFFFFF', 3))
    else:
        o.append(ln(broke[:-2], K, 4.4) + glint + ln('M-30 -299 L-37 -289 L-50 -285 M-37 -289 L-41 -279 M56 -262 L48 -258', K, 2.2))
        o.append(s('M66 -246 L74 -252 L72 -242 Z M18 -310 L24 -306 L17 -304 Z', GLASS, 2) + spark(-62, -248, 7) + spark(70, -268, 6.5))
        o.append(blob([(46, -297, 8), (55, -302, 7), (62, -295, 6)], '#F0ECF4', 3) + blob([(-104, -236, 8), (-113, -244, 7), (-96, -247, 6)], '#F0ECF4', 3))
    o.append(s('M-70 -234 C-70 -238 -66 -240 -62 -240 H62 C66 -240 70 -238 70 -234 V-226 C70 -222 66 -220 62 -220 H-62 C-66 -220 -70 -222 -70 -226 Z', BRASS))
    o.append(rivets([(-56, -230), (-28, -230), (0, -230), (28, -230), (56, -230)], 2.4))
    o.append(c(0, -306, 4, BRASS, 3))
    # the cuckoo clock bolted on his right shoulder, its foot at (96, -222) (it falls off there when he dies)
    o.append(halo(96, -248, 26, FLAME, 0.24) + s('M84 -224 L80 -212 H112 L108 -224 Z', IRON, 3.2))
    o.append(clock(96, -222, 0.42, tilt=6 if cracked else 0))
    return o


def tinker(clock):
    sprite('tinker', (-140, -312, 280, 322), tinker_suit(clock), 'The Tinker King')
    sprite('tinker_cracked', (-140, -312, 280, 322), tinker_suit(clock, True), 'The Tinker King, his dome cracked')


def build():
    import art_thimble2  # the bombs, props, door, decals and the cuckoo clock (it imports this file's helpers)
    scrapper(); gn_slinger(); bombwright(); bombwright('tb_mender', medic=True); waddlecap(); stomper(); toadstool(); tinker(art_thimble2.clock)
    art_thimble2.build(sprite)
    return SPR
