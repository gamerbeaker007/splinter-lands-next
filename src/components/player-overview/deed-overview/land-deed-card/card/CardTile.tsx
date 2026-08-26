import { formatCompactNumber } from "@/lib/formatters";
import { getCardImgV2 } from "@/lib/utils/cardUtil";
import { cardFoilOptions, LandBoost, RarityColor } from "@/types/planner";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import LandAbilityDot from "./LandAbiltiyDot";
import PPMultiplierDot from "./PPMultiplierDot";

type Props = {
  name: string;
  rarity: string;
  edition: number;
  foil: number;
  terrain_boost: number;
  actual_bcx: number;
  max_bcx: number;
  base_pp: number;
  uid: string;
  boosted_pp?: number;
  landBoosts?: LandBoost;
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
  landBoosts,
}: Props) {
  const isFoil = foil === 1 || foil === 2;
  const isRuni = name === "Runi";

  const hasTerrainBoost = terrain_boost != 0;
  const hasNegativeTerrain = terrain_boost < 0;
  const hasPositiveTerrain = terrain_boost > 0;
  const terrain_boost_pct = (terrain_boost * 100).toFixed(0);
  const img = isRuni
    ? `https://runi.splinterlands.com/cards/${uid}.jpg`
    : getCardImgV2(name, edition, cardFoilOptions[foil]);

  const displayPP = Number(boosted_pp !== undefined ? boosted_pp : base_pp);

  return (
    <>
      <Box border={"solid 1xp red"} width={85} height={110}>
        <Box
          width={85}
          height={85}
          border={isFoil ? "2px solid gold" : "1px solid gray"}
          overflow="hidden"
          position="relative"
          bgcolor="background.paper"
          borderRadius={"10px 10px 0px 0px"}
        >
          {/* Top cropped card image */}
          <Box height={190} position="relative">
            <Image
              src={img}
              alt={name}
              fill
              sizes="150px"
              style={{
                objectFit: "cover",
                objectPosition: "top center",
                marginTop: "-15px",
              }}
            />
          </Box>

          {/* Top-right BCX info */}
          <Box
            border={"solid 1px white"}
            position="absolute"
            top={5}
            right={4}
            height={20}
            width={50}
            bgcolor="rgba(0,0,0,0.9)"
            color="white"
            fontSize="0.725rem"
            borderRadius={0.5}
            textAlign={"center"}
            fontWeight="bold"
            lineHeight={1.7}
          >
            {actual_bcx}/{max_bcx}
          </Box>

          {/* Top-left rarity dot (placeholder logic) */}
          <Box
            position="absolute"
            top={5}
            left={6}
            width={14}
            height={14}
            borderRadius="50%"
            border={1}
            bgcolor={RarityColor[rarity]}
          />

          {landBoosts && <LandAbilityDot landBoosts={landBoosts} />}

          {/* bottom-left multiplier dot (placeholder logic) */}
          <PPMultiplierDot
            rarity={rarity}
            foil={foil}
            bcx={actual_bcx}
            max_bcx={max_bcx}
            basePP={base_pp}
          />

          {/* Bottom-right warning if terrain boost is negative */}
          {hasTerrainBoost && (
            <Tooltip
              slotProps={{
                tooltip: {
                  sx: {
                    fontSize: "1rem",
                    "& strong": {
                      fontSize: "1rem",
                      fontWeight: 700,
                    },
                  },
                },
              }}
              title={
                hasNegativeTerrain
                  ? "This card has a negative terrain boost."
                  : ""
              }
              disableHoverListener={!hasNegativeTerrain} // only show tooltip when negative
            >
              <Box
                border="solid 1px white"
                position="absolute"
                height={20}
                width={35}
                bottom={4}
                right={4}
                bgcolor={
                  hasPositiveTerrain
                    ? "rgba(15, 190, 50, 0.9)"
                    : "rgba(190, 50, 15, 0.9)"
                }
                color="black"
                fontSize="0.725rem"
                fontWeight="bold"
                px={0.6}
                borderRadius={0.5}
                display="flex"
                justifyContent={"center"}
                textAlign={"center"}
                lineHeight={1.7}
              >
                {terrain_boost_pct}%
              </Box>
            </Tooltip>
          )}
        </Box>

        <Tooltip
          slotProps={{
            tooltip: {
              sx: {
                fontSize: "1.1rem",
                "& strong": {
                  fontSize: "1.1rem",
                  fontWeight: 700,
                },
              },
            },
          }}
          title={
            <>
              <strong>Production Power (PP):</strong>
              <br />
              Base: {formatCompactNumber(Number(base_pp))}
              {boosted_pp !== undefined && (
                <>
                  <br />
                  Boosted: {formatCompactNumber(Number(boosted_pp))}
                </>
              )}
            </>
          }
        >
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent={"center"}
            bgcolor="rgba(70, 71, 70, 0.9)"
            color="white"
            px={0.6}
            borderRadius={"0px 0px 10px 10px"}
            gap={0.5}
          >
            <Typography
              fontSize={isRuni ? "1.3rem" : "1.1rem"}
              fontWeight="bold"
            >
              {formatCompactNumber(Number(displayPP.toFixed(0)))}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </>
  );
}
