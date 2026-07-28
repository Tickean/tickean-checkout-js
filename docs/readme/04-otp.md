# Verificación del comprador por OTP

Las compras requieren un comprador verificado dentro de la sesión de checkout.

1. Enviá el teléfono en formato E.164 a `POST /v1/checkout/otp/send`
2. El comprador recibe el código por WhatsApp o SMS
3. `POST /v1/checkout/otp/verify` vincula la identidad verificada con la sesión

Los límites de solicitudes se aplican por IP y clave. El cliente no debe crear un comprador arbitrario ni confiar en un indicador `verifiedOtp` del navegador: la verificación ocurre en el servidor.

El modo demo acepta el código `123456`.
