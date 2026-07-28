import { describe, expect, it } from "vitest";
import { createTickean, createCheckoutController } from "./index";

describe("@tickean/react-checkout package", () => {
  it("re-exports a working createTickean client", async () => {
    const client = createTickean({ publishableKey: "pk_test", demo: true });
    const session = await client.createSession({ eventSlug: "demo-festival" });
    expect(session.event.slug).toBe("demo-festival");
  });

  it("re-exports createCheckoutController", async () => {
    const controller = createCheckoutController({
      publishableKey: "pk_test",
      demo: true,
      eventSlug: "demo-festival",
      persistence: false,
    });
    await controller.ready;
    expect(controller.getSnapshot().event?.slug).toBe("demo-festival");
    controller.dispose();
  });
});
