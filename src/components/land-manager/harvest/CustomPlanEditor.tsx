"use client";

import CustomPlanRow from "@/components/land-manager/harvest/CustomPlanRow";
import {
  isRowEmpty,
  validateCustomPlan,
} from "@/lib/shared/customPlanValidation";
import {
  CustomPlanItem,
  CustomPlanRowDraft,
  CustomPlanRowValidation,
  CustomPlanValidationResult,
  MAX_OPS_PER_BROADCAST,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import { Alert, Box, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

let draftCounter = 0;
function newDraftId(): string {
  return `draft-${++draftCounter}`;
}

function emptyDraft(): CustomPlanRowDraft {
  return {
    draftId: newDraftId(),
    action_type: "",
    from_region_uid: "",
    to_region_uid: "",
    from_resource: "",
    to_resource: "",
    amount_type: "abs",
    amount: "",
  };
}

export function itemsToDrafts(items: CustomPlanItem[]): CustomPlanRowDraft[] {
  return items.map((item) => ({
    draftId: newDraftId(),
    action_type: item.action_type,
    from_region_uid: item.from_region_uid ?? "",
    to_region_uid: item.to_region_uid ?? "",
    from_resource: item.from_resource ?? "",
    to_resource: item.to_resource ?? "",
    amount_type: item.amount_type,
    amount: String(item.amount),
  }));
}

export function draftsToItems(
  drafts: CustomPlanRowDraft[]
): Omit<CustomPlanItem, "id">[] {
  return drafts
    .filter((d) => !isRowEmpty(d) && d.action_type)
    .map((d, idx) => ({
      sequence: idx,
      action_type: d.action_type as CustomPlanItem["action_type"],
      from_region_uid: d.from_region_uid || null,
      to_region_uid: d.to_region_uid || null,
      from_resource: d.from_resource || null,
      to_resource: d.to_resource || null,
      amount_type: d.amount_type,
      amount: parseInt(d.amount, 10),
    }));
}

interface Props {
  initialItems?: CustomPlanItem[];
  regions: SplProductionOverviewRegion[];
  balances: Record<string, Record<string, number>>;
  decBalance: number;
  pools: SplLandPool[];
  poolPositions: Record<string, SplPlayerPoolPosition>;
  multiplier: number;
  onValidationChange: (
    result: CustomPlanValidationResult,
    rows: CustomPlanRowDraft[]
  ) => void;
  onDirtyChange: (dirty: boolean) => void;
}

export default function CustomPlanEditor({
  initialItems,
  regions,
  balances,
  decBalance,
  pools,
  poolPositions,
  multiplier,
  onValidationChange,
  onDirtyChange,
}: Props) {
  const [rows, setRows] = useState<CustomPlanRowDraft[]>(() => {
    const initial = initialItems ? itemsToDrafts(initialItems) : [];
    return [...initial, emptyDraft()];
  });

  const isDirtyRef = useRef(false);

  const validation: CustomPlanValidationResult = useMemo(
    () =>
      validateCustomPlan(rows, balances, decBalance, pools, {
        multiplier,
        poolPositions,
      }),
    [rows, balances, decBalance, pools, multiplier, poolPositions]
  );

  useEffect(() => {
    const configuredRows = rows.filter((r) => !isRowEmpty(r));
    onValidationChange(validation, configuredRows);
  }, [validation, rows, onValidationChange]);

  const markDirty = useCallback(() => {
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      onDirtyChange(true);
    }
  }, [onDirtyChange]);

  function updateRow(index: number, patch: Partial<CustomPlanRowDraft>) {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, ...patch } : r));
      const last = next[next.length - 1];
      if (last?.action_type) next.push(emptyDraft());
      return next;
    });
    markDirty();
  }

  function deleteRow(index: number) {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const last = next[next.length - 1];
      if (!last || last.action_type) next.push(emptyDraft());
      return next;
    });
    markDirty();
  }

  function duplicateRow(index: number) {
    setRows((prev) => {
      const copy = { ...prev[index], draftId: newDraftId() };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    markDirty();
  }

  const draggingRef = useRef<number | null>(null);

  function onDragStart(index: number) {
    draggingRef.current = index;
  }

  function onDragOver(index: number) {
    if (draggingRef.current === null || draggingRef.current === index) return;
    setRows((prev) => {
      const next = [...prev];
      const [item] = next.splice(draggingRef.current!, 1);
      next.splice(index, 0, item);
      draggingRef.current = index;
      return next;
    });
    markDirty();
  }

  function onDragEnd() {
    draggingRef.current = null;
  }

  const configuredRowCount = rows.filter((r) => !isRowEmpty(r)).length;
  const broadcastCount = Math.ceil(configuredRowCount / MAX_OPS_PER_BROADCAST);

  return (
    <Box>
      {broadcastCount > 2 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          This plan has {configuredRowCount} rows and will require{" "}
          {broadcastCount} Keychain signature prompts.
        </Alert>
      )}

      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const empty = isLast && isRowEmpty(row);
        const rowValidation: CustomPlanRowValidation | null =
          !empty && validation.rows[index] ? validation.rows[index] : null;

        return (
          <Box
            key={row.draftId}
            draggable={!empty}
            onDragStart={!empty ? () => onDragStart(index) : undefined}
            onDragOver={
              !empty
                ? (e) => {
                    e.preventDefault();
                    onDragOver(index);
                  }
                : undefined
            }
            onDragEnd={onDragEnd}
          >
            <CustomPlanRow
              draft={row}
              validation={rowValidation}
              regions={regions}
              onChange={(patch) => updateRow(index, patch)}
              onDelete={!empty ? () => deleteRow(index) : undefined}
              onDuplicate={!empty ? () => duplicateRow(index) : undefined}
              isEmptyRow={empty}
              dragHandleProps={{
                onMouseDown: !empty ? () => onDragStart(index) : undefined,
              }}
            />
          </Box>
        );
      })}

      {configuredRowCount === 0 && (
        <Typography variant="caption" color="text.secondary">
          Add rows above to build your plan.
        </Typography>
      )}
    </Box>
  );
}
