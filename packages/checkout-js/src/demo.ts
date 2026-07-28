import type {
  Buyer,
  CartItem,
  CheckoutSession,
  CheckoutTransport,
  PaymentResult,
  PaymentStatusResult,
  PublicEvent,
  PurchaseResult,
  QuoteResult,
} from "./types";

const demoEvent: PublicEvent = {
  id: "evt_demo",
  slug: "demo-festival",
  title: "Demo Festival",
  description: "Sample multi-day festival for local SDK demos.",
  availablePaymentMethods: ["TRANSFER", "MERCADOPAGO"],
  organization: {
    id: "org_demo",
    slug: "demo-org",
    name: "Demo Organizer",
    logo: null,
  },
  shows: [
    {
      id: "show_sat",
      title: "Sábado",
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      showOptions: [
        {
          id: "opt_day",
          name: "Entrada general",
          price: 15000,
          currency: "ARS",
          stock: 100,
          maxPerPurchase: 6,
          optionType: "TICKET",
          accessScope: "SINGLE_SHOW",
          catalogVisibility: "PUBLIC",
          passIssuanceMode: "PER_DAY",
        },
      ],
    },
    {
      id: "show_sun",
      title: "Domingo",
      date: new Date(Date.now() + 8 * 86400000).toISOString(),
      showOptions: [
        {
          id: "opt_pass",
          name: "Abono 2 días",
          price: 25000,
          currency: "ARS",
          stock: 50,
          maxPerPurchase: 4,
          optionType: "TICKET",
          accessScope: "ALL_EVENT_SHOWS",
          coveredShowIds: ["show_sat", "show_sun"],
          passIssuanceMode: "SINGLE_PASS",
          catalogVisibility: "PUBLIC",
        },
        {
          id: "opt_gated",
          name: "Promo 2x1 (código)",
          price: 15000,
          currency: "ARS",
          stock: 30,
          maxPerPurchase: 4,
          optionType: "TICKET",
          accessScope: "SINGLE_SHOW",
          catalogVisibility: "PROMO_GATED",
          promotionNxM: { enabled: true, buyQty: 2, payQty: 1 },
        },
      ],
    },
  ],
};

export function createDemoTransport(): CheckoutTransport {
  let sessionToken = "demo_session_token";
  let buyer: Buyer | null = null;
  let unlocked: typeof demoEvent.shows[0]["showOptions"] = [];
  let purchaseId = "purchase_demo";
  let cartRef = "cart_demo";

  return {
    async request<T>(path, init) {
      if (path === "/v1/checkout/sessions" && init.method === "POST") {
        sessionToken = `demo_${Date.now()}`;
        return {
          sessionId: "sess_demo",
          sessionToken,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          event: {
            ...demoEvent,
            shows: demoEvent.shows.map((show) => ({
              ...show,
              showOptions: show.showOptions.filter(
                (o) => o.catalogVisibility !== "PROMO_GATED",
              ),
            })),
          },
          capabilities: {
            tickets: true,
            discounts: true,
            transfer: true,
            onlinePayments: true,
          },
        } satisfies CheckoutSession as T;
      }

      if (path === "/v1/checkout/catalog") {
        return {
          ...demoEvent,
          shows: demoEvent.shows.map((show) => ({
            ...show,
            showOptions: [
              ...show.showOptions.filter(
                (o) => o.catalogVisibility !== "PROMO_GATED",
              ),
              ...unlocked.filter((u) =>
                show.showOptions.some((o) => o.id === u.id),
              ),
            ],
          })),
        } satisfies PublicEvent as T;
      }

      if (path === "/v1/checkout/quote" && init.method === "POST") {
        const body = init.body as {
          items: CartItem[];
          discountCode?: string;
        };
        if (body.discountCode?.toUpperCase() === "DEMO2X1") {
          unlocked = demoEvent.shows
            .flatMap((s) => s.showOptions)
            .filter((o) => o.catalogVisibility === "PROMO_GATED");
        }
        const allOptions = demoEvent.shows.flatMap((s) => s.showOptions);
        const total = body.items.reduce((sum, item) => {
          const opt = allOptions.find((o) => o.id === item.showOptionId);
          return sum + Number(opt?.price || 0) * item.amount;
        }, 0);
        return {
          valid: true,
          totalPrice: total,
          pricingBreakdown: { subtotal: total },
          unlockedShowOptionIds: unlocked.map((o) => o.id),
          unlockedShowOptions: unlocked,
        } satisfies QuoteResult as T;
      }

      if (path === "/v1/checkout/otp/send") {
        return { sent: true } as T;
      }

      if (path === "/v1/checkout/otp/verify") {
        const body = init.body as { phone: string; name?: string; email?: string };
        buyer = {
          id: "buyer_demo",
          phone: body.phone,
          name: body.name || "Demo Buyer",
          email: body.email,
        };
        return { verified: true, buyer } as T;
      }

      if (path === "/v1/checkout/purchases") {
        if (!buyer) {
          throw Object.assign(new Error("OTP required"), {
            code: "checkout_otp_required",
          });
        }
        const body = init.body as { items: CartItem[]; currency: string; paymentMethod: string };
        const allOptions = demoEvent.shows.flatMap((s) => s.showOptions);
        const total = body.items.reduce((sum, item) => {
          const opt = allOptions.find((o) => o.id === item.showOptionId);
          return sum + Number(opt?.price || 0) * item.amount;
        }, 0);
        purchaseId = `purchase_${Date.now()}`;
        cartRef = `cart_${Date.now()}`;
        return {
          purchase: {
            id: purchaseId,
            status: "PENDING",
            totalPrice: total,
            currency: body.currency,
            shoppingCartReference: cartRef,
            paymentMethod: body.paymentMethod,
          },
          shoppingCartReference: cartRef,
          cartSessionToken: "demo_cart_token",
        } satisfies PurchaseResult as T;
      }

      if (path === "/v1/checkout/payments") {
        return {
          id: `pay_${Date.now()}`,
          paymentStatus: "PENDING",
          paymentMethod: (init.body as any)?.paymentMethod,
          paymentInstructions: {
            alias: "tickean.demo",
            cvu: "0000003100010000000001",
            amount: (init.body as any)?.amount,
          },
          redirectUrl: undefined,
          returnUrl: null,
        } satisfies PaymentResult as T;
      }

      if (path === "/v1/checkout/payments/status") {
        return {
          status: "PENDING",
          purchase: {
            id: purchaseId,
            status: "PENDING",
            totalPrice: 0,
            currency: "ARS",
            shoppingCartReference: cartRef,
          },
        } satisfies PaymentStatusResult as T;
      }

      throw new Error(`Demo transport: unhandled ${init.method || "GET"} ${path}`);
    },
  };
}
