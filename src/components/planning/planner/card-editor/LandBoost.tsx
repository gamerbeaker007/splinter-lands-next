"use client";

import PercentageSlider from "@/components/ui/PercentageSlider";
import { Resource } from "@/constants/resource/resource";
import { PRODUCING_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  bloodline_icon_url,
  dec_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { LandBoost } from "@/types/planner/domain";
import { CardBloodline } from "@/types/planner/primitives";
import { Add as AddIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import ProductionBoostSelector from "./ProductionBoostSelector";

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
const sizeIcon = 30;

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

  const [consumeGrainDiscount, setConsumeGrainDiscount] = useState(
    (initialBoost?.consumeGrainDiscount ?? 0) * 100,
  );

  // Bloodline boost is now a simple number
  const [bloodlineBoostValue, setBloodlineBoostValue] = useState(
    (initialBoost?.bloodlineBoost ?? 0) * 100,
  );

  const [decDiscount, setDecDiscount] = useState(
    (initialBoost?.decDiscount ?? 0) * 100,
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
      setConsumeGrainDiscount((initialBoost.consumeGrainDiscount ?? 0) * 100);
      setBloodlineBoostValue((initialBoost.bloodlineBoost ?? 0) * 100);
      setDecDiscount((initialBoost.decDiscount ?? 0) * 100);
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

    const landBoost: LandBoost = {
      produceBoost,
      consumeGrainDiscount: consumeGrainDiscount / 100,
      bloodlineBoost: bloodlineBoostValue / 100,
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

  const hasLandBoost = () => {
    return (
      produceBoosts.length > 0 ||
      consumeGrainDiscount > 0 ||
      bloodlineBoostValue > 0 ||
      decDiscount > 0 ||
      replacePowerCore ||
      laborLuck
    );
  };

  //Using Divs and spans for React hydration error
  const resourceInfo = (idx: number, resource: Resource, value: number) => (
    <span
      key={idx}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        marginRight: "12px",
      }}
    >
      <Image
        src={RESOURCE_ICON_MAP[resource]}
        alt={resource}
        width={20}
        height={20}
      />
      <span style={{ fontSize: fontSizeToolTip }}>{value}%</span>
    </span>
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
      {consumeGrainDiscount > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Grain Consumption Discount: {consumeGrainDiscount}%
        </Typography>
      )}
      {bloodlineBoostValue > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Toil and Kin: {bloodlineBoostValue}%
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
            maxWidth: "500px",
            maxHeight: { xs: "90vh", sm: "80vh" },
          },
        }}
      >
        <DialogTitle>Land Boost Configuration</DialogTitle>
        <DialogContent>
          <Box>
            {/* Produce Boosts */}
            <Typography gutterBottom>
              Production Boosts
              <IconButton onClick={addProduceBoost} size="small" sx={{ ml: 1 }}>
                <AddIcon />
              </IconButton>
            </Typography>

            {produceBoosts.map((boost, index) => (
              <ProductionBoostSelector
                key={index}
                boost={boost}
                index={index}
                onUpdate={updateProduceBoost}
                onRemove={removeProduceBoost}
              />
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Consume Discounts */}
            <Box
              display={"flex"}
              flexWrap={"wrap"}
              alignItems={"center"}
              gap={2}
            >
              <Image
                src={RESOURCE_ICON_MAP["GRAIN"]}
                alt={"Grain"}
                width={sizeIcon}
                height={sizeIcon}
              />

              <Typography gutterBottom>Rationing</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <PercentageSlider
                value={consumeGrainDiscount}
                onChange={setConsumeGrainDiscount}
                label="Grain consumption discount"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Bloodline Boost - Toil and Kin */}
            <Box sx={{ mb: 3 }}>
              <Box
                display={"flex"}
                flexWrap={"wrap"}
                alignItems={"center"}
                gap={2}
              >
                <Image
                  src={bloodline_icon_url}
                  alt={"Bloodline"}
                  width={sizeIcon}
                  height={sizeIcon}
                />
                <Typography gutterBottom>
                  Toil and Kin (Bloodline Boost)
                </Typography>
              </Box>
              <PercentageSlider
                value={bloodlineBoostValue}
                onChange={setBloodlineBoostValue}
                label="Bloodline boost (applies to cards with same bloodline)"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* DEC Discount */}
            <Box sx={{ mb: 3 }}>
              <Box
                display={"flex"}
                flexWrap={"wrap"}
                alignItems={"center"}
                gap={2}
              >
                <Image
                  src={dec_icon_url}
                  alt={"Bloodline"}
                  width={sizeIcon}
                  height={sizeIcon}
                />
                <Typography gutterBottom>DEC Discount</Typography>
              </Box>
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
