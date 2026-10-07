"use client";

import CustomPlanRowFields from "@/components/land-manager/harvest/custom-plan/CustomPlanRowFields";
import CustomPlanRowFlow, {
  CustomPlanRowSummaryFlow,
} from "@/components/land-manager/harvest/custom-plan/CustomPlanRowFlow";
import CustomPlanRowMenu from "@/components/land-manager/harvest/custom-plan/CustomPlanRowMenu";
import CustomPlanRowStatusIcon from "@/components/land-manager/harvest/custom-plan/CustomPlanRowStatusIcon";
import {
  CustomPlanRowStatus,
  describeCustomPlanRow,
  getCustomPlanRowStatus,
  rowResourceSymbol,
} from "@/components/land-manager/harvest/custom-plan/customPlanRowUtils";
import { renderResourceIcon } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import {
  CustomPlanRowDraft,
  CustomPlanRowValidation,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { DragIndicator, ExpandMore } from "@mui/icons-material";
import {
  Alert,
  Box,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

interface Props {
  draft: CustomPlanRowDraft;
  validation: CustomPlanRowValidation | null;
  regions: SplProductionOverviewRegion[];
  onChange: (updated: Partial<CustomPlanRowDraft>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEmptyRow?: boolean;
  /** Whether the editing controls are shown. The trailing empty row is always expanded. */
  expanded: boolean;
  onToggleExpanded: () => void;
  /** False while the row list is filtered, so reordering can't skip hidden rows. */
  dragEnabled?: boolean;
}

function borderColor(status: CustomPlanRowStatus, open: boolean): string {
  if (status === "error") return "error.main";
  if (status === "skipped") return "warning.main";
  if (status === "valid" && open) return "success.main";
  return "divider";
}

function RowSubtitle({
  status,
  validation,
}: {
  status: CustomPlanRowStatus;
  validation: CustomPlanRowValidation | null;
}) {
  const [color, text] =
    status === "error"
      ? ["error.main", validation?.error]
      : status === "skipped"
        ? [
            "warning.main",
            `Skipped${validation?.skipReason ? ` – ${validation.skipReason}` : ""}`,
          ]
        : status === "incomplete"
          ? ["text.secondary", "Incomplete – fill in the remaining fields"]
          : status === "new"
            ? ["text.secondary", "Choose an action to add it to the plan"]
            : [null, null];
  if (!text) return null;
  return (
    <Typography variant="caption" color={color ?? undefined} component="div">
      {text}
    </Typography>
  );
}

export default function CustomPlanRow({
  draft,
  validation,
  regions,
  onChange,
  onDelete,
  onDuplicate,
  isEmptyRow,
  expanded,
  onToggleExpanded,
  dragEnabled = true,
}: Props) {
  const hasAction = !!draft.action_type;
  const status = getCustomPlanRowStatus(draft, validation, isEmptyRow);
  const isOpen = !!isEmptyRow || expanded;
  const symbol = rowResourceSymbol(draft);
  const canDrag = !isEmptyRow && dragEnabled;
  const isPoolAdd = draft.action_type === "pool";

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: borderColor(status, isOpen),
        borderStyle: isEmptyRow ? "dashed" : "solid",
        borderRadius: 1.5,
        mb: 0.75,
        bgcolor: "background.paper",
        opacity: isEmptyRow ? 0.8 : 1,
        overflow: "hidden",
      }}
    >
      {/* Header: the collapsed summary */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ px: 1, py: 0.75, flexWrap: { xs: "wrap", md: "nowrap" } }}
      >
        <DragIndicator
          fontSize="small"
          sx={{
            cursor: canDrag ? "grab" : "default",
            color: canDrag ? "text.secondary" : "text.disabled",
            visibility: isEmptyRow ? "hidden" : "visible",
          }}
        />
        <CustomPlanRowStatusIcon status={status} />
        {symbol && renderResourceIcon(symbol as Resource, 22)}

        <Box
          onClick={isEmptyRow ? undefined : onToggleExpanded}
          sx={{
            flex: "1 1 220px",
            minWidth: 0,
            cursor: isEmptyRow ? "default" : "pointer",
          }}
        >
          <Typography variant="body2" fontWeight={500} noWrap>
            {describeCustomPlanRow(draft, regions)}
          </Typography>
          {(hasAction || isEmptyRow) && (
            <RowSubtitle status={status} validation={validation} />
          )}
        </Box>

        {!isOpen && (
          <Box sx={{ ml: { md: "auto" }, flexShrink: 0 }}>
            <CustomPlanRowSummaryFlow
              validation={validation}
              isPoolAdd={isPoolAdd}
            />
          </Box>
        )}

        {!isEmptyRow && (
          <Stack direction="row" alignItems="center" sx={{ ml: "auto" }}>
            <Tooltip title={expanded ? "Collapse" : "Edit"}>
              <IconButton
                size="small"
                onClick={onToggleExpanded}
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse row" : "Expand row"}
              >
                <ExpandMore
                  fontSize="small"
                  sx={{
                    transition: "transform 150ms",
                    transform: expanded ? "rotate(180deg)" : "none",
                  }}
                />
              </IconButton>
            </Tooltip>
            <CustomPlanRowMenu onDuplicate={onDuplicate} onDelete={onDelete} />
          </Stack>
        )}
      </Stack>

      {/* Body: the editing controls */}
      <Collapse in={isOpen} unmountOnExit>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
            <CustomPlanRowFields
              draft={draft}
              regions={regions}
              onChange={onChange}
            />

            {validation?.error && hasAction && (
              <Alert severity="error" sx={{ mt: 1.25, py: 0.25 }}>
                <Typography variant="caption">{validation.error}</Typography>
              </Alert>
            )}
            {!validation?.error &&
              validation?.skipped &&
              validation.skipReason && (
                <Alert severity="warning" sx={{ mt: 1.25, py: 0.25 }}>
                  <Typography variant="caption">
                    {validation.skipReason}
                  </Typography>
                </Alert>
              )}

            {hasAction && <CustomPlanRowFlow validation={validation} />}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
