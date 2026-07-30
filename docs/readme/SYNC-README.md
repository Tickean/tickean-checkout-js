# ReadMe sync (do not commit API keys)

The Headless Checkout guides and OpenAPI contract sync to ReadMe via API v2 (`branch` **1.0**, category **SDK de Headless Checkout**).

## Guides (00–22)

| # | File | ReadMe slug | Topic |
|---|------|-------------|-------|
| 00 | `00-overview.md` | `headless-checkout-overview` | Visión general, paquetes, tres niveles |
| 01 | `01-quickstart-js.md` | `headless-checkout-quickstart-js` | Inicio rápido JavaScript |
| 02 | `02-quickstart-react.md` | `headless-checkout-quickstart-react` | Inicio rápido React headless |
| 03 | `03-keys-and-domains.md` | `headless-checkout-keys-domains` | Claves y dominios |
| 04 | `04-otp.md` | `headless-checkout-otp` | Verificación OTP |
| 05 | `05-cart-quote.md` | `headless-checkout-cart-quote` | Carrito y cotización |
| 06 | `06-promotions.md` | `headless-checkout-promotions` | Promociones |
| 07 | `07-payments-returns.md` | `headless-checkout-payments-returns` | Pagos y retornos |
| 08 | `08-webhooks.md` | `headless-checkout-webhooks` | Webhooks |
| 09 | `09-errors.md` | `headless-checkout-errors` | Errores |
| 10 | `10-security.md` | `headless-checkout-security` | Checklist de seguridad |
| 11 | `11-accessibility.md` | `headless-checkout-accessibility` | Accesibilidad |
| 12 | `12-go-live.md` | `headless-checkout-go-live` | Go-live |
| 13 | `13-migration-from-iframe.md` | `headless-checkout-migrate-iframe` | Migración desde iframe |
| 14 | `14-elements-quickstart.md` | `headless-checkout-elements-quickstart` | Elements quickstart |
| 15 | `15-appearance-api.md` | `headless-checkout-appearance-api` | Appearance API |
| 16 | `16-states-and-next-action.md` | `headless-checkout-states-next-action` | Estados y nextAction |
| 17 | `17-csp-and-security-headers.md` | `headless-checkout-csp-security-headers` | CSP y security headers |
| 18 | `18-session-resume.md` | `headless-checkout-session-resume` | Reanudar sesión |
| 19 | `19-troubleshooting.md` | `headless-checkout-troubleshooting` | Solución de problemas |
| 20 | `20-browser-support-and-semver.md` | `headless-checkout-browser-semver` | Navegadores y semver 0.x |
| 21 | `21-recipes-frameworks.md` | `headless-checkout-recipes-frameworks` | Recetas por framework |
| 22 | `22-wordpress.md` | `headless-checkout-wordpress` | WordPress (Elements / shortcode) |

Public docs: https://docs.tickean.com

## Sync command

```bash
export README_API_KEY='…'   # ReadMe → Configuration → API Key; never commit
cd tickean-checkout-js
python3 scripts/sync-readme-guides.py
# optional:
python3 scripts/sync-readme-guides.py --verify-only
python3 scripts/sync-readme-guides.py --skip-openapi
```

The script:

- Upserts guides `00`–`22` into category **SDK de Headless Checkout**
- Rewrites local `./NN-….md` links to `/docs/{slug}` and recipe links to GitHub
- Uploads `tickean-checkout-v1.openapi.json` as `tickean-checkout-v1.json` (rewrites JSON Schema `const` → `enum` for ReadMe’s validator)

## OpenAPI (canonical export)

```bash
# From tickean-core-server
node scripts/export-checkout-openapi.js
# Then copy/sync into tickean-checkout-js/docs/readme/ and re-run sync-readme-guides.py
```

Set `README_API_KEY` in your shell environment only. Never commit it.
