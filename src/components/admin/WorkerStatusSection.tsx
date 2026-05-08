import { getWorkerRunStatus } from "@/lib/backend/admin/adminActions";
import WorkerStatusClient from "./WorkerStatusClient";

export default async function WorkerStatusSection() {
  const data = await getWorkerRunStatus();
  return <WorkerStatusClient data={data} />;
}
