import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# The Barrow King and his throne room in the locked TV-cartoon style.
# Usage: tvboss.py  -> writes build/fight/boss_tv.svg.html and build/fight/scene_tv.svg.html
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artstyles import path, rect, circle, ellipse
from tvworld import mirror

B = HF_ROOT + '/build/fight/'
K = '#1E1A1A'


def s(d, fill, w=4):
    return path(d, fill, K, w)


def ln(d, col=K, w=3):
    return path(d, 'none', col, w)


def boss():
    PUR, RED, FUR, PL, PLD, GD, BONE, GRN = '#6A4BA3', '#C8403F', '#F7F3EA', '#7D8FA3', '#5E6A7A', '#F2C230', '#F0E8D2', '#9BE15D'
    o = ['<svg class="bk" viewBox="0 0 400 470" aria-hidden="true">']
    o.append('<g class="bk-glow">' + circle(200, 190, 172, '#9BD068', op=0.12) + circle(200, 170, 118, '#9BD068', op=0.14) + '</g>')
    # body: cloak, lining, armour front, tabard, belt
    b = [s('M84 168 C64 262 52 380 46 454 H354 C348 380 336 262 316 168 Z', PUR)]
    b.append(s('M140 200 L126 454 H110 L124 200 Z', RED, 3.5) + s(mirror('M140 200 L126 454 H110 L124 200 Z', 200), RED, 3.5))
    b.append(s('M140 200 H260 L274 454 H126 Z', PLD))
    b.append(ln('M150 214 L140 444 M250 214 L260 444', GD, 4))
    b.append(s('M170 318 H230 L236 444 L200 428 L164 444 Z', '#2F5A44', 3.5))
    b.append(s('M184 356 L188 340 L194 350 L200 336 L206 350 L212 340 L216 356 Z', GD, 2.5))
    b.append(s('M134 300 H266 V322 H134 Z', '#4A3428', 3.5))
    b.append(circle(200, 311, 11, BONE, K, 3) + circle(196, 309, 2.4, K) + circle(204, 309, 2.4, K))
    o.append('<g class="bk-body">' + ''.join(b) + '</g>')
    # sword: same blade outline as before so the sword glow still fits
    sw = [s('M183 300 L217 300 L214 432 L200 458 L186 432 Z', '#C9CFD8')]
    sw.append(ln('M200 312 V440', '#9AA3AD', 3))
    sw.append(s('M146 288 C146 280 254 280 254 288 V300 C254 308 146 308 146 300 Z', GD))
    sw.append(s('M192 238 H208 V288 H192 Z', '#5A3A2A', 3.5) + ln('M192 252 L208 248 M192 266 L208 262 M192 280 L208 276', K, 2))
    sw.append(circle(200, 230, 13, GD, K, 3.5) + circle(200, 230, 5, GRN, K, 2))
    o.append('<g class="bk-sword">' + ''.join(sw) + '</g>')
    # arms, bony hands on the grip, pauldrons, ermine collar
    a = []
    arm = 'M112 196 C100 232 112 264 150 270 L192 264 L190 246 L156 248 C140 242 136 224 142 208 Z'
    a.append(s(arm, PL) + s(mirror(arm, 200), PL))
    hand = 'M166 250 C162 238 174 232 186 236 L200 242 L200 264 L178 268 C170 266 164 258 166 250 Z'
    a.append(s(hand, BONE, 3.5) + s(mirror(hand, 200), BONE, 3.5))
    a.append(ln('M176 244 L178 262 M186 242 L188 262 M224 244 L222 262 M214 242 L212 262', K, 2))
    for f in (False, True):
        m = (lambda d: mirror(d, 200)) if f else (lambda d: d)
        a.append(s(m('M84 148 L72 106 L104 140 Z'), BONE, 3.5) + s(m('M116 138 L114 96 L134 136 Z'), BONE, 3.5))
        a.append(s(m('M58 198 C48 150 96 120 148 140 C158 162 154 188 140 206 C112 216 78 214 58 198 Z'), PL))
        a.append(s(m('M62 194 C86 208 118 210 142 200 L140 212 C118 222 84 220 60 208 Z'), GD, 3.5))
        a.append(circle(96 if not f else 304, 168, 4, GD, K, 2) + circle(124 if not f else 276, 158, 4, GD, K, 2))
    a.append(s('M108 172 C140 146 260 146 292 172 C286 198 256 212 200 214 C144 212 114 198 108 172 Z', FUR))
    for (x, y) in [(132, 186), (160, 198), (240, 198), (268, 186), (146, 166), (254, 166)]:
        a.append(path(f'M{x} {y - 5} C{x + 4} {y - 1} {x + 3} {y + 5} {x} {y + 7} C{x - 3} {y + 5} {x - 4} {y - 1} {x} {y - 5} Z', K))
    o.append('<g class="bk-arms">' + ''.join(a) + '</g>')
    # beard, forked to frame the pommel
    bd = s('M162 182 C154 212 164 232 182 240 L194 226 L200 236 L206 226 L218 240 C236 232 246 212 238 182 Z', '#EEF0F2', 3.5)
    bd += ln('M180 198 C182 214 186 224 192 232 M220 198 C218 214 214 224 208 232 M200 200 V226', '#B9BFC7', 2.5)
    o.append('<g class="bk-beard">' + bd + '</g>')
    # skull with glowing eyes
    h = [s('M150 122 C150 66 250 66 250 122 C250 148 240 166 226 174 H174 C160 166 150 148 150 122 Z', BONE)]
    h.append(ellipse(178, 120, 15, 13, K) + ellipse(222, 120, 15, 13, K))
    h.append(path('M200 134 L193 148 H207 Z', K))
    h.append(ln('M214 80 L220 92 L214 100', K, 2.2) + ln('M160 140 C164 150 168 156 174 160 M240 140 C236 150 232 156 226 160', K, 2.2))
    eyes = circle(178, 121, 15, GRN, op=0.28) + circle(222, 121, 15, GRN, op=0.28) + circle(178, 121, 6, GRN) + circle(222, 121, 6, GRN) + circle(176, 118, 2, '#F4FFE8') + circle(220, 118, 2, '#F4FFE8')
    h.append('<g class="bk-eyes">' + eyes + '</g>')
    o.append('<g class="bk-head">' + ''.join(h) + '</g>')
    jaw = s('M170 160 H230 C232 180 222 192 200 194 C178 192 168 180 170 160 Z', BONE, 3.5)
    jaw += ln('M180 162 V174 M190 162 V177 M200 162 V178 M210 162 V177 M220 162 V174', K, 2.2) + ln('M172 168 H228', K, 2.2)
    o.append('<g class="bk-jaw">' + jaw + '</g>')
    cr = s('M148 76 L142 30 L164 52 L182 18 L200 46 L218 18 L236 52 L258 30 L252 76 Z', GD)
    cr += s('M146 62 H254 V80 H146 Z', '#D9A520', 3.5)
    cr += circle(170, 71, 5, '#D64545', K, 2) + circle(200, 71, 6, GRN, K, 2) + circle(230, 71, 5, '#4F86C6', K, 2)
    cr += circle(142, 28, 5, GD, K, 2.5) + circle(182, 16, 5, GD, K, 2.5) + circle(218, 16, 5, GD, K, 2.5) + circle(258, 28, 5, GD, K, 2.5)
    o.append('<g class="bk-crown" transform="translate(-4 3) rotate(-15 200 66)">' + cr + '</g>')
    o.append('</svg>')
    return '\n'.join(o)


