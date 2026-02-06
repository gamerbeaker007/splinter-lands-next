import { CaptureRateOutput } from "@/components/player-overview/deed-overview/land-deed-card/info-sections/CaptureRateOutput";
import { TotemChanceOutput } from "@/components/player-overview/deed-overview/land-deed-card/info-sections/TotemChangeOutput";
import { Resource } from "@/constants/resource/resource";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { land_under_construction_icon_url } from "@/lib/shared/statics_icon_urls";
import { getDeedImg } from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Stack } from "@mui/material";
import BoostInfo from "./info-sections/BoostsInfo";
import { CardInfo } from "./info-sections/CardInfo";
import { ConsumeProduceInfo } from "./info-sections/ConsumeProduceInfo";
import { DECInfo } from "./info-sections/DECInfo";
import { LandBoosts } from "./info-sections/LandBoosts";
import { OwnerInfo } from "./info-sections/OwnerInfo";
import { PlotInfo } from "./info-sections/PlotInfo";
import { PPInfo } from "./info-sections/PPInfo";
import { StoreInfo } from "./info-sections/StoreInfo";
import { TotalBoostInfo } from "./info-sections/TotalBoostInfo";
import { WorksiteInfo } from "./info-sections/WorksiteInfo";
import { DeedHistoryLink } from "./link-components/DeedHistoryLink";
import { HarvestLink } from "./link-components/HarvestLink";
import { ManageLink } from "./link-components/ManageLink";

export type LandDeedCardProps = {
  deed: DeedComplete;
  cardDetails: SplCardDetails[];
  showOwnershipInfo?: boolean;
};

export const LandDeedCard: React.FC<LandDeedCardProps> = ({
  deed,
  cardDetails,
  showOwnershipInfo = false,
}) => {
  const regionNumber = deed.region_number!;
  const plotNumber = deed.plot_number!;
  const tractNumber = deed.tract_number!;

  const regionName = deed.region_name!;
  const plotId = deed.plot_id!;

  const territory = deed.territory!;

  const magicType = deed.magic_type!;
  const deedType = deed.deed_type!;
  const plotStatus = deed.plot_status!;
  const rarity = deed.rarity!;
  const worksiteType = deed.worksite_type!;

  const productionInfo = deed.productionInfo;
  const resource = deed.worksiteDetail?.token_symbol ?? "";

  const isConstruction = deed.worksiteDetail?.is_construction ?? false;

  const resourceIcon = isConstruction
    ? land_under_construction_icon_url
    : RESOURCE_ICON_MAP[resource];

  const cardImg = getDeedImg(
    magicType,
    deedType,
    plotStatus,
    rarity,
    worksiteType
  );

  const isTax = resource === "TAX";
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
        <DeedHistoryLink deedUid={deed.deed_uid!} />
        <ManageLink regionNumber={regionNumber} plotId={plotId} />
        <HarvestLink regionNumber={regionNumber} />
      </Stack>

      {showOwnershipInfo && (
        <OwnerInfo
          owner={deed.player}
          pos={{ x: "20px", y: "15px", w: "300px" }}
        />
      )}

      <PlotInfo
        deedType={deedType}
        territory={territory}
        regionName={regionName}
        regionNumber={regionNumber}
        tractNumber={tractNumber}
        plotNumber={plotNumber}
        pos={{ x: "570px", y: "60px", w: "auto" }}
      />

      <WorksiteInfo
        worksiteType={deed.worksiteDetail?.worksite_type ?? "Undeveloped"}
        pos={{ x: "20px", y: "45px", w: "400px" }}
      />

      <LandBoosts
        resource={resource as Resource}
        bloodlineBoost={deed.stakingDetail?.card_bloodlines_boost ?? 0}
        decDiscount={deed.stakingDetail?.dec_stake_needed_discount ?? 0}
        grainConsumeReduction={deed.stakingDetail?.grain_food_discount ?? 0}
        productionBoost={deed.stakingDetail?.card_abilities_boost ?? 0}
        replacePowerCore={deed.stakingDetail?.is_energized ?? false}
        laborLuck={deed.stakingDetail?.has_labors_luck ?? false}
        pos={{ x: "430px", y: "45px", w: "120px" }}
      />

      <StoreInfo
        resourceIcon={resourceIcon}
        toolTip={deed.progressInfo?.progressTooltip ?? ""}
        label={deed.progressInfo?.infoStr ?? ""}
        percentage={deed.progressInfo?.percentageDone ?? 0}
        pos={{ x: "130px", y: "50px", w: "300px" }}
      />

      <TotalBoostInfo
        totalBoost={deed.stakingDetail?.total_boost ?? 0}
        pos={{ x: "137px", y: "95px", w: "300px" }}
      />

      <PPInfo
        basePP={deed.stakingDetail?.total_base_pp_after_cap ?? 0}
        boostedPP={deed.stakingDetail?.total_harvest_pp ?? 0}
        pos={{ x: "137px", y: "125px", w: "300px" }}
      />

      {(resource === "TAX" || resource === "RESEARCH") && (
        <TotemChanceOutput
          estimateChange={deed.worksiteDetail?.estimated_totem_chance ?? 0}
          pos={{ x: "350px", y: "120px", w: "110px" }}
        />
      )}

      {resource === "TAX" && (
        <CaptureRateOutput
          captureRate={deed.worksiteDetail?.captured_tax_rate ?? 0}
          pos={{ x: "350px", y: "90px", w: "110px" }}
        />
      )}

      <BoostInfo
        rarity={rarity}
        rarityBoost={deed.stakingDetail?.deed_rarity_boost ?? 0}
        plotStatus={plotStatus}
        plotStatusBoost={deed.stakingDetail?.deed_status_token_boost ?? 0}
        runiBoost={deed.stakingDetail?.runi_boost ?? 0}
        redBiomeBoost={deed.stakingDetail?.red_biome_modifier ?? 0}
        blueBiomeBoost={deed.stakingDetail?.blue_biome_modifier ?? 0}
        blackBiomeBoost={deed.stakingDetail?.black_biome_modifier ?? 0}
        whiteBiomeBoost={deed.stakingDetail?.white_biome_modifier ?? 0}
        greenbBiomeBoost={deed.stakingDetail?.green_biome_modifier ?? 0}
        goldBiomeBoost={deed.stakingDetail?.gold_biome_modifier ?? 0}
        stakedAssets={deed.stakedAssets ?? null}
        cardDetails={cardDetails}
        pos={{ x: "20px", y: "170px", w: "auto" }}
      />

      <CardInfo
        stakedAssets={deed.stakedAssets!}
        cardDetails={cardDetails}
        pos={{ x: "20px", y: "290px", w: "465px" }}
      />

      <ConsumeProduceInfo
        produce={productionInfo?.produce}
        consume={productionInfo?.consume}
        resource={resource as Resource}
        pos={{ x: isTax ? "525px" : "600px", y: "200px", w: "auto" }}
      />

      <DECInfo
        productionInfo={productionInfo}
        resource={resource}
        isPerHour={isTax ? false : true}
        pos={{
          x: isTax ? "675px" : "600px",
          y: isTax ? "200px" : "300px",
          w: "auto",
        }}
      />
    </Box>
  );
};
