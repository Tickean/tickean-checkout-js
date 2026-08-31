# Visión general de Headless Checkout

Tickean Headless Checkout permite que los socios vendan entradas con una interfaz completamente personalizada.

- **SDK (MIT):** `@tickean/checkout-js`, `@tickean/react-checkout`, `@tickean/checkout-elements`
- **Producto:** habilitación Custom Checkout por organización
- **API:** contrato público versionado bajo `/v1/checkout`

## Cómo se ve el wizard

Con Elements (`layout="steps"`) el comprador recorre entradas → datos → OTP → pago. Podés probarlo acá en modo mock (OTP `123456`):

<iframe src="https://d1eg24w7igwib6.cloudfront.net/wizard-demo.html?embed=1" title="Tickean Elements wizard demo" width="100%" height="640" loading="lazy" style="border:1px solid #e2e8f0;border-radius:12px;background:#fff"></iframe>

[Abrir demo en pantalla completa](https://d1eg24w7igwib6.cloudfront.net/wizard-demo.html) · Recorrido con capturas: [Flujo del wizard](./23-wizard-flow.md).

## Arquitectura

```
Tu sitio → @tickean/react-checkout → @tickean/checkout-js → /v1/checkout
                ↓
         @tickean/checkout-elements (Web Components, opcional)
```

Las sesiones son de corta duración, están vinculadas al origen y usan una clave publicable. Los precios, el stock, los descuentos y la verificación del comprador siempre se validan en el servidor.

## Paquetes

| Paquete | Rol |
|---------|-----|
| `@tickean/checkout-js` | Cliente HTTP, `CheckoutController`, persistencia, telemetría, recovery (`?resume=`) |
| `@tickean/checkout-elements` | Web Components white-label con Appearance API, wizard e i18n |
| `@tickean/react-checkout` | `TickeanProvider`, hooks headless y wrappers React sobre los WC |

```bash
npm install @tickean/checkout-js@^0.2.12 @tickean/checkout-elements@^0.2.23 @tickean/react-checkout
```

Versiones actuales en npm (Elements / recovery): **checkout-js 0.2.12**, **checkout-elements 0.2.23**. React wrappers: ver versión publicada de `@tickean/react-checkout` (peer de los anteriores).

## Tres niveles de integración

1. **Checkout completo** — `<TickeanCheckout />` o `<tickean-checkout>`: flujo end-to-end con estilos Tickean.
2. **Composable** — armá tu layout con `TicketSelector`, `DiscountField`, `BuyerVerification`, `PaymentElement`, `OrderSummary` (React) o los tags `tickean-*` equivalentes.
3. **Headless** — hooks `useEvent`, `useCart`, `useBuyerVerification`, `useCheckout`, `usePayment` o `createCheckoutController` directo; cero CSS impuesto.

Empezá por [Elements quickstart](./14-elements-quickstart.md), [Inicio rápido React](./02-quickstart-react.md) o [WordPress](./22-wordpress.md) según tu stack.
