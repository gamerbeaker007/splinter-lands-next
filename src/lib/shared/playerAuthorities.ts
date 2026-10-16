import type { SplPlayerAuthorities } from "@/types/spl/playerAuthorities";

/** The authority lists one fetch of `/players/authorities` yields per player. */
export interface PlayerAuthorityLists {
  rental: string[];
  purchase: string[];
}

/** Picks `player`'s row out of a `/players/authorities` response. */
export function authorityListsOf(
  rows: SplPlayerAuthorities[],
  player: string
): PlayerAuthorityLists {
  const row = rows.find((r) => r.name?.toLowerCase() === player.toLowerCase());
  return {
    rental: row?.authorities?.rental ?? [],
    purchase: row?.authorities?.purchase ?? [],
  };
}

/** Whether `serviceAccount` appears in `accounts` (case-insensitive). */
export function hasAuthority(accounts: string[], serviceAccount: string) {
  return accounts
    .map((a) => a.toLowerCase())
    .includes(serviceAccount.toLowerCase());
}
