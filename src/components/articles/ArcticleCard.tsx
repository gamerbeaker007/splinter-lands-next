import { Box, Paper, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

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
  article: Article;
};

export default function ArticleCard({ article }: Props) {
  const theme = useTheme();

  return (
    <Link
      href={article.linkUrl}
      passHref
      target="_blank"
      style={{ textDecoration: "none" }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 330,
          height: "100%",
          maxHeight: 700,
          mx: "auto",
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          cursor: "pointer",
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "scale(1.02)",
          },
        }}
      >
        {/* Title + Author */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {article.title}
          </Typography>
          <Typography variant="caption" mt={-1}>
            Author: {article.author}
          </Typography>
        </Box>

        {/* 16:9 Image with padding and radius */}
        <Box sx={{ p: 2, pt: 1 }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              paddingTop: "56.25%", // 16:9 aspect ratio
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 600px) 100vw, 330px"
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Box>

        {/* Description + Quote */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            px: 2,
            pt: 0,
            pb: 3,
            flexGrow: 1,
          }}
        >
          <Typography variant="body2">{article.description}</Typography>

          {(article.quote || article.quoteAuthor) && (
            <Box sx={{ fontStyle: "italic", opacity: 0.8, mt: 1 }}>
              {article.quote && <>“{article.quote}”</>}
              {article.quoteAuthor && (
                <Typography variant="caption" display="block" mt={0.5}>
                  — {article.quoteAuthor}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Link>
  );
}
