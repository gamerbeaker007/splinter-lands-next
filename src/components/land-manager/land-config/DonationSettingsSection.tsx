"use client";

import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import React from "react";
import {
  DEFAULT_DONATION_DAILY_CAPS,
  DonationConfig,
} from "@/types/landManager";
import { InfoOutlined } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

interface Props {
  donation: DonationConfig;
  onChange: (donation: DonationConfig) => void;
}

export default function DonationSettingsSection({ donation, onChange }: Props) {
  const setField = <K extends keyof DonationConfig>(
    key: K,
    value: DonationConfig[K]
  ) => onChange({ ...donation, [key]: value });

  const setCap = (symbol: string, value: string) => {
    const parsed = Number(value);
    onChange({
      ...donation,
      daily_caps: {
        ...donation.daily_caps,
        [symbol]:
          Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0,
      },
    });
  };

  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Donation Settings</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          Configure optional donation transfers after harvest. Set a daily cap
          per resource to limit total donations on a single day across all
          regions.
        </Typography>

        <Stack gap={1.5}>
          <FormControlLabel
            control={
              <Checkbox
                checked={donation.enabled}
                onChange={(e) => setField("enabled", e.target.checked)}
              />
            }
            label={<Typography variant="body2">Enable donations</Typography>}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <Box sx={{ width: { xs: "100%", sm: "42%" } }}>
              <Typography
                variant="caption"
                fontWeight="bold"
                display="block"
                mb={1}
              >
                Percentage
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Donation %"
                value={donation.pct}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  const next = Number.isFinite(parsed)
                    ? Math.max(0, Math.min(100, Math.floor(parsed)))
                    : 0;
                  setField("pct", next);
                }}
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
                helperText="Current default is 2%."
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "58%" } }}>
              <Typography
                variant="caption"
                fontWeight="bold"
                display="block"
                mb={1}
              >
                Daily caps
              </Typography>
              <Stack spacing={1}>
                {Object.keys(DEFAULT_DONATION_DAILY_CAPS).map((symbol) => (
                  <Stack
                    key={symbol}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Tooltip title={symbol}>
                      <Box
                        component="img"
                        src={RESOURCE_ICON_MAP[symbol]}
                        alt={symbol}
                        sx={{ width: 22, height: 22, flexShrink: 0 }}
                      />
                    </Tooltip>
                    <TextField
                      size="small"
                      type="number"
                      value={donation.daily_caps[symbol] ?? 0}
                      onChange={(e) => setCap(symbol, e.target.value)}
                      slotProps={{ htmlInput: { min: 0 } }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                ))}
              </Stack>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="flex-start"
                mt={1}
              >
              </Stack>
            </Box>
          </Stack>
        </Stack>

        {/* How donations work — info box */}
        <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="flex-start" mb={1}>
            <InfoOutlined sx={{ fontSize: 14, color: "text.secondary", mt: 0.25, flexShrink: 0 }} />
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              How donations work
            </Typography>
          </Stack>
          <Stack spacing={0.75} sx={{ pl: 2.5 }}>
            {([
              <><strong>10% land tax</strong> (Castles &amp; Keeps) is deducted by the game before harvest — donation % is applied to the post-tax harvestable amount.</>,
              <><strong>Daily cap is cumulative across all regions</strong>. If Region A uses 38,000 of a 40,000 GRAIN cap, Region B&apos;s donation is trimmed to the remaining 2,000 — not dropped entirely.</>,
              <>Donations below <strong>5 units</strong> per resource per region are automatically skipped as too small to be worth the transaction cost.</>,
            ] as React.ReactNode[]).map((text, i) => (
              <Stack key={i} direction="row" spacing={0.75}>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, lineHeight: 1.6 }}>•</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>{text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </AccordionDetails>
    </Accordion>
  );
}
