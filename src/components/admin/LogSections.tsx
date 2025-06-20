"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Divider,
} from "@mui/material";

export default function LogViewer() {
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((res) => {
        if (res.status === 401) {
          setUnauthorized(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json?.logs) setLogs(json.logs);
        setLoading(false);
      });
  }, []);

  const coloredLines = useMemo(() => {
    const lines = logs.split("\n");

    return lines
      .filter((line) => line.toLowerCase().includes(search.toLowerCase()))
      .map((line, index) => {
        const match = line.match(/\[(info|warn|error)\]/i);
        let color = "#ffffff";

        if (match) {
          const level = match[1].toLowerCase();

          if (level === "error")
            color = "#f44336"; // red
          else if (level === "warn")
            color = "#ff9800"; // orange
          else if (level === "info") color = "#90a4ae"; // gray-blue

          const colored = `<span style="color:${color}; font-weight:bold;">[${level}]</span>`;
          line = line.replace(/\[(info|warn|error)\]/i, colored);
        }

        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: line }}
            style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
          />
        );
      });
  }, [logs, search]);

  if (unauthorized) return <Alert severity="error">Unauthorized</Alert>;
  if (loading) return <CircularProgress />;

  return (
    <Paper sx={{ mt: 4, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Application Logs
      </Typography>

      <TextField
        fullWidth
        label="Search logs"
        variant="outlined"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{
          maxHeight: 500,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          backgroundColor: "#1e1e2f",
          color: "#ffffff",
          borderRadius: 1,
          p: 2,
          fontFamily: "monospace",
          fontSize: "0.875rem",
        }}
      >
        {coloredLines.length > 0 ? (
          coloredLines
        ) : (
          <Typography variant="body2">No matching logs.</Typography>
        )}
      </Box>
    </Paper>
  );
}
