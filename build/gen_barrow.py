import sys, os

BUILD = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.join(os.path.dirname(BUILD), "highfell", "project")
HEIGHT = sys.argv[1] if len(sys.argv) > 1 else "7000"

MONO = "'DM Mono', ui-monospace, Menlo, Consolas, monospace"
SERIF = "'IM Fell English SC', Georgia, serif"

# ------------------------------------------------------------------ perspective
F, CX, CY, EYE, ZC = 780.0, 600.0, 120.0, 2.8, -4.0
Z0 = -2.7


def P(X, Y, z):
    zp = z - ZC
    return (CX + F * X / zp, CY - F * (Y - EYE) / zp)


def f1(v):
    return f"{v:.1f}".rstrip("0").rstrip(".") if "." in f"{v:.1f}" else f"{v:.1f}"


def pt(p):
    return f"{f1(p[0])} {f1(p[1])}"


def poly(pts):
    return "M" + " L".join(pt(p) for p in pts) + " Z"


def seg(a, b):
    return f"M{pt(a)} L{pt(b)}"


def path(d, style):
    return f'<path d="{d}" style="{style}"/>'


def figure(cx, top, h, rim_op=0.45):
    """A cloaked hero seen from behind, as a silhouette with a teal rim light."""
    d = (
        f"M{f1(cx - 0.06 * h)} {f1(top + 0.15 * h)} L{f1(cx - 0.15 * h)} {f1(top + 0.21 * h)} "
        f"Q{f1(cx - 0.19 * h)} {f1(top + 0.55 * h)} {f1(cx - 0.2 * h)} {f1(top + h)} "
        f"L{f1(cx + 0.2 * h)} {f1(top + h)} Q{f1(cx + 0.19 * h)} {f1(top + 0.55 * h)} {f1(cx + 0.15 * h)} {f1(top + 0.21 * h)} "
        f"L{f1(cx + 0.06 * h)} {f1(top + 0.15 * h)} Z"
    )
    st = f"fill: #07090C; stroke: #8EBDB6; stroke-opacity: {rim_op}; stroke-width: 1.2"
    r = 0.075 * h
    return path(d, st) + f'<circle cx="{f1(cx)}" cy="{f1(top + r)}" r="{f1(r)}" style="{st}"/>'


