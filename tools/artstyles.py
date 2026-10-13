# The same dwarf warrior drawn in six genuinely different art styles (different construction, not filters).
# Usage: artstyles.py out_fragment.html
import math, sys

VB = '0 0 300 420'


def path(d, fill='none', ink=None, w=0, op=None):
    st = [f'fill: {fill}']
    if ink and w:
        st.append(f'stroke: {ink}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round')
    if op is not None:
        st.append(f'opacity: {op}')
    return f'<path d="{d}" style="{"; ".join(st)}"/>'


def scaled(d, fill, px, py, s, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<path d="{d}" transform="translate({px} {py}) scale({s}) translate({-px} {-py})" style="fill: {fill}{o}"/>'


def rect(x, y, w, h, fill, op=None, rx=0):
    o = f'; opacity: {op}' if op is not None else ''
    r = f' rx="{rx}"' if rx else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}"{r} style="fill: {fill}{o}"/>'


def circle(cx, cy, r, fill, ink=None, w=0, op=None):
    st = [f'fill: {fill}']
    if ink and w:
        st.append(f'stroke: {ink}; stroke-width: {w}')
    if op is not None:
        st.append(f'opacity: {op}')
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" style="{"; ".join(st)}"/>'


def ellipse(cx, cy, rx, ry, fill, ink=None, w=0, op=None):
    st = [f'fill: {fill}']
    if ink and w:
        st.append(f'stroke: {ink}; stroke-width: {w}')
    if op is not None:
        st.append(f'opacity: {op}')
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" style="{"; ".join(st)}"/>'


def svg(body, label):
    return f'<svg viewBox="{VB}" role="img" aria-label="{label}" style="display: block; width: 100%; height: auto;">{body}</svg>'


def mirror(d, axis=150):
    out, xturn = [], True
    for t in d.split():
        if t[0].isalpha():
            out.append(t[0]); t = t[1:]; xturn = True
            if not t:
                continue
        v = float(t)
        out.append(f'{2 * axis - v:g}' if xturn else f'{v:g}')
        xturn = not xturn
    return ' '.join(out).replace('M ', 'M').replace('L ', 'L').replace('C ', 'C').replace('Q ', 'Q').replace('H ', 'H').replace('V ', 'V')


def pt(p):
    return f'{p[0]:.1f} {p[1]:.1f}'


def blade(c, u, n, L, half_in, half_out, bulge):
    """Axe blade polygon from the socket at c, pointing along n; u runs along the handle."""
    P = lambda a, b: (c[0] + u[0] * a + n[0] * b, c[1] + u[1] * a + n[1] * b)
    return (f'M{pt(P(half_in, 0))} L{pt(P(half_out, L))} Q{pt(P(0, L + bulge))} {pt(P(-half_out, L))} '
            f'L{pt(P(-half_in, 0))} Z')


