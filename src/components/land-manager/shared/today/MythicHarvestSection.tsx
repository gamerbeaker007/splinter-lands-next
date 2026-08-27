"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import TotemFragmentImage from "@/components/ui/TotemFragmentImage";
import { Resource } from "@/constants/resource/resource";
import { TodayLogs } from "@/types/landManager";
import { capitalize, Stack, Typography } from "@mui/material";
import DonationSummary from "./DonationSummary";
import TodaySection from "./TodaySection";
import { useTodayTx } from "./TodayTxContext";

type MythicHarvestLog = NonNullable<TodayLogs["mythicHarvest"]>;

/** Tax collected from keeps and castles, and any totem fragment they dropped. */
export default function MythicHarvestSection({
  log,
}: {
  log: MythicHarvestLog;
}) {
  const { fragmentsByDeed } = useTodayTx();
  const fragments = fragmentsByDeed(log.transactions);

  return (
    <TodaySection
      title="Mythic Harvest"
      runs={log.runs}
      txIds={[...log.transactions, ...log.donation_transactions]}
    >
      <Stack gap={0.25}>
        {log.results_json.map((a, i) => {
          // The log's own fragment_found is written optimistically before the
          // outcome is known — the transaction decides.
          const fragmentType = fragments.get(a.deed_uid);
          return (
            <Stack key={i} direction={"column"} gap={1}>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {capitalize(a.kingdom_type.toLowerCase())}{" "}
                  {a.region_number != null
                    ? a.kingdom_type === "keep" && a.tract_number != null
                      ? `region(${a.region_number}) tract(${a.tract_number})`
                      : `region(${a.region_number})`
                    : a.deed_uid}
                  {" : "}
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    {a.tokens.length > 0
                      ? a.tokens.map((token) =>
                          renderResourceChip(
                            token.token as Resource,
                            token.received
                          )
                        )
                      : "no tokens"}
                  </Stack>
                </Typography>
              </Stack>
              {fragmentType && (
                <>
                  <Typography variant={"caption"}>Totem Fragment:</Typography>
                  <TotemFragmentImage fragmentType={fragmentType} size={40} />
                </>
              )}
            </Stack>
          );
        })}
      </Stack>
      <DonationSummary
        donations={log.donations_json}
        unpaidDonations={log.unpaid_donations_json}
        donationError={log.donation_error}
      />
    </TodaySection>
  );
}