def illustration():
    o = []
    o.append('<svg viewBox="0 0 1200 460" role="img" aria-label="Cutaway view of the Barrow from the inn door: a stone arch glowing with the ghost of a crowned king, a war table with a glowing battle map, three heroes holding a lantern, a staff and a shield, a sarcophagus in the foreground, candles on an altar to the left and a skull on a pedestal to the right" style="width: 100%; height: auto; display: block; border-radius: 4px;">')
    o.append("""<defs>
<radialGradient id="bw-pglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color: #8EBDB6; stop-opacity: 0.26"/><stop offset="1" style="stop-color: #8EBDB6; stop-opacity: 0"/></radialGradient>
<radialGradient id="bw-pin" cx="0.5" cy="0.42" r="0.62"><stop offset="0" style="stop-color: #5E9690"/><stop offset="0.5" style="stop-color: #24403E"/><stop offset="1" style="stop-color: #111D1C"/></radialGradient>
<linearGradient id="bw-king" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color: #DDF2EF; stop-opacity: 0.42"/><stop offset="1" style="stop-color: #DDF2EF; stop-opacity: 0"/></linearGradient>
<linearGradient id="bw-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color: #8EBDB6; stop-opacity: 0.14"/><stop offset="1" style="stop-color: #8EBDB6; stop-opacity: 0"/></linearGradient>
<radialGradient id="bw-warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color: #F2C46B; stop-opacity: 0.5"/><stop offset="1" style="stop-color: #F2C46B; stop-opacity: 0"/></radialGradient>
<radialGradient id="bw-uv" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color: #A996E6; stop-opacity: 0.6"/><stop offset="1" style="stop-color: #A996E6; stop-opacity: 0"/></radialGradient>
<radialGradient id="bw-ice" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color: #9FD0EE; stop-opacity: 0.65"/><stop offset="1" style="stop-color: #9FD0EE; stop-opacity: 0"/></radialGradient>
<radialGradient id="bw-map" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color: #8EBDB6; stop-opacity: 0.22"/><stop offset="1" style="stop-color: #8EBDB6; stop-opacity: 0"/></radialGradient>
<radialGradient id="bw-vig" cx="0.5" cy="0.45" r="0.72"><stop offset="0.62" style="stop-color: #05070A; stop-opacity: 0"/><stop offset="1" style="stop-color: #05070A; stop-opacity: 0.75"/></radialGradient>
</defs>""")
    o.append('<rect x="0" y="0" width="1200" height="460" style="fill: #0A0C10"/>')

    # ceiling with joists
    o.append(path(poly([P(-3, 3, Z0), P(3, 3, Z0), P(3, 3, 6), P(-3, 3, 6)]), "fill: #0E1116"))
    for z in (-1.0, 1.0, 2.5, 4.0, 5.2):
        o.append(path(seg(P(-3, 3, z), P(3, 3, z)), "fill: none; stroke: #171B22; stroke-width: 6"))

    # back wall and stone courses
    o.append(path(poly([P(-3, 3, 6), P(3, 3, 6), P(3, 0, 6), P(-3, 0, 6)]), "fill: #1A1F27"))
    courses = [0.4 * i for i in range(1, 8)]
    d = " ".join(seg(P(-3, Y, 6), P(3, Y, 6)) for Y in courses)
    o.append(path(d, "fill: none; stroke: #232A34; stroke-width: 1.2"))
    joints = []
    for i, y0 in enumerate([0.0] + courses[:-1]):
        x = -3 + (0.35 if i % 2 else 0.0)
        while x < 3:
            if x > -3:
                joints.append(seg(P(x, y0, 6), P(x, y0 + 0.4, 6)))
            x += 0.7
    o.append(path(" ".join(joints), "fill: none; stroke: #20262F; stroke-width: 1"))

    # side walls
    o.append(path(poly([P(-3, 3, Z0), P(-3, 3, 6), P(-3, 0, 6), P(-3, 0, Z0)]), "fill: #13161C"))
    o.append(path(poly([P(3, 3, Z0), P(3, 3, 6), P(3, 0, 6), P(3, 0, Z0)]), "fill: #12151B"))
    d = " ".join(seg(P(-3, Y, Z0), P(-3, Y, 6)) + " " + seg(P(3, Y, Z0), P(3, Y, 6)) for Y in courses)
    o.append(path(d, "fill: none; stroke: #1B2028; stroke-width: 1.2"))

    # floor flagstones
    o.append(path(poly([P(-3, 0, 0.5), P(3, 0, 0.5), P(3, 0, 6), P(-3, 0, 6)]), "fill: #0E1116"))
    d = " ".join(seg(P(x, 0, 0.5), P(x, 0, 6)) for x in (-2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25))
    d += " " + " ".join(seg(P(-3, 0, z), P(3, 0, z)) for z in (1, 2, 3, 4, 5))
    o.append(path(d, "fill: none; stroke: #161A21; stroke-width: 1"))

    # portal glow over wall and floor
    gx, gy = P(0, 0.6, 6)
    o.append(f'<ellipse cx="{f1(gx)}" cy="{f1(gy)}" rx="360" ry="190" style="fill: url(#bw-pglow)"/>')

    # the arch (back wall plane, 78 px per metre)
    s = F / 10.0
    base_y = P(0, 0, 6)[1]
    spring_y = P(0, 1.65, 6)[1]
    ro, ri = 1.25 * s, 0.95 * s
    o.append(path(f"M{f1(CX - ro)} {f1(base_y)} V{f1(spring_y)} A{f1(ro)} {f1(ro)} 0 0 1 {f1(CX + ro)} {f1(spring_y)} V{f1(base_y)} Z", "fill: #262C36"))
    o.append(path(f"M{f1(CX - ri)} {f1(base_y)} V{f1(spring_y)} A{f1(ri)} {f1(ri)} 0 0 1 {f1(CX + ri)} {f1(spring_y)} V{f1(base_y)} Z", "fill: url(#bw-pin)"))
    import math
    vs = []
    for k in range(1, 8):
        a = math.pi * k / 8
        vs.append(f"M{f1(CX + ri * math.cos(a))} {f1(spring_y - ri * math.sin(a))} L{f1(CX + ro * math.cos(a))} {f1(spring_y - ro * math.sin(a))}")
    for yy in (spring_y + 32, spring_y + 64, spring_y + 96):
        vs.append(f"M{f1(CX - ro)} {f1(yy)} H{f1(CX - ri)} M{f1(CX + ri)} {f1(yy)} H{f1(CX + ro)}")
    o.append(path(" ".join(vs), "fill: none; stroke: #191E26; stroke-width: 2"))
    # the Barrow King in the portal
    o.append(path(f"M{f1(CX - 52)} {f1(base_y)} C{f1(CX - 48)} {f1(base_y - 70)} {f1(CX - 28)} {f1(base_y - 116)} {f1(CX)} {f1(base_y - 126)} C{f1(CX + 28)} {f1(base_y - 116)} {f1(CX + 48)} {f1(base_y - 70)} {f1(CX + 52)} {f1(base_y)} Z", "fill: url(#bw-king)"))
    hy = base_y - 148
    o.append(f'<ellipse cx="{f1(CX)}" cy="{f1(hy)}" rx="15" ry="19" style="fill: #DDF2EF; opacity: 0.2"/>')
    o.append(path(f"M{f1(CX - 16)} {f1(hy - 14)} L{f1(CX - 15)} {f1(hy - 32)} L{f1(CX - 7)} {f1(hy - 23)} L{f1(CX)} {f1(hy - 40)} L{f1(CX + 7)} {f1(hy - 23)} L{f1(CX + 15)} {f1(hy - 32)} L{f1(CX + 16)} {f1(hy - 14)} Z", "fill: #CFEAE6; opacity: 0.6"))
    for ex in (-6, 6):
        o.append(f'<circle cx="{f1(CX + ex)}" cy="{f1(hy - 1)}" r="8" style="fill: url(#bw-ice)"/>')
        o.append(f'<ellipse cx="{f1(CX + ex)}" cy="{f1(hy - 1)}" rx="3" ry="2" style="fill: #EAF4FA"/>')
    o.append(path(f"M{f1(CX)} {f1(hy + 34)} V{f1(base_y - 10)} M{f1(CX - 13)} {f1(hy + 44)} H{f1(CX + 13)}", "fill: none; stroke: #DDF2EF; stroke-opacity: 0.3; stroke-width: 3; stroke-linecap: round"))
    gz = " ".join(f"M{f1(CX + dx)} {f1(spring_y - 50)} V{f1(base_y)}" for dx in (-48, -24, 24, 48))
    o.append(path(gz, "fill: none; stroke: #BFE3DE; stroke-opacity: 0.06; stroke-width: 1"))

    # light spilling from the portal across the floor
    o.append(path(poly([P(-0.95, 0, 6), P(0.95, 0, 6), P(1.9, 0, 2.2), P(-1.9, 0, 2.2)]), "fill: url(#bw-beam)"))

    # rune wall (left wall, x = -3)
    zs = [2.7 + 0.52 * i for i in range(6)]
    ys = [2.3 - 0.3 * i for i in range(6)]
    o.append(path(poly([P(-3, 2.3, 2.7), P(-3, 2.3, 5.3), P(-3, 0.8, 5.3), P(-3, 0.8, 2.7)]), "fill: #20252E"))
    d = " ".join(seg(P(-3, 2.3, z), P(-3, 0.8, z)) for z in zs) + " " + " ".join(seg(P(-3, Y, 2.7), P(-3, Y, 5.3)) for Y in ys)
    o.append(path(d, "fill: none; stroke: #0E1116; stroke-width: 2.2"))
    lantern = P(-1.85, 1.15, 3.3)
    hit_a, hit_b = P(-3, 2.18, 2.9), P(-3, 1.02, 4.25)
    o.append(path(poly([lantern, hit_a, hit_b]), "fill: #A996E6; opacity: 0.1"))
    glyphs = []
    for col, row in ((0, 1), (1, 3), (2, 2), (1, 0), (3, 3)):
        zc = 2.7 + 0.52 * (col + 0.5)
        yc = 2.3 - 0.3 * (row + 0.5)
        c = P(-3, yc, zc)
        o.append(f'<circle cx="{f1(c[0])}" cy="{f1(c[1])}" r="13" style="fill: url(#bw-uv)"/>')
        glyphs.append(seg(P(-3, yc + 0.09, zc), P(-3, yc - 0.09, zc)))
        glyphs.append(seg(P(-3, yc + 0.03, zc), P(-3, yc + 0.09, zc + 0.12)))
        glyphs.append(seg(P(-3, yc - 0.03, zc), P(-3, yc + 0.03, zc + 0.12)))
    o.append(path(" ".join(glyphs), "fill: none; stroke: #DCD2FF; stroke-width: 1.6; stroke-linecap: round"))

    # reliquary (right wall)
    o.append(path(poly([P(2.3, 1.6, 4.3), P(2.3, 1.6, 5.6), P(2.3, 0, 5.6), P(2.3, 0, 4.3)]), "fill: #2A2219"))
    o.append(path(poly([P(2.3, 1.6, 4.3), P(2.95, 1.6, 4.3), P(2.95, 0, 4.3), P(2.3, 0, 4.3)]), "fill: #1F1913"))
    o.append(path(poly([P(2.3, 1.6, 4.3), P(2.95, 1.6, 4.3), P(2.95, 1.6, 5.6), P(2.3, 1.6, 5.6)]), "fill: #35291C"))
    d = " ".join(seg(P(2.3, Y, 4.4), P(2.3, Y, 5.5)) for Y in (1.2, 0.85, 0.5))
    o.append(path(d, "fill: none; stroke: #140F0A; stroke-width: 2"))
    d = " ".join(seg(P(2.3, Y, 4.3), P(2.3, Y, 5.6)) for Y in (1.5, 0.12))
    o.append(path(d, "fill: none; stroke: #5A4A34; stroke-width: 2"))
    for Y in (1.36, 1.02, 0.67):
        c = P(2.3, Y, 4.95)
        o.append(f'<circle cx="{f1(c[0])}" cy="{f1(c[1])}" r="2.6" style="fill: #D9A94A"/>')
    # relics on top
    for zz, hh in ((4.55, 0.16), (5.1, 0.24)):
        b = P(2.62, 1.6, zz)
        t = P(2.62, 1.6 + hh, zz)
        o.append(f'<ellipse cx="{f1(b[0])}" cy="{f1((b[1] + t[1]) / 2)}" rx="5" ry="{f1((b[1] - t[1]) / 2)}" style="fill: #8C7A5C"/>')

    # warrior behind the table, backlit by the portal
    c_x, c_top = P(0.5, 1.75, 5.0)
    c_feet = P(0.5, 0, 5.0)[1]
    h = c_feet - c_top
    o.append(figure(c_x, c_top, h, 0.6))
    sx, sy, sr = c_x - 0.24 * h, c_top + 0.48 * h, 0.13 * h
    o.append(f'<circle cx="{f1(sx)}" cy="{f1(sy)}" r="{f1(sr)}" style="fill: #0B0E13; stroke: #8EBDB6; stroke-opacity: 0.6; stroke-width: 1.4"/>')
    o.append(f'<circle cx="{f1(sx)}" cy="{f1(sy)}" r="3" style="fill: #8EBDB6; opacity: 0.6"/>')

    # war table
    for X in (-0.92, 0.92):
        for z in (4.5, 3.7):
            a, b = P(X - 0.04, 0.75, z), P(X + 0.04, 0, z)
            o.append(f'<rect x="{f1(a[0])}" y="{f1(a[1])}" width="{f1(b[0] - a[0])}" height="{f1(b[1] - a[1])}" style="fill: #1C160E"/>')
    o.append(path(poly([P(-1, 0.9, 3.6), P(1, 0.9, 3.6), P(1, 0.75, 3.6), P(-1, 0.75, 3.6)]), "fill: #2A2015"))
    o.append(path(poly([P(-1, 0.9, 3.6), P(1, 0.9, 3.6), P(1, 0.9, 4.6), P(-1, 0.9, 4.6)]), "fill: #3A2D1C"))
    o.append(path(poly([P(-0.88, 0.9, 3.68), P(0.88, 0.9, 3.68), P(0.88, 0.9, 4.52), P(-0.88, 0.9, 4.52)]), "fill: #12302D"))
    d = " ".join(seg(P(x, 0.9, 3.68), P(x, 0.9, 4.52)) for x in (-0.66, -0.44, -0.22, 0, 0.22, 0.44, 0.66))
    d += " " + " ".join(seg(P(-0.88, 0.9, z), P(0.88, 0.9, z)) for z in (3.82, 3.96, 4.1, 4.24, 4.38))
    o.append(path(d, "fill: none; stroke: #8EBDB6; stroke-opacity: 0.45; stroke-width: 0.8"))
    o.append(path(seg(P(-0.88, 0.9, 4.2), P(-0.3, 0.9, 4.05)) + " " + seg(P(-0.3, 0.9, 4.05), P(0.4, 0.9, 4.4)), "fill: none; stroke: #9FD0EE; stroke-opacity: 0.6; stroke-width: 1.4"))
    for X, z, col, rx in ((-0.5, 4.32, "#E2B45A", 4), (-0.2, 4.36, "#E2B45A", 4), (0.3, 4.28, "#E2B45A", 4), (0.15, 3.86, "#E07A45", 4), (0.55, 3.92, "#E07A45", 4), (-0.05, 3.95, "#E07A45", 6)):
        c = P(X, 0.9, z)
        o.append(f'<ellipse cx="{f1(c[0])}" cy="{f1(c[1])}" rx="{rx}" ry="{f1(rx * 0.55)}" style="fill: {col}"/>')
    mc = P(0, 0.95, 4.1)
    o.append(f'<ellipse cx="{f1(mc[0])}" cy="{f1(mc[1])}" rx="150" ry="34" style="fill: url(#bw-map)"/>')
    o.append(path(poly([P(-0.14, 0.9, 3.61), P(0.14, 0.9, 3.61), P(0.14, 0.9, 3.8), P(-0.14, 0.9, 3.8)]), "fill: #0D1015; stroke: #B98A33; stroke-width: 1.2"))
    dc = P(0.02, 0.92, 3.7)
    o.append(f'<path d="M{f1(dc[0] - 4)} {f1(dc[1] - 2)} L{f1(dc[0])} {f1(dc[1] - 4.5)} L{f1(dc[0] + 4)} {f1(dc[1] - 2)} L{f1(dc[0] + 4)} {f1(dc[1] + 2)} L{f1(dc[0])} {f1(dc[1] + 4.5)} L{f1(dc[0] - 4)} {f1(dc[1] + 2)} Z" style="fill: #E3D8BE"/>')
    for X in (-0.7, -0.4, 0.4, 0.7):
        c = P(X, 0.9, 3.65)
        o.append(f'<ellipse cx="{f1(c[0])}" cy="{f1(c[1])}" rx="5" ry="1.8" style="fill: #B98A33"/>')

    # ranger (left) with the UV lantern pointed at the rune wall
    a_x, a_top = P(-1.4, 1.75, 3.3)
    a_feet = P(-1.4, 0, 3.3)[1]
    ha = a_feet - a_top
    o.append(f'<circle cx="{f1(lantern[0])}" cy="{f1(lantern[1])}" r="38" style="fill: url(#bw-uv)"/>')
    o.append(figure(a_x, a_top, ha))
    o.append(path(f"M{f1(a_x - 0.13 * ha)} {f1(a_top + 0.24 * ha)} Q{f1(a_x - 0.24 * ha)} {f1(a_top + 0.3 * ha)} {f1(lantern[0] + 4)} {f1(lantern[1] - 7)}", "fill: none; stroke: #07090C; stroke-width: 7; stroke-linecap: round"))
    o.append(f'<rect x="{f1(lantern[0] - 5)}" y="{f1(lantern[1] - 7)}" width="10" height="14" rx="2" style="fill: #2A2F3D; stroke: #A996E6; stroke-width: 1"/>')
    o.append(f'<rect x="{f1(lantern[0] - 2.5)}" y="{f1(lantern[1] - 4)}" width="5" height="8" style="fill: #E4DBFF"/>')

    # mage (right) with the staff and its ice-blue crystal
    b_x, b_top = P(1.4, 1.75, 3.4)
    b_feet = P(1.4, 0, 3.4)[1]
    hb = b_feet - b_top
    tip = (b_x + 0.27 * hb, b_top - 0.12 * hb)
    o.append(f'<circle cx="{f1(tip[0])}" cy="{f1(tip[1])}" r="44" style="fill: url(#bw-ice)"/>')
    o.append(figure(b_x, b_top, hb))
    o.append(path(f"M{f1(b_x + 0.19 * hb)} {f1(b_feet)} L{f1(tip[0])} {f1(tip[1] + 8)}", "fill: none; stroke: #2B2418; stroke-width: 4; stroke-linecap: round"))
    o.append(path(f"M{f1(b_x + 0.13 * hb)} {f1(b_top + 0.24 * hb)} Q{f1(b_x + 0.2 * hb)} {f1(b_top + 0.32 * hb)} {f1(tip[0] - 4)} {f1(b_top + 0.36 * hb)}", "fill: none; stroke: #07090C; stroke-width: 7; stroke-linecap: round"))
    o.append(path(f"M{f1(tip[0])} {f1(tip[1] - 12)} L{f1(tip[0] + 6)} {f1(tip[1])} L{f1(tip[0])} {f1(tip[1] + 12)} L{f1(tip[0] - 6)} {f1(tip[1])} Z", "fill: #D6EEFA"))

    # candle altar (left foreground)
    o.append(path(poly([P(-2.1, 1.0, 0.6), P(-2.1, 1.0, 2.0), P(-2.1, 0, 2.0), P(-2.1, 0, 0.6)]), "fill: #1F2329"))
    o.append(path(poly([P(-2.95, 1.0, 0.6), P(-2.1, 1.0, 0.6), P(-2.1, 0, 0.6), P(-2.95, 0, 0.6)]), "fill: #191C21"))
    o.append(path(poly([P(-2.95, 1.0, 0.6), P(-2.1, 1.0, 0.6), P(-2.1, 1.0, 2.0), P(-2.95, 1.0, 2.0)]), "fill: #2B3038"))
    o.append(path(poly([P(-2.1, 0.85, 0.75), P(-2.1, 0.85, 1.85), P(-2.1, 0.15, 1.85), P(-2.1, 0.15, 0.75)]), "fill: none; stroke: #2B3038; stroke-width: 2"))
    bc = P(-2.4, 1.0, 1.35)
    brx = (P(-2.2, 1.0, 1.35)[0] - P(-2.6, 1.0, 1.35)[0]) / 2
    bry = (P(-2.4, 1.0, 1.15)[1] - P(-2.4, 1.0, 1.55)[1]) / 2
    o.append(f'<circle cx="{f1(bc[0])}" cy="{f1(bc[1] - 10)}" r="60" style="fill: url(#bw-map)"/>')
    o.append(f'<ellipse cx="{f1(bc[0])}" cy="{f1(bc[1])}" rx="{f1(brx)}" ry="{f1(bry)}" style="fill: #13202A; stroke: #8EBDB6; stroke-width: 1.5"/>')
    o.append(f'<ellipse cx="{f1(bc[0])}" cy="{f1(bc[1])}" rx="{f1(brx * 0.7)}" ry="{f1(bry * 0.6)}" style="fill: #8EBDB6; opacity: 0.35"/>')
    gt = P(-2.45, 1.95, 1.35)
    gb = (bc[0], bc[1] - 4)
    o.append(path(f"M{f1(gb[0] - 9)} {f1(gb[1])} C{f1(gb[0] - 20)} {f1(gb[1] - 30)} {f1(gt[0] - 18)} {f1(gt[1] + 26)} {f1(gt[0])} {f1(gt[1])} C{f1(gt[0] + 18)} {f1(gt[1] + 26)} {f1(gb[0] + 20)} {f1(gb[1] - 30)} {f1(gb[0] + 9)} {f1(gb[1])} Z", "fill: #BFE3DE; opacity: 0.2"))
    for ex in (-5, 5):
        o.append(f'<circle cx="{f1(gt[0] + ex)}" cy="{f1(gt[1] + 18)}" r="2" style="fill: #EAF4FA; opacity: 0.85"/>')
    heights = [0.22, 0.3, 0.18, 0.26, 0.2, 0.32, 0.24]
    for i in reversed(range(7)):
        z = 0.78 + i * 0.19
        hh = heights[i]
        tl = P(-2.75, 1.0 + hh, z)
        br = P(-2.69, 1.0, z)
        cxx = (tl[0] + br[0]) / 2
        o.append(f'<circle cx="{f1(cxx)}" cy="{f1(tl[1] - 6)}" r="17" style="fill: url(#bw-warm)"/>')
        o.append(f'<rect x="{f1(tl[0])}" y="{f1(tl[1])}" width="{f1(br[0] - tl[0])}" height="{f1(br[1] - tl[1])}" style="fill: #D9CDB0"/>')
        o.append(f'<ellipse cx="{f1(cxx)}" cy="{f1(tl[1] - 5)}" rx="2.6" ry="5" style="fill: #F2C46B"/>')

    # skull pedestal (right foreground)
    o.append(path(poly([P(2.13, 1.1, 1.43), P(2.13, 1.1, 1.77), P(2.13, 0, 1.77), P(2.13, 0, 1.43)]), "fill: #1D2026"))
    o.append(path(poly([P(2.13, 1.1, 1.43), P(2.47, 1.1, 1.43), P(2.47, 0, 1.43), P(2.13, 0, 1.43)]), "fill: #262A31"))
    o.append(path(poly([P(2.13, 1.1, 1.43), P(2.47, 1.1, 1.43), P(2.47, 1.1, 1.77), P(2.13, 1.1, 1.77)]), "fill: #30353D"))
    kx, ky = P(2.3, 1.1, 1.6)
    t = ky - 40
    o.append(f'<circle cx="{f1(kx)}" cy="{f1(t + 17)}" r="30" style="fill: url(#bw-ice)"/>')
    o.append(path(f"M{f1(kx)} {f1(t + 2)} C{f1(kx - 13)} {f1(t + 2)} {f1(kx - 17)} {f1(t + 12)} {f1(kx - 16)} {f1(t + 20)} C{f1(kx - 15)} {f1(t + 26)} {f1(kx - 11)} {f1(t + 28)} {f1(kx - 10)} {f1(t + 30)} V{f1(t + 38)} H{f1(kx + 10)} V{f1(t + 30)} C{f1(kx + 11)} {f1(t + 28)} {f1(kx + 15)} {f1(t + 26)} {f1(kx + 16)} {f1(t + 20)} C{f1(kx + 17)} {f1(t + 12)} {f1(kx + 13)} {f1(t + 2)} {f1(kx)} {f1(t + 2)} Z", "fill: #E3D8BE"))
    for ex in (-6, 6):
        o.append(f'<circle cx="{f1(kx + ex)}" cy="{f1(t + 18)}" r="4.5" style="fill: #1A1D26"/>')
        o.append(f'<circle cx="{f1(kx + ex)}" cy="{f1(t + 18)}" r="2" style="fill: #9FD0EE"/>')
    o.append(path(f"M{f1(kx)} {f1(t + 23)} L{f1(kx - 2.5)} {f1(t + 28)} H{f1(kx + 2.5)} Z", "fill: #1A1D26"))
    o.append(path(f"M{f1(kx - 6)} {f1(t + 33)} H{f1(kx + 6)}", "fill: none; stroke: #9A8F78; stroke-width: 1.5"))
    o.append(f'<rect x="{f1(kx - 4)}" y="{f1(t - 2)}" width="8" height="4" rx="1" style="fill: #D9A94A"/>')

    # sarcophagus (centre foreground)
    o.append(path(poly([P(-0.9, 0.85, 1.5), P(0.9, 0.85, 1.5), P(0.9, 0, 1.5), P(-0.9, 0, 1.5)]), "fill: #22262D"))
    o.append(path(poly([P(-0.9, 0.85, 1.5), P(0.9, 0.85, 1.5), P(0.9, 0.85, 2.3), P(-0.9, 0.85, 2.3)]), "fill: #2E333B"))
    o.append(path(poly([P(-0.85, 0.85, 1.55), P(0.85, 0.85, 1.55), P(0.85, 0.92, 1.55), P(-0.85, 0.92, 1.55)]), "fill: #2A2E35"))
    o.append(path(poly([P(-0.85, 0.92, 1.55), P(0.85, 0.92, 1.55), P(0.85, 0.92, 2.25), P(-0.85, 0.92, 2.25)]), "fill: #383D46"))
    o.append(path(poly([P(-0.56, 0.95, 1.78), P(0.6, 0.95, 1.8), P(0.6, 0.95, 2.0), P(-0.56, 0.95, 2.02)]), "fill: #474D57"))
    hc = P(-0.68, 0.96, 1.9)
    o.append(f'<ellipse cx="{f1(hc[0])}" cy="{f1(hc[1])}" rx="11" ry="6" style="fill: #4C525C"/>')
    o.append(path(seg(P(-0.45, 0.97, 1.9), P(0.56, 0.97, 1.9)) + " " + seg(P(-0.38, 0.97, 1.82), P(-0.38, 0.97, 1.98)), "fill: none; stroke: #626976; stroke-width: 2; stroke-linecap: round"))
    o.append(path(poly([P(-0.8, 0.74, 1.5), P(0.8, 0.74, 1.5), P(0.8, 0.12, 1.5), P(-0.8, 0.12, 1.5)]), "fill: none; stroke: #2E333B; stroke-width: 2"))
    ec = P(0, 0.48, 1.5)
    o.append(f'<circle cx="{f1(ec[0])}" cy="{f1(ec[1])}" r="20" style="fill: none; stroke: #2E333B; stroke-width: 2"/>')

    # haze and vignette
    o.append('<ellipse cx="600" cy="372" rx="560" ry="70" style="fill: #BFD3D0; opacity: 0.05"/>')
    o.append('<ellipse cx="420" cy="300" rx="260" ry="46" style="fill: #BFD3D0; opacity: 0.035"/>')
    o.append('<ellipse cx="840" cy="320" rx="240" ry="40" style="fill: #BFD3D0; opacity: 0.035"/>')
    o.append('<rect x="0" y="0" width="1200" height="460" style="fill: url(#bw-vig)"/>')

    # station markers (1, the door, is behind the viewer)
    marks = {
        "2": (kx + 34, t + 2),
        "3": (CX + ro + 22, spring_y - 46),
        "4": P(0.72, 0.92, 1.62),
        "5": (P(-3, 2.3, 3.8)[0], P(-3, 2.3, 3.8)[1] - 22),
        "6": (P(2.95, 1.2, 4.3)[0] + 22, P(2.95, 1.2, 4.3)[1]),
        "7": (P(-2.5, 1.0, 1.3)[0] + 40, P(-2.5, 1.0, 1.3)[1] - 70),
        "8": (704, 279),
    }
    for n, (mx, my) in marks.items():
        o.append(f'<circle cx="{f1(mx)}" cy="{f1(my)}" r="12" style="fill: #B98A33; stroke: #10131B; stroke-width: 2.5"/>')
        o.append(f'<text x="{f1(mx)}" y="{f1(my + 4.5)}" style="font-family: \'DM Mono\', monospace; font-size: 13px; font-weight: 500; fill: #10131B; text-anchor: middle">{n}</text>')
    o.append("</svg>")
    return "\n".join(o)


