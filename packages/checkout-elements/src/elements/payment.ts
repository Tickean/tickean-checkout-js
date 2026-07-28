import type { NextAction } from "@tickean/checkout-js";
import { TickeanElementBase, t } from "../base";

export class TickeanPayment extends TickeanElementBase {
  static get observedAttributes() {
    return [...TickeanElementBase.observedAttributes, "payment-method", "currency"];
  }

  protected renderBody(): string {
    const state = this.state;
    const nextAction = state?.nextAction || ({ type: "none" } as NextAction);
    const paymentMethod =
      this.getAttribute("payment-method") ||
      state?.event?.availablePaymentMethods?.[0] ||
      "TRANSFER";
    const currency = this.getAttribute("currency") || "ARS";

    if (state?.phase === "completed") {
      return `<div class="wrap" part="payment"><div role="status">${t(this.elementLocale, "completed")}</div></div>`;
    }

    return `
      <div class="wrap stack" part="payment">
        ${renderNextAction(nextAction, this.elementLocale, (n) => this.money(n))}
        ${
          !state?.purchase
            ? `<button type="button" id="pay" ${
                !state?.cart.length || !state?.buyerVerified ? "disabled" : ""
              }>${t(this.elementLocale, "pay")}</button>`
            : ""
        }
        <div data-payment-method="${escapeAttr(paymentMethod)}" data-currency="${escapeAttr(currency)}" hidden></div>
      </div>
    `;
  }

  protected afterRender() {
    const paymentMethod =
      this.getAttribute("payment-method") ||
      this.state?.event?.availablePaymentMethods?.[0] ||
      "TRANSFER";
    const currency = this.getAttribute("currency") || "ARS";

    this.root.querySelector("#pay")?.addEventListener("click", async () => {
      await this.controller?.purchaseAndPay({
        paymentMethod,
        currency,
      });
    });

    this.root.querySelector("#redirect")?.addEventListener("click", () => {
      const url = (this.state?.nextAction as { url?: string } | undefined)?.url;
      if (url) window.location.assign(url);
    });
  }
}

function renderNextAction(
  nextAction: NextAction,
  locale: string,
  money: (n: number) => string,
): string {
  switch (nextAction.type) {
    case "display_instructions": {
      const instructions = (nextAction.paymentInstructions || {}) as Record<
        string,
        unknown
      >;
      return `
        <div>
          <strong>${t(locale, "transferInstructions")}</strong>
          <div class="stack" style="margin-top:8px">
            ${
              instructions.alias
                ? `<div><span class="muted">${t(locale, "alias")}</span>: <code>${escapeHtml(String(instructions.alias))}</code></div>`
                : ""
            }
            ${
              instructions.cvu
                ? `<div><span class="muted">${t(locale, "cvu")}</span>: <code>${escapeHtml(String(instructions.cvu))}</code></div>`
                : ""
            }
            ${
              instructions.amount != null
                ? `<div><span class="muted">${t(locale, "amount")}</span>: ${money(Number(instructions.amount))}</div>`
                : ""
            }
          </div>
        </div>
      `;
    }
    case "redirect":
      return `<button type="button" id="redirect">${t(locale, "redirectPay")}</button>`;
    case "stripe_elements":
      return `<div class="provider-slot" data-provider="stripe" part="stripe-mount">${t(locale, "providerPlaceholder")} (Stripe)</div>`;
    case "airwallex_dropin":
      return `<div class="provider-slot" data-provider="airwallex" part="airwallex-mount">${t(locale, "providerPlaceholder")} (Airwallex)</div>`;
    case "dlocal_fields":
      return `<div class="provider-slot" data-provider="dlocal" part="dlocal-mount">${t(locale, "providerPlaceholder")} (dLocal)</div>`;
    case "fintoc_widget":
      return `<div class="provider-slot" data-provider="fintoc" part="fintoc-mount">${t(locale, "providerPlaceholder")} (Fintoc)</div>`;
    default:
      return "";
  }
}

function escapeAttr(value: string) {
  return value.replace(/"/g, "&quot;");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

if (typeof customElements !== "undefined" && !customElements.get("tickean-payment")) {
  customElements.define("tickean-payment", TickeanPayment);
}
