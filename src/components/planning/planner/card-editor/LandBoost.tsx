"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { LandBoost } from "@/types/planner/domain";
import {
  CardBloodline,
  cardBloodlineOptions,
} from "@/types/planner/primitives";
import { Resource } from "@/constants/resource/resource";
import { NATURAL_RESOURCES, PRODUCING_RESOURCES } from "@/lib/shared/statics";
import PercentageSlider from "@/components/ui/PercentageSlider";

interface LandBoostProps {
  initialBoost?: LandBoost;
  onSave: (boost: LandBoost) => void;
}

interface ResourceBoost {
  resource: Resource;
  value: number;
}

export default function LandBoostComponent({
  initialBoost,
  onSave,
}: LandBoostProps) {
  const [open, setOpen] = useState(false);
  const [bloodline, setBloodline] = useState<CardBloodline>(
    initialBoost?.bloodline ?? "Avian",
  );

  // Convert Record<Resource, number> to ResourceBoost arrays for easier editing
  const [produceBoosts, setProduceBoosts] = useState<ResourceBoost[]>(() => {
    if (initialBoost?.produceBoost) {
      return Object.entries(initialBoost.produceBoost)
        .filter(([, value]) => value > 0)
        .map(([resource, value]) => ({
          resource: resource as Resource,
          value: value * 100,
        }));
    }
    return [];
  });

  const [consumeDiscounts, setConsumeDiscounts] = useState<ResourceBoost[]>(
    () => {
      if (initialBoost?.consumeDiscount) {
        return Object.entries(initialBoost.consumeDiscount)
          .filter(([, value]) => value > 0)
          .map(([resource, value]) => ({
            resource: resource as Resource,
            value: value * 100,
          }));
      }
      return [];
    },
  );

  const [bloodlineBoost, setBloodlineBoost] = useState(
    initialBoost?.bloodlineBoost ?? 0,
  );
  const [decDiscount, setDecDiscount] = useState(
    initialBoost?.decDiscount ?? 0,
  );
  const [replacePowerCore, setReplacePowerCore] = useState(
    initialBoost?.replacePowerCore ?? false,
  );
  const [laborLuck, setLaborLuck] = useState(initialBoost?.laborLuck ?? false);

  const handleOpen = () => {
    setOpen(true);
    // Reset to initial values when opening
    setBloodline(initialBoost?.bloodline ?? "Avian");
    if (initialBoost) {
      setProduceBoosts(
        Object.entries(initialBoost.produceBoost ?? {})
          .filter(([, value]) => value > 0)
          .map(([resource, value]) => ({
            resource: resource as Resource,
            value: value * 100,
          })),
      );
      setConsumeDiscounts(
        Object.entries(initialBoost.consumeDiscount ?? {})
          .filter(([, value]) => value > 0)
          .map(([resource, value]) => ({
            resource: resource as Resource,
            value: value * 100,
          })),
      );
      setBloodlineBoost(initialBoost.bloodlineBoost * 100);
      setDecDiscount(initialBoost.decDiscount * 100);
      setReplacePowerCore(initialBoost.replacePowerCore);
      setLaborLuck(initialBoost.laborLuck);
    }
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    // Convert ResourceBoost arrays back to Record<Resource, number>
    const produceBoost: Record<Resource, number> = {} as Record<
      Resource,
      number
    >;
    produceBoosts.forEach(({ resource, value }) => {
      produceBoost[resource] = value / 100;
    });

    const consumeDiscount: Record<Resource, number> = {} as Record<
      Resource,
      number
    >;
    consumeDiscounts.forEach(({ resource, value }) => {
      consumeDiscount[resource] = value / 100;
    });

    const landBoost: LandBoost = {
      bloodline,
      produceBoost,
      consumeDiscount,
      bloodlineBoost: bloodlineBoost / 100,
      decDiscount: decDiscount / 100,
      replacePowerCore,
      laborLuck,
    };

    onSave(landBoost);
    setOpen(false);
  };

  const addProduceBoost = () => {
    const availableResources = PRODUCING_RESOURCES.filter(
      (resource) => !produceBoosts.some((boost) => boost.resource === resource),
    );
    if (availableResources.length > 0) {
      setProduceBoosts([
        ...produceBoosts,
        { resource: availableResources[0] as Resource, value: 0 },
      ]);
    }
  };

  const removeProduceBoost = (index: number) => {
    setProduceBoosts(produceBoosts.filter((_, i) => i !== index));
  };

  const updateProduceBoost = (
    index: number,
    field: keyof ResourceBoost,
    value: Resource | number,
  ) => {
    const updated = [...produceBoosts];
    updated[index] = { ...updated[index], [field]: value };
    setProduceBoosts(updated);
  };

  const addConsumeDiscount = () => {
    const availableResources = (NATURAL_RESOURCES as Resource[]).filter(
      (resource) =>
        !consumeDiscounts.some((discount) => discount.resource === resource),
    );
    if (availableResources.length > 0) {
      setConsumeDiscounts([
        ...consumeDiscounts,
        { resource: availableResources[0], value: 0 },
      ]);
    }
  };

  const removeConsumeDiscount = (index: number) => {
    setConsumeDiscounts(consumeDiscounts.filter((_, i) => i !== index));
  };

  const updateConsumeDiscount = (
    index: number,
    field: keyof ResourceBoost,
    value: Resource | number,
  ) => {
    const updated = [...consumeDiscounts];
    updated[index] = { ...updated[index], [field]: value };
    setConsumeDiscounts(updated);
  };

  const hasLandBoost = () => {
    return (
      produceBoosts.length > 0 ||
      consumeDiscounts.length > 0 ||
      bloodlineBoost > 0 ||
      decDiscount > 0 ||
      replacePowerCore ||
      laborLuck
    );
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconButton
          onClick={handleOpen}
          color={hasLandBoost() ? "primary" : "default"}
          sx={{
            width: 25, // Make the button larger
            height: 25,
            border: hasLandBoost() ? 2 : 1,
            borderColor: hasLandBoost() ? "primary.main" : "grey.400",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Land Boost Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Produce Boosts */}
            <Typography variant="h6" gutterBottom>
              Production Boosts
              <IconButton onClick={addProduceBoost} size="small" sx={{ ml: 1 }}>
                <AddIcon />
              </IconButton>
            </Typography>

            {produceBoosts.map((boost, index) => (
              <Grid
                container
                spacing={2}
                key={index}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Grid size={{ xs: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Resource</InputLabel>
                    <Select
                      value={boost.resource}
                      label="Resource"
                      onChange={(e) =>
                        updateProduceBoost(index, "resource", e.target.value)
                      }
                    >
                      {PRODUCING_RESOURCES.map((resource) => (
                        <MenuItem key={resource} value={resource}>
                          {resource}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <PercentageSlider
                    value={boost.value}
                    onChange={(value) =>
                      updateProduceBoost(index, "value", value)
                    }
                    label={`${boost.resource} production boost`}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <IconButton
                    onClick={() => removeProduceBoost(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Consume Discounts */}
            <Typography variant="h6" gutterBottom>
              Consumption Discounts
              <IconButton
                onClick={addConsumeDiscount}
                size="small"
                sx={{ ml: 1 }}
              >
                <AddIcon />
              </IconButton>
            </Typography>

            {consumeDiscounts.map((discount, index) => (
              <Grid
                container
                spacing={2}
                key={index}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Grid size={{ xs: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Resource</InputLabel>
                    <Select
                      value={discount.resource}
                      label="Resource"
                      onChange={(e) =>
                        updateConsumeDiscount(index, "resource", e.target.value)
                      }
                    >
                      {NATURAL_RESOURCES.map((resource) => (
                        <MenuItem key={resource} value={resource}>
                          {resource}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <PercentageSlider
                    value={discount.value}
                    onChange={(value) =>
                      updateConsumeDiscount(index, "value", value)
                    }
                    label={`${discount.resource} consumption discount`}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <IconButton
                    onClick={() => removeConsumeDiscount(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Other Boosts */}
            <Typography variant="h6" gutterBottom>
              Other Boosts
            </Typography>

            {/* Bloodline Selection */}
            <FormControl sx={{ mb: 3, minWidth: 200 }}>
              <InputLabel>Card Bloodline</InputLabel>
              <Select
                value={bloodline}
                label="Card Bloodline"
                onChange={(e) => setBloodline(e.target.value as CardBloodline)}
              >
                {cardBloodlineOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Bloodline Boost */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Bloodline Boost</Typography>
              <PercentageSlider
                value={bloodlineBoost}
                onChange={setBloodlineBoost}
                label="Bloodline boost"
              />
            </Box>

            {/* DEC Discount */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>DEC Discount</Typography>
              <PercentageSlider
                value={decDiscount}
                onChange={setDecDiscount}
                label="DEC discount"
              />
            </Box>

            {/* Boolean Options */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={replacePowerCore}
                    onChange={(e) => setReplacePowerCore(e.target.checked)}
                  />
                }
                label="Replace Power Core"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={laborLuck}
                    onChange={(e) => setLaborLuck(e.target.checked)}
                  />
                }
                label="Labor Luck"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