# ------------------------------------------------------------------ floor plan
def plan():
    lab = "font-family: 'DM Mono', monospace; font-size: 13px; letter-spacing: 1.2px; fill: #A39C8B; text-anchor: middle"
    o = []
    o.append('<svg viewBox="0 0 720 820" role="img" aria-label="Floor plan: the Barrow is a six by six metre chamber with the portal arch on the far wall, the war table in front of it, the sarcophagus in the middle, the rune wall and candle altar on the left, the reliquary and the Oracle Skull on the right, and the sealed door at the bottom opening into the Last Lantern inn. The GM nook sits beside the chamber, behind the bar." style="width: 100%; height: auto; display: block;">')
    o.append("""<defs>
<pattern id="bw-grid" x="40" y="40" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 H0 V40" style="fill: none; stroke: #1B2030; stroke-width: 1"/></pattern>
<radialGradient id="bw-pg" cx="0.5" cy="0" r="0.75"><stop offset="0" style="stop-color: #8EBDB6; stop-opacity: 0.2"/><stop offset="1" style="stop-color: #8EBDB6; stop-opacity: 0"/></radialGradient>
<radialGradient id="bw-pf" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color: #F2A65A; stop-opacity: 0.32"/><stop offset="1" style="stop-color: #F2A65A; stop-opacity: 0"/></radialGradient>
<clipPath id="bw-clip-inn"><rect x="40" y="524" width="648" height="256"/></clipPath>
<clipPath id="bw-clip-room"><rect x="40" y="40" width="480" height="484"/></clipPath>
<radialGradient id="bw-pc" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color: #F2C46B; stop-opacity: 0.28"/><stop offset="1" style="stop-color: #F2C46B; stop-opacity: 0"/></radialGradient>
</defs>""")
    # dimension
    o.append('<path d="M40 24 H520 M40 18 V30 M520 18 V30" style="fill: none; stroke: #5A6275; stroke-width: 1.5"/>')
    o.append(f'<text x="280" y="14" style="{lab}">6 M</text>')
    # floors
    o.append('<rect x="40" y="40" width="480" height="484" style="fill: #12151D"/>')
    o.append('<rect x="40" y="40" width="480" height="484" style="fill: url(#bw-grid)"/>')
    o.append('<rect x="40" y="40" width="480" height="300" style="fill: url(#bw-pg)"/>')
    o.append('<rect x="520" y="360" width="168" height="164" style="fill: #151926"/>')
    o.append('<rect x="40" y="524" width="648" height="256" style="fill: #19150F"/>')
    o.append('<circle cx="360" cy="770" r="120" style="fill: url(#bw-pf)" clip-path="url(#bw-clip-inn)"/>')
    o.append('<circle cx="80" cy="416" r="70" style="fill: url(#bw-pc)" clip-path="url(#bw-clip-room)"/>')
    # walls
    walls = "M40 40 H520 V524 M40 40 V780 H64 M136 780 H688 V360 H520 M40 524 H244 M316 524 H604 M664 524 H688"
    o.append(f'<path d="{walls}" style="fill: none; stroke: #3A4152; stroke-width: 8; stroke-linecap: square"/>')
    # doors
    o.append('<path d="M244 524 V596 M64 780 V708 M604 524 V464" style="fill: none; stroke: #8A8F9C; stroke-width: 3"/>')
    o.append('<path d="M316 524 A72 72 0 0 1 244 596 M136 780 A72 72 0 0 0 64 708 M664 524 A60 60 0 0 0 604 464" style="fill: none; stroke: #5A6275; stroke-width: 1.5; stroke-dasharray: 4 4"/>')
    # 3 portal arch and gauze
    o.append('<rect x="184" y="36" width="192" height="14" style="fill: #2A4644"/>')
    o.append('<path d="M184 62 H376" style="fill: none; stroke: #8EBDB6; stroke-width: 2; stroke-dasharray: 3 3"/>')
    # 8 war table
    o.append('<rect x="200" y="152" width="160" height="80" rx="3" style="fill: #2A2218; stroke: #5A4A34; stroke-width: 2"/>')
    o.append('<rect x="208" y="160" width="144" height="58" style="fill: #14302D"/>')
    o.append('<path d="M224 160 V218 M240 160 V218 M256 160 V218 M272 160 V218 M288 160 V218 M304 160 V218 M320 160 V218 M336 160 V218 M208 174.5 H352 M208 189 H352 M208 203.5 H352" style="fill: none; stroke: #8EBDB6; stroke-opacity: 0.35; stroke-width: 1"/>')
    o.append('<rect x="268" y="220" width="24" height="10" style="fill: #0D1015; stroke: #B98A33; stroke-width: 1.2"/>')
    for x, y in ((216, 226), (244, 226), (316, 226), (344, 226), (206, 190), (354, 190)):
        o.append(f'<circle cx="{x}" cy="{y}" r="2.6" style="fill: #B98A33"/>')
    # 4 sarcophagus
    o.append('<rect x="208" y="336" width="144" height="64" rx="4" style="fill: #2E333B; stroke: #4A505C; stroke-width: 2"/>')
    o.append('<rect x="215" y="343" width="130" height="50" rx="2" style="fill: none; stroke: #3E444E; stroke-width: 1.5"/>')
    o.append('<ellipse cx="230" cy="368" rx="7" ry="6" style="fill: #4C525C"/>')
    o.append('<rect x="239" y="361" width="96" height="14" rx="6" style="fill: #40464F"/>')
    o.append('<path d="M244 368 H330 M250 362 V374" style="fill: none; stroke: #626976; stroke-width: 1.5"/>')
    # 5 rune wall
    o.append('<rect x="44" y="96" width="14" height="208" style="fill: #20252E; stroke: #3A4152; stroke-width: 1"/>')
    o.append('<path d="M44 137.6 H58 M44 179.2 H58 M44 220.8 H58 M44 262.4 H58" style="fill: none; stroke: #0E1116; stroke-width: 2"/>')
    for y in (118, 200, 242):
        o.append(f'<circle cx="51" cy="{y}" r="2.6" style="fill: #A996E6"/>')
    # 6 reliquary
    o.append('<rect x="464" y="72" width="52" height="104" style="fill: #2A2219; stroke: #5A4A34; stroke-width: 2"/>')
    o.append('<path d="M464 98 H516 M464 124 H516 M464 150 H516" style="fill: none; stroke: #140F0A; stroke-width: 2"/>')
    for y in (85, 111, 137):
        o.append(f'<circle cx="471" cy="{y}" r="2.6" style="fill: #D9A94A"/>')
    # 7 candle altar and basin
    o.append('<rect x="44" y="360" width="68" height="112" style="fill: #2B3038; stroke: #3A4152; stroke-width: 1"/>')
    for i in range(7):
        o.append(f'<circle cx="56" cy="{f1(372 + i * 14.7)}" r="3" style="fill: #F2C46B"/>')
    o.append('<circle cx="88" cy="416" r="14" style="fill: #13202A; stroke: #8EBDB6; stroke-width: 1.5"/>')
    # 2 skull on pedestal
    o.append('<rect x="450" y="378" width="28" height="28" style="fill: #262A31; stroke: #4A5163; stroke-width: 1.5"/>')
    o.append('<circle cx="464" cy="392" r="8" style="fill: #E3D8BE"/>')
    o.append('<circle cx="461" cy="391" r="1.8" style="fill: #3E6E94"/><circle cx="467" cy="391" r="1.8" style="fill: #3E6E94"/>')
    # 1 rune plate by the door
    o.append('<rect x="324" y="510" width="12" height="7" style="fill: #B98A33"/>')
    # GM nook
    o.append('<rect x="644" y="372" width="38" height="124" style="fill: #232838; stroke: #3A4152; stroke-width: 1"/>')
    for y in (384, 420, 456):
        o.append(f'<rect x="650" y="{y}" width="8" height="26" style="fill: #9FD0EE; opacity: 0.45"/>')
    o.append('<circle cx="620" cy="434" r="10" style="fill: #2A3040"/>')
    o.append(f'<text x="592" y="396" style="{lab}">GM NOOK</text>')
    # inn: tool rack, bar, hearth, bard, tables
    o.append('<rect x="128" y="530" width="104" height="12" style="fill: #3A2E1F"/>')
    for i, col in enumerate(("#9A9486", "#A996E6", "#9FD0EE", "#B98A33", "#E3D8BE", "#8C6A2A")):
        o.append(f'<rect x="{138 + i * 15}" y="532" width="5" height="8" style="fill: {col}"/>')
    o.append(f'<text x="180" y="562" style="{lab}">TOOL RACK</text>')
    o.append('<rect x="476" y="530" width="120" height="10" style="fill: #2A2218"/>')
    o.append('<rect x="476" y="600" width="212" height="24" style="fill: #3A2E1F; stroke: #5A4A34; stroke-width: 1.5"/>')
    o.append('<circle cx="540" cy="572" r="8" style="fill: #C9B79A"/>')
    o.append(f'<text x="582" y="648" style="{lab}">BAR · CHECK-IN</text>')
    o.append('<rect x="300" y="752" width="120" height="28" style="fill: #2B2620; stroke: #4A3F30; stroke-width: 1.5"/>')
    o.append('<rect x="330" y="760" width="60" height="20" style="fill: #0C0A08"/>')
    o.append('<ellipse cx="360" cy="772" rx="20" ry="6" style="fill: #E07A45"/>')
    o.append(f'<text x="360" y="740" style="{lab}">HEARTH · THE BOARD</text>')
    o.append('<circle cx="470" cy="738" r="8" style="fill: #C9B79A"/>')
    o.append('<ellipse cx="481" cy="744" rx="5" ry="6" style="fill: #8C6A2A"/>')
    o.append(f'<text x="470" y="714" style="{lab}">BARD</text>')
    for x, y in ((232, 690), (370, 640)):
        o.append(f'<circle cx="{x}" cy="{y}" r="22" style="fill: url(#bw-pc)"/>')
        o.append(f'<circle cx="{x}" cy="{y}" r="18" style="fill: #2A2218; stroke: #4A3F30; stroke-width: 1.5"/>')
        o.append(f'<circle cx="{x}" cy="{y}" r="2.6" style="fill: #F2C46B"/>')
    o.append(f'<text x="100" y="696" style="{lab}">STREET DOOR</text>')
    o.append("<text x=\"160\" y=\"618\" style=\"font-family: 'IM Fell English SC', Georgia, serif; font-size: 22px; fill: #E2B45A; text-anchor: middle\">The Last Lantern</text>")
    o.append("<text x=\"150\" y=\"504\" style=\"font-family: 'IM Fell English SC', Georgia, serif; font-size: 24px; fill: #8EBDB6; text-anchor: middle\">The Barrow</text>")
    # markers
    marks = {"1": (280, 494), "2": (494, 370), "3": (398, 56), "4": (378, 330), "5": (82, 200), "6": (442, 124), "7": (136, 416), "8": (184, 146)}
    for n, (mx, my) in marks.items():
        o.append(f'<circle cx="{mx}" cy="{my}" r="12" style="fill: #B98A33; stroke: #10131B; stroke-width: 2.5"/>')
        o.append(f'<text x="{mx}" y="{f1(my + 4.5)}" style="font-family: \'DM Mono\', monospace; font-size: 13px; font-weight: 500; fill: #10131B; text-anchor: middle">{n}</text>')
    # scale bar
    o.append('<path d="M528 800 H688 M528 794 V806 M608 796 V804 M688 794 V806" style="fill: none; stroke: #5A6275; stroke-width: 1.5"/>')
    o.append(f'<text x="528" y="818" style="{lab}">0</text><text x="608" y="818" style="{lab}">1</text><text x="688" y="818" style="{lab}">2 M</text>')
    o.append("</svg>")
    return "\n".join(o)


