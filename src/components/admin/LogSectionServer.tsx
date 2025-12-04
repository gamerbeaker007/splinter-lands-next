"use server";
import { getApplicationLogs } from "@/lib/backend/admin/adminActions";
import LogViewerClient from "./LogViewerClient";

export default async function LogSectionServer() {
  const { logs } = await getApplicationLogs();
  return <LogViewerClient initialLogs={logs} />;
}
