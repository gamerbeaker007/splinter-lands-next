"use client";

import { FOIL_IDS, foilLabel } from "@/lib/utils/cardUtil";
import {
  RENTAL_STRATEGY_LABELS,
  RentalConfig,
  RentalStrategy,
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
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

interface Props {
  rental: RentalConfig;
  onChange: (rental: RentalConfig) => void;
}

const BATCH_PRESETS: Array<{ label: string; value: number }> = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "All", value: 0 }, // 0 is the sentinel for null (no limit)
];

export default function RentEmptyWorkersSection({ rental, onChange }: Props) {
  const setNumber = (key: keyof RentalConfig, value: string) => {
    const parsed = Number(value);
    onChange({
      ...rental,
      [key]: Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0,
    });
  };

  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Rent Empty Workers — Settings
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          Strategy and spending caps for renting cards into empty worker slots
          on powered plots. Use 0 to disable a cap.
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
              Object.entries(RENTAL_STRATEGY_LABELS) as [
                RentalStrategy,
                string,
              ][]
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

        {/* Batch size */}
        <Stack gap={0.5} mb={2}>
          <Typography variant="caption" fontWeight="bold">
            Plots per run (batch size)
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={rental.rental_batch_size ?? 0}
            onChange={(_, val: number | null) => {
              // val is null when the same button is re-clicked (MUI deselect).
              // Treat that as "keep current". Otherwise convert 0 sentinel → null (All).
              if (val === null) return;
              onChange({
                ...rental,
                rental_batch_size: val === 0 ? null : val,
              });
            }}
          >
            {BATCH_PRESETS.map(({ label, value }) => (
              <ToggleButton key={label} value={value}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="caption">
              <strong>Smaller batches = better market matches.</strong> Each run
              re-fetches live market data, so running 10 slots at a time lets
              you catch fresher listings between batches. Larger batches process
              more slots at once but market prices may shift during the run —
              the first slots get the best picks; later slots see what&apos;s
              left after earlier selections.
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Skip cards whose foil rank is below this. Regular = include all.
            </Typography>
          </FormControl>
        </Stack>

        {/* Land renters only */}
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
              When enabled, the Renew Rentals flow skips cards that are rented
              but not currently staked on a land plot. Useful if you rent cards
              for multiple purposes and only want to renew those actively
              working.
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
      </AccordionDetails>
    </Accordion>
  );
}
