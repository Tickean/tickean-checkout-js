import type { NextAction } from "@tickean/checkout-js";
import { TickeanElementBase, t } from "../base";

const METHOD_ORDER = ["TRANSFER", "MERCADO_PAGO", "CARD", "FREE"] as const;

type MethodMeta = {
  titleKey: "payTransfer" | "payMercadoPago" | "payCard" | "payFree";
  descKey:
    | "payTransferDesc"
    | "payMercadoPagoDesc"
    | "payCardDesc"
    | "payFreeDesc";
};

const METHOD_META: Record<string, MethodMeta> = {
  TRANSFER: { titleKey: "payTransfer", descKey: "payTransferDesc" },
  MERCADO_PAGO: { titleKey: "payMercadoPago", descKey: "payMercadoPagoDesc" },
  CARD: { titleKey: "payCard", descKey: "payCardDesc" },
  FREE: { titleKey: "payFree", descKey: "payFreeDesc" },
};

type PaymentView = "method" | "transfer";

export class TickeanPayment extends TickeanElementBase {
  private busy = false;
  private selectedMethod: string | null = null;
  private copiedKey: string | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private redirectedUrl: string | null = null;

  static get observedAttributes() {
    return [
      ...TickeanElementBase.observedAttributes,
      "payment-method",
      "currency",
      "view",
    ];
  }

  disconnectedCallback() {
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    super.disconnectedCallback();
  }

  private view(): PaymentView {
    return this.getAttribute("view") === "transfer" ? "transfer" : "method";
  }

  private methods(): string[] {
    const fromEvent = this.state?.event?.availablePaymentMethods || [];
    const attr = this.getAttribute("payment-method");
    if (fromEvent.length) {
      return [...fromEvent].sort(
        (a, b) =>
          (METHOD_ORDER as readonly string[]).indexOf(a) -
          (METHOD_ORDER as readonly string[]).indexOf(b),
      );
    }
    return [attr || "TRANSFER"];
  }

  private resolveMethod(): string {
    const methods = this.methods();
    const attr = this.getAttribute("payment-method");
    const purchaseMethod = this.state?.purchase?.paymentMethod;
    if (this.selectedMethod && methods.includes(this.selectedMethod)) {
      return this.selectedMethod;
    }
    if (purchaseMethod && methods.includes(purchaseMethod)) return purchaseMethod;
    if (attr && methods.includes(attr)) return attr;
    if (methods.length === 1) return methods[0];
    return this.selectedMethod || "";
  }

  protected renderBody(): string {
    const state = this.state;
    const locale = this.elementLocale;
    const currency = this.getAttribute("currency") || "ARS";
    const view = this.view();

    if (state?.phase === "completed") {
      return `<div class="wrap reveal" part="payment"><div class="badge" role="status">✓ ${t(locale, "completed")}</div></div>`;
    }

    if (view === "transfer") {
      return this.renderTransferView(locale, currency);
    }
    return this.renderMethodView(locale, currency);
  }

  private redirectUrl(): string | null {
    const next = this.state?.nextAction;
    if (next?.type === "redirect" && next.url) return next.url;
    const payment = this.state?.payment as
      | { redirectUrl?: string; initPoint?: string }
      | null
      | undefined;
    return payment?.redirectUrl || payment?.initPoint || null;
  }

