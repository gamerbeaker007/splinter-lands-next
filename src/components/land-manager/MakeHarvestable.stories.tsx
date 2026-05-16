"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete, PlayArrow } from "@mui/icons-material";
import { SplLandPool } from "../../types/spl/landPools";
import { MakeHarvestableStrategy } from "../../types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "../../types/spl/landManager";
import { buildMakeHarvestableOps } from "../../lib/frontend/makeHarvestableOps";

// ── Default mock pool data ────────────────────────────────────────────────────
// Representative pool reserves: large enough to show realistic price impact
const DEFAULT_POOLS: SplLandPool[] = [
  {
    token_symbol: "GRAIN",
    resource_quantity: "500000",
    dec_quantity: "1000000",
    id: 1,
    resource_volume: 0,
    resource_volume_1: 0,
    resource_volume_30: 0,
    resource_price: 0,
    dec_volume: 0,
    dec_volume_1: 0,
    dec_volume_30: 0,
    dec_price: 0,
    total_shares: "",
    created_date: "",
    last_updated_date: "",
  },
  {
    token_symbol: "WOOD",
    resource_quantity: "300000",
    dec_quantity: "600000",
    id: 2,
    resource_volume: 0,
    resource_volume_1: 0,
    resource_volume_30: 0,
    resource_price: 0,
    dec_volume: 0,
    dec_volume_1: 0,
    dec_volume_30: 0,
    dec_price: 0,
    total_shares: "",
    created_date: "",
    last_updated_date: "",
  },
  {
    token_symbol: "STONE",
    resource_quantity: "200000",
    dec_quantity: "400000",
    id: 3,
    resource_volume: 0,
    resource_volume_1: 0,
    resource_volume_30: 0,
    resource_price: 0,
    dec_volume: 0,
    dec_volume_1: 0,
    dec_volume_30: 0,
    dec_price: 0,
    total_shares: "",
    created_date: "",
    last_updated_date: "",
  },
  {
    token_symbol: "IRON",
    resource_quantity: "100000",
    dec_quantity: "200000",
    id: 4,
    resource_volume: 0,
    resource_volume_1: 0,
    resource_volume_30: 0,
    resource_price: 0,
    dec_volume: 0,
    dec_volume_1: 0,
    dec_volume_30: 0,
    dec_price: 0,
    total_shares: "",
    created_date: "",
    last_updated_date: "",
  },
];

const RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON"] as const;
type Res = (typeof RESOURCES)[number];

// ── Region editor types ───────────────────────────────────────────────────────

interface MockHarvestable {
  id: number;
  token_symbol: Res;
  amount_claimable: number;
  grain_required_for_food: number;
  wood_required: number;
  stone_required: number;
  iron_required: number;
}

interface MockRegion {
  id: number;
  name: string;
  region_number: number;
  balance: Record<Res, number>;
  ready: Record<Res, number>;
  harvestables: MockHarvestable[];
}

let _regionId = 1;
let _harvestableId = 1;

function makeRegion(name: string, regionNumber: number): MockRegion {
  return {
    id: _regionId++,
    name,
    region_number: regionNumber,
    balance: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0 },
    ready: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0 },
    harvestables: [],
  };
}

function makeHarvestable(symbol: Res): MockHarvestable {
  return {
    id: _harvestableId++,
    token_symbol: symbol,
    amount_claimable: 100,
    grain_required_for_food: symbol === "GRAIN" ? 0 : 50,
    wood_required: 0,
    stone_required: 0,
    iron_required: 0,
  };
}

// ── Playground component ──────────────────────────────────────────────────────

