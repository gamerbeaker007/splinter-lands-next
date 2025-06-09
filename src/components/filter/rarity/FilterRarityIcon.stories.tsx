import type { Meta, StoryObj } from "@storybook/nextjs";
import FilterRarityIcon from "./FilterRarityIcon";
import { Box } from "@mui/material";
import { FilterProvider } from "@/lib/context/FilterContext";

const meta: Meta<typeof FilterRarityIcon> = {
  title: "Components/Filter/Rarity",
  component: FilterRarityIcon,
};

export default meta;

type Story = StoryObj<typeof FilterRarityIcon>;

// Wrapped component that uses the context inside
const FilterRarityIconStoryGroup = () => {
  return (
    <FilterProvider>
      <Box
        style={{ width: 300, display: "flex", gap: 10, border: "4px solid" }}
      >
        <FilterRarityIcon name="common" />
        <FilterRarityIcon name="rare" />
        <FilterRarityIcon name="epic" />
        <FilterRarityIcon name="legendary" />
        <FilterRarityIcon name="mythic" />
      </Box>
    </FilterProvider>
  );
};

export const Default: Story = {
  render: () => <FilterRarityIconStoryGroup />,
};
