import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import React from "react";

type Props = {
  title: string;
  maxPossibleStakedDec: number;
  totalDecStaked: number;
  totalDecNeeded: number;
  runiStakedDEC?: number;
};

const DecGaugeIndicator: React.FC<Props> = ({
  title,
  maxPossibleStakedDec,
  totalDecStaked,
  totalDecNeeded,
  runiStakedDEC = 0,
}) => {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const backgroundColor = theme.palette.background.default;
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const yellowStart = totalDecStaked;
  const yellowEnd = totalDecStaked + runiStakedDEC;

  const delta = totalDecStaked - totalDecNeeded;
  const formattedDelta = formatNumberWithSuffix(Math.abs(delta));
  const deltaText =
    delta === 0
      ? `${formattedDelta} DEC`
      : `${delta >= 0 ? "▲" : "▼"} ${formattedDelta} DEC`;

  return (
    <Box
      sx={{
        transform: "scale(0.95)",
        transformOrigin: "top left",
        border: "1px solid",
        borderColor: "secondary.main",
        backgroundColor,
        borderRadius: 5,
        padding: 2,
        marginLeft: 2,
        minWidth: isSmallScreen ? 250 : 400,
        width: "100%",
        aspectRatio: "7 / 6",
      }}
    >
      <FullscreenPlotWrapper
        noBoxWrapper={true}
        data={[
          {
            type: "indicator",
            mode: "gauge",
            value: totalDecStaked,
            title: {
              text: title,
              font: { size: 18, color: textColor },
            },
            gauge: {
              axis: {
                range: [0, maxPossibleStakedDec],
                tickwidth: 1,
                tickcolor: textColor,
                color: textColor,
              },
              steps: [
                {
                  range: [yellowStart, yellowEnd],
                  color: "yellow",
                },
              ],
              threshold: {
                line: { color: "red", width: 4 },
                thickness: 0.5,
                value: maxPossibleStakedDec,
              },
              bar: { color: "blue" },
            },
            domain: { x: [0, 1], y: [0, 1] },
          },
        ]}
        layout={{
          autosize: true,
          margin: { t: 50, b: 0, l: 0, r: 0 },
          annotations: [
            {
              text: `${formatNumberWithSuffix(totalDecStaked)} DEC`,
              x: 0.5,
              y: 0.25,
              xref: "paper",
              yref: "paper",
              showarrow: false,
              font: {
                size: 30,
              },
            },
            {
              text: deltaText,
              x: 0.5,
              y: 0.15,
              xref: "paper",
              yref: "paper",
              showarrow: false,
              font: {
                size: 18,
                color: delta >= 0 ? "green" : "red",
              },
            },
          ],
        }}
      />
    </Box>
  );
};

export default DecGaugeIndicator;
