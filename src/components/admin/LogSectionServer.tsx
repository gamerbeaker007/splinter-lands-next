"use server";
import { getLogsAction } from "@/lib/backend/admin/adminActions";
import LogViewerClient from "./LogViewerClient";

export default async function LogSectionServer() {
  const data = await getLogsAction(1, undefined, 100);
  return <LogViewerClient initialData={data} />;
}
