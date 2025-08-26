// types/sorting.ts
export type SortOptionKey =
  | "regionNumber"
  | "tractNumber"
  | "plotNumber"
  | "basePP"
  | "boostedPP"
  | "percentComplete"
  | "netDEC";

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
    key: "basePP",
    label: "Base PP",
  },
  {
    key: "boostedPP",
    label: "Boosted PP",
  },
  {
    key: "percentComplete",
    label: "Percentage full/complete",
  },
  {
    key: "netDEC",
    label: "DEC /hr",
  },
];
