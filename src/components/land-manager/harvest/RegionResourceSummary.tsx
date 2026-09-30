"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import {
  getBulkRegionData,
  getDecBalance,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { saveLandManagerConfig } from "@/lib/backend/actions/land-manager/config-actions";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { formatCompactNumber } from "@/lib/formatters";
import { PRODUCING_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grow,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  refreshKey?: number;
}

// SPS is produced but never held as a regional balance, so it has nothing to
// sum here. DEC is the opposite: a single wallet-level number with no regional
// breakdown at all.
const SUMMARY_RESOURCES = PRODUCING_RESOURCES.filter((sym) => sym !== "SPS");
const DEC_SYMBOL = "DEC";

/** Slow enough that the Save / Reset buttons visibly ease in. */
const DIRTY_ANIMATION_MS = 600;

const sortedKey = (regions: number[]) =>
  [...regions].sort((a, b) => a - b).join(",");

interface RegionAmount {
  name: string;
  regionNumber: number;
  amount: number;
}

export default function RegionResourceSummary({
  regions,
  enabledRegions,
  refreshKey = 0,
}: Props) {
  const { auth, config, setConfig, triggerRefresh } = useLandManagerContext();
  const router = useRouter();
  const username = auth.username ?? "";

  const enabledKey = sortedKey(enabledRegions);

  // Local, unsaved region selection; null while it matches the saved config.
  const [draft, setDraft] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selection = draft ?? enabledRegions;
  const selected = new Set(selection);
  const dirty = draft !== null && sortedKey(draft) !== enabledKey;

  const [balances, setBalances] = useState<
    Record<string, Record<string, number>>
  >({});
  const [dec, setDec] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const visible = regions.filter((r) =>
      enabledRegions.includes(r.region_number)
    );

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [bulk, decBalance] = await Promise.all([
          visible.length > 0
            ? getBulkRegionData(visible.map((r) => r.region_uid))
            : Promise.resolve({ balances: {} }),
          username ? getDecBalance(username) : Promise.resolve(0),
        ]);
        if (cancelled) return;
        setBalances(bulk.balances ?? {});
        setDec(decBalance);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKey, refreshKey, username]);

  const visibleRegions = regions.filter((r) =>
    enabledRegions.includes(r.region_number)
  );

  const breakdownFor = (symbol: string): RegionAmount[] =>
    visibleRegions.map((region) => ({
      name: region.name,
      regionNumber: region.region_number,
      amount: balances[region.region_uid]?.[symbol] ?? 0,
    }));

  const totalFor = (symbol: string) =>
    breakdownFor(symbol).reduce((sum, r) => sum + r.amount, 0);

  const sortedRegions = [...regions].sort(
    (a, b) => a.region_number - b.region_number
  );

  const selectedCount = regions.filter((r) =>
    selected.has(r.region_number)
  ).length;
  const allSelected = regions.length > 0 && selectedCount === regions.length;

  const toggleRegion = (regionNumber: number) =>
    setDraft((prev) => {
      const current = prev ?? enabledRegions;
      return current.includes(regionNumber)
        ? current.filter((n) => n !== regionNumber)
        : [...current, regionNumber];
    });

  // Same behaviour as the config dialog: all selected → deselect all,
  // otherwise (none or some) → select all.
  const toggleAll = () =>
    setDraft(allSelected ? [] : regions.map((r) => r.region_number));

  const reset = () => {
    setDraft(null);
    setSaveError(null);
  };

  const save = async () => {
    if (draft === null) return;
    setSaving(true);
    setSaveError(null);
    const result = await saveLandManagerConfig(draft);
    setSaving(false);
    if (!result.success) {
      setSaveError(result.error ?? "Save failed");
      return;
    }
    setConfig({ ...config, enabled_regions: draft });
    setDraft(null);
    triggerRefresh();
    // Refresh server components so derived panels re-fetch with the new
    // enabled regions — same as saving from the config dialog.
    router.refresh();
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        mb={1}
      >
        <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
          <Typography variant="h6" fontWeight="bold">
            Regions
          </Typography>
          {regions.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onChange={toggleAll}
                  disabled={saving}
                />
              }
              label={
                <Typography variant="body2" fontWeight="bold">
                  {allSelected ? "Deselect all" : "Select all"}
                  <Typography
                    variant="caption"
                    component="span"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {selectedCount} of {regions.length} selected
                  </Typography>
                </Typography>
              }
              sx={{ m: 0 }}
            />
          )}
        </Stack>
      </Stack>

      {saveError && (
        <Alert
          severity="error"
          sx={{ mb: 1 }}
          onClose={() => setSaveError(null)}
        >
          {saveError}
        </Alert>
      )}

      <Stack direction="row" gap={0.75} flexWrap="wrap" mb={2}>
        {sortedRegions.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No regions found for this account.
          </Typography>
        ) : (
          sortedRegions.map((region) => {
            const enabled = selected.has(region.region_number);
            return (
              <Tooltip
                key={region.region_uid}
                title={
                  <>
                    Region #{region.region_number} -{" "}
                    <strong>{enabled ? "enabled" : "disabled"}</strong>,
                    {enabled ? " click to disable" : " click to enable"}
                  </>
                }
                placement="top"
                followCursor
              >
                <Chip
                  size="small"
                  label={region.name}
                  clickable={!saving}
                  onClick={
                    saving
                      ? undefined
                      : () => toggleRegion(region.region_number)
                  }
                  color={enabled ? "primary" : "default"}
                  variant={enabled ? "filled" : "outlined"}
                  sx={{
                    fontWeight: enabled ? 700 : 400,
                    opacity: enabled ? 1 : 0.55,
                    borderStyle: enabled ? "solid" : "dashed",
                    color: enabled ? undefined : "text.secondary",
                  }}
                />
              </Tooltip>
            );
          })
        )}
      </Stack>

      <Grow
        in={dirty}
        timeout={DIRTY_ANIMATION_MS}
        style={{ transformOrigin: "left top" }}
        unmountOnExit
      >
        <Stack direction="row" gap={1} mb={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={reset}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={12} color="inherit" /> : null
            }
          >
            Save
          </Button>
        </Stack>
      </Grow>

      <Stack direction="row" gap={1} flexWrap="wrap">
        {loading ? (
          <Stack direction="row" alignItems="center" gap={1} sx={{ py: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Loading balances…
            </Typography>
          </Stack>
        ) : (
          <>
            {SUMMARY_RESOURCES.map((symbol) => (
              <ResourceSummaryCard
                key={symbol}
                symbol={symbol}
                total={totalFor(symbol)}
                breakdown={breakdownFor(symbol)}
              />
            ))}
            <ResourceSummaryCard symbol={DEC_SYMBOL} total={dec ?? 0} />
          </>
        )}
      </Stack>
    </Paper>
  );
}

interface CardProps {
  symbol: string;
  total: number;
  breakdown?: RegionAmount[];
}

function ResourceSummaryCard({ symbol, total, breakdown }: CardProps) {
  const card = (
    <Paper
      variant="outlined"
      sx={{
        px: 1.25,
        py: 0.75,
        minWidth: 110,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Image
        src={RESOURCE_ICON_MAP[symbol]}
        alt={symbol}
        width={20}
        height={20}
      />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {symbol}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {formatCompactNumber(total)}
        </Typography>
      </Box>
    </Paper>
  );

  if (!breakdown || breakdown.length === 0) return card;

  return (
    <Tooltip
      placement="top"
      title={
        <Stack spacing={0.5} sx={{ py: 0.5 }}>
          <Typography variant="caption" fontWeight={700}>
            {symbol} per region
          </Typography>
          {breakdown.map((r) => (
            <Stack
              key={r.regionNumber}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
              <Typography variant="caption">{r.name}</Typography>
              {renderResourceChip(symbol as Resource, r.amount)}
            </Stack>
          ))}
        </Stack>
      }
    >
      {card}
    </Tooltip>
  );
}
