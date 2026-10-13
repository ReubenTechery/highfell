import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Builds the Season 0 cast cards and assembles Season0.dc.html from the template + stage.
import os, html, re
os.chdir(HF_ROOT + '')
H = [
 dict(name='Brannoc Ashvale', race='dwarf', kit='warrior', skin=None, hair=None, glow='#FF8A4C', label='Dwarf warrior · Emberdeep',
      bio="Holds the boss's attention, mostly by insulting it. Has never lost an arm-wrestle or an argument about beards.",
      joke="The dent in his helmet. He won't say how, and three people claim it was them.",
      glowline="The ember rune in his axe, warm as the forge it came from."),
 dict(name='Wren', race='gnome', kit='rogue', skin=None, hair=None, glow='#B79CFF', label='Gnome rogue · Bramblewick',
      bio="The only one who can interrupt a spell, and the only one banned from the Last Lantern. Twice.",
      joke="A bandit's scarf pulled up over a nose that size. Everyone knows it's Wren.",
      glowline="Violet dagger edges that flash the moment she interrupts."),
 dict(name='Ivy', race='elf', kit='mage', skin=None, hair=None, glow='#8FD6FF', label='Elf mage · Moonmere',
      bio="Lifts curses and hits the hardest. Has been calm for three hundred years and would like everyone to stop shouting.",
      joke="A hat so tall she ducks under every beam in the inn. It stays on.",
      glowline="A frost orb on her staff that hums just before the boss casts."),
 dict(name='Hollis', race='dwarf', kit='bard', skin='#8D5A3B', hair='#9AA3AD', glow='#FF7A9A', label='Dwarf bard · Emberdeep',
      bio="Counts the table in for the Battle Hymn. Has written a song about every raid, including the ones he missed.",
      joke="The feather in his cap was borrowed from a very angry goose.",
      glowline="A pink note floats off his lute whenever he plays. Nobody knows how."),
 dict(name='Sister Maren', race='human', kit='cleric', skin='#5A3826', hair='#2E1F18', glow='#F4B942', label='Human cleric · Highfell',
      bio="Sees everyone's health and has opinions about all of it. Revives the fallen, with a short lecture.",
      joke="Her lantern is the old sign from the Last Lantern. The landlord would like it back.",
      glowline="A lantern that never goes out, not even underwater."),
 dict(name='Tomas', race='human', kit='ranger', skin='#F2D0B4', hair='#C8572B', glow='#9BD068', label='Human ranger · Highfell',
      bio="Sees the boss's next two moves and calls them out loud, usually a second too late.",
      joke="Names every arrow. Takes it personally when one doesn't come back.",
      glowline="Moss-green fletching that lights up the weak point he's marked."),
]
MONO = "font-family: 'DM Mono', ui-monospace, Menlo, Consolas, monospace"
e = html.escape
cards = []
for h in H:
    sk = f' skin="{h["skin"]}"' if h['skin'] else ''
    hr = f' hair="{h["hair"]}"' if h['hair'] else ''
    cards.append(f'''<article style="background: #211B29; border: 2px solid #3B3146; border-radius: 16px; box-shadow: 0 4px 0 #0E0B12; padding: 20px; display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">
<div style="flex: 0 0 168px;"><dc-import name="Hero" race="{h['race']}" kit="{h['kit']}"{sk}{hr} glow="{h['glow']}" backdrop="plate" hint-size="168px,224px"></dc-import></div>
<div style="flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: 8px;">
<div style="{MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: {h['glow']};">{e(h['label'])}</div>
<h3 style="margin: 0; font-family: 'Lilita One', 'Trebuchet MS', sans-serif; font-weight: 400; font-size: 30px; line-height: 1.05; color: #F6E9D2;">{e(h['name'])}</h3>
<p style="margin: 0; font-style: italic; font-size: 16.5px; line-height: 1.5; color: #D9C9AE;">{e(h['bio'], quote=False)}</p>
<dl style="margin: 4px 0 0; display: flex; flex-direction: column; gap: 8px; font-size: 15.5px; line-height: 1.5;">
<div><dt style="{MONO}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A8977F;">The joke</dt><dd style="margin: 2px 0 0; color: #F6E9D2;">{e(h['joke'], quote=False)}</dd></div>
<div><dt style="{MONO}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: {h['glow']};">The glow</dt><dd style="margin: 2px 0 0; color: #F6E9D2;">{e(h['glowline'], quote=False)}</dd></div>
</dl>
</div>
</article>''')
t = open('build/season0_template.html').read()
t = t.replace('%%STAGE%%', open('build/stage.svg.html').read()).replace('%%CARDS%%', '\n'.join(cards))
assert '%%' not in t
open('lookbook/project/Season0.dc.html', 'w').write(t)
vis = re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S))
print('stroke in visible text:', 'stroke' in vis.lower())
