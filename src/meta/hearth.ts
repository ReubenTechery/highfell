/**
 * The house's display spots and looks, and the cellar's doors. A layout is just spot id to collectible id, and a
 * look is room id to look id, both saved in the profile, so a friend's house can later be drawn from their profile
 * the same way; the doors are read from what you've done. Where each spot, room and door is lives in the house's
 * plan (content/house.ts); this is the rules.
 */
import type { CollectibleKind } from '../content/types';
import { COLLECTIBLES, DUNGEONS, heroicVersion } from '../content';
import { ACT1_DUNGEONS } from '../content/act1';
import { DEFAULT_LOOK, HOUSE_SPOTS, LOOKS, LOOK_ROOMS } from '../content/house';
import { logFinished, openProgress, opened } from './logs';
import type { Profile } from './profile';

export interface Spot { id: string; kind: CollectibleKind; label: string }

export const HEARTH_SPOTS: Spot[] = HOUSE_SPOTS.map(({ id, kind, label }) => ({ id, kind, label }));
export const spotById = (id: string): Spot | undefined => HEARTH_SPOTS.find((s) => s.id === id);

export function ownedOfKind(p: Profile, kind: CollectibleKind): string[] {
  return Object.keys(p.collection).filter((id) => COLLECTIBLES[id] && COLLECTIBLES[id].kind === kind);
}
/** The spot something is on show in. A spot the house no longer has (the old stall) doesn't count. */
export const spotOf = (p: Profile, id: string): string | null => Object.entries(p.hearth.spots).find(([k, v]) => v === id && spotById(k))?.[0] ?? null;

/** Every mount in the game, in the order the game lists them: each has its own place in the paddock. */
export const MOUNTS: string[] = Object.values(COLLECTIBLES).filter((c) => c.kind === 'mount').map((c) => c.id);
/** The paddock: every mount in the game, and whether it's yours. One you own stands in its place (wherever
 *  it was on show before: the old stall, the garden); one you haven't got shows as a shadow. */
export const paddock = (p: Profile): { id: string; owned: boolean }[] => MOUNTS.map((id) => ({ id, owned: !!p.collection[id] }));

/** How far you've got with a dungeon, as its door in the cellar shows it: bricked up while it's still to come, then
 *  plain until you've cleared it (Normal or Heroic), lit once you have, gold once its collection log is finished and
 *  gilded once its Heroic log is. */
export type DoorState = 'soon' | 'plain' | 'lit' | 'gold' | 'gilded';
export function doorState(p: Profile, id: string): DoorState {
  if (!DUNGEONS[id]) return 'soon';
  const hv = heroicVersion(id);
  if (hv && logFinished(p, hv.id)) return 'gilded';
  if (logFinished(p, id)) return 'gold';
  const clears = (p.dungeons[id]?.clears || 0) + (hv ? p.dungeons[hv.id]?.clears || 0 : 0);
  return clears > 0 ? 'lit' : 'plain';
}
/** The Hall of Doors: every dungeon of Act 1, built or still to come, in the order you meet them, and how far you've
 *  got with each. Each one has its place along the cellar's wall (hallSlots in content/house.ts). */
export const cellarDoors = (p: Profile): { id: string; state: DoorState }[] => ACT1_DUNGEONS.map((m) => ({ id: m.id, state: doorState(p, m.id) }));

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

/** New pets, trophies and banners go straight into the first empty spot of their kind, so you see them
 *  the moment you get home: the hall first, then the loft and the roof. A new mount is in the paddock already. */
export function autoPlace(p: Profile, id: string): string | null {
  const c = COLLECTIBLES[id];
  if (!c || spotOf(p, id)) return null;
  const free = HEARTH_SPOTS.find((s) => s.kind === c.kind && !p.hearth.spots[s.id]);
  if (!free) return null;
  p.hearth.spots[free.id] = id;
  return free.id;
}

/** How close you are to a look: the slots of the collection log that opens it. The tavern needs none. */
export const lookProgress = (p: Profile, id: string): { have: number; need: number } => openProgress(p, 'look', id);
/** A look you can put on: the tavern, or one whose collection log you've finished. */
export const lookOpen = (p: Profile, id: string): boolean => LOOKS.some((l) => l.id === id) && opened(p, 'look', id);

/** The look a room is drawn in: the one you put on it once you've earned it (or with `free`, the testing
 *  switch), otherwise the tavern. A look this build doesn't know, from a newer one, is drawn as the tavern. */
export function lookOf(p: Profile, room: string, free = false): string {
  const id = p.hearth.looks[room];
  return id && LOOKS.some((l) => l.id === id) && (free || lookOpen(p, id)) ? id : DEFAULT_LOOK;
}

/** Put a look on one room, or on every room with 'house'. Only a look you've earned, unless `free`. */
export function setLook(p: Profile, target: string, id: string, free = false): boolean {
  if (!LOOKS.some((l) => l.id === id) || !(free || lookOpen(p, id))) return false;
  const rooms = target === 'house' ? LOOK_ROOMS : LOOK_ROOMS.filter((r) => r === target);
  for (const r of rooms) p.hearth.looks[r] = id;
  return rooms.length > 0;
}
