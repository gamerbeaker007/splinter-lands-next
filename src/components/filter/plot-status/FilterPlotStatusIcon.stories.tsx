import type { Meta, StoryObj } from "@storybook/nextjs";
import { Box } from "@mui/material";
import { FilterProvider } from "@/lib/context/FilterContext";
import FilterPlotStatusIcon from "./FilterPlotStatusIcon";

const meta: Meta<typeof FilterPlotStatusIcon> = {
  title: "Components/Filter/PlotStatus",
  component: FilterPlotStatusIcon,
};

export default meta;

type Story = StoryObj<typeof FilterPlotStatusIcon>;

// Wrapped component that uses the context inside
const FilterPLotStatusIconStoryGroup = () => {
  return (
    <FilterProvider>
      <Box
        style={{ width: 300, display: "flex", gap: 10, border: "4px solid" }}
      >
        <FilterPlotStatusIcon name="Natural" />
        <FilterPlotStatusIcon name="Occupied" />
        <FilterPlotStatusIcon name="Magical" />
        <FilterPlotStatusIcon name="Kingdom" />
        <FilterPlotStatusIcon name="Unknown" />
      </Box>
    </FilterProvider>
  );
};

export const Default: Story = {
  render: () => <FilterPLotStatusIconStoryGroup />,
};
