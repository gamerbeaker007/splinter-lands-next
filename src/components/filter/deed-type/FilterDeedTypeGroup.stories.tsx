import type { Meta, StoryObj } from "@storybook/react";
import FilterDeedTypeGroup from "./FilterDeedTypeGroup";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";

const meta: Meta<typeof FilterDeedTypeGroup> = {
  title: "Components/Filter/DeedType/Group",
  component: FilterDeedTypeGroup,
};

export default meta;

type Story = StoryObj<typeof FilterDeedTypeGroup>;

// Wrapped component that uses the context inside
export const Default: Story = {
  render: () => {
    return (
      <FilterProvider>
        <FilterDeedTypeGroup
          options={["Badlands", "Hills", "Unsurveyed", ""]}
        />
      </FilterProvider>
    );
  },
};
