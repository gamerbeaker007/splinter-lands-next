import { Box, Typography } from "@mui/material";

type ProgressBarProps = {
  percentage: number;
  label: string;
  icon: string;
};

export const ProgressBar = ({ percentage, label, icon }: ProgressBarProps) => {
  // sizing knobs
  const ICON = 40; // circle diameter
  const ICON_IMG = 30; // inner image size
  const TRACK_H = 16; // bar height
  const OVERLAP = 4; // how much the icon overlaps the bar (px)

  const color =
    percentage >= 75
      ? "error.main"
      : percentage >= 40
        ? "warning.main"
        : "success.main";

  const trackBg = "grey.800";

  // keep a tiny visible fill when >0 so the rounded cap is noticeable
  const safeWidth =
    percentage > 0 && percentage < 2 ? 2 : Math.min(percentage, 100);

  return (
    <Box display="flex" width="100%" alignItems="center" height={ICON}>
      {/* Icon circle (sits on top of the bar and overlaps it) */}
      <Box
        aria-hidden
        sx={{
          width: ICON,
          height: ICON,
          borderRadius: "50%",
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid white`,
          bgcolor: trackBg,
          // Important: overlap the bar
          mr: `-${OVERLAP}px`,
          zIndex: 2,
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={icon}
          alt=""
          sx={{ width: ICON_IMG, height: ICON_IMG, objectFit: "contain" }}
        />
      </Box>

      {/* Track + fill */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          height: TRACK_H,
          // Pull the whole track left so it starts under the icon
          ml: 0,
          // Make sure the part tucked under stays behind the icon
          zIndex: 1,
        }}
      >
        {/* Track */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            bgcolor: trackBg,
            // Move the track left by the overlap amount
            // and extend its width so right edge still reaches full width.
            ml: `-${OVERLAP}px`,
            width: `calc(100% + ${OVERLAP}px)`,
          }}
        />

        {/* Fill */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            // Same left shift and width math for the fill so it aligns with the track
            ml: `-${OVERLAP}px`,
            width: `calc(${safeWidth}% + ${OVERLAP}px)`,
            transition: "width 0.35s ease",
            bgcolor: color,
            borderRadius: 999,
          }}
        />

        {/* Centered label */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            lineHeight: 1,
            fontWeight: 600,
            color: "white",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
};
