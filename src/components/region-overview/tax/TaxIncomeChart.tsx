import { RegionTax } from "@/types/regionTax";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";

type TaxIncomeChartProps = {
  title: string;
  data: RegionTax[];
  type: "castle" | "keep";
  income: "resource" | "dec";
  resourceFilter: string | null;
};

export const TaxIncomeChart = ({
  title,
  data,
  type,
  income,
  resourceFilter,
}: TaxIncomeChartProps) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;

  const traces = resourceFilter
    ? getSortedTracesByResource(data, type, income, resourceFilter)
    : getGroupedTracesByResourceSortedByTotalDEC(data, type, income);

  const YAxisTtitle =
    income === "resource" ? "Resources per Hour" : "DEC per Hour";

  return (
    <Plot
      data={traces}
      layout={{
        barmode: "stack",
        bargap: 0.05,
        bargroupgap: 0.05,
        title: {
          text: title,
          font: { color: textColor },
        },
        margin: { l: 50, r: 30, t: 50, b: 100 },
        xaxis: {
          title: { text: type === "castle" ? "Region" : "Tract" },
          tickangle: -45,
          automargin: true,
          color: textColor,
          type: "category",
        },
        yaxis: {
          title: { text: `${YAxisTtitle}` },
          color: textColor,
        },
        height: 500,
        paper_bgcolor: backgroundColor,
        plot_bgcolor: backgroundColor,
        legend: { font: { color: textColor } },
      }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
};

// ------------------ Helper Functions ------------------

function getSortedTracesByResource(
  data: RegionTax[],
  type: "castle" | "keep",
  income: "resource" | "dec",
  resource: string,
): Partial<Data>[] {
  const entries =
    type === "castle"
      ? data.map((region) => ({
          x: region.castleOwner.regionUid,
          y:
            income === "resource"
              ? (region.capturedTaxInResource[resource] ?? 0)
              : (region.capturedTaxInDEC[resource] ?? 0),
        }))
      : data.flatMap((region) =>
          Object.values(region.perTract).map((tract) => ({
            x: `${region.castleOwner.regionUid}-${tract.keepOwner.tractNumber}`,
            y:
              income === "resource"
                ? (tract.capturedTaxInResource[resource] ?? 0)
                : (tract.capturedTaxInDEC[resource] ?? 0),
          })),
        );

  const sorted = entries.filter((e) => e.y > 0).sort((a, b) => b.y - a.y);

  return [
    {
      type: "bar",
      name: resource,
      x: sorted.map((e) => e.x),
      y: sorted.map((e) => e.y),
      marker: { color: RESOURCE_COLOR_MAP[resource] || "gray" },
    },
  ];
}

function getGroupedTracesByResourceSortedByTotalDEC(
  data: RegionTax[],
  type: "castle" | "keep",
  income: "resource" | "dec",
): Partial<Data>[] {
  const grouped: Record<string, Record<string, number>> = {};
  const totalPerLocation: Record<string, number> = {};

  if (type === "castle") {
    for (const region of data) {
      const regionId = region.castleOwner.regionUid;
      const values =
        income === "resource"
          ? region.capturedTaxInResource
          : region.capturedTaxInDEC;

      let total = 0;
      for (const [resource, value] of Object.entries(values)) {
        if (!value) continue;
        grouped[resource] ??= {};
        grouped[resource][regionId] = value;
        total += value;
      }
      totalPerLocation[regionId] = total;
    }
  } else {
    for (const region of data) {
      for (const tract of Object.values(region.perTract)) {
        const tractId = `${region.castleOwner.regionUid}-${tract.keepOwner.tractNumber}`;
        const values =
          income === "resource"
            ? tract.capturedTaxInResource
            : tract.capturedTaxInDEC;

        let total = 0;
        for (const [resource, value] of Object.entries(values)) {
          if (!value) continue;
          grouped[resource] ??= {};
          grouped[resource][tractId] = value;
          total += value;
        }
        totalPerLocation[tractId] = total;
      }
    }
  }

  const sortedLocations = Object.entries(totalPerLocation)
    .sort(([, a], [, b]) => b - a)
    .map(([loc]) => loc);

  // Construct traces for each resource
  return Object.entries(grouped).map(([resource, locationMap]) => ({
    type: "bar",
    name: resource,
    x: sortedLocations,
    y: sortedLocations.map((loc) => locationMap[loc] ?? 0),
    marker: { color: RESOURCE_COLOR_MAP[resource] || "gray" },
    hovertemplate:
      "Total: %{customdata:.2f} <br>" +
      resource +
      ": %{y:.2f} " +
      (income === "resource" ? "" : "DEC") +
      "<br>%{x}<extra></extra>",
    customdata: sortedLocations.map((loc) => totalPerLocation[loc] ?? 0),
  }));
}
