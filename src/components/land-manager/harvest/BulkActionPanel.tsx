"use client";

import ActionPlanDialog from "@/components/land-manager/harvest/ActionPlanDialog";
import HarvestAllRow from "@/components/land-manager/harvest/HarvestAllRow";
import HarvestMythicsRow from "@/components/land-manager/harvest/HarvestMythicsRow";
import MakeHarvestableRow from "@/components/land-manager/harvest/MakeHarvestableRow";
import ProcessResourcesRow from "@/components/land-manager/harvest/ProcessResourcesRow";
import TopUpPoolsRow from "@/components/land-manager/harvest/TopUpPoolsRow";
import {
  ActionPlan,
  DonationConfig,
  MakeHarvestableStrategy,
  PostHarvestStrategy,
  TopUpPoolStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Box, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

interface Props {
  username: string;
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  strategies: MakeHarvestableStrategy[];
  donation: DonationConfig;
  postHarvestStrategy: PostHarvestStrategy;
  postHarvestExcludedResources: string[];
  postHarvestSellPct: number;
  postHarvestPoolPct: number;
  topUpPoolStrategies: TopUpPoolStrategy[];
  hasMythics: boolean;
  onSuccess?: () => void;
}

export default function BulkActionPanel({
  username,
  regions,
  enabledRegions,
  strategies,
  donation,
  postHarvestStrategy,
  postHarvestExcludedResources,
  postHarvestSellPct,
  postHarvestPoolPct,
  topUpPoolStrategies,
  hasMythics,
  onSuccess,
}: Props) {
  const router = useRouter();
  // Every action is plan-then-confirm: a row builds its plan and hands it here
  // together with the executor, and only the dialog's Confirm broadcasts it.
  const [pending, setPending] = useState<{
    plan: ActionPlan;
    confirm: () => Promise<void>;
  } | null>(null);
  const [busyMap, setBusyMap] = useState({
    harvest: false,
    makeHarvestable: false,
    processResources: false,
    mythicHarvest: false,
    topUpPools: false,
  });

  // Memoised: this array is a dependency of the action hooks and of the Custom
  // Plan dialog's data-loading effect. A fresh array on every render would make
  // that effect re-run and reset the in-progress plan editor.
  const visibleRegions = useMemo(
    () => regions.filter((r) => enabledRegions.includes(r.region_number)),
    [regions, enabledRegions]
  );

  const afterSuccess = useCallback(() => {
    router.refresh();
    onSuccess?.();
  }, [router, onSuccess]);

  const onHarvestBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, harvest: b })),
    []
  );
  const onMakeHarvestableBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, makeHarvestable: b })),
    []
  );
  const onMythicHarvestBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, mythicHarvest: b })),
    []
  );
  const onProcessResourcesBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, processResources: b })),
    []
  );

  const onTopUpPoolsBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, topUpPools: b })),
    []
  );

  const anyBusy = useMemo(
    () => Object.values(busyMap).some(Boolean),
    [busyMap]
  );

  if (visibleRegions.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="column" gap={0.5} flexWrap="wrap" alignItems="left">
        <HarvestAllRow
          username={username}
          visibleRegions={visibleRegions}
          donation={donation}
          anyBusy={anyBusy}
          onBusyChange={onHarvestBusy}
          onPlan={(plan, confirm) => setPending({ plan, confirm })}
          onSuccess={afterSuccess}
        />

        <MakeHarvestableRow
          username={username}
          visibleRegions={visibleRegions}
          strategies={strategies}
          anyBusy={anyBusy}
          onBusyChange={onMakeHarvestableBusy}
          onPlan={(plan, confirm) => setPending({ plan, confirm })}
          onSuccess={afterSuccess}
        />

        <HarvestMythicsRow
          username={username}
          visibleRegions={visibleRegions}
          donation={donation}
          hasMythics={hasMythics}
          anyBusy={anyBusy}
          onBusyChange={onMythicHarvestBusy}
          onPlan={(plan, confirm) => setPending({ plan, confirm })}
          onSuccess={afterSuccess}
        />

        <ProcessResourcesRow
          username={username}
          visibleRegions={visibleRegions}
          postHarvestStrategy={postHarvestStrategy}
          postHarvestExcludedResources={postHarvestExcludedResources}
          sellPct={postHarvestSellPct}
          poolPct={postHarvestPoolPct}
          anyBusy={anyBusy}
          onBusyChange={onProcessResourcesBusy}
          onPlan={(plan, confirm) => setPending({ plan, confirm })}
          onSuccess={afterSuccess}
        />

        {/* Closes the rolling-buffer loop: Make Harvestable draws matured
            liquidity out, Top Up Pools puts next week's worth back in. */}
        <TopUpPoolsRow
          username={username}
          visibleRegions={visibleRegions}
          strategies={topUpPoolStrategies}
          anyBusy={anyBusy}
          onBusyChange={onTopUpPoolsBusy}
          onPlan={(plan, confirm) => setPending({ plan, confirm })}
          onSuccess={afterSuccess}
        />
      </Stack>

      {pending && (
        <ActionPlanDialog
          plan={pending.plan}
          busy={anyBusy}
          onConfirm={async () => {
            await pending.confirm();
            // The row's own alerts report the outcome, so close either way.
            setPending(null);
          }}
          onClose={() => setPending(null)}
        />
      )}
    </Box>
  );
}