# ---------------------------------------------------------------- 1. TV cartoon: simple shapes, thin black line, flat colour
def tv():
    K, W = '#1E1A1A', 3
    s = lambda d, f: path(d, f, K, W)
    o = [rect(0, 0, 300, 420, '#BFE3F2')]
    o.append(s('M40 90 C40 74 62 70 70 80 C76 66 100 66 104 82 C118 80 124 98 112 104 L46 104 C34 104 32 92 40 90 Z', '#FFFFFF'))
    o.append(s('M-10 300 C60 250 140 270 200 286 C240 276 280 262 310 270 L310 430 L-10 430 Z', '#8CC56A'))
    o.append(s('M-10 352 C80 340 220 344 310 350 L310 430 L-10 430 Z', '#6FAE4E'))
    # axe
    o.append(s('M220 378 L220 176 L228 176 L228 378 Z', '#8A5A34'))
    o.append(s('M228 180 C250 172 270 186 272 212 C258 214 244 212 228 220 Z', '#C9CFD8'))
    o.append(s('M220 190 L204 198 L220 206 Z', '#C9CFD8'))
    # legs and boots
    o.append(s('M118 330 H146 V362 H118 Z', '#7A5A3A') + s('M154 330 H182 V362 H154 Z', '#7A5A3A'))
    o.append(s('M112 358 H148 V380 H102 C102 368 106 360 112 358 Z', '#5B3B2A'))
    o.append(s('M152 358 H188 C194 360 198 368 198 380 H152 Z', '#5B3B2A'))
    # body
    o.append(s('M100 230 C96 270 100 310 112 336 H188 C200 310 204 270 200 230 C190 220 110 220 100 230 Z', '#3F6FB5'))
    o.append(s('M116 236 C114 262 118 284 126 300 H174 C182 284 186 262 184 236 Z', '#B9C2CC'))
    o.append(s('M104 300 H196 V318 H104 Z', '#6B4528') + s('M142 302 H158 V316 H142 Z', '#F4B942'))
    o.append(s('M104 236 C88 250 80 266 82 278 C86 290 98 298 108 302 L114 290 C104 284 98 278 98 272 C100 262 108 254 114 248 Z', '#3F6FB5'))
    o.append(circle(110, 298, 10, '#F2B48C', K, W))
    o.append(s('M196 236 C208 252 216 272 220 290 L234 288 C230 266 220 246 208 230 Z', '#3F6FB5'))
    o.append(s('M214 286 C212 300 220 308 228 306 C238 304 240 292 236 284 Z', '#F2B48C'))
    # head
    o.append(s('M112 170 C112 132 188 132 188 170 C188 200 172 214 150 214 C128 214 112 200 112 170 Z', '#F2B48C'))
    o.append(s('M114 186 C110 220 124 254 150 268 C176 254 190 220 186 186 C176 200 124 200 114 186 Z', '#E0662B'))
    o.append(path('M134 216 C138 232 144 246 150 254 M166 216 C162 232 156 246 150 254', 'none', K, 2.2))
    o.append(s('M122 194 C132 186 146 188 150 194 C154 188 168 186 178 194 C170 202 156 202 150 198 C144 202 130 202 122 194 Z', '#C4521F'))
    o.append(s('M150 164 C164 164 168 188 150 190 C132 188 136 164 150 164 Z', '#E59A78'))
    for ex, px in ((132, 134), (168, 166)):
        o.append(ellipse(ex, 168, 7, 8, '#FFFFFF', K, 2.5) + circle(px, 170, 3, K))
    o.append(path('M122 155 L142 160 M178 155 L158 160', 'none', '#C4521F', 6))
    o.append(s('M108 146 C108 100 192 100 192 146 Z', '#B9C2CC'))
    o.append(s('M104 140 H196 V152 H104 Z', '#9AA3AD'))
    o.append(s('M146 150 H154 V168 H146 Z', '#9AA3AD'))
    o.append(s('M112 124 C100 116 94 100 98 86 C106 100 114 108 124 112 Z', '#F3E9D2'))
    o.append(s('M188 124 C200 116 206 100 202 86 C194 100 186 108 176 112 Z', '#F3E9D2'))
    return svg(''.join(o), 'TV cartoon style: a dwarf drawn with simple shapes, thin black lines and flat colour, standing on a green hill')


# ---------------------------------------------------------------- 2. Chunky heroic: huge shoulders, painted light, no lines
def paint(d, mid, shade, light, px, py, s1=0.86, s2=0.42, lop=0.85):
    return path(d, shade) + scaled(d, mid, px, py, s1) + scaled(d, light, px, py, s2, lop)


