# WordPress + Tickean Elements

Integrá el checkout white-label de Tickean en WordPress con Web Components (`<tickean-checkout>`). No requiere React ni un plugin de marketplace: un bloque HTML o un shortcode es suficiente.

**Drop-in:** un solo `<tickean-checkout>` monta un checkout **por pasos** (Entradas → Tus datos → Pago → Listo), estilo Stripe. No hace falta componer child elements ni escribir JS de wizard.

## Vista previa

![Entradas](https://d1eg24w7igwib6.cloudfront.net/1.wizard.png)

![Pago / transferencia](https://d1eg24w7igwib6.cloudfront.net/6.wizard_transfers_details.png)

Guía ilustrada: [Flujo del wizard](./23-wizard-flow.md).

## Requisitos

1. Entitlement **Custom Checkout** habilitado en la organización (Dashboard Tickean).
2. Clave publicable `pk_test_…` (pruebas) o `pk_live_…` (producción).
3. Origen exacto del sitio en el allowlist (Dashboard → Headless Checkout), por ejemplo:
   - `https://tusitio.com`
   - `https://www.tusitio.com`
4. Slug del evento a vender (`event-slug`).

Ver [Claves y dominios](./03-keys-and-domains.md).

## Cómo cargar el SDK

Tickean Elements se publica en npm como ESM. En WordPress, la vía recomendada es **CDN** (jsDelivr).

Usá **checkout-js ≥ 0.2.11** y **Elements ≥ 0.2.22** (wizard + recovery `?resume=`).

### WordPress 6.5+ (recomendado)

Registrá los paquetes con `wp_register_script_module` para que entren al **único** importmap de WP. Un segundo `<script type="importmap">` lo ignora el browser y rompe los imports bare (`@tickean/checkout-js`).

Ver el mu-plugin completo en [`examples/recipes/wordpress.md`](../../examples/recipes/wordpress.md).

### CDN + importmap manual

Solo si no usás script modules de WP (o un tema muy viejo):

```html
<script type="importmap">
{
  "imports": {
    "@tickean/checkout-js": "https://cdn.jsdelivr.net/npm/@tickean/checkout-js@0.2.11/dist/index.mjs",
    "@tickean/checkout-elements": "https://cdn.jsdelivr.net/npm/@tickean/checkout-elements@0.2.22/dist/index.mjs"
  }
}
</script>
<script type="module">
  import "@tickean/checkout-elements";
</script>
```

Fijá la versión en producción. Podés usar `unpkg.com` con la misma ruta de paquete.

### Self-host (opcional)

1. `npm install @tickean/checkout-js@0.2.11 @tickean/checkout-elements@0.2.22` y tomá `node_modules/@tickean/*/dist/index.mjs`.
2. Subí los `.mjs` a `/wp-content/uploads/tickean/` o a los assets del tema.
3. Apuntá el importmap / `wp_register_script_module` a esas URLs HTTPS absolutas.

## Opción 1 — Bloque HTML personalizado

En Gutenberg: **+ → HTML personalizado**. Pegá:

```html
<script type="importmap">
{
  "imports": {
    "@tickean/checkout-js": "https://cdn.jsdelivr.net/npm/@tickean/checkout-js@0.2.11/dist/index.mjs",
    "@tickean/checkout-elements": "https://cdn.jsdelivr.net/npm/@tickean/checkout-elements@0.2.22/dist/index.mjs"
  }
}
</script>
<script type="module">
  import "@tickean/checkout-elements";
</script>

<tickean-checkout
  publishable-key="pk_test_..."
  event-slug="demo-festival"
  api-base-url="https://api.tickean.com"
  locale="es-AR"
  appearance="flat"
  payment-method="TRANSFER"
  currency="ARS"
></tickean-checkout>
```

Reemplazá la clave y el slug. En producción usá `pk_live_…` y el origen HTTPS del sitio.

## Opción 2 — Shortcode `[tickean_checkout]`

Agregá el snippet PHP de [`examples/recipes/wordpress.md`](../../examples/recipes/wordpress.md) en:

- el `functions.php` del **tema hijo**, o
- un **mu-plugin** (`wp-content/mu-plugins/tickean-checkout.php`).

Luego, en cualquier página o entrada:

```
[tickean_checkout event_slug="demo-festival" locale="es-AR" appearance="flat"]
```

### Atributos del shortcode

| Atributo | Default | Descripción |
|----------|---------|-------------|
| `publishable_key` | constante `TICKEAN_PUBLISHABLE_KEY` | Clave `pk_test_` / `pk_live_` |
| `event_slug` | *(obligatorio)* | Slug del evento |
| `locale` | `es-AR` | `es-AR`, `es-CL` o `en` |
| `appearance` | `default` | `default`, `flat`, `night`, `none` o JSON |
| `layout` | `steps` | `steps` (wizard) o `stacked` (todo a la vez) |
| `api_base_url` | `https://api.tickean.com` | Base de la API pública |
| `payment_method` | `TRANSFER` | Método inicial del Elements |
| `currency` | `ARS` | Moneda del checkout |
| `return_url` | URL actual | Página de retorno post-pago **y** base del link de recovery |

Definí la clave fuera del editor:

```php
// wp-config.php o mu-plugin
define('TICKEAN_PUBLISHABLE_KEY', 'pk_test_...');
```

## Checkout por pasos (default)

`<tickean-checkout>` usa `layout="steps"` por defecto:

1. **Entradas** — catálogo + descuento; Continuar con carrito no vacío
2. **Tus datos** — teléfono / OTP; Continuar cuando el buyer está verificado
3. **Pago** — resumen + confirmar compra / instrucciones PSP
4. **Listo** — confirmación al completar (`phase === "completed"`)

Escape hatch:

```
[tickean_checkout event_slug="mi-evento" layout="stacked"]
```

## Recovery (carrito abandonado)

Si alguien deja el wizard a medias (entradas + teléfono verificado, pago no completado), Tickean puede enviar mail/SMS con un link a **esta misma página**:

```
https://tusitio.com/tu-pagina/?resume=CODE
```

El shortcode ya setea `return-url` a la URL actual. Elements (≥ 0.2.22) lee `?resume=`, rehidrata carrito/buyer/purchase y salta al paso correcto.

Detalle: [Reanudar sesión](./18-session-resume.md).

## Appearance y locale

- Temas: `default`, `flat`, `night`, `none`.
- Variables CSS: [Appearance API](./15-appearance-api.md).
- Locales: `es-AR`, `es-CL`, `en`.

```
[tickean_checkout event_slug="mi-evento" appearance="flat" locale="es-CL"]
```

## Eventos DOM

```js
document.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector("tickean-checkout");
  if (!el) return;
  el.addEventListener("ready", () => {/* checkout listo */});
  el.addEventListener("change", (e) => {/* e.detail.state.phase */});
  el.addEventListener("complete", () => {/* compra completa */});
  el.addEventListener("error", (e) => {/* e.detail */});
});
```

## Página de retorno

Si el PSP redirige (Mercado Pago, etc.):

1. Creá una página WP, por ejemplo `/checkout/retorno/`.
2. Pasá `return_url="https://tusitio.com/checkout/retorno/"` en el shortcode o atributo del elemento.
3. El origen de esa URL debe coincidir con el dominio allowlisteado.

Para recovery por abandono, la `return_url` debe ser la página donde está montado el checkout (default del shortcode).

Ver [Pagos y retornos](./07-payments-returns.md) y [Reanudar sesión](./18-session-resume.md).

## CSP, caché y builders

### Content Security Policy

Si tu hosting o un plugin de seguridad envía CSP, permití la API y los PSPs que uses. Guía: [CSP](./17-csp-and-security-headers.md).

Mínimo para Tickean con CDN:

```
connect-src https://api.tickean.com;
script-src 'self' https://cdn.jsdelivr.net;
```

### WP Rocket / LiteSpeed / Autoptimize

- Excluí los módulos ESM de Tickean de minificación y defer/combine agresivos.
- No combines el `importmap` con otros scripts.
- Si el checkout no aparece tras activar caché, purgá y probá en ventana privada.

### Elementor / Divi / builders

- Preferí un shortcode en un widget HTML / Shortcode.
- Evitá anidar el checkout dentro de iframes del builder.
- Confirmá que el script `type="module"` se imprima en el front (no solo en el preview del editor).

## Checklist go-live

1. Origen HTTPS exacto en el allowlist.
2. `pk_live_…` solo en producción (nunca en repos públicos).
3. Compra de prueba completa: entradas → OTP → pago → retorno / instrucciones.
4. **checkout-js ≥ 0.2.11** y **Elements ≥ 0.2.22**.
5. Probar un link `?resume=` de recovery (abandonar tras OTP y esperar el mail/SMS, o usar un code de prueba interno).
6. CSP y plugins de caché validados.
7. Webhooks configurados si tu integración los requiere ([Webhooks](./08-webhooks.md)).

## Troubleshooting

| Síntoma | Qué revisar |
|---------|-------------|
| El shortcode se ve como texto | El snippet PHP no está cargado (tema hijo / mu-plugin). |
| Consola: CORS / origin not allowed | Dominio exacto en Dashboard (con `https://`, sin path). |
| Consola: failed to resolve module | URLs del importmap / script modules, o segundo importmap ignorado. |
| Se queda en “Cargando checkout…” | Elements &lt; 0.2.1, o clave/event/entitlement inválidos. |
| Checkout vacío | Clave inválida, entitlement deshabilitado, o `event_slug` incorrecto. |
| `?resume=` no rehidrata | Elements &lt; 0.2.22, code expirado/usado, o origin no allowlisteado. |
| Funciona en local y no en prod | Caché, CSP, o `pk_test` contra dominio live. |
| OTP / quote falla | [Troubleshooting general](./19-troubleshooting.md). |

## Siguiente paso

Snippet PHP completo: [`examples/recipes/wordpress.md`](../../examples/recipes/wordpress.md).

Otros stacks: [Recetas por framework](./21-recipes-frameworks.md).
