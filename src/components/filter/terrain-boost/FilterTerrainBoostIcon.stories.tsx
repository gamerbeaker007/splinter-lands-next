import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";

import FilterTerrainBoostIcon from "./FilterTerrainBoostIcon";

const meta: Meta<typeof FilterTerrainBoostIcon> = {
  title: "Components/Filter/Terrain Boost",
  component: FilterTerrainBoostIcon,
};

export default meta;

type Story = StoryObj<typeof FilterTerrainBoostIcon>;

// Wrapped component that uses the context inside
const FilterTerrainBoostIconStoryGroup = () => {
  return (
    <FilterProvider>
      <Box
        style={{ width: 300, display: "flex", gap: 10, border: "4px solid" }}
      >
        <FilterTerrainBoostIcon name="fire" />
        <FilterTerrainBoostIcon name="water" />
        <FilterTerrainBoostIcon name="life" />
        <FilterTerrainBoostIcon name="death" />
        <FilterTerrainBoostIcon name="earth" />
        <FilterTerrainBoostIcon name="dragon" />
        <FilterTerrainBoostIcon name="neutral" />
      </Box>
    </FilterProvider>
  );
};

export const Default: Story = {
  render: () => <FilterTerrainBoostIconStoryGroup />,
};
