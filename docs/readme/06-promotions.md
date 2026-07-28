# Promociones y catálogo restringido

Las opciones con `catalogVisibility: PROMO_GATED` permanecen ocultas en el catálogo hasta cotizar con un código válido que las habilite.

```ts
const quote = await tickean.quote({
  items: [{ showOptionId: "gated-option-id", amount: 1 }],
  discountCode: "VIPONLY",
});
// quote.unlockedShowOptionIds incluye la opción restringida si el código es válido
```

Nunca expongas identificadores de opciones restringidas en URLs públicas de marketing sin exigir también el código de acceso en el servidor.
