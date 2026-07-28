export type TickeanErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export class TickeanError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly status?: number;

  constructor(payload: TickeanErrorPayload, status?: number) {
    super(payload.message);
    this.name = "TickeanError";
    this.code = payload.code;
    this.details = payload.details;
    this.status = status;
  }
}

export type CreateTickeanOptions = {
  publishableKey: string;
  apiBaseUrl?: string;
  /** When true, uses an in-memory mock adapter (no network). */
  demo?: boolean;
  fetchImpl?: typeof fetch;
};

export type CheckoutSession = {
  sessionId: string;
  sessionToken: string;
  expiresAt: string;
  event: PublicEvent;
  capabilities: Record<string, boolean>;
};

export type PublicShowOption = {
  id: string;
  name?: string;
  description?: string;
  price: number;
  currency?: string;
  stock?: number;
  maxPerPurchase?: number;
  optionType?: string;
  accessScope?: string;
  coveredShowIds?: string[];
  passIssuanceMode?: "PER_DAY" | "SINGLE_PASS";
  catalogVisibility?: "PUBLIC" | "PROMO_GATED";
  promotionNxM?: unknown;
  quantityDiscount?: unknown;
  status?: string;
};

export type PublicShow = {
  id: string;
  title?: string;
  date?: string;
  endDate?: string;
  showOptions: PublicShowOption[];
};

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  images?: unknown[];
  location?: unknown;
  availablePaymentMethods?: string[];
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
};

export type PaymentStatusResult = {
  status: string;
  purchase?: PurchaseResult["purchase"] | null;
};

export interface CheckoutTransport {
  request<T>(
    path: string,
    init: {
      method?: string;
      body?: unknown;
      sessionToken?: string | null;
    },
  ): Promise<T>;
}
