import { Box, Typography } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";
import { AssignedWorkersAlerts } from "./AssingedWorkersAlerts";
import { MissingBloodLineBoostAlerts } from "./MissingBloodLineBoostAlerts";
import { NegativeDECAlerts } from "./NegativeDECAlerts";
import { NoWorkersAlerts } from "./NoWorkersAlerts";
import { PowerCoreAlerts } from "./PowerCoreAlerts";
import { RationingLiteAlerts } from "./RationingLiteAlerts";
import { TerrainBoostsCard } from "./TerrainBoostsCard";
import { TooMuchPPAlerts } from "./TooMuchPPAlerts";

const meta: Meta = {
  title: "Components/PlayerOverview/PlayerDashboard/Alerts",
};

export default meta;

const tooMuchBasePP = [
  {
    deedId: 999,
    plotId: 9999,
    regionNumber: 56,
    plotNumber: 102,
    tractNumber: 5,
    regionName: "Quegmoor",
    territory: "Pristine Northwest",
    deedType: "Mountain",
    magicType: "",
    plotStatus: "natural",
    rarity: "common",
    worksiteType: "Ore Mine",
  },
];

const powerCoreAlerts = [
  {
    deedId: 999,
    plotId: 9999,
    regionNumber: 56,
    plotNumber: 102,
    tractNumber: 5,
    regionName: "Quegmoor",
    territory: "Pristine Northwest",
    deedType: "Mountain",
    magicType: "",
    plotStatus: "natural",
    rarity: "common",
    worksiteType: "Ore Mine",
  },
];

const assignedWorkersAlerts = [
  {
    deedInfo: {
      deedId: 999,
      plotId: 9999,
      regionNumber: 56,
      plotNumber: 102,
      tractNumber: 5,
      regionName: "Quegmoor",
      territory: "Pristine Northwest",
      deedType: "Mountain",
      magicType: "",
      plotStatus: "natural",
      rarity: "common",
      worksiteType: "Ore Mine",
    },
    assignedCards: 10,
  },
];

const missingBloodLineBoostAlerts = [
  {
    deedId: 999,
    plotId: 9999,
    regionNumber: 56,
    plotNumber: 102,
    tractNumber: 5,
    regionName: "Quegmoor",
    territory: "Pristine Northwest",
    deedType: "Mountain",
    magicType: "",
    plotStatus: "natural",
    rarity: "common",
    worksiteType: "Ore Mine",
  },
];

const negativeDECAlerts = [
  {
    deedInfo: {
      deedId: 999,
      plotId: 9999,
      regionNumber: 56,
      plotNumber: 102,
      tractNumber: 5,
      regionName: "Quegmoor",
      territory: "Pristine Northwest",
      deedType: "Mountain",
      magicType: "",
      plotStatus: "natural",
      rarity: "common",
      worksiteType: "Ore Mine",
    },
    negativeDecPerHour: 1345,
  },
];

const noWorkersAlerts = [
  {
    deedId: 999,
    plotId: 9999,
    regionNumber: 56,
    plotNumber: 102,
    tractNumber: 5,
    regionName: "Quegmoor",
    territory: "Pristine Northwest",
    deedType: "Mountain",
    magicType: "",
    plotStatus: "natural",
    rarity: "common",
  },
];

const rationingLiteAlerts = [
  {
    deedId: 999,
    plotId: 9999,
    regionNumber: 56,
    plotNumber: 102,
    tractNumber: 5,
    regionName: "Quegmoor",
    territory: "Pristine Northwest",
    deedType: "Mountain",
    magicType: "",
    plotStatus: "natural",
    rarity: "common",
    basePP: 12345567788,
    worksiteType: "Ore Mine",
    rationingLite: 1,
  },
];

