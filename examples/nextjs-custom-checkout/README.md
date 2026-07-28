# Next.js custom checkout demo

Demostración de los tres niveles de Tickean Checkout en Next.js App Router.

## Modos

| Modo | Descripción |
|------|-------------|
| `headless` (default) | UI custom con hooks (`useEvent`, `useCart`, etc.) |
| `composed` | Web Components sueltos vía wrappers React |
| `elements` | `<TickeanCheckout />` completo |

Cambiá el modo con:

- Query param: `http://localhost:3000/?mode=elements`
- Botones en la página
- Variable de entorno `NEXT_PUBLIC_TICKEAN_ELEMENTS=true` (equivale a `elements` si no hay `?mode=`)

## Variables de entorno

Copiá `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Default | Descripción |
|----------|---------|-------------|
| `NEXT_PUBLIC_TICKEAN_PUBLISHABLE_KEY` | `pk_test_demo` | Clave publicable |
| `NEXT_PUBLIC_TICKEAN_EVENT_SLUG` | `demo-festival` | Slug del evento |
| `NEXT_PUBLIC_TICKEAN_API_BASE_URL` | — | API base (omitir en demo) |
| `NEXT_PUBLIC_TICKEAN_DEMO` | `true` | Transport in-memory sin backend |
| `NEXT_PUBLIC_TICKEAN_ELEMENTS` | `false` | Si `true`, inicia en modo Elements |

## Ejecutar

Desde la raíz del monorepo:

```bash
npm install
npm run build
npm run example:dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## E2E

```bash
npm run test:e2e
```
