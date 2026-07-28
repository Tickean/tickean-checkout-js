import { TickeanError, type CheckoutTransport } from "./types";

export function createHttpTransport(options: {
  publishableKey: string;
  apiBaseUrl: string;
  fetchImpl?: typeof fetch;
}): CheckoutTransport {
  const fetchImpl = options.fetchImpl || fetch;

  return {
    async request<T>(path, init) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Tickean-Key": options.publishableKey,
      };
      if (init.sessionToken) {
        headers["X-Tickean-Checkout-Session"] = init.sessionToken;
      }
      if (init.idempotencyKey) {
        headers["Idempotency-Key"] = init.idempotencyKey;
      }

      const response = await fetchImpl(
        `${options.apiBaseUrl.replace(/\/$/, "")}${path}`,
        {
          method: init.method || "GET",
          headers,
          body: init.body ? JSON.stringify(init.body) : undefined,
          credentials: "omit",
        },
      );

      const requestId =
        response.headers.get("X-Request-Id") ||
        response.headers.get("x-request-id") ||
        undefined;

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = json?.error || {};
        throw new TickeanError(
          {
            code: err.code || "checkout_request_failed",
            message: err.message || response.statusText || "Request failed",
            details: err.details,
          },
          response.status,
          requestId,
        );
      }
      return json as T;
    },
  };
}
