"use client";

import { getLogsAction } from "@/lib/backend/admin/adminActions";
import {
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState, useTransition } from "react";

type LogRow = {
  id: string;
  level: string;
  message: string;
  meta: unknown;
  created_at: string;
};

type LogData = {
  logs: LogRow[];
  total: number;
  pages: number;
};

type Level = "info" | "warn" | "error" | "";

function levelColor(level: string): "default" | "info" | "warning" | "error" {
  if (level === "error") return "error";
  if (level === "warn") return "warning";
  if (level === "info") return "info";
  return "default";
}

export default function LogViewerClient({
  initialData,
}: {
  initialData: LogData;
}) {
  const [data, setData] = useState<LogData>(initialData);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<Level>("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(
    (newPage: number, newLevel: Level, newSearch: string) => {
      startTransition(async () => {
        const result = await getLogsAction(
          newPage,
          newLevel || undefined,
          100,
          newSearch || undefined
        );
        setData(result);
        setPage(newPage);
      });
    },
    []
  );

  function onSearch() {
    load(1, level, search);
  }

  function onLevelChange(newLevel: Level) {
    setLevel(newLevel);
    load(1, newLevel, search);
  }

  return (
    <Paper sx={{ mt: 4, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Application Logs
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
        <TextField
          label="Search"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          sx={{ flex: 1 }}
        />
        <Select<Level>
          size="small"
          value={level}
          onChange={(e) => onLevelChange(e.target.value as Level)}
          displayEmpty
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All levels</MenuItem>
          <MenuItem value="info">Info</MenuItem>
          <MenuItem value="warn">Warn</MenuItem>
          <MenuItem value="error">Error</MenuItem>
        </Select>
        <Button variant="outlined" onClick={onSearch} disabled={isPending}>
          Search
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {data.total} result{data.total !== 1 ? "s" : ""}
        {data.pages > 1 ? ` — page ${page} of ${data.pages}` : ""}
      </Typography>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ maxHeight: 520, overflowY: "auto" }}>
        {data.logs.length === 0 ? (
          <Typography variant="body2" sx={{ p: 1 }}>
            No logs found.
          </Typography>
        ) : (
          data.logs.map((row) => (
            <Box
              key={row.id}
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
                py: 0.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                fontFamily: "monospace",
                fontSize: "0.8rem",
              }}
            >
              <Chip
                label={row.level}
                color={levelColor(row.level)}
                size="small"
                sx={{ mt: 0.3, minWidth: 52 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 1 }}
                >
                  {new Date(row.created_at).toLocaleString()}
                </Typography>
                <Typography component="span" variant="body2">
                  {row.message}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {data.pages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" mt={1}>
          <Button
            size="small"
            disabled={page <= 1 || isPending}
            onClick={() => load(page - 1, level, search)}
          >
            Prev
          </Button>
          <Button
            size="small"
            disabled={page >= data.pages || isPending}
            onClick={() => load(page + 1, level, search)}
          >
            Next
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
