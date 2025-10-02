import { GroupedCardRow } from "@/types/groupedCardRow";
import {
  getCoolDownDates as getCooldownDates,
  getMostRecentDate,
} from "./dateColumnUtils";

/**
 * Sorting functions for date columns in GroupedCardRow
 */

export type DateSortType = "lastUsed" | "stakeEnd" | "survivalDate";
export type SortDirection = "asc" | "desc";

/**
 * Compare function for lastUsedDate sorting
 */
export function compareLastUsedDate(
  a: GroupedCardRow,
  b: GroupedCardRow,
  direction: SortDirection = "desc",
): number {
  const dateA = getMostRecentDate(a.lastUsedDate);
  const dateB = getMostRecentDate(b.lastUsedDate);

  // Handle null dates (put them at the end)
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  const diff = dateA.getTime() - dateB.getTime();
  return direction === "asc" ? diff : -diff;
}

/**
 * Compare function for stakeEndDate sorting
 */
export function compareStakeEndDate(
  a: GroupedCardRow,
  b: GroupedCardRow,
  direction: SortDirection = "asc",
): number {
  // For stake end dates, we only care about future dates
  const futureDatesA = getCooldownDates(a.stakeEndDate);
  const futureDatesB = getCooldownDates(b.stakeEndDate);

  const dateA = futureDatesA.length > 0 ? futureDatesA[0].date : null; // Earliest future date
  const dateB = futureDatesB.length > 0 ? futureDatesB[0].date : null;

  // Handle null dates (put them at the end)
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  const diff = dateA.getTime() - dateB.getTime();
  return direction === "asc" ? diff : -diff;
}

/**
 * Generic sort function for GroupedCardRow arrays with date columns
 */
export function sortGroupedCardRows(
  rows: GroupedCardRow[],
  sortBy: DateSortType,
  direction: SortDirection = "desc",
): GroupedCardRow[] {
  const sortedRows = [...rows];

  switch (sortBy) {
    case "lastUsed":
      return sortedRows.sort((a, b) => compareLastUsedDate(a, b, direction));
    case "stakeEnd":
      return sortedRows.sort((a, b) => compareStakeEndDate(a, b, direction));
    default:
      return sortedRows;
  }
}

/**
 * Get sort value for a row (useful for table sorting libraries)
 */
export function getDateSortValue(
  row: GroupedCardRow,
  sortBy: DateSortType,
): number {
  switch (sortBy) {
    case "lastUsed": {
      const date = getMostRecentDate(row.lastUsedDate);
      return date ? date.getTime() : 0;
    }
    case "stakeEnd": {
      const futureDates = getCooldownDates(row.stakeEndDate);
      return futureDates.length > 0 ? futureDates[0].date.getTime() : 0;
    }
    case "survivalDate": {
      const futureDates = getCooldownDates(row.survivalDate);
      return futureDates.length > 0 ? futureDates[0].date.getTime() : 0;
    }
    default:
      return 0;
  }
}
