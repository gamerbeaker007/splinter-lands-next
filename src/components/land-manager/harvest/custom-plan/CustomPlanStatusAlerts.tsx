import { BroadcastResult } from "@/lib/frontend/splBroadcast";
import { CustomPlanStatus } from "@/types/landManager";
import { Alert, Stack } from "@mui/material";

interface Props {
  status: CustomPlanStatus;
  multiplierValid: boolean;
  error: string | null;
  result: BroadcastResult | null;
}

/** Plan-level validation, save and broadcast messages. */
export default function CustomPlanStatusAlerts({
  status,
  multiplierValid,
  error,
  result,
}: Props) {
  return (
    <Stack gap={1.5} sx={{ "&:empty": { display: "none" } }}>
      {status === "incomplete" && (
        <Alert severity="warning">
          Some rows are incomplete. Complete or delete them to save or execute.
        </Alert>
      )}
      {status === "invalid" && (
        <Alert severity="error">
          Some rows are invalid. Fix errors before executing. You may still save
          the plan.
        </Alert>
      )}
      {!multiplierValid && (
        <Alert severity="warning">Multiplier must be a positive number.</Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {result && !result.success && (
        <Alert severity="error">{result.error ?? "Broadcast failed"}</Alert>
      )}
    </Stack>
  );
}
