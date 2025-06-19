"use client";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Typography } from "@mui/material";
import { useEffect } from "react";

export default function ResourcePage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Resource Overview");
  }, [setTitle]);

  return <Typography variant="h5">Resource Page</Typography>;
}
