# Style sketches for the "cartoon but epic" direction: flat fills, warm ink lines, one shadow tone, glowing bits.
# Usage: stylegen.py out_fragment.html   (writes a preview fragment; import PIECES for the board)
import math, sys, os, re, colorsys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fighttiles import TILES

INK = '#2A1A22'
OW = 3.5
STYLE = {'shade': 'cel', 'glow': 1.0}


def P(d, fill='none', col=INK, w=OW, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<path d="{d}" style="fill: {fill}; stroke: {col}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round{o}"/>'


def F(d, fill, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<path d="{d}" style="fill: {fill}{o}"/>'


def S(d, fill, w=OW):
    return P(d, fill, INK, w)


def L(d, col=INK, w=3, op=None):
    return P(d, 'none', col, w, op)


def inked(d, col, w):
    return L(d, INK, w + 4.5) + L(d, col, w)


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))


def rgbhex(r, g, b):
    return '#' + ''.join(f'{max(0, min(255, round(v * 255))):02X}' for v in (r, g, b))


def mix(a, b, t):
    ra, rb = hexrgb(a), hexrgb(b)
    return rgbhex(*[x + (y - x) * t for x, y in zip(ra, rb)])


def cel(d, lit, shade, px, py, s=0.84, w=OW):
    """Shadow tone everywhere, lit tone shrunk toward the upper-left pivot, ink outline on top."""
    mode = STYLE['shade']
    if mode == 'flat':
        shade = lit
    elif mode == 'comic':
        shade = mix(shade, '#0B0810', 0.6)
    elif mode == 'soft':
        shade = mix(lit, shade, 0.45)
    return (F(d, shade) +
            f'<path d="{d}" transform="translate({px} {py}) scale({s}) translate({-px} {-py})" style="fill: {lit}"/>' +
            P(d, 'none', INK, w))


