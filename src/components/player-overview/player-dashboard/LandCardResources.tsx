import { Resource } from "@/constants/resource/resource";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { CardRarity, cardRarityOptions } from "@/types/planner";
import { PlayerOverview } from "@/types/playerOverview";
import {
  Box,
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

type Props = {
  playerOverview: PlayerOverview;
};

// Crafting costs per rarity level
const CRAFTING_COSTS: Record<CardRarity, Partial<Record<Resource, number>>> = {
  common: {
    GRAIN: 20000,
    CINDER: 375,
  },
  rare: {
    WOOD: 30000,
    CINDER: 1875,
  },
  epic: {
    AURA: 7500,
    STONE: 15000,
    GRAIN: 50000,
    CINDER: 5625,
  },
  legendary: {
    AURA: 50000,
    IRON: 40000,
    CINDER: 37500,
  },
};

const RESOURCE_ORDER: Resource[] = [
  "CINDER",
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "AURA",
];

export function LandCardResources({ playerOverview }: Props) {
  // Calculate total available resources
  const getAvailableResource = (resource: Resource): number => {
    // Cinder is not stored in liquidityInfo, only in player balances as CP
    // We'll get it from the pools only for now
    if (resource === "CINDER") return 0;

    // Sum from liquidityInfo (only for grain, wood, stone, iron, aura)
    const liquidityTotal = playerOverview.liquidityInfo.reduce((sum, info) => {
      console.log(info);
      const value = info[resource.toLowerCase() as keyof typeof info];
      console.log(
        "find resource",
        resource.toLowerCase(),
        " Value found: ",
        value,
      );
      return sum + (typeof value === "number" ? value : 0);
    }, 0);

    // Sum from liquidityPoolInfo (for resources available in pools)
    const poolTotal = playerOverview.liquidityPoolInfo.reduce(
      (sum, position) => {
        const tokenResource = position.token.split("-")[1];
        if (tokenResource === resource) {
          return sum + (position.resource_quantity || 0);
        }
        return sum;
      },
      0,
    );

    return liquidityTotal + poolTotal;
  };

  // Get color based on percentage
  const getColorForPercentage = (percentage: number): string => {
    if (percentage < 50) return "#ff4444"; // Red
    if (percentage < 100) return "#ff9800"; // Orange
    return "#4caf50"; // Green
  };

  // Calculate percentage and return cell styling
  const calculateResourcePercentage = (
    rarity: CardRarity,
    resource: Resource,
  ): {
    percentage: number;
    available: number;
    needed: number;
    totalNeeded: number;
  } => {
    const neededPerItem = CRAFTING_COSTS[rarity][resource] || 0;
    if (neededPerItem === 0) {
      return {
        percentage: 0,
        available: 0,
        needed: neededPerItem,
        totalNeeded: 0,
      };
    }

    const eligible = Math.floor(getEligibleCount(rarity));
    const totalNeeded = neededPerItem * eligible;
    const available = getAvailableResource(resource);
    const percentage = totalNeeded > 0 ? (available / totalNeeded) * 100 : 0;

    return { percentage, available, needed: neededPerItem, totalNeeded };
  };

  // Get eligible count for rarity
  const getEligibleCount = (rarity: CardRarity): number => {
    return playerOverview.landShare?.eligible[rarity] || 0;
  };

  // Build tooltip content
  const buildTooltip = (
    rarity: CardRarity,
    resource: Resource,
    data: {
      percentage: number;
      available: number;
      needed: number;
      totalNeeded: number;
    },
  ): string => {
    if (data.needed === 0) return "Not required";

    const eligible = Math.floor(getEligibleCount(rarity));

    if (resource === "CINDER") {
      // Cinder tooltip with CP conversion
      const cpNeeded = data.totalNeeded / 1.5;
      return `Eligible: ${eligible}\nPer Card: ${data.needed.toLocaleString()} Cinder (${(data.needed / 1.5).toLocaleString()} CP)\nTotal Needed: ${data.totalNeeded.toLocaleString()} Cinder (${cpNeeded.toLocaleString()} CP)`;
    } else {
      // Other resources tooltip
      const liquidityTotal = playerOverview.liquidityInfo.reduce(
        (sum, info) => {
          const value = info[resource.toLowerCase() as keyof typeof info];
          return sum + (typeof value === "number" ? value : 0);
        },
        0,
      );

      const poolTotal = playerOverview.liquidityPoolInfo.reduce(
        (sum, position) => {
          const tokenResource = position.token.split("-")[1];
          if (tokenResource === resource) {
            return sum + (position.resource_quantity || 0);
          }
          return sum;
        },
        0,
      );

      return `Eligible: ${eligible}\nPer Card: ${data.needed.toLocaleString()}\nTotal Needed: ${data.totalNeeded.toLocaleString()}\nLiquidity: ${liquidityTotal.toLocaleString()}\nIn Pools: ${poolTotal.toLocaleString()}\nTotal Available: ${data.available.toLocaleString()}\nPercentage: ${data.percentage.toFixed(1)}%`;
    }
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Land Card Resources
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rarity</TableCell>
              <TableCell align="center">Eligible</TableCell>
              {RESOURCE_ORDER.map((resource) => (
                <TableCell key={resource} align="center">
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cardRarityOptions.map((rarity) => (
              <TableRow key={rarity}>
                <TableCell component="th" scope="row">
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </TableCell>
                <TableCell align="center">
                  {Math.floor(getEligibleCount(rarity))}
                </TableCell>
                {RESOURCE_ORDER.map((resource) => {
                  const data = calculateResourcePercentage(rarity, resource);
                  const eligible = Math.floor(getEligibleCount(rarity));

                  // Show "-" if not needed for this rarity
                  if (data.needed === 0) {
                    return (
                      <TableCell key={resource} align="center">
                        -
                      </TableCell>
                    );
                  }

                  // Show "-" if no eligible cards
                  if (eligible === 0) {
                    return (
                      <TableCell key={resource} align="center">
                        -
                      </TableCell>
                    );
                  }

                  const tooltipContent = buildTooltip(rarity, resource, data);

                  // Special handling for CINDER - show total needed instead of percentage
                  if (resource === "CINDER") {
                    return (
                      <Tooltip
                        key={resource}
                        title={
                          <span style={{ whiteSpace: "pre-line" }}>
                            {tooltipContent}
                          </span>
                        }
                        arrow
                      >
                        <TableCell
                          align="center"
                          sx={{
                            backgroundColor: "#2196f3",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          {formatNumberWithSuffix(data.totalNeeded)}
                        </TableCell>
                      </Tooltip>
                    );
                  }

                  // For other resources, show percentage with color coding
                  const color = getColorForPercentage(data.percentage);

                  return (
                    <Tooltip
                      key={resource}
                      title={
                        <span style={{ whiteSpace: "pre-line" }}>
                          {tooltipContent}
                        </span>
                      }
                      arrow
                    >
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: color,
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        {data.percentage.toFixed(0)}%
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
                Total
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {formatNumberWithSuffix(
                  cardRarityOptions.reduce(
                    (sum, rarity) => sum + Math.floor(getEligibleCount(rarity)),
                    0,
                  ),
                )}
              </TableCell>
              {RESOURCE_ORDER.map((resource) => {
                const totalNeeded = cardRarityOptions.reduce((sum, rarity) => {
                  const data = calculateResourcePercentage(rarity, resource);
                  return sum + data.totalNeeded;
                }, 0);

                const totalEligible = cardRarityOptions.reduce(
                  (sum, rarity) => sum + Math.floor(getEligibleCount(rarity)),
                  0,
                );

                if (totalNeeded === 0 || totalEligible === 0) {
                  return (
                    <TableCell
                      key={resource}
                      align="center"
                      sx={{ fontWeight: "bold" }}
                    >
                      -
                    </TableCell>
                  );
                }

                // Special handling for CINDER - show total needed
                if (resource === "CINDER") {
                  const cpNeeded = totalNeeded / 1.5;
                  const tooltipContent = `Total Eligible: ${totalEligible}\nTotal Needed: ${totalNeeded.toLocaleString()} Cinder (${cpNeeded.toLocaleString()} CP)`;

                  return (
                    <Tooltip
                      key={resource}
                      title={
                        <span style={{ whiteSpace: "pre-line" }}>
                          {tooltipContent}
                        </span>
                      }
                      arrow
                    >
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#2196f3",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        {formatNumberWithSuffix(totalNeeded)}
                      </TableCell>
                    </Tooltip>
                  );
                }

                // For other resources, show percentage with color coding
                const totalAvailable = getAvailableResource(resource);
                const percentage = (totalAvailable / totalNeeded) * 100;
                const color = getColorForPercentage(percentage);

                const liquidityTotal = playerOverview.liquidityInfo.reduce(
                  (sum, info) => {
                    const value =
                      info[resource.toLowerCase() as keyof typeof info];
                    return sum + (typeof value === "number" ? value : 0);
                  },
                  0,
                );

                const poolTotal = playerOverview.liquidityPoolInfo.reduce(
                  (sum, position) => {
                    const tokenResource = position.token.split("-")[1];
                    if (tokenResource === resource) {
                      return sum + (position.resource_quantity || 0);
                    }
                    return sum;
                  },
                  0,
                );

                const tooltipContent = `Total Eligible: ${totalEligible}\nTotal Needed: ${totalNeeded.toLocaleString()}\nLiquidity: ${liquidityTotal.toLocaleString()}\nIn Pools: ${poolTotal.toLocaleString()}\nTotal Available: ${totalAvailable.toLocaleString()}\nPercentage: ${percentage.toFixed(1)}%`;

                return (
                  <Tooltip
                    key={resource}
                    title={
                      <span style={{ whiteSpace: "pre-line" }}>
                        {tooltipContent}
                      </span>
                    }
                    arrow
                  >
                    <TableCell
                      align="center"
                      sx={{
                        backgroundColor: color,
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {percentage.toFixed(0)}%
                    </TableCell>
                  </Tooltip>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
