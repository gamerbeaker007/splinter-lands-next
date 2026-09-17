import { Box } from "@mui/material";
import { HiQuestionMarkCircle } from "react-icons/hi";

type FilterIconProps = {
  name: string;
  isActive: boolean;
  image: string;
  onChange: () => void;
  backgroundColorGrey?: boolean;
};

export default function FilterIcon({
  name,
  isActive,
  image,
  onChange,
  backgroundColorGrey = false,
}: Readonly<FilterIconProps>) {
  return (
    <Box
      onClick={onChange}
      sx={{
        width: "35px",
        height: "35px",
        border: "3px solid",
        borderColor: isActive ? "secondary.main" : "grey.400",
        borderRadius: 1,
        overflow: "hidden",
        cursor: "pointer",
        display: "inline-block",
        padding: "2px",
        mr: "5px",
        background: backgroundColorGrey ? "grey" : "transparent",
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
            display: "block",
          }}
        />
      )}
    </Box>
  );
}