def scene():
    o = ['<svg class="scene-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">']
    o.append(rect(0, 0, 1600, 660, '#5C5070'))
    for r_, y in enumerate(range(72, 660, 72)):
        o.append(ln(f'M0 {y} H1600', '#463C5A', 3))
        off = 0 if r_ % 2 == 0 else 80
        for x in range(off, 1600, 160):
            o.append(ln(f'M{x} {y - 72} V{y}', '#463C5A', 3))
    # windows and moonlight
    for x0 in (110, 1390):
        o.append(s(f'M{x0} 470 V250 C{x0} 160 {x0 + 100} 160 {x0 + 100} 250 V470 Z', '#7A6E8E', 3.5))
        o.append(s(f'M{x0 + 16} 456 V256 C{x0 + 16} 186 {x0 + 84} 186 {x0 + 84} 256 V456 Z', '#9FC3E8', 3))
        o.append(ln(f'M{x0 + 50} 196 V456 M{x0 + 16} 330 H{x0 + 84}', K, 3))
        o.append(path(f'M{x0 + 20} 456 L{x0 + 150} 660 L{x0 + 150} 900 H{x0 - 70} L{x0 - 20} 660 Z', '#9FC3E8', op=0.1))
    # the great arch behind the king
    o.append(s('M560 664 V330 C560 140 1040 140 1040 330 V664 Z', '#7A6E8E', 4.5))
    for i in range(1, 12):
        ang = math.pi - i * math.pi / 12
        cx, cy = 800, 340
        x0, y0 = cx + 180 * math.cos(ang), cy - 150 * math.sin(ang)
        x1, y1 = cx + 240 * math.cos(ang), cy - 200 * math.sin(ang)
        o.append(ln(f'M{x0:.0f} {y0:.0f} L{x1:.0f} {y1:.0f}', '#5E5372', 3.5))
    o.append(s('M620 664 V340 C620 200 980 200 980 340 V664 Z', '#2A2140', 4))
    o.append(circle(800, 470, 230, '#9BD068', op=0.12) + circle(800, 500, 150, '#9BD068', op=0.14))
    o.append(s('M776 128 H824 L832 168 H768 Z', '#8C8098', 3.5))
    o.append(circle(800, 148, 13, '#F0E8D2', K, 3) + circle(795, 146, 3, K) + circle(805, 146, 3, K))
    # banners
    for x in (452, 1088):
        o.append(s(f'M{x} -6 H{x + 60} V230 L{x + 30} 206 L{x} 230 Z', '#2F5A44', 3.5))
        o.append(ln(f'M{x + 8} -6 V220 M{x + 52} -6 V220', '#E7B53C', 3))
        o.append(circle(x + 30, 96, 13, '#F0E8D2', K, 3) + s(f'M{x + 16} 80 L{x + 21} 66 L{x + 30} 76 L{x + 39} 66 L{x + 44} 80 Z', '#E7B53C', 2.5))
    # torches
    for tx in (330, 1270):
        o.append(circle(tx, 300, 90, '#FF8A4C', op=0.12) + circle(tx, 300, 52, '#FF8A4C', op=0.16))
        o.append(s(f'M{tx - 10} 316 H{tx + 10} L{tx + 6} 360 H{tx - 6} Z', '#6B4528', 3.5))
        o.append(s(f'M{tx - 22} 360 H{tx + 22} V372 H{tx - 22} Z', '#4A3A30', 3))
        o.append(s(f'M{tx} 262 C{tx + 20} 284 {tx + 18} 304 {tx} 316 C{tx - 18} 304 {tx - 20} 284 {tx} 262 Z', '#FF8A4C', 3.5))
        o.append(path(f'M{tx} 284 C{tx + 9} 296 {tx + 8} 306 {tx} 312 C{tx - 8} 306 {tx - 9} 296 {tx} 284 Z', '#FFE08A'))
    # floor, carpet, step
    o.append(s('M-10 660 H1610 V910 H-10 Z', '#3E3550', 4))
    for xb in (-400, -80, 240, 560, 1040, 1360, 1680, 2000):
        o.append(ln(f'M{xb} 900 L{800 + (xb - 800) * 0.35:.0f} 660', '#312A40', 3.5))
    for y in (712, 784, 860):
        o.append(ln(f'M0 {y} H1600', '#312A40', 3))
    o.append(s('M590 660 H1010 V684 H590 Z', '#7A6E8E', 3.5))
    o.append(s('M630 910 L730 684 H870 L970 910 Z', '#B8383A', 4))
    o.append(ln('M648 910 L742 684 M952 910 L858 684', '#E7B53C', 4))
    # green lanterns on poles
    for lx in (430, 1170):
        o.append(ln(f'M{lx} 664 V430', K, 6) + ln(f'M{lx} 664 V430', '#4A3A30', 3))
        o.append(circle(lx, 410, 80, '#9BD068', op=0.13) + circle(lx, 410, 44, '#9BD068', op=0.18))
        o.append(s(f'M{lx - 16} 390 H{lx + 16} L{lx + 12} 432 H{lx - 12} Z', '#9BD068', 3.5))
        o.append(s(f'M{lx - 20} 382 H{lx + 20} L{lx + 14} 392 H{lx - 14} Z', '#4A3A30', 3))
    # skull pile and candles in the corners
    for (x, y, r) in [(70, 640, 22), (112, 646, 20), (90, 612, 20), (150, 650, 16)]:
        o.append(s(f'M{x - r} {y + 4} C{x - r} {y - r * 1.4:.0f} {x + r} {y - r * 1.4:.0f} {x + r} {y + 4} Z', '#F0E8D2', 3))
        o.append(circle(x - r * 0.38, y - r * 0.3, r * 0.22, K) + circle(x + r * 0.38, y - r * 0.3, r * 0.22, K))
    for (x, h) in [(1450, 70), (1480, 104), (1514, 56), (1540, 86)]:
        o.append(circle(x, 664 - h - 18, 30, '#F4B942', op=0.16))
        o.append(s(f'M{x - 10} 664 V{664 - h} H{x + 10} V664 Z', '#F1E6CF', 3))
        o.append(s(f'M{x} {664 - h - 26} C{x + 9} {664 - h - 14} {x + 7} {664 - h - 4} {x} {664 - h - 2} C{x - 7} {664 - h - 4} {x - 9} {664 - h - 14} {x} {664 - h - 26} Z', '#F4B942', 2.5))
    o.append('</svg>')
    return '\n'.join(o)


if __name__ == '__main__':
    open(B + 'boss_tv.svg.html', 'w').write(boss())
    open(B + 'scene_tv.svg.html', 'w').write(scene())
    prev = ('<div style="display:flex;gap:16px;align-items:flex-end;background:#16121C">'
            '<div style="width:900px;position:relative">' + scene().replace('class="scene-bg"', 'style="display:block;width:100%;height:auto"') +
            '<div style="position:absolute;left:330px;bottom:120px;width:240px">' + boss().replace('class="bk"', 'style="display:block;width:100%;height:auto;overflow:visible"') + '</div></div>'
            '<div style="width:300px">' + boss().replace('class="bk"', 'style="display:block;width:100%;height:auto;overflow:visible"') + '</div></div>')
    open(B + 'tv_preview_frag.html', 'w').write(prev)
    print('ok', len(boss()), len(scene()))
