import { Box, Typography } from "@mui/material";

type Props = {
  title: string;
  text: string;
  fontSize?: number;
};

export function InfoItem({ title, text, fontSize = 14 }: Props) {
  return (
    <Box mb={1}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2" fontSize={fontSize}>
          <strong>{title}</strong>
        </Typography>
        <Typography
          variant="body2"
          fontSize={fontSize}
          sx={{
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "success.main",
          }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
}
