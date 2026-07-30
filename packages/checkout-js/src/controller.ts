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
import { watchPaymentSocket, type PaymentSocketWatchHandle } from "./payment-socket";
import { navigateTopLevel, resolveRedirectUrl } from "./navigate";
import type {
  CartItem,
  CheckoutSession,
  CreateTickeanOptions,
  NextAction,
  PaymentStatusResult,
  PersistenceAdapter,
  TelemetryAdapter,
  TickeanError,
} from "./types";
import { TickeanError as TickeanErrorClass } from "./types";

export type CreateCheckoutControllerOptions = CreateTickeanOptions & {
  eventSlug: string;
  returnUrl?: string;
  /** Abandonment recovery code from `?resume=` deep link. */
  resumeCode?: string;
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

function resolveShowIdFromCart(
  event: CheckoutState["event"],
  cart: CartItem[],
): string | null {
  const optionId = cart.find((item) => item.showOptionId)?.showOptionId;
  if (!optionId || !event?.shows?.length) return null;
  for (const show of event.shows) {
    if ((show.showOptions || []).some((opt) => opt.id === optionId)) {
      return show.id;
    }
  }
  return null;
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
  let activeSocketWatch: PaymentSocketWatchHandle | null = null;
  let watchAbort: AbortController | null = null;
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
          dispatch({
            type: "MERGE_UNLOCKED_OPTIONS",
            options: quote.unlockedShowOptions || [],
          });
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
    const normalized = code.trim().toUpperCase();
    dispatch({ type: "SET_DISCOUNT", discountCode: normalized || null });
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
        discountCode: normalized || undefined,
      });
      const unlocked = quote.unlockedShowOptions || [];
      const unlockedIds = quote.unlockedShowOptionIds || [];
      const unlockedAnything = unlocked.length > 0 || unlockedIds.length > 0;
      if (quote.valid === false && !unlockedAnything) {
        dispatch({ type: "SET_DISCOUNT", discountCode: null });
        const error = new TickeanErrorClass({
          code: "discount_invalid",
          message: quote.message || "Invalid discount code",
        });
        dispatch({ type: "QUOTE_FAILURE", error });
        throw error;
      }
      dispatch({ type: "QUOTE_SUCCESS", quote });
      emit("checkout.discount.applied", { code: normalized || null });
      if (unlocked.length > 0) {
        dispatch({
          type: "MERGE_UNLOCKED_OPTIONS",
          options: unlocked,
        });
      }
      return quote;
    } catch (err) {
      const error = toTickeanError(err);
      if (error.code !== "discount_invalid") {
        dispatch({ type: "QUOTE_FAILURE", error });
      }
      throw error;
    }
  };

  const lookupBuyer = async (phone: string) => {
    const result = await client.lookupBuyer({ phone });
    emit("checkout.buyer.lookup", { exists: result.exists });
    return result;
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

  const stopPaymentWatchers = () => {
    watchAbort?.abort();
    watchAbort = null;
    activeSocketWatch?.dispose();
    activeSocketWatch = null;
  };

  const changePaymentMethod = () => {
    stopPaymentWatchers();
    dispatch({ type: "RESET_PAYMENT_FLOW" });
    emit("checkout.payment.method_change");
  };

  const purchaseAndPay = async (params: {
    paymentMethod: string;
    currency: string;
    discountCode?: string;
    showId?: string;
    idempotencyKey?: string;
    attendees?: import("./types").PurchaseAttendee[];
  }) => {
    stopPaymentWatchers();
    dispatch({ type: "PURCHASE_START" });
    const idempotencyKey = params.idempotencyKey || generateIdempotencyKey();
    emit("checkout.purchase.start", { paymentMethod: params.paymentMethod });
    try {
      const showId =
        params.showId ||
        resolveShowIdFromCart(state.event, state.cart) ||
        undefined;
      // Re-create/update purchase so paymentMethod can change on an existing cart.
      const purchase = await client.createPurchase({
        items: state.cart,
        paymentMethod: params.paymentMethod,
        currency: params.currency,
        discountCode: params.discountCode ?? state.discountCode ?? undefined,
        expectedTotal: state.quote?.totalPrice,
        showId,
        idempotencyKey,
        attendees: params.attendees,
      });
      const payment = await client.createPayment({
        orderId: purchase.purchase.id,
        paymentMethod: params.paymentMethod,
        currency: params.currency,
        amount: purchase.purchase.totalPrice,
        idempotencyKey: `${idempotencyKey}:payment`,
      });
      const redirectUrl = resolveRedirectUrl({
        nextAction: payment.nextAction,
        redirectUrl: payment.redirectUrl,
        initPoint: payment.initPoint,
      });
      const nextAction: NextAction =
        payment.nextAction ||
        (payment.paymentInstructions
          ? {
              type: "display_instructions",
              paymentInstructions: payment.paymentInstructions,
            }
          : redirectUrl
            ? { type: "redirect", url: redirectUrl }
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
      // Transfer: socket room + HTTP polling until Talo finalizes.
      if (nextAction.type === "display_instructions") {
        void watchPayment({
          intervalMs: 10_000,
          timeoutMs: 45 * 60 * 1000,
        }).catch(() => {
          /* timeout keeps transfer instructions visible */
        });
      }
      // Mercado Pago / hosted checkout: go straight to provider (no extra click).
      if (nextAction.type === "redirect" && nextAction.url) {
        navigateTopLevel(nextAction.url);
      }
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

    watchAbort?.abort();
    activeSocketWatch?.dispose();
    watchAbort = new AbortController();
    const localAbort = watchAbort;
    const onOuterAbort = () => localAbort.abort();
    watchOptions?.signal?.addEventListener("abort", onOuterAbort);

    const timeoutMs = watchOptions?.timeoutMs ?? 45 * 60 * 1000;
    const cartRef = state.purchase?.shoppingCartReference;
    const purchaseId = state.purchase?.id;
    const apiBaseUrl = options.apiBaseUrl || "https://api.tickean.com";

    try {
      const status = await new Promise<PaymentStatusResult>((resolve, reject) => {
        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          localAbort.abort();
          activeSocketWatch?.dispose();
          activeSocketWatch = null;
          fn();
        };

        if (!options.demo && cartRef) {
          activeSocketWatch = watchPaymentSocket({
            apiBaseUrl,
            shoppingCartReference: cartRef,
            purchaseId,
            signal: localAbort.signal,
            timeoutMs,
          });
          emit("checkout.payment.socket.start", {
            shoppingCartReference: cartRef,
          });
          void activeSocketWatch.promise
            .then(async (snap) => {
              emit("checkout.payment.socket.confirmed", {
                status: snap.status,
                purchaseId: snap.purchaseId || purchaseId,
              });
              try {
                return await client.getPaymentStatus();
              } catch {
                return {
                  status: snap.status || "SUCCESS",
                  purchase: state.purchase
                    ? { ...state.purchase, status: "COMPLETED" }
                    : null,
                  payment: state.payment,
                  nextAction: { type: "none" as const },
                  requiresAction: false,
                } satisfies PaymentStatusResult;
              }
            })
            .then((result) => finish(() => resolve(result)))
            .catch(() => {
              /* socket path failed; HTTP polling may still win */
            });
        }

        void client
          .watchPayment({
            intervalMs: watchOptions?.intervalMs ?? (cartRef ? 10_000 : 3_000),
            timeoutMs,
            signal: localAbort.signal,
          })
          .then((result) => finish(() => resolve(result)))
          .catch((err) => {
            if (!settled) finish(() => reject(err));
          });
      });

      if (
        ["COMPLETED", "CONFIRMED", "PAID", "SUCCESS"].includes(
          String(status.status || "").toUpperCase(),
        ) ||
        ["COMPLETED", "CONFIRMED", "PAID", "SUCCESS"].includes(
          String(status.purchase?.status || "").toUpperCase(),
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
    } finally {
      watchOptions?.signal?.removeEventListener("abort", onOuterAbort);
      activeSocketWatch?.dispose();
      activeSocketWatch = null;
      if (watchAbort === localAbort) watchAbort = null;
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
      const resumeCode = options.resumeCode?.trim();
      if (resumeCode) {
        const recovered = await client.exchangeRecovery({ code: resumeCode });
        const session: CheckoutSession = {
          sessionId: recovered.sessionId,
          sessionToken: recovered.sessionToken,
          expiresAt: recovered.expiresAt,
          event: recovered.event,
          capabilities: recovered.capabilities || {},
          shoppingCartReference: recovered.shoppingCartReference,
          nextAction: recovered.nextAction,
          phase: recovered.phase,
        };
        dispatch({
          type: "INIT_SUCCESS",
          session,
          event: recovered.event,
        });
        dispatch({
          type: "REHYDRATE",
          partial: {
            cart: recovered.cart || [],
            discountCode: recovered.discountCode || null,
            buyer: recovered.buyer || null,
            buyerVerified: Boolean(recovered.buyerVerified || recovered.buyer),
            otpSent: Boolean(recovered.buyerVerified || recovered.buyer),
            purchase: recovered.purchase || null,
            payment: recovered.payment || null,
            nextAction: recovered.nextAction || { type: "none" },
            phase:
              recovered.phase === "completed"
                ? "completed"
                : recovered.phase === "processing" ||
                    recovered.suggestedStep === "PAYMENT_PENDING"
                  ? "processing"
                  : recovered.buyer
                    ? "ready_to_purchase"
                    : "browsing",
            loading: false,
            error: null,
          },
        });
        if (
          (recovered.nextAction?.type === "display_instructions" ||
            recovered.suggestedStep === "PAYMENT_PENDING") &&
          recovered.purchase
        ) {
          void watchPayment({
            intervalMs: 10_000,
            timeoutMs: 45 * 60 * 1000,
          }).catch(() => undefined);
        }
        persist();
        emit("checkout.init.success", {
          sessionId: session.sessionId,
          resumed: true,
        });
        return;
      }

      const stored = persistence?.get(persistenceKey);
      let session: Awaited<ReturnType<TickeanClient["createSession"]>> | null =
        null;

      // Resume first — avoid burning session rate limits on every remount/reload.
      if (stored?.sessionToken) {
        try {
          client.session = {
            sessionId: "",
            sessionToken: stored.sessionToken,
            expiresAt: "",
            event: {
              id: "",
              slug: options.eventSlug,
              title: "",
              shows: [],
            },
            capabilities: {},
          };
          const resumed = await client.getSession();
          session = {
            ...resumed,
            sessionToken: stored.sessionToken,
            event: resumed.event,
          };
        } catch {
          client.session = null;
          persistence?.remove(persistenceKey);
        }
      }

      if (!session) {
        session = await client.createSession({
          eventSlug: options.eventSlug,
          returnUrl: options.returnUrl,
        });
      }

      dispatch({
        type: "INIT_SUCCESS",
        session,
        event: session.event,
      });

      // Prefer server truth on resume (session may already be OTP-verified).
      if (session.otpVerified || stored?.buyerVerified) {
        dispatch({
          type: "REHYDRATE",
          partial: {
            buyerVerified: true,
            otpSent: true,
            buyer: session.buyerId
              ? {
                  id: String(session.buyerId),
                  phone: "",
                }
              : undefined,
          },
        });
      }

      if (stored?.cart?.length) {
        dispatch({ type: "SET_CART", cart: stored.cart });
        if (stored.discountCode) {
          dispatch({ type: "SET_DISCOUNT", discountCode: stored.discountCode });
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
    watchAbort?.abort();
    activeSocketWatch?.dispose();
    activeSocketWatch = null;
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
    lookupBuyer,
    sendOtp,
    verifyOtp,
    purchaseAndPay,
    changePaymentMethod,
    confirmPayment,
    watchPayment,
    refreshCatalog,
    dispose,
    /** @internal test helper */
    _dispatch: dispatch,
  };
}

export type CheckoutController = ReturnType<typeof createCheckoutController>;
