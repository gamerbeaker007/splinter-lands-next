import { Box, Typography } from "@mui/material";
import { GroupedCardRow } from "@/types/groupedCardRow";
import CardTileSimple from "./CardTileSimple";

type Props = {
  basePPList: GroupedCardRow[];
};

export default function BasePPSection({ basePPList }: Props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        TOP 100 Base PP
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
        {basePPList.map((card, idx) => (
          <Box key={idx}>
            <CardTileSimple
              name={card.name}
              rarity={card.rarity}
              edition={card.edition}
              foil={card.foil}
              bcx={card.bcx}
              count={card.count}
              base_pp={card.base_pp}
              uid={card.uid}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
