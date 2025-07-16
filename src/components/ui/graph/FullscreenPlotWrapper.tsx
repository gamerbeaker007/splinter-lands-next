"use client";
import React, { useState } from "react";
import { Dialog, Box, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Plot from "react-plotly.js";

interface FullscreenPlotWrapperProps {
  data: Partial<Plotly.PlotData>[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
  className?: string;
  titleSuffix?: string; // optional extra for fullscreen title
  noBoxWrapper?: boolean;
}

export const FullscreenPlotWrapper: React.FC<FullscreenPlotWrapperProps> = ({
  data,
  layout,
  config,
  style,
  className,
  titleSuffix = " (Fullscreen)",
  noBoxWrapper = false,
}) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;
  const gridLineColor = theme.palette.divider;

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
    paper_bgcolor: backgroundColor,
    plot_bgcolor: backgroundColor,
    font: { color: textColor },
    yaxis: { gridcolor: gridLineColor },
    xaxis: { gridcolor: gridLineColor },
    margin: { t: 50, l: 50, r: 50, b: 50 },
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
      className={className}
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
        sx={{ style: { backgroundColor } }}
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
            layout={{
              ...layout,
              title: {
                ...layout?.title,
                text: layout?.title?.text
                  ? layout.title.text + titleSuffix
                  : titleSuffix,
                font: { color: textColor },
              },
              height: undefined,
            }}
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
