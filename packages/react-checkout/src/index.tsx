import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  createCheckoutController,
  createTickean,
  type CartItem,
  type CheckoutController,
  type CheckoutPhase,
  type CheckoutSession,
  type CheckoutState,
  type NextAction,
  type PublicEvent,
  type QuoteResult,
  type TickeanClient,
  type TickeanError,
  type Buyer,
} from "@tickean/checkout-js";
import {
  attachController,
  defineTickeanElements,
  detachController,
} from "@tickean/checkout-elements";

if (typeof window !== "undefined") {
  defineTickeanElements();
}

type TickeanContextValue = {
  client: TickeanClient;
  controller: CheckoutController;
  session: CheckoutSession | null;
  event: PublicEvent | null;
  loading: boolean;
  error: TickeanError | string | null;
  cart: CartItem[];
  quote: QuoteResult | null;
  phase: CheckoutPhase;
  isQuoting: boolean;
  buyer: Buyer | null;
  nextAction: NextAction;
  setCartItem: (showOptionId: string, amount: number) => void;
  refreshCatalog: () => Promise<void>;
  applyDiscountCode: (code: string) => Promise<QuoteResult>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (params: {
    phone: string;
    code: string;
    name?: string;
    email?: string;
  }) => Promise<void>;
  checkout: (params: {
    paymentMethod: string;
    currency: string;
    discountCode?: string;
  }) => Promise<{
    purchaseId: string;
    payment: Awaited<ReturnType<TickeanClient["createPayment"]>>;
    nextAction: NextAction;
  }>;
};

const TickeanContext = createContext<TickeanContextValue | null>(null);

export type TickeanProviderProps = {
  publishableKey: string;
  eventSlug: string;
  apiBaseUrl?: string;
  returnUrl?: string;
  demo?: boolean;
  children: ReactNode;
};

function useControllerSnapshot(controller: CheckoutController): CheckoutState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
}

export function TickeanProvider({
  publishableKey,
  eventSlug,
  apiBaseUrl,
  returnUrl,
  demo,
  children,
}: TickeanProviderProps) {
  const controller = useMemo(
    () =>
      createCheckoutController({
        publishableKey,
        eventSlug,
        apiBaseUrl,
        returnUrl,
        demo,
        persistence: false,
      }),
    [publishableKey, eventSlug, apiBaseUrl, returnUrl, demo],
  );

  useEffect(() => {
    return () => controller.dispose();
  }, [controller]);

  const snapshot = useControllerSnapshot(controller);

  const setCartItem = useCallback(
    (showOptionId: string, amount: number) => {
      controller.setCartItem(showOptionId, amount);
    },
    [controller],
  );

  const refreshCatalog = useCallback(async () => {
    await controller.refreshCatalog();
  }, [controller]);

  const applyDiscountCode = useCallback(
    async (code: string) => controller.applyDiscountCode(code),
    [controller],
  );

  const sendOtp = useCallback(
    async (phone: string) => {
      await controller.sendOtp(phone);
    },
    [controller],
  );

  const verifyOtp = useCallback(
    async (params: {
      phone: string;
      code: string;
      name?: string;
      email?: string;
    }) => {
      await controller.verifyOtp(params);
    },
    [controller],
  );

  const checkout = useCallback(
    async (params: {
      paymentMethod: string;
      currency: string;
      discountCode?: string;
    }) => {
      const result = await controller.purchaseAndPay(params);
      return {
        purchaseId: result.purchaseId,
        payment: result.payment,
        nextAction: result.nextAction,
      };
    },
    [controller],
  );

  const value: TickeanContextValue = {
    client: controller.client,
    controller,
    session: snapshot.session,
    event: snapshot.event,
    loading: snapshot.loading,
    error: snapshot.error,
    cart: snapshot.cart,
    quote: snapshot.quote,
    phase: snapshot.phase,
    isQuoting: snapshot.isQuoting,
    buyer: snapshot.buyer,
    nextAction: snapshot.nextAction,
    setCartItem,
    refreshCatalog,
    applyDiscountCode,
    sendOtp,
    verifyOtp,
    checkout,
  };

  return (
    <TickeanContext.Provider value={value}>{children}</TickeanContext.Provider>
  );
}

