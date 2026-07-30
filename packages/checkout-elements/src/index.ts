import type { CheckoutController } from "@tickean/checkout-js";
import { registerController, unregisterController } from "./context";

import "./elements/ticket-selector";
import "./elements/discount";
import "./elements/buyer-verification";
import "./elements/attendees";
import "./elements/payment";
import "./elements/order-summary";
import "./elements/checkout";

export { TickeanTicketSelector } from "./elements/ticket-selector";
export { TickeanDiscount } from "./elements/discount";
export { TickeanBuyerVerification } from "./elements/buyer-verification";
export { TickeanAttendees } from "./elements/attendees";
export { TickeanPayment } from "./elements/payment";
export { TickeanOrderSummary } from "./elements/order-summary";
export { TickeanCheckout } from "./elements/checkout";
export {
  registerController,
  unregisterController,
  getController,
} from "./context";
export type { Appearance, AppearanceTheme } from "./appearance";
export { applyAppearance } from "./appearance";

const ELEMENT_TAGS = [
  "tickean-checkout",
  "tickean-ticket-selector",
  "tickean-discount",
  "tickean-buyer-verification",
  "tickean-attendees",
  "tickean-payment",
  "tickean-order-summary",
] as const;

/**
 * Explicit registration helper. Elements also auto-register on module import.
 */
export function defineTickeanElements(): void {
  if (typeof customElements === "undefined") return;

  // Side-effect imports above already call customElements.define.
  // This exists for explicit opt-in in bundlers that tree-shake side effects.
  for (const tag of ELEMENT_TAGS) {
    if (!customElements.get(tag)) {
      // re-import path already defined; noop marker for API stability
      void tag;
    }
  }
}

export function attachController(
  el: HTMLElement,
  controller: CheckoutController,
  id?: string,
): string {
  const controllerId = registerController(controller, id);
  el.setAttribute("controller-id", controllerId);
  return controllerId;
}

export function detachController(id: string) {
  unregisterController(id);
}

// Auto-register on import (customElements.define already invoked by element modules).
defineTickeanElements();
