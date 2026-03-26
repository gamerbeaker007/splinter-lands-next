import { Alert } from "@mui/material";

interface Props {
  lastUpdated: Date | string | null | undefined;
  label?: string;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "unknown";
  const d = typeof value === "string" ? new Date(value) : value;
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replaceAll(" ", "-"); // e.g. "25 Mar 2026"
}

export default function WeeklyDataAlert({
  lastUpdated,
  label = "This data",
}: Props) {
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {label} is updated once a week. Last updated:{" "}
      <strong>{formatDate(lastUpdated)}</strong>
    </Alert>
  );
}
