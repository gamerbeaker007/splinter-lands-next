"use client";

import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Typography } from "@mui/material";
import { useEffect } from "react";

export default function RegionOverviewPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Region Production Overview");
  }, [setTitle]);

  return <Typography variant="h5">Region Overview Page</Typography>;
}
