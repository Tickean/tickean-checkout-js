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

  it("survives multi-attribute upgrade without leaving loading forever", async () => {
    defineTickeanElements();
    const el = document.createElement("tickean-checkout") as TickeanCheckout;
    el.setAttribute("publishable-key", "pk_test");
    el.setAttribute("event-slug", "demo-festival");
    el.setAttribute("api-base-url", "https://api.tickean.com");
    el.setAttribute("return-url", "http://localhost/checkout/");
    el.setAttribute("demo", "");
    document.body.appendChild(el);

    // Wait for owned controller init (demo mode)
    await new Promise((r) => setTimeout(r, 50));
    const text = el.shadowRoot?.textContent || "";
    expect(text).not.toMatch(/Cargando checkout|Loading checkout/);
    expect(el.getAttribute("controller-id")).toBeTruthy();

    el.remove();
  });

  it("defaults to stepped layout with gated Continue", async () => {
    defineTickeanElements();
    const el = document.createElement("tickean-checkout") as TickeanCheckout;
    el.setAttribute("publishable-key", "pk_test");
    el.setAttribute("event-slug", "demo-festival");
    el.setAttribute("demo", "");
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 80));
    const root = el.shadowRoot!;
    expect(root.querySelector("[data-tickean-shell='steps']")).toBeTruthy();
    expect(root.textContent || "").toMatch(/Paso 1 de \d+|Step 1 of \d+/);

    const next = root.querySelector<HTMLButtonElement>('[data-action="next"]');
    expect(next).toBeTruthy();
    expect(next!.disabled).toBe(true);

    const controller = (el as any).ownedController as ReturnType<
      typeof createCheckoutController
    >;
    controller.setCartItem("opt_day", 1);
    await new Promise((r) => setTimeout(r, 40));
    expect(next!.disabled).toBe(false);

    next!.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(root.textContent || "").toMatch(/Paso 2 de \d+|Step 2 of \d+/);
    expect(
      root.querySelector('[data-panel="buyer"]')?.hasAttribute("hidden"),
    ).toBe(false);
    // Discount lives in the summary aside, not under the ticket list.
    expect(root.querySelector("[data-aside] tickean-discount")).toBeTruthy();

    el.remove();
  });

  it("supports layout=stacked all-at-once shell", async () => {
    defineTickeanElements();
    const el = document.createElement("tickean-checkout") as TickeanCheckout;
    el.setAttribute("publishable-key", "pk_test");
    el.setAttribute("event-slug", "demo-festival");
    el.setAttribute("demo", "");
    el.setAttribute("layout", "stacked");
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 80));
    const root = el.shadowRoot!;
    expect(root.querySelector("[data-tickean-shell='stacked']")).toBeTruthy();
    expect(root.querySelector("tickean-ticket-selector")).toBeTruthy();
    expect(root.querySelector("tickean-buyer-verification")).toBeTruthy();
    expect(root.querySelector("tickean-payment")).toBeTruthy();
    expect(root.querySelector('[data-action="next"]')).toBeNull();

    el.remove();
  });

  it("builds E.164 phones from country dial codes", async () => {
    const { toE164, countryFromLocale, countryFromIso } = await import(
      "./phone-countries"
    );
    expect(countryFromLocale("es-AR").iso).toBe("AR");
    expect(countryFromIso("CL").dial).toBe("56");
    expect(toE164("54", "11 2345 6789")).toBe("+541123456789");
  });

  it("advances to done step when phase is completed", async () => {
    defineTickeanElements();
    const el = document.createElement("tickean-checkout") as TickeanCheckout;
    el.setAttribute("publishable-key", "pk_test");
    el.setAttribute("event-slug", "demo-festival");
    el.setAttribute("demo", "");
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 80));
    const controller = (el as any).ownedController as ReturnType<
      typeof createCheckoutController
    >;
    controller._dispatch({
      type: "COMPLETED",
      purchase: { id: "pur_demo", status: "COMPLETED" } as any,
    });
    await new Promise((r) => setTimeout(r, 20));

    const root = el.shadowRoot!;
    expect(
      root.querySelector('[data-panel="done"]')?.hasAttribute("hidden"),
    ).toBe(false);
    expect(root.textContent || "").toMatch(/completada|completed/i);

    el.remove();
  });
});
