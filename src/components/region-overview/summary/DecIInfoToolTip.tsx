import { Tooltip, IconButton, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { formatNumberWithSuffix } from "@/lib/formatters";

type Props = {
  totalDecStaked: number;
  totalDecNeeded: number;
  totalDecInUse: number;
  maxDecPossible: number;
  runiStakedDEC: number;
};

const DecInfoTooltip = ({
  totalDecStaked,
  totalDecNeeded,
  totalDecInUse,
  maxDecPossible,
  runiStakedDEC,
}: Props) => {
  return (
    <Tooltip
      title={
        <div style={{ padding: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>DEC Stats</strong>
          </Typography>
          <Typography variant="body2">
            • Total Staked: {formatNumberWithSuffix(totalDecStaked)}
          </Typography>
          <Typography variant="body2">
            • Total Needed: {formatNumberWithSuffix(totalDecNeeded)}
          </Typography>
          <Typography variant="body2">
            • Total In Use: {formatNumberWithSuffix(totalDecInUse)}
          </Typography>
          <Typography variant="body2">
            • Max Possible: {formatNumberWithSuffix(maxDecPossible)}
          </Typography>
          <Typography variant="body2">
            • Reduced DEC by Runi: {formatNumberWithSuffix(runiStakedDEC)}
          </Typography>
        </div>
      }
      arrow
      placement="top"
    >
      <IconButton size="small" color="primary">
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default DecInfoTooltip;
