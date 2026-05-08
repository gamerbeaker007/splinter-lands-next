"use client";

import {
  getWorkerRunStatus,
  triggerJobAction,
} from "@/lib/backend/admin/adminActions";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState, useTransition } from "react";

type WorkerRun = {
  id: string;
  job_type: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  duration_ms: number | null;
  error: string | null;
} | null;

type RunData = {
  daily: WorkerRun;
  weekly: WorkerRun;
};

type Props = { data: RunData };

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatDate(date: Date): string {
  // Use a fixed, locale/timezone-independent format to prevent SSR hydration
  // mismatch (server locale vs browser locale produce different strings).
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  );
}

function StatusChip({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Completed"
          color="success"
          size="small"
        />
      );
    case "failed":
      return (
        <Chip
          icon={<ErrorOutlineIcon />}
          label="Failed"
          color="error"
          size="small"
        />
      );
    case "running":
      return (
        <Chip
          icon={<HourglassEmptyIcon />}
          label="Running"
          color="warning"
          size="small"
        />
      );
    default:
      return (
        <Chip icon={<RemoveCircleOutlineIcon />} label="Unknown" size="small" />
      );
  }
}

function RunCard({
  label,
  jobType,
  run,
  onTrigger,
  triggering,
}: {
  label: string;
  jobType: "daily" | "weekly";
  run: WorkerRun;
  onTrigger: (jobType: "daily" | "weekly") => void;
  triggering: boolean;
}) {
  const isRunning = run?.status === "running";

  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 260 }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {label}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            disabled={triggering || isRunning}
            onClick={() => onTrigger(jobType)}
          >
            {isRunning ? "Running..." : "Run now"}
          </Button>
        </Stack>

        {run === null ? (
          <Typography variant="body2" color="text.secondary">
            No runs recorded yet
          </Typography>
        ) : (
          <Stack spacing={1}>
            <Box>
              <StatusChip status={run.status} />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Started
              </Typography>
              <Typography variant="body2">
                {formatDate(run.started_at)}
              </Typography>
            </Box>

            {run.finished_at && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Finished
                </Typography>
                <Typography variant="body2">
                  {formatDate(run.finished_at)}
                </Typography>
              </Box>
            )}

            {run.duration_ms !== null && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2">
                  {formatDuration(run.duration_ms)}
                </Typography>
              </Box>
            )}

            {run.status === "failed" && run.error && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Error
                </Typography>
                <Tooltip title={run.error}>
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{
                      maxWidth: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {run.error}
                  </Typography>
                </Tooltip>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default function WorkerStatusClient({ data: initialData }: Props) {
  const [data, setData] = useState<RunData>(initialData);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAnyRunning =
    data.daily?.status === "running" || data.weekly?.status === "running";

  // Poll every 5 seconds while a job is running
  useEffect(() => {
    if (!isAnyRunning) return;
    const id = setInterval(() => {
      startTransition(async () => {
        const fresh = await getWorkerRunStatus();
        setData(fresh);
      });
    }, 5000);
    return () => clearInterval(id);
  }, [isAnyRunning]);

  function handleTrigger(jobType: "daily" | "weekly") {
    setTriggerMessage(null);
    startTransition(async () => {
      const result = await triggerJobAction(jobType);
      if (result.started) {
        setTriggerMessage(`${jobType} job started`);
        const fresh = await getWorkerRunStatus();
        setData(fresh);
      } else {
        setTriggerMessage(result.reason ?? "Could not start job");
      }
    });
  }

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Worker Status (Last Run)
        </Typography>

        {triggerMessage && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mb={1}
          >
            {triggerMessage}
          </Typography>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <RunCard
            label="Daily Job (01:00 AM)"
            jobType="daily"
            run={data.daily}
            onTrigger={handleTrigger}
            triggering={isPending}
          />
          <RunCard
            label="Weekly Job (Sunday 02:00 AM)"
            jobType="weekly"
            run={data.weekly}
            onTrigger={handleTrigger}
            triggering={isPending}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
