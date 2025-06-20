import { Box, Tooltip, Typography } from "@mui/material";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

interface Props {
  rarity: Rarity;
  foil: number; // 0 = regular, 1-4 = gold
  bcx: number;
  basePP: number;
}

const basePPMap: Record<Rarity, Record<0 | 1, number>> = {
  Common: { 0: 2.5, 1: 52.63 },
  Rare: { 0: 9.57, 1: 181.82 },
  Epic: { 0: 27.17, 1: 600 },
  Legendary: { 0: 136.36, 1: 2500 },
};

const PPMultiplierDot = ({ rarity, foil, bcx, basePP }: Props) => {
  const foilKey: 0 | 1 = foil === 0 ? 0 : 1;
  const productionPointsPerBCX = basePPMap[rarity][foilKey];
  const wihtoutMultiplierPP = bcx * productionPointsPerBCX;
  const multiplier = basePP / wihtoutMultiplierPP;

  return multiplier.toFixed(0) != "1" ? (
    <Tooltip
      title={
        <>
          <strong>Base PP Multiplier:</strong>
          <br />
          Foil: {foil}
          <br />1 BCX PP: {productionPointsPerBCX}
          <br />
          {bcx} BCX PP: {wihtoutMultiplierPP.toFixed(0)}
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
