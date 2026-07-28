# Inicio rápido (JavaScript)

```bash
npm install @tickean/checkout-js
```

```ts
import { createTickean } from "@tickean/checkout-js";

const tickean = createTickean({
  publishableKey: process.env.TICKEAN_PUBLISHABLE_KEY!,
  apiBaseUrl: "https://api.tickean.com",
});

const session = await tickean.createSession({
  eventSlug: "demo-festival",
  returnUrl: "https://www.yoursite.com/checkout/return",
});

const catalog = await tickean.getCatalog();
const quote = await tickean.quote({
  items: [{ showOptionId: catalog.shows[0].showOptions[0].id, amount: 2 }],
});

await tickean.sendOtp({ phone: "+5491112345678" });
await tickean.verifyOtp({
  phone: "+5491112345678",
  code: "123456",
  name: "Ada Lovelace",
});

const purchase = await tickean.createPurchase({
  items: [{ showOptionId: catalog.shows[0].showOptions[0].id, amount: 2 }],
  paymentMethod: "TRANSFER",
  currency: "ARS",
  expectedTotal: quote.totalPrice,
  idempotencyKey: crypto.randomUUID(),
});

const payment = await tickean.createPayment({
  orderId: purchase.purchase.id,
  paymentMethod: "TRANSFER",
  currency: "ARS",
  amount: quote.totalPrice,
});
```

Usá `demo: true` localmente para probar el flujo completo sin credenciales de API.
