import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Builds the "Style lock" rulebook board for the Look Book. Usage: rulesbuild.py <height>
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tvworld import PIECES, Pen, iron_warden, sorceress, orc_ranger, rogue
from artstyles import tv as tv_dwarf

ROOT = HF_ROOT + '/lookbook/project/'
H = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
wb = open(ROOT + 'Workbench.dc.html', encoding='utf-8').read()
header = wb[wb.index('<header'):wb.index('</header>') + len('</header>')]
cur_wb = '<a href="Workbench.dc.html" aria-current="page" style="display: inline-flex; align-items: center; min-height: 44px; color: #F4B942; text-decoration: underline; text-underline-offset: 6px;">Workbench</a>'
assert cur_wb in header
header = header.replace(cur_wb, '<a href="Workbench.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: #D9C9AE; text-decoration: none;">Workbench</a>')
lock_norm = '<a href="Rules.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: #D9C9AE; text-decoration: none;">Style lock</a>'
assert lock_norm in header
header = header.replace(lock_norm, '<a href="Rules.dc.html" aria-current="page" style="display: inline-flex; align-items: center; min-height: 44px; color: #F4B942; text-decoration: underline; text-underline-offset: 6px;">Style lock</a>')

DISPLAY = "font-family: 'Lilita One', 'Trebuchet MS', sans-serif"
MONO = "font-family: 'DM Mono', ui-monospace, Menlo, Consolas, monospace"
CARD = 'margin: 0; background: #211B29; border: 2px solid #3B3146; border-radius: 16px; box-shadow: 0 4px 0 #0E0B12; overflow: hidden; display: flex; flex-direction: column;'
LINE = '#1E1A1A'


def h2(num, title):
    return (f'<div style="display: flex; align-items: baseline; gap: 14px;">'
            f'<span style="{DISPLAY}; font-size: 22px; color: #16121C; background: #F4B942; border-radius: 999px; min-width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; flex: none;">{num}</span>'
            f'<h2 style="margin: 0; {DISPLAY}; font-weight: 400; font-size: 34px; line-height: 1.05; color: #F6E9D2;">{title}</h2></div>')


def rule_list(items):
    lis = ''.join(f'<li style="display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 8px; align-items: start;"><span aria-hidden="true" style="width: 10px; height: 10px; margin-top: 9px; border-radius: 50%; background: #F4B942; border: 2px solid {LINE};"></span><span>{t}</span></li>' for t in items)
    return f'<ul style="margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; font-size: 18px; line-height: 1.55; color: #E8DCC6;">{lis}</ul>'


def block(num, title, items, visual):
    return (f'<section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr)); gap: 28px; align-items: start;">'
            f'<div style="display: flex; flex-direction: column; gap: 16px;">{h2(num, title)}{rule_list(items)}</div>'
            f'<div style="{CARD}">{visual}</div></section>')


def swatch(name, hexv, dark_text=True):
    tc = LINE if dark_text else '#FFFFFF'
    return (f'<div style="display: flex; flex-direction: column; gap: 6px;">'
            f'<div style="height: 58px; border-radius: 12px; background: {hexv}; border: 3px solid {LINE}; box-shadow: 0 3px 0 {LINE};"></div>'
            f'<div style="{DISPLAY}; font-size: 15px; line-height: 1.1; color: #F6E9D2;">{name}</div>'
            f'<div style="{MONO}; font-size: 11px; letter-spacing: 0.06em; color: #A8977F;">{hexv}</div></div>')


def swatch_group(title, chips):
    cells = ''.join(swatch(n, h) for n, h in chips)
    return (f'<div style="display: flex; flex-direction: column; gap: 12px;">'
            f'<div style="{MONO}; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #F4B942;">{title}</div>'
            f'<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 14px;">{cells}</div></div>')


def crop(svg, vb, label):
    return re.sub(r'<svg viewBox="[^"]*" role="img" aria-label="[^"]*"', f'<svg viewBox="{vb}" role="img" aria-label="{label}"', svg, count=1)


def framed(inner, bg='#FFF8EC', pad='16px'):
    return f'<div style="background: {bg}; padding: {pad};">{inner}</div>'


# ---- visuals
line_svg = ('<svg viewBox="0 0 520 210" role="img" aria-label="Line samples: the same near-black line at character and scenery weights" style="display: block; width: 100%; height: auto;">'
            '<rect width="520" height="210" style="fill: #FFF8EC"/>'
            f'<path d="M30 60 C90 20 150 100 210 60 S330 20 390 60" style="fill: none; stroke: {LINE}; stroke-width: 3; stroke-linecap: round"/>'
            f'<path d="M30 130 C90 90 150 170 210 130 S330 90 390 130" style="fill: none; stroke: {LINE}; stroke-width: 2.5; stroke-linecap: round"/>'
            f'<path d="M30 185 C90 160 150 205 210 185 S330 160 390 185" style="fill: none; stroke: {LINE}; stroke-width: 5; stroke-linecap: round"/>'
            f"<text x=\"412\" y=\"66\" style=\"font-family: 'Lilita One', sans-serif; font-size: 17px; fill: {LINE}\">Characters 3</text>"
            f"<text x=\"412\" y=\"136\" style=\"font-family: 'Lilita One', sans-serif; font-size: 17px; fill: {LINE}\">Scenery 2.5</text>"
            f"<text x=\"412\" y=\"191\" style=\"font-family: 'Lilita One', sans-serif; font-size: 17px; fill: {LINE}\">Drawn small 5</text>"
            '</svg>')

