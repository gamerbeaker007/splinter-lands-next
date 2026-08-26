"use client";

import {
  totemFragmentImg,
  totemFragmentLabel,
} from "@/lib/utils/totemFragmentUtil";
import { Box, Tooltip } from "@mui/material";
import Image from "next/image";

interface TotemFragmentImageProps {
  /** Engine fragment code, e.g. "TOTEMFC". */
  fragmentType: string | null | undefined;
  /** Rendered box size in px. */
  size?: number;
}

/**
 * Artwork for a totem fragment drop, with the rarity name on hover. Renders
 * nothing when the code is unknown — callers keep their own textual fallback.
 */
export default function TotemFragmentImage({
  fragmentType,
  size = 24,
}: TotemFragmentImageProps) {
  const img = totemFragmentImg(fragmentType);
  if (!img) return null;
  const label = totemFragmentLabel(fragmentType);

  return (
    <Tooltip title={label} placement="top" followCursor={true}>
      <Box width={size} height={size} position="relative" flexShrink={0}>
        <Image
          src={img}
          alt={label}
          fill
          sizes={`${size}px`}
          style={{ objectFit: "contain" }}
        />
      </Box>
    </Tooltip>
  );
}
