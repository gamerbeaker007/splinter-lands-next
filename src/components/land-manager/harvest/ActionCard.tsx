"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import SettingsIcon from "@mui/icons-material/Settings";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Box,
  ButtonBase,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { BroadcastResult } from "@/lib/frontend/splBroadcast";

/** Block explorer used for the transaction links on a success status. */
export const HIVE_EXPLORER_TX_URL = "https://hivehub.dev/tx/";

export type ActionCardStatusSeverity = "success" | "warning" | "error";

/**
 * One outcome of the action, shown as an icon in the card's bottom-left corner.
 * A single run can produce several at once (successful transactions alongside a
 * warning and an error), so these are always rendered as a list.
 */
export interface ActionCardStatus {
  severity: ActionCardStatusSeverity;
  /** Headline of the hover card, e.g. "Broadcast successful". */
  title: string;
  /** The error/warning text, or extra context for a success. */
  detail?: string;
  /** Transactions to link on {@link HIVE_EXPLORER_TX_URL}. */
  txIds?: string[];
}

/**
 * Translate a bulk-action hook's `result` / `error` / `warning` state into the
 * card's status list. Every row shares this mapping so one action's icons can
 * never mean something different from another's.
 */
export function buildActionStatuses({
  result,
  error,
  warning,
  successTitle = "Broadcast successful",
}: {
  result?: BroadcastResult | null;
  error?: string | null;
  warning?: string | null;
  successTitle?: string;
}): ActionCardStatus[] {
  const statuses: ActionCardStatus[] = [];
  if (result?.success) {
    statuses.push({
      severity: "success",
      title: successTitle,
      detail:
        result.txIds.length > 1
          ? `${result.txIds.length} transactions confirmed`
          : result.txIds.length === 0
            ? "No transaction id was returned"
            : undefined,
      txIds: result.txIds,
    });
  }
  if (warning)
    statuses.push({ severity: "warning", title: "Warning", detail: warning });
  if (error)
    statuses.push({ severity: "error", title: "Error", detail: error });
  return statuses;
}

const STATUS_ICONS: Record<ActionCardStatusSeverity, typeof CheckCircleIcon> = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
};

const STATUS_COLORS: Record<ActionCardStatusSeverity, string> = {
  success: "success.main",
  warning: "warning.main",
  error: "error.main",
};

/**
 * The status icons themselves. They sit ABOVE the card button rather than
 * inside it: the success hover card carries real links, and a link nested in a
 * button is neither clickable nor valid markup.
 */
function ActionCardStatusIcons({ statuses }: { statuses: ActionCardStatus[] }) {
  if (statuses.length === 0) return null;
  return (
    <Stack
      direction="row"
      gap={0.25}
      sx={{ position: "absolute", bottom: 4, left: 6, zIndex: 2 }}
      onClick={(e) => e.stopPropagation()}
    >
      {statuses.map((status, idx) => {
        const Icon = STATUS_ICONS[status.severity];
        return (
          <Tooltip
            key={`${status.severity}-${idx}`}
            title={
              <Stack gap={0.5} sx={{ py: 0.5, maxWidth: 260 }}>
                <Typography variant="caption" fontWeight={700}>
                  {status.title}
                </Typography>
                {status.detail && (
                  <Typography variant="caption">{status.detail}</Typography>
                )}
                {status.txIds?.map((txId) => (
                  <Link
                    key={txId}
                    href={`${HIVE_EXPLORER_TX_URL}${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                    sx={{ wordBreak: "break-all" }}
                  >
                    {`${txId.slice(0, 8)}`}
                  </Link>
                ))}
              </Stack>
            }
          >
            <Icon
              fontSize="small"
              aria-label={`${status.severity}: ${status.title}`}
              role="img"
              sx={{ fontSize: 18, color: STATUS_COLORS[status.severity] }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
}

// Every card in the bulk action panel is exactly this size, so the row reads as
// a set of equal tiles no matter how much strategy text each one carries.
export const ACTION_CARD_WIDTH = 260;
export const ACTION_CARD_HEIGHT = 200;

interface Props {
  /** Ordered action name, e.g. "1. Make Harvestable". */
  title: string;
  /** Background image that gives the action its visual identity. */
  backgroundImage: string;
  /** Icon rendered above the title; swapped for a spinner while busy. */
  icon: ReactNode;
  /** Accent colour used for the border and the icon. */
  accentColor: string;
  /** Strategy summary shown under the title (chips, text, …). */
  strategy?: ReactNode;
  /** Outcomes of the last run, rendered as icons in the bottom-left corner. */
  statuses?: ActionCardStatus[];
  tooltip: string;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Opens the config section for this action; omitted when there is none. */
  onSettings?: () => void;
  settingsLabel?: string;
}

export default function ActionCard({
  title,
  backgroundImage,
  icon,
  accentColor,
  strategy,
  statuses = [],
  tooltip,
  busy = false,
  disabled = false,
  onClick,
  onSettings,
  settingsLabel,
}: Props) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: ACTION_CARD_HEIGHT,
      }}
    >
      <Tooltip title={tooltip}>
        {/* The span keeps the tooltip working while the button is disabled. */}
        <span style={{ display: "block", width: "100%" }}>
          <ButtonBase
            focusRipple
            disabled={disabled}
            onClick={onClick}
            aria-label={title}
            sx={{
              width: "100%",
              height: ACTION_CARD_HEIGHT,
              borderRadius: 2,
              overflow: "hidden",
              border: 1,
              borderColor: disabled ? "divider" : accentColor,
              textAlign: "center",
              opacity: disabled ? 0.5 : 1,
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": { boxShadow: 4 },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: accentColor,
                outlineOffset: 2,
              },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.35,
              }}
            />
            <Box
              aria-hidden="true"
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "background.paper",
                opacity: 0.55,
              }}
            />

            <Stack
              sx={{ position: "relative", zIndex: 1, px: 1, width: "100%" }}
              alignItems="center"
              justifyContent="center"
              gap={0.5}
            >
              <Box sx={{ color: accentColor, display: "flex" }}>
                {busy ? <CircularProgress size={22} color="inherit" /> : icon}
              </Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {title}
              </Typography>
              {strategy && (
                <Stack
                  direction="row"
                  gap={0.5}
                  flexWrap="wrap"
                  justifyContent="center"
                >
                  {strategy}
                </Stack>
              )}
            </Stack>
          </ButtonBase>
        </span>
      </Tooltip>

      <ActionCardStatusIcons statuses={statuses} />

      {onSettings && (
        <Tooltip title={settingsLabel ?? `${title} settings`}>
          <IconButton
            size="small"
            aria-label={settingsLabel ?? `${title} settings`}
            onClick={onSettings}
            sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

/**
 * Flex item that holds one action card plus the alerts that action raises.
 * Fixed basis with no grow so every card keeps identical dimensions, and the
 * row wraps onto the next line on narrow screens.
 */
export function ActionCardColumn({ children }: { children: ReactNode }) {
  return (
    <Stack
      gap={0.5}
      sx={{
        width: ACTION_CARD_WIDTH,
        maxWidth: ACTION_CARD_WIDTH,
      }}
    >
      {children}
    </Stack>
  );
}