def C(cx, cy, r, fill, w=OW, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    st = f'stroke: {INK}; stroke-width: {w}' if w else 'stroke: none'
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" style="fill: {fill}; {st}{o}"/>'


def E(cx, cy, rx, ry, fill, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" style="fill: {fill}{o}"/>'


def glow(cx, cy, r, col, k=1.0):
    k = k * STYLE['glow']
    return ''.join(f'<circle cx="{cx}" cy="{cy}" r="{round(r * f, 1)}" style="fill: {col}; opacity: {round(op * k, 3)}"/>'
                   for f, op in [(1, 0.09), (0.66, 0.13), (0.36, 0.2)])


def star5(cx, cy, r, inner=0.45):
    pts = []
    for k in range(10):
        a = math.radians(-90 + k * 36)
        rr = r if k % 2 == 0 else r * inner
        pts.append(f'{cx + rr * math.cos(a):.1f} {cy + rr * math.sin(a):.1f}')
    return 'M' + ' L'.join(pts) + ' Z'


def spark(cx, cy, r):
    return f'M{cx} {cy - r} Q{cx} {cy} {cx + r} {cy} Q{cx} {cy} {cx} {cy + r} Q{cx} {cy} {cx - r} {cy} Q{cx} {cy} {cx} {cy - r} Z'


def mirror(d, axis=150):
    """Mirror a path made of absolute M/L/C/Q/Z commands with plain numbers around x = axis."""
    out, toks = [], d.replace(',', ' ').split()
    i = 0
    xturn = True
    for t in toks:
        if t[0].isalpha():
            out.append(t[0])
            rest = t[1:]
            xturn = True
            if not rest:
                continue
            t = rest
        v = float(t)
        if xturn:
            v = 2 * axis - v
        out.append(f'{v:g}')
        xturn = not xturn
    return ' '.join(out).replace('M ', 'M').replace('L ', 'L').replace('C ', 'C').replace('Q ', 'Q')


def svg(vb, body, label):
    return f'<svg viewBox="{vb}" role="img" aria-label="{label}" style="display: block; width: 100%; height: auto;">{body}</svg>'


def ground(cx, cy, rx, ry=12):
    return E(cx, cy, rx, ry, '#0E0B12', 0.5)


PLATE, PSHADE, PEDGE = '#4B4458', '#322C3D', '#6E6680'
STEEL, STEELSH = '#C9CFD8', '#98A1AC'
VIOLET, VIOLET_L = '#B79CFF', '#E9DEFF'


# ---------------------------------------------------------------- A: the Dread Warden (tank)
def warden():
    o = []
    a = o.append
    a(glow(150, 205, 150, VIOLET, 0.6))
    a(ground(150, 398, 100, 12))
    a(cel('M98 134 C80 222 68 318 60 396 L240 396 C232 318 220 222 202 134 Z', '#3D2C5C', '#291E40', 112, 150, 0.9))
    # legs, knees, feet
    a(cel('M118 296 L148 296 L146 384 L114 384 Z', PLATE, PSHADE, 122, 300))
    a(cel('M152 296 L182 296 L186 384 L154 384 Z', PLATE, PSHADE, 156, 300))
    a(cel('M110 328 C110 316 152 316 152 328 L148 346 C138 354 122 354 114 346 Z', '#5A536A', PSHADE, 116, 322))
    a(cel('M148 328 C148 316 190 316 190 328 L186 346 C178 354 162 354 152 346 Z', '#5A536A', PSHADE, 154, 322))
    a(S('M112 334 L92 326 L112 344 Z', STEEL) + S('M188 334 L208 326 L188 344 Z', STEEL))
    a(cel('M108 380 L148 380 L150 398 L96 398 C96 390 100 383 108 380 Z', PLATE, PSHADE, 110, 384))
    a(cel('M152 380 L192 380 C200 383 204 390 204 398 L150 398 Z', PLATE, PSHADE, 156, 384))
    # tassets, belt
    a(cel('M114 288 L186 288 L194 332 L150 322 L106 332 Z', PLATE, PSHADE, 120, 292))
    # torso
    a(cel('M108 166 C106 208 110 254 118 294 L182 294 C190 254 194 208 192 166 Z', '#544C63', PSHADE, 116, 172))
    a(L('M116 176 C114 212 118 250 124 284', PEDGE, 3))
    a(S('M114 280 L186 280 L188 298 L112 298 Z', '#5A3A2A'))
    a(glow(150, 289, 18, VIOLET, 1.2) + S('M150 281 L158 289 L150 297 L142 289 Z', VIOLET, 2.5))
    # chest rune
    a(glow(150, 222, 40, VIOLET, 1.2))
    a(S('M150 192 L170 214 L150 254 L130 214 Z', '#241B30', 3))
    a(S('M150 204 L161 216 L150 240 L139 216 Z', VIOLET, 2.5) + F('M150 208 L155 216 L150 228 Z', VIOLET_L))
    # gorget
    a(cel('M126 148 L174 148 L178 170 L122 170 Z', '#5A536A', PSHADE, 130, 150))
    # left arm + shield
    a(cel('M88 196 L76 252 L102 258 L112 200 Z', PLATE, PSHADE, 92, 200))
    sh = []
    sh.append(cel('M42 216 C62 204 98 204 118 216 L114 300 C110 334 94 356 80 368 C66 356 50 334 46 300 Z', '#3F384C', '#2A2533', 52, 220, 0.88))
    sh.append(L('M54 226 C68 216 92 216 106 226 L103 298 C100 324 90 342 80 352 C70 342 60 324 57 298 Z', VIOLET, 3))
    sh.append(glow(78, 274, 30, VIOLET, 1.1))
    sh.append(S('M80 250 A24 24 0 0 0 80 298 A30 30 0 0 1 80 250 Z', VIOLET, 2.5))
    sh.append(C(74, 222, 3, STEEL, 1.5) + C(86, 222, 3, STEEL, 1.5) + C(62, 228, 3, STEEL, 1.5) + C(98, 228, 3, STEEL, 1.5))
    a('<g transform="rotate(-6 80 290)">' + ''.join(sh) + '</g>')
    # right arm, mace, fist
    a(cel('M212 192 L228 254 L202 262 L190 198 Z', PLATE, PSHADE, 196, 198))
    a(inked('M218 262 L246 344', '#6B4528', 5.5))
    spikes = ''
    for k in range(8):
        ang = math.radians(k * 45 + 22)
        bx1, by1 = 252 + 19 * math.cos(ang - 0.28), 364 + 19 * math.sin(ang - 0.28)
        bx2, by2 = 252 + 19 * math.cos(ang + 0.28), 364 + 19 * math.sin(ang + 0.28)
        tx, ty = 252 + 34 * math.cos(ang), 364 + 34 * math.sin(ang)
        spikes += S(f'M{bx1:.1f} {by1:.1f} L{tx:.1f} {ty:.1f} L{bx2:.1f} {by2:.1f} Z', STEEL, 2.5)
    a(spikes)
    a(cel('M252 342 A22 22 0 1 1 251.9 342 Z', '#6A6280', PSHADE, 244, 352, 0.8))
    a(glow(252, 364, 26, VIOLET, 1.0) + L('M232 360 C244 355 260 355 272 360', VIOLET, 3.5))
    a(cel('M202 256 C196 270 204 286 218 286 C234 286 240 270 234 256 Z', '#3F384C', '#2A2533', 208, 260))
    a(L('M206 268 C214 266 224 266 232 268', INK, 2.2))
    # pauldrons (left, then mirrored right)
    for flip in (False, True):
        m = (lambda d: mirror(d)) if flip else (lambda d: d)
        pv = 128 if not flip else 172
        a(S(m('M64 162 L34 134 L78 148 Z'), STEEL) + S(m('M84 136 L78 94 L100 128 Z'), STEEL) + S(m('M106 126 L114 84 L124 130 Z'), STEEL))
        a(cel(m('M64 186 C82 200 112 202 132 190 L128 206 C108 216 80 214 64 202 Z'), '#544C63', PSHADE, 70 if not flip else 230, 190, 0.86))
        a(cel(m('M58 182 C50 146 84 120 124 128 C138 140 140 166 132 188 C108 198 80 196 58 182 Z'), '#5E5670', PSHADE, 70 if not flip else 230, 150, 0.84))
        a(L(m('M62 178 C84 192 110 192 130 184'), VIOLET, 3))
        a(C(78 if not flip else 222, 168, 3, STEEL, 1.5) + C(100 if not flip else 200, 160, 3, STEEL, 1.5))
    # helmet with horns
    a(cel('M126 84 C100 80 84 58 88 26 C98 48 112 60 132 64 Z', '#E9E2D0', '#BDB3A0', 112, 68, 0.8))
    a(cel('M174 84 C200 80 216 58 212 26 C202 48 188 60 168 64 Z', '#E9E2D0', '#BDB3A0', 178, 66, 0.8))
    a(cel('M122 78 C122 46 178 46 178 78 L182 136 C168 150 132 150 118 136 Z', '#544C63', PSHADE, 128, 60, 0.86))
    a(L('M150 50 L150 90', PEDGE, 3))
    a(glow(150, 108, 34, VIOLET, 1.3))
    a(L('M130 102 L170 102 M150 102 L150 130', '#140F1A', 10))
    a(L('M132 102 L168 102 M150 104 L150 128', VIOLET, 4))
    a(L('M136 102 L146 102', VIOLET_L, 2.5))
    a(C(128, 132, 2.5, STEEL, 1.2) + C(140, 138, 2.5, STEEL, 1.2) + C(160, 138, 2.5, STEEL, 1.2) + C(172, 132, 2.5, STEEL, 1.2))
    return svg('0 0 300 420', ''.join(o), 'Sketch of a horned dark knight with a glowing visor, tower shield and spiked mace')


# ---------------------------------------------------------------- B: the Lantern Sister (healer)
def cleric():
    o = []
    a = o.append
    SK, SKS = '#F1D2BC', '#D9B39A'
    HR, HRS = '#C2562E', '#953E1C'
    a(glow(94, 78, 76, '#F4B942', 0.9))
    a(glow(150, 220, 140, '#9BD068', 0.35))
    a(ground(150, 396, 96, 12))
    # hair back locks
    a(cel('M120 96 C110 140 104 170 100 192 L124 184 C124 150 128 120 134 100 Z', HR, HRS, 118, 110))
    a(cel('M180 96 C190 140 196 170 200 192 L176 184 C176 150 172 120 166 100 Z', HR, HRS, 172, 110))
    # robe
    a(cel('M104 150 C96 230 86 320 74 392 L226 392 C214 320 204 230 196 150 Z', '#3F8F88', '#2D6C66', 112, 160, 0.86))
    a(cel('M134 200 L166 200 L178 392 L122 392 Z', '#EFE3C8', '#D6C6A4', 138, 206, 0.86))
    a(L('M134 200 L122 390 M166 200 L178 390', '#F4B942', 3.5))
    a(S('M76 380 C120 388 180 388 224 380 L226 394 C180 400 120 400 74 394 Z', '#F4B942', 3))
    a(S('M108 234 C130 242 170 242 192 234 L190 250 C170 258 130 258 110 250 Z', '#F4B942', 3))
    a(S('M144 252 L140 306 L150 298 L160 306 L156 252 Z', '#F4B942', 2.5))
    a(glow(150, 246, 14, '#9BD068', 1.3) + C(150, 246, 6, '#9BD068', 2.5))
    # sleeves and hands
    a(cel('M108 160 C94 192 84 226 80 252 C92 262 110 262 122 254 C120 222 122 190 124 168 Z', '#3F8F88', '#2D6C66', 112, 170))
    a(cel('M192 160 C206 190 216 226 220 252 C208 262 190 262 178 254 C180 222 178 190 176 168 Z', '#3F8F88', '#2D6C66', 184, 170))
    a(L('M82 248 C94 256 110 256 120 250 M218 248 C206 256 190 256 180 250', '#F4B942', 3))
    # staff with lantern
    a(inked('M86 390 L94 98', '#8A5A34', 5))
    a(glow(94, 76, 56, '#F4B942', 1.3))
    a(S('M82 60 L106 60 L102 96 L86 96 Z', '#F4B942', 3))
    a(F('M88 64 L100 64 L98 92 L90 92 Z', '#FFF3C4'))
    a(S('M94 70 C100 78 100 86 94 90 C88 86 88 78 94 70 Z', '#FF8A4C', 2))
    a(L('M88 64 L90 92 M100 64 L98 92', '#A8741C', 2))
    a(S('M80 56 L108 56 L104 48 L84 48 Z', '#A8741C', 2.5) + L('M94 48 L94 40', INK, 3))
    a(C(96, 256, 9, SK, 2.5))
    # healing sparks at the right hand
    a(glow(204, 256, 36, '#9BD068', 1.4))
    a(C(204, 258, 9, SK, 2.5))
    a(S(spark(216, 230, 9), '#CDEFA8', 2) + S(spark(196, 222, 6), '#9BD068', 1.8) + S(spark(226, 252, 5), '#9BD068', 1.6))
    # capelet
    a(cel('M100 150 C120 132 180 132 200 150 C196 172 176 184 150 186 C124 184 104 172 100 150 Z', '#EFE3C8', '#D6C6A4', 112, 146))
    a(L('M104 156 C120 176 180 176 196 156', '#F4B942', 3))
    # neck, ears, face
    a(S('M140 116 L160 116 L160 140 L140 140 Z', SK, 3))
    a(cel('M122 86 C122 58 178 58 178 86 C178 112 166 130 150 132 C134 130 122 112 122 86 Z', SK, SKS, 130, 80, 0.88))
    a(E(134, 108, 7, 4, '#E8907E', 0.45) + E(166, 108, 7, 4, '#E8907E', 0.45))
    for ex in (138, 162):
        a(S(f'M{ex - 8} 92 C{ex - 4} 86 {ex + 4} 86 {ex + 8} 92 C{ex + 4} 96 {ex - 4} 96 {ex - 8} 92 Z', '#FFFFFF', 2.2))
        a(C(ex, 91.5, 2.8, INK, 0))
    a(L('M130 82 C134 79 142 79 146 81 M154 81 C158 79 166 79 170 82', '#953E1C', 2.5))
    a(L('M150 96 L147 106 L152 107', '#B98A70', 2.2))
    a(L('M143 115 C147 118 153 118 157 115', INK, 2.4))
    # hair top and fringe, circlet
    a(cel('M118 94 C110 54 140 38 160 40 C186 44 194 68 182 96 C176 76 162 66 150 66 C138 66 124 76 118 94 Z', HR, HRS, 126, 56, 0.86))
    a(S('M124 78 C138 60 164 58 178 80 C162 72 146 72 130 88 Z', HR, 2.5))
    a(L('M124 76 C140 70 160 70 176 76', '#F4B942', 3) + C(150, 72, 4, '#9BD068', 2))
    a(cel('M126 90 L90 58 L127 104 Z', SK, SKS, 116, 84, 0.8) + cel('M174 90 L210 58 L173 104 Z', SK, SKS, 182, 84, 0.8))
    return svg('0 0 300 420', ''.join(o), 'Sketch of an elf cleric in teal robes holding a lantern staff, green healing sparks at her hand')


# ---------------------------------------------------------------- C: the frost wizard (mage)
def wizard():
    o = []
    a = o.append
    SK, SKS = '#E8B48A', '#C98F66'
    ROBE, ROBES = '#2F4C8C', '#21366A'
    a(glow(204, 74, 72, '#8FD6FF', 1.0))
    a(glow(150, 230, 140, '#8FD6FF', 0.3))
    a(ground(150, 396, 96, 12))
    # robe
    a(cel('M106 168 C96 250 88 330 82 394 L218 394 C212 330 204 250 194 168 Z', ROBE, ROBES, 114, 176, 0.86))
    a(S('M84 380 C120 388 180 388 216 380 L218 396 C180 402 120 402 82 396 Z', '#8FD6FF', 3))
    for (sx, sy, r) in [(112, 300, 7), (186, 330, 6), (130, 356, 5), (176, 268, 5), (106, 236, 4)]:
        a(S(spark(sx, sy, r), '#BFE8FF', 1.6))
    # belt
    a(S('M108 230 C130 238 170 238 192 230 L192 246 C170 254 130 254 108 246 Z', '#6B4528', 3))
    # staff (behind the right hand)
    a(inked('M232 394 C226 320 222 250 218 180 C216 140 212 110 220 86 C226 72 214 58 202 64', '#7A5230', 5))
    a(S('M206 58 L216 70 L212 88 L200 92 L190 80 L194 62 Z', '#BFE8FF', 3) + F('M200 64 L208 68 L204 82 Z', '#FFFFFF'))
    a(S(spark(222, 50, 6), '#DDF3FF', 1.6) + S(spark(184, 96, 4), '#DDF3FF', 1.4))
    # sleeves and hands
    a(cel('M112 176 C92 196 80 226 86 252 C100 258 114 252 120 242 C116 224 118 204 126 188 Z', ROBE, ROBES, 110, 186))
    a(C(94, 252, 9, SK, 2.5))
    a(cel('M186 176 C204 186 218 196 222 214 C214 224 202 228 192 226 C192 210 188 194 180 184 Z', ROBE, ROBES, 188, 182))
    a(S('M210 204 C206 214 212 222 222 222 C230 220 232 210 226 202 Z', SK, 2.5))
    a(L('M86 248 C96 254 108 252 118 244 M190 222 C200 226 212 224 220 216', '#8FD6FF', 3))
    # beard and face
    a(S('M128 96 C128 80 172 80 172 96 L172 126 L128 126 Z', SK, 3))
    a(cel('M126 126 C120 170 130 222 150 252 C170 222 180 170 174 126 C166 140 134 140 126 126 Z', '#EEF0F2', '#C9CED6', 134, 132, 0.86))
    a(L('M140 150 C142 180 146 206 150 230 M160 150 C158 180 154 206 150 230', '#C9CED6', 2.5))
    a(S('M126 124 C134 114 146 116 150 124 C154 116 166 114 174 124 C168 134 156 134 150 128 C144 134 132 134 126 124 Z', '#F6F7F8', 2.5))
    a(S('M150 102 C162 102 164 118 152 120 C140 120 138 104 150 102 Z', '#D9776A', 2.5))
    for gx in (138, 162):
        a(C(gx, 101, 8, '#DDF3FF', 2.5, 0.95) + C(gx, 101, 2.4, INK, 0))
    a(L('M146 101 L154 101', INK, 2.5))
    a(S('M126 94 C130 86 142 86 148 92 C140 92 132 94 126 98 Z', '#F6F7F8', 2) + S('M174 94 C170 86 158 86 152 92 C160 92 168 94 174 98 Z', '#F6F7F8', 2))
    # hat
    a(cel('M112 90 C116 60 132 36 150 24 C164 14 184 8 198 22 C184 22 172 30 166 44 C174 60 184 76 190 90 Z', '#26315E', '#1A2246', 122, 60, 0.86))
    a(S('M114 80 C140 88 162 88 188 80 L190 92 C162 100 140 100 112 92 Z', '#8FD6FF', 3))
    a(cel('M80 94 C100 80 200 80 220 94 C200 108 100 108 80 94 Z', '#26315E', '#1A2246', 96, 88, 0.9))
    for (sx, sy, r) in [(140, 60, 6), (162, 40, 5), (154, 74, 4), (182, 18, 4)]:
        a(S(star5(sx, sy, r), '#F4B942', 1.6))
    return svg('0 0 300 420', ''.join(o), 'Sketch of an old frost wizard with a huge starry hat, spectacles, long beard and a crooked staff holding an ice crystal')


# ---------------------------------------------------------------- D: the dwarf berserker
def dwarf():
    o = []
    a = o.append
    SK, SKS = '#E59A78', '#C47A5B'
    BD, BDS = '#D9622B', '#B24B1E'
    a(glow(150, 240, 140, '#FF8A4C', 0.5))
    a(ground(160, 396, 112, 12))
    # axe planted at the right, behind the hand
    a(inked('M238 226 L242 330', '#6B4528', 7))
    a('<g transform="translate(244 362) scale(1.32) translate(-244 -362)">')
    a(cel('M208 338 C216 324 232 322 238 330 L238 378 C232 386 216 384 208 372 C212 362 212 348 208 338 Z', STEEL, STEELSH, 220, 334, 0.84))
    a(cel('M280 338 C272 324 256 322 250 330 L250 378 C256 386 272 384 280 372 C276 362 276 348 280 338 Z', STEEL, STEELSH, 262, 334, 0.84))
    a(S('M236 326 L252 326 L252 386 L236 386 Z', '#544C63', 3))
    a(L('M212 340 C214 350 214 362 212 370 M276 340 C274 350 274 362 276 370', '#FFFFFF', 2.5, 0.8))
    a('</g>')
    a(S('M234 222 L246 222 L244 232 L236 232 Z', '#F4B942', 2.5))
    # legs and boots
    a(cel('M118 328 L146 328 L146 372 L116 372 Z', '#6B4528', '#4F3320', 122, 332))
    a(cel('M154 328 L182 328 L184 372 L154 372 Z', '#6B4528', '#4F3320', 158, 332))
    a(cel('M106 366 L148 366 L148 396 L96 396 C96 384 100 372 106 366 Z', '#3A2A20', '#271B14', 108, 370))
    a(cel('M152 366 L194 366 C200 372 204 384 204 396 L152 396 Z', '#3A2A20', '#271B14', 156, 370))
    a(S('M102 368 L108 360 L114 368 L120 360 L126 368 L132 360 L138 368 L146 362 L148 372 L104 374 Z', '#8C6A4A', 2.2))
    a(S('M154 368 L160 360 L166 368 L172 360 L178 368 L184 360 L190 368 L196 362 L198 374 L154 372 Z', '#8C6A4A', 2.2))
    # torso: mail, harness, belt
    a(cel('M98 196 C90 250 98 310 112 336 L188 336 C202 310 210 250 202 196 Z', '#9AA3AD', '#7C8590', 108, 204, 0.88))
    for row in range(5):
        y = 236 + row * 16
        a(L(' '.join(f'M{x} {y} q6 8 12 0' for x in range(110 + (row % 2) * 6, 186, 12)), '#6B737E', 2))
    a(S('M104 200 L196 300 L188 310 L98 210 Z', '#6B4528', 2.5) + S('M196 200 L104 300 L112 310 L202 210 Z', '#6B4528', 2.5))
    a(S('M102 300 L198 300 L200 324 L100 324 Z', '#5A3A2A', 3))
    a(glow(150, 312, 24, '#F4B942', 1) + C(150, 312, 14, '#F4B942', 3) + S('M142 316 L158 316 L154 308 L146 308 Z', '#A8741C', 2))
    # arms
    a(cel('M86 214 L70 272 L94 280 L108 222 Z', SK, SKS, 90, 218))
    a(S('M70 256 L96 262 L94 280 L70 274 Z', '#5A3A2A', 2.5))
    a(C(82, 286, 12, SK, 3))
    a(cel('M200 214 L226 262 L210 276 L188 226 Z', SK, SKS, 198, 220))
    a(S('M214 250 L230 262 L220 276 L204 266 Z', '#5A3A2A', 2.5))
    a(S('M228 234 C242 230 250 242 248 252 C244 262 230 262 224 254 C220 246 222 238 228 234 Z', SK, 3))
    # fur mantle and pauldrons
    a(cel('M88 196 C96 168 204 168 212 196 L204 210 L196 202 L188 214 L178 204 L168 216 L158 206 L150 218 L142 206 L132 216 L122 204 L112 214 L104 202 L96 210 Z', '#8C6A4A', '#6E5137', 100, 180, 0.88))
    for flip in (False, True):
        m = (lambda d: mirror(d)) if flip else (lambda d: d)
        a(cel(m('M66 212 C62 186 90 170 114 178 C122 194 118 214 108 228 C92 234 76 228 66 212 Z'), '#9AA3AD', '#7C8590', 74 if not flip else 226, 190, 0.84))
        a(L(m('M68 208 C80 222 96 226 110 222'), '#FF8A4C', 3))
    # beard (over the chest), head, helm
    a(cel('M110 158 C100 200 112 252 132 288 L150 298 L168 288 C188 252 200 200 190 158 C176 176 124 176 110 158 Z', BD, BDS, 118, 166, 0.88))
    a(L('M130 196 C134 226 140 256 148 282 M170 196 C166 226 160 256 152 282', BDS, 2.5))
    a(S('M128 286 L138 300 L130 330 L120 312 Z', BD, 2.5) + S('M172 286 L162 300 L170 330 L180 312 Z', BD, 2.5))
    a(S('M124 300 L136 304 L134 312 L122 308 Z', '#F4B942', 2) + S('M176 300 L164 304 L166 312 L178 308 Z', '#F4B942', 2))
    a(cel('M116 126 C112 96 188 96 184 126 L184 160 C168 172 132 172 116 160 Z', SK, SKS, 124, 112, 0.88))
    a(S('M120 142 C130 130 144 132 150 140 C156 132 170 130 180 142 C172 152 158 152 150 146 C142 152 128 152 120 142 Z', BD, 2.5))
    a(S('M150 118 C164 118 166 140 150 142 C136 140 136 118 150 118 Z', '#E08B6A', 2.5))
    a(C(134, 118, 3.2, INK, 0) + C(166, 118, 3.2, INK, 0))
    a(S('M122 110 C128 102 140 102 146 108 L140 112 C134 110 128 112 122 114 Z', BD, 2) + S('M178 110 C172 102 160 102 154 108 L160 112 C166 110 172 112 178 114 Z', BD, 2))
    a(cel('M112 106 C110 64 190 64 188 106 C170 98 130 98 112 106 Z', '#9AA3AD', '#7C8590', 124, 76, 0.86))
    a(S('M146 66 L154 66 L156 104 L144 104 Z', '#7C8590', 2.5))
    a(S('M110 104 C130 94 170 94 190 104 L190 112 C170 104 130 104 110 112 Z', '#F4B942', 2.5))
    a(S('M144 104 L156 104 L154 128 L146 128 Z', '#9AA3AD', 2.5))
    return svg('0 0 300 420', ''.join(o), 'Sketch of a stocky dwarf warrior with a braided ginger beard, fur mantle and a huge double axe planted beside him')


# ---------------------------------------------------------------- E: goblin rogue picking a chest
def goblin():
    o = []
    a = o.append
    GS, GSS = '#8DB35B', '#6E9142'
    a(F('M0 0 H520 V300 H0 Z', '#2B3436'))
    for (y0, y1) in [(0, 64), (64, 128), (128, 192)]:
        x = -40 if y0 % 128 == 0 else -100
        while x < 520:
            a(P(f'M{x + 3} {y0 + 3} H{x + 117} V{y1 - 3} H{x + 3} Z', '#303B3D', '#222A2B', 3))
            x += 120
    a(F('M0 230 H520 V300 H0 Z', '#1C2324') + L('M0 230 H520', INK, 4))
    a(L('M0 262 H130 M180 268 H360 M400 260 H520', '#273031', 3))
    # torch
    a(glow(70, 92, 90, '#FF8A4C', 1.2))
    a(S('M62 112 L78 112 L74 150 L66 150 Z', '#6B4528', 3))
    a(S('M70 70 C84 86 82 104 70 110 C58 104 56 86 70 70 Z', '#FF8A4C', 3) + F('M70 86 C76 94 76 102 70 106 C64 102 64 94 70 86 Z', '#FFE08A'))
    # chest
    a(glow(332, 208, 70, '#F4B942', 1.0))
    a(cel('M266 182 C266 146 398 146 398 182 Z', '#8A5A34', '#6B4528', 276, 158, 0.86))
    a(cel('M270 182 L394 182 L394 252 L270 252 Z', '#8A5A34', '#6B4528', 276, 186, 0.86))
    a(S('M286 150 L298 150 L298 252 L286 252 Z', STEEL, 2.5) + S('M366 150 L378 150 L378 252 L366 252 Z', STEEL, 2.5))
    a(L('M268 182 L396 182', INK, 4))
    a(S('M318 190 L346 190 L346 222 L318 222 Z', '#F4B942', 3))
    a(F('M332 198 C337 198 337 206 334 208 L336 216 L328 216 L330 208 C327 206 327 198 332 198 Z', INK))
    a(S(spark(356, 186, 8), '#FFE08A', 1.8) + S(spark(346, 232, 5), '#FFE08A', 1.6) + S(spark(312, 178, 5), '#FFE08A', 1.6))
    for (cx, cy) in [(400, 262), (414, 268), (252, 266), (424, 258)]:
        a(f'<ellipse cx="{cx}" cy="{cy}" rx="9" ry="4" style="fill: #F4B942; stroke: {INK}; stroke-width: 2"/>')
    # goblin body
    a(cel('M156 190 C146 222 152 248 168 258 L224 258 C234 236 232 206 218 186 Z', '#5A4A6E', '#43365A', 164, 196, 0.86))
    a(S('M146 256 L184 256 L186 268 L140 268 Z', '#3A2A20', 2.5) + S('M198 256 L236 256 L240 268 L196 268 Z', '#3A2A20', 2.5))
    a(S('M160 236 L230 236 L230 246 L160 246 Z', '#6B4528', 2.5))
    # dagger with ember flame on the belt
    a(glow(176, 236, 30, '#FF8A4C', 1))
    a(S('M170 226 L182 226 L180 246 L172 246 Z', '#3A2A20', 2.5))
    a(S('M176 228 C162 216 168 200 176 190 C180 202 192 208 184 224 Z', '#FF8A4C', 2.5) + F('M176 222 C172 214 174 206 177 200 C180 208 184 214 180 222 Z', '#FFE08A'))
    # reaching arm and lockpicks
    a(cel('M212 190 C246 190 280 196 306 202 L304 214 C280 210 246 206 214 206 Z', GS, GSS, 216, 194))
    a(C(306, 208, 8, GS, 2.5))
    a(L('M308 202 L330 204 M308 212 L330 210', '#DCE2E8', 2.5))
    # head, ears, hood, face
    a(cel('M174 148 L116 126 L174 164 Z', GS, GSS, 160, 146, 0.8))
    a(cel('M224 140 L274 114 L230 160 Z', GS, GSS, 232, 136, 0.8))
    a(cel('M168 150 C166 122 222 118 228 146 C232 170 214 188 196 188 C178 188 168 170 168 150 Z', GS, GSS, 178, 132, 0.88))
    a(cel('M162 150 C158 106 232 102 236 142 C224 126 204 120 188 122 C176 124 168 134 166 152 Z', '#3F3350', '#2E2440', 176, 118, 0.86))
    a(S('M216 150 C236 152 248 162 240 170 C232 172 224 168 214 164 Z', GS, 2.5))
    a(L('M184 150 C188 147 194 147 198 150', INK, 3))
    a(S('M206 140 C214 138 220 146 214 152 C208 156 202 148 206 140 Z', '#F4E36B', 2.2) + C(210, 146, 2.4, INK, 0))
    a(L('M190 172 C198 176 208 176 214 170', INK, 2.5))
    a(S('M206 172 C206 182 214 184 216 176 Z', '#E8798A', 2))
    return svg('0 0 520 300', ''.join(o), 'Sketch of a hooded goblin rogue picking the glowing lock of a treasure chest in a dungeon, tongue out in concentration')


# ---------------------------------------------------------------- F: the raid set and its faded echo
RAID = dict(plate='#DCE2E8', plsh='#9AA3AD', acc='#B79CFF', acc2='#E9DEFF', tab='#2B2F5E', tabsh='#1F2246', cape='#3A2E6A', capesh='#2A2150', gem='#B79CFF', glow=True, leather='#5A3A2A')
ECHO = dict(plate='#8E909C', plsh='#6E707B', acc='#7D8AA6', acc2='#A9B3C7', tab='#3A3E4E', tabsh='#2C2F3C', cape='#424557', capesh='#33364A', gem='#7D8AA6', glow=False, leather='#4A3E36')


def setfig(dx, p):
    o = []
    a = o.append
    def t(d):  # shift a path right by dx
        out, toks, xturn = [], d.split(), True
        for tk in toks:
            if tk[0].isalpha():
                out.append(tk[0]); rest = tk[1:]; xturn = True
                if not rest:
                    continue
                tk = rest
            v = float(tk)
            out.append(f'{v + dx:g}' if xturn else f'{v:g}')
            xturn = not xturn
        return ' '.join(out).replace('M ', 'M').replace('L ', 'L').replace('C ', 'C').replace('Q ', 'Q')
    if p['glow']:
        a(glow(150 + dx, 210, 140, p['acc'], 0.6))
    a(ground(150 + dx, 398, 92, 11))
    a(cel(t('M104 144 C90 232 82 320 76 396 L224 396 C218 320 210 232 196 144 Z'), p['cape'], p['capesh'], 112 + dx, 160, 0.9))
    a(cel(t('M120 300 L146 300 L144 382 L116 382 Z'), p['plate'], p['plsh'], 124 + dx, 304))
    a(cel(t('M154 300 L180 300 L184 382 L156 382 Z'), p['plate'], p['plsh'], 158 + dx, 304))
    a(cel(t('M110 378 L146 378 L148 398 L100 398 C100 388 104 381 110 378 Z'), p['plate'], p['plsh'], 112 + dx, 382))
    a(cel(t('M154 378 L190 378 C196 381 200 388 200 398 L152 398 Z'), p['plate'], p['plsh'], 158 + dx, 382))
    a(L(t('M118 330 L148 330 M152 330 L182 330'), p['acc'], 3))
    a(cel(t('M128 232 L172 232 L178 372 L150 358 L122 372 Z'), p['tab'], p['tabsh'], 132 + dx, 236, 0.86))
    a(L(t('M130 236 L124 366 M170 236 L176 366'), p['acc'], 3))
    a(S(f'M{150 + dx} 270 A16 16 0 0 0 {150 + dx} 302 A20 20 0 0 1 {150 + dx} 270 Z', p['acc'], 2.5))
    a(cel(t('M112 164 C110 204 116 236 122 258 L178 258 C184 236 190 204 188 164 Z'), p['plate'], p['plsh'], 118 + dx, 170, 0.86))
    a(S(t('M118 250 L182 250 L182 264 L118 264 Z'), p['leather'], 3))
    if p['glow']:
        a(glow(150 + dx, 200, 30, p['gem'], 1.4))
    a(S(t('M150 184 L162 200 L150 216 L138 200 Z'), p['gem'], 2.5))
    a(F(t('M150 190 L156 200 L150 206 Z'), p['acc2']))
    a(L(t('M126 180 C136 192 164 192 174 180'), p['acc'], 3))
    # arms
    a(cel(t('M86 186 L80 258 L104 262 L110 192 Z'), p['plate'], p['plsh'], 90 + dx, 190))
    a(cel(t('M214 186 L220 258 L196 262 L190 192 Z'), p['plate'], p['plsh'], 196 + dx, 190))
    a(S(t('M78 252 C74 266 82 280 94 280 C106 280 110 266 106 254 Z'), p['plsh']))
    a(S(t('M222 252 C226 266 218 280 206 280 C194 280 190 266 194 254 Z'), p['plsh']))
    # pauldrons with crescent fins
    for flip in (False, True):
        m = (lambda d: mirror(d)) if flip else (lambda d: d)
        a(S(t(m('M84 150 C76 126 86 104 106 96 C100 114 100 130 110 140 Z')), p['acc']))
        a(cel(t(m('M72 172 C68 144 96 128 126 138 C130 152 128 168 122 180 C104 186 86 184 72 172 Z')), p['plate'], p['plsh'], (82 if not flip else 218) + dx, 150, 0.84))
        a(L(t(m('M76 168 C92 178 108 180 122 176')), p['acc'], 3))
    # helm with crescent crest
    a(S(t('M140 62 C134 44 142 26 158 18 C152 34 156 48 166 60 Z'), p['acc']))
    a(cel(t('M126 78 C126 54 174 54 174 78 L176 134 C164 144 136 144 124 134 Z'), p['plate'], p['plsh'], 132 + dx, 66, 0.86))
    if p['glow']:
        a(glow(150 + dx, 104, 26, p['acc'], 1.2))
    a(L(t('M134 102 L166 102 M150 104 L150 126'), '#140F1A', 8))
    a(L(t('M136 102 L164 102 M150 104 L150 124'), p['acc'] if p['glow'] else '#5A5E6E', 3.5))
    return ''.join(o)


def sets():
    body = setfig(0, RAID) + setfig(220, ECHO)
    lab = 'font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 22px'
    body += f'<text x="150" y="30" text-anchor="middle" style="{lab}; fill: #E9DEFF">Raid drop</text>'
    body += f'<text x="370" y="30" text-anchor="middle" style="{lab}; fill: #A9B3C7">Echo from old runs</text>'
    return svg('0 0 520 420', body, 'Two knights in the same moon-crested plate: the raid version gleaming silver and violet, the echo version faded grey')


# ---------------------------------------------------------------- G: the tavern hub (phone)
def tavern():
    o = []
    a = o.append
    W_, H_ = 390, 844
    a(F(f'M0 0 H{W_} V560 H0 Z', '#4A3122'))
    for x in range(0, W_, 46):
        a(L(f'M{x} 0 V560', '#3A2619', 3))
    a(S('M-4 118 H394 V144 H-4 Z', '#3A2619', 3.5))
    a(S('M-4 18 H394 V40 H-4 Z', '#3A2619', 3.5))
    # fireplace
    a(cel('M108 560 L108 300 C108 268 282 268 282 300 L282 560 Z', '#7A7480', '#5E5966', 118, 290, 0.9))
    for (y, off) in [(330, 0), (370, 22), (410, 0), (450, 22), (490, 0), (530, 22)]:
        a(L(f'M108 {y} H282', '#4F4A57', 3))
        for x in range(116 + off, 282, 44):
            a(L(f'M{x} {y - 40} V{y}', '#4F4A57', 3))
    a(S('M138 560 L138 384 C138 352 252 352 252 384 L252 560 Z', '#1A1214', 3.5))
    a(glow(195, 520, 150, '#FF8A4C', 1.3))
    a(S('M160 560 C150 520 166 490 178 470 C182 494 196 500 194 520 C204 506 204 486 200 468 C222 494 236 526 226 560 Z', '#FF8A4C', 3))
    a(S('M176 560 C170 536 180 520 188 508 C192 526 204 532 204 560 Z', '#FFE08A', 2.5))
    a(S('M96 296 H294 V314 H96 Z', '#6B4528', 3.5))
    a(glow(130, 270, 30, '#F4B942', 1.2) + S('M124 272 H136 V296 H124 Z', '#EDE3CC', 2.5) + S('M130 256 C136 264 134 270 130 272 C126 270 124 264 130 256 Z', '#F4B942', 2))
    a(glow(260, 270, 30, '#F4B942', 1.2) + S('M254 278 H266 V296 H254 Z', '#EDE3CC', 2.5) + S('M260 262 C266 270 264 276 260 278 C256 276 254 270 260 262 Z', '#F4B942', 2))
    a(S('M180 296 L184 280 L190 288 L195 276 L200 288 L206 280 L210 296 Z', '#F4B942', 2.5))
    # lanterns on chains
    for lx in (58, 332):
        a(L(f'M{lx} 144 V176', INK, 3))
        a(glow(lx, 196, 60, '#F4B942', 1.3))
        a(S(f'M{lx - 14} 178 H{lx + 14} L{lx + 10} 214 H{lx - 10} Z', '#F4B942', 3))
        a(F(f'M{lx - 7} 184 H{lx + 7} L{lx + 5} 208 H{lx - 5} Z', '#FFF3C4'))
    # notice board with the raid poster
    a(S('M300 340 H376 V448 H300 Z', '#A07A4E', 3.5))
    a(S('M310 350 H366 V438 H310 Z', '#EDE3CC', 2.5))
    a('<text x="338" y="378" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 17px; fill: #2A1A22">RAID</text>')
    a('<text x="338" y="398" text-anchor="middle" style="font-family: \'DM Mono\', monospace; font-size: 9px; fill: #6B4528">FRIDAY</text>')
    a(C(338, 418, 9, '#B8483A', 2.5))
    # floor, bar and innkeeper
    a(F(f'M0 560 H{W_} V{H_} H0 Z', '#2E2119') + L(f'M0 560 H{W_}', INK, 4))
    for y in (600, 650, 710, 780):
        a(L(f'M0 {y} H{W_}', '#241A13', 3))
    a(cel('M30 470 C28 440 82 438 84 470 C84 494 70 506 57 506 C44 506 30 494 30 470 Z', '#E8B48A', '#C98F66', 38, 456, 0.88))
    a(S('M36 478 C44 470 52 472 57 478 C62 472 70 470 78 478 C70 486 62 486 57 482 C52 486 44 486 36 478 Z', '#5A3A2A', 2.5))
    a(C(46, 466, 2.6, INK, 0) + C(68, 466, 2.6, INK, 0))
    a(cel('M26 506 C24 530 22 556 22 580 H92 C92 556 90 530 88 506 Z', '#EDE3CC', '#D6C6A4', 32, 510, 0.88))
    a(cel('M0 560 H150 V650 H0 Z', '#6B4528', '#4F3320', 6, 566, 0.9))
    a(S('M-4 550 H158 V566 H-4 Z', '#8A5A34', 3.5))
    for mx in (110, 134):
        a(S(f'M{mx - 10} 524 H{mx + 10} V550 H{mx - 10} Z', '#C9963A', 2.5) + F(f'M{mx - 10} 524 H{mx + 10} V530 H{mx - 10} Z', '#FFF3C4'))
    # table and candle
    a(glow(212, 640, 70, '#F4B942', 1.1))
    a(cel('M120 664 H310 L296 700 H134 Z', '#8A5A34', '#6B4528', 128, 666, 0.9))
    a(S('M142 700 H158 V744 H142 Z', '#6B4528', 3) + S('M272 700 H288 V744 H272 Z', '#6B4528', 3))
    a(S('M206 628 H218 V664 H206 Z', '#EDE3CC', 2.5) + S('M212 610 C218 620 216 626 212 628 C208 626 206 620 212 610 Z', '#F4B942', 2))
    a(S('M160 640 H180 V664 H160 Z', '#C9963A', 2.5) + S('M246 644 H264 V664 H246 Z', '#C9963A', 2.5))
    # UI: top pills
    a(f'<rect x="14" y="50" width="104" height="34" rx="17" style="fill: #16121C; stroke: #4E4160; stroke-width: 2; opacity: 0.92"/>')
    a(C(34, 67, 9, '#F4B942', 2.5))
    a('<text x="50" y="73" style="font-family: \'DM Mono\', monospace; font-size: 15px; font-weight: 500; fill: #F6E9D2">1,240</text>')
    a(f'<rect x="196" y="50" width="180" height="34" rx="17" style="fill: #16121C; stroke: #4E4160; stroke-width: 2; opacity: 0.92"/>')
    a('<text x="286" y="72" text-anchor="middle" style="font-family: \'DM Mono\', monospace; font-size: 12px; letter-spacing: 1px; fill: #F4B942">RAID · FRI 8:30PM</text>')
    # UI: bottom bar
    a(F(f'M0 752 H{W_} V{H_} H0 Z', '#16121C', 0.94) + L(f'M0 752 H{W_}', '#3B3146', 2))
    icons = {
        'Dungeons': S('M-12 14 V-6 C-12 -18 12 -18 12 -6 V14 Z', '#5A3A2A', 2.5) + C(6, 4, 2, '#F4B942', 0),
        'Raid': S('M-14 10 L-14 -8 L-6 0 L0 -12 L6 0 L14 -8 L14 10 Z', '#F4B942', 2.5),
        'Shop': S('M-12 -4 C-14 14 14 14 12 -4 C8 -8 -8 -8 -12 -4 Z', '#C9963A', 2.5) + L('M-6 -8 L0 -14 L6 -8', INK, 2.5),
        'Collection': S('M-14 -6 H14 V12 H-14 Z', '#8A5A34', 2.5) + S('M-14 -6 C-14 -16 14 -16 14 -6 Z', '#8A5A34', 2.5) + C(0, 2, 3, '#F4B942', 1.5),
    }
    for i, (name, ic) in enumerate(icons.items()):
        cx = 49 + i * 97
        a(f'<rect x="{cx - 42}" y="764" width="84" height="64" rx="14" style="fill: #211B29; stroke: #4E4160; stroke-width: 2"/>')
        a(f'<g transform="translate({cx} 790)">{ic}</g>')
        a(f'<text x="{cx}" y="820" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 13px; fill: #F6E9D2">{name}</text>')
    return svg(f'0 0 {W_} {H_}', ''.join(o), 'Phone mockup of the tavern hub: fireplace, innkeeper at the bar, a raid poster on the notice board, and four buttons for dungeons, raid, shop and collection')


# ---------------------------------------------------------------- H: a dungeon pull (phone)
def skeleton(x, base, s=1.0, flip=1):
    o = []
    a = o.append
    B = '#E9E2D0'
    def p(px, py):
        return f'{x + px * s * flip:.1f} {base - py * s:.1f}'
    a(inked(f'M{p(-10, 0)} L{p(-8, 40)} M{p(10, 0)} L{p(8, 40)}', B, 5))
    a(inked(f'M{p(0, 44)} L{p(0, 92)}', B, 5))
    a(S(f'M{p(-14, 40)} L{p(14, 40)} L{p(10, 50)} L{p(-10, 50)} Z', B, 2.5))
    a(inked(f'M{p(-16, 84)} C{p(-20, 74)} {p(-18, 64)} {p(-12, 58)} M{p(16, 84)} C{p(20, 74)} {p(18, 64)} {p(12, 58)}', B, 3.5))
    a(inked(f'M{p(-12, 88)} L{p(-26, 60)} L{p(-30, 40)} M{p(12, 88)} L{p(26, 66)}', B, 4))
    a(inked(f'M{p(26, 66)} L{p(44, 104)}', '#9C6B3E', 4))
    a(S(f'M{p(40, 100)} L{p(52, 132)} L{p(48, 134)} L{p(38, 104)} Z', '#B3916A', 2))
    a(S(f'M{p(-16, 106)} C{p(-18, 128)} {p(18, 128)} {p(16, 106)} L{p(12, 92)} L{p(-12, 92)} Z', B, 3))
    a(C(*[float(v) for v in p(-6, 112).split()], 4.5, '#140F1A', 0) + C(*[float(v) for v in p(6, 112).split()], 4.5, '#140F1A', 0))
    a(C(*[float(v) for v in p(-6, 112).split()], 2, '#9BD068', 0) + C(*[float(v) for v in p(6, 112).split()], 2, '#9BD068', 0))
    a(L(f'M{p(-8, 98)} L{p(8, 98)}', INK, 2))
    return ''.join(o)


def backview(x, base, kind):
    o = []
    a = o.append
    if kind == 'knight':
        a(cel(f'M{x - 44} {base} C{x - 40} {base - 50} {x - 36} {base - 90} {x - 30} {base - 110} L{x + 30} {base - 110} C{x + 36} {base - 90} {x + 40} {base - 50} {x + 44} {base} Z', '#3D2C5C', '#291E40', x - 36, base - 100, 0.9))
        for sgn in (-1, 1):
            a(cel(f'M{x + sgn * 8} {base - 104} C{x + sgn * 30} {base - 128} {x + sgn * 56} {base - 118} {x + sgn * 54} {base - 96} C{x + sgn * 40} {base - 90} {x + sgn * 22} {base - 92} {x + sgn * 8} {base - 96} Z', '#5E5670', PSHADE, x + sgn * 20, base - 112, 0.84))
            a(S(f'M{x + sgn * 36} {base - 120} L{x + sgn * 48} {base - 146} L{x + sgn * 46} {base - 118} Z', STEEL, 2.5))
        a(cel(f'M{x - 16} {base - 108} C{x - 18} {base - 140} {x + 18} {base - 140} {x + 16} {base - 108} Z', '#544C63', PSHADE, x - 10, base - 130, 0.86))
        a(cel(f'M{x - 14} {base - 130} C{x - 30} {base - 134} {x - 40} {base - 148} {x - 38} {base - 166} C{x - 32} {base - 152} {x - 24} {base - 144} {x - 12} {base - 140} Z', '#E9E2D0', '#BDB3A0', x - 20, base - 140, 0.8))
        a(cel(f'M{x + 14} {base - 130} C{x + 30} {base - 134} {x + 40} {base - 148} {x + 38} {base - 166} C{x + 32} {base - 152} {x + 24} {base - 144} {x + 12} {base - 140} Z', '#E9E2D0', '#BDB3A0', x + 20, base - 140, 0.8))
    elif kind == 'wizard':
        a(cel(f'M{x - 30} {base} C{x - 28} {base - 40} {x - 24} {base - 70} {x - 20} {base - 86} L{x + 20} {base - 86} C{x + 24} {base - 70} {x + 28} {base - 40} {x + 30} {base} Z', '#2F4C8C', '#21366A', x - 22, base - 80, 0.88))
        a(cel(f'M{x - 40} {base - 86} C{x - 26} {base - 96} {x + 26} {base - 96} {x + 40} {base - 86} C{x + 26} {base - 78} {x - 26} {base - 78} {x - 40} {base - 86} Z', '#26315E', '#1A2246', x - 30, base - 90, 0.9))
        a(cel(f'M{x - 20} {base - 88} C{x - 16} {base - 116} {x - 6} {base - 136} {x + 6} {base - 146} C{x + 16} {base - 152} {x + 28} {base - 150} {x + 34} {base - 140} C{x + 24} {base - 142} {x + 16} {base - 134} {x + 14} {base - 124} C{x + 18} {base - 110} {x + 20} {base - 98} {x + 20} {base - 88} Z', '#26315E', '#1A2246', x - 12, base - 120, 0.86))
        a(S(star5(x - 2, base - 112, 5), '#F4B942', 1.5))
        a(inked(f'M{x + 34} {base} L{x + 30} {base - 104}', '#7A5230', 4))
        a(glow(x + 30, base - 112, 30, '#8FD6FF', 1.2) + S(f'M{x + 30} {base - 124} L{x + 38} {base - 112} L{x + 30} {base - 100} L{x + 22} {base - 112} Z', '#BFE8FF', 2.5))
    else:
        a(cel(f'M{x - 32} {base} C{x - 30} {base - 44} {x - 26} {base - 76} {x - 22} {base - 90} L{x + 22} {base - 90} C{x + 26} {base - 76} {x + 30} {base - 44} {x + 32} {base} Z', '#3F8F88', '#2D6C66', x - 24, base - 84, 0.88))
        a(cel(f'M{x - 24} {base - 86} C{x - 26} {base - 124} {x + 26} {base - 124} {x + 24} {base - 86} C{x + 10} {base - 80} {x - 10} {base - 80} {x - 24} {base - 86} Z', '#3F8F88', '#2D6C66', x - 16, base - 112, 0.86))
        a(L(f'M{x - 24} {base - 88} C{x - 10} {base - 82} {x + 10} {base - 82} {x + 24} {base - 88}', '#F4B942', 3))
        a(inked(f'M{x - 34} {base} L{x - 30} {base - 112}', '#8A5A34', 4))
        a(glow(x - 30, base - 124, 34, '#F4B942', 1.2) + S(f'M{x - 38} {base - 136} H{x - 22} L{x - 24} {base - 114} H{x - 36} Z', '#F4B942', 2.5))
    return ''.join(o)


def dungeon():
    o = []
    a = o.append
    W_, H_ = 390, 844
    a(F(f'M0 0 H{W_} V480 H0 Z', '#3E3550'))
    for r, (y0, y1) in enumerate([(96, 156), (156, 216), (216, 276), (276, 336), (336, 396), (396, 456)]):
        x = -30 if r % 2 == 0 else -80
        while x < W_:
            a(P(f'M{x + 3} {y0 + 3} H{x + 97} V{y1 - 3} H{x + 3} Z', '#443A58', '#2E2740', 3))
            x += 100
    a(S('M120 482 L120 262 C120 206 270 206 270 262 L270 482 Z', '#17121F', 4))
    a(F(f'M0 480 H{W_} V{H_} H0 Z', '#2A2436') + L(f'M0 480 H{W_}', INK, 4))
    for xb in (-160, -40, 80, 195, 310, 430, 550):
        a(L(f'M{xb} {H_} L{195 + (xb - 195) * 0.42:.0f} 480', '#231E2E', 3))
    for y in (540, 620, 720):
        a(L(f'M0 {y} H{W_}', '#231E2E', 3))
    for tx in (58, 332):
        a(glow(tx, 196, 80, '#FF8A4C', 1.2))
        a(S(f'M{tx - 7} 210 H{tx + 7} L{tx + 4} 246 H{tx - 4} Z', '#6B4528', 3))
        a(S(f'M{tx} 174 C{tx + 13} 190 {tx + 11} 204 {tx} 210 C{tx - 11} 204 {tx - 13} 190 {tx} 174 Z', '#FF8A4C', 3))
    # chest in the corner
    a(glow(338, 520, 40, '#F4B942', 0.8))
    a(cel('M308 506 C308 488 368 488 368 506 Z', '#8A5A34', '#6B4528', 314, 494, 0.86))
    a(cel('M310 506 H366 V540 H310 Z', '#8A5A34', '#6B4528', 314, 508, 0.86))
    a(S('M332 512 H344 V526 H332 Z', '#F4B942', 2.5))
    # mobs
    a(skeleton(96, 470, 0.95, 1))
    a(skeleton(292, 470, 0.95, -1))
    a(skeleton(196, 456, 1.1, 1))
    for (bx, by) in [(96, 340), (196, 312), (292, 340)]:
        a(f'<rect x="{bx - 26}" y="{by}" width="52" height="7" rx="3.5" style="fill: #0E0B12; stroke: {INK}; stroke-width: 1.5"/>')
    a(f'<rect x="70" y="340" width="34" height="7" rx="3.5" style="fill: #FF6B5E"/>')
    a(f'<rect x="170" y="312" width="20" height="7" rx="3.5" style="fill: #FF6B5E"/>')
    a(f'<rect x="266" y="340" width="52" height="7" rx="3.5" style="fill: #FF6B5E"/>')
    # hit effects
    a(inked('M168 360 C190 380 214 404 232 438', '#FFF3D6', 7))
    a(S(spark(214, 392, 14), '#FFE08A', 2) + S(spark(236, 368, 7), '#FFE08A', 1.6))
    a('<text x="250" y="300" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 34px; fill: #F4B942; stroke: #2A1A22; stroke-width: 6px; paint-order: stroke">1,204</text>')
    a('<text x="250" y="318" text-anchor="middle" style="font-family: \'DM Mono\', monospace; font-size: 11px; letter-spacing: 2px; fill: #F4B942; stroke: #2A1A22; stroke-width: 4px; paint-order: stroke">CRIT</text>')
    a(glow(276, 412, 26, '#8FD6FF', 1.3) + L('M200 560 C230 500 252 450 270 418', '#8FD6FF', 3, 0.6) + C(276, 412, 9, '#8FD6FF', 2.5))
    # party from behind
    a(backview(118, 712, 'wizard'))
    a(backview(272, 712, 'cleric'))
    a(backview(195, 736, 'knight'))
    # UI top
    a(f'<rect x="14" y="44" width="362" height="58" rx="14" style="fill: #16121C; stroke: #3B3146; stroke-width: 2; opacity: 0.92"/>')
    a('<text x="30" y="68" style="font-family: \'IM Fell English SC\', Georgia, serif; font-size: 18px; fill: #F6E9D2">The Sunken Crypt</text>')
    a('<text x="360" y="68" text-anchor="end" style="font-family: \'DM Mono\', monospace; font-size: 11px; letter-spacing: 1px; fill: #A8977F">PULL 2 OF 4</text>')
    for i in range(4):
        col = '#9BD068' if i == 0 else ('#F4B942' if i == 1 else '#2A2234')
        a(f'<rect x="{30 + i * 84}" y="80" width="76" height="8" rx="4" style="fill: {col}"/>')
    # UI bottom: pulse + tiles
    a(F(f'M0 756 H{W_} V{H_} H0 Z', '#16121C', 0.9))
    a(f'<rect x="14" y="766" width="362" height="6" rx="3" style="fill: #0E0B12"/><rect x="14" y="766" width="230" height="6" rx="3" style="fill: #8FD6FF"/>')
    for i, k in enumerate(['chop', 'overhead', 'shout', 'taunt', 'shatter', 'ult']):
        t = TILES[k].replace('<svg viewBox="0 0 64 64" aria-hidden="true">', f'<svg x="{14 + i * 62}" y="780" width="54" height="54" viewBox="0 0 64 64">')
        t = t.replace('<rect width="64" height="64" style=', '<rect width="64" height="64" rx="11" style=', 1)
        a(t)
        a(f'<rect x="{14 + i * 62}" y="780" width="54" height="54" rx="9" style="fill: none; stroke: {INK}; stroke-width: 2.5"/>')
    return svg(f'0 0 {W_} {H_}', ''.join(o), 'Phone mockup of a dungeon pull: three skeletons in a purple crypt, a crit number, a frost bolt, the party seen from behind and the action bar')



# ---------------------------------------------------------------- the same drawing, four ways
def _hls(fn):
    def f(h):
        r, g, b = hexrgb(h)
        hh, l, ss = colorsys.rgb_to_hls(r, g, b)
        return rgbhex(*colorsys.hls_to_rgb(*fn(hh, l, ss)))
    return f


STYLES = {
    'tv': dict(name='TV cartoon', line='Thin black lines, flat colour, no shading. Closest to the Marge Gamer episode.',
               ink='#141016', ow=2.3, shade='flat', glow=0.25,
               color=_hls(lambda h, l, s: (h, l + (1 - l) * 0.1, min(1, s * 1.2)))),
    'epic': dict(name='Chunky epic', line='Warm thick lines, one shadow tone, things glow. What the sketches below use.',
                 ink='#2A1A22', ow=3.5, shade='cel', glow=1.0, color=None),
    'comic': dict(name='Dark comic', line='Heavy black shadows, fat lines, glows that pop. Moodier and more metal.',
                  ink='#0B0810', ow=5.0, shade='comic', glow=1.6,
                  color=_hls(lambda h, l, s: (h, l * 0.9, s * 0.85))),
    'story': dict(name='Storybook', line='Soft lines, muted colour, gentle light. Cosier, like a picture book.',
                  ink='#5E4B57', ow=2.4, shade='soft', glow=0.8,
                  color=lambda hx: mix(_hls(lambda h, l, s: (h, l + (1 - l) * 0.02, s * 0.72))(hx), '#F2D7B0', 0.08)),
}


def render(fn, key):
    st = STYLES[key]
    old = dict(STYLE)
    STYLE.update(shade=st['shade'], glow=st['glow'])
    try:
        out = fn()
    finally:
        STYLE.clear()
        STYLE.update(old)
    if st['color']:
        out = re.sub(r'#[0-9A-Fa-f]{6}', lambda m: m.group(0) if m.group(0).upper() == INK else st['color'](m.group(0)), out)
    out = out.replace(INK, st['ink'])
    k = st['ow'] / OW
    out = re.sub(r'stroke-width: ([0-9.]+)', lambda m: f'stroke-width: {float(m.group(1)) * k:.2f}', out)
    return out.replace('aria-label="', 'aria-label="' + st['name'] + ' version: ', 1)

PIECES = {
    'warden': warden, 'cleric': cleric, 'wizard': wizard, 'dwarf': dwarf,
    'goblin': goblin, 'sets': sets, 'tavern': tavern, 'dungeon': dungeon,
}

if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[2] == 'styles':
    cells = []
    for key in STYLES:
        cells.append('<div style="width:520px;display:flex;gap:8px;background:#211B29;border:2px solid #3B3146;border-radius:14px;padding:8px"><div style="width:250px">' + render(warden, key) + '</div><div style="width:250px">' + render(cleric, key) + '</div></div>')
    open(sys.argv[1], 'w').write('<div style="display:flex;flex-wrap:wrap;gap:16px">' + ''.join(cells) + '</div>')
    print('ok styles')
elif __name__ == '__main__':
    out = sys.argv[1]
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else list(PIECES)
    cells = []
    for k in only:
        w = 300 if k in ('warden', 'cleric', 'wizard', 'dwarf') else (520 if k in ('goblin', 'sets') else 300)
        cells.append(f'<div style="width:{w}px;background:#211B29;border:2px solid #3B3146;border-radius:14px;overflow:hidden">{PIECES[k]()}</div>')
    open(out, 'w').write('<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">' + ''.join(cells) + '</div>')
    print('ok', {k: len(PIECES[k]()) for k in only})
