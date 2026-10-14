import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Ability icons for the Barrow Crypt (64x64 TV tiles: flat bright ground, one black line, one idea each).
# Usage: python3 tools/art_icons.py -> art/icons.json + art/_icons_preview.html
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fighttiles import TV_TILES
from art_sprites import gild

OUT = HF_ROOT + '/art/'
K = '#1E1A1A'


def f1(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def P(d, col, w, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<path d="{d}" style="fill: none; stroke: {col}; stroke-width: {w}; stroke-linecap: round; stroke-linejoin: round{o}"/>'


def F(d, fill, w=3.5):
    return f'<path d="{d}" style="fill: {fill}; stroke: {K}; stroke-width: {w}; stroke-linejoin: round"/>'


def inked(d, col, w):
    return P(d, K, w + 4.5) + P(d, col, w)


def C(cx, cy, r, fill, w=3.2):
    st = f'; stroke: {K}; stroke-width: {w}' if w else ''
    return f'<circle cx="{f1(cx)}" cy="{f1(cy)}" r="{f1(r)}" style="fill: {fill}{st}"/>'


def tile(bg, inner):
    return f'<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" style="fill: {bg}"/>{inner}</svg>'


T = {}
T['taunt'] = TV_TILES['taunt']

T['shield'] = tile('#C8403F',
                   P('M6 18 L14 24 M4 32 H13 M6 46 L14 40', '#FFF3C4', 3.4) +
                   C(38, 32, 21, '#F2C230', 3.5) + C(38, 32, 15, '#9AA7B8', 3) + C(38, 32, 6, '#F2C230', 3) +
                   P('M28 22 C32 19 37 18 42 19', '#FFFFFF', 2.6, 0.9))

T['charge'] = tile('#E07A2E',
                   P('M4 22 H18 M2 34 H16 M6 46 H20', '#FFF3C4', 3.6) +
                   F('M24 40 C24 22 54 22 54 40 Z', '#9AA7B8') + F('M22 38 H56 V45 H22 Z', '#7D8FA3', 3) +
                   F('M26 30 C18 28 14 20 16 10 C20 18 26 22 32 24 Z', '#F0E8D2', 3) +
                   F('M52 30 C60 28 64 20 62 10 C58 18 52 22 46 24 Z', '#F0E8D2', 3) +
                   F('M26 46 C30 58 48 58 52 46 Z', '#E2733A', 3))

# healer
pts = []
for k in range(8):
    a = math.radians(k * 45)
    pts.append(inked(f'M{f1(32 + 13 * math.cos(a))} {f1(30 + 13 * math.sin(a))} L{f1(32 + 19 * math.cos(a))} {f1(30 + 19 * math.sin(a))}', '#F2C230', 3.2))
T['sunburst'] = tile('#E07A2E', ''.join(pts) + C(32, 30, 10, '#F2C230', 3.5) + C(29, 27, 3, '#FFF6D0', 0) +
                     P('M10 54 C18 50 24 50 32 54 C40 50 46 50 54 54', '#FFF3C4', 3, 0.9))

T['circle'] = tile('#6A4BA3',
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: #F2C230; opacity: 0.4"/>' +
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/>' +
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: none; stroke: #F2C230; stroke-width: 3.4"/>' +
                   inked('M32 12 V28 M24 20 H40', '#FFFFFF', 4) +
                   P('M14 24 L16 28 M50 22 L48 27', '#FFF3C4', 2.6))

T['ward'] = tile('#2F6FA8',
                 '<circle cx="32" cy="33" r="21" style="fill: #DDF3FF; opacity: 0.55; stroke: #1E1A1A; stroke-width: 3.5"/>' +
                 P('M20 22 C24 16 30 14 36 15', '#FFFFFF', 3.2) +
                 F('M32 23 L41 27 V34 C41 40 37 44 32 46 C27 44 23 40 23 34 V27 Z', '#F2C230', 3))

T['mend'] = tile('#4E9A4A', inked('M32 14 V50 M14 32 H50', '#FFFFFF', 7) + P('M48 14 L52 10 M54 20 H58', '#FFF3C4', 2.6))

# dps
flakes = ''
for (x, y) in [(18, 46), (32, 52), (46, 45), (24, 57), (42, 58)]:
    flakes += P(f'M{x} {y - 4} V{y + 4} M{x - 3.5} {y - 2} L{x + 3.5} {y + 2} M{x - 3.5} {y + 2} L{x + 3.5} {y - 2}', K, 4.5) + P(f'M{x} {y - 4} V{y + 4} M{x - 3.5} {y - 2} L{x + 3.5} {y + 2} M{x - 3.5} {y + 2} L{x + 3.5} {y - 2}', '#FFFFFF', 2)
T['blizzard'] = tile('#1F4F7A', F('M12 34 C6 34 6 24 13 23 C13 14 25 12 28 19 C32 10 46 12 46 21 C54 20 58 30 51 34 Z', '#DDE6EE') + P('M18 30 H44', '#9FB3C6', 2.4) + flakes)

spikes = ''
for k in range(8):
    a = math.radians(k * 45 + 22.5)
    cx, cy = 32 + 17 * math.cos(a), 32 + 17 * math.sin(a)
    tx, ty = 32 + 28 * math.cos(a), 32 + 28 * math.sin(a)
    lx, ly = cx + 5 * math.cos(a + math.pi / 2), cy + 5 * math.sin(a + math.pi / 2)
    rx, ry = cx - 5 * math.cos(a + math.pi / 2), cy - 5 * math.sin(a + math.pi / 2)
    spikes += F(f'M{f1(lx)} {f1(ly)} L{f1(tx)} {f1(ty)} L{f1(rx)} {f1(ry)} Z', '#8FD6FF', 2.6)
T['nova'] = tile('#4F6FA8', spikes + '<circle cx="32" cy="32" r="16" style="fill: none; stroke: #1E1A1A; stroke-width: 8"/>' +
                 '<circle cx="32" cy="32" r="16" style="fill: none; stroke: #DDF3FF; stroke-width: 4"/>' + C(32, 32, 6, '#FFFFFF', 3))

T['comet'] = tile('#6A4BA3',
                  F('M6 14 C18 22 26 30 32 36 L26 44 C20 36 12 26 6 14 Z', '#DDF3FF', 0) +
                  P('M8 10 L28 34 M14 8 L32 30', '#DDF3FF', 3, 0.85) +
                  C(38, 42, 14, '#8FD6FF', 3.5) + F('M42 34 L48 40 L40 42 Z', '#FFFFFF', 1.8) +
                  P('M32 40 L37 46 L32 52', '#5BAAD8', 2.6))

T['dodge'] = tile('#4E9A4A',
                  inked('M12 46 C16 24 34 14 50 18', '#FFF3C4', 5) + F('M44 9 L56 19 L42 25 Z', '#FFF3C4', 3) +
                  C(14, 52, 5, '#C9B79A', 2.6) + C(24, 54, 4, '#C9B79A', 2.4) + C(7, 44, 3.5, '#C9B79A', 2.2))

link = lambda x, y, a: f'<ellipse cx="{x}" cy="{y}" rx="8" ry="5" transform="rotate({a} {x} {y})" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/><ellipse cx="{x}" cy="{y}" rx="8" ry="5" transform="rotate({a} {x} {y})" style="fill: none; stroke: #C9D2DC; stroke-width: 3"/>'
T['cut'] = tile('#C8403F', link(14, 50, -40) + link(24, 40, 50) + link(42, 22, 50) + link(52, 12, -40) +
                P('M14 22 L50 46', '#1E1A1A', 9) + P('M14 22 L50 46', '#FFFFFF', 4.5))


# ---- loot item icons (neutral ground; rarity shows as the frame colour)
IB = '#3A3150'
T['i_axe'] = tile(IB, inked('M20 54 L42 14', '#A0703F', 5) + F('M36 10 C48 2 62 12 58 30 C48 28 40 22 36 10 Z', '#D7DEE6') + P('M43 9 C51 8 56 14 57 22', '#FFFFFF', 2.2, 0.9) + C(20, 54, 3.4, '#6B4528', 2))
T['i_shield'] = tile(IB, C(32, 32, 22, '#F2C230', 3.5) + C(32, 32, 16, '#C8403F', 3) + P('M32 17 V47 M17 32 H47', '#9E2F2E', 2.6) + C(32, 32, 6, '#C9D2DC', 3))
T['i_plate'] = tile(IB, F('M18 16 C26 12 38 12 46 16 L50 28 L44 30 V52 H20 V30 L14 28 Z', '#9AA7B8') + P('M32 18 V50', '#7D8FA3', 3) + F('M12 18 C16 12 24 12 26 18 C22 22 16 24 12 18 Z', '#C9D2DC', 2.6) + F('M52 18 C48 12 40 12 38 18 C42 22 48 24 52 18 Z', '#C9D2DC', 2.6))
rays = ''
for k in range(8):
    a = math.radians(k * 45 + 22.5)
    rays += inked(f'M{f1(40 + 9 * math.cos(a))} {f1(20 + 9 * math.sin(a))} L{f1(40 + 14 * math.cos(a))} {f1(20 + 14 * math.sin(a))}', '#F2C230', 2.6)
T['i_sunstaff'] = tile(IB, inked('M18 58 L38 24', '#A0703F', 4.5) + rays + C(40, 20, 7, '#F2C230', 3))
T['i_icestaff'] = tile(IB, inked('M18 58 L36 26', '#A0703F', 4.5) + '<circle cx="40" cy="18" r="13" style="fill: #8FD6FF; opacity: 0.35"/>' + F('M40 4 L48 18 L40 32 L32 18 Z', '#8FD6FF', 3) + P('M38 10 L35 17', '#FFFFFF', 2))
T['i_robe'] = tile(IB, F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#4F86C6') + F('M28 18 L32 22 L36 18 L34 54 H30 Z', '#F2C230', 2.6) + F('M22 12 C28 20 36 20 42 12 C38 9 26 9 22 12 Z', '#F6F1E4', 2.6))
T['i_charm'] = tile(IB, P('M20 10 C24 26 40 26 44 10', '#C9D2DC', 3) + '<circle cx="32" cy="38" r="15" style="fill: #B79CFF; opacity: 0.3"/>' + F('M32 24 L44 38 L32 54 L20 38 Z', '#B79CFF', 3.2) + P('M30 32 L26 38', '#FFFFFF', 2.2))

# ---- v2 abilities: every role has a fourth button
rings = ('<ellipse cx="32" cy="50" rx="27" ry="8" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/>'
         '<ellipse cx="32" cy="50" rx="27" ry="8" style="fill: none; stroke: #FFF3C4; stroke-width: 3"/>')
star = ''.join(f"{'M' if k == 0 else 'L'}{f1(32 + (22 if k % 2 == 0 else 9) * math.cos(math.radians(k * 36 - 90)))} {f1(48 + (12 if k % 2 == 0 else 5) * math.sin(math.radians(k * 36 - 90)))} " for k in range(10)) + 'Z'
T['slam'] = tile('#E07A2E',
                 F(star, '#FFE08A', 3) +
                 P('M14 58 L22 52 M50 58 L42 52 M32 62 V56', '#1E1A1A', 3) +
                 inked('M46 6 L34 38', '#A0703F', 5) +
                 F('M30 34 C22 30 18 40 22 50 C28 46 34 46 40 46 C40 40 36 36 30 34 Z', '#D7DEE6') +
                 P('M8 22 L14 28 M56 22 L50 28 M10 36 H16', '#FFF3C4', 3) +
                 C(12, 50, 3, '#C9B79A', 2) + C(54, 48, 2.6, '#C9B79A', 2))
T['cleave'] = tile('#C8403F',
                   '<path d="M8 44 C14 20 38 8 58 14" style="fill: none; stroke: #1E1A1A; stroke-width: 13; stroke-linecap: round"/>'
                   '<path d="M8 44 C14 20 38 8 58 14" style="fill: none; stroke: #FFE08A; stroke-width: 7; stroke-linecap: round"/>'
                   '<path d="M14 40 C20 24 38 15 52 18" style="fill: none; stroke: #FFFFFF; stroke-width: 2.6; stroke-linecap: round"/>' +
                   inked('M22 58 L40 30', '#A0703F', 4.5) + F('M36 24 C46 16 58 24 54 38 C46 36 40 32 36 24 Z', '#D7DEE6'))
T['smite'] = tile('#E7B53C',
                  '<circle cx="34" cy="30" r="20" style="fill: #FFF3C4; opacity: 0.5"/>' +
                  C(34, 30, 12, '#FFFFFF', 3.5) + inked('M34 22 V38 M26 30 H42', '#F2C230', 3.4) +
                  inked('M10 56 L24 40', '#FFF3C4', 4) + F('M10 50 L4 58 L14 56 Z', '#FFF3C4', 2.4) +
                  P('M50 10 L54 6 M56 18 H61 M46 6 V2', '#FFFFFF', 2.6))
T['icicle'] = tile('#1F4F7A',
                   '<circle cx="40" cy="22" r="16" style="fill: #8FD6FF; opacity: 0.3"/>' +
                   F('M8 58 L44 10 L54 18 Z', '#DDF3FF', 3.5) + P('M16 50 L44 16', '#FFFFFF', 2.4) + P('M30 42 L48 22', '#8FD6FF', 2.4) +
                   P('M52 44 V54 M47 49 H57', '#FFFFFF', 2.8) + P('M14 14 V20 M11 17 H17', '#FFFFFF', 2.4))

# ---- the four gear slots for every role
HELM = (F('M18 40 C18 18 46 18 46 40 Z', '#9AA7B8') + F('M16 38 H48 V46 H16 Z', '#7D8FA3', 3) +
        F('M18 28 C8 26 4 16 6 6 C10 14 16 18 22 20 Z', '#F0E8D2', 3) + F('M46 28 C56 26 60 16 58 6 C54 14 48 18 42 20 Z', '#F0E8D2', 3) +
        C(26, 42, 1.6, '#1E1A1A', 0) + C(32, 42, 1.6, '#1E1A1A', 0) + C(38, 42, 1.6, '#1E1A1A', 0))
PAUL = (F('M6 40 C4 22 22 14 30 26 C24 36 14 42 6 40 Z', '#9AA7B8') + F('M58 40 C60 22 42 14 34 26 C40 36 50 42 58 40 Z', '#9AA7B8') +
        P('M10 34 C14 28 20 26 26 28 M54 34 C50 28 44 26 38 28', '#C9D2DC', 2.4) + C(16, 30, 2.4, '#F2C230', 1.6) + C(48, 30, 2.4, '#F2C230', 1.6))
HOOD = (F('M14 52 C10 30 18 10 32 10 C46 10 54 30 50 52 C42 46 22 46 14 52 Z', '#F6F1E4') +
        F('M22 44 C20 30 24 22 32 22 C40 22 44 30 42 44 C38 40 26 40 22 44 Z', '#3A2E40', 3) + P('M32 10 V20', '#E7B53C', 3))
MANT = (F('M6 42 C8 26 20 18 32 18 C44 18 56 26 58 42 C48 38 40 40 32 46 C24 40 16 38 6 42 Z', '#F6F1E4') +
        P('M14 34 C20 28 26 26 32 26 C38 26 44 28 50 34', '#E7B53C', 3) + C(32, 30, 4, '#F2C230', 2.4))
HAT = (F('M8 50 C20 44 44 44 56 50 C46 56 18 56 8 50 Z', '#4F86C6') + F('M20 48 C22 34 30 22 44 8 C42 22 42 36 44 48 Z', '#4F86C6') +
       F('M20 46 C30 42 38 42 44 46 L44 50 C36 47 28 47 20 50 Z', '#F2C230', 2.6) + P('M40 14 L44 8', '#FFFFFF', 2) + C(36, 30, 2.4, '#DDF3FF', 1.6))
T['i_helm'] = tile(IB, HELM)
T['i_pauldrons'] = tile(IB, PAUL)
T['i_hood'] = tile(IB, HOOD)
T['i_mantle'] = tile(IB, MANT)
T['i_hat'] = tile(IB, HAT)

# ---- Barrow set pieces: the slot shape on the set's colour, with the set's mark in the corner
MARKS = {
    'barrowguard': ('#3F5A3A', C(52, 52, 8, '#F0E8D2', 2.6) + C(49.5, 51, 1.6, '#1E1A1A', 0) + C(54.5, 51, 1.6, '#1E1A1A', 0)),
    'candlewake': ('#5E3FA3', F('M48 60 V48 H56 V60 Z', '#F6F1E4', 2.4) + F('M52 46 C55 42 54 39 52 36 C50 39 49 42 52 46 Z', '#F2C230', 2)),
    'rimebone': ('#1F4F7A', P('M52 44 V60 M45 48 L59 56 M45 56 L59 48', '#1E1A1A', 5) + P('M52 44 V60 M45 48 L59 56 M45 56 L59 48', '#DDF3FF', 2.2)),
}
SET_SHAPES = {'barrowguard': {'helm': HELM, 'shoulders': PAUL, 'chest': None}, 'candlewake': {'helm': HOOD, 'shoulders': MANT, 'chest': None}, 'rimebone': {'helm': HAT, 'shoulders': MANT, 'chest': None}}
PLATE = F('M18 16 C26 12 38 12 46 16 L50 28 L44 30 V52 H20 V30 L14 28 Z', '#9AA7B8') + P('M32 18 V50', '#7D8FA3', 3)
ROBE_G = F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#F6F1E4') + F('M28 18 L32 22 L36 18 L34 54 H30 Z', '#E7B53C', 2.6)
ROBE_B = F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#4F86C6') + F('M28 18 L32 22 L36 18 L34 54 H30 Z', '#DDF3FF', 2.6)
for set_id, (bg, mark) in MARKS.items():
    shapes = SET_SHAPES[set_id]
    chest = PLATE if set_id == 'barrowguard' else ROBE_G if set_id == 'candlewake' else ROBE_B
    T[f's_{set_id}_helm'] = tile(bg, shapes['helm'] + mark)
    T[f's_{set_id}_shoulders'] = tile(bg, shapes['shoulders'] + mark)
    T[f's_{set_id}_chest'] = tile(bg, chest + mark)

# ---- the Gravekeeper's three weapons
T['u_gravedigger'] = tile('#4E6B45', inked('M18 58 L42 14', '#A0703F', 5) +
                          F('M36 10 C48 2 62 12 58 30 C48 28 40 22 36 10 Z', '#D7DEE6') +
                          F('M12 48 L24 54 L20 64 L6 58 Z', '#8E96A3', 3) + C(30, 36, 3, '#9BE15D', 1.8))
T['u_longnight'] = tile('#2F6F5A', inked('M14 60 L34 22', '#A0703F', 4.5) + P('M34 22 L42 18', '#1E1A1A', 3) +
                        '<circle cx="46" cy="30" r="14" style="fill: #9BE15D; opacity: 0.3"/>' +
                        F('M38 22 H54 L52 42 H40 Z', '#4A4458', 3) + F('M42 26 H50 V38 H42 Z', '#E9FFD9', 2) +
                        F('M46 28 C49 31 49 35 46 37 C43 35 43 31 46 28 Z', '#9BE15D', 1.6))
T['u_gravefrost'] = tile('#1F4F7A', inked('M16 60 L36 26', '#6B5A70', 4.5) +
                         '<circle cx="40" cy="18" r="14" style="fill: #8FD6FF; opacity: 0.35"/>' +
                         F('M30 22 C30 10 50 10 50 22 C50 26 48 28 46 29 V33 H34 V29 C32 28 30 26 30 22 Z', '#F0E8D2', 3) +
                         C(36, 21, 2.8, '#8FD6FF', 0) + C(44, 21, 2.8, '#8FD6FF', 0) + P('M38 30 V33 M42 30 V33', '#1E1A1A', 1.6))

# ---- looks: rewards that change how you look, never how hard you hit
T['c_dye'] = tile('#5C5070', '<circle cx="32" cy="38" r="20" style="fill: #DCFFF0; opacity: 0.25"/>' +
                  F('M24 22 H40 V28 C48 32 50 40 46 48 C42 56 22 56 18 48 C14 40 16 32 24 28 Z', '#DCFFF0') +
                  F('M26 14 H38 V22 H26 Z', '#A0703F', 3) + P('M24 40 C30 44 36 44 42 40', '#9FD9C6', 2.4) + P('M26 32 L22 38', '#FFFFFF', 2))
T['c_trail'] = tile('#2F6F5A', '<path d="M6 52 C20 48 30 30 58 12" style="fill: none; stroke: #C8F5E8; stroke-width: 12; stroke-linecap: round; opacity: 0.35"/>' +
                    inked('M6 52 C20 48 30 30 58 12', '#C8F5E8', 4) + C(16, 46, 3, '#FFFFFF', 0) + C(34, 30, 2.4, '#FFFFFF', 0) + C(50, 18, 2, '#FFFFFF', 0))
T['c_glow_shield'] = tile('#C8403F', '<circle cx="32" cy="32" r="27" style="fill: #F2C230; opacity: 0.35"/>' +
                          C(32, 32, 21, '#F2C230', 3.5) + C(32, 32, 15, '#C8403F', 3) + C(32, 32, 5.5, '#C9D2DC', 3) +
                          P('M18 18 C24 12 32 11 38 12', '#FFFFFF', 2.6))
T['c_glow_staff'] = tile('#E07A2E', '<circle cx="40" cy="20" r="18" style="fill: #FFE08A; opacity: 0.45"/>' +
                         inked('M16 60 L38 24', '#A0703F', 4.5) + rays + C(40, 20, 7, '#FFF6D0', 3))
T['c_crit_ice'] = tile('#1F4F7A', '<text x="32" y="47" text-anchor="middle" style="font: 40px \'Lilita One\', sans-serif; fill: #DDF3FF; stroke: #1E1A1A; stroke-width: 3; paint-order: stroke">!</text>' +
                       F('M10 20 L16 12 L22 20 L16 28 Z', '#DDF3FF', 2.4) + F('M44 50 L50 44 L56 50 L50 56 Z', '#DDF3FF', 2.4) + F('M46 14 L50 10 L54 14 L50 18 Z', '#8FD6FF', 2))
# ---- account things: marks, kill count, achievements
T['marks'] = tile('#3A3150', C(32, 32, 20, '#C9A040', 3.5) + C(32, 32, 14, '#E7C25A', 2.4) +
                  F('M24 32 C24 24 40 24 40 32 C40 35 38 37 36 38 V41 H28 V38 C26 37 24 35 24 32 Z', '#3A3150', 2) +
                  C(29, 31, 2, '#E7C25A', 0) + C(35, 31, 2, '#E7C25A', 0))


# ---- heroic Barrow drops: the same pieces, gilded
for _n in ['s_barrowguard_helm', 's_barrowguard_shoulders', 's_barrowguard_chest', 's_candlewake_helm', 's_candlewake_shoulders', 's_candlewake_chest',
           's_rimebone_helm', 's_rimebone_shoulders', 's_rimebone_chest', 'u_gravedigger', 'u_longnight', 'u_gravefrost']:
    T[_n + '_gilded'] = gild(T[_n], {'#4A4458': '#8A6418'} if _n == 'u_longnight' else None, tile=True)
T['c_dye_gilded'] = gild(T['c_dye'], {'#9FD9C6': '#F2C230', '#DCFFF0': '#FFE9A8'}, tile=True)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    json.dump(T, open(OUT + 'icons.json', 'w'))
    cells = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:72px;height:72px;border-radius:13px;overflow:hidden;border:3px solid #1E1A1A;box-shadow:0 4px 0 #1E1A1A">{v.replace("<svg ", "<svg style=\"display:block;width:100%;height:100%\" ")}</div><span style="font:12px monospace">{k}</span></div>' for k, v in T.items())
    open(OUT + '_icons_preview.html', 'w').write(f'<body style="margin:0;padding:20px;background:#FFF8EC"><div style="display:flex;gap:14px;flex-wrap:wrap;width:900px">{cells}</div></body>')
    print('tiles', len(T))
