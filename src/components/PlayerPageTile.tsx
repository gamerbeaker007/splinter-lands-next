"use client";

import { alpha, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <Card
      elevation={4}
      sx={{ position: "relative", p: 2, height: "100%", width: "100%" }}
    >
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
          onChange={(e) => setPlayer(e.target.value.toLowerCase())}
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
