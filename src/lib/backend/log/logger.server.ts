import { createLog, type LogLevel } from "@/lib/backend/api/internal/log-data";

function consoleLog(level: LogLevel, message: string) {
  const ts = new Date().toISOString();
  if (level === "error") {
    console.error(`${ts} [${level.toUpperCase()}]: ${message}`);
  } else if (level === "warn") {
    console.warn(`${ts} [${level.toUpperCase()}]: ${message}`);
  } else {
    console.log(`${ts} [${level.toUpperCase()}]: ${message}`);
  }
}

function toMeta(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value: String(value) };
}

function log(level: LogLevel, message: string, meta?: unknown) {
  consoleLog(level, message);
  // Fire-and-forget: don't block the caller, and don't crash if DB is unavailable.
  createLog(level, message, toMeta(meta)).catch((err) => {
    console.error(`[logger] Failed to write log to DB: ${err}`);
  });
}

const logger = {
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
};

export default logger;

/** Convenience helper — logs an error with context + stack to console and DB. */
export function logError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  // Print full stack to console so it's visible in terminal / container logs
  console.error(`${new Date().toISOString()} [ERROR]: ${context} — ${message}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  // Also persist to DB
  createLog("error", context, {
    message,
    stack: error instanceof Error ? error.stack : undefined,
  }).catch((err) => {
    console.error(`[logger] Failed to write error log to DB: ${err}`);
  });
}
