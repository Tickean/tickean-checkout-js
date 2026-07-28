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
import { TickeanError } from "./types";

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
  let unlocked: (typeof demoEvent.shows)[0]["showOptions"] = [];
  let purchaseId = "purchase_demo";
  let cartRef = "cart_demo";
  let lastPayment: PaymentResult | null = null;
  let paymentConfirmed = false;

  const publicEvent = (): PublicEvent => ({
    ...demoEvent,
    shows: demoEvent.shows.map((show) => ({
      ...show,
      showOptions: [
        ...show.showOptions.filter((o) => o.catalogVisibility !== "PROMO_GATED"),
        ...unlocked.filter((u) => show.showOptions.some((o) => o.id === u.id)),
      ],
    })),
  });

  return {
    async request<T>(path, init) {
      if (path === "/v1/checkout/sessions" && init.method === "POST") {
        sessionToken = `demo_${Date.now()}`;
        buyer = null;
        unlocked = [];
        paymentConfirmed = false;
        lastPayment = null;
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
          phase: "browsing",
        } satisfies CheckoutSession as T;
      }

      if (path === "/v1/checkout/session") {
        return {
          sessionId: "sess_demo",
          sessionToken,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          event: publicEvent(),
          capabilities: {
            tickets: true,
            discounts: true,
            transfer: true,
            onlinePayments: true,
          },
          status: "ACTIVE",
          otpVerified: Boolean(buyer),
          buyerId: buyer?.id || null,
          purchaseId: purchaseId.startsWith("purchase_") ? purchaseId : null,
          shoppingCartReference: cartRef,
          nextAction: lastPayment?.nextAction || { type: "none" },
          phase: paymentConfirmed
            ? "completed"
            : lastPayment
              ? "requires_action"
              : buyer
                ? "ready_to_purchase"
                : "browsing",
        } satisfies CheckoutSession as T;
      }

      if (path === "/v1/checkout/catalog") {
        return publicEvent() satisfies PublicEvent as T;
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
        const body = init.body as {
          phone: string;
          name?: string;
          email?: string;
        };
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
          throw new TickeanError({
            code: "checkout_otp_required",
            message: "OTP required",
          });
        }
        const body = init.body as {
          items: CartItem[];
          currency: string;
          paymentMethod: string;
        };
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
        const body = init.body as {
          paymentMethod?: string;
          amount?: number;
        };
        const method = String(body?.paymentMethod || "TRANSFER").toUpperCase();
        if (method === "TRANSFER") {
          lastPayment = {
            id: `pay_${Date.now()}`,
            paymentStatus: "PENDING",
            paymentMethod: method,
            paymentInstructions: {
              alias: "tickean.demo",
              cvu: "0000003100010000000001",
              amount: body?.amount,
            },
            redirectUrl: undefined,
            returnUrl: null,
            nextAction: {
              type: "display_instructions",
              paymentInstructions: {
                alias: "tickean.demo",
                cvu: "0000003100010000000001",
                amount: body?.amount,
              },
            },
            requiresAction: false,
          };
        } else {
          lastPayment = {
            id: `pay_${Date.now()}`,
            paymentStatus: "PENDING",
            paymentMethod: method,
            redirectUrl: "https://example.com/pay/demo",
            returnUrl: null,
            nextAction: {
              type: "redirect",
              url: "https://example.com/pay/demo",
            },
            requiresAction: true,
          };
        }
        return lastPayment as T;
      }

      if (path === "/v1/checkout/payments/confirm" && init.method === "POST") {
        paymentConfirmed = true;
        lastPayment = {
          ...(lastPayment || { id: `pay_${Date.now()}` }),
          paymentStatus: "COMPLETED",
          nextAction: { type: "none" },
          requiresAction: false,
        };
        return lastPayment as T;
      }

      if (path === "/v1/checkout/payments/status") {
        return {
          status: paymentConfirmed ? "COMPLETED" : "PENDING",
          requiresAction: Boolean(
            lastPayment?.nextAction &&
              lastPayment.nextAction.type !== "none" &&
              !paymentConfirmed,
          ),
          phase: paymentConfirmed
            ? "completed"
            : lastPayment
              ? "requires_action"
              : "browsing",
          nextAction: lastPayment?.nextAction || { type: "none" },
          payment: lastPayment,
          purchase: {
            id: purchaseId,
            status: paymentConfirmed ? "COMPLETED" : "PENDING",
            totalPrice: 0,
            currency: "ARS",
            shoppingCartReference: cartRef,
          },
        } satisfies PaymentStatusResult as T;
      }

      throw new Error(
        `Demo transport: unhandled ${init.method || "GET"} ${path}`,
      );
    },
  };
}