lineup = ''.join(f'<div style="flex: 1 1 0; min-width: 0;">{s}</div>' for s in (PIECES['warden'](), PIECES['rogue'](), PIECES['sorceress'](), PIECES['orc']()))
lineup = f'<div style="display: flex; gap: 0;">{lineup}</div>'

faces = [
    crop(tv_dwarf(), '84 92 132 132', 'Face sheet: dwarf'),
    crop(sorceress(Pen(True)), '98 40 104 104', 'Face sheet: sorceress'),
    crop(orc_ranger(Pen(True)), '90 56 120 120', 'Face sheet: orc'),
    crop(rogue(Pen(True)), '100 68 100 100', 'Face sheet: rogue'),
]
face_row = '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0;">' + ''.join(f'<div>{f}</div>' for f in faces) + '</div>'

do_dont = ('<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">'
           f'<div style="position: relative;">{PIECES["warden"]()}<div style="position: absolute; left: 12px; top: 12px; {DISPLAY}; font-size: 18px; color: #FFFFFF; background: #4E9A4A; border: 3px solid {LINE}; border-radius: 10px; padding: 2px 10px;">Do</div></div>'
           f'<div style="position: relative;">{PIECES["warden_h"]()}<div style="position: absolute; left: 12px; top: 12px; {DISPLAY}; font-size: 18px; color: #FFFFFF; background: #C8403F; border: 3px solid {LINE}; border-radius: 10px; padding: 2px 10px;">Not any more</div></div>'
           '</div>')

palette = ''.join([
    swatch_group('World', [('Sky', '#9FD3EE'), ('Cloud', '#FFFFFF'), ('Mountain', '#8AA6C1'), ('Hill', '#9CCB7A'), ('Grass', '#7DBB5E'), ('Road', '#D8BE8C'), ('Stone', '#A9A39A'), ('Timber wall', '#F1E6CF'), ('Wood', '#8A5A34'), ('Dark wood', '#6B4528')]),
    swatch_group('Dungeon and night', [('Purple stone', '#5C5070'), ('Crypt floor', '#3E3550'), ('Dusk', '#5A4A7A'), ('Moon', '#F3EBD2'), ('Banner', '#2F5A44'), ('Pine', '#3F7A4A')]),
    swatch_group('Gear', [('Plate', '#7D8FA3'), ('Mail', '#A7B0BA'), ('Gold', '#E7B53C'), ('Crimson', '#B8383A'), ('Royal blue', '#4F6FA8'), ('Robe purple', '#6A4BA3')]),
    swatch_group('Magic', [('Barrow green', '#9BD068'), ('Fire', '#FF8A4C'), ('Flame', '#FFE08A'), ('Frost', '#8FD6FF'), ('Arcane', '#B79CFF')]),
    swatch_group('Skin', [('Peach', '#F2B48C'), ('Tan', '#D9A57A'), ('Brown', '#A86F4C'), ('Deep', '#7A4A30'), ('Elf', '#F3D7C4'), ('Orc', '#7FA35A')]),
    swatch_group('Line and panels', [('Line', '#1E1A1A'), ('Panel cream', '#FFF8EC')]),
])

