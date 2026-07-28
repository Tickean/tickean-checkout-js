import { createDemoTransport } from "./demo";
import { createHttpTransport } from "./http";
import type {
  CartItem,
  CheckoutSession,
  CheckoutTransport,
  CreateTickeanOptions,
  PaymentResult,
  PaymentStatusResult,
  PublicEvent,
  PurchaseResult,
  QuoteResult,
} from "./types";
import { TickeanError } from "./types";

export type TickeanClient = ReturnType<typeof createTickean>;

export function createTickean(options: CreateTickeanOptions) {
  if (!options.publishableKey && !options.demo) {
    throw new TickeanError({
      code: "checkout_key_required",
      message: "publishableKey is required unless demo mode is enabled",
    });
  }

  const transport: CheckoutTransport = options.demo
    ? createDemoTransport()
    : createHttpTransport({
        publishableKey: options.publishableKey,
        apiBaseUrl: options.apiBaseUrl || "https://api.tickean.com",
        fetchImpl: options.fetchImpl,
      });

  let session: CheckoutSession | null = null;

  const requireSession = () => {
    if (!session?.sessionToken) {
      throw new TickeanError({
        code: "checkout_session_required",
        message: "Call createSession() before using checkout methods",
      });
    }
    return session;
  };

  return {
    get session() {
      return session;
    },

    async createSession(params: {
      eventSlug: string;
      returnUrl?: string;
    }): Promise<CheckoutSession> {
      session = await transport.request<CheckoutSession>("/v1/checkout/sessions", {
        method: "POST",
        body: params,
      });
      return session;
    },

    async getCatalog(): Promise<PublicEvent> {
      const active = requireSession();
      return transport.request("/v1/checkout/catalog", {
        sessionToken: active.sessionToken,
      });
    },

    async quote(params: {
      items: CartItem[];
      discountCode?: string;
      showId?: string;
    }): Promise<QuoteResult> {
      const active = requireSession();
      return transport.request("/v1/checkout/quote", {
        method: "POST",
        body: params,
        sessionToken: active.sessionToken,
      });
    },

    async sendOtp(params: { phone: string; channel?: string }) {
      const active = requireSession();
      return transport.request("/v1/checkout/otp/send", {
        method: "POST",
        body: params,
        sessionToken: active.sessionToken,
      });
    },

    async verifyOtp(params: {
      phone: string;
      code: string;
      name?: string;
      email?: string;
    }) {
      const active = requireSession();
      return transport.request("/v1/checkout/otp/verify", {
        method: "POST",
        body: params,
        sessionToken: active.sessionToken,
      });
    },

    async createPurchase(params: {
      items: CartItem[];
      paymentMethod: string;
      currency: string;
      showId?: string;
      discountCode?: string;
      expectedTotal?: number;
      shoppingCartReference?: string;
      idempotencyKey?: string;
    }): Promise<PurchaseResult> {
      const active = requireSession();
      return transport.request("/v1/checkout/purchases", {
        method: "POST",
        body: params,
        sessionToken: active.sessionToken,
      });
    },

    async createPayment(params: {
      orderId: string;
      paymentMethod: string;
      currency: string;
      amount: number;
    }): Promise<PaymentResult> {
      const active = requireSession();
      return transport.request("/v1/checkout/payments", {
        method: "POST",
        body: params,
        sessionToken: active.sessionToken,
      });
    },

    async getPaymentStatus(): Promise<PaymentStatusResult> {
      const active = requireSession();
      return transport.request("/v1/checkout/payments/status", {
        sessionToken: active.sessionToken,
      });
    },

    async watchPayment(options?: {
      intervalMs?: number;
      timeoutMs?: number;
      signal?: AbortSignal;
    }): Promise<PaymentStatusResult> {
      const intervalMs = options?.intervalMs ?? 2500;
      const timeoutMs = options?.timeoutMs ?? 5 * 60 * 1000;
      const started = Date.now();

      while (Date.now() - started < timeoutMs) {
        if (options?.signal?.aborted) {
          throw new TickeanError({
            code: "checkout_aborted",
            message: "Payment watch aborted",
          });
        }
        const status = await this.getPaymentStatus();
        if (
          ["COMPLETED", "CONFIRMED", "PAID"].includes(
            String(status.status || "").toUpperCase(),
          ) ||
          ["COMPLETED", "CONFIRMED", "PAID"].includes(
            String(status.purchase?.status || "").toUpperCase(),
          )
        ) {
          return status;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      throw new TickeanError({
        code: "checkout_payment_timeout",
        message: "Timed out waiting for payment confirmation",
      });
    },
  };
}

export * from "./types";
