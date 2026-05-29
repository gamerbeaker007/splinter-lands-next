"use client";

import { getTodayLogs } from "@/lib/backend/actions/land-manager/log-actions";
import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  ActionSummary,
  MythicHarvestResult,
  PostHarvestActionSummary,
} from "@/types/landManager";
import { Cancel, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

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
  // Persist across refreshes — once a tx is settled it never needs re-lookup
  const persistentVerified = useRef<Set<string>>(new Set());
  const persistentFailed = useRef<Map<string, string>>(new Map());

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
      ...(data.harvest?.harvest_transactions ?? []),
      ...(data.harvest?.donation_transactions ?? []),
      ...(data.makeHarvestable?.transactions ?? []),
      ...(data.postHarvest?.transactions ?? []),
      ...(data.mythicHarvest?.transactions ?? []),
      ...(data.mythicHarvest?.donation_transactions ?? []),
      ...(data.rental?.rent_transactions ?? []),
      ...(data.rental?.stake_transactions ?? []),
      ...(data.stakeDec?.transactions ?? []),
    ];
    const unique = [...new Set(allTxIds)];
    if (unique.length === 0) return;

    // Immediately reflect already-known outcomes without any API call
    setVerifiedTxIds(new Set(persistentVerified.current));
    setFailedTxIds(new Map(persistentFailed.current));

    const toPoll = unique.filter(
      (id) =>
        !persistentVerified.current.has(id) && !persistentFailed.current.has(id)
    );
    if (toPoll.length === 0) return;

    let cancelled = false;

    async function poll(ids: string[]) {
      await Promise.all(
        ids.map(async (txId) => {
          const outcome = await lookupTransaction(txId);
          if (outcome.status === "success")
            persistentVerified.current.add(txId);
          else if (outcome.status === "failed")
            persistentFailed.current.set(txId, outcome.error);
        })
      );
      if (cancelled) return;
      setVerifiedTxIds(new Set(persistentVerified.current));
      setFailedTxIds(new Map(persistentFailed.current));

      const remaining = ids.filter(
        (id) =>
          !persistentVerified.current.has(id) &&
          !persistentFailed.current.has(id)
      );
      if (remaining.length === 0) return;
      await new Promise((r) => setTimeout(r, 5000));
      if (cancelled) return;
      await Promise.all(
        remaining.map(async (txId) => {
          const outcome = await lookupTransaction(txId);
          if (outcome.status === "success")
            persistentVerified.current.add(txId);
          else if (outcome.status === "failed")
            persistentFailed.current.set(txId, outcome.error);
        })
      );
      if (!cancelled) {
        setVerifiedTxIds(new Set(persistentVerified.current));
        setFailedTxIds(new Map(persistentFailed.current));
      }
    }

    poll(toPoll);
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

  const donationSummary = (
    donations: Record<string, number>,
    unpaidDonations: Record<string, number>,
    donationError: string | null | undefined
  ) => (
    <>
      {Object.keys(donations).length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={0.5}
        >
          Donations paid:{" "}
          {Object.entries(donations)
            .map(([sym, amt]) => `${sym} ${amt.toFixed(3)}`)
            .join(", ")}
        </Typography>
      )}
      {Object.keys(unpaidDonations).length > 0 && (
        <Typography
          variant="caption"
          color="error.main"
          display="block"
          mt={0.5}
        >
          Unpaid donations:{" "}
          {Object.entries(unpaidDonations)
            .map(([sym, amt]) => `${sym} ${amt.toFixed(3)}`)
            .join(", ")}
          {donationError ? ` — ${donationError}` : ""}
        </Typography>
      )}
    </>
  );

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
    data?.mythicHarvest !== null ||
    data?.rental !== null ||
    data?.stakeDec !== null;

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
                  {anyFailed([
                    ...data.harvest.harvest_transactions,
                    ...data.harvest.donation_transactions,
                  ]) && <Cancel sx={{ fontSize: 12, color: "error.main" }} />}
                  {allVerified([
                    ...data.harvest.harvest_transactions,
                    ...data.harvest.donation_transactions,
                  ]) && (
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
                {donationSummary(
                  data.harvest.donations_json as Record<string, number>,
                  data.harvest.unpaid_donations_json as Record<string, number>,
                  data.harvest.donation_error
                )}
                {txList([
                  ...data.harvest.harvest_transactions,
                  ...data.harvest.donation_transactions,
                ])}
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
                  {(() => {
                    const actions = data.postHarvest
                      .actions_json as PostHarvestActionSummary[];
                    // Aggregate by (type, symbol)
                    const sold: Record<
                      string,
                      { resource_in: number; dec_amount: number }
                    > = {};
                    const added: Record<
                      string,
                      { resource_in: number; dec_amount: number }
                    > = {};
                    for (const a of actions) {
                      const bucket = a.type === "sell_for_dec" ? sold : added;
                      if (!bucket[a.symbol])
                        bucket[a.symbol] = { resource_in: 0, dec_amount: 0 };
                      bucket[a.symbol].resource_in += a.resource_in;
                      bucket[a.symbol].dec_amount += a.dec_amount;
                    }
                    const rows: React.ReactNode[] = [];
                    for (const [sym, v] of Object.entries(sold)) {
                      rows.push(
                        <Typography
                          key={`sold-${sym}`}
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Sold: {v.resource_in.toFixed(0)} {sym} →{" "}
                          {v.dec_amount.toFixed(3)} DEC
                        </Typography>
                      );
                    }
                    for (const [sym, v] of Object.entries(added)) {
                      rows.push(
                        <Typography
                          key={`added-${sym}`}
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Added: {v.resource_in.toFixed(0)} {sym} |{" "}
                          {v.dec_amount.toFixed(3)} DEC
                        </Typography>
                      );
                    }
                    return rows;
                  })()}
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
                  {anyFailed([
                    ...data.mythicHarvest.transactions,
                    ...data.mythicHarvest.donation_transactions,
                  ]) && <Cancel sx={{ fontSize: 12, color: "error.main" }} />}
                  {allVerified([
                    ...data.mythicHarvest.transactions,
                    ...data.mythicHarvest.donation_transactions,
                  ]) && (
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
                      {a.kingdom_type}{" "}
                      {a.region_number != null
                        ? a.kingdom_type === "keep" && a.tract_number != null
                          ? `region(${a.region_number}) tract(${a.tract_number})`
                          : `region(${a.region_number})`
                        : a.deed_uid}
                      {" : "}
                      {a.tokens
                        .map((t) => `${t.token} ${t.received}`)
                        .join(", ") || "no tokens"}
                      {a.fragment_found && " · Fragment found!"}
                    </Typography>
                  ))}
                </Stack>
                {donationSummary(
                  data.mythicHarvest.donations_json as Record<string, number>,
                  data.mythicHarvest.unpaid_donations_json as Record<
                    string,
                    number
                  >,
                  data.mythicHarvest.donation_error
                )}
                {txList([
                  ...data.mythicHarvest.transactions,
                  ...data.mythicHarvest.donation_transactions,
                ])}
              </Box>
            )}

            {data?.rental && (
              <Box>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Rent Workers · {data.rental.runs} run
                    {data.rental.runs !== 1 ? "s" : ""}
                  </Typography>
                  {anyFailed([
                    ...data.rental.rent_transactions,
                    ...data.rental.stake_transactions,
                  ]) && <Cancel sx={{ fontSize: 12, color: "error.main" }} />}
                  {allVerified([
                    ...data.rental.rent_transactions,
                    ...data.rental.stake_transactions,
                  ]) && (
                    <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                  )}
                </Stack>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  <Chip
                    label={`Rented: ${data.rental.rented_count}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={`Staked: ${data.rental.staked_count}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={`${data.rental.total_dec.toFixed(3)} DEC`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                </Stack>
                {txList([
                  ...data.rental.rent_transactions,
                  ...data.rental.stake_transactions,
                ])}
              </Box>
            )}

            {data?.stakeDec && (
              <Box>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Stake DEC · {data.stakeDec.runs} run
                    {data.stakeDec.runs !== 1 ? "s" : ""}
                  </Typography>
                  {anyFailed(data.stakeDec.transactions) && (
                    <Cancel sx={{ fontSize: 12, color: "error.main" }} />
                  )}
                  {allVerified(data.stakeDec.transactions) && (
                    <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                  )}
                </Stack>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  <Chip
                    label={`Staked: ${data.stakeDec.total_succeeded.toFixed(0)} DEC`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                  {data.stakeDec.total_failed > 0 && (
                    <Chip
                      label={`Failed: ${data.stakeDec.total_failed.toFixed(0)} DEC`}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                </Stack>
                {Object.keys(
                  data.stakeDec.succeeded_json as Record<string, number>
                ).length > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={0.5}
                  >
                    Succeeded:{" "}
                    {Object.entries(
                      data.stakeDec.succeeded_json as Record<string, number>
                    )
                      .map(([uid, amt]) => `${uid} ${amt.toFixed(0)}`)
                      .join(", ")}
                  </Typography>
                )}
                {Object.keys(
                  data.stakeDec.failed_json as Record<string, number>
                ).length > 0 && (
                  <Typography
                    variant="caption"
                    color="error.main"
                    display="block"
                    mt={0.5}
                  >
                    Failed:{" "}
                    {Object.entries(
                      data.stakeDec.failed_json as Record<string, number>
                    )
                      .map(([uid, amt]) => `${uid} ${amt.toFixed(0)}`)
                      .join(", ")}
                    {data.stakeDec.error ? ` — ${data.stakeDec.error}` : ""}
                  </Typography>
                )}
                {txList(data.stakeDec.transactions)}
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
