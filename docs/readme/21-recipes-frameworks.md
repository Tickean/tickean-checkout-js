# Recetas por framework

Integraciones mínimas con Tickean Elements (Web Components) en distintos stacks. Todas asumen `@tickean/checkout-elements` instalado y buildeado.

```bash
npm install @tickean/checkout-js @tickean/checkout-elements
# React adicional:
npm install @tickean/react-checkout
```

## Next.js App Router

Usá `"use client"` y evitá SSR en los custom elements.

```tsx
"use client";

import { TickeanProvider, TickeanCheckout } from "@tickean/react-checkout";

export default function CheckoutPage() {
  return (
    <TickeanProvider
      publishableKey={process.env.NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY!}
      eventSlug="demo-festival"
      demo
    >
      <TickeanCheckout locale="es-AR" appearance="default" />
    </TickeanProvider>
  );
}
```

Modo composable:

```tsx
import {
  TicketSelector,
  DiscountField,
  BuyerVerification,
  PaymentElement,
  OrderSummary,
} from "@tickean/react-checkout";

<TickeanProvider {...props}>
  <div className="grid">
    <TicketSelector />
    <DiscountField />
    <BuyerVerification />
    <OrderSummary />
    <PaymentElement paymentMethod="TRANSFER" currency="ARS" />
  </div>
</TickeanProvider>
```

Ejemplo completo: [`examples/nextjs-custom-checkout`](../../examples/nextjs-custom-checkout).

## React + Vite

```tsx
// main.tsx
import "@tickean/checkout-elements"; // registra WC si no usás react-checkout

// App.tsx
import { TickeanProvider, TickeanCheckout } from "@tickean/react-checkout";

export function App() {
  return (
    <TickeanProvider publishableKey="pk_test_..." eventSlug="demo-festival" demo>
      <TickeanCheckout />
    </TickeanProvider>
  );
}
```

Sin React wrapper (solo Web Components):

```html
<script type="module">
  import "@tickean/checkout-elements";
</script>
<tickean-checkout
  publishable-key="pk_test_..."
  event-slug="demo-festival"
  demo
></tickean-checkout>
```

## Vue 3

Registrá los elementos una vez; usá los tags en el template.

```vue
<script setup lang="ts">
import "@tickean/checkout-elements";
</script>

<template>
  <tickean-checkout
    publishable-key="pk_test_..."
    event-slug="demo-festival"
    demo
    locale="es-AR"
  />
</template>
```

Snippet extendido: [`examples/recipes/vue.md`](../../examples/recipes/vue.md).

## Svelte

Importá el side-effect en el componente raíz o en `+layout.svelte`.

```svelte
<script lang="ts">
  import "@tickean/checkout-elements";
</script>

<tickean-checkout
  publishable-key="pk_test_..."
  event-slug="demo-festival"
  demo
  locale="es-AR"
/>
```

Snippet extendido: [`examples/recipes/svelte.md`](../../examples/recipes/svelte.md).

## WordPress

Sin React: cargá el módulo ESM y montá `<tickean-checkout>` con un bloque HTML o el shortcode `[tickean_checkout]`.

```
[tickean_checkout event_slug="demo-festival" locale="es-AR" appearance="flat"]
```

Usá **checkout-js ≥ 0.2.11** y **elements ≥ 0.2.22** (wizard + recovery `?resume=`).

Guía completa: [WordPress + Tickean Elements](./22-wordpress.md).  
Capturas: [Flujo del wizard](./23-wizard-flow.md).  
Snippet PHP: [`examples/recipes/wordpress.md`](../../examples/recipes/wordpress.md).

## Headless en cualquier framework

Si preferís UI propia, usá solo `@tickean/checkout-js` o los hooks de `@tickean/react-checkout` sin Elements. Ver [Inicio rápido React](./02-quickstart-react.md).

## Checklist común

1. Instalá desde npm: `npm install @tickean/checkout-js @tickean/checkout-elements` (y `@tickean/react-checkout` si usás React).
2. Clave publicable + origen autorizado en Dashboard.
3. CSP actualizada si usás PSP con widgets ([guía 17](./17-csp-and-security-headers.md)).
4. `"use client"` / `onMount` / sin SSR para custom elements.
