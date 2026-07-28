# Svelte — Tickean Elements

Copiá y pegá. Requiere `@tickean/checkout-elements` instalado y buildeado.

## Instalación

```bash
npm install @tickean/checkout-js @tickean/checkout-elements
```

Desde el monorepo local: `npm run build -w @tickean/checkout-elements`.

## Checkout completo

```svelte
<script lang="ts">
  import "@tickean/checkout-elements";

  let checkoutEl: HTMLElement | undefined;

  function onComplete() {
    console.log("compra completa");
  }
</script>

<main>
  <tickean-checkout
    bind:this={checkoutEl}
    publishable-key="pk_test_..."
    event-slug="demo-festival"
    demo
    locale="es-AR"
    appearance='{"theme":"flat"}'
    on:complete={onComplete}
  />
</main>
```

## SvelteKit (+layout)

Registrá los custom elements una sola vez en el layout del checkout:

```svelte
<!-- src/routes/checkout/+layout.svelte -->
<script lang="ts">
  import { browser } from "$app/environment";
  if (browser) {
    import("@tickean/checkout-elements");
  }
</script>

<slot />
```

```svelte
<!-- src/routes/checkout/+page.svelte -->
<tickean-checkout
  publishable-key={import.meta.env.VITE_TICKEAN_PUBLISHABLE_KEY}
  event-slug="demo-festival"
  demo
/>
```

## Composable

```svelte
<script lang="ts">
  import "@tickean/checkout-elements";
</script>

<div class="grid">
  <tickean-ticket-selector
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
```

> Para estado compartido entre elementos, usá `<tickean-checkout>` o integrá `@tickean/checkout-js` headless.
