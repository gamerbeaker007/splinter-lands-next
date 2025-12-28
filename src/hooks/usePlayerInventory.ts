import { getPlayerInventory } from "@/lib/backend/actions/player/inventory-actions";
import { SplInventory } from "@/types/spl/inventory";
import { useEffect, useState } from "react";

export function usePlayerInventory(playerName: string | null) {
  const [inventory, setInventory] = useState<SplInventory[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    if (!playerName) {
      setInventory([]);
      return;
    }

    const fetchInventory = async () => {
      setLoadingInventory(true);
      try {
        const data = await getPlayerInventory(playerName);
        setInventory(data);
      } catch (err) {
        console.error("Failed to load inventory:", err);
        setInventory([]);
      } finally {
        setLoadingInventory(false);
      }
    };
    fetchInventory();
  }, [playerName]);

  return { inventory, loadingInventory };
}
