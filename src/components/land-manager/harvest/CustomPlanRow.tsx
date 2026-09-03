"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  CUSTOM_PLAN_ACTION_LABELS,
  CustomPlanActionType,
  CustomPlanAmountType,
  CustomPlanRowDraft,
  CustomPlanRowValidation,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  ArrowForward,
  CheckCircle,
  ContentCopy,
  Delete,
  DragIndicator,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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
  dragHandleProps?: Record<string, unknown>;
  isEmptyRow?: boolean;
}

function RegionSelect({
  label,
  value,
  regions,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  regions: SplProductionOverviewRegion[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <FormControl size="small" sx={{ minWidth: 140 }} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {regions.map((r) => (
          <MenuItem key={r.region_uid} value={r.region_uid}>
            {r.name || r.region_uid}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function ResourceSelect({
  label,
  value,
  exclude,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  exclude?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const options = NATURAL_RESOURCES.filter((r) => r !== exclude);
  return (
    <FormControl size="small" sx={{ minWidth: 120 }} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((sym) => (
          <MenuItem key={sym} value={sym}>
            {sym}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function AmountToggle({
  value,
  onChange,
  disabled,
  hidePercent,
}: {
  value: CustomPlanAmountType;
  onChange: (v: CustomPlanAmountType) => void;
  disabled?: boolean;
  hidePercent?: boolean;
}) {
  if (hidePercent) return null;
  return (
    <ToggleButtonGroup
      size="small"
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      disabled={disabled}
    >
      <ToggleButton value="abs" sx={{ px: 1, py: 0.3, fontSize: "0.7rem" }}>
        Abs
      </ToggleButton>
      <ToggleButton value="pct" sx={{ px: 1, py: 0.3, fontSize: "0.7rem" }}>
        %
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

function renderOutput(validation: CustomPlanRowValidation | null) {
  if (!validation || !validation.estimatedOutputSymbol) return null;
  return (
    <Stack direction="row" alignItems="center" gap={0.75}>
      {renderResourceChip(
        validation.estimatedOutputSymbol as Resource,
        validation.estimatedOutputAmount,
        true
      )}
      {validation.estimatedOutputSymbol2 &&
        validation.estimatedOutputAmount2 != null &&
        renderResourceChip(
          validation.estimatedOutputSymbol2 as Resource,
          validation.estimatedOutputAmount2,
          true
        )}
    </Stack>
  );
}

export default function CustomPlanRow({
  draft,
  validation,
  regions,
  onChange,
  onDelete,
  onDuplicate,
  dragHandleProps,
  isEmptyRow,
}: Props) {
  const actionType = draft.action_type as CustomPlanActionType | "";
  const hasAction = !!actionType;

  const borderColor = validation?.error
    ? "error.main"
    : validation?.valid
      ? "success.main"
      : "divider";

  const fromRegionOptions = regions;
  const toRegionOptions =
    actionType === "transfer"
      ? regions.filter((r) => r.region_uid !== draft.from_region_uid)
      : regions;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor,
        borderRadius: 1,
        p: 1,
        mb: 0.6,
        bgcolor: "background.paper",
        opacity: isEmptyRow ? 0.55 : 1,
      }}
    >
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Box
            {...(dragHandleProps ?? {})}
            sx={{
              cursor: isEmptyRow ? "default" : "grab",
              color: "text.disabled",
              display: "flex",
              alignItems: "center",
            }}
          >
            <DragIndicator fontSize="small" />
          </Box>

          <FormControl size="small" sx={{ minWidth: 115 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={draft.action_type}
              label="Action"
              onChange={(e) =>
                onChange({
                  action_type: e.target.value as CustomPlanActionType | "",
                  from_region_uid: "",
                  to_region_uid: "",
                  from_resource: "",
                  to_resource: "",
                  amount_type: "abs",
                  amount: "",
                })
              }
            >
              <MenuItem value="">
                <em>Select...</em>
              </MenuItem>
              {(
                Object.keys(CUSTOM_PLAN_ACTION_LABELS) as CustomPlanActionType[]
              ).map((k) => (
                <MenuItem key={k} value={k}>
                  {CUSTOM_PLAN_ACTION_LABELS[k]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {actionType === "transfer" && (
            <>
              <RegionSelect
                label="From"
                value={draft.from_region_uid}
                regions={fromRegionOptions}
                onChange={(v) => onChange({ from_region_uid: v })}
              />
              <ResourceSelect
                label="Resource"
                value={draft.from_resource}
                onChange={(v) => onChange({ from_resource: v })}
                disabled={!draft.from_region_uid}
              />
              <RegionSelect
                label="To"
                value={draft.to_region_uid}
                regions={toRegionOptions}
                onChange={(v) => onChange({ to_region_uid: v })}
                disabled={!draft.from_resource}
              />
              <AmountToggle
                value={draft.amount_type}
                onChange={(v) => onChange({ amount_type: v })}
                disabled={!draft.to_region_uid}
              />
            </>
          )}

          {actionType === "pool" && (
            <>
              <RegionSelect
                label="From"
                value={draft.from_region_uid}
                regions={fromRegionOptions}
                onChange={(v) => onChange({ from_region_uid: v })}
              />
              <ResourceSelect
                label="Resource"
                value={draft.from_resource}
                onChange={(v) => onChange({ from_resource: v })}
                disabled={!draft.from_region_uid}
              />
              <AmountToggle
                value={draft.amount_type}
                onChange={(v) => onChange({ amount_type: v })}
                disabled={!draft.from_resource}
              />
            </>
          )}

          {actionType === "buy" && (
            <>
              <RegionSelect
                label="To"
                value={draft.to_region_uid}
                regions={toRegionOptions}
                onChange={(v) => onChange({ to_region_uid: v })}
              />
              <ResourceSelect
                label="Resource"
                value={draft.from_resource}
                onChange={(v) => onChange({ from_resource: v })}
                disabled={!draft.to_region_uid}
              />
            </>
          )}

          {actionType === "sell" && (
            <>
              <RegionSelect
                label="From"
                value={draft.from_region_uid}
                regions={fromRegionOptions}
                onChange={(v) => onChange({ from_region_uid: v })}
              />
              <ResourceSelect
                label="Resource"
                value={draft.from_resource}
                onChange={(v) => onChange({ from_resource: v })}
                disabled={!draft.from_region_uid}
              />
              <AmountToggle
                value={draft.amount_type}
                onChange={(v) => onChange({ amount_type: v })}
                disabled={!draft.from_resource}
              />
            </>
          )}

          {actionType === "swap" && (
            <>
              <RegionSelect
                label="From"
                value={draft.from_region_uid}
                regions={fromRegionOptions}
                onChange={(v) => onChange({ from_region_uid: v })}
              />
              <ResourceSelect
                label="From Res"
                value={draft.from_resource}
                onChange={(v) =>
                  onChange({ from_resource: v, to_resource: "" })
                }
                disabled={!draft.from_region_uid}
              />
              <ResourceSelect
                label="To Res"
                value={draft.to_resource}
                exclude={draft.from_resource}
                onChange={(v) => onChange({ to_resource: v })}
                disabled={!draft.from_resource}
              />
              <RegionSelect
                label="To"
                value={draft.to_region_uid}
                regions={toRegionOptions}
                onChange={(v) => onChange({ to_region_uid: v })}
                disabled={!draft.to_resource}
              />
              <AmountToggle
                value={draft.amount_type}
                onChange={(v) => onChange({ amount_type: v })}
                disabled={!draft.to_region_uid}
              />
            </>
          )}

          {actionType === "pool_withdraw" && (
            <>
              <RegionSelect
                label="To"
                value={draft.to_region_uid}
                regions={toRegionOptions}
                onChange={(v) => onChange({ to_region_uid: v })}
              />
              <ResourceSelect
                label="Resource"
                value={draft.from_resource}
                onChange={(v) => onChange({ from_resource: v })}
                disabled={!draft.to_region_uid}
              />
              <AmountToggle
                value={draft.amount_type}
                onChange={(v) => onChange({ amount_type: v })}
                disabled={!draft.from_resource}
              />
            </>
          )}

          {hasAction && (
            <TextField
              size="small"
              label={
                actionType === "buy"
                  ? "Receive"
                  : draft.amount_type === "pct"
                    ? "Input %"
                    : "Input"
              }
              value={draft.amount}
              onChange={(e) => onChange({ amount: e.target.value })}
              sx={{ width: actionType === "buy" ? 110 : 95 }}
              inputProps={{ inputMode: "numeric" }}
            />
          )}

          {validation?.valid && (
            <Tooltip title="Valid">
              <CheckCircle color="success" fontSize="small" />
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            Balance (Before):
          </Typography>
          {validation?.balanceSymbol
            ? renderResourceChip(
                validation.balanceSymbol as Resource,
                validation.currentBalance,
                true
              )
            : null}

          <Typography variant="caption" color="text.secondary">
            Balance (After):
          </Typography>
          {validation?.balanceSymbol
            ? renderResourceChip(
                validation.balanceSymbol as Resource,
                validation.inputBalance,
                true
              )
            : null}

          {validation && validation.inputAmountAbsolute > 0 && (
            <Typography variant="caption" color="text.secondary">
              Input{" "}
              {renderResourceChip(
                validation.balanceSymbol as Resource,
                validation.inputAmountAbsolute,
                true
              )}
            </Typography>
          )}

          <ArrowForward sx={{ fontSize: 16, color: "text.secondary" }} />

          <Typography variant="caption" color="text.secondary">
            Estimated:
          </Typography>
          {renderOutput(validation)}

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
            {!isEmptyRow && (
              <>
                {onDuplicate && (
                  <Tooltip title="Duplicate row">
                    <IconButton size="small" onClick={onDuplicate}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Delete row">
                    <IconButton size="small" onClick={onDelete} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        </Stack>
      </Stack>

      {validation?.error && hasAction && (
        <Alert severity="error" sx={{ mt: 0.8, py: 0.25 }} icon={false}>
          <Typography variant="caption">{validation.error}</Typography>
        </Alert>
      )}
    </Box>
  );
}