  private renderMethodView(locale: string, currency: string): string {
    const state = this.state;
    const methods = this.methods();
    const paymentMethod = this.resolveMethod();
    const multi = methods.length > 1;
    const needsPick = multi && !paymentMethod;
    const hasPurchase = Boolean(state?.purchase);
    const redirectUrl = this.redirectUrl();
    const isRedirecting =
      Boolean(redirectUrl) &&
      (state?.phase === "requires_action" || state?.nextAction?.type === "redirect");

    if (isRedirecting && redirectUrl) {
      return `
        <div class="stack" part="payment">
          <p class="section-title reveal reveal-1">${t(locale, "stepPayment")}</p>
          <div class="wrap stack reveal reveal-2" style="gap:12px;align-items:center;text-align:center">
            <div class="transfer-waiting" role="status">
              <span class="transfer-waiting-dot" aria-hidden="true"></span>
              <span>${escapeHtml(t(locale, "redirectingPay"))}</span>
            </div>
            <a class="muted" id="redirect" href="${escapeAttr(redirectUrl)}" target="_top" rel="noopener noreferrer" style="font-size:0.78rem">
              ${escapeHtml(t(locale, "redirectPay"))}
            </a>
            <div data-payment-method="${escapeAttr(paymentMethod)}" data-currency="${escapeAttr(currency)}" hidden></div>
          </div>
        </div>
      `;
    }

    // Only lock while the create-payment request is in flight.
    // After TRANSFER starts (phase=processing), buyer must still be able to switch.
    const locked = this.busy || state?.phase === "purchasing";

    const canPay = Boolean(
      state?.cart.length &&
        state?.buyerVerified &&
        !locked &&
        paymentMethod,
    );

    const methodPicker = `
      <div class="pay-methods" role="radiogroup" aria-label="${escapeAttr(t(locale, "paymentMethods"))}" data-locked="${locked}">
        ${methods
          .map((method) => {
            const meta = METHOD_META[method] || METHOD_META.TRANSFER;
            const selected = method === paymentMethod;
            return `
              <button type="button" class="pay-method" role="radio" aria-checked="${selected}"
                data-method="${escapeAttr(method)}" data-selected="${selected}" ${locked ? "disabled" : ""}>
                <span class="pay-method-radio" aria-hidden="true"></span>
                <span class="pay-method-copy">
                  <strong>${escapeHtml(t(locale, meta.titleKey))}</strong>
                  <span class="muted">${escapeHtml(t(locale, meta.descKey))}</span>
                </span>
              </button>`;
          })
          .join("")}
      </div>`;

    const prePayTransferHint =
      paymentMethod === "TRANSFER"
        ? `<p class="muted" style="margin:0;font-size:0.78rem">${escapeHtml(t(locale, "payTransferHint"))}</p>`
        : "";

    const payLabel = locked
      ? t(locale, "creatingPayment")
      : needsPick
        ? t(locale, "choosePayment")
        : t(locale, "pay");

    return `
      <div class="stack" part="payment">
        <p class="section-title reveal reveal-1">${t(locale, "stepPayment")}</p>
        <div class="wrap stack reveal reveal-2" style="gap:12px">
          ${methodPicker}
          ${prePayTransferHint}
          <button type="button" id="pay" ${canPay ? "" : "disabled"}>
            ${escapeHtml(payLabel)}
          </button>
          <div data-payment-method="${escapeAttr(paymentMethod)}" data-currency="${escapeAttr(currency)}" hidden></div>
        </div>
      </div>
    `;
  }

  private renderTransferView(locale: string, currency: string): string {
    const nextAction = this.state?.nextAction || ({ type: "none" } as NextAction);
    const paymentMethod = this.resolveMethod();
    const methodTitle = t(
      locale,
      (METHOD_META[paymentMethod] || METHOD_META.TRANSFER).titleKey,
    );

    return `
      <div class="stack" part="payment">
        <p class="section-title reveal reveal-1">${t(locale, "stepTransfer")}</p>
        <div class="wrap stack reveal reveal-2" style="gap:12px">
          <div class="pay-method-locked row">
            <div>
              <div class="muted" style="font-size:0.72rem">${escapeHtml(t(locale, "paymentMethods"))}</div>
              <strong style="font-size:0.9rem">${escapeHtml(methodTitle)}</strong>
            </div>
            <button type="button" class="ghost-btn" id="change-method">${escapeHtml(t(locale, "changePaymentMethod"))}</button>
          </div>
          ${renderNextAction(nextAction, locale, (n) => this.money(n), this.copiedKey)}
          ${
            nextAction.type === "display_instructions"
              ? `<div class="transfer-waiting" role="status">
                  <span class="transfer-waiting-dot" aria-hidden="true"></span>
                  <span>${escapeHtml(t(locale, "transferWaiting"))}</span>
                </div>
                <p class="muted" style="margin:0;font-size:0.78rem">${escapeHtml(t(locale, "transferPendingHint"))}</p>`
              : ""
          }
          <div data-payment-method="${escapeAttr(paymentMethod)}" data-currency="${escapeAttr(currency)}" hidden></div>
        </div>
      </div>
    `;
  }

  protected afterRender() {
    const currency = this.getAttribute("currency") || "ARS";
    const view = this.view();

    this.root.querySelector("#change-method")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("tickean-change-payment-method", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-method]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled || this.busy || this.state?.phase === "purchasing") return;
        this.selectedMethod = btn.getAttribute("data-method");
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const value = btn.getAttribute("data-copy") || "";
        const key = btn.getAttribute("data-copy-key") || value;
        const ok = await copyText(value);
        if (!ok) return;
        this.copiedKey = key;
        if (this.copiedTimer) clearTimeout(this.copiedTimer);
        this.copiedTimer = setTimeout(() => {
          this.copiedKey = null;
          this.render();
        }, 1600);
        this.render();
      });
    });

    if (view === "method") {
      this.root.querySelector("#pay")?.addEventListener("click", async () => {
        const paymentMethod = this.resolveMethod();
        if (!paymentMethod) return;
        this.busy = true;
        this.render();
        try {
          const root = this.getRootNode() as ShadowRoot & { host?: HTMLElement };
          const host = (root.host || this.closest("tickean-checkout")) as
            | { getAttendees?: () => unknown[] }
            | null;
          const attendees = host?.getAttendees?.() as
            | import("@tickean/checkout-js").PurchaseAttendee[]
            | undefined;
          await this.controller?.purchaseAndPay({
            paymentMethod,
            currency,
            attendees: attendees?.length ? attendees : undefined,
          });
        } finally {
          this.busy = false;
          this.render();
        }
      });
    }

    const redirectUrl = this.redirectUrl();
    if (
      redirectUrl &&
      this.redirectedUrl !== redirectUrl &&
      (this.state?.phase === "requires_action" ||
        this.state?.nextAction?.type === "redirect")
    ) {
      this.redirectedUrl = redirectUrl;
      navigateTopLevel(redirectUrl);
    }
  }
}

