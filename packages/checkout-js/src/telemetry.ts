import type { TelemetryAdapter, TelemetryEvent } from "./types";

export function createNoopTelemetry(): TelemetryAdapter {
  return {
    track() {
      /* no-op */
    },
  };
}

export type TelemetryListener = (event: TelemetryEvent) => void;

export function createEventEmitterTelemetry(
  listeners: TelemetryListener[] = [],
): TelemetryAdapter & {
  subscribe(listener: TelemetryListener): () => void;
} {
  const subs = new Set<TelemetryListener>(listeners);
  return {
    track(event) {
      for (const listener of subs) {
        try {
          listener(event);
        } catch {
          /* never break checkout for telemetry */
        }
      }
    },
    subscribe(listener) {
      subs.add(listener);
      return () => {
        subs.delete(listener);
      };
    },
  };
}
