"use client";

import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useEffect, useState } from "react";

export default function PlayerInput() {
  const { selectedPlayer, setSelectedPlayer } = usePlayer();
  const [inputValue, setInputValue] = useState("");

  // Sync input value when context changes
  useEffect(() => {
    setInputValue(selectedPlayer);
  }, [selectedPlayer]);

  const handleLoad = () => {
    setSelectedPlayer(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLoad();
    }
  };

  return (
    <TextField
      label="Enter Player"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value.toLowerCase())}
      onKeyDown={handleKeyPress}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">👨‍🌾</InputAdornment>,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleLoad}>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
