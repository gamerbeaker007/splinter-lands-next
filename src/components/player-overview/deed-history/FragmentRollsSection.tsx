"use client";

import { SplDeedHarvestAction } from "@/types/deedHarvest";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  Chip,
  Paper,
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
  // Filter harvests that have fragment or labor's luck rolls
  const rollHarvests = harvests.filter(
    (h) =>
      h.fragment_roll &&
      (h.fragment_roll.fragment_chance !== null ||
        h.fragment_roll.labors_luck_chance !== null)
  );

  // Calculate success statistics
  const fragmentAttempts = rollHarvests.filter(
    (h) => h.fragment_roll.fragment_chance !== null
  ).length;
  const fragmentSuccesses = rollHarvests.filter(
    (h) => h.fragment_roll.fragment_found === true
  ).length;
  const fragmentSuccessRate =
    fragmentAttempts > 0 ? (fragmentSuccesses / fragmentAttempts) * 100 : 0;

  const laborsLuckAttempts = rollHarvests.filter(
    (h) => h.fragment_roll.labors_luck_chance !== null
  ).length;
  const laborsLuckSuccesses = rollHarvests.filter(
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
          <strong>Total Harvests with Rolls:</strong> {rollHarvests.length}
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
      {rollHarvests.length > 0 ? (
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
              {rollHarvests.map((harvest) => {
                const roll = harvest.fragment_roll;
                const fragmentRow =
                  roll.fragment_chance !== null ? (
                    <TableRow key={`${harvest.id}-fragment`}>
                      <TableCell>
                        {new Date(harvest.created_date).toLocaleDateString()}
                      </TableCell>
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
                        {((roll.fragment_roll ?? 0) * 100).toFixed(4)}%
                      </TableCell>
                      <TableCell>
                        {roll.fragment_found ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {roll.fragment_found
                          ? roll.fragment_type || "Fragment"
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ) : null;

                const laborsLuckRow =
                  roll.labors_luck_chance !== null ? (
                    <TableRow key={`${harvest.id}-labors`}>
                      <TableCell>
                        {new Date(harvest.created_date).toLocaleDateString()}
                      </TableCell>
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
                        {((roll.labors_luck_roll ?? 0) * 100).toFixed(4)}%
                      </TableCell>
                      <TableCell>
                        {roll.labors_luck_uid ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {roll.labors_luck_uid ? roll.labors_luck_uid : "-"}
                      </TableCell>
                    </TableRow>
                  ) : null;

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