# ------------------------------------------------------------------ loot grid
def loot():
    o = ['<svg viewBox="0 0 300 300" role="img" aria-label="A ten by ten grid of the hundred possible rolls: 70 common, 24 rare, 5 epic and 1 legendary" style="width: 100%; height: auto; display: block;">']
    for n in range(1, 101):
        r, c = divmod(n - 1, 10)
        col = "#3A4152" if n <= 70 else "#6FA9CF" if n <= 94 else "#A996E6" if n <= 99 else "#E07A45"
        o.append(f'<rect x="{2 + c * 30}" y="{2 + r * 30}" width="26" height="26" rx="3" style="fill: {col}"/>')
    o.append('<path d="M278 290 L277 279 L282 284 L285 276 L288 284 L293 279 L292 290 Z" style="fill: #10131B"/>')
    o.append("</svg>")
    return "\n".join(o)


# ------------------------------------------------------------------ cards
GOLD_ICON = "fill: none; stroke: #E2B45A; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"
STATION_ICONS = {
    1: '<path d="M10 36 V17 A10 10 0 0 1 30 17 V36 Z"/><path d="M5 36 H35"/><circle cx="25" cy="25" r="2"/>',
    2: '<path d="M20 6 C11 6 7 13 8 20 C9 25 12 27 13 28 V33 H27 V28 C28 27 31 25 32 20 C33 13 29 6 20 6 Z"/><circle cx="15" cy="19" r="3"/><circle cx="25" cy="19" r="3"/><path d="M17 3 H23"/>',
    3: '<path d="M5 36 V17 A15 15 0 0 1 35 17 V36"/><path d="M11 36 V18 A9 9 0 0 1 29 18 V36"/><path d="M20 20 C17 24 23 27 20 31"/>',
    4: '<path d="M6 14 H34 L32 32 H8 Z"/><path d="M10 19 H30"/><circle cx="14" cy="25" r="2.5"/><path d="M18 25 H29"/>',
    5: '<rect x="5" y="5" width="30" height="30" rx="2"/><path d="M15 5 V35 M25 5 V35 M5 15 H35 M5 25 H35"/><path d="M20 17 V23 M20 19 L23 17"/>',
    6: '<rect x="7" y="6" width="26" height="29" rx="2"/><path d="M7 15.5 H33 M7 25 H33"/><circle cx="20" cy="11" r="1.5"/><circle cx="20" cy="20" r="1.5"/><circle cx="20" cy="30" r="1.5"/>',
    7: '<path d="M7 35 H33"/><rect x="10" y="21" width="5" height="14"/><rect x="17.5" y="15" width="5" height="20"/><rect x="25" y="24" width="5" height="11"/><path d="M12.5 13 V17 M20 7 V11 M27.5 16 V20"/>',
    None: '<path d="M5 8 H35"/><path d="M10 8 V13 M20 8 V13 M30 8 V13"/><path d="M10 13 V35"/><rect x="16" y="13" width="8" height="12" rx="1.5"/><path d="M30 13 L35 20 L30 34 L25 20 Z"/>',
    8: '<path d="M5 15 H35 L31 25 H9 Z"/><path d="M11 25 V34 M29 25 V34"/><path d="M15 15 L13 25 M25 15 L27 25 M7 20 H33"/>',
}

