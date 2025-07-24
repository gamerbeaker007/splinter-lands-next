import { getFoilLabel } from "@/lib/utils/cardUtil";
import { Box, Tooltip, Typography } from "@mui/material";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

interface Props {
  rarity: Rarity;
  foil: number; // 0 = regular, 1-4 = gold
  bcx: number;
  max_bcx: number;
  basePP: number;
}

const basePPMaxMap: Record<Rarity, Record<0 | 1, number>> = {
  Common: { 0: 1000, 1: 2000 },
  Rare: { 0: 1100, 1: 4000 },
  Epic: { 0: 1250, 1: 6000 },
  Legendary: { 0: 1500, 1: 10000 },
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
        position="absolute"
        bottom={5}
        left={5}
        width={30}
        height={20}
        borderRadius="20%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          backgroundColor: "#D0E8FF",
          border: "1px solid #1976D2",
          cursor: "pointer",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.6rem",
            fontWeight: "bold",
            color: "#0D47A1",
            fontFamily: "monospace",
          }}
        >
          {multiplier.toFixed(1)}x
        </Typography>
      </Box>
    </Tooltip>
  ) : (
    <></>
  );
};

export default PPMultiplierDot;
