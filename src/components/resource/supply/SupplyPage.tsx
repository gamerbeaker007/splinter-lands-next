"use client";

import { ResourceIconToggleGroup } from "@/components/resource/ResourceIconToggleGroup";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  getAllResourceSupply,
  getLatestResourceSupply,
} from "@/lib/backend/actions/resources/supply-actions";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { DailyProduceConsumeOverview } from "./daily/DailyProductionConsumeOverview";
import { ProduceConsumeHistoricalOverview } from "./historical/ProduceConsumeHistoricalOverview";

export function SupplyPage() {
  const {
    data: latest,
    loading: latestLoading,
    error: latestError,
  } = useAsyncData("latest-resource-supply", () => getLatestResourceSupply(), {
    errorMessage: "Failed to load latest resource supply",
  });
  const {
    data: historical,
    loading: historicalLoading,
    error: historicalError,
  } = useAsyncData("resource-supply", () => getAllResourceSupply(), {
    errorMessage: "Failed to load historical resource supply",
  });
  const [excluded, setExcluded] = useState<string[]>([]);
  const resources = Array.from(
    new Set([
      ...Object.keys(latest?.resource ?? {}),
      ...(historical ?? []).flatMap((entry) => Object.keys(entry.resource)),
    ])
  );
  const selected = resources.filter((resource) => !excluded.includes(resource));
  const selectedSet = new Set(selected);
  const filteredLatest = latest && filterResourceSupply(latest, selectedSet);
  const filteredHistory = historical?.map((entry) =>
    filterResourceSupply(entry, selectedSet)
  );

  return (
    <Box mt={2} mb={4}>
      {resources.length > 0 && (
        <Stack alignItems="center" spacing={1} mb={3}>
          <Typography variant="h6">Resources</Typography>
          <Box display="flex" justifyContent="center" width="100%">
            <ResourceIconToggleGroup
              label="Supply resources"
              options={resources.map((resource) => ({
                value: resource,
                resource,
                label: resource,
              }))}
              value={selected}
              onChange={(values) =>
                setExcluded(
                  resources.filter((resource) => !values.includes(resource))
                )
              }
            />
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {selected.length} of {resources.length} selected
            </Typography>
            <Button size="small" onClick={() => setExcluded([])}>
              Select all
            </Button>
            <Button size="small" onClick={() => setExcluded(resources)}>
              Clear
            </Button>
          </Stack>
        </Stack>
      )}
      {latestError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Latest supply: {latestError}
        </Alert>
      )}
      {historicalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Historical supply: {historicalError}
        </Alert>
      )}
      {resources.length === 0 && (latestLoading || historicalLoading) && (
        <Typography color="text.secondary">Loading resources...</Typography>
      )}
      {resources.length === 0 &&
        !latestLoading &&
        !historicalLoading &&
        !latestError &&
        !historicalError && (
          <Typography color="text.secondary">
            No resource supply data available.
          </Typography>
        )}
      {resources.length > 0 && selected.length === 0 && (
        <Typography color="text.secondary">
          Select resources to view supply cards and charts.
        </Typography>
      )}
      {selected.length > 0 && (
        <>
          <DailyProduceConsumeOverview data={filteredLatest} />
          <ProduceConsumeHistoricalOverview data={filteredHistory} />
        </>
      )}
    </Box>
  );
}

export function filterResourceSupply(
  overview: ResourceSupplyOverview,
  selected: ReadonlySet<string>
): ResourceSupplyOverview {
  return {
    ...overview,
    resource: Object.fromEntries(
      Object.entries(overview.resource).filter(([resource]) =>
        selected.has(resource)
      )
    ),
  };
}
