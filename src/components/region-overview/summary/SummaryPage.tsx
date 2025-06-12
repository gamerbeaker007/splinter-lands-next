"use client";

import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { useFilters } from "@/lib/context/FilterContext";
import { RegionSummary } from "@/types/regionSummary";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";

export default function SummaryPage() {
  const [summary, setSummary] = useState<RegionSummary | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    fetch("/api/deed/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then(setSummary)
      .catch(console.error);
  }, [filters]);

  return (
    <>
      {summary ? (
        <WorksiteTypeTile data={summary.worksites ?? {}} />
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          Loading worksite data...
        </Typography>
      )}
    </>
  );
}
