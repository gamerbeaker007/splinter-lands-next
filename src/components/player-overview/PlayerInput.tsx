import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  onPlayerChange: (player: string) => void;
};

export default function PlayerInput({ onPlayerChange }: Props) {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    const player = searchParams.get("player");
    if (player) {
      setInput(player);
      onPlayerChange(player);
    }
  }, [searchParams, onPlayerChange]);

  const handleLoad = () => {
    onPlayerChange(input);
    router.push(input ? `?player=${input}` : "?");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLoad();
    }
  };

  return (
    <TextField
      label="Enter Player"
      value={input}
      onChange={(e) => setInput(e.target.value)}
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
