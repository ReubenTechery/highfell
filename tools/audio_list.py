# The game's sounds: what tools/audio.py asks ElevenLabs for, and which take we kept.
#   prompt  what to ask for (STYLE or JINGLE is added to the end)
#   dur     seconds to ask for (the API's shortest is 0.5)
#   keep    the most we keep, in seconds, from the first sound in the take
#   take    the take that went in the game (1, 2 or 3); None until one is picked
#   level   how loud it should feel: its loudest 100 ms in dBFS (LEVEL below; peaks never pass -1 dBFS)
#   gain    dB on top of that, to nudge one sound against the rest
#   jingle  True for the musical ones: no "no music" in the prompt
#   music   True to ask Eleven Music instead (it plays real tunes; its takes are at least 3 seconds)
#   at      seconds into the take where the kept sound starts (to skip a lead-in or pick a later hit)
# Names match SOUNDS in src/ui/sound.ts, where each one keeps its synthesised version as the fallback.
# The garden and brewing sounds are still synthesised only.

STYLE = 'Cartoon fantasy game sound effect: punchy, chunky and warm, like a TV cartoon. Dry and close, no reverb, no echo, no music.'
JINGLE = 'Cartoon fantasy game sound: bright, warm and playful, like a TV cartoon. Short and dry, no reverb, no echo.'


def S(prompt, dur, keep, take=None, gain=0, jingle=False, music=False, at=0):
    return dict(prompt=prompt, dur=dur, keep=keep, take=take, gain=gain, jingle=jingle, music=music, at=at, level=-14)


