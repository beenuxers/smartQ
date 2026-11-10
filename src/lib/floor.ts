import { getPlan } from "./pricing";

export const TABLE_STATUSES = ["free", "occupied", "dirty"] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

/** Table floor is Starter + Growth only. */
export function planHasFloor(planId: string) {
  const id = getPlan(planId).id;
  return id === "starter" || id === "growth";
}

export function serializeTable(t: {
  id: string;
  outletId: string;
  name: string;
  seats: number;
  status: string;
  sortOrder: number;
  partyId: string | null;
  seatedAt: Date | null;
  clearedAt: Date | null;
  party?: {
    id: string;
    queueNumber: number;
    guestName: string;
    partySize: number;
    phone: string;
  } | null;
}) {
  return {
    id: t.id,
    outletId: t.outletId,
    name: t.name,
    seats: t.seats,
    status: t.status,
    sortOrder: t.sortOrder,
    partyId: t.partyId,
    seatedAt: t.seatedAt?.toISOString() ?? null,
    clearedAt: t.clearedAt?.toISOString() ?? null,
    party: t.party
      ? {
          id: t.party.id,
          queueNumber: t.party.queueNumber,
          guestName: t.party.guestName,
          partySize: t.party.partySize,
          phone: t.party.phone,
        }
      : null,
  };
}
