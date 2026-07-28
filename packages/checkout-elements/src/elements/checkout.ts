import {
  createCheckoutController,
  type CheckoutController,
  type CreateCheckoutControllerOptions,
} from "@tickean/checkout-js";
import { TickeanElementBase, t } from "../base";
import {
  controllerAttr,
  registerController,
  unregisterController,
} from "../context";

import "./ticket-selector";
import "./discount";
import "./buyer-verification";
import "./payment";
import "./order-summary";

export class TickeanCheckout extends TickeanElementBase {
  private ownedControllerId: string | null = null;
  private ownedController: CheckoutController | null = null;

  static get observedAttributes() {
    return [
      ...TickeanElementBase.observedAttributes,
      "publishable-key",
      "event-slug",
      "api-base-url",
      "return-url",
      "demo",
      "payment-method",
      "currency",
    ];
  }

  connectedCallback() {
    this.ensureController();
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.ownedControllerId) {
      this.ownedController?.dispose();
      unregisterController(this.ownedControllerId);
      this.ownedControllerId = null;
      this.ownedController = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (
      ["publishable-key", "event-slug", "api-base-url", "return-url", "demo"].includes(
        name,
      ) &&
      oldValue !== newValue
    ) {
      if (this.ownedControllerId) {
        this.ownedController?.dispose();
        unregisterController(this.ownedControllerId);
        this.ownedControllerId = null;
        this.ownedController = null;
      }
      this.ensureController();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private ensureController() {
    if (this.getAttribute(controllerAttr())) return;
    const eventSlug = this.getAttribute("event-slug");
    const publishableKey = this.getAttribute("publishable-key") || "";
    if (!eventSlug) return;

    const options: CreateCheckoutControllerOptions = {
      publishableKey,
      eventSlug,
      apiBaseUrl: this.getAttribute("api-base-url") || undefined,
      returnUrl: this.getAttribute("return-url") || undefined,
      demo: this.hasAttribute("demo"),
      persistence: false,
    };
    this.ownedController = createCheckoutController(options);
    this.ownedControllerId = registerController(this.ownedController);
    this.setAttribute(controllerAttr(), this.ownedControllerId);
  }

  protected renderBody(): string {
    const id = this.getAttribute(controllerAttr()) || "";
    const locale = this.getAttribute("locale") || "es-AR";
    const appearance = this.getAttribute("appearance") || "default";
    const paymentMethod = this.getAttribute("payment-method") || "TRANSFER";
    const currency = this.getAttribute("currency") || "ARS";
    const state = this.state;

    if (!state || state.loading) {
      return `<div class="wrap muted">${t(this.elementLocale, "loading")}</div>`;
    }

    return `
      <div class="stack" part="checkout">
        <h2 style="margin:0">${escapeHtml(state.event?.title || "")}</h2>
        <p class="muted" style="margin:0">${escapeHtml(state.event?.description || "")}</p>
        <tickean-ticket-selector controller-id="${escapeAttr(id)}" locale="${escapeAttr(locale)}" appearance="${escapeAttr(appearance)}"></tickean-ticket-selector>
        <tickean-discount controller-id="${escapeAttr(id)}" locale="${escapeAttr(locale)}" appearance="${escapeAttr(appearance)}"></tickean-discount>
        <tickean-buyer-verification controller-id="${escapeAttr(id)}" locale="${escapeAttr(locale)}" appearance="${escapeAttr(appearance)}"></tickean-buyer-verification>
        <tickean-order-summary controller-id="${escapeAttr(id)}" locale="${escapeAttr(locale)}" appearance="${escapeAttr(appearance)}"></tickean-order-summary>
        <tickean-payment controller-id="${escapeAttr(id)}" locale="${escapeAttr(locale)}" appearance="${escapeAttr(appearance)}" payment-method="${escapeAttr(paymentMethod)}" currency="${escapeAttr(currency)}"></tickean-payment>
        ${
          state.error
            ? `<div class="danger" role="alert">${escapeHtml(state.error.message)}</div>`
            : ""
        }
      </div>
    `;
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

if (typeof customElements !== "undefined" && !customElements.get("tickean-checkout")) {
  customElements.define("tickean-checkout", TickeanCheckout);
}
