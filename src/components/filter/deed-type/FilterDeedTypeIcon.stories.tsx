import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box } from "@mui/material";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import FilterDeedTypeIcon from "./FilterDeedTypeIcon";

const meta: Meta<typeof FilterDeedTypeIcon> = {
  title: "Components/Filter/DeedType",
  component: FilterDeedTypeIcon,
};

export default meta;

type Story = StoryObj<typeof FilterDeedTypeIcon>;

// Wrapped component that uses the context inside
const FilteDeedTypeIconStoryGroup = () => {
  return (
    <FilterProvider>
      <Box style={{ width: 300, display: "flow", gap: 1, border: "4px solid" }}>
        <FilterDeedTypeIcon name="Badlands" />
        <FilterDeedTypeIcon name="Bog" />
        <FilterDeedTypeIcon name="Unsurveyed Deed" />
      </Box>
    </FilterProvider>
  );
};

export const Default: Story = {
  render: () => <FilteDeedTypeIconStoryGroup />,
};
