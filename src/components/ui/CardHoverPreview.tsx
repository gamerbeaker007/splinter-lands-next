"use client";

import { arcane_glimmer_url } from "@/lib/shared/statics_icon_urls";
import { isArcaneFoil } from "@/lib/utils/cardUtil";
import { Box, Tooltip, TooltipProps } from "@mui/material";
import Image from "next/image";
import { ReactElement, ReactNode } from "react";

const PREVIEW_WIDTH = 220;

type Props = {
  /** Full card image URL. */
  img: string;
  name: string;
  /** Numeric foil id; arcane foils get the animated glimmer overlay. */
  foil: number;
  /** Shown under the card (e.g. listing details). */
  details?: ReactNode;
  placement?: TooltipProps["placement"];
  children: ReactElement;
};

/** Shows the full-size card on hover, with the arcane glimmer for arcane foils. */
export default function CardHoverPreview({
  img,
  name,
  foil,
  details,
  placement = "right",
  children,
}: Props) {
  return (
    <Tooltip
      title={
        <Box width={PREVIEW_WIDTH}>
          {/* The card determines the height; the glimmer fills it. */}
          <Box position="relative" lineHeight={0}>
            {/* Card art ratios differ per edition (and Runi), so the size
                comes from CSS: 0×0 + `sizes` is Next's pattern for that. */}
            <Image
              src={img}
              alt={name}
              width={0}
              height={0}
              sizes={`${PREVIEW_WIDTH}px`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {isArcaneFoil(foil) && (
              <Image
                src={arcane_glimmer_url}
                alt=""
                aria-hidden
                width={0}
                height={0}
                fill
                // Optimizing would flatten the animated webp to one frame.
                unoptimized
                style={{ objectFit: "contain", pointerEvents: "none" }}
              />
            )}
          </Box>
          {details && <Box mt={1}>{details}</Box>}
        </Box>
      }
      placement={placement}
      arrow
    >
      {children}
    </Tooltip>
  );
}
