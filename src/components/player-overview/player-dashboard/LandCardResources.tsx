import { Resource } from "@/constants/resource/resource";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { CardRarity } from "@/types/planner";
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

type LandCard = {
  name: string;
  rarity: CardRarity;
  allocationToken: string;
  costs: Partial<Record<Resource, number>>;
};

const LAND_CARDS: LandCard[] = [
  {
    name: "Thessok Clan Hunter",
    rarity: "common",
    allocationToken: "ALLOCATION_FIRE_C",
    costs: { STONE: 2000, CINDER: 187.5 },
  },
  {
    name: "Ghostly Blacksmith",
    rarity: "common",
    allocationToken: "ALLOCATION_EARTH_C",
    costs: { IRON: 450, CINDER: 187.5 },
  },
];

const RESOURCE_ORDER: Resource[] = ["CINDER", "STONE", "IRON"];

type Props = {
  playerOverview: PlayerOverview;
};

export function LandCardResources({ playerOverview }: Props) {
  const getEligibleCount = (rarity: CardRarity): number => {
    return playerOverview.landShare?.eligible[rarity] || 0;
  };

  const getAllocationRight = (card: LandCard): number => {
    const balance =
      playerOverview.balances.find((b) => b.token === card.allocationToken)
        ?.balance || 0;
    const num =
      typeof balance === "number" ? balance : parseFloat(balance as string);
    return Math.floor(isNaN(num) ? 0 : num);
  };

  const [overrides, setOverrides] = useState<Record<string, string>>(
    Object.fromEntries(LAND_CARDS.map((c) => [c.name, ""]))
  );

  const getAmount = (card: LandCard): number => {
    const override = overrides[card.name];
    if (override && override.trim() !== "") {
      const parsed = parseFloat(override);
      return isNaN(parsed) ? 0 : Math.floor(parsed);
    }
    const allocation = getAllocationRight(card);
    if (allocation > 0) return allocation;
    return Math.floor(getEligibleCount(card.rarity));
  };

  const handleOverrideChange = (cardName: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [cardName]: value }));
  };

  const getAvailableResource = (resource: Resource): number => {
    if (resource === "CINDER") return 0;

    const liquidityTotal = playerOverview.liquidityInfo.reduce((sum, info) => {
      const value = info[resource.toLowerCase() as keyof typeof info];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);

    const poolTotal = playerOverview.liquidityPoolInfo.reduce(
      (sum, position) => {
        const tokenResource = position.token.split("-")[1];
        if (tokenResource === resource) {
          return sum + (position.resource_quantity || 0);
        }
        return sum;
      },
      0
    );

    return liquidityTotal + poolTotal;
  };

  const getColorForPercentage = (percentage: number): string => {
    if (percentage < 50) return "#ff4444";
    if (percentage < 100) return "#ff9800";
    return "#4caf50";
  };

  const calculateResourceData = (
    card: LandCard,
    resource: Resource,
    amount: number
  ): {
    percentage: number;
    available: number;
    needed: number;
    totalNeeded: number;
    eligible: number;
  } => {
    const eligible = Math.floor(getEligibleCount(card.rarity));
    const neededPerItem = card.costs[resource] || 0;
    if (neededPerItem === 0) {
      return {
        percentage: 0,
        available: 0,
        needed: 0,
        totalNeeded: 0,
        eligible,
      };
    }
    const totalNeeded = neededPerItem * amount;
    const available = getAvailableResource(resource);
    const percentage = totalNeeded > 0 ? (available / totalNeeded) * 100 : 0;
    return {
      percentage,
      available,
      needed: neededPerItem,
      totalNeeded,
      eligible,
    };
  };

  const buildTooltip = (
    card: LandCard,
    resource: Resource,
    data: {
      percentage: number;
      available: number;
      needed: number;
      totalNeeded: number;
      eligible: number;
    }
  ): string => {
    if (data.needed === 0) return "Not required";

    if (resource === "CINDER") {
      const cpNeeded = data.totalNeeded / 1.5;
      return `Eligible: ${data.eligible}\nPer Card: ${data.needed.toLocaleString()} Cinder (${(data.needed / 1.5).toLocaleString()} CP)\nTotal Needed: ${data.totalNeeded.toLocaleString()} Cinder (${cpNeeded.toLocaleString()} CP)`;
    }

    const liquidityTotal = playerOverview.liquidityInfo.reduce((sum, info) => {
      const value = info[resource.toLowerCase() as keyof typeof info];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);

    const poolTotal = playerOverview.liquidityPoolInfo.reduce(
      (sum, position) => {
        const tokenResource = position.token.split("-")[1];
        if (tokenResource === resource) {
          return sum + (position.resource_quantity || 0);
        }
        return sum;
      },
      0
    );

    return `Eligible: ${data.eligible}\nPer Card: ${data.needed.toLocaleString()}\nTotal Needed: ${data.totalNeeded.toLocaleString()}\nLiquidity: ${liquidityTotal.toLocaleString()}\nIn Pools: ${poolTotal.toLocaleString()}\nTotal Available: ${data.available.toLocaleString()}\nPercentage: ${data.percentage.toFixed(1)}%`;
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
              <TableCell>Card</TableCell>
              <TableCell align="center">Eligible</TableCell>
              <TableCell align="center">Allocation</TableCell>
              <TableCell align="center">Override</TableCell>
              {RESOURCE_ORDER.map((resource) => (
                <TableCell key={resource} align="center">
                  {resource.charAt(0).toUpperCase() +
                    resource.slice(1).toLowerCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {LAND_CARDS.map((card) => {
              const eligible = Math.floor(getEligibleCount(card.rarity));
              const allocation = getAllocationRight(card);
              const amount = getAmount(card);
              const overridePlaceholder =
                allocation > 0 ? allocation.toString() : eligible.toString();
              return (
                <TableRow key={card.name}>
                  <TableCell component="th" scope="row">
                    {card.name}
                  </TableCell>
                  <TableCell align="center">{eligible}</TableCell>
                  <TableCell align="center">
                    {allocation > 0 ? allocation : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={overrides[card.name]}
                      onChange={(e) =>
                        handleOverrideChange(card.name, e.target.value)
                      }
                      placeholder={overridePlaceholder}
                      sx={{ width: "80px" }}
                      inputProps={{ min: 0, style: { textAlign: "center" } }}
                    />
                  </TableCell>
                  {RESOURCE_ORDER.map((resource) => {
                    const data = calculateResourceData(card, resource, amount);

                    if (data.needed === 0) {
                      return (
                        <TableCell key={resource} align="center">
                          -
                        </TableCell>
                      );
                    }

                    if (amount === 0) {
                      return (
                        <TableCell key={resource} align="center">
                          -
                        </TableCell>
                      );
                    }

                    const tooltipContent = buildTooltip(card, resource, {
                      ...data,
                      eligible: data.eligible,
                    });

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
                -
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                -
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                -
              </TableCell>
              {RESOURCE_ORDER.map((resource) => {
                const totalNeeded = LAND_CARDS.reduce((sum, card) => {
                  const amount = getAmount(card);
                  const data = calculateResourceData(card, resource, amount);
                  return sum + data.totalNeeded;
                }, 0);

                if (totalNeeded === 0) {
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

                if (resource === "CINDER") {
                  const cpNeeded = totalNeeded / 1.5;
                  const tooltipContent = `Total Needed: ${totalNeeded.toLocaleString()} Cinder (${cpNeeded.toLocaleString()} CP)`;

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

                const totalAvailable = getAvailableResource(resource);
                const percentage =
                  totalNeeded > 0 ? (totalAvailable / totalNeeded) * 100 : 0;
                const color = getColorForPercentage(percentage);

                const liquidityTotal = playerOverview.liquidityInfo.reduce(
                  (sum, info) => {
                    const value =
                      info[resource.toLowerCase() as keyof typeof info];
                    return sum + (typeof value === "number" ? value : 0);
                  },
                  0
                );

                const poolTotal = playerOverview.liquidityPoolInfo.reduce(
                  (sum, position) => {
                    const tokenResource = position.token.split("-")[1];
                    if (tokenResource === resource) {
                      return sum + (position.resource_quantity || 0);
                    }
                    return sum;
                  },
                  0
                );

                const tooltipContent = `Total Needed: ${totalNeeded.toLocaleString()}\nLiquidity: ${liquidityTotal.toLocaleString()}\nIn Pools: ${poolTotal.toLocaleString()}\nTotal Available: ${totalAvailable.toLocaleString()}\nPercentage: ${percentage.toFixed(1)}%`;

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
