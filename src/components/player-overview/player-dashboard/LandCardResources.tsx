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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

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
  // Get balance values from playerOverview
  const getBalance = (token: string): number => {
    const balance =
      playerOverview.balances.find((b) => b.token === token)?.balance || 0;
    return typeof balance === "number" ? balance : parseFloat(balance) || 0;
  };

  const balances: Record<CardRarity, number> = {
    common: getBalance("ALLOCATION_RIGHT_C"),
    rare: getBalance("ALLOCATION_RIGHT_R"),
    epic: getBalance("ALLOCATION_RIGHT_E"),
    legendary: getBalance("ALLOCATION_RIGHT_L"),
  };

  // State for override values
  const [overrides, setOverrides] = useState<Record<CardRarity, string>>({
    common: "",
    rare: "",
    epic: "",
    legendary: "",
  });

  // Get amount - uses override if provided, otherwise balance
  const getAmount = (rarity: CardRarity): number => {
    const overrideValue = overrides[rarity];
    if (overrideValue && overrideValue.trim() !== "") {
      const parsed = parseFloat(overrideValue);
      return isNaN(parsed) ? 0 : Math.floor(parsed);
    }
    return Math.floor(balances[rarity]);
  };

  // Handle override input change
  const handleOverrideChange = (rarity: CardRarity, value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [rarity]: value,
    }));
  };

  // Calculate total available resources
  const getAvailableResource = (resource: Resource): number => {
    // Cinder is not stored in liquidityInfo, only in player balances as CP
    // We'll get it from the pools only for now
    if (resource === "CINDER") return 0;

    // Sum from liquidityInfo (only for grain, wood, stone, iron, aura)
    const liquidityTotal = playerOverview.liquidityInfo.reduce((sum, info) => {
      const value = info[resource.toLowerCase() as keyof typeof info];
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
    amount: number,
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

    const totalNeeded = neededPerItem * amount;
    const available = getAvailableResource(resource);
    const percentage = totalNeeded > 0 ? (available / totalNeeded) * 100 : 0;

    return { percentage, available, needed: neededPerItem, totalNeeded };
  };

  // Build tooltip content
  const buildTooltip = (
    rarity: CardRarity,
    resource: Resource,
    amount: number,
    data: {
      percentage: number;
      available: number;
      needed: number;
      totalNeeded: number;
    },
  ): string => {
    if (data.needed === 0) return "Not required";

    if (resource === "CINDER") {
      // Cinder tooltip with CP conversion
      const cpNeeded = data.totalNeeded / 1.5;
      return `Amount: ${amount}\nPer Card: ${data.needed.toLocaleString()} Cinder (${(data.needed / 1.5).toLocaleString()} CP)\nTotal Needed: ${data.totalNeeded.toLocaleString()} Cinder (${cpNeeded.toLocaleString()} CP)`;
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

      return `Amount: ${amount}\nPer Card: ${data.needed.toLocaleString()}\nTotal Needed: ${data.totalNeeded.toLocaleString()}\nLiquidity: ${liquidityTotal.toLocaleString()}\nIn Pools: ${poolTotal.toLocaleString()}\nTotal Available: ${data.available.toLocaleString()}\nPercentage: ${data.percentage.toFixed(1)}%`;
    }
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Land Card Resources
      </Typography>
      <TableContainer
        component={Paper}
        sx={{
          overflowX: "auto",
          maxWidth: "100%",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rarity</TableCell>
              <TableCell align="center">Balance</TableCell>
              <TableCell align="center">Override</TableCell>
              {RESOURCE_ORDER.map((resource) => (
                <TableCell key={resource} align="center">
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cardRarityOptions.map((rarity) => {
              const amount = getAmount(rarity);
              return (
                <TableRow key={rarity}>
                  <TableCell component="th" scope="row">
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </TableCell>
                  <TableCell align="center">
                    {Math.floor(balances[rarity])}
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={overrides[rarity]}
                      onChange={(e) =>
                        handleOverrideChange(rarity, e.target.value)
                      }
                      placeholder={Math.floor(balances[rarity]).toString()}
                      sx={{ width: "80px" }}
                      inputProps={{ min: 0, style: { textAlign: "center" } }}
                    />
                  </TableCell>
                  {RESOURCE_ORDER.map((resource) => {
                    const data = calculateResourcePercentage(
                      rarity,
                      resource,
                      amount,
                    );

                    // Show "-" if not needed for this rarity
                    if (data.needed === 0) {
                      return (
                        <TableCell key={resource} align="center">
                          -
                        </TableCell>
                      );
                    }

                    // Show "-" if no cards
                    if (amount === 0) {
                      return (
                        <TableCell key={resource} align="center">
                          -
                        </TableCell>
                      );
                    }

                    const tooltipContent = buildTooltip(
                      rarity,
                      resource,
                      amount,
                      data,
                    );

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
              );
            })}
            {/* Totals Row */}
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
                Total
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {formatNumberWithSuffix(
                  cardRarityOptions.reduce(
                    (sum, rarity) => sum + Math.floor(balances[rarity]),
                    0,
                  ),
                )}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {formatNumberWithSuffix(
                  cardRarityOptions.reduce(
                    (sum, rarity) => sum + getAmount(rarity),
                    0,
                  ),
                )}
              </TableCell>
              {RESOURCE_ORDER.map((resource) => {
                const totalNeeded = cardRarityOptions.reduce((sum, rarity) => {
                  const amount = getAmount(rarity);
                  const data = calculateResourcePercentage(
                    rarity,
                    resource,
                    amount,
                  );
                  return sum + data.totalNeeded;
                }, 0);

                const totalAmount = cardRarityOptions.reduce(
                  (sum, rarity) => sum + getAmount(rarity),
                  0,
                );

                if (totalNeeded === 0 || totalAmount === 0) {
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
                  const tooltipContent = `Total Amount: ${totalAmount}\nTotal Needed: ${totalNeeded.toLocaleString()} Cinder (${cpNeeded.toLocaleString()} CP)`;

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

                const tooltipContent = `Total Amount: ${totalAmount}\nTotal Needed: ${totalNeeded.toLocaleString()}\nLiquidity: ${liquidityTotal.toLocaleString()}\nIn Pools: ${poolTotal.toLocaleString()}\nTotal Available: ${totalAvailable.toLocaleString()}\nPercentage: ${percentage.toFixed(1)}%`;

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
