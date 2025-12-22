"use client";

import { getCacheStatus } from "@/lib/backend/actions/cache-actions";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function CacheStatusDot() {
  const [status, setStatus] = useState<Status>("idle");
  const [info, setInfo] = useState<{
    lastUpdate: string;
    uniquePlayers: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      setStatus("loading");
      try {
        const data = await getCacheStatus();
        setInfo({
          lastUpdate: data.lastUpdate.toString(),
          uniquePlayers: data.uniquePlayers,
        });
        setStatus("success");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    })();
  }, []);

  const colorMap: Record<Status, string> = {
    idle: "grey.400",
    loading: "warning.main",
    success: "success.main",
    error: "error.main",
  };

  const dot = (
    <Box
      sx={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        bgcolor: colorMap[status],
      }}
    />
  );

  const loadingDot = (
    <CircularProgress size={12} thickness={5} sx={{ color: "warning.main" }} />
  );

  const tooltipContent = (
    <Box p={1}>
      <Typography variant="caption" display="block" fontWeight="bold">
        Data cached:
      </Typography>
      <Typography variant="caption">
        {info?.lastUpdate
          ? new Date(info.lastUpdate).toLocaleDateString()
          : "N/A"}
      </Typography>
      <Typography variant="caption" fontWeight="bold" display="block" mt={1}>
        Unique Players:
      </Typography>
      <Typography variant="caption">{info?.uniquePlayers ?? 0}</Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="bottom">
      <Box display="inline-block" sx={{ cursor: "pointer" }}>
        {status === "loading" ? loadingDot : dot}
      </Box>
    </Tooltip>
  );
}
