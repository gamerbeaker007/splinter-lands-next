import { CardElement, CardRarity, TitleTier, TotemTier } from "@/types/planner";
import { CardSetNameLandValid } from "./editions";
import { SortSelection } from "./sorting";

export type PoweredFilter = "all" | "powered" | "unpowered";
export type WorkerFilter =
  | "all"
  | "hasWorkers"
  | "hasEmptySlots"
  | "fullyEmpty";

export type FilterInput = {
  filter_regions?: number[];
  filter_tracts?: number[];
  filter_plots?: number[];
  filter_rarity?: string[];
  filter_resources?: string[];
  filter_worksites?: string[];
  filter_deed_type?: string[];
  filter_plot_status?: string[];
  filter_terrain_boosts?: string[];
  filter_players?: string[];
  filter_powered?: PoweredFilter;
  filter_workers?: WorkerFilter;
  filter_developed?: boolean;
  filter_under_construction?: boolean;
  filter_has_land_ability?: boolean;
  filter_has_runi?: boolean;
  filter_title_tier?: Exclude<TitleTier, "none">[];
  filter_totem_tier?: Exclude<TotemTier, "none">[];
  filter_base_pp_min?: number | null;
  filter_base_pp_max?: number | null;
  filter_boosted_pp_min?: number | null;
  filter_boosted_pp_max?: number | null;
  filter_positive_terrain_elements?: CardElement[];
  sorting?: SortSelection;
};

export type EnableFilterOptions = {
  regions: boolean;
  tracts: boolean;
  plots: boolean;
  attributes: boolean;
  player: boolean;
  sorting: boolean;
  /** Show powered/workers filter toggles in the Attributes filter section. */
  poweredWorkers?: boolean;
};

export type CardFilterInput = {
  filter_card_name?: string;
  filter_set?: CardSetNameLandValid[];
  filter_rarity?: CardRarity[];
  filter_on_land?: boolean;
  filter_in_set?: boolean;
  filter_on_wagon?: boolean;
  filter_delegated?: boolean;
  filter_owned?: boolean;
  filter_last_used?: number; // number represent days
  filter_land_cooldown?: boolean;
  filter_survival_cooldown?: boolean;
};