def heroic():
    o = [rect(0, 0, 300, 420, '#2B2240')]
    for y, h, c in [(110, 90, '#35284B'), (200, 60, '#4A3258'), (260, 40, '#6E425D'), (300, 30, '#9E555C'), (330, 20, '#D9775A')]:
        o.append(rect(0, y, 300, h, c))
    o.append(circle(150, 350, 74, '#F4B26A', op=0.55))
    o.append(rect(0, 348, 300, 72, '#211A2A') + rect(0, 348, 300, 4, '#3E2E44'))
    o.append(ellipse(152, 394, 96, 10, '#120E17', op=0.7))
    STL, STS, STH = '#8F99A6', '#5A626E', '#D6DEE6'
    # axe behind the body: handle and double head
    c = (248, 150)
    ux, uy = 52, -164
    ln = math.hypot(ux, uy); u = (ux / ln, uy / ln); n = (-u[1], u[0])
    o.append(path('M198 306 L252 136', 'none', '#4A2E1A', 12) + path('M196 304 L250 134', 'none', '#8A5A34', 6))
    for sgn in (1, -1):
        nn = (n[0] * sgn, n[1] * sgn)
        d = blade(c, u, nn, 46, 10, 34, 16)
        o.append(path(d, STS) + scaled(d, '#B7C1CC', c[0], c[1], 0.9))
        P = lambda a, b: (c[0] + u[0] * a + nn[0] * b, c[1] + u[1] * a + nn[1] * b)
        o.append(path(f'M{pt(P(30, 44))} Q{pt(P(0, 60))} {pt(P(-30, 44))}', 'none', '#F2F6FA', 3))
    o.append(path(f'M{pt((c[0] + u[0] * 15 + n[0] * 9, c[1] + u[1] * 15 + n[1] * 9))} L{pt((c[0] + u[0] * 15 - n[0] * 9, c[1] + u[1] * 15 - n[1] * 9))} '
                  f'L{pt((c[0] - u[0] * 15 - n[0] * 9, c[1] - u[1] * 15 - n[1] * 9))} L{pt((c[0] - u[0] * 15 + n[0] * 9, c[1] - u[1] * 15 + n[1] * 9))} Z', '#4B4458'))
    # legs
    o.append(paint('M104 336 H148 V394 H92 C92 372 96 352 104 336 Z', '#6E7886', '#454C57', '#A3ADB8', 104, 340))
    o.append(paint('M152 336 H196 C204 352 208 372 208 394 H152 Z', '#6E7886', '#454C57', '#A3ADB8', 158, 340))
    # tabard, torso, trim, belt
    o.append(paint('M112 300 H188 L198 362 L150 350 L102 362 Z', '#A6352B', '#741F1A', '#D9574A', 118, 304))
    o.append(paint('M86 204 C76 262 90 312 108 330 H192 C210 312 224 262 214 204 C192 186 108 186 86 204 Z', STL, STS, STH, 100, 204))
    o.append(paint('M96 250 C120 262 180 262 204 250 L202 264 C180 276 120 276 98 264 Z', '#E0A63A', '#A8741C', '#FFE08A', 110, 252, 0.9, 0.5))
    o.append(paint('M98 300 H202 V322 H98 Z', '#6B4528', '#3F2817', '#8E5E38', 104, 302, 0.9, 0.5))
    o.append(paint('M136 311 L143 298 H157 L164 311 L157 324 H143 Z', '#E0A63A', '#A8741C', '#FFE08A', 142, 302, 0.88, 0.45))
    # arms and gauntlets
    o.append(paint('M62 226 L52 292 L92 298 L100 232 Z', STL, STS, STH, 66, 230))
    o.append(paint('M42 286 C34 318 58 336 80 332 C100 328 106 306 98 288 Z', '#6E7886', '#454C57', '#A3ADB8', 50, 290))
    o.append(paint('M196 232 L222 290 L192 306 L176 242 Z', STL, STS, STH, 188, 238))
    o.append(path('M206 300 L194 342', 'none', '#4A2E1A', 12) + path('M205 300 L193 341', 'none', '#8A5A34', 6))
    o.append(paint('M182 288 C176 312 196 330 214 326 C232 320 234 298 224 284 Z', '#6E7886', '#454C57', '#A3ADB8', 190, 290))
    # pauldrons with gold trim and spikes
    for flip in (False, True):
        m = (lambda d: mirror(d)) if flip else (lambda d: d)
        o.append(path(m('M62 150 L56 112 L80 142 Z'), '#E0A63A') + path(m('M92 140 L96 100 L110 138 Z'), '#E0A63A'))
        o.append(paint(m('M34 214 C26 160 78 130 132 150 C142 178 134 208 118 228 C90 240 54 236 34 214 Z'), STL, STS, STH, 50 if not flip else 250, 160, 0.86, 0.45))
        o.append(path(m('M38 210 C62 230 98 232 122 222'), 'none', '#E0A63A', 7))
    # head: face, helm, beard
    o.append(paint('M124 170 C122 142 178 142 176 170 L176 190 C166 202 134 202 124 190 Z', '#E59A78', '#B66A4E', '#F7C2A2', 130, 160))
    o.append(path('M122 166 H178 V178 C166 183 134 183 122 178 Z', '#8E4E38'))
    o.append(rect(135, 171, 7, 3, '#FFF3C4') + rect(158, 171, 7, 3, '#FFF3C4'))
    o.append(paint('M150 170 C162 170 166 192 150 194 C134 192 138 170 150 170 Z', '#E59A78', '#B66A4E', '#F7C2A2', 144, 172, 0.86, 0.5))
    o.append(paint('M116 170 C112 118 188 118 184 170 L178 198 L172 168 C166 150 134 150 128 168 L122 198 Z', STL, STS, STH, 128, 128, 0.88, 0.45))
    o.append(path('M146 104 H154 V160 H146 Z', '#E0A63A'))
    o.append(paint('M120 188 C108 232 120 272 144 304 L150 316 L156 304 C180 272 192 232 180 188 C168 200 132 200 120 188 Z', '#D9622B', '#9E3F15', '#F5935A', 128, 196))
    o.append(path('M118 196 C132 186 146 190 150 198 C154 190 168 186 182 196 C176 208 160 210 150 204 C140 210 124 208 118 196 Z', '#B24B1E'))
    o.append(rect(134, 270, 10, 7, '#E0A63A', rx=2) + rect(156, 270, 10, 7, '#E0A63A', rx=2))
    return svg(''.join(o), 'Chunky heroic style: a massive-shouldered dwarf with painted light and no outlines, axe on his shoulder against a dusk sky')


