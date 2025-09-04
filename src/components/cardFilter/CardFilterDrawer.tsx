"use client";

import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { cardRarityOptions } from "@/types/planner";
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import { useEffect, useState } from "react";
import CardFilterRarityGroup from "./CardFilterRarityGroup";
import ResetCardFiltersButton from "./ResetCardFiltersButton";

type BooleanFilterKey = "filter_on_land" | "filter_in_set";

export default function CardFilterDrawer() {
  const [drawerOpen, setDrawerOpen] = useState(true);

  const { cardFilters, setCardFilters } = useCardFilters();

  const toggleBoolean = (key: BooleanFilterKey) => {
    setCardFilters((prev) => {
      const newFilters = { ...prev };
      if (prev[key]) {
        delete newFilters[key];
      } else {
        newFilters[key] = true;
      }
      return newFilters;
    });
  };

  useEffect(() => {
    const isLarge = window.innerWidth >= 1024;
    setDrawerOpen(isLarge);
  }, []);

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  return (
    <>
      {/* Vertical toggle button */}
      <Box
        sx={{
          position: "fixed",
          top: "100px",
          right: drawerOpen ? 300 : 0,
          zIndex: 1301,
          height: 100,
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={toggleDrawer}
          disableRipple
          disableElevation
          sx={{
            width: 30,
            minWidth: "30px",
            padding: 0,
            height: "100%",
            borderRadius: "15px 0 0 15px",
            writingMode: "vertical-rl",
            textOrientation: "sideways",
            boxShadow: 3,
            overflow: "hidden",
          }}
        >
          <Typography
            variant="body1"
            fontSize={14}
            fontWeight="bold"
            sx={{
              transition: "all 0.3s ease-in-out",
              transform: drawerOpen ? "scale(1)" : "scale(0.8)",
              opacity: drawerOpen ? 1 : 0.5,
            }}
          >
            Card Filter
          </Typography>
        </Button>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        variant="persistent"
        sx={{
          width: 300,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 300,
            top: "100px",
            height: "calc(100vh - 100px)",
            boxSizing: "border-box",
            p: 2,
          },
        }}
      >
        <CardFilterRarityGroup options={cardRarityOptions} />
        <FormGroup sx={{ mt: 2 }}>
          {(["filter_on_land", "filter_in_set"] as BooleanFilterKey[]).map(
            (key) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={cardFilters?.[key] === true}
                    onChange={() => toggleBoolean(key)}
                    size="small"
                  />
                }
                label={key
                  .replace("filter_", "")
                  .replace(/_/g, " ")
                  .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
              />
            ),
          )}
        </FormGroup>

        <ResetCardFiltersButton />
      </Drawer>
    </>
  );
}
