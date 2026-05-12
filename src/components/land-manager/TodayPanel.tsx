"use client";

import { getTodayLogs } from "@/lib/backend/actions/land-manager/log-actions";
import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  ActionSummary,
  MythicHarvestResult,
  PostHarvestActionSummary,
} from "@/types/landManager";
import { CheckCircle, Cancel, RadioButtonUnchecked } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

type TodayLogsResult = Awaited<ReturnType<typeof getTodayLogs>>;

export default function TodayPanel({
  refreshKey = 0,
}: {
  refreshKey?: number;
}) {
  const [data, setData] = useState<TodayLogsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifiedTxIds, setVerifiedTxIds] = useState<Set<string>>(new Set());
  const [failedTxIds, setFailedTxIds] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    let cancelled = false;
    getTodayLogs().then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!data) return;
    const allTxIds = [
      ...(data.harvest?.transactions ?? []),
      ...(data.makeHarvestable?.transactions ?? []),
      ...(data.postHarvest?.transactions ?? []),
      ...(data.mythicHarvest?.transactions ?? []),
    ];
    const unique = [...new Set(allTxIds)];
    if (unique.length === 0) return;

    let cancelled = false;
    const verified = new Set<string>();
    const failed = new Map<string, string>();

    async function poll(ids: string[]) {
      await Promise.all(
        ids.map(async (txId) => {
          const outcome = await lookupTransaction(txId);
          if (outcome.status === "success") verified.add(txId);
          else if (outcome.status === "failed") failed.set(txId, outcome.error);
        })
      );
      if (cancelled) return;
      setVerifiedTxIds(new Set(verified));
      setFailedTxIds(new Map(failed));

      const remaining = ids.filter(
        (id) => !verified.has(id) && !failed.has(id)
      );
      if (remaining.length === 0) return;
      await new Promise((r) => setTimeout(r, 5000));
      if (cancelled) return;
      await Promise.all(
        remaining.map(async (txId) => {
          const outcome = await lookupTransaction(txId);
          if (outcome.status === "success") verified.add(txId);
          else if (outcome.status === "failed") failed.set(txId, outcome.error);
        })
      );
      if (!cancelled) {
        setVerifiedTxIds(new Set(verified));
        setFailedTxIds(new Map(failed));
      }
    }

    poll(unique);
    return () => {
      cancelled = true;
    };
  }, [data]);

  const txList = (txIds: string[]) => {
    if (txIds.length === 0) return null;
    return (
      <Stack gap={0.25} mt={0.5}>
        {txIds.map((txId) => (
          <Stack key={txId} direction="row" alignItems="center" gap={0.5}>
            {failedTxIds.has(txId) ? (
              <Cancel sx={{ fontSize: 11, color: "error.main" }} />
            ) : verifiedTxIds.has(txId) ? (
              <CheckCircle sx={{ fontSize: 11, color: "success.main" }} />
            ) : (
              <RadioButtonUnchecked
                sx={{ fontSize: 11, color: "text.disabled" }}
              />
            )}
            <Typography
              variant="caption"
              color={failedTxIds.has(txId) ? "error.main" : "text.disabled"}
              sx={{ fontFamily: "monospace", fontSize: "0.65rem" }}
            >
              {txId}
              {failedTxIds.has(txId) && (
                <Typography
                  component="span"
                  variant="caption"
                  color="error.main"
                  sx={{ fontFamily: "inherit", ml: 0.5 }}
                >
                  — {failedTxIds.get(txId)}
                </Typography>
              )}
            </Typography>
          </Stack>
        ))}
      </Stack>
    );
  };

  const allVerified = (txIds: string[]) =>
    txIds.length > 0 && txIds.every((id) => verifiedTxIds.has(id));

  const anyFailed = (txIds: string[]) =>
    txIds.some((id) => failedTxIds.has(id));

  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={100} />
      </Box>
    );
  }

  const hasActivity =
    data?.harvest !== null ||
    data?.makeHarvestable !== null ||
    data?.postHarvest !== null ||
    data?.mythicHarvest !== null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Today
        </Typography>

        {!hasActivity ? (
          <Typography variant="body2" color="text.disabled">
            No activity today
          </Typography>
        ) : (
          <Stack gap={1.5}>
            {data?.harvest && (
              <Box>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Harvest · {data.harvest.runs} run
                    {data.harvest.runs !== 1 ? "s" : ""}
                  </Typography>
                  {anyFailed(data.harvest.transactions) && (
                    <Cancel sx={{ fontSize: 12, color: "error.main" }} />
                  )}
                  {allVerified(data.harvest.transactions) && (
                    <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                  )}
                </Stack>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {Object.entries(
                    data.harvest.resources_json as Record<string, number>
                  ).map(([sym, amt]) => (
                    <Chip
                      key={sym}
                      label={`${sym}: ${amt.toFixed(0)}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  ))}
                </Stack>
                {Object.keys(data.harvest.fees_json as Record<string, number>)
                  .length > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={0.5}
                  >
                    Fees:{" "}
                    {Object.entries(
                      data.harvest.fees_json as Record<string, number>
                    )
                      .map(([sym, amt]) => `${sym} ${amt.toFixed(3)}`)
                      .join(", ")}
                  </Typography>
                )}
                {txList(data.harvest.transactions)}
              </Box>
            )}

            {data?.makeHarvestable && (
              <Box>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Make Harvestable · {data.makeHarvestable.runs} run
                    {data.makeHarvestable.runs !== 1 ? "s" : ""}
                  </Typography>
                  {anyFailed(data.makeHarvestable.transactions) && (
                    <Cancel sx={{ fontSize: 12, color: "error.main" }} />
                  )}
                  {allVerified(data.makeHarvestable.transactions) && (
                    <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                  )}
                </Stack>
                <Stack gap={0.25}>
                  {(data.makeHarvestable.actions_json as ActionSummary[]).map(
                    (a, i) => (
                      <Typography
                        key={i}
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {a.type} {a.from_symbol}
                        {a.from_symbol !== a.to_symbol ? `→${a.to_symbol}` : ""}
                        : {a.from_region} → {a.to_region}{" "}
                        {a.in_amount.toFixed(0)} → {a.out_amount.toFixed(0)}
                      </Typography>
                    )
                  )}
                </Stack>
                {txList(data.makeHarvestable.transactions)}
              </Box>
            )}

            {data?.postHarvest && (
              <Box>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Process Resources · {data.postHarvest.runs} run
                    {data.postHarvest.runs !== 1 ? "s" : ""}
                  </Typography>
                  {anyFailed(data.postHarvest.transactions) && (
                    <Cancel sx={{ fontSize: 12, color: "error.main" }} />
                  )}
                  {allVerified(data.postHarvest.transactions) && (
                    <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                  )}
                </Stack>
                <Stack gap={0.25}>
                  {(
                    data.postHarvest.actions_json as PostHarvestActionSummary[]
                  ).map((a, i) => (
                    <Typography
                      key={i}
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {a.type === "sell_for_dec" ? "Sold" : "Added"}{" "}
                      {a.resource_in.toFixed(0)} {a.symbol} →{" "}
                      {a.dec_amount.toFixed(3)} DEC
                    </Typography>
                  ))}
                </Stack>
                {txList(data.postHarvest.transactions)}
              </Box>
            )}

            {data?.mythicHarvest && (
              <Box>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Mythic Harvest · {data.mythicHarvest.runs} run
                    {data.mythicHarvest.runs !== 1 ? "s" : ""}
                  </Typography>
                  {anyFailed(data.mythicHarvest.transactions) && (
                    <Cancel sx={{ fontSize: 12, color: "error.main" }} />
                  )}
                  {allVerified(data.mythicHarvest.transactions) && (
                    <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                  )}
                </Stack>
                <Stack gap={0.25}>
                  {(
                    data.mythicHarvest.results_json as MythicHarvestResult[]
                  ).map((a, i) => (
                    <Typography
                      key={i}
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {a.kingdom_type} {a.deed_uid}:{" "}
                      {a.tokens
                        .map((t) => `${t.token} ${t.received}`)
                        .join(", ") || "no tokens"}
                      {a.fragment_found && " · Fragment found!"}
                    </Typography>
                  ))}
                </Stack>
                {txList(data.mythicHarvest.transactions)}
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
