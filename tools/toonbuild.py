import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Builds the "TV epic" Look Book board. Usage: toonbuild.py <height>
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tvworld import PIECES

ROOT = HF_ROOT + '/lookbook/project/'
H = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
wb = open(ROOT + 'Workbench.dc.html', encoding='utf-8').read()
header = wb[wb.index('<header'):wb.index('</header>') + len('</header>')]
cur_wb = '<a href="Workbench.dc.html" aria-current="page" style="display: inline-flex; align-items: center; min-height: 44px; color: #F4B942; text-decoration: underline; text-underline-offset: 6px;">Workbench</a>'
assert cur_wb in header
header = header.replace(cur_wb, '<a href="Workbench.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: #D9C9AE; text-decoration: none;">Workbench</a>')
tv_norm = '<a href="Toon.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: #D9C9AE; text-decoration: none;">TV epic</a>'
assert tv_norm in header
header = header.replace(tv_norm, '<a href="Toon.dc.html" aria-current="page" style="display: inline-flex; align-items: center; min-height: 44px; color: #F4B942; text-decoration: underline; text-underline-offset: 6px;">TV epic</a>')

DISPLAY = "font-family: 'Lilita One', 'Trebuchet MS', sans-serif"
MONO = "font-family: 'DM Mono', ui-monospace, Menlo, Consolas, monospace"
CARD = 'margin: 0; background: #211B29; border: 2px solid #3B3146; border-radius: 16px; box-shadow: 0 4px 0 #0E0B12; overflow: hidden; display: flex; flex-direction: column;'


def card(art, title, line, art_style='padding: 0;', inner='width: 100%;'):
    return (f'<figure style="{CARD}">'
            f'<div style="{art_style}"><div style="{inner}">{art}</div></div>'
            f'<figcaption style="padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 4px; border-top: 2px solid #2A2234;">'
            f'<span style="{DISPLAY}; font-size: 22px; line-height: 1.15; color: #F6E9D2;">{title}</span>'
            f'<span style="font-size: 16px; line-height: 1.5; color: #D9C9AE;">{line}</span>'
            f'</figcaption></figure>')


def h2(eyebrow, title, sub=None):
    s = (f'<div style="display: flex; flex-direction: column; gap: 6px;">'
         f'<div style="{MONO}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #F4B942;">{eyebrow}</div>'
         f'<h2 style="margin: 0; {DISPLAY}; font-weight: 400; font-size: 36px; line-height: 1.05; color: #F6E9D2;">{title}</h2>')
    if sub:
        s += f'<p style="margin: 0; max-width: 720px; font-size: 17px; line-height: 1.55; color: #D9C9AE;">{sub}</p>'
    return s + '</div>'


def section(head, grid_cols, cards):
    return (f'<div style="display: flex; flex-direction: column; gap: 20px;">{head}'
            f'<div style="display: grid; grid-template-columns: {grid_cols}; gap: 20px; align-items: start;">{"".join(cards)}</div></div>')


