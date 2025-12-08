import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import type { Meta, StoryObj } from "@storybook/react";
import FilterRarityGroup from "./FilterRarityGroup";

const meta: Meta<typeof FilterRarityGroup> = {
  title: "Components/Filter/Rarity/Group",
  component: FilterRarityGroup,
};

export default meta;

type Story = StoryObj<typeof FilterRarityGroup>;

// Wrapped component that uses the context inside
export const Default: Story = {
  render: () => {
    return (
      <FilterProvider>
        <FilterRarityGroup
          options={[
            "epic",
            "common",
            "Unknown",
            "rare",
            "legendary",
            "mythic",
            "",
          ]}
        />
      </FilterProvider>
    );
  },
};
