"use client";

import { editionMap } from "@/types/editions";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

/**
 * The four selectable arrays mirror the spl-stats edition filter, but keyed by
 * land **set name** (the collection's card_set) instead of a numeric tier:
 *  - `editions`  — native edition ids (each id maps to exactly one set)
 *  - `promoSets` / `rewardSets` / `extraSets` — set names whose cross-era
 *    Promo (edition 2) / Reward (edition 3) / Extra (edition 17) cards are on.
 */
export interface EditionFilterValue {
  editions: number[];
  promoSets: string[];
  rewardSets: string[];
  extraSets: string[];
}

/** Cross-era edition ids shared across sets (set is taken from the card). */
export const CROSS_ERA_EDITIONS = { promo: 2, reward: 3, extra: 17 } as const;

interface LandSetDef {
  setName: string;
  label: string;
  /** Native edition ids that belong only to this set. */
  nativeEditions: number[];
  hasPromo: boolean;
  hasReward: boolean;
  hasExtra: boolean;
}

/**
 * Land-valid sets only (non-land sets/editions are intentionally excluded).
 * Escalation (20) and Conclave Rewards (18) live under Conclave.
 */
const LAND_SET_DEFS: LandSetDef[] = [
  {
    setName: "alpha",
    label: "Alpha",
    nativeEditions: [0],
    hasPromo: true,
    hasReward: false,
    hasExtra: false,
  },
  {
    setName: "beta",
    label: "Beta",
    nativeEditions: [1],
    hasPromo: true,
    hasReward: true,
    hasExtra: false,
  },
  {
    setName: "untamed",
    label: "Untamed",
    nativeEditions: [4, 5],
    hasPromo: true,
    hasReward: true,
    hasExtra: false,
  },
  {
    setName: "chaos",
    label: "Chaos",
    nativeEditions: [7, 8, 10],
    hasPromo: true,
    hasReward: true,
    hasExtra: false,
  },
  {
    setName: "rebellion",
    label: "Rebellion",
    nativeEditions: [12, 13],
    hasPromo: true,
    hasReward: false,
    hasExtra: false,
  },
  {
    setName: "conclave",
    label: "Conclave",
    nativeEditions: [14, 18, 20],
    hasPromo: true,
    hasReward: false,
    hasExtra: true,
  },
  {
    setName: "land",
    label: "Land",
    nativeEditions: [19],
    hasPromo: false,
    hasReward: false,
    hasExtra: false,
  },
];

/** Sets considered "Modern" format. */
const MODERN_SETS = ["rebellion", "conclave"];

const editionIcon = (id: number) => editionMap[id]?.setIcon ?? "";
const PROMO_ICON = editionIcon(CROSS_ERA_EDITIONS.promo);
const REWARD_ICON = editionIcon(CROSS_ERA_EDITIONS.reward);
const EXTRA_ICON = editionIcon(CROSS_ERA_EDITIONS.extra);