function useTickeanContext() {
  const ctx = useContext(TickeanContext);
  if (!ctx) {
    throw new Error("Tickean hooks must be used within TickeanProvider");
  }
  return ctx;
}

export function useEvent() {
  const { event, loading, error, refreshCatalog, phase } = useTickeanContext();
  return {
    event,
    loading,
    error: error instanceof Error ? error.message : error,
    refreshCatalog,
    phase,
  };
}

export function useCart() {
  const { cart, quote, setCartItem, applyDiscountCode, isQuoting } =
    useTickeanContext();
  return { cart, quote, setCartItem, applyDiscountCode, isQuoting };
}

export function useBuyerVerification() {
  const { sendOtp, verifyOtp, buyer } = useTickeanContext();
  return { sendOtp, verifyOtp, buyer };
}

export function useCheckout() {
  const { checkout, quote, cart, session, phase, nextAction, error, isQuoting } =
    useTickeanContext();
  return {
    checkout,
    quote,
    cart,
    session,
    phase,
    nextAction,
    error: error instanceof Error ? error : error,
    isQuoting,
  };
}

export function usePayment() {
  const { client, controller, nextAction, phase } = useTickeanContext();
  return {
    getPaymentStatus: () => client.getPaymentStatus(),
    watchPayment: (options?: Parameters<TickeanClient["watchPayment"]>[0]) =>
      controller.watchPayment(options),
    confirmPayment: (
      params?: Parameters<CheckoutController["confirmPayment"]>[0],
    ) => controller.confirmPayment(params),
    nextAction,
    phase,
  };
}

export function useTickeanController() {
  return useTickeanContext().controller;
}

type ElementProps = {
  appearance?: string;
  locale?: string;
  className?: string;
  style?: CSSProperties;
} & HTMLAttributes<HTMLElement>;

function useBoundElement(tag: string, extraAttrs?: Record<string, string>) {
  const { controller } = useTickeanContext();
  const ref = useRef<HTMLElement | null>(null);
  const controllerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    controllerIdRef.current = attachController(el, controller);
    return () => {
      if (controllerIdRef.current) {
        detachController(controllerIdRef.current);
        controllerIdRef.current = null;
      }
    };
  }, [controller]);

  return {
    ref,
    tag,
    extraAttrs,
  };
}

function WebComponent({
  tag,
  appearance,
  locale,
  className,
  style,
  extra = {},
  ...rest
}: ElementProps & { tag: string; extra?: Record<string, string> }) {
  const bound = useBoundElement(tag);
  return createElement(tag, {
    ref: bound.ref,
    className,
    style,
    appearance,
    locale,
    ...extra,
    ...rest,
  });
}

export function TickeanCheckout(props: ElementProps & {
  paymentMethod?: string;
  currency?: string;
}) {
  const { paymentMethod, currency, ...rest } = props;
  return (
    <WebComponent
      tag="tickean-checkout"
      extra={{
        ...(paymentMethod ? { "payment-method": paymentMethod } : {}),
        ...(currency ? { currency } : {}),
      }}
      {...rest}
    />
  );
}

export function TicketSelector(props: ElementProps) {
  return <WebComponent tag="tickean-ticket-selector" {...props} />;
}

export function DiscountField(props: ElementProps) {
  return <WebComponent tag="tickean-discount" {...props} />;
}

export function BuyerVerification(props: ElementProps) {
  return <WebComponent tag="tickean-buyer-verification" {...props} />;
}

export function PaymentElement(
  props: ElementProps & { paymentMethod?: string; currency?: string },
) {
  const { paymentMethod, currency, ...rest } = props;
  return (
    <WebComponent
      tag="tickean-payment"
      extra={{
        ...(paymentMethod ? { "payment-method": paymentMethod } : {}),
        ...(currency ? { currency } : {}),
      }}
      {...rest}
    />
  );
}

export function OrderSummary(props: ElementProps) {
  return <WebComponent tag="tickean-order-summary" {...props} />;
}

export { createTickean, createCheckoutController };
export type {
  CheckoutPhase,
  NextAction,
  TickeanError,
  Buyer,
  CheckoutState,
};
