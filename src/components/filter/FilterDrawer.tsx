"use client";

import { useEffect, useState } from "react";
import { FilterInput } from "@/types/filters";

import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Button from "@mui/material/Button";
import MultiSelect from "./MultiSelect";

interface Props {
  filterValues: FilterInput;
}

export default function FilterDrawer({ filterValues }: Props) {
  const filters = filterValues;
  type FilterKey = keyof typeof filters;

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>(
    Object.keys(filters).reduce(
      (acc, key) => {
        acc[key as FilterKey] = [];
        return acc;
      },
      {} as Record<FilterKey, string[]>,
    ),
  );

  const [checkboxes, setCheckboxes] = useState({
    filter_developed: false,
    filter_under_construction: false,
    filter_has_pp: false,
  });

  useEffect(() => {
    const isLarge = window.innerWidth >= 1024;
    setDrawerOpen(isLarge);
  }, []);

  const toggleSelection = (key: FilterKey, values: string[]) => {
    setSelected((prev) => ({ ...prev, [key]: values }));
  };

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
          height: 125,
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={toggleDrawer}
          sx={{
            width: 20,
            minWidth: "auto", // prevent default button expansion
            height: "100%",
            borderRadius: "10px 0 0 10px",
            writingMode: "vertical-rl",
            textOrientation: "sideways",
            boxShadow: 3,
          }}
        >
          Filter
        </Button>
      </Box>

      {/* Right drawer */}
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
        <Box
          sx={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Location */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Location
            </Typography>
            <MultiSelect
              label="Regions"
              values={filters.filter_regions ?? []}
              selected={selected.filter_regions}
              onChange={(vals) => toggleSelection("filter_regions", vals)}
            />
            <MultiSelect
              label="Tracts"
              values={filters.filter_tracts ?? []}
              selected={selected.filter_tracts}
              onChange={(vals) => toggleSelection("filter_tracts", vals)}
            />
            <MultiSelect
              label="Plots"
              values={filters.filter_plots ?? []}
              selected={selected.filter_plots}
              onChange={(vals) => toggleSelection("filter_plots", vals)}
            />
          </Box>

          {/* Attributes */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Attributes
            </Typography>
            <MultiSelect
              label="Rarity"
              values={filters.filter_rarity ?? []}
              selected={selected.filter_rarity}
              onChange={(vals) => toggleSelection("filter_rarity", vals)}
            />
            <MultiSelect
              label="Resources"
              values={filters.filter_resources ?? []}
              selected={selected.filter_resources}
              onChange={(vals) => toggleSelection("filter_resources", vals)}
            />
            <MultiSelect
              label="Worksites"
              values={filters.filter_worksites ?? []}
              selected={selected.filter_worksites}
              onChange={(vals) => toggleSelection("filter_worksites", vals)}
            />
            <MultiSelect
              label="Deed Type"
              values={filters.filter_deed_type ?? []}
              selected={selected.filter_deed_type}
              onChange={(vals) => toggleSelection("filter_deed_type", vals)}
            />
            <MultiSelect
              label="Plot Status"
              values={filters.filter_plot_status ?? []}
              selected={selected.filter_plot_status}
              onChange={(vals) => toggleSelection("filter_plot_status", vals)}
            />

            {/* Boolean checkboxes */}
            <FormGroup sx={{ mt: 2 }}>
              {Object.entries(checkboxes).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={value}
                      onChange={() =>
                        setCheckboxes((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof checkboxes],
                        }))
                      }
                      size="small"
                    />
                  }
                  label={key
                    .replace("filter_", "")
                    .replace(/_/g, " ")
                    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Player */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Player
            </Typography>
            <MultiSelect
              label="Players"
              values={filters.filter_players ?? []}
              selected={selected.filter_players}
              onChange={(vals) => toggleSelection("filter_players", vals)}
            />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
