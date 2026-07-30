# Puesta en producción

1. Habilitá Custom Checkout para la organización
2. Agregá los orígenes de producción al allowlist
3. Creá una clave `pk_live_…` y guardala en el gestor de secretos o variables de entorno
4. Configurá `apiBaseUrl` para producción (`https://api.tickean.com`)
5. Confirmá el estado del pago con autenticación; configurá webhooks si tu integración los requiere
6. Ejecutá una compra completa con un medio de pago real en modo de prueba
7. Confirmá que el retorno del PSP llegue a tu `returnUrl`
8. Monitoreá los `requestId` y las consultas del estado de pago

## Sandbox obligatorio por PSP

Antes de habilitar `pk_live`, validá en sandbox/test:

| Proveedor | Qué verificar |
|-----------|----------------|
| Transferencia | `nextAction.type = display_instructions` y confirmación operativa |
| Stripe | Elements inline + 3DS simulado + retorno |
| Airwallex | Drop-in monta y completa |
| dLocal | Smart Fields + `payments/confirm` si aplica |
| Fintoc | Widget + polling de estado |
| Mercado Pago | Redirect firmado + return URL + rehidratación |

Instalá siempre versiones publicadas desde npm (`@tickean/checkout-js@0.2.0`, `@tickean/react-checkout@0.2.0`, `@tickean/checkout-elements@0.2.0`).