sections = ''.join([
    block(1, 'Line', [
        'One near-black line, <b>#1E1A1A</b>, around everything. No coloured outlines on characters.',
        'The same weight all over a piece: 3 on characters, 2.5 on scenery at full size.',
        'Drawn small (heroes in a fight, icons) the line gets thicker so it still reads.',
        'Rounded ends and corners. No sketchy, broken or hairline lines.',
    ], framed(line_svg, pad='0')),
    block(2, 'Shape and proportion', [
        'Simple bodies, chunky gear: pauldrons wider than the head, big hands, big weapons, short legs.',
        'Every character reads as a silhouette at phone size. If it does not, simplify.',
        'Each class gets its own outline: plate is square and spiky, leather is lean and hooded, cloth flares, mail is broad.',
        'Fantasy medieval, storybook not gritty.',
    ], lineup),
    block(3, 'Faces', [
        'White oval eyes, set apart, with a black dot pupil. Thick eyebrows do the acting.',
        'Big round noses and simple mouths. Beards, tusks and ears do the rest.',
        'Real skin tones plus fantasy ones: orc green, elf pale.',
        'Never yellow skin, never touching bug eyes, never an overbite. Those belong to someone else.',
    ], face_row),
    block(4, 'Colour', [
        'Flat fills only. Characters get no shading at all.',
        'Bright sitcom colour: blue sky, green grass, warm wood, strong reds, blues and purples.',
        'Night and dungeons go purple, never black.',
        'Use the palette below. A new colour gets added here first.',
    ], framed(PIECES['village'](), '#9FD3EE', '0')),
    block(5, 'Light and glow', [
        'Glow is only for magic, fire and loot.',
        'One soft flat halo behind the glowing thing. No gradients, no airbrush, no lens flare.',
        'Torches, lanterns and spells are the light in a dark room.',
    ], framed(PIECES['throne'](), '#5C5070', '0')),
    block(6, 'Scenery', [
        'Flat painted layers: sky, far hills, near ground. The same black line, a touch lighter.',
        'Storybook medieval details: timber beams, leaded windows, banners, torches, signposts.',
        'One or two colours per surface. Stone blocks and planks are drawn with a darker line, not texture.',
    ], framed(PIECES['wolfwood'](), '#A9DCF2', '0')),
    block(7, 'Screens', [
        'Cream panels with the black line, rounded corners and a hard drop shadow.',
        'Lilita One for names, numbers and calls. Small labels can use the mono font.',
        'Icons follow every rule above: black line, flat colour, one idea each.',
        'Portrait first. Everything important sits in the top and bottom bands, the world in the middle.',
    ], f'<div style="display: flex; justify-content: center; padding: 20px; background: #1B1622;"><div style="width: 100%; max-width: 300px; border-radius: 30px; border: 7px solid #0E0B12; overflow: hidden;">{PIECES["phone"]()}</div></div>'),
    block(8, 'Do and don\'t', [
        'Do: line plus flat colour, chunky gear, simple faces, bright palette.',
        'Don\'t: painted shading, gradients, hairlines, realistic anatomy or AI-looking texture.',
        'Don\'t: copy characters, faces or armour from any show or game. Borrow the feel, never the features.',
        'When in doubt, put it next to the Iron Warden. If it looks like it came from another show, redraw it.',
    ], do_dont),
])

body = f'''<div style="background: #16121C; color: #F6E9D2; font-family: 'Spectral', Georgia, serif; font-size: 17px; line-height: 1.6; min-height: 100vh; display: flex; flex-direction: column;">

{header}

<section style="padding-block: 56px 72px;">
<div style="max-width: 1200px; margin: 0 auto; padding-inline: 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 56px;">
<div style="display: flex; flex-direction: column; gap: 18px;">
<div style="{MONO}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #F4B942;">Locked 13 October 2026</div>
<h1 style="margin: 0; {DISPLAY}; font-weight: 400; font-size: clamp(44px, 6vw, 84px); line-height: 1; letter-spacing: 0.01em; color: #F6E9D2; text-wrap: balance;">The style lock</h1>
<p style="margin: 0; max-width: 780px; font-size: 20px; line-height: 1.6; color: #D9C9AE;">Style 1, the TV cartoon look: chunky fantasy gear drawn like a Saturday-night sitcom. Every new piece follows these eight rules, whoever or whatever draws it.</p>
</div>
{sections}
<section style="display: flex; flex-direction: column; gap: 24px;">
{h2(9, 'The palette')}
<div style="display: flex; flex-direction: column; gap: 28px;">{palette}</div>
</section>
</div>
</section>

<footer style="flex: 1 0 auto; display: flex; align-items: center; border-top: 2px solid #2A2234; background: #120E17;">
<div style="flex: 1; max-width: 1200px; margin: 0 auto; padding-inline: 24px; padding-block: 48px; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 20px 32px; justify-content: space-between; align-items: center;">
<p style="margin: 0; {DISPLAY}; font-size: 26px; color: #D9C9AE;">See it in action.</p>
<nav aria-label="Keep going" style="display: flex; flex-wrap: wrap; gap: 12px;">
<a href="Toon.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding-inline: 20px; border-radius: 14px; background: #F4B942; color: #16121C; box-shadow: 0 4px 0 #A8741C; {DISPLAY}; font-size: 18px; text-decoration: none;">TV epic</a>
<a href="Main.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding-inline: 20px; border-radius: 14px; border: 2px solid #4E4160; background: #211B29; color: #F6E9D2; box-shadow: 0 4px 0 #0E0B12; {DISPLAY}; font-size: 18px; text-decoration: none;">The look</a>
</nav>
</div>
</footer>

</div>'''

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Style lock</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=IM+Fell+English+SC&amp;family=Lilita+One&amp;family=Spectral:ital,wght@0,400;0,500;1,400&amp;display=swap">
<style>
body{{margin:0;background:#16121C;color-scheme:dark}}
a{{color:#F4B942}}a:hover{{color:#FFD27A}}
</style>
</helmet>
{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{H}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
assert '{{' not in body and '}}' not in body
vis = re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)[^>]*>.*?</\1>', '', page, flags=re.S))
assert 'stroke' not in vis.lower(), 'visible text check'
open(ROOT + 'Rules.dc.html', 'w', encoding='utf-8').write(page)
print('bytes', len(page.encode()), 'height', H)
