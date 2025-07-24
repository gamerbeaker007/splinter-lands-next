import { Box } from "@mui/material";
import ArticleCarousel, { Article } from "./ArticleCarousel";

const temp_image =
  "https://files.peakd.com/file/peakd-hive/beaker007/23uFPdKf8W8ZX71NBX84EzrbuDWKc44PmSAcGwNRzkmS25BuzUm5ySwCMfrXsDdoAMTYK.png";

const articles: Article[] = [
  {
    title: "Land Strategy Pyramid",
    image:
      "https://files.peakd.com/file/peakd-hive/azircon/23tRxSKeZc1rMCdqBUDTXdNxXwcHjg8yRdFmYgZoB9NTfou6Dj13jixHXNAt77Be1nb9c.png",
    description: "",
    author: "Azircon",
    quote: "Very useful information for newcomers.",
    quoteAuthor: "beaker007",
    linkUrl: "https://peakd.com/hive-169191/@azircon/land-strategy-pyramid",
  },
  {
    title: "Top 10 Splinters",
    image: temp_image,
    description: "A breakdown of the most dominant Splinter combos for 2025.",
    quote: "Super helpful for building my deck!",
    quoteAuthor: "beaker007",
    author: "SilverStriker",
    linkUrl: "https://peakd.com/hive-169191/@azircon/land-strategy-pyramid",
  },
  {
    title: "Economy Explained",
    image: temp_image,
    description: "Understand the inner workings of DEC, SPS, and land value.",
    quote: "Game-changing insights.",
    quoteAuthor: "beaker007",
    author: "CryptoScholar",
    linkUrl: "https://peakd.com/hive-169191/@azircon/land-strategy-pyramid",
  },
  {
    title: "Update 1",
    image: temp_image,
    description: "Understand the inner workings of DEC, SPS, and land value.",
    quote: "Game-changing insights.",
    quoteAuthor: "beaker007",
    author: "CryptoScholar",
    linkUrl: "https://peakd.com/hive-169191/@azircon/land-strategy-pyramid",
  },
  {
    title: "Update 2",
    image: temp_image,
    description: "Understand the inner workings of DEC, SPS, and land value.",
    quote: "Game-changing insights.",
    quoteAuthor: "beaker007",
    author: "CryptoScholar",
    linkUrl: "https://peakd.com/hive-169191/@azircon/land-strategy-pyramid",
  },
  {
    title: "Update 2",
    image: temp_image,
    description: "Understand the inner workings of DEC, SPS, and land value.",
    quote: "Game-changing insights.",
    quoteAuthor: "beaker007",
    author: "CryptoScholar",
    linkUrl: "https://peakd.com/hive-169191/@azircon/land-strategy-pyramid",
  },
];

export default function ArticleSection() {
  return (
    <Box justifyContent={"center"} justifyItems={"center"} mb={4}>
      <ArticleCarousel articles={articles} />
    </Box>
  );
}
