"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import { formatNumberWithSuffix } from "@/lib/formatters";
import {
  bloodline_icon_url,
  dec_stake_discount_icon_url,
  energized_icon_url,
  labors_luck_icon_url,
  rationing_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { RegionSummary } from "@/types/regionSummary";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import AbilityBoost from "./AbilityBoost";
import BountifulPP from "./BountifulPP";

interface Props {
  summary: RegionSummary;
}

export default function LandCardTile({ summary }: Props) {
  const countEnergized = summary.countEnergized || 0;
  const countLaborsLuck = summary.countLaborsLuck || 0;
  const countLaborsLuckUniqueOwners = summary.countLaborsLuckUniqueOwners || 0;
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
          <Box
            width={"100%"}
            display="flex"
            flexDirection="column"
            flexWrap="wrap"
            gap={1}
          >
            <Box
              display="flex"
              flexDirection="row"
              flexWrap="wrap"
              gap={2}
              width={"100%"}
            >
              <AbilityBoost countAbilityBoosts={summary.countAbilityBoost} />
            </Box>
            <Box
              display="flex"
              flexDirection="row"
              flexWrap="wrap"
              gap={2}
              width={"100%"}
            >
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
              <Tooltip title={`Labors Luck unique owners`}>
                <Box>
                  <SummaryTile
                    type={`Labors Luck*`}
                    imageUrl={labors_luck_icon_url}
                    count={Number(countLaborsLuckUniqueOwners)}
                  />
                </Box>
              </Tooltip>
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
            </Box>
          </Box>
        </SectionBox>
        <SectionBox title="Totals">
          <BountifulPP totalAbilityBoosts={summary.totalAbilityBoostPP} />

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