STATIONS = [
    (1, "The sealed door",
     "The heavy door you came in by, its iron ring, and a rune plate at shoulder height. When the dead come, it shudders and booms.",
     "A solid-core door on commercial hinges, a steel rune plate with the reader behind it, and a shaker bolted inside for the boom. Push-to-exit always opens it.",
     "Warrior · everyone, in and out"),
    (2, "The Oracle Skull",
     "A carved skull on a stone pedestal, with a brass button on its crown. Press, speak, let go.",
     "Cast resin bolted to a steel post, an arcade button rated for millions of presses, and the mic behind a mesh grille.",
     "Mage · Bard · everyone"),
    (3, "The portal wall",
     "A carved stone arch with a veil of gauze. A ghost hums in it, and in the last act the Barrow King rises in it.",
     "A hard-coated carving on a timber frame. The gauze hangs behind a rail, the projector sits high in a locked hood, and a light sensor hides in the keystone.",
     "Bard · Ranger"),
    (4, "The sarcophagus",
     "A stone coffin with a carved knight on the lid. The lid really slides, a catch hides under the lip, and the knight speaks from inside.",
     "A steel frame under the carving. The lid runs on heavy-duty drawer slides with a soft-close damper, so no fingers get caught. The catch is a contactless sensor.",
     "Warrior · Rogue · Cleric"),
    (5, "The rune wall",
     "Twenty-five carved rune tiles that push in like big buttons. Some only show under the ranger's lantern.",
     "Cast resin tiles on industrial pushbuttons rated for a million presses. The hidden runes are UV ink under a clear sealing coat.",
     "Ranger · Mage · everyone"),
    (6, "The reliquary",
     "An iron-bound cabinet with three real locks, a secret drawer, and relics inside: bone charms, a map, a key.",
     "A steel carcass with timber fronts, oversized locks built to be picked, and spare lock cores on the shelf. Every relic is cast resin, with spares.",
     "Rogue · Ranger"),
    (7, "The candle altar",
     "Seven candles in iron cups, and a stone basin that fills with cold light and low mist when the ghosts come.",
     "Flameless candles fixed into steel cups, and a sealed basin with the mist piped in from below. No naked flame and nothing to spill.",
     "Mage · Cleric"),
    (8, "The war table",
     "A heavy timber table with the battle map projected onto it, the dice tray, and a rune plate at every place.",
     "A hardwood top under a hard-wearing matte coat. The projector and the dice camera live in the ceiling, and the readers sit under the timber.",
     "Warrior · Rogue · Cleric · Bard · everyone"),
    (None, "The tool rack",
     "Six class tools, two of each, on hooks beside the adventure door. Take yours at the briefing and hang it back on the way out.",
     "Charging hooks for the lantern, staff and lute, a wipe-down between parties, and spares behind the bar.",
     "Everyone, before and after"),
]

