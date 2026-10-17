# The ranger's dungeon sets and bows as layers (art_gear_ranger.py has the regular ladder and the helpers): the
# Barrow's set (candlewake.*) and the Gravekeeper's bow (gravekeeper.healer), Thimblebriar's set (sporebloom.*) and the
# Tinker King's bow (tinker.healer), drawn from their stands in the log's wardrobe (art_wardrobe.py,
# art_wardrobe_tb.py) with the legs, sleeves and backs the stands don't have.
import art_gear_ranger as R


def candlewake():
    """the Barrow's set, until it is drawn from its stand: the Rare look"""
    return {'candlewake.helm': R.helm(2), 'candlewake.shoulders': R.shoulders(2), 'candlewake.chest': R.chest(2), 'gravekeeper.healer': R.weapon(2)}


def sporebloom():
    """Thimblebriar's set, until it is drawn from its stand: the Rare look"""
    return {'sporebloom.helm': R.helm(2), 'sporebloom.shoulders': R.shoulders(2), 'sporebloom.chest': R.chest(2), 'tinker.healer': R.weapon(2)}
