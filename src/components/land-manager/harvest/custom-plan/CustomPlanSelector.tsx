"use client";

import {
  CustomPlan,
  MAX_CUSTOM_PLAN_NAME_LENGTH,
  MAX_CUSTOM_PLANS_PER_PLAYER,
} from "@/types/landManager";
import {
  Add,
  Check,
  Close,
  Delete,
  DriveFileRenameOutline,
  Star,
  StarBorder,
} from "@mui/icons-material";
import {
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { KeyboardEvent, useState } from "react";

interface Props {
  savedPlans: CustomPlan[];
  selectedPlan: CustomPlan | null;
  /** Name typed for a new, not yet saved plan. */
  planName: string;
  nameError: string | null;
  onPlanNameChange: (name: string) => void;
  onSelect: (planId: string | null) => void;
  onNew: () => void;
  onToggleDefault: () => void;
  /** Resolves true when the rename succeeded. */
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
}

const NEW_PLAN_VALUE = "";

/**
 * The plan's title in the overview: a saved-plan picker that turns into a
 * text field in place while renaming, plus default / rename / delete / new.
 */
export default function CustomPlanSelector({
  savedPlans,
  selectedPlan,
  planName,
  nameError,
  onPlanNameChange,
  onSelect,
  onNew,
  onToggleDefault,
  onRename,
  onDelete,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const isDefault = selectedPlan?.is_default ?? false;
  const canCreate = savedPlans.length < MAX_CUSTOM_PLANS_PER_PLAYER;

  function startRename() {
    if (!selectedPlan) return;
    setRenameValue(selectedPlan.name);
    setRenaming(true);
  }

  async function submitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    if (await onRename(trimmed)) setRenaming(false);
  }

  function onRenameKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") submitRename();
    if (e.key === "Escape") {
      // Keep Escape from also closing the dialog.
      e.stopPropagation();
      setRenaming(false);
    }
  }

  if (renaming && selectedPlan) {
    return (
      <TextField
        size="small"
        autoFocus
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        onKeyDown={onRenameKeyDown}
        inputProps={{
          maxLength: MAX_CUSTOM_PLAN_NAME_LENGTH,
          "aria-label": "Plan name",
        }}
        sx={{ width: 300, maxWidth: "100%" }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Save name">
                <span>
                  <IconButton
                    size="small"
                    onClick={submitRename}
                    disabled={!renameValue.trim()}
                    color="primary"
                  >
                    <Check fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={() => setRenaming(false)}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
    );
  }

  return (
    <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
      {savedPlans.length > 0 && (
        <Select
          size="small"
          value={selectedPlan?.id ?? NEW_PLAN_VALUE}
          onChange={(e) => onSelect(e.target.value || null)}
          displayEmpty
          inputProps={{ "aria-label": "Saved plan" }}
          sx={{ minWidth: 200, maxWidth: 320 }}
          // The selected value shows the name only: the ★ button beside it
          // already says whether it is the default.
          renderValue={(id) => (
            <Typography fontWeight={600} noWrap>
              {savedPlans.find((p) => p.id === id)?.name ?? <em>New plan</em>}
            </Typography>
          )}
        >
          {savedPlans.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              <Stack direction="row" gap={0.5} alignItems="center">
                {p.is_default && (
                  <Star fontSize="inherit" sx={{ color: "warning.main" }} />
                )}
                {p.name}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      )}

      {!selectedPlan && (
        <TextField
          size="small"
          placeholder="Plan name"
          value={planName}
          onChange={(e) => onPlanNameChange(e.target.value)}
          error={!!nameError}
          helperText={nameError}
          inputProps={{
            maxLength: MAX_CUSTOM_PLAN_NAME_LENGTH,
            "aria-label": "Plan name",
          }}
          sx={{ width: 240 }}
        />
      )}

      {selectedPlan && (
        <>
          <Tooltip
            title={
              isDefault
                ? "Default plan — click to unset"
                : "Make this the default plan (preselected when this dialog opens)"
            }
          >
            <IconButton
              size="small"
              color={isDefault ? "warning" : "default"}
              onClick={onToggleDefault}
              aria-label={
                isDefault ? "Unset default plan" : "Set as default plan"
              }
            >
              {isDefault ? (
                <Star fontSize="small" />
              ) : (
                <StarBorder fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Rename plan">
            <IconButton
              size="small"
              onClick={startRename}
              aria-label="Rename plan"
            >
              <DriveFileRenameOutline fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete plan">
            <IconButton
              size="small"
              color="error"
              onClick={onDelete}
              aria-label="Delete plan"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

      <Tooltip
        title={
          canCreate
            ? "New plan"
            : `You can save up to ${MAX_CUSTOM_PLANS_PER_PLAYER} plans`
        }
      >
        <span>
          <IconButton
            size="small"
            color="primary"
            onClick={onNew}
            disabled={!canCreate}
            aria-label="New plan"
          >
            <Add fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
