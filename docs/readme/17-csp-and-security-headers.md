# CSP y security headers

Tickean Elements carga scripts de terceros cuando el PSP lo requiere (`nextAction`). Tu Content Security Policy debe permitir esos orígenes además de la API de Tickean.

## Directivas mínimas recomendadas

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://js.stripe.com https://checkout.airwallex.com https://js.dlocal.com https://js.fintoc.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.airwallex.com https://js.fintoc.com;
  connect-src 'self' https://api.tickean.com https://api.stripe.com https://api.airwallex.com https://api.dlocal.com https://api.fintoc.com;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
```

Ajustá `connect-src` si usás un `apiBaseUrl` distinto (staging, región, etc.).

## Por proveedor

| PSP | `script-src` | `frame-src` | `connect-src` |
|-----|--------------|-------------|---------------|
| Stripe | `https://js.stripe.com` | `https://js.stripe.com` `https://hooks.stripe.com` | `https://api.stripe.com` |
| Airwallex | `https://checkout.airwallex.com` | `https://checkout.airwallex.com` | `https://api.airwallex.com` |
| dLocal | `https://js.dlocal.com` | (según widget) | `https://api.dlocal.com` |
| Fintoc | `https://js.fintoc.com` | `https://js.fintoc.com` | `https://api.fintoc.com` |

Consultá la documentación oficial de cada PSP antes de ir a producción: los dominios pueden variar por entorno (sandbox vs live).

## Tickean API

Todas las llamadas del SDK van a tu `apiBaseUrl` (por defecto `https://api.tickean.com`). Incluí ese origen en `connect-src`.

El navegador también envía el encabezado `Origin` en cada request; debe coincidir con un origen autorizado en Dashboard → Headless Checkout.

## Otros headers

| Header | Recomendación |
|--------|---------------|
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `SAMEORIGIN` (no embebas checkout en iframes ajenos) |
| `Permissions-Policy` | Restringí cámara/micrófono si no los usás |

## Modo report-only

Durante la integración podés empezar con `Content-Security-Policy-Report-Only` y revisar violaciones en consola antes de aplicar la política estricta.

## Lo que Tickean no controla

Los mount points de Stripe/Airwallex/dLocal/Fintoc los gestiona el SDK oficial del proveedor. Tickean solo reserva el contenedor DOM; tu CSP debe cubrir los scripts y frames que ese SDK inyecte.
