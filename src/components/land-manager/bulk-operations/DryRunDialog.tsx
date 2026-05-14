"use client";

import { DryRunResult } from "@/types/landManager";
import { CheckCircleOutline, ContentCopy } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface Props {
  result: DryRunResult;
  onClose: () => void;
}

export default function DryRunDialog({ result, onClose }: Props) {
  const json = JSON.stringify(result.ops, null, 2);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{result.title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>
          Plan ({result.ops.length} operation
          {result.ops.length !== 1 ? "s" : ""})
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            fontFamily: "monospace",
            fontSize: "0.75rem",
            whiteSpace: "pre-wrap",
            bgcolor: "action.hover",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {result.log.join("\n") || "(nothing to do)"}
        </Paper>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={0.5}
        >
          <Typography variant="subtitle2">Operations JSON</Typography>
          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
            <IconButton size="small" onClick={copy}>
              {copied ? (
                <CheckCircleOutline fontSize="small" color="success" />
              ) : (
                <ContentCopy fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            fontFamily: "monospace",
            fontSize: "0.72rem",
            whiteSpace: "pre",
            bgcolor: "action.hover",
            maxHeight: 320,
            overflow: "auto",
          }}
        >
          {json}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