# ---------------------------------------------------------------- 3. Chibi: big head, tiny body, big eyes
def chibi():
    K, W = '#4A2E2A', 3.5
    s = lambda d, f: path(d, f, K, W)
    o = [rect(0, 0, 300, 420, '#CFEFE3')]
    for (x, y, r) in [(54, 70, 26), (250, 120, 18), (230, 40, 12), (40, 300, 16), (262, 300, 22)]:
        o.append(circle(x, y, r, '#FFFFFF', op=0.5))
    o.append(ellipse(150, 378, 80, 12, '#9FCDBB'))
    # tiny axe in the right hand
    o.append(s('M206 346 L214 278 L222 279 L214 347 Z', '#C08A5A'))
    o.append(s('M218 276 C234 264 252 272 252 290 C240 292 230 292 216 298 Z', '#DDE6EF'))
    # feet, body, arms
    o.append(ellipse(126, 370, 20, 11, '#8A6A5A', K, W) + ellipse(174, 370, 20, 11, '#8A6A5A', K, W))
    o.append(s('M112 296 C108 330 116 362 126 366 H174 C184 362 192 330 188 296 C176 284 124 284 112 296 Z', '#7FB3E8'))
    o.append(s('M110 334 H190 V346 H110 Z', '#B07A52') + s('M142 332 H158 V348 H142 Z', '#FFD36B'))
    o.append(s('M114 304 C100 310 92 322 94 334 C100 340 108 336 112 328 C114 320 118 314 122 310 Z', '#7FB3E8'))
    o.append(circle(96, 338, 10, '#FFD9C2', K, W))
    o.append(s('M186 304 C198 308 206 320 208 330 C204 338 194 336 190 328 C188 320 184 314 180 310 Z', '#7FB3E8'))
    o.append(circle(210, 334, 10, '#FFD9C2', K, W))
    # head
    o.append(s('M70 210 C70 146 230 146 230 210 C230 264 196 292 150 292 C104 292 70 264 70 210 Z', '#FFD9C2'))
    o.append(s('M86 222 C82 248 92 270 108 282 C112 296 128 300 138 294 C144 304 156 304 162 294 C172 300 188 296 192 282 C208 270 218 248 214 222 C196 238 176 244 150 244 C124 244 104 238 86 222 Z', '#F08A4B'))
    o.append(s('M122 232 C132 222 146 224 150 232 C154 224 168 222 178 232 C170 242 156 240 150 236 C144 240 130 242 122 232 Z', '#D9692E'))
    o.append(circle(150, 222, 9, '#F5A98A', K, 3))
    o.append(ellipse(102, 222, 11, 6, '#FF9AA8', op=0.55) + ellipse(198, 222, 11, 6, '#FF9AA8', op=0.55))
    for ex in (118, 182):
        o.append(ellipse(ex, 196, 12, 16, '#2A1A22') + circle(ex + 4, 190, 5, '#FFFFFF') + circle(ex - 4, 203, 2.5, '#FFFFFF'))
    o.append(path('M104 172 C110 166 122 166 128 170 M172 170 C178 166 190 166 196 172', 'none', K, 3.5))
    # helmet with little horns and a gem
    o.append(s('M86 150 C72 140 68 120 76 104 C84 120 92 128 104 132 Z', '#FFF6E6') + s('M214 150 C228 140 232 120 224 104 C216 120 208 128 196 132 Z', '#FFF6E6'))
    o.append(s('M78 176 C74 112 226 112 222 176 C190 162 110 162 78 176 Z', '#C8D3E0'))
    o.append(s('M78 176 C110 162 190 162 222 176 L220 188 C190 174 110 174 80 188 Z', '#FFD36B'))
    o.append(circle(150, 140, 8, '#B79CFF', K, 3))
    return svg(''.join(o), 'Chibi style: a dwarf with a huge round head, big shiny eyes, a fluffy beard and a tiny body, on a pastel background')


