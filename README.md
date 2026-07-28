# Tickean Elements

SDK white-label para vender entradas dentro de cualquier web, con DX al nivel de Stripe Elements.

## Packages

| Package | Description |
|---------|-------------|
| [`@tickean/checkout-js`](./packages/checkout-js) | Cliente + CheckoutController (estado, persistencia, telemetría) |
| [`@tickean/checkout-elements`](./packages/checkout-elements) | Web Components con Appearance API e i18n |
| [`@tickean/react-checkout`](./packages/react-checkout) | Provider, hooks headless y wrappers React |
| [`examples/nextjs-custom-checkout`](./examples/nextjs-custom-checkout) | Demo Next.js |
| [`examples/vanilla-elements`](./examples/vanilla-elements) | Demo HTML |
| [`examples/playground`](./examples/playground) | Playground de Appearance/locale |

## Quick start (React Elements)

```bash
npm install @tickean/checkout-js @tickean/react-checkout @tickean/checkout-elements
```

```tsx
import { TickeanProvider, TickeanCheckout } from "@tickean/react-checkout";

export function App() {
  return (
    <TickeanProvider
      publishableKey={process.env.NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY!}
      eventSlug="demo-festival"
      locale="es-AR"
      appearance={{ theme: "flat" }}
      demo
    >
      <TickeanCheckout />
    </TickeanProvider>
  );
}
```

## Local

```bash
npm install
npm test
npm run example:dev
```

## Security model

- Solo publishable keys en el navegador
- Origins allowlisteados + CORS dinámico
- OTP obligatorio antes de comprar
- Totales recalculados en servidor (`expectedTotal`)
- `nextAction` tipado; datos de tarjeta solo en SDKs oficiales del PSP
- Return URLs firmadas vía sesión

## License

MIT — el SDK es open source. Custom Checkout / Elements es un entitlement pago.

## Documentación

Guías en [`docs/readme/`](./docs/readme/) (español, estilo ReadMe):

| Guía | Tema |
|------|------|
| [14-elements-quickstart](./docs/readme/14-elements-quickstart.md) | Elements en 10 minutos |
| [15-appearance-api](./docs/readme/15-appearance-api.md) | Appearance API |
| [16-states-and-next-action](./docs/readme/16-states-and-next-action.md) | Fases y `nextAction` |
| [17-csp-and-security-headers](./docs/readme/17-csp-and-security-headers.md) | CSP para PSPs |
| [18-session-resume](./docs/readme/18-session-resume.md) | Reanudar sesión |
| [19-troubleshooting](./docs/readme/19-troubleshooting.md) | CORS, OTP, idempotencia |
| [20-browser-support-and-semver](./docs/readme/20-browser-support-and-semver.md) | Navegadores y semver 0.x |
| [21-recipes-frameworks](./docs/readme/21-recipes-frameworks.md) | Next, Vite, Vue, Svelte |

OpenAPI v1.1: [`docs/readme/tickean-checkout-v1.openapi.json`](./docs/readme/tickean-checkout-v1.openapi.json)

## Release status

OpenAPI v1.1 y guías `00`–`21` están listas localmente. Publicación npm: `npx changeset publish` cuando el scope `@tickean` esté listo.
