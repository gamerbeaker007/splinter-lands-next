"use client";

import { FOIL_IDS, foilLabel } from "@/lib/utils/cardUtil";
import {
  RENTAL_STRATEGY_LABELS,
  normalizeWorkerBatchSize,
  RentalConfig,
  RentalStrategy,
  WORKER_BATCH_SIZE_MAX,
  WORKER_BATCH_SIZE_MIN,
} from "@/types/landManager";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type LayoutMode = "accordion" | "flat";

interface Props {
  rental: RentalConfig;
  onChange: (rental: RentalConfig) => void;
  layout?: LayoutMode;
}

export default function RentEmptyWorkersSection({
  rental,
  onChange,
  layout = "accordion",
}: Props) {
  const setNumber = (key: keyof RentalConfig, value: string) => {
    const parsed = Number(value);
    onChange({
      ...rental,
      [key]: Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0,
    });
  };

  const content = (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={1}
      >
        Strategy and spending caps for renting cards into empty worker slots on
        powered plots. Use 0 to disable a cap.
      </Typography>

      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <Typography variant="caption" fontWeight="bold" mb={0.5}>
          Strategy
        </Typography>
        <RadioGroup
          value={rental.strategy}
          onChange={(e) =>
            onChange({
              ...rental,
              strategy: e.target.value as RentalStrategy,
            })
          }
        >
          {(
            Object.entries(RENTAL_STRATEGY_LABELS) as [RentalStrategy, string][]
          ).map(([value, label]) => (
            <FormControlLabel
              key={value}
              value={value}
              control={<Radio size="small" />}
              label={<Typography variant="body2">{label}</Typography>}
              sx={{ mb: 0.5 }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Stack gap={0.5} mb={2}>
        <Typography variant="caption" fontWeight="bold">
          Plots per run (batch size):{" "}
          {normalizeWorkerBatchSize(rental.rental_batch_size)}
        </Typography>
        <Slider
          size="small"
          min={WORKER_BATCH_SIZE_MIN}
          max={WORKER_BATCH_SIZE_MAX}
          step={1}
          value={normalizeWorkerBatchSize(rental.rental_batch_size)}
          valueLabelDisplay="auto"
          marks={[
            { value: WORKER_BATCH_SIZE_MIN, label: `${WORKER_BATCH_SIZE_MIN}` },
            { value: WORKER_BATCH_SIZE_MAX, label: `${WORKER_BATCH_SIZE_MAX}` },
          ]}
          onChange={(_, value) => {
            onChange({
              ...rental,
              rental_batch_size: Array.isArray(value) ? value[0] : value,
            });
          }}
          sx={{ mx: 1, width: "calc(100% - 16px)" }}
        />
        <Alert severity="info" sx={{ py: 0.5 }}>
          <Typography variant="caption">
            <strong>Smaller batches = better market matches.</strong> Each run
            re-fetches live market data. Each run processes at most 100 plots;
            smaller batches let you catch fresher listings between runs.
          </Typography>
        </Alert>
      </Stack>

      <Stack gap={1.5}>
        <TextField
          size="small"
          type="number"
          label="Max total DEC (whole run)"
          value={rental.max_total_dec}
          onChange={(e) => setNumber("max_total_dec", e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
          helperText="0 = no limit. Total DEC you'll spend on this run — factors in rental_days × DEC/day for every pick."
        />
        <TextField
          size="small"
          type="number"
          label="Max DEC/day per worker"
          value={rental.max_dec_per_day_per_worker}
          onChange={(e) =>
            setNumber("max_dec_per_day_per_worker", e.target.value)
          }
          slotProps={{ htmlInput: { min: 0 } }}
          helperText="0 = no limit. Max daily rental rate per single card. Card types whose cheapest listing exceeds this are skipped before fetch."
        />
        <TextField
          size="small"
          type="number"
          label="Min land_base_pp per card"
          value={rental.min_land_base_pp}
          onChange={(e) => setNumber("min_land_base_pp", e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
          helperText="0 = no minimum. Skip cards whose land_base_pp is below this."
        />
        <FormControl size="small">
          <InputLabel id="rental-min-foil-label">Minimum foil</InputLabel>
          <Select
            labelId="rental-min-foil-label"
            label="Minimum foil"
            value={rental.min_foil}
            onChange={(e) =>
              onChange({ ...rental, min_foil: Number(e.target.value) })
            }
          >
            {FOIL_IDS.map((f) => (
              <MenuItem key={f} value={f}>
                {foilLabel(f)}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Skip cards whose foil rank is below this. Regular = include all.
          </Typography>
        </FormControl>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mt={2}
      >
        <Stack>
          <Typography variant="body2" fontWeight="bold">
            Terrain boost only
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Only consider cards that get a positive terrain boost on the target
            plot. Cards with neutral or negative terrain interaction are
            ignored.
          </Typography>
        </Stack>
        <Switch
          checked={rental.terrain_boost_only}
          onChange={(e) =>
            onChange({ ...rental, terrain_boost_only: e.target.checked })
          }
          size="small"
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mt={2}
      >
        <Stack>
          <Typography variant="body2" fontWeight="bold">
            Land renters only (Renew Rentals)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            When enabled, the Renew Rentals flow skips cards that are rented but
            not currently staked on a land plot. Useful if you rent cards for
            multiple purposes and only want to renew those actively working.
          </Typography>
        </Stack>
        <Switch
          checked={rental.land_renters_only}
          onChange={(e) =>
            onChange({ ...rental, land_renters_only: e.target.checked })
          }
          size="small"
        />
      </Stack>
    </>
  );

  if (layout === "flat") {
    return (
      <Stack>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Rent Empty Workers - Settings
        </Typography>
        {content}
      </Stack>
    );
  }

  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Rent Empty Workers — Settings
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{content}</AccordionDetails>
    </Accordion>
  );
}
