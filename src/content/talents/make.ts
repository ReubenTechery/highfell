/** The pieces a spec's tree is made of: stat talents (several points, each adding to one stat) and talents that
 *  change a button (one point). What a point of each stat is worth lives here, so a stat talent's words are
 *  always right. */
import type { AbilitySlot, TalentDef, TalentStat } from '../types';

/** what one point adds: dmg, heal, hp and threat are a share more, crit a share of crit chance, haste a share
 *  faster cooldowns (never the beat), armor a share less damage taken */
export const TALENT_STATS: Record<TalentStat, { per: number; icon: string; line: (pct: string) => string }> = {
  dmg: { per: 0.01, icon: 't_dmg', line: (x) => `+${x} damage` },
  heal: { per: 0.01, icon: 't_heal', line: (x) => `+${x} healing` },
  hp: { per: 0.02, icon: 't_hp', line: (x) => `+${x} health` },
  crit: { per: 0.01, icon: 't_crit', line: (x) => `+${x} critical hit chance` },
  haste: { per: 0.03, icon: 't_haste', line: (x) => `Cooldowns ${x} faster` },
  armor: { per: 0.015, icon: 't_armor', line: (x) => `${x} less damage taken` },
  threat: { per: 0.06, icon: 't_threat', line: (x) => `+${x} threat` },
};
const pct = (k: number): string => `${Math.round(k * 1000) / 10}%`;
/** a stat's total, in words: "+6% damage" */
export const statLine = (s: TalentStat, points: number): string => TALENT_STATS[s].line(pct(TALENT_STATS[s].per * points));

/** a stat talent: `ranks` points, each adding one step of its stat */
export const stat = (id: string, name: string, row: number, ranks: number, s: TalentStat): TalentDef =>
  ({ id, name, desc: `${statLine(s, 1)} a point.`, icon: TALENT_STATS[s].icon, row, ranks, stat: s });

/** a talent that changes a button: one point. `choice` pairs it with the other talent in its row that has the
 *  same, so only one of the two can be taken. */
export const change = (id: string, name: string, row: number, slot: AbilitySlot | 'mend', icon: string, desc: string, o: { choice?: string; capstone?: boolean } = {}): TalentDef =>
  ({ id, name, desc, icon, row, ranks: 1, slot, ...o });