SFX = {
    # ---- your hero's hands
    'swing': S('One quick chunky sword swing: a short snappy whoosh through the air.', 0.5, 0.3, take=3),
    'sweep': S('A wide heavy axe cleave: a big whooshing swipe that ends in a meaty thwack.', 0.6, 0.45, take=3),
    'thud': S('A heavy body blow: one deep punchy thud, like a big wooden club hitting a sack.', 0.5, 0.35, take=2),
    'hit': S('A bony fist landing one quick punch on a hero: a single short leathery smack, tight and dry.', 0.5, 0.22, take=5),
    'crit': S('A critical hit: one huge crunchy smack with a bright metal ting on top, super punchy and satisfying.', 0.6, 0.45, take=2),
    'block': S('A sword hitting a raised wooden shield with an iron rim: one solid chunky clonk.', 0.5, 0.3, take=3),
    'perfect': S('A perfect parry: one crisp ringing shield clang that blooms into a bright little bell ting.', 0.8, 0.65, take=3),
    'shieldup': S('A heavy shield snapped up into guard: a quick leathery swish and a soft wooden clack.', 0.5, 0.16, take=1),
    'taunt': S('A defiant shield bash: a sword banged hard on a shield twice, clang clang, with a short low horn blast.', 0.8, 0.7, take=3),
    'charge': S('A warrior charging: a fast rising whoosh with heavy running footsteps, ending in a shoulder barge thump.', 0.8, 0.7, take=2),
    'dodge': S('A quick dodge roll: a fast cloth whoosh and a light tumble on dirt.', 0.5, 0.3, take=2),
    'kick': S('A spell snapped off mid-cast: a sharp bonk followed by a fizzling sputter.', 0.5, 0.35, take=3),
    # ---- the healer
    'heal': S('A healing spell: a soft rising marimba and glockenspiel sparkle, gentle and friendly.', 0.6, 0.5, take=1, jingle=True),
    'circle': S('A healing circle blooming on the ground: a soft warm whoomph with a rising four-note harp sparkle.', 0.9, 0.7, take=2, jingle=True),
    'ward': S('A magic bubble shield wrapping around a hero: a soft bloop then a glassy shimmer.', 0.6, 0.5, take=1),
    'sunburst': S('A big burst of warm sunlight: a quick bright swell of bells and a soft whoosh bursting outward.', 1.0, 0.9, take=2, jingle=True),
    'smite': S('A holy smite: a sharp bright zap with a bell ting, clean and punchy.', 0.5, 0.35, take=3),
    'holy': S('A tiny light bolt shot: one quick soft bright pew with a little chime.', 0.5, 0.18, take=1),
    'lift': S('A curse being lifted: a bright cleansing swish and two clear rising bell notes.', 0.6, 0.5, take=3, jingle=True),
    'saved': S('A tiny heroic rescue jingle for a cartoon fantasy game: a quick bright trumpet ta-ta-taaa, three rising notes, '
               'very short, then silence. Instrumental, punchy, dry, little reverb.', 3.0, 1.7, take=5, music=True, at=0.15),
    'revive': S('A hero popping back up: a warm rising harp glissando that ends in a bright sparkle.', 0.9, 0.8, take=1, jingle=True),
    # ---- the mage
    'bolt': S('A small snowball thrown and hitting: one soft quick whoosh and a light icy pat.', 0.5, 0.2, take=13),
    'icicle': S('An icicle spear zipping past and shattering: a sharp icy whistle and a crisp crystal crack.', 0.5, 0.35, take=2),
    'blizzard': S('A short blizzard gust: a swirling icy wind whoosh full of tinkling ice crystals.', 1.5, 1.2, take=2),
    'nova': S('A frost nova: a sudden icy blast, a crunchy freezing crackle bursting outward.', 0.7, 0.5, take=1),
    'castup': S('A spell charging up: a quick rising magic hum with a little crackle.', 0.7, 0.5, take=2),
    'whoosh': S('A big ice comet streaking down from the sky: a fast falling whistle and whoosh.', 0.5, 0.35, take=2),
    'comet': S('An ice comet slamming into the ground: a big chunky boom with crunchy shattering ice.', 1.0, 0.8, take=2),
    # ---- the party
    'down': S('A hero knocked out: a quick falling slide whistle and a soft thud.', 0.9, 0.8, take=1),
    'wipe': S('The whole party falls: a short sad sting of low falling brass and one soft drum thump.', 1.5, 1.3, take=1, jingle=True),
    'heartbeat': S('One tense heartbeat: a deep double thump, lub-dub.', 0.5, 0.4, take=2),
    'curse': S('A curse landing on a hero: a sour wobbly falling warble with a dark spooky hiss.', 0.8, 0.6, take=1),
    'burst': S('A curse bursting on a hero: a dark muffled pop and thump with a sour hissing puff.', 0.8, 0.5, take=2),
    'fanfare': S('A short victory fanfare sting for beating the last boss of a dungeon in a cartoon fantasy game: it starts '
                 'right away with a big bright brass ta-da hit, a quick rising flourish, then one held chord that rings out. '
                 'Under three seconds. Punchy and joyful, dry, little reverb.', 3.0, 1.32, take=1, music=True, at=0.08),
    'victory': S('A boss beaten: a short victory jingle, a bright brass and xylophone ta-da rising three notes.', 1.5, 1.2, take=1, jingle=True),
    # ---- the dead and their bosses
    'die': S('A skeleton falling apart: a quick clattery rattle of dry wooden bones dropping into a little pile.', 0.6, 0.5, take=2),
    'bigdie': S('A huge skeleton brute collapsing: a heavy crash, a cascade of clattering big bones and one low thump.', 1.2, 1.0, take=1),
    'arrow': S('A skeleton archer loosing an arrow: a bow twang and a quick arrow whizz.', 0.5, 0.35, take=3),
    'arrowhit': S('An arrow thunking into a wooden shield: one short sharp thock.', 0.5, 0.15, take=2),
    'rise': S('Skeletons clawing up out of their graves: dirt shifting and a quick clatter of rattling bones.', 1.0, 0.8, take=1),
    'roar': S('A big undead brute roaring in anger: a gravelly monster bellow, short and punchy.', 1.2, 1.0, take=1),
    'gate': S('A heavy iron gate slamming shut: a rattling chain clatter and one big clang.', 1.0, 0.9, take=2),
    'windup': S('A rising build-up before a huge hit: a reversed cymbal swell with a deep creaking groan, getting louder and louder, then stops.', 1.5, 1.4, take=4),
    'smash': S('A giant shovel smashing the ground: an enormous chunky boom with cracking stone and debris.', 1.0, 0.8, take=2),
    'slam': S('A heavy ground slam: one deep chunky boom with a puff of dust.', 0.9, 0.7, take=3),
    'toss': S('A big shovel flinging a heap of dirt and gravel: a heavy whoosh and a spray of pebbles.', 0.6, 0.45, take=3),
    'dig': S('A big shovel digging fast into earth: a chunky scrape and a spray of dirt.', 0.8, 0.6, take=2),
    'erupt': S('A giant bursting up out of the ground: a big chunky boom with dirt and rocks spraying.', 1.0, 0.8, take=1),
    'rumble': S('Bony hands pushing up through the ground: a low earth rumble with dirt crackles.', 1.0, 0.9, take=1),
    'wail': S('A ghostly wail calling up wisps: a rising eerie oooOOOh with a hollow whistle.', 1.0, 0.9, take=1),
    'chain': S('Ghostly chains whipping out and snapping tight around a hero: a rattling chain lash and clink.', 0.8, 0.6, take=1),
    'cut': S('A chain cut free: a sharp metal snip and clang, and links tinkling apart.', 0.6, 0.4, take=3),
    'cage': S('A cage of bones snapping shut around a hero: a quick rattling crunch of bones slamming together.', 0.8, 0.6, take=1),
    'cagehit': S('One quick hit on a cage of bones: a short hollow bony knock.', 0.5, 0.15, take=1),
    'cagebreak': S('A cage of bones shattering: a bright crunchy bony smash with bits clattering and a little happy chime.', 0.8, 0.6, take=1),
    'pulse': S('A dark magic shockwave hitting the whole party: a deep throbbing whump with a ghostly whoosh.', 0.9, 0.7, take=1),
    'rot': S('A puddle of rot bubbling up from the ground: a gloopy slimy splat with sour bubbling.', 0.8, 0.6, take=3),
    'fire': S('A magic lantern flaring into a ring of green fire: a whooshing roar of flames that settles into crackling.', 1.5, 1.2, take=2),
    'pop': S('A little ghost wisp popping like a soap bubble: one soft cute pop with a tiny sparkle.', 0.5, 0.3, take=2),
    # ---- loot: the walkout, the chest and the cards
    'gutter': S('A lantern flame sputtering out: a soft dying flicker and a little puff of smoke.', 1.0, 0.8, take=1),
    'flare': S('A lantern flame swelling up gold: a warm whooshing flare with a rising shimmer of bells.', 1.0, 0.8, take=2, jingle=True),
    'knock': S('A single loud knock on a thick wooden door: one sharp hollow knock, nothing else.', 0.5, 0.22, take=6, at=0.08),
    'lightsout': S('Every light snuffed out at once: a deep soft whoomp and then a hush, like a giant candle blown out.', 1.2, 1.0, take=2),
    'petchime': S('A tiny music box playing a soft, curious six-note melody in the dark, slow and wondering, then it stops. '
                  'Instrumental, music box only, dry, little reverb.', 3.0, 2.4, take=5, music=True, at=0.9),
    'petfound': S('A tiny joyful discovery jingle for a cartoon fantasy game: a bright rising glockenspiel run and a cheerful brass '
                  'flourish, very short, then silence. Instrumental, sparkly, dry, little reverb.', 3.0, 2.0, take=6, music=True),
    'chest': S('A treasure chest creaking open: a heavy wooden lid and a burst of jingling treasure and sparkle.', 1.0, 0.9, take=1),
    'deal': S('A single playing card snapped down onto a table: one very short crisp flick.', 0.5, 0.12, take=5),
    'flip': S('A single playing card flipped over: one quick crisp paper snap.', 0.5, 0.15, take=4),
    'rare': S('A rare item revealed: a bright shimmering four-note bell and glockenspiel sparkle rising up.', 1.0, 0.8, take=1, jingle=True),
    'slot': S('A piece of armour dropping onto a wooden stand: a satisfying chunky clunk and a bright sparkle chime.', 0.8, 0.7, take=2),
    'coin': S('Two small bright metal pieces clinking together: ting ting.', 0.5, 0.3, take=2),
    'equip': S('Putting on a piece of armour: a chunky metal clank and a buckle snap, then a bright rising sparkle.', 1.0, 0.8, take=3),
    'ach': S('An achievement: a bright three-note bell ding ding DING with a little sparkle.', 1.0, 0.8, take=1, jingle=True),
    'place': S('Setting a heavy thing down on a wooden shelf: one solid satisfying wooden clunk.', 0.5, 0.3, take=2),
    # ---- buttons
    'ui': S('A tiny soft wooden button click.', 0.5, 0.08, take=1),
    'nope': S('A short cartoon no-no: two quick dull wooden bonks, bonk bonk, low and muted.', 0.5, 0.22, take=5),
    'page': S('A page of an old book turning: a crisp paper flip.', 0.5, 0.3, take=1),
}


