"use client";

import type { MythicDeed } from "@/types/landManager";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface Props {
  deeds: MythicDeed[] | null;
}

function formatDateTime(date: Date | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleString();
}

export default function MythicOverview({ deeds }: Props) {
  if (deeds === null) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  if (!deeds || deeds.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Mythic Deeds (Keeps &amp; Castles)
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Deed UID</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Last Harvest</TableCell>
                <TableCell>Totem Chance</TableCell>
                <TableCell>Available Resources</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deeds.map((deed) => (
                <TableRow key={deed.deed_uid}>
                  <TableCell>
                    <Chip
                      label={deed.kingdom_type}
                      size="small"
                      color={
                        deed.kingdom_type === "keep" ? "primary" : "secondary"
                      }
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">
                      {deed.deed_uid.slice(-12)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{deed.region_uid}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDateTime(deed.last_action_time)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {deed.estimated_totem_chance != null
                        ? `${(deed.estimated_totem_chance * 100).toFixed(2)}%`
                        : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {deed.taxes.length === 0 ? (
                      <Typography variant="caption" color="text.disabled">
                        Nothing to harvest
                      </Typography>
                    ) : (
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {deed.taxes.map((t) => (
                          <Chip
                            key={t.token}
                            label={`${t.token}: ${t.balance.toFixed(0)}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ))}
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}
