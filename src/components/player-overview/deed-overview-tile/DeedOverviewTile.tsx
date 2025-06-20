import CardTile from "@/components/player-overview/deed-overview-tile/CardTile";
import { determineCardInfo, determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { Rarity } from "@/types/rarity";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import DeedTypeCard from "./DeedTypeCard";

type Props = {
  data: DeedComplete;
  cardDetails: SplCardDetails[];
};

export default function DeedOverviewTile({ data, cardDetails }: Props) {
  return (
    <Box>
      <DeedTypeCard
        key={data.deed_uid}
        magicType={data.magic_type!}
        deedType={data.deed_type!}
        plotStatus={data.plot_status!}
        rarity={data.rarity!}
        regionNumber={data.region_number!}
        tractNumber={data.tract_number!}
        plotNumber={data.plot_number!}
        territory={data.territory!}
        regionName={data.region_name!}
        worksiteType={data.worksite_type!}
        plotId={data.plot_id!}
      />

      <Typography variant="h6" component="h3">
        Cards:
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
    </Box>
  );
}
