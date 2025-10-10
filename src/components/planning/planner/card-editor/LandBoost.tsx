"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { LandBoost } from "@/types/planner/domain";
import { CardBloodline } from "@/types/planner/primitives";
import { Resource } from "@/constants/resource/resource";
import {
  NATURAL_RESOURCES,
  PRODUCING_RESOURCES,
  RESOURCE_ICON_MAP,
} from "@/lib/shared/statics";
import PercentageSlider from "@/components/ui/PercentageSlider";
import Image from "next/image";

interface LandBoostProps {
  initialBloodline: CardBloodline;
  initialBoost?: LandBoost;
  onSave: (boost: LandBoost) => void;
}

interface ResourceBoost {
  resource: Resource;
  value: number;
}

const fontSizeToolTip = "0.8rem";

export default function LandBoostComponent({
  initialBoost,
  onSave,
}: LandBoostProps) {
  const [open, setOpen] = useState(false);

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

  const resourceInfo = (
    idx: number,
    resource: Resource,
    value: number, // Add parameters here
  ) => (
    <Box
      key={resource}
      sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
    >
      <Image
        src={RESOURCE_ICON_MAP[resource]}
        alt={resource}
        width={20}
        height={20}
      />
      <Typography fontSize={fontSizeToolTip}>{value}%</Typography>
    </Box>
  );

  const title = (
    <Box>
      {produceBoosts.length > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Produce Boost:{" "}
          {produceBoosts.map((item, idx) => {
            //Change from .forEach to .map
            return resourceInfo(idx, item.resource, item.value); // Add return and possibly the rest of parameters
          })}
        </Typography>
      )}
      {consumeDiscounts.length > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Consume Discount:{" "}
          {consumeDiscounts.map((item, idx) => {
            //Change from .forEach to .map
            return resourceInfo(idx, item.resource, item.value); // Add return and possibly the rest of parameters
          })}
        </Typography>
      )}
      {bloodlineBoost > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Bloodline Boost: {bloodlineBoost}%
        </Typography>
      )}
      {decDiscount > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Dec Discount: {decDiscount}%
        </Typography>
      )}
      {replacePowerCore && (
        <Typography fontSize={fontSizeToolTip}>
          Replace Power Core: Yes
        </Typography>
      )}
      {laborLuck && (
        <Typography fontSize={fontSizeToolTip}>Labor Luck: Yes</Typography>
      )}
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Tooltip
          title={title}
          placement={"top-start"}
          disableHoverListener={!hasLandBoost()}
        >
          <IconButton
            onClick={handleOpen}
            color={hasLandBoost() ? "primary" : "default"}
            sx={{
              width: 25,
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
        </Tooltip>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        fullScreen={false} // Could be made responsive: useMediaQuery(theme.breakpoints.down('sm'))
        PaperProps={{
          sx: {
            margin: { xs: 1, sm: 2 },
            maxWidth: "600px",
            maxHeight: { xs: "90vh", sm: "80vh" },
          },
        }}
      >
        <DialogTitle>Land Boost Configuration</DialogTitle>
        <DialogContent>
          <Box>
            {/* Produce Boosts */}
            <Typography variant="h6" gutterBottom>
              Production Boosts
              <IconButton onClick={addProduceBoost} size="small" sx={{ ml: 1 }}>
                <AddIcon />
              </IconButton>
            </Typography>

            {produceBoosts.map((boost, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  border: 1,
                  borderColor: "grey.300",
                  borderRadius: 1,
                }}
              >
                <Grid container spacing={2} alignItems="stretch">
                  {/* Resource Selection - Full width on mobile, 1/3 on tablet+ */}
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
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

                  {/* Percentage Slider - Full width on mobile, grows on larger screens */}
                  <Grid size={{ xs: 12, sm: 6, md: 8 }}>
                    <Box sx={{ minWidth: 200 }}>
                      <PercentageSlider
                        value={boost.value}
                        onChange={(value) =>
                          updateProduceBoost(index, "value", value)
                        }
                        label={`${boost.resource} production boost`}
                      />
                    </Box>
                  </Grid>

                  {/* Delete Button - Right aligned */}
                  <Grid
                    size={{ xs: 12, sm: 2, md: 1 }}
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "center", sm: "flex-end" },
                    }}
                  >
                    <IconButton
                      onClick={() => removeProduceBoost(index)}
                      size="small"
                      color="error"
                      sx={{
                        minWidth: 40,
                        height: 40,
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

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
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  border: 1,
                  borderColor: "grey.300",
                  borderRadius: 1,
                }}
              >
                <Grid container spacing={2} alignItems="stretch">
                  {/* Resource Selection - Full width on mobile, 1/3 on tablet+ */}
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Resource</InputLabel>
                      <Select
                        value={discount.resource}
                        label="Resource"
                        onChange={(e) =>
                          updateConsumeDiscount(
                            index,
                            "resource",
                            e.target.value,
                          )
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

                  {/* Percentage Slider - Full width on mobile, grows on larger screens */}
                  <Grid size={{ xs: 12, sm: 6, md: 8 }}>
                    <Box sx={{ minWidth: 200 }}>
                      <PercentageSlider
                        value={discount.value}
                        onChange={(value) =>
                          updateConsumeDiscount(index, "value", value)
                        }
                        label={`${discount.resource} consumption discount`}
                      />
                    </Box>
                  </Grid>

                  {/* Delete Button - Right aligned */}
                  <Grid
                    size={{ xs: 12, sm: 2, md: 1 }}
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "center", sm: "flex-end" },
                    }}
                  >
                    <IconButton
                      onClick={() => removeConsumeDiscount(index)}
                      size="small"
                      color="error"
                      sx={{
                        minWidth: 40,
                        height: 40,
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Other Boosts */}
            <Typography variant="h6" gutterBottom>
              Other Boosts
            </Typography>

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
