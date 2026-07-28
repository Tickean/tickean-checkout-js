import { describe, expect, it } from "vitest";
import { createTickean, TickeanError } from "./index";

describe("createTickean demo mode", () => {
  it("creates a session and quotes cart totals", async () => {
    const client = createTickean({ publishableKey: "pk_test_demo", demo: true });
    const session = await client.createSession({ eventSlug: "demo-festival" });
    expect(session.sessionToken).toBeTruthy();
    expect(session.event.title).toContain("Demo");

    const quote = await client.quote({
      items: [{ showOptionId: "opt_day", amount: 2 }],
    });
    expect(quote.totalPrice).toBe(30000);
  });

  it("unlocks gated options with DEMO2X1 and completes purchase after OTP", async () => {
    const client = createTickean({ publishableKey: "pk_test_demo", demo: true });
    await client.createSession({ eventSlug: "demo-festival" });
    const quote = await client.quote({
      items: [{ showOptionId: "opt_gated", amount: 2 }],
      discountCode: "DEMO2X1",
    });
    expect(quote.unlockedShowOptionIds).toContain("opt_gated");

    await client.sendOtp({ phone: "+5491112345678" });
    await client.verifyOtp({ phone: "+5491112345678", code: "123456" });
    const purchase = await client.createPurchase({
      items: [{ showOptionId: "opt_gated", amount: 2 }],
      paymentMethod: "TRANSFER",
      currency: "ARS",
      discountCode: "DEMO2X1",
    });
    expect(purchase.purchase.id).toBeTruthy();
    expect(purchase.cartSessionToken).toBeTruthy();
  });

  it("throws when session is missing", async () => {
    const client = createTickean({ publishableKey: "pk_test_demo", demo: true });
    await expect(client.getCatalog()).rejects.toBeInstanceOf(TickeanError);
  });
});
