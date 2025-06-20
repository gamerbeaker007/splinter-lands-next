"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

type Data = {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
};

function formatMB(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

function SectionLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <Tooltip title={tooltip}>
        <IconButton size="small">
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default function MemorySection() {
  const [data, setData] = useState<Data | undefined>();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetch("/api/admin/memory")
      .then((res) => {
        if (res.status === 401) {
          setUnauthorized(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (unauthorized)
    return <Alert severity="error">Unauthorized. Please log in.</Alert>;

  if (loading || !data) return <CircularProgress />;

  const { heapUsed, heapTotal, rss, external } = data;

  const heapUsagePct = (heapUsed / heapTotal) * 100;
  const heapColor =
    heapUsagePct > 95 ? "error" : heapUsagePct > 80 ? "warning" : "success";

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Memory Usage
        </Typography>

        <Box mb={2}>
          <SectionLabel
            label="Heap Usage"
            tooltip="The amount of memory used for JavaScript objects vs. what is currently allocated. This can be near full without being problematic."
          />
          <Typography variant="body2">
            {formatMB(heapUsed)} / {formatMB(heapTotal)} (
            {heapUsagePct.toFixed(1)}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={heapUsagePct}
            color={heapColor}
          />
        </Box>

        <Box mb={2}>
          <SectionLabel
            label="Resident Set Size (RSS)"
            tooltip="Total memory allocated for the process, including heap, stack, and C++ bindings. Useful for monitoring container memory usage."
          />
          <Typography variant="body2">{formatMB(rss)}</Typography>
        </Box>

        <Box mb={2}>
          <SectionLabel
            label="External Memory"
            tooltip="Memory used by external objects like Buffers and C++ native extensions. Usually small but worth tracking."
          />
          <Typography variant="body2">{formatMB(external)}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
