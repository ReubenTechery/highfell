/**
 * The house's display spots. A layout is just spot id to collectible id, saved in the profile,
 * so a friend's house can later be drawn from their profile the same way. Where each spot is in the
 * house lives in the house's plan (content/house.ts); this is the rules.
 */
import type { CollectibleKind } from '../content/types';
import { COLLECTIBLES } from '../content';
import { HOUSE_SPOTS } from '../content/house';
import type { Profile } from './profile';

export interface Spot { id: string; kind: CollectibleKind; label: string }

export const HEARTH_SPOTS: Spot[] = HOUSE_SPOTS.map(({ id, kind, label }) => ({ id, kind, label }));
export const spotById = (id: string): Spot | undefined => HEARTH_SPOTS.find((s) => s.id === id);

export function ownedOfKind(p: Profile, kind: CollectibleKind): string[] {
  return Object.keys(p.collection).filter((id) => COLLECTIBLES[id] && COLLECTIBLES[id].kind === kind);
}
export const spotOf = (p: Profile, id: string): string | null => Object.entries(p.hearth.spots).find(([, v]) => v === id)?.[0] ?? null;

/** Put something in a spot (or clear it with null). An item can only sit in one spot. */
export function place(p: Profile, spotId: string, id: string | null): boolean {
  const spot = spotById(spotId);
  if (!spot) return false;
  if (id) {
    const c = COLLECTIBLES[id];
    if (!c || c.kind !== spot.kind || !p.collection[id]) return false;
    const was = spotOf(p, id);
    if (was) p.hearth.spots[was] = null;
  }
  p.hearth.spots[spotId] = id;
  return true;
}

/** Spots a save has never had (a room that is new since it was last loaded) take the things you own
 *  that aren't on show yet, so a new loft fills with the trophies you already have. A spot you emptied
 *  yourself stays empty: it is in the save, set to null. Running it twice changes nothing. */
export function settleSpots(p: Profile): void {
  for (const s of HEARTH_SPOTS) {
    if (s.id in p.hearth.spots) continue;
    const shown = new Set(Object.values(p.hearth.spots));
    p.hearth.spots[s.id] = ownedOfKind(p, s.kind).find((id) => !shown.has(id)) ?? null;
  }
}

/** New pets, mounts, trophies and banners go straight into the first empty spot of their kind, so you
 *  see them the moment you get home: the hall first, then the loft, the roof and the yard. */
export function autoPlace(p: Profile, id: string): string | null {
  const c = COLLECTIBLES[id];
  if (!c || spotOf(p, id)) return null;
  const free = HEARTH_SPOTS.find((s) => s.kind === c.kind && !p.hearth.spots[s.id]);
  if (!free) return null;
  p.hearth.spots[free.id] = id;
  return free.id;
}
