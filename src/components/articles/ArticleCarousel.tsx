import { Box, Paper, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import Slider from "react-slick";
import "./center-carousel.css";

export type Article = {
  title: string;
  image: string;
  description: string;
  quote: string;
  quoteAuthor: string;
  author: string;
  linkUrl: string;
};

type Props = {
  articles: Article[];
};

const settings = {
  centerMode: true,
  centerPadding: "0px",
  slidesToShow: 3,
  infinite: true,
  autoplay: true,
  autoplaySpeed: 5000,
  speed: 600,
  arrows: true,
  dots: false,
  focusOnSelect: true,
  responsive: [
    {
      breakpoint: 900,
      settings: {
        slidesToShow: 1,
        centerMode: false,
      },
    },
  ],
};

export default function CenteredArticleCarousel({ articles }: Props) {
  const theme = useTheme();

  return (
    <Box sx={{ width: "100%", maxWidth: 1300, mt: 6 }}>
      <Slider {...settings}>
        {articles.map((article, index) => (
          <Box key={index} className="carousel-slide">
            <Link
              href={article.linkUrl}
              passHref
              target="_blank"
              style={{ textDecoration: "none", height: "100%" }}
            >
              <Paper
                elevation={4}
                className="carousel-content"
                sx={{
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 2,
                  overflow: "hidden",
                  p: 2,
                  textAlign: "center",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {article.title}
                </Typography>
                <Typography variant="caption" mt={-1}>
                  {article.author}
                </Typography>
                <Image
                  src={article.image}
                  alt={article.title}
                  width={330}
                  height={200}
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {article.description}
                </Typography>
                <Box sx={{ fontStyle: "italic", opacity: 0.8, mt: 1 }}>
                  “{article.quote}”
                  <Typography variant="caption" display="block">
                    — {article.quoteAuthor}
                  </Typography>
                </Box>
              </Paper>
            </Link>
          </Box>
        ))}
      </Slider>
    </Box>
  );
}