function IconBox({
  icon,
  label,
  active,
  partial,
  size,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  partial?: boolean;
  size: number;
  onClick: () => void;
}) {
  return (
    <Tooltip title={label} placement="top" arrow>
      <Box
        onClick={onClick}
        sx={{
          width: size,
          height: size,
          p: 0.5,
          cursor: "pointer",
          borderRadius: 1,
          border: 2,
          borderColor: active
            ? "primary.main"
            : partial
              ? "warning.main"
              : "divider",
          bgcolor: active || partial ? "action.selected" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: active || partial ? 1 : 0.5,
          transition: "all 0.15s",
          "&:hover": { bgcolor: "action.hover", opacity: 1 },
        }}
      >
        {icon && (
          <Image
            src={icon}
            alt={label}
            width={size - 12}
            height={size - 12}
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

interface Props {
  value: EditionFilterValue;
  onChange: (value: EditionFilterValue) => void;
}

const toggle = <T,>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

/**
 * Edition/set filter ported from spl-stats: Modern / Wild quick-select, a
 * per-set icon (toggles all of that set's native editions + its cross-era
 * Promo/Reward/Extra), and per-variant sub-icons. Land-valid sets only.
 */
export default function LandEditionSetFilter({ value, onChange }: Props) {
  const editionSet = new Set(value.editions);

  const isSetFull = (def: LandSetDef) =>
    def.nativeEditions.every((id) => editionSet.has(id)) &&
    (!def.hasPromo || value.promoSets.includes(def.setName)) &&
    (!def.hasReward || value.rewardSets.includes(def.setName)) &&
    (!def.hasExtra || value.extraSets.includes(def.setName));

  const isSetPartial = (def: LandSetDef) =>
    !isSetFull(def) &&
    (def.nativeEditions.some((id) => editionSet.has(id)) ||
      (def.hasPromo && value.promoSets.includes(def.setName)) ||
      (def.hasReward && value.rewardSets.includes(def.setName)) ||
      (def.hasExtra && value.extraSets.includes(def.setName)));

  const applySets = (defs: LandSetDef[], on: boolean): EditionFilterValue => {
    const names = new Set(defs.map((d) => d.setName));
    const nativeIds = defs.flatMap((d) => d.nativeEditions);
    if (on) {
      return {
        editions: [...new Set([...value.editions, ...nativeIds])],
        promoSets: [
          ...new Set([
            ...value.promoSets,
            ...defs.filter((d) => d.hasPromo).map((d) => d.setName),
          ]),
        ],
        rewardSets: [
          ...new Set([
            ...value.rewardSets,
            ...defs.filter((d) => d.hasReward).map((d) => d.setName),
          ]),
        ],
        extraSets: [
          ...new Set([
            ...value.extraSets,
            ...defs.filter((d) => d.hasExtra).map((d) => d.setName),
          ]),
        ],
      };
    }
    return {
      editions: value.editions.filter((id) => !nativeIds.includes(id)),
      promoSets: value.promoSets.filter((s) => !names.has(s)),
      rewardSets: value.rewardSets.filter((s) => !names.has(s)),
      extraSets: value.extraSets.filter((s) => !names.has(s)),
    };
  };

  const toggleSet = (def: LandSetDef) =>
    onChange(applySets([def], !isSetFull(def)));

  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        Sets / Editions:
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ mb: 0.75 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            onChange(
              applySets(
                LAND_SET_DEFS.filter((d) => MODERN_SETS.includes(d.setName)),
                true
              )
            )
          }
          sx={{ flex: 1, textTransform: "none", fontSize: 12, py: 0.25 }}
        >
          Modern
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() =>
            onChange({
              editions: [],
              promoSets: [],
              rewardSets: [],
              extraSets: [],
            })
          }
          sx={{ flex: 1, textTransform: "none", fontSize: 12, py: 0.25 }}
        >
          Wild (all)
        </Button>
      </Stack>

      <Stack spacing={0.5}>
        {LAND_SET_DEFS.map((def) => (
          <Stack
            key={def.setName}
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            gap={0.5}
          >
            <IconBox
              icon={editionIcon(def.nativeEditions[0])}
              label={`${def.label} (select all)`}
              active={isSetFull(def)}
              partial={isSetPartial(def)}
              size={36}
              onClick={() => toggleSet(def)}
            />
            {def.nativeEditions.map((id) => (
              <IconBox
                key={id}
                icon={editionIcon(id)}
                label={editionMap[id]?.displayName ?? `Edition ${id}`}
                active={editionSet.has(id)}
                size={28}
                onClick={() =>
                  onChange({ ...value, editions: toggle(value.editions, id) })
                }
              />
            ))}
            {def.hasPromo && (
              <IconBox
                icon={PROMO_ICON}
                label={`${def.label} Promo`}
                active={value.promoSets.includes(def.setName)}
                size={28}
                onClick={() =>
                  onChange({
                    ...value,
                    promoSets: toggle(value.promoSets, def.setName),
                  })
                }
              />
            )}
            {def.hasReward && (
              <IconBox
                icon={REWARD_ICON}
                label={`${def.label} Reward`}
                active={value.rewardSets.includes(def.setName)}
                size={28}
                onClick={() =>
                  onChange({
                    ...value,
                    rewardSets: toggle(value.rewardSets, def.setName),
                  })
                }
              />
            )}
            {def.hasExtra && (
              <IconBox
                icon={EXTRA_ICON}
                label={`${def.label} Extra`}
                active={value.extraSets.includes(def.setName)}
                size={28}
                onClick={() =>
                  onChange({
                    ...value,
                    extraSets: toggle(value.extraSets, def.setName),
                  })
                }
              />
            )}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
