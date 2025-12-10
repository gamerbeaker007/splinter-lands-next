import logger from "@/lib/backend/log/logger.server";

/**
 * Helper function to refresh the Next.js cache after data injection
 * Call this at the end of your data_inject script
 */
export async function refreshNextCache() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const token = process.env.CACHE_INVALIDATE_TOKEN;

  if (!token) {
    console.warn("⚠️  CACHE_INVALIDATE_TOKEN not set - skipping cache refresh");
    return;
  }

  try {
    logger.info("🔄 Refreshing Next.js cache...");

    const response = await fetch(`${baseUrl}/api/cache/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cache refresh failed: ${error.error}`);
    }

    const result = await response.json();
    logger.info("✅ Cache refreshed successfully");
    logger.info(`   - Records: ${result.recordCount}`);
    logger.info(`   - Duration: ${result.durationMs}ms`);
    logger.info(`   - Timestamp: ${result.timestamp}`);
  } catch (error) {
    logger.error("❌ Cache refresh error:", error);
    throw error;
  }
}