# How loud each sound feels, against the others (the loudest 100 ms in dBFS). Anything not here is -14.
LEVEL = {
    -20: 'ui deal flip',
    -17: 'page place nope coin shieldup cagehit holy bolt arrowhit heartbeat',
    -12: 'sweep thud charge taunt crit perfect nova blizzard circle sunburst comet curse burst down revive saved rise roar '
         'gate windup rumble wail pulse fire cagebreak chest rare equip ach lightsout petchime petfound victory fanfare knock',
    -10: 'smash slam erupt bigdie wipe',
}
for lv, names in LEVEL.items():
    for n in names.split():
        SFX[n]['level'] = lv

# Music: three loops made with Eleven Music (instrumental). Too big to embed, so the game streams them from the live
# page's own files (audio/music/*.mp3, published next to the page). The victory sting is small, so it is the
# effect 'fanfare' above (it plays at the music's volume).
#   ms      how long a take to ask for
#   take    the take we cut from; start and len are the loop in seconds (a whole number of bars)
#   xfade   seconds of the loop's tail crossfaded into its head
#   gain    peak level in dBFS
LOOP = ('the same groove all the way through, no intro, no ending, no fade, so it loops. Dry, close mix, little reverb. '
        'Like the score of a TV cartoon, not a film.')


def M(prompt, ms, take=None, start=None, length=None, xfade=0.12, gain=-1.5):
    return dict(prompt=prompt, ms=ms, take=take, start=start, len=length, xfade=xfade, gain=gain)


MUSIC = {
    'house': M('Instrumental loop for the cosy tavern home of a cartoon fantasy game: warm plucky acoustic guitar, a playful '
               'fiddle tune, soft accordion, light hand drum and tambourine. Bouncy, cheerful and homely, a steady 104 BPM in '
               f'4/4, {LOOP}', 60000, take=2, start=12.12, length=46.153),
    'dungeon': M('Instrumental loop for creeping through a crypt in a cartoon fantasy game: low and tense, a plucked double '
                 'bass ostinato, soft low drums, muted pizzicato strings, a sly bassoon and sparse glassy bell hits. Sneaky '
                 f'and suspenseful but playful, a steady 92 BPM in 4/4, {LOOP}', 60000, take=1, start=12.39, length=41.7429),
    'boss': M('Instrumental loop for a boss fight in a cartoon fantasy game: driving and punchy, pounding toms, chugging low '
              'strings, stabbing brass and a fast fiddle riff. Urgent and heroic but playful, full energy, a steady 148 BPM '
              f'in 4/4, {LOOP}', 60000, take=1, start=20.27, length=25.9393),
}
