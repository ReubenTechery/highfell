/**
 * The hearth's display spots. A layout is just spot id to collectible id, saved in the profile,
 * so a friend's hearth can later be drawn from their profile the same way.
 */
import type { CollectibleKind } from '../content/types';
import { COLLECTIBLES } from '../content';
import type { Profile } from './profile';

export interface Spot { id: string; kind: CollectibleKind; label: string }

export const HEARTH_SPOTS: Spot[] = [
  { id: 'pet.fire', kind: 'pet', label: 'By the fire' },
  { id: 'pet.rug', kind: 'pet', label: 'On the rug' },
  { id: 'mount.stall', kind: 'mount', label: 'The stall' },
  { id: 'mantel.1', kind: 'trophy', label: 'Mantel, far left' },
  { id: 'mantel.2', kind: 'trophy', label: 'Mantel, left' },
  { id: 'mantel.3', kind: 'trophy', label: 'Mantel, right' },
  { id: 'mantel.4', kind: 'trophy', label: 'Mantel, far right' },
  { id: 'banner.wall', kind: 'banner', label: 'Over the fire' },
];
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

/** New pets, mounts and trophies go straight into an empty spot so you see them the moment you get home. */
export function autoPlace(p: Profile, id: string): string | null {
  const c = COLLECTIBLES[id];
  if (!c || spotOf(p, id)) return null;
  const free = HEARTH_SPOTS.find((s) => s.kind === c.kind && !p.hearth.spots[s.id]);
  if (!free) return null;
  p.hearth.spots[free.id] = id;
  return free.id;
}
