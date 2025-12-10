"use client";

import { useAuth } from "@/lib/frontend/context/AuthContext";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { Box, Typography } from "@mui/material";
import CardTable from "./CardTable";

type Props = {
  cardPPResult: GroupedCardRow[];
  player: string;
};

export default function CollectionDisplay({ cardPPResult, player }: Props) {
  const { user } = useAuth();
  const isAuthenticated = user?.username === player;

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        borderRadius: 1,
        overflow: "auto",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Card Collection
      </Typography>
      <Typography
        variant="body2"
        gutterBottom
        color="text.secondary"
        sx={{ whiteSpace: "pre-line" }}
      >
        {`Only cards relevant for Land are shown. Cards with 0 Base PP and cards from special sets like "Soulbound", "Foundation", or "Extra" are excluded by default.`}
      </Typography>

      {cardPPResult && (
        <CardTable
          data={cardPPResult}
          isAuthenticated={isAuthenticated}
          pageSize={100}
        />
      )}
    </Box>
  );
}
