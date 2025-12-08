import { Meta, StoryObj } from "@storybook/react";
import { ItemBoosts } from "./ItemBoost";

const meta: Meta<typeof ItemBoosts> = {
  title: "Components/PlayerOverview/Boosts/ItemBoosts",
  component: ItemBoosts,
};

export default meta;
type Story = StoryObj<typeof ItemBoosts>;

export const Default: Story = {
  args: {
    items: [
      {
        name: "Common Totem",
        boost: 0.05,
        stake_type_uid: "STK-LND-TOT",
        uid: "not imporant",
        item_detail_id: 0,
        player: "not imporant",
        stake_start_date: "not imporant",
        stake_ref_uid: "not imporant",
        stake_ref_id: "not imporant",
      },
      {
        name: "Rare Totem",
        boost: 0.1,
        stake_type_uid: "STK-LND-TOT",
        uid: "not imporant",
        item_detail_id: 0,
        player: "not imporant",
        stake_start_date: "not imporant",
        stake_ref_uid: "not imporant",
        stake_ref_id: "not imporant",
      },
      {
        name: "The Proven",
        boost: 0.2,
        stake_type_uid: "STK-LND-TTL",
        uid: "not imporant",
        item_detail_id: 0,
        player: "not imporant",
        stake_start_date: "not imporant",
        stake_ref_uid: "not imporant",
        stake_ref_id: "not imporant",
      },
      {
        name: "The Unknow title which will become a hammer",
        boost: 1,
        stake_type_uid: "STK-LND-TTL",
        uid: "not imporant",
        item_detail_id: 0,
        player: "not imporant",
        stake_start_date: "not imporant",
        stake_ref_uid: "not imporant",
        stake_ref_id: "not imporant",
      },
    ],
  },
};
