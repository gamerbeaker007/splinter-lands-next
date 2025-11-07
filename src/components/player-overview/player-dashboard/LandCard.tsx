import { Box, Typography } from "@mui/material";
import React from "react";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { PlayerOverview } from "@/types/playerOverview";
import Image from "next/image";
import { TbPercentage40 } from "react-icons/tb";
import {
  card_rarity_common_icon_url,
  card_rarity_epic_icon_url,
  card_rarity_legendary_icon_url,
  card_rarity_rare_icon_url,
  land_hammer_icon_url,
} from "@/lib/shared/statics_icon_urls";

type Props = {
  playerOverview: PlayerOverview;
};

const LAND_HAMMER_ICON = land_hammer_icon_url;
const RARITY_ICONS = {
  common: card_rarity_common_icon_url,
  rare: card_rarity_rare_icon_url,
  epic: card_rarity_epic_icon_url,
  legendary: card_rarity_legendary_icon_url,
};

const EligibleRow: React.FC<{
  title: string;
  subtitle?: string;
  minHeight?: number;
  eligible: { common: number; rare: number; epic: number; legendary: number };
}> = ({ title, subtitle, minHeight = 0, eligible }) => {
  return (
    <Box>
      <Box minHeight={minHeight}>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box mt={1} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Image
            src={RARITY_ICONS.common}
            alt="Common"
            width={20}
            height={20}
          />
          <Typography variant="body1">
            <strong>Common:</strong> {Math.floor(eligible.common)}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Image src={RARITY_ICONS.rare} alt="Rare" width={20} height={20} />
          <Typography variant="body1">
            <strong>Rare:</strong> {Math.floor(eligible.rare)}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Image src={RARITY_ICONS.epic} alt="Epic" width={20} height={20} />
          <Typography variant="body1">
            <strong>Epic:</strong> {Math.floor(eligible.epic)}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Image
            src={RARITY_ICONS.legendary}
            alt="Legendary"
            width={20}
            height={20}
          />
          <Typography variant="body1">
            <strong>Legendary:</strong> {Math.floor(eligible.legendary)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export function LandCard({ playerOverview }: Props) {
  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Land Shares
      </Typography>

      {/* Base PP Numbers Section */}
      <Box mb={3}>
        <Typography variant="h6" mb={1.5} color="text.secondary">
          Base PP Numbers
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Image src={LAND_HAMMER_ICON} alt="PP" width={20} height={20} />
            <Typography variant="body1">
              <strong>Total Base PP:</strong>{" "}
              {formatNumberWithSuffix(
                playerOverview.landShare?.totalBasePP ?? 0,
              )}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Image src={LAND_HAMMER_ICON} alt="PP" width={20} height={20} />
            <Typography variant="body1">
              <strong>Total Base PP: </strong>{" "}
              {formatNumberWithSuffix(
                playerOverview.landShare?.totalBasePPIncludingEfficiency ?? 0,
              )}
            </Typography>
            <Typography variant="caption">(with efficiency)</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Image src={LAND_HAMMER_ICON} alt="PP" width={20} height={20} />
            <Typography variant="body1">
              <strong>Player Base PP:</strong>{" "}
              {formatNumberWithSuffix(
                playerOverview.landShare?.totalPlayerBasePP ?? 0,
              )}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Image src={LAND_HAMMER_ICON} alt="PP" width={20} height={20} />
            <Typography variant="body1">
              <strong>Player Base PP:</strong>{" "}
              {formatNumberWithSuffix(
                playerOverview.landShare
                  ?.totalPlayerBasePPIncludingEfficiency ?? 0,
              )}
            </Typography>
            <Typography variant="caption">(with efficiency)</Typography>
          </Box>
        </Box>
      </Box>

      {/* Player Shares Section */}
      <Box mb={3}>
        <Typography variant="h6" mb={1.5} color="text.secondary">
          Player Shares
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <TbPercentage40 size={20} />
            <Typography variant="body1">
              <strong>Share:</strong>{" "}
              {(
                (playerOverview.landShare?.playerLandShareInclEfficiency ?? 0) *
                100
              ).toFixed(3)}
              %
            </Typography>
            <Typography variant="caption">(with efficiency)</Typography>
          </Box>
        </Box>
      </Box>

      {/* Eligible Section */}
      <Box display={"flex"} flexDirection="row" gap={2}>
        {playerOverview.landShare?.eligible &&
        playerOverview.landShare?.eligibleAt100 ? (
          playerOverview.landShare?.totalPlayerBasePP ===
          playerOverview.landShare?.totalPlayerBasePPIncludingEfficiency ? (
            <EligibleRow
              title="Eligible"
              eligible={
                playerOverview.landShare?.eligible ?? {
                  common: 0,
                  rare: 0,
                  epic: 0,
                  legendary: 0,
                }
              }
            />
          ) : (
            <>
              <EligibleRow
                title="Eligible"
                minHeight={60}
                eligible={
                  playerOverview.landShare?.eligible ?? {
                    common: 0,
                    rare: 0,
                    epic: 0,
                    legendary: 0,
                  }
                }
              />
              <EligibleRow
                title="Eligible"
                subtitle="(at 100% efficiency)"
                minHeight={60}
                eligible={
                  playerOverview.landShare?.eligibleAt100 ?? {
                    common: 0,
                    rare: 0,
                    epic: 0,
                    legendary: 0,
                  }
                }
              />
            </>
          )
        ) : null}
      </Box>
    </Box>
  );
}
