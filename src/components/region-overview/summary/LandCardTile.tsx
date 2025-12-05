"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import { formatNumberWithSuffix } from "@/lib/formatters";
import {
  bloodline_icon_url,
  bountiful_grain_icon_url,
  dec_stake_discount_icon_url,
  energized_icon_url,
  labors_luck_icon_url,
  rationing_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { RegionSummary } from "@/types/regionSummary";
import { Box, Paper, Typography } from "@mui/material";
import Image from "next/image";

interface Props {
  summary: RegionSummary;
}

export default function LandCardTile({ summary }: Props) {
  const countEnergized = summary.countEnergized || 0;
  const countLaborsLuck = summary.countLaborsLuck || 0;
  const countBloodlinesBoost = summary.countBloodlinesBoost || 0;
  const countFoodDiscount = summary.countFoodDiscount || 0;
  const countDecStakeDiscount = summary.countDecStakeDiscount || 0;

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Land Card Bonuses:
      </Typography>

      <Box py={2} mx="auto" display="flex" flexWrap="wrap" gap={2}>
        <SectionBox title="Counts">
          <SummaryTile
            type="Energized"
            imageUrl={energized_icon_url}
            count={Number(countEnergized)}
          />
          <SummaryTile
            type="Labors Luck"
            imageUrl={labors_luck_icon_url}
            count={Number(countLaborsLuck)}
          />

          <SummaryTile
            type="Rationing"
            imageUrl={rationing_icon_url}
            count={Number(countFoodDiscount)}
          />

          <SummaryTile
            type="Bloodlines Boost"
            imageUrl={bloodline_icon_url}
            count={Number(countBloodlinesBoost)}
          />

          <SummaryTile
            type="DEC Discount"
            imageUrl={dec_stake_discount_icon_url}
            count={Number(countDecStakeDiscount)}
          />
        </SectionBox>
        <SectionBox title="Totals">
          <Paper
            elevation={2}
            sx={{
              width: 100,
              height: 115,
              p: 1,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            title={"Bountiful PP"}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 40,
                minHeight: 40,
                mb: 1,
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Image
                src={bountiful_grain_icon_url}
                alt="Bountiful"
                fill
                sizes="100px"
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              {formatNumberWithSuffix(summary.totalAbilityBoostPP ?? 0)}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              align="center"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              {"Bountiful PP"}
            </Typography>
          </Paper>
          <Paper
            elevation={2}
            sx={{
              width: 100,
              height: 115,
              p: 1,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            title={"Bloodlines Boost"}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 40,
                minHeight: 40,
                mb: 1,
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Image
                src={bloodline_icon_url}
                alt="Bloodlines Boost"
                fill
                sizes="100px"
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              {formatNumberWithSuffix(summary.totalBloodlinesBoostPP ?? 0)}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              align="center"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              {"Bloodlines PP"}
            </Typography>
          </Paper>
        </SectionBox>
      </Box>
    </Paper>
  );
}

// Title Box Wrapper
function SectionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      border={1}
      borderColor="grey.400"
      borderRadius={2}
      p={1}
      position="relative"
      sx={{
        flex: "1 1 300px", // Minimum 300px width, will grow if space allows
        maxWidth: "100%",
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {children}
      </Box>
    </Box>
  );
}
