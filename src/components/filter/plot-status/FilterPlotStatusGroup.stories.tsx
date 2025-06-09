import type { Meta, StoryObj } from "@storybook/nextjs";
import { FilterProvider } from "@/lib/context/FilterContext";
import FilterPlotStatusGroup from "./FilterPlotStatusGroup";

const meta: Meta<typeof FilterPlotStatusGroup> = {
  title: "Components/Filter/PlotStatus/Group",
  component: FilterPlotStatusGroup,
};

export default meta;

type Story = StoryObj<typeof FilterPlotStatusGroup>;

// Wrapped component that uses the context inside
export const Default: Story = {
  render: () => {
    return (
      <FilterProvider>
        <FilterPlotStatusGroup
          options={["Natural", "Magical", "Unknown", "Kingdom", "Occupied", ""]}
        />
      </FilterProvider>
    );
  },
};
