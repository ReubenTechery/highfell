/**
 * Dungeon Template: 4 Class 3-Piece Epic Sets (12 pieces) + 4 Boss Weapons (Warrior, Cleric, Mage, Rogue).
 * Copy and rename IDs/names/effects when creating a new dungeon.
 */
import type { ItemDef, SetDef } from '../types';
import { EPIC } from '../gear';

export const TEMPLATE_SETS: SetDef[] = [
  {
    id: 'clockguard', name: 'Clockguard', role: 'tank', dungeon: 'template', tier: 2,
    look: 'Riveted brass plate, spring-coiled pauldrons, ticking bulwark',
    pieces: ['clockguard.helm', 'clockguard.shoulders', 'clockguard.chest'],
    bonus2: { id: 'clockguard2', desc: 'Perfect blocks wind your spring-shield, granting a 150 absorb barrier and +15% Cleave speed for 4s.' },
    bonus3: { id: 'clockguard3', desc: 'Slam deploys 2 Clockwork Decoys for 8s that taunt nearby enemies and explode on expiry.', ready: true },
  },
  {
    id: 'sporebloom', name: 'Sporebloom', role: 'healer', dungeon: 'template', tier: 2,
    look: 'Bioluminescent toadstool cap, amber root mantle, fairy-lantern censer',
    pieces: ['sporebloom.helm', 'sporebloom.shoulders', 'sporebloom.chest'],
    bonus2: { id: 'sporebloom2', desc: 'Mend plants a glowing spore on its target that heals for 45 over 4s.' },
    bonus3: { id: 'sporebloom3', desc: 'Prayer circle blooms with healing spores that sear enemies inside and save one ally from fatal damage per fight.', ready: true },
  },
  {
    id: 'arcspark', name: 'Arcspark', role: 'dps', dungeon: 'template', tier: 2,
    look: 'Copper filament crown, tesla-coil shoulders, starlight-threaded robes',
    pieces: ['arcspark.helm', 'arcspark.shoulders', 'arcspark.chest'],
    bonus2: { id: 'arcspark2', desc: 'Comet on a frozen foe arcs lightning to 2 nearby targets and refunds half its cooldown.' },
    bonus3: { id: 'arcspark3', desc: 'Blizzard rains charged brass shards (+30% damage) and spawns Arc Sprites on kills or boss hits.', ready: true },
  },
  {
    id: 'gearshade', name: 'Gearshade', role: 'dps', cls: 'rogue', dungeon: 'template', tier: 2,
    look: 'Clockwork lens visor, spring-blade spaulders, velvet burrower coat',
    pieces: ['gearshade.helm', 'gearshade.shoulders', 'gearshade.chest'],
    bonus2: { id: 'gearshade2', desc: 'Critical hits with Shadowstrike or Viper Blades discharge a 55-damage clockwork spark.' },
    bonus3: { id: 'gearshade3', desc: 'Shadowstep leaves a Wind-Up Double for 6s that slashes your target and refreshes Viper Venom.', ready: true },
  },
];

