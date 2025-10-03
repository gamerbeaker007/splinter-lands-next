import { useEffect, useMemo, useRef, useState } from "react";
import { formatLargeNumber } from "@/lib/formatters";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import {
  Box,
  capitalize,
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
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  cardFoilOptions,
  cardSetIconMap,
  cardSetModifiers,
  RarityColor,
} from "@/types/planner";
import { GroupedCardRow } from "@/types/groupedCardRow";
import CardTableIcon from "./CardTableIcon";
import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import DateColumn from "@/components/ui/DateColumn";
import { DateSortType, getDateSortValue } from "@/lib/utils/dateColumnUtils";

type Props = {
  data: GroupedCardRow[];
  isAuthenticated: boolean;
  pageSize?: number;
};

type SortKey =
  | "name"
  | "rarity"
  | "foil"
  | "bcx"
  | "count"
  | "basePP"
  | "ratio"
  | "set"
  | "lastUsedDate"
  | "stakeEndDate"
  | "survivalDate";

const columns: {
  key: SortKey;
  label: string;
  align?: "right" | "left" | "center";
}[] = [
  { key: "name", label: "Card", align: "left" },
  { key: "set", label: "Set", align: "center" },
  { key: "rarity", label: "Rarity", align: "center" },
  { key: "foil", label: "Foil", align: "center" },
  { key: "bcx", label: "CC/Max CC", align: "center" },
  { key: "count", label: "Count", align: "center" },
  { key: "basePP", label: "Base PP", align: "left" },
  { key: "ratio", label: "PP/DEC (Ratio)", align: "left" },
  { key: "lastUsedDate", label: "Last Used", align: "left" },
  { key: "stakeEndDate", label: "Land Cooldown", align: "left" },
  { key: "survivalDate", label: "Survival Cooldown", align: "left" },
];

function getSortIcon(active: boolean, direction: "asc" | "desc") {
  if (!active) return null;
  return direction === "asc" ? (
    <ArrowUpwardIcon fontSize="small" />
  ) : (
    <ArrowDownwardIcon fontSize="small" />
  );
}

export default function CardTable({
  data,
  isAuthenticated,
  pageSize = 100,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("basePP");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleRows, setVisibleRows] = useState(pageSize);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      // Handle date columns with special sorting logic
      if (
        sortKey === "lastUsedDate" ||
        sortKey === "stakeEndDate" ||
        sortKey === "survivalDate"
      ) {
        const sortType =
          sortKey === "lastUsedDate" ? "recent" : ("cooldown" as DateSortType);
        const vA = a[sortKey] as Record<string, Date>;
        const vB = b[sortKey] as Record<string, Date>;
        const valueA = getDateSortValue(vA, sortType);
        const valueB = getDateSortValue(vB, sortType);

        // Put rows with no date at the end
        if (valueA === 0 && valueB === 0) return 0;
        if (valueA === 0) return 1;
        if (valueB === 0) return -1;

        return sortDir === "asc" ? valueA - valueB : valueB - valueA;
      }

      // Handle regular columns
      const vA = a[sortKey];
      const vB = b[sortKey];
      if (typeof vA === "string" && typeof vB === "string") {
        return sortDir === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortDir === "asc"
        ? Number(vA) - Number(vB)
        : Number(vB) - Number(vA);
    });
  }, [data, sortKey, sortDir]);

  // Infinite scroll logic
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
      // Increase threshold and ensure loading triggers when near bottom
      if (scrollTop + clientHeight >= scrollHeight - 150) {
        setVisibleRows((prev) => Math.min(prev + pageSize, sortedData.length));
      }
    };
    const ref = tableRef.current;
    if (ref) ref.addEventListener("scroll", handleScroll);
    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, [sortedData.length, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setVisibleRows(pageSize); // Reset paging on sort
  };

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <TableContainer
        component={Paper}
        sx={{
          border: "1px solid",
          height: "100%",
          minHeight: 400,
          maxHeight: "calc(100vh - 380px)", // Adjust height based on viewport, minus header/footer
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        ref={tableRef}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Img</TableCell>
              {columns.map((col) => {
                if (col.key === "lastUsedDate" && !isAuthenticated) return null;
                return (
                  <TableCell
                    key={col.key}
                    align={col.align ?? "left"}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {getSortIcon(sortKey === col.key, sortDir)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.slice(0, visibleRows).map((card, idx) => (
              <TableRow key={idx} hover>
                {/* Card image with hover preview */}
                <TableCell align="center">
                  <CardTableIcon card={card} />
                </TableCell>
                {/* Card name */}
                <TableCell align="left">{card.name}</TableCell>
                {/* Set icon */}
                <TableCell align="center">
                  <Tooltip title={`Set ${card.set}`}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Image
                        src={cardSetIconMap[card.set]}
                        alt={`Set ${card.set}`}
                        width={40}
                        height={40}
                      />
                    </Box>
                  </Tooltip>
                  {cardSetModifiers[card.set]}x
                </TableCell>
                {/* Rarity dot */}
                <TableCell align="center">
                  <Box
                    width={20}
                    height={20}
                    borderRadius="50%"
                    bgcolor={RarityColor[card.rarity]}
                    border={1}
                    mx="auto"
                  />
                </TableCell>
                {/* Foil */}
                <TableCell align="center">
                  {capitalize(cardFoilOptions[card.foil])}
                </TableCell>
                {/* BCX */}
                <TableCell align="center">
                  {card.bcx} /{" "}
                  {determineCardMaxBCX(card.set, card.rarity, card.foil)}
                </TableCell>
                {/* Count */}
                <TableCell align="center">{card.count}</TableCell>
                {/* Base PP */}
                <TableCell align="left">
                  <Box
                    display="flex"
                    alignItems="left"
                    justifyContent="flex-start"
                    gap={0.5}
                  >
                    <Image
                      src={land_hammer_icon_url}
                      alt="hammer"
                      width={15}
                      height={15}
                    />
                    <Typography fontSize="0.9rem">
                      {formatLargeNumber(Number(card.basePP.toFixed(0)))}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="left">{card.ratio.toFixed(2)}</TableCell>
                {/* Last Used Date */}
                {isAuthenticated && (
                  <TableCell align="center">
                    <DateColumn record={card.lastUsedDate} type="recent" />
                  </TableCell>
                )}
                {/* Stake End Date */}
                <TableCell align="center">
                  <DateColumn record={card.stakeEndDate} type="cooldown" />
                </TableCell>
                {/* Survival Date */}
                <TableCell align="center">
                  <DateColumn record={card.survivalDate} type="cooldown" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visibleRows < sortedData.length && (
          <Box textAlign="center" py={2}>
            <Typography variant="body2" color="text.secondary">
              Loading more cards...
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}