BADGE = "display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #B98A33; color: #10131B; font-family: " + MONO + "; font-weight: 500;"
LABEL = "font-family: " + MONO + "; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #948E7F;"


def key_items():
    out = []
    for n, name, *_ in STATIONS:
        if n is None:
            continue
        out.append(f'<li style="display: flex; gap: 12px; align-items: center;"><span aria-hidden="true" style="flex: none; width: 24px; height: 24px; font-size: 12px; {BADGE}">{n}</span><span>{name}</span></li>')
    return "\n".join(out)


def station_cards():
    out = []
    for n, name, touch, built, used in STATIONS:
        if n is None:
            badge = f'<span style="flex: none; height: 30px; padding-inline: 10px; border: 1px solid #B98A33; border-radius: 15px; display: inline-flex; align-items: center; font-family: {MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #E2B45A;">Inn</span>'
        else:
            badge = f'<span aria-hidden="true" style="flex: none; width: 34px; height: 34px; font-size: 15px; {BADGE}">{n}</span>'
        out.append(f"""<article style="background: #151925; border: 1px solid #2A3040; border-radius: 4px; padding: 24px; display: flex; flex-direction: column; gap: 14px;">
<div style="display: flex; align-items: center; gap: 14px;">
{badge}
<svg viewBox="0 0 40 40" aria-hidden="true" style="flex: none; width: 36px; height: 36px; {GOLD_ICON}">{STATION_ICONS[n]}</svg>
<h3 style="margin: 0; font-family: {SERIF}; font-weight: 400; font-size: 27px; line-height: 1.05; color: #EDE3CC;">{name}</h3>
</div>
<dl style="margin: 0; display: flex; flex-direction: column; gap: 12px;">
<div style="display: flex; flex-direction: column; gap: 3px;"><dt style="{LABEL}">What you touch</dt><dd style="margin: 0; font-size: 16px; line-height: 1.55; color: #EDE3CC;">{touch}</dd></div>
<div style="display: flex; flex-direction: column; gap: 3px;"><dt style="{LABEL}">Built to last</dt><dd style="margin: 0; font-size: 15px; line-height: 1.55; color: #C5BBA4;">{built}</dd></div>
<div style="display: flex; flex-direction: column; gap: 3px; border-top: 1px solid #262C3B; padding-top: 12px;"><dt style="{LABEL}">Used by</dt><dd style="margin: 0; font-size: 15px; line-height: 1.5; color: #E2B45A;">{used}</dd></div>
</dl>
</article>""")
    return "\n".join(out)


