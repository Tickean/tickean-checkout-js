# @tickean/react-checkout

React provider, headless hooks, and Elements wrappers for Tickean Headless Checkout.

Peer/runtime deps: `@tickean/checkout-js` and `@tickean/checkout-elements` (use **js ≥ 0.2.11** and **elements ≥ 0.2.22** for wizard recovery).

```tsx
import { TickeanProvider, TickeanCheckout } from "@tickean/react-checkout";

export function App() {
  return (
    <TickeanProvider
      publishableKey={process.env.NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY!}
      eventSlug="demo-festival"
      locale="es-AR"
    >
      <TickeanCheckout />
    </TickeanProvider>
  );
}
```

Docs: [Elements quickstart](../../docs/readme/14-elements-quickstart.md) · [Wizard flow](../../docs/readme/23-wizard-flow.md)
