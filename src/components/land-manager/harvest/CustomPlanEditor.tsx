"use client";

import CustomPlanActionsToolbar from "@/components/land-manager/harvest/custom-plan/CustomPlanActionsToolbar";
import { rowMatchesSearch } from "@/components/land-manager/harvest/custom-plan/customPlanRowUtils";
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
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import { Box, Typography } from "@mui/material";
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
    rows: CustomPlanRowDraft[],
    /** Validation for each entry of `rows` (same order, empty rows excluded). */
    rowValidations: CustomPlanRowValidation[]
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
    const configuredValidations = validation.rows.filter(
      (_, i) => rows[i] && !isRowEmpty(rows[i])
    );
    onValidationChange(validation, configuredRows, configuredValidations);
  }, [validation, rows, onValidationChange]);

  // ── Presentation-only state (not part of the plan) ─────────────────────────
  // Rows start collapsed; the trailing empty row is always shown expanded.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const emptyRowRef = useRef<HTMLDivElement | null>(null);

  function setExpanded(draftId: string, expanded: boolean) {
    setExpandedIds((prev) => {
      if (prev.has(draftId) === expanded) return prev;
      const next = new Set(prev);
      if (expanded) next.add(draftId);
      else next.delete(draftId);
      return next;
    });
  }

  const markDirty = useCallback(() => {
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      onDirtyChange(true);
    }
  }, [onDirtyChange]);

  function updateRow(index: number, patch: Partial<CustomPlanRowDraft>) {
    // A row being filled in from the trailing empty row stays open for editing
    // once a fresh empty row is appended below it.
    const target = rows[index];
    if (target && isRowEmpty(target)) setExpanded(target.draftId, true);
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
    const copyId = newDraftId();
    setExpanded(copyId, true);
    setRows((prev) => {
      const copy = { ...prev[index], draftId: copyId };
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

  const query = search.trim().toLowerCase();
  const isFiltering = query.length > 0;

  const matchesSearch = (row: CustomPlanRowDraft) =>
    rowMatchesSearch(row, regions, query);

  const configuredIds = rows
    .filter((r) => !isRowEmpty(r))
    .map((r) => r.draftId);
  const allExpanded =
    configuredIds.length > 0 &&
    configuredIds.every((id) => expandedIds.has(id));

  function toggleAll() {
    setExpandedIds(allExpanded ? new Set() : new Set(configuredIds));
  }

  function focusNewRow() {
    setSearch("");
    // Wait for the (possibly filtered-out) empty row to render again.
    requestAnimationFrame(() => {
      emptyRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      emptyRowRef.current
        ?.querySelector<HTMLElement>("[role='combobox']")
        ?.focus();
    });
  }

  const visibleCount = rows.filter(
    (r, i) => !(i === rows.length - 1 && isRowEmpty(r)) && matchesSearch(r)
  ).length;

  return (
    // The toolbar stays in place; only the row list scrolls, so
    // "Add action" stays reachable on long plans.
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // On small screens the whole dialog scrolls instead.
        minHeight: { xs: "auto", md: 0 },
        flex: 1,
        gap: 1.5,
      }}
    >
      <CustomPlanActionsToolbar
        actionCount={configuredRowCount}
        search={search}
        onSearchChange={setSearch}
        allExpanded={allExpanded}
        onToggleAll={toggleAll}
        onAddAction={focusNewRow}
      />

      <Box
        sx={{
          flex: 1,
          // Never squeezed away by a tall header; the dialog scrolls instead.
          minHeight: { xs: "auto", md: 240 },
          overflowY: { md: "auto" },
          // Room for the scrollbar so it doesn't sit on the row borders.
          pr: { md: 0.5 },
        }}
      >
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          const empty = isLast && isRowEmpty(row);
          const rowValidation: CustomPlanRowValidation | null =
            !empty && validation.rows[index] ? validation.rows[index] : null;
          if (!empty && !matchesSearch(row)) return null;
          // Reordering is disabled while filtered so a drop can't jump over
          // rows the user can't see.
          const canDrag = !empty && !isFiltering;

          return (
            <Box
              key={row.draftId}
              ref={empty ? emptyRowRef : undefined}
              draggable={canDrag}
              onDragStart={canDrag ? () => onDragStart(index) : undefined}
              onDragOver={
                canDrag
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
                expanded={expandedIds.has(row.draftId)}
                onToggleExpanded={() =>
                  setExpanded(row.draftId, !expandedIds.has(row.draftId))
                }
                dragEnabled={!isFiltering}
              />
            </Box>
          );
        })}

        {isFiltering && visibleCount === 0 && configuredRowCount > 0 && (
          <Typography variant="caption" color="text.secondary" component="p">
            No actions match &ldquo;{search.trim()}&rdquo;.
          </Typography>
        )}

        {configuredRowCount === 0 && (
          <Typography variant="caption" color="text.secondary">
            Choose an action above to start building your plan.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
