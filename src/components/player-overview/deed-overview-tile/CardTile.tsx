import { formatLargeNumber } from "@/lib/formatters";
import { getCardImg, RarityColor } from "@/lib/utils/cardUtil";
import { land_hammer_icon_url } from "@/scripts/statics_icon_urls";
import { Rarity } from "@/types/rarity";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import PPMultiplierDot from "./PPMultiplierDot";

type Props = {
  name: string;
  rarity: string;
  edition: number;
  foil: number;
  terrain_boost: number;
  actual_bcx: number;
  max_bcx: number | string;
  base_pp: number;
  boosted_pp: number;
  uid: string;
};

export default function CardTile({
  name,
  edition,
  rarity,
  foil,
  terrain_boost,
  actual_bcx,
  max_bcx,
  base_pp,
  boosted_pp,
  uid,
}: Props) {
  const isFoil = foil === 1 || foil === 2;
  const hasNegativeTerrain = terrain_boost < 0;
  const img =
    name === "Runi"
      ? `https://runi.splinterlands.com/cards/${uid}.jpg`
      : getCardImg(name, edition, foil);

  return (
    <>
      <Box>
        <Box
          width={75}
          height={75}
          border={isFoil ? "2px solid gold" : "1px solid gray"}
          borderRadius={2}
          overflow="hidden"
          position="relative"
          bgcolor="background.paper"
        >
          {/* Top cropped card image */}
          <Box height={150} position="relative">
            <Image
              src={img}
              alt={name}
              fill
              style={{
                objectFit: "cover",
                objectPosition: "top center",
                marginTop: "-10px",
              }}
            />
          </Box>

          {/* Top-right BCX info */}
          <Box
            position="absolute"
            top={5}
            right={2}
            bgcolor="rgba(0,0,0,0.7)"
            color="white"
            fontSize="0.625rem"
            px={0.5}
            borderRadius={1}
          >
            {actual_bcx}/{max_bcx}
          </Box>

          {/* Top-left rarity dot (placeholder logic) */}
          <Box
            position="absolute"
            top={5}
            left={5}
            width={14}
            height={14}
            borderRadius="50%"
            border={1}
            bgcolor={RarityColor[rarity]}
          />

          {/* bottom-left multiplier dot (placeholder logic) */}
          <PPMultiplierDot
            rarity={rarity as Rarity}
            foil={foil}
            bcx={actual_bcx}
            basePP={base_pp}
          />

          {/* Bottom-right warning if terrain boost is negative */}
          {hasNegativeTerrain && (
            <Tooltip title="This card has a negative terrain boost.">
              <WarningAmberIcon
                fontSize="small"
                sx={{
                  borderRadius: 1,
                  padding: "3px",
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  color: "red",
                  fontSize: "21px",
                  backgroundColor: "black",
                }}
              />
            </Tooltip>
          )}
        </Box>
        <Box
          p={1}
          display="flex"
          flexDirection="column"
          alignItems="start"
          gap={0.5}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <Image
              src={land_hammer_icon_url}
              alt="hammer"
              width={10}
              height={10}
            />
            <Typography fontSize="0.625rem">
              {formatLargeNumber(Number(base_pp))}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Image
              src={land_hammer_icon_url}
              alt="hammer"
              width={10}
              height={10}
            />
            <Typography fontSize="0.625rem">
              {formatLargeNumber(Number(boosted_pp))}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
