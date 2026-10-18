"use client";

import { FOIL_IDS, foilLabel } from "@/lib/utils/cardUtil";
import {
  BUY_STRATEGY_LABELS,
  BuyConfig,
  normalizeWorkerBatchSize,
  RENTAL_STRATEGY_LABELS,
  RentalConfig,
  WORKER_BATCH_SIZE_MAX,
  WORKER_BATCH_SIZE_MIN,
} from "@/types/landManager";
import {
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  MenuItem,
  Popover,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { MouseEvent } from "react";
import { useState } from "react";
import { formatFixed } from "@/lib/formatters";

type Mode = "rent" | "buy";
type Config = RentalConfig | BuyConfig;
type SettingKey =
  | "strategy"
  | "batch_size"
  | "max_total_dec"
  | "max_per_worker"
  | "min_land_base_pp"
  | "min_foil"
  | "terrain_boost_only";

interface Props {
  mode: Mode;
  config: Config;
  savedDefault: Config;
  onChange: (config: Config) => void;
}

const settingLabels: Record<SettingKey, string> = {
  strategy: "Strategy",
  batch_size: "Plots per run",
  max_total_dec: "Max total DEC",
  max_per_worker: "Max DEC per worker",
  min_land_base_pp: "Minimum PP",
  min_foil: "Minimum foil",
  terrain_boost_only: "Terrain boost only",
};

function strategyLabel(mode: Mode, config: Config): string {
  return mode === "rent"
    ? RENTAL_STRATEGY_LABELS[(config as RentalConfig).strategy]
    : BUY_STRATEGY_LABELS[(config as BuyConfig).strategy];
}

function settingValue(mode: Mode, config: Config, key: SettingKey): string {
  if (key === "strategy") return strategyLabel(mode, config);
  if (key === "batch_size") {
    return `${normalizeWorkerBatchSize(
      mode === "rent"
        ? (config as RentalConfig).rental_batch_size
        : (config as BuyConfig).buy_batch_size
    )} plots`;
  }
  if (key === "max_total_dec") {
    return config.max_total_dec > 0
      ? `${formatFixed(config.max_total_dec)} DEC`
      : "No cap";
  }
  if (key === "max_per_worker") {
    const value =
      mode === "rent"
        ? (config as RentalConfig).max_dec_per_day_per_worker
        : (config as BuyConfig).max_dec_per_worker;
    return value > 0
      ? `${formatFixed(value)} ${mode === "rent" ? "DEC/day" : "DEC"}`
      : "No cap";
  }
  if (key === "min_land_base_pp") {
    return config.min_land_base_pp > 0
      ? `${formatFixed(config.min_land_base_pp)} PP`
      : "No minimum";
  }
  if (key === "min_foil") {
    return foilLabel(config.min_foil);
  }
  return config.terrain_boost_only ? "Required" : "Any";
}

function settingChanged(
  mode: Mode,
  config: Config,
  savedDefault: Config,
  key: SettingKey
): boolean {
  if (key === "batch_size") {
    return (
      normalizeWorkerBatchSize(
        mode === "rent"
          ? (config as RentalConfig).rental_batch_size
          : (config as BuyConfig).buy_batch_size
      ) !==
      normalizeWorkerBatchSize(
        mode === "rent"
          ? (savedDefault as RentalConfig).rental_batch_size
          : (savedDefault as BuyConfig).buy_batch_size
      )
    );
  }
  if (key === "max_per_worker") {
    return mode === "rent"
      ? (config as RentalConfig).max_dec_per_day_per_worker !==
          (savedDefault as RentalConfig).max_dec_per_day_per_worker
      : (config as BuyConfig).max_dec_per_worker !==
          (savedDefault as BuyConfig).max_dec_per_worker;
  }
  if (key === "strategy") {
    return config.strategy !== savedDefault.strategy;
  }
  return config[key] !== savedDefault[key];
}

export default function InlineWorkerSettings({
  mode,
  config,
  savedDefault,
  onChange,
}: Readonly<Props>) {
  const [active, setActive] = useState<{
    key: SettingKey;
    anchor: HTMLElement;
  } | null>(null);

  const open = (key: SettingKey) => (event: MouseEvent<HTMLElement>) =>
    setActive({ key, anchor: event.currentTarget });

  const updateNumber = (key: SettingKey, raw: string) => {
    const value = Math.max(0, Number(raw) || 0);
    if (mode === "rent") {
      const rental = config as RentalConfig;
      const next: RentalConfig =
        key === "max_total_dec"
          ? { ...rental, max_total_dec: value }
          : key === "max_per_worker"
            ? { ...rental, max_dec_per_day_per_worker: value }
            : { ...rental, min_land_base_pp: value };
      onChange(next);
    } else {
      const buy = config as BuyConfig;
      const next: BuyConfig =
        key === "max_total_dec"
          ? { ...buy, max_total_dec: value }
          : key === "max_per_worker"
            ? { ...buy, max_dec_per_worker: value }
            : { ...buy, min_land_base_pp: value };
      onChange(next);
    }
  };

  const setBatchSize = (value: number) => {
    if (mode === "rent") {
      onChange({
        ...(config as RentalConfig),
        rental_batch_size: normalizeWorkerBatchSize(value),
      });
    } else {
      onChange({
        ...(config as BuyConfig),
        buy_batch_size: normalizeWorkerBatchSize(value),
      });
    }
  };

  const updateField = (key: SettingKey, value: string | number | boolean) => {
    if (key === "strategy") {
      onChange(
        mode === "rent"
          ? {
              ...(config as RentalConfig),
              strategy: value as RentalConfig["strategy"],
            }
          : {
              ...(config as BuyConfig),
              strategy: value as BuyConfig["strategy"],
            }
      );
    } else if (key === "min_foil") {
      onChange({ ...config, min_foil: Number(value) });
    } else if (key === "terrain_boost_only") {
      onChange({ ...config, terrain_boost_only: Boolean(value) });
    }
  };

  const keys: SettingKey[] = [
    "strategy",
    "batch_size",
    "max_total_dec",
    "max_per_worker",
    "min_land_base_pp",
    "min_foil",
    "terrain_boost_only",
  ];
  const activeKey = active?.key;

  return (
    <>
      <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center">
        {keys.map((key) => {
          const changed = settingChanged(mode, config, savedDefault, key);
          return (
            <Chip
              key={key}
              component="button"
              type="button"
              size="small"
              variant={changed ? "filled" : "outlined"}
              color={changed ? "warning" : "default"}
              onClick={open(key)}
              label={`${settingLabels[key]}: ${settingValue(mode, config, key)}`}
              sx={{ cursor: "pointer" }}
            />
          );
        })}
      </Stack>
      <Popover
        open={active !== null}
        anchorEl={active?.anchor}
        onClose={() => setActive(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {activeKey && (
          <Stack spacing={1.25} sx={{ p: 2, width: { xs: 280, sm: 340 } }}>
            <Typography variant="subtitle2">
              Edit {settingLabels[activeKey]}
            </Typography>
            {activeKey === "strategy" &&
              (mode === "rent" ? (
                <FormControl size="small">
                  <Select
                    value={(config as RentalConfig).strategy}
                    onChange={(event) =>
                      updateField("strategy", event.target.value)
                    }
                  >
                    {Object.entries(RENTAL_STRATEGY_LABELS).map(
                      ([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              ) : (
                <FormControl size="small">
                  <Select
                    value={(config as BuyConfig).strategy}
                    onChange={(event) =>
                      updateField("strategy", event.target.value)
                    }
                  >
                    {Object.entries(BUY_STRATEGY_LABELS).map(
                      ([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              ))}
            {activeKey === "batch_size" && (
              <Stack spacing={0.5}>
                <Typography variant="caption">
                  Plots per run:{" "}
                  {normalizeWorkerBatchSize(
                    mode === "rent"
                      ? (config as RentalConfig).rental_batch_size
                      : (config as BuyConfig).buy_batch_size
                  )}
                </Typography>
                <Slider
                  min={WORKER_BATCH_SIZE_MIN}
                  max={WORKER_BATCH_SIZE_MAX}
                  step={1}
                  value={normalizeWorkerBatchSize(
                    mode === "rent"
                      ? (config as RentalConfig).rental_batch_size
                      : (config as BuyConfig).buy_batch_size
                  )}
                  valueLabelDisplay="auto"
                  onChange={(_, value) =>
                    setBatchSize(Array.isArray(value) ? value[0] : value)
                  }
                />
              </Stack>
            )}
            {(activeKey === "max_total_dec" ||
              activeKey === "max_per_worker" ||
              activeKey === "min_land_base_pp") && (
              <TextField
                autoFocus
                size="small"
                type="number"
                label={
                  activeKey === "max_total_dec"
                    ? "Max total DEC (0 = no cap)"
                    : activeKey === "min_land_base_pp"
                      ? "Minimum base PP (0 = no minimum)"
                      : `Max per worker (${mode === "rent" ? "DEC/day" : "DEC"}, 0 = no cap)`
                }
                value={
                  activeKey === "max_total_dec"
                    ? config.max_total_dec
                    : activeKey === "min_land_base_pp"
                      ? config.min_land_base_pp
                      : mode === "rent"
                        ? (config as RentalConfig).max_dec_per_day_per_worker
                        : (config as BuyConfig).max_dec_per_worker
                }
                onChange={(event) =>
                  updateNumber(activeKey, event.target.value)
                }
                slotProps={{ htmlInput: { min: 0, step: "any" } }}
              />
            )}
            {activeKey === "min_foil" && (
              <FormControl size="small">
                <Select
                  value={config.min_foil}
                  onChange={(event) =>
                    updateField("min_foil", Number(event.target.value))
                  }
                >
                  {FOIL_IDS.map((foil) => (
                    <MenuItem key={foil} value={foil}>
                      {foilLabel(foil)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {activeKey === "terrain_boost_only" && (
              <FormControlLabel
                control={
                  <Switch
                    checked={config.terrain_boost_only}
                    onChange={(event) =>
                      updateField("terrain_boost_only", event.target.checked)
                    }
                  />
                }
                label="Only include workers with a terrain boost"
              />
            )}
            <Button size="small" onClick={() => setActive(null)}>
              Done
            </Button>
          </Stack>
        )}
      </Popover>
    </>
  );
}
