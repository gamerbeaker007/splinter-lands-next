import React from "react";
import { Box, Typography, Tooltip, Stack } from "@mui/material";
import {
  land_grain_farm_icon_url,
  land_logging_camp_icon_url,
  land_ore_mine_icon_url,
  land_quarry_icon_url,
  land_research_hut_icon_url,
  land_aura_lab_icon_url,
  land_shard_mine_icon_url,
  land_keep_icon_url,
  land_castle_icon_url,
  land_under_construction_icon_url,
  land_hammer_icon_url,
  aura_icon_url,
  dec_icon_url,
  grain_icon_url,
  iron_icon_url,
  research_icon_url,
  sps_icon_url,
  stone_icon_url,
  tax_icon_url,
  wood_icon_url,
} from "@/scripts/statics_icon_urls";
import { getProgressInfo } from "@/lib/frontend/ProductionUtils";
import { calcCostsFE } from "@/lib/frontend/costCalc";
import Image from "next/image";
import { formatLargeNumber } from "@/lib/formatters";

type ProductionCardProps = {
  worksiteType: string;
  basePP: number;
  boostedPP: number;
  rawPerHour: number;
  resource: string;
  includeTax: boolean;
  hoursSinceLastOperation: number;
  projectCreatedDate: Date | null;
  projectedEndDate: Date | null;
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

export const resourceIconMap: Record<string, string> = {
  GRAIN: grain_icon_url,
  STONE: stone_icon_url,
  WOOD: wood_icon_url,
  IRON: iron_icon_url,
  SPS: sps_icon_url,
  RESEARCH: research_icon_url,
  AURA: aura_icon_url,
  TAX: tax_icon_url,
  DEC: dec_icon_url,
  PP: land_hammer_icon_url,
  "": land_hammer_icon_url,
};

const calculateTaxes = (taxFee: boolean, amount: number) => {
  const taxedAmount = taxFee ? amount * 0.9 : amount;
  const extraText = taxFee ? (
    <Typography component="span" variant="caption" color="gray">
      (incl. tax)
    </Typography>
  ) : (
    <br />
  );
  return [extraText, taxedAmount] as const;
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
          width: `${percentage}%`,
          height: 10,
          backgroundColor: color,
        }}
      />
      <Typography variant="caption" position="absolute" top={0} left={4}>
        {label}
      </Typography>
    </Box>
  );
};

export const ProductionCard: React.FC<ProductionCardProps> = ({
  worksiteType,
  basePP,
  boostedPP,
  rawPerHour,
  resource,
  includeTax,
  hoursSinceLastOperation,
  projectCreatedDate,
  projectedEndDate,
}) => {
  const [extraText, taxedPerHour] = calculateTaxes(includeTax, rawPerHour);
  const cost = calcCostsFE(resource, basePP);

  const info = getProgressInfo(
    hoursSinceLastOperation,
    projectCreatedDate,
    projectedEndDate,
    boostedPP,
  );

  const prodIcon = resourceIconMap[resource] ?? land_hammer_icon_url;
  const worksiteImage =
    worksiteTypeMapping[worksiteType] ?? land_under_construction_icon_url;

  return (
    <Box mt={1} mb={2}>
      <Stack direction="row" spacing={2}>
        <Box>
          <Box
            sx={{
              width: 200,
              height: 100,
              backgroundImage: `url(${worksiteImage})`,
              backgroundSize: "cover",
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
          <Typography fontWeight="bold">Worksite:</Typography>
          <Typography>{worksiteType}</Typography>

          <Typography fontWeight="bold" mt={1}>
            Production:
          </Typography>
          <Typography>
            <Image src={prodIcon} alt={resource} width={20} height={20} />{" "}
            {taxedPerHour.toFixed(1)}/h {extraText}
          </Typography>

          <Typography fontWeight="bold" mt={1}>
            Cost:
          </Typography>
          {Object.entries(cost)
            .filter(([, value]) => value > 0)
            .map(([key, value]) => {
              const symbol = key.split("_").pop()?.toUpperCase() || "";
              const icon = resourceIconMap[symbol];
              return (
                <Typography key={key}>
                  {icon && (
                    <Image src={icon} alt={symbol} width={20} height={20} />
                  )}{" "}
                  {value.toFixed(1)}/h
                </Typography>
              );
            })}
        </Box>
      </Stack>

      <Box mt={2}>
        <Typography fontWeight="bold" display="inline">
          Progress:
        </Typography>
        {info.progressTooltip && (
          <Tooltip title={info.progressTooltip}>
            <Typography component="span" ml={1}>
              ℹ️
            </Typography>
          </Tooltip>
        )}
        <ProgressBar percentage={info.percentageDone} label={info.infoStr} />
      </Box>
    </Box>
  );
};
