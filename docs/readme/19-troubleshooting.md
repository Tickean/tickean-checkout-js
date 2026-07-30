# Solución de problemas

Errores frecuentes al integrar Headless Checkout o Elements, y cómo resolverlos.

## CORS y orígenes

**Síntoma:** `Failed to fetch`, `checkout_origin_not_allowed`, respuesta vacía en Network.

**Causas:**

- El `Origin` del navegador no está en la allowlist de la clave publicable.
- Usás `pk_live_` desde `http://localhost` (solo permitido con `pk_test_`).
- El `returnUrl` tiene un origen distinto al de la pestaña que creó la sesión.

**Solución:**

1. Dashboard → Organización → Headless Checkout → agregá el origen exacto (`https://www.tusitio.com`).
2. En local, usá `pk_test_` y `http://localhost:3000` (o el puerto que corresponda).
3. Verificá que `returnUrl` comparta origen con la página de checkout.

## OTP

**Síntoma:** `checkout_buyer_not_verified`, compra rechazada tras confirmar carrito.

**Causas:**

- No se llamó a `verifyOtp` antes de `createPurchase`.
- Teléfono fuera de formato E.164 (`+54911...`).
- Rate limit por IP o clave (`429`).

**Solución:**

1. Flujo: `sendOtp` → usuario ingresa código → `verifyOtp` → recién entonces checkout.
2. Normalizá el teléfono a E.164 en tu UI.
3. En demo, el código `123456` siempre es válido.

## Quote mismatch (`checkout_price_mismatch`)

**Síntoma:** Error 409 al crear la compra.

**Causas:**

- `expectedTotal` no coincide con el recálculo del servidor (stock, promo o precio cambió).
- Carrito desactualizado respecto a la última cotización.
- Descuento expiró o no aplica al carrito actual.

**Solución:**

1. Siempre enviá `expectedTotal` de la **última** respuesta de `/v1/checkout/quote`.
2. Re-cotizá antes de comprar si pasó tiempo o el usuario volvió a la pestaña.
3. Mostrá el nuevo total al usuario y pedí confirmación explícita.

## `nextAction` inesperado

**Síntoma:** UI vacía tras pagar, o widget del PSP no aparece.

**Causas:**

- No montaste el SDK según `nextAction.type` (`stripe_elements`, `fintoc_widget`, etc.).
- CSP bloquea scripts o frames del proveedor (ver guía 17).
- Redirección (`redirect`) interrumpida antes de volver a `returnUrl`.

**Solución:**

1. Inspeccioná `payment.nextAction` o `getPaymentStatus().nextAction`.
2. Seguí la tabla de la guía [Estados y nextAction](./16-states-and-next-action.md).
3. Relajá CSP en report-only para detectar bloqueos.

## Idempotencia

**Síntoma:** `checkout_idempotency_conflict`, compras duplicadas, o reintentos fallidos.

**Causas:**

- Misma `idempotencyKey` con body distinto.
- Reintento con clave nueva cuando la compra original ya se creó.

**Solución:**

1. Generá `idempotencyKey` una vez por intento de compra (`crypto.randomUUID()`).
2. Reutilizá la misma clave en reintentos de red con el **mismo** payload.
3. El controller genera claves automáticamente si no pasás una; en UI custom, guardá la clave hasta recibir respuesta definitiva.

## Elements no renderiza

**Síntoma:** `<tickean-checkout>` vacío o sin estilos.

**Causas:**

- No importaste `@tickean/checkout-elements` (define los custom elements).
- Dependencia no instalada o versión incorrecta.
- SSR: los Web Components solo corren en el cliente.

**Solución:**

1. `import "@tickean/checkout-elements"` (o el wrapper de `@tickean/react-checkout`) antes de usar los tags.
2. Confirmá que la dependencia está instalada: `npm ls @tickean/checkout-elements`.
3. En Next.js, marcá la página con `"use client"` o cargá Elements con `dynamic(..., { ssr: false })`.

## `?resume=` no rehidrata el wizard

**Síntoma:** Abrís el link del mail de abandono y el checkout arranca vacío / en entradas.

**Causas:**

- Elements &lt; **0.2.22** o checkout-js &lt; **0.2.11**.
- Código expirado, ya canjeado, o de otra organización.
- Origin del sitio no allowlisteado / publishable key incorrecta.
- La página del link no monta `<tickean-checkout>` (returnUrl distinta).

**Solución:**

1. Actualizá a `checkout-js@0.2.11` + `checkout-elements@0.2.22`.
2. Confirmá Network → `POST /v1/checkout/recovery/exchange` (200).
3. La `return_url` del shortcode debe ser la página donde vive el embed.
4. Ver [Reanudar sesión](./18-session-resume.md).

## Modo demo

Para desarrollo sin backend, activá `demo: true` en el client o el atributo `demo` en Web Components. Acepta OTP `123456` y simula transferencias sin credenciales reales.