function MakeHarvestablePlayground() {
  const [regions, setRegions] = useState<MockRegion[]>([
    (() => {
      const r = makeRegion("Region Alpha", 1);
      r.balance = { GRAIN: 100, WOOD: 500, STONE: 0, IRON: 0 };
      r.ready = { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0 };
      const h = makeHarvestable("GRAIN");
      h.grain_required_for_food = 300;
      r.harvestables = [h];
      return r;
    })(),
    (() => {
      const r = makeRegion("Region Beta", 2);
      r.balance = { GRAIN: 800, WOOD: 0, STONE: 0, IRON: 0 };
      r.ready = { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0 };
      const h = makeHarvestable("WOOD");
      h.grain_required_for_food = 100;
      h.wood_required = 200;
      r.harvestables = [h];
      return r;
    })(),
  ]);

  const [strategies, setStrategies] = useState<MakeHarvestableStrategy[]>([
    "transfer",
    "swap",
    "buy_dec",
  ]);
  const [decBalance, setDecBalance] = useState(5000);
  const [log, setLog] = useState<string[]>([]);
  const [opCount, setOpCount] = useState<number | null>(null);

  // ── Region CRUD ─────────────────────────────────────────────────────────────

  const addRegion = () => {
    setRegions((prev) => [
      ...prev,
      makeRegion(
        `Region ${String.fromCharCode(65 + prev.length)}`,
        prev.length + 1
      ),
    ]);
  };

  const removeRegion = (id: number) =>
    setRegions((p) => p.filter((r) => r.id !== id));

  const updateRegion = (id: number, patch: Partial<MockRegion>) =>
    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );

  const updateBalance = (regionId: number, sym: Res, val: number) =>
    setRegions((prev) =>
      prev.map((r) =>
        r.id === regionId ? { ...r, balance: { ...r.balance, [sym]: val } } : r
      )
    );

  const updateReady = (regionId: number, sym: Res, val: number) =>
    setRegions((prev) =>
      prev.map((r) =>
        r.id === regionId ? { ...r, ready: { ...r.ready, [sym]: val } } : r
      )
    );

  const addHarvestable = (regionId: number) =>
    setRegions((prev) =>
      prev.map((r) =>
        r.id === regionId
          ? {
              ...r,
              harvestables: [...r.harvestables, makeHarvestable("GRAIN")],
            }
          : r
      )
    );

  const removeHarvestable = (regionId: number, hid: number) =>
    setRegions((prev) =>
      prev.map((r) =>
        r.id === regionId
          ? { ...r, harvestables: r.harvestables.filter((h) => h.id !== hid) }
          : r
      )
    );

  const updateHarvestable = (
    regionId: number,
    hid: number,
    patch: Partial<MockHarvestable>
  ) =>
    setRegions((prev) =>
      prev.map((r) =>
        r.id === regionId
          ? {
              ...r,
              harvestables: r.harvestables.map((h) =>
                h.id === hid ? { ...h, ...patch } : h
              ),
            }
          : r
      )
    );

  // ── Strategy toggles ────────────────────────────────────────────────────────

  const toggleStrategy = (s: MakeHarvestableStrategy) =>
    setStrategies((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  // ── Run dry run ─────────────────────────────────────────────────────────────

  const run = () => {
    // Convert mock data → types expected by buildMakeHarvestableOps
    const splRegions: SplProductionOverviewRegion[] = regions.map((r) => ({
      player: "story",
      region_uid: `uid-${r.id}`,
      name: r.name,
      region_number: r.region_number,
      plots_owned: 1,
      dark_energy_required: 0,
      active_worksites: 1,
      grain_per_hr: 0,
      grain_pp: 0,
      grain_worksites: 0,
      grain_ready: r.ready.GRAIN,
      wood_per_hr: 0,
      wood_pp: 0,
      wood_worksites: 0,
      wood_ready: r.ready.WOOD,
      stone_per_hr: 0,
      stone_pp: 0,
      stone_worksites: 0,
      stone_ready: r.ready.STONE,
      iron_per_hr: 0,
      iron_pp: 0,
      iron_worksites: 0,
      iron_ready: r.ready.IRON,
      sps_per_hr: 0,
      sps_pp: 0,
      sps_worksites: 0,
      sps_ready: 0,
      research_per_hr: 0,
      research_pp: 0,
      research_worksites: 0,
      research_ready: 0,
      aura_per_hr: 0,
      aura_pp: 0,
      aura_worksites: 0,
      aura_ready: 0,
      dark_energy_staked: 0,
      plots_ready_to_harvest: 0,
      last_claimed: "",
      grain_required: 0,
      grain_req_per_hour: 0,
    }));

    const harvestableMap: Record<string, SplHarvestableResource[]> = {};
    const balancesMap: Record<string, Record<string, number>> = {};

    for (const r of regions) {
      const uid = `uid-${r.id}`;
      harvestableMap[uid] = r.harvestables.map((h) => ({
        token_symbol: h.token_symbol,
        amount_claimable: h.amount_claimable,
        grain_required_for_food: h.grain_required_for_food,
        wood_required: h.wood_required,
        stone_required: h.stone_required,
        iron_required: h.iron_required,
      }));
      // effectiveBalance is applied inside buildMakeHarvestableOps caller (BulkActionPanel),
      // so here we pre-apply it manually to match real usage
      balancesMap[uid] = {
        GRAIN: r.balance.GRAIN + r.ready.GRAIN,
        WOOD: r.balance.WOOD + r.ready.WOOD,
        STONE: r.balance.STONE + r.ready.STONE,
        IRON: r.balance.IRON + r.ready.IRON,
      };
    }

    const { ops, log: resultLog } = buildMakeHarvestableOps(
      splRegions,
      "story_user",
      harvestableMap,
      balancesMap,
      strategies,
      decBalance,
      DEFAULT_POOLS
    );

    setLog(resultLog);
    setOpCount(ops.length);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Typography variant="h5" gutterBottom>
        Make Harvestable — Dry Run Playground
      </Typography>

      {/* Strategy & DEC */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Settings
        </Typography>
        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          {(["transfer", "swap", "buy_dec"] as MakeHarvestableStrategy[]).map(
            (s) => (
              <FormControlLabel
                key={s}
                control={
                  <Checkbox
                    checked={strategies.includes(s)}
                    onChange={() => toggleStrategy(s)}
                    size="small"
                  />
                }
                label={s}
              />
            )
          )}
          <TextField
            label="DEC balance"
            type="number"
            size="small"
            value={decBalance}
            onChange={(e) => setDecBalance(Number(e.target.value))}
            sx={{ width: 140 }}
          />
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          mt={1}
          display="block"
        >
          Strategies execute left-to-right as ordered above (transfer → swap →
          buy_dec).
        </Typography>
      </Paper>

      {/* Regions */}
      <Stack gap={2} mb={2}>
        {regions.map((region) => (
          <Paper key={region.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
              <TextField
                label="Region name"
                size="small"
                value={region.name}
                onChange={(e) =>
                  updateRegion(region.id, { name: e.target.value })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                label="#"
                type="number"
                size="small"
                value={region.region_number}
                onChange={(e) =>
                  updateRegion(region.id, {
                    region_number: Number(e.target.value),
                  })
                }
                sx={{ width: 70 }}
              />
              <Tooltip title="Remove region">
                <IconButton
                  size="small"
                  onClick={() => removeRegion(region.id)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Balances */}
            <Typography variant="caption" color="text.secondary">
              Stored balance
            </Typography>
            <Stack direction="row" gap={1} mb={1} flexWrap="wrap">
              {RESOURCES.map((sym) => (
                <TextField
                  key={sym}
                  label={sym}
                  type="number"
                  size="small"
                  value={region.balance[sym]}
                  onChange={(e) =>
                    updateBalance(region.id, sym, Number(e.target.value))
                  }
                  sx={{ width: 110 }}
                />
              ))}
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Ready to harvest (added to balance)
            </Typography>
            <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
              {RESOURCES.map((sym) => (
                <TextField
                  key={sym}
                  label={`${sym} ready`}
                  type="number"
                  size="small"
                  value={region.ready[sym]}
                  onChange={(e) =>
                    updateReady(region.id, sym, Number(e.target.value))
                  }
                  sx={{ width: 110 }}
                />
              ))}
            </Stack>

            <Divider sx={{ mb: 1.5 }} />

            {/* Harvestable items */}
            <Typography variant="caption" color="text.secondary">
              Harvestable plots (resource costs per plot)
            </Typography>
            <Stack gap={1} mt={0.5}>
              {region.harvestables.map((h) => (
                <Paper
                  key={h.id}
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: "action.hover" }}
                >
                  <Stack
                    direction="row"
                    gap={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <TextField
                      select
                      label="Token"
                      size="small"
                      value={h.token_symbol}
                      onChange={(e) =>
                        updateHarvestable(region.id, h.id, {
                          token_symbol: e.target.value as Res,
                        })
                      }
                      SelectProps={{ native: true }}
                      sx={{ width: 100 }}
                    >
                      {RESOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </TextField>
                    <TextField
                      label="Claimable"
                      type="number"
                      size="small"
                      value={h.amount_claimable}
                      onChange={(e) =>
                        updateHarvestable(region.id, h.id, {
                          amount_claimable: Number(e.target.value),
                        })
                      }
                      sx={{ width: 110 }}
                    />
                    <TextField
                      label="GRAIN cost"
                      type="number"
                      size="small"
                      value={h.grain_required_for_food}
                      onChange={(e) =>
                        updateHarvestable(region.id, h.id, {
                          grain_required_for_food: Number(e.target.value),
                        })
                      }
                      sx={{ width: 110 }}
                    />
                    <TextField
                      label="WOOD cost"
                      type="number"
                      size="small"
                      value={h.wood_required}
                      onChange={(e) =>
                        updateHarvestable(region.id, h.id, {
                          wood_required: Number(e.target.value),
                        })
                      }
                      sx={{ width: 110 }}
                    />
                    <TextField
                      label="STONE cost"
                      type="number"
                      size="small"
                      value={h.stone_required}
                      onChange={(e) =>
                        updateHarvestable(region.id, h.id, {
                          stone_required: Number(e.target.value),
                        })
                      }
                      sx={{ width: 110 }}
                    />
                    <TextField
                      label="IRON cost"
                      type="number"
                      size="small"
                      value={h.iron_required}
                      onChange={(e) =>
                        updateHarvestable(region.id, h.id, {
                          iron_required: Number(e.target.value),
                        })
                      }
                      sx={{ width: 110 }}
                    />
                    <Tooltip title="Remove plot">
                      <IconButton
                        size="small"
                        onClick={() => removeHarvestable(region.id, h.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => addHarvestable(region.id)}
                sx={{ alignSelf: "flex-start" }}
              >
                Add plot
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Button startIcon={<Add />} onClick={addRegion} sx={{ mb: 3 }}>
        Add region
      </Button>

      {/* Run */}
      <Box mb={2}>
        <Button
          variant="contained"
          color="warning"
          startIcon={<PlayArrow />}
          onClick={run}
          size="large"
        >
          Run Dry Run
        </Button>
      </Box>

      {/* Output */}
      {opCount !== null && (
        <Box>
          <Stack direction="row" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2">Result</Typography>
            <Chip
              label={`${opCount} operation${opCount !== 1 ? "s" : ""}`}
              size="small"
              color={opCount > 0 ? "success" : "default"}
            />
          </Stack>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              fontFamily: "monospace",
              fontSize: "0.78rem",
              whiteSpace: "pre-wrap",
              bgcolor: "action.hover",
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            {log.join("\n") ||
              "(nothing to do — all regions already harvestable)"}
          </Paper>
        </Box>
      )}
    </Box>
  );
}

// ── Story export ──────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Land Manager/Make Harvestable Dry Run",
  parameters: { layout: "fullscreen" },
};

export default meta;

export const Playground: StoryObj = {
  render: () => <MakeHarvestablePlayground />,
};
