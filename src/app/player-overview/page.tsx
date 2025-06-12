"use client";

import { usePageTitle } from "@/lib/context/PageTitleContext";
import { Typography } from "@mui/material";
import { useEffect } from "react";

export default function PlayerPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Player Overview");
  }, [setTitle]);

  return <Typography variant="h5">Player Page</Typography>;
}
