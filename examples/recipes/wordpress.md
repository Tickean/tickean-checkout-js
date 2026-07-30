# WordPress — Tickean Elements (shortcode)

Snippet copy-paste para montar `<tickean-checkout>` con el shortcode `[tickean_checkout]`.

El element trae un **checkout por pasos** listo para usar (Entradas → Datos → Pago → Listo). No hace falta orquestar child elements ni escribir JS de wizard.

![Wizard — entradas](https://d1eg24w7igwib6.cloudfront.net/1.wizard.png)

Guía completa: [`docs/readme/22-wordpress.md`](../../docs/readme/22-wordpress.md).  
Flujo ilustrado: [`docs/readme/23-wizard-flow.md`](../../docs/readme/23-wizard-flow.md).

## 1. Definí la clave publicable

En `wp-config.php` (antes de `That's all, stop editing!`):

```php
define('TICKEAN_PUBLISHABLE_KEY', 'pk_test_...');
```

## 2. Pegá el mu-plugin

Creá `wp-content/mu-plugins/tickean-checkout.php` (o agregalo al `functions.php` del tema hijo).

Por defecto carga los bundles desde **jsDelivr** (`@tickean/checkout-js` **0.2.11** y `@tickean/checkout-elements` **0.2.22**). Preferí WordPress 6.5+ `wp_register_script_module` para fusionar el importmap (un segundo `<script type="importmap">` lo ignora el browser).

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
  define(
    'TICKEAN_CHECKOUT_JS_URL',
    'https://cdn.jsdelivr.net/npm/@tickean/checkout-js@0.2.11/dist/index.mjs'
  );
}
if (!defined('TICKEAN_CHECKOUT_ELEMENTS_URL')) {
  define(
    'TICKEAN_CHECKOUT_ELEMENTS_URL',
    'https://cdn.jsdelivr.net/npm/@tickean/checkout-elements@0.2.22/dist/index.mjs'
  );
}

/**
 * Register packages into WordPress' single importmap (WP 6.5+).
 */
function tickean_checkout_register_modules() {
  if (!function_exists('wp_register_script_module')) {
    return;
  }

  wp_register_script_module(
    '@tickean/checkout-js',
    TICKEAN_CHECKOUT_JS_URL,
    array(),
    '0.2.11'
  );

  wp_register_script_module(
    '@tickean/checkout-elements',
    TICKEAN_CHECKOUT_ELEMENTS_URL,
    array('@tickean/checkout-js'),
    '0.2.22'
  );
}
add_action('init', 'tickean_checkout_register_modules');

/**
 * Shortcode: [tickean_checkout event_slug="mi-evento" locale="es-AR" appearance="flat"]
 *
 * Drop-in: <tickean-checkout> usa layout="steps" por defecto.
 * Opcional: layout="stacked" para el layout clásico todo-en-uno.
 *
 * Atributos: publishable_key, api_base_url, payment_method, currency, return_url, layout.
 */
function tickean_checkout_shortcode($atts) {
  $a = shortcode_atts([
    'publishable_key' => defined('TICKEAN_PUBLISHABLE_KEY') ? TICKEAN_PUBLISHABLE_KEY : '',
    'event_slug' => '',
    'locale' => 'es-AR',
    'appearance' => 'default',
    'layout' => 'steps',
    'api_base_url' => 'https://api.tickean.com',
    'payment_method' => 'TRANSFER',
    'currency' => 'ARS',
    'return_url' => '',
  ], $atts, 'tickean_checkout');

  if ($a['event_slug'] === '' || $a['publishable_key'] === '') {
    return '';
  }

  if (function_exists('wp_enqueue_script_module')) {
    wp_enqueue_script_module('@tickean/checkout-elements');
  } else {
    static $fallback = false;
    if (!$fallback) {
      $fallback = true;
      add_action('wp_footer', static function () {
        echo '<script type="module" src="' . esc_url(TICKEAN_CHECKOUT_ELEMENTS_URL) . '"></script>' . "\n";
      }, 5);
    }
  }

  $return_url = $a['return_url'] !== ''
    ? $a['return_url']
    : home_url(add_query_arg([]));

  $attrs = [
    'publishable-key' => $a['publishable_key'],
    'event-slug' => $a['event_slug'],
    'locale' => $a['locale'],
    'appearance' => $a['appearance'],
    'layout' => $a['layout'],
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
```

### Self-host (opcional)

```php
define('TICKEAN_CHECKOUT_JS_URL', content_url('uploads/tickean/checkout-js.mjs'));
define('TICKEAN_CHECKOUT_ELEMENTS_URL', content_url('uploads/tickean/checkout-elements.mjs'));
```

Obtené los archivos desde `node_modules/@tickean/*/dist/index.mjs` tras `npm install @tickean/checkout-js@0.2.11 @tickean/checkout-elements@0.2.22`.

## 3. Usalo en una página

```
[tickean_checkout event_slug="demo-festival" locale="es-AR" appearance="flat"]
```

Con retorno explícito:

```
[tickean_checkout event_slug="demo-festival" return_url="https://tusitio.com/checkout/retorno/"]
```

Layout clásico (todo visible a la vez):

```
[tickean_checkout event_slug="demo-festival" layout="stacked"]
```

## Variante HTML (sin shortcode)

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
  locale="es-AR"
  appearance="flat"
></tickean-checkout>
```

En WordPress 6.5+, preferí `wp_register_script_module` (como en el mu-plugin) en lugar de un segundo importmap manual.

## Variante composable (avanzada)

Para layouts propios con child elements + `createCheckoutController` / `attachController`. En la mayoría de los casos preferí un solo `<tickean-checkout>`. Ver [Elements quickstart](../../docs/readme/14-elements-quickstart.md).

## Checklist

1. Dominio allowlisteado en Dashboard.
2. Bundles ESM accesibles por HTTPS (CDN o self-host). **checkout-js ≥ 0.2.11** y **Elements ≥ 0.2.22** (wizard + `?resume=`).
3. `TICKEAN_PUBLISHABLE_KEY` definida.
4. Shortcode con `event_slug` válido (`return_url` default = página actual, base del recovery).
5. Excluí los módulos ESM de minificación/combine en plugins de caché.

Capturas del flujo: [`docs/readme/23-wizard-flow.md`](../../docs/readme/23-wizard-flow.md).
