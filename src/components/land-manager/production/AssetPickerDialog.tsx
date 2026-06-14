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
import { totemIconMap } from "@/lib/shared/statics";
import {
  land_hammer_icon_url,
  land_runi_power_core_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { getTitleIcon } from "@/lib/utils/deedUtil";
import { editionMap } from "@/types/editions";
import { cardFoilOptions } from "@/types/planner";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { SpotCardVM, SpotItemVM } from "./productionConfigTypes";

const ITEM_STAKE_TYPE: Record<string, string> = {
  powerCore: STAKE_TYPE_UID_LAND_POWER_CORE,
  totem: STAKE_TYPE_UID_LAND_TOTEM,
  title: STAKE_TYPE_UID_LAND_TITLE,
};

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
  /** Plot being configured — Runi availability is resolved against this deed. */
  deedUid: string;
  onClose: () => void;
  onPick: (result: PickerResult) => void;
}

export default function AssetPickerDialog({
  open,
  kind,
  deedUid,
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
        const res = await getAvailableRunis(deedUid);
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
  }, [open, kind, deedUid]);

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
      onWagon: false,
      inSet: false,
    };
    onPick({ kind: "runi", runi: vm });
  };

  const isEmpty = kind === "runi" ? runis.length === 0 : items.length === 0;

  function determineImageForItem(kind: PickerKind, name: string, uid: string) {
    if (kind === "powerCore") {
      return land_runi_power_core_icon_url;
    } else if (kind === "totem") {
      const rarity = name?.split(" ")[0].toLowerCase();
      return totemIconMap[rarity ?? ""]
        ? totemIconMap[rarity ?? ""]
        : land_hammer_icon_url;
    } else if (kind === "title") {
      return getTitleIcon(name ?? "");
    } else if (kind === "runi") {
      return `https://runi.splinterlands.com/cards/${uid}.jpg`;
    }
    return land_hammer_icon_url;
  }

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
                    <ListItemAvatar>
                      <Avatar
                        src={determineImageForItem(
                          "runi",
                          r.name ?? "",
                          r.uid ?? "unknown"
                        )}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${r.name} · lvl ${r.level}`}
                      secondary={`${cardFoilOptions[r.foil] ?? "regular"} · ${r.bcx} BCX`}
                    />
                  </ListItemButton>
                ))
              : items.map((it) => {
                  const img = determineImageForItem(
                    kind,
                    it.name ?? "",
                    it.uid ?? "unknown"
                  );
                  const name =
                    kind === "powerCore" ? "Power Core" : (it.name ?? "Item");
                  const uid = it.uid ?? "unknown";
                  return (
                    <ListItemButton key={uid} onClick={() => pickItem(it)}>
                      <ListItemAvatar>
                        <Avatar
                          src={img}
                          alt={name}
                          sx={{ width: 32, height: 32 }}
                        />
                      </ListItemAvatar>

                      <ListItemText
                        primary={name}
                        secondary={uid}
                        primaryTypographyProps={{
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{
                          fontSize: 12,
                          color: "text.secondary",
                        }}
                      />
                    </ListItemButton>
                  );
                })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
