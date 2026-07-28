import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createTickean,
  type CartItem,
  type CheckoutSession,
  type PublicEvent,
  type QuoteResult,
  type TickeanClient,
} from "@tickean/checkout-js";

type TickeanContextValue = {
  client: TickeanClient;
  session: CheckoutSession | null;
  event: PublicEvent | null;
  loading: boolean;
  error: string | null;
  cart: CartItem[];
  quote: QuoteResult | null;
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

export function TickeanProvider({
  publishableKey,
  eventSlug,
  apiBaseUrl,
  returnUrl,
  demo,
  children,
}: TickeanProviderProps) {
  const client = useMemo(
    () =>
      createTickean({
        publishableKey,
        apiBaseUrl,
        demo,
      }),
    [publishableKey, apiBaseUrl, demo],
  );

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const created = await client.createSession({ eventSlug, returnUrl });
        if (cancelled) return;
        setSession(created);
        setEvent(created.event);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to start checkout");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, eventSlug, returnUrl]);

  const refreshCatalog = useCallback(async () => {
    const catalog = await client.getCatalog();
    setEvent(catalog);
  }, [client]);

  const setCartItem = useCallback((showOptionId: string, amount: number) => {
    setCart((current) => {
      const next = current.filter((item) => item.showOptionId !== showOptionId);
      if (amount > 0) next.push({ showOptionId, amount });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!session || cart.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await client.quote({ items: cart });
        if (!cancelled) setQuote(result);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Quote failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cart, client, session]);

  const applyDiscountCode = useCallback(
    async (code: string) => {
      const result = await client.quote({ items: cart, discountCode: code });
      setQuote(result);
      if ((result.unlockedShowOptions || []).length > 0) {
        await refreshCatalog();
      }
      return result;
    },
    [cart, client, refreshCatalog],
  );

  const sendOtp = useCallback(
    async (phone: string) => {
      await client.sendOtp({ phone });
    },
    [client],
  );

  const verifyOtp = useCallback(
    async (params: {
      phone: string;
      code: string;
      name?: string;
      email?: string;
    }) => {
      await client.verifyOtp(params);
    },
    [client],
  );

  const checkout = useCallback(
    async (params: {
      paymentMethod: string;
      currency: string;
      discountCode?: string;
    }) => {
      const purchase = await client.createPurchase({
        items: cart,
        paymentMethod: params.paymentMethod,
        currency: params.currency,
        discountCode: params.discountCode,
        expectedTotal: quote?.totalPrice,
      });
      const payment = await client.createPayment({
        orderId: purchase.purchase.id,
        paymentMethod: params.paymentMethod,
        currency: params.currency,
        amount: purchase.purchase.totalPrice,
      });
      return { purchaseId: purchase.purchase.id, payment };
    },
    [cart, client, quote?.totalPrice],
  );

  const value: TickeanContextValue = {
    client,
    session,
    event,
    loading,
    error,
    cart,
    quote,
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
  const { event, loading, error, refreshCatalog } = useTickeanContext();
  return { event, loading, error, refreshCatalog };
}

export function useCart() {
  const { cart, quote, setCartItem, applyDiscountCode } = useTickeanContext();
  return { cart, quote, setCartItem, applyDiscountCode };
}

export function useBuyerVerification() {
  const { sendOtp, verifyOtp } = useTickeanContext();
  return { sendOtp, verifyOtp };
}

export function useCheckout() {
  const { checkout, quote, cart, session } = useTickeanContext();
  return { checkout, quote, cart, session };
}

export function usePayment() {
  const { client } = useTickeanContext();
  return {
    getPaymentStatus: () => client.getPaymentStatus(),
    watchPayment: (options?: Parameters<TickeanClient["watchPayment"]>[0]) =>
      client.watchPayment(options),
  };
}

export { createTickean } from "@tickean/checkout-js";
