"use client";

import SummaryTile from "@/components/ui/region/SummaryTile";
import {
  alteration_icon_url,
  fortune_seeker_icon_url,
  glint_recovery_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import { LandCardCollectionResult } from "@/lib/backend/actions/region/land-card-collection-actions";
import { WarningAmber } from "@mui/icons-material";
import { formatDate } from "@/lib/utils/dateColumnUtils";

interface Props {
  summary: LandCardCollectionResult;
}

export default function LandCardVericoTile({ summary }: Readonly<Props>) {
  const lastUpdateDate = summary.lastUpdated
    ? formatDate(summary.lastUpdated, false)
    : "N/A";
  const { alteration_count, glint_recovery_count, fortune_seeker_count } =
    summary.editionSummary.reduce(
      (acc, curr) => {
        acc.alteration_count += curr.alteration_count;
        acc.glint_recovery_count += curr.glint_recovery_count;
        acc.fortune_seeker_count += curr.fortune_seeker_count;
        return acc;
      },
      { alteration_count: 0, glint_recovery_count: 0, fortune_seeker_count: 0 }
    );

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Land Card Bonuses (Verico Specific):
      </Typography>
      <Box>
        <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 1 }}>
          <Stack direction="column" spacing={1}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              Verico specific bonuses are only updated once a week
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize={12}
              sx={{ minHeight: 20 }}
            >
              Last updated: {lastUpdateDate}
            </Typography>
          </Stack>
        </Alert>
      </Box>
      <Box py={2} mx="auto" display="flex" flexWrap="wrap" gap={2}>
        <Box
          width={"100%"}
          display="flex"
          flexDirection="column"
          flexWrap="wrap"
          gap={1}
        >
          <Box
            display="flex"
            flexDirection="row"
            flexWrap="wrap"
            gap={2}
            width={"100%"}
          >
            <SummaryTile
              type="Alteration"
              imageUrl={alteration_icon_url}
              count={Number(alteration_count)}
            />
            <SummaryTile
              type="Glint Rcovery"
              imageUrl={glint_recovery_icon_url}
              count={Number(glint_recovery_count)}
            />
            <SummaryTile
              type="Fortune Seeker"
              imageUrl={fortune_seeker_icon_url}
              count={Number(fortune_seeker_count)}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
