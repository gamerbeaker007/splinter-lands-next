import { dec_icon_url } from "@/lib/shared/statics_icon_urls";
import { Avatar, IconButton, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { formatLargeNumber } from "@/lib/formatters";

type Props = {
  title: string;
  dec: number;
  explanation: string;
};

const TotalsDEC: React.FC<Props> = ({ title, dec, explanation }) => {
  return (
    <Box mt={2}>
      <Typography variant="h5">
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }} // vertical on xs, horizontal on sm+
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Avatar src={dec_icon_url} sx={{ width: 75, height: 75 }} />
          <Box>{title}:</Box>
          <Box>{formatLargeNumber(dec)} /hr</Box>
          <Box>
            <Tooltip
              arrow
              placement="top-start"
              title={
                <Box sx={{ whiteSpace: "pre-line", maxWidth: 300 }}>
                  {explanation}
                </Box>
              }
            >
              <IconButton size="small">
                <Avatar
                  sx={{
                    width: 35,
                    height: 35,
                    bgcolor: "transparent",
                    color: "text.secondary",
                  }}
                >
                  <InfoOutlinedIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Typography>
    </Box>
  );
};

export default TotalsDEC;
