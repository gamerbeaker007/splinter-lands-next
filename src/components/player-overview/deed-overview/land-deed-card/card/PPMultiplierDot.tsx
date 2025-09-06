import { getFoilLabel } from "@/lib/utils/cardUtil";
import { CardRarity } from "@/types/planner";
import { Box, Tooltip } from "@mui/material";

interface Props {
  rarity: CardRarity;
  foil: number; // 0 = regular, 1-4 = gold
  bcx: number;
  max_bcx: number;
  basePP: number;
}

const basePPMaxMap: Record<CardRarity, Record<0 | 1, number>> = {
  common: { 0: 1000, 1: 2000 },
  rare: { 0: 1100, 1: 4000 },
  epic: { 0: 1250, 1: 6000 },
  legendary: { 0: 1500, 1: 10000 },
};

const PPMultiplierDot = ({ rarity, foil, bcx, max_bcx, basePP }: Props) => {
  const foilKey: 0 | 1 = foil === 0 ? 0 : 1;

  const basePPMax = basePPMaxMap[rarity][foilKey];
  const productionPointsPerBCX = basePPMax / max_bcx;
  const wihtoutMultiplierPP = productionPointsPerBCX * bcx;
  const multiplier = basePP / ((bcx / max_bcx) * basePPMax);

  return multiplier.toFixed(0) != "1" ? (
    <Tooltip
      title={
        <>
          <strong>Base PP Multiplier:</strong>
          <br />
          Foil: {getFoilLabel(foil)}
          <br />1 BCX PP: {productionPointsPerBCX.toFixed(2)}
          <br />
          {bcx} BCX PP: {wihtoutMultiplierPP.toFixed(2)}
          <br />
          Received PP: {basePP}
          <br />
          <strong>Multiplier: {multiplier.toFixed(2)}×</strong>
        </>
      }
    >
      <Box
        border="solid 1px white"
        position="absolute"
        height={20}
        width={35}
        bottom={4}
        left={5}
        bgcolor="lightblue"
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
        {multiplier.toFixed(1)}x
      </Box>
    </Tooltip>
  ) : (
    <></>
  );
};

export default PPMultiplierDot;
