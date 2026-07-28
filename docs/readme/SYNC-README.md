# ReadMe sync (do not commit API keys)

The Headless Checkout guides and OpenAPI contract were published to ReadMe on 2026-07-28. Re-run the sync after contract or guide changes.

## Guides (00–21)

| # | File | Topic |
|---|------|-------|
| 00 | `00-overview.md` | Visión general, paquetes, tres niveles |
| 01 | `01-quickstart-js.md` | Inicio rápido JavaScript |
| 02 | `02-quickstart-react.md` | Inicio rápido React headless |
| 03 | `03-keys-and-domains.md` | Claves y dominios |
| 04 | `04-otp.md` | Verificación OTP |
| 05 | `05-cart-quote.md` | Carrito y cotización |
| 06 | `06-promotions.md` | Promociones |
| 07 | `07-payments-returns.md` | Pagos y retornos |
| 08 | `08-webhooks.md` | Webhooks |
| 09 | `09-errors.md` | Errores |
| 10 | `10-security.md` | Checklist de seguridad |
| 11 | `11-accessibility.md` | Accesibilidad |
| 12 | `12-go-live.md` | Go-live |
| 13 | `13-migration-from-iframe.md` | Migración desde iframe |
| 14 | `14-elements-quickstart.md` | Elements quickstart |
| 15 | `15-appearance-api.md` | Appearance API |
| 16 | `16-states-and-next-action.md` | Estados y nextAction |
| 17 | `17-csp-and-security-headers.md` | CSP y security headers |
| 18 | `18-session-resume.md` | Reanudar sesión |
| 19 | `19-troubleshooting.md` | Solución de problemas |
| 20 | `20-browser-support-and-semver.md` | Navegadores y semver 0.x |
| 21 | `21-recipes-frameworks.md` | Recetas por framework |

## OpenAPI

Contract file: `docs/readme/tickean-checkout-v1.openapi.json` (**v1.1** — Elements, session resume, nextAction).

```bash
# From tickean-core-server (canonical export)
node scripts/export-checkout-openapi.js
rdme openapi docs/openapi/tickean-checkout-v1.json --key="$README_API_KEY" --version=1.1

# From tickean-checkout-js (local copy)
rdme openapi docs/readme/tickean-checkout-v1.openapi.json --key="$README_API_KEY" --version=1.1

# Upload each guide
for f in docs/readme/[0-9]*.md; do
  echo "Prepare guide: $f"
  # rdme docs "$f" --key="$README_API_KEY" --version=1.1
done
```

Set `README_API_KEY` in your shell environment only. Never commit it.
