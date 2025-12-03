import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SummaryTile from "./SummaryTile";
import {
  land_aura_lab_icon_url,
  land_castle_icon_url,
  land_hammer_icon_url,
  land_shard_mine_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Box } from "@mui/material";

const meta: Meta<typeof SummaryTile> = {
  title: "Components/Region/SummaryTile",
  component: SummaryTile,
};

export default meta;

type Story = StoryObj<typeof SummaryTile>;

export const Default: Story = {
  render: () => {
    return (
      <>
        <Box display="flex" gap={1}>
          <SummaryTile
            type="Test Type"
            imageUrl={land_aura_lab_icon_url}
            count={150}
          />
          <SummaryTile
            type="Test Type"
            imageUrl={land_hammer_icon_url}
            count={150_000}
          />
          <SummaryTile
            type="Test Type"
            imageUrl={land_castle_icon_url}
            count={15000}
          />
          <SummaryTile
            type="Test Type"
            imageUrl={land_shard_mine_icon_url}
            count={150_000}
          />
          <SummaryTile
            type="Deed Legendary"
            imageUrl={land_shard_mine_icon_url}
            count={150_000}
          />

          <SummaryTile
            type="Title Legendary"
            info="Boost: 100%"
            imageUrl={land_shard_mine_icon_url}
            count={150_000}
          />
        </Box>
      </>
    );
  },
};
