import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import FilterResourceIcon from "./FilterResourceIcon";

const meta: Meta<typeof FilterResourceIcon> = {
  title: "Components/Filter/Resource",
  component: FilterResourceIcon,
};

export default meta;

type Story = StoryObj<typeof FilterResourceIcon>;

// Wrapped component that uses the context inside
const FilteResourceIconStoryGroup = () => {
  return (
    <FilterProvider>
      <Box style={{ width: 300, display: "flow", gap: 1, border: "4px solid" }}>
        <FilterResourceIcon name="GRAIN" />
        <FilterResourceIcon name="STONE" />
        <FilterResourceIcon name="WOOD" />
        <FilterResourceIcon name="IRON" />
        <FilterResourceIcon name="AURA" />
        <FilterResourceIcon name="RESEARCH" />
        <FilterResourceIcon name="SPS" />
        <FilterResourceIcon name="TAX" />
      </Box>
    </FilterProvider>
  );
};

export const Default: Story = {
  render: () => <FilteResourceIconStoryGroup />,
};
