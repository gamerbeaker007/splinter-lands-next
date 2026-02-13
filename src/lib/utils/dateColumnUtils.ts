/**
 * Represents the possible options for sorting dates.
 * It can be either "recent" to sort by most recent dates first typically for lastUsed dates in the past,
 * or "cooldown" to sort by dates for land or survival cooldown dates are in the future (when date is past then cooldown is over)
 */
export type DateSortType = "recent" | "cooldown";

/**
 * Format a date relative to now (x minutes, x hours, x days format)
 * For future dates, show positive values (e.g., "5 (hours)" means "in 5 (hours)")
 */
export function formatRelativeDate(date: Date, isFuture = false): string {
  const now = new Date();
  const diffMs = isFuture
    ? date.getTime() - now.getTime()
    : now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return `${diffMinutes} (minutes)`;
  } else if (diffHours < 48) {
    return `${diffHours} (hours)`;
  } else {
    return `${diffDays} (days)`;
  }
}

/**
 * Convert Record<string, Date> to sorted array of DateEntry
 */
export function recordToSortedDates(record: Record<string, Date> | undefined) {
  if (!record) return [];

  const entries = Object.entries(record).map(([uid, date]) => ({
    uid,
    date: new Date(date), // Ensure it's a Date object
  }));

  return entries.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return -diff; // Newest first desc
  });
}

/**
 * Get the most recent date from a Record<string, Date>
 */
export function getMostRecentDate(
  record: Record<string, Date> | undefined
): Date | null {
  if (!record) return null;

  const dates = Object.values(record).map((date) => new Date(date));
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/**
 * Filter dates that are on cooldown (i.e., in the future) from a Record<string, Date>
 */
export function getCooldownDates(record: Record<string, Date> | undefined) {
  if (!record) return [];

  const now = new Date();
  const entries = Object.entries(record)
    .map(([uid, date]) => ({ uid, date: new Date(date) }))
    .filter((entry) => entry.date > now);

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by earliest first
}

/**
 * Get display text for date column (shows count if multiple, or formatted date if single)
 */
export function getDateDisplayText(
  record: Record<string, Date> | undefined,
  type: DateSortType
): string {
  if (!record) return "-";

  if (type === "recent") {
    const newestDate = getMostRecentDate(record);
    if (!newestDate) return "-";

    return formatRelativeDate(newestDate, false);
  } else {
    // For stakeEnd, only show future dates
    const futureDates = getCooldownDates(record);
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
  type: DateSortType
): boolean {
  if (!record) return false;

  if (type === "recent") {
    return Object.keys(record).length > 1;
  } else {
    // For stakeEnd, count only future dates
    const futureDates = getCooldownDates(record);
    return futureDates.length > 1;
  }
}

/**
 * Get tooltip content for date column
 */
export function getDateTooltipContent(
  record: Record<string, Date> | undefined,
  type: DateSortType
): string {
  if (!record) return "";

  if (type === "recent") {
    const sortedDates = recordToSortedDates(record); // Newest first
    return sortedDates
      .map((entry) => `${entry.uid}: ${formatRelativeDate(entry.date, false)}`)
      .join("\n");
  } else {
    // For stakeEnd, only show future dates
    const futureDates = getCooldownDates(record);
    return futureDates
      .map((entry) => `${entry.uid}: ${formatRelativeDate(entry.date, true)}`)
      .join("\n");
  }
}

/**
 * Get sort value for a row (useful for table sorting libraries)
 */
export function getDateSortValue(
  dates: Record<string, Date>,
  sortBy: DateSortType
): number {
  switch (sortBy) {
    case "recent": {
      const date = getMostRecentDate(dates);
      return date ? date.getTime() : 0;
    }
    case "cooldown": {
      const futureDates = getCooldownDates(dates);
      return futureDates.length > 0 ? futureDates[0].date.getTime() : 0;
    }
    default:
      return 0;
  }
}

export const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
};
