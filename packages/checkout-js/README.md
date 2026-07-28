# @tickean/checkout-js

Framework-agnostic TypeScript client for Tickean Headless Checkout.

## APIs

- `createTickean(options)` — low-level client (unchanged public method signatures)
- `createCheckoutController(options)` — state machine with cart, quote debounce, OTP, purchase+payment, persistence, telemetry

## Phases

`initializing` → `browsing` → `quoting` → `verifying_buyer` → `ready_to_purchase` → `purchasing` → `requires_action` | `processing` → `completed` | `failed` | `expired`

See repository root README for monorepo build/test commands.
