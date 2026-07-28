# Puesta en producción

1. Habilitá `customCheckoutEnabled` para la organización
2. Agregá los orígenes de producción
3. Creá una clave `pk_live_…` y guardala en el gestor de secretos o variables de entorno
4. Configurá `apiBaseUrl` para producción
5. Consultá el estado del pago con autenticación; habilitá webhooks únicamente cuando su entrega esté activa para el piloto
6. Primero ejecutá una compra completa con un medio de pago real en modo de prueba
7. Confirmá que el retorno de Mercado Pago o Stripe llegue a tu `returnUrl`
8. Monitoreá los `requestId` y las consultas del estado de pago

Las guías de ReadMe y el OpenAPI están publicados. La publicación del SDK en npm sigue siendo un paso de lanzamiento separado.
