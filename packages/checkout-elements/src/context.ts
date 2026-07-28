import type { CheckoutController, CheckoutState } from "@tickean/checkout-js";

const CONTROLLER_ATTR = "controller-id";

const registry = new Map<string, CheckoutController>();
let autoId = 0;

export function registerController(
  controller: CheckoutController,
  id?: string,
): string {
  const key = id || `tickean_${++autoId}`;
  registry.set(key, controller);
  return key;
}

export function unregisterController(id: string) {
  registry.delete(id);
}

export function getController(id: string | null | undefined): CheckoutController | null {
  if (!id) return null;
  return registry.get(id) || null;
}

export function controllerAttr(): string {
  return CONTROLLER_ATTR;
}

export type ElementEvents = {
  ready: CustomEvent<{ state: CheckoutState }>;
  change: CustomEvent<{ state: CheckoutState }>;
  error: CustomEvent<{ error: CheckoutState["error"] }>;
  complete: CustomEvent<{ state: CheckoutState }>;
};

export function emitTickeanEvent<K extends keyof ElementEvents>(
  el: HTMLElement,
  name: K,
  detail: ElementEvents[K]["detail"],
) {
  el.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
    }),
  );
}

export function formatMoney(amount: number, currency = "ARS", locale = "es-AR") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
