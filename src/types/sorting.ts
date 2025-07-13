// types/sorting.ts
export type SortOptionKey =
  | "regionNumber"
  | "tractNumber"
  | "plotNumber"
  | "rawPP"
  | "boostedPP";

export type SortOption = {
  key: SortOptionKey;
  label: string;
};

export type SortDirection = "asc" | "desc";

export type SortSelection = {
  key: SortOptionKey;
  direction: SortDirection;
};

export const defaultSortOptions: SortOption[] = [
  { key: "regionNumber", label: "Region Number" },
  { key: "tractNumber", label: "Tract Number" },
  { key: "plotNumber", label: "Plot Number" },
  {
    key: "rawPP",
    label: "RAW PP",
  },
  {
    key: "boostedPP",
    label: "BOOSTED PP",
  },
];
