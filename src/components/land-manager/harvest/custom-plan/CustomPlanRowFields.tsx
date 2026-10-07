"use client";

import { renderResourceIcon } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  CUSTOM_PLAN_ACTION_LABELS,
  CustomPlanActionType,
  CustomPlanAmountType,
  CustomPlanRowDraft,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

type DraftKey = keyof Omit<CustomPlanRowDraft, "draftId">;

type FieldSpec =
  | {
      kind: "region";
      key: "from_region_uid" | "to_region_uid";
      label: string;
      /** Disabled until this field has a value. */
      requires?: DraftKey;
    }
  | {
      kind: "resource";
      key: "from_resource" | "to_resource";
      label: string;
      requires?: DraftKey;
      /** Hide the row's from_resource from the options (swap target). */
      excludeFromResource?: boolean;
      /** Extra fields reset when this one changes. */
      clears?: Partial<CustomPlanRowDraft>;
    };

interface ActionSpec {
  fields: FieldSpec[];
  /** Field that unlocks the Abs/% toggle; `null` means the action has none. */
  amountToggleRequires: DraftKey | null;
}

// Each action's inputs in display order. Every field unlocks once the field
// before it is set, which is the enable chain the row has always had.
const ACTION_FIELDS: Record<CustomPlanActionType, ActionSpec> = {
  transfer: {
    fields: [
      { kind: "region", key: "from_region_uid", label: "From" },
      {
        kind: "resource",
        key: "from_resource",
        label: "Resource",
        requires: "from_region_uid",
      },
      {
        kind: "region",
        key: "to_region_uid",
        label: "To",
        requires: "from_resource",
      },
    ],
    amountToggleRequires: "to_region_uid",
  },
  pool: {
    fields: [
      { kind: "region", key: "from_region_uid", label: "From" },
      {
        kind: "resource",
        key: "from_resource",
        label: "Resource",
        requires: "from_region_uid",
      },
    ],
    amountToggleRequires: "from_resource",
  },
  buy: {
    fields: [
      { kind: "region", key: "to_region_uid", label: "To" },
      {
        kind: "resource",
        key: "from_resource",
        label: "Resource",
        requires: "to_region_uid",
      },
    ],
    amountToggleRequires: null,
  },
  sell: {
    fields: [
      { kind: "region", key: "from_region_uid", label: "From" },
      {
        kind: "resource",
        key: "from_resource",
        label: "Resource",
        requires: "from_region_uid",
      },
    ],
    amountToggleRequires: "from_resource",
  },
  swap: {
    fields: [
      { kind: "region", key: "from_region_uid", label: "From" },
      {
        kind: "resource",
        key: "from_resource",
        label: "From Res",
        requires: "from_region_uid",
        clears: { to_resource: "" },
      },
      {
        kind: "resource",
        key: "to_resource",
        label: "To Res",
        requires: "from_resource",
        excludeFromResource: true,
      },
      {
        kind: "region",
        key: "to_region_uid",
        label: "To",
        requires: "to_resource",
      },
    ],
    amountToggleRequires: "to_region_uid",
  },
  pool_withdraw: {
    fields: [
      { kind: "region", key: "to_region_uid", label: "To" },
      {
        kind: "resource",
        key: "from_resource",
        label: "Resource",
        requires: "to_region_uid",
      },
    ],
    amountToggleRequires: "from_resource",
  },
  stake_dec: {
    fields: [{ kind: "region", key: "to_region_uid", label: "To" }],
    amountToggleRequires: "to_region_uid",
  },
};

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

function ResourceLabel({ symbol }: { symbol: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75}>
      {renderResourceIcon(symbol as Resource)}
      {symbol}
    </Stack>
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
    <FormControl size="small" sx={{ minWidth: 130 }} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(sym) => <ResourceLabel symbol={sym} />}
      >
        {options.map((sym) => (
          <MenuItem key={sym} value={sym}>
            <ResourceLabel symbol={sym} />
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
}: {
  value: CustomPlanAmountType;
  onChange: (v: CustomPlanAmountType) => void;
  disabled?: boolean;
}) {
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

interface Props {
  draft: CustomPlanRowDraft;
  regions: SplProductionOverviewRegion[];
  onChange: (updated: Partial<CustomPlanRowDraft>) => void;
}

/** All editing inputs of one plan row: action, its fields and the amount. */
export default function CustomPlanRowFields({
  draft,
  regions,
  onChange,
}: Props) {
  const actionType = draft.action_type as CustomPlanActionType | "";
  const spec = actionType ? ACTION_FIELDS[actionType] : null;
  const isUnset = (key?: DraftKey) => !!key && !draft[key];

  const toRegionOptions =
    actionType === "transfer"
      ? regions.filter((r) => r.region_uid !== draft.from_region_uid)
      : regions;

  return (
    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>Action</InputLabel>
        <Select
          value={draft.action_type}
          label="Action"
          onChange={(e) =>
            // Switching action starts the row over.
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

      {spec?.fields.map((field) =>
        field.kind === "region" ? (
          <RegionSelect
            key={field.key}
            label={field.label}
            value={draft[field.key]}
            regions={field.key === "to_region_uid" ? toRegionOptions : regions}
            onChange={(v) => onChange({ [field.key]: v })}
            disabled={isUnset(field.requires)}
          />
        ) : (
          <ResourceSelect
            key={field.key}
            label={field.label}
            value={draft[field.key]}
            exclude={
              field.excludeFromResource ? draft.from_resource : undefined
            }
            onChange={(v) => onChange({ [field.key]: v, ...field.clears })}
            disabled={isUnset(field.requires)}
          />
        )
      )}

      {spec && (
        <Stack direction="row" alignItems="center" gap={0.75}>
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
          {spec.amountToggleRequires !== null && (
            <AmountToggle
              value={draft.amount_type}
              onChange={(v) => onChange({ amount_type: v })}
              disabled={isUnset(spec.amountToggleRequires)}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}
