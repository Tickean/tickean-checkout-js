# Webhooks

Registrá endpoints mediante la API autenticada de integraciones. Eventos predeterminados:

- `checkout.completed`
- `payment.failed`
- `tickets.issued`

El contrato de firma usa HMAC-SHA256 sobre `{timestamp}.{rawBody}` con el secreto del webhook, que se muestra una sola vez. El receptor debe comparar la firma en tiempo constante y rechazar marcas de tiempo antiguas.

La fuente de verdad del pago es siempre la consulta autenticada de estado. Usá webhooks como señal asíncrona y reconciliá con esa consulta antes de marcar una compra como completa.
