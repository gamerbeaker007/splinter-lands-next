"use client";

import ArticleSection from "@/components/articles/ArticleSection";
import DefaultPageTile from "@/components/DefaultPageTile";
import PlayerPageTile from "@/components/PlayerPageTile";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

const temp_image =
  "https://files.peakd.com/file/peakd-hive/beaker007/23uFPdKf8W8ZX71NBX84EzrbuDWKc44PmSAcGwNRzkmS25BuzUm5ySwCMfrXsDdoAMTYK.png";

const defaultBoxHeight = 200;

const defaultBoxStyle = {
  height: defaultBoxHeight,
  flexBasis: { xs: "100%", sm: "45%", md: "30%" },
  // flexGrow: 1,
};
export default function Home() {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Box display="flex" flexWrap="wrap" gap={4} mt={4}>
        <Box sx={defaultBoxStyle}>
          <DefaultPageTile
            title="Resource"
            href="/resource"
            image={temp_image}
          />
        </Box>
        <Box sx={defaultBoxStyle}>
          <DefaultPageTile
            title="Region Overview"
            href="/region-overview"
            image={temp_image}
          />
        </Box>
        <Box sx={defaultBoxStyle}>
          <PlayerPageTile />
        </Box>
        <Box sx={defaultBoxStyle}>
          <DefaultPageTile
            title="Player Efficiency"
            href="/player-efficiency"
            image={temp_image}
          />
        </Box>
        <Box sx={defaultBoxStyle}>
          <DefaultPageTile
            title="Land Planning"
            href="/planning"
            image={temp_image}
          />
        </Box>
      </Box>

      <Box mt={4} mb={4}>
        <ArticleSection />
      </Box>
    </Container>
  );
}
