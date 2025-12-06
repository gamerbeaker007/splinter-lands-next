import ErrorComponent from "@/components/ui/ErrorComponent";
import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import LoadingComponent from "@/components/ui/LoadingComponent";
import { useRegionCompareRarity } from "@/hooks/useRegionCompareRarity";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { NATURAL_RESOURCES, PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { plotRarityOptions, RarityColor } from "@/types/planner";
import { Box } from "@mui/material";
import { PlotData } from "plotly.js";

export const RarityResourceCompareChart = () => {
  const { filters } = useFilters();
  const { regionCompareRarity, loading, error } =
    useRegionCompareRarity(filters);

  if (loading) return <LoadingComponent title="Loading rarity data..." />;
  if (error) return <ErrorComponent title="Failed to load rarity data." />;

  // Prepare traces for production and consumption, grouped by rarity
  const productionTraces: Partial<PlotData>[] = [];
  const consumptionTraces: Partial<PlotData>[] = [];

  // For each rarity, create a bar trace for production and one for consumption
  const rarityOptions = plotRarityOptions.filter(
    (rarity) => rarity !== "mythic"
  );

  for (const rarity of rarityOptions) {
    const summary =
      (regionCompareRarity?.[rarity] as {
        production?: Record<string, number>;
        consumption?: Record<string, number>;
      }) ?? {};
    // Production
    productionTraces.push({
      type: "bar",
      name: rarity,
      x: PRODUCING_RESOURCES,
      y: PRODUCING_RESOURCES.map(
        (resource) => summary.production?.[resource] ?? 0
      ),
      marker: { color: RarityColor[rarity] || "blue" },
    });
    // Consumption
    consumptionTraces.push({
      type: "bar",
      name: rarity,
      x: NATURAL_RESOURCES,
      y: NATURAL_RESOURCES.map(
        (resource) => summary.consumption?.[resource] ?? 0
      ),
      marker: { color: RarityColor[rarity] || "blue" },
    });
  }

  return (
    <>
      <Box
        mt={2}
        sx={{
          width: "100%",
          height: 700,
        }}
      >
        <FullscreenPlotWrapper
          data={productionTraces}
          layout={{
            barmode: "group",
            title: {
              text: "Production by Rarity and Resource",
            },
            xaxis: {
              title: { text: "Resource" },
              tickangle: -45,
              automargin: true,
              showgrid: false,
              type: "category",
            },
            yaxis: {
              title: { text: "Amount (per hour)" },
            },
          }}
        />
      </Box>
      <Box
        mt={2}
        sx={{
          width: "100%",
          height: 700,
        }}
      >
        <FullscreenPlotWrapper
          data={consumptionTraces}
          layout={{
            barmode: "group",
            title: {
              text: "Consumption by Rarity and Resource",
            },
            xaxis: {
              title: { text: "Resource" },
              tickangle: -45,
              automargin: true,
              showgrid: false,
              type: "category",
            },
            yaxis: {
              title: { text: "Amount (per hour)" },
            },
          }}
        />
      </Box>
    </>
  );
};
