import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Builds the "Cartoon epic" Look Book board from the style sketches. Usage: stylebuild.py <height>
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import json
from stylegen import PIECES
from artstyles import STYLES6

ROOT = HF_ROOT + '/lookbook/project/'
H = int(sys.argv[1]) if len(sys.argv) > 1 else 2600
wb = open(ROOT + 'Workbench.dc.html', encoding='utf-8').read()
header = wb[wb.index('<header'):wb.index('</header>') + len('</header>')]
header = header.replace('\n<a href="Style.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: #D9C9AE; text-decoration: none;">Cartoon epic</a>', '')
cur = '<a href="Workbench.dc.html" aria-current="page" style="display: inline-flex; align-items: center; min-height: 44px; color: #F4B942; text-decoration: underline; text-underline-offset: 6px;">Workbench</a>'
assert cur in header
header = header.replace(cur, '<a href="Workbench.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: #D9C9AE; text-decoration: none;">Workbench</a>\n'
                        '<a href="Style.dc.html" aria-current="page" style="display: inline-flex; align-items: center; min-height: 44px; color: #F4B942; text-decoration: underline; text-underline-offset: 6px;">Cartoon epic</a>')

DISPLAY = "font-family: 'Lilita One', 'Trebuchet MS', sans-serif"
MONO = "font-family: 'DM Mono', ui-monospace, Menlo, Consolas, monospace"
CARD = 'margin: 0; background: #211B29; border: 2px solid #3B3146; border-radius: 16px; box-shadow: 0 4px 0 #0E0B12; overflow: hidden; display: flex; flex-direction: column;'


def card(art, bg, title, line, art_style='padding: 16px 16px 0; display: flex; justify-content: center;', inner='width: 100%; max-width: 300px;'):
    return (f'<figure style="{CARD}">'
            f'<div style="background: {bg}; {art_style}"><div style="{inner}">{art}</div></div>'
            f'<figcaption style="padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 4px; border-top: 2px solid #2A2234;">'
            f'<span style="{DISPLAY}; font-size: 22px; line-height: 1.15; color: #F6E9D2;">{title}</span>'
            f'<span style="font-size: 16px; line-height: 1.5; color: #D9C9AE;">{line}</span>'
            f'</figcaption></figure>')


def phone(art, title, line):
    frame = (f'<div style="width: 100%; max-width: 320px; border-radius: 34px; border: 8px solid #0E0B12; box-shadow: 0 0 0 2px #3B3146; overflow: hidden;">{art}</div>')
    return card(frame, '#1B1622', title, line, 'padding: 24px 16px; display: flex; justify-content: center;', 'width: 100%; display: flex; justify-content: center;')


def h2(eyebrow, title):
    return (f'<div style="display: flex; flex-direction: column; gap: 6px;">'
            f'<div style="{MONO}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #F4B942;">{eyebrow}</div>'
            f'<h2 style="margin: 0; {DISPLAY}; font-weight: 400; font-size: 36px; line-height: 1.05; color: #F6E9D2;">{title}</h2></div>')


style_cards = []
for i, (key, name, line, fn) in enumerate(STYLES6):
    style_cards.append(card(fn(), '#16121C', f'{i + 1} · {name}', line, 'padding: 0;', 'width: 100%;'))
styles_html = ''.join(style_cards)

