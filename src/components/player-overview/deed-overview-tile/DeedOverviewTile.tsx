import CardTile from "@/components/player-overview/deed-overview-tile/CardTile";
import { determineCardInfo, determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { Rarity } from "@/types/rarity";
import { SplCardDetails } from "@/types/splCardDetails";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import DeedTypeCard from "./DeedTypeCard";
import BoostsOverviewTile from "./boosts/BoostsOverviewTile";
import { ProductionCard } from "./production/ProductionCard";

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
      <BoostsOverviewTile data={data} cardDetails={cardDetails} />
      <Typography variant="h6" component="h3" sx={{ mt: -2 }}>
        Cards:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {data.stakedAssets?.cards?.map((card) => {
          const { name, rarity } = determineCardInfo(
            card.card_detail_id,
            cardDetails,
          );

          if (name === "Runi") return null;

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
              uid={card.uid}
            />
          );
        })}
      </Box>

      <Typography variant="h6" component="h3" sx={{ mt: 1 }}>
        Production:
      </Typography>
      <ProductionCard
        worksiteType={data.worksiteDetail?.worksite_type ?? "Undeveloped"}
        basePP={data.stakingDetail?.total_base_pp_after_cap ?? 0}
        boostedPP={data.stakingDetail?.total_harvest_pp ?? 0}
        rawPerHour={data.worksiteDetail?.rewards_per_hour ?? 0}
        resource={data.worksiteDetail?.token_symbol ?? ""}
        includeTax={true}
        progressInfo={data.progressInfo}
      />
    </Box>
  );
}
