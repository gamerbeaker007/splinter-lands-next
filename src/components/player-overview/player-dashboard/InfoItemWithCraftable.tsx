import { Box, Typography, Tooltip } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  icon: string;
  title: string;
  number: number;
  precision?: number;
  creatable?: string;
  fontSize?: number;
  tooltip_craft?: React.ReactNode;
  tooltip_requirements?: Record<string, number>;
};

// Helper to render requirements as a <ul>
const renderRequirements = (requirements?: Record<string, number>) => {
  if (!requirements || requirements.length === 0) return null;
  return (
    <>
      <Typography variant={"body1"} fontSize={10}></Typography>
      <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
        {Object.entries(requirements).map(([key, value]) => (
          <li key={key}>
            <div key={key}>
              <strong>{key}:</strong> {value.toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export function InfoCreatableItem({
  icon,
  title,
  number,
  precision,
  creatable,
  fontSize = 14,
  tooltip_craft,
  tooltip_requirements,
}: Props) {
  const imageComponent = (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image src={icon} alt={title} width={36} height={36} />
    </Box>
  );

  return (
    <Box mb={1}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        {creatable ? (
          <Tooltip
            title={renderRequirements(tooltip_requirements)}
            disableHoverListener={!tooltip_requirements && !tooltip_craft}
          >
            {imageComponent}
          </Tooltip>
        ) : (
          imageComponent
        )}

        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="body2"
            fontSize={fontSize}
            sx={{
              fontFamily: "monospace",
              fontWeight: "bold",
              color: number >= 0 ? "success.main" : "error.main",
            }}
          >
            {precision ? number.toFixed(precision) : number.toLocaleString()}
          </Typography>

          {creatable && (
            <Tooltip
              title={tooltip_craft ?? ""}
              disableHoverListener={!tooltip_craft}
            >
              <Typography
                variant="body2"
                sx={{ color: "warning.main", fontFamily: "monospace" }}
              >
                ({creatable})
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}
