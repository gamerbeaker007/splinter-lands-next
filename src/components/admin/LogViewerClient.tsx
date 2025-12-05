"use client";

import { Box, Divider, Paper, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";

export default function LogViewerClient({
  initialLogs,
}: {
  initialLogs: string;
}) {
  const [search, setSearch] = useState("");

  const coloredLines = useMemo(() => {
    const lines = initialLogs.split("\n");

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
  }, [initialLogs, search]);

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
