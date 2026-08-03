import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import type { Meta, StoryObj } from "@storybook/react";

import FilterTerrainBoostGroup from "./FilterTerrainBoostGroup";

const meta: Meta<typeof FilterTerrainBoostGroup> = {
  title: "Components/Filter/Terrain Boost/Group",
  component: FilterTerrainBoostGroup,
};

export default meta;

type Story = StoryObj<typeof FilterTerrainBoostGroup>;

// Wrapped component that uses the context inside
export const Default: Story = {
  render: () => {
    return (
      <FilterProvider>
        <FilterTerrainBoostGroup />
      </FilterProvider>
    );
  },
};
