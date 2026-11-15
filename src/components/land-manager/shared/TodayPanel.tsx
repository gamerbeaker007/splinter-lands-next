"use client";

import { useCardDetailsAction } from "@/hooks/useCardDetails";
import { useTodayPanelData } from "@/hooks/useTodayPanelData";
import { Alert } from "@mui/material";
import TodayPanelView from "./TodayPanelView";

export default function TodayPanel({
  today,
}: {
  today: ReturnType<typeof useTodayPanelData>;
}) {
  const { cardDetails } = useCardDetailsAction();
  return (
    <>
      {today.error && <Alert severity="error">{today.error}</Alert>}
      <TodayPanelView
        data={today.data ?? null}
        loading={today.loading && !today.data}
        verifiedTxIds={today.verifiedTxIds}
        failedTxIds={today.failedTxIds}
        txResults={today.txResults}
        cardDetails={cardDetails}
      />
    </>
  );
}