armour = section(h2('Armour', 'Plate, leather, cloth, mail'), 'repeat(auto-fit, minmax(240px, 1fr))', [
    card(PIECES['warden'](), 'Plate · The Iron Warden', 'Tank. Bucket helm, red plume, pauldrons you could serve dinner on.'),
    card(PIECES['rogue'](), 'Leather · Mossblade', 'Rogue. Hood, mask and a knife for every occasion.'),
    card(PIECES['sorceress'](), 'Cloth · Emberweave', 'Mage. A big collar and a bigger fireball.'),
    card(PIECES['orc'](), 'Mail · Grukk', 'Ranger. An orc with a longbow and chainmail that has seen things.'),
])
places = section(h2('Places', 'Where the fights happen'), 'repeat(auto-fit, minmax(min(440px, 100%), 1fr))', [
    card(PIECES['village'](), 'Highfell village', 'Home base. Timber houses, the Last Lantern inn and one brave chicken.'),
    card(PIECES['throne'](), 'The Barrow throne', 'The raid room. He left his crown on the seat.'),
    card(PIECES['wolfwood'](), 'Wolfwood road', 'Dungeon country. Signposts, pines and a castle in the distance.'),
    card(PIECES['gate'](), 'The barrow gate', 'Where the raid starts. Torches, graves and something green inside.'),
])
narrow = 'padding: 0; display: flex; justify-content: center; background: #16121C;'
side = section(h2('Side by side', 'Same things, style 1 and style 2', 'Left is the TV cartoon look, right is the painted chunky heroic look. Same drawings underneath, so you can see what the style alone does.'),
               'repeat(auto-fit, minmax(min(440px, 100%), 1fr))', [
    card(PIECES['warden'](), 'Style 1 · TV cartoon', 'Black lines, flat colour, bright and friendly.', narrow, 'width: 100%; max-width: 320px;'),
    card(PIECES['warden_h'](), 'Style 2 · Chunky heroic', 'No lines, painted light, moodier and heavier.', narrow, 'width: 100%; max-width: 320px;'),
    card(PIECES['village'](), 'Style 1 · Village', 'Reads instantly, even tiny on a phone.'),
    card(PIECES['village_h'](), 'Style 2 · Village', 'Sunset light and more depth, a little busier.'),
    card(PIECES['throne'](), 'Style 1 · Throne room', 'Clean and cartoony, the Marge Gamer feel.'),
    card(PIECES['throne_h'](), 'Style 2 · Throne room', 'Glows and shadow do more of the work.'),
])
phone_frame = ('<div style="width: 100%; max-width: 340px; border-radius: 34px; border: 8px solid #0E0B12; box-shadow: 0 0 0 2px #3B3146; overflow: hidden;">'
               + PIECES['phone']() + '</div>')
phone = section(h2('On a phone', 'How it plays', 'Portrait, your character up front, the party behind you, the same icon bar as the fight.'),
                'repeat(auto-fit, minmax(min(360px, 100%), 420px))', [
    card(phone_frame, 'Wolfwood road, in game', 'Portrait and health top left, minimap and quest top right, abilities along the bottom.',
         'padding: 24px 16px; display: flex; justify-content: center; background: #1B1622;', 'width: 100%; display: flex; justify-content: center;'),
])

body = f'''<div style="background: #16121C; color: #F6E9D2; font-family: 'Spectral', Georgia, serif; font-size: 17px; line-height: 1.6; min-height: 100vh; display: flex; flex-direction: column;">

{header}

<section style="padding-block: 56px 72px;">
<div style="max-width: 1200px; margin: 0 auto; padding-inline: 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 48px;">
<div style="display: flex; flex-direction: column; gap: 18px;">
<div style="{MONO}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #F4B942;">Styles 1 and 2</div>
<h1 style="margin: 0; {DISPLAY}; font-weight: 400; font-size: clamp(44px, 6vw, 84px); line-height: 1; letter-spacing: 0.01em; color: #F6E9D2; text-wrap: balance;">TV epic</h1>
<p style="margin: 0; max-width: 760px; font-size: 20px; line-height: 1.6; color: #D9C9AE;">TV-cartoon lines and colour on chunky heroic armour, the Marge Gamer mix. Four armour types, four places, a few things in both styles side by side, and how it looks on a phone. All our own designs.</p>
</div>
{armour}
{places}
{side}
{phone}
</div>
</section>

<footer style="flex: 1 0 auto; display: flex; align-items: center; border-top: 2px solid #2A2234; background: #120E17;">
<div style="flex: 1; max-width: 1200px; margin: 0 auto; padding-inline: 24px; padding-block: 48px; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 20px 32px; justify-content: space-between; align-items: center;">
<p style="margin: 0; {DISPLAY}; font-size: 26px; color: #D9C9AE;">Back to the styles.</p>
<nav aria-label="Keep going" style="display: flex; flex-wrap: wrap; gap: 12px;">
<a href="Style.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding-inline: 20px; border-radius: 14px; background: #F4B942; color: #16121C; box-shadow: 0 4px 0 #A8741C; {DISPLAY}; font-size: 18px; text-decoration: none;">Cartoon epic</a>
<a href="Main.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding-inline: 20px; border-radius: 14px; border: 2px solid #4E4160; background: #211B29; color: #F6E9D2; box-shadow: 0 4px 0 #0E0B12; {DISPLAY}; font-size: 18px; text-decoration: none;">The look</a>
</nav>
</div>
</footer>

</div>'''

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TV epic</title>
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
open(ROOT + 'Toon.dc.html', 'w', encoding='utf-8').write(page)
print('bytes', len(page.encode()), 'height', H)
