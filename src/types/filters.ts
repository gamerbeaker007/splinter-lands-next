import { SortSelection } from "./sorting";
import { CardRarity, CardSetName } from "@/types/planner";

export type FilterInput = {
  filter_regions?: number[];
  filter_tracts?: number[];
  filter_plots?: number[];
  filter_rarity?: string[];
  filter_resources?: string[];
  filter_worksites?: string[];
  filter_deed_type?: string[];
  filter_plot_status?: string[];
  filter_players?: string[];
  filter_developed?: boolean;
  filter_under_construction?: boolean;
  filter_pp_min?: number | null;
  filter_pp_max?: number | null;
  sorting?: SortSelection;
};

export type EnableFilterOptions = {
  regions: boolean;
  tracts: boolean;
  plots: boolean;
  attributes: boolean;
  player: boolean;
  sorting: boolean;
};

export type CardFilterInput = {
  filter_set?: CardSetName[];
  filter_rarity?: CardRarity[];
  filter_on_land?: Tri;
  filter_in_set?: Tri;
  filter_on_wagon?: Tri;
};

export type Tri = "only" | "hide" | "all";
