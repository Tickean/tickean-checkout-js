import { describe, expect, it } from "vitest";
import { createTickean } from "@tickean/checkout-js";

describe("@tickean/react-checkout package", () => {
  it("re-exports a working createTickean client", async () => {
    const client = createTickean({ publishableKey: "pk_test", demo: true });
    const session = await client.createSession({ eventSlug: "demo-festival" });
    expect(session.event.slug).toBe("demo-festival");
  });
});
