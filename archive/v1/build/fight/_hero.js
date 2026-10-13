class DCLogic{constructor(p){this.props=p}}

class Component extends DCLogic {
  renderVals() {
    const p = this.props;
    const pick = (v, list, d) => (list.indexOf(v) >= 0 ? v : d);
    const race = pick(p.race, ['dwarf', 'gnome', 'elf', 'human'], 'dwarf');
    const kit = pick(p.kit, ['none', 'warrior', 'cleric', 'rogue', 'mage', 'ranger', 'bard', 'rimeguard'], 'warrior');
    const heroic = p.tier === 'heroic';
    const sil = p.silhouette === 'on';
    const armed = p.weapon !== 'off';

    // One rig per race: where the head, shoulders, waist and hands sit, and how big kit parts draw there.
    const RIG = {
      dwarf: { skin: '#E8A27A', hair: '#C8572B', head: [150, 142], hs: 1, sh: [150, 200], shs: 1, waist: 300, ws: 1, leg: 52, handR: [214, 298], handL: [86, 298], wpn: 1, shadow: 70, mid: 240 },
      gnome: { skin: '#F2B49A', hair: '#E8E0F0', head: [150, 178], hs: 1.04, sh: [150, 232], shs: 0.65, waist: 296, ws: 0.62, leg: 54, handR: [192, 294], handL: [108, 294], wpn: 0.72, shadow: 50, mid: 262 },
      elf: { skin: '#EBC7A6', hair: '#DDE3F0', head: [150, 70], hs: 0.66, sh: [150, 122], shs: 0.73, waist: 232, ws: 0.66, leg: 114, handR: [196, 236], handL: [104, 236], wpn: 0.78, shadow: 48, mid: 214 },
      human: { skin: '#C98E6B', hair: '#2E1F18', head: [150, 92], hs: 0.74, sh: [150, 146], shs: 0.88, waist: 254, ws: 0.78, leg: 90, handR: [206, 250], handL: [94, 250], wpn: 0.84, shadow: 56, mid: 224 }
    };

    // One palette per class kit. Add a new kit here plus its three layers in the markup.
    const KIT = {
      none: { cloth: '#8C6A4A', pants: '#5A4632', boots: '#4A2E1E', accent: '#6E5A44', metal: '#A3ACB6', trim: '#C9963A', gem: '#F4B942' },
      warrior: { cloth: '#8E3B2E', pants: '#4E3A2A', boots: '#3E2618', accent: '#7A2626', metal: '#A3ACB6', trim: '#E2B45A', gem: '#FF8A4C' },
      cleric: { cloth: '#E9DDC3', pants: '#5A4A3A', boots: '#4A3424', accent: '#2F4A7A', metal: '#C9A24A', trim: '#F4B942', gem: '#F4B942' },
      rogue: { cloth: '#3B3448', pants: '#2A2433', boots: '#1F1A26', accent: '#2A2433', metal: '#C9CED4', trim: '#B79CFF', gem: '#B79CFF' },
      mage: { cloth: '#3B3F7A', pants: '#2C2F5C', boots: '#2A2440', accent: '#3B3F7A', metal: '#C9CED4', trim: '#F4B942', gem: '#8FD6FF' },
      ranger: { cloth: '#4E6B3A', pants: '#5A4632', boots: '#3E2A1C', accent: '#3E5A2E', metal: '#A3ACB6', trim: '#C9963A', gem: '#9BD068' },
      bard: { cloth: '#B8452E', pants: '#3E2E4A', boots: '#3E2618', accent: '#6A2E7A', metal: '#C9963A', trim: '#F4B942', gem: '#FF7A9A' },
      rimeguard: { cloth: '#2F5D8A', pants: '#2A3B52', boots: '#2A3B52', accent: '#2F5D8A', metal: '#D7ECF7', trim: '#8FD6FF', gem: '#8FD6FF' },
      rimeguardHeroic: { cloth: '#4B2E83', pants: '#2A2238', boots: '#2A2238', accent: '#4B2E83', metal: '#4A4466', trim: '#F4B942', gem: '#B79CFF' }
    };

    const r = RIG[race];
    const k = kit === 'rimeguard' && heroic ? KIT.rimeguardHeroic : KIT[kit];
    const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
    const shade = (h, amt) => {
      const n = parseInt(h.slice(1), 16);
      const ch = (v) => Math.max(0, Math.min(255, Math.round(v * amt)));
      return '#' + [ch((n >> 16) & 255), ch((n >> 8) & 255), ch(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
    };
    const skin = isHex(p.skin) ? p.skin : r.skin;
    const hair = isHex(p.hair) ? p.hair : r.hair;
    const glowRaw = isHex(p.glow) ? p.glow : '#F4B942';

    const c = {
      ink: '#2A1A22', skin: skin, skinShade: shade(skin, 0.84), hair: hair, hairShade: shade(hair, 0.74),
      cloth: k.cloth, clothShade: shade(k.cloth, 0.76), pants: k.pants, boots: k.boots,
      accent: k.accent, accentShade: shade(k.accent, 0.7), metal: k.metal, metalShade: shade(k.metal, 0.72),
      trim: k.trim, gem: k.gem, gemGlow: k.gem, glow: glowRaw, glowRaw: glowRaw,
      belt: '#3A2418', leather: '#7A5034', wood: '#8A5A34', string: '#EDE3CC', fletch: '#EDE3CC', feather: '#F2E6C8',
      blush: '#E0705A', hl: '#FFF8E8', eye: race === 'elf' ? '#1E5F5B' : '#2A1A22', flame: '#FFF3C4', scarf: '#8E2E44',
      glove: kit === 'rimeguard' ? k.metal : skin
    };
    if (sil) {
      Object.keys(c).forEach((key) => {
        if (key !== 'glowRaw') c[key] = '#1B1424';
      });
      c.gemGlow = 'transparent';
    }

    const T = (x, y, sx, sy) => 'translate(' + x + ' ' + y + ') scale(' + sx + ' ' + (sy === undefined ? sx : sy) + ')';
    const torso = r.waist - r.sh[1];
    const t = {
      head: T(r.head[0], r.head[1], r.hs),
      sh: T(r.sh[0], r.sh[1], r.shs),
      back: T(r.sh[0], r.sh[1], r.shs, ((382 - r.sh[1]) / 182).toFixed(3)),
      waist: T(150, r.waist, r.ws),
      skirt: T(150, r.waist, r.ws, (r.leg / 52).toFixed(3)),
      strap: T(r.sh[0], r.sh[1], r.shs, (torso / 100).toFixed(3)),
      handR: T(r.handR[0], r.handR[1], r.wpn),
      handL: T(r.handL[0], r.handL[1], r.wpn)
    };

    const is = (name) => kit === name;
    const f = {
      plate: p.backdrop !== 'none',
      dwarf: race === 'dwarf', gnome: race === 'gnome', elf: race === 'elf', human: race === 'human',
      aura: p.aura === 'on' && !sil,
      cape: is('warrior') || is('rimeguard') || is('rogue'),
      quiver: is('ranger'),
      kNone: is('none'), kWarrior: is('warrior'), kRime: is('rimeguard'), kCleric: is('cleric'),
      kRogue: is('rogue'), kMage: is('mage'), kRanger: is('ranger'), kBard: is('bard'),
      axe: armed && (is('warrior') || is('rimeguard')), rimeAxe: armed && is('rimeguard'),
      lantern: armed && is('cleric'), daggers: armed && is('rogue'), staff: armed && is('mage'),
      bow: armed && is('ranger'), lute: armed && is('bard')
    };

    return { c: c, t: t, f: f, g: { shadow: r.shadow, mid: r.mid } };
  }
}

const P=[{"race": "dwarf", "kit": "warrior", "glow": "#9BD068", "backdrop": "none"}, {"race": "elf", "kit": "mage", "glow": "#9BD068", "backdrop": "none"}, {"race": "human", "kit": "cleric", "skin": "#5A3826", "hair": "#2E1F18", "glow": "#9BD068", "backdrop": "none"}, {"race": "gnome", "kit": "rogue", "glow": "#9BD068", "backdrop": "none"}, {"race": "human", "kit": "ranger", "skin": "#F2D0B4", "hair": "#C8572B", "glow": "#9BD068", "backdrop": "none"}];
console.log(JSON.stringify(P.map(p=>new Component(p).renderVals())));
