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

    let cancelled = false;
    const fetchInventory = async () => {
      setLoadingInventory(true);
      try {
        const data = await getPlayerInventory(playerName);
        if (cancelled) return;
        setInventory(data);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load inventory:", err);
        setInventory([]);
      } finally {
        if (!cancelled) setLoadingInventory(false);
      }
    };
    fetchInventory();
    return () => {
      cancelled = true;
    };
  }, [playerName]);

  return { inventory, loadingInventory };
}
