import { createDemoTransport } from "./demo";
import { createHttpTransport } from "./http";
import type {
  Buyer,
  CartItem,
  CheckoutSession,
  CheckoutTransport,
  CreateTickeanOptions,
  NextAction,
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

    set session(value: CheckoutSession | null) {
      session = value;
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

    async exchangeRecovery(params: { code: string }): Promise<{
      sessionId: string;
      sessionToken: string;
      expiresAt: string;
      suggestedStep?: string | number;
      event: import("./types").PublicEvent;
      capabilities?: Record<string, boolean>;
      cart: CartItem[];
      discountCode?: string | null;
      buyer?: Buyer | null;
      buyerVerified?: boolean;
      purchase?: PurchaseResult["purchase"] | null;
      payment?: PaymentResult | null;
      nextAction?: NextAction;
      shoppingCartReference?: string | null;
      phase?: string;
    }> {
      const result = await transport.request<{
        sessionId: string;
        sessionToken: string;
        expiresAt: string;
        suggestedStep?: string | number;
        event: PublicEvent;
        capabilities?: Record<string, boolean>;
        cart: CartItem[];
        discountCode?: string | null;
        buyer?: Buyer | null;
        buyerVerified?: boolean;
        purchase?: PurchaseResult["purchase"] | null;
        payment?: PaymentResult | null;
        nextAction?: NextAction;
        shoppingCartReference?: string | null;
        phase?: string;
      }>("/v1/checkout/recovery/exchange", {
        method: "POST",
        body: params,
      });
      session = {
        sessionId: result.sessionId,
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt,
        event: result.event,
        capabilities: result.capabilities || {},
        shoppingCartReference: result.shoppingCartReference,
        nextAction: result.nextAction,
        phase: result.phase,
      };
      return result;
    },

    async getSession(): Promise<CheckoutSession> {
      const active = requireSession();
      const result = await transport.request<CheckoutSession>(
        "/v1/checkout/session",
        {
          sessionToken: active.sessionToken,
        },
      );
      session = {
        ...active,
        ...result,
        sessionToken: active.sessionToken,
        event: result.event || active.event,
        capabilities: result.capabilities || active.capabilities || {},
      };
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

    async lookupBuyer(params: { phone: string }): Promise<{
      exists: boolean;
      buyer?: { id: string; phone: string; name?: string; email?: string };
    }> {
      const active = requireSession();
      return transport.request("/v1/checkout/buyer/lookup", {
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
      attendees?: import("./types").PurchaseAttendee[];
    }): Promise<PurchaseResult> {
      const active = requireSession();
      const { idempotencyKey, ...body } = params;
      return transport.request("/v1/checkout/purchases", {
        method: "POST",
        body,
        sessionToken: active.sessionToken,
        idempotencyKey,
      });
    },

    async createPayment(params: {
      orderId: string;
      paymentMethod: string;
      currency: string;
      amount: number;
      idempotencyKey?: string;
    }): Promise<PaymentResult> {
      const active = requireSession();
      const { idempotencyKey, ...body } = params;
      return transport.request("/v1/checkout/payments", {
        method: "POST",
        body,
        sessionToken: active.sessionToken,
        idempotencyKey,
      });
    },

    async confirmPayment(params?: {
      paymentId?: string;
      confirmationToken?: string;
      providerPayload?: string;
      idempotencyKey?: string;
    }): Promise<PaymentResult> {
      const active = requireSession();
      const { idempotencyKey, ...body } = params || {};
      return transport.request("/v1/checkout/payments/confirm", {
        method: "POST",
        body,
        sessionToken: active.sessionToken,
        idempotencyKey,
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
          ["COMPLETED", "CONFIRMED", "PAID", "SUCCESS"].includes(
            String(status.status || "").toUpperCase(),
          ) ||
          ["COMPLETED", "CONFIRMED", "PAID", "SUCCESS"].includes(
            String(status.purchase?.status || "").toUpperCase(),
          )
        ) {
          return status;
        }
        const nextType = (status.nextAction as NextAction | undefined)?.type;
        // display_instructions means wait for async transfer confirmation — keep polling.
        if (
          status.nextAction &&
          nextType &&
          nextType !== "none" &&
          nextType !== "display_instructions" &&
          status.requiresAction
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
