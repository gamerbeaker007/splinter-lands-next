"use client";

import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  ButtonBase,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";

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
