"use client";

import LastHarvestAgeChip from "@/components/land-manager/harvest/LastHarvestAgeChip";
import ScrollableTableContainer from "@/components/ui/ScrollableTableContainer";
import type { MythicDeed } from "@/types/landManager";
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

interface Props {
  deeds: MythicDeed[] | null;
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
        <ScrollableTableContainer>
          <TableContainer component={Box} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Last Harvest</TableCell>
                  <TableCell>Totem Chance</TableCell>
                  <TableCell>Available Resources</TableCell>
                  <TableCell>History</TableCell>
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
                      <Typography variant="caption">
                        {deed.region_uid}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <LastHarvestAgeChip
                        date={deed.last_action_time}
                        emptyLabel="Never"
                      />
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
                    <TableCell>
                      <Tooltip title="View deed history on spl-stats.com">
                        <IconButton
                          size="small"
                          component="a"
                          href={`https://land.spl-stats.com/player-overview/deed-history/${deed.deed_uid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ScrollableTableContainer>
      </CardContent>
    </Card>
  );
}
