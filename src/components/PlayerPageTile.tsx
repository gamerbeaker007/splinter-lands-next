"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function PlayerPageTile() {
  const [player, setPlayer] = useState("");
  const router = useRouter();

  const handleClick = () => {
    const trimmed = player.trim();
    router.push(
      trimmed ? `/player-overview?player=${trimmed}` : "/player-overview",
    );
  };

  return (
    <Card elevation={4} sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Player Overview
        </Typography>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter player name (optional)"
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleClick()}
          sx={{ mb: 2 }}
        />

        <Box>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleClick}
          >
            Go
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
