# @tickean/checkout-js

Framework-agnostic TypeScript client for Tickean Headless Checkout.

Current version: **0.2.11**.

## APIs

- `createTickean(options)` — low-level client
- `createCheckoutController(options)` — state machine with cart, quote debounce, OTP, purchase+payment, persistence, telemetry
- `tickean.exchangeRecovery({ code })` — abandon-cart recovery (`POST /v1/checkout/recovery/exchange`)
- `resumeCode` option on the controller — exchange + rehydrate on init

## Phases

`initializing` → `browsing` → `quoting` → `verifying_buyer` → `ready_to_purchase` → `purchasing` → `requires_action` | `processing` → `completed` | `failed` | `expired`

## Recovery example

```ts
const controller = createCheckoutController({
  publishableKey: "pk_live_...",
  eventSlug: "mi-evento",
  returnUrl: "https://tusitio.com/checkout/",
  resumeCode: new URLSearchParams(location.search).get("resume") || undefined,
});
```

See [Reanudar sesión](../../docs/readme/18-session-resume.md) and the repository root README for monorepo build/test commands.
