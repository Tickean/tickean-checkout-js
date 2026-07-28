# Navegadores y versionado

## Soporte de navegadores

Tickean Elements v0.2 apunta a **navegadores modernos** con soporte estable de:

- ES2020 (módulos ES, `async`/`await`, optional chaining)
- Custom Elements v1
- `sessionStorage`
- `fetch`

| Navegador | Versión mínima |
|-----------|----------------|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 15.4+ (iOS incluido) |
| Samsung Internet | 15+ |

No damos soporte oficial a Internet Explorer ni a navegadores sin Custom Elements.

## Bundles

| Package | Formato | Notas |
|---------|---------|-------|
| `@tickean/checkout-js` | ESM + CJS | Sin dependencias runtime |
| `@tickean/checkout-elements` | ESM + CJS | Side-effect: registra custom elements al importar |
| `@tickean/react-checkout` | ESM + CJS | Peer: React 18+ |

Los paquetes se publican sin polyfills. Si necesitás soportar navegadores más viejos, agregá polyfills en **tu** build (core-js, `@webcomponents/webcomponentsjs`).

### Tree-shaking

Importá solo lo que uses:

```ts
import { createTickean } from "@tickean/checkout-js";
import { TickeanProvider, useCart } from "@tickean/react-checkout";
```

`import "@tickean/checkout-elements"` registra todos los elementos; no hay registro parcial en v0.2.

### Tamaño orientativo (gzip)

Tras build de producción con bundler moderno:

- `checkout-js`: ~8–12 KB
- `checkout-elements`: ~15–22 KB (incluye estilos embebidos)
- `react-checkout`: ~3–5 KB (wrappers finos sobre elements)

Medí en tu app con `rollup-plugin-visualizer` o el analizador de tu framework.

## Política de semver (0.x)

Estamos en **0.x** mientras estabilizamos la API pública:

| Cambio | Versión |
|--------|---------|
| Breaking en tipos, hooks, atributos WC o contrato `/v1/checkout` | **minor** (`0.2` → `0.3`) |
| Features compatibles hacia atrás | **minor** |
| Bugfixes | **patch** (`0.2.0` → `0.2.1`) |

Al llegar a **1.0**, seguiremos [semver estricto](https://semver.org/): breaking solo en major.

### Qué consideramos estable en 0.2

- Endpoints documentados en OpenAPI v1.1
- Hooks `useEvent`, `useCart`, `useCheckout`, `usePayment`, `useBuyerVerification`
- Tags Web Components (`tickean-checkout`, `tickean-ticket-selector`, etc.)
- Códigos de error públicos (`checkout_*`)

### Qué puede cambiar antes de 1.0

- Nombres de eventos DOM custom
- Detalles internos de Appearance API
- Campos opcionales en respuestas de sesión

Suscribite al changelog del repo y revisá las release notes antes de actualizar en producción.
