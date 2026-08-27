"use client";

import { TodayLogs } from "@/types/landManager";
import { SplTrxResult } from "@/types/spl/trx";
import { SplCardDetails } from "@/types/splCardDetails";
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import BuyWorkersSection from "./today/BuyWorkersSection";
import DecStakeSection from "./today/DecStakeSection";
import HarvestSection from "./today/HarvestSection";
import MakeHarvestableSection from "./today/MakeHarvestableSection";
import MythicHarvestSection from "./today/MythicHarvestSection";
import PostHarvestSection from "./today/PostHarvestSection";
import RentWorkersSection from "./today/RentWorkersSection";
import StakedWorkersSection from "./today/StakedWorkersSection";
import { TodayTxProvider } from "./today/TodayTxContext";

export interface TodayPanelViewProps {
  /** Day logs for the authenticated player, or null while unauthenticated. */
  data: TodayLogs | null;
  loading?: boolean;
  /** Tx ids confirmed on-chain. */
  verifiedTxIds?: Set<string>;
  /** Tx ids rejected on-chain, mapped to the engine's error. */
  failedTxIds?: Map<string, string>;
  /**
   * Parsed payloads of the confirmed transactions, keyed by tx id. This — not
   * the day log — is the source of truth for what the engine actually awarded
   * (totem fragments, Labor's Luck cards).
   */
  txResults?: Map<string, SplTrxResult>;
  /** Needed to turn a Labor's Luck card uid into artwork. */
  cardDetails?: SplCardDetails[] | null;
}

/**
 * Presentation for the Today panel. Pure props in, no data fetching — the
 * container (TodayPanel) owns loading and transaction polling.
 *
 * Each flow renders as its own section component under `./today`; this file
 * only decides which of them the day's logs call for.
 */
export default function TodayPanelView({
  data,
  loading = false,
  verifiedTxIds = new Set(),
  failedTxIds = new Map(),
  txResults = new Map(),
  cardDetails = null,
}: TodayPanelViewProps) {
  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={100} />
      </Box>
    );
  }

  const hasActivity =
    data?.harvest != null ||
    data?.makeHarvestable != null ||
    data?.postHarvest != null ||
    data?.mythicHarvest != null ||
    data?.worker != null ||
    data?.stakeDec != null ||
    data?.unstakeDec != null;

  return (
    <TodayTxProvider
      value={{ verifiedTxIds, failedTxIds, txResults, cardDetails }}
    >
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Typography
            variant="body1"
            fontWeight={600}
            fontSize={"1.2rem"}
            gutterBottom
          >
            Today
          </Typography>

          {!hasActivity ? (
            <Typography variant="body2" color="text.disabled">
              No activity today
            </Typography>
          ) : (
            <Stack gap={1.5}>
              {data?.harvest && <HarvestSection log={data.harvest} />}
              {data?.makeHarvestable && (
                <MakeHarvestableSection log={data.makeHarvestable} />
              )}
              {data?.postHarvest && (
                <PostHarvestSection log={data.postHarvest} />
              )}
              {data?.mythicHarvest && (
                <MythicHarvestSection log={data.mythicHarvest} />
              )}
              {data?.worker && data.worker.rented_count > 0 && (
                <RentWorkersSection log={data.worker} />
              )}
              {data?.worker && data.worker.bought_count > 0 && (
                <BuyWorkersSection log={data.worker} />
              )}
              {data?.worker && data.worker.staked_count > 0 && (
                <StakedWorkersSection log={data.worker} />
              )}
              {data?.stakeDec && (
                <DecStakeSection log={data.stakeDec} direction="stake" />
              )}
              {data?.unstakeDec && (
                <DecStakeSection log={data.unstakeDec} direction="unstake" />
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </TodayTxProvider>
  );
}
