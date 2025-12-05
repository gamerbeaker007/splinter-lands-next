import { getCacheStatus } from "@/lib/backend/admin/adminActions";
import CacheSectionClient from "./CacheSectionClient";

export default async function CacheSectionServer() {
  const data = await getCacheStatus();
  return <CacheSectionClient initialData={data} />;
}
