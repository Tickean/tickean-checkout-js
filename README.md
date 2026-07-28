# Tickean Headless Checkout

Professional headless checkout SDK for embedding Tickean ticket sales into your own website with full UI control.

## Packages

| Package | Description |
|---------|-------------|
| [`@tickean/checkout-js`](./packages/checkout-js) | Framework-agnostic TypeScript client |
| [`@tickean/react-checkout`](./packages/react-checkout) | React provider + hooks (unstyled) |
| [`examples/nextjs-custom-checkout`](./examples/nextjs-custom-checkout) | Fully branded demo app |

## Quick start

```bash
npm install @tickean/checkout-js @tickean/react-checkout
```

```tsx
import { TickeanProvider, useEvent, useCart, useCheckout } from "@tickean/react-checkout";

export function App() {
  return (
    <TickeanProvider
      publishableKey={process.env.NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY!}
      eventSlug="demo-festival"
      apiBaseUrl="https://api.tickean.com"
      demo
    >
      <TicketsPage />
    </TickeanProvider>
  );
}
```

## Security model

- Browser uses **publishable keys** only (`pk_test_…` / `pk_live_…`)
- Origins must be allowlisted per organization
- OTP verification is required before purchase
- Server recalculates prices; never trust client totals
- Mercado Pago redirects return through Tickean, then to your signed `returnUrl`

## License

MIT — the SDK is open source. Enabling Custom Checkout on your Tickean organization is a paid product entitlement.

## Release status

The guides and OpenAPI are published in ReadMe version `1.0`. Remaining release steps:

1. Create the public GitHub remote
2. `npx changeset publish` (npm)

