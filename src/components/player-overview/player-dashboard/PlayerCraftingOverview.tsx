import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { RegionLiquidityInfo } from "@/types/regionLiquidityInfo";
import { SplBalance } from "@/types/spl/balance";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import React from "react"; // Replace with your actual import
import { InfoCreatableItem } from "./InfoItemWithCraftable";

const RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "RESEARCH",
  "AURA",
] as const;

const CRAFT_REQUIREMENTS = {
  WAGONKIT: { WOOD: 40000, STONE: 10000, IRON: 4000, AURA: 2500 },
  AM: { AURA: 1000, VOUCHER: 50, DEC: 500 },
  FT: { AURA: 200, VOUCHER: 10, DEC: 200 },
  MIDNIGHTPOT: { AURA: 40 },
};

type Props = {
  liquidityInfo: RegionLiquidityInfo[];
  balances: SplBalance[];
};

export function PlayerCraftingOverview({ liquidityInfo, balances }: Props) {
  // Total of a given resource
  const resourceAvailableMap: Record<string, number> = {
    DEC: Number(balances.find((b) => b.token === "DEC")?.balance ?? 0),
    VOUCHER: Number(balances.find((b) => b.token === "VOUCHER")?.balance ?? 0),
  };

  RESOURCES.forEach((res) => {
    const key = res.toLowerCase() as keyof RegionLiquidityInfo;
    resourceAvailableMap[res] = liquidityInfo.reduce(
      (sum, r) => sum + (Number(r[key]) || 0),
      0
    );
  });

  const getCraftableCount = (requirements: Record<string, number>): number => {
    const possibleCounts = Object.entries(requirements).map(
      ([resource, needed]) => {
        const available = resourceAvailableMap[resource] ?? 0;
        return available / needed;
      }
    );

    return Math.floor(Math.min(...possibleCounts));
  };

  const getMissingResources = (
    requirements: Record<string, number>,
    maxCraftable: number
  ): React.ReactNode => {
    // Subtract used resources from available
    const remainingAfterCraft = Object.entries(requirements).reduce(
      (acc, [resource, needed]) => {
        const available = resourceAvailableMap[resource] ?? 0;
        acc[resource] = available - needed * maxCraftable;
        return acc;
      },
      {} as Record<string, number>
    );

    // Determine what's missing to craft ONE MORE item
    const missing = Object.entries(requirements)
      .map(([resource, needed]) => {
        const remaining = remainingAfterCraft[resource] ?? 0;
        const shortfall = needed - remaining;
        return shortfall > 0
          ? `- ${resource}: ${shortfall.toLocaleString()}`
          : null;
      })
      .filter(Boolean);

    return missing.length > 0 ? (
      <>
        <strong>Missing for next:</strong>
        <br />
        {missing.map((item, i) => (
          <React.Fragment key={i}>
            {item}
            <br />
          </React.Fragment>
        ))}
      </>
    ) : (
      ""
    );
  };

  return (
    <Box display={"flex"} flexWrap={"wrap"} gap={4}>
      <Box maxWidth={350}>
        <Typography variant="h6">Resource Overview</Typography>

        {RESOURCES.map((resource) => (
          <InfoCreatableItem
            key={resource}
            icon={RESOURCE_ICON_MAP[resource]}
            title={resource}
            number={resourceAvailableMap[resource]}
          />
        ))}

        <InfoCreatableItem
          icon={RESOURCE_ICON_MAP["DEC"]}
          title="DEC"
          number={resourceAvailableMap["DEC"]}
        />
        <InfoCreatableItem
          icon={RESOURCE_ICON_MAP["VOUCHER"]}
          title="VOUCHER"
          number={resourceAvailableMap["VOUCHER"]}
        />
      </Box>
      <Box maxWidth={350}>
        <Tooltip title="Crafting assumes resources are accessible and does not account for transfer fee between regions.">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Craftable Items</Typography>
            <WarningAmberIcon color="warning" fontSize="small" />
          </Box>
        </Tooltip>

        {Object.entries(CRAFT_REQUIREMENTS).map(([itemKey, requirements]) => {
          const count = getCraftableCount(requirements);
          const tooltip = getMissingResources(requirements, count);

          return (
            <InfoCreatableItem
              key={itemKey}
              icon={RESOURCE_ICON_MAP[itemKey]}
              title={itemKey}
              number={Number(
                balances.find((b) => b.token === itemKey)?.balance ?? 0
              )}
              creatable={`${count}x`}
              tooltip_craft={tooltip}
              tooltip_requirements={requirements}
            />
          );
        })}
      </Box>
    </Box>
  );
}
