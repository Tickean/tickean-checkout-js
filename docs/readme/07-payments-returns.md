# Pagos y retornos seguros

## Transferencia

`createPayment` con `TRANSFER` devuelve las instrucciones bancarias para la compra de la sesión.

En el wizard Elements:

![Selección de método de pago](https://d1eg24w7igwib6.cloudfront.net/4.wizar_select_payment.png)

![Pago pendiente](https://d1eg24w7igwib6.cloudfront.net/5.wizard_pending_payment.png)

![Detalle de transferencia (alias / CVU / importe)](https://d1eg24w7igwib6.cloudfront.net/6.wizard_transfers_details.png)

## Pago online (Mercado Pago / Stripe)

1. Creá la intención de pago mediante `/v1/checkout/payments`
2. Redirigí al comprador a la URL del proveedor
3. El proveedor vuelve primero a **Tickean**
4. Tickean redirige únicamente al `returnUrl` de la sesión, cuyo origen fue autorizado y firmado al crearla

Nunca aceptes URLs de redirección arbitrarias enviadas por el navegador después del pago.

## Estado

`watchPayment` combina:
1. **Socket** (`payment:process` / `payment:confirmed` sobre `shoppingCartReference`, igual que ecommerce)
2. **Polling autenticado** (`GET /v1/checkout/payments/status`) como fallback

El wizard Elements arranca este watcher automáticamente tras un pago `TRANSFER`.

## Recovery tras abandono

Si el comprador eligió método / inició pago y se fue, el link `?resume=` puede reabrir el wizard en el paso de pago o instrucciones. Ver [Reanudar sesión](./18-session-resume.md) y [Flujo del wizard](./23-wizard-flow.md).