TOOL_ICONS = {
    "Warrior": '<path d="M32 6 L52 13 V30 C52 44 43 53 32 58 C21 53 12 44 12 30 V13 Z"/><circle cx="32" cy="29" r="6"/><path d="M32 6 V23 M32 35 V58"/>',
    "Ranger": '<path d="M32 4 V9"/><path d="M24 15 L27 9 H37 L40 15 Z"/><rect x="24" y="15" width="16" height="26" rx="2"/><path d="M32 21 V35"/><path d="M22 41 H42 L38 47 H26 Z"/><path d="M14 28 H7 M57 28 H50 M15 17 L10 13 M49 17 L54 13 M15 39 L10 43 M49 39 L54 43"/>',
    "Mage": '<path d="M20 58 L38 22"/><path d="M38 22 L34 12 L42 6 L48 14 Z"/><path d="M52 22 L56 18 M50 30 H56 M44 2 V6"/>',
    "Rogue": '<rect x="8" y="30" width="26" height="24" rx="3"/><path d="M13 30 V22 A8 8 0 0 1 29 22 V30"/><circle cx="21" cy="40" r="3"/><path d="M21 43 V47"/><path d="M23 39 L54 12 L57 15"/><path d="M24 45 L46 30"/>',
    "Cleric": '<circle cx="32" cy="24" r="10"/><circle cx="32" cy="24" r="3.5"/><path d="M32 8 V4 M16 24 H12 M48 24 H52 M20.7 12.7 L17.9 9.9 M43.3 12.7 L46.1 9.9 M20.7 35.3 L17.9 38.1 M43.3 35.3 L46.1 38.1"/><path d="M32 34 V60 M26 52 H38"/>',
    "Bard": '<ellipse cx="25" cy="42" rx="14" ry="15"/><circle cx="25" cy="42" r="4"/><path d="M34 31 L52 11"/><path d="M49 8 L56 15 M52 6 L58 12"/>',
}

