import { io, type Socket } from "socket.io-client";

export type PaymentSocketSnapshot = {
  purchaseId?: string;
  orderId?: string;
  paymentId?: string;
  status?: string;
  amount?: number;
  currency?: string;
};

export type PaymentSocketWatchHandle = {
  promise: Promise<PaymentSocketSnapshot>;
  dispose: () => void;
  get connected(): boolean;
};

function idsMatch(
  eventId: string | undefined,
  expectedId: string | undefined,
): boolean {
  if (!expectedId) return true;
  if (!eventId) return false;
  return String(eventId) === String(expectedId);
}

function isConfirmedStatus(status: string | undefined): boolean {
  return ["COMPLETED", "CONFIRMED", "PAID", "SUCCESS", "OVERPAID"].includes(
    String(status || "").toUpperCase(),
  );
}

/**
 * Join the legacy cart payment room (same as ecommerce) and resolve when
 * payment:confirmed arrives. HTTP polling remains the fallback.
 */
export function watchPaymentSocket(params: {
  apiBaseUrl: string;
  shoppingCartReference: string;
  purchaseId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}): PaymentSocketWatchHandle {
  const {
    apiBaseUrl,
    shoppingCartReference,
    purchaseId,
    signal,
    timeoutMs = 45 * 60 * 1000,
  } = params;

  let socket: Socket | null = null;
  let settled = false;
  let connected = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolveFn: ((value: PaymentSocketSnapshot) => void) | null = null;
  let rejectFn: ((reason?: unknown) => void) | null = null;

  const dispose = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    signal?.removeEventListener("abort", onAbort);
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  };

  const settleResolve = (value: PaymentSocketSnapshot) => {
    if (settled) return;
    settled = true;
    dispose();
    resolveFn?.(value);
  };

  const settleReject = (reason: unknown) => {
    if (settled) return;
    settled = true;
    dispose();
    rejectFn?.(reason);
  };

  const onAbort = () => {
    settleReject(new Error("checkout_aborted"));
  };

  const handleSnapshot = (payload: PaymentSocketSnapshot) => {
    const eventPurchaseId = payload?.purchaseId || payload?.orderId;
    if (!idsMatch(eventPurchaseId ? String(eventPurchaseId) : undefined, purchaseId)) {
      return;
    }
    if (isConfirmedStatus(payload?.status)) {
      settleResolve({
        ...payload,
        status: String(payload.status || "SUCCESS").toUpperCase(),
      });
    }
  };

  const promise = new Promise<PaymentSocketSnapshot>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;

    if (signal?.aborted) {
      settleReject(new Error("checkout_aborted"));
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });

    timer = setTimeout(() => {
      settleReject(new Error("checkout_payment_timeout"));
    }, timeoutMs);

    try {
      socket = io(apiBaseUrl.replace(/\/+$/, ""), {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });
    } catch (err) {
      settleReject(err);
      return;
    }

    const joinRoom = () => {
      if (!socket?.connected) return;
      connected = true;
      socket.emit("payment:process", { shoppingCartReference });
    };

    socket.on("connect", joinRoom);
    socket.on("reconnect", joinRoom);

    socket.on("payment:confirmed", (payload: PaymentSocketSnapshot) => {
      handleSnapshot({
        ...payload,
        status: payload?.status || "SUCCESS",
      });
    });

    socket.on("payment:status", (payload: PaymentSocketSnapshot) => {
      handleSnapshot(payload);
    });

    socket.on("payment:processing", () => {
      /* keep waiting — transfer still pending */
    });

    socket.on("payment:underpaid", () => {
      /* keep waiting; UI can still show instructions */
    });

    socket.on("connect_error", () => {
      connected = false;
      // Do not reject — HTTP polling fallback covers this.
    });

    socket.on("disconnect", () => {
      connected = false;
    });

    if (socket.connected) joinRoom();
  });

  return {
    promise,
    dispose: () => {
      // Silent teardown when HTTP polling wins the race.
      if (!settled) {
        settled = true;
        dispose();
        return;
      }
      dispose();
    },
    get connected() {
      return connected;
    },
  };
}
