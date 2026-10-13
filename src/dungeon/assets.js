// generated art, bundled from the art/ folder
import SPRITES from '../../art/sprites.json';
import HEARTH from '../../art/hearth.json';
import TILES from '../../art/icons.json';
import PORTRAITS from '../../art/portraits.json';
/* one sprite sheet for the engine: the crypt and the hearth's pets, mounts, trophies and lanterns */
const ART = { ...SPRITES, ...HEARTH };
export { ART, TILES, PORTRAITS, HEARTH };
