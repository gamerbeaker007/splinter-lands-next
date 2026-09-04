"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { TodayLogs } from "@/types/landManager";
import { Stack } from "@mui/material";
import DonationSummary from "./DonationSummary";
import LaborsLuckRow from "./LaborsLuckRow";
import TodaySection from "./TodaySection";
import { Fragment } from "react";

type HarvestLog = NonNullable<TodayLogs["harvest"]>;

/** Resources harvested today, plus any Labor's Luck card the rolls produced. */
export default function HarvestSection({ log }: { log: HarvestLog }) {
  return (
    <TodaySection
      title="Harvest"
      runs={log.runs}
      txIds={[...log.harvest_transactions, ...log.donation_transactions]}
    >
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        {Object.entries(log.resources_json).map(([sym, amt]) => (
          <Fragment key={sym}>
            {renderResourceChip(sym as Resource, amt)}
          </Fragment>
        ))}
      </Stack>
      <LaborsLuckRow txIds={log.harvest_transactions} />
      <DonationSummary
        donations={log.donations_json}
        unpaidDonations={log.unpaid_donations_json}
        donationError={log.donation_error}
      />
    </TodaySection>
  );
}
