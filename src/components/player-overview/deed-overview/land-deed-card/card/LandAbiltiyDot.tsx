import {
  bloodline_icon_url,
  dec_stake_discount_icon_url,
  edition_land_card_icon_url,
  energized_icon_url,
  labors_luck_icon_url,
  rationing_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { bountifulResourceIconMap, LandBoost } from "@/types/planner";
import { Avatar, Box, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

interface Props {
  landBoosts?: LandBoost;
}

const sizeIcon = 20;
const fontSize = "0.75rem";

function formatPercentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

const LandAbilityDot = ({ landBoosts }: Props) => {
  if (!landBoosts) {
    return null;
  }

  const hasAnyBoost =
    (landBoosts.produceBoost &&
      Object.values(landBoosts.produceBoost).some((value) => value > 0)) ||
    (landBoosts.consumeGrainDiscount ?? 0) > 0 ||
    (landBoosts.bloodlineBoost ?? 0) > 0 ||
    (landBoosts.decDiscount ?? 0) > 0 ||
    landBoosts.replacePowerCore ||
    landBoosts.laborLuck;

  if (!hasAnyBoost) {
    return null;
  }

  return (
    <Tooltip
      title={
        <Stack spacing={0.5}>
          <Typography fontSize={fontSize} fontWeight="bold">
            Land Abilities:
          </Typography>

          {landBoosts.decDiscount > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Image
                src={dec_stake_discount_icon_url}
                alt="DEC Discount"
                width={sizeIcon}
                height={sizeIcon}
              />
              <Typography fontSize={fontSize}>
                Dark Discount: -{formatPercentage(landBoosts.decDiscount)}
              </Typography>
            </Stack>
          )}

          {landBoosts.produceBoost &&
            Object.entries(landBoosts.produceBoost).map(
              ([resource, value]) =>
                value > 0 && (
                  <Stack
                    key={resource}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Image
                      src={bountifulResourceIconMap[resource] ?? ""}
                      alt={resource}
                      width={sizeIcon}
                      height={sizeIcon}
                    />
                    <Typography fontSize={fontSize}>
                      Bountiful {resource}: +{formatPercentage(value)}
                    </Typography>
                  </Stack>
                )
            )}

          {landBoosts.consumeGrainDiscount > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Image
                src={rationing_icon_url}
                alt="Rationing"
                width={sizeIcon}
                height={sizeIcon}
              />
              <Typography fontSize={fontSize}>
                Rationing: -{formatPercentage(landBoosts.consumeGrainDiscount)}
              </Typography>
            </Stack>
          )}

          {landBoosts.bloodlineBoost > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Image
                src={bloodline_icon_url}
                alt="Bloodline"
                width={sizeIcon}
                height={sizeIcon}
              />
              <Typography fontSize={fontSize}>
                Toil and Kin: +{formatPercentage(landBoosts.bloodlineBoost)}
              </Typography>
            </Stack>
          )}

          {landBoosts.replacePowerCore && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Image
                src={energized_icon_url}
                alt="Energized"
                width={sizeIcon}
                height={sizeIcon}
              />
              <Typography fontSize={fontSize}>
                Energized: -1 Power Core
              </Typography>
            </Stack>
          )}

          {landBoosts.laborLuck && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Image
                src={labors_luck_icon_url}
                alt="Labor's Luck"
                width={sizeIcon}
                height={sizeIcon}
              />
              <Typography fontSize={fontSize}>Labor&apos;s Luck</Typography>
            </Stack>
          )}
        </Stack>
      }
    >
      <Box
        position="absolute"
        height={20}
        top={32}
        right={5}
        px={0.6}
        borderRadius={0.5}
      >
        <Avatar sx={{ width: 20, height: 20, bgcolor: "black" }}>
          <Image
            src={edition_land_card_icon_url}
            alt="Labor's Luck"
            width={sizeIcon}
            height={sizeIcon}
          />
        </Avatar>
      </Box>
    </Tooltip>
  );
};

export default LandAbilityDot;
