import React from "react";
import { Box } from "@mui/material";
import { HiQuestionMarkCircle } from "react-icons/hi";

type FilterIconProps = {
  name: string;
  isActive: boolean;
  image: string;
  onChange: () => void;
};

export default function FilterIcon({
  name,
  isActive,
  image,
  onChange,
}: FilterIconProps) {
  return (
    <Box
      onClick={onChange}
      sx={{
        width: 35,
        height: 35,
        border: "3px solid",
        borderColor: isActive ? "secondary.main" : "grey.400",
        borderRadius: 1,
        overflow: "hidden",
        cursor: "pointer",
        display: "inline-block",
        padding: "2px",
        margin: "5px",
      }}
      title={name}
    >
      {name === "Unknown" ? (
        <HiQuestionMarkCircle
          style={{ color: "red", width: "100%", height: "100%" }}
        />
      ) : (
        <Box
          component="img"
          src={image}
          alt={name}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      )}
    </Box>
  );
}
