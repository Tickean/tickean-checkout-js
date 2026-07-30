# Reanudar sesión

Las sesiones de checkout son cortas y están vinculadas al origen. Hay dos formas de retomar una compra:

1. **Persistencia en el navegador** (`sessionStorage`) — misma pestaña / dispositivo.
2. **Recovery por link** (`?resume=`) — mail/SMS cuando el comprador abandona tras OTP + carrito (ideal para embeds WordPress / Elements).

## Recovery por link (abandono)

### Cuándo se programa

Tickean agenda recovery cuando la sesión headless tiene:

- comprador **OTP-verificado**, y  
- carrito con ítems (o una purchase en curso).

Se refresca en cada `quote` / `verifyOtp` / `createPurchase`. Se cancela al completar el pago.

### Link de vuelta

El mail/SMS incluye un link a la `returnUrl` de la sesión (en WordPress, la página del shortcode):

```
https://tusitio.com/checkout/?resume=ABC123
```

Si no hay `returnUrl`, se usa el builder de URL del ecommerce Tickean.

### Qué hace Elements

Con **checkout-js ≥ 0.2.11** y **elements ≥ 0.2.22**:

1. Al montar `<tickean-checkout>`, lee `?resume=` de la URL.
2. Llama `POST /v1/checkout/recovery/exchange` con la publishable key + origin.
3. Rehidrata carrito, descuento, buyer verificado, purchase/`nextAction` si aplica.
4. Salta al paso del wizard correspondiente (datos, pago, transferencia, etc.).
5. Quita `resume` de la URL con `history.replaceState` si el exchange fue exitoso.

No hace falta configurar el shortcode: ya envía `return-url` = página actual.

### Controller / headless

```ts
import { createCheckoutController } from "@tickean/checkout-js";

const controller = createCheckoutController({
  publishableKey: "pk_test_...",
  eventSlug: "demo-festival",
  returnUrl: "https://tusitio.com/checkout/",
  resumeCode: new URLSearchParams(location.search).get("resume") || undefined,
});

await controller.ready;
```

O vía cliente bajo nivel:

```ts
const recovered = await tickean.exchangeRecovery({ code: "ABC123" });
// { sessionToken, event, cart, buyer, purchase, nextAction, suggestedStep, ... }
```

### API

`POST /v1/checkout/recovery/exchange`

Headers:

- `Authorization: Bearer pk_…`
- `Origin` autorizado

Body:

```json
{ "code": "ABC123" }
```

Respuesta (resumen): `sessionToken`, `event`, `cart`, `discountCode`, `buyer`, `buyerVerified`, `purchase`, `payment`, `nextAction`, `shoppingCartReference`, `phase`, `suggestedStep`.

## GET /v1/checkout/session

Recupera la sesión activa y su fase actual. Requiere:

- Encabezado `Authorization: Bearer pk_test_...` (clave publicable)
- Encabezado `X-Tickean-Session: <sessionToken>`
- Encabezado `Origin` autorizado

```ts
const session = await tickean.getSession();
// { sessionId, phase, buyerVerified, purchaseId?, event?, ... }
```

Si el token expiró o fue revocado, la API responde `401` y el controller crea una sesión nueva.

## Persistencia en el navegador

`CheckoutController` puede guardar estado no sensible en `sessionStorage`:

| Campo | Descripción |
|-------|-------------|
| `sessionToken` | Token opaco de la sesión |
| `eventSlug` | Evento vinculado |
| `cart` | Ítems seleccionados |
| `discountCode` | Código aplicado |
| `phase` | Fase al cerrar la pestaña |
| `buyerVerified` | Si el OTP ya se completó |
| `purchaseId` | Compra en curso (si existe) |

**No se persiste PII** (teléfono, email, datos de tarjeta) ni secretos de PSP.

```ts
import { createCheckoutController, createSessionStoragePersistence } from "@tickean/checkout-js";

const controller = createCheckoutController({
  publishableKey: "pk_test_...",
  eventSlug: "demo-festival",
  persistence: createSessionStoragePersistence(),
});
```

En React, `TickeanProvider` desactiva persistencia por defecto (`persistence: false`). El drop-in Elements en WordPress también usa `persistence: false`: el resume por mail/SMS reemplaza esa necesidad entre dispositivos.

## Flujo de reanudación (sessionStorage)

1. Al inicializar, el controller intenta reusar un `sessionToken` guardado con `getSession()`.
2. Si la reanudación falla, crea una sesión nueva.
3. Rehidrata carrito, descuento y flag `buyerVerified` desde almacenamiento local.

## Durante `requires_action`

Si el comprador cierra la pestaña mientras espera confirmación de pago (3DS, transferencia, widget Fintoc):

1. Al volver, el controller reanuda la sesión con `getSession()` (o con `?resume=` si llegó por mail).
2. Consultá `getPaymentStatus()` o usá `watchPayment()` para obtener el `nextAction` actualizado.
3. Montá de nuevo el widget del PSP si `nextAction.type` lo requiere.

```tsx
const { watchPayment, nextAction } = usePayment();

useEffect(() => {
  if (phase === "requires_action") {
    watchPayment({ timeoutMs: 120_000 }).catch(console.error);
  }
}, [phase]);
```

## Buenas prácticas

- Preferí `sessionStorage` sobre `localStorage` para tokens de sesión.
- Invalidá persistencia al completar (`completed`) o fallar (`failed` / `expired`).
- No confíes en el estado del navegador para totales: siempre re-cotizá con `/v1/checkout/quote` tras reanudar.
- Asegurá que la `returnUrl` del embed sea la página donde vive el checkout (WordPress lo hace por defecto).

Ver el recorrido visual: [Flujo del wizard](./23-wizard-flow.md).
