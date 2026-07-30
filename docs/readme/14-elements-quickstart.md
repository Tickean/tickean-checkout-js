# Tickean Elements (10 minutos)

Tickean Elements es la capa visual white-label sobre `/v1/checkout`.

## Instalar

```bash
npm install @tickean/checkout-js@^0.2.11 @tickean/react-checkout @tickean/checkout-elements@^0.2.22
```

Usá **checkout-js ≥ 0.2.11** y **elements ≥ 0.2.22** (wizard + recovery `?resume=`).

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

Por defecto `layout="steps"` (Entradas → Datos → Pago → Listo). Usá `layout="stacked"` para el layout clásico todo-en-uno.

## Vista previa del wizard

![Entradas](https://d1eg24w7igwib6.cloudfront.net/1.wizard.png)

![Tus datos](https://d1eg24w7igwib6.cloudfront.net/2.wizar_client.png)

![OTP](https://d1eg24w7igwib6.cloudfront.net/3.wizar_otp.png)

Guía ilustrada paso a paso: [Flujo del wizard](./23-wizard-flow.md).

## Tres niveles

1. **Checkout completo** — `<TickeanCheckout />` / `<tickean-checkout>` (wizard por pasos incluido)
2. **Componible** — TicketSelector, Discount, BuyerVerification, Payment, OrderSummary
3. **Headless** — hooks `useEvent`, `useCart`, `useCheckout`, `usePayment`

## Recovery

Si el comprador abandona tras OTP + carrito, el mail de recuperación abre tu página con `?resume=CODE`. Elements intercambia el código, rehidrata el wizard y limpia la URL. Ver [Reanudar sesión](./18-session-resume.md).

## Playground

El repo incluye `examples/playground` para explorar Appearance y locale. En tu app, instalá desde npm e importá `@tickean/checkout-elements` o `@tickean/react-checkout`.
