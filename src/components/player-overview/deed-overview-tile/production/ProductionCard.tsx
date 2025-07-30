import { formatLargeNumber } from "@/lib/formatters";
import {
  land_aura_lab_icon_url,
  land_castle_icon_url,
  land_grain_farm_icon_url,
  land_hammer_icon_url,
  land_keep_icon_url,
  land_logging_camp_icon_url,
  land_ore_mine_icon_url,
  land_quarry_icon_url,
  land_research_hut_icon_url,
  land_shard_mine_icon_url,
  land_under_construction_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { ProgressInfo } from "@/types/progressInfo";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import { ProductionInfo } from "@/types/productionInfo";
import { DECInfo } from "@/components/player-overview/deed-overview-tile/production/DECInfo";
import { ConsumeProduceInfo } from "@/components/player-overview/deed-overview-tile/production/ConsumeProduceInfo";

type ProductionCardProps = {
  worksiteType: string;
  basePP: number;
  boostedPP: number;
  resource: string;
  progressInfo?: ProgressInfo;
  productionInfo?: ProductionInfo;
};

export const worksiteTypeMapping: Record<string, string> = {
  "Grain Farm": land_grain_farm_icon_url,
  "Logging Camp": land_logging_camp_icon_url,
  "Ore Mine": land_ore_mine_icon_url,
  Quarry: land_quarry_icon_url,
  "Research Hut": land_research_hut_icon_url,
  "Aura Lab": land_aura_lab_icon_url,
  "Shard Mine": land_shard_mine_icon_url,
  KEEP: land_keep_icon_url,
  CASTLE: land_castle_icon_url,
  Undeveloped: land_under_construction_icon_url,
};

const ProgressBar = ({
  percentage,
  label,
}: {
  percentage: number;
  label: string;
}) => {
  const color =
    percentage >= 75 ? "red" : percentage >= 40 ? "orange" : "green";
  return (
    <Box mt={1} width="100%" position="relative">
      <Box
        sx={{
          width: "100%",
          height: 15,
          backgroundColor: "grey.300",
          borderRadius: 1,
          overflow: "hidden", // ensures inner bar doesn't overflow corners
        }}
      >
        <Box
          sx={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 0.3s ease",
          }}
        />
      </Box>

      <Typography
        variant="caption"
        position="absolute"
        top="50%"
        left="50%"
        sx={{
          transform: "translate(-50%, -50%)",
          lineHeight: 1,
          color: "black",
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export const ProductionCard: React.FC<ProductionCardProps> = ({
  worksiteType,
  basePP,
  boostedPP,
  resource,
  progressInfo,
  productionInfo,
}) => {
  const worksiteImage =
    worksiteTypeMapping[worksiteType] ?? land_under_construction_icon_url;

  return (
    <Box mt={1} mb={2}>
      <Stack direction="row" spacing={2}>
        <Box justifyItems={"center"}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "10px",
              border: "2px solid #ccc",
              backgroundImage: `url(${worksiteImage})`,
              backgroundSize: "90%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center center",
              mb: 1,
            }}
          />
          <Box display="flex" alignItems="center" gap={0.5}>
            <Image
              src={land_hammer_icon_url}
              alt="hammer"
              width={10}
              height={10}
            />
            <Typography fontSize="0.625rem">
              {formatLargeNumber(Number(basePP))}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Image
              src={land_hammer_icon_url}
              alt="hammer"
              width={10}
              height={10}
            />
            <Typography fontSize="0.625rem">
              {formatLargeNumber(Number(boostedPP))}
            </Typography>
          </Box>
        </Box>

        <Box flex={1}>
          <Typography fontSize="12pt" fontWeight="bold" mb={0.2}>
            Worksite: {worksiteType}
          </Typography>
          <Box display={"flex"} gap={4}>
            {productionInfo && (
              <>
                <ConsumeProduceInfo
                  consume={productionInfo.consume}
                  type={"consume"}
                />
                <ConsumeProduceInfo
                  consume={[productionInfo.produce]}
                  type={"produce"}
                />
                <DECInfo productionInfo={productionInfo} resource={resource} />
              </>
            )}
          </Box>
        </Box>
      </Stack>
      {progressInfo && (
        <Box>
          <Typography fontSize="0.625rem" fontWeight="bold" display="inline">
            Progress:
          </Typography>
          {progressInfo.progressTooltip && (
            <Tooltip title={progressInfo.progressTooltip}>
              <Typography component="span" fontSize="0.625rem" ml={1}>
                ℹ️
              </Typography>
            </Tooltip>
          )}
          <ProgressBar
            percentage={progressInfo.percentageDone}
            label={progressInfo.infoStr}
          />
        </Box>
      )}
    </Box>
  );
};
