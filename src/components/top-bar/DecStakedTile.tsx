"use client";

import {
  getLandDecStakeSummary,
  type LandDecStakeSummary,
} from "@/lib/backend/actions/region/summary-actions";
import { formatCompactNumber, formatNumber } from "@/lib/formatters";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

// Same constants the Region Overview summary uses for its DEC indicator.
const MAX_PLOTS = 150_000;
const DEC_PER_PLOT = 50_000;
const RUNI_DEC_REDUCTION = 50_000;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={2}>
      <Typography variant="caption">{label}</Typography>
      <Typography variant="caption" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}

/** Top bar chip: total DEC staked on land, with the breakdown on hover. */
export default function DecStakedTile() {
  const [summary, setSummary] = useState<LandDecStakeSummary | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setSummary(await getLandDecStakeSummary());
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const staked = summary?.totalDecStaked ?? 0;
  const needed = summary?.totalDecNeeded ?? 0;
  const delta = staked - needed;

  const details = summary ? (
    <Stack gap={0.25} sx={{ py: 0.5, minWidth: 200 }}>
      <Typography variant="subtitle2" fontWeight={700}>
        DEC staked on land
      </Typography>
      <DetailRow label="Total staked" value={formatNumber(staked)} />
      <DetailRow label="Total needed" value={formatNumber(needed)} />
      <DetailRow
        label="Total in use"
        value={formatNumber(summary.totalDecInUse)}
      />
      <DetailRow
        label="Saved (discount)"
        value={formatNumber(summary.totalDecSaved)}
      />
      <DetailRow
        label="Reduced by Runi"
        value={formatNumber(summary.runiCount * RUNI_DEC_REDUCTION)}
      />
      <DetailRow
        label="Max possible"
        value={formatNumber(MAX_PLOTS * DEC_PER_PLOT)}
      />
      <Typography
        variant="caption"
        fontWeight={600}
        color={delta >= 0 ? "success.light" : "error.light"}
        mt={0.5}
      >
        {delta >= 0
          ? `${formatNumber(delta)} DEC staked above the requirement`
          : `${formatNumber(Math.abs(delta))} DEC short of the requirement`}
      </Typography>
    </Stack>
  ) : (
    "Loading DEC staked on land…"
  );

  return (
    <Tooltip title={details} arrow>
      <Box
        sx={{
          minWidth: 65,
          height: 22,
          px: 1,
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: 1,
          cursor: "default",
          whiteSpace: "nowrap",
        }}
      >
        <Typography variant="caption">
          {summary
            ? `${formatCompactNumber(staked, { maximumFractionDigits: 2 })} DEC`
            : "… DEC"}
        </Typography>
      </Box>
    </Tooltip>
  );
}
