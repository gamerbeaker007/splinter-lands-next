"use client";

import ScrollableTableContainer from "@/components/ui/ScrollableTableContainer";
import { getBulkRegionData } from "@/lib/backend/actions/land-manager/overview-actions";
import { NATURAL_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  Box,
  CircularProgress,
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
import { useEffect, useState } from "react";

interface Props {
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  refreshKey?: number;
}

export function fmt(number: number) {
  const parts = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 3,
  }).formatToParts(number);

  return (
    <>
      {parts.map((part, index) =>
        part.type === "compact" ? (
          <strong key={index} style={{ marginLeft: "2px" }}>
            {part.value}
          </strong>
        ) : (
          part.value
        )
      )}
    </>
  );
}

export default function RegionResourceSummary({
  regions,
  enabledRegions,
  refreshKey = 0,
}: Props) {
  const visibleRegions = regions.filter((r) =>
    enabledRegions.includes(r.region_number)
  );

  const [balances, setBalances] = useState<
    Record<string, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visibleRegions.length === 0) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const { balances: raw } = await getBulkRegionData(
          visibleRegions.map((r) => r.region_uid)
        );
        setBalances(raw);
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledRegions.join(","), refreshKey]);

  if (visibleRegions.length === 0) return null;

  return (
    <ScrollableTableContainer>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="caption" fontWeight="bold">
                  Region
                </Typography>
              </TableCell>
              {NATURAL_RESOURCES.map((sym) => (
                <TableCell key={sym} align="right">
                  <Box
                    display="flex"
                    alignItems="right"
                    justifyContent={"right"}
                    gap={0.5}
                  >
                    <Tooltip title={sym} placement={"top"}>
                      <Image
                        src={RESOURCE_ICON_MAP[sym]}
                        alt={sym}
                        width={16}
                        height={16}
                      />
                    </Tooltip>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 1 }}>
                  <CircularProgress size={16} />
                </TableCell>
              </TableRow>
            ) : (
              visibleRegions.map((region) => {
                const b = balances[region.region_uid] ?? null;
                return (
                  <TableRow key={region.region_uid}>
                    <TableCell>
                      <Tooltip title={`Region #${region.region_number}`}>
                        <Typography variant="caption" fontWeight="bold">
                          {region.name}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    {NATURAL_RESOURCES.map((sym) => (
                      <TableCell key={sym} align="right">
                        <Typography variant="caption">
                          {b ? fmt(b[sym] ?? 0) : "—"}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </ScrollableTableContainer>
  );
}
