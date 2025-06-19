"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import { useEffect, useState } from "react";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

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

export default function CacheSection() {
  const [data, setData] = useState<Data | undefined>();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cache")
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

  function onClear(): void {
    fetch("/api/admin/cache", { method: "DELETE" })
      .then((res) => {
        if (res.status === 401) {
          setUnauthorized(true);
        } else {
          return res.json();
        }
      })
      .then((res) => {
        if (res?.success) {
          // re-fetch data
          setLoading(true);
          fetch("/api/admin/cache")
            .then((res) => res.json())
            .then((json) => {
              setData(json);
              setLoading(false);
            });
        }
      });
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
          <Typography variant="body2">{data.cacheKeys}</Typography>
        </Box>

        <Box mb={2}>
          <SectionLabel
            label="Daily Cached Keys"
            tooltip="Number of keys stored for daily metrics or snapshots."
          />
          <Typography variant="body2">{data.dailyCacheKeys}</Typography>
        </Box>

        <Button
          variant="outlined"
          color="error"
          onClick={onClear}
          sx={{ mb: 2 }}
        >
          Clear Cache
        </Button>

        <Divider sx={{ my: 2 }} />

        <SectionLabel
          label="Users"
          tooltip="List of users currently represented in the cached data."
        />

        <List dense>
          {data.users.map((user: string) => (
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
