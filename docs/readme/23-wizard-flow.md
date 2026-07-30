# Flujo del wizard (Elements)

`<tickean-checkout>` (y `<TickeanCheckout />` en React) monta un checkout **por pasos** con `layout="steps"` por defecto.

Pasos típicos:

1. Entradas  
2. Tus datos (comprador + OTP)  
3. Pago (método + confirmación)  
4. Instrucciones / pendiente (transferencia u otros `nextAction`)  
5. Listo

Versiones recomendadas: **`@tickean/checkout-js` ≥ 0.2.11** y **`@tickean/checkout-elements` ≥ 0.2.22**.

## 1. Entradas

El comprador elige cantidad por lote. El total se cotiza en servidor (`/v1/checkout/quote`). Con carrito no vacío puede continuar.

![Paso Entradas del wizard Tickean](https://d1eg24w7igwib6.cloudfront.net/1.wizard.png)

## 2. Tus datos

Se captura el contacto del comprador (teléfono E.164). Desde aquí también puede aplicar un código de descuento / unlock de lotes promo, según el evento.

![Paso Tus datos del wizard Tickean](https://d1eg24w7igwib6.cloudfront.net/2.wizar_client.png)

## 3. Verificación OTP

Tickean envía un código por WhatsApp o SMS. Tras `verify`, la sesión queda con buyer OTP-verificado (requerido para comprar).

![Verificación OTP en el wizard Tickean](https://d1eg24w7igwib6.cloudfront.net/3.wizar_otp.png)

## 4. Selección de método de pago

Con buyer verificado, el wizard muestra el resumen y los métodos disponibles del evento (p. ej. transferencia, Mercado Pago).

![Selección de método de pago](https://d1eg24w7igwib6.cloudfront.net/4.wizar_select_payment.png)

## 5. Pago pendiente

Si el PSP o la transferencia quedan en espera, el estado pasa a `requires_action` / `processing`. Elements puede hacer `watchPayment` (socket + polling).

![Estado de pago pendiente](https://d1eg24w7igwib6.cloudfront.net/5.wizard_pending_payment.png)

## 6. Detalle de transferencia

Con `TRANSFER`, `nextAction.type === "display_instructions"` muestra alias, CVU/CBU e importe. El comprador paga fuera del sitio; Tickean confirma cuando llega el acreditamiento.

![Instrucciones de transferencia](https://d1eg24w7igwib6.cloudfront.net/6.wizard_transfers_details.png)

## Abandono y reanudación

Si el comprador verificó el teléfono, tiene carrito y no terminó el pago, Tickean puede enviar un mail/SMS de recuperación con link a tu página:

```
https://tusitio.com/tu-pagina-de-checkout?resume=CODE
```

Elements lee `?resume=`, llama a `POST /v1/checkout/recovery/exchange`, rehidrata el wizard y limpia el parámetro de la URL.

Detalle: [Reanudar sesión](./18-session-resume.md).  
WordPress: [WordPress + Tickean Elements](./22-wordpress.md).

## Layout stacked

Para mostrar todo el flujo en una sola vista (sin stepper):

```html
<tickean-checkout layout="stacked" …></tickean-checkout>
```

```
[tickean_checkout event_slug="mi-evento" layout="stacked"]
```
