"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerPageTile() {
  const [player, setPlayer] = useState("");
  const router = useRouter();

  const handleClick = () => {
    if (player.trim()) {
      router.push(`/player-overview?player=${player}`);
    } else {
      router.push("/player-overview");
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-2">Player Overview</h2>
      <input
        type="text"
        className="input input-bordered w-full mb-2"
        placeholder="Enter player name (optional)"
        value={player}
        onChange={(e) => setPlayer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      />
      <button className="btn btn-primary w-full" onClick={handleClick}>
        Go
      </button>
    </div>
  );
}
