# Estados y nextAction

## Fases del controller

`initializing → browsing → quoting → verifying_buyer → ready_to_purchase → purchasing → requires_action → processing → completed | failed | expired`

## nextAction

La API de pagos y `payments/status` devuelven un `nextAction` discriminado:

| type | UX |
|------|----|
| `display_instructions` | Mostrar datos de transferencia |
| `redirect` | Redirigir a Mercado Pago u otro hosted |
| `stripe_elements` | Montar Stripe Payment Element con `clientSecret` |
| `airwallex_dropin` | Montar Airwallex Drop-in |
| `dlocal_fields` | Montar dLocal Smart Fields + `payments/confirm` |
| `fintoc_widget` | Montar widget Fintoc |
| `none` | Sin acción pendiente |

Los campos de tarjeta **nunca** pasan por Tickean: solo SDKs oficiales del PSP.
