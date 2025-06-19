import type { Meta, StoryObj } from "@storybook/nextjs";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import FilterResourceGroup from "./FilterResourceGroup";
import FilterRarityGroup from "../rarity/FilterRarityGroup";

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
