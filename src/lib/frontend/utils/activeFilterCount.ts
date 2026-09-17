/**
 * Counts how many filter values are actually "set" in a filter object.
 *
 * Used to badge the filter toggle button so users can see at a glance that
 * filters are narrowing the data, even while the panel is closed.
 */
const isActiveValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.length > 0 && value !== "all";
  // booleans (incl. false) and numbers are explicit choices once present
  return true;
};

export function countActiveFilters(
  filters: Record<string, unknown>,
  ignoreKeys: readonly string[] = []
): number {
  return Object.entries(filters).filter(
    ([key, value]) => !ignoreKeys.includes(key) && isActiveValue(value)
  ).length;
}
