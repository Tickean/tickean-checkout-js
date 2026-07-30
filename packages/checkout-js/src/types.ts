export type TickeanErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export class TickeanError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly status?: number;
  readonly requestId?: string;

  constructor(payload: TickeanErrorPayload, status?: number, requestId?: string) {
    super(payload.message);
    this.name = "TickeanError";
    this.code = payload.code;
    this.details = payload.details;
    this.status = status;
    this.requestId = requestId;
  }
}

export type CreateTickeanOptions = {
  publishableKey: string;
  apiBaseUrl?: string;
  /** When true, uses an in-memory mock adapter (no network). */
  demo?: boolean;
  fetchImpl?: typeof fetch;
};

export type CheckoutPhase =
  | "initializing"
  | "browsing"
  | "quoting"
  | "verifying_buyer"
  | "ready_to_purchase"
  | "purchasing"
  | "requires_action"
  | "processing"
  | "completed"
  | "failed"
  | "expired";

export type NextAction =
  | { type: "display_instructions"; paymentInstructions: unknown }
  | { type: "redirect"; url: string }
  | {
      type: "stripe_elements";
      clientSecret: string;
      publishableKey?: string;
      paymentIntentId?: string;
    }
  | {
      type: "airwallex_dropin";
      intentId: string;
      clientSecret: string;
      currency?: string;
      env?: string;
      countryCode?: string;
    }
  | {
      type: "dlocal_fields";
      merchantCheckoutToken: string;
      smartFieldsApiKey?: string;
      paymentId?: string;
      sdkUrl?: string;
    }
  | {
      type: "fintoc_widget";
      sessionToken?: string;
      widgetToken?: string;
      publicKey?: string;
      holderType?: string;
      product?: string;
    }
  | { type: "none" };

export type CheckoutSession = {
  sessionId: string;
  sessionToken: string;
  expiresAt: string;
  event: PublicEvent;
  capabilities: Record<string, boolean>;
  phase?: CheckoutPhase | string;
  status?: string;
  otpVerified?: boolean;
  buyerId?: string | null;
  purchaseId?: string | null;
  shoppingCartReference?: string | null;
  nextAction?: NextAction;
  returnUrl?: string | null;
};

export type PromotionNxM = {
  enabled?: boolean;
  buyQty?: number;
  payQty?: number;
  label?: string;
  startsAt?: string;
  endsAt?: string;
};

export type QuantityDiscount = {
  enabled?: boolean;
  type?: "SECOND_UNIT_PERCENT" | "NTH_UNIT_PERCENT" | string;
  targetUnit?: number;
  percentOff?: number;
  label?: string;
  startsAt?: string;
  endsAt?: string;
};

export type PublicShowOption = {
  id: string;
  name?: string;
  description?: string;
  price: number;
  currency?: string;
  stock?: number;
  sold?: number;
  reserved?: number;
  availableStock?: number;
  maxPerPurchase?: number;
  optionType?: string;
  accessScope?: string;
  coveredShowIds?: string[];
  passIssuanceMode?: "PER_DAY" | "SINGLE_PASS";
  catalogVisibility?: "PUBLIC" | "PROMO_GATED";
  promotionNxM?: PromotionNxM | null;
  quantityDiscount?: QuantityDiscount | null;
  status?: string;
  /** Present on options returned via promo unlock. */
  showId?: string;
};

export type PublicShow = {
  id: string;
  title?: string;
  date?: string;
  endDate?: string;
  showOptions: PublicShowOption[];
};

export type RegistrationQuestion = {
  id: string;
  type?: string;
  label?: string;
  required?: boolean;
  options?: string[];
};

export type RegistrationSettings = {
  maxAttendeesPerPurchase?: number;
  requireAttendeeEmail?: boolean;
  requireAttendeePhone?: boolean;
  terms?: { required?: boolean; label?: string | null; pdfUrl?: string | null } | null;
  questions?: RegistrationQuestion[];
};

export type PurchaseAttendee = {
  showOptionId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  termsAccepted?: boolean;
};

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  images?: unknown[];
  location?: unknown;
  availablePaymentMethods?: string[];
  hasPromoGatedShowOptions?: boolean;
  collectAttendeeData?: boolean;
  registrationSettings?: RegistrationSettings | null;
  organization?: {
    id?: string;
    slug?: string;
    name?: string;
    logo?: string | null;
  } | null;
  shows: PublicShow[];
};

export type CartItem = {
  showOptionId: string;
  amount: number;
};

export type QuoteResult = {
  valid: boolean;
  totalPrice: number;
  pricingBreakdown?: unknown;
  discountCode?: unknown;
  message?: string;
  unlockedShowOptionIds?: string[];
  unlockedShowOptions?: PublicShowOption[];
};

export type Buyer = {
  id: string;
  phone: string;
  name?: string;
  email?: string;
};

export type PurchaseResult = {
  purchase: {
    id: string;
    status: string;
    totalPrice: number;
    currency: string;
    shoppingCartReference: string;
    paymentMethod?: string;
  };
  shoppingCartReference: string;
  cartSessionToken: string;
};

export type PaymentResult = {
  id: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentInstructions?: unknown;
  redirectUrl?: string;
  initPoint?: string;
  returnUrl?: string | null;
  stripe?: unknown;
  fintocWidget?: unknown;
  dlocalGo?: unknown;
  airwallex?: unknown;
  mercadoPago?: unknown;
  nextAction?: NextAction;
  requiresAction?: boolean;
};

export type PaymentStatusResult = {
  status: string;
  purchase?: PurchaseResult["purchase"] | null;
  payment?: PaymentResult | null;
  nextAction?: NextAction;
  requiresAction?: boolean;
  phase?: CheckoutPhase | string;
};

export type TelemetryEvent = {
  name: string;
  timestamp: number;
  properties?: Record<string, unknown>;
};

export interface TelemetryAdapter {
  track(event: TelemetryEvent): void;
}

export type PersistedCheckoutState = {
  sessionToken?: string;
  eventSlug?: string;
  cart?: CartItem[];
  discountCode?: string | null;
  phase?: CheckoutPhase;
  /** Non-PII buyer flags only */
  buyerVerified?: boolean;
  purchaseId?: string | null;
};

export interface PersistenceAdapter {
  get(key: string): PersistedCheckoutState | null;
  set(key: string, value: PersistedCheckoutState): void;
  remove(key: string): void;
}

export interface CheckoutTransport {
  request<T>(
    path: string,
    init: {
      method?: string;
      body?: unknown;
      sessionToken?: string | null;
      idempotencyKey?: string;
    },
  ): Promise<T>;
}