const terrainBoosts = {
  negative: [
    {
      uid: "1",
      terrainBoost: -1,
      element: "Fire",
      rarity: "common",
      bcx: 100,
      maxBcx: 400,
      basePP: 10000,
      cardDetailId: 29,
      cardName: "Stone Golem",
      edition: 1,
      foil: 0,
      deedInfo: {
        plotId: 9999,
        plotNumber: 102,
        regionNumber: 56,
        regionName: "Quegmoor",
        tractNumber: 5,
        territory: "Pristine Northwest",
        deedType: "Mountain",
        magicType: "",
        plotStatus: "natural",
        rarity: "common",
        basePP: 12345567788,
        boostPP: -10,
        worksiteType: "Ore Mine",
        rationingLite: 1,
      },
    },
    {
      uid: "1",
      terrainBoost: -1,
      element: "Fire",
      rarity: "common",
      bcx: 100,
      maxBcx: 400,
      basePP: 10000,
      cardDetailId: 29,
      cardName: "Stone Golem",
      edition: 1,
      foil: 0,
      deedInfo: {
        plotId: 9999,
        plotNumber: 102,
        regionNumber: 56,
        regionName: "Quegmoor",
        tractNumber: 5,
        territory: "Pristine Northwest",
        deedType: "Mountain",
        magicType: "",
        plotStatus: "natural",
        rarity: "common",
        basePP: 12345567788,
        boostPP: -10,
        worksiteType: "Ore Mine",
        rationingLite: 1,
      },
    },
    {
      uid: "1",
      terrainBoost: -1,
      element: "Fire",
      rarity: "common",
      bcx: 100,
      maxBcx: 400,
      basePP: 10000,
      cardDetailId: 29,
      cardName: "Stone Golem",
      edition: 1,
      foil: 0,
      deedInfo: {
        plotId: 9999,
        plotNumber: 102,
        regionNumber: 56,
        regionName: "Quegmoor",
        tractNumber: 5,
        territory: "Pristine Northwest",
        deedType: "Mountain",
        magicType: "",
        plotStatus: "natural",
        rarity: "common",
        basePP: 12345567788,
        boostPP: -10,
        worksiteType: "Ore Mine",
        rationingLite: 1,
      },
    },
    {
      uid: "1",
      terrainBoost: -1,
      element: "Fire",
      rarity: "common",
      bcx: 100,
      maxBcx: 400,
      basePP: 10000,
      cardDetailId: 29,
      cardName: "Stone Golem",
      edition: 1,
      foil: 0,
      deedInfo: {
        plotId: 9999,
        plotNumber: 102,
        regionNumber: 56,
        regionName: "Quegmoor",
        tractNumber: 5,
        territory: "Pristine Northwest",
        deedType: "Mountain",
        magicType: "",
        plotStatus: "natural",
        rarity: "common",
        basePP: 12345567788,
        boostPP: -10,
        worksiteType: "Ore Mine",
        rationingLite: 1,
      },
    },
    {
      uid: "1",
      terrainBoost: -1,
      element: "Fire",
      rarity: "common",
      bcx: 100,
      maxBcx: 400,
      basePP: 10000,
      cardDetailId: 29,
      cardName: "Stone Golem",
      edition: 1,
      foil: 0,
      deedInfo: {
        plotId: 9999,
        plotNumber: 102,
        regionNumber: 56,
        regionName: "Quegmoor",
        tractNumber: 5,
        territory: "Pristine Northwest",
        deedType: "Mountain",
        magicType: "",
        plotStatus: "natural",
        rarity: "common",
        basePP: 12345567788,
        boostPP: -10,
        worksiteType: "Ore Mine",
        rationingLite: 1,
      },
    },
  ],
  zeroNeutral: [],
  zeroNonNeutral: [],
};

export const DeedAlertSection: StoryObj = {
  render: () => (
    <Box display={"flex"} flexDirection={"column"}>
      <Typography variant="body1" fontWeight={600}>
        Too Much Base PP Alerts
      </Typography>
      <TooMuchPPAlerts tooMuchBasePP={tooMuchBasePP} />

      <Typography variant="body1" fontWeight={600}>
        Power Core Alerts
      </Typography>
      <PowerCoreAlerts powerCoreAlerts={powerCoreAlerts} />

      <Typography variant="body1" fontWeight={600}>
        Assigned Workers Alerts
      </Typography>
      <AssignedWorkersAlerts assignedWorkersAlerts={assignedWorkersAlerts} />

      <Typography variant="body1" fontWeight={600}>
        Missing Blood Line Boost Alerts
      </Typography>
      <MissingBloodLineBoostAlerts
        missingBloodLineBoostAlerts={missingBloodLineBoostAlerts}
      />

      <Typography variant="body1" fontWeight={600}>
        Negative DEC Alerts
      </Typography>
      <NegativeDECAlerts negativeDECAlerts={negativeDECAlerts} />

      <Typography variant="body1" fontWeight={600}>
        No Workers Assigned Alerts
      </Typography>
      <NoWorkersAlerts noWorkersAlerts={noWorkersAlerts} />

      <Typography variant="body1" fontWeight={600}>
        Rationing Lite Alerts
      </Typography>
      <RationingLiteAlerts rationingLiteAlerts={rationingLiteAlerts} />

      <Typography variant="body1" fontWeight={600}>
        Terrain Boosts Card
      </Typography>
      <TerrainBoostsCard terrainBoosts={terrainBoosts.negative} />
    </Box>
  ),
};
