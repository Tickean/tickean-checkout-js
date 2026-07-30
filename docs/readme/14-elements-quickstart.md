# Tickean Elements (10 minutos)

Tickean Elements es la capa visual white-label sobre `/v1/checkout`.

## Instalar

```bash
npm install @tickean/checkout-js @tickean/react-checkout @tickean/checkout-elements
```

## React completo

```tsx
import { TickeanProvider, TickeanCheckout } from "@tickean/react-checkout";

export default function Page() {
  return (
    <TickeanProvider
      publishableKey={process.env.NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY!}
      eventSlug="demo-festival"
      apiBaseUrl="https://api.tickean.com"
      locale="es-AR"
      appearance={{ theme: "flat", variables: { colorPrimary: "#16a34a" } }}
    >
      <TickeanCheckout />
    </TickeanProvider>
  );
}
```

## Web Components

```html
<script type="module">
  import "@tickean/checkout-elements";
</script>

<tickean-checkout
  publishable-key="pk_test_..."
  event-slug="demo-festival"
  locale="es-AR"
  appearance='{"theme":"flat"}'
></tickean-checkout>
```

## Tres niveles

1. **Checkout completo** — `<TickeanCheckout />` / `<tickean-checkout>`
2. **Componible** — TicketSelector, Discount, BuyerVerification, Payment, OrderSummary
3. **Headless** — hooks `useEvent`, `useCart`, `useCheckout`, `usePayment`

## Playground

El repo incluye `examples/playground` para explorar Appearance y locale. En tu app, instalá desde npm e importá `@tickean/checkout-elements` o `@tickean/react-checkout`.