# ---------------------------------------------------------------- 4. Flat graphic: built from bold shapes, tight palette, no lines
def graphic():
    NAVY, NAVYS = '#20263D', '#141827'
    BEARD, BEARDS = '#E8743B', '#B95623'
    FACE, FACES = '#F1D3B3', '#D9B08C'
    RED = '#D64545'
    STEEL, STEELS = '#C7D0D9', '#8E9AA6'
    o = [rect(0, 0, 300, 420, '#1F4E5F')]
    o.append(circle(150, 176, 112, '#F2C14E'))
    o.append(rect(0, 330, 300, 90, '#163A47'))
    # axe
    o.append(rect(218, 132, 7, 246, '#3A2A20'))
    o.append(path('M225 140 A46 46 0 0 1 225 232 Z', STEEL) + path('M225 186 L271 186 A46 46 0 0 1 225 232 Z', STEELS))
    # legs and feet
    o.append(rect(122, 318, 20, 54, NAVY) + rect(158, 318, 20, 54, NAVY) + rect(132, 318, 10, 54, NAVYS) + rect(168, 318, 10, 54, NAVYS))
    o.append(path('M112 370 H142 V386 H102 Z', '#3A2A20') + path('M158 370 H188 L198 386 H158 Z', '#3A2A20'))
    # body
    o.append(path('M86 190 H214 L182 330 H118 Z', NAVY) + path('M150 190 H214 L182 330 H150 Z', NAVYS))
    o.append(path('M112 298 H188 L186 312 H114 Z', RED))
    # arms
    o.append(path('M86 192 L70 292 H94 L106 200 Z', NAVY) + rect(72, 292, 20, 16, FACE))
    o.append(path('M214 192 L232 282 H208 L196 200 Z', NAVYS) + rect(210, 276, 22, 16, FACES))
    # head
    o.append(rect(122, 128, 56, 54, FACE) + rect(150, 128, 28, 54, FACES))
    o.append(path('M114 134 L150 76 L186 134 Z', STEEL) + path('M150 76 L186 134 H150 Z', STEELS))
    o.append(rect(112, 128, 76, 12, RED))
    o.append(rect(134, 150, 10, 5, '#141827') + rect(156, 150, 10, 5, '#141827'))
    o.append(path('M150 150 L158 170 H142 Z', FACES))
    o.append(path('M116 166 H184 L150 296 Z', BEARD) + path('M150 166 H184 L150 296 Z', BEARDS))
    o.append(path('M122 170 L150 160 L178 170 L178 180 L150 172 L122 180 Z', '#B95623'))
    return svg(''.join(o), 'Flat graphic style: a dwarf built from bold geometric shapes in a tight palette, no outlines, against a big yellow sun')


# ---------------------------------------------------------------- 5. Dark ink: heavy blacks, thick line, moonlight
def ink(d, base, px, py, s=0.6, w=5):
    BLK = '#0B0A0E'
    return path(d, BLK) + scaled(d, base, px, py, s) + path(d, 'none', BLK, w)


