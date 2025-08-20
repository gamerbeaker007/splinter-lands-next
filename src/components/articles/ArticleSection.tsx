import ArticleCard, { Article } from "@/components/articles/ArcticleCard";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Page } from "@/types/Page";
import { Box, Grid } from "@mui/material";
import NavTabs from "@/components/nav-tabs/NavTabs";

const basic: Article[] = [
  {
    title: "Video: Setting Up Land",
    image:
      "https://files.peakd.com/file/peakd-hive/beaker007/241tfevhcwZz5p6XWE7fhJQ58FyjxB6QhW54E7r2Q71SN5HJEdr6oMQ7PfJAEXBYNXvSv.png",
    description: "Setting up your first plot",
    author: "bronzedragon",
    quote:
      "Love your work bronze dragon, I relied heavily on these videos when I joined the game 4 years ago, happy to see you are still thinking about the new guy !!",
    quoteAuthor: "woody-5753",
    linkUrl: "https://www.youtube.com/watch?v=mZaczSZqATw",
  },
  {
    title: "Blog: Land Strategy Pyramid",
    image:
      "https://files.peakd.com/file/peakd-hive/azircon/23tRxSKeZc1rMCdqBUDTXdNxXwcHjg8yRdFmYgZoB9NTfou6Dj13jixHXNAt77Be1nb9c.png",
    description: "Which strategy to follow when just starting on land",
    author: "azircon",
    quote: "Very useful information for newcomers.",
    quoteAuthor: "beaker007",
    linkUrl: "https://peakd.com/hive-169191/@azircon/land-strategy-pyramid",
  },
  {
    title: "Blog: Official Land Guide",
    image:
      "https://files.peakd.com/file/peakd-hive/beaker007/23tvVvzKtqCNfGjn1AhyFfxrpCjukTvmMdVtKSDqZByBMX5Qabe17snyp8E5gLUbZsHbW.png",
    description:
      "Land is an exciting expansion to the Splinterlands universe! Use your cards to produce resources, earn your way to the top of the resource production Leaderboards, and unlock special Prefix Titles!",
    author: "Splinterlands Support Team",
    quote: "Detailed information on how to setup land",
    quoteAuthor: "beaker007",
    linkUrl:
      "https://support.splinterlands.com/hc/en-us/articles/18107333362708-Land-User-Guide",
  },
];

const intermediate: Article[] = [
  {
    title: "Blog: LP and Asymmetric Risk",
    image:
      "https://files.peakd.com/file/peakd-hive/azircon/23sweNFhZsXfQzjgMoZLuFeQY5LeEWTNHztTtzafzbsPq9i3YL3n3GSsvwfLKo5hMkCHN.png",
    description:
      "Understand the risk profile of the AMM pools with the current exact TVL (Total Value Locked) of these in-game pools",
    author: "azricon",
    quote: "",
    quoteAuthor: "",
    linkUrl:
      "https://peakd.com/hive-169191/@azircon/resource-pools-and-asymmetric-risk",
  },
];

const advanced: Article[] = [
  {
    title: "Land 1.5 White Paper",
    image:
      "https://files.peakd.com/file/peakd-hive/beaker007/23tvVvzKtqCNfGjn1AhyFfxrpCjukTvmMdVtKSDqZByBMX5Qabe17snyp8E5gLUbZsHbW.png",
    description: "Information about land phase 1.5 (status delivered)",
    author: "Splinterlands Team",
    quote:
      "Detailed information about everything related to current land status",
    quoteAuthor: "beaker007",
    linkUrl: "https://splinterlands.gitbook.io/the-secret-of-praetoria",
  },
  {
    title: "Land 2.0 White Paper",
    image:
      "https://files.peakd.com/file/peakd-hive/beaker007/23tvVvzKtqCNfGjn1AhyFfxrpCjukTvmMdVtKSDqZByBMX5Qabe17snyp8E5gLUbZsHbW.png",
    description: "Information about land phase 2.0 (status under development)",
    author: "Splinterlands Team",
    quote:
      "All the information needed to build in the coming years is already here",
    quoteAuthor: "beaker007",
    linkUrl: "https://splinterlands.gitbook.io/phase-2-the-secret-of-praetoria",
  },
];
const groupedArticles: Article[][] = [basic, intermediate, advanced];

export default function ArticleSection() {
  const [tabIndex, setTabIndex] = useState(0);

  const pages: Page[] = ["Basic", "Intermediate", "Advanced"].map(
    (label, index) => ({
      key: label,
      label: label,
      component: (
        <Grid container spacing={2} justifyContent="center" mt={2}>
          {groupedArticles[index].map((article, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>
      ),
    }),
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1300,
        mx: "auto",
        px: { xs: 1, sm: 2 },
      }}
    >
      <Typography variant={"h5"}>Knowledge Hub</Typography>

      <NavTabs
        pages={pages}
        value={tabIndex}
        onChange={(_, newValue) => setTabIndex(newValue)}
      />

      {pages[tabIndex].component}
    </Box>
  );
}
