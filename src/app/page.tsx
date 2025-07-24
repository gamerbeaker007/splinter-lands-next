"use client";

import ArticleSection from "@/components/articles/ArticleSection";
import DefaultPageTile from "@/components/DefaultPageTile";
import PlayerPageTile from "@/components/PlayerPageTile";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

const temp_image =
  "https://files.peakd.com/file/peakd-hive/beaker007/23uFPdKf8W8ZX71NBX84EzrbuDWKc44PmSAcGwNRzkmS25BuzUm5ySwCMfrXsDdoAMTYK.png";

export default function Home() {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Grid container spacing={3} mt={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DefaultPageTile
            title="Resource"
            href="/resource"
            image={temp_image}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DefaultPageTile
            title="Region Overview"
            href="/region-overview"
            image={temp_image}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <PlayerPageTile />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DefaultPageTile
            title="Player Efficiency"
            href="/player-efficiency"
            image={temp_image}
          />
        </Grid>
      </Grid>
      <ArticleSection />
    </Container>
  );
}
