"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material";

export default function PlayerPageTile() {
  const [player, setPlayer] = useState("");
  const router = useRouter();
  const theme = useTheme();
  const paperColor = theme.palette.background.paper;

  const handleClick = () => {
    const trimmed = player.trim();
    router.push(
      trimmed ? `/player-overview?player=${trimmed}` : "/player-overview",
    );
  };

  const temp_image =
    "https://files.peakd.com/file/peakd-hive/beaker007/23uFPdKf8W8ZX71NBX84EzrbuDWKc44PmSAcGwNRzkmS25BuzUm5ySwCMfrXsDdoAMTYK.png";

  return (
    <Card elevation={4} sx={{ position: "relative", p: 2, minHeight: 200 }}>
      {/* Background image layer */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${temp_image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.5,
          zIndex: 0,
          borderRadius: 1,
        }}
        aria-hidden="true"
      />

      {/* Foreground content */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
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
          sx={{
            mb: 2,
            backgroundColor: alpha(paperColor, 0.5),
            borderRadius: 1,
          }}
        />

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleClick}
        >
          Go
        </Button>
      </Box>
    </Card>
  );
}
