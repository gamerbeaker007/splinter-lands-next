import { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RarityBoost } from "./RarityBoost";

const meta: Meta<typeof RarityBoost> = {
  title: "Components/PlayerOverview/Boosts/RarityBoost",
  component: RarityBoost,
};

export default meta;

type Story = StoryObj<typeof RarityBoost>;

export const Default: Story = {
  args: {
    rarity: "Epic",
    boost: 0.25, // 25%
  },
};

export const NoBoostForCommon: Story = {
  args: {
    rarity: "Common",
    boost: 0.1,
  },
};

export const NoBoostForMythic: Story = {
  args: {
    rarity: "Mythic",
    boost: 0.2,
  },
};
