"use client";

import Image from "next/image";
import {
  land_castle_icon_url,
  land_keep_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { WorksiteType } from "@/types/planner";
import { Avatar, Box, Tooltip } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type Props = {
  player: string;
  worksiteType: WorksiteType;
};

export default function TaxOwnerTile({ player, worksiteType }: Props) {
  const isCastle = worksiteType === "CASTLE";
  return (
    <Box display={"flex"} flexWrap={"wrap"} gap={2}>
      <Box minWidth={250}>
        <Paper elevation={3} sx={{ p: 2, pt: 1, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tax Owner:
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title={isCastle ? "Castle" : "Keep"} arrow>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  <Image
                    src={isCastle ? land_castle_icon_url : land_keep_icon_url}
                    alt={player}
                    width={32}
                    height={32}
                  />
                </Avatar>
                {player}
              </Box>
            </Tooltip>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
