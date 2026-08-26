import { formatCompactNumber } from "@/lib/formatters";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { IconButton, Tooltip, Typography } from "@mui/material";

type Props = {
  totalDecStaked: number;
  totalDecNeeded: number;
  totalDecInUse: number;
  totalDecSaved: number;
  maxDecPossible: number;
  runiStakedDEC: number;
};

const DecInfoTooltip = ({
  totalDecStaked,
  totalDecNeeded,
  totalDecInUse,
  totalDecSaved,
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
            • Total Staked:{" "}
            {formatCompactNumber(totalDecStaked, { maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2">
            • Total Needed:{" "}
            {formatCompactNumber(totalDecNeeded, { maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2">
            • Total In Use:{" "}
            {formatCompactNumber(totalDecInUse, { maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2">
            • Total Saved (Discount):{" "}
            {formatCompactNumber(totalDecSaved, { maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2">
            • Max Possible:{" "}
            {formatCompactNumber(maxDecPossible, { maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2">
            • Reduced DEC by Runi:{" "}
            {formatCompactNumber(runiStakedDEC, { maximumFractionDigits: 2 })}
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
