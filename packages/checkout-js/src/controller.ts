import { createTickean, type TickeanClient } from "./client";
import {
  checkoutReducer,
  createInitialState,
  type CheckoutAction,
  type CheckoutState,
} from "./state";
import {
  createMemoryPersistence,
  createSessionStoragePersistence,
} from "./persistence";
import { createNoopTelemetry } from "./telemetry";
import type {
  CartItem,
  CreateTickeanOptions,
  NextAction,
  PersistenceAdapter,
  TelemetryAdapter,
  TickeanError,
} from "./types";
import { TickeanError as TickeanErrorClass } from "./types";

export type CreateCheckoutControllerOptions = CreateTickeanOptions & {
  eventSlug: string;
  returnUrl?: string;
  quoteDebounceMs?: number;
  persistence?: PersistenceAdapter | false;
  persistenceKey?: string;
  telemetry?: TelemetryAdapter;
};

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toTickeanError(err: unknown): TickeanError {
  if (err instanceof TickeanErrorClass) return err;
  const anyErr = err as { code?: string; message?: string; details?: Record<string, unknown>; status?: number };
  return new TickeanErrorClass(
    {
      code: anyErr?.code || "checkout_unknown_error",
      message: anyErr?.message || "Unexpected checkout error",
      details: anyErr?.details,
    },
    anyErr?.status,
  );
}

