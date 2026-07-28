# Reanudar sesión

Las sesiones de checkout son cortas y están vinculadas al origen. El SDK puede reanudar una compra interrumpida sin perder carrito ni verificación del comprador.

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

En React, pasá `persistence: true` al controller vía opciones avanzadas o usá `createCheckoutController` directamente. `TickeanProvider` desactiva persistencia por defecto (`persistence: false`) para simplificar demos.

## Flujo de reanudación

1. Al inicializar, el controller crea una sesión nueva.
2. Si hay un `sessionToken` guardado distinto, intenta `getSession()` con ese token.
3. Si la reanudación falla, continúa con la sesión recién creada.
4. Rehidrata carrito, descuento y flag `buyerVerified` desde almacenamiento local.

## Durante `requires_action`

Si el comprador cierra la pestaña mientras espera confirmación de pago (3DS, transferencia, widget Fintoc):

1. Al volver, el controller reanuda la sesión con `getSession()`.
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

- Guardá el `sessionToken` solo en `sessionStorage`, no en `localStorage` (menor ventana de exposición).
- Invalidá persistencia al completar (`completed`) o fallar (`failed` / `expired`).
- No confíes en el estado del navegador para totales: siempre re-cotizá con `/v1/checkout/quote` tras reanudar.
