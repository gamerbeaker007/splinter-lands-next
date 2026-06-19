"use client";

import { FOIL_IDS, foilLabel } from "@/lib/utils/cardUtil";
import {
  BUY_BATCH_SIZE_MAX,
  BUY_BATCH_SIZE_MIN,
  BUY_STRATEGY_LABELS,
  BuyConfig,
  BuyStrategy,
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
  TextField,
  Typography,
} from "@mui/material";

interface Props {
  buy: BuyConfig;
  onChange: (buy: BuyConfig) => void;
}

export default function BuyEmptyWorkersSection({ buy, onChange }: Props) {
  const setNumber = (key: keyof BuyConfig, value: string) => {
    const parsed = Number(value);
    onChange({
      ...buy,
      [key]: Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0,
    });
  };

  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Buy Empty Workers — Settings
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          Strategy and spending caps for buying cards outright into empty worker
          slots on powered plots. Configured separately from renting. Use 0 to
          disable a cap.
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight="bold" mb={0.5}>
            Strategy
          </Typography>
          <RadioGroup
            value={buy.strategy}
            onChange={(e) =>
              onChange({ ...buy, strategy: e.target.value as BuyStrategy })
            }
          >
            {(
              Object.entries(BUY_STRATEGY_LABELS) as [BuyStrategy, string][]
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

        {/* Batch size — integer 1..50, step 1 */}
        <Stack gap={0.5} mb={2}>
          <Typography variant="caption" fontWeight="bold">
            Plots per run (batch size): {buy.buy_batch_size}
          </Typography>
          <Slider
            size="small"
            min={BUY_BATCH_SIZE_MIN}
            max={BUY_BATCH_SIZE_MAX}
            step={1}
            value={buy.buy_batch_size}
            valueLabelDisplay="auto"
            marks={[
              { value: BUY_BATCH_SIZE_MIN, label: `${BUY_BATCH_SIZE_MIN}` },
              { value: BUY_BATCH_SIZE_MAX, label: `${BUY_BATCH_SIZE_MAX}` },
            ]}
            onChange={(_, val) =>
              onChange({
                ...buy,
                buy_batch_size: Array.isArray(val) ? val[0] : val,
              })
            }
            sx={{ mx: 1, width: "calc(100% - 16px)" }}
          />
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="caption">
              <strong>Smaller batches = better market matches.</strong> Each run
              re-fetches live market data, so processing fewer plots at a time
              catches fresher listings between batches.
            </Typography>
          </Alert>
        </Stack>

        <Stack gap={1.5}>
          <TextField
            size="small"
            type="number"
            label="Max total DEC (whole run)"
            value={buy.max_total_dec}
            onChange={(e) => setNumber("max_total_dec", e.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
            helperText="0 = no limit. Total DEC you'll spend buying cards on this run."
          />
          <TextField
            size="small"
            type="number"
            label="Max DEC per worker"
            value={buy.max_dec_per_worker}
            onChange={(e) => setNumber("max_dec_per_worker", e.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
            helperText="0 = no limit. Max purchase price for a single card. Card types whose cheapest listing exceeds this are skipped before fetch."
          />
          <TextField
            size="small"
            type="number"
            label="Min land_base_pp per card"
            value={buy.min_land_base_pp}
            onChange={(e) => setNumber("min_land_base_pp", e.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
            helperText="0 = no minimum. Skip cards whose land_base_pp is below this."
          />
          <FormControl size="small">
            <InputLabel id="buy-min-foil-label">Minimum foil</InputLabel>
            <Select
              labelId="buy-min-foil-label"
              label="Minimum foil"
              value={buy.min_foil}
              onChange={(e) =>
                onChange({ ...buy, min_foil: Number(e.target.value) })
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
      </AccordionDetails>
    </Accordion>
  );
}
