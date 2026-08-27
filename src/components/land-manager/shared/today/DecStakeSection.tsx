"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { TodayDecStakeLog } from "@/types/landManager";
import { Stack, Typography } from "@mui/material";
import LaborsLuckRow from "./LaborsLuckRow";
import StatChip from "./StatChip";
import TodaySection from "./TodaySection";

/** "R-58 25000, R-29 8000" — the per-region breakdown behind a total. */
function byRegion(amounts: Record<string, number>): React.ReactNode {
  return (
    <Stack gap={0.25}>
      {Object.entries(amounts).map(([uid, amt]) => (
        <Stack key={uid} direction="row" alignItems="center" gap={0.5}>
          <Typography variant="body1">{uid} - </Typography>
          {renderResourceChip("DEC", amt)}
        </Stack>
      ))}
    </Stack>
  );
}

const WORDING = {
  stake: { title: "Stake DEC", verb: "Staked" },
  unstake: { title: "Unstake DEC", verb: "Unstaked" },
} as const;

interface DecStakeSectionProps {
  log: TodayDecStakeLog;
  /** Staking and unstaking report the same shape; only the wording differs. */
  direction: keyof typeof WORDING;
}

/**
 * DEC moved into or out of region power today. Both directions trigger an
 * auto-harvest as a side effect, so either can surface a Labor's Luck card.
 */
export default function DecStakeSection({
  log,
  direction,
}: DecStakeSectionProps) {
  const { title, verb } = WORDING[direction];

  return (
    <TodaySection title={title} runs={log.runs} txIds={log.transactions}>
      <Stack direction="row" gap={0.5} flexWrap="wrap">
        <StatChip
          label={`${verb}: ${log.total_succeeded.toFixed(0)} DEC`}
          color="primary"
        />
        {log.total_failed > 0 && (
          <StatChip
            label={`Failed: ${log.total_failed.toFixed(0)} DEC`}
            color="error"
          />
        )}
      </Stack>
      {Object.keys(log.succeeded_json).length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={0.5}
        >
          {byRegion(log.succeeded_json)}
        </Typography>
      )}
      {Object.keys(log.failed_json).length > 0 && (
        <Typography
          variant="caption"
          color="error.main"
          display="block"
          mt={0.5}
        >
          Failed: {byRegion(log.failed_json)}
          {log.error ? ` — ${log.error}` : ""}
        </Typography>
      )}
      <LaborsLuckRow txIds={log.transactions} />
    </TodaySection>
  );
}
