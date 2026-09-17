"use client";

import CardDayFilter from "@/components/cardFilter/CardDayFilter";
import FilterPanelShell from "@/components/filter/panel/FilterPanelShell";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { countActiveFilters } from "@/lib/frontend/utils/activeFilterCount";
import FormGroup from "@mui/material/FormGroup";
import { useMemo } from "react";
import CardBooleanFilter from "./CardBooleanFilter";
import CardFilterRarityGroup from "./CardFilterRarityGroup";
import CardFilterSetGroup from "./CardFilterSetGroup";
import CardNameFilter from "./CardNameFilter";
import ResetCardFiltersButton from "./ResetCardFiltersButton";

type Props = {
  /** Card data is being (re)fetched; shown inside the panel, never hides it. */
  loading?: boolean;
};

export default function CardFilterDrawer({ loading = false }: Props) {
  const { cardFilters } = useCardFilters();

  const activeCount = useMemo(
    () => countActiveFilters(cardFilters),
    [cardFilters]
  );

  return (
    <FilterPanelShell
      title="Card Filters"
      activeCount={activeCount}
      loading={loading}
      footer={<ResetCardFiltersButton />}
    >
      <CardFilterSetGroup />
      <CardFilterRarityGroup />

      <FormGroup>
        <CardNameFilter />
      </FormGroup>

      <FormGroup>
        <CardBooleanFilter title="On Land" filterKey="filter_on_land" />
        <CardBooleanFilter title="In Set" filterKey="filter_in_set" />
        <CardBooleanFilter title="On Wagon" filterKey="filter_on_wagon" />
        <CardBooleanFilter title="Delegated" filterKey="filter_delegated" />
        <CardBooleanFilter title="Owned" filterKey="filter_owned" />
        <CardBooleanFilter
          title="Land Cooldown"
          filterKey="filter_land_cooldown"
        />
        <CardBooleanFilter
          title="Survial Cooldown"
          filterKey="filter_survival_cooldown"
        />
      </FormGroup>

      <FormGroup>
        <CardDayFilter title={"Last Used"} filterKey={"filter_last_used"} />
      </FormGroup>
    </FilterPanelShell>
  );
}
