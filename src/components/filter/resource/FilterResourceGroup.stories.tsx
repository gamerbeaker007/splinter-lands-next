import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import type { Meta, StoryObj } from "@storybook/react";
import FilterRarityGroup from "../rarity/FilterRarityGroup";
import FilterResourceGroup from "./FilterResourceGroup";

const meta: Meta<typeof FilterRarityGroup> = {
  title: "Components/Filter/Resource/Group",
  component: FilterRarityGroup,
};

export default meta;

type Story = StoryObj<typeof FilterRarityGroup>;

// Wrapped component that uses the context inside
export const Default: Story = {
  render: () => {
    return (
      <FilterProvider>
        <FilterResourceGroup
          options={[
            "GRAIN",
            "WOOD",
            "STONE",
            "IRON",
            "RESEARCH",
            "AURA",
            "SPS",
          ]}
        />
      </FilterProvider>
    );
  },
};