CLASSES = [
    ("Warrior", "Shield", "A foam face on a light plastic core, with the tag in the boss.", [
        (4, "Act II · The sarcophagus", "Shift the sarcophagus lid. It only slides while the shield is pressed to the stone."),
        (1, "Act III · The sealed door", "Brace the door while the dead hammer on the other side."),
        (8, "Act IV · The war table", "Block: lay the shield on its plate to stop one of the King's blows."),
    ]),
    ("Ranger", "UV lantern", "An aluminium body with sealed UV lights. Charges on the rack at the inn.", [
        (6, "Act II · The reliquary", "Spot the scratch marks that give away the secret drawer."),
        (5, "Act II · The rune wall", "Find the runes that only show under the lantern."),
        (3, "Act IV · The portal wall", "Shine the lantern on the King. A sensor in the arch reveals his weak point."),
    ]),
    ("Mage", "Staff with a light-up crystal", "A hardwood staff, with the tag in the crystal.", [
        (7, "Act I · The candle altar", "Light the altar candles in the right order, crystal to wick."),
        (5, "Act II · The rune wall", "Read the arcane script: touch a rune and the room speaks it."),
        (2, "Act III · The Oracle Skull", "Speak the incantation into the skull with the staff in hand."),
    ]),
    ("Rogue", "Lockpicks", "Oversized brass picks on a lanyard, for real locks built to be picked.", [
        (6, "Act II · The reliquary", "Pick the reliquary's three real locks."),
        (4, "Act II · The sarcophagus", "Find the hidden catch under the sarcophagus lip."),
        (8, "Act IV · The war table", "Disarm the trap rune when it lights up on the map."),
    ]),
    ("Cleric", "Holy symbol", "A cast metal sun disc on a handle, with the tag in the back.", [
        (7, "Act I · The candle altar", "Banish the ghost that rises from the basin."),
        (4, "Act II · The sarcophagus", "Hear the dead knight's last words through the lid."),
        (8, "Act IV · The war table", "Heal: touch the symbol and a wounded hero's coin to the heal plate."),
    ]),
    ("Bard", "Lute with touch strings", "A solid body with four brass touch strings. No real strings to snap.", [
        (2, "Act II · The Oracle Skull", "Talk the skull into answering a fourth question."),
        (3, "Act III · The portal wall", "Play back the tune the ghost hums in the portal."),
        (8, "Act IV · The war table", "Strum to lift a teammate's roll by two."),
    ]),
]


def class_cards():
    out = []
    for name, tool, build, jobs in CLASSES:
        lis = []
        for i, (n, where, text) in enumerate(jobs):
            last = " border-bottom: 1px solid #262C3B;" if i == len(jobs) - 1 else ""
            lis.append(f'<li style="border-top: 1px solid #262C3B;{last} padding-block: 12px; display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; align-items: start;"><span aria-hidden="true" style="width: 26px; height: 26px; margin-top: 1px; font-size: 12px; {BADGE}">{n}</span><span style="display: flex; flex-direction: column; gap: 3px; min-width: 0;"><span style="font-size: 16px; line-height: 1.5; color: #EDE3CC;">{text}</span><span style="{LABEL}">{where}</span></span></li>')
        out.append(f"""<article style="background: #151925; border: 1px solid #2A3040; border-radius: 4px; padding: 24px; display: flex; flex-direction: column; gap: 14px;">
<div style="display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 16px; align-items: center;">
<svg viewBox="0 0 64 64" aria-hidden="true" style="width: 56px; height: 56px; fill: none; stroke: #E2B45A; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;">{TOOL_ICONS[name]}</svg>
<div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
<h3 style="margin: 0; font-family: {SERIF}; font-weight: 400; font-size: 30px; line-height: 1.05; color: #EDE3CC;">{name}</h3>
<span style="{LABEL}">{tool}</span>
</div>
</div>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: #948E7F;">{build}</p>
<ol aria-label="{name} jobs in the Barrow" style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column;">
{chr(10).join(lis)}
</ol>
</article>""")
    return "\n".join(out)


ACTS = [
    ("I", "10 min", "The seal", "The door seals behind you and the candles die. Light the altar, banish what wakes, and the skull tells you whose barrow this is.", "Mage · Cleric", "#8EBDB6"),
    ("II", "20 min", "The search", "Three keys to the King's tomb, in any order: one in the reliquary, one in the rune wall, one in the sarcophagus.", "Rogue · Ranger · Warrior", "#8EBDB6"),
    ("III", "15 min", "The rising", "Speak the words, sing the ghost's song back, and hold the door while the dead hammer on it.", "Mage · Bard · Warrior", "#8EBDB6"),
    ("IV", "15 min", "The war table", "The Barrow King rises in the portal. Plan on the map, declare to the skull, roll in the tray.", "Everyone", "#E07A45"),
]


def act_cards():
    out = []
    for num, mins, title, text, who, col in ACTS:
        out.append(f"""<li style="background: #151925; border: 1px solid #2A3040; border-top: 3px solid {col}; border-radius: 4px; padding: 22px; display: flex; flex-direction: column; gap: 10px;">
<span style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: {col};">Act {num} · {mins}</span>
<h3 style="margin: 0; font-family: {SERIF}; font-weight: 400; font-size: 28px; line-height: 1.05; color: #EDE3CC;">{title}</h3>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #C5BBA4;">{text}</p>
<p style="margin: 0; margin-top: auto; border-top: 1px solid #262C3B; padding-top: 10px; font-size: 14px; line-height: 1.5; color: #948E7F;"><span style="{LABEL}">Spotlight</span> · {who}</p>
</li>""")
    return "\n".join(out)


DURABLE = [
    ("Nothing fragile in reach", "Everything a player can touch is steel, hardwood, cast resin or hard-coated foam. Projectors, gauze and haze live above 2.4 m or behind a rail."),
    ("Contactless where it counts", "Tools talk to the room through tags and magnets behind the surface. There's no exposed switch to snap off."),
    ("Arcade-grade parts", "Arcade buttons, industrial switches, commercial hinges and drawer slides, rated in millions of cycles, not hundreds."),
    ("Two of everything", "Two of every tool, plus spare tiles, lock cores and relics on the shelf. Tools get wiped and swapped between parties."),
    ("A test cue every morning", "One button runs every sensor and effect, and the GM screen shows each station green or red before the doors open."),
    ("Nobody is really locked in", "Nothing locks for real. Push-to-exit always works, and any magnetic catch lets go on power loss or a fire alarm."),
]


def durable_items():
    out = []
    for title, text in DURABLE:
        out.append(f"""<div style="border-top: 2px solid #B98A33; padding-top: 18px; display: flex; flex-direction: column; gap: 8px;">
<h3 style="margin: 0; font-family: {SERIF}; font-weight: 400; font-size: 25px; line-height: 1.15; color: #EDE3CC;">{title}</h3>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #C5BBA4;">{text}</p>
</div>""")
    return "\n".join(out)


tpl = open(os.path.join(BUILD, "barrow_template.html"), encoding="utf-8").read()
html = (tpl.replace("%%ILLUS%%", illustration())
        .replace("%%PLAN%%", plan())
        .replace("%%LOOT%%", loot())
        .replace("%%KEY%%", key_items())
        .replace("%%STATIONS%%", station_cards())
        .replace("%%CLASSES%%", class_cards())
        .replace("%%ACTS%%", act_cards())
        .replace("%%DURABLE%%", durable_items())
        .replace("%%HEIGHT%%", HEIGHT))
assert "%%" not in html
open(os.path.join(PROJECT, "Barrow.dc.html"), "w", encoding="utf-8").write(html)
print("wrote", len(html), "bytes")
