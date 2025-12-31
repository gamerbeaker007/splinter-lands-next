import { CardFoil } from "@/types/planner";
import { Box, Typography } from "@mui/material";
import { TbCardsFilled } from "react-icons/tb";

type FoilIconProps = {
  foil: CardFoil;
  size?: number;
  fontSizeRatio?: number; // Ratio of font size to icon size (default 0.5)
  fontWeight?: number | string; // Font weight for the badge text
  letterSpacing?: number | string; // Letter spacing for the badge text
  enhancedShadow?: boolean; // Use enhanced text shadow for larger icons
};

export default function FoilIcon({
  foil,
  size = 14,
  fontSizeRatio = 0.5,
  fontWeight = "bold",
  letterSpacing = 0.3,
  enhancedShadow = false,
}: FoilIconProps) {
  const foilStyle: Record<
    CardFoil,
    { iconColor: string; badgeText?: string; badgeColor?: string }
  > = {
    regular: { iconColor: "gray" },
    gold: { iconColor: "gold" },
    "gold arcane": {
      iconColor: "gold",
      badgeText: "GV",
      badgeColor: "black",
    },
    black: { iconColor: "black" },
    "black arcane": {
      iconColor: "black",
      badgeText: "BV",
      badgeColor: "white",
    },
  };

  const { iconColor, badgeText, badgeColor } =
    foilStyle[foil] ?? foilStyle.regular;
  const badgeFont = Math.max(6, Math.floor(size * fontSizeRatio));

  // Enhanced shadow for larger icons or when explicitly requested
  const textShadow = enhancedShadow
    ? badgeColor === "black"
      ? "0 0 2px rgba(255,255,255,0.9)"
      : "0 0 2px rgba(0,0,0,0.8)"
    : badgeColor === "black"
      ? "0 0 1px rgba(255,255,255,0.9)"
      : "0 0 1px rgba(0,0,0,0.8)";

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-block",
        lineHeight: 0,
      }}
    >
      <TbCardsFilled
        size={size}
        color={iconColor}
        style={{ display: "block" }}
      />
      {badgeText && (
        <Typography
          component="span"
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontSize: badgeFont,
            fontWeight: fontWeight,
            color: badgeColor,
            letterSpacing: letterSpacing,
            userSelect: "none",
            textShadow: textShadow,
          }}
        >
          {badgeText}
        </Typography>
      )}
    </Box>
  );
}
