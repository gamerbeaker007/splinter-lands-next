// components/BiomeBoosts.stories.tsx
import { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BiomeBoosts } from "./BiomeBoost";

const meta: Meta<typeof BiomeBoosts> = {
  title: "Components/PlayerOverview/DeeoOverview/BiomeBoosts",
  component: BiomeBoosts,
};

export default meta;

type Story = StoryObj<typeof BiomeBoosts>;

export const Default: Story = {
  args: {
    modifiers: {
      red: 0.1,
      blue: -0.15,
      green: 0.05,
      white: 0.1,
      gold: 1,
    },
  },
};
