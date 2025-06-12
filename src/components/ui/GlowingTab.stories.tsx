import type { Meta, StoryObj } from "@storybook/nextjs";
import GlowingTab from "./GlowingTab";
import { Tabs } from "@mui/material";
import { useState } from "react";

const meta: Meta<typeof GlowingTab> = {
  title: "Components/UI/Tabs",
  component: GlowingTab,
};

export default meta;

type Story = StoryObj<typeof GlowingTab>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(0);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };

    return (
      <>
        <Tabs value={value} onChange={handleChange}>
          <GlowingTab label="Summary" />
          <GlowingTab label="Overwiew" />
          <GlowingTab label="Testing 2" />
        </Tabs>
      </>
    );
  },
};
