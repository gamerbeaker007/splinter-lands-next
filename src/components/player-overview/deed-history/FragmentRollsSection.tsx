"use client";

import CardUidImage from "@/components/ui/CardUidImage";
import TotemFragmentImage from "@/components/ui/TotemFragmentImage";
import { useCardDetailsAction } from "@/hooks/useCardDetails";
import { formatDate } from "@/lib/utils/dateColumnUtils";
import { totemFragmentLabel } from "@/lib/utils/totemFragmentUtil";
import { SplDeedHarvestAction } from "@/types/deedHarvest";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Fragment } from "react";

interface FragmentRollsSectionProps {
  harvests: SplDeedHarvestAction[];
}

export default function FragmentRollsSection({
  harvests,
}: FragmentRollsSectionProps) {
  const { cardDetails } = useCardDetailsAction();

  // Filter harvests that have fragment or labor's luck rolls and ensure unique ids.
  const rollHarvests = harvests.filter(
    (h) =>
      h.fragment_roll &&
      (h.fragment_roll.fragment_chance !== null ||
        h.fragment_roll.labors_luck_chance !== null)
  );
  const uniqueRollHarvests = Array.from(
    new Map(rollHarvests.map((h) => [h.trx_id, h])).values()
  );

  // Calculate success statistics
  const fragmentAttempts = uniqueRollHarvests.filter(
    (h) => h.fragment_roll.fragment_chance !== null
  ).length;
  const fragmentSuccesses = uniqueRollHarvests.filter(
    (h) => h.fragment_roll.fragment_found === true
  ).length;
  const fragmentSuccessRate =
    fragmentAttempts > 0 ? (fragmentSuccesses / fragmentAttempts) * 100 : 0;

  const laborsLuckAttempts = uniqueRollHarvests.filter(
    (h) => h.fragment_roll.labors_luck_chance !== null
  ).length;
  const laborsLuckSuccesses = uniqueRollHarvests.filter(
    (h) => h.fragment_roll.labors_luck_uid !== null
  ).length;
  const laborsLuckSuccessRate =
    laborsLuckAttempts > 0
      ? (laborsLuckSuccesses / laborsLuckAttempts) * 100
      : 0;

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Totem Fragment & Labor&apos;s Luck Rolls
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Special loot drop chances during harvest
      </Typography>

      {/* Summary Stats */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Total Harvests with Rolls:</strong>{" "}
          {uniqueRollHarvests.length}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Totem Fragment:</strong> {fragmentSuccesses}/
            {fragmentAttempts} ({fragmentSuccessRate.toFixed(2)}% success)
          </Typography>
          <Typography variant="body2">
            <strong>Labor&apos;s Luck:</strong> {laborsLuckSuccesses}/
            {laborsLuckAttempts} ({laborsLuckSuccessRate.toFixed(2)}% success)
          </Typography>
        </Box>
      </Box>

      {/* Roll Details Table */}
      {uniqueRollHarvests.length > 0 ? (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Chance %</TableCell>
                <TableCell>Roll</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>Reward</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uniqueRollHarvests.map((harvest) => {
                const roll = harvest.fragment_roll;
                const fragmentRow =
                  roll.fragment_chance === null ? null : (
                    <TableRow key={`${harvest.id}-fragment`}>
                      <TableCell>{formatDate(harvest.created_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label="Fragment"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {((roll.fragment_chance ?? 0) * 100).toFixed(4)}%
                      </TableCell>
                      <TableCell>
                        {((roll.fragment_roll ?? 0) * 100).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {roll.fragment_found ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {roll.fragment_found ? (
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            <TotemFragmentImage
                              fragmentType={roll.fragment_type}
                            />
                            <Typography variant="caption">
                              {totemFragmentLabel(roll.fragment_type)}
                            </Typography>
                          </Stack>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );

                const laborsLuckRow =
                  roll.labors_luck_chance === null ? null : (
                    <TableRow key={`${harvest.id}-labors`}>
                      <TableCell>{formatDate(harvest.created_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label="Labor's Luck"
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {((roll.labors_luck_chance ?? 0) * 100).toFixed(4)}%
                      </TableCell>
                      <TableCell>
                        {((roll.labors_luck_roll ?? 0) * 100).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {roll.labors_luck_uid ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {roll.labors_luck_uid ? (
                          <CardUidImage
                            uid={roll.labors_luck_uid}
                            cardDetails={cardDetails}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );

                return (
                  <Fragment key={harvest.id}>
                    {fragmentRow}
                    {laborsLuckRow}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No fragment or labor&apos;s luck rolls recorded yet.
        </Typography>
      )}
    </Paper>
  );
}
