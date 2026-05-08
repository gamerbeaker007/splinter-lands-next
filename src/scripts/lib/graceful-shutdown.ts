let shutdownRequested = false;
const sleepResolvers: Set<() => void> = new Set();

export function shouldShutdown(): boolean {
  return shutdownRequested;
}

/** Register SIGTERM/SIGINT handlers. Call once at startup. */
export function registerShutdownHandlers() {
  const handler = () => {
    shutdownRequested = true;
    for (const resolve of sleepResolvers) {
      resolve();
    }
    sleepResolvers.clear();
  };

  process.on("SIGTERM", handler);
  process.on("SIGINT", handler);
}

/** Sleep that can be interrupted by shutdown signals. */
export function interruptibleSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (shutdownRequested) {
      resolve();
      return;
    }

    const wakeUp = () => {
      clearTimeout(timer);
      sleepResolvers.delete(wakeUp);
      resolve();
    };

    const timer = setTimeout(wakeUp, ms);
    sleepResolvers.add(wakeUp);
  });
}
