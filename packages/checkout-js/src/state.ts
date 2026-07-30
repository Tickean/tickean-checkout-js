import type {
  Buyer,
  CartItem,
  CheckoutPhase,
  CheckoutSession,
  NextAction,
  PaymentResult,
  PublicEvent,
  PurchaseResult,
  QuoteResult,
  TickeanError,
} from "./types";

export type CheckoutState = {
  phase: CheckoutPhase;
  session: CheckoutSession | null;
  event: PublicEvent | null;
  cart: CartItem[];
  discountCode: string | null;
  quote: QuoteResult | null;
  isQuoting: boolean;
  buyer: Buyer | null;
  buyerVerified: boolean;
  otpSent: boolean;
  purchase: PurchaseResult["purchase"] | null;
  payment: PaymentResult | null;
  nextAction: NextAction;
  error: TickeanError | null;
  loading: boolean;
};

export type CheckoutAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; session: CheckoutSession; event: PublicEvent }
  | { type: "INIT_FAILURE"; error: TickeanError }
  | { type: "SET_CART"; cart: CartItem[] }
  | { type: "SET_DISCOUNT"; discountCode: string | null }
  | { type: "QUOTE_START" }
  | { type: "QUOTE_SUCCESS"; quote: QuoteResult }
  | { type: "QUOTE_FAILURE"; error: TickeanError }
  | { type: "OTP_SENT" }
  | { type: "OTP_VERIFIED"; buyer: Buyer }
  | { type: "SET_EVENT"; event: PublicEvent }
  | {
      type: "MERGE_UNLOCKED_OPTIONS";
      options: import("./types").PublicShowOption[];
    }
  | { type: "PURCHASE_START" }
  | {
      type: "PURCHASE_SUCCESS";
      purchase: PurchaseResult["purchase"];
      payment: PaymentResult;
      nextAction: NextAction;
    }
  | { type: "PURCHASE_FAILURE"; error: TickeanError }
  | { type: "SET_NEXT_ACTION"; nextAction: NextAction; payment?: PaymentResult | null }
  | { type: "RESET_PAYMENT_FLOW" }
  | { type: "PROCESSING" }
  | { type: "COMPLETED"; purchase?: PurchaseResult["purchase"] | null }
  | { type: "FAILED"; error: TickeanError }
  | { type: "EXPIRED" }
  | { type: "CLEAR_ERROR" }
  | { type: "REHYDRATE"; partial: Partial<CheckoutState> };

export function createInitialState(
  partial?: Partial<CheckoutState>,
): CheckoutState {
  return {
    phase: "initializing",
    session: null,
    event: null,
    cart: [],
    discountCode: null,
    quote: null,
    isQuoting: false,
    buyer: null,
    buyerVerified: false,
    otpSent: false,
    purchase: null,
    payment: null,
    nextAction: { type: "none" },
    error: null,
    loading: true,
    ...partial,
  };
}

function derivePhase(state: CheckoutState): CheckoutPhase {
  if (
    state.phase === "completed" ||
    state.phase === "failed" ||
    state.phase === "expired" ||
    state.phase === "purchasing" ||
    state.phase === "processing" ||
    state.phase === "requires_action" ||
    state.phase === "initializing"
  ) {
    return state.phase;
  }
  if (state.isQuoting) return "quoting";
  if (state.otpSent && !state.buyerVerified) return "verifying_buyer";
  if (state.buyerVerified && state.cart.length > 0) return "ready_to_purchase";
  return "browsing";
}

