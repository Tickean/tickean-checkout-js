import { describe, expect, it, vi } from "vitest";
import {
  createCheckoutController,
  createTickean,
  checkoutReducer,
  createInitialState,
  createMemoryPersistence,
  createEventEmitterTelemetry,
  TickeanError,
} from "./index";

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

    const payment = await client.createPayment({
      orderId: purchase.purchase.id,
      paymentMethod: "TRANSFER",
      currency: "ARS",
      amount: purchase.purchase.totalPrice,
    });
    expect(payment.nextAction?.type).toBe("display_instructions");
  });

  it("supports getSession and confirmPayment", async () => {
    const client = createTickean({ publishableKey: "pk_test_demo", demo: true });
    await client.createSession({ eventSlug: "demo-festival" });
    const session = await client.getSession();
    expect(session.phase).toBe("browsing");

    await client.sendOtp({ phone: "+5491112345678" });
    await client.verifyOtp({ phone: "+5491112345678", code: "123456" });
    const purchase = await client.createPurchase({
      items: [{ showOptionId: "opt_day", amount: 1 }],
      paymentMethod: "TRANSFER",
      currency: "ARS",
    });
    await client.createPayment({
      orderId: purchase.purchase.id,
      paymentMethod: "TRANSFER",
      currency: "ARS",
      amount: purchase.purchase.totalPrice,
    });
    const confirmed = await client.confirmPayment({ confirmationToken: "demo" });
    expect(confirmed.paymentStatus).toBe("COMPLETED");
    expect(confirmed.nextAction?.type).toBe("none");
  });

  it("throws when session is missing", async () => {
    const client = createTickean({ publishableKey: "pk_test_demo", demo: true });
    await expect(client.getCatalog()).rejects.toBeInstanceOf(TickeanError);
  });
});

describe("checkoutReducer", () => {
  it("transitions through quoting and ready_to_purchase", () => {
    let state = createInitialState();
    state = checkoutReducer(state, { type: "INIT_START" });
    expect(state.phase).toBe("initializing");

    const session = {
      sessionId: "s",
      sessionToken: "t",
      expiresAt: new Date().toISOString(),
      event: {
        id: "e",
        slug: "demo",
        title: "Demo",
        shows: [],
      },
      capabilities: {},
    };
    state = checkoutReducer(state, {
      type: "INIT_SUCCESS",
      session,
      event: session.event,
    });
    expect(state.phase).toBe("browsing");

    state = checkoutReducer(state, {
      type: "SET_CART",
      cart: [{ showOptionId: "opt_day", amount: 1 }],
    });
    state = checkoutReducer(state, { type: "QUOTE_START" });
    expect(state.phase).toBe("quoting");
    state = checkoutReducer(state, {
      type: "QUOTE_SUCCESS",
      quote: { valid: true, totalPrice: 15000 },
    });
    expect(state.phase).toBe("browsing");

    state = checkoutReducer(state, { type: "OTP_SENT" });
    expect(state.phase).toBe("verifying_buyer");
    state = checkoutReducer(state, {
      type: "OTP_VERIFIED",
      buyer: { id: "b", phone: "+54911" },
    });
    expect(state.phase).toBe("ready_to_purchase");
  });

  it("sets requires_action for redirect nextAction", () => {
    let state = createInitialState({ phase: "ready_to_purchase" });
    state = checkoutReducer(state, { type: "PURCHASE_START" });
    state = checkoutReducer(state, {
      type: "PURCHASE_SUCCESS",
      purchase: {
        id: "p",
        status: "PENDING",
        totalPrice: 1,
        currency: "ARS",
        shoppingCartReference: "c",
      },
      payment: { id: "pay" },
      nextAction: { type: "redirect", url: "https://example.com" },
    });
    expect(state.phase).toBe("requires_action");
  });

  it("moves transfer checkout from initialization to processing and completion", () => {
    const session = {
      sessionId: "s",
      sessionToken: "t",
      expiresAt: new Date().toISOString(),
      event: { id: "e", slug: "demo", title: "Demo", shows: [] },
      capabilities: {},
    };
    let state = checkoutReducer(createInitialState(), {
      type: "INIT_SUCCESS",
      session,
      event: session.event,
    });
    expect(state.phase).toBe("browsing");

    state = checkoutReducer(state, {
      type: "PURCHASE_SUCCESS",
      purchase: {
        id: "p",
        status: "PENDING",
        totalPrice: 1,
        currency: "ARS",
        shoppingCartReference: "c",
      },
      payment: { id: "pay" },
      nextAction: {
        type: "display_instructions",
        paymentInstructions: { alias: "tickean.demo" },
      },
    });
    expect(state.phase).toBe("processing");

    state = checkoutReducer(state, { type: "COMPLETED" });
    expect(state.phase).toBe("completed");
    expect(state.nextAction).toEqual({ type: "none" });
  });

  it("returns from provider action to processing when it is cleared", () => {
    let state = createInitialState({ phase: "requires_action" });

    state = checkoutReducer(state, {
      type: "SET_NEXT_ACTION",
      nextAction: { type: "none" },
    });

    expect(state.phase).toBe("processing");
  });
});

describe("createCheckoutController demo flow", () => {
  it("runs cart → otp → transfer purchase with telemetry", async () => {
    const events: string[] = [];
    const telemetry = createEventEmitterTelemetry([
      (e) => events.push(e.name),
    ]);
    const persistence = createMemoryPersistence();

    const controller = createCheckoutController({
      publishableKey: "pk_test_demo",
      demo: true,
      eventSlug: "demo-festival",
      quoteDebounceMs: 10,
      persistence,
      telemetry,
    });

    await controller.ready;
    expect(controller.getSnapshot().phase).toBe("browsing");
    expect(controller.getSnapshot().event?.title).toContain("Demo");

    controller.setCartItem("opt_day", 2);
    await vi.waitFor(() => {
      expect(controller.getSnapshot().quote?.totalPrice).toBe(30000);
    });

    await controller.sendOtp("+5491112345678");
    expect(controller.getSnapshot().phase).toBe("verifying_buyer");
    await controller.verifyOtp({
      phone: "+5491112345678",
      code: "123456",
      name: "Demo",
    });
    expect(controller.getSnapshot().phase).toBe("ready_to_purchase");

    const result = await controller.purchaseAndPay({
      paymentMethod: "TRANSFER",
      currency: "ARS",
    });
    expect(result.nextAction.type).toBe("display_instructions");
    expect(controller.getSnapshot().phase).toBe("processing");
    expect(events).toContain("checkout.init.success");
    expect(events).toContain("checkout.purchase.success");

    controller.dispose();
  });

  it("resumes a persisted session without creating another", async () => {
    const persistence = createMemoryPersistence();
    const first = createCheckoutController({
      publishableKey: "pk_test_demo",
      demo: true,
      eventSlug: "demo-festival",
      persistence,
      persistenceKey: "resume-test",
    });
    await first.ready;
    const token = first.getSnapshot().session?.sessionToken;
    expect(token).toBeTruthy();
    first.dispose();

    const second = createCheckoutController({
      publishableKey: "pk_test_demo",
      demo: true,
      eventSlug: "demo-festival",
      persistence,
      persistenceKey: "resume-test",
    });
    await second.ready;
    expect(second.getSnapshot().session?.sessionToken).toBe(token);
    second.dispose();
  });
});
