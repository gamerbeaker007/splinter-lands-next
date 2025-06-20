import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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
    if (!input) return;
    onPlayerChange(input);
    router.push(`?player=${input}`);
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
