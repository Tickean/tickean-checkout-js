# Vue 3 — Tickean Elements

Copiá y pegá.

## Instalación

```bash
npm install @tickean/checkout-js @tickean/checkout-elements
```

## Checkout completo

```vue
<script setup lang="ts">
import "@tickean/checkout-elements";
</script>

<template>
  <main>
    <tickean-checkout
      publishable-key="pk_test_..."
      event-slug="demo-festival"
      demo
      locale="es-AR"
      appearance='{"theme":"flat","variables":{"colorPrimary":"#16a34a"}}'
    />
  </main>
</template>
```

## Composable (varios elementos)

```vue
<script setup lang="ts">
import "@tickean/checkout-elements";
</script>

<template>
  <div class="layout">
    <tickean-ticket-selector
      publishable-key="pk_test_..."
      event-slug="demo-festival"
      demo
      locale="es-AR"
    />
    <tickean-discount
      publishable-key="pk_test_..."
      event-slug="demo-festival"
      demo
    />
    <tickean-buyer-verification
      publishable-key="pk_test_..."
      event-slug="demo-festival"
      demo
    />
    <tickean-order-summary
      publishable-key="pk_test_..."
      event-slug="demo-festival"
      demo
    />
    <tickean-payment
      publishable-key="pk_test_..."
      event-slug="demo-festival"
      demo
      payment-method="TRANSFER"
      currency="ARS"
    />
  </div>
</template>
```

> En modo composable cada elemento crea su propio controller si no compartís estado. Para producción, preferí un solo `<tickean-checkout>` o `@tickean/react-checkout` con `TickeanProvider`.

## Eventos

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import "@tickean/checkout-elements";

onMounted(() => {
  const el = document.querySelector("tickean-checkout");
  el?.addEventListener("complete", () => console.log("compra completa"));
  el?.addEventListener("error", (e: Event) =>
    console.error((e as CustomEvent).detail),
  );
});
</script>
```