export function createCheckoutController(
  options: CreateCheckoutControllerOptions,
) {
  const client: TickeanClient = createTickean(options);
  const telemetry = options.telemetry || createNoopTelemetry();
  const persistenceKey =
    options.persistenceKey ||
    `tickean.checkout.${options.eventSlug}.${options.publishableKey || "demo"}`;
  const persistence: PersistenceAdapter | null =
    options.persistence === false
      ? null
      : options.persistence ||
        (typeof sessionStorage !== "undefined"
          ? createSessionStoragePersistence()
          : createMemoryPersistence());

  let state = createInitialState();
  const listeners = new Set<(snapshot: CheckoutState) => void>();
  let quoteTimer: ReturnType<typeof setTimeout> | null = null;
  let quoteGeneration = 0;
  const quoteDebounceMs = options.quoteDebounceMs ?? 300;
  let disposed = false;

  const emit = (name: string, properties?: Record<string, unknown>) => {
    telemetry.track({ name, timestamp: Date.now(), properties });
  };

  const notify = () => {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      try {
        listener(snapshot);
      } catch {
        /* ignore subscriber errors */
      }
    }
  };

  const dispatch = (action: CheckoutAction) => {
    state = checkoutReducer(state, action);
    persist();
    notify();
  };

  const persist = () => {
    if (!persistence) return;
    persistence.set(persistenceKey, {
      sessionToken: state.session?.sessionToken,
      eventSlug: options.eventSlug,
      cart: state.cart,
      discountCode: state.discountCode,
      phase: state.phase,
      buyerVerified: state.buyerVerified,
      purchaseId: state.purchase?.id ?? null,
    });
  };

  const getSnapshot = (): CheckoutState => state;

  const subscribe = (listener: (snapshot: CheckoutState) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const scheduleQuote = () => {
    if (quoteTimer) clearTimeout(quoteTimer);
    if (!state.session || state.cart.length === 0) {
      dispatch({
        type: "QUOTE_SUCCESS",
        quote: {
          valid: true,
          totalPrice: 0,
          pricingBreakdown: { subtotal: 0 },
        },
      });
      return;
    }
    const gen = ++quoteGeneration;
    quoteTimer = setTimeout(async () => {
      dispatch({ type: "QUOTE_START" });
      emit("checkout.quote.start", { items: state.cart.length });
      try {
        const quote = await client.quote({
          items: state.cart,
          discountCode: state.discountCode || undefined,
        });
        if (disposed || gen !== quoteGeneration) return;
        dispatch({ type: "QUOTE_SUCCESS", quote });
        emit("checkout.quote.success", { totalPrice: quote.totalPrice });
        if ((quote.unlockedShowOptions || []).length > 0) {
          const catalog = await client.getCatalog();
          if (!disposed && gen === quoteGeneration) {
            dispatch({ type: "SET_EVENT", event: catalog });
          }
        }
      } catch (err) {
        if (disposed || gen !== quoteGeneration) return;
        const error = toTickeanError(err);
        dispatch({ type: "QUOTE_FAILURE", error });
        emit("checkout.quote.error", { code: error.code });
      }
    }, quoteDebounceMs);
  };

  const setCartItem = (showOptionId: string, amount: number) => {
    const next = state.cart.filter((item) => item.showOptionId !== showOptionId);
    if (amount > 0) next.push({ showOptionId, amount });
    dispatch({ type: "SET_CART", cart: next });
    emit("checkout.cart.change", { showOptionId, amount });
    scheduleQuote();
  };

  const setCart = (cart: CartItem[]) => {
    dispatch({
      type: "SET_CART",
      cart: cart.filter((item) => item.amount > 0),
    });
    emit("checkout.cart.change", { count: cart.length });
    scheduleQuote();
  };

  const applyDiscountCode = async (code: string) => {
    dispatch({ type: "SET_DISCOUNT", discountCode: code || null });
    if (!state.session) {
      throw new TickeanErrorClass({
        code: "checkout_session_required",
        message: "Session required",
      });
    }
    dispatch({ type: "QUOTE_START" });
    try {
      const quote = await client.quote({
        items: state.cart,
        discountCode: code || undefined,
      });
      dispatch({ type: "QUOTE_SUCCESS", quote });
      emit("checkout.discount.applied", { code: code || null });
      if ((quote.unlockedShowOptions || []).length > 0) {
        const catalog = await client.getCatalog();
        dispatch({ type: "SET_EVENT", event: catalog });
      }
      return quote;
    } catch (err) {
      const error = toTickeanError(err);
      dispatch({ type: "QUOTE_FAILURE", error });
      throw error;
    }
  };

  const sendOtp = async (phone: string, channel?: string) => {
    await client.sendOtp({ phone, channel });
    dispatch({ type: "OTP_SENT" });
    emit("checkout.otp.sent");
  };

  const verifyOtp = async (params: {
    phone: string;
    code: string;
    name?: string;
    email?: string;
  }) => {
    const result = (await client.verifyOtp(params)) as {
      buyer?: { id: string; phone: string; name?: string; email?: string };
    };
    const buyer = result.buyer || {
      id: "buyer",
      phone: params.phone,
      name: params.name,
      email: params.email,
    };
    dispatch({ type: "OTP_VERIFIED", buyer });
    emit("checkout.otp.verified");
  };

  const purchaseAndPay = async (params: {
    paymentMethod: string;
    currency: string;
    discountCode?: string;
    showId?: string;
    idempotencyKey?: string;
  }) => {
    dispatch({ type: "PURCHASE_START" });
    const idempotencyKey = params.idempotencyKey || generateIdempotencyKey();
    emit("checkout.purchase.start", { paymentMethod: params.paymentMethod });
    try {
      const purchase = await client.createPurchase({
        items: state.cart,
        paymentMethod: params.paymentMethod,
        currency: params.currency,
        discountCode: params.discountCode ?? state.discountCode ?? undefined,
        expectedTotal: state.quote?.totalPrice,
        showId: params.showId,
        idempotencyKey,
      });
      const payment = await client.createPayment({
        orderId: purchase.purchase.id,
        paymentMethod: params.paymentMethod,
        currency: params.currency,
        amount: purchase.purchase.totalPrice,
        idempotencyKey: `${idempotencyKey}:payment`,
      });
      const nextAction: NextAction =
        payment.nextAction ||
        (payment.paymentInstructions
          ? {
              type: "display_instructions",
              paymentInstructions: payment.paymentInstructions,
            }
          : payment.redirectUrl
            ? { type: "redirect", url: payment.redirectUrl }
            : { type: "none" });
      dispatch({
        type: "PURCHASE_SUCCESS",
        purchase: purchase.purchase,
        payment,
        nextAction,
      });
      emit("checkout.purchase.success", {
        purchaseId: purchase.purchase.id,
        nextActionType: nextAction.type,
      });
      return { purchaseId: purchase.purchase.id, payment, nextAction };
    } catch (err) {
      const error = toTickeanError(err);
      dispatch({ type: "PURCHASE_FAILURE", error });
      emit("checkout.purchase.error", { code: error.code });
      throw error;
    }
  };

  const confirmPayment = async (params?: {
    paymentId?: string;
    confirmationToken?: string;
    providerPayload?: string;
    idempotencyKey?: string;
  }) => {
    const payment = await client.confirmPayment({
      ...params,
      idempotencyKey: params?.idempotencyKey || generateIdempotencyKey(),
    });
    const nextAction = payment.nextAction || { type: "none" as const };
    dispatch({ type: "SET_NEXT_ACTION", nextAction, payment });
    emit("checkout.payment.confirmed", { nextActionType: nextAction.type });
    return payment;
  };

  const watchPayment = async (watchOptions?: {
    intervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  }) => {
    dispatch({ type: "PROCESSING" });
    emit("checkout.payment.watch.start");
    try {
      const status = await client.watchPayment(watchOptions);
      if (
        ["COMPLETED", "CONFIRMED", "PAID", "SUCCESS"].includes(
          String(status.status || "").toUpperCase(),
        )
      ) {
        dispatch({ type: "COMPLETED", purchase: status.purchase });
        emit("checkout.completed");
      } else if (status.nextAction && status.nextAction.type !== "none") {
        dispatch({
          type: "SET_NEXT_ACTION",
          nextAction: status.nextAction,
          payment: status.payment,
        });
      }
      return status;
    } catch (err) {
      const error = toTickeanError(err);
      if (error.code !== "checkout_payment_timeout") {
        dispatch({ type: "FAILED", error });
      }
      emit("checkout.payment.watch.error", { code: error.code });
      throw error;
    }
  };

  const refreshCatalog = async () => {
    const catalog = await client.getCatalog();
    dispatch({ type: "SET_EVENT", event: catalog });
    return catalog;
  };

  const initialize = async () => {
    dispatch({ type: "INIT_START" });
    emit("checkout.init.start", { eventSlug: options.eventSlug });
    try {
      const stored = persistence?.get(persistenceKey);
      let session = await client.createSession({
        eventSlug: options.eventSlug,
        returnUrl: options.returnUrl,
      });

      // Prefer fresh session; if we had a stored token, try getSession for resume
      if (stored?.sessionToken && stored.sessionToken !== session.sessionToken) {
        try {
          client.session = {
            ...session,
            sessionToken: stored.sessionToken,
          };
          const resumed = await client.getSession();
          session = {
            ...session,
            ...resumed,
            sessionToken: stored.sessionToken,
            event: resumed.event || session.event,
          };
        } catch {
          // fall through with fresh session
        }
      }

      dispatch({
        type: "INIT_SUCCESS",
        session,
        event: session.event,
      });

      if (stored?.cart?.length) {
        dispatch({ type: "SET_CART", cart: stored.cart });
        if (stored.discountCode) {
          dispatch({ type: "SET_DISCOUNT", discountCode: stored.discountCode });
        }
        if (stored.buyerVerified) {
          dispatch({
            type: "REHYDRATE",
            partial: { buyerVerified: true },
          });
        }
        scheduleQuote();
      }

      emit("checkout.init.success", { sessionId: session.sessionId });
    } catch (err) {
      const error = toTickeanError(err);
      dispatch({ type: "INIT_FAILURE", error });
      emit("checkout.init.error", { code: error.code });
      throw error;
    }
  };

  const dispose = () => {
    disposed = true;
    if (quoteTimer) clearTimeout(quoteTimer);
    listeners.clear();
  };

  // Kick off initialization (non-blocking for callers that subscribe first)
  const ready = initialize().catch(() => {
    /* error already in state */
  });

  return {
    client,
    ready,
    getSnapshot,
    subscribe,
    setCartItem,
    setCart,
    applyDiscountCode,
    sendOtp,
    verifyOtp,
    purchaseAndPay,
    confirmPayment,
    watchPayment,
    refreshCatalog,
    dispose,
    /** @internal test helper */
    _dispatch: dispatch,
  };
}

export type CheckoutController = ReturnType<typeof createCheckoutController>;