export const TEMPLATE_ITEMS: ItemDef[] = [
  // Tank set (Warrior)
  { id: 'clockguard.helm', name: 'Clockguard Greathelm', slot: 'helm', role: 'tank', rar: EPIC, tier: 2, kind: 'set', setId: 'clockguard', icon: 's_tank_helm', effect: 'clockguard.helm', effectDesc: 'Charge cooldown is 1.2s shorter and grants a 90 barrier.' },
  { id: 'clockguard.shoulders', name: 'Clockguard Pauldrons', slot: 'shoulders', role: 'tank', rar: EPIC, tier: 2, kind: 'set', setId: 'clockguard', icon: 's_tank_shoulders', effect: 'clockguard.shoulders', effectDesc: 'Slam radius is 20% wider and slows foes for 2.5s.' },
  { id: 'clockguard.chest', name: 'Clockguard Breastplate', slot: 'chest', role: 'tank', rar: EPIC, tier: 2, kind: 'set', setId: 'clockguard', icon: 's_tank_chest', effect: 'clockguard.chest', effectDesc: 'Cleave deals +20% damage and generates extra threat.' },
  // Healer set (Cleric)
  { id: 'sporebloom.helm', name: 'Sporebloom Cowl', slot: 'helm', role: 'healer', rar: EPIC, tier: 2, kind: 'set', setId: 'sporebloom', icon: 's_healer_helm', effect: 'sporebloom.helm', effectDesc: 'Smite restores +4 extra mana and heals 20% more.' },
  { id: 'sporebloom.shoulders', name: 'Sporebloom Mantle', slot: 'shoulders', role: 'healer', rar: EPIC, tier: 2, kind: 'set', setId: 'sporebloom', icon: 's_healer_shoulders', effect: 'sporebloom.shoulders', effectDesc: 'Ward absorbs 25% more and lasts 2s longer.' },
  { id: 'sporebloom.chest', name: 'Sporebloom Vestments', slot: 'chest', role: 'healer', rar: EPIC, tier: 2, kind: 'set', setId: 'sporebloom', icon: 's_healer_chest', effect: 'sporebloom.chest', effectDesc: 'Prayer circle heals 20% more per tick.' },
  // Mage DPS set
  { id: 'arcspark.helm', name: 'Arcspark Crown', slot: 'helm', role: 'dps', rar: EPIC, tier: 2, kind: 'set', setId: 'arcspark', icon: 's_dps_helm', effect: 'arcspark.helm', effectDesc: 'Icicle deals +20% damage and pierces in a line.' },
  { id: 'arcspark.shoulders', name: 'Arcspark Mantle', slot: 'shoulders', role: 'dps', rar: EPIC, tier: 2, kind: 'set', setId: 'arcspark', icon: 's_dps_shoulders', effect: 'arcspark.shoulders', effectDesc: 'Rime burst cooldown is 2s shorter.' },
  { id: 'arcspark.chest', name: 'Arcspark Robes', slot: 'chest', role: 'dps', rar: EPIC, tier: 2, kind: 'set', setId: 'arcspark', icon: 's_dps_chest', effect: 'arcspark.chest', effectDesc: 'Comet deals +20% damage.' },
  // Rogue DPS set
  { id: 'gearshade.helm', name: 'Gearshade Visor', slot: 'helm', role: 'dps', cls: 'rogue', rar: EPIC, tier: 2, kind: 'set', setId: 'gearshade', icon: 's_rogue_helm', effect: 'gearshade.helm', effectDesc: 'Viper Blades deals +20% initial slash damage.' },
  { id: 'gearshade.shoulders', name: 'Gearshade Spaulders', slot: 'shoulders', role: 'dps', cls: 'rogue', rar: EPIC, tier: 2, kind: 'set', setId: 'gearshade', icon: 's_rogue_shoulders', effect: 'gearshade.shoulders', effectDesc: 'Fan of Blades radius and damage increased by 25%.' },
  { id: 'gearshade.chest', name: 'Gearshade Jerkin', slot: 'chest', role: 'dps', cls: 'rogue', rar: EPIC, tier: 2, kind: 'set', setId: 'gearshade', icon: 's_rogue_chest', effect: 'gearshade.chest', effectDesc: 'Shadowstrike deals +20% critical strike damage.' },
  // Boss Weapons (1/50 from Final Boss)
  { id: 'sovereign.tank', name: 'The Brass Bastion', slot: 'weapon', role: 'tank', rar: EPIC, tier: 2, kind: 'unique', icon: 'u_gravedigger', effect: 'gravedigger', effectDesc: 'Every fifth swing triggers a stunning tremor, and Charge resets Cleave.' },
  { id: 'sovereign.healer', name: 'Censer of the Glowcap', slot: 'weapon', role: 'healer', rar: EPIC, tier: 2, kind: 'unique', icon: 'u_lantern', effect: 'longnight', effectDesc: 'Mend wards its target for 60, and Sunburst sears nearby foes and wards the party.' },
  { id: 'sovereign.dps', name: 'Spire of Living Sparks', slot: 'weapon', role: 'dps', rar: EPIC, tier: 2, kind: 'unique', icon: 'u_gravefrost', effect: 'gravefrost', effectDesc: 'Comet freezes everything it hits for 2s, and Rime burst resets Icicle.' },
  { id: 'sovereign.rogue', name: 'The Mainspring Razors', slot: 'weapon', role: 'dps', cls: 'rogue', rar: EPIC, tier: 2, kind: 'unique', icon: 'u_cryptfangs', effect: 'cryptfangs', effectDesc: 'Every fourth slash strikes twice and refreshes Viper Venom, and Shadowstep resets Shadowstrike.' },
];
