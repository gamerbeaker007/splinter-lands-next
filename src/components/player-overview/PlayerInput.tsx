import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useState } from "react";

type Props = {
  onPlayerChange: (player: string) => void;
};

function PlayerInputContent({ onPlayerChange }: Props) {
  const searchParams = useSearchParams();
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const player = searchParams.get("player");
      if (player) {
        setSelectedPlayer(player);
        onPlayerChange(player);
      }
    })();
  }, [searchParams, onPlayerChange]);

  const handleLoad = () => {
    const trimmed = selectedPlayer.trim();

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("player", trimmed);
    } else {
      params.delete("player");
    }

    const nextQs = params.toString();
    const currentQs = searchParams.toString();
    if (nextQs !== currentQs) {
      router.replace(`?${nextQs}`, { scroll: false });
    }

    startTransition(() => {
      onPlayerChange(trimmed); // still pass tab to parent if you need it
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLoad();
    }
  };

  return (
    <TextField
      label="Enter Player"
      value={selectedPlayer}
      onChange={(e) => setSelectedPlayer(e.target.value.toLowerCase())}
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

export default function PlayerInput({ onPlayerChange }: Props) {
  return (
    <Suspense fallback={<TextField label="Enter Player" disabled />}>
      <PlayerInputContent onPlayerChange={onPlayerChange} />
    </Suspense>
  );
}
