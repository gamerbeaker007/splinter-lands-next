import CardTile from "@/components/player-overview/deed-overview-tile/CardTile";
import { determineCardInfo, determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { Rarity } from "@/types/rarity";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box } from "@mui/system";

type Props = {
  data: DeedComplete;
  cardDetails: SplCardDetails[];
};

export default function DeedOverviewTile({ data, cardDetails }: Props) {
  return (
    <Box style={{ display: "flex", gap: 8, border: "1px solid" }}>
      {data.stakedAssets?.cards?.map((card) => {
        const { name, rarity } = determineCardInfo(
          card.card_detail_id,
          cardDetails,
        );
        const max_bcx = determineCardMaxBCX(
          card.card_detail_id,
          card.edition,
          rarity as Rarity,
          card.foil,
        );

        return (
          <CardTile
            key={card.name}
            name={name}
            rarity={rarity}
            edition={card.edition}
            foil={card.foil}
            terrain_boost={Number(card.terrain_boost)}
            actual_bcx={card.bcx}
            max_bcx={max_bcx}
            base_pp={Number(card.base_pp_after_cap)}
            boosted_pp={Number(card.total_harvest_pp)}
          />
        );
      })}
    </Box>
  );
}
