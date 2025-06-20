import { logger } from "./logger";

export function logError(context: string, error: unknown) {
  logger.error(context, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
