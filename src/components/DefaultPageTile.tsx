"use client";

import Link from "next/link";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type Props = {
  title: string;
  href: string;
  image: string;
};

export default function DefaultPageTile({ title, href, image }: Props) {
  return (
    <Card
      component={Link}
      href={href}
      elevation={4}
      sx={{
        position: "relative",
        minHeight: 200,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        alignItems: "center",
        backgroundColor: "transparent",
        transition: "background-color 0.3s ease",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      {/* Background image */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.5,
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Foreground content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          px: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
      </Box>
    </Card>
  );
}
