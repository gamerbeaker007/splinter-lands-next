import { FilterProvider } from "../../lib/frontend/context/FilterContext";
import { FilterInput } from "../../types/filters";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import AttributeFilter from "./AttributeFilter";
import LocationFilter from "./LocationFilter";
import PlayerFilter from "./PlayerFilter";
import ResetFiltersButton from "./reset-filters/ResetFiltersButton";
import Sorting from "./Sorting";

const meta: Meta = {
  title: "Components/Filter/Drawer Overview",
};

export default meta;

type Story = StoryObj;

const options: FilterInput = {
  filter_regions: [1, 2, 3],
  filter_tracts: [1, 2, 3, 4],
  filter_plots: [1, 2, 3, 4, 5],
  filter_rarity: ["common", "rare", "epic", "legendary", "mythic"],
  filter_resources: ["GRAIN", "WOOD", "STONE", "IRON", "AURA", "SPS"],
  filter_worksites: [
    "Grain Farm",
    "Ore Mine",
    "Quarry",
    "Logging Camp",
    "Aura Lab",
    "Shard Mine",
    "Research Hut",
    "KEEP",
    "CASTLE",
  ],
  filter_deed_type: ["badlands", "bog", "forest", "hills", "Unsurveyed"],
  filter_plot_status: ["natural", "magical", "occupied", "kingdom"],
  filter_terrain_boosts: ["fire", "water", "life", "death", "earth", "dragon"],
  filter_players: ["alice", "bob", "charlie"],
};

export const Default: Story = {
  render: () => (
    <FilterProvider>
      <Box
        sx={{
          width: 320,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <LocationFilter
          options={options}
          showRegion={true}
          showTract={true}
          showPlot={true}
        />
        <AttributeFilter options={options} />
        <PlayerFilter options={options} />
        <Sorting />
        <ResetFiltersButton />
      </Box>
    </FilterProvider>
  ),
};
