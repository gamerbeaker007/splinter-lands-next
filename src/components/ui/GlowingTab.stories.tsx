import { Tabs } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import GlowingTab from "./GlowingTab";

const meta: Meta<typeof GlowingTab> = {
  title: "Components/UI/Tabs",
  component: GlowingTab,
};

export default meta;

type Story = StoryObj<typeof GlowingTab>;

const DefaultStory = () => {
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
};

export const Default: Story = {
  render: () => <DefaultStory />,
};
