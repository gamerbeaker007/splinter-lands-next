import { formatLargeNumber } from "@/lib/formatters";
import { getProgressInfo } from "@/lib/frontend/ProductionUtils";
import { calcCosts } from "@/lib/shared/costCalc";
import {
  aura_icon_url,
  dec_icon_url,
  grain_icon_url,
  iron_icon_url,
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
  research_icon_url,
  sps_icon_url,
  stone_icon_url,
  tax_icon_url,
  wood_icon_url,
} from "@/scripts/statics_icon_urls";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

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
  rawPerHour,
  resource,
  includeTax,
  hoursSinceLastOperation,
  projectCreatedDate,
  projectedEndDate,
}) => {
  const [extraText, taxedPerHour] = calculateTaxes(includeTax, rawPerHour);
  const cost = calcCosts(resource, basePP);

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
            <Box>
              <Typography fontSize="0.8rem" fontWeight="bold">
                Cost:
              </Typography>
              {Object.entries(cost)
                .filter(([, value]) => value > 0)
                .map(([key, value]) => {
                  const symbol = key.split("_").pop()?.toUpperCase() || "";
                  const icon = resourceIconMap[symbol];
                  return (
                    <Typography key={key} fontSize="0.625rem">
                      <Box
                        component="span"
                        display="inline-flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        {icon && (
                          <Image
                            src={icon}
                            alt={symbol}
                            width={20}
                            height={20}
                          />
                        )}
                        {value.toFixed(1)}/h
                      </Box>
                    </Typography>
                  );
                })}
            </Box>
            <Box>
              <Typography fontSize="0.8rem" fontWeight="bold">
                Production:
              </Typography>
              <Typography fontSize="0.625rem">
                <Box
                  component="span"
                  display="inline-flex"
                  alignItems="center"
                  gap={0.5}
                >
                  <Image src={prodIcon} alt={resource} width={20} height={20} />{" "}
                  {taxedPerHour.toFixed(1)}/h {extraText}
                </Box>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Stack>

      <Box>
        <Typography fontSize="0.625rem" fontWeight="bold" display="inline">
          Progress:
        </Typography>
        {info.progressTooltip && (
          <Tooltip title={info.progressTooltip}>
            <Typography component="span" fontSize="0.625rem" ml={1}>
              ℹ️
            </Typography>
          </Tooltip>
        )}
        <ProgressBar percentage={info.percentageDone} label={info.infoStr} />
      </Box>
    </Box>
  );
};
