"use client";

import {
  AvailableRuni,
  AvailableStakeItem,
  getAvailableRunis,
  getAvailableStakeItems,
  StakeItemKind,
} from "@/lib/backend/actions/land-manager/production-actions";
import {
  STAKE_TYPE_UID_LAND_POWER_CORE,
  STAKE_TYPE_UID_LAND_TITLE,
  STAKE_TYPE_UID_LAND_TOTEM,
} from "@/lib/shared/operations/opBuilders";
import { editionMap } from "@/types/editions";
import { cardFoilOptions } from "@/types/planner";

const ITEM_STAKE_TYPE: Record<string, string> = {
  powerCore: STAKE_TYPE_UID_LAND_POWER_CORE,
  totem: STAKE_TYPE_UID_LAND_TOTEM,
  title: STAKE_TYPE_UID_LAND_TITLE,
};
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { SpotCardVM, SpotItemVM } from "./productionConfigTypes";

/** Which spot the picker is filling. */
export type PickerKind = StakeItemKind | "runi";

export type PickerResult =
  | { kind: "item"; item: SpotItemVM }
  | { kind: "runi"; runi: SpotCardVM };

const TITLE_FOR: Record<PickerKind, string> = {
  powerCore: "Select a Power Core",
  totem: "Select a Totem",
  title: "Select a Title",
  runi: "Select a Runi",
};

interface Props {
  open: boolean;
  kind: PickerKind;
  onClose: () => void;
  onPick: (result: PickerResult) => void;
}

export default function AssetPickerDialog({
  open,
  kind,
  onClose,
  onPick,
}: Props) {
  // Mounted on demand (keyed by kind), so it always opens in a loading state.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AvailableStakeItem[]>([]);
  const [runis, setRunis] = useState<AvailableRuni[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      if (kind === "runi") {
        const res = await getAvailableRunis();
        if (cancelled) return;
        if (res.error) setError(res.error);
        setRunis(res.runis);
      } else {
        const res = await getAvailableStakeItems(kind);
        if (cancelled) return;
        if (res.error) setError(res.error);
        setItems(res.items);
      }
    };

    load()
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, kind]);

  const pickItem = (item: AvailableStakeItem) => {
    const vm: SpotItemVM = {
      uid: item.uid,
      name: item.name ?? "Item",
      stakeTypeUid: ITEM_STAKE_TYPE[kind] ?? "",
      boost: item.boost ?? 0,
      fromChain: false,
    };
    onPick({ kind: "item", item: vm });
  };

  const pickRuni = (runi: AvailableRuni) => {
    const vm: SpotCardVM = {
      uid: runi.uid,
      name: runi.name,
      rarity: "legendary",
      set: editionMap[runi.edition]?.setName ?? "",
      element: "dragon",
      secondaryElement: null,
      edition: runi.edition,
      foil: runi.foil,
      bcx: runi.bcx,
      maxBcx: runi.bcx,
      basePP: 0,
      boostedPP: 0,
      terrainBoost: 0,
      fromChain: false,
    };
    onPick({ kind: "runi", runi: vm });
  };

  const isEmpty = kind === "runi" ? runis.length === 0 : items.length === 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{TITLE_FOR[kind]}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : isEmpty ? (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            None available to assign.
          </Typography>
        ) : (
          <List dense disablePadding>
            {kind === "runi"
              ? runis.map((r) => (
                  <ListItemButton key={r.uid} onClick={() => pickRuni(r)}>
                    <ListItemText
                      primary={`${r.name} · lvl ${r.level}`}
                      secondary={`${cardFoilOptions[r.foil] ?? "regular"} · ${r.bcx} BCX`}
                    />
                  </ListItemButton>
                ))
              : items.map((it) => (
                  <ListItemButton key={it.uid} onClick={() => pickItem(it)}>
                    <ListItemText
                      primary={it.name ?? "Item"}
                      secondary={
                        [
                          it.rarity,
                          it.boost != null
                            ? `+${Math.round(it.boost * 100)}%`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || undefined
                      }
                    />
                  </ListItemButton>
                ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
