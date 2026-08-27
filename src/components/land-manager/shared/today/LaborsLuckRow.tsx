"use client";

import CardUidImage from "@/components/ui/CardUidImage";
import { labors_luck_icon_url } from "@/lib/shared/statics_icon_urls";
import { Box, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useTodayTx } from "./TodayTxContext";

/**
 * Cards won by Labor's Luck during the given transactions. Renders nothing when
 * the harvest dropped none, or while the transactions are still pending.
 */
export default function LaborsLuckRow({ txIds }: { txIds: string[] }) {
  const { laborsLuckFrom, cardDetails } = useTodayTx();
  const treasures = laborsLuckFrom(txIds);
  if (treasures.length === 0) return null;

  return (
    <Stack direction="row" alignItems="center" gap={0.75} mt={0.75}>
      <Box width={16} height={16} position="relative" flexShrink={0}>
        <Image
          src={labors_luck_icon_url}
          alt="Labor's Luck"
          fill
          sizes="16px"
          style={{ objectFit: "contain" }}
        />
      </Box>
      <Typography variant="caption" color="success.main">
        Labor&apos;s Luck ×{treasures.length}
      </Typography>
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        {treasures.map((t) => (
          <CardUidImage key={t.uid} uid={t.uid} cardDetails={cardDetails} />
        ))}
      </Stack>
    </Stack>
  );
}
