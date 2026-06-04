import { RenewRentalPlan } from "@/types/landManager";
import type { Meta, StoryObj } from "@storybook/react";
import RenewRentalsDialog from "./RenewRentalsDialog";

const basePlan: RenewRentalPlan = {
  items: [
    {
      card_uid: "card-10001",
      market_id: "mkt-10001",
      card_detail_id: 402,
      dec_per_day: 1,
      renewal_days: 16,
      total_dec: 16,
      current_rental_end: "2026-05-29T00:00:00.000Z",
      stake_plot: 314,
      stake_region: 12,
      owner: "landlord.alpha",
    },
  ],
  skipped_already_renewed: 0,
  skipped_no_market_id: 0,
  skipped_cancel_tx: 0,
  total_dec: 16,
  dec_balance: 42.5,
  sufficient_balance: true,
  season_days_remaining: 5.6,
  current_season_end: "2026-06-03T00:00:00.000Z",
  next_season_end: "2026-06-18T00:00:00.000Z",
};

const meta: Meta<typeof RenewRentalsDialog> = {
  title: "Land Manager/Bulk Operations/RenewRentalsDialog",
  component: RenewRentalsDialog,
  args: {
    busy: false,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RenewRentalsDialog>;

/** Blog-ready example with realistic values: 16-day renewal at 1 DEC/day (16 DEC total). */
export const BlogExample16DaysAt1Dec: Story = {
  args: {
    plan: basePlan,
  },
};

/** Same scenario while broadcast is in progress. */
export const BlogExampleBusy: Story = {
  args: {
    plan: basePlan,
    busy: true,
  },
};
