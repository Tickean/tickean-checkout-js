# WordPress + Tickean Elements

Integrá el checkout white-label de Tickean en WordPress con **Web Components** (`<tickean-checkout>`). No hace falta React ni un plugin de marketplace: alcanza un bloque HTML o un shortcode.

## Requisitos

1. Entitlement **Custom Checkout** habilitado en la organización.
2. Clave publicable `pk_test_…` (pruebas) o `pk_live_…` (producción).
3. Origen exacto del sitio en el allowlist (Dashboard → Headless Checkout), por ejemplo:
   - `https://tusitio.com`
   - `https://www.tusitio.com`
4. Slug del evento a vender (`event-slug`).

Ver [Claves y dominios](./03-keys-and-domains.md).

## Cómo cargar el SDK

Tickean Elements es un módulo ESM. En WordPress podés cargarlo de dos formas:

### A) CDN (cuando `@tickean` esté publicado en npm)

```html
<script type="importmap">
{
  "imports": {
    "@tickean/checkout-js": "https://cdn.jsdelivr.net/npm/@tickean/checkout-js@0.2.0/dist/index.mjs",
    "@tickean/checkout-elements": "https://cdn.jsdelivr.net/npm/@tickean/checkout-elements@0.2.0/dist/index.mjs"
  }
}
</script>
<script type="module">
  import "@tickean/checkout-elements";
</script>
```

### B) Self-host (recomendado hoy)

1. Compilá los paquetes (`npm run build` en el monorepo) o descargá los `dist/`.
2. Subí `checkout-js/dist/index.mjs` y `checkout-elements/dist/index.mjs` a:
   - `/wp-content/uploads/tickean/`, o
   - `assets/tickean/` de tu tema hijo.
3. Apuntá el `importmap` a esas URLs absolutas HTTPS.

> No uses un `<script src>` clásico sin `type="module"`: el bundle es ESM.

## Opción 1 — Bloque HTML personalizado

En Gutenberg: **+ → HTML personalizado**. Pegá:

```html
<script type="importmap">
{
  "imports": {
    "@tickean/checkout-js": "https://tusitio.com/wp-content/uploads/tickean/checkout-js.mjs",
    "@tickean/checkout-elements": "https://tusitio.com/wp-content/uploads/tickean/checkout-elements.mjs"
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
  appearance='{"theme":"flat"}'
  payment-method="TRANSFER"
  currency="ARS"
></tickean-checkout>
```

Reemplazá la clave, el slug y las URLs de los `.mjs`. En producción usá `pk_live_…` y el origen HTTPS del sitio.

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
| `api_base_url` | `https://api.tickean.com` | Base de la API pública |
| `payment_method` | `TRANSFER` | Método inicial del Elements |
| `currency` | `ARS` | Moneda del checkout |
| `return_url` | URL actual | Página de retorno post-pago |

Definí la clave fuera del editor:

```php
// wp-config.php o mu-plugin
define('TICKEAN_PUBLISHABLE_KEY', 'pk_test_...');
```

## Appearance y locale

- Temas: `default`, `flat`, `night`, `none`.
- Variables CSS: ver [Appearance API](./15-appearance-api.md).
- Locales soportados: `es-AR`, `es-CL`, `en`.

Ejemplo con JSON en el shortcode (escapá comillas en el atributo o usá un tema simple):

```
[tickean_checkout event_slug="mi-evento" appearance="flat" locale="es-CL"]
```

## Eventos DOM

Podés escuchar el elemento desde un script del tema:

```js
document.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector("tickean-checkout");
  if (!el) return;
  el.addEventListener("ready", () => console.log("Tickean listo"));
  el.addEventListener("change", (e) => console.log(e.detail?.state?.phase));
  el.addEventListener("complete", () => console.log("Compra completa"));
  el.addEventListener("error", (e) => console.error(e.detail));
});
```

## Página de retorno

Si el PSP redirige (Mercado Pago, etc.):

1. Creá una página WP, por ejemplo `/checkout/retorno/`.
2. Pasá `return_url="https://tusitio.com/checkout/retorno/"` en el shortcode o atributo del elemento.
3. El origen de esa URL debe coincidir con el dominio allowlisteado.

Ver [Pagos y retornos](./07-payments-returns.md) y [Reanudar sesión](./18-session-resume.md).

## CSP, caché y builders

### Content Security Policy

Si tu hosting o un plugin de seguridad envía CSP, permití la API y los PSPs que uses. Guía completa: [CSP](./17-csp-and-security-headers.md).

Mínimo para Tickean:

```
connect-src https://api.tickean.com;
script-src 'self' https://cdn.jsdelivr.net; /* si usás CDN */
```

### WP Rocket / LiteSpeed / Autoptimize

- Excluí los `.mjs` de Tickean de **minificación** y **defer/combine** agresivos.
- No combines el `importmap` con otros scripts.
- Si el checkout no aparece tras activar caché, purgá y probá en ventana privada.

### Elementor / Divi / builders

- Preferí un shortcode en un widget HTML / Shortcode.
- Evitá anidar el checkout dentro de iframes del builder.
- Asegurate de que el script `type="module"` se imprima en el front (no solo en el preview del editor).

## Checklist go-live

1. Origen HTTPS exacto en el allowlist.
2. `pk_live_…` solo en producción (nunca en repos públicos).
3. Compra de prueba completa: catálogo → OTP → pago → retorno / instrucciones.
4. CSP y plugins de caché validados.
5. Webhooks configurados si el partner los necesita ([Webhooks](./08-webhooks.md)).

## Troubleshooting

| Síntoma | Qué revisar |
|---------|-------------|
| El shortcode se ve como texto | El snippet PHP no está cargado (tema hijo / mu-plugin). |
| Consola: CORS / origin not allowed | Dominio exacto en Dashboard (con `https://`, sin path). |
| Consola: failed to resolve module | URLs del `importmap` o self-host incorrectas. |
| Checkout vacío | Clave inválida, entitlement off, o `event_slug` mal escrito. |
| Funciona en local y no en prod | Caché, CSP, o `pk_test` contra dominio live. |
| OTP / quote falla | Ver [Troubleshooting general](./19-troubleshooting.md). |

## Siguiente paso

Snippet PHP completo: [`examples/recipes/wordpress.md`](../../examples/recipes/wordpress.md).

Para otros stacks: [Recetas por framework](./21-recipes-frameworks.md).
