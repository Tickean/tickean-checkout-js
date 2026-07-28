# Appearance API

Controlá el look & feel de Elements sin tocar el DOM interno.

```ts
const appearance = {
  theme: "flat", // default | flat | night | none
  variables: {
    colorPrimary: "#16a34a",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    borderRadius: "12px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};
```

En React:

```tsx
<TickeanProvider appearance={appearance}>...</TickeanProvider>
```

En Web Components:

```html
<tickean-checkout appearance='{"theme":"night"}'></tickean-checkout>
```

Los mount points de Stripe/Airwallex/dLocal/Fintoc no se aíslan del SDK oficial del proveedor: Tickean solo reserva el contenedor.
