"use client";

import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  land_plot_icon_url,
  land_region_icon_url,
  land_tract_icon_url,
  land_under_construction_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { getDeedImg } from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Stack } from "@mui/material";
import { CardInfo } from "./info-sections/CardInfo";
import { ConsumeProduceInfo } from "./info-sections/ConsumeProduceInfo";
import { DECInfo } from "./info-sections/DECInfo";
import { PlotInfo } from "./info-sections/PlotInfo";
import { PPInfo } from "./info-sections/PPInfo";
import { StoreInfo } from "./info-sections/StoreInfo";
import { WorksiteInfo } from "./info-sections/WorksiteInfo";
import { HarvestLink } from "./link-components/HarvestLink";
import { ManageLink } from "./link-components/ManageLink";
import { TotalBoostInfo } from "./info-sections/TotalBoostInfo";
import BoostInfo from "./info-sections/BoostsInfo";

export type LandDeedCardProps = {
  data: DeedComplete;
  cardDetails: SplCardDetails[];
};

export const LandDeedCard: React.FC<LandDeedCardProps> = ({
  data,
  cardDetails,
}) => {
  const regionNumber = data.region_number!;
  const plotNumber = data.plot_number!;
  const tractNumber = data.tract_number!;

  const regionName = data.region_name!;
  const plotId = data.plot_id!;

  const territory = data.territory!;

  const magicType = data.magic_type!;
  const deedType = data.deed_type!;
  const plotStatus = data.plot_status!;
  const rarity = data.rarity!;
  const worksiteType = data.worksite_type!;

  const productionInfo = data.productionIfo;
  const resource = data.worksiteDetail?.token_symbol ?? "";

  const isConstruction = data.worksiteDetail?.is_construction ?? false;

  const resourceIcon = isConstruction
    ? land_under_construction_icon_url
    : RESOURCE_ICON_MAP[resource];

  const cardImg = getDeedImg(
    magicType,
    deedType,
    plotStatus,
    rarity,
    worksiteType,
  );

  return (
    <Box
      // Responsive wrapper: scales the canvas by width, preserves 800:422 ratio
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 800,
        mx: "auto",
        aspectRatio: "800 / 422",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      {/* Background image layer */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${cardImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Top-right actions */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          top: 25,
          right: 15,
          zIndex: 2,
        }}
      >
        <ManageLink regionNumber={regionNumber} plotId={plotId} />
        <HarvestLink regionNumber={regionNumber} />
      </Stack>

      <PlotInfo
        deedType={deedType}
        territory={territory}
        regionName={regionName}
        land_region_icon_url={land_region_icon_url}
        land_tract_icon_url={land_tract_icon_url}
        land_plot_icon_url={land_plot_icon_url}
        regionNumber={regionNumber}
        tractNumber={tractNumber}
        plotNumber={plotNumber}
        pos={{ x: "570px", y: "75px", w: "auto" }}
      />

      <WorksiteInfo
        worksiteType={data.worksiteDetail?.worksite_type ?? "Undeveloped"}
        pos={{ x: "40px", y: "45px", w: "420px" }}
      />

      <StoreInfo
        resourceIcon={resourceIcon}
        toolTip={data.progressInfo?.progressTooltip ?? ""}
        label={data.progressInfo?.infoStr ?? ""}
        percentage={data.progressInfo?.percentageDone ?? 0}
        pos={{ x: "150px", y: "50px", w: "300px" }}
      />

      <TotalBoostInfo
        totalBoost={data.stakingDetail?.total_boost ?? 0}
        pos={{ x: "157px", y: "95px", w: "300px" }}
      />

      <PPInfo
        basePP={data.stakingDetail?.total_base_pp_after_cap ?? 0}
        boostedPP={data.stakingDetail?.total_harvest_pp ?? 0}
        pos={{ x: "157px", y: "125px", w: "300px" }}
      />

      <BoostInfo
        rarity={rarity}
        rarityBoost={data.stakingDetail?.deed_rarity_boost ?? 0}
        plotStatus={plotStatus}
        plotStatusBoost={data.stakingDetail?.deed_status_token_boost ?? 0}
        runiBoost={data.stakingDetail?.runi_boost ?? 0}
        redBiomeBoost={data.stakingDetail?.red_biome_modifier ?? 0}
        blueBiomeBoost={data.stakingDetail?.blue_biome_modifier ?? 0}
        blackBiomeBoost={data.stakingDetail?.black_biome_modifier ?? 0}
        whiteBiomeBoost={data.stakingDetail?.white_biome_modifier ?? 0}
        greenbBiomeBoost={data.stakingDetail?.green_biome_modifier ?? 0}
        goldBiomeBoost={data.stakingDetail?.gold_biome_modifier ?? 0}
        stakedAssets={data.stakedAssets ?? null}
        cardDetails={cardDetails}
        pos={{ x: "40px", y: "170px", w: "auto" }}
      />

      <CardInfo
        stakedAssets={data.stakedAssets!}
        cardDetails={cardDetails}
        pos={{ x: "40px", y: "290px", w: "465px" }}
      />

      <ConsumeProduceInfo
        produce={productionInfo?.produce}
        consume={productionInfo?.consume}
        pos={{ x: "600px", y: "210px", w: "auto" }}
      />

      <DECInfo
        productionInfo={productionInfo}
        resource={resource}
        pos={{ x: "600px", y: "310px", w: "auto" }}
      />
    </Box>
  );
};
