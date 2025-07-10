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
}

export const FullscreenPlotWrapper: React.FC<FullscreenPlotWrapperProps> = ({
  data,
  layout,
  config,
  style,
  className,
  titleSuffix = " (Fullscreen)",
}) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;
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

  return (
    <>
      <Plot
        data={data}
        layout={layout ?? {}}
        config={baseConfig}
        useResizeHandler
        style={style || { width: "100%", height: "100%" }}
        className={className}
      />

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
