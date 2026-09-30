"use client";

import type { AlertSeverity } from "@/lib/frontend/landManagerAlerts";
import { ErrorOutline, InfoOutlined, WarningAmber } from "@mui/icons-material";
import { Stack, SvgIconProps, Tooltip, Typography } from "@mui/material";
import { ComponentType } from "react";

const BADGES: {
  severity: AlertSeverity;
  label: string;
  color: string;
  Icon: ComponentType<SvgIconProps>;
}[] = [
  { severity: "error", label: "High", color: "error.main", Icon: ErrorOutline },
  {
    severity: "warning",
    label: "Medium",
    color: "warning.main",
    Icon: WarningAmber,
  },
  { severity: "info", label: "Low", color: "info.main", Icon: InfoOutlined },
];

/** "x ⛔ / y ⚠ / z ℹ" — the number of alerts present per severity. */
export default function AlertCountBadges({
  counts,
  size = 16,
}: {
  counts: Record<AlertSeverity, number>;
  size?: number;
}) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75} component="span">
      {BADGES.map(({ severity, label, color, Icon }, i) => (
        <Tooltip key={severity} title={`${label} alerts`}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.25}
            component="span"
            sx={{ opacity: counts[severity] === 0 ? 0.5 : 1 }}
          >
            {i > 0 && (
              <Typography
                component="span"
                variant="body2"
                color="text.disabled"
                sx={{ mr: 0.5 }}
              >
                /
              </Typography>
            )}
            <Typography component="span" variant="body2" fontWeight={600}>
              {counts[severity]}
            </Typography>
            <Icon sx={{ fontSize: size, color }} />
          </Stack>
        </Tooltip>
      ))}
    </Stack>
  );
}