function navigateTopLevel(url: string) {
  if (typeof window === "undefined" || !url) return;
  try {
    const topWin = window.top;
    if (topWin && topWin !== window) {
      topWin.location.assign(url);
      return;
    }
  } catch {
    /* cross-origin top */
  }
  window.location.assign(url);
}

function renderNextAction(
  nextAction: NextAction,
  locale: string,
  money: (n: number) => string,
  copiedKey: string | null,
): string {
  switch (nextAction.type) {
    case "display_instructions": {
      const instructions = (nextAction.paymentInstructions || {}) as Record<
        string,
        unknown
      >;
      const alias = instructions.alias ? String(instructions.alias) : "";
      const cvu = instructions.cvu
        ? String(instructions.cvu)
        : instructions.accountIdentifier
          ? String(instructions.accountIdentifier)
          : "";
      const amount =
        instructions.amount != null ? Number(instructions.amount) : null;

      return `
        <div class="transfer-box stack" style="gap:12px">
          ${
            amount != null && Number.isFinite(amount)
              ? `<div class="transfer-amount">
                  <span class="transfer-amount-label">${escapeHtml(t(locale, "transferExactAmount"))}</span>
                  <strong class="transfer-amount-value">${escapeHtml(money(amount))}</strong>
                </div>`
              : ""
          }
          <div class="stack" style="gap:8px">
            <strong>${escapeHtml(t(locale, "transferInstructions"))}</strong>
            ${
              alias
                ? renderCopyRow(locale, "alias", alias, "alias", copiedKey)
                : ""
            }
            ${
              cvu
                ? renderCopyRow(locale, "cvu", cvu, "cvu", copiedKey)
                : ""
            }
          </div>
        </div>
      `;
    }
    case "redirect": {
      const url = nextAction.url || "";
      return `
        <div class="stack" style="gap:10px;align-items:center;text-align:center">
          <div class="transfer-waiting" role="status">
            <span class="transfer-waiting-dot" aria-hidden="true"></span>
            <span>${escapeHtml(t(locale, "redirectingPay"))}</span>
          </div>
          ${
            url
              ? `<a class="muted" id="redirect" href="${escapeAttr(url)}" target="_top" rel="noopener noreferrer" style="font-size:0.78rem">${escapeHtml(t(locale, "redirectPay"))}</a>`
              : ""
          }
        </div>`;
    }
    case "stripe_elements":
      return `<div class="provider-slot" data-provider="stripe" part="stripe-mount">${t(locale, "providerPlaceholder")} (Stripe)</div>`;
    case "airwallex_dropin":
      return `<div class="provider-slot" data-provider="airwallex" part="airwallex-mount">${t(locale, "providerPlaceholder")} (Airwallex)</div>`;
    case "dlocal_fields":
      return `<div class="provider-slot" data-provider="dlocal" part="dlocal-mount">${t(locale, "providerPlaceholder")} (dLocal)</div>`;
    case "fintoc_widget":
      return `<div class="provider-slot" data-provider="fintoc" part="fintoc-mount">${t(locale, "providerPlaceholder")} (Fintoc)</div>`;
    default:
      return `<p class="muted" style="margin:0">${escapeHtml(t(locale, "transferWaiting"))}</p>`;
  }
}

function renderCopyRow(
  locale: string,
  labelKey: "alias" | "cvu",
  value: string,
  copyKey: string,
  copiedKey: string | null,
): string {
  const copied = copiedKey === copyKey;
  return `
    <div class="copy-row">
      <div class="copy-row-text">
        <span class="muted">${escapeHtml(t(locale, labelKey))}</span>
        <code>${escapeHtml(value)}</code>
      </div>
      <button type="button" class="copy-btn" data-copy="${escapeAttr(value)}" data-copy-key="${escapeAttr(copyKey)}" aria-label="${escapeAttr(
        copied ? t(locale, "copied") : t(locale, "copy"),
      )}">
        ${copied ? checkIcon() : copyIcon()}
        <span>${escapeHtml(copied ? t(locale, "copied") : t(locale, "copy"))}</span>
      </button>
    </div>
  `;
}

function copyIcon() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2"/></svg>`;
}

function checkIcon() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function escapeAttr(value: string) {
  return value.replace(/"/g, "&quot;");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (typeof customElements !== "undefined" && !customElements.get("tickean-payment")) {
  customElements.define("tickean-payment", TickeanPayment);
}
