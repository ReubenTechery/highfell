# The ranger's bodies (art_bodies.py has the other classes'): a race and a sex in plain underclothes, front and
# back, standing ready with a hand either side: the bow in the left hand (on your right as you look at them), an
# arrow in the right. The human is the ranger's reference body; it stands as the rogue does, so the human, the
# elf, the gnome, the goblin and the Risen wear the rogue's bodies with the hands the other way round, and the
# dwarf gets his own, his arms down at his sides. Each body has its fit, where the ranger's reference landmarks
# fall on it (art_gear.py), so every ranger layer sits right on it.
import art_gear as G
import art_bodies as B
import art_heads as H
from art_heroes import Z, s, ln, both, c, head, m, BOOT, BRONZE
from art_bodies import D_TORSO, D_ARM_AXE, D_BOOT, D_LEG, LINEN, LINEN_D, dwarf_hair, dwarf_braids
from art_heads import BEARD, BEARD_D

# the rogue's landmarks with the hands the other way round: the bow hand (main) on the right of the picture
G.ref('ranger', head=(0, -94.4), sh=-81.6, main=(28.8, -49.6), off=(-28.8, -49.6), arm=(12.8, -75.2), arm2=(-12.8, -75.2))


def swap(fit):
    """a rogue body's fit, its hands the other way round: the ranger's bow hand is the rogue's off hand"""
    return {**fit, 'main': fit['off'], 'off': fit['main'], 'arm': fit['arm2'], 'arm2': fit['arm']}


def as_ranger(body, hold=None):
    """a rogue body standing as a ranger: the same shapes, its fit's hands the other way round. `hold` gives the bow
    and the arrow a size and a slide down their hands ([k, dy] each), so a short body's bow stays off the ground."""
    for v in ('f', 'b'):
        fit = body[v]['fit']
        fit = G.identity_fit('ranger', v) if fit == G.identity_fit('rogue', v) else swap(fit)
        if hold:
            fit = {**fit, 'main': fit['main'][:2] + hold[0], 'off': fit['off'][:2] + hold[1]}
        body[v]['fit'] = fit
    return {**body, 'cls': 'ranger'}


# a gnome's or goblin's bow and arrow: a little smaller than the rogue's daggers are, slid up their hands
PINT_HOLD = ([0.78, -9], [0.8, -6])


def dwarf_ranger(fem):
    """the dwarf in his linen shirt and breeches, boots on, his arms down at his sides with a hand ready each side"""
    f, b = {}, {}
    f['legs'] = b['legs'] = both(D_BOOT, BOOT) + both(D_LEG, LINEN_D)
    torso = s(D_TORSO, LINEN) + s('M-27 -41 H27 V-35 H-27 Z', LINEN_D, 3)
    f['torso'] = b['torso'] = torso
    if fem:
        f['trim'] = s('M-6 -86 H6 V-76 H-6 Z', H.DSKIN, 2.8) + s('M-9 -82 L0 -71 L9 -82 Z', H.DSKIN, 2.8)
        hair = []
        dwarf_braids(hair)
        f['hair'] = ''.join(hair)
        hair = []
        dwarf_braids(hair, x=9, front=False)
        b['trim'] = ''.join(hair)
    else:
        f['trim'] = s('M-16 -80 C-22 -64 -15 -50 0 -44 C15 -50 22 -64 16 -80 Z', BEARD) + ln('M-7 -70 C-7 -60 -5 -54 -3 -50 M7 -70 C7 -60 5 -54 3 -50', BEARD_D, 2.5)
        b['trim'] = s('M-5 -84 C-7 -72 -5 -60 0 -52 C5 -60 7 -72 5 -84 Z', BEARD, 3.5) + ln('M-3 -76 L3 -72 M-3 -66 L3 -62', BEARD_D, 2.2) + c(0, -52, 3, BRONZE, 2.2)
    f['arms'] = b['arms'] = s(D_ARM_AXE, LINEN) + s(m(D_ARM_AXE), LINEN)
    f['hands'] = b['hands'] = c(-44, -42, 8.0, H.DSKIN) + c(44, -42, 8.0, H.DSKIN)
    f['head'] = head(0, -91.5, H.dwarf_face(Z, fem=fem)) + dwarf_hair()
    b['head'] = head(0, -91.5, H.dwarf_back(Z)) + dwarf_hair()
    # the human's landmarks on the dwarf: his barrel twice as wide, his legs short, his head low on his shoulders
    spine = ([0, 0, 1.55], [-52.8, -30.4, 1.75], [-81.6, -65.6, 1.75])
    fit = lambda view: G.fit('ranger', view, spine, head=[0, -73.2, 1.05], sh=[-62.4, 1.3], main=[35.2, -33.6, 0.86, -9.6],
                             off=[-35.2, -33.6, 0.86, -6], arm=[22.4, -53.6], arm2=[-22.4, -53.6])
    return {'race': 'dwarf', 'cls': 'ranger', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


BODIES = {
    'human.ranger.f': lambda: as_ranger(B.rogue('human', True)),
    'human.ranger.m': lambda: as_ranger(B.rogue('human', False)),
    'elf.ranger.f': lambda: as_ranger(B.rogue('elf', True)),
    'elf.ranger.m': lambda: as_ranger(B.rogue('elf', False)),
    'dwarf.ranger.m': lambda: dwarf_ranger(False),
    'dwarf.ranger.f': lambda: dwarf_ranger(True),
    'gnome.ranger.f': lambda: as_ranger(B.pint_rogue('gnome', True), PINT_HOLD),
    'gnome.ranger.m': lambda: as_ranger(B.pint_rogue('gnome', False), PINT_HOLD),
    'goblin.ranger.f': lambda: as_ranger(B.pint_rogue('goblin', True), PINT_HOLD),
    'goblin.ranger.m': lambda: as_ranger(B.pint_rogue('goblin', False), PINT_HOLD),
    'risen.ranger.f': lambda: as_ranger(B.risen_rogue(True)),
    'risen.ranger.m': lambda: as_ranger(B.risen_rogue(False)),
}
