"use client";

import { useCardDetailsAction } from "@/hooks/useCardDetails";
import {
  determineMaxLevelFromRarityFoil,
  getCardImgV2,
  parseCardUid,
  rarityName,
} from "@/lib/utils/cardUtil";
import { SplDeedHarvestAction } from "@/types/deedHarvest";
import { SplCardDetails } from "@/types/splCardDetails";
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
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
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

  const renderLaborsLuckReward = (
    uid: string | null,
    details: SplCardDetails[] | null
  ) => {
    if (!uid) return "-";
    const parsed = parseCardUid(uid);
    if (!parsed || !details) return uid;

    const card = details.find((cd) => cd.id === parsed.cardDetailId);
    if (!card) return uid;
    const level =
      parsed.foil === "gold"
        ? 1
        : determineMaxLevelFromRarityFoil(rarityName(card.rarity), parsed.foil);
    const img = getCardImgV2(card.name, parsed.edition, parsed.foil, level);

    return (
      <Tooltip
        title={
          <Box width={220} height={300} position="relative">
            <Image
              src={img}
              alt={card.name}
              fill
              sizes="220px"
              style={{
                objectFit: "contain",
                objectPosition: "center",
                borderRadius: 8,
              }}
            />
          </Box>
        }
        placement="right"
        arrow
      >
        <Box
          width={40}
          height={56}
          position="relative"
          sx={{
            overflow: "hidden",
            borderRadius: 0.5,
            background: "#222",
          }}
        >
          <Image
            src={img}
            alt={card.name}
            fill
            sizes="40px"
            style={{
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
        </Box>
      </Tooltip>
    );
  };

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
                  );

                const laborsLuckRow =
                  roll.labors_luck_chance === null ? null : (
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
                        {roll.labors_luck_uid ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {renderLaborsLuckReward(
                          roll.labors_luck_uid,
                          cardDetails
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
