/**
 * Utility functions for handling date columns in GroupedCardRow
 */

export interface DateEntry {
  uid: string;
  date: Date;
}

/**
 * Format a date relative to now (xH, xD, xM format)
 * For future dates, show positive values (e.g., "5H" means "in 5 hours")
 */
export function formatRelativeDate(date: Date, isFuture = false): string {
  const now = new Date();
  const diffMs = isFuture
    ? date.getTime() - now.getTime()
    : now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.44); // Average days per month

  if (diffHours < 48) {
    return `${diffHours} (hours)`;
  } else if (diffDays < 60) {
    return `${diffDays} (days)`;
  } else {
    return `${diffMonths} (months)`;
  }
}

/**
 * Format a date for tooltips (readable format)
 */
export function formatTooltipDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convert Record<string, Date> to sorted array of DateEntry
 */
export function recordToSortedDates(
  record: Record<string, Date> | undefined,
  sortOrder: "asc" | "desc" = "desc",
): DateEntry[] {
  if (!record) return [];

  const entries: DateEntry[] = Object.entries(record).map(([uid, date]) => ({
    uid,
    date: new Date(date), // Ensure it's a Date object
  }));

  return entries.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return sortOrder === "asc" ? diff : -diff;
  });
}

/**
 * Get the most recent date from a Record<string, Date>
 */
export function getMostRecentDate(
  record: Record<string, Date> | undefined,
): Date | null {
  if (!record) return null;

  const dates = Object.values(record).map((date) => new Date(date));
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/**
 * Filter dates that are on cooldown (i.e., in the future) from a Record<string, Date>
 */
export function getCoolDownDates(
  record: Record<string, Date> | undefined,
): DateEntry[] {
  if (!record) return [];

  const now = new Date();
  const entries: DateEntry[] = Object.entries(record)
    .map(([uid, date]) => ({ uid, date: new Date(date) }))
    .filter((entry) => entry.date > now);

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by earliest first
}

/**
 * Get display text for date column (shows count if multiple, or formatted date if single)
 */
export function getDateDisplayText(
  record: Record<string, Date> | undefined,
  type: "lastUsed" | "stakeEnd" | "survivalDate" = "lastUsed",
): string {
  if (!record) return "-";

  if (type === "lastUsed") {
    const newestDate = getMostRecentDate(record);
    if (!newestDate) return "-";
    return formatRelativeDate(newestDate, false);
  } else {
    // For stakeEnd, only show future dates
    const futureDates = getCoolDownDates(record);
    if (futureDates.length === 0) return "-";

    // Show the earliest future date
    return formatRelativeDate(futureDates[0].date, true);
  }
}

/**
 * Check if there are multiple entries to show info icon
 */
export function hasMultipleEntries(
  record: Record<string, Date> | undefined,
  type: "lastUsed" | "stakeEnd" | "survivalDate" = "lastUsed",
): boolean {
  if (!record) return false;

  if (type === "lastUsed") {
    return Object.keys(record).length > 1;
  } else {
    // For stakeEnd, count only future dates
    const futureDates = getCoolDownDates(record);
    return futureDates.length > 1;
  }
}

/**
 * Get tooltip content for date column
 */
export function getDateTooltipContent(
  record: Record<string, Date> | undefined,
  type: "lastUsed" | "stakeEnd" | "survivalDate" = "lastUsed",
): string {
  if (!record) return "";

  if (type === "lastUsed") {
    const sortedDates = recordToSortedDates(record, "desc"); // Newest first
    return sortedDates
      .map((entry) => `${entry.uid}: ${formatRelativeDate(entry.date, false)}`)
      .join("\n");
  } else {
    // For stakeEnd, only show future dates
    const futureDates = getCoolDownDates(record);
    return futureDates
      .map((entry) => `${entry.uid}: ${formatRelativeDate(entry.date, true)}`)
      .join("\n");
  }
}
