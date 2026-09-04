import { getPlannerLink } from "@/lib/utils/deedUtil";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import React from "react";
import { GrPlan } from "react-icons/gr";

export type Props = {
  plotId: number;
};

export const PlanningLink: React.FC<Props> = ({ plotId }) => {
  const plannerLinkUrl = getPlannerLink(plotId);

  return (
    <Tooltip title="Plan this Plot">
      <IconButton
        size="small"
        component={Link}
        href={plannerLinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          bgcolor: "rgba(255,255,255,0.85)",
          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
        }}
      >
        {/* react-icons ignores MUI's fontSize="small"; size 20px matches the
            MUI icons next to it (small = 1.25rem). */}
        <GrPlan size={20} color="#666" />
      </IconButton>
    </Tooltip>
  );
};
