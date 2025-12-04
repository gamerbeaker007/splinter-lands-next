"use client";

import { clearCache } from "@/lib/backend/admin/adminActions";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Data = {
  cacheKeys: number;
  users: string[];
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
            tooltip="Total keys currently stored in the in-memory cache."
          />
          <Typography variant="body2">{initialData.cacheKeys}</Typography>
        </Box>

        <Box mb={2}>
          <SectionLabel
            label="Daily Cached Keys"
            tooltip="Number of keys stored for daily metrics or snapshots."
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

        <Divider sx={{ my: 2 }} />

        <SectionLabel
          label="Users"
          tooltip="List of users currently represented in the cached data."
        />

        <List dense>
          {initialData.users.map((user: string) => (
            <ListItem key={user} disableGutters sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <FiberManualRecordIcon
                  fontSize="small"
                  sx={{ color: "text.secondary" }}
                />
              </ListItemIcon>
              <ListItemText primary={user} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
