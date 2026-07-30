# @tickean/checkout-elements

Tickean Checkout web components with Shadow DOM, appearance themes, wizard steps, and i18n.

Requires **`@tickean/checkout-js` ≥ 0.2.11**. Current package version: **0.2.22**.

```html
<script type="module">
  import '@tickean/checkout-elements';
</script>

<tickean-checkout
  publishable-key="pk_test_demo"
  event-slug="demo-festival"
  demo
  locale="es-AR"
  appearance="default"
></tickean-checkout>
```

![Wizard — entradas](https://d1eg24w7igwib6.cloudfront.net/1.wizard.png)

## Elements

- `tickean-checkout` — full flow (`layout="steps"` by default)
- `tickean-ticket-selector`
- `tickean-discount`
- `tickean-buyer-verification`
- `tickean-payment` — handles `nextAction` (transfer instructions, redirect, provider placeholders)
- `tickean-order-summary`

## Recovery

On mount, `<tickean-checkout>` reads `?resume=` from the page URL, exchanges it via `/v1/checkout/recovery/exchange`, rehydrates cart/buyer/purchase, and clears the query param.

## Appearance

Themes: `default` | `flat` | `night` | `none`. CSS variables: `--tickean-*`.

Docs: [Flujo del wizard](../../docs/readme/23-wizard-flow.md) · [WordPress](../../docs/readme/22-wordpress.md)
