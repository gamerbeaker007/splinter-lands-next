import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import MultiSelect from "./MultiSelect";

const meta: Meta<typeof MultiSelect> = {
  title: "Components/MultiSelect",
  component: MultiSelect,
};

export default meta;

type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(["Option B"]);
    const options = [
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Option E",
      "Option F",
      "Option G",
      "Option H",
      "Option I",
    ];

    return (
      <div style={{ width: 400 }}>
        <MultiSelect
          label="Example Select"
          values={options}
          selected={selected}
          onChange={setSelected}
        />
      </div>
    );
  },
};