heroes = ''.join([
    card(PIECES['warden'](), '#241D33', 'The Dread Warden', 'Tank. Horns, spikes and a visor that glows.'),
    card(PIECES['cleric'](), '#1D2B2A', 'The Lantern Sister', 'Healer. Elf ears, a lantern staff, green sparks.'),
    card(PIECES['wizard'](), '#1B2236', 'Old Frostbeard', 'Mage. Big hat, bigger beard, ice in the staff.'),
    card(PIECES['dwarf'](), '#2A1E1A', 'Brannoc, redrawn', 'Warrior. Braids, fur and an axe nearly his size.'),
])
moments = ''.join([
    card(PIECES['goblin'](), '#2B3436', 'Rogues pick the chest', 'Only a rogue can open it. Tongue out is mandatory.', 'padding: 0;', 'width: 100%;'),
    card(PIECES['sets'](), '#1E1A28', 'The raid drop and its echo', 'Win the real set on raid night. Grind old raids for the faded one.', 'padding: 0;', 'width: 100%;'),
])
screens = ''.join([
    phone(PIECES['tavern'](), 'The tavern', 'Your hub: the fire, the innkeeper, the raid poster and four buttons.'),
    phone(PIECES['dungeon'](), 'A dungeon pull', 'A purple crypt, three skeletons and your bar along the bottom.'),
])

body = f'''<div style="background: #16121C; color: #F6E9D2; font-family: 'Spectral', Georgia, serif; font-size: 17px; line-height: 1.6; min-height: 100vh; display: flex; flex-direction: column;">

{header}

<section style="padding-block: 56px 72px;">
<div style="max-width: 1200px; margin: 0 auto; padding-inline: 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 44px;">
<div style="display: flex; flex-direction: column; gap: 18px;">
<div style="{MONO}; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #F4B942;">Style sketches</div>
<h1 style="margin: 0; {DISPLAY}; font-weight: 400; font-size: clamp(44px, 6vw, 84px); line-height: 1; letter-spacing: 0.01em; color: #F6E9D2; text-wrap: balance;">Pick an art style</h1>
<p style="margin: 0; max-width: 760px; font-size: 20px; line-height: 1.6; color: #D9C9AE;">The same dwarf drawn six genuinely different ways: different shapes, proportions and painting, not just new colours. Under that are the first sketches, in a chunky cartoon look. Pick a number, or two to mix, and the whole cast gets redrawn in it.</p>
</div>

<div style="display: flex; flex-direction: column; gap: 20px;">
{h2('Art styles', 'Same dwarf, six ways')}
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 20px; align-items: start;">
{styles_html}
</div>
</div>

<div style="display: flex; flex-direction: column; gap: 20px;">
{h2('First sketches', 'Four classes, one look')}
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
{heroes}
</div>
</div>

<div style="display: flex; flex-direction: column; gap: 20px;">
{h2('First sketches', 'Little things that make it WoW')}
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(440px, 100%), 1fr)); gap: 20px; align-items: start;">
{moments}
</div>
</div>

<div style="display: flex; flex-direction: column; gap: 20px;">
{h2('First sketches', 'How it sits on a phone')}
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 20px; align-items: start;">
{screens}
</div>
</div>

</div>
</section>

<footer style="flex: 1 0 auto; display: flex; align-items: center; border-top: 2px solid #2A2234; background: #120E17;">
<div style="flex: 1; max-width: 1200px; margin: 0 auto; padding-inline: 24px; padding-block: 48px; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 20px 32px; justify-content: space-between; align-items: center;">
<p style="margin: 0; {DISPLAY}; font-size: 26px; color: #D9C9AE;">Back to the start.</p>
<nav aria-label="Keep going" style="display: flex; flex-wrap: wrap; gap: 12px;">
<a href="Main.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding-inline: 20px; border-radius: 14px; background: #F4B942; color: #16121C; box-shadow: 0 4px 0 #A8741C; {DISPLAY}; font-size: 18px; text-decoration: none;">The look</a>
<a href="Races.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding-inline: 20px; border-radius: 14px; border: 2px solid #4E4160; background: #211B29; color: #F6E9D2; box-shadow: 0 4px 0 #0E0B12; {DISPLAY}; font-size: 18px; text-decoration: none;">Races</a>
</nav>
</div>
</footer>

</div>'''

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Cartoon epic</title>
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
open(ROOT + 'Style.dc.html', 'w', encoding='utf-8').write(page)
print('bytes', len(page.encode()), 'height', H)
