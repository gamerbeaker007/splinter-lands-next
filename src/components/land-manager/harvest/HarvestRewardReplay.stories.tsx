import ActionCard from "@/components/land-manager/harvest/ActionCard";
import HarvestRewardReplay from "@/components/land-manager/harvest/HarvestRewardReplay";
import HarvestRewardReveal from "@/components/land-manager/harvest/HarvestRewardReveal";
import type { HarvestReward } from "@/lib/shared/harvestRewards";
import { land_castle_icon_url } from "@/lib/shared/statics_icon_urls";
import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

const fragment: HarvestReward = {
  kind: "fragment",
  key: "fragment:keep",
  deedUid: "keep",
  fragmentType: "TOTEMFR",
};
const onHarvest = fn();

const meta: Meta = {
  title: "HarvestAnimation/RewardReplay",
};
export default meta;
type Story = StoryObj;

export const CardReplay: Story = {
  render: () => {
    return <ReplayCards />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: "No rewards to replay" })
    ).not.toBeInTheDocument();
    const replay = canvas.getByRole("button", {
      name: "Replay today's Harvest Mythics rewards",
    });
    await userEvent.click(replay);
    await expect(onHarvest).not.toHaveBeenCalled();
    let dialog = await within(document.body).findByRole("dialog");
    await expect(
      within(dialog).getByRole("img", { name: "Rare Totem Fragment" })
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Nice!" })
    );
    await waitFor(() =>
      expect(
        within(document.body).queryByRole("dialog")
      ).not.toBeInTheDocument()
    );
    await userEvent.click(replay);
    dialog = await within(document.body).findByRole("dialog");
    await expect(
      within(dialog).getByRole("img", { name: "Rare Totem Fragment" })
    ).toBeInTheDocument();
  },
};

function ReplayCards() {
  const [open, setOpen] = useState(false);
  return (
    <Stack direction="row" gap={2}>
      <ActionCard
        title="Harvest All with no rewards"
        tooltip="Harvest"
        backgroundImage={land_castle_icon_url}
        icon={null}
        accentColor="success.main"
        onClick={onHarvest}
      />
      <ActionCard
        title="Harvest Mythics"
        tooltip="Harvest"
        backgroundImage={land_castle_icon_url}
        icon={null}
        accentColor="secondary.main"
        onClick={onHarvest}
        cornerAction={
          <HarvestRewardReplay
            label="Replay today's Harvest Mythics rewards"
            onClick={() => setOpen(true)}
          />
        }
      />
      {open && (
        <HarvestRewardReveal
          open
          rewards={[fragment]}
          cardDetails={null}
          onClose={() => setOpen(false)}
        />
      )}
    </Stack>
  );
}
