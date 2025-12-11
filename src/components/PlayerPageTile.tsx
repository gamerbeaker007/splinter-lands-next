"use client";

import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { alpha } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlayerPageTile() {
  const { setSelectedPlayer } = usePlayer();
  const [player, setPlayer] = useState("");
  const router = useRouter();

  const gotoOverview = () => {
    const trimmed = player.trim();
    if (trimmed) {
      setSelectedPlayer(trimmed);
    }
    router.push("/player-overview/dashboard");
  };

  const gotoDeeds = () => {
    const trimmed = player.trim();
    if (trimmed) {
      setSelectedPlayer(trimmed);
    }
    router.push("/player-overview/deed");
  };

  const gotoRegionOverview = () => {
    const trimmed = player.trim();
    if (trimmed) {
      setSelectedPlayer(trimmed);
    }
    router.push("/player-overview/overview");
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
          size="small"
          placeholder="Enter player name (optional)"
          value={player}
          onChange={(e) => setPlayer(e.target.value.toLowerCase())}
          onKeyDown={(e) => e.key === "Enter" && gotoOverview()}
          sx={{
            mt: 2,
            mb: 4,
            backgroundColor: alpha("#696666a7", 0.8),
            borderRadius: 1,
          }}
        />

        <Box display="flex" flexDirection="row" gap={1}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={gotoOverview}
          >
            dashboard
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={gotoRegionOverview}
          >
            Region
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={gotoDeeds}
          >
            Deeds
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
