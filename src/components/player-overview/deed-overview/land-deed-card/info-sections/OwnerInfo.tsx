import { CSSSize } from "@/types/cssSize";
import { Box, Typography } from "@mui/material";

export type Props = {
  owner: string | null;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const OwnerInfo: React.FC<Props> = ({
  owner,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "left",
        bgcolor: "rgba(70, 71, 70, 0.9)",
        color: "#333",
        borderRadius: 1,
        padding: "2px 10px 2px 10px",
      }}
    >
      <Typography
        variant="h6"
        color="black"
        fontWeight="bold"
        textAlign="center"
        sx={{
          fontSize: "0.8rem",
        }}
      >
        {`Owned by: ${owner ? owner : "N/A"}`}
      </Typography>
    </Box>
  );
};
