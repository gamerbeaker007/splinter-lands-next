"use client";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  IconButton,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import ProductionTable, { ProductionTableProps } from "./ProductionTable";
import { ProductionRow } from "./productionTypes";

interface Props {
  region: string;
  rows: ProductionRow[];
  pageSize: number;
  /** Shared table props (sort/busy/expand/handlers), minus the page's rows. */
  tableProps: Omit<ProductionTableProps, "rows">;
}

/** A collapsible, paginated per-region section (mirrors the Worksites tab). */
export default function ProductionRegionGroup({
  region,
  rows,
  pageSize,
  tableProps,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(1);

  const pageCount = Math.ceil(rows.length / pageSize);
  const safePage = Math.min(page, Math.max(1, pageCount));
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{
          cursor: "pointer",
          pb: 0.5,
          borderBottom: 1,
          borderColor: "divider",
          mb: 0.5,
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <IconButton size="small" sx={{ p: 0.25 }}>
          {collapsed ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ExpandLessIcon fontSize="small" />
          )}
        </IconButton>
        <Typography variant="subtitle2" fontWeight={700}>
          {region}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          · {rows.length} plot{rows.length === 1 ? "" : "s"}
        </Typography>
      </Stack>

      <Collapse in={!collapsed}>
        <ProductionTable rows={pageRows} {...tableProps} />
        {pageCount > 1 && (
          <Stack direction="row" justifyContent="center" mt={0.75}>
            <Pagination
              count={pageCount}
              page={safePage}
              size="small"
              onChange={(_, p) => setPage(p)}
            />
          </Stack>
        )}
      </Collapse>
    </Box>
  );
}
