import type { NextAction } from "@tickean/checkout-js";
import { TickeanElementBase, t } from "../base";
import {
  BANKING_APPS,
  generateDeepLink,
  getWebBankingUrl,
  type TransferDeeplinkData,
} from "../banking-apps";
import {
  detectOs,
  formatMercadoPagoClipboardAmount,
  getMercadoPagoTransferDeepLink,
  shouldShowMercadoPagoTransferCta,
  type MercadoPagoTransferOs,
} from "../mercadopago-transfer";

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

const SUPPORT_WHATSAPP_E164 = "5493487710391";

export class TickeanPayment extends TickeanElementBase {
  private busy = false;
  private selectedMethod: string | null = null;
  private copiedKey: string | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private redirectedUrl: string | null = null;
  private bankModalOpen = false;
  private os: MercadoPagoTransferOs = "unknown";

  static get observedAttributes() {
    return [
      ...TickeanElementBase.observedAttributes,
      "payment-method",
      "currency",
      "view",
    ];
  }

  connectedCallback() {
    this.os = detectOs();
    super.connectedCallback();
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
    const showInstructions = nextAction.type === "display_instructions";
    const eventTitle = this.state?.event?.title || "Tickean";

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
          ${renderNextAction(nextAction, locale, (n) => this.money(n), this.copiedKey, currency, this.os)}
          ${
            showInstructions
              ? `${renderTransferFooter(locale, eventTitle)}
                 ${this.bankModalOpen ? renderBankModal(locale, this.os) : ""}`
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

    this.root.querySelector("#mp-pay")?.addEventListener("click", async () => {
      const btn = this.root.querySelector("#mp-pay") as HTMLButtonElement | null;
      const cvu = btn?.getAttribute("data-cvu") || "";
      const amount = btn?.getAttribute("data-amount") || "";
      if (!cvu || !amount) return;
      const deeplink = getMercadoPagoTransferDeepLink({
        os: this.os,
        cvu,
        amount,
      });
      if (!deeplink) return;
      const clipboardAmount = formatMercadoPagoClipboardAmount(amount, this.os);
      await copyText(clipboardAmount);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      window.location.href = deeplink;
    });

    this.root.querySelector("#open-bank")?.addEventListener("click", async () => {
      const btn = this.root.querySelector("#open-bank") as HTMLButtonElement | null;
      const alias = btn?.getAttribute("data-alias") || "";
      if (alias) await copyText(alias);
      this.bankModalOpen = true;
      this.render();
    });

    this.root.querySelector("#bank-modal-close")?.addEventListener("click", () => {
      this.bankModalOpen = false;
      this.render();
    });

    this.root.querySelector("#bank-modal-backdrop")?.addEventListener("click", () => {
      this.bankModalOpen = false;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-bank-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const appId = btn.getAttribute("data-bank-id") || "";
        const app = BANKING_APPS.find((a) => a.id === appId);
        if (!app) return;
        const transferData = readTransferDataFromDom(this.root);
        const link =
          this.os === "unknown"
            ? getWebBankingUrl(app)
            : generateDeepLink(app, this.os, transferData);
        if (link) window.location.href = link;
        this.bankModalOpen = false;
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

function parseInstructions(nextAction: NextAction): {
  alias: string;
  cvu: string;
  amount: number | null;
  accountLabel: "cvu" | "account";
} {
  if (nextAction.type !== "display_instructions") {
    return { alias: "", cvu: "", amount: null, accountLabel: "cvu" };
  }
  const instructions = (nextAction.paymentInstructions || {}) as Record<
    string,
    unknown
  >;
  const alias = instructions.alias ? String(instructions.alias) : "";
  const hasCvu = Boolean(instructions.cvu);
  const cvu = instructions.cvu
    ? String(instructions.cvu)
    : instructions.accountIdentifier
      ? String(instructions.accountIdentifier)
      : "";
  const amount =
    instructions.amount != null ? Number(instructions.amount) : null;
  return {
    alias,
    cvu,
    amount: amount != null && Number.isFinite(amount) ? amount : null,
    accountLabel: hasCvu || !instructions.accountIdentifier ? "cvu" : "account",
  };
}

function renderNextAction(
  nextAction: NextAction,
  locale: string,
  money: (n: number) => string,
  copiedKey: string | null,
  currency: string,
  os: MercadoPagoTransferOs,
): string {
  switch (nextAction.type) {
    case "display_instructions": {
      const { alias, cvu, amount, accountLabel } = parseInstructions(nextAction);
      const amountText =
        amount != null ? money(amount) : "";
      const showMp = shouldShowMercadoPagoTransferCta({ os, currency }) && Boolean(cvu) && amount != null;

      return `
        <div class="transfer-box stack" style="gap:8px">
          ${
            amount != null
              ? renderCopyRow(locale, "amount", amountText, String(amount), "amount", copiedKey)
              : ""
          }
          ${
            cvu
              ? renderCopyRow(
                  locale,
                  accountLabel === "account" ? "account" : "cvu",
                  cvu,
                  cvu,
                  "cvu",
                  copiedKey,
                )
              : ""
          }
          ${
            alias
              ? renderCopyRow(locale, "alias", alias, alias, "alias", copiedKey)
              : ""
          }
          <div hidden data-transfer-alias="${escapeAttr(alias)}" data-transfer-cvu="${escapeAttr(cvu)}" data-transfer-amount="${escapeAttr(amount != null ? String(amount) : "")}"></div>
        </div>
        ${
          showMp || alias
            ? `<div class="transfer-actions stack" style="gap:8px">
                <div class="transfer-hint row">
                  <span class="transfer-hint-icon" aria-hidden="true">${infoIcon()}</span>
                  <p class="transfer-hint-text">${escapeHtml(t(locale, "transferOtherBankHint"))}</p>
                </div>
                ${
                  showMp
                    ? `<button type="button" class="mp-pay-btn" id="mp-pay" data-cvu="${escapeAttr(cvu)}" data-amount="${escapeAttr(String(amount))}">
                        <img alt="" src="https://www.tickean.com/images/banks/mercadopago.svg" width="19" height="19" />
                        <span>${escapeHtml(t(locale, "payWithMercadoPago"))}</span>
                      </button>`
                    : ""
                }
                ${
                  alias
                    ? `<button type="button" class="open-bank-btn" id="open-bank" data-alias="${escapeAttr(alias)}">
                        <span>${escapeHtml(t(locale, "openOtherBankApp"))}</span>
                        ${externalLinkIcon()}
                      </button>`
                    : ""
                }
              </div>`
            : ""
        }
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

function renderTransferFooter(locale: string, eventTitle: string): string {
  const message = `Hola! Tengo un inconveniente con mi compra de entradas para "${eventTitle}" en Tickean. Me ayudan por favor?`;
  const waUrl = `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
  return `
    <div class="transfer-footer stack" style="gap:10px;align-items:center;text-align:center">
      <p class="muted transfer-footer-copy">${escapeHtml(t(locale, "transferExactHint"))}</p>
      <div class="transfer-status stack" style="gap:6px;width:100%;align-items:center">
        <p class="transfer-status-label">${escapeHtml(t(locale, "awaitingTransfer"))}</p>
        <div class="transfer-progress" aria-hidden="true"><span class="transfer-progress-bar"></span></div>
      </div>
      <a class="transfer-support" href="${escapeAttr(waUrl)}" target="_blank" rel="noopener noreferrer">
        ${escapeHtml(t(locale, "supportWhatsappLink"))}
      </a>
    </div>
  `;
}

function renderBankModal(locale: string, os: MercadoPagoTransferOs): string {
  return `
    <div class="bank-modal" role="dialog" aria-modal="true" aria-label="${escapeAttr(t(locale, "selectBankApp"))}">
      <div class="bank-modal-backdrop" id="bank-modal-backdrop"></div>
      <div class="bank-modal-panel">
        <div class="bank-modal-header row">
          <strong>${escapeHtml(t(locale, "selectBankApp"))}</strong>
          <button type="button" class="ghost-btn" id="bank-modal-close" aria-label="${escapeAttr(t(locale, "close"))}">${escapeHtml(t(locale, "close"))}</button>
        </div>
        <div class="bank-grid">
          ${BANKING_APPS.map(
            (app) => `
            <button type="button" class="bank-app" data-bank-id="${escapeAttr(app.id)}">
              <img alt="" src="${escapeAttr(app.imageUrl)}" width="36" height="36" />
              <span>${escapeHtml(app.name)}</span>
            </button>`,
          ).join("")}
        </div>
        ${
          os === "unknown"
            ? `<p class="muted" style="margin:0;font-size:0.72rem;text-align:center">${escapeHtml(t(locale, "bankAppDesktopHint"))}</p>`
            : ""
        }
      </div>
    </div>
  `;
}

function readTransferDataFromDom(root: ShadowRoot): TransferDeeplinkData {
  const el = root.querySelector("[data-transfer-alias]") as HTMLElement | null;
  return {
    alias: el?.getAttribute("data-transfer-alias") || "",
    cvu: el?.getAttribute("data-transfer-cvu") || "",
    amount: el?.getAttribute("data-transfer-amount") || "",
    reference: "Pago Tickean",
  };
}

function renderCopyRow(
  locale: string,
  labelKey: "alias" | "cvu" | "amount" | "account",
  displayValue: string,
  copyValue: string,
  copyKey: string,
  copiedKey: string | null,
): string {
  const copied = copiedKey === copyKey;
  const label =
    labelKey === "account" ? t(locale, "account") : t(locale, labelKey);
  return `
    <div class="copy-row compact">
      <span class="copy-row-label">${escapeHtml(label)}</span>
      <${labelKey === "amount" ? "strong" : "code"} class="copy-row-value">${escapeHtml(displayValue)}</${labelKey === "amount" ? "strong" : "code"}>
      <button type="button" class="copy-btn icon-only" data-copy="${escapeAttr(copyValue)}" data-copy-key="${escapeAttr(copyKey)}" aria-label="${escapeAttr(
        copied ? t(locale, "copied") : t(locale, "copy"),
      )}">
        ${copied ? checkIcon() : copyIcon()}
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

function infoIcon() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="#1186e3" stroke-width="2"/><path d="M12 10v6M12 7.5h.01" stroke="#1186e3" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function externalLinkIcon() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 5h5v5M19 5 10 14M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
