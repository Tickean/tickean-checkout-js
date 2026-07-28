# Carrito y cotización

Siempre obtené una cotización del servidor antes de comprar:

```ts
const quote = await tickean.quote({
  items: [{ showOptionId: "…", amount: 2 }],
  discountCode: "SUMMER10",
});
```

Al comprar, enviá `expectedTotal` con el total de la última cotización. Si cambió el stock, el precio o los descuentos, la API responde con `checkout_price_mismatch` (409).

Idempotencia: enviá `idempotencyKey` al crear la compra para poder reintentar de forma segura ante fallas de red.
