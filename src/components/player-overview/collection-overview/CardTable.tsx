import { useState, useMemo, useRef, useEffect } from "react";
import { formatLargeNumber } from "@/lib/formatters";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { RarityColor } from "@/lib/utils/cardUtil";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  cardFoilOptions,
  cardSetIconMap,
  cardSetModifiers,
} from "@/types/planner";
import { GroupedCardRow } from "@/types/groupedCardRow";
import CardTableIcon from "./CardTableIcon";

type Props = {
  data: GroupedCardRow[];
  pageSize?: number;
};

type SortKey =
  | "name"
  | "rarity"
  | "edition"
  | "foil"
  | "bcx"
  | "count"
  | "basePP"
  | "ratio"
  | "set";

const columns: {
  key: SortKey;
  label: string;
  align?: "right" | "left" | "center";
}[] = [
  { key: "name", label: "Card", align: "left" },
  { key: "set", label: "Set", align: "center" },
  { key: "rarity", label: "Rarity", align: "center" },
  { key: "edition", label: "Edition", align: "center" },
  { key: "foil", label: "Foil", align: "center" },
  { key: "bcx", label: "BCX", align: "center" },
  { key: "count", label: "Count", align: "center" },
  { key: "basePP", label: "Base PP", align: "left" },
  { key: "ratio", label: "PP/DEC (Ratio)", align: "left" },
];

function getSortIcon(active: boolean, direction: "asc" | "desc") {
  if (!active) return null;
  return direction === "asc" ? (
    <ArrowUpwardIcon fontSize="small" />
  ) : (
    <ArrowDownwardIcon fontSize="small" />
  );
}

export default function CardTable({ data, pageSize = 100 }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("basePP");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleRows, setVisibleRows] = useState(pageSize);

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const vA = a[sortKey];
      const vB = b[sortKey];
      if (typeof vA === "string" && typeof vB === "string") {
        return sortDir === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortDir === "asc"
        ? Number(vA) - Number(vB)
        : Number(vB) - Number(vA);
    });
    return sorted;
  }, [data, sortKey, sortDir]);

  // Infinite scroll logic
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
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
    <TableContainer
      component={Paper}
      sx={{
        minWidth: 900,
        height: "100%",
        maxHeight: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        scrollbarWidth: "none", // Firefox
        "&::-webkit-scrollbar": { display: "none" }, // Chrome, Safari
      }}
      ref={tableRef}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center">Img</TableCell>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align ?? "left"}
                sx={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {getSortIcon(sortKey === col.key, sortDir)}
              </TableCell>
            ))}
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
              {/* Edition */}
              <TableCell align="center">{card.edition}</TableCell>
              {/* Foil */}
              <TableCell align="center">{cardFoilOptions[card.foil]}</TableCell>
              {/* BCX */}
              <TableCell align="center">{card.bcx}</TableCell>
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
  );
}
