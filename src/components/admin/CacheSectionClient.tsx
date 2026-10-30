"use client";

import { clearCache } from "@/lib/backend/admin/adminActions";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Data = {
  cacheKeys: number;
  dailyCacheKeys: number;
};

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

export default function CacheSectionClient({
  initialData,
}: {
  initialData: Data;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onClear() {
    setLoading(true);
    try {
      await clearCache();
      router.refresh();
    } catch (error) {
      console.error("Failed to clear cache:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Node Cache Status
        </Typography>

        <Box mb={2}>
          <SectionLabel
            label="Cached Keys"
            tooltip="Keys currently stored in this server process's in-memory cache."
          />
          <Typography variant="body2">{initialData.cacheKeys}</Typography>
        </Box>

        <Box mb={2}>
          <SectionLabel
            label="Daily Cached Keys"
            tooltip="Daily cache keys currently stored in this server process."
          />
          <Typography variant="body2">{initialData.dailyCacheKeys}</Typography>
        </Box>

        <Button
          variant="outlined"
          color="error"
          onClick={onClear}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? "Clearing..." : "Clear Cache"}
        </Button>
      </CardContent>
    </Card>
  );
}
