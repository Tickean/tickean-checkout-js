# WordPress — Tickean Elements (shortcode)

Snippet copy-paste para montar `<tickean-checkout>` con el shortcode `[tickean_checkout]`.

Guía completa: [`docs/readme/22-wordpress.md`](../../docs/readme/22-wordpress.md).

## 1. Subí los bundles ESM

Desde el monorepo Tickean (o cuando los paquetes estén en npm):

```bash
npm run build -w @tickean/checkout-js
npm run build -w @tickean/checkout-elements
```

Copiá a WordPress, por ejemplo:

```
wp-content/uploads/tickean/checkout-js.mjs          ← packages/checkout-js/dist/index.mjs
wp-content/uploads/tickean/checkout-elements.mjs    ← packages/checkout-elements/dist/index.mjs
```

Ajustá las constantes `TICKEAN_*_URL` del snippet si usás otra ruta o CDN.

## 2. Definí la clave publicable

En `wp-config.php` (antes de `That's all, stop editing!`):

```php
define('TICKEAN_PUBLISHABLE_KEY', 'pk_test_...');
```

## 3. Pegá el mu-plugin

Creá `wp-content/mu-plugins/tickean-checkout.php` (o agregalo al `functions.php` del tema hijo):

```php
<?php
/**
 * Plugin Name: Tickean Checkout Shortcode
 * Description: Shortcode [tickean_checkout] para Tickean Elements (Web Components).
 */

if (!defined('ABSPATH')) {
  exit;
}

if (!defined('TICKEAN_CHECKOUT_JS_URL')) {
  define('TICKEAN_CHECKOUT_JS_URL', content_url('uploads/tickean/checkout-js.mjs'));
}
if (!defined('TICKEAN_CHECKOUT_ELEMENTS_URL')) {
  define('TICKEAN_CHECKOUT_ELEMENTS_URL', content_url('uploads/tickean/checkout-elements.mjs'));
}

/**
 * Shortcode: [tickean_checkout event_slug="mi-evento" locale="es-AR" appearance="flat"]
 *
 * Atributos opcionales: publishable_key, api_base_url, payment_method, currency, return_url.
 */
function tickean_checkout_shortcode($atts) {
  $a = shortcode_atts([
    'publishable_key' => defined('TICKEAN_PUBLISHABLE_KEY') ? TICKEAN_PUBLISHABLE_KEY : '',
    'event_slug' => '',
    'locale' => 'es-AR',
    'appearance' => 'default',
    'api_base_url' => 'https://api.tickean.com',
    'payment_method' => 'TRANSFER',
    'currency' => 'ARS',
    'return_url' => '',
  ], $atts, 'tickean_checkout');

  if ($a['event_slug'] === '') {
    return '<!-- tickean_checkout: falta event_slug -->';
  }
  if ($a['publishable_key'] === '') {
    return '<!-- tickean_checkout: falta publishable_key / TICKEAN_PUBLISHABLE_KEY -->';
  }

  // Encola el módulo ESM una sola vez por request.
  static $assets_printed = false;
  if (!$assets_printed) {
    $assets_printed = true;
    add_action('wp_footer', 'tickean_checkout_print_module_assets', 5);
  }

  $return_url = $a['return_url'] !== ''
    ? $a['return_url']
    : home_url(add_query_arg([]));

  $attrs = [
    'publishable-key' => $a['publishable_key'],
    'event-slug' => $a['event_slug'],
    'locale' => $a['locale'],
    'appearance' => $a['appearance'],
    'api-base-url' => $a['api_base_url'],
    'payment-method' => $a['payment_method'],
    'currency' => $a['currency'],
    'return-url' => $return_url,
  ];

  $html_attrs = '';
  foreach ($attrs as $name => $value) {
    $html_attrs .= sprintf(' %s="%s"', esc_attr($name), esc_attr($value));
  }

  return '<div class="tickean-checkout-wrap"><tickean-checkout' . $html_attrs . '></tickean-checkout></div>';
}
add_shortcode('tickean_checkout', 'tickean_checkout_shortcode');

/**
 * Imprime importmap + type=module en el footer (más fiable que wp_enqueue_script para ESM).
 */
function tickean_checkout_print_module_assets() {
  $js_url = esc_url(TICKEAN_CHECKOUT_JS_URL);
  $el_url = esc_url(TICKEAN_CHECKOUT_ELEMENTS_URL);
  $map = wp_json_encode([
    'imports' => [
      '@tickean/checkout-js' => TICKEAN_CHECKOUT_JS_URL,
      '@tickean/checkout-elements' => TICKEAN_CHECKOUT_ELEMENTS_URL,
    ],
  ], JSON_UNESCAPED_SLASHES);
  ?>
  <script type="importmap"><?php echo $map; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></script>
  <script type="module" src="<?php echo $el_url; ?>"></script>
  <?php
}
```

> Si el shortcode se renderiza en un widget o page builder y el custom element aparece vacío, confirmá que `wp_footer` corre en esa plantilla. Alternativa: [bloque HTML personalizado](../../docs/readme/22-wordpress.md#opción-1--bloque-html-personalizado).

## 4. Usalo en una página

```
[tickean_checkout event_slug="demo-festival" locale="es-AR" appearance="flat"]
```

Con retorno explícito:

```
[tickean_checkout event_slug="demo-festival" return_url="https://tusitio.com/checkout/retorno/"]
```

Override puntual de la clave (solo si no usás la constante):

```
[tickean_checkout event_slug="demo-festival" publishable_key="pk_test_..."]
```

## Variante HTML (sin shortcode)

Si preferís no tocar PHP, usá el bloque HTML personalizado de la [guía 22](../../docs/readme/22-wordpress.md).

## Variante composable (avanzado)

Para layouts propios, montá tags sueltos en el HTML del tema (después de cargar el módulo):

```html
<script type="module">
  import "@tickean/checkout-elements";
</script>
<tickean-ticket-selector></tickean-ticket-selector>
<tickean-discount></tickean-discount>
<tickean-buyer-verification></tickean-buyer-verification>
<tickean-order-summary></tickean-order-summary>
<tickean-payment payment-method="TRANSFER" currency="ARS"></tickean-payment>
```

En producción, preferí un solo `<tickean-checkout>` (comparte controller y estado). Ver [Elements quickstart](../../docs/readme/14-elements-quickstart.md).

## Checklist rápido

1. Dominio allowlisteado en Dashboard.
2. Bundles `.mjs` accesibles por HTTPS.
3. `TICKEAN_PUBLISHABLE_KEY` definida.
4. Shortcode con `event_slug` válido.
5. Excluí los `.mjs` de minificación/combine en plugins de caché.
