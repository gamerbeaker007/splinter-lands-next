import CardTile from "@/components/player-overview/deed-overview-tile/CardTile";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";

const meta: Meta<typeof CardTile> = {
  title: "Components/PlayerOverview/DeeoOverview/Card",
  component: CardTile,
};

export default meta;

type Story = StoryObj<typeof CardTile>;

// Wrapped component that uses the context inside

export const Default: Story = {
  render: () => {
    return (
      <Box
        style={{
          width: "800px",
          height: "400px",
          display: "flow",
          gap: 1,
          border: "1px dashed",
        }}
      >
        <CardTile
          name={"Fenmoor Wood Troll"}
          foil={0}
          edition={14}
          rarity={"Common"}
          actual_bcx={20}
          max_bcx={400}
          base_pp={100000}
          boosted_pp={100000}
          terrain_boost={-10.1}
          uid=""
        />
        <CardTile
          name={"Fenmoor Wood Troll"}
          foil={3}
          edition={14}
          rarity={"Rare"}
          actual_bcx={400}
          max_bcx={400}
          base_pp={100000}
          boosted_pp={100000}
          terrain_boost={0.1}
          uid=""
        />
      </Box>
    );
  },
};
