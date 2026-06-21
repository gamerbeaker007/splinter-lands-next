"use client";

import { WorkerPlanItem } from "@/types/landManager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { ReactNode, useState } from "react";

export interface WorkerPlotColumn {
  header: string;
  align?: "left" | "right";
  render: (item: WorkerPlanItem) => ReactNode;
}

interface Props {
  items: WorkerPlanItem[];
  columns: WorkerPlotColumn[];
  rowsPerPage?: number;
}

export default function WorkerPlotTable({
  items,
  columns,
  rowsPerPage = 20,
}: Props) {
  const [page, setPage] = useState(0);

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.header} align={col.align}>
                <Typography variant="caption" fontWeight="bold">
                  {col.header}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {items
            .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
            .map((item) => (
              <TableRow key={item.plot.deed_uid}>
                {columns.map((col) => (
                  <TableCell key={col.header} align={col.align}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={items.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        onPageChange={(_, p) => setPage(p)}
      />
    </>
  );
}