def darkink():
    BLK = '#0B0A0E'
    o = [rect(0, 0, 300, 420, '#16121D')]
    o.append(circle(196, 118, 70, '#E9E2D0'))
    o.append(circle(176, 100, 10, '#D2C9B4') + circle(214, 140, 14, '#D2C9B4') + circle(222, 94, 6, '#D2C9B4'))
    o.append(path('M90 150 C120 136 160 140 180 150 C210 140 250 142 280 156 L280 170 L90 170 Z', '#2A2533'))
    o.append(path('M-10 372 L30 352 L62 364 L104 346 L150 360 L196 344 L244 362 L310 350 V430 H-10 Z', BLK))
    # axe silhouette on the shoulder
    o.append(path('M206 304 L238 98', 'none', BLK, 13) + path('M206 304 L238 98', 'none', '#4A3426', 5))
    c = (236, 118)
    ux, uy = 32, -206
    ln = math.hypot(ux, uy); u = (ux / ln, uy / ln); n = (-u[1], u[0])
    d = blade(c, u, n, 58, 12, 46, 20)
    o.append(path(d, BLK) + scaled(d, '#8C929C', c[0], c[1], 0.62) + path(d, 'none', BLK, 5))
    P = lambda a, b: (c[0] + u[0] * a + n[0] * b, c[1] + u[1] * a + n[1] * b)
    for a_, b_ in [(14, 26), (0, 30), (-14, 26)]:
        o.append(circle(round(P(a_, b_)[0], 1), round(P(a_, b_)[1], 1), 6, '#FF8A4C', op=0.25) + circle(round(P(a_, b_)[0], 1), round(P(a_, b_)[1], 1), 2.5, '#FF8A4C'))
    # legs, boots
    o.append(ink('M110 326 H146 V372 H104 C104 356 106 340 110 326 Z', '#6A3A33', 112, 330))
    o.append(ink('M154 326 H190 C194 340 196 356 196 372 H154 Z', '#6A3A33', 158, 330))
    o.append(ink('M98 368 H148 V392 H86 C86 382 90 372 98 368 Z', '#5A3F2E', 100, 372))
    o.append(ink('M152 368 H202 C210 372 214 382 214 392 H152 Z', '#5A3F2E', 156, 372))
    # torso, belt
    o.append(ink('M90 206 C80 262 92 306 112 330 H188 C208 306 220 262 210 206 C190 190 110 190 90 206 Z', '#7A7F8C', 100, 206, 0.58))
    o.append(ink('M100 298 H200 V318 H100 Z', '#5A3F2E', 104, 300, 0.7))
    o.append(circle(150, 308, 9, '#B58A3C', BLK, 4))
    # arms, fists
    o.append(ink('M70 228 L62 292 L94 298 L104 236 Z', '#7A7F8C', 74, 232))
    o.append(ink('M54 288 C48 316 66 332 84 328 C102 324 106 304 100 290 Z', '#5A3F2E', 60, 292))
    o.append(ink('M196 236 L224 292 L196 306 L180 246 Z', '#7A7F8C', 188, 240))
    o.append(ink('M190 288 C184 312 200 328 216 324 C232 318 234 298 224 286 Z', '#5A3F2E', 196, 290))
    # pauldrons with black spikes
    for flip in (False, True):
        m = (lambda d: mirror(d)) if flip else (lambda d: d)
        o.append(path(m('M60 172 L40 132 L80 164 Z'), BLK) + path(m('M96 156 L96 112 L114 154 Z'), BLK))
        o.append(ink(m('M44 218 C40 170 86 146 132 162 C140 186 132 212 118 230 C92 240 62 238 44 218 Z'), '#7A7F8C', 56 if not flip else 244, 168, 0.56))
    # beard, head, helm, glowing eyes
    o.append(ink('M118 196 C106 238 118 276 142 304 L150 316 L158 304 C182 276 194 238 182 196 C170 208 130 208 118 196 Z', '#A8492A', 124, 200, 0.6))
    o.append(path('M134 220 C138 250 144 276 150 300 M166 220 C162 250 156 276 150 300', 'none', BLK, 3))
    o.append(ink('M126 176 C124 152 176 152 174 176 L174 196 C166 206 134 206 126 196 Z', '#C98F72', 130, 170, 0.6))
    o.append(path('M120 202 C134 190 146 194 150 202 C154 194 166 190 180 202 C172 212 158 212 150 208 C142 212 128 212 120 202 Z', '#7E3520', BLK, 4))
    o.append(path('M124 172 H176 V190 C164 194 136 194 124 190 Z', BLK))
    o.append(circle(138, 182, 8, '#FF8A4C', op=0.25) + circle(162, 182, 8, '#FF8A4C', op=0.25))
    o.append(ellipse(138, 182, 4.5, 2.2, '#FFB27A') + ellipse(162, 182, 4.5, 2.2, '#FFB27A'))
    o.append(ink('M116 178 C112 128 188 128 184 178 L180 202 L174 178 C168 164 132 164 126 178 L120 202 Z', '#7A7F8C', 126, 136, 0.6))
    return svg(''.join(o), 'Dark ink style: a hunched dwarf in heavy black shadow with glowing ember eyes, his axe silhouetted against a pale moon')


