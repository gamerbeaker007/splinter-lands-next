import { CustomPlanRowStatus } from "@/components/land-manager/harvest/custom-plan/customPlanRowUtils";
import {
  Add,
  CheckCircle,
  ErrorOutline,
  PendingOutlined,
  WarningAmber,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";

export default function CustomPlanRowStatusIcon({
  status,
}: {
  status: CustomPlanRowStatus;
}) {
  switch (status) {
    case "valid":
      return (
        <Tooltip title="Ready">
          <CheckCircle color="success" fontSize="small" />
        </Tooltip>
      );
    case "skipped":
      return (
        <Tooltip title="Skipped">
          <WarningAmber color="warning" fontSize="small" />
        </Tooltip>
      );
    case "error":
      return (
        <Tooltip title="Invalid">
          <ErrorOutline color="error" fontSize="small" />
        </Tooltip>
      );
    case "incomplete":
      return (
        <Tooltip title="Incomplete">
          <PendingOutlined sx={{ color: "text.disabled" }} fontSize="small" />
        </Tooltip>
      );
    case "new":
      return <Add sx={{ color: "text.disabled" }} fontSize="small" />;
  }
}
