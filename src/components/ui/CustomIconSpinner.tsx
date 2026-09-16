"use client";

import { RESOURCE_ICON_MAP, worksiteTypeMapping } from "@/lib/shared/statics";
import { keyframes } from "@emotion/react";
import { Box, Typography } from "@mui/material";

const orbit = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

// Applied to each icon so it keeps facing the viewer while the ring turns —
// without it the icons tumble end over end as they travel.
const counterOrbit = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
`;

const DEFAULT_RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "AURA",
  "RESEARCH",
];

const DEFAULT_WORKSITES = [
  "Grain Farm",
  "Logging Camp",
  "Ore Mine",
  "Quarry",
  "Research Hut",
  "Aura Lab",
  "Shard Mine",
];

/** How an icon fills its (always square) slot on the ring. */
type IconFit = "cover" | "contain";

export type SpinnerIconType = "Resource" | "Worksite";

/**
 * Per-set defaults.
 *
 * Resource art is uniformly square (400×400 – 500×500), so it is simply fitted.
 * Worksite art is wide *and* inconsistent — from 176×138 (1.28:1) up to
 * 1923×743 (2.59:1) — so fitting it would put a 2.6:1 sliver next to a nearly
 * square icon. Cropping each one to a round token instead keeps the ring
 * visually even; it matches how WorksitePlotCard renders the same images.
 */
const ICON_SETS: Record<
  SpinnerIconType,
  { icons: string[]; map: Record<string, string>; fit: IconFit }
> = {
  Resource: {
    icons: DEFAULT_RESOURCES,
    map: RESOURCE_ICON_MAP,
    fit: "contain",
  },
  Worksite: {
    icons: DEFAULT_WORKSITES,
    map: worksiteTypeMapping,
    fit: "cover",
  },
};

interface Props {
  /** Outer diameter in px. */
  size?: number;
  /** Seconds for one full revolution. */
  durationSeconds?: number;
  /** Caption under the ring; also used as the accessible label. */
  label?: string;
  /** Which icon set to orbit. */
  iconType?: SpinnerIconType;
  /** Override the icon set's default fit. */
  iconFit?: IconFit;
}

/**
 * Loading indicator built from the land icons: they sit on a bordered circle
 * and orbit it clockwise. Used where a plain spinner would read as generic
 * chrome — e.g. over the region table while its balances load.
 */
export default function CustomIconSpinner({
  size = 72,
  iconType = "Resource",
  iconFit,
  durationSeconds = 6,
  label = "Loading…",
}: Readonly<Props>) {
  const iconSize = Math.max(14, Math.round(size / 4.5));
  // Keep the icons tucked just inside the border rather than straddling it.
  const radius = size / 2 - iconSize / 2 - 3;

  const { icons, map } = ICON_SETS[iconType];
  const fit = iconFit ?? ICON_SETS[iconType].fit;
  // A cropped icon needs the round frame to read as deliberate; a fitted one is
  // already the right shape and a frame would clip its corners.
  const cropped = fit === "cover";

  return (
    <Box
      role="status"
      aria-label={label}
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          border: 2,
          borderColor: "divider",
          // The ring turns; the icons inside counter-turn.
          animation: `${orbit} ${durationSeconds}s linear infinite`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        {icons.map((symbol, i) => {
          const src = map[symbol];
          if (!src) return null;
          // -90° puts the first icon at twelve o'clock; increasing angle then
          // runs clockwise because screen y grows downwards.
          const angle = (i / icons.length) * 2 * Math.PI - Math.PI / 2;
          return (
            // The slot stays square whatever the art's ratio: the counter-turn
            // spins about the box centre, so a non-square box would make the
            // icon wobble as it orbits. objectFit does the shaping instead.
            <Box
              key={symbol}
              aria-hidden="true"
              sx={{
                position: "absolute",
                width: iconSize,
                height: iconSize,
                left: size / 2 + radius * Math.cos(angle) - iconSize / 2,
                top: size / 2 + radius * Math.sin(angle) - iconSize / 2,
                borderRadius: cropped ? "50%" : 0,
                overflow: cropped ? "hidden" : "visible",
                border: cropped ? 1 : 0,
                borderColor: "divider",
                animation: `${counterOrbit} ${durationSeconds}s linear infinite`,
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
              }}
            >
              <Box
                component="img"
                src={src}
                alt=""
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: fit,
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </Box>
          );
        })}
      </Box>

      {label && (
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}
