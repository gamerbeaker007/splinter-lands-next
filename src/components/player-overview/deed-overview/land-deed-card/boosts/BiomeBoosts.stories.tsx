// components/BiomeBoosts.stories.tsx
import { Meta, StoryObj } from "@storybook/react";
import { BiomeBoosts } from "./BiomeBoost";

const meta: Meta<typeof BiomeBoosts> = {
  title: "Components/PlayerOverview/DeedOverview/BiomeBoosts",
  component: BiomeBoosts,
};

export default meta;

type Story = StoryObj<typeof BiomeBoosts>;

export const Default: Story = {
  args: {
    modifiers: {
      fire: 0.1,
      water: -0.15,
      earth: 0.05,
      life: 0.1,
      dragon: 1,
    },
  },
};
