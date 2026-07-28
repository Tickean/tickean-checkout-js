# @tickean/checkout-elements

Tickean Checkout web components with Shadow DOM, appearance themes, and i18n.

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

## Elements

- `tickean-checkout` — full flow
- `tickean-ticket-selector`
- `tickean-discount`
- `tickean-buyer-verification`
- `tickean-payment` — handles `nextAction` (transfer instructions, redirect, provider placeholders)
- `tickean-order-summary`

## Appearance

Themes: `default` | `flat` | `night` | `none`. CSS variables: `--tickean-*`.
