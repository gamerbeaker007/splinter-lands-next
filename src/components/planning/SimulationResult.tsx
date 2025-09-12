"use client";

import { Resource, RESOURCES } from "@/constants/resource/resource";
import { PRODUCING_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { ProductionInfo } from "@/types/productionInfo";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import SPSWarning from "./planner/output/SPSWarning";
import TaxWarning from "@/components/planning/planner/output/TaxWarning";
import TaxSimulationWarning from "@/components/planning/planner/output/TaxSimulationWarning";

type ResultProps = { items: ProductionInfo[] };

const makeZeroMap = (): Record<Resource, number> =>
  Object.fromEntries(RESOURCES.map((r) => [r, 0])) as Record<Resource, number>;

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

export function SimulationResult({ items }: ResultProps) {
  const theme = useTheme();

  const consumed: Record<Resource, number> = makeZeroMap();
  const produced: Record<Resource, number> = makeZeroMap();

  const containsTax = items.find((p) => p.resource === "TAX") != null;

  for (const it of items) {
    for (const c of it.consume ?? []) {
      if (it.resource === "TAX") continue;
      if (c?.resource && PRODUCING_RESOURCES.includes(c.resource)) {
        consumed[c.resource] += c.amount ?? 0;
      }
    }

    for (const p of it.produce ?? []) {
      if (p?.resource && PRODUCING_RESOURCES.includes(p.resource)) {
        produced[p.resource] += p.amount ?? 0;
      }
    }
  }

  const netPerResource: Record<Resource, number> = makeZeroMap();
  for (const r of PRODUCING_RESOURCES) {
    const key = r as Resource;
    netPerResource[key] = (produced[key] ?? 0) - (consumed[key] ?? 0);
  }

  const totalNetDEC = items.reduce(
    (acc, it) => acc + (Number.isFinite(it.netDEC) ? it.netDEC! : 0),
    0,
  );

  const minColumnWidth = 80;
  const gridTemplate = `140px repeat(${PRODUCING_RESOURCES.length}, minmax(${minColumnWidth}px, 1fr))`;
  const netColor = (v: number) =>
    v > 0
      ? theme.palette.success.main
      : v < 0
        ? theme.palette.error.main
        : theme.palette.text.primary;

  return (
    <Paper sx={{ maxWidth: 800 }}>
      <Typography m={2} variant="h4">
        Production Simulation
      </Typography>
      <Box
        maxWidth={800}
        m={2}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflowX: "auto",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            bgcolor: "action.hover",
            px: 1,
            py: 0.75,
            borderBottom: "1px solid",
            borderColor: "divider",
            gap: 1,
          }}
        >
          <Typography fontWeight={600}>Metric</Typography>
          {PRODUCING_RESOURCES.map((res) => (
            <Box
              key={res}
              display="flex"
              justifyContent="left"
              alignItems="left"
            >
              <Image
                src={RESOURCE_ICON_MAP[res]}
                alt={res}
                width={25}
                height={25}
                style={{ display: "block" }}
              />
              {res === "SPS" && <SPSWarning />}
              {res === "GRAIN" && containsTax && <TaxSimulationWarning />}
            </Box>
          ))}
        </Box>

        {/* Body */}
        {[
          { label: "Consumed", key: "consumed" as const },
          { label: "Produced", key: "produced" as const },
          { label: "Net (P − C)", key: "net" as const },
        ].map(({ label, key }) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              px: 1,
              py: 0.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-of-type": { borderBottom: "none" },
              gap: 1,
            }}
          >
            <Typography fontWeight={key === "net" ? 700 : 500}>
              {label}
            </Typography>

            {PRODUCING_RESOURCES.map((res) => {
              const r = res as Resource;
              const c = consumed[r] ?? 0;
              const p = produced[r] ?? 0;
              const n = netPerResource[r] ?? 0;
              const value = key === "consumed" ? c : key === "produced" ? p : n;
              return (
                <Box
                  key={res}
                  sx={
                    key === "net"
                      ? {
                          color: netColor(n),
                          fontWeight: 700,
                          textAlign: "left",
                        }
                      : { textAlign: "left" }
                  }
                >
                  {fmt(value)}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      <Box display="flex" alignItems="center" m={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Total Net DEC:&nbsp;
          <Box component="span" sx={{ color: netColor(totalNetDEC) }}>
            {fmt(totalNetDEC)}
          </Box>
        </Typography>
        <Image
          src={RESOURCE_ICON_MAP["DEC"]}
          alt={"DEC"}
          width={35}
          height={35}
          style={{ display: "block" }}
        />
      </Box>
    </Paper>
  );
}
