"use client";

import {
  getHiveAuthTxNoticeSnapshot,
  subscribeHiveAuthTxNotice,
} from "@/lib/frontend/signing/hiveAuthTxNotice";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useSyncExternalStore } from "react";

export default function HiveAuthTxNotice() {
  const notice = useSyncExternalStore(
    subscribeHiveAuthTxNotice,
    getHiveAuthTxNoticeSnapshot,
    getHiveAuthTxNoticeSnapshot
  );

  if (!notice.visible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: 10, md: 14 },
        left: { xs: 10, md: 24 },
        right: { xs: 10, md: 24 },
        zIndex: 2500,
        pointerEvents: "none",
      }}
    >
      <Alert severity="info" variant="filled" sx={{ pointerEvents: "auto" }}>
        <Typography fontWeight={700}>{notice.message}</Typography>
        {notice.expire && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Request expires at {new Date(notice.expire).toLocaleTimeString()}.
          </Typography>
        )}
      </Alert>
    </Box>
  );
}
