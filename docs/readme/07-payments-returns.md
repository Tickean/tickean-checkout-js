# Pagos y retornos seguros

## Transferencia

`createPayment` con `TRANSFER` devuelve las instrucciones bancarias para la compra de la sesión.

## Pago online (Mercado Pago / Stripe)

1. Creá la intención de pago mediante `/v1/checkout/payments`
2. Redirigí al comprador a la URL del proveedor
3. El proveedor vuelve primero a **Tickean**
4. Tickean redirige únicamente al `returnUrl` de la sesión, cuyo origen fue autorizado y firmado al crearla

Nunca aceptes URLs de redirección arbitrarias enviadas por el navegador después del pago.

## Estado

La v1 usa consultas autenticadas (`getPaymentStatus` o `watchPayment` con espera progresiva). No dependas del socket público legado identificado únicamente por `shoppingCartReference`.
