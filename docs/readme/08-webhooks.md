# Webhooks

Registrá endpoints mediante la API autenticada de integraciones. Eventos predeterminados:

- `checkout.completed`
- `payment.failed`
- `tickets.issued`

El contrato de firma usa HMAC-SHA256 sobre `{timestamp}.{rawBody}` con el secreto del webhook, que se muestra una sola vez. El receptor debe comparar la firma en tiempo constante y rechazar marcas de tiempo antiguas.

> **Disponibilidad:** el registro de endpoints y la generación de secretos están disponibles. La entrega de eventos, los reintentos y su auditoría todavía no están habilitados en la versión piloto. Por ahora, no dependas de webhooks para confirmar pagos; usá consultas autenticadas del estado.
