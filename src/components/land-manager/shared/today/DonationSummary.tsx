"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { Stack, Typography } from "@mui/material";

interface DonationSummaryProps {
  donations: Record<string, number>;
  unpaidDonations: Record<string, number>;
  donationError: string | null | undefined;
}

/** What was donated for a flow, and what was owed but never sent. */
export default function DonationSummary({
  donations,
  unpaidDonations,
  donationError,
}: DonationSummaryProps) {
  return (
    <>
      {Object.keys(donations).length > 0 && (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={0.5}
          >
            Donations made:{" "}
          </Typography>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {Object.entries(donations).map(([sym, amt]) =>
              renderResourceChip(sym as Resource, amt)
            )}
          </Stack>
        </>
      )}

      {Object.keys(unpaidDonations).length > 0 && (
        <Typography
          variant="caption"
          color="error.main"
          display="block"
          mt={0.5}
        >
          Donations not sent:{" "}
          {Object.entries(unpaidDonations)
            .map(([sym, amt]) => `${sym} ${amt.toFixed(3)}`)
            .join(", ")}
          {donationError ? ` — ${donationError}` : ""}
        </Typography>
      )}
    </>
  );
}