export function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction,
): CheckoutState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, loading: true, error: null, phase: "initializing" };
    case "INIT_SUCCESS": {
      const next: CheckoutState = {
        ...state,
        loading: false,
        error: null,
        session: action.session,
        event: action.event,
        phase: "browsing",
      };
      return { ...next, phase: derivePhase(next) };
    }
    case "INIT_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.error,
        phase: "failed",
      };
    case "SET_CART": {
      const next = { ...state, cart: action.cart, error: null };
      return { ...next, phase: derivePhase(next) };
    }
    case "SET_DISCOUNT":
      return { ...state, discountCode: action.discountCode };
    case "QUOTE_START": {
      const next = { ...state, isQuoting: true, error: null };
      return { ...next, phase: "quoting" };
    }
    case "QUOTE_SUCCESS": {
      const next = {
        ...state,
        isQuoting: false,
        quote: action.quote,
      };
      return { ...next, phase: derivePhase(next) };
    }
    case "QUOTE_FAILURE":
      return {
        ...state,
        isQuoting: false,
        error: action.error,
        phase: derivePhase({ ...state, isQuoting: false }),
      };
    case "OTP_SENT": {
      const next = { ...state, otpSent: true, error: null };
      return { ...next, phase: "verifying_buyer" };
    }
    case "OTP_VERIFIED": {
      const next = {
        ...state,
        buyer: action.buyer,
        buyerVerified: true,
        otpSent: true,
        error: null,
      };
      return { ...next, phase: derivePhase(next) };
    }
    case "SET_EVENT":
      return { ...state, event: action.event };
    case "MERGE_UNLOCKED_OPTIONS": {
      if (!state.event || !action.options.length) return state;
      const shows = state.event.shows.map((show) => ({
        ...show,
        showOptions: [...show.showOptions],
      }));
      const byId = new Map<string, (typeof shows)[0]["showOptions"][0]>();
      for (const show of shows) {
        for (const opt of show.showOptions) byId.set(opt.id, opt);
      }
      for (const unlocked of action.options) {
        if (byId.has(unlocked.id)) continue;
        const showId = unlocked.showId;
        let target = showId ? shows.find((s) => s.id === showId) : undefined;
        if (!target) target = shows[0];
        if (!target) continue;
        const option = { ...unlocked };
        target.showOptions.push(option);
        byId.set(option.id, option);
      }
      return {
        ...state,
        event: { ...state.event, shows },
      };
    }
    case "PURCHASE_START":
      return { ...state, phase: "purchasing", error: null };
    case "PURCHASE_SUCCESS": {
      const requiresProviderAction =
        action.nextAction.type !== "none" &&
        action.nextAction.type !== "display_instructions";
      return {
        ...state,
        purchase: action.purchase,
        payment: action.payment,
        nextAction: action.nextAction,
        phase: requiresProviderAction ? "requires_action" : "processing",
        error: null,
      };
    }
    case "PURCHASE_FAILURE": {
      // Keep cart/buyer so the buyer can retry or switch methods.
      const next = {
        ...state,
        error: action.error,
        phase: "browsing" as CheckoutPhase,
      };
      return { ...next, phase: derivePhase(next) };
    }
    case "SET_NEXT_ACTION":
      return {
        ...state,
        nextAction: action.nextAction,
        payment: action.payment === undefined ? state.payment : action.payment,
        phase:
          action.nextAction.type !== "none" &&
          action.nextAction.type !== "display_instructions"
            ? "requires_action"
            : state.phase === "requires_action"
              ? "processing"
              : state.phase,
      };
    case "RESET_PAYMENT_FLOW": {
      // Allow picking another method after transfer/MP was started.
      const next = {
        ...state,
        payment: null,
        nextAction: { type: "none" as const },
        error: null,
        phase: "browsing" as CheckoutPhase,
      };
      return { ...next, phase: derivePhase(next) };
    }
    case "PROCESSING":
      return { ...state, phase: "processing" };
    case "COMPLETED":
      return {
        ...state,
        phase: "completed",
        purchase: action.purchase ?? state.purchase,
        nextAction: { type: "none" },
        error: null,
      };
    case "FAILED":
      return { ...state, phase: "failed", error: action.error };
    case "EXPIRED":
      return { ...state, phase: "expired" };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "REHYDRATE": {
      const next = { ...state, ...action.partial };
      return { ...next, phase: derivePhase(next) };
    }
    default:
      return state;
  }
}