# ---------------------------------------------------------------- 6. Pixel: an old-school sprite
PAL = {
    'wood': ('#8A5A34', '#5E3B20', '#B07A4A'), 'steel': ('#C9CFD8', '#7C8590', '#F2F5F8'), 'boot': ('#4A3428', '#2E2018', None),
    'leg': ('#6B4528', '#45291A', None), 'tunic': ('#B8483A', '#7E2A22', '#D9675A'), 'pauld': ('#AEB8C4', '#6E7886', '#E6ECF2'),
    'belt': ('#5A3A2A', '#3A2418', None), 'gold': ('#F4B942', '#A8741C', '#FFE08A'), 'skin': ('#E8A27E', '#B86E52', '#F7C4A6'),
    'helm': ('#AEB8C4', '#6E7886', '#E6ECF2'), 'beard': ('#D9622B', '#9E3F15', '#F2935A'), 'moust': ('#B24B1E', '#8A3612', None),
    'eye': ('#1B1421', '#1B1421', None), 'nose': ('#D98A68', '#B86E52', None), 'bone': ('#F3E9D2', '#C9BFA8', None),
}
OUT = '#1B1421'


def sprite():
    Wd, Ht = 32, 36
    G = [[None] * Wd for _ in range(Ht)]
    def put(x, y, c):
        if 0 <= x < Wd and 0 <= y < Ht:
            G[y][x] = c
    def box(x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                put(x, y, c)
    def ell(cx, cy, rx, ry, c, ymax=99, xmin=-1):
        for y in range(Ht):
            for x in range(Wd):
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 and y <= ymax and x >= xmin:
                    put(x, y, c)
    box(26, 4, 26, 34, 'wood')
    ell(28.6, 8.5, 3.6, 5.4, 'steel', xmin=27)
    box(24, 9, 25, 10, 'steel')
    box(7, 32, 11, 34, 'boot'); box(16, 32, 20, 34, 'boot'); put(6, 34, 'boot'); put(21, 34, 'boot')
    box(8, 28, 11, 31, 'leg'); box(16, 28, 19, 31, 'leg')
    ell(14, 22.5, 8.6, 7.6, 'tunic')
    box(6, 26, 22, 27, 'belt'); box(12, 26, 15, 27, 'gold')
    ell(5.6, 17.6, 3.6, 3.0, 'pauld'); ell(22.4, 17.6, 3.6, 3.0, 'pauld')
    box(3, 19, 5, 25, 'tunic'); box(3, 26, 5, 27, 'skin')
    box(22, 19, 24, 23, 'tunic'); box(23, 23, 27, 25, 'skin')
    ell(14, 12.6, 6.0, 4.2, 'skin')
    ell(14, 10.2, 6.9, 6.2, 'helm', ymax=9)
    box(6, 10, 21, 11, 'gold'); box(13, 2, 14, 3, 'gold')
    for (x, y) in [(6, 8), (5, 7), (4, 6), (4, 5), (21, 8), (22, 7), (23, 6), (23, 5)]:
        put(x, y, 'bone')
    widths = {13: 6.4, 14: 6.8, 15: 6.8, 16: 6.6, 17: 6.4, 18: 6.0, 19: 5.4, 20: 4.6, 21: 3.6, 22: 2.6, 23: 1.6, 24: 0.8}
    for y, hw in widths.items():
        for x in range(int(round(14 - hw)), int(round(14 + hw))):
            put(x, y, 'beard')
    box(10, 14, 17, 14, 'moust'); put(9, 15, 'moust'); put(18, 15, 'moust')
    box(13, 12, 14, 13, 'nose')
    put(10, 12, 'eye'); put(17, 12, 'eye')
    # shade the right edge of each region, light the top edge
    C = [[None] * Wd for _ in range(Ht)]
    for y in range(Ht):
        for x in range(Wd):
            k = G[y][x]
            if not k:
                continue
            base, sh, li = PAL[k]
            right = G[y][x + 1] if x + 1 < Wd else None
            up = G[y - 1][x] if y > 0 else None
            if right != k:
                C[y][x] = sh
            elif up != k and li:
                C[y][x] = li
            else:
                C[y][x] = base
    for y in range(Ht):
        for x in range(Wd):
            if G[y][x] is None and any(0 <= x + dx < Wd and 0 <= y + dy < Ht and G[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                C[y][x] = OUT
    return C


def pixel():
    PS = 8
    x0, y0 = 22, 376 - 36 * PS
    o = [rect(0, 0, 300, 420, '#2B2436')]
    for row in range(0, 23):
        y = row * 16
        off = 0 if row % 2 == 0 else 16
        for x in range(-off, 300, 32):
            o.append(rect(x + 1, y + 1, 30, 14, '#332B40'))
    o.append(rect(0, 376, 300, 44, '#1B1622') + rect(0, 376, 300, 4, '#3A3048'))
    for i, (sz, op) in enumerate([(96, 0.08), (64, 0.12), (40, 0.18)]):
        o.append(rect(48 - sz / 2, 150 - sz / 2, sz, sz, '#FF8A4C', op=op))
    o.append(rect(44, 156, 8, 32, '#6B4528') + rect(40, 132, 16, 8, '#FF8A4C') + rect(44, 124, 8, 8, '#FF8A4C') + rect(44, 140, 8, 16, '#FFE08A'))
    for (w, op) in [(30, 0.35)]:
        o.append(rect(x0 + 6 * PS, 376 - 4, 18 * PS, 8, '#0E0B12', op=op))
    C = sprite()
    for y, row in enumerate(C):
        x = 0
        while x < len(row):
            c = row[x]
            if c is None:
                x += 1
                continue
            run = 1
            while x + run < len(row) and row[x + run] == c:
                run += 1
            o.append(rect(x0 + x * PS, y0 + y * PS, run * PS, PS, c))
            x += run
    return svg(''.join(o), 'Pixel art style: a dwarf warrior sprite with a horned helmet and a big axe, in front of a dungeon wall with a torch')


STYLES6 = [
    ('tv', 'TV cartoon', 'Simple shapes, thin black lines, flat colour. Sitcom energy, like the Marge Gamer episode.', tv),
    ('heroic', 'Chunky heroic', 'Huge shoulders and hands, painted light, no lines. The closest to how WoW itself looks.', heroic),
    ('chibi', 'Chibi', 'Big head, tiny body, big shiny eyes. Cute and cosy. Our current kit sits closest to this.', chibi),
    ('graphic', 'Flat graphic', 'Built from bold shapes and a tight palette, no lines. Stylish and very modern.', graphic),
    ('ink', 'Dark ink', 'Heavy black shadows, thick lines and moonlight. Moody, metal, more grown-up.', darkink),
    ('pixel', 'Pixel', 'An old-school sprite, like the console RPGs we grew up on.', pixel),
]

if __name__ == '__main__':
    cells = ''.join(f'<div style="width:300px;border-radius:12px;overflow:hidden">{fn()}</div>' for _, _, _, fn in STYLES6)
    open(sys.argv[1], 'w').write(f'<div style="display:flex;flex-wrap:wrap;gap:14px">{cells}</div>')
    print('ok', {k: len(fn()) for k, _, _, fn in STYLES6})
