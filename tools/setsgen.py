import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Builds the six Season 1 set cards and assembles Sets.dc.html.
import os, html, re
os.chdir(HF_ROOT + '')
S = [
 dict(name='Rimeguard', cls='Warrior set', built=True, hero='race="dwarf" kit="rimeguard"', glow='#8FD6FF',
      theme="Armour of the old wall wardens, iced over and handed down.",
      colours=[('#2F5D8A', 'wall blue'), ('#2A3B52', 'deep slate'), ('#D7ECF7', 'rime steel')], glowname='frost',
      two="Taunt holds the boss for one extra round.", four="Once a fight, break out of a Frozen Tomb on your own.",
      joke="The helm's spikes are real icicles. Mind the doorframes.", glowline="Frost-blue gems in the axe head and the belt."),
 dict(name='Hearthkeeper', cls='Cleric set', built=False, hero='race="human" kit="cleric" skin="#5A3826" hair="#2E1F18"', glow='#FF8A4C',
      theme="Robes of the lantern-keepers who kept Highfell lit through the last long winter.",
      colours=[('#F1E3C6', 'cream'), ('#8E2E44', 'mulled wine'), ('#C9963A', 'brass')], glowname='ember',
      two="Revived heroes come back with a little more health.", four="Beacon heals two people instead of one.",
      joke="A hot-water bottle stitched into the robe.", glowline="A lantern that burns ember instead of gold."),
 dict(name='Snowdrift', cls='Rogue set', built=False, hero='race="gnome" kit="rogue"', glow='#8FD6FF',
      theme="Whites and greys for crossing snowfields unseen.",
      colours=[('#E9EEF2', 'snow'), ('#6E7A86', 'slate'), ('#B24A3A', 'scarf red')], glowname='frost',
      two="The kick window stays open half a second longer.", four="Once a fight, a kick also freezes the boss for a round.",
      joke="Perfect camouflage in snow. Blinding white everywhere else.", glowline="Dagger edges that frost over mid-swing."),
 dict(name='Aurora', cls='Mage set', built=False, hero='race="elf" kit="mage"', glow='#B79CFF',
      theme="Robes that do the northern lights in four flat colours.",
      colours=[('#1E4E5A', 'night teal'), ('#4B2E83', 'violet'), ('#9FE8C8', 'aurora mint')], glowname='moon',
      two="Every dispel clears one extra curse.", four="Frost and Shatter combos hit even harder.",
      joke="A small personal cloud that snows on her hat.", glowline="A staff orb that drifts from moon to frost."),
 dict(name='Wolfrunner', cls='Ranger set', built=False, hero='race="human" kit="ranger" skin="#F2D0B4" hair="#C8572B"', glow='#9BD068',
      theme="Furs from the Wolfden pack, given freely. Mostly.",
      colours=[('#8A8F98', 'wolf grey'), ('#3E5A2E', 'pine'), ('#EDE3CC', 'bone')], glowname='moss',
      two="See the boss's next three moves, not two.", four="Weak points you mark last an extra round.",
      joke="A wolf-head hood with one ear that won't stay up.", glowline="Moss-green arrowheads that leave a trail."),
 dict(name='Wassail', cls='Bard set', built=False, hero='race="dwarf" kit="bard" skin="#8D5A3B" hair="#9AA3AD"', glow='#F4B942',
      theme="A carolling coat for midwinter, sewn for singing door to door.",
      colours=[('#2E5A3A', 'holly'), ('#B8452E', 'berry'), ('#F1E3C6', 'cream')], glowname='lantern',
      two="The Battle Hymn beat lasts a little longer.", four="Rally reaches two tables instead of one.",
      joke="Bells on everything. Sneaking is off the table.", glowline="Gold bells that ring on the beat."),
]
MONO = "font-family: 'DM Mono', ui-monospace, Menlo, Consolas, monospace"
e = html.escape
def tint(h, k=0.35, base=(0x21, 0x1B, 0x29)):
    r, g, b = int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)
    mix = [round(k * c + (1 - k) * d) for c, d in zip((r, g, b), base)]
    return '#' + ''.join(f'{v:02X}' for v in mix)
cards = []
for s in S:
    sil = '' if s['built'] else ' silhouette="on"'
    pill = ('<span style="flex: none; ' + MONO + '; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #16121C; background: #9BD068; border-radius: 999px; padding: 4px 10px;">In the kit</span>') if s['built'] else ('<span style="flex: none; ' + MONO + '; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A8977F; border: 2px dashed #4E4160; border-radius: 999px; padding: 2px 8px;">Sketch</span>')
    names = ', '.join(n for _, n in s['colours']) + ' and a ' + s['glowname'] + ' glow'
    chips = ''.join(f'<span style="width: 26px; height: 26px; border-radius: 6px; border: 2px solid #2A1A22; background: {c};"></span>' for c, _ in s['colours'])
    chips += f'<span style="width: 26px; height: 26px; border-radius: 50%; border: 2px solid #2A1A22; background: {s["glow"]}; box-shadow: 0 0 0 3px #211B29, 0 0 0 5px {s["glow"]};"></span>'
    cards.append(f'''<article style="background: #211B29; border: 2px solid #3B3146; border-radius: 16px; box-shadow: 0 4px 0 #0E0B12; overflow: hidden; display: flex; flex-direction: column;">
<div style="background: {tint(s['glow'])}; border-bottom: 2px solid #3B3146; padding: 16px 16px 8px; display: flex; justify-content: center;">
<div style="width: 180px;"><dc-import name="Hero" {s['hero']}{sil} glow="{s['glow']}" backdrop="none" hint-size="180px,240px"></dc-import></div>
</div>
<div style="padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 10px;">
<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;"><span style="{MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: {s['glow']};">{e(s['cls'])}</span>{pill}</div>
<h3 style="margin: 0; font-family: 'Lilita One', 'Trebuchet MS', sans-serif; font-weight: 400; font-size: 30px; line-height: 1.05; color: #F6E9D2;">{e(s['name'])}</h3>
<p style="margin: 0; font-style: italic; font-size: 16px; line-height: 1.5; color: #D9C9AE;">{e(s['theme'], quote=False)}</p>
<span role="img" aria-label="Colours: {e(names)}" style="display: flex; align-items: center; gap: 8px; padding-block: 4px;">{chips}</span>
<dl style="margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 15.5px; line-height: 1.5;">
<div><dt style="{MONO}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A8977F;">2 pieces</dt><dd style="margin: 2px 0 0; color: #F6E9D2;">{e(s['two'], quote=False)}</dd></div>
<div><dt style="{MONO}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A8977F;">4 pieces</dt><dd style="margin: 2px 0 0; color: #F6E9D2;">{e(s['four'], quote=False)}</dd></div>
<div style="border-top: 2px solid #2A2234; padding-top: 8px;"><dt style="{MONO}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A8977F;">The joke</dt><dd style="margin: 2px 0 0; color: #F6E9D2;">{e(s['joke'], quote=False)}</dd></div>
<div><dt style="{MONO}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: {s['glow']};">The glow</dt><dd style="margin: 2px 0 0; color: #F6E9D2;">{e(s['glowline'], quote=False)}</dd></div>
</dl>
</div>
</article>''')
t = open('build/sets_template.html').read()
t = t.replace('%%SETS%%', '\n'.join(cards))
assert '%%' not in t
open('lookbook/project/Sets.dc.html', 'w').write(t)
vis = re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S))
print('stroke in visible text:', 'stroke' in vis.lower())
