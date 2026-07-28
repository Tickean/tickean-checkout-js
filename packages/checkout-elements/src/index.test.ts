import { describe, expect, it } from "vitest";
import { createCheckoutController } from "@tickean/checkout-js";
import {
  attachController,
  applyAppearance,
  defineTickeanElements,
  TickeanCheckout,
  TickeanOrderSummary,
} from "./index";

describe("@tickean/checkout-elements", () => {
  it("defines custom elements", () => {
    defineTickeanElements();
    expect(customElements.get("tickean-checkout")).toBe(TickeanCheckout);
    expect(customElements.get("tickean-order-summary")).toBe(TickeanOrderSummary);
  });

  it("attaches a controller and renders order summary", async () => {
    const controller = createCheckoutController({
      publishableKey: "pk_test",
      demo: true,
      eventSlug: "demo-festival",
      persistence: false,
      quoteDebounceMs: 5,
    });
    await controller.ready;

    const el = document.createElement("tickean-order-summary");
    attachController(el, controller);
    document.body.appendChild(el);

    expect(el.shadowRoot?.textContent || "").toMatch(/Total|total/i);

    controller.setCartItem("opt_day", 1);
    await new Promise((r) => setTimeout(r, 30));
    expect(el.shadowRoot?.textContent || "").toBeTruthy();

    el.remove();
    controller.dispose();
  });

  it("applies theme and custom CSS variables to an element host", () => {
    const host = document.createElement("tickean-checkout");

    applyAppearance(host, {
      theme: "night",
      variables: { primary: "#ff00aa" },
    });

    expect(host.style.getPropertyValue("--tickean-bg")).toBe("#0b1220");
    expect(host.style.getPropertyValue("--tickean-primary")).toBe("#ff00aa");
  });
});
