import { SortSelection } from "./sorting";

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
  filter_has_pp?: boolean;
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
