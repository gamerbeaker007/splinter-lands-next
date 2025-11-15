"use client";

import PercentageSlider from "@/components/ui/PercentageSlider";
import { Resource } from "@/constants/resource/resource";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
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

interface ResourceBoost {
  resource: Resource;
  value: number;
}

interface LandBoostProps {
  initialBloodline: CardBloodline;
  initialBoost?: LandBoost;
  onSave: (boost: LandBoost) => void;
}

const fontSizeToolTip = "0.8rem";
const sizeIcon = 30;

export default function LandBoostComponent({
  initialBoost,
  onSave,
}: LandBoostProps) {
  const [open, setOpen] = useState(false);

  // Production boosts array - default to two items (GRAIN and WOOD)
  const [produceBoosts, setProduceBoosts] = useState<ResourceBoost[]>(() => {
    if (initialBoost?.produceBoost) {
      const entries = Object.entries(initialBoost.produceBoost);
      if (entries.length > 0) {
        return entries.map(([resource, value]) => ({
          resource: resource as Resource,
          value: value * 100,
        }));
      }
    }
    // Default: two rows with GRAIN and WOOD, both at 0%
    return [
      { resource: "GRAIN" as Resource, value: 0 },
      { resource: "WOOD" as Resource, value: 0 },
    ];
  });

  const [consumeGrainDiscount, setConsumeGrainDiscount] = useState(
    (initialBoost?.consumeGrainDiscount ?? 0) * 100,
  );

  // Bloodline boost is now a simple number
  const [bloodlineBoost, setBloodlineBoost] = useState(
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
      const entries = Object.entries(initialBoost.produceBoost ?? {});
      if (entries.length > 0) {
        setProduceBoosts(
          entries.map(([resource, value]) => ({
            resource: resource as Resource,
            value: value * 100,
          })),
        );
      } else {
        // Default: two rows with GRAIN and WOOD
        setProduceBoosts([
          { resource: "GRAIN" as Resource, value: 0 },
          { resource: "WOOD" as Resource, value: 0 },
        ]);
      }

      setConsumeGrainDiscount((initialBoost.consumeGrainDiscount ?? 0) * 100);
      setBloodlineBoost((initialBoost.bloodlineBoost ?? 0) * 100);
      setDecDiscount((initialBoost.decDiscount ?? 0) * 100);
      setReplacePowerCore(initialBoost.replacePowerCore);
      setLaborLuck(initialBoost.laborLuck);
    }
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    // Convert ResourceBoost array back to Record<Resource, number>
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
      bloodlineBoost: bloodlineBoost / 100,
      decDiscount: decDiscount / 100,
      replacePowerCore,
      laborLuck,
    };

    onSave(landBoost);
    setOpen(false);
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
      produceBoosts.some((boost) => boost.value > 0) ||
      consumeGrainDiscount > 0 ||
      bloodlineBoost > 0 ||
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
      {produceBoosts.some((boost) => boost.value > 0) && (
        <Typography fontSize={fontSizeToolTip}>
          Produce Boost:{" "}
          {produceBoosts.map((item, idx) => {
            if (item.value > 0) {
              return resourceInfo(idx, item.resource, item.value);
            }
            return null;
          })}
        </Typography>
      )}
      {consumeGrainDiscount > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Grain Consumption Discount: {consumeGrainDiscount}%
        </Typography>
      )}
      {bloodlineBoost > 0 && (
        <Typography fontSize={fontSizeToolTip}>
          Toil and Kin: {bloodlineBoost}%
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
            <Typography gutterBottom>Production Boosts</Typography>

            <ProductionBoostSelector
              boosts={produceBoosts}
              onUpdate={updateProduceBoost}
            />

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
                value={bloodlineBoost}
                onChange={setBloodlineBoost}
                label="Bloodline boost"
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

            <Divider sx={{ my: 2 }} />

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
