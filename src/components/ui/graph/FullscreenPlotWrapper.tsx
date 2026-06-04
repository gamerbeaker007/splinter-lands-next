"use client";
import { useAppTheme, type AppTheme } from "@/lib/frontend/context/ThemeSetup";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  IconButton,
} from "@mui/material";
import dynamic from "next/dynamic";
import React, { useState } from "react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// ---------------------------------------------------------------------------
// Theme tokens — explicit per-theme colours, no MUI palette inspection needed
// ---------------------------------------------------------------------------

interface ThemeTokens {
  plotlyTemplate: string;
  paper_bgcolor: string;
  plot_bgcolor: string;
  font_color: string;
  gridcolor: string;
  zerolinecolor: string;
}

const THEME_TOKENS: Record<AppTheme, ThemeTokens> = {
  light: {
    plotlyTemplate: "plotly_white",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font_color: "#1a1a1a",
    gridcolor: "rgba(0,0,0,0.08)",
    zerolinecolor: "rgba(0,0,0,0.15)",
  },
  dark: {
    plotlyTemplate: "plotly_dark",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font_color: "#e0e0e0",
    gridcolor: "rgba(255,255,255,0.06)",
    zerolinecolor: "rgba(255,255,255,0.15)",
  },
  "high-contrast": {
    plotlyTemplate: "plotly_dark",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font_color: "#ffffff",
    gridcolor: "rgba(255,255,255,0.10)",
    zerolinecolor: "rgba(255,255,255,0.22)",
  },
};

interface FullscreenPlotWrapperProps {
  data: Partial<Plotly.PlotData>[] | Partial<Plotly.PieData>[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
  noBoxWrapper?: boolean;
}

export const FullscreenPlotWrapper: React.FC<FullscreenPlotWrapperProps> = ({
  data,
  layout,
  config,
  style,
  noBoxWrapper = false,
}) => {
  const { theme } = useAppTheme();
  const t = THEME_TOKENS[theme];

  const [open, setOpen] = useState(false);

  const fullscreenIcon = {
    width: 1024,
    height: 1024,
    path: "M128 128v256h64V192h192v-64H128zm576 0v64h192v192h64V128H704zM128 704v192h256v-64H192V704h-64zm704 0v128H640v64h256V704h-64z",
    transform: "matrix(1 0 0 -1 0 1024)",
    ascent: 1024,
    descent: 0,
  };

  const fullscreenButton = {
    name: "fullscreenDialog",
    title: "Open fullscreen",
    icon: fullscreenIcon,
    click: () => setOpen(true),
  };

  const baseConfig = {
    displaylogo: false,
    responsive: true,
    ...config,
    modeBarButtonsToAdd: [
      ...(config?.modeBarButtonsToAdd ?? []),
      fullscreenButton,
    ],
  };

  const defaultLayout: Partial<Plotly.Layout> = {
    template: t.plotlyTemplate as Plotly.Layout["template"],
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor: t.plot_bgcolor,
    font: { color: t.font_color },
    yaxis: { gridcolor: t.gridcolor, zerolinecolor: t.zerolinecolor },
    xaxis: { gridcolor: t.gridcolor, zerolinecolor: t.zerolinecolor },
    margin: { t: 50, l: 50, r: 50, b: 50 },
    autosize: true,
  };

  // Merge defaults with incoming layout deeply
  const mergedLayout: Partial<Plotly.Layout> = {
    ...defaultLayout,
    ...layout,
    font: {
      ...defaultLayout.font,
      ...layout?.font,
    },
    xaxis: {
      ...defaultLayout.xaxis,
      ...layout?.xaxis,
    },
    yaxis: {
      ...defaultLayout.yaxis,
      ...layout?.yaxis,
    },
    margin: {
      ...defaultLayout.margin,
      ...layout?.margin,
    },
  };

  const plotComponent = (
    <Plot
      data={data}
      layout={mergedLayout}
      config={baseConfig}
      useResizeHandler
      style={style || { width: "100%", height: "100%" }}
    />
  );

  return (
    <>
      {noBoxWrapper ? (
        plotComponent
      ) : (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "secondary.main",
            borderRadius: 5,
            padding: 2,
            width: "100%",
            height: "100%",
          }}
        >
          {plotComponent}
        </Box>
      )}

      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: { xs: 0, md: 2, lg: 12 },
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
          }}
        >
          <IconButton onClick={() => setOpen(false)} color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{ width: "100vw", height: "100vh", p: { xs: 2, md: 3, lg: 8 } }}
        >
          <Plot
            data={data}
            layout={mergedLayout}
            config={{
              ...baseConfig,
              modeBarButtonsToAdd: [],
            }}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
          />
        </Box>
      </Dialog>
    </>
  );
};
